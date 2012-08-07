// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" SOAP requests and sends "HTTP" SOAP responses

var util = require('util');
var betfairPrice = require('./betfair_price')

// All the bets getIds
var lastBetId = 10000000000;

function EmulatorBet(markId, selId, type, price, size) {
    var self = this;

    if (type !== 'B' && type !== 'L')
        throw new Error('Bet type should be B or L');

    var roundedPrice = betfairPrice.newBetfairPrice(1 * price);
    if (Math.abs(price - roundedPrice) > 0.000001)
        throw new Error('Bad price');

    // mandatory fields
    self.betId = ++lastBetId + ''; // force string
    self.marketId = markId;
    self.selectionId = selId
    self.betType = type;
    self.price = price;
    self.size = size; // unmatched size 

    // default suggestions
    self.asianLineId = "0";
    self.betCategoryType = "E";
    self.betPersistenceType = "NONE";
    self.bspLiability = "0";
    self.averagePriceMatched = "0.0";
    
    // matched portions
    self.matchedParts = [];
}

EmulatorBet.prototype.averagePrice = function() {
    var self = this;

    // weighted sum of prices of matched parts
    var matchedSize= self.matchedSize();
    var averagePrice = 0;
    self.matchedParts.forEach( function(item) {
        averagePrice += item.price * (item.size / matchedSize);
    });
    return averagePrice;
}

EmulatorBet.prototype.matchedSize = function() {
    var self = this;

    // sum of all matched portions
    var sum = 0;
    self.matchedParts.forEach( function(item) {
        sum += 1*item.size;
    });
    return sum;
}

EmulatorBet.prototype.unmatchedSize = function() {
    var self = this;
    
    // just size
    return self.size;
}

// cancelBets, just cancel unmatched portion
EmulatorBet.prototype.cancel = function() {
    var self = this;
    
    var desc = {
        code : 'REMAINING_CANCELLED',
        sizeCancelled : self.size,
        sizeMatched : self.matchedSize,
        success : 'true'
    };
    self.size = 0;
    
    return desc;
}

// updateBets, reduce bet size
EmulatorBet.prototype.reduceSize = function(size) {
    var self = this;
}

// updateBets, change persistence type
EmulatorBet.prototype.reduceSize = function(size) {
    var self = this;
}

module.exports = EmulatorBet;
