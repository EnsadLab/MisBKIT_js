
//const dgram  = require('dgram');
//const oscMin = require('osc-min');

var getIPv4 = function(){
    var interfaces = OS.networkInterfaces();
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var addr = interfaces[k][k2];
            if (addr.internal == false && (addr.family == "IPv4"))
                return addr.address;
        }
    }
    return "127.0.0.1";
};

//pour test
var udpCount = 0;
var udpTimed = function(){
    if(cm9Com.socket != null) {
        //console.log("UDP interval");
        //console.log("udpTimed ",udpCount);
        //cm9Com.write("udpTimed " + udpCount);
        //cm9Com.sendCmd("zzz",[1,2,3]);
        //cm9Com.write("!zobizoba!");
    }
    udpCount++;
}


var CM9_UDP = function(){
    this.socket = null;
    this.localIP = "192.168.4.2";
    this.localPort = 41235;
    this.remoteIP = "192.168.4.1";
    this.remotePort = 41234;
    this.rcvBuffer = new Uint8Array(256);
    this.rcvIndex  = 0;
    //this.boundRcv  = this.onDatas.bind(this);
    this.serialName = "";
    this.skipCount = 0;

    this.rcvIndex = 0;
    this.rcvBuffer = new Uint8Array(256);

}

CM9_UDP.prototype.isOpen = function(){
    return (this.socket != null)
}

CM9_UDP.prototype.open = function( inaddr,inport,incb) {
    console.log("*** UDP OPEN ***");
    var self = this;
    if(this.socket){
        this.socket.close();
    }

    this.socket = udp.createSocket('udp4');
    //this.socket.setBroadcast(0); //error

    //this.socket.bind({ address:this.remoteIP, port:this.remotePort });
    //this.socket.bind(this.remotePort,this.remoteIP);
    //this.socket.bind(this.localPort);
    this.socket.on('error',function(err){
        console.log("***UDP",err);
        dxlManager.cm9OnOff(false);
    });
    this.socket.on('listening',function(){
        var addr = self.socket.address();
        console.log("LISTENING addr:",addr.address,addr.port,addr.family);
        dxlManager.cm9OnOff(true);
    });
    this.socket.on('message',function(datas,info){
        if(datas[0]==47){  //'/'
            var rcv = osc.fromBuffer(datas);
            //console.log('osc rcv:',info.address,info.port,'len',msg.length);
            console.log("osc msg:",rcv.address,rcv.args[0].value);
            //console.log("  datas:",rcv.args);
        }
        else{
            var len = datas.length;
            for(var i=0;i<len;i++) {
                var c = datas[i];
                if (c >= 32) {
                    self.rcvBuffer[self.rcvIndex] = c;
                    self.rcvIndex++;
                }
                else{
                    if(self.rcvIndex>1) { //skip 13 10
                        self.rcvBuffer[self.rcvIndex]=0;
                        var s = self.rcvBuffer.slice(0,self.rcvIndex); //GRRR
                        dxlManager.onStringCmd(String.fromCharCode.apply(null,s));
                        //console.log("rcv string:",String.fromCharCode.apply(null,s));
                    }
                    self.rcvIndex=0;
                }
            }

        }
    });

    //this.socket.bind(this.remotePort,this.remoteIP);
    this.socket.bind(this.localPort);
    //this.socket.bind({ address:this.remoteIP, port:this.remotePort });

    //setInterval(udpTimed,10000);

};

CM9_UDP.prototype.sendCmd = function(cmd,vals){
    var addr = "/mbk/"+cmd;
    var buf = osc.toBuffer({address: addr, args: vals });
    console.log(" send Length:",buf.length);
};

CM9_UDP.prototype.write= function(buffer,cb) {
    console.log("udpSend:",this.remoteIP);
    //var self = this;
    if(this.socket != null) {
        var len = buffer.length;
        //console.log("udpSend:",buffer,this.socket.length);
        this.socket.send(buffer,0,len, this.remotePort, this.remoteIP, cb);

    }
};

CM9_UDP.prototype.onError = function(err) {
    console.log("***UDP",err);
};

CM9_UDP.prototype.onDatas = function(datas) {
    console.log("***UDPdataslen:",datas.length);
};

CM9_UDP.prototype.close = function() {
    console.log("***UDP close");
    if(this.socket) {
        this.socket.close();
        this.socket = null;
    }
};
CM9_UDP.prototype.list = function(cb) {
    cb(["item0","item1","item2"]);
};





var OSCcm9 = function(){
    this.socket = null;
    this.status = 0;
    this.addr = "";
    this.port = -1;
    this.remoteIP = "192.168.4.1";
    this.remotePort = 41234;
};

OSCcm9.prototype.open = function() {// addr,port,cb) {
    var self = this;
    if(this.socket){
        this.socket.close();
    }

    this.socket = udp.createSocket('udp4');
    this.socket.bind({ address:this.remoteIP, port:this.remotePort });
    this.socket.on('error',function(err){
        console.log("***",err);
    });
    this.socket.on('listening',function(){
        var addr = self.socket.address();
        console.log("LISTENING addr:",addr.address,addr.port,addr.family);
    });
    this.socket.on('message',function(msg,info){
        console.log('udp rcv:',info.address,info.port,'len',msg.length);
        var datas = osc.fromBuffer(msg);
        console.log(" address:",datas.address);
        //console.log(" datas  :",datas.args);
    });

    this.socket.bind(41234);
};

OSCcm9.prototype.isOpen = function(){
    return (this.socket != null)
};
OSCcm9.prototype.write= function(buffer,cb) {
};
OSCcm9.prototype.onError = function(err) {
};
OSCcm9.prototype.onDatas = function(datas) {
};
OSCcm9.prototype.close = function() {
};



/*
sock.on('error',(err)=>{
    console.log('udp socket error:',err);
    //sock.close();
});

sock.on('message',(msg,info)=>{
    console.log('udp rcv:',rinfo.address,rinfo.port);
});

sock.on('listening',()=>{
    var addr = sock.address();
    console.log("udp addr:",addr.address,addr.port,addr.family);
});

sock.bind(41234); //listening 0.0.0.0:41234
*/

/*
var addr = sock.address();
console.log("udp addr:",addr.address,addr.port,addr.family);

sock.bind(41234,'127.0.0.1',function(){console.log('binded);});

sock.close(function(){console.log('udp closed');});

sock.send(msg,offset,length,port,address,cb)
msg = buffer
*/

