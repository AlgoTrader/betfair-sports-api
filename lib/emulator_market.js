// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" SOAP requests and sends "HTTP" SOAP responses

var util = require('util');
var EmulatorBet = require('./emulator_bet.js');
var betfairPrice = require('./betfair_price.js')

// Correction delays, transactional delay includes Malta roundtrip
var transactionalDelay = 80;
var readonlyDelay = 20;

var minimumBetSize = 4.0; // USD
var maximumBetSize = 10000.0; // USD

function EmulatorMarket(marketId) {
    var self = this;
    self.marketId = marketId;
    self.marketStatus = 'INVALID';
    self.players = {};
    self.bets = {};
}

EmulatorMarket.prototype.allBetsAreMine = function(betIds) {
    var self = this;

    if (!util.isArray(betIds))
        return false;
    if (betIds.length == 0)
        return false;

    for ( var i = 0; i < betIds.length; ++i) {
        var betId = betIds[i];
        if (!self.bets[betId])
            // at least one bet is not mine
            return false;
    }

    // all bets are mine
    return true;
}

EmulatorMarket.prototype.onGetCompleteMarketPricesCompressed = function(result) {
    var self = this;

    console.log("EMU: onGetCompleteMarketPricesCompressed");

    if (result.errorCode !== 'OK') {
        if (result.errorCode === 'EVENT_SUSPENDED')
            self.marketStatus = 'SUSPENDED';
        else if (result.errorCode === 'EVENT_CLOSED')
            self.marketStatus = 'CLOSED';
        else if (result.errorCode === 'EVENT_INACTIVE')
            self.marketStatus = 'INACTIVE';
        return false;
    }

    // Do matching of unmatched bets
    var prices = result.completeMarketPrices;
    if (!prices)
        return false;

    // there is no marketStatus in getCompleteMarketPricesCompressed!
    self.inPlayDelay = prices.inPlayDelay;
    self.marketStatus = 'ACTIVE'; // guess, errorCode==OK means market is
    // ACTIVE
    for ( var runnerIndex in prices.runners) {
        var runner = prices.runners[runnerIndex];
        var selectionId = runner.selectionId;
        var selectionPrices = runner.prices;

        var bestLay = {
            price : null,
            amount : null
        };
        var bestBack = {
            price : null,
            amount : null
        };

        for ( var index in selectionPrices) {
            var price = 1 * selectionPrices[index].price;
            var backAmount = 1 * selectionPrices[index].backAmount;
            var layAmount = 1 * selectionPrices[index].layAmount;
            if (backAmount && (bestBack.price == null || price > bestBack.price)) {
                bestBack.price = price;
                bestBack.amount = backAmount;
            }
            if (layAmount && (bestLay.price == null || price < bestLay.price)) {
                bestLay.price = price;
                bestLay.amount = layAmount;
            }
        }

        self.players[selectionId] = self.players[selectionId] || {};
        self.players[selectionId].selectionId = selectionId;
        self.players[selectionId].bestLay = bestLay;
        self.players[selectionId].bestBack = bestBack;
    }
    console.log('EMU: players=', self.players);
    matchBetsUsingPrices(self, self.bets);
}

EmulatorMarket.prototype.onGetMarketPricesCompressed = function(result) {
    var self = this;

    console.log("EMU: onGetMarketPricesCompressed");

    if (result.errorCode !== 'OK')
        return false;

    // Do matching of unmatched bets
    matchBetsUsingPrices(self, self.bets);
}

EmulatorMarket.prototype.onGetMarketTradedVolumeCompressed = function(result) {
    var self = this;

    console.log("EMU: onGetMarketTradedVolumeCompressed");

    if (result.errorCode !== 'OK')
        return false;

}

