// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" SOAP requests and sends "HTTP" SOAP responses

var util = require('util');
var EmulatorBet = require('./emulator_bet.js');

// Correction delays, transactional delay includes Malta roundtrip
var transactionalDelay = 50;
var readonlyDelay = 10;

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
    
    if(result.errorCode!=='OK') {
        if(result.errorCode==='EVENT_SUSPENDED')
            self.marketStatus = 'SUSPENDED';
        else if(result.errorCode==='EVENT_CLOSED')
            self.marketStatus = 'CLOSED';
        else if(result.errorCode==='EVENT_INACTIVE')
            self.marketStatus = 'INACTIVE';
        return false;
    }
    
    // Do matching of unmatched bets
    var prices = result.completeMarketPrices;
    if(!prices)
        return false;
    
    // there is no marketStatus in getCompleteMarketPricesCompressed!
    self.inPlayDelay = prices.inPlayDelay;
    self.marketStatus = 'ACTIVE'; // guess, errorCode==OK means market is ACTIVE
    for(var runnerIndex in prices.runners) {
        var runner = prices.runners[runnerIndex];
        var selectionId = runner.selectionId;
        var selectionPrices = runner.prices;
        
        var bestLay = { price: null, amount: null };
        var bestBack = { price: null, amount: null };
        for(var index in selectionPrices) {
            var price = 1*selectionPrices[index].price;
            var backAmount = 1*selectionPrices[index].backAmount;
            var layAmount = 1*selectionPrices[index].layAmount;
            if(backAmount && (bestBack.price==null || price > bestBack.price)) {
                bestBack.price = price;
                bestBack.amount = backAmount;
            }
            if(layAmount && (bestLay.price==null || price < bestLay.price)) {
                bestLay.price = price;
                bestLay.amount = layAmount;
            }
        }
        
        self.players[selectionId] = self.players[selectionId] || {};
        self.players[selectionId].selectionId = selectionId;
        self.players[selectionId].bestLay = bestLay;
        self.players[selectionId].bestBack = bestBack;
    }
    console.log('EMU: players=',self.players);
    matchBetsUsingPrices(self);
}

EmulatorMarket.prototype.onGetMarketPricesCompressed = function(result) {
    var self = this;
    
    console.log("EMU: onGetMarketPricesCompressed");

    if(result.errorCode!=='OK')
        return false;

    // Do matching of unmatched bets
    matchBetsUsingPrices(self);
}

EmulatorMarket.prototype.onGetMarketTradedVolumeCompressed = function(result) {
    var self = this;

    console.log("EMU: onGetMarketTradedVolumeCompressed");
    
    if(result.errorCode!=='OK')
        return false;

}

EmulatorMarket.prototype.handlePlaceBets = function(req, res, cb) {
    var self = this;
    
    console.log('EMU: market handlePlaceBets');
    console.log('EMU:', req.request);

    // handle market status, only 'ACTIVE' allows placing bets
    if(self.marketStatus==='SUSPENDED') {
        res.response.errorCode = 'EVENT_SUSPENDED';
        setTimeout(cb, readonlyDelay, null, res);
        return;
    } else if(self.marketStatus==='CLOSED') {
        res.response.errorCode = 'EVENT_CLOSED';
        setTimeout(cb, readonlyDelay, null, res);
        return;
    } else if(self.marketStatus!=='ACTIVE') {
        res.response.errorCode = 'EVENT_INACTIVE';
        setTimeout(cb, readonlyDelay, null, res);
        return;
    }
    
    // BETWEEN_1_AND_60_BETS_REQUIRED - number of bets to be placed
    var betsCount = req.request.bets.length;
    if( betsCount<1 || betsCount>60 ) {
        res.response.errorCode = 'BETWEEN_1_AND_60_BETS_REQUIRED';
        setTimeout(cb, readonlyDelay, null, res);
    }
    
    // BACK_LAY_COMBINATION - invalid prices
    var playerPrices = {};
    req.request.bets.forEach( function(item) {
        if(!playerPrices[item.selectionId])
            playerPrices[item.selectionId] = {};
        var pl = playerPrices[item.selectionId];
        // Lay
        if(item.betType==='L' && (!pl.maxLayPrice || (1*item.price)>(1*pl.maxLayPrice)))
            pl.maxLayPrice = 1*item.price;
        // Back
        if(item.betType==='B' && (!pl.minBackPrice || (1*item.price)<(1*pl.minBackPrice)))
            pl.minBackPrice = 1*item.price;
    });
    console.log("playerPrices",playerPrices);
    for(var sId in playerPrices) {
        var pl = playerPrices[sId];
        if( 1*pl.minBackPrice <= 1*pl.maxLayPrice ) {
            res.response.errorCode = 'BACK_LAY_COMBINATION';
            setTimeout(cb, readonlyDelay, null, res);
            return;
        }
    }
    
    // calculate delay, it consists of inplay delay (5 secs for tennis)
    // and Malta connection delay
    var delay = 1*self.inPlayDelay + 1*transactionalDelay;
    for(var i=0; i<req.request.bets.length; ++i) {
        var betDesc = req.request.bets[i];
        console.log('EMU bet', betDesc);
    }
    setTimeout(cb, transactionalDelay, null, res);
}

function matchBetsUsingPrices(self) {
}

function matchBetsUsingTradedVolume(self) {
}

module.exports = EmulatorMarket;