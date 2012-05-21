//(C) 2012 Anton Zemlyanov

//This module describes Betfair Global Service SOAP invocations
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//newSession  - opens new Betfair Session

//var util = require("util");
//var events = require("events");
var globalService = require("./betfair_global_service");
var exchangeService = require("./betfair_exchange_service");

exports.newSession = newSession;

function newSession(login, password) {
    return new BetfairSession(login, password);
}

function BetfairSession(login, password, options) {
    var self = this;

    options = options || {};

    this.loginName = login;
    this.password = password;

    this.locationId = options.locationId || "0";
    this.productId = options.productId || "82";
    this.vendorSoftwareId = options.vendorSoftwareId || "0";
}

// expose setCurrentExchange via session
BetfairSession.prototype.setCurrentExchange = exchangeService.setCurrentExchange;

// Open current session
BetfairSession.prototype.open = function(cb) {
    var self = this;
    var login = this.login(this.loginName, this.password, this.locationId,
            this.productId, this.vendorSoftwareId);
    login.execute(function(err, inv) {
        if (err) {
            cb && cb(err, inv);
            return;
        }
        if (inv.result.errorCode !== "OK") {
            cb(inv.result.errorCode, inv);
            return;
        }
        var sessionToken = inv.result.header.sessionToken;
        console.log('Remember new session token');
        self.header = {
            clientStamp : "0",
            sessionToken : sessionToken
        };
        cb && cb(null, inv);
    });
}

// Close current session
BetfairSession.prototype.close = function(cb) {
    var self = this;
    
    console.log('Closing session');
    var logout = this.logout();
    logout.execute(function(err, inv) {
        if (err) {
            cb && cb(err, inv);
            return;
        }
        self.header = undefined;
        cb && cb(null, inv);
    });
}

BetfairSession.prototype.updateSessionToken = function(result) {
    var oldSessionToken = self.header && self.header.sessionToken;
    var newSessionToken = result.header && result.header.sessionToken;
    if(oldSessionToken && oldSessionToken !== newSessionToken) {
        console.log('========== Changing session token ==========');
        self.header.sessionToken = newSessionToken;
    }
    return;
}


// ----------------------------------------------------------------------
// Betfair Global Service
// ----------------------------------------------------------------------

// login invocation
BetfairSession.prototype.login = function(login, password, locationId, productId,
        vendorSoftwareId) {
    var request = {
        locationId : locationId,
        password : password,
        productId : productId,
        username : login,
        vendorSoftwareId : vendorSoftwareId
    };

    var inv = globalService.login(request);
    inv.session = this;
    return inv;
}

// logout invocation
BetfairSession.prototype.logout = function() {
    var request = {
        header : this.header
    };

    var inv = globalService.logout(request);
    inv.session = this;
    return inv;
}

// keepAlive invocation
BetfairSession.prototype.keepAlive = function() {
    var request = {
        header : this.header
    };

    var inv = globalService.keepAlive(request);
    inv.session = this;
    return inv;
}

// ----------------------------------------------------------------------
// Betfair Exchange Service - Readonly invocations
// ----------------------------------------------------------------------

// getAllMarkets invocation
BetfairSession.prototype.getAllMarkets = function(options) {
    options = options || {};
    var request = {
        header : this.header
    };
    // locale
    if (options.locale)
        request.locale = options.locale;
    // eventTypeIds
    if (options.eventTypeIds instanceof Array) {
        request.eventTypeIds = [ 'int' ].concat(options.eventTypeIds);
    }
    // countries
    if (options.contries instanceof Array) {
        request.countries = [ 'country' ].concat(options.countries);
    }
    // fromDate
    if (options.fromDate)
        request.fromDate = options.fromDate;
    // toDate
    if (options.toDate)
        request.toDate = options.toDate;

    var inv = exchangeService.getAllMarkets(request);
    inv.session = this;
    return inv;
}

// getMarket invocation
BetfairSession.prototype.getMarket = function(marketId, options) {
    options = options || {};
    var request = {
        header : this.header,
        marketId : marketId
    };
    // locale
    if (options.locale)
        request.locale = options.locale;
    // includeCouponLinks
    if (options.includeCouponLinks)
        request.includeCouponLinks = options.includeCouponLinks;

    var inv = exchangeService.getMarket(request);
    inv.session = this;
    return inv;
}