EmulatorMarket.prototype.handleGetMUBets = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handleGetMUBets', req.request);

    function itemTemplate(bet) {
        return {
            asianLineId : bet.asianLineId,
            betCategoryType : bet.betCategoryType,
            betId : bet.betId,
            betPersistenceType : bet.betPersistenceType,
            betStatus : '',
            betType : bet.betType,
            bspLiability : bet.bspLiability,
            handicap : '0.0',
            marketId : bet.marketId,
            matchedDate : null,
            placedDate : bet.placedDate,
            price : bet.price,
            selectionId : bet.selectionId,
            size : '0.0',
            transactionId : 0
        };
    }

    // generate MU bets list
    var statusToOutput = req.request.betStatus;
    var bets = [];
    for ( var i in self.bets) {
        var bet = self.bets[i];
        if (statusToOutput == "U" || statusToOutput == "MU") {
            // unmatched
            var unmatched = itemTemplate(bet);
            unmatched.betStatus = "U";
            unmatched.price = bet.price;
            unmatched.size = bet.unmatchedSize();
            console.log("matched=", bet.isMatched());
            if (!bet.cancelled && !bet.isMatched())
                bets.push(unmatched);
        }
        if (statusToOutput == "M" || statusToOutput == "MU") {
            // matched
            console.log("matched parts, sz=", bet.matchedParts.length);
            for (j = 0; j < bet.matchedParts.length; ++j) {
                var part = bet.matchedParts[j];
                var matched = itemTemplate(bet);
                matched.betStatus = "M";
                matched.price = part.price;
                matched.size = part.size;
                matched.matchedDate = part.matchedDate;
                bets.push(matched);
            }
        }
    }

    // slice if needed

    // sort if needed

    // done
    if (bets.length > 0) {
        res.response.errorCode = "OK";
        res.response.bets = bets;
    }
    setTimeout(cb, readonlyDelay, null, res);
}

EmulatorMarket.prototype.handleGetCurrentBets = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handleGetCurrentBets', req.request);
    
    function itemTemplate(bet) {
        var date = new Date(0,0,1);
        return {
            asianLineId: bet.asianLineId,
            avgPrice: bet.averageMatchedPrice(),
            betId: bet.betId,
            betStatus: bet.betStatus,
            betType: bet.betType,
            betCategoryType: "E",
            betPersistenceType: bet.betPersistenceType,
            cancelledDate: date,
            lapsedDate: date,
            marketId: bet.marketId,
            marketName: "N/A",
            fullMarketName: "N/A",
            marketType: "O",
            matchedDate: date,
            matchedSize: bet.matchedSize(),
            matches: null,
            placedDate: bet.placedDate,
            bspLiability: bet.bspLiability,
            price: bet.price,
            profitAndLoss: 0,
            selectionId: bet.selectionId,
            selectionName: "N/A",
            settledDate: date,
            remainingSize: bet.unmatchedSize(),
            requestedSize: bet.unmatchedSize(),
            voidedDate: date,
            executedBy: "UNKNOWN",
            handicap: 0,
            marketTypeVariant: "D"
        }
    }

    // generate MU bets list
    var statusToOutput = req.request.betStatus;
    var bets = [];
    for ( var i in self.bets) {
        var bet = self.bets[i];
        if (statusToOutput == "U" ) {
            // unmatched
            var unmatched = itemTemplate(bet);
            unmatched.betStatus = "U";
            unmatched.price = bet.price;
            unmatched.size = bet.unmatchedSize();
            if (!bet.cancelled && !bet.isMatched())
                bets.push(unmatched);
        } else if (statusToOutput == "M" ) {
            // matched
            var matched = itemTemplate(bet);
            matched.betStatus = "M";
            matched.price = bet.averageMatchedPrice();
            matched.size = bet.matchedSize();
            if(bet.matchedSize()>0)
                bets.push(matched);
        }
    }

    // done
    if (bets.length > 0) {
        res.response.errorCode = "OK";
        res.response.bets = bets;
    }
    setTimeout(cb, readonlyDelay, null, res);
}

EmulatorMarket.prototype.handleGetMarketProfitAndLoss = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handleGetMarketProfitAndLoss', req.request);

    function itemTemplate(player) {
        return {
            futureIfWin : '0.0',
            ifWin : player.ifWin,
            selectionId : player.selectionId,
            selectionName : 'SelectionName',
            worstCaseIfWin : '0.0',
            ifLoss : player.ifLoss
        };
    }

    for ( var i in self.players) {
        self.players[i].ifWin = 0;
        self.players[i].ifLoss = 0;
    }

    // calculate ifWin/ifLoss
    for ( var i in self.bets) {
        var bet = self.bets[i];
        var player = self.players[bet.selectionId];
        // matched
        var selId = bet.selectionId;
        var matAvgPrice = bet.averageMatchedPrice();
        var matSize = bet.matchedSize();
        var sign = (bet.betType==='L' ? -1 : 1);

        for(var sId in self.players) {
            var pl = self.players[sId]
            if(sId===selId) {
                pl.ifWin += sign * matSize * (matAvgPrice - 1);
                pl.ifLoss -= sign * matSize;
            } else {
                pl.ifWin -= sign * matSize;
                pl.ifLoss += sign *matSize * (matAvgPrice - 1);
            }
        }
    }

    // response
    res.response.annotations = [];
    for ( var i in self.players) {
        res.response.annotations.push(itemTemplate(self.players[i]));
    }
    res.response.errorCode = "OK";
    setTimeout(cb, readonlyDelay, null, res);
}

