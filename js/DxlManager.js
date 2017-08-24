/**
 * Created by Didier on 27/04/16.
 */
/*
 TODO static: ?
*/


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

const ADDR_MODEL       = 0;
const ADDR_ID          = 3;
const ADDR_CW_LIMIT    = 6;
const ADDR_CCW_LIMIT   = 8;
const ADDR_TORQUE_ENABLE = 24;
const ADDR_LED         = 25;
const ADDR_MARGIN_CW   = 26;
const ADDR_MARGIN_CCW  = 27;
const ADDR_SLOPE_CW    = 28;
const ADDR_SLOPE_CCW   = 29;
const ADDR_GOAL        = 30; //0x1E
const ADDR_SPEED       = 32;
const ADDR_TORQUE      = 34;
const ADDR_POSITION    = 36;
const ADDR_TEMPERATURE = 43;


function DxlManager(){
    this.pause = 0;   //>0 dont sync speeds & goals
    this.motors = [];
    this.recIndices = [];
    this.recording  = false;
    this.recStep    = 0;
    this.recAnim    = null;
    this.animationID = 0;
    this.animations = [];
    this.animFolder  = "";
    this.animPlaying = [];

    this.updateTimid = 0;

    this.serialTimer = 0;
    this.serialMsgs = [];
    this.serialRcvTime = 0;
    this.serialIndex = 0;
    this.serialBuff = new Uint8Array(256);

    this.refreshID = -1;
    this.refreshAddr = -1;

    this.versionTimer = 0;
    this.cm9Version = [];

    if(fs) {
        var json = fs.readFileSync(__dirname + "/data/ax12.json", 'utf8');
        this.ax12regs = JSON.parse(json);
        //$.each(this.ax12regs,function(k,v){console.log(k+":"+v);}); //object[key]);
    }

    for(var i=0;i<MAX_SERVOS;i++){
       this.motors.push( new Dxl(i) );
    }

    this.updateTimid = setInterval(this.update.bind(this),40);

};

DxlManager.prototype.saveSettings = function () {
    var s = {}; //settings
    s.serialPort = cm9Com.serialName;
    //s.midiPort = midiPort.getPortName();
    s.midiPort = midiPortManager.getCurrentPortName();
    s.oscHost = "none";
    s.webSocket = "none";
    
    s.anims = [];
    s.motors = [];
    //TODO GUI order
    for (var k in this.animations) {
        s.anims.push({name: this.animations[k].fileName, key: this.animations[k].keyCode});
    }

    var nbm = this.motors.length;
    for (var i = 0; i < nbm; i++) {
        s.motors.push(this.motors[i].getSettings());
    }

    var json = JSON.stringify(s, null, 2);
    fs.writeFileSync(__dirname + "/settings.json", json);
    console.log(json);
}

