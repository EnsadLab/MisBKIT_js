const detectSSid = require('./libs/detect-ssid.js');
var net = require('net');

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



class Cm9TCPclient{
    constructor(){
        this.name = "---";
        this.num = 0;
        this.ready  = false;
        this.socket = null;
        this.localIP = "192.168.4.2";
        this.remoteIP = "192.168.4.1";
        this.remotePort = 41234;        //TCP

        this.gotVersion = false;
        //this.rcvBuffer = new Uint8Array(1024);
        this.sendCount = 0;
        this.flushed   = true;
        this.toSend = "";

        this.analogVals = [];

        this.timer = undefined;
        this.timerCount = 0;
    }

    changeCm9(num){
        //console.log("changeCm9!",num);        
        if(num!=this.num)
            this.close();
        var n = +num;
        if(n<0)n=0;
        if(n>54)n=54;
        if(n==0){ //( cm9 is AccesPoint )
            this.remoteIP = "192.168.4.1";
        }
        else{; // xxx.xxx.xxx.20x ( cm9 has static IP)
            this.localIP = getIpv4s()[0];
            if(this.localIP != undefined){ //no connection ... alert ?
                var dot = this.localIP.lastIndexOf(".")+1;
                this.remoteIP = this.localIP.substring(0,dot)+(200+n);
                //console.log("changeCm9:",n,this.remoteIP);
            }
        }
        this.num = n;
        return n;
    }

    open(){
        var self = this;
        this.ready = false;
        if(this.socket)
            this.close();
        this.socket = new net.Socket();
        this.socket.setNoDelay(true);
        this.socket.on('error',(err)=>{
            clearInterval(this.timer);
            self.ready = false;
            if(self.socket)
                self.socket.destroy();
            self.socket=null;      
            console.log("CM9.onerror onOff0",err);
            dxlManager.cm9OnOff(false);
            if(err!="destroyed")
                misGUI.cm9State("ERROR");
            //alert(this.id+"\nCM9 Connexion ERROR");
            //close appen after 'error' even after destroy
        })
        this.socket.on('connect',()=>{
            console.log("CM9 socket connect2");
            misGUI.cm9State("ON");
            self.socket.write("version\n");
            this.ready = true;
        });
        this.socket.on('drain',()=>{
            console.log("CM9 socket drain");
        });
        this.socket.on('close',()=>{
            self.ready = false;
            //if(self.socket)self.socket.destroy(); => onerror
            self.socket = null;
            console.log("CM9 onclose onOff2");
            //misGUI.cm9State("OFF"); //mmmmm        
            dxlManager.cm9OnOff(false); //mmmm 
            self.gotVersion=false;              
        })
        this.socket.on('data',(data)=>{
            //console.log("rcv:",data);
            var len = data.length;
            var cmds = String.fromCharCode.apply(null,data).split("\n");
            for(var i=0;i<cmds.length;i++){
                if(cmds[i].startsWith("dxl"))
                    //console.log("----dxl----",cmds[i]);
                    dxlManager.cmdString(cmds[i]);
                else if(cmds[i].startsWith("analogs"))
                    this.onAnalogs(cmds[i]);
                else if(cmds[i].startsWith("version"))
                    this.onVersion(cmds[i]);
            }
            //Best results: send after receive !!!
            dxlManager.sendAllMotors();
            if(self.gotVersion==false){
                self.toSend += "version\n";
            }

            if(self.toSend.length>0){
                var msg = self.toSend;
                self.toSend = "";
                self.socket.write(msg+"#"+self.sendCount+"\n"); //,cb); //+count+"\n",function(){
                self.sendCount++;
                //console.log("TCPsend:",msg);
            }

        })
        this.socket.setTimeout(5000,()=>{
            console.log("Timeout!!!");
            self.close();
            misGUI.cm9State("ERROR");       
        });

        console.log("CM9 connecting:",this.remoteIP,this.remotePort);
        misGUI.cm9Info("...wait...");
        this.ready  = false;
        this.toSend = "";
        this.gotVersion=false;
        clearInterval(this.timerCount);
        this.timerCount = 20;
        this.timer = setInterval(this.intervalWait.bind(self),500);

        this.socket.connect(this.remotePort,this.remoteIP,()=>{
            console.log("CM9.connect0 onOff3");
            clearInterval(this.timer);
            self.toSend = "";
            self.ready = true;
            dxlManager.cm9OnOff(true);  //mmmm
            misGUI.cm9Info("---OK---"); //mmmmm        
            self.socket.write("version\n");
        })
    };

