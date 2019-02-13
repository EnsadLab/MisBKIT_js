/**
 * Created by Didier on 27/04/16.
 */

 //TODO generic MotorManager
 //TODO general settings in MisBKIT.js
 //TODO ... ... ... ...

var Dxl = require("./DxlMotor.js");
var Animation = require("./Animations.js");
var animManager = require("./AnimManager.js"); //TODO :move anim functions to AnimManager

const MAX_SERVOS = 6;

const INST_PING           = 1;
const INST_READ           = 2;
const INST_WRITE          = 3;
const INST_REG_WRITE      = 4;
const INST_ACTION         = 5;
const INST_FACTORY_RESET  = 6;
const INST_REBOOT         = 8;
const INST_SYSTEM_WRITE   = 13;   // 0x0D
const INST_STATUS         = 85;   // 0x55
const INST_SYNC_READ      = 130;  // 0x82 ...?
const INST_SYNC_WRITE     = 131;  // 0x83
const INST_SYNC_READ2     = 132;  // 0X84 ... USB2DYNAMIXEL !!!
const INST_BULK_READ      = 146;  // 0x92
const INST_BULK_WRITE     = 147;  // 0x93

const ERR_VOLTAGE   = 0x01;
const ERR_ANGLE     = 0x02;
const ERR_OVERHEAT  = 0x04;
const ERR_RANGE     = 0x08;
const ERR_CHECKSUM  = 0x10;
const ERR_OVERLOAD  = 0x20;
const ERR_INSTR     = 0x40;

const MISB_INSTR    = 0x7F;
const MISB_ADDR     = 0xFD;

function DxlManager(){

    this.savecount = 0; //debugg

    this.motors = [];
    this.positions = [];

    this.updateTimer = undefined;
  
    this.refreshID = -1;
    this.refreshAddr = -1;

    this.onoffTimer = undefined;

    this.chgID = {prev:-1,new:-1,count:-1}; //prevID newID
};
var dxlmng = new DxlManager();
module.exports = dxlmng;


DxlManager.prototype.init =function(){
    misGUI.initManagerFunctions(this,"dxlManager");

    for(var i=0;i<MAX_SERVOS;i++){
        var momo = new Dxl(i);
        this.motors.push( momo );
        misGUI.addMotor(i,momo.m);
    }
 
    this.updateTimer = setInterval(this.update.bind(this),45); //start

    misGUI.motorSettings(0,this.motors[0].m);
}

//GUI cmd 
//dxlID clockwise angleMin angleMax speedMin speedMax
//joint wheel recCheck enable angle velocity
DxlManager.prototype.cmd = function(func,eltID,val,param){
    //console.log("dxlManager:cmd:",func,eltID,val,param);
    //console.log("     settings",this.motors[0].m);

    if(this[func]){
        this[func](+eltID,val,param); //eltID=index
    }
    else{
        if( this.motors[+eltID] ){
            if( this.motors[+eltID][func] ){
                //console.log("dxlManager>>>>dxl:",func,eltID,val,param);
                this.motors[+eltID][func](val,param);
            }
            //else console.log("DxlManager.cmd:BAD FUNC:",func,eltID);
        }
        //else console.log("DxlManager.cmd:BAD ID:",func,eltID);
    }
}

DxlManager.prototype.midiMapping =function(eltID,val,param){
    console.log("DxlManager:midiMapping:",eltID,param,val);
    switch(param){
        case "port":
            motorMappingManager.setMidiMotorMappingPort(+eltID,val);
            break;
        case "midiMode"://falsse:CC true:note 
            switch(val){
                case false:motorMappingManager.setMidiMotorMappingCmd(+eltID,"CC");break;
                case true:motorMappingManager.setMidiMotorMappingCmd(+eltID,"note");break;
            }    
            break;
        case "num":
            motorMappingManager.setMidiMotorMappingIndex(+eltID,+val); // Gui only treats CC midi mappings for now
            break;
    }
}

//for script , osc , python ...
DxlManager.prototype.clockwise = function(index,val){
    if(this.motors[index]){
        this.motors[index].clockwise(val);
        misGUI.showValue({class:"dxlManager",func:"clockwise",id:index,val:val})
    }
}

