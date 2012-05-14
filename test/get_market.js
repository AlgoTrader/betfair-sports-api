var util = require('util');
var async = require('async')

// Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

//Create session to Betfair
var betfairSport = require('../index.js');
var session = betfairSport.newSession(login, password);

var marketId;

async.series({
    // Login to Betfair
    login : function(cb) {
        console.log('===== Logging in to Betfair... =====');
        session.open(function onLoginFinished(err, res) {
            if (err) {
                console.log('Login error', err);
                process.exit(-1);
            }
            console.log('Logged in OK');
            cb(null, "OK");
        });
    },

    // invoke getAllMArkets and get the first tennis 'Match Odds'
    getAllMarkets : function(cb) {
        console.log('===== Get available tennis matches =====');

        // eventTypeIds 1-soccer, 2-tennis
        var inv = session.getAllMarkets({
            eventTypeIds : [ 2 ]
        });
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err, 'duration:', res
                    .duration() / 1000);
            if (err) {
                cb("Error in getAllMarkets", null);
            }
            for ( var index in res.result.marketData) {
                market = res.result.marketData[index];
                if (market.marketName != 'Match Odds')
                    continue;
                marketId = market.marketId;
                break;
            }
            cb(null, "OK");
        });
    },

    // invoke getMarket on the single market
    getMarket : function(cb)
    {
        console.log('===== Call getMarket for marketId="%s" =====', marketId);
        var inv = session.getMarket(marketId);
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err, 'duration:', res
                    .duration() / 1000);
            if (err) {
                cb("Error in getMarket", null);
            }
            //console.log( util.inspect(res.result, false, 10) );
            console.log("marketId:", res.result.market.marketId);
            console.log("market name:", res.result.market.name);
            console.log("market time:", res.result.market.marketTime);
            console.log("\tplayerOneId:", res.result.market.runners[0].selectionId);
            console.log("\tplayerOneName:", res.result.market.runners[0].name);
            console.log("\tplayerTwoId:", res.result.market.runners[1].selectionId);
            console.log("\tplayerTwoName:", res.result.market.runners[1].name);
            cb(null, "OK");
        });
    },

    // Logout from Betfair
    logout : function(cb) {
        console.log('===== Logging out... =====');
        session.close(function(err, res) {
            console.log('Logged out OK');
            process.exit(0);
            cb(null, "OK");
        });
    }
});
