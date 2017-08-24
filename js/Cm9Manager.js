// in progress


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


class Cm9Manager{
    constructor(){
        this.localIP = "192.168.4.2";
        this.cm9s = {};
        this.dxlCallback();
        this.sensorCallback();
        this.cm9s.CMxx = new CM9udp(); //
    }

    connect(cm9Id){
        this.cm9[CMxx].open();
    }
    close(cm9Id){
        this.cm9[CMxx].close();        
    }
    discard(cm9Id){

    }
    send(cm9Id,msg){

    }
    sendCmd(cm9Id,cmd,args){
        
    }
        

    setDxlCallback(cm9Id,cb){
        
    }
    setSensorCallback(cm9Id,cb){

    }
    removeDxlCallback(cm9Id){
        
    }
    removeSensorCallback(cm9Id){
        
    }
        
}

class CM9udp {
    constructor(){
        this.id = "CM00";
        this.socket = null;
        this.localIP = "192.168.4.2";
        this.localPort = 41235;
        this.remoteIP = "192.168.4.1";
        this.remotePort = 41234;
        this.rcvBuffer = new Uint8Array(1024);
        this.rcvIndex  = 0;
        this.skipCount = 0;
        this.sensorListeners = [];
    }

    isOpen(){
        return (this.socket != null)
    }

    open(inaddr,inport,incb) {
        console.log("*** UDP OPEN ***");
        var self = this;
        if(this.socket){
            this.socket.close();
        }
    
        this.socket = udp.createSocket('udp4');
        //this.socket.setBroadcast(true); //0 error
        this.socket.on('error',function(err){
            dxlManager.cm9OnOff(false);
            self.socket = null;
            alert(this.id+"\nConnexion ERROR");
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
                            var args = String.fromCharCode.apply(null,s).split(/,| /);                            
                            if(args[0]=="analogs")
                                self.onAnalogs(args);
                            else
                                dxlManager.onCm9Strings(args);
                                //dxlManager.onStringCmd(String.fromCharCode.apply(null,s));
                            //console.log("rcv string:",String.fromCharCode.apply(null,s));
                        }
                        self.rcvIndex=0;
                    }
                }
    
            }
        });

        //this.socket.bind({ address:this.remoteIP, port:this.remotePort });
        this.socket.bind(this.localPort);    
        //setInterval(udpTimed,10000);    
    };
     
    write(buffer,cb) {
        if(this.socket != null) {
            var len = buffer.length;
            //console.log("udpSend:",buffer);
            this.socket.send(buffer,0,len, this.remotePort, this.remoteIP,
                cb);
        }
    };
    
    close() {
        console.log("*** CM9 close ***");
        if(this.socket) {
            this.socket.close();
            this.socket = null;
        }
    };

    onAnalogs(args){
        var len = args.length-1;//args[0]="analogs"
        for(var i=0;i<len;i++){
            if( this.sensorListeners[i] ){
                console.log("analog callback:",i,args[i+1]);
                this.sensorListeners[i](args[i+1]);
            }    
        }
    }


    setCallback(pin,cb) {
        this.sensorListeners[+pin]=cb;
/*
        var len = this.sensorListeners.length;
        for(var i=0;i<len;i++){
            console.log(" *cb:",i,this.sensorListeners[i]);
        }
        for( pin in this.sensorListeners ){
            console.log(" *pin:",pin);
        }
*/
    }
    
    removeAllCallbacks(){
        for( pin in this.sensorListeners ){
            delete this.sensorListeners[pin];
        }
        this.sensorListeners = [];        
    }

    removeCallback(pin){
        if( pin in this.sensorListeners ){
            delete this.sensorListeners[pin];
            this.sensorListeners[pin]=undefined;
        }
    }
    
    

}