// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The following API calls are intercepted in emulator mode
// read-only
//   - getMUBets
//   - getCurrentBets
// transactional
//   - placeBets
//   - cancelBets
//   - updateBets

var decoder = require('./emulator_decoder');
var encoder = require('./emulator_encoder');

var EmulatorMarket = require('./emulator_market');

function Emulator() {
    var self = this;
    self.markets = {};
}

// Feed market prices to emulator
Emulator.prototype.onGetCompleteMarketPricesCompressed = function(result) {
    var self = this;
    
    if(result.errorCode!=='OK') 
        return false;
    
    var completePrices = result.completeMarketPrices || {};
    var marketId = completePrices.marketId;
    if(!marketId)
        return false;
    
    var emulatorMarket = self.markets[marketId];
    if(!emulatorMarket) {
        var emulatorMarket = new EmulatorMarket(marketId);
        self.markets[marketId] = emulatorMarket;
    }
    
    // dispatch call result to apropriate market
    return emulatorMarket.onGetCompleteMarketPricesCompressed(result);
}

// Feed market prices to emulator
Emulator.prototype.onGetMarketPricesCompressed = function(result) {
    var self = this;

    if(result.errorCode!=='OK') 
        return false;
    
    var prices = result.marketPrices || {};
    var marketId = prices.marketId;
    if(!marketId)
        return false;
    
    var emulatorMarket = self.markets[marketId];
    if(!emulatorMarket) {
        var emulatorMarket = new EmulatorMarket(marketId);
        self.markets[marketId] = emulatorMarket;
    }
    
    // dispatch call result to apropriate market
    return emulatorMarket.onGetMarketPricesCompressed(result);
}

// Feed market traded volumes to emulator
Emulator.prototype.onGetMarketTradedVolumeCompressed = function(result) {
    var self = this;

    if(result.errorCode!=='OK') 
        return false;
    
    var marketId = result.marketId;
    if(!marketId)
        return false;
    
    var emulatorMarket = self.markets[marketId];
    if(!emulatorMarket) {
        var emulatorMarket = new EmulatorMarket(marketId);
        self.markets[marketId] = emulatorMarket;
    }
    
    // dispatch call result to apropriate market
    return emulatorMarket.onGetMarketTradedVolumeCompressed(result);
}

// Feed market traded volumes to emulator
Emulator.prototype.onGetMarketTradedVolume = function(result) {
    var self = this;

    // the problem is there is no marketId and selectionId in getTradedVolume response
    // it is unlikely the call would be ever supported 
    throw new Error('Not yet implemented');
}

// Process getMUBets API call
Emulator.prototype.handleGetMUBets = function(req, res, cb) {
    var self = this;

    // parse incoming XML
    req.request = decoder.decode(req.xmlRequestBody);
    
    // default response
    res.response = {
        errorCode : 'NO_RESULT',
        minorErrorCode : null,
        bets : null
    };
    setResponseHeader(req.request, res.response);

    // check marketId
    // Currently only getMUBets with marketId is supported, otherwise 5x weight is applied by Betfair
    // Where market ID = 0 the weighting is 5. Four requests in a second would not incur a charge,
    // a 5th request in the same second would be charged at 0.5p.
    var marketId = req.request.marketId;
    if (!marketId || !self.markets[marketId]) {
        // no market in emulator
        res.response.errorCode = 'INVALID_MARKET_ID';
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null, res);
        return;
    }
    
    // handle invocation
    var market = self.markets[marketId];
    market.handleGetMUBets(req, res, function(err, res) {
        // serialize response
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null,res);
    });
    return;
}

// Process getCurrentBets API call
Emulator.prototype.handleGetCurrentBets = function(req, res, cb) {
    var self = this;

    // parse incoming XML
    req.request = decoder.decode(req.xmlRequestBody);
    
    // default response
    res.response = {
        errorCode : 'NO_RESULT',
        minorErrorCode : null,
        bets : null
    };
    setResponseHeader(req.request, res.response);

    // check marketId
    // Currently only getCurrentBets with marketId is supported, otherwise 5x weight is applied by Betfair
    // Where market ID = 0 the weighting is 5. Four requests in a second would not incur a charge,
    // a 5th request in the same second would be charged at 0.5p.
    var marketId = req.request.marketId;
    if (!marketId || !self.markets[marketId]) {
        // no market in emulator
        res.response.errorCode = 'INVALID_MARKET_ID';
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null, res);
        return;
    }
    
    // handle invocation
    var market = self.markets[marketId];
    market.handleGetCurrentBets(req, res, function(err, res) {
        // serialize response
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null,res);
    });
    return;
}

