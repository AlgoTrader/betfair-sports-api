//(C) 2012 Anton Zemlyanov

//The module "decodes" SOAP xml invocation results into native JavaScript objects
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//decode     - converts Betfair SOAP XML response into native JavaScript object

var DomJS = require('dom-js').DomJS;
// var xmljs = require('libxmljs');
var util = require('util');

exports.decode = function(xml, schema) {
    // parse XML
    var domjs = new DomJS;
    var root;
    try {
        domjs.parse(xml, function(err, res) {
            // console.log(err);
            //console.log(util.inspect(res, true, 10));
            root = res;
            return false;
        });
    } catch (ex) {
        return {
            error : 'Bad XML in response'
        };
    }

    // check Envelope and get SOAP body
    if (root.name != "soap:Envelope" && root.children.length != 1)
        return {
            error : 'Bad SOAP response, no Envelope'
        };
    var body = root.children[0];

    // check Body and get Fault or Result
    if (body.name != "soap:Body" && body.children.length != 1)
        return {
            error : 'Bad SOAP response, no Body'
        };
    var faultOrAction = body.children[0];

    // check is SOAP Fault
    if (faultOrAction.name === "soap:Fault")
        return {
            error : 'SOAP Fault'
        };

    // check Action tag
    if (faultOrAction.children.length != 1)
        return {
            error : 'Bad SOAP response, no Action tag'
        };
    var result = faultOrAction.children[0];

    // check Response tag
    if (!endsWith(result.name, 'Result'))
        return {
            error : 'Bad SOAP response, no Result tag'
        };

    var decodedData = decodeNode(result);

    return decodedData;
}

function decodeNode(node) {
    var nodeType = detectNodeType(node);

    var children = node.children;
    //console.log(nodeType);
    switch (nodeType) {
    case 'array':
        var arr = [];
        for ( var child in children) {
            // arr.push(decodeNode(children[child]));
        }
        return arr;
    case 'object':
        var obj = {};
        for ( var childIndex in children) {
            //console.log(childIndex);
            obj[children[childIndex].name] = decodeNode(children[childIndex]);
        }
        return obj;
    case 'datetime':
        return new Date(node.text());
    default:
        return node.text();
    }

    return null;
}

function detectNodeType(node) {
    var children = node.children;
    var attrType = node.attributes && node.attributes['xsi:type'];
    //console.log('===========================');
    //console.log(children);
    //console.log(attrType);
    //console.log('===========================');

    if (children && children.length === 0) {
        return 'string';
    } else if (children.length === 1 && children[0].text) {
        if (attrType && attrType.match(/^xsd:dateTime/))
            return 'datetime';
        else
            return 'string';
    } else if (attrType && attrType.match(/ArrayOf/)) {
        return 'array';
    }

    return 'object';
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}