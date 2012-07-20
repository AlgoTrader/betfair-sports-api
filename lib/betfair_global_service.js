// (C) 2012 Anton Zemlyanov
//
// This module describes Betfair Global Service SOAP invocations
// see Sports API documentation on http://bdp.betfair.com
// 
// The global services are used to log in and out, administer your Betfair account and funds, 
// and to navigate to the sports events you want to bet on.
//
// Exported properties:
//   login      - login to Betfair Sports exchanges
//   logout     - logout from Betfair Sports exchanges
//   keepAlive  - keep the API session alive

var betfairInvocation = require("./betfair_invocation.js");

// Betfair login invocation
exports.login = function(request) {
    return betfairInvocation.invocation("global", "login", request);
}

exports.logout = function(request) {
    return betfairInvocation.invocation("global", "logout", request);
}

exports.keepAlive = function(request) {
    return betfairInvocation.invocation("global", "keepAlive", request);
}
