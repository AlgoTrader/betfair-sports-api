// (C) 2012 Anton Zemlyanov
//
// This module describes Betfair Global Service SOAP invocations
// see Sports API documentation on http://bdp.betfair.com
// 
// Exported properties:
//  newSession  - opens new Betfair Session

var util = require("util");
var events = require("events");
var betfairGlobalService = require("./betfair_global_service");

exports.newSession = newSession;

function newSession(login, password)
{
   return new BetfairSession(login, password);
}

function BetfairSession()
{
}
util.inherits(BetfairSession, events.EventEmitter);