DxlManager.prototype.dxlParam = function(eltID,val,param){
    //clockwise angleMin angleMax speedMin speedMax
    console.log("dxlManager:dxlParam:",eltID,val,param);
    if(this.motors[eltID]){
        this.motors[eltID].m[param]=val;
        console.log(" dxlParam1",this.motors[eltID].m);
        misGUI.motorSettings(eltID,this.motors[eltID].m);
        console.log(" dxlParam2",this.motors[eltID].m);
    }
}
DxlManager.prototype.dxlEnable = function(eltID,val){
    console.log("dxlEnable",eltID,val)
    if(this.motors[+eltID])
        this.motors[+eltID].enable(val);
}

DxlManager.prototype.setStillAngle = function(index,val){
    if(this.motors[+index])
        this.motors[+index].setStillAngle(val);
}

DxlManager.prototype.goStill = function(index){
    if(this.motors[+index])
        this.motors[+index].goStill()
}

DxlManager.prototype.checkRec = function(eltID,val){
    if(eltID<this.motors.length) {
        this.motors[eltID].rec = val;
    }
}

DxlManager.prototype.setMode = function(eltID,val){
    this.dxlMode(eltID,val);
}
DxlManager.prototype.mode = function(eltID,val){
    this.dxlMode(eltID,val);
}
DxlManager.prototype.wheelMode = function(eltID,val){ //LUOS style
    this.dxlMode(eltID,val);
}

DxlManager.prototype.dxlMode = function(eltID,val){ //true=wheel false=joint
    console.log("DXLMODE:",val)
    if(this.motors[eltID]){
        var m = false;
        switch(val){
            case false: case 0: case "joint": case "J":
                this.motors[eltID].joint(eltID);
                break;
            case true: case 1: case "wheel": case "W":
                this.motors[eltID].wheel(eltID);
                m=true;
                break;
            //TODO multitour ... GUI   
        }
        misGUI.showValue({class:"dxlManager",func:"dxlMode",id:eltID,val:m})
        misGUI.motorMode(eltID,val);
    }
}


//TODO move to SettingsManager , and add DxlManager.getSettings
DxlManager.prototype.saveSettings = function () {
    var s = {}; //settings
    s.savecount = ++this.savecount;
    s.cm9Num = cm9Com.num;
    //s.serialPort = cm9Com.serialName;
    //s.midiPort = midiPortManager.getCurrentPortName();
    s.oscPorts = oscManager.getSettings();
    s.webSocket = "none";

    s.midiEnabled = midiPortManager.enabled;
    
    s.midiPorts = [];
    s.javascripts = scriptManager.getSettings();
    s.python = pythonManager.getSettings();
    s.anims = [];
    s.sensors = [];
    s.motors = [];

    
    for(var p=0; p<midiPortManager.midiPorts.length; p++){
        console.log(midiPortManager.midiPorts[p].portName);
        if(midiPortManager.midiPorts[p].enabled){
            s.midiPorts.push(midiPortManager.midiPorts[p].portName);
        }
    }

    //TODO GUI order
    for (var k in animManager.animations) {
        // only save the one that are already recorded
        console.log("... savine",animManager.animations[k].fileName);
        if(animManager.animations[k].s.type == "record"){
            if(animManager.animations[k].channels.length > 0) {
                s.anims.push({name: animManager.animations[k].fileName, key: animManager.animations[k].s.keyCode});
            }
        } else {
            s.anims.push({name: animManager.animations[k].fileName + ".json", key: animManager.animations[k].s.keyCode});
        }
    }

    for(var index in sensorManager.sensors){
        s.sensors.push({name: sensorManager.sensors[index].s.name});
    }
    //console.log("setLoadedSensors:",s.sensors);


    var nbm = this.motors.length;
    for (var i = 0; i < nbm; i++) {
        s.motors.push(this.motors[i].getSettings());
    }

    var json = JSON.stringify(s, null, 2);
    //fs.writeFileSync(__dirname + "/settings.json", json);
    //fs.writeFileSync(__appPath + "/settings.json", json);
    settingsManager.saveToConfigurationFolder("settings.json",json);
    //console.log(json);

    return this.savecount;
}

