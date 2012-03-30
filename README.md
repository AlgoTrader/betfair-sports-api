Betfair Sports API for Node.js
===========================

**Warning: Please do not use, it is unusable yet**
anton.zem at google mail

Installation
------------

    npm install betfair-sports-api
    

Synopsis
--------

An example of using Betfair Sports API
        
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
    console.log("login Request:%s",loginRequest);
    
    var login = betfairGlobalService.login(loginRequest);
    login.execute(function(err, resp) {
        console.log("login response:%s error:%s", resp.result, err);
    });
    

API
---

### Betfair invocation support status ###

<table cellspacing=1 cellpadding=1 border=0>
    <tr><th>API call</th><th>Status</th></tr>
    <tr><th colspan=2>Session management API calls</th></tr>
    <tr><td>login</td><td><b>Done</b> (with limits)</td></tr>
    <tr><td>logout</td><td><b>Done</b></td></tr>
    <tr><td>keepAlive</td><td><b>Done</b></td></tr>
    <tr><th colspan=2>Read-only API calls</th></tr>
    <tr><td>convertCurrency</td><td>No Need</td></tr>
    <tr><td>getActiveEventTypes</td><td>Not Done</td></tr>
    <tr><td>getAllCurrencies</td><td>No Need</td></tr>
    <tr><td>getAllCurrenciesV2</td><td>No Need</td></tr>
    <tr><td>getAllEventTypes</td><td>Not Done</td></tr>
    <tr><td>getAllMarkets</td><td><b>Done</b></td></tr>
    <tr><td>getBet</td><td>Not Done</td></tr>
    <tr><td>getBetHistory</td><td>Not Done</td></tr>
</table>

### Session Management API ###

Session Management API is used to open, close and get objects of BetfairSession class. 
There may be multiple sessions at the same time to Betfair using different Betfair accounts. 


Example:
    var betfairSports = require("betfair-sports-api");
    
    // open a session to Betfair API
    var id = betfairSports.openSession("MyLogin", "MyPassword");
    var session = betfairSports.getSession(id);
    
### BetfairSession class ###

not yet written.

    




