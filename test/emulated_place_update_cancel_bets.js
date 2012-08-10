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
betfair.setBetEmulationEnabled(true);

// Create session to Betfair
var session = betfair.newSession(login, password);
common.session = session;

// invoke placeBets to place LAY 5.0 for player1 at 1.01
// maximum loss if matched is 0.05
function placeBets(desc, cb) {
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

        cb(null, betIds);
    });
}

// invoke updateBets to change size of previously placed bet
function updateBets(betIds, cb) {
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

        // console.log(res.result);

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

        cb(null, betIds);
    });
}

// invoke cancelBets to cancel previously placed/updated bet
function cancelBets(betIds, cb) {
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

        // console.log(res.result);

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
        common.emulatorGetCompleteMarketPrices, placeBets, cancelBets,
        common.logout ];
async.waterfall(testSteps, function(err, res) {
    if (err)
        console.log("===== TEST FAILED, error=%j =====", err);
    else
        console.log("===== TEST OK =====");
    process.exit(0);
});
