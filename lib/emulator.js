// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" SOAP requests and sends "HTTP" SOAP responses

var util = require('util');
var events = require('events');
var Stream = require('stream');

var core = require('./emulator_core');
// var decoder = require('./emulator_decoder');

// http request function emulation
exports.request = request;

// update of internal emulator states using the BF price and volume calls results
exports.onGetCompleteMarketPricesCompressed = onGetCompleteMarketPricesCompressed;
exports.onGetMarketPricesCompressed = onGetMarketPricesCompressed;
exports.onGetMarketTradedVolumeCompressed = onGetMarketTradedVolumeCompressed;
exports.onGetMarketTradedVolume = onGetMarketTradedVolume;

// handle getCompleteMarketPricesCompressed
function onGetCompleteMarketPricesCompressed(result) {
    return core.onGetCompleteMarketPricesCompressed(result);
};

//handle getMarketPricesCompressed
function onGetMarketPricesCompressed(result) {
    return core.onGetMarketPricesCompressed(result);
};

//handle getMarketTradedVolumeCompressed
function onGetMarketTradedVolumeCompressed(result) {
    return core.onGetMarketTradedVolumeCompressed(result);
};

//handle getMarketTradedVolume
function onGetMarketTradedVolume(result) {
    return core.onGetMarketTradedVolume(result);
};

function request(httpOptions, response) {
    var action = httpOptions.headers.SOAPAction;
    var req = new EmulatorRequest(httpOptions);
    var res = new EmulatorResponse();

    req.response = res;
    req.action = action;

    res.request = req;
    res.action = action;

    response(res);
    return req;
}

function EmulatorRequest(httpOptions) {
    var self = this;

    // Stream stuff, EmulatorRequest is writable stream
    // We write soap request into it, emulator gets it and process
    self.readable = true;
    self.writable = false;

    self.headers = httpOptions.headers;
    self.xmlRequestBody = '';
}
util.inherits(EmulatorRequest, Stream);

// write
EmulatorRequest.prototype.write = function(data) {
    var self = this;
    self.xmlRequestBody += data;
}

// end
EmulatorRequest.prototype.end = function() {
    var self = this;

    switch (self.action) {
    case 'placeBets':
        core.handlePlaceBets(self, self.response);
        break;
    }

    // send XML response
    self.response.send();
}

function EmulatorResponse() {
    var self = this;

    // Stream stuff, EmulatorResponse is readable stream
    // Emulator sends soap response into it
    self.readable = false;
    self.writable = true;

    self.statusCode = 200; // HTTP OK
    self.headers = {};
    self.xmlResponseBody = '';
}
util.inherits(EmulatorResponse, Stream);

EmulatorResponse.prototype.send = function()
{
    self.emit('data', self.xmlResponseBody);
    self.emit('end');
}
