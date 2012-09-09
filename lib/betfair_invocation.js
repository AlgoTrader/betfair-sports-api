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
var Stream = require('stream');
var zlib = require('zlib');
var cookie = require('cookie');

var encoder = require('./betfair_encoder.js')
var decoder = require('./betfair_decoder.js')
var decompress = require('./betfair_decompress.js')
var invocationLog = require('./betfair_invocation_log.js');
var emulator = require('./emulator.js');

var ForeverAgentSSL = require('../util/forever.js').SSL;
var foreverAgentSSL = new ForeverAgentSSL({
    maxSockets : 36,
    minSockets : 16
});

// Bet emulation stuff, Betfair has no demo accounts, so bet emulation
// is required to implement "risk-free" test betting
var emulatedActions = [ "placeBets", "updateBets", "cancelBets", "getMUBets",
        "getCurrentBets", "getMarketProfitAndLoss" ];

var useGzipCompression = true;
var betfairPort = 443;
var cookieName = "NSC_mc-80-qvcbqj.efgbvmu";

var services = {
    global : "https://api.betfair.com/global/v3/BFGlobalService",
    uk : "https://api.betfair.com/exchange/v5/BFExchangeService",
    aus : "https://api-au.betfair.com/exchange/v5/BFExchangeService"
};
var schemas = {
    global : "http://www.betfair.com/publicapi/v3/BFGlobalService/",
    exchange : "http://www.betfair.com/publicapi/v5/BFExchangeService/",
};

exports.invocation = newInvocation;
exports.isBetEmulationMode = false;
exports.isXmlLoggingEnabled = false;

function newInvocation(service, action, request) {
    return new BetfairInvocation(service, action, request);
}

function BetfairInvocation(service, action, request) {
    // BF stuff
    var self = this;

    self.service = service;
    self.serviceUrl = services[service];
    self.schema = (service === services.global ? schemas.global : schemas.exchange);

    self.action = action;
    self.request = request;
    self.result = undefined;
    self.retries = 0;

    // Raw XMLs
    self.xmlRequestBody = "";
    self.xmlResponseBody = "";
    self.rawResponseLength = 0;

    // Stream stuff, BetfairInvocation is writable stream
    self.readable = false;
    self.writable = true;

    self.startDate = new Date();

    // returns whether action is emulated in bet emulation mode
    self.isBetEmulationMode = exports.isBetEmulationMode;
}
util.inherits(BetfairInvocation, Stream);

BetfairInvocation.prototype.execute = function(callback) {
    var self = this;
    self.callback = callback || function() {
    };
    ++self.retries; // increment retry count

    self.xmlRequestBody = encoder.encode(self.action, self.schema, self.request);
    if (exports.isXmlLoggingEnabled) {
        console.log("XML request:", this.xmlRequestBody);
    }

    var parsedUrl = url.parse(this.serviceUrl);
    var httpOptions = {
        host : parsedUrl.hostname,
        port : betfairPort,
        path : parsedUrl.pathname,
        method : 'POST',
        agent : foreverAgentSSL,
        forever : true,
        headers : {
            SOAPAction : self.action,
            "Content-Length" : self.xmlRequestBody.length
        }
    };
    // Optional GZIP compression
    if (useGzipCompression)
        httpOptions.headers['accept-encoding'] = 'gzip';
    // Optional Cookie
    if (self.requestCookie)
        httpOptions.headers['cookie'] = cookieName + '=' + self.requestCookie;

    // console.log(httpOptions);

    function responseCallback(res) {
        // console.log("statusCode: ", res.statusCode, "headers: ",res.headers);
        self.statusCode = res.statusCode;

        // extract BF cookie
        var cookies = res.headers['set-cookie'];
        if (cookies) {
            for ( var i in cookies) {
                var parsed = cookie.parse(cookies[i]);
                if (parsed[cookieName]) {
                    self.responseCookie = parsed[cookieName];
                    break;
                }
            }
        }

        // just for statistics of compression efficiency
        res.on('data', function(data) {
            self.rawResponseLength += data.length;
        })

        // http request input to self output
        if (res.headers['content-encoding'] === 'gzip') {
            // piping through gzip
            var gunzip = zlib.createGunzip();
            res.pipe(gunzip).pipe(self);
        } else {
            // piping directly to self
            res.pipe(self);
        }
    }

    self.isEmulatedCall = false;
    var transport = https;
    // console.log('emulation=',exports.isBetEmulationMode);
    if (exports.isBetEmulationMode && emulatedActions.indexOf(self.action) >= 0) {
        self.isEmulatedCall = true;
        transport = emulator;
    }

    // Issue invocation either to Betfair or to Emulator
    var req = transport.request(httpOptions, responseCallback);

    req.write(this.xmlRequestBody);
    req.end();
}

