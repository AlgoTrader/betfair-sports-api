var fs = require('fs');
var account = JSON.parse( fs.readFileSync("../account.json") );

account.login    = account.login || "nobody";
account.password = account.password || "password";

var betfairGlobalService = require("../lib/betfair_global_service.js");

var loginRequest = {
    locationId : "0",
    password : account.password,
    productId : "82",
    username : account.login,
    vendorSoftwareId : "0"
};
console.log("login Request:");
console.log(loginRequest);

var login = betfairGlobalService.login(loginRequest);
login.execute(function(resp) {
    console.log("login Response:");
    console.log(resp.result);
});
