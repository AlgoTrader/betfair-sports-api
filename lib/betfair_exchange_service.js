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
exports.setCurentExchange = function(ex) {
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

//getMUBets invocation
exports.getMUBets = function(request) {
    return betfairInvocation.invocation(currentService, "getMUBets", request);
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
