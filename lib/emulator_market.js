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
var transactionalDelay = 50;
var readonlyDelay = 10;

var minimumBetSize = 4.0; // USD
var maximumBetSize = 1000.0; // USD

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
        //var prices = {};
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
            //prices[price] = {};
            //prices[price].price = price;
            //prices[price].backAmount = price;
            //prices[price].price = price;
        }

        self.players[selectionId] = self.players[selectionId] || {};
        self.players[selectionId].selectionId = selectionId;
        self.players[selectionId].bestLay = bestLay;
        self.players[selectionId].bestBack = bestBack;
    }
    console.log('EMU: players=', self.players);
    matchBetsUsingPrices(self);
}

EmulatorMarket.prototype.onGetMarketPricesCompressed = function(result) {
    var self = this;

    console.log("EMU: onGetMarketPricesCompressed");

    if (result.errorCode !== 'OK')
        return false;

    // Do matching of unmatched bets
    matchBetsUsingPrices(self);
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
        asianLineId: bet.asianLineId,
        betCategoryType: bet.betCategoryType,
        betId: bet.betId,
        betPersistenceType: bet.betPersistenceType,
        betStatus: '',
        betType: bet.type,
        bspLiability: bet.bspLiability,
        handicap: '0.0',
        marketId: bet.marketId,
        matchedDate: null,
        placedDate: bet.placedDate,
        price: bet.price,
        selectionId: bet.selectionId,
        size: '0.0',
        transactionId: 0       
        };
    }
        
    // generate MU bets list
    var statusToOutput = req.request.betStatus;
    var bets = [];
    for(var i=0; i<self.bets.length; ++i) {
        var bet = self.bets[i];
        if(statusToOutput=="U" || statusToOutput=="MU") {
            // unmatched
            var unmatched = itemTemplate(bet);
            unmatched.betStatus = "U";
            unmatched.price = bet.price;
            unmatched.size = bet.unmatchedSize();
            bets.push(unmatched)
        } else if(statusToOutput=="U" || statusToOutput=="MU") {
            // matched
            for(j=0; j<bet.parts.length; ++j) {
                var matched = itemTemplate(bet);
                matched.betStatus = "M";
                matched.price = bet.price;
                matched.size = bet.unmatchedSize();
                matched.matchedDate = bet.matchedDate;
                bets.push(unmatched)
            }
        }
    }
    
    // slice if needed
    
    // sort if needed
    
    // done
    setTimeout(cb, readonlyDelay, null, res);
}

EmulatorMarket.prototype.handleGetCurrentBets = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handleGetCurrentBets', req.request);

    throw new Error('Not yet supported');
}

EmulatorMarket.prototype.handleGetMarketProfitAndLoss = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handleGetMarketProfitAndLoss', req.request);

    throw new Error('Not yet supported');
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
            //console.log('EMU bet', desc, "error", error);
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
        matchBetsUsingPrices(self);

        // Prepare response
        for ( var id in betIds) {
            var betId = betIds[id];
            var bet = self.bets[betId];
            var resItem = {
                averagePriceMatched : bet.averageMatchedPrice(),
                betId : bet.betId,
                resultCode : 'OK',
                sizeMatched : '0.0',
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
            //console.log('EMU bet', desc, "error", error);
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

function matchBetsUsingPrices(self) {
}

function matchBetsUsingTradedVolume(self) {
}

module.exports = EmulatorMarket;