var https = require('https');
var fs = require('fs');
var util = require('util');
var async = require('async')

var account = JSON.parse(fs.readFileSync('/etc/bf/account.json'));

https.globalAgent.maxSockets = 5;

account.login = account.login || 'nobody';
account.password = account.password || 'password';

var betfairSport = require('../index.js');
var session = betfairSport.newSession(account.login, account.password);

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

    // invoke getAllMArkets at uk exchange for soccer
    getAllMarkets : function(cb) {
        console.log('Get available tennis matches');

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
                var path = market.menuPath.replace(/\\Tennis\\Group A\\/g, '')
                console.log(path);
            }
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
