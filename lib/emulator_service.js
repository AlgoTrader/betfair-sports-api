// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" SOAP requests and sends "HTTP" SOAP responses

var util = require('util');
var events = require('events');
var Stream = require('stream');

var emulator = require('./emulator');

exports.request = request;

function request(httpOptions, response) {
    var req = new EmulatorRequest(httpOptions);
    var res = new EmulatorResponse();
    var action = httpOptions.headers.SOAPAction;

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
    
    self.xmlRequestBody = '';
}
util.inherits(BetfairInvocation, Stream);

// write
EmulatorRequest.prototype.write(data) {
    var self = this;
    self.xmlRequestBody += data;
}

// end
EmulatorRequest.prototype.end(...) {
    var self = this;
    switch(self.action) {
    case 'placeBets':
        emulator.handlePlaceBets( self, self.response );
        break;
    }
}

function EmulatorResponse() {
    var self = this;

    // Stream stuff, EmulatorResponse is readable stream
    // Emulator sends soap response into it
    self.readable = false;
    self.writable = true;
}
util.inherits(BetfairInvocation, Stream);

