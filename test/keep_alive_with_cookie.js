var util = require('util');
var async = require('async')

//Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

//Create session to Betfair
var betfairSport = require('../index.js');
var session = betfairSport.newSession(login, password);
var cookie;

async.series({
    // Login to Betfair
    login : function(cb) {
        console.log('===== Logging in to Betfair... =====');
        session.open(function onLoginFinished(err, res) {
            if (err) {
                console.log('Login error', err);
                process.exit(-1);
            }
            cookie = res.responseCookie;
            console.log('Logged in OK, cookie=%s', res.responseCookie);
            cb(null, "OK");
        });
    },

    // send keepAlive to the same Betfair cluster
    keepAlive : function(cb) {
        console.log('===== Keep alive to the same cluster =====');
        var ka = session.keepAlive();
        ka.requestCookie = cookie;
        ka.execute( function(err,res) {
            console.log("keepAlive result:", res.isSuccess() ? 'OK' : 'Fail',
                        "duration", res.duration() / 1000, 'cookie', res.responseCookie);
            cb(null, "OK");
        });
    },

    //  Logout from Betfair
    logout : function(cb) {
        console.log('===== Logging out =====');
        session.close(function(err, res) {
            console.log('Logged out OK');
            process.exit(0);
        });
        cb(null, "OK");
    }
});
