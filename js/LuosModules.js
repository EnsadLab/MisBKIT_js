//HC-sr04

const SerialLib = require('serialport');
const WSClient  = require('websocket').client;
//const Bluetooth = require('node-bluetooth');
//var   btDeviceINQ = new Bluetooth.DeviceINQ();
//var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
//var btSerial = undefined;

bluetoothPaired = undefined;

// create bluetooth device instance
//const device = new bluetooth.DeviceINQ();

//! removed setters 
//! removed ioClass ... to redo
//! removed pushMessage
//! removed emitters & user callbacks ... tothink
//! removed yields ... tothink

class Module{
    constructor(object){
        this.type = "";
        this.id = 0;        //luos id
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

    /*
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
    */

    getDirective(){
        var dir={} ,count = 0;
        Object.entries(this.modified).forEach(([k,v])=>{ //best than for in ?
            if(v>0){
                this.modified[k]=v-1;
                dir[k]=this[k];
                count++;
            }
        });
        if(count>0)
            return dir;
    }

    reset(){
    }

    cleanup(){
        //clear emitters/listeners
    }

}


class Gate extends Module{
    constructor(message){
        super(message)
        this.delay = 25;
        this.modified={delay:5}
    }
    getDirective(){
        var d = super.getDirective();
        if(d!=undefined)
            console.log("GATE:",this.alias,d);
        return d;
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

class GPIO extends Module{
    constructor(message){
        super(message);
        this.outputs    = ["p1","p7","p8","p9"];
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

class Servo extends Module{
    constructor(message){
        super(message);
        this.position = 0;
        this.parameters = [180,0.0005,0.0015];//max_angle , min_pulse , max_pulse
        this.outputs = ["position"];
    }
    setPosition(val){
        console.log("setPosition:",val)
        this.position = val;
        this.setValue("target_rot_position",parseFloat(val.toFixed(2)));                
    }
    setMaxAngle(val){
        this.parameters[0]=val;
        this.modified.parameters = 1;
    }
    setMinPulse(val){
        this.parameters[1]=val;
        this.modified.parameters = 1;
    }
    setMaxPulse(val){
        this.parameters[2]=val;
        this.modified.parameters = 1;
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
        this.motorIndex;
        this.rot_position = 0;
        this.temperature  = 0;
        this.dxlSpeed  = 0;
        this.outputs   = ["rot_position","temperature"];
        //this.
        this.modeStep   = -1;
        this.setCompliant(true)
        //this.set_id = 9;
    }

    update(message){
        super.update(message);
        //if(this.rot_position<-149) console.log("*********** popo:",this.rot_position);
        dxlManager.updatePosition(this.motorIndex,this.rot_position)
        if(message.temperature > 0){
            dxlManager.temperature(["xxx",this.motorIndex,message.temperature])
        }
    }

    getDirective(){
        if(this.set_id == undefined){
            return super.getDirective();
        }
        else{
            if(this.modified.set_id>0){
                this.modified.set_id -= 1;
                var r = {set_id:this.set_id}
                console.log("renaming",r,this.modified);
                return {set_id:this.set_id};
            }
        }
    }

    setCompliant(onoff){
        if(this.set_id == undefined){ //patch
            this.setValue("compliant",onoff);
            if(onoff){
                this.setValue("target_rot_speed",0,6); //AX12 only ?
                this.setValue("wheel_mode",true,2);
            }
        }
        //console.log("....set_id",this.set_id,this.modified)
    }

    modeWheel(){
        if(this.set_id == undefined){ //patch

        /*
        if(this.set_id != undefined){
            this.setValue("set_id",7);
        }
        console.log("....set_id",this.set_id,this.modified)
        */
        this.setValue("compliant",false);
        this.setValue("target_rot_speed",0,10);//idem +1
        this.setValue("wheel_mode",true,2);//ne marche pas forcement du 1er coup
        //this.setValue("target_rot_speed",0,5);//idem +1
        }
    }

    modeJoint(speed,pos){
        if(this.set_id == undefined) {//patch
            /*
            if(this.set_id != undefined){
                this.setValue("set_id",7);
            }
            console.log("....set_id",this.set_id,this.modified)
            */
            this.setValue("compliant",false);
            this.setValue("target_rot_position",this.rot_position,5);//idem +1
            this.setValue("wheel_mode",false,5);//ne marche pas forcement du 1er coup
            this.setValue("target_rot_speed",speed,10);//idem +1
        }
    }    
    setSpeed(val){
        if(this.set_id == undefined){ //patch

        var v = val*2;        
        this.setValue("target_rot_speed",parseFloat(val.toFixed(2)));
        }
    }
    setPower(val){
        if(this.set_id == undefined){ //patch
            let p = 110*(val/100); //AX12 : rot_speed Max : 110 ???
            this.setValue("target_rot_speed",parseFloat(p.toFixed(2)));
        }
        /*
        let dxls = 0;
        if(val>=0) dxls = (1023*val/100)|0;
        //else dxls=1024-(10.23*val)|0;
        var lb = (dxls & 0xff);
        var hb = (dxls & 0xff00)>>8;

        //var swap = (lb << 8)+hb;

        dxls = dxls & 0xff;
        console.log("dxls:",dxls,"#"+hb.toString(2)+" "+lb.toString(2));
        this.setValue("dxlSpeed",dxls);
        */
    }

    setPosition(val){
        if(this.set_id == undefined) //patch
            this.setValue("target_rot_position",parseFloat(val.toFixed(2)));                
    }

    getPosition(){
        return this.rot_position;
    }

    rename(val){
        console.log("RENAME : ",val)
        this.modified = {};
        this.setValue("set_id",val,2);
        this.setValue("rename","",2)
    }
    
    reset(){ //Pyluos :  detect():
        console.log("*******RESET:",this.alias);
        this.setValue("reinit", 0, 1)
    }

}

class LuosGate{
    constructor(id){
        this.id = id;
        this.enabled = true; //for luos alone
        this.connected = false;
        this.closing   = false;
        this.gateAlias = undefined;
        this.modules = {}; //
        //this.dynamixels = {}
    
        //this.useWifi = false; //true = wifi; false = serial
        this.connectionType = "USB"; //"WIFI" "BLUETOOTH"
        this.wifiName   = "LuosNetwork";

        //this.serialIsReady = false;
        this.serialName = undefined;
        this.serialPort = undefined;    
        this.bufferHead = 0;
        this.buffer = Buffer.alloc(1024); //serial read buffer
    
        this.wsClient = undefined;
        this.wsConnection = undefined;

        this.btConnection = undefined; //BlueTooth

        //this.dxlStep = 0;
 
        this.timerDetect = undefined;
        this.lasRcv  = undefined;
        this.lastMsgTime = 0;

        this.rcvTime  = performance.now();
        this.sendTime = performance.now();
        this.hrTime = process.hrtime();
        this.dtMin = 1000;
        this.dtMax = 0;
        
        this.blinker = undefined;
        console.log("GATE id:",this.id,typeof(this.id));
    }

    //DELETED * yieldMessages(){
    //DELETED sendDirectives(){  cf onMessage
    //DELETED collectDirectives(){

    command(alias,func,...args){
        var dog = performance.now()-this.rcvTime;
        let m = this.modules[alias];
        if((m!=undefined)&&(m[func]!=undefined)){
            return m[func](...args)
        }
    }

    sendStr(str){
        if(this.btConnection!=undefined){
            this.btConnection.write(Buffer.from(str,'utf-8'), function(err, bytesWritten) {
                if (err){ console.warn("bt write:",err); }
                //console.log("BT->",str);
            });
        }
        else if( (this.wsConnection!=undefined)&&(this.wsConnection.connected) ){
            this.wsConnection.sendUTF(str);
            console.log("WS->",str)
        }        
        else if(this.serialPort){
            var self=this;
            this.serialPort.write(Buffer.from(str),function(err){
                if(err){console.log("LUOS USB:",err)}
            });
            this.serialPort.drain(function(){
                //console.log( "DTM:",(performance.now()-self.lastMsgTime) )
                let t = performance.now();
                //console.log("SENT:",str,(t-self.lastMsgTime));
                //console.log("USB->",str);
                self.lastMsgTime = t; //performance.now();
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

        if( (performance.now()-this.sendTime)>45 ){
            //colect directives
            var momos = {} , count = 0;
            Object.entries(this.modules).forEach(([k,v])=>{
            let drt = v.getDirective();
            if( drt != undefined){
                    momos[v.alias]=drt;
                    count++;
            }
            });
            if(count>0){
                this.sendStr(JSON.stringify({modules:momos})+"\r");
                this.sendTime = performance.now();
            }
        }

        //exec message
        var parsed;
        try{ parsed = JSON.parse(json); }
        catch(err){ /*console.log("bad json")*/ }//,json.toString('utf8'))};
        if(parsed!=undefined){
            //console.log(parsed)
            if(parsed.modules!=undefined){ //V3 : message
                for( var g in parsed.modules){
                    if(this.modules[g]!=undefined){
                        this.modules[g].update(parsed.modules[g])
                    }
                }
            }
            else if(parsed.route_table!=undefined){ //V3 routeTable
                this.initModules(parsed);
            }
            else{
                console.log("???",parsed);
            }
        }        
    }
    
    //!!! new init message !!!
    //{"route_table": [{"type":"Gate","id":1,"alias":"gate"}, {"type":"Void","id": 2, "alias": "void_dxl"}, {"type": "RgbLed", "id": 3, "alias": "rgb_led_mod"}]}
    initModules(parsed){
        this.stopBlink();
        this.modules = {}
        var array = parsed.route_table;

        var info = "";
        for(var i=0;i<array.length;i++){
            var momo = array[i];
            switch(momo.type){
                case "DynamixelMotor": this.modules[momo.alias]=new DynamixelMotor(momo); break;
                case "GPIO": this.modules[momo.alias]=new GPIO(momo); break;
                case "DistanceSensor": this.modules[momo.alias]=new DistanceSensor(momo); break;
                case "LightSensor":    this.modules[momo.alias]=new LightSensor(momo);    break;
                case "Potentiometer" : this.modules[momo.alias]=new Potentiometer(momo);  break;
                case "DCMotor" : this.modules[momo.alias]=new DCMotor(momo); break;
                case "Servo" : this.modules[momo.alias]=new Servo(momo); break;
                case "Void" : this.modules[momo.alias]=new Void(momo); break;
                case "Gate" :
                    this.modules[momo.alias]=new Gate(momo);
                    this.gateAlias = momo.alias;
                    break;
                default: this.modules[momo.alias] = new Module(momo); break;
            }

            info += JSON.stringify(momo)+"\n";
            //if( momo.type == "Gate"){ //old was 'gate'
            //    this.gateAlias = momo.alias;
            //}
        }
        this.scanDxl();

        console.log("Luos:initModules:\n",this.modules);
        sensorManager.luosNewGate();
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
        if(this.enabled){
            switch(this.connectionType){ //... use Function ?
                case "USB":
                    luosManager.scanSerials();
                    this.openSerial();
                    break;
                case "WIFI":
                    this.startWebSocket();
                    break;
                case "BLUETOOTH":
                    this.openBlueTooth();
                    break;
            }
            /*
            if(this.useWifi){
                this.startWebSocket()
                //this.openBlueTooth();
            }else{
                this.openSerial()
            }
            */
        }
    }

    close(errInfo){
        console.log("CLOSE:",errInfo)
        this.stopDetection();
        this.stopBlink();
        this.connected = false;
        this.closing   = true;

        if(this.wsConnection) {this.wsConnection.close();this.wsConnection=undefined}
        if(this.wsClient) {this.wsClient.abort();this.wsClient=undefined}

        if(this.serialPort != undefined) {
            this.serialPort.close();
            this.serialPort = undefined;
        }

       if(this.btConnection != undefined){
            console.log("CLOSE BLUETOOTH")
            try{this.btConnection.close();}
            catch(err){console.warn("btSerial:",err)}
            this.btConnection = undefined;
        }

        this.detectDecount = 0;
        this.gateAlias = undefined;
        this.modules = {};
        if(errInfo) luosManager.showState(this.id,"ERROR",errInfo)
        else luosManager.showState(this.id,false,"closed")
    }

    selectConnexion(str){//"USB" "WIF" "BLUETOOTH"
        this.close();
        this.connectionType = str;
        console.log("selectConnection:",str);
        misGUI.selectLuosConnexion(this.id,str);
    }

    selectWebsocket(name){
        this.close();
        this.wifiName = name;
        misGUI.showValue({class:"luosManager",id:this.id,func:"Wireless:",val:name})
    }

    setWifiName(name){ //from ui or settings
        this.close();
        this.wifiName = name;
        console.log("setWifiName:",name)
    }

    setSerialName(name){ //from ui or settings
        this.serialName = name;
        misGUI.showValue({class:"luosManager",id:this.id,func:"selectUSB",val:name})
    }

    startWebSocket(){
        this.stopDetection();
        this.close();
        this.wsConnection = undefined;
        this.gateAlias = undefined;
        this.openWebSocket();
    }

    openWebSocket(){
        luosManager.showState(this.id,true,"connecting to "+this.wifiName+".local" );
        this.startBlink();
        this.wsClient = new WSClient();
        this.wsConnection = undefined;
        var self = this;        
        this.wsClient.on('connectFailed',function(err){
            self.stopBlink();
            luosManager.showState(self.id,"ERROR","connectFailed:\n"+err );
            self.close("Wifi connectFailed:\n"+err);
            console.log("Luos:connectFailed:",err)
        })
        this.wsClient.on('connect',function(connection){
            luosManager.showState(self.id,true,"websocket connected" );
            self.wsConnection = connection;
            connection.on('message',function(data){
                let t = performance.now();
                let dtr = t-this.rcvTime;
                this.rcvTime = t;

                //messages tronqués
                let str = data.utf8Data.toString('utf8');
                let ig = str.indexOf('{"gate');
                if(ig>=0){
                    self.onMessage('{"modules":'+str.substr(ig));
                    //console.log("dtr:",dtr,str);
                }
                else if(str.startsWith('{"route_table":')){
                    self.onMessage(str);
                }
                //else{ console.log("WS lost:",str)}
            })
            connection.on('error',function(err){
                luosManager.showState(self.id,"ERROR","connection:",err );
                console.log("WS connection error:",err)
                //close ?
            })
            connection.on('close',function(code,desc){
                self.connected = false;
                self.wsConnection = undefined;
                luosManager.showState(self.id,false,"closed" );
                console.log("WS connection closed:",code,desc);
                if( code != 1000 ){
                    console.log("!!!!!  Closed By SERVER !!!!!!");
                    self.openWebSocket();
                }
            })
            self.connected = true;
            if(self.gateAlias == undefined)
                self.timedDetection(100);
            else
                self.stopBlink();
            misGUI.showValue({class:"luosGate",func:"enable",id:self.id,val:true});       
        });
        this.wsClient.connect('ws://'+self.wifiName+'.local:9342',null)
        //this.wsClient.connect('ws://raspberrypi.local:9342',null)

    }

    openBlueTooth(){
        console.log("OPENING BLUETOOTH ...")
        this.close();
        if(this.btConnection != undefined){
            console.log("BLUETOOTH already open?");
            return;
        }

        this.startBlink();
        var self = this;
        var addressFound = undefined;
        bluetoothPaired = [];
        //ok make a new clean one
        this.btConnection = new (require('bluetooth-serial-port')).BluetoothSerialPort();
        this.btConnection.on('data', function(buffer) {
            try{
                var spl = buffer.toString('utf-8').split(/\r\n|\r|\n/g); //(/\r?\n/);
                console.log("bt>",spl);
                for(var i=0;i<spl.length;i++){
                    //if(self.gateAlias==undefined)
                    //console.log(spl[i]);

                    if( (spl[i].length>12) && (spl[i][0]=='{') && ( spl[i].endsWith("}") ) ) //early filter modules:}}} gate }]}
                        self.onMessage(spl[i]);
                }
            }
            catch(err){console.log(err)};            
        });

        this.btConnection.on("finished",function(){
            console.log("btSerial finished:",addressFound);
            if(addressFound != undefined){
                console.log("btSerial find serial:",addressFound);                
                //btSerial.findSerialPortChannel(addressFound,function(channel){ //FAIL ?
                //    console.log("btSerial found serialPort:",address,channel)                   
                    self.btConnection.connect(addressFound,1,function(){
                        console.log('btSerial connected');
                        self.gateAlias = undefined;
                        self.connected = true;
                        self.timedDetection(100);
                        self.stopBlink();
                        luosManager.showState(self.id,true,"Bluetooth connected")
                    },function(err){
                        console.log('btSerial connect error:',err);
                        self.stopBlink();
                        luosManager.showState(self.id,"ERROR","Bluetooth:\n"+err)
                    });
                
                //},function(err){console.warn("btSerial no serial found");self.stopBlink();});
            }else{
                self.stopBlink();
                luosManager.showState(self.id,"ERROR","No Luos Bluetooth found");
            }
        });
        this.btConnection.on("closed",function(){
            self.stopBlink();
            luosManager.showState(self.id,false,"Bluetooth closed");
            console.log("BTSERIAL: closed");
        });
        this.btConnection.on("failure",function(err){
            console.log("BTSERIAL: failure:",err)
            self.stopBlink();
            luosManager.showState(self.id,"ERROR","Bluetooth failure:\n"+err)
        });
        this.btConnection.on('found', function(address, name) {
            console.log("btSerial found:",name,address,self.wifiName);
            if(name==self.wifiName){
                console.log("btSerial found luos:",name,address);
                addressFound = address;
            }
        },function(){
            console.log('btSerial found nothing');
            self.stopBlink();
            luosManager.showState(self.id,"ERROR","No Luos Bluetooth found")
        });
        //this.btConnection.inquire(); => finished

        this.btConnection.listPairedDevices(function(devices) {
            devices.forEach(function(device) {
                console.log("BlueTooth paired:",device);
                if(addressFound == undefined){
                    //bluetoothPaired.push(device);
                    if(device.name==self.wifiName){
                        addressFound = device.address;
                        console.log("bluetooth paired luos:",device.name,addressFound);
                        self.btConnection.connect(addressFound,1,function(){
                            console.log('btSerial connected');
                            self.gateAlias = undefined;
                            self.connected = true;
                            self.timedDetection(100);
                            self.stopBlink();
                            luosManager.showState(self.id,true,"Bluetooth connected")
                        },function(err){
                            console.log('btSerial connect error:',err);
                            self.stopBlink();
                            luosManager.showState(self.id,"ERROR","Bluetooth:\n"+err)
                        });
                    }
                }
    
            });
        });


    }

    openSerial(){
        this.close();
        var self = this;
        if( (this.serialName=="")||(this.serialName==undefined) ){
            luosManager.showState(this.id,"ERROR","USB error, Please Retry")
            luosManager.scanSerials(function(ports){
                console.log("RescanSerial:",ports)
                self.setSerialName(ports[0]);
            });
            return;
        }

        console.log("LUOS openserial2:",this.id,typeof(this.serialName),this.serialName);
        this.serialPort = new SerialLib(this.serialName,{baudRate:1000000}); //,highWaterMark:128});
        this.bufferHead = 0;
        this.serialPort.on('open',function(){
            if(self.serialPort){ //undefined ??? ça arrive close/open ...
                self.serialPort.flush(function(){
                    luosManager.showState(self.id,true,"waiting luos ...")
                    self.connected = true;
                    self.gateAlias = undefined;
                    self.timedDetection(50);    
                });
            }
        });

        //minimal
        //this.serialPort.on('data',function(rcv){
        //    self.gateAlias = "Gate";
        //});
/*
            for(var i=0;i<rcv.length;i++){
                var c = rcv[i];
                //self.buffer[self.bufferHead]=c;
                if(c==0xA){
                    self.gateAlias = "Gate";
                    var dt  = process.hrtime(self.hrTime);
                    self.hrTime = process.hrtime();
                    //var line = self.buffer.slice(0,self.bufferHead+1);
                    self.bufferHead = 0;
                    if(dt[1]>9000000)
                    console.log("hrTime",dt[1]/1000000) //,line.toString('utf8'))
                    break;
                }
                else if(++self.bufferHead>1022){ //!!! OVERFLOW
                    self.bufferHead=0; //forget ! ?
                    console.log("**** Luos overflow ****:");
                }
            }
        });
*/

        //! removed parser ! :
        this.serialPort.on('data',function(rcv){
            for(var i=0;i<rcv.length;i++){
                var c = rcv[i];
                self.buffer[self.bufferHead]=c;
                if(c==0xA){
                    let t = performance.now();
                    let dtr = t-this.rcvTime;
                    this.rcvTime = t;
            
                    var line = self.buffer.slice(0,self.bufferHead+1);
                    self.bufferHead = 0;
                    //if(dtr>3)
                        self.onMessage( line );
                    //if(dtr>60)
                    //console.log("DTR:",dtr); //,json)
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
            self.closing = false;
        });

        this.serialPort.on('error',(err)=>{
            console.log("LUOS Serial:",err)
            luosManager.showState(self.id,"ERROR",err);
            //self.close() ?
            self.serialPort = undefined;
            self.serialName = "";
        });        
    }//openSerial

    // hello Luos 
    stopDetection(){
        clearTimeout(this.timerDetect);
    }

    timedDetection(decount){
        if( (this.gateAlias != undefined)||(this.connected==false) )
            return; //done
        if(decount>0){
            console.log("send detection",decount); //this.detectDecount);
            this.sendStr('{"detection":{}}\r');
            this.timerDetect = setTimeout(this.timedDetection.bind(this,decount-1),500);
        }
        else{
            this.close("Luos not found");
        }
    }

    toggleWifi(onoff){
    }

    getSettings(){
        return {
            gate:this.gateAlias,
            connection: this.connectionType,
            serial:this.serialName,
            wireless:this.wifiName
        }
    }
    
    //{"detection":{}}
    reset(){
        //Object.entries(this.modules).forEach(([k,m])=>{ //best than for in ?
        var self = this;
        setTimeout(function(){
            for(var m in self.modules ){
                if( typeof(self.modules[m].reset) == "function" ){
                    self.modules[m].reset();
                }
            }//);
            self.gateAlias = undefined;
            setTimeout(self.timedDetection.bind(self,10),1000);
        },500);
    }
    
    renameDynamixel(prevDxlID,newDxlID){
        var alias = "dxl_"+prevDxlID;
        if(this.modules[alias]!=undefined){
            console.log("!!! GATE renaming DXL !!!",alias,newDxlID)
            this.modules[alias].rename(+newDxlID);
            this.reset();
        }else{
            console.log("!!! GATE renaming DXL NOT FOUND !!!",alias)
        }
    }


    scanDxl(){  //called after initModules & dxlManager
        let dcNum = 100; //ugly patch
        for(var m in this.modules ){
            var momo = this.modules[m];
            if(momo.type=="DynamixelMotor"){
                //!!! danger : renomage des 'modules' my_dxl_xx !!!
                var dxlID = +momo.alias.substr(momo.alias.lastIndexOf("_")+1);
                if(!isNaN(dxlID)){
                    momo.motorIndex = dxlManager.addLuosMotor(this.id,momo.alias,dxlID);
                    //momo.toSend = {mode:true,position:true,speed:true};
                    //momo.update     = function(){console.log("momo.Function")}
                    //momo.nextMessage = this.testYield.bind(momo); //function(){console.log("dynamixel.Message");return "dxl:"+this.alias;}
                    console.log("LUOS DLX:",momo.motorIndex)
                }
            }
            else if(momo.type=="DCMotor"){
                momo.motorIndex = dxlManager.addLuosMotor(this.id,momo.alias,dcNum);
                dcNum++;
            }
            else if(momo.type=="Servo"){
                momo.motorIndex = dxlManager.addLuosMotor(this.id,momo.alias,dcNum);
                dcNum++;
            }
        }
    }

    stopBlink(){
        clearInterval(this.blinker);
    }
 
    startBlink(){
        var self = this;
        var tog = true;        
        clearInterval(this.blinker);
        this.blinker = setInterval(function(){
            misGUI.showValue({class:"luosManager",func:"freeze",val:tog});
            misGUI.showValue({class:"luosManager",id:self.id,func:"enable",val:tog});
            if(tog) tog = false;
            else    tog = true;
        },250);
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

module.exports = { LuosGate,Module,DynamixelMotor }