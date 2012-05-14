var util = require('util');
var async = require('async')

//Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

//Create session to Betfair
var betfairSport = require('../index.js');
var session = betfairSport.newSession(login, password);
//betfairSport.setXmlLoggingEnabled(true);

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

    // invoke getAccountFunds for exchanges
    sendKeepAlives : function(cb) {
        console.log('===== Send getAccountFunds request to both UK/Aus=====');
        var gotUk = false;
        var gotAus = false;
        session.setCurrentExchange('uk');
	var inv = session.getAccountFunds()
	inv.execute(function(err,res) {
	    console.log("UK balance:", res.result.balance);
	    gotUk=true;
	    if(gotUk && gotAus)
	        cb(null);
	});
        session.setCurrentExchange('aus');
	var inv = session.getAccountFunds()
	inv.execute(function(err,res) {
	    console.log("AUS balance:", res.result.balance);
	    gotAus=true;
	    if(gotUk && gotAus)
	        cb(null);
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
