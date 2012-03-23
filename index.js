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

exports.openSession  = openSession;
exports.closeSession = closeSession;
exports.getSession   = getSession;

var betfairSession = require("./lib/betfair_session");
var openSessions = [];

function openSession(login, password)
{
    var session = betfairSession.newSession(login, password);
    openSessions.push(session);
    return session;
}

function closeSession(index)
{
    var session = openSessions[index];
    session.close();
    return;
}

function getSession(index)
{
    var session = openSessions[index];
    return session;
}