    close(){
        console.log("CM9 close -----------");
        clearInterval(this.timer);
        if(this.ready){
            this.forgetAll();
            this.socket.write("dxlStop\n");
            dxlManager.cm9OnOff(false);
            dxlManager.sendAllMotors();
            this.socket.write(this.toSend);
            this.socket.write("dxlStop\n"); //on insiste !
        }
        this.ready = false;
        this.forgetAll();
        if(this.socket){
            console.log("CM9.close destroy");
            this.socket.destroy(); //"destroyed");
            this.socket=null;
        }
        this.rcvTime = 0;
        misGUI.cm9State("OFF");     
    }

    write(buffer,cb) {
        if(this.ready){
            //var len = buffer.length;
            console.log("*** CM9.write: NOOOOOOO",buffer);
            //this.socket.write(buffer,cb); //+count+"\n",function(){
        }
        else if(cb){ //skip
            cb();
        }
    };

    //----------
    isOpen(){
        return (this.socket != null)
    }
    isReady(){
        return this.ready;
    }
    pushMessage(msg){
        if(this.socket){
            //console.log("push:",msg);
            this.toSend+=msg;
        }
        else{
            this.toSend=""; //flush
        }
    }

    forgetAll(){
        this.toSend  = "";
        this.flushed = true;    
    }

    //DELETED sendCallback(){ //pop sendStack

    //---------------------------    
    intervalWait(){        
        if(--this.timerCount <= 0){
            this.close();
            misGUI.cm9State("ERROR");        
        }
        else
            misGUI.cm9State( (this.timerCount & 1)==0 );
    }

    intervalVersion(){
        if(--this.timerCount > 0){
            if(this.socket){
                this.socket.write("version\n");
            }
            misGUI.cm9State( (this.timerCount & 1)==0 );
        }
        else
            clearInterval(this.timer);
    }

    //DELETED timedPause(){
    //DELETED pushPause(duration,msg){
    //DELETED onCmd(msg){

    //-----------
    onAnalogs(str){ //"analogs 1 2 ...]
        var arr= str.split(/,| /);
        var len = arr.length-1;//arr[0]="analogs"
        for(var i=0;i<len;i++){
            this.analogVals[i]=+arr[i+1];
        }
        //console.log("analogs",this.analogVals);
        sensorManager.handlePinValues(this.analogVals);
    }

    onVersion(str){
        var arr= str.split(/,| /);
        console.log("CM9--VERSION:",arr);
        this.ready = true;
        console.log("onOff5");
        dxlManager.cm9OnOff(true); //mmmm        
        if(arr[3])// v1,v2,name
            misGUI.cm9Info(" "+arr[3]+"   v"+arr[1]+"."+arr[2]);
        else
            misGUI.cm9Info("--OK--"+" v"+arr[1]+"."+arr[2]);
        this.gotVersion=true;
    }
    
    checkConnection(){ 
        var self = this;
        this.localIP = getIpv4s()[0];
        //console.log("cm9.checkConnection ip:",this.localIP);
        detectSSid(function(error, ssid) {
            //console.log("SSID",ssid);
            if(ssid.startsWith("CM9_")){
                self.changeCm9(0);
                //console.log("direct to CM9:",self.remoteIP);
                misGUI.setCM9Num(0);
            }
            else{
                //console.log("static IP to CM9:",self.remoteIP);
                if(self.num==0)self.num = 1;
                self.changeCm9(self.num);
                misGUI.setCM9Num(self.num);
            }
        });
    }

}//CM9TCPclient

     
function getIpv4s(){
    ips = [];
    try {
        var interfaces = OS.networkInterfaces();
        for (var k in interfaces) {
            //console.log("netInterface:",interfaces[k]);
            for (var k2 in interfaces[k]) {
                var addr = interfaces[k][k2];
                if (addr.internal == false && (addr.family == "IPv4")) {
                    //console.log("localIP:",addr);
                    ips.push( addr.address );
                }
            }
        }
    }catch(e){}
    //console.log("adresses IP:",ips);
    return ips;
}
