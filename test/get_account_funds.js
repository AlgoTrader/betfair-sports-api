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

// getAccountFunds invocation to UK and Aus exchanges
// the only test that works with Aus exchange
function getAccountFunds(cb) {
    console.log('===== Send getAccountFunds request to both UK/Aus=====');

    // UK exchange
    function uk(cb2) {
        session.setCurrentExchange('uk');
        var inv = session.getAccountFunds()
        inv.execute(function(err, res) {
            console.log("UK balance:", res.result.balance);
            cb2(null);
        });
    }
    // AUS Exchane
    function aus(cb2) {
        session.setCurrentExchange('aus');
        var inv = session.getAccountFunds()
        inv.execute(function(err, res) {
            console.log("AU balance:", res.result.balance);
            cb2(null);
        });
    }

    async.parallel([ uk, aus ], cb);
}

// Run the test
var testSteps = {
    step1 : common.login,
    step2 : getAccountFunds,
    step3 : common.logout
};
async.series(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
