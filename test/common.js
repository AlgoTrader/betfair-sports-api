// This module contains functions shared by multiple tests

// session to use for all the invocations, should be set by test
exports.session = null;

// cookie returned by the login invocation, pretty useless for most of cases
exports.loginCookie = null;

// All the markets found by getAllMarkets
exports.markets = [];

// marketId used for tests, it is the most distant 'Match Odds' tennis event
// from now
// the most distant match is a safe place for placing and canceling bets
exports.marketId = null;

// login to Betfair
exports.login = function(cb) {
    console.log('===== Logging in to Betfair =====');
    var session = exports.session;
    session.open(function(err, res) {
        if (err) {
            console.log('Login error', err);
        } else {
            console.log('Login OK');
        }
        exports.loginCookie = res.responseCookie;
        cb(err);
    });
}

// logout from Betfair
exports.logout = function(cb) {
    console.log('===== Logging out... =====');
    var session = exports.session;
    session.close(function(err, res) {
        if (err) {
            console.log('Logout error', err);
        } else {
            console.log('Logout OK');
        }
        cb(err);
    });
}

// invoke getAllMArkets for tennis events
exports.getAllMarkets = function(cb) {
    console.log('===== Get available tennis matches =====');
    var session = exports.session;

    // eventTypeIds 1-soccer, 2-tennis
    var inv = session.getAllMarkets({
        eventTypeIds : [ 2 ],
        locale : 'EN'
    });
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:', res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        // console.log(res.result.marketData);
        var filtered = res.result.marketData.filter(function(item) {
            return item.marketName === 'Match Odds';
        });
        console.log('There are %d markets after filtering', filtered.length);

        var sorted = filtered.sort(function(item1, item2) {
            return item1.eventDate - item2.eventDate;
        });
        cb(null, sorted);
    });
}

// Select the distant market to play with
exports.selectMarket = function(markets, cb) {
    var len = markets.length;
    var market = markets[len - 1];
    console.log('Selected market "%s", "%s"', market.marketId, market.menuPath.replace(
            /\\.*\\/, ''));
    cb(null, markets[len - 1]);
}

exports.emulatorGetCompleteMarketPrices = function(mark, cb) {
    console.log('===== Call getCompleteMarketPricesCompressed for marketId="%s" =====',
            mark.marketId);
    var session = exports.session;

    var inv = session.getCompleteMarketPricesCompressed(mark.marketId);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err,
                'duration:', res.duration() / 1000);
        if (err) {
            cb(err);
            return;
        }

        //console.log(util.inspect(res.result, false, 10));

        var desc = { marketId : mark.marketId };
        var market = res.result.completeMarketPrices;
        console.log("marketId:", market.marketId);
        console.log("inPlayDelay:", market.inPlayDelay);
        // print players info
        for ( var playerIndex = 0; playerIndex < market.runners.length; ++playerIndex) {
            console.log("player %s", playerIndex);
            var runner = market.runners[playerIndex];
            if(playerIndex==0)
                desc.selectionId = runner.selectionId;
            console.log("\tselectionId:", runner.selectionId);
            console.log("\tlastPriceMatched:", runner.lastPriceMatched);
            console.log("\ttotalMatched:", runner.totalMatched);
            for(var priceIndex = 0; priceIndex< runner.prices.length; ++priceIndex) {
                var price = runner.prices[priceIndex];
                console.log("\t\tprice:%s backAmount:%s layAmount:%s", 
                        price.price, price.backAmount, price.layAmount);
            }
        }
        cb(null, desc);
    });
}