//TODO move to SettingsManager , and add DxlManager.setSettings
DxlManager.prototype.loadSettings = function () {
    console.log("********* loading dxl manager settings:*********");
    //var json = fs.readFileSync(__appPath + "/settings.json", 'utf8');
    var json = settingsManager.loadConfiguration("settings.json");
    //console.log(json)
    if (json) {
        var s = JSON.parse(json);
        //this.serialPort = s.serialPort;
        //cm9Com.serialName = s.serialPort;

        if(s.savecount) this.savecount = s.savecount; //DEBUG

        if(s.cm9Num){
            cm9Com.changeCm9(+s.cm9Num);
            misGUI.setCM9Num(+s.cm9Num);
        }
        else cm9Com.changeCm9(0);

        //console.log("SERIAL NAME:",cm9Com.serialName);

        //this.midiPort = s.midiPort;
        //this.oscHost = s.oscHost;
        //oscManager.s = s.oscPorts;
        oscManager.setSettings(s.oscPorts);
        pythonManager.setSettings(s.python)

        this.webSocket = s.webSocket;

        // scan has already been called by misgui when we enter here.
        console.log("#######################################");
        midiPortManager.portNameAtStart = s.midiPorts;
        console.log(midiPortManager.portNameAtStart);
        console.log("#######################################");
        /*
        for(var i=0; i<s.midiPorts.length; i++){
            console.log("opening midi port ", s.midiPorts[i]);
            midiPortManager.open(s.midiPorts[i]);
        }*/

        var nbm = s.motors.length;
        if(nbm>MAX_SERVOS){console.log("TO MUCH MOTORS!",nbm);nbm=6;}

        for (var i = 0; i < nbm; i++ ){ //s.motors.length; i++) {
            this.motors[i].copySettings(s.motors[i]);
            misGUI.motorSettings(i, this.motors[i].m);
        }

        animManager.loadSettings(s.anims);
        sensorManager.setLoadedSensors(s.sensors);
        console.log("trying to open midiport:",this.midiPort);
        midiPortManager.openMidiAtStart(s.midiEnabled);

        misGUI.midiPortManager(this.midiPort); //TODO: what does it do?

        scriptManager.setSettings(s.javascripts);
    }
}

/*test
DxlManager.prototype.robusCB = function(val){
    console.log("!robusCB:",val);
    index = 0;
    if(index<this.motors.length){
        //console.log("index " + index + " " + this.motors.length);
        var dxl = this.motors[index];
        if(dxl.m.mode==0) {
            misGUI.angle(index,   dxl.nAngle(val/300));
        }
        else {
            misGUI.speed(index,   dxl.nSpeed(val/300));
        }
    }
   
}
*/

DxlManager.prototype.folderIsReady = function(animationFolder){
    animManager.animFolder = animationFolder;
    this.loadSettings();
}


//DELETED DxlManager.prototype.timedSerial= function(){
//DELETED DxlManager.prototype.timedSerial= function(){
//DELETED DxlManager.prototype.sendCm9CB= function(){
//DELETED DxlManager.prototype.timedSerial= function(){
//DELETED DxlManager.prototype.serialOnOff= function(onoff,name){

var pauseCM9 = false; //cm9 envoie on plusieurs fois ... à revoir
DxlManager.prototype.cm9OnOff= function(onoff){
    console.log("DxlManager.cm9OnOff:",onoff,pauseCM9);
    if(pauseCM9)return;
    pauseCM9 = true;

    var self = this;
    if(onoff){
        self.freezeAllMotors();
        misGUI.showFreeze(true);
        //this.stopAllMotors(); // clear speeds      
        for (var i = 0; i < self.motors.length; i++) {
            console.log(" cm9on:",self.motors[i].m )
            //self.motors[i].cm9Init();
        }
        setTimeout(function(){
            self.unfreezeAllMotors();
            misGUI.showFreeze(false);
            pauseCM9 = false;
            console.log(" pauseCM9:",pauseCM9);
        },500)
        
       //this.unfreezeAllMotors();
       //this.senDxlIds();
    }
    else{
        //misGUI.cm9State("OFF");
        //this.stopMotors();
        //this.freezeAllMotors(); //A REVOIR
        //this.stopAllAnims();
        animManager.stopAll();  //
        this.stopAllMotors();
        cm9Com.pushMessage("dxlStop\n");    
        pauseCM9 = false;
    }
}

//DELETED DxlManager.prototype.setPause = function(nframes){