EmulatorMarket.prototype.handlePlaceBets = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handlePlaceBets', req.request);

    // handle market status, only 'ACTIVE' allows placing bets
    if (self.marketStatus === 'SUSPENDED') {
        res.response.errorCode = 'EVENT_SUSPENDED';
        setTimeout(cb, readonlyDelay, null, res);
        return;
    } else if (self.marketStatus === 'CLOSED') {
        res.response.errorCode = 'EVENT_CLOSED';
        setTimeout(cb, readonlyDelay, null, res);
        return;
    } else if (self.marketStatus !== 'ACTIVE') {
        res.response.errorCode = 'EVENT_INACTIVE';
        setTimeout(cb, readonlyDelay, null, res);
        return;
    }

    // BETWEEN_1_AND_60_BETS_REQUIRED - number of bets to be placed
    var betsCount = req.request.bets.length;
    if (betsCount < 1 || betsCount > 60) {
        res.response.errorCode = 'BETWEEN_1_AND_60_BETS_REQUIRED';
        setTimeout(cb, readonlyDelay, null, res);
    }

    // BACK_LAY_COMBINATION - invalid prices
    var playerPrices = {};
    req.request.bets.forEach(function(item) {
        if (!playerPrices[item.selectionId])
            playerPrices[item.selectionId] = {};
        var pl = playerPrices[item.selectionId];
        // Lay
        if (item.betType === 'L'
                && (!pl.maxLayPrice || (1 * item.price) > (1 * pl.maxLayPrice)))
            pl.maxLayPrice = 1 * item.price;
        // Back
        if (item.betType === 'B'
                && (!pl.minBackPrice || (1 * item.price) < (1 * pl.minBackPrice)))
            pl.minBackPrice = 1 * item.price;
    });
    console.log("playerPrices", playerPrices);
    for ( var sId in playerPrices) {
        var pl = playerPrices[sId];
        if (1 * pl.minBackPrice <= 1 * pl.maxLayPrice) {
            res.response.errorCode = 'BACK_LAY_COMBINATION';
            setTimeout(cb, readonlyDelay, null, res);
            return;
        }
    }

    // place bets, the function is delayed to simulate slow network
    function placeBets() {
        // check input bets list
        var error;
        for ( var i = 0; i < req.request.bets.length; ++i) {
            var desc = req.request.bets[i];
            error = checkPlaceBetItem(self, desc);
            // console.log('EMU bet', desc, "error", error);
            if (error)
                break;
        }

        // It is very strange, but Betfair returns 'OK'
        // when bet size or price is invalid
        res.response.errorCode = 'OK';
        res.response.betResults = [];
        if (error) {
            // Prepare response, no bets placed
            for ( var i = 0; i < req.request.bets.length; ++i) {
                var resItem = {
                    averagePriceMatched : '0.0',
                    betId : '0',
                    resultCode : error,
                    sizeMatched : '0.0',
                    success : 'false'
                };
                res.response.betResults.push(resItem);
            }
            cb(null, res);
            return;
        }

        // Create bets
        var betIds = [];
        for ( var i = 0; i < req.request.bets.length; ++i) {
            var desc = req.request.bets[i];
            var bet = new EmulatorBet(desc.marketId, desc.selectionId, desc.betType,
                    desc.price, desc.size);
            betIds.push(bet.betId);
            self.bets[bet.betId] = bet;
        }

        // Try to match bets using price matching
        var bets = betIds.map(function(id) {
            return self.bets[id];
        });
        matchBetsUsingPrices(self, bets);

        // Prepare response
        for ( var id in betIds) {
            var betId = betIds[id];
            var bet = self.bets[betId];
            var resItem = {
                averagePriceMatched : bet.averageMatchedPrice(),
                betId : bet.betId,
                resultCode : 'OK',
                sizeMatched : bet.matchedSize(),
                success : 'true'
            };

            res.response.betResults.push(resItem);
        }

        // placeBets was OK
        cb(null, res);
    }

    // calculate delay, it consists of inplay delay (5 secs for tennis)
    // and Malta connection delay
    var delay = 1 * self.inPlayDelay + 1 * transactionalDelay;
    setTimeout(placeBets, delay);
}

EmulatorMarket.prototype.handleUpdateBets = function(req, res, cb) {
    var self = this;
}

