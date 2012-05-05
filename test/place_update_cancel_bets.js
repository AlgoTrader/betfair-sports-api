var util = require('util');
var async = require('async')

//Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

//Create session to Betfair
var betfairSport = require('../index.js');
var session = betfairSport.newSession(login, password);

var marketId;
var selectionId;
var betId;

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

    // invoke getAllMArkets at uk exchange for tennis
    // We will pick a single market with the latest start time
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
            //console.log(res.result);

            // sort by marketId descending
            res.result.marketData.sort(function(first, second) {
                return second.eventDate - first.eventDate
            });

            for ( var index in res.result.marketData) {
                var market = res.result.marketData[index];
                if (market.marketName != 'Match Odds')
                    continue; 
                var path = market.menuPath.replace(/\\Tennis\\Group A\\/g, '')
                marketId = market.marketId;
                console.log("market to test betting:",marketId,path);
                break;
            }
            cb(null, "OK");
        });
    },

    // invoke getMarketPircesCompressed on the single market
    // we first check if market is inPlay, if yes test is aborted
    // then we need to know selectionId for players in order to make bets
    getMarketPricesCompressed : function(cb) {
        console.log('===== Call getMarketPricesCompressed for marketId="%s" =====',
                marketId);
        var inv = session.getMarketPricesCompressed(marketId);
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err,
                    'duration:', res.duration() / 1000);
            if (err) {
                cb("Error in getMarketPricesCompressed", null);
            }
            //console.log(util.inspect(res.result, false, 10));

            var market = res.result.marketPrices;
            console.log("marketId:", market.marketId);
            console.log("currency:", market.currency);
            console.log("marketStatus:", market.marketStatus);
            console.log("inPlayDelay:", market.inPlayDelay);
            if(parseInt(market.inPlayDelay)>0) {
                console.log("ERROR: Market is in-play, stop test");
                cb("Market is inPlay", null);
                return;
            }

            // print players info
            for ( var playerIndex = 0; playerIndex < market.runners.length; ++playerIndex) {
                console.log("player %s", playerIndex);
                var runner = market.runners[playerIndex];
                console.log("\tselectionId:", runner.selectionId);
                console.log("\tlastPriceMatched:", runner.lastPriceMatched);
            }
            // chose the selectionId of the player that has bigger lastPriceMatched
            var player1 = market.runners[0];
            var player2 = market.runners[1];
            if( parseFloat(player1.lastPriceMatched) > parseFloat(player2.lastPriceMatched))
                selectionId = player1.selectionId;
            else
                selectionId = player2.selectionId;
            console.log("Will use selectionId %s for betting tests", selectionId);

            cb(null, "OK");
        });
    },

    // invoke placeBets to place LAY 5.0 for player1 at 1.01
    // maximum loss if matched is 0.05
    placeBets : function(cb) {
        console.log('===== Place a test lay bet marketId=%s selectionId=%s =====',
                marketId,selectionId);
        var bet = { 
                asianLineId: "0",
                betCategoryType: "E",
                betPersistenceType: "NONE",
                betType: "L",
                bspLiability: "0",
                marketId: marketId,
                price: "1.01",
                selectionId: selectionId,
                size: "5.00"
        }
        var inv = session.placeBets([bet]);
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err,
                    'duration:', res.duration() / 1000);
            if (err) {
                cb("Error in placeBets", null);
            }
            //console.log(res.result);
            if(res.result.betResults && res.result.betResults.length!=1)
                cb("Error in placeBets", null);
            
            var betResult = res.result.betResults[0];
            console.log("placeBets results:") 
            console.log("\tbetId=%s", betResult.betId);
            console.log("\tresultCode=%s", betResult.resultCode);
            console.log("\tsuccess=%s", betResult.success);
            console.log("\tsizeMatched=%s", betResult.sizeMatched);
            betId = betResult.betId;
            
            cb(null, "OK");
        });
    },

    // invoke updateBets to change size of previously placed bet
    updateBets : function(cb) {
        console.log('===== updateBets for betId=%s, change bet size =====',betId);
        var bet = { 
                betId: betId,
                newBetPersistenceType: "IP",
                newPrice : "1.01",
                newSize : "5.0",
                oldBetPersistenceType: "NONE",
                oldPrice : "1.01",
                oldSize : "5.0"
                
        }
        var inv = session.updateBets([bet]);
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err,
                    'duration:', res.duration() / 1000);
            if (err) {
                cb("Error in updateBets", null);
            }
            console.log(res.result);
            if(res.result.betResults && res.result.betResults.length!=1)
                cb("Error in updateBets", null);
            
            var betResult = res.result.betResults[0];
            console.log("updateBets results:") 
            console.log("\tbetId=%s", betResult.betId);
            console.log("\tnewPrice=%s", betResult.newPrice);
            console.log("\tnewBetId=%s", betResult.newBetId);
            console.log("\tnewSize=%s", betResult.newSize);
            console.log("\tresultCode=%s", betResult.resultCode);
            console.log("\tsizeCancelled=%s", betResult.sizeCancelled);
            console.log("\tsuccess=%s", betResult.success);
            
            cb(null, "OK");
        });
    },

    // invoke cancelBets to cancel previously placed/updated bet
    cancelBets : function(cb) {
        console.log('===== cancelBets for betId=%s =====',betId);
        var bet = { 
                betId: betId,
        }
        var inv = session.cancelBets([bet]);
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err,
                    'duration:', res.duration() / 1000);
            if (err) {
                cb("Error in cancelBets", null);
            }
            //console.log(res.result);
            if(res.result.betResults && res.result.betResults.length!=1)
                cb("Error in cancelBets", null);
            
            var betResult = res.result.betResults[0];
            console.log("cancelBets results:") 
            console.log("\tbetId=%s", betResult.betId);
            console.log("\tresultCode=%s", betResult.resultCode);
            console.log("\tsizeCancelled=%s", betResult.sizeCancelled);
            console.log("\tsizeMatched=%s", betResult.sizeMatched);
            console.log("\tsuccess=%s", betResult.success);
            
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
