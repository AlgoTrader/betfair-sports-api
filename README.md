# Betfair Sports API for Node.js

## Installation ##

    npm install betfair-sports-api

## Tutorial ##

There is the **[Betfair Sports API for Node.js Tutorial](https://github.com/AlgoTrader/betfair-sports-api/wiki)**
that provides quick and easy start with the library. No Node.js and minimal JavaScript knowledge is required.
**Please note that the tutorial is not finished yet, but is still very good for start.**

## Synopsis ##

### Login to Betfair: ###
    
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

## Betfair Sports API Reference ##

```JavaScript
var betfair = require('betfair-sports-api')
```

includes **betfair-sports-api** functions into current module

### Exported functions ###

Summary:
[newSession](#newSession), [newBetfairPrice](#newBetfairPrice), 
[isBetEmulationEnabled](#isBetEmulationEnabled), [setBetEmulationEnabled](#setBetEmulationEnabled),
[setXmlLoggingEnabled](#setXmlLoggingEnabled), [getInvocationHistory](#getInvocationHistory)

<a name='newSession'>
#### var session = betfair.newSession('login','password'); ####

Creates a new session to Betfair, returns `session` object. Session should not be confused with 
a HTTPS connection, in fact, session uses a pool of HTTPS connections. `newSession` does not connect to Betfair, 
it just creates the `session` object, call the `open` method to issue a *login* invocation.
See the [Session object methods](#sessionObjectMethods) for details.

-----------------------------------------------------------------------------------------------

<a name='newBetfairPrice'>
#### var betPrice = betfair.newBetfairPrice(size); ####

Creates a new Betfair Price object. The Betfair price cannot be of arbitrary size, it should 
be a properly rounded (quantized) value. The newBetfairPrice allows to round price to a valid Betfair value, 
increment and decrement price values. See the [Price object methods](#priceObjectMethods) for details

-----------------------------------------------------------------------------------------------

<a name='sessionObjectMethods'>
### Session object methods ###

Summary: [open](), [close](), [keepAlive]()

#### session.open( function(err, invocation) {...} ); ####

Issue the **login** invocation using *login* and *password* specified in `newSession` and 
call the callback on completion. if `err` is null the **login** invocation was successful, otherwise `err` 
describes error. You should not worry about the security token, it is remembered in `session.header` 
property and used automatically in all the further invacations. Returns nothing.

-----------------------------------------------------------------------------------------------


#### session.close( function(err, invocation) {...} ); ####

Issue the **logout** invocation and call the callback on completion. 
if `err` is null the **logout** invocation was successful, otherwise `err` 
describes error. Returns nothing.

-----------------------------------------------------------------------------------------------


#### var inv = session.keepAlive(); ####

Creates a **keepAlive** invocation object. Use `inv.execute( function(err,inv) {...} )` 
to send the **keepAlive** to server and get its result.

-----------------------------------------------------------------------------------------------

#### var inv = session.getAllMarkets(options) ####

Creates a **getAllMarkets** invocation object. Use `inv.execute( function(err,inv) {...} )` 
to send the **getAllMarkets** to server and get its result. 
The options are:<BR>
- `locale`: String<BR>
    The locale to use when returning results. If not specified, the default 
    locale for the user’s account is used.
- `eventTypeIds`: Array<BR>
    If set, the events types to return. If not specified, markets from all event types are returned.
    For example `[1, 2]` will return only soccer and tennis markets.
- `fromDate`: Date<BR>
    If this is set, the response contains only markets where the market time is not before 
    the specified date. A null value indicated no limit.
- `toDate`: Date<BR>
   If this is set, the response contains only markets where the market time is not after 
   the specified date. A null value indicated no limit. 

-----------------------------------------------------------------------------------------------

#### var inv = session.getMarket(marketId, options); ####

Creates a **getMarket** invocation object for market *marketId*. Use `inv.execute( function(err,inv) {...} )` 
to send the **getMarket** to server and get its result. 
The options are:<BR>
- `locale`: String<BR>
    The locale to use when returning results. If not specified, the default 
    locale for the user’s account is used.
- `includeCouponLinks`: bool<BR>
    If you set this parameter to true, the service response contains a list of any 
    coupons that include the market you have requested. If you set the parameter 
    to false, no coupon data is returned.

-----------------------------------------------------------------------------------------------

#### var inv = session.getMarketPricesCompressed(marketId, options); ####

Creates a **getMarketPricesCompressed** invocation object for market *marketId*. 
Use `inv.execute( function(err,inv) {...} )`  to send the **getMarketPricesCompressed** to server 
and get its result. 
The options are:<BR>
- `currencyCode`: String<BR>
    The three letter ISO 4217 code. If not supplied, user’s currency is used

-----------------------------------------------------------------------------------------------

#### var inv = session.getCompleteMarketPricesCompressed(marketId, options); ####

Creates a **getCompleteMarketPricesCompressed** invocation object for market *marketId*. 
Use `inv.execute( function(err,inv) {...} )`  to send the **getCompleteMarketPricesCompressed** to server 
and get its result. 
The options are:<BR>
- `currencyCode`: String<BR>
    The three letter ISO 4217 code. If not supplied, user’s currency is used

-----------------------------------------------------------------------------------------------

#### var inv = session.getMUBets(betStatus, orderBy, count, sortOrder, startRecord, options); ####

Creates a **getMUBets** invocation object for market *marketId*. 
Use `inv.execute( function(err,inv) {...} )`  to send the **getMUBets** to server 
and get its result. 
The options are:<BR>
- `currencyCode`: String<BR>
    The three letter ISO 4217 code. If not supplied, user’s currency is used

-----------------------------------------------------------------------------------------------

<a name='priceObjectMethods'>
### Price object methods and properties ###

#### price.size ####

The quantized (or rounded) price value.

