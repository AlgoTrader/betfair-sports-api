// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" SOAP requests and sends "HTTP" SOAP responses

var util = require('util');
var EmulatorBet = require('./emulator_bet.js');

function EmulatorMarket(marketId) {
    var self = this;
    self.marketId = marketId;
    self.players = {};
    self.machedBets = {};
    self.unmatchedBets = {};
}

EmulatorMarket.prototype.onGetCompleteMarketPricesCompressed = function(result) {
    var self = this;
    
    if(result.errorCode!=='OK')
        return false;
    
    // Do matching of unmatched bets
    var prices = result.completeMarketPrices;
    if(!prices)
        return false;
    
    self.inPlayDelay = prices.inPlayDelay;
    for(var runner in prices.runners) {
        var selectionId = runner.selectionId;
        var selectionPrices = runner.prices;
        
        var lay = {bestPrice: '0', amount: '0' };
        var back = {bestPrice: '0', amount: '0' };
        for(var index in selectionPrices) {
            ;
        }
        
        self.players[selectionId] = self.players[selectionId] || {};
        self.players[selectionId].lay = lay;
        self.players[selectionId].back = back;
    }
    
    console.log("EMU: onGetCompleteMarketPricesCompressed");
}

EmulatorMarket.prototype.onGetMarketPricesCompressed = function(result) {
    var self = this;
    
    if(result.errorCode!=='OK')
        return false;

    // Do matching of unmatched bets
    console.log("EMU: onGetMarketPricesCompressed");
}

EmulatorMarket.prototype.onGetMarketTradedVolumeCompressed = function(result) {
    var self = this;
    if(result.errorCode!=='OK')
        return false;

    console.log("EMU: onGetMarketTradedVolumeCompressed");
}

module.exports = EmulatorMarket;