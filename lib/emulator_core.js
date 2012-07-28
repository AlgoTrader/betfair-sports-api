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
Emulator.prototype.handleGetMUBets = function(req, res) {
    throw new Error('Not yet implemented');
}

// Process getCurrentBets API call
Emulator.prototype.handleGetCurrentBets = function(req, res) {
    throw new Error('Not yet implemented');
}

// Process placeBets API call
Emulator.prototype.handlePlaceBets = function(req, res) {
    var self = this;

    // parse incoming XML
    req.request = decoder.decode(req.xmlRequestBody);

    // response
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
    if (!marketId || !self.markets[marketId]) {
        // serialize response
        res.xmlResponseBody = encoder.encode(res.action, res.response);
        return;
    }

    // serialize response
    res.xmlResponseBody = encoder.encode(res.action, res.response);

    return;
}

// Process cancelBets API call
Emulator.prototype.handleCancelBets = function(req, res) {
    throw new Error('Not yet implemented');
}

// Process updateBets API call
Emulator.prototype.handleUpdateBets = function(req, res) {
    throw new Error('Not yet implemented');
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
