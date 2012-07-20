// (C) 2012 Anton Zemlyanov
//
// Betfair Sports API for node
// see Sports API documentation on http://bdp.betfair.com
//
// Exported properties:
//   newSession  - create Betfair Session

var betfairSession = require('./lib/betfair_session');
exports.newSession  = betfairSession.newSession;

var betfairDecompress = require('./lib/betfair_decompress');
exports.addDesirableMarketName  = betfairDecompress.addDesirableMarketName;

var betfairPrice = require('./lib/betfair_price');
exports.newBetfairPrice = betfairPrice.newBetfairPrice;

var betfairInvocation = require('./lib/betfair_invocation');
exports.newInvocation = betfairInvocation.newInvocation;
exports.isBetEmulationEnabled = function () {
    return betfairInvocation.isBetEmulationMode;
}
exports.setBetEmulationEnabled = function(flag) {
    betfairInvocation.isbetEmulationMode = flag;
}
exports.setXmlLoggingEnabled = function(flag) {
    betfairInvocation.isXmlLoggingEnabled = flag;
}

var betfairInvocationHistory = require('./lib/betfair_invocation_history');
exports.getInvocationHistory = betfairInvocationHistory.getInvocationHistory;


