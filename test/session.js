var fs = require('fs');
var account = JSON.parse(fs.readFileSync("../account.json"));

account.login = account.login || "nobody";
account.password = account.password || "password";

var betfairSport = require("../index.js");
var session = betfairSport.openSession(account.login, account.password);

session.on("error", function(res) {
    console.log("failed to login");
    process.exit(1);
});
session.on("loggedIn", function(res) {
    console.log("got loggedIn event")
});
