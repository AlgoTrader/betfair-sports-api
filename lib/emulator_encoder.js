// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 

var util = require('util');
var XMLWriter = require('xml-writer');
var betfairPrice = require('./betfair_price.js');

exports.encode = function(action, input) {
    // Xml doc
    var doc = new XMLWriter(false);
    doc.startDocument();

    if (input.soapFault) {
        // SOAP Fault
        encodeSoapFault(doc);
    } else {
        // Valid SOAP Response
        encodeResponse(doc, action, input);
    }

    doc.endDocument();

    var xml = doc.toString();
    // console.log('response', xml);
    return xml;
}

// fault response
function encodeSoapFault(doc) {
    // Envelope
    doc.startElement('soap:Envelope');
    doc.writeAttribute('xmlns:soap', 'http://schemas.xmlsoap.org/soap/envelope/');
    // Body
    doc.startElement('soap:Body');
    doc.writeAttribute('soap:encodingStyle', 'http://schemas.xmlsoap.org/soap/encoding/');
    // Fault
    doc.startElement('soap:Fault');

    // faultcode & faultstring
    doc.writeElement('faultcode', 'soap:Server');
    doc.writeElement('faultstring', 'INTERNAL_ERROR');

    doc.endElement(); // fault
    doc.endElement(); // body
    doc.endElement(); // envelope
}

// valid response
function encodeResponse(doc, action, input) {
    // Envelope tag
    doc.startElement('soap:Envelope');
    doc.writeAttribute('xmlns:soap', 'http://schemas.xmlsoap.org/soap/envelope/');
    doc.writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    doc.writeAttribute('xmlns:xsd', 'http://www.w3.org/');
    doc.writeAttribute('xmlns:n2', 'http://www.betfair.com/publicapi/types/exchange/v5/');

    // Body tag
    doc.startElement('soap:Body');

    // action tag
    doc.startElement('n:' + action);
    // schema is always exchange
    doc.writeAttribute('xmlns:n',
            "http://www.betfair.com/publicapi/v5/BFExchangeService/");

    // request tag
    doc.startElement('n:Result');

    // header
    encodeHeader(doc, input);

    // errorCode
    doc.startElement('errorCode').writeAttribute('xsi:type', 'n2:APIErrorEnum');
    doc.text(input.errorCode);
    doc.endElement();

    // minorErrorCode
    doc.startElement('minorErrorCode').writeAttribute('xsi:null', '1');
    doc.endElement();

    // request content (actual request data)
    switch (action) {
    case 'placeBets':
        encodePlaceBets(doc, input);
        break;
    case 'updateBets':
        encodePlaceBets(doc, input);
        break;
    case 'cancelBets':
        encodeCancelBets(doc, input);
        break;
    case 'getMUBets':
        encodeGetMUBets(doc, input);
        break;
    case 'getCurrentBets':
        encodeGetCurrentBets(doc, input);
        break;
    case 'getMarketProfitAndLoss':
        encodeGetMarketProfitAndLoss(doc, input);
        break;
    }

    doc.endElement(); // request
    doc.endElement(); // action
    doc.endElement(); // body
    doc.endElement(); // envelope
}

// header
function encodeHeader(doc, result) {
    doc.startElement('header').writeAttribute('xsi:type', 'n2:APIResponseHeader');

    // errorCode
    doc.startElement('errorCode').writeAttribute('xsi:type', 'n2:APIErrorEnum');
    doc.text(result.header.errorCode);
    doc.endElement();

    // minorErrorCode
    doc.startElement('minorErrorCode').writeAttribute('xsi:null', '1');
    doc.endElement();

    // sessionToken
    doc.startElement('sessionToken').writeAttribute('xsi:type', 'xsd:string');
    doc.text(result.header.sessionToken);
    doc.endElement();

    // timestamp
    doc.startElement('timestamp').writeAttribute('xsi:type', 'xsd:dateTime');
    doc.text(result.header.timestamp.toISOString());
    doc.endElement();

    doc.endElement(); // header
    return;
}

