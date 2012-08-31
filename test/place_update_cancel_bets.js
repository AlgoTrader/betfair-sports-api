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
    var mark = data.market;
    console.log('===== Call getMarketPricesCompressed for marketId="%s" =====',
            mark.marketId);
    var inv = session.getMarketPricesCompressed(mark.marketId);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:',
                res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        // console.log(util.inspect(res.result, false, 10));

        var desc = {
            marketId : mark.marketId
        };
        var market = res.result.marketPrices;
        console.log("marketId:", market.marketId);
        console.log("currency:", market.currency);
        console.log("marketStatus:", market.marketStatus);
        console.log("inPlayDelay:", market.inPlayDelay);
        // print players info
        for ( var playerIndex = 0; playerIndex < market.runners.length; ++playerIndex) {
            console.log("player %s", playerIndex);
            var runner = market.runners[playerIndex];
            if (playerIndex == 0)
                desc.selectionId = runner.selectionId;
            console.log("\tselectionId:", runner.selectionId);
            console.log("\tlastPriceMatched:", runner.lastPriceMatched);
            console.log("\ttotalMatched:", runner.totalMatched);
            for ( var cnt = 0; cnt < runner.backPrices.length; ++cnt) {
                var item = runner.backPrices[cnt];
                console.log("\t back price:%s amount:%s", item.price, item.amount);
            }
            for ( var cnt = 0; cnt < runner.layPrices.length; ++cnt) {
                var item = runner.layPrices[cnt];
                console.log("\t lay price:%s amount:%s", item.price, item.amount);
            }
        }
        data.desc = desc;
        cb(null, data);
    });
}

// invoke placeBets to place LAY 5.0 for player1 at 1.01
// maximum loss if matched is 0.05
function placeBets(data, cb) {
    var desc = data.desc;
    console.log('===== Place a test lay bet marketId=%s selectionId=%s =====',
            desc.marketId, desc.selectionId);
    var bet = {
        asianLineId : "0",
        betCategoryType : "E",
        betPersistenceType : "NONE",
        betType : "L",
        bspLiability : "0",
        marketId : desc.marketId,
        price : "1.01",
        selectionId : desc.selectionId,
        size : "5.00"
    }
    // add two bets
    var inv = session.placeBets([ bet, bet ]);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:',
                res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        // console.log(res.result);

        var betIds = [];
        console.log("placeBets results:")
        for ( var i = 0; i < res.result.betResults.length; ++i) {
            var betResult = res.result.betResults[i];
            console.log("betId=%s", betResult.betId);
            console.log("\tresultCode=%s", betResult.resultCode);
            console.log("\tsuccess=%s", betResult.success);
            console.log("\tsizeMatched=%s", betResult.sizeMatched);
            betIds.push(betResult.betId);
        }

        data.betIds = betIds;
        cb(null, data);
    });
}

// invoke updateBets to change size of previously placed bet
function updateBets(data, cb) {
    var betIds = data.betIds;
    console.log('===== updateBets for %d bets =====', betIds.length);
    // For first bet, change persistence
    var bet1 = {
        betId : betIds[0],
        newBetPersistenceType : "IP",
        newPrice : "1.01",
        newSize : "5.0",
        oldBetPersistenceType : "NONE",
        oldPrice : "1.01",
        oldSize : "5.0"
    };
    // For second bet, reduce size
    var bet2 = {
        betId : betIds[1],
        newBetPersistenceType : "NONE",
        newPrice : "1.01",
        newSize : "4.0",
        oldBetPersistenceType : "NONE",
        oldPrice : "1.01",
        oldSize : "5.0"
    };
    var inv = session.updateBets([ bet1, bet2 ]);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:',
                res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        //console.log(res.result);

        console.log("updateBets results:")
        for ( var i = 0; i < res.result.betResults.length; ++i) {
            var betResult = res.result.betResults[i];
            console.log("betId=%s", betResult.betId);
            console.log("\tnewPrice=%s", betResult.newPrice);
            console.log("\tnewBetId=%s", betResult.newBetId);
            console.log("\tnewSize=%s", betResult.newSize);
            console.log("\tresultCode=%s", betResult.resultCode);
            console.log("\tsizeCancelled=%s", betResult.sizeCancelled);
            console.log("\tsuccess=%s", betResult.success);
        }

        cb(null, data);
    });
}

// invoke cancelBets to cancel previously placed/updated bet
function cancelBets(data, cb) {
    var betIds = data.betIds;
    console.log('===== cancelBets for %d bets =====', betIds.length);
    var bets = [];
    for ( var i = 0; i < betIds.length; ++i)
        bets.push({
            betId : betIds[i],
        });

    var inv = session.cancelBets(bets);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:',
                res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        //console.log(res.result);
        
        console.log("cancelBets results:")
        for ( var i = 0; i < res.result.betResults.length; ++i) {
            var betResult = res.result.betResults[i];
            console.log("betId=%s", betResult.betId);
            console.log("\tresultCode=%s", betResult.resultCode);
            console.log("\tsizeCancelled=%s", betResult.sizeCancelled);
            console.log("\tsizeMatched=%s", betResult.sizeMatched);
            console.log("\tsuccess=%s", betResult.success);
        }

        cb(null);
    });
}

// Run the test
var testSteps = [ common.login, common.getAllMarkets, common.selectMarket,
        getMarketPricesCompressed, placeBets, updateBets, cancelBets, common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
