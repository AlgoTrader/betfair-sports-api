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

// invoke getCompleteMarketPircesCompressed on the single market
function getMarketPricesCompressed(data, cb) {
    var market = data.market;
    console.log('===== Call getCompleteMarketPricesCompressed for marketId="%s" =====',
            market.marketId);
    var inv = session.getCompleteMarketPricesCompressed(market.marketId);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err,
                'duration:', res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        //console.log(util.inspect(res.result, false, 10));

        var market = res.result.completeMarketPrices;
        console.log("marketId:", market.marketId);
        console.log("inPlayDelay:", market.inPlayDelay);
        // print players info
        for ( var playerIndex = 0; playerIndex < market.runners.length; ++playerIndex) {
            console.log("player %s", playerIndex);
            var runner = market.runners[playerIndex];
            console.log("\tselectionId:", runner.selectionId);
            console.log("\tlastPriceMatched:", runner.lastPriceMatched);
            console.log("\ttotalMatched:", runner.totalMatched);
            for(var priceIndex = 0; priceIndex< runner.prices.length; ++priceIndex) {
                var price = runner.prices[priceIndex];
                console.log("\t\tprice:%s backAmount:%s layAmount:%s", 
                        price.price, price.backAmount, price.layAmount);
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


