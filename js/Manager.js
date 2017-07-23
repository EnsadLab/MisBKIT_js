/**
 * Created by Didier on 09/07/16.
 */

function MisBK(){
    this.motors = [];
    this.recIndices = [];
    this.recording  = false;
    this.recAnim    = null;
    this.animationID = 0;
    this.animations  = [];
    this.animFolder  = "";
    this.animPlaying = [];

    this.serialTimer = 0;
    this.serialFifo = [];
    this.serialRcvTime = 0;
    this.serialIndex = 0;
    //this.serialBuff = new Uint8Array(256);

    if(fs) {
        var json = fs.readFileSync(__dirname + "/data/ax12.json", 'utf8');
        this.ax12regs = JSON.parse(json);
        //$.each(this.ax12regs,function(k,v){console.log(k+":"+v);}); //object[key]);
    }

    for(var i=0;i<MAX_SERVOS;i++){
        this.motors.push( new Dxl(i) );
    }
}

MisBK.prototype.cm9Msg=function(str){
    this.serialFifo.push(str);
}

MisBK.prototype.onStringCmd=function(str){
    var a = str.split(/,| /);
    //console.log("srtCmd:",str);
    if(this[a[0]])
        this[a[0]](a);
    else
        console.log("srtCmd?:",str);

    this.serialRcvTime = Date.now();
}

MisBK.prototype.timedSerial= function(){
    if(this.serialFifo.length>0){
        var m = this.serialFifo.shift();
        cm9Com.write(m);
        console.log("send:",m);//DGB
        this.serialTimer = setTimeout(this.timedSerial.bind(this),0);
    }
    this.serialTimer = 0;
}

MisBK.prototype.update = function(){

    for(var k in this.animPlaying){
        var p = this.animations[k].playKey();
        misGUI.animProgress(k,100-p);
    }

    var len=this.motors.length;
    var t  = Date.now();
    for(var i=0;i<len;i++){
        if(this.motors[i].update(t)) {
            this.motors[i].pushSerialMsg(this.serialMsgs);
            //misGUI.needle(i, this.motors[i].pos());
        }
        else
            console.log("UPDATE FALSE");
    }

    if(this.recording){
        this.recKey();
    }

    if(this.serialTimer==0)
        this.timedSerial();

    if( cm9Com.isOpen() && this.serialRcvTime!=0 ) {
        if ((Date.now() - this.serialRcvTime) > 3000) {
            this.serialRcvTime = 0;
            this.serialOnOff(false);
            misGUI.serialState("LOST");
        }
    }

    setTimeout(this.update.bind(this),0);
}

MisBK.prototype.cmd = function(cmd,index,arg){
    console.log("Manager.cmd: ",index," cmd:",cmd," arg:",arg);
    if(this[cmd]){
        this[cmd](index,arg);
    }
    else if (index < this.motors.length){
        this.motors[index][cmd](arg);
    }
}


//all positions by index
MisBK.prototype.ipos=function(array) { //stringCmd
    var n = array.length-1;
    if(n>this.motors.length)
        n=this.motors.length;
    for(var i=0;i<n;i++){
        var v = +array[i+1];
        if(v>=0){
            var a=this.motors[i].currPos(v);
            misGUI.needle(i,a);
        }
    }
}


//message reçu en fin de scan
MisBK.prototype.motorIds=function(array) { //stringCmd
    //TODO refactor & timeOut
    console.log("+++ MotorIds:",array);
    misGUI.blockUI(false); //endScan
}


MisBK.prototype.onMidi = function(index,cmd,arg){
    console.log("dxl-midi:",index," arg:",arg);
    if(index<this.motors.length){
        var dxl = this.motors[index];
        if(dxl.m.mode==0) {
            misGUI.angle(index,   dxl.nAngle(arg/127));
        }
        else {
            misGUI.speed(index,   dxl.nSpeed(arg/127));
        }
    }
}

MisBK.prototype.stopAll = function() {
    cm9Com.write("STOP \n");
    this.stopRec();
    this.stopAllAnims();
    for (var i = 0; i < this.motors.length; i++) {
        this.motors[i].enable(false);
    }
}


