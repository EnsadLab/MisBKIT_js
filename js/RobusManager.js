const SerialLib  = require('serialport');
const WSClient   = require('websocket').client;
const dxlManager = require("./DxlManager.js");

//TODO ---> misGUI
var robusWifiSerial=function( iswifi, eltID){
    console.log("robusWifiSerial:",iswifi,eltID)
    var jqw = $('.robusManager [func=setWifiName]');
    var jqs = $('.robusManager [func=selectUSB]');
    if(eltID != undefined){
        jqw = jqw.filter("[eltID="+eltID+"]");
        jqs = jqs.filter("[eltID="+eltID+"]");        
    }
    if(iswifi){ jqs.hide(); jqw.show(); }
    else { jqw.hide(); jqs.show(); }
    misGUI.showValue({class:"robusManager",func:"serialWifi",val:iswifi}); //ID ?
}

class LuosBot{
    constructor(id){
        this.id = id;
        this.enabled = false;
        this.connected = false;
        this.gateAlias = undefined;
        this.lastMsg   = undefined;
        this.modules = {}; //
        //this.dxlMotors = {} //TO REDO

        this.isOnWifi = true; //true = wifi; false = serial
        this.wifiName   = "raspberrypi.local";
        this.serialName = undefined;
        this.serialIsReady = false;
        this.serialPort = undefined;
        this.detectDecount = 0;

        this.rcvTime = 0;
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024); //serial read buffer

        this.wsClient = undefined;
        this.wsConnection = undefined;

