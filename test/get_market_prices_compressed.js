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

// invoke getMarketPircesCompressed on the single market
function getMarketPricesCompressed(data, cb) {
    var market = data.market;
    console.log('===== Call getMarketPricesCompressed for marketId="%s" =====',
            market.marketId);
    var inv = session.getMarketPricesCompressed(market.marketId);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err,
                'duration:', res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }
        
        //console.log(util.inspect(res.result, false, 10));

        var market = res.result.marketPrices;
        console.log("marketId:", market.marketId);
        console.log("currency:", market.currency);
        console.log("marketStatus:", market.marketStatus);
        console.log("inPlayDelay:", market.inPlayDelay);
        // print players info
        for ( var playerIndex = 0; playerIndex < market.runners.length; ++playerIndex) {
            console.log("player %s", playerIndex);
            var runner = market.runners[playerIndex];
            console.log("\tselectionId:", runner.selectionId);
            console.log("\tlastPriceMatched:", runner.lastPriceMatched);
            console.log("\ttotalMatched:", runner.totalMatched);
            for ( var cnt = 0; cnt < runner.backPrices.length; ++cnt) {
                var item = runner.backPrices[cnt];
                console.log("\t back price:%s amount:%s",
                        item.price, item.amount);
            }
            for ( var cnt = 0; cnt < runner.layPrices.length; ++cnt) {
                var item = runner.layPrices[cnt];
                console.log("\t lay price:%s amount:%s",
                        item.price, item.amount);
            }
        }
        cb(null);
    });
}

// Run the test
var testSteps = [
        common.login,
        common.getAllMarkets,
        common.selectMarket,
        getMarketPricesCompressed,
        common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});