BetfairInvocation.prototype.write = function(data) {
    var self = this;
    self.xmlResponseBody += data.toString();
};

BetfairInvocation.prototype.end = function() {
    var self = this;

    // Compression efficiency results
    var ratio = 100.0 - (self.rawResponseLength / self.xmlResponseBody.length) * 100.0;
    ratio = Math.round(ratio);
    // console.log('%s response: raw length=%d, xml length=%d, compression=%d%',
    // self.action,
    // self.rawResponseLength, self.xmlResponseBody.length, ratio);

    if (exports.isXmlLoggingEnabled) {
        console.log("XML response:", self.xmlResponseBody);
    }
    self.result = decoder.decode(self.xmlResponseBody, self.schema);
    decompress.decompressInvocation(self.action, self.result);
    self.finishDate = new Date;

    // add to invocation log
    invocationLog.addInvocationRecord(self.action, self.service, self.duration(),
            self.statusCode, self.result.header && self.result.header.errorCode,
            self.result.errorCode, self.isEmulatedCall);

    // update session token
    if (self.session)
        self.session.updateSessionToken(self.result);

    if (self.result.error) {
        self.callback(self.result.error, self);
    } else if (self.result.header && self.result.header.errorCode !== 'OK') {
        self.callback(self.result.header.errorCode, self);
    } else {
        // If bet emulation mode was enabled at invocation create time
        // then emulator may need this invocation result
        if (self.isBetEmulationMode)
            self.updateEmulator();

        self.callback(null, self);
    }
};

BetfairInvocation.prototype.updateEmulator = function() {
    var self = this;
    if (!self.isBetEmulationMode)
        return;

    // Emulator needs only market prices and traded volume
    switch (self.action) {
    case 'getCompleteMarketPricesCompressed':
        emulator.onGetCompleteMarketPricesCompressed(self.result);
        break;
    case 'getMarketPricesCompressed':
        emulator.onGetMarketPricesCompressed(self.result);
        break;
    case 'getMarketTradedVolumeCompressed':
        emulator.onGetMarketTradedVolumeCompressed(self.result);
        break;
    }
}

BetfairInvocation.prototype.isSuccess = function() {
    return this.result && this.result.header && this.result.header.errorCode === "OK";
}

BetfairInvocation.prototype.isFailure = function() {
    return this.result && this.result.header && this.result.header.errorCode !== "OK";
}

BetfairInvocation.prototype.isThrottled = function() {
    return this.result && this.result.header
            && this.result.header.errorCode === "THROTTLE_EXCEEDED";
}

BetfairInvocation.prototype.duration = function() {
    // Convert both dates to milliseconds
    var startMs = this.startDate.getTime();
    var finishMs = this.finishDate.getTime();

    // return the difference in milliseconds
    return finishMs - startMs;
}

BetfairInvocation.prototype.responseClusterId = function() {
    var self = this;
    // ffffffff09208c3745525d5f4f58455e445a4a4229a0
    if (self.responseCookie)
        return self.responseCookie.substr(14, 2);

    return null;
}
