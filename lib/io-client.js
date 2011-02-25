(function () {

var sys = require('sys'),
    utils = require('./utils'),
    WebSocket = require('websocket-client').WebSocket,
    EventEmitter = require('events').EventEmitter,
    io = {};

//TODO: options -> just plain 'port'
var Socket = io.Socket = function (host, options) {
  this.url = 'ws://' + host + ':' + options.port + '/socket.io/websocket';
  this.connected = false;
  this.sessionId = null;
  this._heartbeats = 0;
};

Socket.prototype = new EventEmitter;

Socket.prototype.connect = function () {
  var self = this;

  function heartBeat() {
    self.send('~h~' + ++self._heartbeats);
  }

  this.conn = new WebSocket(this.url, 'borf');

  this.conn.onopen = function () {
    self.connected = true;
    self.emit('connect');
  };

  this.conn.onmessage = function (event) {
    var rawmsg = utils.decode(event)[0],
        frame = rawmsg.substr(0, 3),
        msg;

    switch (frame){
      case '~h~':
        return heartBeat();
      case '~j~':
        msg = JSON.parse(rawmsg.substr(3));
        break;
    }

    if (msg !== undefined) {
      self.emit('message', msg);
    }
  };

  this.conn.onclose = function () {
    self.emit('disconnect');
    self.connected = false;
  };
};

Socket.prototype.send = function (data) {
  if (this.connected) {
    this.conn.send(utils.encode(data));
  }
};

Socket.prototype.disconnect = function () {
  if (this.connected) {
    this.conn.close();
  }
};


this.io = exports.io = io;

})();