// placeBets
function encodePlaceBets(doc, result) {
    // betResults
    if (!result.betResults) {
        doc.startElement('betResults').writeAttribute('xsi:null', '1');
        doc.endElement();
    } else {
        doc.startElement('betResults').writeAttribute('xsi:type',
                'n2:ArrayOfPlaceBetsResult');
        // encode bets
        for ( var i = 0; i < result.betResults.length; ++i) {
            var item = result.betResults[i];
            doc.startElement('n2:PlaceBetsResult').writeAttribute('xsi:type',
                    'n2:PlaceBetsResult');

            // averagePriceMatched
            doc.startElement('averagePriceMatched').writeAttribute('xsi:type',
                    'xsd:double');
            doc.text(item.averagePriceMatched + '');
            doc.endElement();
            // betId
            doc.startElement('betId').writeAttribute('xsi:type', 'xsd:long');
            doc.text(item.betId + '');
            doc.endElement();
            // resultCode
            doc.startElement('resultCode').writeAttribute('xsi:type',
                    'n2:PlaceBetsResultEnum');
            doc.text(item.resultCode);
            doc.endElement();
            // sizeMatched
            doc.startElement('sizeMatched').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.sizeMatched + '');
            doc.endElement();
            // success
            doc.startElement('success').writeAttribute('xsi:type', 'xsd:boolean');
            doc.text(item.success);
            doc.endElement();

            doc.endElement();
        }
        doc.endElement();
    }
}

// updateBets
function encodeUpdateBets(doc, result) {
    // betResults
    if (!result.betResults) {
        doc.startElement('betResults').writeAttribute('xsi:null', '1');
        doc.endElement();
    } else {
        doc.startElement('betResults').writeAttribute('xsi:type',
                'n2:ArrayOfUpdateBetsResult');
        // encode bets
        for ( var i = 0; i < result.betResults.length; ++i) {
            var item = result.betResults[i];
            doc.startElement('n2:UpdateBetsResult').writeAttribute('xsi:type',
                    'n2:UpdateBetsResult');

            // betId
            doc.startElement('betId').writeAttribute('xsi:type', 'xsd:long');
            doc.text(item.betId + '');
            doc.endElement();
            // newBetId
            doc.startElement('newBetId').writeAttribute('xsi:type', 'xsd:long');
            doc.text(item.newBetId + '');
            doc.endElement();
            // sizeCancelled
            doc.startElement('sizeCancelled').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.sizeCancelled + '');
            doc.endElement();
            // newSize
            doc.startElement('newSize').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.newSize + '');
            doc.endElement();
            // newPrice
            doc.startElement('newPrice').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.newPrice + '');
            doc.endElement();
            // resultCode
            doc.startElement('resultCode').writeAttribute('xsi:type',
                    'n2:UpdateBetsResultEnum');
            doc.text(item.resultCode);
            doc.endElement();
            // success
            doc.startElement('success').writeAttribute('xsi:type', 'xsd:boolean');
            doc.text(item.success);
            doc.endElement();

            doc.endElement();
        }
        doc.endElement();
    }
}

// cancelBets
function encodeCancelBets(doc, result) {
    console.log(result);

    // betResults
    if (!result.betResults) {
        doc.startElement('betResults').writeAttribute('xsi:null', '1');
        doc.endElement();
    } else {
        doc.startElement('betResults').writeAttribute('xsi:type',
                'n2:ArrayOfCancelBetsResult');
        // encode bets
        for ( var i = 0; i < result.betResults.length; ++i) {
            var item = result.betResults[i];
            doc.startElement('n2:CancelBetsResult').writeAttribute('xsi:type',
                    'n2:CancelBetsResult');

            // betId
            doc.startElement('betId').writeAttribute('xsi:type', 'xsd:long');
            doc.text(item.betId + '');
            doc.endElement();
            // resultCode
            doc.startElement('resultCode').writeAttribute('xsi:type',
                    'n2:CancelBetsResultEnum');
            doc.text(item.resultCode);
            doc.endElement();
            // sizeCancelled
            doc.startElement('sizeCancelled').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.sizeCancelled + '');
            doc.endElement();
            // sizeMatched
            doc.startElement('sizeMatched').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.sizeMatched + '');
            doc.endElement();
            // success
            doc.startElement('success').writeAttribute('xsi:type', 'xsd:boolean');
            doc.text(item.success);
            doc.endElement();

            doc.endElement();
        }
        doc.endElement();
    }
}

