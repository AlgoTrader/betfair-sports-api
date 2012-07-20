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

function Emulator() {
    var self = this;
    self.markets = {};
}

// Feed market prices to emulator
Emulator.prototype.onGetCompleteMarketPricesCompressed = function(result) {
    throw new Error('Not yet implemented');
}

// Feed market prices to emulator
Emulator.prototype.onGetMarketPricesCompressed = function(result) {
    throw new Error('Not yet implemented');
}

// Feed market traded volumes to emulator
Emulator.prototype.onGetMarketTradedVolumeCompressed = function(result) {
    throw new Error('Not yet implemented');
}

// Feed market traded volumes to emulator
Emulator.prototype.onGetMarketTradedVolume = function(result) {
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
    throw new Error('Not yet implemented');
}

// Process cancelBets API call
Emulator.prototype.handleCancelBets = function(req, res) {
    throw new Error('Not yet implemented');
}

// Process updateBets API call
Emulator.prototype.handleUpdateBets = function(req, res) {
    throw new Error('Not yet implemented');
}

// Emulator is a singleton object
module.exports = new Emulator();
