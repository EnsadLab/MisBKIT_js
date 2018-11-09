//OSC Manager v2

const oscmin  = require('osc-min');
var oscjs     = require('osc');

//TODO l'objet managers devrait être founit par MisBKIT.js
var managers = {
    dxl    :require("./DxlManager.js"),
    anim   :require("./AnimManager.js"),
    sensor :require("./SensorManager.js"),
    midi   :require("./MidiPortManager.js"),
    osc    :require("./OscManager.js"),
    //dmx    :require("./DmxManager"),
    ui     :require("./MisGUI.js")
}

class OscUDP{  //Port or client ? ... auto client at reception
    constructor(){
        this.udpPort;
        this.listener;
        this.ready;
        this.s = {
            type:"UDP",
            localPort:8001,
            clientIP:"127.0.0.1",
            clientPort:8000
        }
    }

    getSettings(){
        return this.s;
    }

    setListener(f){
        this.listener = f;
    }

    setSettings( obj ){
        this.close();
        for(var p in obj ){
            if(this.s[p]!=undefined)
                this.s[p]=obj[p];
        }
        //console.log("oscUDP.s:",this.s)
    }

    setParam(param,val){
        if(this.s[param]!=undefined)
            this.s[param]=val
    }

    send(addr,args){ //args must be an Array
        if(this.ready){
            this.udpPort.send({
                address:addr,
                args:args
            });
        }
    }

    sendStr(str){
        if(!this.ready)
            return;
        var spl  = str.split(" ");
        var a = [];
        for(var i=1;i<spl.length;i++){
            if(spl[i].length>0){ //espaces multiples
                var v = +spl[i]; //meilleur que parseFloat
                if(isNaN(v)) a.push({type:'s',value:spl[i]});
                else a.push({type:'f',value:v});
            }
        }
        this.updPort.send({
            address:spl[0],
            args: a
        });    
    }

    close(){
        this.ready = false;
        if(this.udpPort != undefined){
            this.udpPort.close();
            this.udpPort = undefined;
            console.log("Osc.closing ...");
        };
    }
    open(){
        this.close();
        var self = this;
        this.ready = false;
        var options={
            localAddress:"0.0.0.0", //all ?
            localPort: this.s.localPort,
            remoteAddress: this.s.clientIP,
            remotePort: this.s.clientPort,
            broadcast: false,
            metadata: false
        };
        this.udpPort=new oscjs.UDPPort(options);
        //this.udpPort.on("message",function(msg){console.log("Osc.message:",msg)}
        //this.udpPort.on("raw",function(msg){console.log("Osc.raw:",msg);});
        //this.udpPort.on("bundle",function(bundle,timetag,info){console.log("Osc.bundle:",timetag,bundle,info);});
        this.udpPort.on("osc",function(msg,info){ //info = sender
            if(self.listener)
                self.listener(msg.address,msg.args)
        });
        this.udpPort.on("ready",function(){ //before 'open'
            self.ready = true;
            console.log("Osc.ready:-------");
        });
        this.udpPort.on("open",function(){
            console.log("------ Osc.open:-------");
            self.ready = true;
            //self.scanIPv4();
        });
        this.udpPort.on("error",function(msg){
            self.ready = false;
            console.log("Osc.error:",msg);
            //TODO GUI
        })
        this.udpPort.on("close",function(){
            self.ready = false;
            console.log("OSC.closed:-------");
            //TODO GUI
        })
        this.udpPort.open();
    }
}

OscManager = function () {
    this.s = { //settings
        //oscLocalIP: "localhost",
        oscRemoteIP: "localhost",
        oscLocalPort: 4444,
        oscRemotePort: 6666        
    };
    this.ports={
        OSC0:new OscUDP() //default one
    }

};
module.exports = new OscManager();

OscManager.prototype.init = function(){
    console.log("============= oscManager ============")
    misGUI.initManagerFunctions(this,"oscManager");
}

OscManager.prototype.cmd = function(func,id,val,param){
    if(id==undefined)
        id = "OSC0";
    if(typeof(this[func])=='function')
        this[func](id,val,param)
}

OscManager.prototype.setParam = function(id,val,param){
     if(this.ports[id]!=undefined){
        this.ports[id].setParam(param,val)
        misGUI.showParams({class:"oscManager",func:"setParam",val:this.ports[id].getSettings()})
    }
}

OscManager.prototype.getSettings = function(){
    var stg = {};
    for(var p in this.ports ){
        stg[p]=this.ports[p].getSettings()
    }
    return stg;
}

//TODO : !!! mutiples calls ??? kill port
OscManager.prototype.setSettings = function(obj){
    console.log("========== osc setting ===========")
    for(var id in obj ){
        if(this.ports[id] == undefined)
            this.addPort("UDP")
        this.ports[id].setSettings(obj[id]);
        this.ports[id].setListener(this.rcv.bind(this));
        misGUI.showParams({class:"oscManager",id:id,func:"setParam",val:this.ports[id].getSettings()})
    }
}

