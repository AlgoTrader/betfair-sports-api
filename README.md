Betfair Sports API for Node.js
===========================

**Warning: Please do not use, it is unusable yet**

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

<table>
    <tr>
        <th>API call</th>
    </tr>
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

    




