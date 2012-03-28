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

exports.decompressInvocation = function(action, result) {
    switch (action) {
    case 'getAllMarkets':
        //console.log('decompressing getAllMarkets');
        var marketData = result.marketData;
        if (typeof (marketData) === 'string') {
            var data = decompressGetAllMarkets(marketData);
            result.marketData = data;
        }
        break;
    case 'getMarketPricesCompressed':
        //console.log('decompressing getMarketPricesCompressed');
        var marketPrices = result.marketPrices;
        if (typeof (marketPrices) === 'string') {
            var data = decompressGetMarketPricesCompressed(marketPrices);
            result.marketPrices = data;
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
    console.log('there are %s markets', markets.length);
    for ( var marketIndex in markets) {
        var market = markets[marketIndex];
        if (!market.length)
            continue;

        //console.log(market);
        var marketFields = market.split("~");
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
    if (marketPrices.length === 0)
        return {};

        // replace escaped backslash
        marketPrices = marketPrices.replace(/\\:/g, '='); 

        var sections = marketPrices.split(':');

        // market data
        var marketData = sections[0].split('~');
        var result = {
                marketId : marketData[0],
                currency : marketData[1],
                marketStatus :  marketData[2],
                inPlayDelay :  marketData[3],
                numberOfWinners :  marketData[4],
                marketInfo :  marketData[5],
                discountAllowed : marketData[6],
                marketBaseRate : marketData[7],
                refreshTime : marketData[8],
                removedRunners : marketData[9],
                startingPrice : marketData[10],
                runners : []
        };

        if(sections.length<=1)
            return;

        // runners
        for(var cnt=1; cnt<sections.length; ++cnt ){
            var runnerParts = sections[cnt].split('|');

            // Meta
            var runnerInfo = runnerParts[0].split("~");
            var runner = {
                    selectionId: runnerInfo[0],
                    orderIndex: runnerInfo[1],
                    totalMatched: runnerInfo[2],
                    lastPriceMatched: runnerInfo[3],
                    handicap: runnerInfo[4],
                    reductionFactor: runnerInfo[5],
                    vacant: runnerInfo[6],
                    farSPPrice: runnerInfo[7],
                    nearSPPrice: runnerInfo[8],
                    actualSPPrice: runnerInfo[9],
            }

            // Backs
            backs = [];
            var backItems = runnerParts[1].split("~");
            //console.log(backItems.length);
            if( (backItems.length %4 )!=1 )
            {
                // number of records is not multiple of 4 plus 1 last element
                throw "Number of Back prices elements is not multiple of 4";
            }
            for(var backCnt=0; backCnt<Math.floor(backItems.length/4); ++backCnt)
            {
                var back = {
                        price :  backItems[backCnt*4+0],
                        amount : backItems[backCnt*4+1],
                        type :   backItems[backCnt*4+2],
                        depth :  backItems[backCnt*4+3]
                }
                backs.push(back);
            }
            runner.backPrices = backs;

            // Lays
            lays = [];
            var layItems = runnerParts[2].split("~");
            //console.log(layItems.length);
            if( (layItems.length %4 )!=1 )
            {
                // number of records is not multiple of 4 plus 1 last element
                throw "Number of Lay prices elements is not multiple of 4";
            }
            for(var layCnt=0; layCnt<Math.floor(backItems.length/4); ++layCnt)
            {
                var lay = {
                        price :  layItems[layCnt*4+0],
                        amount : layItems[layCnt*4+1],
                        type :   layItems[layCnt*4+2],
                        depth :  layItems[layCnt*4+3]
                }
                lays.push(lay);
            }
            runner.layPrices = lays;

            // put runner to result
            result.runners.push(runner);
        }

        return result;
}
