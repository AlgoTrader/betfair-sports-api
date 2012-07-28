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
    self.players = {};
    self.machedBets = {};
    self.unmatchedBets = {};
}

EmulatorMarket.prototype.onGetCompleteMarketPricesCompressed = function(result) {
    var self = this;
    
    console.log("EMU: onGetCompleteMarketPricesCompressed");
    
    if(result.errorCode!=='OK')
        return false;
    
    // Do matching of unmatched bets
    var prices = result.completeMarketPrices;
    if(!prices)
        return false;
    
    self.inPlayDelay = prices.inPlayDelay;
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

function matchBetsUsingPrices(self) {
}

function matchBetsUsingTradedVolume(self) {
}

module.exports = EmulatorMarket;