Betfair Sports API for Node.js
===========================

**Warning: The betfair-sports-api is pretty usable not but not tested in production**<br>
email: anton.zem at google mail

###Installation###

    npm install betfair-sports-api

###Synopsis###

Examples of what betfair-sports-api for Node.js looks like:

####Logging in to Betfair:####
    
    var betfair = require('betfair-sports-api');
    var login = 'nobody';
    var password = 'password';

    var session = betfair.newSession(login, password);
    session.open(function (err, res) {
        console.log( !err ? "Login OK" : "Login error"); 
    }

####Placing a bet:####

    var bet = { 
                asianLineId: "0",
                betCategoryType: "E",
                betPersistenceType: "NONE",
                betType: "L",
                bspLiability: "0",
                marketId: "1234567890",
                price: "1.01",
                selectionId: "123456",
                size: "5.00"
    }
    var inv = session.placeBets([bet]);
    inv.execute(function(err, res) {
        console.log( !err ? "Bet placed OK" : "Bet place error"); 
    }


####Logging out from Betfair:####

    session.close(function(err, res) {
        console.log( !err ? "Logout OK" : "Logout error"); 
    });
 
API
---

###Session management API calls###

First Header  | Second Header
------------- | -------------
Content Cell  | Content Cell
Content Cell  | Content Cell

###Readonly API calls###

    




