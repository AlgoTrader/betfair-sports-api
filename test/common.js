// This module contains functions shared by multiple tests

// Betfair session
exports.session = null;

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
        session.loginCookie = res.responseCookie;
        cb(err, res.result.errorCode);
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
        cb(err, res.result.errorCode);
    });
}