// getMUBets
function encodeGetMUBets(doc, result) {
    // betResults
    if (!result.bets) {
        // bets
        doc.startElement('bets').writeAttribute('xsi:null', '1');
        doc.endElement();
        // totalRecordCount
        doc.startElement('totalRecordCount').writeAttribute('xsi:type', 'xsd:integer');
        doc.text('0');
        doc.endElement();
    } else {
        // bets
        doc.startElement('bets').writeAttribute('xsi:type', 'n2:ArrayOfMUBet ');
        for ( var i = 0; i < result.bets.length; ++i) {
            var item = result.bets[i];
            doc.startElement('n2:MUBet').writeAttribute('xsi:type', 'n2:MUBet');

            // asianLineId
            doc.startElement('asianLineId').writeAttribute('xsi:type', 'xsd:integer');
            doc.text(item.asianLineId + '');
            doc.endElement();
            // betCategoryType
            doc.startElement('betCategoryType').writeAttribute('xsi:type',
                    'n2:BetCategoryTypeEnum');
            doc.text(item.betCategoryType);
            doc.endElement();
            // betId
            doc.startElement('betId').writeAttribute('xsi:type', 'xsd:long');
            doc.text(item.betId + '');
            doc.endElement();
            // betPersistenceType
            doc.startElement('betPersistenceType').writeAttribute('xsi:type',
                    'n2:BetPersistenceTypeEnum');
            doc.text(item.betPersistenceType);
            doc.endElement();
            // betStatus
            doc.startElement('betStatus').writeAttribute('xsi:type', 'n2:BetStatusEnum');
            doc.text(item.betStatus);
            doc.endElement();
            // betType
            doc.startElement('betType').writeAttribute('xsi:type', 'n2:BetTypeEnum');
            doc.text(item.betType);
            doc.endElement();
            // bspLiability
            doc.startElement('bspLiability').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.bspLiability);
            doc.endElement();
            // handicap
            doc.startElement('handicap').writeAttribute('xsi:type', 'xsd:double');
            doc.text('0.0');
            doc.endElement();
            // marketId
            doc.startElement('marketId').writeAttribute('xsi:type', 'xsd:integer');
            doc.text(item.marketId);
            doc.endElement();
            // matchedDate
            if (!item.matchedDate) {
                doc.startElement('matchedDate').writeAttribute('xsi:null', '');
                doc.endElement();
            } else {
                doc.startElement('matchedDate')
                        .writeAttribute('xsi:type', 'xsd:dateTime');
                doc.text(item.matchedDate.toISOString());
                doc.endElement();
            }
            // placedDate
            doc.startElement('placedDate').writeAttribute('xsi:type', 'xsd:dateTime');
            doc.text(item.placedDate.toISOString());
            doc.endElement();
            // price
            var price = betfairPrice.newBetfairPrice(item.price);
            doc.startElement('price').writeAttribute('xsi:type', 'xsd:double');
            doc.text(price.toString());
            doc.endElement();
            // selectionId
            doc.startElement('selectionId').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.selectionId);
            doc.endElement();
            // size
            doc.startElement('size').writeAttribute('xsi:type', 'xsd:double');
            doc.text((1 * item.size).toFixed(2));
            doc.endElement();
            // transactionId
            doc.startElement('transactionId').writeAttribute('xsi:type', 'xsd:long');
            doc.text(item.transactionId + '');
            doc.endElement();

            doc.endElement();
        }
        doc.endElement();
        // totalRecordCount
        doc.startElement('totalRecordCount').writeAttribute('xsi:type', 'xsd:integer');
        doc.text(result.bets.length + '');
        doc.endElement();
    }
}

