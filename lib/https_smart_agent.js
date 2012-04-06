// New Agent code.

// The largest departure from the previous implementation is that
// an Agent instance holds connections for a variable number of host:ports.
// Surprisingly, this is still API compatible as far as third parties are
// concerned. The only code that really notices the difference is the
// request object.

// Another departure is that all code related to HTTP parsing is in
// ClientRequest.onSocket(). The Agent is now *strictly*
// concerned with managing a connection pool.

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var net = require('net');
var stream = require('stream');
var tls = require('tls');

exports.newHttpsSmartAgent = function(options) {
    return new HttpsSmartAgent(options);
}

function HttpsSmartAgent(options) {
    var self = this;
    self.options = options || {};
    self.requests = {};
    self.sockets = {};
    self.maxSockets = self.options.maxSockets || HttpsSmartAgent.defaultMaxSockets;
    self.on('free', function(socket, host, port) {
        var name = host + ':' + port;
        if (self.requests[name] && self.requests[name].length) {
            self.requests[name].shift().onSocket(socket);
            if (self.requests[name].length === 0) {
                // don't leak
                delete self.requests[name];
            }
        } else {
            // If there are no pending requests just destroy the
            // socket and it will get removed from the pool. This
            // gets us out of timeout issues and allows us to
            // default to Connection:keep-alive.
            socket.destroy();
        }
    });
    self.createConnection = tls.connect;
}
util.inherits(HttpsSmartAgent, EventEmitter);
exports.HttpsSmartAgent = HttpsSmartAgent;

HttpsSmartAgent.defaultMaxSockets = 5;

HttpsSmartAgent.prototype.defaultPort = 443;
HttpsSmartAgent.prototype.addRequest = function(req, host, port) {
    var name = host + ':' + port;
    if (!this.sockets[name]) {
        this.sockets[name] = [];
    }
    if (this.sockets[name].length < this.maxSockets) {
        // If we are under maxSockets create a new one.
        req.onSocket(this.createSocket(name, host, port));
    } else {
        // We are over limit so we'll add it to the queue.
        if (!this.requests[name]) {
            this.requests[name] = [];
        }
        this.requests[name].push(req);
    }
};

HttpsSmartAgent.prototype.createSocket = function(name, host, port) {
    var self = this;
    var s = self.createConnection(port, host, self.options);
    if (!self.sockets[name]) {
        self.sockets[name] = [];
    }
    this.sockets[name].push(s);
    var onFree = function() {
        self.emit('free', s, host, port);
    }
    s.on('free', onFree);
    var onClose = function(err) {
        // This is the only place where sockets get removed from the Agent.
        // If you want to remove a socket from the pool, just close it.
        // All socket errors end in a close event anyway.
        self.removeSocket(s, name, host, port);
    }
    s.on('close', onClose);
    var onRemove = function() {
        // We need this function for cases like HTTP "upgrade"
        // (defined by WebSockets) where we need to remove a socket from the
        // pool
        // because it'll be locked up indefinitely
        self.removeSocket(s, name, host, port);
        s.removeListener('close', onClose);
        s.removeListener('free', onFree);
        s.removeListener('agentRemove', onRemove);
    }
    s.on('agentRemove', onRemove);
    return s;
};

HttpsSmartAgent.prototype.removeSocket = function(s, name, host, port) {
    if (this.sockets[name]) {
        var index = this.sockets[name].indexOf(s);
        if (index !== -1) {
            this.sockets[name].splice(index, 1);
            if (this.sockets[name].length === 0) {
                // don't leak
                delete this.sockets[name];
            }
        }
    }
    if (this.requests[name] && this.requests[name].length) {
        // If we have pending requests and a socket gets closed a new one
        // needs to be created to take over in the pool for the one that closed.
        this.createSocket(name, host, port).emit('free');
    }
};
