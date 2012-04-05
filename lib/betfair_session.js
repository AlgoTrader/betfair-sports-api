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

function BetfairSession(login, password) {
    var self = this;
    this.loginName = login;
    this.password = password;
}

// Open current session
BetfairSession.prototype.open = function(cb) {
    var self = this;
    var login = this.login(this.loginName, this.password, "0", "82", "0");
    login.execute(function(err, inv) {
        if (err) {
            cb(err, inv);
            return;
        }
        var sessionToken = inv.result.header.sessionToken;
        console.log("Session token is:", '[skipped]');
        self.header = {
            clientStamp : "0",
            sessionToken : sessionToken
        };
        if(inv.result.errorCode==="OK") {
            cb(null, inv);
            return;
        }
        cb(inv.result.errorCode, null);
    });
}

// Close current session
BetfairSession.prototype.close = function(cb) {
    var self = this;
    var logout = this.logout();
    logout.execute(function(err, inv) {
        if (err) {
            cb(err, inv);
            return;
        }
        self.header = undefined;
        cb(null, inv);
    });
}

// ----------------------------------------------------------------------
// Betfair Global Service
// ----------------------------------------------------------------------

// login invocation
BetfairSession.prototype.login = function(login, password, locationId,
        productId, vendorSoftwareId) {
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
BetfairSession.prototype.getAllMarkets = function(optional) {
    var request = {
        header : this.header
    };
    // locale
    if (optional && optional.locale)
        request.locale = optional.locale;
    // eventTypeIds
    if (optional && optional.eventTypeIds instanceof Array) {
        request.eventTypeIds = [ 'int' ].concat(optional.eventTypeIds);
    }
    // countries
    if (optional && optional.contries instanceof Array) {
        request.countries = [ 'country' ].concat(optional.countries);
    }
    // fromDate
    if (optional && optional.fromDate)
        request.fromDate = optional.fromDate;
    // toDate
    if (optional && optional.toDate)
        request.toDate = optional.toDate;

    var inv = exchangeService.getAllMarkets(request);
    inv.session = this;
    return inv;
}

// getMarket invocation
BetfairSession.prototype.getMarket = function(marketId, optional) {
    var request = {
        header : this.header,
        marketId : marketId
    };
    // locale
    if (optional && optional.locale)
        request.locale = optional.locale;
    // includeCouponLinks
    if (optional && optional.includeCouponLinks)
        request.includeCouponLinks = optional.includeCouponLinks;

    var inv = exchangeService.getMarket(request);
    inv.session = this;
    return inv;
}

// getMarketPricesCompressed invocation
BetfairSession.prototype.getMarketPricesCompressed = function(marketId,
        optional) {
    var request = {
        header : this.header,
        marketId : marketId
    };
    // currencyCode
    if (optional && optional.currencyCode)
        request.currencyCode = optional.currencyCode;

    var inv = exchangeService.getMarketPricesCompressed(request);
    inv.session = this;
    return inv;
}

// getCompleteMarketPricesCompressed invocation
BetfairSession.prototype.getCompleteMarketPricesCompressed = function(marketId,
        optional) {
    var request = {
        header : this.header,
        marketId : marketId
    };
    // currencyCode
    if (optional && optional.currencyCode)
        request.currencyCode = optional.currencyCode;

    var inv = exchangeService.getCompleteMarketPricesCompressed(request);
    inv.session = this;
    return inv;
}

// getMUBets invocation
BetfairSession.prototype.getMUBets = function(betStatus, orderBy, count,
        sortOrder, startRecord, optional) {
    // params verification
    if(betStatus!="M" && betStatus!="U" && betStatus!="MU")
        throw "Invalid value of betStatus";
    if(count>200)
        throw "Count is too big";
    if(orderBy!="NONE" && orderBy!="BET_ID" && orderBy!="PLACED_DATE" && orderBy!="MATCHED_DATE")
        throw "Invalid value of orderBy";
    if(sortOrder!="ASC" && sortOrder!="DESC")
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
    if (optional && optional.betIds instanceof Array) {
        request.eventTypeIds = [ 'int' ].concat(optional.betIds);
    }
    // excludeLastSecond
    if (optional && optional.excludeLastSecond)
        request.excludeLastSecond = optional.excludeLastSecond;
    // marketId
    if (optional && optional.marketId)
        request.marketId = optional.marketId;
    // matchedSince
    if (optional && optional.matchedSince)
        request.matchedSince = optional.matchedSince;

    var inv = exchangeService.getMUBets(request);
    inv.session = this;
    return inv;
}

// getMarketTradedVolumeCompressed invocation
BetfairSession.prototype.getMarketTradedVolumeCompressed = function(marketId,
        optional) {
    var request = {
        header : this.header,
        marketId : marketId
    };
    // currencyCode
    if (optional && optional.currencyCode)
        request.currencyCode = optional.currencyCode;

    var inv = exchangeService.getMarketTradedVolumeCompressed(request);
    inv.session = this;
    return inv;
}

// getMarketProfitAndLoss invocation
BetfairSession.prototype.getMarketProfitAndLoss = function(marketId, includeBspBets,
        optional) {
    // *********** marketID, not marketId ***********
    var request = {
        header : this.header,
        marketID : marketId
    };
    // locale
    if (optional && optional.locale)
        request.locale = optional.locale;
    // includeSettledBets
    if (optional && optional.includeSettledBets)
        request.includeSettledBets = optional.includeSettledBets;
    // netOfCommission
    if (optional && optional.netOfCommission)
        request.netOfCommission = optional.netOfCommission;

    var inv = exchangeService.getMarketProfitAndLoss(request);
    inv.session = this;
    return inv;
}

//----------------------------------------------------------------------
//Betfair Exchange Service - Betting invocations
//----------------------------------------------------------------------

//placeBets invocation
BetfairSession.prototype.placeBets = function(betsList) {
    var request = {
        header : this.header,
        bets : ['PlaceBets'].concat(betsList)
    };
    
    //console.log(request);
    var inv = exchangeService.placeBets(request);
    inv.session = this;
    return inv;
}

//updateBets invocation
BetfairSession.prototype.updateBets = function(betsList) {
    var request = {
        header : this.header,
        bets : ['UpdateBets'].concat(betsList)
    };

    var inv = exchangeService.updateBets(request);
    inv.session = this;
    return inv;
}

//cancelBets invocation
BetfairSession.prototype.cancelBets = function(betsList) {
    var request = {
        header : this.header,
        bets : ['CancelBets'].concat(betsList)
    };

    var inv = exchangeService.cancelBets(request);
    inv.session = this;
    return inv;
}