        this.msgTimer = undefined;
        this.msgStack = [];
    }

    getSettings(){
        var c = "usb";
        if(this.isOnWifi)c="wifi"
        return {
            gate:this.gateAlias,
            connection:c,
            serial:this.serialName,
            wifi:this.wifiName
        }
    }

    enable(onoff){
        console.log("LuosBot:enable:",this.id,onoff);
        misGUI.showValue({class:"robusManager",id:this.id,func:"enable",val:false});
        misGUI.showValue({class:"robusManager",func:"freeze",val:false}); //REMOVE when multi gates
        this.enabled = onoff;
        if(onoff){
            this.open();
        }
        else{
            this.close();
        }
    }

    onMessage(json){
        var msg;
        try{ msg = JSON.parse(json); }
        catch(err){console.log("luos:bad json:",err);console.log("luos:rcv:",json)}

        if(msg!=undefined){
            //console.log(msg);
            if(this.gateAlias==undefined){
                console.log("LUOS:gate:",this.id,msg);
                this.updateModules(msg.modules);
                this.initModules(msg.modules);
            }
            else{
                var arr = msg.modules;
                this.updateModules(arr);
                for(var i=0;i<arr.length;i++){
                    var m = arr[i];
                    if(m.type != "Gate"){
                        m.gate = this.gateAlias; //for sensor
                        sensorManager.onLuosValue(this.gateAlias,m);
                        
                        if(m.type=="DynamixelMotor"){
                            dxlManager.onLuos(m);
                        }
                        
                    }
                }
            }
            this.lastMsg = msg.modules;
            this.rcvTime = Date.now();
        }        
    }

    updateModules(array){
        for(var i=0;i<array.length;i++){
            var im = array[i];
            if(this.modules[im.alias]==undefined)
                this.modules[im.alias]={}
            var momo = this.modules[im.alias]
            for(var p in im ){
                    momo[p]=im[p]
            }
            if(im.type=="DynamixelMotor"){
                dxlManager.onLuos(im);
            }
        }
    }

    getValue(alias,param){
        if(this.modules[alias])
            return this.modules[alias][param];
        else
            return undefined; //inutile?
    }

    getAliases(){
        var als = []
        for(var m in this.modules ){
            if(this.modules[m].type!="Gate") //old firmware was'gate'
                als.push(m);
        }
        return als;
    }

    getOutputs(alias){
        var outs = []
        if(this.modules[alias]!=undefined){
            for(var i in this.modules[alias]){
                if((i!="type")&&(i!="id")&&(i!="alias")&&(i!="gate"))
                    outs.push(i);
            }
        }
        return outs;
    }

    sendObj(obj){
        var json = JSON.stringify(obj,null)+"\r";
        this.pushMsg(json); 
    }

    sendOrForget(alias,param,value){
        if(this.msgTimer==undefined){
            var str = '{"modules":{"'+alias+'":{"'+param+'":'+value+'}}}\r';
            this.pushMsg(str);
        }
    }

    pushValue(alias,param,value){
        var str = '{"modules":{"'+alias+'":{"'+param+'":'+value+'}}}\r';
        this.pushMsg(str);
    }

    flushMsg(){
        this.msgStack = [];
        this.msgTimer==undefined;
    }

    pushMsg(str){
        //if(this.serialPort==undefined)
        //    return;

        console.log("push:",this.msgStack.length,str,(Date.now()-this.rcvTime))
        if(this.msgStack.length>24)
            this.flushMsg()
        //if( (Date.now()-this.rcvTime)<1000 ){
            this.msgStack.push(str);
            if(this.msgTimer==undefined){
                this.timedSender();
            }
        //}else{
        //    robusManager.showState(this.id,"ERROR","Luos timeout")
        //    this.flushMsg();
        //}
    }

    timedSender(){
        if(this.msgStack.length>0){
            //console.log("timedSender:",this.msgStack.length);
            this.sendStr(this.msgStack.shift());
            this.msgTimer = setTimeout(this.timedSender.bind(this),20); //wait after 
        }
        else
            this.msgTimer = undefined;
    }

    sendStr(str){
        if( (this.wsConnection!=undefined)&&(this.wsConnection.connected) ){
            this.wsConnection.sendUTF(str);
            console.log("LUOS WS sent:",str)
        }        
        if(this.serialPort){
            var self=this;
            self.serialIsReady=false;
            //console.log("serialsending:",str)
            this.serialPort.drain(function(){
                self.serialPort.write(Buffer.from(str),function(err){
                    if(err){console.log("LUOS USB:",err)}
                    //else{ console.log("LUOS USB sent:",str) }
                });
            });
        }
        this.lastMsgTime = Date.now();
    }

    scanDxl(){
        for(var m in this.modules ){
            var momo = this.modules[m];
            if(momo.type=="DynamixelMotor"){
                var dxlID = +momo.alias.substr(momo.alias.lastIndexOf("_")+1);
                if(!isNaN(dxlID)){
                    dxlManager.addLuosMotor(this.id,momo.alias,dxlID);
                }
            }
        }
    }

   initModules(modules){ //array
        console.log("Luos:initModules",modules);
        var info = "";
        for(var m in this.modules ){
            var momo = this.modules[m];
            info += JSON.stringify(momo)+"\n";
            if( momo.type == "Gate"){ //old 'gate'
                this.gateAlias = momo.alias;
            }
            if(momo.type=="DynamixelMotor"){
                console.log("LUOS DXL:",momo.alias)
                var dxlID = +momo.alias.substr(momo.alias.lastIndexOf("_")+1);
                if(!isNaN(dxlID)){
                    console.log("LUOS DXL:",dxlID," luosID:",momo.alias,this.id);
                    dxlManager.addLuosMotor(this.id,momo.alias,dxlID);
                }
            }
        }
        misGUI.showValue({class:"robusManager",func:"luosInfo",val:info});
        sensorManager.luosNewGate(this.gateAlias);
    }

    open(){
        var self = this;
        this.msgStack = [];
        if(this.enabled){
            if(this.isOnWifi){
                robusManager.showState(this.id,true,"connecting to "+this.wifiName );
                this.wsClient = new WSClient();
                this.wsConnection = undefined;
                this.gateAlias = undefined;
                this.wsClient.on('connectFailed',function(err){

                    robusManager.showState(this.id,"ERROR","connectFailed:\n"+err );                    
                })
                this.wsClient.on('connect',function(connection){
                    robusManager.showState(this.id,true,"websocket connected" );
                    self.wsConnection = connection;
                    connection.on('message',function(data){
                        self.onMessage(data.utf8Data);
                    })
                    connection.on('error',function(err){
                        robusManager.showState(this.id,"ERROR","connection:",err );
                    })
                    connection.on('close',function(code,desc){
                        self.wsConnection = undefined;
                        robusManager.showState(this.id,false,"closed" );
                    })
                    self.detectDecount = 100;
                    self.timedDetection();
                    misGUI.showValue({class:"robusbot",func:"enable",id:this.id,val:true});       
                });
                this.wsClient.connect('ws://'+self.wifiName+':9342',null)
                //this.wsClient.connect('ws://raspberrypi.local:9342',null)
            }
            else{
                console.log("LuosGATE:openserial:",this.id,this.serialName);
                this.openSerial();  
            }
        }   
    }

    close(){
        this.connected = false;
        misGUI.showValue({class:"robusbot",func:"enable",id:this.id,val:false});
        if(this.wsConnection) {this.wsConnection.close();this.wsConnection=undefined}
        if(this.wsClient) {this.wsClient.abort();this.wsClient=undefined}
        //if(this.wsClient) {this.wsClient.close();this.wsClient=undefined} //no close function
        if(this.serialPort != null) {this.serialPort.close();this.serialPort = undefined;}
        this.detectDecount = 0;
        this.gateAlias = undefined;
    }

    openSerial(){
        console.log("LUOS openserial:",this.id,this.serialName);
        this.close();
        robusManager.scanSerials();
        if( this.serialName==null ){
            robusManager.showState(thi.id,"ERROR","choose usb port")
            return;
        }

        console.log("robus opening:",name);
        var self = this;
        this.serialPort = new SerialLib(this.serialName,{baudRate:1000000});
        this.bufferHead = 0;
        this.serialPort.on('open',()=>{
            if(self.serialPort) //undefined ??? ça arrive close/open
                self.serialPort.flush();
            robusManager.showState(this.id,true,"waiting luos ...")
            this.gateAlias = undefined;
            self.detectDecount = 50;
            self.timedDetection();
        });

        //this.serialPort.pipe(myparser); marche pas ????
        this.serialPort.on('data',(rcv)=>{
            self.detectDecount = 0; //stop detection request
            for(var i=0;i<rcv.length;i++){
                var c = rcv[i];
                self.buffer[this.bufferHead]=c;
                if(c==0xA){ //lf
                    var line=self.buffer.slice(0,self.bufferHead+1);
                    self.bufferHead = 0;
                    self.onMessage( line );
                }
                else if(++this.bufferHead>1022){ //!!! OVERFLOW
                    self.bufferHead=0; //forget ?
                    console.log("**** Luos overflow ****:",this.id);
                }
            }
        });

        this.serialPort.on("close",function(){
            robusManager.showState(this.id,false,"closed");
            self.serialPort = undefined;
        });

        this.serialPort.on('error',(err)=>{
            robusManager.showState(this.id,"ERROR",err);
            self.serialPort = undefined;
        });        
    }//openSerial




    timedDetection(){
        if(this.gateAlias != undefined)
            return;
        if(--this.detectDecount>1){
            console.log("send detection",this.detectDecount);
            this.sendStr('{"detection":{}}\r');
            setTimeout(this.timedDetection.bind(this),100);
        }
        else if(this.detectDecount==1){
                misGUI.showValue({class:"robusManager",id:this.id,func:"enable",val:"ERROR"});
                misGUI.showValue({class:"robusManager",func:"freeze",val:false}); //REMOVE when multi gates
                misGUI.showValue({class:"robusManager",func:"luosInfo",val:"no answer"});
        }
    }

    serialWifi(onoff){ //true = wifi; false = serial
        this.close();
        console.log("LUOS isWifi:",this.id,onoff);
        this.isOnWifi = onoff;
        if(!onoff){ //serial
            robusManager.scanSerials(); //may have changes
        }
        else{ //wifi
            //bonjour discovery ?
        }
        robusWifiSerial(onoff,this.id);  //gui changes   
    }
    
    selectUSB(name){
        console.log("luosBotselectPort:",this.id,name);
        this.close();
        this.serialName = name;
    }

    setWifiName(name){
        console.log("luosBot:setWifiName:",this.id,name);
        this.close();
        if(name!="0") //"0" may be set by MisGUI
            this.wifiName = name;
    }

    killme(){
        console.log("adieu monde cruel !",this.id);
        this.close();
        robusManager.killLuosBot(this.id);
    }
}

