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

// invoke getMarketTradedVolumeCompressed on the single market
function getMarketTradedVolumeCompressed(data, cb) {
    var market = data.market;
    console.log('===== Call getMarketTradedVolumeCompressed for marketId="%s" =====',
            market.marketId);
    var inv = session.getMarketTradedVolumeCompressed(market.marketId);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:',
                res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        console.log(util.inspect(res.result, false, 10));

        cb(null);
    });
}

// Run the test
var testSteps = [ common.login, common.getAllMarkets, common.selectMarket,
        getMarketTradedVolumeCompressed, common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
