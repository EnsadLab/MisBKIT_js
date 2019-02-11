const SerialLib  = require('serialport');
const WSClient   = require('websocket').client;

//! removed setters !
//! removed ioClass for efficiency

class Module{
    constructor(object){
        this.revision="";
        this.modified={revision:1}
        this.outputs = [];
        this.update(object);
    }
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
        }        
    }

    addDirective(obj){
        var r={};
        var count = 0;
        Object.entries(this.modified).forEach(([k,v])=>{ //best than for in ?
            if(v>0){
                this.modified[k]=v-1;
                r[k]=this[k];
                count++;
            }
        });
        if(count>0){
            obj[this.alias]=r;
        }
        return count;
    }

    cleanup(){
    }

}

class DynamixelMotor extends Module{
    constructor(message){
        super(message)
        this.modeStep   = 0;
        this.motorIndex = -1;
        this.outputs    = ["rot_position","temperature"];
    }
    update(message){
        super.update(message);
        dxlManager.updatePosition(this.motorId,this.rot_position)
    }
    test(a1,a2,a3){
        console.log("TEST",a1,a2,a3)
    }

    setCompliant(onoff){
        if(onoff){
            this.setValue("compliant",true);
        }else{ //AX 12: "compliant" = mode wheel
            //this.setValue("compliant",false);
            this.setValue("target_rot_speed",0,5);
            this.setValue("wheel_mode",true,2);
        }
    }
    modeWheel(){
        //this.setValue("compliant",true);
        this.setValue("target_rot_speed",0,5);//idem +1
        this.setValue("wheel_mode",true,2);//ne marche pas forcement du 1er coup
        //this.setValue("target_rot_speed",0,5);//idem +1
    }
    modeJoint(speed,pos){
        //this.setValue("compliant",true);
        this.setValue("target_rot_position",this.rot_position,5);//idem +1
        this.setValue("wheel_mode",false,2);//ne marche pas forcement du 1er coup
        this.setValue("target_rot_speed",speed,3);//idem +1
    }
    setSpeed(val){
        this.setValue("target_rot_speed",val);        
    }
    setPosition(val){
        this.setValue("target_rot_position",val);                
    }
    getPosition(){
        return this.rot_position;
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

    /*
    * iterMessages(){
        while(true){
            var count = 0;
            for(var m in this.modules ){
                var msg = this.modules[m].nextMessage();
                if(msg!=undefined){
                    yield(msg);
                    count++;
                }
            }
            if(count==0) //a least 1 yield //prevent infinite loop with no yield
                yield(undefined)  
        }
    }
    */

   sendDirectives(){
        var momos = {};
        var count = 0;
        Object.entries(this.modules).forEach(([k,v])=>{
            count += v.addDirective(momos);
        });
        if(count>0){
            //console.log("MOMOS:",JSON.stringify({modules:momos}))
            this.sendStr(JSON.stringify({modules:momos})+"\r");
        }
    }


    /*
    collectDirectives(){
        var momos = {};
        var count = 0;
        Object.entries(this.modules).forEach(([k,v])=>{
            var d = v.getDirective();
            if(d!=undefined){
                momos[k]=d;
                count++;
            }
        });
        if(count>0){
            //console.log("MOMOS:",JSON.stringify({modules:momos}))
            this.sendStr(JSON.stringify({modules:momos})+"\r");
        }
    }
    */

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
                self.lastMsgTime = Date.now();
                //console.log("drained:",str)
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
            console.log("MOMOS:",JSON.stringify({modules:momos}))
            this.sendStr(JSON.stringify({modules:momos})+"\r");
        }
    
        var parsed;
        try{ parsed = JSON.parse(json); }
        catch(err){console.log("LUOS:bad json");console.log(json.toString('utf8'))}
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
            if(momo.type=="DynamixelMotor"){
                this.modules[momo.alias]=new DynamixelMotor(momo);
            }else{
                this.modules[momo.alias] = new Module(momo);
            }

            info += JSON.stringify(momo)+"\n";
            if( momo.type == "Gate"){ //old was 'gate'
                this.gateAlias = momo.alias;
            }
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
        if( (this.gateAlias != undefined)||(this.rcvCount>0) )
            return; //done
        if(decount>0){
            console.log("send detection",decount); //this.detectDecount);
            this.sendStr('{"detection":{}}\r');
            setTimeout(this.timedDetection.bind(this,decount-1),100);
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
    
    reScanDxl(){
        this.sendString('{"modules":{"void_dxl":{"reinit":0}}}\n')
    }
    

    scanDxl(){  //called after initModules & dxlManager
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
                    console.log("LUOS DLX:",momo.motorID)
                }
            }
        }
    }



    killme(){
        console.log("adieu monde cruel !",this.id);
        this.close();
        //luosManager.killGate(this.id);
    }

}//class LuosGate



module.exports = { Gate,Module,DynamixelMotor }