//====================================================

class RobusManager{
    constructor(){
        this.className = "robusManager";
        this.nextBotIndex = 0;
        this.luosBots = {};
        this.usbPorts = [];
    }

    scanDxl(){
        for( var botid in this.luosBots ){
            this.luosBots[botid].scanDxl();
        }    
    }

    /*
    sendStr(gateId,str){
        if(this.luosBots[gateId]){
            this.luosBots[gateId].sendStr(str);
        }
    }
    */
    dxl_disable(gateId,alias){
        if(this.luosBots[gateId]){
            this.luosBots[gateId].flushMsg();
            this.luosBots[gateId].pushValue(alias,"compliant",true);
        }
    }

    wheel_mode(gateId,alias){
        if(this.luosBots[gateId]){
            this.luosBots[gateId].flushMsg();
            this.luosBots[gateId].pushValue(alias,"compliant",false);
            this.luosBots[gateId].pushValue(alias,"wheel_mode",true);
            this.luosBots[gateId].pushValue(alias,"target_speed",0);
        }
    }
    joint_mode(gateId,alias,speed,pos){
        if(this.luosBots[gateId]){
            this.luosBots[gateId].flushMsg();
            this.luosBots[gateId].pushValue(alias,"compliant",false);
            this.luosBots[gateId].pushValue(alias,"wheel_mode",false);
            this.luosBots[gateId].pushValue(alias,"target_speed",speed);
            this.luosBots[gateId].pushValue(alias,"target_position",pos);
        }
    }
    target_position(id,alias,angle){
        if(this.luosBots[id]){
            this.luosBots[id].pushValue(alias,"target_position",angle.toFixed(2));
            //this.luosBots[id].pushValue(alias,"target_speed",speed);
        }
    }
    target_speed(id,alias,speed){
        if(this.luosBots[id]){
            this.luosBots[id].pushValue(alias,"target_speed",speed.toFixed(2));
        }
    }

