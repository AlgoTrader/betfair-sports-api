//(C) 2012 Anton Zemlyanov

//This module implements a generic Betfair Sports API invocation (SOAP protocol)
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//services      - list of possible Sports API services, curently three SOAP endpoints
//newInvocation - create and return SOAP invocation object

var url = require("url");
var https = require("https");
var util = require("util");
var events = require("events");

var encoder = require("./betfair_encoder.js")
var decoder = require("./betfair_decoder.js")

var services = {
    global : "https://api.betfair.com/global/v3/BFGlobalService",
    uk : "https://api.betfair.com/exchange/v5/BFExchangeService",
    aus : "https://api-au.betfair.com/exchange/v5/BFExchangeService"
};

exports.services = services;
exports.invocation = newInvocation;
exports.logXmlData = false;

var port = 443;
var schemas = {
    global : "http://www.betfair.com/publicapi/v3/BFGlobalService/",
    exchange : "http://www.betfair.com/publicapi/v5/BFExchangeService/",
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
}

BetfairInvocation.prototype.execute = function(callback) {
    var self = this;

    this.xmlRequestBody = encoder
            .encode(this.action, this.schema, this.request);
    if (exports.logXmlData) {
        console.log("XML request:");
        console.log(this.xmlRequestBody);
    }

    var parsedUrl = url.parse(this.service);
    var httpOptions = {
        host : parsedUrl.hostname,
        port : port,
        path : parsedUrl.pathname,
        method : 'POST',
        headers : {
            SOAPAction : this.action
        }
    }

    var req = https.request(httpOptions, function(res) {
        // console.log("statusCode: ", res.statusCode);
        // console.log("headers: ", res.headers);
        res.on('data', function(data) {
            self.xmlResponseBody += data;
        });
        res.on('end', function(data) {
            if (exports.logXmlData) {
                console.log("XML response:");
                console.log(self.xmlResponseBody);
            }
            self.result = decoder.decode(self.xmlResponseBody);
            self.finishDate = new Date;
            callback(self);
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
    var startMs  = this.startDate.getTime();
    var finishMs = this.finishDate.getTime();

    // Calculate the difference in milliseconds
    var diff = Math.abs(finishMs - startMs);
    return diff;
}