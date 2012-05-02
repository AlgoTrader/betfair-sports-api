# Betfair Sports API for Node.js

## Installation ##

    npm install betfair-sports-api

## Synopsis ##

Examples of what betfair-sports-api for Node.js looks like:

### Logging in to Betfair: ###
    
```JavaScript
var betfair = require('betfair-sports-api');
var login = 'nobody';
var password = 'password';

var session = betfair.newSession(login, password);
session.open(function (err, res) {
    console.log( !err ? "Login OK" : "Login error"); 
}
```

### Placing a bet: ###

```JavaScript
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
};
var inv = session.placeBets( [bet] );
inv.execute(function(err, res) {
    console.log( !err ? "Bet placed OK" : "Bet place error"); 
}
```

### Logging out from Betfair: ###

```JavaScript
session.close(function(err, res) {
    console.log( !err ? "Logout OK" : "Logout error"); 
});
```

## Betfair Sports API Reference ##

```JavaScript
var betfair = require('betfair-sports-api')
```

includes **betfair-sports-api** functions into current module

### Create a new session to Betfair ###

```JavaScript
var session = betfair.newSession('login','password');
```
Creates a new session to Betfair, returns `session` object. Session should not be confused with 
a HTTPS connection, in fact, session uses a pool of HTTPS connections. `newSession` does not connect to Betfair, 
it just creates the `session` object, call the `open` method to issue a *login* invocation.

### Session object methods ###

```JavaScript
session.open( function(err, invocation) {...} );
```
Issue the **login** invocation using *login* and *password* specified in `newSession` and 
call the callback on completion. if `err` is null the **login** invocation was successful, otherwise `err` 
describes error. You should not worry about the security token, it is remembered in `session.header` 
property and used automatically in all the further invacations. Returns nothing.


```JavaScript
session.close( function(err, invocation) {...} );
```
Issue the **logout** invocation and call the callback on completion. 
if `err` is null the **logout** invocation was successful, otherwise `err` 
describes error. Returns nothing.


```JavaScript
var inv = session.keepAlive();
```
Creates a **keepAlive** invocation object. Use `inv.execute( function(err,inv) {...} )` 
to send the **keepAlive** to server and get its result.


```JavaScript
var inv = session.getAllMarkets(options)
```
Creates a **getAllMarkets** invocation object. Use `inv.execute( function(err,inv) {...} )` 
to send the **getAllMarkets** to server and get its result. The options are:<BR>
- `locale`: String
    The locale to use when returning results. If not specified, the default 
    locale for the user’s account is used.
- `eventTypeIds`: Array
    If set, the events types to return. If not specified, markets from all event types are returned.
    For example `[1, 2]` will return only soccer and tennis markets.
- `fromDate`: Date
    If this is set, the response contains only markets where the market time is not before 
    the specified date. A null value indicated no limit.
- `toDate`: Date
   If this is set, the response contains only markets where the market time is not after 
   the specified date. A null value indicated no limit. 


```JavaScript
var inv = session.getMarket(marketId, options);
```
Creates a **getMarket** invocation object for market *marketId*. Use `inv.execute( function(err,inv) {...} )` 
to send the **getMarket** to server and get its result. The options are:<BR>
- `locale`: String
    The locale to use when returning results. If not specified, the default 
    locale for the user’s account is used.
- `includeCouponLinks`: bool
    If you set this parameter to true, the service response contains a list of any 
    coupons that include the market you have requested. If you set the parameter 
    to false, no coupon data is returned.