// getMarketPricesCompressed invocation
BetfairSession.prototype.getMarketPricesCompressed = function(marketId, options) {
    options = options || {};
    var request = {
        header : this.header,
        marketId : marketId
    };
    // currencyCode
    if (options.currencyCode)
        request.currencyCode = options.currencyCode;

    var inv = exchangeService.getMarketPricesCompressed(request);
    inv.session = this;
    return inv;
}

// getCompleteMarketPricesCompressed invocation
BetfairSession.prototype.getCompleteMarketPricesCompressed = function(marketId, options) {
    options = options || {};
    var request = {
        header : this.header,
        marketId : marketId
    };
    // currencyCode
    if (options.currencyCode)
        request.currencyCode = options.currencyCode;

    var inv = exchangeService.getCompleteMarketPricesCompressed(request);
    inv.session = this;
    return inv;
}

// getMUBets invocation
BetfairSession.prototype.getMUBets = function(betStatus, orderBy, count, sortOrder,
        startRecord, options) {
    options = options || {};
    // params verification
    if (betStatus != "M" && betStatus != "U" && betStatus != "MU")
        throw "Invalid value of betStatus";
    if (count > 200)
        throw "Count is too big";
    if (orderBy != "NONE" && orderBy != "BET_ID" && orderBy != "PLACED_DATE"
            && orderBy != "MATCHED_DATE")
        throw "Invalid value of orderBy";
    if (sortOrder != "ASC" && sortOrder != "DESC")
        throw "Invalid value of sortOrder";

    var request = {
        header : this.header,
        betStatus : betStatus,
        orderBy : orderBy,
        count : count,
        sortOrder : sortOrder,
        startRecord : startRecord
    };
    // betIds
    if (options.betIds instanceof Array) {
        request.eventTypeIds = [ 'int' ].concat(options.betIds);
    }
    // excludeLastSecond
    if (options.excludeLastSecond)
        request.excludeLastSecond = options.excludeLastSecond;
    // marketId
    if (options.marketId)
        request.marketId = options.marketId;
    // matchedSince
    if (options.matchedSince)
        request.matchedSince = options.matchedSince;

    var inv = exchangeService.getMUBets(request);
    inv.session = this;
    return inv;
}

// getMarketTradedVolumeCompressed invocation
BetfairSession.prototype.getMarketTradedVolumeCompressed = function(marketId, options) {
    options = options || {};

    var request = {
        header : this.header,
        marketId : marketId
    };
    // currencyCode
    if (options.currencyCode)
        request.currencyCode = options.currencyCode;

    var inv = exchangeService.getMarketTradedVolumeCompressed(request);
    inv.session = this;
    return inv;
}

// getMarketProfitAndLoss invocation
BetfairSession.prototype.getMarketProfitAndLoss = function(marketId, includeBspBets,
        options) {
    options = options || {};

    // *********** marketID, not marketId ***********
    var request = {
        header : this.header,
        marketID : marketId
    };
    // locale
    if (options.locale)
        request.locale = options.locale;
    // includeSettledBets
    if (options.includeSettledBets)
        request.includeSettledBets = options.includeSettledBets;
    // netOfCommission
    if (options.netOfCommission)
        request.netOfCommission = options.netOfCommission;

    var inv = exchangeService.getMarketProfitAndLoss(request);
    inv.session = this;
    return inv;
}

// ----------------------------------------------------------------------
// Betfair Exchange Service - Betting invocations
// ----------------------------------------------------------------------

// placeBets invocation
BetfairSession.prototype.placeBets = function(betsList) {
    var request = {
        header : this.header,
        bets : [ 'PlaceBets' ].concat(betsList)
    };

    // console.log(request);
    var inv = exchangeService.placeBets(request);
    inv.session = this;
    return inv;
}

// updateBets invocation
BetfairSession.prototype.updateBets = function(betsList) {
    var request = {
        header : this.header,
        bets : [ 'UpdateBets' ].concat(betsList)
    };

    var inv = exchangeService.updateBets(request);
    inv.session = this;
    return inv;
}

// cancelBets invocation
BetfairSession.prototype.cancelBets = function(betsList) {
    var request = {
        header : this.header,
        bets : [ 'CancelBets' ].concat(betsList)
    };

    var inv = exchangeService.cancelBets(request);
    inv.session = this;
    return inv;
}

// getAccountFinds invocation
BetfairSession.prototype.getAccountFunds = function() {
    var request = {
        header : this.header
    };

    var inv = exchangeService.getAccountFunds(request);
    inv.session = this;
    return inv;
}
