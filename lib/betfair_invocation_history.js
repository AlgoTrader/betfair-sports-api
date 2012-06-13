// (C) 2012 Anton Zemlyanov
//
// This module describes Betfair Global Service SOAP invocations
// see Sports API documentation on http://bdp.betfair.com
// 

var historySize = 1500;
var history = [];

exports.addInvocationRecord = addInvocationRecord;
exports.getInvocationHistory = getInvocationHistory;

function addInvocationRecord(name, serviceName, duration, httpCode, headerStatus,
        responseStatus) {
    var timestamp = new Date().getTime();
    history.push([ timestamp, name, serviceName, duration, httpCode, headerStatus,
            responseStatus ]);
    while (history.length > historySize)
        history.shift();
    return;
}

function getInvocationHistory() {
    return history;
}
