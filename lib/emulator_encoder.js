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

    // Envelope tag
    doc.startElement('soap:Envelope');
    doc.writeAttribute('xmlns:soap', 'http://schemas.xmlsoap.org/soap/envelope/');    
    doc.writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');    
    doc.writeAttribute('xmlns:xsd', 'http://www.w3.org/');
    doc.writeAttribute('xmlns:n2', 'http://www.betfair.com/publicapi/types/exchange/v5/');
    
    // Body tag
    doc.startElement('soap:Body');
    
    // action tag
    doc.startElement(action);
    // schema is always exchange
    doc.writeAttribute('xmlns', "http://www.betfair.com/publicapi/v5/BFExchangeService/");
    
    // request tag
    doc.startElement('response');
    
    // header
    encodeHeader(doc, input);
    
    // request content (actual request data)
    switch(action){
    case 'placeBets':
        encodePlaceBets(doc, input);
        break;
    }
    
    doc.endElement(); // request
    doc.endElement(); // action
    doc.endElement(); // body
    doc.endElement(); // envelope 
    doc.endDocument();
    
    console.log('response',xml);
    return xml;
}

//<header xsi:type="n2:APIResponseHeader">
// <errorCode xsi:type="n2:APIErrorEnum">OK</errorCode>
// <minorErrorCode xsi:nil="1"></minorErrorCode>
// <sessionToken xsi:type="xsd:string">token</sessionToken>
// <timestamp xsi:type="xsd:dateTime">2012-07-21T15:05:08.022Z</timestamp>
//</header>
function encodeHeader(doc, result) {
    doc.startElement('header').writeAttribute('xsi:type','n2:APIResponseHeader');
    doc.writeElement('sessionToken', result.header.sessionToken);
    doc.endElement(); // header
    return;
}

function encodePlaceBets(doc, result) {
    return;
}

//function encodeObject(object, doc) {
//    for ( var itemKey in object) {
//        var itemVal = object[itemKey];
//        //console.log(itemKey + "/" + itemVal);
//        switch (typeof itemVal) {
//        case 'string':
//            doc.writeElement(itemKey,itemVal);
//            break;
//        case 'number':
//            doc.writeElement(itemKey,itemVal.toString());
//            break;
//        case 'date':
//            doc.writeElement(itemKey,itemVal.toISOString());
//            break;
//        case 'object':
//            if (util.isArray(itemVal)) {
//                // encode array
//                var nm = itemVal[0];
//                nm = nm.charAt(0).toUpperCase() + nm.slice(1);
//                doc.startElement(itemKey);
//                doc.writeAttribute('xsi:type', 'n2:ArrayOf'+nm);
//                encodeArray(itemVal, doc);
//                doc.endElement();
//            } else {
//                // encode object
//                var isDate = itemVal instanceof Date;
//                if(isDate) {
//                    doc.writeElement(itemKey, itemVal.toISOString());
//                } else {
//                    doc.startElement(itemKey);
//                    encodeObject(itemVal, doc);
//                    doc.endElement();
//                }
//            }
//            break;
//        default:
//            // console.log("unknown");
//            break;
//        }
//    }
//    return;
//}
//
//function encodeArray(array, doc) {
//    // console.log("array", array);
//    var itemTagName = array.shift();
//
//    for ( var itemKey in array) {
//        var itemVal = array[itemKey];
//        //console.log("encodeArray: itemVal", itemVal);
//        switch (typeof itemVal) {
//        case 'string':
//            doc.writeElement(itemTagName, itemVal);
//            break;
//        case 'number':
//            doc.writeElement(itemTagName, itemVal.toString());
//            break;
//        case 'object':
//            // encode object
//            var isDate = itemVal instanceof Date;
//            if(isDate) {
//                doc.writeElement(itemTagName, itemVal.toString());
//            } else {
//                doc.startElement(itemTagName);
//                encodeObject(itemVal, doc);
//                doc.endElement();
//            }
//            break;
//        default:
//            // console.log("unknown");
//            break;
//        }
//    }
//    return;
//}
