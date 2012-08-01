// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 

var util = require('util');
var XMLWriter = require('xml-writer');

exports.encode = function(action, input) {
    // Xml doc
    var xml = '';
    var doc = new XMLWriter(false, function(string, encoding) {
        xml += string;
    });
    doc.startDocument();

    if(input.soapFault) {
        // SOAP Fault
        encodeSoapFault(doc);
    } else {
        // Valid SOAP Response
        encodeResponse(doc, action, input);
    }

    doc.endDocument();
    
    console.log('response',xml);
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
function encodeResponse(doc,action, input) {
    // Envelope tag
    doc.startElement('soap:Envelope');
    doc.writeAttribute('xmlns:soap', 'http://schemas.xmlsoap.org/soap/envelope/');    
    doc.writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');    
    doc.writeAttribute('xmlns:xsd', 'http://www.w3.org/');
    doc.writeAttribute('xmlns:n2', 'http://www.betfair.com/publicapi/types/exchange/v5/');
    
    // Body tag
    doc.startElement('soap:Body');
    
    // action tag
    doc.startElement('n:'+action);
    // schema is always exchange
    doc.writeAttribute('xmlns:n', "http://www.betfair.com/publicapi/v5/BFExchangeService/");
    
    // request tag
    doc.startElement('n:Result');
    
    // header
    encodeHeader(doc, input);

    // errorCode
    doc.startElement('errorCode').writeAttribute('xsi:type','n2:APIErrorEnum');
    doc.text(input.errorCode);
    doc.endElement();

    // minorErrorCode
    doc.startElement('minorErrorCode').writeAttribute('xsi:null','1');
    doc.endElement();
    
    // request content (actual request data)
    switch(action){
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
    doc.startElement('header').writeAttribute('xsi:type','n2:APIResponseHeader');
    
    // errorCode
    doc.startElement('errorCode').writeAttribute('xsi:type','n2:APIErrorEnum');
    doc.text(result.header.errorCode);
    doc.endElement();

    // minorErrorCode
    doc.startElement('minorErrorCode').writeAttribute('xsi:null','1');
    doc.endElement();
    
    // sessionToken
    doc.startElement('sessionToken').writeAttribute('xsi:type','xsd:string');
    doc.text(result.header.sessionToken);
    doc.endElement();

    // timestamp
    doc.startElement('timestamp').writeAttribute('xsi:type','xsd:dateTime');
    doc.text(result.header.timestamp.toISOString());
    doc.endElement();
    
    doc.endElement(); // header
    return;
}

// placeBets
function encodePlaceBets(doc, result) {
    // betResults
    if(!result.betResults) {
        doc.startElement('betResults').writeAttribute('xsi:null','1');
        doc.endElement();
    } else {
        doc.startElement('betResults').writeAttribute('xsi:type','n2:ArrayOfPlaceBetsResult');
        // encode bets
        for(var i=0; i<result.betResults.length; ++i) {
            var item = result.betResults[i];
            doc.startElement('n2:PlaceBetsResult').writeAttribute('xsi:type','n2:PlaceBetsResult');
            // averagePriceMatched
            doc.startElement('averagePriceMatched').writeAttribute('xsi:type','xsd:double');
            doc.text(item.averagePriceMatched+'');
            doc.endElement();
            // betId
            doc.startElement('betId').writeAttribute('xsi:type','xsd:long');
            doc.text(item.betId+'');
            doc.endElement();
            // resultCode
            doc.startElement('resultCode').writeAttribute('xsi:type','n2:PlaceBetsResultEnum');
            doc.text(item.resultCode);
            doc.endElement();
            // sizeMatched
            doc.startElement('sizeMatched').writeAttribute('xsi:type','xsd:double');
            doc.text(item.sizeMatched+'');
            doc.endElement();
            // success
            doc.startElement('success').writeAttribute('xsi:type','xsd:boolean');
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
    if(!result.betResults) {
        doc.startElement('betResults').writeAttribute('xsi:null','1');
        doc.endElement();
    } else {
        doc.startElement('betResults').writeAttribute('xsi:type','n2:ArrayOfUpdateBetsResult');
        // encode bets
        for(var i=0; i<result.betResults.length; ++i) {
            var item = result.betResults[i];
            doc.startElement('n2:UpdateBetsResult').writeAttribute('xsi:type','n2:UpdateBetsResult');
            // betId
            doc.startElement('betId').writeAttribute('xsi:type','xsd:long');
            doc.text(item.betId+'');
            doc.endElement();
            // newBetId
            doc.startElement('newBetId').writeAttribute('xsi:type','xsd:long');
            doc.text(item.newBetId+'');
            doc.endElement();
            // sizeCancelled
            doc.startElement('sizeCancelled').writeAttribute('xsi:type','xsd:double');
            doc.text(item.sizeCancelled+'');
            doc.endElement();
            // newSize
            doc.startElement('newSize').writeAttribute('xsi:type','xsd:double');
            doc.text(item.newSize+'');
            doc.endElement();
            // newPrice
            doc.startElement('newPrice').writeAttribute('xsi:type','xsd:double');
            doc.text(item.newPrice+'');
            doc.endElement();
            // resultCode
            doc.startElement('resultCode').writeAttribute('xsi:type','n2:UpdateBetsResultEnum');
            doc.text(item.resultCode);
            doc.endElement();
            // success
            doc.startElement('success').writeAttribute('xsi:type','xsd:boolean');
            doc.text(item.success);
            doc.endElement();
            
            doc.endElement();
        }
        doc.endElement();
    }
}

// cancelBets
function encodeCancelBets(doc, result) {
    // betResults
    if(!result.betResults) {
        doc.startElement('betResults').writeAttribute('xsi:null','1');
        doc.endElement();
    } else {
        doc.startElement('betResults').writeAttribute('xsi:type','n2:ArrayOfCancelBetsResult');
        // encode bets
        for(var i=0; i<result.betResults.length; ++i) {
            var item = result.betResults[i];
            doc.startElement('n2:CancelBetsResult').writeAttribute('xsi:type','n2:CancelBetsResult');
            // betId
            doc.startElement('betId').writeAttribute('xsi:type','xsd:long');
            doc.text(item.betId+'');
            doc.endElement();
            // resultCode
            doc.startElement('resultCode').writeAttribute('xsi:type','n2:CancelBetsResultEnum');
            doc.text(item.resultCode);
            doc.endElement();
            // sizeCancelled
            doc.startElement('sizeCancelled').writeAttribute('xsi:type','xsd:double');
            doc.text(item.sizeCancelled+'');
            doc.endElement();
            // sizeMatched
            doc.startElement('sizeMatched').writeAttribute('xsi:type','xsd:double');
            doc.text(item.sizeMatched);
            doc.endElement();
            // success
            doc.startElement('success').writeAttribute('xsi:type','xsd:boolean');
            doc.text(item.success);
            doc.endElement();
            
            doc.endElement();
        }
        doc.endElement();
    }
}

// getMUBets
function encodeGetMUBets(doc, result) {
}


// getMarketProfitAndLoss
function encodeGetMarketProfitAndLoss(doc, result) {
}