DxlManager.prototype.update = function(){

    var nbm=this.motors.length;
    var t  = Date.now();

    for(var i=0;i<nbm;i++){
        var motor = this.motors[i];
        motor.update(t);
        //sensorManager.handleDxlPos(i,motor.angleToNorm(a)); //use min & max
    }

    if(cm9Com.isReady()){
        //console.log("DxlManager.update");
        /*
        for(var i=0;i<nbm;i++){
            this.motors[i].update(t);
        }
        */
    
        //read dxl regiters
        if( this.refreshID >= 0 ) {
            if( this.refreshAddr<48 ){
                cm9Com.pushMessage("dxlR " + this.refreshID + "," + this.refreshAddr + ",\n");
                this.refreshAddr++;
            }
            else
                this.refreshID = -1;
        }

    }//cm9 is ready




    /*!!!cm9
    if(this.serialTimer==0)
        this.timedSerial();
    */

/*
    if( cm9Com.isOpen() && this.serialRcvTime!=0 ) {
        if ((Date.now() - this.serialRcvTime) > 3000) {
            console.log("cm9Com TIMEOUT");
            this.serialRcvTime = 0;
            this.cm9OnOff(false);
            misGUI.cm9State("ERROR");
        }
    }
*/

    //setTimeout(this.update.bind(this),50);
}

//called by Cm9Manager
DxlManager.prototype.sendAllMotors = function(){
    for(var i=0;i<this.motors.length;i++){
        if(this.motors[i].gate=="cm9")
            this.motors[i].sendGoalSpeed();
    }
}

//TODELETE
/*
DxlManager.prototype.buildCm9Msg = function(){
    //var msg = "$DXL m[WJR---] g[...] s[...]\n";
    var mods = "modes ";
    var msgG = "goals ";    //sync goals
    var msgS = "speeds ";   //sync speeds
    var countG = 0;
    var countS = 0;
    for(var i=0;i<nbm;i++){
        var w = this.motors[i].getWanted();
        mods += w.m;
        if(w.g>=0) countG++; //at least one wanted goal
        if(w.s>=0) countS++; //at least one wanted speed
        msgG += w.g+","; //this.motors[i].getGoal();
        msgS += w.s+","; //this.motors[i].getSpeed();
    }
    if( (countG+countS)>0 ){
        //cm9Com.pushMessage(msgG+"\n"+msgS+mods+"\n#"+this.messageId+"\n");
        cm9Com.pushMessage(mods+"\n"+msgG+"\n"+msgS+"\n"+"#"+this.messageId);
        //cm9Com.pushMessage(mods+"\n");
        //cm9Com.pushMessage(msgG+"\n");            
        //cm9Com.pushMessage(msgS+"\n");
        //cm9Com.pushMessage("#"+this.messageId+"\n");            
        this.messageId++;                        
    }
}
*/


//TODELETE ?
DxlManager.prototype.senDxlIds = function() {
    var msg="dxlIds";
    for (var i = 0; i < this.motors.length; i++) {
        msg+=","+this.motors[i].m.dxlID;
    }
    cm9Com.pushMessage(msg+"\n");
}


DxlManager.prototype.stopAll = function() {
    console.log("DxlManager.stopAll:")
    for (var i = 0; i < this.motors.length; i++) {
        this.motors[i].enable(false);
        //misGUI.dxlEnabled(i,false);
        //<input func="dxlEnable"
        misGUI.motorSpeed(i,0);
    }
    //this.stopAllAnims();
    animManager.stopAll();
    cm9Com.pushMessage("dxlStop\n");

    misGUI.showValue({class:"dxlManager",func:"dxlEnable",val:false}) //no id -> all
}

DxlManager.prototype.stopAllMotors = function(){
    console.log("DxlManager.stopAllMotors!");
    for (var i = 0; i < this.motors.length; i++) {
        this.motors[i].stopMotor();
        misGUI.motorSpeed(i,0);
    }
}

DxlManager.prototype.stopMotor = function(index){
    console.log("DxlManager.stopMotors!",index);
    if(index >= 0 && index < this.motors.length){
        this.motors[index].stopMotor();
        misGUI.motorSpeed(index,0);
    }
}

DxlManager.prototype.uiFreeze = function(onoff){
    if(onoff){
        this.freezeAllMotors();
    }else{
        this.unfreezeAllMotors();
    }

}

DxlManager.prototype.freezeAllMotors = function(){
    console.log("********* FREEZING *********");
    for (var i = 0; i < this.motors.length; i++) {
        this.motors[i].freezeMotor();
    }
}

DxlManager.prototype.unfreezeAllMotors = function(){
    console.log("********* UN-FREEZING *********");
    for (var i = 0; i < this.motors.length; i++) {
        this.motors[i].unfreezeMotor();
    }

}

