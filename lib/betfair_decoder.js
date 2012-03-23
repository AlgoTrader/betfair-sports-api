//(C) 2012 Anton Zemlyanov

//The module "decodes" SOAP xml invocation results into native JavaScript objects
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//decode     - converts Betfair SOAP XML response into native JavaScript object

var xmljs = require("libxmljs");
var util = require("util");

exports.decode = function(xml) {
    // parse XML
    try {
        var xmlDoc = xmljs.parseXmlString(xml);
    } catch (ex) {
        return {
            error : "Bad XML in response"
        };
    }

    // get SOAP body tag element
    var soapBody = xmlDoc.get("/soap:Envelope/soap:Body", {
        soap : "http://schemas.xmlsoap.org/soap/envelope/"
    });
    if (!soapBody)
        return {
            error : "Not SOAP response"
        };

    // check is SOAP fault
    var soapFault = soapBody.get("soap:Fault", {
        soap : "http://schemas.xmlsoap.org/soap/envelope/"
    });
    if (soapFault)
        return {
            error : "SOAP Fault"
        };

    // find SOAP result tag
    var result = soapBody.get("*/n:Result", {
        n : "http://www.betfair.com/publicapi/v3/BFGlobalService/"
    });
    if (!result)
        return {
            error : "No SOAP result"
        };

    // valid SOAP result, parse it
    var decoded = decodeNode(result);

    return decoded;
}

function decodeNode(node) {
    var nodeType = detectNodeType(node);

    var children = node.childNodes();
    switch (nodeType) {
    case "array":
        var arr = [];
        for ( var child in node.childNodes()) {
            arr.push(decodeNode(children[child]));
        }
        return arr;
    case "object":
        var obj = {};
        for ( var child in node.childNodes()) {
            obj[children[child].name()] = decodeNode(children[child]);
        }
        return obj;
    case "datetime":
        return new Date(node.text());
    default:
        return node.text();
    }

    return null;
}

function detectNodeType(node) {
    var children = node.childNodes();
    var attrType = node.attr("type");

    if (children.length === 0) {
        return "string";
    } else if (children.length === 1 && children[0].name() === 'text') {
        if (attrType && attrType.value().match(/^xsd:dateTime/))
            return "datetime";
        else
            return "string";
    } else if (attrType && attrType.value().match(/^Array/)) {
        return "array";
    }

    return "object";

}