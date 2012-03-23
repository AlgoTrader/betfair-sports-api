var betfairUser = "user";
var betfairPassword = "password";

var betfairGlobalService = require("../lib/betfair_global_service.js");

var loginRequest = {
    locationId : "0",
    password : betfairPassword,
    productId : "82",
    username : betfairUser,
    vendorSoftwareId : "0"
};
console.log("login Request:");
console.log(loginRequest);

var login = betfairGlobalService.login(loginRequest);
login.execute(function(resp) {
    console.log("login Response:");
    console.log(resp.result);
});
