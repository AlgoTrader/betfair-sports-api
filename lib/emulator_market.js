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
    self.machedBets = {};
    self.unmatchedBets = {};
}

EmulatorMarket.prototype.onGetCompleteMarketPricesCompressed = function(result) {
    if(result.errorCode!=='OK')
        return false;
}

EmulatorMarket.prototype.onGetMarketPricesCompressed = function(result) {
    if(result.errorCode!=='OK')
        return false;
}

EmulatorMarket.prototype.onGetMarketTradedVolumeCompressed = function(result) {
    if(result.errorCode!=='OK')
        return false;
}