//(C) 2012 Anton Zemlyanov

//This module implements a generic Betfair Sports API invocation (SOAP protocol)
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//services      - list of possible Sports API services, curently three SOAP endpoints
//newInvocation - create and return SOAP invocation object

var url = require('url');
var https = require('https');
var util = require('util');
var events = require('events');

var encoder = require('./betfair_encoder.js')
var decoder = require('./betfair_decoder.js')
var decompress = require('./betfair_decompress.js')
var invocationHistory = require('./betfair_invocation_history.js');
var smartAgent = require('./https_smart_agent.js').newHttpsSmartAgent();

// Bet emulation stuff, Betfair has no demo accounts, so bet emulation
// is required to implement "risk-free" test betting
var isBetEmulationMode = false;
var emulatedActions = [ "placeBets", "updateBets", "cancelBets", "getMUBets" ];
var actionsEmulatorNeeds = [ "getCompleteMarketPricesComressed",
        "getMarketTradedVolumeCompressed" ];

var logXmlData = false;
var betfairPort = 443;
var services = {
    global : "https://api.betfair.com/global/v3/BFGlobalService",
    uk_exchange : "https://api.betfair.com/exchange/v5/BFExchangeService",
    aus_exchange : "https://api-au.betfair.com/exchange/v5/BFExchangeService"
};
var schemas = {
    global : "http://www.betfair.com/publicapi/v3/BFGlobalService/",
    exchange : "http://www.betfair.com/publicapi/v5/BFExchangeService/",
};

exports.services = services;
exports.invocation = newInvocation;
exports.setBetEmulationEnabled = setBetEmulationEnabled;
exports.isBetEmulationEnabled = isBetEmulationEnabled;
exports.setXmlLoggingEnabled = setXmlLoggingEnabled;

function setBetEmulationEnabled(en) {
    isBetEmulationMode = en;
}

function isBetEmulationEnabled() {
    return isBetEmulationMode;
}

function setXmlLoggingEnabled(en) {
    logXmlData = en;
}

function newInvocation(service, action, request) {
    return new BetfairInvocation(service, action, request);
}

function BetfairInvocation(service, action, request) {
    this.service = service;
    this.schema = (service === services.global ? schemas.global
            : schemas.exchange);
    this.action = action;
    this.request = request;
    this.result = undefined;

    this.xmlRequestBody = "";
    this.xmlResponseBody = "";

    this.startDate = new Date;

    // returns whether action is emulated in bet emulation mode
    this.isEmulatedInvocation = function(action) {
        return emulatedActions.indexOf(action) >= 0;
    }

}

BetfairInvocation.prototype.execute = function(callback) {
    var self = this;

    if (isBetEmulationMode && self.isEmulatedInvocation(this.action)) {
        throw "Bet emulation is not implemented yet";
    }

    this.xmlRequestBody = encoder
            .encode(this.action, this.schema, this.request);
    if (logXmlData) {
        console.log("XML request:");
        console.log(this.xmlRequestBody);
    }

    var parsedUrl = url.parse(this.service);
    var httpOptions = {
        host : parsedUrl.hostname,
        port : betfairPort,
        path : parsedUrl.pathname,
        method : 'POST',
        agent : smartAgent,
        headers : {
            SOAPAction : this.action,
            Connection : "Keep-Alive"
        }
    }
    // agent: smartAgent,

    var req = https.request(httpOptions, function(res) {
        // console.log("statusCode: ", res.statusCode);
        // console.log("headers: ", res.headers);
        res.on('data', function(data) {
            self.xmlResponseBody += data;
        });
        res.on('end', function(data) {
            if (logXmlData) {
                console.log("XML response:");
                console.log(self.xmlResponseBody);
            }
            self.result = decoder.decode(self.xmlResponseBody, self.schema);
            decompress.decompressInvocation(self.action, self.result);
            self.finishDate = new Date;

            // add to invocation history
            invocationHistory.addInvocationRecord(self.action, self.duration(),
                    res.statusCode, self.result.header && self.result.header.errorCode,
                    self.result.errorCode);

            if (self.result.error) {
                callback(self.result.error, self);
            } else {
                callback(null, self);
            }
        });
    });

    req.write(this.xmlRequestBody);
    req.end();
}

BetfairInvocation.prototype.isSuccess = function() {
    return this.result && this.result.header
            && this.result.header.errorCode === "OK";
}

BetfairInvocation.prototype.duration = function() {
    // Convert both dates to milliseconds
    var startMs = this.startDate.getTime();
    var finishMs = this.finishDate.getTime();

    // return the difference in milliseconds
    return finishMs - startMs;
}