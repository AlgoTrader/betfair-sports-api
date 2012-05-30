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
exports.isBetEmulationEnabled = betfairInvocation.isBetEmulationEnabled;
exports.setBetEmulationEnabled = betfairInvocation.setBetEmulationEnabled;
exports.setXmlLoggingEnabled = betfairInvocation.setXmlLoggingEnabled;

var betfairInvocationHistory = require('./lib/betfair_invocation_history');
exports.getInvocationHistory = betfairInvocationHistory.getInvocationHistory;


