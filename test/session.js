var fs = require('fs');
var account = JSON.parse(fs.readFileSync("../account.json"));

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
    console.log("got loggedIn event");
    session.close();
});

session.on("loggedOut", function(res) {
    console.log("got loggedOut event");
    process.exit(1);
});
