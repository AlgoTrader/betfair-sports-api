// (C) 2012 Anton Zemlyanov
//
// This module describes Betfair Global Service SOAP invocations
// see Sports API documentation on http://bdp.betfair.com
// 
// Exported properties:
//  newSession  - opens new Betfair Session

//var util = require("util");
//var events = require("events");
var betfairGlobalService = require("./betfair_global_service");

exports.newSession = newSession;

function newSession(login, password) {
	return new BetfairSession(login, password);
}

function BetfairSession(login, password) {
	var self = this;
	this.loginName = login;
	this.password = password;
}

// Open current session
BetfairSession.prototype.open = function(cb) {
    var self = this;
    console.log('invoking login');
    var login = this.login(this.loginName, this.password);
    login.execute( function (err,inv) {
        if (err) {
            cb(err, inv);
            return;
        }
        var sessionToken = inv.result.header.sessionToken;
        console.log("session token:", sessionToken);
        self.header = {
            clientStamp : "0",
            sessionToken : sessionToken
        };
        cb(null,inv);
    });
}

// Close current session
BetfairSession.prototype.close = function(cb) {
	var self = this;
	this.logout(function onLogoutResult(err,inv) {
        if (err) {
            cb(err, inv);
            return;
        }
        self.header = undefined;
        cb(null,inv);
	});
}

// login invocation
BetfairSession.prototype.login = function(log, password) {
	var request = {
		locationId : "0",
		password : password,
		productId : "82",
		username : log,
		vendorSoftwareId : "0"
	};

	return betfairGlobalService.login(request);
}

// logout invocation
BetfairSession.prototype.logout = function(cb) {
	var request = {
		header : this.header
	};

	return betfairGlobalService.logout(request);
}

// keepAlive invocation
BetfairSession.prototype.keepAlive = function(cb) {
	var request = {
		header : this.header
	};

	return betfairGlobalService.keepAlive(request);
}
