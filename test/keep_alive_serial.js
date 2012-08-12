var util = require('util');
var async = require('async')
var betfair = require('../index.js');
var common = require('./common.js');

// Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

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
    async.series(reqs, cb);
}

// Run the test
var testSteps = {
    step1 : common.login,
    step2 : sendSerialKeepAlives,
    step3 : common.logout
};
async.series(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
