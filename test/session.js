var fs = require('fs');
var util = require('util');
var https = require('https');

var account = JSON.parse(fs.readFileSync("../account.json"));

https.globalAgent.maxSockets = 5;

account.login = account.login || "nobody";
account.password = account.password || "password";

var betfairSport = require("../index.js");
var session = betfairSport.openSession(account.login, account.password);

session.on("error", function(res) {
    console.log("error:");
    console.log(res);
    process.exit(1);
});

session.on("loggedIn", function(res) {
    var fastest = Infinity;
    var slowest = 0;
    var okCalls = 0;
    var totalCalls = 0;
    console.log("got loggedIn event");
    for ( var cnt = 0; cnt < 10; ++cnt) {
        session.keepAlive(function keepAliveResult(res) {
            console.log(res.result);
            if (res.duration() < fastest)
                fastest = res.duration();
            if (res.duration() > slowest)
                slowest = res.duration();
            if (res.result.header.errorCode === "OK")
                ++okCalls;
            if (okCalls === 10)
            {
                console.log(util.format(
                        "Ok calls:%s fastest:%sms slowest:%sms", okCalls,
                        fastest, slowest));
                        session.close();
            }
        });
    }
    //session.close();
});

session.on("loggedOut", function(res) {
    console.log("got loggedOut event");
    process.exit(1);
});
