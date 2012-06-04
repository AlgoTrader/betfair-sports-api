//(C) 2012 Anton Zemlyanov

//The module "encodes" native JavaScript objects into SOAP xml invocation requests
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//encode   - converts native JavaScript object into Betfair SOAP XML request

var util = require('util');
var XMLWriter = require('xml-writer');

exports.encode = function(action, schema, input) {
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
    
    // Body tag
    doc.startElement('soap:Body');
    
    // action tag
    doc.startElement(action);
    doc.writeAttribute('xmlns', schema);
    
    // request tag
    doc.startElement('request');
    
    // request content (actual request data)
    encodeObject(input, doc);
    
    doc.endElement(); // request
    doc.endElement(); // action
    doc.endElement(); // body
    doc.endElement(); // envelope 
    doc.endDocument();
    
    //console.log(xml);
    return xml;
}

function encodeObject(object, doc) {
    for ( var itemKey in object) {
        var itemVal = object[itemKey];
        //console.log(itemKey + "/" + itemVal);
        switch (typeof itemVal) {
        case 'string':
            doc.startElement(itemKey);
            doc.text(itemVal);
            doc.endElement();
            break;
        case 'number':
            doc.startElement(itemKey);
            doc.text(itemVal.toString());
            doc.endElement();
            break;
        case 'object':
            if (util.isArray(itemVal)) {
                // encode array
                doc.startElement(itemKey);
                encodeArray(itemVal, doc);
                doc.endElement();
            } else {
                // encode object
                doc.startElement(itemKey);
                encodeObject(itemVal, doc);
                doc.endElement();
            }
            break;
        default:
            // console.log("unknown");
            break;
        }
    }
    return;
}

function encodeArray(array, doc) {
    // console.log("array", array);
    var itemTagName = array.shift();

    for ( var itemKey in array) {
        var itemVal = array[itemKey];
        //console.log("encodeArray: itemVal", itemVal);
        switch (typeof itemVal) {
        case 'string':
            doc.startElement(itemTagName);
            doc.text(itemVal);
            doc.endElement();
            break;
        case 'number':
            doc.startElement(itemTagName);
            doc.text(itemVal.toString());
            doc.endElement();
            break;
        case 'object':
            // encode object
            doc.startElement(itemTagName);
            encodeObject(itemVal, doc);
            doc.endElement();
            break;
        default:
            // console.log("unknown");
            break;
        }
    }
    return;
}
