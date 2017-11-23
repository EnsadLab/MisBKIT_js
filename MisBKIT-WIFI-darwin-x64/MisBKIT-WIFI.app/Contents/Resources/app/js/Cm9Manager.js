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

//reprendre à zero
class Cm9Manager{
    constructor(){
        //this.cm9 = [];
    }
    connect(cm9Id){
        //this.cm9[CMxx].open();
    }
    close(cm9Id){
        //this.cm9[CMxx].close();        
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
        this.name = "---";
        this.ready  = false;
        this.socket = null;
        this.localIP = "192.168.4.2";
        this.localPort = 41235;
        this.remoteIP = "192.168.4.1";
        this.remotePort = 41234;
        this.rcvTime   = 0; 
        this.rcvBuffer = new Uint8Array(1024);
        this.flushed   = true;
        this.pauseTimer = 0;
        this.pauseDuration = 0;
        this.sendStack = [];
        this.rcvIndex  = 0;
        this.skipCount = 0;
        this.sensorListeners = [];
        this.analogVals = [];
        this.versionTimer = undefined;
        this.versionCount = 0;
        this.index  = 0;
    }

    isOpen(){
        return (this.socket != null)
    }

    isReady(){
        return this.ready;
    }

    pushMessage(msg){
        //console.log("push:",msg);
        if(this.socket==null){
            this.forgetAll();
        }
        else{
            this.sendStack.push(msg);
            if(this.flushed){
                this.flushed = false;
                this.sendCallback(); //restart pop
            }
        }
    }

    sendCallback(){ //pop sendStack //TOTHINK ... ?socket null
        if(this.pauseDuration>0)
            return;
        if(this.sendStack.length>0){
            let msg = this.sendStack.shift();
            if(this.socket != null) {
                if(msg.charAt(0) != "&"){
                    let len = msg.length;
                    //console.log("udpSend:",msg);
                    this.socket.send(msg,0,len, this.remotePort, this.remoteIP,
                    this.sendCallback.bind(this));
                }
                else{
                    this.onCmd(msg);
                }
            }
            //else{ //forget all ????

        }
        else{
            this.flushed = true;
            //console.log("cm9flushed:");
        }
    }

    forgetAll(){
        this.sendStack = [];
        this.flushed = true;    
    }