//TODO type = websocket
OscManager.prototype.addPort = function(type){
    this.idnum += 1; //OSC0 already exists
    this.ports["OSC"+this.idnum]=new OscUDP();
    //TODO misGUI
    //return id ? port ? 
}

OscManager.prototype.send = function(addr,args){ //args = Array
    //console.log("***************send:",typeof(this.ports["OSC0"].send));
    this.ports["OSC0"].send(addr,args)
}

OscManager.prototype.rcv = function(addr,args){
    console.log("OSC MANAGER rcv:",addr,args)

    scriptManager.call("onOSC",addr,args);
    pythonManager.onOSC(addr,args);
    sensorManager.onOSC(addr,args);

    var route = addr.split('/')
    //console.log("-osc  MBK",route[1])
    //console.log("-osc mang",route[2])
    //console.log("-osc func",route[3])
    //console.log("-osc  id ",route[4])
    //console.log("-osc args",args)
    // /mbk/  facultatif? à voir aprés usage
    if(route[1]=="mbk"){
        var m = managers[route[2]];
        if( m != undefined ){
            //cmd( func , id ,val )
            m.cmd(route[3],route[4],...args)
        }
    }

}


//TODO freeze ? onOff ALL : doesnt manage id now ... GUI
OscManager.prototype.onOff = function(idelt,onoff){
    console.log("OscManager onOff",onoff)
    if(onoff){
        for(var id in this.ports )
            this.open(id)
    }
    else{
        for(var id in this.ports )
            this.close(id)
    }
    //inutile misGUI.showValue({class:"oscManager",func:"onOff",val:onoff})
}

//TODO unfreeze ? 
OscManager.prototype.open = function(id){
    console.log("-----open:",id)
    this.ports[id].open()
    misGUI.showValue({class:"oscManager",func:"onOff",val:true})
}

OscManager.prototype.close= function(id){
    this.ports[id].close()
    misGUI.showValue({class:"oscManager",func:"onOff",val:false})
}



/* keep for info
// mobilizing ... in progress
OscManager.prototype.handleMotorMessage2 = function(rcv){
    var adds = rcv.address.split("/");
    // ,,mbk,motors,cmd,index ....
    var vals  = oscManager.getValsInAdress(4,adds,rcv.args);
    //vals[0]=indexMotor 
    console.log("osc motors:",adds[3],vals);

    switch(adds[3]){ //cmd
        case "posN":
            dxlManager.setAngleN(vals[0],vals[1]);
            break;
        case "speedN":
            dxlManager.setSpeedN(vals[0],vals[1]);
            break;
        case "pos":
        case "angle":
        case "joint":
            dxlManager.setAngle(vals[0],vals[1]);
            break;
        case "speed":
        case "wheel":
            var a = dxlManager.setSpeed(vals[0],vals[1]);
            break;
        case "wheelmode":
            this.setMode(vals[0],0);
            break;    
        case "jointmode":
            this.setMode(vals[0],1);
            break;
        case "stop":
            dxlManager.stopMotor(vals[0]);
            break;
        case "stopAll": //stops motors and anims
            dxlManager.stopAll(); //TODO: gui....?
            break;
           
        default:
            console.log("unknown osc msg");        

    }
}
*/

/*keep for info
// handles animation messages coming from user app
OscManager.prototype.handleAnimMessage = function(rcv){

    var adr = rcv.address;
    var arg = rcv.args[0].value;
    console.log("handling animation message",arg);
    
    if(adr == "/mbk/anims/start"){
        var animIDs = dxlManager.getAnimID(arg);
        for(var i=0; i<animIDs.length; i++){ // in case multiple anims with same name
            var divAnim = misGUI.divAnim(animIDs[i]);
            divAnim.find(".play").click();
        }
    }else if(adr == "/mbk/anims/stop"){
        var animIDs = dxlManager.getAnimID(arg);
        for(var i=0; i<animIDs.length; i++){ // in case multiple anims with same name
            var divAnim = misGUI.divAnim(animIDs[i]);
            divAnim.find(".stop").click();
        }
    }else if(adr.startsWith("/mbk/anims/loop")){
        var animIDs = dxlManager.getAnimID(arg);
        for(var i=0; i<animIDs.length; i++){ // in case multiple anims with same name
            if(adr == "/mbk/anims/loopOn"){
                dxlManager.loopAnim(animIDs[i],true);
            } else if(adr == "/mbk/anims/loopOff"){
                dxlManager.loopAnim(animIDs[i],false);
            }
        }
    }
}
*/