// getCurrentBets
function encodeGetCurrentBets(doc, result) {
    // betResults
    if (!result.bets) {
        // bets
        doc.startElement('bets').writeAttribute('xsi:null', '1');
        doc.endElement();
        // totalRecordCount
        doc.startElement('totalRecordCount').writeAttribute('xsi:type', 'xsd:integer');
        doc.text('0');
        doc.endElement();
    } else {
        // bets
        doc.startElement('bets').writeAttribute('xsi:type', 'n2:ArrayOfCurrentBet ');
        for ( var i = 0; i < result.bets.length; ++i) {
            var item = result.bets[i];
            doc.startElement('n2:CurrentBet').writeAttribute('xsi:type', 'n2:CurrentBet');
            // asianLineId
            doc.startElement('asianLineId').writeAttribute('xsi:type', 'xsd:integer');
            doc.text(item.asianLineId + '');
            doc.endElement();
            // avgPrice
            doc.startElement('avgPrice').writeAttribute('xsi:type', 'xsd:double');
            doc.text(item.avgPrice + '');
            doc.endElement();
            // betId
            doc.startElement('betId').writeAttribute('xsi:type', 'xsd:long');
            doc.text(item.betId + '');
            doc.endElement();
            // betStatus
            doc.startElement('betStatus').writeAttribute('xsi:type', 'n2:BetStatusEnum');
            doc.text(item.betStatus + '');
            doc.endElement();
            // betType
            doc.startElement('betType').writeAttribute('xsi:type', 'n2:BetTypeEnum');
            doc.text(item.betType + '');
            doc.endElement();
            // betCategoryType
            doc.startElement('betCategoryType').writeAttribute('xsi:type', 'n2:BetCategoryTypeEnum');
            doc.text(item.betCategoryType + '');
            doc.endElement();
            // betPersistenceType
            doc.startElement('betPersistenceType').writeAttribute('xsi:type', 'n2:BetPersistanceTypeEnum');
            doc.text(item.betPersistenceType + '');
            doc.endElement();
            // cancelledDate
            doc.startElement('cancelledDate').writeAttribute('xsi:type', 'xsd:dateTime');
            doc.text(item.cancelledDate.toISOString());
            doc.endElement();
            // lapsedDate
            doc.startElement('lapsedDate').writeAttribute('xsi:type', 'xsd:dateTime');
            doc.text(item.lapsedDate.toISOString());
            doc.endElement();
            // marketId
            doc.startElement('marketId').writeAttribute('xsi:type', 'xsd:integer');
            doc.text(item.marketId+'');
            doc.endElement();
            // marketName
            doc.startElement('marketName').writeAttribute('xsi:type', 'xsd:string');
            doc.text(item.marketName+'');
            doc.endElement();
            // fullMarketName
            doc.startElement('fullMarketName').writeAttribute('xsi:type', 'xsd:string');
            doc.text(item.fullMarketName+'');
            doc.endElement();
            // marketType
            doc.startElement('marketType').writeAttribute('xsi:type', 'n2:MarketTypeEnum');
            doc.text(item.marketType+'');
            doc.endElement();
            // marketType
            doc.startElement('marketType').writeAttribute('xsi:type', 'n2:MarketTypeEnum');
            doc.text(item.marketType+'');
            doc.endElement();
            // matchedDate
            doc.startElement('matchedDate').writeAttribute('xsi:type', 'xsd:dateTime');
            doc.text(item.matchedDate.toISOString());
            doc.endElement();
            // matchedSize
            doc.startElement('matchedSize').writeAttribute('xsi:type', 'xsd:double');
            doc.text((item.matchedSize*1).toFixed(2));
            doc.endElement();
            // matches
            doc.startElement('matches').writeAttribute('xsi:null', '1');
            doc.endElement();
            // placedDate
            doc.startElement('placedDate').writeAttribute('xsi:type', 'xsd:dateTime');
            doc.text(item.placedDate.toISOString());
            doc.endElement();
            // bspLiability
            doc.startElement('bspLiability').writeAttribute('xsi:type', 'xsd:double');
            doc.text((item.bspLiability*1).toFixed(2));
            doc.endElement();
            // price
            doc.startElement('price').writeAttribute('xsi:type', 'xsd:double');
            doc.text((item.price*1).toFixed(2));
            doc.endElement();
            // profitAndLoss
            doc.startElement('profitAndLoss').writeAttribute('xsi:type', 'xsd:double');
            doc.text((item.profitAndLoss*1).toFixed(2));
            doc.endElement();
            // selectionId
            doc.startElement('selectionId').writeAttribute('xsi:type', 'xsd:integer');
            doc.text(item.selectionId+'');
            doc.endElement();
            // selectionName
            doc.startElement('selectionName').writeAttribute('xsi:type', 'xsd:string');
            doc.text(item.selectionName+'');
            doc.endElement();
            // settledDate
            doc.startElement('settledDate').writeAttribute('xsi:type', 'xsd:dateTime');
            doc.text(item.settledDate.toISOString());
            doc.endElement();
            // remainingSize
            doc.startElement('remainingSize').writeAttribute('xsi:type', 'xsd:double');
            doc.text((item.remainingSize*1).toFixed(2));
            doc.endElement();
            // requestedSize
            doc.startElement('requestedSize').writeAttribute('xsi:type', 'xsd:double');
            doc.text((item.requestedSize*1).toFixed(2));
            doc.endElement();
            // voidedDate
            doc.startElement('voidedDate').writeAttribute('xsi:type', 'xsd:dateTime');
            doc.text(item.voidedDate.toISOString());
            doc.endElement();
            // executedBy
            doc.startElement('executedBy').writeAttribute('xsi:type', 'xsd:string');
            doc.text(item.executedBy);
            doc.endElement();
            // handicap
            doc.startElement('handicap').writeAttribute('xsi:type', 'xsd:double');
            doc.text((item.handicap*1).toFixed(2));
            doc.endElement();
            // marketTypeVariant
            doc.startElement('marketTypeVariant').writeAttribute('xsi:type', 'n2:NarketTypeVariantEnum');
            doc.text(item.marketTypeVariant);
            doc.endElement();
            
            doc.endElement();
        }
        doc.endElement();
        // totalRecordCount
        doc.startElement('totalRecordCount').writeAttribute('xsi:type', 'xsd:integer');
        doc.text(result.bets.length + '');
        doc.endElement();
    }
}

