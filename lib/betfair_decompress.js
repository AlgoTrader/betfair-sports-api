//(C) 2012 Anton Zemlyanov

//This module "decompresses" several specific SOAP invocations
//see Sports API documentation on http://bdp.betfair.com

//"Compression" word here has nothing common with zlib or other compression lib
//it is a compact XML representation of bulk Betfair data.
//Example: 
//:20158165~Match Odds~O~ACTIVE~1164223800000~\Soccer\Scottish Soccer\Bells League Div 1\Fixtures 22 November \Partick v Clyde~
///1/2695886/610072/10551708/10551709/20158165~0~1~GBR~1164192924479~3~1~8737.44~N~N:

//Exported properties:
//decompressGetAllMarkets                     - decode getAllMarkets data
//decompressGetCompleteMarketPricesCompressed - decompress getCompleteMarketPricesCompressed data
//decompressGetMarketPricesCompressed         - decompress getMarketPricesCompressed data
//decompressGetMarketTradedVolumeCompressed   - decompress getMarketTradedVolumeCompressed

var desirableMarketNames;

exports.addDesirableMarketName = function(name) {
    desirableMarketNames = desirableMarketNames || {};
    desirableMarketNames[name] = true;
}

exports.decompressInvocation = function(action, result) {
    switch (action) {
    case 'getAllMarkets':
        // console.log('decompressing getAllMarkets');
        var marketData = result.marketData;
        if (typeof (marketData) === 'string') {
            var data = decompressGetAllMarkets(marketData);
            result.marketData = data;
        }
        break;
    case 'getMarketPricesCompressed':
        // console.log('decompressing getMarketPricesCompressed');
        var marketPrices = result.marketPrices;
        if (typeof (marketPrices) === 'string') {
            var data = decompressGetMarketPricesCompressed(marketPrices);
            result.marketPrices = data;
        }
        break;
    case 'getCompleteMarketPricesCompressed':
        // console.log('decompressing getCompleteMarketPricesCompressed');
        var completeMarketPrices = result.completeMarketPrices;
        if (typeof (completeMarketPrices) === 'string') {
            var data = decompressGetCompleteMarketPricesCompressed(completeMarketPrices);
            result.completeMarketPrices = data;
        }
        break;
    case 'getMarketTradedVolumeCompressed':
        // console.log('decompressing getMarketTradeVolumeCompressed');
        var tradedVolume = result.tradedVolume;
        if (typeof (tradedVolume) === 'string') {
            var data = decompressGetMarketTradedVolumeCompressed(tradedVolume);
            result.tradedVolume = data;
        }
        break;
    }
}

function decompressGetAllMarkets(marketData) {
    if (marketData.length === 0)
        return [];

    // replace escaped backslash
    marketData = marketData.replace(/\\:/g, '=');

    var result = [];
    var markets = marketData.split(':');
    // console.log('there are %s markets', markets.length);
    for ( var marketIndex in markets) {
        var market = markets[marketIndex];
        if (!market.length)
            continue;

        // console.log(market);
        var marketFields = market.split("~");

        var name = marketFields[1];
        if (desirableMarketNames && !desirableMarketNames[name]) {
            // console.log('Skipping "%s", not in desirableMarketNames', name);
            continue;
        }

        var marketDesc = {
            marketId : marketFields[0],
            marketName : marketFields[1],
            marketType : marketFields[2],
            marketStatus : marketFields[3],
            eventDate : marketFields[4],
            menuPath : marketFields[5],
            eventHierarchy : marketFields[6],
            betDelay : marketFields[7],
            exchangeId : marketFields[8],
            countryCode : marketFields[9],
            lastRefresh : marketFields[10],
            numberOfRunners : marketFields[11],
            numberOfWinners : marketFields[12],
            totalMatched : marketFields[13],
            isBspMarket : marketFields[14],
            turningInPlay : marketFields[15]
        };
        result.push(marketDesc);
    }
    return result;
}

