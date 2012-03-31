var https = require('https');
var fs = require('fs');
var util = require('util');
var async = require('async')

var account = JSON.parse(fs.readFileSync('/etc/bf/account.json'));

https.globalAgent.maxSockets = 5;

account.login = account.login || 'nobody';
account.password = account.password || 'password';

var betfairSport = require('../index.js');
var session = betfairSport.openSession(account.login, account.password);
var marketId;

async.series({
    // Login to Betfair
    login : function(cb) {
        console.log('Logging in to Betfair...');
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
        console.log('Get available tennis matches');

        // eventTypeIds 1-soccer, 2-tennis
        var inv = session.getAllMarkets({
            eventTypeIds : [ 2 ]
        });
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err,
                    'duration:', res.duration() / 1000);
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

    // invoke getMarketTradedVolumeCompressed on the single market
    getMarketTradedVolumeCompressed : function(cb) {
        console.log('Call getMarketTradedVolumeCompressed for marketId="%s"',
                marketId);
        var inv = session.getMarketTradedVolumeCompressed(marketId);
        inv.execute(function(err, res) {
            console.log('action:', res.action, 'error:', err,
                    'duration:', res.duration() / 1000);
            if (err) {
                cb("Error in getMarketTradedVolumeCompressed", null);
            }
            console.log(util.inspect(res.result, false, 10));
            
            cb(null, "OK");
        });
    },

    // Logout from Betfair
    logout : function(cb) {
        console.log('Logging out...');
        session.close(function(err, res) {
            console.log('Logged out OK');
            cb(null, "OK");
        });
    }
});