DxlManager.prototype.startReadDxl = function(dxlId) {
    //this.stopAllAnims();
    //animManager.stopAll();
    this.refreshID = dxlId;
    this.refreshAddr = 0;
}

//DELETED DxlManager.prototype.onStringCmd=function(str){
//DELETED DxlManager.prototype.onCm9Strings=function(args){

DxlManager.prototype.position =function(index){
    return +this.positions[index];
}

DxlManager.prototype.dxlPos=function(array) {  //array[0]="dxlpos"
    var n = array.length-1; 
    if(n>this.motors.length)
        n=this.motors.length;
    for(var i=0;i<n;i++){
        var v = +array[i+1] //array[0]="dxlpos"
        if(v>=0){
            var m = this.motors[i];
            var a = m.currPos(v).toFixed(1);
            this.positions[i]=a;    //store if other managers want an array
            sensorManager.handleDxlPos(i,m.angleToNorm(a)); //use min & max
            //misGUI.needle(i,a);
        }
    }
    pythonManager.onDxlpos(array);
}

DxlManager.prototype.updatePosition =function(index,angle){
    //console.log("updatePosition:",index,angle)
    if(this.motors[index]!=undefined){
        this.motors[index].setCurrentAngle(angle);
        this.positions[index]=angle;
        //sensorManager.handleDxlPos(i,motor.angleToNorm(a)); //use min & max
        //misGUI.needle(index,a);
    }
}




//DELETED DxlManager.prototype.cm9Id=function(array) { //stringCmd


DxlManager.prototype.cmdString = function(str){ //"dxlXXXX val val val ..."
    var arr= str.split(/,| /);
    switch(arr[0]){
        case "dxlR":
            //console.log("dxlR:",args[1],args[2],args[3]);
            misGUI.showDxlReg(arr[1],arr[2],arr[3]); //id,addr,val
            //check dxlID change
            if( (+arr[2]==3) )
                this.checkChangeID(+arr[1],+arr[3]); //id value
            break;
        case "dxlW":
            console.log("dxlW:",arr[1],arr[2],arr[3]);
            break;
        case "dxlpos":
            this.dxlPos(arr);
            break;
        case "dxlModel": //dxlID model
            if(+arr[2]>=0){
                var m = this.getMotorByID(+arr[1]);
                if(m)
                    m.model(+arr[2]);
            }
            break;
        case "dxlPing": //id model / Scan
            var id = +arr[1];
            var model = +arr[2];
            misGUI.scanProgress(id+30);
            //console.log("dxlPing:",id,model);
            if((model>0)&&(model<254)){ //got strange values sometimes
                var motor = this.getMotorByID(id);
                if( motor != undefined){
                    motor.model(model);
                }        
                else{
                    var motor = this.getMotorByID(0);
                    if( motor != undefined){
                        motor.dxlID(id);
                        motor.model(model);
                        misGUI.motorSettings(motor.index,motor.m );            
                    }
                }
            }
            if(++id<254)
                cm9Com.pushMessage("dxlPing "+id+"/n"); //scan next
            break;
        case "dxlTemp": //dxlTemp index value
            //console.log("dxlTemp:",arr);
            var i=+arr[1], t=+arr[2];
            this.motors[i].temperature = t;
            misGUI.temperature(i,t);
            break;
        default:
            console.log("???:",arr);
            
    }
}

DxlManager.prototype.removeAllLuos = function(){

}

//TODO same ID & gate different ???
DxlManager.prototype.addLuosMotor=function(gate,alias,dxlid){
    console.log("AddLuosBot:",gate,dxlid)
    var motor = this.getMotorByID(dxlid);   //???
    if( motor == undefined){
        motor = this.getMotorByID(0);
    }
    if( motor != undefined){
        motor.m.gate  = "luos";
        motor.ioID = {gate:gate,alias:alias};
        motor.dxlID(dxlid);
        motor.m.textID = "luos_"+dxlid;
        motor.enable(false);
        misGUI.motorSettings(motor.index,motor.m);
        
    }
    console.log("luosMotor:",motor);
    return motor.index;
}

DxlManager.prototype.dxlWrite = function(dxlid,val,addr) { //id val param
    console.log("dxlWrite:",+dxlid,+addr,+val);
    cm9Com.pushMessage("dxlWrite "+dxlid+","+addr+","+val+"\n");
}

