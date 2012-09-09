
// (C) 2012 Anton Zemlyanov
//
// This module describes Betfair Global Service SOAP invocations
// see Sports API documentation on http://bdp.betfair.com
//

var LOG_TO_FILE = false;
var RECORDS_IN_MEMORY = 500;
var DEFAULT_FILENAME = "betfair-invocations.log";
var DEFAULT_LEVEL = "info";

var Bunyan = require('bunyan');
var ringBuffer = new Bunyan.RingBuffer({ limit: RECORDS_IN_MEMORY });

var streams = [
    {
        level: DEFAULT_LEVEL,
        type: 'raw',
        stream: ringBuffer        
    }
];

if(LOG_TO_FILE) {
    var fs = require('fs');
    fs.existsSync(DEFAULT_FILENAME) && fs.unlinkSync(DEFAULT_FILENAME);
    streams.push({
        level: DEFAULT_LEVEL,
        path: DEFAULT_FILENAME
    });
}

var log = new Bunyan({
    name : "betfair",
    streams : streams
});

exports.addInvocationRecord = addInvocationRecord;
exports.getInvocationHistory = getInvocationHistory;

function addInvocationRecord(name, serviceName, duration, httpCode, headerStatus,
        responseStatus, isEmulated) {
        
    // record
    var timestamp = new Date().getTime();
    var record = { timestamp:timestamp, name:name, serviceName:serviceName, 
        duration:duration, httpCode:httpCode, headerStatus:headerStatus,
            responseStatus:responseStatus, isEmulated:isEmulated };
            
    // write lo log
    log.info({record:record}, name+'@'+serviceName);
    
    return;
}

function getInvocationHistory(limit) {
    return ringBuffer.records;
}
