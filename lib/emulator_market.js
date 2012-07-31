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
    self.machedBets = {};
    self.unmatchedBets = {};
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

EmulatorMarket.prototype.handlePlaceBets = function(req, res, cb) {
    var self = this;

    console.log('EMU: market handlePlaceBets');
    console.log('EMU:', req.request);

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

    // calculate delay, it consists of inplay delay (5 secs for tennis)
    // and Malta connection delay
    function placeBets() {
        var bets = [];
        for ( var i = 0; i < req.request.bets.length; ++i) {
            var desc = req.request.bets[i];
            var error = checkPlaceBetItem(self, desc);
            console.log('EMU bet', desc, "error", error);
            if (error)
                break;

            var bet = new EmulatorBet(desc.marketId, desc.delectionId, desc.betType,
                    desc.price, desc.size);
            bets.push(bet);
        }

        var resItem = {
            averagePriceMatched : '0.0',
            betId : '0',
            resultCode : error || 'OK',
            sizeMatched : '0.0',
            success : 'false'
        };

        // It is very strange, but Betfair returns 'OK' 
        // when bet size or price is invalid 
        res.response.errorCode = 'OK'; 
        if (error) {
            // send error bets, no bets placed
            res.response.betResults = [];
            for(var i=0; i<req.request.bets.length; ++i)
                res.response.betResults.push(resItem);
            
            cb(null,res);
        } else {
            // send valid bets
            // not yet done
            cb(null,res);
        }
    }

    var delay = 1 * self.inPlayDelay + 1 * transactionalDelay;
    setTimeout(placeBets, delay);
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
function checkUpdateBetItem(self, desc) {
    throw new Error('Not yet implemented');
}

function matchBetsUsingPrices(self) {
}

function matchBetsUsingTradedVolume(self) {
}

module.exports = EmulatorMarket;