const SerialLib  = require('serialport');
const WSClient   = require('websocket').client;

//! removed setters 
//! removed ioClass 
//! removed emitters & user callbacks ... tothink
//! removed yields ... tothink

class Module{
    constructor(object){
        this.type = "";
        this.id = 0;
        this.alias = "";
        this.modified={}
        this.outputs = [];
        this.update(object);
    }
    //on(event,func){ removed ... for now

    getValue(param){
        return this[param];
    }
    setValue(param,value,count = 0){
        if(count>this.modified[param])
            this.modified[param]=count;
        else if(this[param] !== value)
            this.modified[param]=1;
        this[param]=value;
        //console.log("setValue:",param,value,this[param])
    }

    update(message){
        for( var p in message ){
            this[p]=message[p]
            if(this[p]==undefined) console.log("-------- new param:",this.alias,p)
        }        
    }

    addDirective(obj){
        var dir={};
        var count = 0;
        Object.entries(this.modified).forEach(([k,v])=>{ //best than for in ?
            if(v>0){
                this.modified[k]=v-1;
                dir[k]=this[k];
                count++;
            }
        });
        if(count>0){
            obj[this.alias]=dir;
        }
        return count;
    }

    cleanup(){
    }

}

class Void extends Module{
    constructor(message){
        super(message)
    }
    reset(){ //Pyluos dxl_detect
        console.log("*******RESET:",this.alias);
        this.setValue("reinit",0,1);
    }
}

class Potentiometer extends Module{
    constructor(message){
        super(message)
        this.rot_position = 0;
        this.position = 0;
        this.outputs    = ["position"];
    }
    update(message){
        super.update(message);
        this.position = this.rot_position; //value alias for ui
    }
}

class DistanceSensor extends Module{
    constructor(message){
        super(message);
        this.trans_position = 0;
        this.distance = 0;              //value alias for ui
        this.outputs    = ["distance"];
    }
    update(message){
        super.update(message);
        this.distance = this.trans_position;
    }
}

class LightSensor extends Module{
    constructor(message){
        super(message);
        this.lux = 0;
        this.outputs = ["lux"];
    }
}

class DCMotor extends Module{
    constructor(message){
        super(message);
        this.power_ratio = 0;
    }
    setEnabled(onoff){
        if(!onoff)
            this.setPower(0);
    }    
    setPower(val){
        if(val<-100)val=-100;
        else if(val> 100)val= 100;
        this.setValue("power_ratio",parseFloat(val.toFixed(2)));        
    }
    setPosition(val){ //just to get a response
        this.setPower(val)
    }
}

class DynamixelMotor extends Module{
    constructor(message){
        super(message)
        //this.modeStep   = 0;
        this.motorId = -1;
        this.rot_position = 0;
        this.outputs    = ["rot_position","temperature"];
        this.setCompliant(true)
    }
    update(message){
        super.update(message);
        //if(this.rot_position<-149) console.log("*********** popo:",this.rot_position);
        dxlManager.updatePosition(this.motorId,this.rot_position)
    }

    setCompliant(onoff){
        this.setValue("compliant",onoff);
        if(onoff){
            this.setValue("target_rot_speed",0,6); //AX12 only ?
            this.setValue("wheel_mode",true,2);
        }
    }

    modeWheel(){
        this.setValue("compliant",false);
        this.setValue("target_rot_speed",0,10);//idem +1
        this.setValue("wheel_mode",true,2);//ne marche pas forcement du 1er coup
        //this.setValue("target_rot_speed",0,5);//idem +1
    }

    modeJoint(speed,pos){
        this.setValue("compliant",false);
        this.setValue("target_rot_position",this.rot_position,5);//idem +1
        this.setValue("wheel_mode",false,5);//ne marche pas forcement du 1er coup
        this.setValue("target_rot_speed",speed,10);//idem +1
    }    
    setSpeed(val){
        this.setValue("target_rot_speed",parseFloat(val.toFixed(2)));        
    }
    setPower(val){
        this.setValue("target_rot_speed",parseFloat(val.toFixed(2)));        
    }
    setPosition(val){
        this.setValue("target_rot_position",parseFloat(val.toFixed(2)));                
    }

