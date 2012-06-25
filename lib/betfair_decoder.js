//(C) 2012 Anton Zemlyanov

//The module "decodes" SOAP xml invocation results into native JavaScript objects
//see Sports API documentation on http://bdp.betfair.com

//Exported properties:
//decode     - converts Betfair SOAP XML response into native JavaScript object

var EasySAXParser = require('easysax');
var util = require('util');

exports.decode = function(xml, schema) {
    // parse XML
    var parser = new ResponseParser();
    var result = parser.parse(xml);
    return result;
}

function ResponseParser() {
    var self = this;

    self.capture = false;

    self.current = new XmlNode('result', {});
    self.current.ref = {};
    self.stack = [ self.current ];
}

ResponseParser.prototype.parse = function(xml) {
    var self = this;

    var parser = new EasySAXParser();

    // error during parse
    parser.on('error', function(err) {
        // error
        return { error: err };
    });

    // tag opened
    parser.on('startNode', function(node, attr, uq) {
        //console.log("open node", node);
        
        var attrs = attr();
        if (node=== 'soap:Fault') {
            return {
                error : "SOAP Fault"
            };
        } else if (node === 'n:Result') {
            //console.log('start XML capture');
            self.capture = true;
        } else if (self.capture === true) {
            ++self.current.children;
            var xmlNode = new XmlNode(node, attrs);
            xmlNode.parent = self.current;
            self.stack.push(xmlNode);
            self.current = xmlNode;
        }
    });

    // tag closed
    parser.on('endNode', function(node, uq) {
        //console.log("close node", node);

        if (node === 'n:Result') {
            //console.log('stop XML capture');
            self.capture = false;
        } else if (self.capture) {
            var current = self.stack.pop(); // drop current element
            var parent = self.stack[self.stack.length - 1];

            if (current.type === 'date')
                current.fixDate();
            parent.type === 'array' ? parent.ref.push(current.ref)
                    : parent.ref[current.tagName] = current.ref;

            self.current = parent;
        }
    });

    // tag text
    parser.on('textNode', function(text, uq) {
        // is whitespace?
        if (text.replace(/\s/g, '') === "")
            return;

        if (typeof (self.current.ref) !== 'string')
            self.current.ref = text;
        else
            self.current.ref += text;
    });

    // do parsing
    try {
        parser.parse(xml);
    } catch (ex) {
        return {
            error : ex.message
        };
    }

    return self.current.ref;
}

function XmlNode(name, attrs) {
    var self = this;

    // node info
    self.tagName = name;
    self.text = '';
    self.children = 0;
    self.parent = null;

    // guess node type and fill ref. Can be changed later
    var xsitype = attrs['xsi:type'];
    var xsinil = attrs['xsi:nil'];
    if (xsitype && xsitype === 'xsd:string') {
        self.type = 'string';
        self.ref = '';
    } else if (xsitype && xsitype === 'xsd:dateTime') {
        self.type = 'date';
        self.ref = null;
    } else if (xsitype && xsitype.indexOf('ArrayOf') >= 0) {
        self.type = 'array';
        self.ref = [];
    } else if (xsinil) {
        self.type = 'nil';
        self.ref = null;
    } else {
        self.type = 'object';
        self.ref = {};
    }
}

XmlNode.prototype.fixDate = function() {
    var self = this;

    if (self.type === 'date')
        self.ref = new Date(self.ref);
}