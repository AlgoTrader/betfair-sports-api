var betfairUser = process.argv[2] || "user";
var betfairPassword = process.argv[3] || "password";

var betfairSport = require("../index.js");
var session = betfairSport.openSession(betfairUser, betfairPassword);

session.on("error",   function(res) { console.log("failed to login"); process.exit(1); });
session.on("loggedIn", function(res) { console.log("got loggedIn event") });


