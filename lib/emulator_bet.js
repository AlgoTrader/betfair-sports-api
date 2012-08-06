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
    self.size = size;

    // default suggestions
    self.asianLineId = "0";
    self.betCategoryType = "E";
    self.betPersistenceType = "NONE";
    self.bspLiability = "0";
    self.averagePriceMatched = "0.0";
}

// cancelBets, just cancel
EmulatorBet.prototype.cancel = function() {
    var self = this;
    return {
        code : 'REMAINING_CANCELLED',
        sizeCancelled : '0.0',
        sizeMatched : '0.0',
        success : 'true'
    };
}

// updateBets, reduce bet size
EmulatorBet.prototype.reduceSize = function(size) {
    var self = this;
}

module.exports = EmulatorBet;
