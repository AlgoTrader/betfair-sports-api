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

    // BetfairSession.prototype.getMUBets = function(betStatus, orderBy, count,
    // sortOrder, startRecord, optional) { // invoke getMUBets on the single
	// market
    getMUBets : function(cb)
    {
        console.log('===== Call getMUBetsLite for marketId="%s" =====', marketId);
        var inv = session.getMUBetsLite("MU", "NONE", 200, "ASC", 0, {marketId:marketId});
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err, 'duration:', res
                    .duration() / 1000);
            if (err) {
                cb("Error in getMUBets", null);
            }
            //console.log( util.inspect(res.result, false, 10) );
            console.log("errorCode:", res.result.errorCode, 
            		"recCount", res.result.totalRecordCount );
            for(var record in res.result.betLites) {
                var bet = res.result.betLites[record];
                console.log( "\tbetId=%s betStatus=%s size=%s",  bet.betId, bet.betStatus, bet.size);
            }
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