DxlManager.prototype.loadSettings = function () {
    console.log("loading dxl manager settings");
    var json = fs.readFileSync(__dirname + "/settings.json", 'utf8');
    if (json) {
        var s = JSON.parse(json);
        this.serialPort = s.serialPort;
        cm9Com.serialName = s.serialPort;
        //console.log("SERIAL NAME:",cm9Com.serialName);

        this.midiPort = s.midiPort;
        this.oscHost = s.oscHost;
        this.webSocket = s.webSocket;

        for (var i = 0; i < s.motors.length; i++) {
            this.motors[i].copySettings(s.motors[i]);
            misGUI.motorSettings(i, s.motors[i]);
        }


        for (var i = 0; i < s.anims.length; i++) {
            var id = this.animationID++;
            var anim = new Animation("A" + id, this.animFolder, s.anims[i].name);
            anim.keyCode = s.anims[i].key;
            console.log("animkey:",anim.keycode);
            anim.load(s.anims[i].name);
        }

        console.log("trying to open midiport:",this.midiPort);
        midiPortManager.openAtStart(this.midiPort);

        misGUI.midiPortManager(this.midiPort); //TODO: what does it do?

        //misGUI.openSerial(this.serialPort); /*Didier*>

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
    this.animFolder = animationFolder;
    this.loadSettings();
    //test robusManager.setCallback("octo_wifi","octo_potard2",this.robusCB.bind(this));
}

/*
DxlManager.prototype.timedSerial= function(){
    if(this.serialMsgs.length>0){
        var m = this.serialMsgs.shift();
        //console.log("send:",Date.now());
        cm9Com.write(m);
        this.serialTimer = setTimeout(this.timedSerial.bind(this),15);
        //this.writeCm9();
    }
    else
        this.serialTimer = 0;
}*/

/*
DxlManager.prototype.timedSerial= function(){
    if(this.serialMsgs.length>0) {
        var tmp = "";
        while (this.serialMsgs.length > 0) {
            tmp += this.serialMsgs.shift();
        }
        cm9Com.write(tmp);
    }
    this.serialTimer = 0;
}
*/

DxlManager.prototype.sendCm9CB= function(){
    if(this.serialMsgs.length>0) {
        cm9Com.write(this.serialMsgs.shift(),this.sendCm9CB.bind(this));
    }
}

DxlManager.prototype.timedSerial= function(){
    if(this.serialMsgs.length>0) {
        cm9Com.write(this.serialMsgs.shift(),this.sendCm9);
    }
    this.serialTimer = 0;
}




DxlManager.prototype.serialOnOff= function(onoff,name){
    console.log("SERIAL_ONOFF:",onoff);
    var self = this;
    this.serialRcvTime=0;
    if(onoff){
        if(name)
            this.serialPort=name;
            cm9Com.open(this.serialPort,115200,function(err){
                if(err){
                    misGUI.serialState("ERR");
                }
                else {
                    self.cm9Msg("version\n");
                    for (var i = 0; i < self.motors.length; i++) {
                    self.motors[i].cm9Init();
                }
                misGUI.cm9State("ON");
                self.serialRcvTime = Date.now();
                //TODO send init Motors
            }
        });
    }
    else{
        if(cm9Com.isOpen()){
            //cm9Com.write("STOP\n");
            //cm9Com.flush();
        }
        cm9Com.close();
        misGUI.serialState("OFF");
        this.serialRcvTime=0;
    }
}

DxlManager.prototype.cm9OnOff= function(onoff,name){
    console.log("CM9_ONOFF:",onoff);
    var self = this;
    this.serialRcvTime=0;
    if(onoff){
        misGUI.cm9State("ON");
        self.serialRcvTime = Date.now();
        self.cm9Msg("version\n");
        for (var i = 0; i < self.motors.length; i++) {
                    self.motors[i].cm9Init();
        }
    }
    else{
        if(cm9Com.isOpen()){
            //cm9Com.write("STOP\n");
            //cm9Com.flush();
        }
        cm9Com.close();
        misGUI.cm9State("OFF");
        this.serialRcvTime=0;
    }
}



DxlManager.prototype.update = function(){

    for(var k in this.animPlaying){
            var p = this.animations[k].playKey();
            misGUI.animProgress(k,100-p);
    }

    var len=this.motors.length;
    var t  = Date.now();

    if(this.pause > 0){
        this.pause--;
    }
    else{

        //sync goals
        var msgG = "goals ";
        var count = 0;
        for(var i=0;i<len;i++){
            var g = this.motors[i].getGoal();
            if(g>=0)
                count++;
            msgG += g+","; //this.motors[i].getGoal();
        }
        if(count>0) {
            //console.log("sync", msgG);
            msgG += "\n";
            this.serialMsgs.push(msgG);
        }
    
        //sync speeds
        var msgS = "speeds ";
        count = 0;
        for(var i=0;i<len;i++){
            var s = this.motors[i].getSpeed();
            if(s!=-1)
                count++;
            msgS += s+","; //this.motors[i].getGoal();
        }
        if(count>0) {
            //console.log("syncS", msgS);
            msgS += "\n";
            this.serialMsgs.push(msgS);
        }
    }




    for(var i=0;i<len;i++){
        if(this.motors[i].update(t)) {
            this.motors[i].pushSerialMsg(this.serialMsgs);
            //misGUI.needle(i, this.motors[i].pos());
        }
        else
            console.log("UPDATE FALSE");
    }

    if(this.serialTimer==0)
        this.timedSerial();

    if(cm9Com == null){
        console.log("cm9Com IS NULL");
    }

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
    if(this.recording){
        this.recKey();
    }

    if( this.refreshID >= 0 ) {
        if( this.refreshAddr<48 ){
            this.cm9Msg("DR " + this.refreshID + "," + this.refreshAddr + ",\n");
            this.refreshAddr++;
        }
        else
            this.refreshID = -1;
    }

    //setTimeout(this.update.bind(this),50);
}

DxlManager.prototype.cmd = function(cmd,index,arg){
    //console.log("dxl command: ",index," cmd:",cmd," arg:",arg);
    if(this[cmd]){
        console.log("DxlManager.cmd:",cmd);
        this[cmd](index,arg);
    }
    else {
        if (index < this.motors.length)
            this.motors[index][cmd](arg);
    }
};

DxlManager.prototype.stopAll = function() {
    cm9Com.write("stop\n");
    for (var i = 0; i < this.motors.length; i++) {
        this.motors[i].enable(false);
    }
    this.stopAllAnims();
}

DxlManager.prototype.startReadDxl = function(dxlId) {
    this.stopAllAnims();
    this.refreshID = dxlId;
    this.refreshAddr = 0;
}



/*DxlManager.prototype.addMotor = function(id){
    this.motors.push( new Dxl(id) );


DxlManager.prototype.onValue = function(index,cmd,arg){
    console.log("dxl cmd:",cmd);
    //this.cmds[cmd].call(this.motors[index],arg);
};
*/

DxlManager.prototype.cm9Msg=function(str){
    this.serialMsgs.push(str);
}

DxlManager.prototype.onStringCmd=function(str){
    var a = str.split(/,| /);
    //console.log("srtCmd:",str);
    if(this[a[0]])
        this[a[0]](a);
    else
        console.log("srtCmd?:",str);

    this.serialRcvTime = Date.now();
}

DxlManager.prototype.onCm9Strings=function(args){
    if(this[args[0]])
        this[args[0]](args);
    else
        console.log("srtCmd?:",str);

    this.serialRcvTime = Date.now();
}


DxlManager.prototype.ipos=function(array) { //stringCmd
    var n = array.length-1;
    if(n>this.motors.length)
        n=this.motors.length;
    for(var i=0;i<n;i++){
        var v = +array[i+1] //array[0]="ipos"
        if(v>=0){
            var a=this.motors[i].currPos(v);
            misGUI.needle(i,a);
        }
    }
}

DxlManager.prototype.cm9Id=function(array) { //stringCmd
    console.log("+++ GotID[",+array[1],"]",+array[2]," ",array[3]);
    var im = +array[1];
    if( (im>=0)&&(im<this.motors.length)) {
        this.motors[im].dxlID(+array[2]);
        misGUI.motorSettings(im, this.motors[im].m );
    }
}

//arr[ index addr value ]
DxlManager.prototype.dxlReg=function(arr) { //stringCmd
    /*
    if(this.ax12regs){
        console.log("AX12[",arr[1],":",arr[2],"]",this.ax12regs[arr[2]],":",arr[3]);
        misGUI.setDxlReg(arr[2],this.ax12regs[arr[2]],arr[3]);
    }
    else*/
        console.log("dxlREG:[",+arr[1],"]",arr[2]," ",arr[3]);
        misGUI.showDxlReg(arr[1],arr[2],arr[3]);
}

DxlManager.prototype.readRegs=function(index) { //
    if((index>=0)&&(index<this.motors.length))
        this.motors[index]._regRead=0;
}


DxlManager.prototype.dxlRead=function(dxlid,addr) { //
    console.log("dxlRead:",+dxlid,+addr);
    this.cm9Msg("DR "+dxlid+","+addr+",\n");
}

DxlManager.prototype.dxlWrite=function(dxlid,addr,val) { //
        console.log("dxlWrite:",+dxlid,+addr,+val);
        this.cm9Msg("DW "+dxlid+","+addr+","+val+",\n");
}



DxlManager.prototype.writeReg=function(index,addr,val) { //
    if((index>=0)&&(index<this.motors.length)){
        console.log("WriteReg:",+index,+addr,+val);
        this.cm9Msg("EW "+index+","+addr+","+val+",\n");

    }
}

DxlManager.prototype.temperature = function(args){
    //console.log("temperature:",args[1],args[2]);
    misGUI.temperature(args[1],args[2]);
}

DxlManager.prototype.analogs = function(args){
    console.log("temperature:",args[1],args[2]);
}




DxlManager.prototype.version = function(arr){
    var v1 = +arr[1];
    var v2 = +arr[2];
    console.log("VERSION",v1,".",v2);
    //if(v1<2)
    if((v1!=2)&&(v2!=9))
        misGUI.alert("BAD VERSION "+v1+"."+v2);
    else
        misGUI.alert("Good VERSION "+v1+"."+v2);
}

//Compatibilité avec ancien CM9 MV id reg value
DxlManager.prototype.MV=function(array) {
    var id  = +array[1];
    var reg = +array[2];
    var val = +array[3];
    console.log("@@@ MV @@@:",array);
}

//
DxlManager.prototype.model=function(array) {
    var im = +array[1];
    if((im>=0)&&(im<this.motors.length)){
        this.motors[im].model(+array[2]);
    }
}


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

//TODO: change the name of the function to make it more global
DxlManager.prototype.onMidi = function(index,cmd,arg){
    //console.log("dxl-midi:",index," arg:",arg);
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
};

DxlManager.prototype.onNormControl = function(index,val){
    //console.log("norm:",index,val);
    if(index<this.motors.length){
        var dxl = this.motors[index];
        if(val<0)val=0;
        if(val>1)val=1;
        if(dxl.m.mode==0) {
            misGUI.angle(index, dxl.nAngle(val) );
        }
        else {
            misGUI.speed(index, dxl.nSpeed(val) );
        }
    }
};




DxlManager.prototype.onPlay = function(index,val){
    if(index<this.motors.length){
        var dxl = this.motors[index];
        if(dxl._mode==0)
            misGUI.angle( dxl.angle(val) );
        else
            misGUI.speed( dxl.speed(val) );
    }
};




DxlManager.prototype.recCheck=function(index,val){
    if(index<this.motors.length) {
        this.motors[index].rec = (val!=0);
    }
}

DxlManager.prototype.dxlEnabled=function(index,val){
    misGUI.dxlEnabled(index,val);
}


DxlManager.prototype.startRec=function(name){
    if(this.animFolder.length>0){
        nbm = this.motors.length;
        this.recIndices = [];
        for (var i = 0; i < nbm; i++) {
            if (this.motors[i].rec) {
                this.recIndices.push(i);
            }
        }

        if (this.recIndices.length > 0) {
            //console.log("RECnbMotors:",this.recIndices.length);
            var date = new Date(Date.now());
            var y = date.getFullYear();
            var m = ("00"+(date.getUTCMonth()+1)).slice(-2);
            var d = ("00"+date.getUTCDate()).slice(-2);
            var h = ("00"+date.getHours()).slice(-2);
            var mn = ("00"+date.getMinutes()).slice(-2);
            var s  = ("00"+date.getSeconds()).slice(-2);
            var name = y+"-"+m+"-"+d+"-"+h+"h"+mn+"-"+s;

            this.recAnim = new Animation("A"+this.animationID,this.animFolder,name);
            this.animationID++;
            this.recAnim.startRec(this.recIndices);
            this.recording = true;

        }
        else { //NO MOTOR TO REC
            misGUI.recOff();
            this.recording = false;
        }
    }
    else{ //open dialogBox ... select anim folder
        misGUI.recOff();
        this.recording = false;
    }
}

DxlManager.prototype.recKey=function() {
    if(this.recAnim){
        var key = [];
        var nbr = this.recIndices.length;
        for(var i=0;i<nbr;i++){
            var dxl = this.motors[this.recIndices[i]];
            if(dxl.m.mode==0)key.push(dxl._goalAngle); //dxl.angle());
            else key.push(dxl.speed());
        }
        this.recAnim.recKey(key);
    }
}

DxlManager.prototype.stopRec=function(){
    this.recording = false;
    if(this.recAnim) {
        this.recAnim.stopRec();
        //--->animLoaded
    }
};

DxlManager.prototype.loadAnim=function(fullPath) {
    console.log("LOADANIM()---------",this.animationID);

    var name  = fullPath;
    var slash = fullPath.lastIndexOf('/')+1;
    if(slash>1){
        this.animFolder = fullPath.substr(0,slash);
        name = fullPath.substr(slash);
    }
    var id = "A"+this.animationID;
    this.animationID++;
    console.log("loadAnim:",this.animFolder," ",name);
    var anim = new Animation(id,this.animFolder,name);
    anim.load();
};

DxlManager.prototype.animLoaded=function(anim){
    //this.animations.push({id:this.animationID,a:anim});
    var id = anim.id;
    console.log("ANIMLOADED---------(",id,")",this.animationID);
    this.animations[id]=anim;
    misGUI.addAnim(id,anim.fileName,anim.keyCode);
    misGUI.animTracks(id,anim.channels);
    this.recAnim = null; //TOTHINK ???

};

DxlManager.prototype.startAnim=function(id){
    var anim = this.animations[id];
    if(anim){
        anim.startPlay();
        this.animPlaying[id]=anim; //ok not twice
    }
}

DxlManager.prototype.getAnimID=function(animName){
    var anims = []; // in case there are multiple anims with same name
    for(var k in this.animations){
        if(this.animations[k].fileName == animName){
            anims.push(this.animations[k].id);
        }
    }
    return anims;
}

DxlManager.prototype.onMetaKey=function(char){
    console.log("METAKEY",+char);
    if(char=='s'){
        console.log("Saving all files");
        this.saveSettings();
        settingsManager.saveSettings();
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
    else {
        for (var k in this.animations) {
            console.log("animK:",k,this.animations[k].keyCode);
            if (this.animations[k].keyCode.indexOf(keyCode)>=0) {
                this.startAnim(k);
                misGUI.animCheck(k, 1);
            }
        }
    }
}

// DXL SCAN functions ---------------------
DxlManager.prototype.ping=function(args){ //oldCM9
    console.log("ping:",args[1]);
    misGUI.scanProgress(+args[1]);
}
DxlManager.prototype.pong=function(args){ //oldCM9
    console.log("pong:",args[1]);
    misGUI.scanProgress(+args[1]);
}
DxlManager.prototype.scan=function(args){ //oldCM9
    misGUI.scanProgress(+args[1]);
}

DxlManager.prototype.startScan=function(){
    if(cm9Com.isOpen()) {
        console.log("STARTSCAN");
        misGUI.scanProgress(0);
        //misGUI.blockUI(true);
        this.stopAll();
        for (var i = 0; i < this.motors.length; i++) {
            this.motors[i].dxlID(0);
            misGUI.motorSettings(i, this.motors[i].m);
        }
        this.cm9Msg("scan\n");
    }
}

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
    for(var i=0;i<this.motors.length;i++){
        if(this.motors[i].m.id == nid){
            previous = this.motors[i];
            console.log("DxlManager.setIndexID:DUPLICATE",i," ",id);
            this.motors[i].dxlID(0);
            misGUI.motorSettings(i,this.getMotorSettings(i));
        }
    }
    this.motors[index].dxlID(nid);
    if(previous)
        this.motors[index].copy(previous);
    misGUI.motorSettings(index,this.getMotorSettings(index));

};


DxlManager.prototype.setKeyCode = function(id,keyCode){
    var anim = this.animations[id];
    if(anim){
        if( keyCode==undefined){
            keyCode = "";
        }
        keyCode = keyCode.replace(/\u0000/g,'');
        keyCode = keyCode.replace(/ /g,'');

        console.log("setkeycode:",keyCode.length,keyCode);

        if(anim.keyCode != keyCode){
            anim.keyCode = keyCode;
            console.log("setkeycode: len:",anim.keyCode.length);
            console.log("setkeycode: charcode0:",anim.keyCode.charCodeAt(0));
            console.log("setkeycode: charcode1:",anim.keyCode.charCodeAt(1));
            anim.save();
        }

    }

}

DxlManager.prototype.stopAnim=function(id){
    var anim = this.animPlaying[id];
    if(anim) {
        delete this.animPlaying[id];
        anim.stopPlay();
        misGUI.animCheck(id,0);
    }
}

DxlManager.prototype.loopAnim=function(id,onoff){ //set anim.loop true/false //?loop count?
    var anim = this.animations[id];
    if(anim){
        anim.loop = onoff;
        misGUI.animLoopOnOff(id,onoff);
    }
}

DxlManager.prototype.animChannel=function(id,num,onoff){
    var anim=this.animations[id];
    if(anim){
        anim.channelEnable(num,onoff);
    }
}

DxlManager.prototype.playKey=function(cmd,index,val) {
    //console.log("playkey:",cmd," ",index," ",val);
    if(index<this.motors.length) {
        this.motors[index][cmd](val);
        misGUI[cmd](index,val);
    }
}

DxlManager.prototype.stopAllAnims = function() {
    console.log("---------------- stopAll",k);
    for (var k in this.animPlaying) {
        this.animations[k].stopPlay();
        misGUI.animCheck(k, 0);
    }
    for (var k in this.animPlaying) {
        delete this.animPlaying[k];
    }
}

DxlManager.prototype.renameAnim=function(id,name){
    var anim = this.animations[id];
    console.log("rename:",id," ",name);
    if(anim){
        console.log(" oldname:",anim.fileName);
        anim.save(name);
        //TOTHINK delete old ??? : no: duplicate anim = safe
    }
}

DxlManager.prototype.removeAnim=function(id){
    var anim = this.animations[id];
    console.log("remove",id," ",anim.fileName);

    if(anim) {
        anim.discard();
        delete this.animPlaying[id];
        delete this.animations[id];
    }
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
        if(this.motors[i].m.id==id)
            return this.motors[i];
    }
    return null;
};

DxlManager.prototype.getMotorSettings=function(index){
    if((index>=0)&&(index<this.motors.length))
        return this.motors[index].m;
    return null;
}

DxlManager.prototype.writeDxlId = function(index,val){
    console.log("!!!!! DXLM-changeDxlId:",index," ",val);
    var nm=this.motors.length;
    for(var i=0;i<nm;i++){
        if((i!=index)&&(this.motors[i].m.id==val))
            return false;
    }
    cm9Com.write("EX "+index+",3,"+val+",\n"); //3=ADDR_ID (PROTECTED)
    this.dxlID(index,val);

    return true;
}

DxlManager.prototype.getMode = function(index){
    console.log("getMode:",index);
    if(this.motors[index])
        return this.motors[index].m.mode;
    return 1;
    //0:joint 1:wheel
};