    init(){
        console.log("==================== ROBUSmanager: init =====================");
        console.log("class:",this.className)
        misGUI.initManagerFunctions(this,this.className);
        misGUI.fillEltID("."+this.className,"Luos0")
        //this.addLuosBot();
    }

    // "cmd" "LuosX" value
    cmd(func,eltID,arg){
        console.log("robusCmd:",func,eltID,arg);
        if( eltID == undefined){
            if(this[func])
                this[func](arg);
        }
        else if(this.luosBots[eltID]!=undefined){
            if(typeof(this.luosBots[eltID][func])=='function')
                this.luosBots[eltID][func](arg);
        }
        else if(this[func])
            this[func](arg);
    }

    closeAll(){
        for( var botid in this.luosBots ){
            this.luosBots[botid].close(); //open only if enabled
        }    
        misGUI.showValue({class:"robusManager",func:"freeze",val:false});
    }
    
    addLuosBot(id){ //TODO new unique ID
        console.log("LUOS ADD GATE !!!!!!",id)
        //if(id!=undefined)
        //var id = "Luos"+this.nextBotIndex;
        this.nextBotIndex++;
        this.luosBots[id]=new LuosBot(id); 
        misGUI.cloneElement( ".robusbot",id);
        return this.luosBots[id];
    }

    killLuosBot(id){
        misGUI.removeElement(".robusbot",id);
        if(this.luosBots[id]){
            this.luosBots[id].close();
            delete this.luosBots[id];
        }
    }

    showState(id,state,info){
        console.log("LUOS showState:",id,state,info);
        misGUI.showValue({class:"robusManager",func:"freeze",val:state}); //REMOVE when multi gates
        misGUI.showValue({class:"robusManager",id:id,func:"enable",val:state});
        if(info!=undefined){
            misGUI.showValue({class:"robusManager",id:id,func:"luosInfo",val:info});
        }
    }