EmulatorMarket.prototype.handleCancelBets = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handleCancelBets', req.request);

    // handle market status, only 'ACTIVE' allows placing bets
    if (self.marketStatus !== 'ACTIVE') {
        res.response.errorCode = 'MARKET_STATUS_INVALID';
        setTimeout(cb, readonlyDelay, null, res);
        return;
    }

    // INVALID_NUMER_OF_CANCELLATIONS - number of bets to be canceled
    var betsCount = req.request.bets.length;
    if (betsCount < 1 || betsCount > 40) {
        res.response.errorCode = 'INVALID_NUMER_OF_CANCELLATIONS';
        setTimeout(cb, readonlyDelay, null, res);
    }

    // cancel bets, the function is delayed to simulate slow network
    function cancelBets() {
        // check request bets list
        var error;
        for ( var i = 0; i < req.request.bets.length; ++i) {
            var desc = req.request.bets[i];
            error = checkCancelBetItem(self, desc);
            // console.log('EMU bet', desc, "error", error);
            if (error)
                break;
        }
        if (error) {
            res.response.errorCode = 'MARKET_IDS_DONT_MATCH';
            cb(null, res);
            return;
        }

        // cancel bets
        res.response.errorCode = 'OK';
        res.response.betResults = [];
        for ( var i = 0; i < req.request.bets.length; ++i) {
            var betId = req.request.bets[i].betId;
            console.log('EMU: cancel id=', betId);
            var bet = self.bets[betId];

            // do cancel work
            var result = bet.cancel();

            var resItem = {
                betId : bet.betId,
                resultCode : result.code,
                sizeCancelled : result.sizeCancelled,
                sizeMatched : result.sizeMatched,
                success : result.success
            };

            res.response.betResults.push(resItem);
        }

        // cancelBets was OK
        cb(null, res);
    }

    // calculate delay (my cause Malta roundtrip delay)
    var delay = 1 * transactionalDelay;
    setTimeout(cancelBets, delay);
}

// Check a single bet item from placeBets bets list
function checkPlaceBetItem(self, desc) {
    if (desc.asianLineId !== '0' || desc.betCategoryType !== 'E')
        return 'UNKNOWN_ERROR';

    if (desc.betPersistenceType !== 'NONE' && desc.betPersistenceType !== 'IP')
        return 'INVALID_PERSISTENCE';

    if (desc.betType !== 'B' && desc.betType !== 'L')
        return 'INVALID_BET_TYPE';

    if (desc.bspLiability !== '0')
        return 'BSP_BETTING_NOT_ALLOWED';

    var price = betfairPrice.newBetfairPrice(desc.price);
    if (Math.abs(price.size - 1 * desc.price) > 0.0001)
        return 'INVALID_PRICE';

    if (!self.players[desc.selectionId])
        return 'SELECTION_REMOVED';

    if (1 * desc.size < minimumBetSize || 1 * desc.size > maximumBetSize)
        return 'INVALID_SIZE';

    // no checks failed, then bet is OK
    return null;
}

// Check a single bet item from updateBets bets list
function checkUpdateBetItem(self, desc) {
    throw new Error('Not yet implemented');
}

// Check a single bet item from cancelBets bets list
function checkCancelBetItem(self, desc) {
    // check betId is mine
    if (!self.bets[desc.betId]) {
        // MARKET_IDS_DONT_MATCH - Bet ID does not exist
        return 'MARKET_IDS_DONT_MATCH';
    }

    return null;
}

function matchBetsUsingPrices(self, betlist) {
    betlist = betlist || [];
    for ( var i = 0; i < betlist.length; ++i) {
        var bet = betlist[i];
        var player = self.players[bet.selectionId];
        console.log("EMU: betId=%d selId=%s type=%s", bet.betId, bet.selectionId,
                bet.betType);
        console.log('EMU: best back=%j lay=%j', player.bestBack, player.bestLay);
        if (bet.betType === 'B') {
            var bestBackPrice = player.bestBack.price;
            var bestBackSize = player.bestBack.amount;
            if (1 * bestBackPrice > 1 * bet.price) {
                bet.matchWhole(bestBackPrice);
            } else if ((Math.abs(bestBackPrice - bet.price) < 0.0001)
                    && (1 * bestBackSize > 1 * bet.size)) {
                bet.matchWhole(bestBackPrice);
            }
        } else if (bet.betType === 'L') {
            var bestLayPrice = player.bestLay.price;
            var bestLaySize = player.bestLay.amount;
            if (1 * bestLayPrice < 1 * bet.price) {
                bet.matchWhole(bestLayPrice);
            } else if ((Math.abs(bestLayPrice - bet.price) < 0.0001)
                    && (1 * bestLaySize > 1 * bet.size)) {
                bet.matchWhole(bestLayPrice);
            }
        }
        console.log("EMU: matched size=", bet.matchedSize());
    } // for
}

function matchBetsUsingTradedVolume(self, betlist) {
}

module.exports = EmulatorMarket;