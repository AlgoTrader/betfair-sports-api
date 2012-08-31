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

// invoke getMarketProfitAndLoss on the single market
function getMarketProfitAndLoss(data, cb) {
    var market = data.market;
    console.log('===== Call getMarketProfitAndLoss for marketId="%s" =====',
            market.marketId);
    var inv = session.getMarketProfitAndLoss(market.marketId, false);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err,
                'duration:', res.duration() / 1000);
        if (err) {
            cb(err);
            return
        }
        // console.log(util.inspect(res.result, false, 10));
        var desc = { marketId: market.marketId };
        for(var playerIndex in res.result.annotations) {
                var playerInfo = res.result.annotations[playerIndex];
                console.log("Player %s", playerIndex);
                console.log('\tName:%s', playerInfo.selectionName);
                console.log('\tId:%s', playerInfo.selectionId);
                console.log('\tIfWin:%s', playerInfo.ifWin);
                console.log('\tIfLoss:%s', playerInfo.ifLoss);
                if(playerIndex==0)
                    desc.selectionId = playerInfo.selectionId;
        }
        data.desc = desc;

        cb(null, data);
    });
}


// invoke getMarketTradedVolume on the single market
function getMarketTradedVolume(data, cb) {
    desc = data.desc;
    console.log('===== Call getMarketTradedVolume for marketId="%s", selectionId="%s" =====',
            desc.marketId, desc.selectionId);
    var inv = session.getMarketTradedVolume(desc.marketId, desc.selectionId);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err,
                'duration:', res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }
        console.log(util.inspect(res.result, false, 10));

        cb(null);
    });
}

// Run the test
var testSteps = [
        common.login,
        common.getAllMarkets,
        common.selectMarket,
        getMarketProfitAndLoss,
        getMarketTradedVolume,
        common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});