//Process getCurrentBets API call
Emulator.prototype.handleGetMarketProfitAndLoss = function(req, res, cb) {
    var self = this;

    // parse incoming XML
    req.request = decoder.decode(req.xmlRequestBody);
    
    // default response
    res.response = {
        errorCode : 'INVALID_MARKET',
        minorErrorCode : null,
        annotations : null,
        commissionApplied: 0,
        currencyCode: 'USD', // get from prices later, for now USD
        includesSettledBets: false,
        includesBspBets: false,
        marketId: req.request.marketId || '0',
        marketName: "Emulated Market "+ (req.request.marketId || '0'),
        marketStatus: "INVALID",
        unit: "N/A"
    };
    setResponseHeader(req.request, res.response);

    // check marketId
    var marketId = req.request.marketId;
    if (!marketId || !self.markets[marketId]) {
        // no market in emulator
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null, res);
        return;
    }
    
    // handle invocation
    var market = self.markets[marketId];
    market.handleGetCurrentBets(req, res, function(err, res) {
        // serialize response
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null,res);
    });
    return;
}

// Process placeBets API call
Emulator.prototype.handlePlaceBets = function(req, res, cb) {
    var self = this;

    // parse incoming XML
    req.request = decoder.decode(req.xmlRequestBody);

    // default response
    res.response = {
        errorCode : 'INVALID_MARKET',
        minorErrorCode : null,
        betResults : null
    };
    setResponseHeader(req.request, res.response);
    
    // ensure all the bets have the same marketId
    var marketIds = req.request.bets.map(function(item) {
        return item.marketId;
    });
    var marketId = marketIds.reduce(function(item1, item2) {
        return item1 === item2 ? item1 : null;
    });
    if (!marketId) {
        // different marketIds
        res.response.errorCode = 'DIFFERING_MARKETS';
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null,res);
        return;
    }
    if (!self.markets[marketId]) {
        // no market in emulator
        res.response.errorCode = 'INVALID_MARKET';
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null,res);
        return;
    }
    
    // handle invocation
    var market = self.markets[marketId];
    market.handlePlaceBets(req, res, function(err, res) {
        // serialize response
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        cb(null,res);
    });
    return;
}

// Process updateBets API call
Emulator.prototype.handleUpdateBets = function(req, res, cb) {
    var self = this;

    // parse incoming XML
    req.request = decoder.decode(req.xmlRequestBody);

    // default response
    res.response = {
        errorCode : 'INVALID_MARKET',
        minorErrorCode : null,
        betResults : null
    };
    setResponseHeader(req.request, res.response);
    
    // just SOAP Fault for now
    res.response.soapFault = true;
    res.xmlResponseBody = encoder.encode(res.action, res.response);
    cb(null,res);
    
    return;
}

//Process cancelBets API call
Emulator.prototype.handleCancelBets = function(req, res, cb) {
    var self = this;

    // parse incoming XML
    req.request = decoder.decode(req.xmlRequestBody);

    // default response
    res.response = {
        errorCode : 'INVALID_MARKET',
        minorErrorCode : null,
        betResults : null
    };
    setResponseHeader(req.request, res.response);
    
    // just SOAP Fault for now
    res.response.soapFault = true;
    res.xmlResponseBody = encoder.encode(res.action, res.response);
    cb(null,res);
    
    return;
}

// handle header
function setResponseHeader(req, res) {
    res.header = {
        errorCode : "OK",
        minorErrorCode : null,
        sessionToken : req.header.sessionToken,
        timestamp : new Date()
    };
    return;
}

// Emulator is a singleton object
module.exports = new Emulator();
