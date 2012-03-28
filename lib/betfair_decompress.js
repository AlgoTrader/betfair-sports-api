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

/*//Decode market prices (getMarketPricesCompressed)
QVariant BetfairDecompressor::decompressGetMarketPricesCompressed(QString marketPrices)
{
    if(marketPrices=="NIL")
        return QVariant("NIL");

    QVariantMap pricesDict;
    QString tmp = marketPrices.replace("\\:","=");
    QStringList sections = tmp.split(":");

    LOG(LOG_DBG,"DEC: MarketPrices has %d sections",sections.count());

    // first section is general market info
    QString meta1 = sections.at(0);
    QStringList meta1Arr = meta1.split("~");
    pricesDict.insert("marketId",        QVariant(meta1Arr.at(0)));
    pricesDict.insert("currency",        QVariant(meta1Arr.at(1)));
    pricesDict.insert("marketStatus",    QVariant(meta1Arr.at(2)));
    pricesDict.insert("inPlayDelay",     QVariant(meta1Arr.at(3)));
    pricesDict.insert("numberOfWinners", QVariant(meta1Arr.at(4)));
    pricesDict.insert("marketInfo",      QVariant(meta1Arr.at(5)));
    pricesDict.insert("discountAllowed", QVariant(meta1Arr.at(6)));
    pricesDict.insert("marketBaseRate",  QVariant(meta1Arr.at(7)));
    pricesDict.insert("refreshTime",     QVariant(meta1Arr.at(8)));
    pricesDict.insert("removedRunners",  QVariant(meta1Arr.at(9)));
    pricesDict.insert("startingPrice",   QVariant(meta1Arr.at(10)));

    if( sections.count()<=1)
    {
        // There is no a single runner
        LOG(LOG_DBG, MOD "There is no single runner in market prices");
        return pricesDict;
    }

    // runners
    QVariantList runners;

    for(int cnt=1; cnt<sections.count(); ++cnt )
    {
        QString runnerStr = sections.at(cnt);
        QStringList runnerArr = runnerStr.split("|");
        LOG(LOG_DBG,"Runner %d has %d parts", cnt, runnerArr.count());
        QVariantMap runner;

        //Meta
        QString meta = runnerArr.at(0);
        QStringList metaArr = meta.split("~");
        runner.insert("selectionId",      QVariant(metaArr.at(0)));
        runner.insert("orderIndex",       QVariant(metaArr.at(1)));
        runner.insert("totalMatched",     QVariant(metaArr.at(2)));
        runner.insert("lastPriceMatched", QVariant(metaArr.at(3)));
        runner.insert("handicap",         QVariant(metaArr.at(4)));
        runner.insert("reductionFactor",  QVariant(metaArr.at(5)));
        runner.insert("vacant",           QVariant(metaArr.at(6)));
        runner.insert("farSPPrice",       QVariant(metaArr.at(7)));
        runner.insert("nearSPPrice",      QVariant(metaArr.at(8)));
        runner.insert("actualSPPrice",    QVariant(metaArr.at(9)));

        // Backs
        QVariantList backs;
        QString backStr = runnerArr.at(1);
        LOG(LOG_DBG,"DEC: backs = %s", qPrintable(backStr));
        metaArr = backStr.split("~");
        if( (metaArr.count()%4)!=1 )
        {
            // number of records is not multiple of 4 plus 1 last element
            qFatal("Number of Back prices elements is not multiple of 4");
        }
        for(int cnt=0; cnt<metaArr.count()/4; ++cnt)
        {
            QVariantMap dict;
            dict.insert("price",  QVariant(metaArr.at(cnt*4+0)));
            dict.insert("amount", QVariant(metaArr.at(cnt*4+1)));
            dict.insert("type",   QVariant(metaArr.at(cnt*4+2)));
            dict.insert("depth",  QVariant(metaArr.at(cnt*4+3)));
            backs.append(dict);
        }
        runner.insert("backPrices", backs);

        // Lays
        QVariantList lays;
        QString layStr = runnerArr.at(2);
        LOG(LOG_DBG,"DEC: lays = %s", qPrintable(layStr));
        metaArr = layStr.split("~");
        if( (metaArr.count()%4)!=1 )
        {
            // number of records is not multiple of 4 plus 1 last element
            qFatal("Number of Lay prices elements is not multiple of 4");
        }
        for(int cnt=0; cnt<metaArr.count()/4; ++cnt)
        {
            QVariantMap dict;
            dict.insert("price",  QVariant(metaArr.at(cnt*4+0)));
            dict.insert("amount", QVariant(metaArr.at(cnt*4+1)));
            dict.insert("type",   QVariant(metaArr.at(cnt*4+2)));
            dict.insert("depth",  QVariant(metaArr.at(cnt*4+3)));
            lays.append(dict);
        }
        runner.insert("layPrices", lays);

        runners.append(runner); // ?? ??????, ??????? ?? ????????
    }
    pricesDict.insert("currentRunners", runners);

    return QVariant(pricesDict);
}*/

