var util = require('util');
var async = require('async')

//Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

//Number of parallel keepAlive requests  
var keepAliveRequests = 20;

//Create session to Betfair
var betfairSport = require('../index.js');
var session = betfairSport.newSession(login, password);

function sendKeepAlive(cb) {
    var keepAlive = session.keepAlive();
    keepAlive.execute(function(err, res) {
        console.log("keepAlive result:", res.isSuccess() ? 'OK' : 'Fail',
                "duration", res.duration() / 1000);
        cb(null, "OK");
    })
}

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

    // Send a number of keepAlive requests
    sendKeepAlives : function(cb) {
        console
        .log('===== Send %s serial keepAlive requests =====',
                keepAliveRequests);

        var reqs = [];
        for(var cnt=0; cnt<keepAliveRequests; ++cnt)
           reqs.push(sendKeepAlive);
        async.series(reqs, 
                       function() {
                            cb(null, "OK");
                        });
    },

    //  Logout from Betfair
    logout : function(cb) {
        console.log('===== Logging out... =====');
        session.close(function(err, res) {
            console.log('Logged out OK');
            process.exit(0);
        });
        cb(null, "OK");
    }
});