MisBK.prototype.playKey=function(cmd,index,val) {
    //TODO motorcmd(index,cmd,arg)?
    //console.log("playkey:",cmd," ",index," ",val);
    if(index<this.motors.length) {
        this.motors[index][cmd](val);
        misGUI[cmd](index,val);
    }
}

MisBK.prototype.model=function(array) { //stringCmd
    var im = +array[1];
    if((im>=0)&&(im<this.motors.length)){
        this.motors[im].model(+array[2]);
    }
}

MisBK.prototype.recCheck=function(index,val){ //motorCmd
    if(index<this.motors.length) {
        this.motors[index].rec = (val!=0);
    }
}

MisBK.prototype.dxlEnabled=function(index,val){ //motorCmd
    misGUI.dxlEnabled(index,val);
}

MisBK.prototype.setKeyCode = function(id,keyCode){
    //TODO refactor shortcut
    var anim = this.animations[id];
    if(anim)anim.keyCode = keyCode;
}


MisBK.prototype.stopAnim=function(id){
    var anim = this.animPlaying[id];
    if(anim) {
        delete this.animPlaying[id];
        anim.stopPlay();
        misGUI.animCheck(id,0);
    }
}

MisBK.prototype.loopAnim=function(id,v){ //set anim.loop 0 1 //?loop count?
    var anim = this.animations[id];
    if(anim)anim.loop = v;
}

//enable or disable a motor in anim
MisBK.prototype.animChannel=function(id,num,onoff){
    var anim=this.animations[id];
    if(anim){
        anim.channelEnable(num,onoff);
    }
}





MisBK.prototype.motorByIndex = function(index){
    if(index<this.motors.length)
        return this.motors[index];
    return null;
};

MisBK.prototype.motorByID = function(id){
    //TODO map id->index ?
    var l=this.motors.length;
    for(var i=0;i<l;i++){
        if(this.motors[i].m.id==id)
            return this.motors[i];
    }
    return null;
};

MisBK.prototype.getMotorSettings=function(index){
    if((index>=0)&&(index<this.motors.length))
        return this.motors[index].m;
    return null;
}

MisBK.prototype.changeDxlId = function(index,val){ //motorCmd
    var m = this.motorByID(val);
    if( m )m.dxlID(-1);

    console.log("MisBK-changeDxlId:",val);
    cm9Com.write("EW "+index+" 3 "+val+"\n");
    //this.motors[index].m.id = val;
    this.motors[index].dxlID(val);
    return true;
}

MisBK.prototype.startScan=function(){
    console.log("STARTSCAN");
    misGUI.blockUI(true);
    this.stopAll();
    for(var i=0;i<this.motors.length;i++) {
        this.motors[i].dxlID(0);
        misGUI.motorSettings(i,this.motors[i].m );
    }
    this.cm9Msg("scan \n");

}

MisBK.prototype.startRec=function(name){
    console.log("folder:",this.animFolder);
    if(this.animFolder.length>0){
        nbm = this.motors.length;
        this.recIndices = [];
        for (var i = 0; i < nbm; i++) {
            if (this.motors[i].rec) {
                this.recIndices.push(i);
            }
        }
        if (this.recIndices.length > 0) {
            this.recAnim = new Animation("A"+this.animationID++,this.animFolder,"no-name");
            this.recAnim.startRec(this.recIndices);
            this.recording = true;
        }
        else
            misGUI.recOff();
    }
    else{ //open dialogBox ... select anim folder
        if(ELECTRON==true) { //needs remote.dialog
            var self = this;
            dialog.showOpenDialog({
                title:"First Choose Anim Folder",
                properties: ['openDirectory','createDirectory']
            },function(folder){
                if(folder) {
                    console.log("folder:", folder);
                    var slash = folder.lastIndexOf('/') + 1;
                }
            });
        }
    }
}


MisBK.prototype.stopRec=function(){
    this.recording = false;
    if(this.recAnim) {
        this.recAnim.stopRec();
        //-- -- -->animLoaded()
    }
};

