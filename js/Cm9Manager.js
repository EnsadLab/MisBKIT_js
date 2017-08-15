// in progress

class Cm9Manager{
    constructor(){
        this.dxlCallback();
        this.sensorCallback();
    }

    connect(cm9Id){

    }
    close(cm9Id){
        
    }
    discard(cm9Id){

    }
    send(cm9Id,msg){

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

class CmUDP {
    constructor(){
        this.socket = null;
        this.localIP = "192.168.4.2";
        this.localPort = 41235;
        this.remoteIP = "192.168.4.1";
        this.remotePort = 41234;
        this.rcvBuffer = new Uint8Array(256);
        this.rcvIndex  = 0;
        this.skipCount = 0;    
        this.rcvIndex = 0;
        this.rcvBuffer = new Uint8Array(256);    
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
        //this.socket.setBroadcast(0); //error
        this.socket.on('error',function(err){
            dxlManager.cm9OnOff(false);
            alert("CM9 connexion ERROR");
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

        //this.socket.bind({ address:this.remoteIP, port:this.remotePort });
        this.socket.bind(this.localPort);    
        //setInterval(udpTimed,10000);    
    };
    
    
}