function decompressGetMarketPricesCompressed(marketPrices) {
    if (marketPrices.length === 0) {
        return {};
    }

    // replace escaped backslash
    marketPrices = marketPrices.replace(/\\:/g, '=');

    var sections = marketPrices.split(':');
    if (sections.length == 0)
        return;

    // market data
    var marketData = sections[0].split('~');
    var result = {
        marketId : marketData[0],
        currency : marketData[1],
        marketStatus : marketData[2],
        inPlayDelay : marketData[3],
        numberOfWinners : marketData[4],
        marketInfo : marketData[5],
        discountAllowed : marketData[6],
        marketBaseRate : marketData[7],
        refreshTime : marketData[8],
        removedRunners : marketData[9],
        startingPrice : marketData[10],
        runners : []
    };

    if (sections.length <= 1)
        return result;

    // runners
    for ( var cnt = 1; cnt < sections.length; ++cnt) {
        var runnerParts = sections[cnt].split('|');

        // Meta
        var runnerInfo = runnerParts[0].split("~");
        var runner = {
            selectionId : runnerInfo[0],
            orderIndex : runnerInfo[1],
            totalMatched : runnerInfo[2],
            lastPriceMatched : runnerInfo[3],
            handicap : runnerInfo[4],
            reductionFactor : runnerInfo[5],
            vacant : runnerInfo[6],
            farSPPrice : runnerInfo[7],
            nearSPPrice : runnerInfo[8],
            actualSPPrice : runnerInfo[9],
        }

        // Backs
        backs = [];
        var backItems = runnerParts[1].split("~");
        // console.log(backItems.length);
        if ((backItems.length % 4) != 1) {
            // number of records is not multiple of 4 plus 1 last element
            throw "Number of Back prices elements is not multiple of 4";
        }
        for ( var backCnt = 0; backCnt < Math.floor(backItems.length / 4); ++backCnt) {
            var back = {
                price : backItems[backCnt * 4 + 0],
                amount : backItems[backCnt * 4 + 1],
                type : backItems[backCnt * 4 + 2],
                depth : backItems[backCnt * 4 + 3]
            }
            backs.push(back);
        }
        runner.backPrices = backs;

        // Lays
        lays = [];
        var layItems = runnerParts[2].split("~");
        // console.log(layItems.length);
        if ((layItems.length % 4) != 1) {
            // number of records is not multiple of 4 plus 1 last element
            throw "Number of Lay prices elements is not multiple of 4";
        }
        for ( var layCnt = 0; layCnt < Math.floor(layItems.length / 4); ++layCnt) {
            var lay = {
                price : layItems[layCnt * 4 + 0],
                amount : layItems[layCnt * 4 + 1],
                type : layItems[layCnt * 4 + 2],
                depth : layItems[layCnt * 4 + 3]
            }
            lays.push(lay);
        }
        runner.layPrices = lays;

        // put runner to result
        result.runners.push(runner);
    }

    return result;
}

function decompressGetCompleteMarketPricesCompressed(marketPrices) {
    if (marketPrices.length === 0) {
        return {};
    }

    // replace escaped backslash
    marketPrices = marketPrices.replace(/\\:/g, '=');
    var sections = marketPrices.split(':');
    // console.log("number of sections", sections.length);

    // first section general market info
    var marketInfo = sections[0].split('~');
    var result = {
        marketId : marketInfo[0],
        inPlayDelay : marketInfo[1],
        runners : []
    }

    if (sections.length <= 1)
        return result;

    for ( var cnt = 1; cnt < sections.length; ++cnt) {
        var runnerParts = sections[cnt].split('|');

        var runnerInfo = runnerParts[0].split('~');
        var info = {
            selectionId : runnerInfo[0],
            orderIndex : runnerInfo[1],
            totalMatched : runnerInfo[2],
            lastPriceMatched : runnerInfo[3],
            handicap : runnerInfo[4],
            reductionFactor : runnerInfo[5],
            vacant : runnerInfo[6],
            asianLineId : runnerInfo[7],
            farSPPrice : runnerInfo[8],
            nearSPPrice : runnerInfo[9],
            actualSPPrice : runnerInfo[10],
            prices : []
        }

        var runnerPrices = runnerParts[1].split('~');
        if ((runnerPrices.length % 5) != 1) {
            // number of records is not multiple of 4 plus 1 last element
            throw "Number of prices elements is not multiple of 5";
        }

        for ( var priceCnt = 0; priceCnt < Math.floor(runnerPrices.length / 5); ++priceCnt) {
            var price = {
                price : runnerPrices[priceCnt * 5 + 0],
                backAmount : runnerPrices[priceCnt * 5 + 1],
                layAmount : runnerPrices[priceCnt * 5 + 2],
                totalBSPBackAmount : runnerPrices[priceCnt * 5 + 3],
                totalBSPLayAmount : runnerPrices[priceCnt * 5 + 4],
            }
            info.prices.push(price);
        }

        result.runners.push(info);
    }

    return result;
}

function decompressGetMarketTradedVolumeCompressed(marketVolume) {
    if (marketVolume.length === 0) {
        return [];
    }

    // replace escaped backslash
    marketVolume = marketVolume.replace(/\\:/g, '=');
    var sections = marketVolume.split(':');
    var runners = [];
    // console.log(sections);

    // scan runners
    for ( var cnt = 1; cnt < sections.length; ++cnt) {
        var runnerComponents = sections[cnt].split('|');

        // first component is runner Info
        var runnerFields = runnerComponents[0].split('~');
        var runner = {
            selectionId : runnerFields[0],
            asianLineId : runnerFields[1],
            actualBSP : runnerFields[2],
            totalBSPBackMatchedAmount : runnerFields[3],
            totalBSPLiabilityMatchedAmount : runnerFields[4],
        }

        // rest components are runner traded volumes
        var items = {};
        for ( var seq = 1; seq < runnerComponents.length; ++seq) {
            var comps = runnerComponents[seq].split("~");
            items[comps[0]] = comps[1];
        }
        runner.tradedVolumes = items;
        runners.push(runner);
    }
    return runners;
}