DxlManager.prototype.temperature = function(args){
    console.log("temperature:",args);
    misGUI.temperature(args[1],args[2]);
    oscMobilizing.sendOSC({
        address:"/mbk/temperature",
        args:[
            {type:'i',value:args[1]},
            {type:'i',value:args[2]}            
        ]
    });

}




//TODELETE
/*DxlManager.prototype.writeReg=function(index,addr,val) { //
    if((index>=0)&&(index<this.motors.length)){
        console.log("WriteReg:",+index,+addr,+val);
        cm9Com.pushMessage("dxlW "+this.motors.m.id+","+addr+","+val+",\n");
    }
}
*/

//DELETED DxlManager.prototype.version = function(arr){
/*        var v1 = +arr[1];
    var v2 = +arr[2];
    console.log("VERSION",v1,".",v2);
    //if(v1<2)
    if((v1!=2)&&(v2!=9))
            //misGUI.alert("BAD VERSION "+v1+"."+v2);
            misGUI.cm9Info("BAD VERSION ");
        else
            misGUI.cm9Info("- OK -");
            //misGUI.alert("Good VERSION "+v1+"."+v2);
}
*/

//Compatibilité avec ancien CM9 MV id reg value
//DELETED DxlManager.prototype.MV=function(array) {

DxlManager.prototype.model=function(array) {
    var im = +array[1];
    if((im>=0)&&(im<this.motors.length)){
        this.motors[im].model(+array[2]);
    }
}

//TODELETE
/*
DxlManager.prototype.rcvCM9 = function(datas){ //from parser
    var len = datas.length;
    for(var i=0;i<len;i++)
    {
        var c = datas[i];
        if (c < 32) { //0 cr lf
            if (this.serialIndex > 0) {
                var str = String.fromCharCode.apply(null, this.serialBuff.slice(0, this.serialIndex));
                var toks = str.split(' ');
                console.log("rcv cm9Com:",str," ",toks.length);
                if(toks[0]=="MV"){ //CM9 MV id reg value
                    //console.log("  val:",parseInt(toks[1])," ",parseInt(toks[2])," ",parseInt(toks[3]));
                    var m = this.servoByID(parseInt(toks[1]));
                    var index = m.index;
                    console.log("  servo:",parseInt(toks[2])," ", index);
                    if(parseInt(toks[2])==ADDR_POSITION)
                        misGUI.needle(index,(512-parseInt(toks[3]))*150/512 ); //AX12
                }

            }
            this.serialIndex = 0;
        }
        else if (this.serialIndex < 255) {
            this.serialBuff[this.serialIndex] = c;
            this.serialIndex++;
        }
        else
            this.serialIndex=0; //!!! !!! !!!
    }
    this.serialRcvTime = Date.now();
};
*/

//TODO: change the name of the function to make it more global >>> onNormControl
DxlManager.prototype.onMidi = function(index,cmd,arg){
    //console.log("dxl-midi:",index," arg:",arg);
    /* TODELETE
    if(index<this.motors.length){
        //console.log("index " + index + " " + this.motors.length);
        var dxl = this.motors[index];
        if(dxl.m.mode==0) {
            misGUI.angle(index,   dxl.nAngle(arg/127));
        }
        else {
            misGUI.speed(index,   dxl.nSpeed(arg/127));
        }
    }
    */
   this.onNormControl(index,arg/127);  
};


DxlManager.prototype.control = function(index,val){      //<--script & osc
    this.onControl(index,val) //TODO renomer onControl
}
DxlManager.prototype.normControl = function(index,val){  //<--script & osc
    this.onNormControl(index,val) //TODO renomer onNormControl
}

DxlManager.prototype.onNormControl = function(index,val){
    //console.log("norm:",index,val);
    if(index<this.motors.length){
        var dxl = this.motors[index];
        if(val<0)val=0;
        if(val>1)val=1;
        if(dxl.m.mode==0) {
            misGUI.motorAngle(index, dxl.nAngle(val) );
        }
        else {
            misGUI.motorSpeed(index, dxl.nSpeed(val) );
        }
    }
};

// val= angle ou speed en fonsction du mode
DxlManager.prototype.onControl = function(index,val){
    //console.log("onControl:",index,val);
    if(index<this.motors.length){
        this.motors[index].onValue(val);
    }
};

