var util = require('util');
var async = require('async')
var betfair = require('../index.js');
var common = require('./common.js');

// Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

// Optional XML logging, used for debug purposes
// betfair.setXmlLoggingEnabled(true);
// betfair.addDesirableMarketName('Match Odds');

// Create session to Betfair
var session = betfair.newSession(login, password);
common.session = session;

// getAccountFunds invocation to UK and Aus exchanges
// the only test that works with Aus exchange
function processMarkets(data, cb) {
    var markets = data.markets;
    console.log('===== Process List of %d Markets... =====', markets.length);
    for ( var index in markets) {
        market = markets[index];
        if (market.marketName != 'Match Odds')
            continue;
        var path = market.menuPath.replace(/\\Tennis\\Group A\\/g, '')
        console.log(market.eventDate, path);
    }
    cb(null);
}

// Run the test
var testSteps = [ common.login, common.getAllMarkets, processMarkets, common.logout ];
//var testSteps = [ common.login, common.getAllMArkets, processMarkets, common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