/*
// handles motor messages coming from user app
OscManager.prototype.handleMotorMessage = function(rcv){

    var adr = rcv.address;
    var arg;
    if(!adr.startsWith("/mbk/motors/stopAll")){
        arg = rcv.args[0].value;
        //arg = rcv.args[0];
        //console.log("arg",arg);
    }
    
    //console.log("arg: " + arg);
    console.log("handling motor message ",adr,arg);

    var motorIndex;
    if(adr.startsWith(cmp = "/mbk/motors/wheelmode")){
        this.setMode(arg,0);    
    }else if(adr.startsWith(cmp = "/mbk/motors/jointmode")){
        this.setMode(arg,1);
    }else if(adr.startsWith(cmp = "/mbk/motors/wheel/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        console.log("whheel:",motorIndex,arg);
        //this.setMode(motorIndex,0);
        misGUI.motorSpeed(+motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/speed/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        console.log("speed:",motorIndex,arg);
        var s = dxlManager.setAngle(+motorIndex,arg);
        console.log("motorIndex:",motorIndex,arg);
        //this.setMode(motorIndex,0);
        dxlManager.setSpeed(+motorIndex,arg)
        misGUI.motorSpeed(+motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/joint/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        //this.setMode(motorIndex,1);
        var a = dxlManager.setAngle(+motorIndex,arg);
        misGUI.motorAngle(motorIndex,a);
    }else if(adr.startsWith(cmp = "/mbk/motors/goal/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        var a = dxlManager.setAngle(+motorIndex,arg);
        misGUI.motorAngle(motorIndex,a);
    }else if(adr.startsWith(cmp = "/mbk/motors/wheeljoint/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        var divMotor = misGUI.getMotorUI(motorIndex);
        //misGUI.setValue(motorIndex,"joint",arg);
        if(divMotor.find("[name=mode]").prop('checked')) misGUI.motorSpeed(motorIndex,arg);
        else misGUI.motorAngle(motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/stopAll")){ // stops motors and anims
        //dxlManager.stopAll(); //TODO: gui....?
        dxlManager.stopAllMotors();
    }else if(adr.startsWith(cmp = "/mbk/motors/stop")){ // only stops motor
        dxlManager.stopMotor(arg);
    }

}
*/

/*
OscManager.prototype.setMode = function(motorIndex, mode){
    var divMotor = misGUI.getMotorUI(motorIndex);
    if((mode == 0 && !divMotor.find("[name=mode]").prop('checked')) ||
        (mode == 1 && divMotor.find("[name=mode]").prop('checked')) )
            divMotor.find("[name=mode]").click();
}
*/

/*
OscManager.prototype.getArgInAdress = function(adrSrc,adrCmp){
    console.log("getArgInAdress",adrSrc,adrCmp);
    return parseInt(adrSrc.substring(adrCmp.length));
}
*/
/*
OscManager.prototype.getStringInAdress = function(adrSrc,adrCmp){
    console.log("getArgInAdress",adrSrc,adrCmp);
    return adrSrc.substring(adrCmp.length);
}
*/
/*
OscManager.prototype.sendSensorMessage = function(sensorID,sensorVal){

    var sensor = sensorManager.getSensorWithID(sensorID);//sensorManager.sensors[sensorID];
    if(sensor == undefined) return;

    // /mbk/sensors sensorName sensorValue sensorMin sensorMax   
    buf = oscmin.toBuffer({
        address: "/mbk/sensor/"+sensor.s.name,
        args: [sensorVal] //,sensor.s.valMin,sensor.s.valMax] 
    });
    
   // console.log("remote port",this.s.oscRemotePort);

    //this.udpUserSender.send(buf, 0, buf.length, this.outportUser, "localhost");
    this.udpUserSender.send(buf, 0, buf.length, this.s.oscRemotePort, this.s.oscRemoteIP);
    
    // concat messages into the adress for programs that handle osc messages only with one parameter
    buf = osc.toBuffer({
        address: "/mbk/sensors/" + sensorVal + "/" + sensor.s.valMin + "/" + sensor.s.valMax,
        args: [sensor.s.name]
    });
 
    this.udpUserSender.send(buf, 0, buf.length, this.s.oscRemotePort, this.s.oscRemoteIP );
}
*/

/*
OscManager.prototype.handleSensorMessage = function(rcv,mobz_connexion){

    var adr = rcv.address;
    var nb_args = rcv.args.length;

    var mobilizing = true;
    if(mobz_connexion == undefined) mobilizing = false;

    //console.log("handling sensor message:",adr + " with " + nb_args + " args");
    if(adr == "/mbk/sensors"){ //mbk/sensors/ sensor_name value minValue maxValue OR /mbk/sensors/ sensor_name value
        var sensor_name = rcv.args[0].value;
        var value = parseFloat(rcv.args[1].value);
        if(nb_args == 4){
            var minValue = parseFloat(rcv.args[2].value);
            var maxValue = parseFloat(rcv.args[3].value);
            sensorManager.onOscMessage(sensor_name,value,mobilizing,parseInt(minValue),parseInt(maxValue));
        }else{
            sensorManager.onOscMessage(sensor_name,value,mobilizing);
        }
    }else if(adr.startsWith(cmp = "/mbk/sensors/")){ //mbk/sensors/sensorName value
        var sensor_name = this.getStringInAdress(adr,cmp);
        var value = parseFloat(rcv.args[0].value);
        sensorManager.onOscMessage(sensor_name,value,mobilizing);
    }
    
}
*/


