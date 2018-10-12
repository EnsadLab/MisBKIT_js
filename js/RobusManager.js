
const SerialLib = require('serialport');
const WebSocket = require('websocket').w3cwebsocket;
const dns = require('dns');

//self._send({'modules': {old: {'set_alias': new}}})



/*
$("#robusOnOff").on("mouseover",function(){
    console.log("robusOnOff mouseover");
    robusManager.scanSerials();
})
*/

//TODO ---> misGUI
var robusWifiSerial=function( iswifi, eltID){
    var jqw = $('.robusManager [func=setWifiName]');
    var jqs = $('.robusManager [func=selectPort]');
    if(eltID != undefined){
        jqw = jqw.filter("[eltID="+eltID+"]");
        jqs = jqs.filter("[eltID="+eltID+"]");        
    }
    if(iswifi){ jqs.hide(); jqw.show(); }
    else { jqw.hide(); jqs.show(); }
}

/*
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
*/

class LuosBot{
    constructor(id){
        this.id = id;
        this.enabled = false; 
        this.gateAlias = undefined;
        this.modules = undefined;
        this.isOnWifi = true; //true = wifi; false = serial
        this.wifiName   = undefined;
        this.serialName = undefined;
        this.serialPort = null;
        this.detectDecount = 0;
        this.gotBase = false;
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024);
        //this.sensors = {};
    }

    enable(onoff){
        console.log("LuosBot:enable:",this.id,onoff);
        this.enabled = onoff;
        if(onoff){
            this.open();
        }
        else{
            this.close();
        }
    }

    update(json){
        try{
            var msg = JSON.parse(json);
            if(!this.gotBase){
                console.log("LUOS:first:",this.id,msg);
                this.initModules(msg.modules);
            }
            else{
                console.log("LUOS:",msg)
                //this.testOutput(msg);
                var arr = msg.modules;
                for(var i=0;i<arr.length;i++){
                    var m = arr[i];
                    if(m.type != "Gate"){ //old firmware:'gate'
                        m.gate = this.gateAlias; //for sensor
                        sensorManager.onRobusValue(m);
                    }
                }
            }
            this.modules = msg.modules;
        }catch(err){
            console.log("luos:bad json:",this.gotBase,err);
        } //Bad json        
    }

    testOutput(msg){
        if(this.servoTime==undefined)
            this.servoTime = Date.now();

        var t = Date.now();
        if( (t-this.servoTime) > 500){
            this.servoTime = t;
            var r = (Math.random()*255)|0;
            var g = (Math.random()*255)|0;
            var b = (Math.random()*255)|0;
            var p = parseFloat((Math.random()*100).toFixed(1));
            //var cmd = {modules:{rgb_led_mod:{color:[r,g,b]}}};
            //var cmd = {modules:{servo1_mod:{position:p}}};
            var cmd = {modules:{my_dxl_10:{
                //moving_speed:1023,
                //wheel_mode: false,
                target_position: p
            }}};
            this.sendCmd(cmd)
        }
    }

    sendCmd(obj){
        var json = JSON.stringify(obj,null)+"\r";
        console.log(" cmd :",json); 
        this.serialPort.write(json); 
    }


    initModules(modules){
        console.log("Luos:initModules",modules);
        var names = [];
        var params = [];
        var info = "";
        for(var i=0;i<modules.length;i++){
            var m = modules[i];
            info += JSON.stringify(m)+"\n";
            if( m.type == "Gate"){ //old 'gate'
                this.gotBase = true;
                this.gateAlias = m.alias;
            }
        }
        misGUI.showValue({class:"robusManager",func:"luosInfo",val:info});

/*        
        //this.serialPort.write("{'modules': {rgb_led: {'color': [127,0,0]}}}\r");
        var r = 0|(Math.random()*255);        
        var g = 0|(Math.random()*255);        
        var b = 0|(Math.random()*255);
        var cmd = {modules:{rgb_led_mod:{color:[r,g,b]}}};
        //var cmd = {modules:{{revision,""}}}
        var json = JSON.stringify(cmd,null); //+"/r";
        console.log("LUOSjson:",json);
        this.serialPort.write(json); 
        //this.serialPort.write('{"modules":{"rgb_led_mod":{"color":[127,0,0]}}}');      
        //this.serialPort.write('{"modules":{"servo1_mod:{"position":0.0}}}');      
        //this.serialPort.write('{"modules":{"rgb_led_mod":{"revision":""}}}');      
*/

        sensorManager.robusInitSelections(); //(re)initialise la GUI
    }
    
    open(){
        if(this.enabled){
            if(this.isOnWifi){
                console.log("LuosBot:openwifi:",this.id,this.wifiName);
            }
            else{
                console.log("LuosBot:openserial:",this.id,this.serialName);
                this.openSerial();  
            }
        }   
    }

    close(){
        this.detectDecount = 0;
        if(this.isOnWifi) this.closeWifi();
        else this.closeSerial();                
    }

    closeSerial(){
        console.log("robus closing serial:",this.id,this.serialName);
        misGUI.showValue({class:"robusbot",func:"enable",id:this.id,val:false});
        misGUI.showValue({class:"robusManager",func:"luosInfo",val:""});
        if(this.serialPort != null){
            this.serialPort.close();
            this.serialPort = null;
        }
        this.gotBase = false;
    }

    openSerial(){
        this.close();
        if(this.serialName==null){
            misGUI.showValue({class:"robusManager",func:"enable",val:"ERROR"});
            return;
        }

        console.log("robus opening:",name);
        var self = this;
        this.serialPort = new SerialLib(this.serialName,{baudRate:1000000});
        this.bufferHead = 0;
        this.serialPort.on('open',()=>{
            console.log("luosSerial OPENNED",this.id);
            misGUI.setManagerValue("robusbot","enable",true,this.id);
            misGUI.setManagerValue("robusManager","freeze",true);
            this.gotBase = false;
            self.detectDecount = 100;
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
            misGUI.showValue({class:"robusManager",id:this.id,func:"enable",val:"ERROR"});
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
                misGUI.showValue({class:"robusManager",func:"enable",val:"ERROR"});
            }            
        }
        else
            console.log("end detection",this.detectDecount);
    }

    
    closeWifi(){
        console.log("closing wifi:",this.id);        
        misGUI.showValue({class:"robusbot",func:"enable",id:this.id,val:false});
        misGUI.showValue({class:"robusManager",func:"luosInfo",val:""});
    }

    serialWifi(onoff){ //true = wifi; false = serial
        console.log("isWifi:",this.id,onoff);
        this.isOnWifi = onoff;
        this.closeSerial();
        this.closeWifi();
        if(!onoff){ //serial
            robusManager.scanSerials(function(names){
                //misGUI.setManagerValue("robusManager","selectPort",names); //all selectors
                misGUI.showValue({class:"robusManager",func:"selectPort",names}); //all selectors

            });
        }
        else{ //wifi
            console.log("LUOS INIT WIFI")
            //this.closeWebSocket();
            misGUI.showValue({class:"robusManager",func:"enable",val:"ERROR"});
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

    killme(){
        console.log("adieu monde cruel !",this.id);
        this.close();
        robusManager.killLuosBot(this.id);
    }
}


class RobusManager{
    constructor(){
        this.className = "robusManager";
        this.nextBotIndex = 0;
        this.luosBots = {};
        this.sensors = {}; //sensors may exist before gates 
    }

    init(){
        //console.log("ROBUSmanager:",this);
        misGUI.initManagerFunctions(this,this.className);
        this.addLuosBot();
    }

    // "cmd" "LB42" value
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

    closeAll(){
        for( var botid in this.luosBots ){
            this.luosBots[botid].close(); //open only if enabled
        }    
    }
    
    addLuosBot(){
        var id = "LB"+this.nextBotIndex;
        this.nextBotIndex++;        
        //console.log("addLuosBot:",id);
        this.luosBots[id]=new LuosBot(id); 
        misGUI.cloneElement( ".robusbot",id);       
    }

    killLuosBot(id){
        misGUI.removeElement(".robusbot",id);
        if(this.luosBots[id]){
            this.luosBots[id].close();
            delete this.luosBots[id];
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
        //misGUI.setManagerValue("robusManager","freeze",onoff);
        misGUI.showValue({class:"robusManager",func:"freeze",val:onoff});
    }

    getBotByGate(gate){
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
        if(gates.length==0)
            gates.push("gate");
        return gates;
    }
    getModules(gate){ //TODO
        console.log("luos.getModules")
        var bot = this.getBotByGate(gate);
        //...
        return ["L0_1","L0_2","L0_3","L0_4"];
    }
    getPins(gate,module){ //TODO
        console.log("luos.getPins")
        return ["p0","p5","p6","p7","p8","p9"];
    }


    // connect() : connect all 'robots'
    /*
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
    */

    /*
        close("octo_wifi") ou close()
        close the websocket
        !!! dont clear callbacks ( so callbacks after connect()  
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
    */
    /*
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
    */

    /*
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
    */


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
    
    scanSerials(callback){ //filter only pollen
        console.log("----- robus scan serials:");
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
                misGUI.showValue({class:"robusManager",func:"selectPort",val:names});
            }
            if(callback)
                callback(names);
        });            
    }
};