    open(inaddr,inport,incb) {
        console.log("*** UDP OPEN ***");
        this.ready = false;
        this.stopVersionTimer();
        var self = this;
        if(this.socket){
            this.socket.close();
            this.socket = null;
        }
        misGUI.cm9Info("...wait...");        
        this.rcvTime = 0;        
        this.socket = udp.createSocket('udp4');
        //this.socket.setBroadcast(true); //0 error
        this.socket.on('error',function(err){
            this.ready = false;
            dxlManager.cm9OnOff(false);
            self.socket = null;
            alert(this.id+"\nCM9 Connexion ERROR");
        });
        this.socket.on('listening',function(){
            var addr = self.socket.address();
            console.log("CM9 LISTENING:",addr.address,addr.port,addr.family);
            self.versionTimer = setInterval(self.askVersion.bind(self),1000);
            //dxlManager.cm9OnOff(true); //--->askVersion
            //ready --> idem
        });
        this.socket.on('close',function(){
            this.ready = false;
            console.log("CM9 CLOSED:");
        });
        this.socket.on('message',function(datas,info){
            if(datas[0]==47){  //'/'
                var rcv = osc.fromBuffer(datas);
                //console.log('osc rcv:',info.address,info.port,'len',msg.length);
                //console.log("osc msg:",rcv.address,rcv.args[0].value);
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
                            else if(args[0]=="version")
                                self.onVersion(args);
                            else if(args[0]=="name")
                                self.onName(args);
                            else
                                dxlManager.onCm9Strings(args);
                                //dxlManager.onStringCmd(String.fromCharCode.apply(null,s));
                            //console.log("rcv string:",String.fromCharCode.apply(null,s));
                        }
                        self.rcvIndex=0;
                    }
                }
    
            }
            self.rcvTime = Date.now();;
            
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
        //TOTHINK remove callbacks ?
        console.log("*** CM9 close ***");
        this.stopVersionTimer();
        this.ready = false;
        if(this.socket) {
            this.socket.close();
            this.socket = null;
        }
        dxlManager.cm9OnOff(false);
        this.forgetAll();
        this.rcvTime = 0;
    };

    onAnalogs(args){ //["analogs" "1" "2" ...]
        var len = args.length-1;//args[0]="analogs"
        for(var i=0;i<len;i++){
            this.analogVals[i]=+args[i+1];
            //if( this.sensorListeners[i] ){
            //    this.sensorListeners[i](args[i+1]);
            //}    
        }
        //console.log("analogs",this.analogVals);
        sensorManager.handlePinValues(this.analogVals);
    }


    setCallback(pin,cb) {
        //console.log("cm9.setCallback:",pin);
        this.sensorListeners[+pin]=cb;
    }
    
    removeAllCallbacks(){
        //console.log("======== cm9removeAllCallbacks:");
        var self = this;
        //for( pin in this.sensorListeners ){
        $.each(this.sensorListeners, function(i,cb) {
            //console.log(" =cb pin:",i);//,self.sensorListeners[i]);
            delete self.sensorListeners[i];
        });
        /* ok : all undefined
        $.each(this.sensorListeners, function(i,cb) {
            console.log(" =del?",i,self.sensorListeners[i]);
        });
        */
        this.sensorListeners = [];        
    }

    //TODO à verifier
    removeCallback(pin){
        let p = +pin;
        if( p in this.sensorListeners ){
            delete this.sensorListeners[p];
            this.sensorListeners[p]=undefined;
            //console.log("analog removed:",p,pin);
        }
    }

 
    timedPause(){
        //console.log("cm9endPause:",this.sendStack.length);
        this.pauseDuration = 0;
        this.ready = true;
        if(this.sendStack.length>0){
            this.sendCallback();
        }                    
    }

    pushPause(duration,msg){
        //this.sendStack.push("&pause "+duration);
        if(this.socket!=null){
        this.ready = false; //-->no common messages
        this.pushMessage("&pause "+duration);
        if(msg)
            this.pushMessage(msg);
        }        
    }

    onCmd(msg){
        var spl = msg.split(/,| /);
        switch(spl[0]){
            case "&pause":
                this.pauseDuration = +spl[1];
                this.pauseTime = Date.now();
                //console.log("cm9Pause:",this.pauseTime);
                setTimeout(this.timedPause.bind(this),this.pauseDuration);
                break;                    
        }
    }

    askVersion(){
        if(++this.versionCount<6){
            //console.log("ask version:",this.versionCount);
            if(this.socket==null)
                console.log("ask null????");
            else
            //this.pushMessage("version \nname \n");
            //this.pushMessage("name \nversion \n");
            this.pushPause(100,"name \nversion \n");
        }
        else{
            this.stopVersionTimer();
            misGUI.cm9Info("---");
            this.ready = true; //!!! CONTINUE ANIWAY !!!
            //TODO no response ?
        }
    }

    stopVersionTimer(){
        clearInterval(this.versionTimer);
        this.versionTimer = undefined;
        this.versionCount = 0;
        dxlManager.cm9OnOff(true); //mmmm        
    }

    onVersion(args){
        console.log("CM9--VERSION:",args);
        //Good version ???
        this.stopVersionTimer();
        this.ready = true;
        //misGUI.cm9Info(args[1]);
        if(args[3])// v1,v2,name
            misGUI.cm9Info(args[3]);
        else
            misGUI.cm9Info("---OK---"); //mmmmm        
        dxlManager.cm9OnOff(true); //mmmm        
    }
    
    onName(args){
        console.log("CM9--NAME:",args);
        this.name = args[1];
        misGUI.cm9Info(args[1]);
        this.stopVersionTimer();
        this.ready = true;
        dxlManager.cm9OnOff(true); //mmmm        
    }
}