DxlManager.prototype.angle = function(index,val){ //degrés //<--script
    //console.log("DxlManager:angle:",val);
    if(val!=undefined)
        this.setAngle(index,val);
    else if(index<this.motors.length){ //return current wanted angle
        return this.motors[index].wantedAngle;    
    }
}

DxlManager.prototype.setAngle = function(index,val){ //degrés
    //console.log("DxlManager:setangle:",index,val);
    if(index<this.motors.length){
        var a = this.motors[index].angle(val);
        misGUI.motorAngle(index,a);
        return a;
    }
    return 0;
};






DxlManager.prototype.setAngleN = function(index,val){
    if(index<this.motors.length){
        var a=this.motors[index].nAngle(val);
        misGUI.motorAngle(index,a);        
    }
};

DxlManager.prototype.speed = function(index,val){ //<--script
    if(index<this.motors.length){
        if(val == undefined)
            return this.motors[index].wantedSpeed;
        else
            this.setSpeed(index,val)
    }
}

DxlManager.prototype.setSpeed = function(index,val){
    if(index<this.motors.length){
        var v=this.motors[index].speed(val);
        misGUI.motorSpeed(index,v);        
    }
};

DxlManager.prototype.setSpeedN = function(index,val){
    if(index<this.motors.length){
        var v=this.motors[index].nSpeed(val);
        console.log("speedN:",val,v);
        misGUI.motorSpeed (index,v);
    }
};

DxlManager.prototype.onPlay = function(index,val){
    if(index<this.motors.length){
        var dxl = this.motors[index];
        if(dxl._mode==0)
            misGUI.motorAngle( dxl.angle(val) );
        else
            misGUI.motorSpeed( dxl.speed(val) );
    }
};


/*
DxlManager.prototype.recCheck=function(index,val){
    if(index<this.motors.length) {
        this.motors[index].rec = (val!=0);
    }
}
*/
/*
DxlManager.prototype.dxlEnabled=function(index,val){
    misGUI.dxlEnabled(index,val);
}
*/


// leave it for now, because OscManager is using it... and don't want to get a mess in git
DxlManager.prototype.getAnimID=function(animName){
    var anims = []; // in case there are multiple anims with same name
    for(var k in animManager.animations){
        if(animManager.animations[k].fileName == animName){
            anims.push(animManager.animations[k].id);
        }
    }
    return anims;
}

DxlManager.prototype.onMetaKey=function(char){
    console.log("METAKEY",+char);
    if(char=='s'){
        console.log("Saving all files");
        this.saveSettings();
        settingsManager.saveSettings(); //
    }
}

DxlManager.prototype.onKeyCode = function(keyCode){
    console.log("KEYCODE:",keyCode);
    if(keyCode==" "){
        this.stopAll();
    }
   
    /*TEST else if(keyCode=="?"){
        //this.motors[0]._regRead=0;
    }
    */
   
}

// DXL SCAN functions ---------------------
//TODELETE
/*
DxlManager.prototype.ping=function(args){ //oldCM9
    console.log("scan step:",args[1]); 
    misGUI.scanProgress(+args[1]); //show minimal progress
}
//TODELETE
DxlManager.prototype.pong=function(args){ //oldCM9
    console.log("pong:",args[1]);
    misGUI.scanProgress(+args[1]);
}
//TODELETE
DxlManager.prototype.scan=function(args){ //oldCM9
    console.log("scan scan:",args[1]);
    misGUI.scanProgress(+args[1]+20);
}
*/

DxlManager.prototype.clearMotors = function(){
    for (var i = 0; i < this.motors.length; i++) {
        this.motors[i].enable(false)
        this.motors[i].dxlID(0);
        this.motors[i].gate = "cm9";
        misGUI.motorSettings(i,this.motors[i].m);
    }
}

DxlManager.prototype.startScan=function(){
    console.log("STARTSCAN");
    this.clearMotors();

    if(cm9Com.isOpen()) {
        misGUI.scanProgress(0);
        cm9Com.pushMessage("dxlPing 1\n");
    }
    else
        misGUI.scanProgress(255); //show failed

    luosManager.reset();
}

//TODELETE ?
DxlManager.prototype.motorIds=function(array) { //stringCmd
    //TODO timeOut
    console.log("MotorIds:",array);
    misGUI.blockUI(false); //endScan
    misGUI.scanProgress(0);
}

