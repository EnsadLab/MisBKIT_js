
const LuosSerial = require('serialport');
const WebSocket = require('websocket').w3cwebsocket;
const dns = require('dns');



//TODO ---> misGUI
var setGUIvalue = function( className , func , value , eltID){
    //console.log("GUIvalue:",select , func, value , eltID);
    var elt = $('.'+className+" [func="+func+"]");
    if(eltID){
        elt = elt.filter("[eltID="+eltID+"]")
    }
    //console.log("setGUIvalue->",func,elt.length);//.prop("type"));
    //if(sel.is("input"))
    switch(elt.prop("type")){
        case "select-one":
            if(Array.isArray(value)){ //fill options with value(s)
                var prev = elt.val();
                console.log("select-one.previous:",prev);
                elt.empty();
                for(var i=0;i<value.length;i++){
                    if(value[i].length>0)
                        elt.append($("<option value=" + "'" + value[i] + "'>" + value[i] + "</option>"));
                }
                if(prev)elt.val(prev);
                else elt.val(value[0]);
                elt.trigger("change");
            }
            else
                elt.val(value);            
            break;
        case "text":
        case "number":
            elt.val(value);
            break;
        case "checkbox":
            elt.prop("checked",value);    
            break;
        default:
            console.log("GUIvalue:type unhandled:",func,elt.prop("type"));
    }
}

//TODO ---> misGUI
var cloneElement = function(selector,eltID){ //eltID may be a string
    var model = $(selector).first();
    if(model.length>0){
        var clone = model.clone(true);
        if(eltID){ //set eltID to all clone elts
            clone.attr("eltID",eltID);
            clone.find("*").attr("eltID",eltID);
        }
        clone.insertAfter(model);
        clone.show();
    }
}

//TODO ---> MISGUI
var removeElement = function(selector,eltID){
    var elt = $(selector);
    if(eltID != undefined){
        elt = elt.filter("[eltID="+eltID+"]"); //.first(); ALL?
    }
    console.log("removing:",elt);
    elt.remove();  
}


var initGUIfunctions = function(manager,className){
    var parents = $("."+className);
    parents.find("*").each(function( eltID ) {
        var func = $(this).attr("func");
        if(func){
            if(manager[func]){
                $(this).prop("manager",manager); //inutile
                switch($(this).prop("type")){
                    case "text":
                    case "number":
                        $(this).on("keydown",function(e){
                            if(e.keyCode==13){
                            //manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());
                            //return false;
                            $(this).trigger("change");
                            }                            
                        });
                    case "select-one": //select
                        $(this).on("change",function(){
                            manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());                            
                        });
                        break;
                    case "checkbox":
                        $(this).on("change",function(){
                            manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).prop("checked"));                            
                        });
                        break;
                    case "submit":  //button
                        console.log("button",$(this).attr("func"));
                        $(this).on("click",function(){
                            manager.cmd($(this).attr("name"),$(this).attr("eltID"));                            
                        });
                        break;
                    default:
                        console.log("initGUIfunctions:* type unknown *",$(this));    
                    break;
                    
                }
            }
        }
    });

}

// "robus/func/eltID values"

class RobusManager{
    constructor(){
        this.robots = {};
        this.className = "robusManager";
        this.serialName = null; //noSelection
        this.serialPort = null;
        this.detectDecount = 0;
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024);


        initGUIfunctions(this,this.className);
        cloneElement(".robusbot",3);
        cloneElement(".robusbot",2);
        cloneElement(".robusbot",1);
        removeElement(".robusbot",3);

    }

    // "cmd" 42 value
    cmd(func,eltID,arg){
        console.log("robusCmd:",func,eltID,arg);
        if(this[func]){
            if(eltID!=undefined)this[func](eltID,arg);
            else this[func](arg);
        }
    }

    enable(onoff){
        console.log("robusManager.enable:",onoff);
        if(onoff){
            if(this.serialName){
                this.openSerial();
            }
        }
        else{
            this.closeSerial();
        }
    }

    onClick(arg1,arg2){
        console.log("robusManager.click:",arg1,arg2);        
    }

    onText(txt){
        console.log("robus.ontext:",txt)
        setGUIvalue( "robusManager","onSelect", txt);
        setGUIvalue( "robusManager","botNum",txt, 43);
    };
    onNum1(n){
        console.log("robus.onNum1:",n);
        setGUIvalue("robusManager","onNum2", n);
        if(n==0)setGUIvalue("robusManager","serialWifi",false);
        else if(n==1)setGUIvalue("robusManager","serialWifi",true);

    }
    onNum2(n){
        console.log("robus.onNum2:",n);
        setGUIvalue( "robusManager","onText", n);
        setGUIvalue( "robusManager","botNum", n , 42);
    }
    onSelect(str){
        console.log("robus.onSelect:",str);        
    }

    serialWifi(onoff){
        console.log("serialWifi",onoff);
        setGUIvalue("robusManager","enable",false);
        if(!onoff){ //serial
            this.scanSerials(function(names){
                setGUIvalue("robusManager","selectPort",names);
            });
        }
        else{ //wifi
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



/*
    scanSerialPorts(callback){
        SerialPort.list().then(function(ports){
            //console.log("then...",ports);
            for(var i=0;i<ports.length;i++){
                //console.log(ports[i].manufacturer);
                if(ports[i].manufacturer == "Pollen Robotics"){
                    console.log('----GOT ONE:',ports[i].comName);
                    openLuos(ports[i].comName);
                    setupStep = 1;
                }
            }
        });
    
    }
*/


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
        if(this.serialPort){
            this.serialPort.close();
            this.serialPort = null;
        }
    }

    showModules( bot ){
        var modules = bot.modules; //0 = gate
        for(var i=1;i<modules.length;i++){
            var m = modules[i];
            var cm = this.className;
            setGUIvalue( cm,"robAlias",m.alias, i);
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
    }


    rcvByte(c){
        this.buffer[this.bufferHead]=c;
        if(this.bufferHead>1022){ //!!! OVERFLOW
            this.bufferHead=0;
            console.log("overflow");
        }
        else if(c==0xA){
            var line=this.buffer.slice(0,this.bufferHead+1);
            try{
                var robot = JSON.parse(line);
                console.log(robot);
                this.showModules(robot);

            }catch(err){}
            this.bufferHead=0;
        }
        else{
            this.bufferHead++;
        }    
    }

    timedDetection(){
        if(--this.detectDecount>0){
            console.log("send detection")
            if(this.serialPort){
                this.serialPort.write('{"detection":{}}\r');
                setTimeout(this.timedDetection.bind(this),250);
            }
        }            
    }
    
    openSerial(){
        var self = this;
        console.log("openLuos...",this.serialName);
        this.serialPort = new LuosSerial(this.serialName,{baudRate:57600});
        this.serialPort.on('open',()=>{
            console.log("OPENNED");
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
                    if(ports[i].manufacturer == "Pollen Robotics")
                        names.push(ports[i].comName);
                }
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