var util = require('util');
var async = require('async')
var betfair = require('../index.js');
var common = require('./common.js');

// Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

// Optional XML logging, used for debug purposes
// betfair.setXmlLoggingEnabled(true);

// Number of parallel keepAlive requests
var keepAliveRequests = 20;

// Create session to Betfair
var session = betfair.newSession(login, password);
common.session = session;

// Send a number of serial keepAlive requests
function sendSerialKeepAlives(cb) {
    console.log('===== Send %s serial keepAlive requests =====', keepAliveRequests);
    // send a single keepAlive request
    function sendRequest(cb2) {
        var keepAlive = session.keepAlive();
        keepAlive.execute(function(err, res) {
            console.log("keepAlive result:", res.isSuccess() ? 'OK' : 'Fail', "duration", res
                    .duration() / 1000);
            cb2(err, "OK");
        });
    }

    // send a number of serial keepAlive requests
    var reqs = [];
    for ( var cnt = 0; cnt < keepAliveRequests; ++cnt)
        reqs.push(sendRequest);
    async.series(reqs, function(err, res) {
        cb(err);
    });
}

// Run the test
var testSteps = [ common.login, sendSerialKeepAlives, common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
