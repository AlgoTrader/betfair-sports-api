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


function BetfairSession(login, password)
{
    var self = this;
    this.loginName = login;
    this.password = password;
    
    this.login(this.loginName, this.password, function onLoginResult(inv) {
        //console.log(inv.isSuccess());
        if(inv.isSuccess() && inv.result.errorCode==="OK")
        {
            self.sessionToken = inv.result.sessionToken;
            self.emit("loggedIn");
        }
        else
        {
            self.sessionToken = "";
            self.emit("error");
        }
    });
}
util.inherits(BetfairSession, events.EventEmitter);

BetfairSession.prototype.login= function(log, password, cb)
{
var loginRequest = {
    locationId : "0",
    password : password,
    productId : "82",
    username : log,
    vendorSoftwareId : "0"
    };

    var login = betfairGlobalService.login(loginRequest);
    login.execute(function(resp) { cb(login); });
}


