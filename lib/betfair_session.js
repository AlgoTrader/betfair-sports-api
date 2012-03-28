//(C) 2012 Anton Zemlyanov

//This module describes Betfair Global Service SOAP invocations
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//newSession  - opens new Betfair Session

//var util = require("util");
//var events = require("events");
var globalService = require("./betfair_global_service");
var exchangeService = require("./betfair_exchange_service");

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
    var login = this.login(this.loginName, this.password);
    login.execute(function(err, inv) {
        if (err) {
            cb(err, inv);
            return;
        }
        var sessionToken = inv.result.header.sessionToken;
        console.log("Session token is:", sessionToken);
        self.header = {
            clientStamp : "0",
            sessionToken : sessionToken
        };
        cb(null, inv);
    });
}

// Close current session
BetfairSession.prototype.close = function(cb) {
    var self = this;
    var logout = this.logout();
    logout.execute(function(err, inv) {
        if (err) {
            cb(err, inv);
            return;
        }
        self.header = undefined;
        cb(null, inv);
    });
}

// ----------------------------------------------------------------------
// Betfair Global Service
// ----------------------------------------------------------------------

// login invocation
BetfairSession.prototype.login = function(log, password) {
    var request = {
        locationId : "0",
        password : password,
        productId : "82",
        username : log,
        vendorSoftwareId : "0"
    };

    return globalService.login(request);
}

// logout invocation
BetfairSession.prototype.logout = function() {
    var request = {
        header : this.header
    };

    return globalService.logout(request);
}

// keepAlive invocation
BetfairSession.prototype.keepAlive = function() {
    var request = {
        header : this.header
    };

    return globalService.keepAlive(request);
}

// ----------------------------------------------------------------------
// Betfair Exchange Service
// ----------------------------------------------------------------------

// keepAlive invocation
BetfairSession.prototype.getAllMarkets = function(evIds, countries, fromDate,
        toDate) {
    var request = {
        header : this.header
    };

    if (evIds instanceof Array) {
        var ids = [ 'int' ];
        request.eventTypeIds = ids.concat(evIds);
    }

    return exchangeService.getAllMarkets(request);
}