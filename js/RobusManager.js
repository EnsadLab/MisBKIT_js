
const LuosSerial = require('serialport');
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


class LuosBot{
    constructor(id){
        this.id = id;
        this.alias = "";
        this.modules = {};
        this.wifiSerial = false;
        this.wifiName   = undefined;
        this.serialName = undefined;
        this.serialPort = null;
        this.detectDecount = 0;
        this.firstMsg = true;        
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024);
    }

    closeSerial(){
        if(this.serialPort != null){
            this.serialPort.close();
            this.serialPort = null;
        }
    }
    
    serialWifi(onoff){ //true = wifi; false = serial
        console.log("serialWifi:",this.id,onoff);
        if(!onoff){ //serial
            var self = this;
            robusManager.scanSerials(function(names){
                misGUI.setManagerValue("robusManager","selectPort",names,self.id);
            });
        }
        else{ //wifi
            //this.closeWebSocket();
        }
        robusWifiSerial(onoff,this.id);     
    }
    
 


    selectPort(name){
        /*
        console.log("selectPort:",this.id,name);
        closeSerial();
        this.serialName = name;
        */
    }
    setWifiName(name){
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
        //tests
        misGUI.initManagerFunctions(this,this.className);
        //misGUI.cloneElement(".robusbot",3);
        //misGUI.cloneElement(".robusbot",2);
        //misGUI.cloneElement(".robusbot",0);
        
        //misGUI.removeElement(".robusbot",3);
        //misGUI.initManagerFunctions(this,this.className);
        this.addLuosBot();
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
        if(this.firstMsg){
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

    timedDetection(){
        if(--this.detectDecount>0){
            if(this.serialPort != null){
                console.log("send detection",this.detectDecount);
                this.serialPort.write('{"detection":{}}\r');
                setTimeout(this.timedDetection.bind(this),250);
            }
            else{
                console.log("serialPort NULL ???");
                misGUI.setManagerValue("robusManager","enable","ERROR");
            }            
        }
        else
            console.log("end detection",this.detectDecount);        
    }
    
    openSerial(){
        var self = this;
        console.log("openLuos...",this.serialName);
        this.serialPort = new LuosSerial(this.serialName,{baudRate:57600});
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

    scanSerials(callback){ //filter only pollen
        var names = [];
        LuosSerial.list(function(err, ports) {
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
            
        /*
        serialPort.list().then(function(ports){ //new serialport version
            ports.forEach(function(port){
                //console.log(port.manufacturer);            
                if(port.manufacturer == "Pollen Robotics"){
                    //console.log('----GOT Pollen:',port.comName);
                    names.push(port.comName);
                    //openLuos(port.comName);
                }
            });
            if(callback)
                callback(names);
        });
        */
    }


};