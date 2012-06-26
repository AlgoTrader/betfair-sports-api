// Betfair account data
var login = process.env['BF_LOGIN'] || "nobody";
var password = process.env['BF_PASSWORD'] || "password";

var betfairGlobalService = require("../lib/betfair_global_service.js");

var loginRequest = {
    locationId : "0",
    password : password,
    productId : "82",
    username : login,
    vendorSoftwareId : "0"
};
console.log("login Request:", loginRequest);

var login = betfairGlobalService.login(loginRequest);
login.execute(function(err, resp) {
    console.log("login Error:", err, "login Response:", resp.result);
    console.log("cookie:", resp.responseCookie );
    process.exit(0);
});
