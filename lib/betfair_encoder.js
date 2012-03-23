// (C) 2012 Anton Zemlyanov
//
// The module "encodes" native JavaScript objects into SOAP xml invocation requests
// see Sports API documentation on http://bdp.betfair.com
//
// Exported properties:
//   encode   - converts native JavaScript object into Betfair SOAP XML request

var xmljs = require("libxmljs");
var util = require("util");

exports.encode = function(action, schema, input) {
    var xmldoc = new xmljs.Document();

    // soap:Envelope
    xmldoc.node("soap:Envelope");
    var root = xmldoc.root();
    root.attr({
        "xmlns:soap" : "http://schemas.xmlsoap.org/soap/envelope/"
    });
    root.attr({
        "xmlns:xsi" : "http://www.w3.org/2001/XMLSchema-instance"
    });
    root.attr({
        "xmlns:xsd" : "http://www.w3.org/"
    });

    var soapBody = root.node("soap:Body");

    var action = soapBody.node(action);
    action.attr({
        xmlns : schema
    });

    var request = action.node("request");
    encodeObject(input, request);

    return xmldoc.toString();
}

function encodeObject(object, parent) {
    for ( var itemKey in object) {
        var itemVal = object[itemKey];
        //console.log(itemKey + "===" + itemVal);
        
        switch (typeof itemVal) {
        case "string":
            //console.log("string");
            parent.node(itemKey, itemVal);
            break;
        case "number":
            //console.log("number");
            break;
        case "object":
            //console.log("object");
            console.log(util.isArray(itemVal));
            break;
        default:
            //console.log("unknown");
            break;
        }
    }
}

