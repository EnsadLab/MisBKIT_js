console.log("ROBUS");

var WebSocket = require('websocket').w3cwebsocket;
const dns = require('dns');

function RobusBot(){
    this.initialized = false;
    this.host = "";
    this.port = 9342;
    this.detectionInterval = 1000;
    this.ws = null;
    this.state = {};
    this.msgsToPub = {};
    this.onupdate = null;

};

RobusBot.prototype.close = function(n) {
    if (this.ws !== null){
        console.log("robus.closing");
        this.ws.close();

    }
}

RobusBot.prototype.open = function(addr) {
    console.log("robus.open:",addr);
    var self = this;
    if(this.ws != null){
        this.ws.close();
    }
    this.initialized = false;
    var url = `ws://${addr}:${this.port}`;
    this.ws = new WebSocket(url);
    console.log('!conectingTo:',url);
    this.ws.onopen = function(){
        console.log(`Robus Connected to "${url}"!`);
    };
    this.ws.onclose = () => {
        console.log("Robus Closed");
        self.ws=null;
    };
    this.ws.onmessage = () => {
        console.log("Robus message");
    };



}

RobusBot.prototype.sendCommand = function(alias, register, value) {
}

RobusBot.prototype.flushCommands = function() {
}
