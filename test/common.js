// This module contains functions shared by multiple tests
var util = require('util');

// session to use for all the invocations, should be set by test
exports.session = null;

// cookie returned by the login invocation, pretty useless for most of cases
exports.loginCookie = null;

// login to Betfair
exports.login = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par; 

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
exports.logout = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par; 
    
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
exports.getAllMarkets = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par; 

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

        var sortedMarkets = filtered.sort(function(item1, item2) {
            return item1.eventDate - item2.eventDate;
        });
        cb(null, { markets: sortedMarkets} );
    });
}

// Select the distant market to play with
exports.selectMarket = function(data, cb) {
    var markets = data.markets;
    var len = markets.length;
    var market = markets[len - 1];
    console.log('Selected market "%s", "%s"', market.marketId, market.menuPath.replace(
            /\\.*\\/, ''));
    data.market = market;
    cb(null, data);
}

// Emulator helper
// Refresh prices to update emulator state
exports.emulatorGetCompleteMarketPrices = function(data, cb) {
    var mark = data.market;
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
        data.desc = desc;
        cb(null, data);
    });
}

//Emulator helper
//GetMUBets
exports.emulatorGetMUBets = function (data, cb)
{
    var mark = data.market;
    console.log('===== Call getMUBets for marketId="%s" =====', mark.marketId);
    
    var session = exports.session;
    var inv = session.getMUBets("MU", "PLACED_DATE", 200, "ASC", 0, {marketId:mark.marketId});
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:', res
                .duration() / 1000);
        if (err) {
            cb(err);
            return;
        }
        
        console.log( util.inspect(res.result, false, 10) );
        console.log("errorCode:", res.result.errorCode, 
                "recCount", res.result.totalRecordCount );
        
        for(var record in res.result.bets) {
            var bet = res.result.bets[record];
            console.log( "\tbetId=%s betStatus=%s size=%s price=%s",  bet.betId, bet.betStatus, bet.size, bet.price);
        }
            
        cb(null, data);
    });
}

//Emulator helper
//GetCurrentBets
exports.emulatorGetCurrentBets = function (data, cb)
{
    var mark = data.market;
    console.log('===== Call getCurrentBets for marketId="%s" =====', mark.marketId);
    
    var session = exports.session;
    var inv = session.getCurrentBets("M", true, "PLACED_DATE", 200, 0, false, {marketId:mark.marketId});
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:', res
                .duration() / 1000);
        if (err) {
            cb(err);
            return;
        }
        
        console.log( util.inspect(res.result, false, 10) );
        console.log("errorCode:", res.result.errorCode, 
                "recCount", res.result.totalRecordCount );
        
        for(var record in res.result.bets) {
            var bet = res.result.bets[record];
            console.log( "\tbetId=%s betStatus=%s size=%s price=%s",  bet.betId, bet.betStatus, bet.size, bet.price);
        }
            
        cb(null, data);
    });
}

//GetMarketProfitAndLoss
exports.emulatorGetMarketProfitAndLoss = function (data, cb)
{
    var mark = data.market;
    console.log('===== Call getMarketProfitAndLoss for marketId="%s" =====', mark.marketId);
    
    var session = exports.session;
    var inv = session.getMarketProfitAndLoss(mark.marketId, false);
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:', res
                .duration() / 1000);
        if (err) {
            cb(err);
            return;
        }
        
        console.log( util.inspect(res.result, false, 10) );
        console.log("errorCode:", res.result.errorCode);
        
        cb(null, data);
    });
}
