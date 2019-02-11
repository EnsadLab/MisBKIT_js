
const SerialLib  = require('serialport');
//const mdns = require("mdns")
//const ipscanner  = require('ip-scanner')
//var mdns = require('mdns-js');
const WSClient   = require('websocket').client;

const dxlManager = require("./DxlManager.js");


//luos message ->momos->update , trigger send -> enumerates momos ...> send messages

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

class LuosModule{
    constructor(message){
        this.revision=undefined;
        this.modified={revision:true}
        this.update(message)
    }
    getValue(param){
        return this[param];
    }
    setValue(param,value){
        if(this[param] !== value)
            this.modified[param]=true;
        this[param]=value;
        //console.log("setValue:",param,this[param])
    }
    update(message){
        for( var p in message ){
            this[p]=message[p]
        }        
    }
    nextMessage(){
        //console.log("nextMessage from:",this.alias)
        //return(this.alias+"modified:",this.modified)
    }
}

class RgbLed extends LuosModule{
    constructor(message){
        super(message)
        this.modeStep = 0
    }
    nextMessage(){
    }
}

class DynamixelMotor extends LuosModule{
    constructor(message){
        super(message)
        this.modeStep = 0
    }
    nextMessage(){
        //        var str = '{"modules":{"'+alias+'":{"'+param+'":'+value+'}}}\r';
        if(this.modified.compliant){
            this.compliant = true;
            this.modified.compliant = false;
            var msg = '{"modules":{"'+this.alias+'":{"compliant":true}}}\r';
            return msg;
        }
        else if(this.modified.wheel_mode){
            //en attendant les commandes muliples dans les messages => multistep
            if(this.wheel_mode){
                var msg;
                switch(++this.modeStep){
                    case 1:
                        this.compliant=false;
                        this.modified.compliant = false;
                        msg = '{"modules":{"'+this.alias+'":{"compliant":false}}}\r';
                        break;
                    case 2:
                        msg = '{"modules":{"'+this.alias+'":{"wheel_mode":true}}}\r';
                        break;
                    case 5:
                        this.target_speed = 0;
                        this.modeStep = 0;
                        this.modified.wheel_mode = false;
                        //msg = '{"modules":{"'+this.alias+'":{"target_speed":0}}}\r';
                        break;
                }
                return msg;        
            }
            else{ //mode_joint
                switch(++this.modeStep){
                    case 1:
                        this.compliant=false;
                        this.modified.compliant = false;
                        msg = '{"modules":{"'+this.alias+'":{"compliant":false}}}\r';
                        break;
                    case 2:
                        msg = '{"modules":{"'+this.alias+'":{"wheel_mode":false}}}\r';
                        break;
                    case 3:
                        //this.target_speed = 10;
                        msg = '{"modules":{"'+this.alias+'":{"target_speed":'+this.target_speed+'}}}\r';
                        break;
                    case 4:
                        this.modeStep = 0;
                        this.modified.wheel_mode = false;
                        msg = '{"modules":{"'+this.alias+'":{"target_position":'+this.target_position+'}}}\r';
                        break;
                }
                return msg;        
            }
        }
        else if(this.modified.target_speed){
            this.modified.target_speed = false;
            return '{"modules":{"'+this.alias+'":{"target_speed":'+this.target_speed+'}}}\r';
        }
        else if(this.modified.target_position){
            this.modified.target_position = false;
            return '{"modules":{"'+this.alias+'":{"target_position":'+this.target_position+'}}}\r';
        }
    }
    /*    
    set wheel_mode(onoff){
        console.log("wheel_mode")
    }
    set target_position(pos){
        console.log("target_position")
    }
    set target_speed(speed){
        console.log("target_speed")
    }
    */
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
        //this.serialIsReady = false;
        this.serialPort = undefined;
        this.detectDecount = 0;

