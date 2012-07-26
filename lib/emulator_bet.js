// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" SOAP requests and sends "HTTP" SOAP responses

var util = require('util');
var betfairPrice = require('./betfair_price')

//All the bets getIds
var lastBetId = 10000000000;

function EmulatorBet(markId, selId, type, price, size) {
    var self = this;
    
    if(type!=='B' && type!=='L')
        throw new Error('Bet type should be B or L');
    
    var roundedPrice = betfairPrice.newBetfairPrice(1*price);
    if( Math.abs(price - roundedPrice)>0.000001 )
        throw new Error('Bad price');
    
    self.betId = ++lastBetId;
    self.marketId = markId;
    self.selectionId = selId
    self.price = price;
    self.size  = size;
}

module.exports = EmulatorBet;
