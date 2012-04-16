Betfair Sports API for Node.js
===========================

**Warning: The betfair-sports-api is pretty usable not but not tested in production**<br>
email: anton.zem at google mail

###Installation###

    npm install betfair-sports-api

###Synopsis###

Examples of what betfair-sports-api for Node.js looks like:

####Logging in to Betfair:####
    
    var betfairSport = require('betfair-sports-api');
    var login = 'nobody';
    var password = 'password';

    var session = betfairSport.openSession(login, password);
    session.open(function onLoginFinished(err, res) {
        if (err) 
            console.log('Login error:', err);
        else
            console.log('Logged in OK');
    }

Placing a bet:

Logging out from Betfair:

    session.close(function(err, res) {
        if(err)
            console.log('Logout error:',err);
        else
            console.log('Logged out OK');
    });
 
API
---

###Session management API calls###
<a href=#>login</a> 
<a href=#>logout</a> 
<a href=#>keepAlive</a>

###Readonly API calls###
<a href=#>getAllMarkets</a>
<a href=#>getMarket</a>
<a href=#>getMarketPricesCompressed</a>
<a href=#>getCompleteMarketPricesCompressed</a>

    