DxlManager.prototype.recKey=function() {
    if(this.recAnim){
        var key = [];
        var nbr = this.recIndices.length;
        for(var i=0;i<nbr;i++){
            var dxl = this.motors[this.recIndices[i]];
            if(dxl.m.mode==0)key.push(dxl.angle());
            else key.push(dxl.speed());
            //console.log("key0:"," ",key[i]," m",dxl.m.mode);
        }
        this.recAnim.recKey(key);
    }
}


MisBK.prototype.startAnim=function(id){
    var anim = this.animations[id];
    if(anim){
        anim.startPlay();
        this.animPlaying[id]=anim; //ok not twice
    }
}

MisBK.prototype.stopAllAnims = function() {
    for (var k in this.animPlaying) {
        this.animations[k].stopPlay();
        misGUI.animCheck(k, 0);
    }
    for (var k in this.animPlaying) {
        delete this.animPlaying[k];
    }
}

MisBK.prototype.renameAnim=function(id,name){
    var anim = this.animations[id];
    console.log("rename:",id," ",name);
    if(anim){
        console.log(" oldname:",anim.fileName);
        anim.save(name);
        //TOTHINK delete old ??? : no: duplicate anim = safe
    }
}

MisBK.prototype.removeAnim=function(id){
    var anim = this.animations[id];
    if(anim) {
        anim.discard();
        delete this.animPlaying[id];
        delete this.animations[id];
    }
}

MisBK.prototype.loadAnim=function(fullPath) {
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

MisBK.prototype.animLoaded=function(anim){
    var id = anim.id;
    this.animations[id]=anim;
    misGUI.addAnim(id,anim.fileName,anim.keyCode);
    misGUI.animTracks(id,anim.channels);
    this.recAnim = null; //TOTHINK ???
};



MisBK.prototype.onMetaKey=function(char){ //command/key
    if(char=='s')
        this.saveSettings();
}

MisBK.prototype.onKeyCode = function(keyCode){
    //TODO refactor onKeyPress
    console.log("onkeycode c:",keyCode);
    if(keyCode==" "){
        this.stopAll();
    }
    else if(keyCode=="?"){ //TEST
        this.motors[0]._regRead=0;
        //misGUI.setDxlReg(4,"toto",123);
    }
    else {
        for (var k in this.animations) {
            console.log("onkeycode:", this.animations[k].keyCode);
            if (this.animations[k].keyCode == keyCode) {
                this.startAnim(k);
                misGUI.animCheck(k, 1);
            }
        }
    }
}

//----------------------------------------------
if(fs==null){ //NOT_NODE
    MisBK.prototype.saveSettings = function(){}
    MisBK.prototype.loadSettings = function(){}
}
else {
    MisBK.prototype.saveSettings = function () {
        var s = {};
        s.serialPort = cm9Com.serialName;
        //s.midiPort   = midiPort.getPortName();
        s.midiPort = midiPortManager.getCurrentPortName();
        s.oscHost    = "none";
        s.webSocket  = "none";
        s.animFolder = this.animFolder;
        s.anims = [];
        s.motors = [];
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
    };

    MisBK.prototype.loadSettings = function () {
        var json = fs.readFileSync(__dirname + "/settings.json", 'utf8');
        if (json) {
            var s = JSON.parse(json);
            this.serialPort = s.serialPort;
            cm9Com.serialName = s.serialPort;

            this.midiPort = s.midiPort;
            this.oscHost = s.oscHost;
            this.webSocket = s.webSocket;
            this.animFolder = s.animFolder;
            for (var i = 0; i < s.motors.length; i++) {
                this.motors[i].copySettings(s.motors[i]);
                misGUI.motorSettings(i, s.motors[i]);
            }

            for (var i = 0; i < s.anims.length; i++) {
                var anim = new Animation("A" + i, this.animFolder, s.anims[i].name);
                anim.keyCode = s.anims[i].key;
                anim.load(s.anims[i].name);
            }

            midiPort.open(this.midiPort);

            misGUI.midiPort(this.midiPort);
            misGUI.openSerial(this.serialPort);
        }
    }
}



MisBK.prototype.serialOnOff= function(onoff,name){
    console.log("dxl serialOnOff:",onoff,name);
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
                for (var i = 0; i < self.motors.length; i++) {
                    self.motors[i].cm9Init();
                }
                misGUI.serialState("ON");
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

