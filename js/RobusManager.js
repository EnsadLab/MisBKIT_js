
const SerialLib = require('serialport');
const WebSocket = require('websocket').w3cwebsocket;
const dns = require('dns');

$("#robusOnOff").on("mouseover",function(){
    console.log("robusOnOff mouseover");
    robusManager.scanSerials();
})

//TODO ---> misGUI
var robusWifiSerial=function( wifi, eltID){
    var jqw = $('.robusManager [func=setWifiName]');
    var jqs = $('.robusManager [func=selectPort]');
    if(eltID != undefined){
        jqw = jqw.filter("[eltID="+eltID+"]");
        jqs = jqs.filter("[eltID="+eltID+"]");        
    }
    if(wifi){ jqs.hide(); jqw.show(); }
    else { jqw.hide(); jqs.show(); }
}


class LuosSerial{
    constructor(bot){
        this.portName = "";
        this.serialPort = null;
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024);
        this.luosBot = bot;
    }

    close(){
        console.log("closing serial:",this.serialName);
        if(this.serialPort != null){
            this.serialPort.close();
            this.serialPort = null;
        }
    }
    open(name){
        this.close();
        this.portName = name;
        console.log("serial opening:",name);

        var self = this;
        this.serialPort = new SerialLib(this.serialName,{baudRate:57600});
        this.bufferHead = 0;
        this.serialPort.on('open',()=>{
            console.log("luosSerial OPENNED");
            misGUI.setManagerValue("robusManager","enable",true);
            self.detectDecount = 1000;
            self.timedDetection();
        });
        //this.serialPort.pipe(myparser); marche pas ????
        this.serialPort.on('data',(rcv)=>{
            self.detectDecount = 0; //stop request
            for(var i=0;i<rcv.length;i++){
                self.rcvByte(rcv[i]);
            }   
        });
        this.serialPort.on('error',(err)=>{
            console.log("luos Serial ERROR",err);
            misGUI.setManagerValue("robusManager","enable","ERROR");
            self.serialPort = null;
        });

    }

}


class LuosBot{
    constructor(id){
        this.id = id;
        this.alias = "";
        this.modules = {};
        this.isOnWifi = true; //true = wifi; false = serial
        this.wifiName   = undefined;
        this.serialName = undefined;
        this.serialPort = null;
        this.detectDecount = 0;
        this.gotBase = false;        
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024);
    }

    enable(onoff){
        console.log("LuosBot:enable:",this.id,onoff);
        if(onoff){
            if(this.isOnWifi) console.log("LuosBot:openwifi:",this.id,this.wifiName);
            else{
                console.log("LuosBot:openserial:",this.id,this.serialName);
                this.openSerial();  
            }
        }
        else{
            if(this.isOnWifi) this.closeWifi();
            else this.closeSerial();            
        }
    }

    update(json){
        //var str = json.toString('ascii');
        //console.log("json:",str);
        try{
            var msg = JSON.parse(json);
            console.log("Luos:",this.id,msg);
            if(!this.gotBase){
                console.log("Luos:",this.gotBase);
                this.initModules(msg.modules);
            }
        }catch(err){
            console.log("****bad json****",err);
        } //Bad json
        
    }

    initModules(modules){
        //console.log("robus first:",modules);
        this.gotBase = true;
        var names = [];
        var params = [];
        for(var i=0;i<modules.length;i++){
            var m = modules[i];
            if( m.type == "gate"){
                console.log("gate:",m);
                /*
                var alias = m.alias;
                names.push(m.alias);
                for( var p in m){
                    if((p!="id")&&(p!="alias")&&(p!="type"))
                        params.push(p);
                }
                */
            }
        }
        /*
        console.log(" names:",names);
        console.log(" params:",params);
        misGUI.setManagerValue("robusManager","selectModule",names);
        misGUI.setManagerValue("robusManager","selectParam",params);
        */
    }




    closeSerial(){
        console.log("closing serial:",this.id,this.serialName);
        if(this.serialPort != null){
            this.serialPort.close();
            this.serialPort = null;
        }
        misGUI.setManagerValue("robusbot","enable",false,this.id);
        this.gotBase = false;
    }

    openSerial(){
        this.closeSerial();
        if(this.serialName==undefined)
            return;

        console.log("serial opening:",name);
        var self = this;
        this.serialPort = new SerialLib(this.serialName,{baudRate:57600});
        this.bufferHead = 0;
        this.serialPort.on('open',()=>{
            console.log("luosSerial OPENNED",this.id);
            misGUI.setManagerValue("robusbot","enable",true,this.id);
            this.gotBase = false;
            self.detectDecount = 1000;
            self.timedDetection();
        });
        //this.serialPort.pipe(myparser); marche pas ????
        this.serialPort.on('data',(rcv)=>{
            self.detectDecount = 0; //stop request
            for(var i=0;i<rcv.length;i++){
                var c = rcv[i];
                self.buffer[this.bufferHead]=c;
                if(c==0xA){ //lf
                    var line=self.buffer.slice(0,self.bufferHead+1);
                    self.bufferHead = 0;
                    self.update( line );
                }
                else if(++this.bufferHead>1022){ //!!! OVERFLOW
                    this.bufferHead=0; //forget ?
                    console.log("**** Luos overflow ****:",this.id);
                }
            }
        });
        this.serialPort.on('error',(err)=>{
            console.log("luos Serial ERROR:",this.id,err);
            misGUI.setManagerValue("robusManager","enable","ERROR",this.id);
            self.serialPort = null;
        });        
    }//openSerial

    timedDetection(){
        if(--this.detectDecount>0){
            if(this.serialPort != null){
                console.log("send detection",this.detectDecount);
                this.serialPort.write('{"detection":{}}\r');
                setTimeout(this.timedDetection.bind(this),200);
            }
            else{
                console.log("serialPort NULL ???");
                misGUI.setManagerValue("robusManager","enable","ERROR");
            }            
        }
        else
            console.log("end detection",this.detectDecount);        
    }

    
    closeWifi(){
        console.log("closing wifi:",this.id);        
        misGUI.setManagerValue("robusbot","enable",false,this.id);
    }

    serialWifi(onoff){ //true = wifi; false = serial
        console.log("isWifi:",this.id,onoff);
        this.isOnWifi = onoff;
        this.closeSerial();
        this.closeWifi();
        if(!onoff){ //serial
            robusManager.scanSerials(function(names){
                misGUI.setManagerValue("robusManager","selectPort",names); //all selectors
            });
        }
        else{ //wifi
            //this.closeWebSocket();
        }
        robusWifiSerial(onoff,this.id);     
    }
    
    selectPort(name){
        console.log("luosBotselectPort:",this.id,name);
        this.closeSerial();
        this.serialName = name;
    }

    setWifiName(name){
        console.log("luosBot:setWifiName:",this.id,name);
        this.wifiName = name;
    }
}