// getMarketProfitAndLoss
function encodeGetMarketProfitAndLoss(doc, result) {
    // annotations
    if (!result.annotations) {
        // bets
        doc.startElement('annotations').writeAttribute('xsi:null', '1');
        doc.endElement();
    } else {
        doc.startElement('annotations').writeAttribute('xsi:type',
                'n2:ArrayOfProfitAndLoss');
        for ( var i = 0; i < result.annotations.length; ++i) {
            var ann = result.annotations[i];
            doc.startElement('n2:ProfitAndLoss').writeAttribute('xsi:type',
                    'n2:ProfitAndLoss');
            // futureIfWin
            doc.startElement('futureIfWin').writeAttribute('xsi:type', 'xsd:double');
            doc.text(ann.futureIfWin + '');
            doc.endElement();
            // ifWin
            doc.startElement('ifWin').writeAttribute('xsi:type', 'xsd:double');
            doc.text((1 * ann.ifWin).toFixed(2));
            doc.endElement();
            // selectionID
            doc.startElement('selectionId').writeAttribute('xsi:type', 'xsd:integer');
            doc.text(ann.selectionId);
            doc.endElement();
            // selectionName
            doc.startElement('selectionName').writeAttribute('xsi:type', 'xsd:string');
            doc.text(ann.selectionName);
            doc.endElement();
            // worstCaseIfWin
            doc.startElement('worstCaseIfWin').writeAttribute('xsi:type', 'xsd:double');
            doc.text(ann.worstCaseIfWin + '');
            doc.endElement();
            // ifLoss
            doc.startElement('ifLoss').writeAttribute('xsi:type', 'xsd:double');
            doc.text((1 * ann.ifLoss).toFixed(2));
            doc.endElement();

            doc.endElement();
        }
        doc.endElement();
    }
    // commissionApplied
    doc.startElement('commissionApplied').writeAttribute('xsi:type', 'xsd:double');
    doc.text(result.commissionApplied + '');
    doc.endElement();
    // currencyCode
    doc.startElement('currencyCode').writeAttribute('xsi:type', 'xsd:string');
    doc.text(result.currencyCode);
    doc.endElement();
    // includesSettledBets
    doc.startElement('includesSettledBets').writeAttribute('xsi:type', 'xsd:booleang');
    doc.text(result.includesSettledBets ? "true" : "false");
    doc.endElement();
    // includesBspBets
    doc.startElement('includesBspBets').writeAttribute('xsi:type', 'xsd:booleang');
    doc.text(result.includesBspBets ? "true" : "false");
    doc.endElement();
    // marketId
    doc.startElement('marketId').writeAttribute('xsi:type', 'xsd:integer');
    doc.text(result.marketId);
    doc.endElement();
    // marketName
    doc.startElement('marketName').writeAttribute('xsi:type', 'xsd:string');
    doc.text(result.marketName);
    doc.endElement();
    // marketStatus
    doc.startElement('marketStatus').writeAttribute('xsi:type', 'n2:MarketStatusEnum');
    doc.text(result.marketStatus);
    doc.endElement();
    // unit
    doc.startElement('unit').writeAttribute('xsi:type', 'xsd:string');
    doc.text(result.unit || 'N/A');
    doc.endElement();
}
