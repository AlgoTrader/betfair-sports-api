//(C) 2012 Anton Zemlyanov

//The module "encodes" native JavaScript objects into SOAP xml invocation requests
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//encode   - converts native JavaScript object into Betfair SOAP XML request

var DomJS = require('dom-js').DomJS;
var Element = require('dom-js').Element;
var Text = require('dom-js').Text;
// var xmljs = require('libxmljs');
var util = require('util');

exports.encode = function(action, schema, input) {
    // Envelope tag
    var root = new Element('soap:Envelope', {
        'xmlns:soap' : 'http://schemas.xmlsoap.org/soap/envelope/',
        'xmlns:xsi' : 'http://www.w3.org/2001/XMLSchema-instance',
        'xmlns:xsd' : 'http://www.w3.org/'
    });

    // Body tag
    var body = new Element('soap:Body');
    root.children.push(body);

    // action tag
    var act = new Element(action, {
        xmlns : schema
    });
    body.children.push(act);

    // request tag
    var request = new Element("request");
    act.children.push(request);

    // incode input
    encodeObject(input, request);

    // serialize document to XML
    //console.log(util.inspect(root,false,20));
    var text = root.toXml();

    return text;
}

function encodeObject(object, parent) {
    for ( var itemKey in object) {
        var itemVal = object[itemKey];
        //console.log(itemKey + "/" + itemVal);
        switch (typeof itemVal) {
        case 'string':
            var strElement = new Element(itemKey, {}, [ new Text(itemVal) ]);
            parent.children.push(strElement);
            break;
        case 'number':
            var strElement = new Element(itemKey, {}, [ new Text(itemVal
                    .toString()) ]);
            parent.children.push(strElement);
            break;
        case 'object':
            if (util.isArray(itemVal)) {
                // encode array
                var arrElement = new Element(itemKey);
                encodeArray(itemVal, arrElement);
                parent.children.push(arrElement);
            } else {
                // encode object
                var objElement = new Element(itemKey);
                encodeObject(itemVal, objElement);
                parent.children.push(objElement);
            }
            break;
        default:
            // console.log("unknown");
            break;
        }
    }
    return;
}

function encodeArray(array, parent) {
    // console.log("array", array);
    var itemTagName = array.shift();
    //console.log(itemTagName);
    
    for ( var itemKey in array) {
        var itemVal = array[itemKey];
        //console.log("encodeArray: itemVal", itemVal);
        switch (typeof itemVal) {
        case 'string':
            var strElement = new Element(itemTagName, {}, [ new Text(itemVal) ]);
            parent.children.push(strElement);
            break;
        case 'number':
            var strElement = new Element(itemTagName, {}, [ new Text(itemVal
                    .toString()) ]);
            parent.children.push(strElement);
            break;
        default:
            // console.log("unknown");
            break;
        }
    }
    return;
}