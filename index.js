// (C) 2012 Anton Zemlyanov
//
// Betfair Sports API for node
// see Sports API documentation on http://bdp.betfair.com
//
// Exported properties:
//   newSession  - create Betfair Session

var betfairSession = require('./lib/betfair_session');
exports.newSession  = betfairSession.newSession;

var betfairInvocation = require('./lib/betfair_invocation');
exports.isBetEmulationEnabled = betfairInvocation.isBetEmulationEnabled;
exports.setBetEmulationEnabled = betfairInvocation.setBetEmulationEnabled;
exports.setXmlLoggingEnabled = betfairInvocation.setXmlLoggingEnabled;

var betfairInvocationHistory = require('./lib/betfair_invocation_history');
exports.getInvocationHistory = betfairInvocationHistory.getInvocationHistory;

var betfairPrice = require('./lib/betfair_price');
exports.BetfairPrice = betfairPrice.BetfairPrice;

