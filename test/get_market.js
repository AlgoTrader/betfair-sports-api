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

// invoke getMarket on the single market
function getMarket(data, cb) {
    var market = data.market;
    console.log('===== Call getMarket for marketId="%s" =====', market.marketId);
    var inv = session.getMarket(market.marketId);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:', res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }
        // console.log( util.inspect(res.result, false, 10) );
        console.log("marketId:", res.result.market.marketId);
        console.log("market name:", res.result.market.name);
        console.log("market time:", res.result.market.marketTime);
        console.log("\tplayerOneId:", res.result.market.runners[0].selectionId);
        console.log("\tplayerOneName:", res.result.market.runners[0].name);
        console.log("\tplayerTwoId:", res.result.market.runners[1].selectionId);
        console.log("\tplayerTwoName:", res.result.market.runners[1].name);
        cb(null);
    });
}

// Run the test
var testSteps = [
        common.login,
        common.getAllMarkets,
        common.selectMarket,
        getMarket,
        common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