DxlManager.prototype.dxlID = function(index,id){
    console.log("DxlManager.setIndexID:",index," ",id);
    var nid = +id;
    var previous = null;
    if( nid>0 ){
        for(var i=0;i<this.motors.length;i++){
            if(this.motors[i].m.dxlID == nid){
                previous = this.motors[i];
                console.log("DxlManager.setIndexID:DUPLICATE",i," ",id);
                this.motors[index].copySettings(previous);
                previous.dxlID(0);
                misGUI.motorSettings(i,this.getMotorSettings(i));
            }
        }
    }
    this.motors[index].dxlID(nid);
    misGUI.motorSettings(index,this.getMotorSettings(index));
};


DxlManager.prototype.playKey=function(cmd,index,val) { //cmd = "angle" or "speed"
    //console.log("***************dxlm.playkey:",cmd," ",index," ",val);
    /*
    if(index<this.motors.length) {
        this.motors[index][cmd](val);
        misGUI[cmd](index,val);
    }
    */
   this.motors[index].onValue(val);
}

DxlManager.prototype.servoByIndex = function(index){
    if(index<this.motors.length)
        return this.motors[index];

    return null;
};

DxlManager.prototype.servoByID = function(id){
    var len=this.motors.length;
    console.log("servolen",len);
    for(var i=0;i<len;i++){
        if(this.motors[i].m.dxlID==id)
            return this.motors[i];
    }
    return null;
};

DxlManager.prototype.getMotorSettings=function(index){
    console.log("getMotorSettings:",index,this.motors[index].m);
    if((index>=0)&&(index<this.motors.length))
        return this.motors[index].m;
    return null;
}


DxlManager.prototype.changeDxlID = function(id,newID){

    console.log("changeDxlID:"+id+",--->,"+newID+"\n"); //3=ADDR_ID (PROTECTED)
    if((id<=0)||(id>253)||(newID<=0)||(newID>253))
        return;

    var motor = this.getMotorByID(id);
    if(motor)motor.enable(false);

    cm9Com.pushMessage("dxlW "+id+",3,"+newID+"\n"); //3=ADDR_ID (PROTECTED)

    if(motor){ //what if failed ?
        motor.dxlID(newID);
        misGUI.motorSettings(motor.index,motor.m);
    }
    this.chgID.prev  = id;
    this.chgID.new   = newID;
    this.chgID.count = 20;

    this.startReadDxl(newID); //async >> showDxlReg >> rcv "dxlR newID,3,xxx"          
}
//called cmdString "dxlR xxx,3,xxx"
DxlManager.prototype.checkChangeID = function(id,value){
    if( id == this.chgID.new){
        if(value!=this.chgID.new){ //-1 what else? or what?//OK, DONE!
            if(--this.chgID.count>=0){ //resend
                console.log("checkChangeID:resend:",this.chgID.count);
                cm9Com.pushMessage("dxlW "+this.chgID.prev+",3,"+this.chgID.new+"\n"); //3=ADDR_ID (PROTECTED)
                this.startReadDxl(this.chgID.new); //async >> showDxlReg >> rcv "dxlR newID,3,xxx"          
                return;
            }
            else{ //failed
                misGUI.alert("ID change FAILED");
            }
        }
        this.chgID.new = -1; //stop checking
    }
}


//TODELETE ?
DxlManager.prototype.writeDxlId = function(index,val){
    console.log("!!!!! DXLM-writeDxlId:",index," ",val);
    var nm=this.motors.length;
    for(var i=0;i<nm;i++){
        if((i!=index)&&(this.motors[i].m.dxlID==val))
            return false;
    }
    this.dxlID(index,val);
    return true;
}


DxlManager.prototype.getMotorByID = function(dxlID){
    for(var i=0;i<this.motors.length;i++){
        if(this.motors[i].m.dxlID==dxlID)
            return this.motors[i];
    }
    return undefined;    
}

DxlManager.prototype.getIDByIndex = function(index){
    if(index<this.motors.length){
        return this.motors[index].m.dxlID;
    }
    return 0;    
}


DxlManager.prototype.getMode = function(index){
    console.log("DxlManager.getMode:",index);
    if(this.motors[index])
        return this.motors[index].m.mode;
    return 1; //????
};


DxlManager.prototype.isEnabled = function(index){
    var motor = this.servoByIndex(index);
    if(motor )return motor.enabled;
    else return false;
}

