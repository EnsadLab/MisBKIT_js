/**
 * Created by Didier on 27/02/16.
 */

/* !!!
!!! serialport.close() --> crash sur OSX !!!
*/

var SerialStatic = null; //require("serialport");
var SerialPort   = null; //require("serialport").SerialPort;

var SerialClass = function(){

    if(SerialPort==null){
        try{
            SerialStatic = require("serialport");
            SerialPort=require("serialport").SerialPort;
        }catch(e){}
    }

    this.serialPort = null;
    this.rcvBuffer = new Uint8Array(256);
    this.rcvIndex  = 0;
    this.boundRcv  = this.onDatas.bind(this);
    this.serialName = "";
    this.skipCount = 0;
};
module.exports = SerialClass;

SerialClass.prototype.isOpen = function(){
    if(this.serialPort == null)
        return false;
    return this.serialPort.isOpen();
}

SerialClass.prototype.write= function(buffer,cb){
    var self = this;
    if(this.serialPort)
        this.serialPort.write(buffer,function(){
            self.serialPort.drain(cb);
            console.log("msglen ",buffer.length,Date.now());
        });
};
/*
SerialClass.prototype.ignore = function(datas) {
    console.log("*** ignore ***");
}
*/

SerialClass.prototype.disconnected = function(err) {
    console.log("*** disconnected ***:",err);
    misGUI.serialState("ERR");
}
SerialClass.prototype.onError = function(err) {
    console.log("*** cm9Com error ***:",err);
}


SerialClass.prototype.onDatas = function(datas){
    if(this.serialPort==null) { //!!! close provoque un plantage //
        this.skipCount++;
        return;
    }

    var len = datas.length;
    //console.log("rcv datas:",len);
    //console.log("rcv:",JSON.stringify(datas);
    var str = "";
    for(var i=0;i<len;i++){
        var c = datas[i];
        //str+= String.fromCharCode(48+(c & 0xF));
        //str+= String.fromCharCode(48+(c >> 4));
        //var c = datas[i];
        //str += " "+("00" + c.toString(16)).substr(-2);
        if(c>=32) {
            //str += String.fromCharCode(c);
            this.rcvBuffer[this.rcvIndex]=c;
            this.rcvIndex++;
        }
        else {
            if(this.rcvIndex>1) {
                //str += "$" + ("00" + c.toString(16)).substr(-2);
                this.rcvBuffer[this.rcvIndex]=0;
                var s = this.rcvBuffer.slice(0,this.rcvIndex);
                //console.log("rcv:",this.rcvIndex,"[",String.fromCharCode.apply(null,s),"]");
                //console.log("rcv(",s[0],"[",String.fromCharCode.apply(null,s),"]");
                dxlManager.onStringCmd(String.fromCharCode.apply(null,s));
                //console.log("rcv:<",String.fromCharCode.apply(null,s),">");
                //dxlManager.onStringCmd("$");
            }
            this.rcvIndex=0;
        }
    }
    //console.log("rcv:",str);
};


SerialClass.prototype.close = function(){
    var self = this;
    if(this.serialPort) {
        var sp = this.serialPort;
        this.serialPort = null;
        //sp.removeAllListeners();        //sp.disconnected();
        //sp.drain();
        //sp.pause();
        //sp.on('data',this.ignore.bind(this));
/*
        if(sp.isOpen()) {
            sp.close(function(){
              //if(err)console.log("SERIAL CLOSE ERROR:"+err);
              //else
               console.log("SERIAL CLOSED");
             });
        }
        //this.serialPort = null;
*/
    }
    this.rcvIndex = 0;
};

SerialClass.prototype.open = function(path,bauds,cb){
    var self = this;
    this.close();
    this.serialName = path;
    //this.serialPort = new SerialPort(path,{baudrate:bauds,stopbits:1},false);
    var sp = new SerialPort(path,{baudrate:bauds,stopbits:1},false);
    //sp.on('open',function(error){ //TODO error???
        /*
        console.log("SERIAL OPEN:",error);
        if(error){
            console.log("SERIAL error:",error);
            console.log(" isOpen()",self.isOpen());
        }
        else{
            console.log("SERIAL open:",self.isOpen() );
            //self.serialPort.on('data',self.boundRcv);
        }
        //if(cb)
        //    cb(error);
        */
    //});
    sp.open(function(err){
        if(err) console.log("cm9Com error:",err);
        else {
            self.serialPort = sp;
            console.log("cm9Com ok ",self.skipCount);
            console.log(" isOpen()", self.isOpen());
            //self.serialPort.drain();
            this.rcvIndex = 0;
            self.serialPort.on('error',self.onError.bind(self));
            self.serialPort.on('data',self.onDatas.bind(self));
            self.serialPort.on('disconnect',self.disconnected.bind(self));
        }
        if(cb)
            cb(err);
    });
};

SerialClass.prototype.flush = function(){
   if( this.isOpen )
       this.serialPort.flush();
}


SerialClass.prototype.list = function(cb){
    var portNames = [];
    if(SerialStatic) {
        SerialStatic.list(function (err, ports) {
            if (err)
                console.log("*** SERIAL LIST:", err);
            else {
                for (var i = 0; i < ports.length; i++) {
                    portNames.push(ports[i].comName);
                }
            }
            if(cb)
                cb(portNames);
        });
    }
};