    freeze(onoff){
        console.log("robusManager.freeze:",onoff);
        if(onoff){
            for( var botid in this.luosBots ){
                this.luosBots[botid].open(); //open only if enabled
            }
        }
        else{
            for( var botid in this.luosBots ){
                this.luosBots[botid].close(); //close but dont change enable
            }            
        }
        misGUI.showValue({class:"robusManager",func:"freeze",val:onoff});
    }

    botByGate(gate){
        for( var botid in this.luosBots ){
            if(this.luosBots[botid].gateAlias == gate)
                return this.luosBots[botid];
        }
        return undefined;        
    }

    getGates(){
        var gates = [];
        for( var botid in this.luosBots ){
            if(this.luosBots[botid].gateAlias != undefined)
                gates.push(this.luosBots[botid].gateAlias);
        }
        return gates;
    }

    getAliases(gate){
        var bot = this.botByGate(gate)
        if(bot!=undefined)
            return bot.getAliases()

        return []
    }

    getOutputs(gate,alias){
        var bot = this.botByGate(gate)
        if(bot!=undefined)
            return bot.getOutputs(alias)

        return []
    }
 
    getPins(gate,module){ //TODO
        console.log("luos.getPins")
        return ["p0","p5","p6","p7","p8","p9"];
    }

    //TODELETE
    getOptions(){
        console.log("getOptions????????")
        return(["opt1","opt2","opt3"])
    }

    saveSettings(){
        var s = {};
        for( var botid in this.luosBots ){
            if(this.luosBots[botid].gateAlias != undefined)
                s[botid]=this.luosBots[botid].getSettings()
        }
        var json = JSON.stringify(s, null, 2);
        settingsManager.saveToConfigurationFolder("luos.json",json);
    }

    loadSettings(){
        var json = settingsManager.loadConfiguration("luos.json");
        var self = this;
        var count = 0;
        robusManager.scanSerials(function(names){
            misGUI.showValue({class:"robusManager",func:"selectUSB",names});
            robusWifiSerial( false )
            if (json) {
                var s;
                try{  s = JSON.parse(json); }
                catch(err){ console.log("BAD LUOS SETTINGS ",err)}
                if(s!=undefined){
                    for( var id in s ){
                        var c = s[id].connection;
                        console.log("LUOS settings:",s[id],c)
                        if(c=="wifi"){
                            var gate = self.addLuosBot(id);
                            gate.setWifiName(s[id].wifi);
                            gate.serialWifi(true);
                            robusWifiSerial(true)
                            gate.enable(true);
                            count++;
                        }
                        else if(c=="usb"){
                            var gate = self.addLuosBot(id);
                            gate.selectUSB(s[id].serial);
                            gate.serialWifi(false);
                            robusWifiSerial( false )
                            gate.enable(true);
                            count++;
                        }
                    }
                }
            }
            if(count==0){
                var gate = self.addLuosBot("Luos0"); //default
                gate.selectUSB(names[0]);
                gate.serialWifi(false); //serial
            }
        });
        //console.log("======= opening ws ===========")
        //openWS("raspberrypi.local");
    }
    
    scanSerials(callback){ //filter only pollen
        console.log("----- robus scan serials:");
        var self = this;
        this.usbPorts = [];
        var names = [];
        SerialLib.list(function(err, ports) {
            if (err)
                console.log("robus.scanSerials ERROR:", err);
            else {
                console.log("SerialPorts:",ports.length)
                for (var i = 0; i < ports.length; i++) {
                    console.log("serials:",ports[i].comName,ports[i].manufacturer);
                    if( (ports[i].manufacturer == "Pollen Robotics")||
                        (ports[i].manufacturer == "Pollen-Robotics")||
                        (ports[i].manufacturer == "Luos-Robotics")) //!!!
                        names.push(ports[i].comName);
                }
                console.log("robus serials:",names);
                misGUI.showValue({class:"robusManager",func:"selectUSB",val:names});
                self.usbPorts = names;
            }
            if(callback)
                callback(names);
        });            
    }
};
var rbmng = new RobusManager();
module.exports = rbmng;
