
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
    //this.onError = null;


};

RobusBot.prototype.close = function(n) {
    if (this.ws !== null){
        console.log("robus.closing");
        this.ws.close();

    }
    misGUI.robusOnOff(false);
}

RobusBot.prototype.open = function(addr) {
    var self = this;
    if(this.ws != null){
        this.ws.close();
    }
    this.initialized = false;
    var url = `ws://${addr}:${this.port}`;
    this.ws = new WebSocket(url);
    console.log('Robus conectingTo:',url);
    misGUI.robusWait();
    this.ws.onopen = function(){
        console.log(`Robus Connected to "${url}"!`);
        misGUI.robusOnOff(true);        
    };
    this.ws.onerror=function(e){
        misGUI.robusOnOff(false);
        alert("ROBUS ERROR\n"+addr);
        //console.log("roberr:",e);
    }
    this.ws.onclose = () => {
        self.ws=null;
        misGUI.robusOnOff(false);
    };
    this.ws.onmessage = () => {
        console.log("Robus message");
    };



}

RobusBot.prototype.sendCommand = function(alias, register, value) {
}

RobusBot.prototype.flushCommands = function() {
}
