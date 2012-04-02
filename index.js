// (C) 2012 Anton Zemlyanov
//
// Betfair Sports API for node
// see Sports API documentation on http://bdp.betfair.com
// 
//
// Exported properties:
//   openSession  - opens Betfair Session
//   closeSession - close Betfair Session
//   getSession   - get Betfair Session

var betfairSession = require("./lib/betfair_session");
exports.newSession  = betfairSession.newSession;