class RobusManager{
    constructor(){
        this.nextBotIndex = 0;
        this.luosBots = {};
        this.className = "robusManager";
        this.wifiName   = "";
        this.serialName = null; //noSelection
        this.serialPort = null;
        this.detectDecount = 0;
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024);

        this.firstMsg = true;

    }

    init(){
        console.log("ROBUSmanager:",this);
        misGUI.initManagerFunctions(this,this.className);
        this.addLuosBot();

        //Test : misGUI.setManagerValue("robusManager","plugInfo","!SPANTEXT!");
        //Test : misGUI.setManagerValue("robusManager","textArea","bla bla\nyoupiyoupa");
    }

    addLuosBot(){
        var id = "LB"+this.nextBotIndex;
        this.nextBotIndex++;        
        console.log("addLuosBot:",id);
        this.luosBots[id]=new LuosBot(id); 
        misGUI.cloneElement( ".robusbot",id);       
    }

    // "cmd" 42 value
    cmd(func,eltID,arg){
        console.log("robusCmd:",func,eltID,arg);
        if( eltID == undefined){
            if(this[func])
            this[func](arg);
        }
        else{
            this.luosBots[eltID][func](arg);
        }
    }

    enable(onoff){
        for( var botid in this.luosBots ){
            console.log("--------botID:",botid);
            this.luosBots[botid].enable(false);
        }

        console.log("robusManager.enable:",onoff);
        if(onoff){
            this.firstMsg = true;
            if(this.serialName){
                misGUI.setManagerValue("robusManager","enable",true);
                this.openSerial();
            }
            else{
                misGUI.setManagerValue("robusManager","enable","ERROR");
            }
        }
        else{
            misGUI.setManagerValue("robusManager","enable",false);
            this.closeSerial();
        }
    }

    onClick(arg1,arg2){
        console.log("robusManager.click:",arg1,arg2);        
    }

    onText(txt){
        console.log("robus.ontext:",txt)
        misGUI.setManagerValue( "robusManager","onSelect", txt);
        misGUI.setManagerValue( "robusManager","botNum",txt, 43);
    };
    onNum1(n){
        console.log("robus.onNum1:",n);
        misGUI.setManagerValue("robusManager","onNum2", n);
        if(n==0)misGUI.setManagerValue("robusManager","serialWifi",false);
        else if(n==1)misGUI.setManagerValue("robusManager","serialWifi",true);

    }
    onNum2(n){
        console.log("robus.onNum2:",n);
        misGUI.setManagerValue( "robusManager","onText", n);
        misGUI.setManagerValue( "robusManager","botNum", n , 42);
    }
    onSelect(str){
        console.log("robus.onSelect:",str);        
    }

    serialWifi(onoff){ //true = wifi; false = serial
        console.log("serialWifi",onoff);
        robusWifiSerial(onoff);        
        if(!onoff){ //serial
            this.scanSerials(function(names){
                misGUI.setManagerValue("robusManager","selectPort",names);
            });
        }
        else{ //wifi
            misGUI.setManagerValue("robusManager","enable",false);
            this.closeSerial();
        } 
    }

    selectPort(port){
        console.log("robus.selectPort:",port);
        this.serialName = port;
    }

    botText(eltID,txt){
        console.log("botText:",eltID,txt);
    }
    botNum(eltID,n){
        console.log("botText:",eltID,n);
    }





    // connect() : connect all 'robots'
    connect(robname){
        if(robname==undefined){
            $.each(this.robots, function(i,rob) {
                rob.open();
            });    
        }
        else{
            if( !(robname in this.robots) ){
                this.robots[robname]=new RobusBot(robname);
            }
            this.robots[robname].open(robname);
        }
    }

    /*
        close("octo_wifi") ou close()
        close the websocket
        !!! dont clear callbacks ( so callbacks after connect()  
    */
    close(botname){
        if(botname in this.robots){
            this.robots[botanme].close();
        }
        else{
            $.each(this.robots, function(i,rob) {
                rob.close();
            });
        }
    }

    //close all robots , remove callbacks , forget robots
    reset(){ //clean all
        
        $.each(this.robots, function(i,rob) {
            rob.close();
            rob.removeAllCallbacks();
        });
        /*
        var robs = this.robots;
        Object.keys(robs).map(function(key,eltID) {
            console.log("!delelte:",key,eltID);
            delete robs[key];
        });
        */
        this.robots={};
    }



    //example  robusManager.setCallback("octo-wifi","distance3",this.myfunc.bind(this));
    setCallback(rob,module,cb){
        console.log("robAddr:",rob);
        if( rob in this.robots ){
            this.robots[rob].setCallback(module,cb);
        }
        else{ //allow registration before connect (by settings for example)
            this.robots[rob]=new RobusBot(rob);
            this.robots[rob].setCallback(module,cb);
            //... connect automatically ? 
        }                   
    }

    //removeCallback() remove all callbacks
    //removeCallback("octo_wifi")   remove all callbacks from  octo_wifi
    //removeCallback("octo_wifi","potard2") remove only one callback
    removeCallback(rob,module){
        if(rob==undefined){
            $.each(this.robots, function(i,rob) {
                rob.removeAllCallbacks();
            });
        }
        else if( rob in this.robots ){
            this.robots[rob].removeCallback(module);           
        }
    }

    getInfo(){
        var txt="ROBUS:\n";
        $.each(this.robots, function(i,rob) {
            txt+="-- ";
            txt+=rob.name;
            txt+=" --\n";
            txt+=rob.getInfo();
        });
        return txt;
    }


    closeSerial(){
        console.log("Luos closing serial ")
        if(this.serialPort){
            this.serialPort.close();
            this.serialPort = null;
        }
    }

    showModules( bot ){
        if(!this.gotBase){
            this.initModules(bot);
        }
        /*
        var modules = bot.modules; //0 = gate
        for(var i=1;i<modules.length;i++){
            var m = modules[i];
            var cm = this.className;
            misGUI.setManagerValue( cm,"robAlias",m.alias, i);
            setGUIvalue( cm,"robId",m.id, i);
            setGUIvalue( cm,"robType",m.type, i);
            setGUIvalue( cm,"robType",m.type, i);
            setGUIvalue( cm,"robP1",m.p1, i);
            setGUIvalue( cm,"robP5",m.p5, i);
            setGUIvalue( cm,"robP6",m.p6, i);
            setGUIvalue( cm,"robP7",m.p7, i);
            setGUIvalue( cm,"robP8",m.p8, i);
            setGUIvalue( cm,"robP9",m.p9, i);
        }
        */
    }

    initModules(bot){
        console.log("robus first:",bot);
        this.firstMsg = false;
        var names = [];
        var params = [];
        var mods = bot.modules;
        for(var i=0;i<mods.length;i++){
            var m = mods[i];
            if( m.type != "gate"){
                var alias = m.alias;
                //this.modules[alias] = m;
                names.push(m.alias);
                for( var p in m){
                    if((p!="id")&&(p!="alias")&&(p!="type"))
                        params.push(p);
                }
            }
        }
        console.log(" names:",names);
        console.log(" params:",params);
        misGUI.setManagerValue("robusManager","selectModule",names);
        misGUI.setManagerValue("robusManager","selectParam",params);
    }

    rcvByte(c){
        this.buffer[this.bufferHead]=c;
        if(this.bufferHead>1023){ //!!! OVERFLOW
            this.bufferHead=0; //forget ?
            console.log("overflow");
        }
        else if(c==0xA){
            var line=this.buffer.slice(0,this.bufferHead+1);
            try{
                this.showModules(JSON.parse(line));
            }catch(err){}
            this.bufferHead=0;
        }
        else{
            this.bufferHead++;
        }    
    }
    
    scanSerials(callback){ //filter only pollen
        var names = [];
        SerialLib.list(function(err, ports) {
            if (err)
                console.log("robus.scanSerials ERROR:", err);
            else {
                for (var i = 0; i < ports.length; i++) {
                    //if(ports[i].manufacturer == "Pollen Robotics")
                        names.push(ports[i].comName);
                }
                misGUI.setManagerValue("robusManager","selectPort",names); //PLANTAGE !!!!
                //misGUI.setManagerValue("robusManager","botNum",4567); //ok
            }
            if(callback)
                callback(names);
        });            
    }


};