        this.rcvTime = 0;
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024); //serial read buffer

        this.wsClient = undefined;
        this.wsConnection = undefined;

        this.moduliterator = undefined;
        this.msgTimer = undefined;
        this.msgStack = [];

        this.testStep = 0;
    }

    * iterMsg(){
        while(true){
            var count = 0;
            for(var m in this.modules ){
                var msg = this.modules[m].nextMessage();
                yield(msg)
                //if(msg!=undefined){yield(msg);count++;}
            }
            //if(count==0) 
                yield(undefined) //a least 1 yield yield //prevent infinite loop with no yield 
        }
    }

    colorTest(){
        /*
        var r = 0|(Math.random()*255)
        var g = 0|(Math.random()*255)
        var b = 0|(Math.random()*255)
        //{"color": [0, 0, 255]}
        //var str = '{"modules":{"rgb":{"rgb_led_mod":{"color":['+r+','+g+','+b+']}}}\r';
        var str='{"modules": {"rgb_led_mod": {"color": [0,'+g+','+b+']}}}\r'
        */
        var str;
        switch(++this.testStep){
            case 1:
                //this.sendStr( '{"modules":{"rgb_led_mod":{"color":[255,0,0]}}}\r' );
                break;
            case 2:
            this.sendStr( '{"modules":{"rgb_led_mod":{"color":[255,0,0]}}}\r{"modules":{"rgb_led_mod":{"color":[0,255,0]}}}\r' );
                break;
            case 5:
                //this.sendStr(str = '{"modules":{"rgb_led_mod":{"color":[0,0,255]}}}\r');
                this.testStep = 0;
                break;
            //case 4:this.testStep = 0;break;
        }
        //this.sendStr(str);
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

    setValue(alias,param,value){
        if(this.modules[alias]){
            this.modules[alias].setValue(param,value);
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
        //this.colorTest();
        if(this.moduliterator){
            var msg = this.moduliterator.next().value;
            if(msg){
                this.sendStr(msg);
                var t = Date.now();
                var dt = t-this.rcvTime;
                console.log("iterSend:",dt,msg)
                this.rcvTime = Date.now();
                }
            /*
            var self = this;
            setTimeout(function(){
                if(this.moduliterator){
                    msg = self.moduliterator.next().value;
                    if(msg)
                        self.sendStr(msg);
                }
            },5);
            */
        }
        

        var msg;
        try{ msg = JSON.parse(json); }
        catch(err){console.log("luos:bad json:")}//,err);console.log("luos:rcv:",json)}

        if(msg!=undefined){
            /*
            var t = Date.now();
            var dt = t-this.rcvTime;
            //console.log(dt);
            this.rcvTime = Date.now();
            */
            //console.log(msg);
            if(this.gateAlias==undefined){
                this.initModules(msg.modules);
                this.updateModules(msg.modules);
            }
            else{
                var arr = msg.modules;
                this.updateModules(arr);
                for(var i=0;i<arr.length;i++){
                    var m = arr[i];
                    if(m.type != "Gate"){
                        m.gate = this.gateAlias; //for sensor
                        sensorManager.onLuosValue(this.gateAlias,m);                        
                        //moved to updatemodules
                        //if(m.type=="DynamixelMotor"){
                        //    dxlManager.onLuos(m);
                        //}
                    }
                }
            }

            //this.lastMsg = msg.modules;
            /*
            if(this.moduliterator){
            var msg = this.moduliterator.next().value;
            if(msg){
                //console.log("iter0:",msg)
                this.sendStr(msg);
            }
            var self = this;
            setTimeout(function(){
                msg = self.moduliterator.next().value;
                if(msg){
                    //console.log("iter1:",msg)
                    self.sendStr(msg);
                }
            },10);
            }
            */
            /*
            if(this.msgTimer==undefined){
                this.timedSender();
            }
            */
        }        
    }

    getValue(alias,param){
        if(this.modules[alias])
            return this.modules[alias][param];
    }//returns undefined if not found

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

    /*
    pushObjMsg(obj){
        var json = JSON.stringify(obj,null)+"\r";
        this.pushMsg(json); 
    }
    */

    //DELETED sendOrForget(alias,param,value){

    flushMsg(){ //!NOTGOOD! : may flush important messages
        this.msgStack = [];
        this.msgTimer==undefined;
    }

    pushValue(alias,param,value){
        var str = '{"modules":{"'+alias+'":{"'+param+'":'+value+'}}}\r';
        this.pushMsg(str);
    }

    pushMsg(str){
        if(!this.connected)
            return;

        console.log("push:",this.msgStack.length,str,(Date.now()-this.rcvTime),)
        if(this.msgStack.length>24)
            this.flushMsg()
        //if( (Date.now()-this.rcvTime)<1000 ){
            
            this.msgStack.push(str);

        /*
            if(this.msgTimer==undefined){
                this.timedSender();
            }
        */  
        //}else{
        //    robusManager.showState(this.id,"ERROR","Luos timeout")
        //    this.flushMsg();
        //}
    }

    timedSender(){
        if(this.msgStack.length>0){
            //console.log("timedSender:",this.msgStack.length);
            this.sendStr(this.msgStack.shift());
            this.msgTimer = setTimeout(this.timedSender.bind(this),20); //wait after sent
        }
        else
            this.msgTimer = undefined;
    }

    timedGenerator(){
        if(this.moduliterator){
            msg = this.moduliterator.next().value;
            if(msg)
                this.sendStr(msg);
            this.msgTimer = setTimeout(this.timedGenerator.bind(this),20); //wait after sent
        }
    }

    sendStr(str){
        if( (this.wsConnection!=undefined)&&(this.wsConnection.connected) ){
            this.wsConnection.sendUTF(str);
            console.log("LUOS WS sent:",str)
        }        
        if(this.serialPort){
            var self=this;
            //self.serialIsReady=false;
            //console.log("serialsending:",str)
            this.serialPort.drain(function(){
                if(self.serialPort)
                    self.serialPort.write(Buffer.from(str),function(err){
                        if(err){console.log("LUOS USB:",err)}
                        //else{ console.log("LUOS USB sent:",str) }
                });
            });
        }
        this.lastMsgTime = Date.now();
    }

    
    //TODO rescan(arraymsg)
    scanDxl(){  //called after initModules
        for(var m in this.modules ){
            var momo = this.modules[m];
            if(momo.type=="DynamixelMotor"){
                //!!! danger : renomage des 'modules' my_dxl_xx !!!
                var dxlID = +momo.alias.substr(momo.alias.lastIndexOf("_")+1);
                if(!isNaN(dxlID)){
                    var motor = dxlManager.addLuosMotor(this.id,momo.alias,dxlID);
                    //momo.toSend = {mode:true,position:true,speed:true};
                    //momo.update     = function(){console.log("momo.Function")}
                    //momo.nextMessage = this.testYield.bind(momo); //function(){console.log("dynamixel.Message");return "dxl:"+this.alias;}
                    console.log("momo:",momo)
                }
            }
        }
    }

    updateModules(array){ //Luos reception
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
                //console.log("momo.update:",typeof(momo.update)); 
            }
        }
    }

   initModules(msgArray){ //array
        this.modules = {}
        var info = "";
        for(var i=0;i<msgArray.length;i++){
            var momo = msgArray[i];
            //test momo.nextMessage = function(){console.log("momo.Message");return "msg:"+this.alias;}
            if(momo.type=="DynamixelMotor"){
                this.modules[momo.alias]=new DynamixelMotor(momo);
            }
            else 
                this.modules[momo.alias] = new LuosModule(momo);

            //this.modules[momo.alias]=momo;
            info += JSON.stringify(momo)+"\n";
            if( momo.type == "Gate"){ //old 'gate'
                this.gateAlias = momo.alias;
            }
        }

        this.scanDxl();

        this.connected = true;
        misGUI.showValue({class:"robusManager",func:"luosInfo",val:info});
        sensorManager.luosNewGate(this.gateAlias);
        console.log("Luos:initModules",this.modules);

        var gen = this.iterMsg(this.modules);
        for(var i=0;i<10;i++){
            var gn = gen.next();
            if(gn.done)
                break;
            console.log(" generator:",gn.value)
        };
        console.log("genReturn0:",gen.return());
        console.log("genReturn1:",gen.return());

        if(this.moduliterator)
            this.moduliterator.return();        
        this.moduliterator = this.iterMsg();

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
                    //...                   
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
                    misGUI.showValue({class:"luosGate",func:"enable",id:this.id,val:true});       
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

    close(errInfo){
        if(this.moduliterator){
            this.moduliterator.return();
            this.moduliterator = undefined;
        }
        this.connected = false;
        if(this.wsConnection) {this.wsConnection.close();this.wsConnection=undefined}
        if(this.wsClient) {this.wsClient.abort();this.wsClient=undefined}
        //if(this.wsClient) {this.wsClient.close();this.wsClient=undefined} //no close function
        if(this.serialPort != null) {this.serialPort.close();this.serialPort = undefined;}
        this.detectDecount = 0;
        this.gateAlias = undefined;
        this.modules = {};
        if(errInfo)
            robusManager.showState(this.id,"ERROR",errInfo)
        else
            robusManager.showState(this.id,false,"closed")

    }

    openSerial(){
        console.log("LUOS openserial:",this.id,this.serialName);
        this.close();
        robusManager.scanSerials();
        if( this.serialName==null ){
            robusManager.showState(this.id,"ERROR","choose usb port")
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
    /*
    setValue(gateId,alias,param,value){
        if(this.luosBots[gateId]){
            this.luosBots[gateId].setValue(alias,param,value);
        }
    }
    */
 
    dxl_disable(gateId,alias){
        console.log("dxl_disable",gateId,alias);
        if(this.luosBots[gateId]){
            console.log("revision:",this.luosBots[gateId].revision)
            this.luosBots[gateId].setValue(alias,"compliant",true);
            this.luosBots[gateId].setValue(alias,"revision",undefined);

            /*
            this.luosBots[gateId].flushMsg();
            this.luosBots[gateId].pushValue(alias,"compliant",true);
            */
        }
    }
    wheel_mode(gateId,alias){
        if(this.luosBots[gateId]){
            this.luosBots[gateId].setValue(alias,"wheel_mode",true);
            /*
            this.luosBots[gateId].flushMsg();
            this.luosBots[gateId].pushValue(alias,"compliant",false);
            this.luosBots[gateId].pushValue(alias,"wheel_mode",true);
            this.luosBots[gateId].pushValue(alias,"target_speed",0);
            */
        }
    }
    joint_mode(gateId,alias,speed,pos){
        if(this.luosBots[gateId]){
            this.luosBots[gateId].setValue(alias,"target_speed",speed);
            this.luosBots[gateId].setValue(alias,"target_position",pos);
            this.luosBots[gateId].setValue(alias,"wheel_mode",false);
            /*
            this.luosBots[gateId].flushMsg();
            this.luosBots[gateId].pushValue(alias,"compliant",false);
            this.luosBots[gateId].pushValue(alias,"wheel_mode",false);
            */
            this.luosBots[gateId].setValue(alias,"target_speed",speed);
            this.luosBots[gateId].setValue(alias,"target_position",pos);
            
        }
    }
    target_position(id,alias,angle){
        if(this.luosBots[id]){
            this.luosBots[id].setValue(alias,"target_position",angle.toFixed(2));
            //this.luosBots[id].pushValue(alias,"target_position",angle.toFixed(2));
        }
    }
    target_speed(id,alias,speed){
        if(this.luosBots[id]){
            this.luosBots[id].setValue(alias,"target_speed",speed.toFixed(2));
            //this.luosBots[id].pushValue(alias,"target_speed",speed.toFixed(2));
        }
    }

    init(){
        console.log("==================== ROBUSmanager: init =====================");
        console.log("class:",this.className)
        misGUI.initManagerFunctions(this,this.className);
        //misGUI.fillEltID("."+this.className,"Luos0")
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
        misGUI.cloneElement( ".luosGate",id);
        robusWifiSerial( this.luosBots[id].isOnWifi, id);
        return this.luosBots[id];
    }

    killLuosBot(id){
        misGUI.removeElement(".luosGate",id);
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

    folderIsReady(){ //dont need to store path : configuration folder
        this.loadSettings()
    }

    loadSettings(){
        console.log("===== LUOS SETTING =====")
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
                console.log("======================= LUOS SETTING2 ===========================")
                var gate = self.addLuosBot("Luos0"); //default
                gate.selectUSB(names[0]);
                gate.serialWifi(true); //serial
            }
        });
        //console.log("======= opening ws ===========")
        //openWS("raspberrypi.local");
        //this.openMDNS();
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
                //console.log("SerialPorts:",ports.length)
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

    openMDNS(){
        var browser = mdns.createBrowser();
        browser.on('ready', function () {
            console.log("MDNS:ready")
            browser.discover(); 
        });
        browser.on('update', function (data) {
            console.log('MDNS:', data);
        });
        /*
        //var mdnsBrowser = mdns.createBrowser(mdns.udp('ws'));
        var mdnsBrowser = mdns.browseThemAll();
        mdnsBrowser.on('serviceUp',function(srvc){
            console.log("MDNS up:",srvc)
        })
        mdnsBrowser.on('serviceDown',function(srvc){
            console.log("MDNS down:",srvc)
        })
        mdnsBrowser.start();
        */
       /*
       ipscanner({
        range1: [0, 10], // the next to last chunk of an ip address
        range2: [0, 10], // the last chunk of an ip address
        poolSize: 5, // how many requests to make at a time
        ports: [9342], // ports to look at for each generated ip
        timeout: 1000, // request timeout duration
        urlTemplate: "http://192.168.%s.%s" //customize how the 2 ranges will be used in the url.
        },function(result){
            console.log("IP-SCAN:",result);
        });
        */
    }


};
var rbmng = new RobusManager();
module.exports = rbmng;