    getPosition(){
        return this.rot_position;
    }
    
    reset(){ //Pyluos :  detect():
        console.log("*******RESET:",this.alias);
        this.setValue("reinit", 0, 1)
    }

}

class Gate{
    constructor(id){
        this.id = id;
        this.enabled = true; //for luos alone
        this.connected = false;
        this.gateAlias = undefined;
        this.modules = {}; //
        //this.dynamixels = {}
    
        this.useWifi = false; //true = wifi; false = serial
        this.wifiName   = "raspberrypi.local";
        this.serialName = undefined;
        //this.serialIsReady = false;
        this.serialPort = undefined;
    
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024); //serial read buffer
    
        this.wsClient = undefined;
        this.wsConnection = undefined;
    
        this.detectTimer = undefined;
        this.rcvCount = 0;

        this.lasRcv  = undefined;
        this.lastMsgTime = 0;

        this.rcvTime = Date.now();
        this.dtMin = 1000;
        this.dtMax = 0;
    }

    //DELETED * yieldMessages(){
    //DELETED sendDirectives(){  cf onMessage
    //DELETED collectDirectives(){

    sendStr(str){
        if( (this.wsConnection!=undefined)&&(this.wsConnection.connected) ){
            this.wsConnection.sendUTF(str);
            //console.log("LUOS WS sent:",str)
        }        
        if(this.serialPort){
            var self=this;
            this.serialPort.write(Buffer.from(str),function(err){
                if(err){console.log("LUOS USB:",err)}
                //self.lastMsgTime = Date.now();
            });
            this.serialPort.drain(function(){
                console.log( "DTM:",(Date.now()-self.lastMsgTime) )
                self.lastMsgTime = Date.now();
                //console.log("SENT:",str);
            });
        }
    }

    setValue(alias,param,value){
        if(this.modules[alias])
            this.modules[alias].setValue(param,value);
    }

    getValue(alias,param){
        if(this.modules[alias])
            return this.modules[alias][param];
    }

    onMessage(json){
        var t = Date.now();
        var dtr = t-this.rcvTime;
        this.rcvTime = t;
        //this.sendDirectives();
        var momos = {};
        var count = 0;
        Object.entries(this.modules).forEach(([k,v])=>{
            count += v.addDirective(momos);
        });
        if(count>0){
            this.sendStr(JSON.stringify({modules:momos})+"\r");
            //console.log("DTR:",dtr)
        }
    
        var parsed;
        try{ parsed = JSON.parse(json); }
        catch(err){console.log("LUOS:bad json")};//console.log(json.toString('utf8'))}
        //console.log("rcv:",String.fromCharCode.apply(null,json));
        if(parsed!=undefined){
            if(parsed.modules!=undefined){ //V3
                for( var g in parsed.modules){
                    if(this.modules[g]!=undefined){
                        //console.log("updateModules:",g)
                        this.modules[g].update(parsed.modules[g])
                    }
                }
            }
            else if(parsed.route_table!=undefined){ //V3 routeTable
                this.initModules(parsed);
            }
            this.lastRcv = parsed; //DBG
        }
    }
    
    //!!! new init message !!!
    //{"route_table": [{"type":"Gate","id":1,"alias":"gate"}, {"type":"Void","id": 2, "alias": "void_dxl"}, {"type": "RgbLed", "id": 3, "alias": "rgb_led_mod"}]}
    initModules(parsed){
        this.modules = {}
        var array = parsed.route_table;

        var info = "";
        for(var i=0;i<array.length;i++){
            var momo = array[i];
            switch(momo.type){
                case "DynamixelMotor": this.modules[momo.alias]=new DynamixelMotor(momo); break;
                case "DistanceSensor": this.modules[momo.alias]=new DistanceSensor(momo); break;
                case "LightSensor":    this.modules[momo.alias]=new LightSensor(momo);    break;
                case "Potentiometer" : this.modules[momo.alias]=new Potentiometer(momo);  break;
                case "DCMotor" : this.modules[momo.alias]=new DCMotor(momo); break;
                case "Void" : this.modules[momo.alias]=new Void(momo); break;
                default: this.modules[momo.alias] = new Module(momo); break;
            }

            info += JSON.stringify(momo)+"\n";
            if( momo.type == "Gate"){ //old was 'gate'
                this.gateAlias = momo.alias;
            }
        }
        this.scanDxl();

        console.log("Luos:initModules:\n",this.modules);
        sensorManager.luosNewGate();
        //this.sensorOutputs();
        luosManager.showState(this.id,true,info)
        this.connected = true;
    }

    enable(onoff){
        console.log("LuosGate:enable:",this.id,onoff);
        misGUI.showValue({class:"luosManager",id:this.id,func:"enable",val:false});
        misGUI.showValue({class:"luosManager",func:"freeze",val:false}); //REMOVE when multi gates
        this.enabled = onoff;
        if(onoff){
            this.open();
        }
        else{
            this.close();
        }
    }

    open(){
        //this.msgStack = [];
        if(this.enabled){
            if(this.useWifi){
                this.openWebSocket()
            }else{
                this.openSerial()
            }
        }
    }

    close(errInfo){
        this.connected = false;

        if(this.wsConnection) {this.wsConnection.close();this.wsConnection=undefined}
        if(this.wsClient) {this.wsClient.abort();this.wsClient=undefined}

        if(this.serialPort != undefined) {
            this.serialPort.close();
            this.serialPort = undefined;
        }

        this.detectDecount = 0;
        this.gateAlias = undefined;
        this.modules = {};
        if(errInfo) luosManager.showState(this.id,"ERROR",errInfo)
        else luosManager.showState(this.id,false,"closed")
    }

    setWifi(onoff){ //from ui or settings
        this.close();
        this.useWifi = onoff;
    }

    setWifiName(name){ //from ui or settings
        this.wifiName = name;
    }

    setSerialName(name){ //from ui or settings
        this.serialName = name;
    }

    openWebSocket(){
        this.close();
        luosManager.showState(this.id,true,"connecting to "+this.wifiName );
        this.wsClient = new WSClient();
        this.wsConnection = undefined;
        this.gateAlias = undefined;
        var self = this;
        this.wsClient.on('connectFailed',function(err){
            luosManager.showState(this.id,"ERROR","connectFailed:\n"+err );
            //...                   
        })
        this.wsClient.on('connect',function(connection){
            luosManager.showState(this.id,true,"websocket connected" );
            self.wsConnection = connection;
            connection.on('message',function(data){
                self.onMessage(data.utf8Data);
            })
            connection.on('error',function(err){
                luosManager.showState(this.id,"ERROR","connection:",err );
            })
            connection.on('close',function(code,desc){
                self.wsConnection = undefined;
                luosManager.showState(this.id,false,"closed" );
            })
            self.detectDecount = 100;
            self.timedDetection();
            misGUI.showValue({class:"luosGate",func:"enable",id:this.id,val:true});       
        });
        this.wsClient.connect('ws://'+self.wifiName+':9342',null)
        //this.wsClient.connect('ws://raspberrypi.local:9342',null)

    }

    openSerial(){
        this.close();
        if( this.serialName==undefined ){
            this.serialName = luosManager.usbPorts[0]
            if(this.serialName==undefined){
                luosManager.showState(this.id,"ERROR","choose USB port")
                luosManager.scanSerials();
            }
            return;
        }

        console.log("LUOS openserial:",this.id,this.serialName);
        var self = this;
        this.serialPort = new SerialLib(this.serialName,{baudRate:1000000});
        this.bufferHead = 0;
        this.serialPort.on('open',function(){
            if(self.serialPort){ //undefined ??? ça arrive close/open ...
                self.serialPort.flush(function(){
                    luosManager.showState(self.id,true,"waiting luos ...")
                    self.gateAlias = undefined;
                    self.rcvCount = 0;
                    self.timedDetection(50);    
                });
            }
        });

        //forget parser ! :
        this.serialPort.on('data',function(rcv){
            self.rcvCount++;
            for(var i=0;i<rcv.length;i++){
                var c = rcv[i];
                self.buffer[self.bufferHead]=c;
                //console.log(c,c==0xA,self.bufferHead);
                if(c==0xA){
                    var line = self.buffer.slice(0,self.bufferHead+1);
                    self.bufferHead = 0;
                    self.onMessage( line );
                }
                else if(++self.bufferHead>1022){ //!!! OVERFLOW
                    self.bufferHead=0; //forget ! ?
                    console.log("**** Luos overflow ****:",self.id);
                }
            }
        });

        this.serialPort.on("close",function(){
            luosManager.showState(self.id,false,"closed");
            self.serialPort = undefined;
        });

        this.serialPort.on('error',(err)=>{
            console.log("LUOS Serial:",err)
            luosManager.showState(self.id,"ERROR",err);
            //self.close() ?
            self.serialPort = undefined;
        });        
    }//openSerial

    // hello Luos 
    timedDetection(decount){
        console.log("detection",decount,this.rcvCount); //this.detectDecount);
        if( (this.gateAlias != undefined) )//||(this.rcvCount>0) )
            return; //done
        if(decount>0){
            console.log("send detection",decount); //this.detectDecount);
            this.sendStr('{"detection":{}}\r');
            setTimeout(this.timedDetection.bind(this,decount-1),50);
        }
        else{
            this.close("Luos not found");
        }
    }

    toggleWifi(onoff){
        this.close();
        this.useWifi = onoff;
        misGUI.toggleLuosWifi(this.id,onoff);
    }

    getSettings(){
        return {
            gate:this.gateAlias,
            connection: (this.useWifi)? "wifi":"usb",
            serial:this.serialName,
            wifi:this.wifiName
        }
    }
    
    reset(){
        //Object.entries(this.modules).forEach(([k,m])=>{ //best than for in ?
        for(var m in this.modules ){
            if( typeof(this.modules[m].reset) == "function" ){
                this.modules[m].reset();
            }
        }//);
        this.rcvCount = 0;
        this.gateAlias = undefined;
        setTimeout(this.timedDetection.bind(this,100),500);
    }
    

    scanDxl(){  //called after initModules & dxlManager
        let dcNum = 100; //ugly patch
        for(var m in this.modules ){
            var momo = this.modules[m];
            if(momo.type=="DynamixelMotor"){
                //!!! danger : renomage des 'modules' my_dxl_xx !!!
                var dxlID = +momo.alias.substr(momo.alias.lastIndexOf("_")+1);
                if(!isNaN(dxlID)){
                    momo.motorId = dxlManager.addLuosMotor(this.id,momo.alias,dxlID);
                    //momo.toSend = {mode:true,position:true,speed:true};
                    //momo.update     = function(){console.log("momo.Function")}
                    //momo.nextMessage = this.testYield.bind(momo); //function(){console.log("dynamixel.Message");return "dxl:"+this.alias;}
                    console.log("LUOS DLX:",momo.motorId)
                }
            }
            else if(momo.type=="DCMotor"){
                momo.motorId = dxlManager.addLuosMotor(this.id,momo.alias,dcNum);
                dcNum++;
            }
        }
    }

    /* 
    sensorOutputs(){
        var list = [];
        Object.entries(this.modules).forEach(([k,m])=>{
            for(var i=0;i<m.outputs.length; i++){
                list.push(m.alias+":"+m.outputs[i]);    
            }
        });
        sensorManager.setLuosGate(this.id,list);
        console.log("========== OUTPUTS ==========",list)
        return list;
    }
    */

    killme(){
        console.log("adieu monde cruel !",this.id);
        this.close();
        //this.clean();
        //luosManager.killGate(this.id);
    }

}//class LuosGate

module.exports = { Gate,Module,DynamixelMotor }