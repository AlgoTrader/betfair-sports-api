// This module contains functions shared by multiple tests

// session to use for all the invocations, should be set by test
exports.session = null;         

// cookie returned by the login invocation, pretty useless for most of cases
exports.loginCookie = null;   

// All the markets found by getAllMarkets
exports.markets = [];

// marketId used for tests, it is the most distant 'Match Odds' tennis event from now
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

    // eventTypeIds 1-soccer, 2-tennis
    var inv = session.getAllMarkets({
        eventTypeIds : [ 2 ],
        locale : 'EN'
    });
    inv.execute(function(err, res) {
        console.log('action:', res.action, 'error:', err, 'duration:', res
                .duration() / 1000);
        if (err) {
            cb(err);
            return;
        }
        
        var filtered = res.result.marketData.filter(function(item) {
            item.marketName == 'Match Odds';
        });
        var sorted = filtered.sort(function(item1,item2) { 
            return item1.eventDate - item2.eventDate;
        });
        cb(null, sorted);
    });
}

