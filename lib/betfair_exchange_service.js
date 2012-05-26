//(C) 2012 Anton Zemlyanov

//This module describes Betfair Exchange Service SOAP invocations
//see Sports API documentation on http://bdp.betfair.com

//The exchange services are those that enable you to place your bets
//as conveniently and quickly as possible. They include the services 
//for viewing betting markets, placing, updating and cancelling bets, 
//viewing your betting history, and checking your available funds 
//and account statement. 

var betfairInvocation = require("./betfair_invocation.js");
var currentService = betfairInvocation.services.uk_exchange;

//set current exchange service
exports.setCurrentExchange = function(ex) {
    switch (ex) {
    case 'uk':
        currentService = betfairInvocation.services.uk_exchange;
        break;
    case 'aus':
        currentService = betfairInvocation.services.aus_exchange;
        break;
    default:
        throw "bad exchange";
    }
}

//getAllMarkets invocation
exports.getAllMarkets = function(request) {
    return betfairInvocation.invocation(currentService, "getAllMarkets",
            request);
}

//getMarket invocation
exports.getMarket = function(request) {
    return betfairInvocation.invocation(currentService, "getMarket", request);
}

//getMarketPricesCompressed invocation
exports.getMarketPricesCompressed = function(request) {
    return betfairInvocation.invocation(currentService,
            "getMarketPricesCompressed", request);
}

//getCompleteMarketPricesCompressed invocation
exports.getCompleteMarketPricesCompressed = function(request) {
    return betfairInvocation.invocation(currentService,
            "getCompleteMarketPricesCompressed", request);
}

//getCurrentBets invocation
exports.getCurrentBets = function(request) {
    return betfairInvocation.invocation(currentService, "getCurrentBets", request);
}

//getCurrentBetsLite invocation
exports.getCurrentBetsLite = function(request) {
    return betfairInvocation.invocation(currentService, "getCurrentBetsLite", request);
}

//getMUBets invocation
exports.getMUBets = function(request) {
    return betfairInvocation.invocation(currentService, "getMUBets", request);
}

//getMUBetsLite invocation
//Secret invocation not described in current API doc 
exports.getMUBetsLite = function(request) {
    return betfairInvocation.invocation(currentService, "getMUBetsLite", request);
}

//getMarketTradedVolume invocation
exports.getMarketTradedVolume = function(request) {
    return betfairInvocation.invocation(currentService,
            "getMarketTradedVolume", request);
}

//getMarketTradedVolumeCompressed invocation
exports.getMarketTradedVolumeCompressed = function(request) {
    return betfairInvocation.invocation(currentService,
            "getMarketTradedVolumeCompressed", request);
}

//getMarketProfitAndLoss invocation
exports.getMarketProfitAndLoss = function(request) {
    return betfairInvocation.invocation(currentService,
            "getMarketProfitAndLoss", request);
}

//placeBets invocation
exports.placeBets = function(request) {
    return betfairInvocation.invocation(currentService,
            "placeBets", request);
}

//updateBets invocation
exports.updateBets = function(request) {
    return betfairInvocation.invocation(currentService,
            "updateBets", request);
}

//cancelBets invocation
exports.cancelBets = function(request) {
    return betfairInvocation.invocation(currentService,
            "cancelBets", request);
}

//getAccountFunds invocation
exports.getAccountFunds = function(request) {
    return betfairInvocation.invocation(currentService,
            "getAccountFunds", request);
}
