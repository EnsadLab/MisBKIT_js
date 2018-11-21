/**
 * Created by Didier on 08/05/16.
 */
/*versionHTML
var fs = require('fs');
var remote  = require('remote');
var dialog  = remote.require('dialog');
*/


//var anim = new Animation(__dirname+'/',"test2.anim");
//float values

// params
// sinus: param[0]: offset, param[1]: Frequency, param[2]: amplitude[0.0,1.0]
// random: param[0]: , param[1]: , param[2]: , param[3]

function Animation(id,folder,name){
    this.s = { //settings
        type: "", // "record", "sinus", "random", "trigger"
        keyCode: "",
        nbparams: 0,
        params: [],
        channels: [], // TO be discussed if we cancel the other this.channels... it's so specific to the json that I left it like this for now.
    };
    this.id = id;
    //this.keyCode = "";
    this.fileFolder = folder;
    this.fileName = name;
    this.recording = false;
    this.recordingGUI = false; // ok.. not ideal.. but want to be sure that this.recording behaves the same way.
    this.playing   = false;
    this.loop      = false;
    this.wStream = null;
    this.intBuff = null;
    this.writeCount = 0;
    this.datas = null;
    this.nbChannels = 0;
    this.channels   = [];
    // in order to not have different functions when add or load..
    // otherwise we would have needed to create chanels when recording and adding a parameter record:true/false
    //this.nbRecordChannels = 0;
    this.recordchannels = []; 
    this.recIndices = [];
    this.firstIndex = 0;
    this.keySize  = 0;
    this.keyIndex = 0;
    this.sinusTimer = 0;
    this.oldTime = 0;
};
module.exports = Animation;


Animation.prototype.discard=function(){
    this.stopRec();
    this.stopPlay();
    this.datas=null;
}

Animation.prototype.setRecordChannel = function(index,value){
    for(c of this.recordchannels){
        if(c.i == index){
            c.record = value;
        }
    }
    //console.log("recordchanels",this.recordchannels);
}

Animation.prototype.getRecordChannelsOn = function(){
    var nb = 0;
    for(c of this.recordchannels){
        if(c.record){
            nb++
        }
    }
    //console.log("recordchannels lenght",this.recordchannels,"nb",nb);
    return nb;
}

//Animation.prototype.startRec = function(motors,fname){
Animation.prototype.startRec = function(fname){

    var self = this;
    this.recording = false;
    if(fs==null)//versionHTML
        return;

    //console.log("startRec a ",this.fileName);
    if(fname) this.fileName = fname;
    else {
        if(this.fileName == undefined || this.fileName.length == 0){ // if there is no name yet
            var date = new Date(Date.now());
            var y = date.getFullYear();
            var m = ("00"+(date.getUTCMonth()+1)).slice(-2);
            var d = ("00"+date.getUTCDate()).slice(-2);
            var h = ("00"+date.getHours()).slice(-2);
            var mn = ("00"+date.getMinutes()).slice(-2);
            var s  = ("00"+date.getSeconds()).slice(-2);
            this.fileName= y+"-"+m+"-"+d+"-"+h+"h"+mn+"-"+s;
        }
    }
    //console.log("startRec b ",this.fileName);
    MisGUI_anims.setAnimName(this.id,this.fileName);

    this.recIndices = [];
    for(var c=0; c<this.recordchannels.length; c++){
        // should we also check if the motor is on???
        if(this.recordchannels[c].record){
            this.recIndices.push(this.recordchannels[c].i);
        }
    }
    var nbm = this.recIndices.length;

    this.nbChannels = nbm;
    this.writeCount = 0;

    //var header = Buffer.alloc(nbm*2 + 4); //buffer for keys: nbChannel float
    var header   = new Buffer(nbm*2 + 4); header.fill(0); //alloc : node v5.10
    //this.intBuff = Buffer.alloc(nbm * 4); //buffer for keys: nbChannel float
    this.intBuff = new Buffer(nbm * 4);this.intBuff.fill(0);

    //misGUI.alert("START REC 2:"+nbm);

    //header.writeInt16LE(0xABCD,0); //TOTHINK : type
    header.writeInt16LE(nbm,2);
    var ih = 4;
    //for(var m=0;m<nbm;m++){
    for(var i=0; i<this.recIndices.length; i++){
        var dxl = dxlManager.servoByIndex(this.recIndices[i]);
        header.writeInt8(this.recIndices[i]|0,ih++);
        header.writeInt8(dxl.m.mode|0,ih++);
    }
    this.firstIndex = ih;

    this.wStream = fs.createWriteStream(this.fileFolder+this.fileName);

    this.wStream.on('error', function (err) {
        misGUI.alert("STREAM ERROR:"+err);
    });


    this.wStream.once('open', function (fd) {
        console.log('ANIM opened:',self.writeCount," ",fd);
        //misGUI.alert("STREAM OPEN:"+self.writeCount);
    });
    this.wStream.on('finish',function(){
        console.log('ANIM wStream finish',self.writeCount);
        //misGUI.alert("STREAM FINISH:"+self.writeCount);
    });
    this.wStream.on('close', function () {
        console.log('ANIM wStream close',self.writeCount);
        self.recording = false;
        self.wStream = null;
        self.load(self.fileName, false);
        //misGUI.alert("END REC:"+self.writeCount);
    });

    this.wStream.write(header,function() {
        self.recording = true;
        console.log("ANIM header written ",self.recording);
    });

    //setTimeout(testRec,50);
};

Animation.prototype.stopRec = function(){
    var self = this;
    if(this.wStream) {
        this.wStream.end(function () {
            console.log("REC END length:", self.writeCount);
            //self.wStream.close();
            //self.wStream.destroySoon();
            //self.load(this.fileName);

        });
        //misGUI.alert("STOP REC:"+self.writeCount);

    }
    //else{misGUI.alert("STOP REC: NULL:"+self.writeCount);}

};

Animation.prototype.recKey = function(){
    var key = [];
    var nbr = this.recIndices.length;
    for(var i=0;i<nbr;i++){
        var dxl = dxlManager.motors[this.recIndices[i]];
        if(dxl.m.mode==0)key.push(dxl.wantedAngle); //dxl.angle());
        else key.push(dxl.speed());
    }
    if(this.wStream) {
        //console.log("anim.reckey:",key);
        //console.log("REC:",this.writeCount," ",this.recording);
        for (var i = 0; i < this.nbChannels; i++) {
            //console.log("rec:",i," v:",key[i]);
            //this.intBuff.writeInt16LE(values[i], i+i);
            this.intBuff.writeFloatLE(key[i], i<<2);//32bit
        }
        this.wStream.write(this.intBuff,function(){
            //console.log("written");
        });
        this.writeCount++;
    } 
}


Animation.prototype.copySettings = function(s){
    for(var e in s){
        this.s[e]=s[e];
    }
}


Animation.prototype.save = function(fname){
    console.log("saveAnim:",this.fileFolder + this.fileName);
    console.log("type",this.s.type,"keycode:",this.s.keyCode,this.s.keyCode.charCodeAt(0));
    if(fname) this.fileName = fname;
    if(this.s.type == "record"){
        if(this.datas != null){
            this.datas.writeInt8(this.s.keyCode.charCodeAt(0),1);
            
            fs.writeFileSync(this.fileFolder + this.fileName, this.datas);
        }
    } else {
        this.s.channels = this.channels;
        var json = JSON.stringify(this.s, null, 2);
        if(!(this.fileName.endsWith(".json"))){
            fs.writeFileSync(animManager.animFolder + this.fileName + ".json", json ); 
        } else { // should not happen.. just in case.
            fs.writeFileSync(animManager.animFolder + this.fileName, json ); 
        }
    }
}

/* 0  0
   1  keycode (8)
   2 nbchannels (16)
   3 channels ....
 */
Animation.prototype.load = function(fname, addToGui){ //sync
    console.log("DBG LoadAnim",fname);
    if(fname) this.fileName = fname;
    this.playing = false;
    this.datas   = null;
    if(this.fileName.endsWith(".json")){ // sinus, random, trigger types
        var json;
        try{
            json = fs.readFileSync(this.fileFolder+this.fileName, 'utf8');
        }catch(err){
            if (err.code === 'ENOENT') {
                console.log("File " + this.fileFolder+this.fileName + " not found!");
            }else{
                console.log("Problem loading " + this.fileFolder+this.fileName + " file");
            }
        }
        if (json) {
            // create new animation from the json file
            console.log("adding new animation from json file");
            var s = JSON.parse(json);
            this.fileName = this.fileName.substring(0,this.fileName.length-5); // we'll add the ".json" while saving
            this.copySettings(s);
            this.channels = this.s.channels;
            this.nbChannels = this.s.channels.length;
            if(addToGui) animManager.animLoaded(this); 
            MisGUI_anims.setPlayingTracks(this.id,this.channels);
            MisGUI_anims.setAnimName(this.id,this.fileName);
            MisGUI_anims.setKeyCode(this.id,this.s.keyCode);
            //console.log("loading.....params",this.s.params);
            misGUI.showParams({
                class: animManager.className,
                func: "changeParam",
                id: this.id,
                val: this.s.params, 
            });
        }
    }
    else { // record type
        var datas = fs.readFileSync(this.fileFolder+this.fileName);
        if(datas){
            console.log("DBG LoadAnim length:",datas.length);
            console.log("DBG KeyCode:",datas.readInt8(1));
            if(datas.readInt8(1)!=0)
                this.s.keyCode = String.fromCharCode(datas.readInt8(1));
            else
                this.s.keyCode = "";
            
            var nbm = datas.readInt16LE(2); //nbChannels
            //console.log("DBG LoadAnim nb motors:",nbm);
            this.nbChannels = nbm;
            this.channels = [];
            var ih = 4; //'magic16 +nbc16'
            for(var m=0;m<nbm;m++){
                var imot = datas.readInt8(ih++);
                var mode = datas.readInt8(ih++);
                if(mode==0)this.channels.push({play:true,i:imot,f:"angle"});
                else this.channels.push({play:true,i:imot,f:"speed"});
                //console.log("DBG LoadAnim motor index:",imot," mode:",mode);
                //console.log("DBG LoadAnim play:",this.channels[m].play);
            }
            this.firstIndex = ih;
            this.keySize = (nbm<<2);//float
            this.datas = datas;
            this.s.type = "record";
            if(addToGui) animManager.animLoaded(this); 
            MisGUI_anims.setPlayingTracks(this.id,this.channels);
            MisGUI_anims.setAnimName(this.id,this.fileName);
            MisGUI_anims.setKeyCode(this.id,this.s.keyCode);
            MisGUI_anims.desactivateChannels(this.id,this.channels);
            //this.startPlay();
        }
        else{
            console.log("LOAD ERROR:",this.fileFolder+this.fileName);
        }
    }

};

Animation.prototype.startPlay = function() {
    //console.log("startPlay:");
    if(this.s.type == "sinus") {
        this.sinusTimer = 0;
        this.oldTime = performance.now();
        this.playing = true;
    } else if(this.s.type == "random"){
        var int_min = +this.s.params["param1"];
        var int_max = +this.s.params["param3"];
        var t = Math.random()*(int_max-int_min)+int_min;
        this.inputTimer = setTimeout(this.updateRandom.bind(this),t*1000);
    } else if(this.s.type == "record") {
        if(this.datas==null){
            this.playing  = false;
            return;
        }
        //console.log("StartPlay:",this.datas.length);
        //console.log("channels:",this.channels);
        this.keyIndex = this.firstIndex;
        if(this.playing == false){  //prevent joint/wheel each loop
            for(var c=0;c<this.nbChannels;c++){
                if(this.channels[c].play){ //TOTHINK
                    if( this.channels[c].f=="angle" )
                        dxlManager.cmd("joint",this.channels[c].i);
                    else
                        dxlManager.cmd("wheel",this.channels[c].i);
                }
            }
        }
        this.playing  = true;
    }
    //setTimeout(testPlay,100);//!!!!!id
}


Animation.prototype.channelEnable=function(num,onoff){
    console.log("--> channelEnable BEFORE",this.channels);
    for(var i=0;i<this.channels.length;i++){
        if(this.channels[i].i==num) {
            console.log(" channel ",i," m:",num," ",onoff);
            this.channels[i].play = onoff;
        }
    }
    if(this.type != "record"){
        this.save();
    }
    console.log("--> channelEnable AFTER",this.channels);
}

Animation.prototype.getPercent = function() {
    return (this.datas.length-this.keyIndex)*100/this.datas.length;
}

/**
 * returns % progress
 */
Animation.prototype.playKey = function() {
    if(this.s.type == "sinus"){
        this.updateSinus();
        return 0;
    } else if(this.s.type == "random"){
        return 0;
    } else if(this.s.type == "record"){
        if((this.playing==false)||(this.datas==null))
            return 0;

        var ik = this.keyIndex;
        this.keyIndex+=this.keySize;

        //console.log("playkey:",ik," ",this.channels[0].play);

        if(this.keyIndex<this.datas.length){
            for(var c=0;c<this.nbChannels;c++){
                if(this.channels[c].play) {
                    var v = this.datas.readFloatLE(ik);
                    //console.log("anim.playkey:",ik,v);
                    //console.log("play:",this.channels[c].i, " ", this.datas.readInt16LE(ik));
                    //console.log("play:",this.channels[c].i," ", this.datas.readFloatLE(ik));
                    dxlManager.playKey(this.channels[c].f,this.channels[c].i,this.datas.readFloatLE(ik));
                }
                ik+=4; //float32
            }
        }
        else{
            if(this.loop) this.startPlay();
            else this.stopPlay();
        }

        return (this.datas.length-this.keyIndex)*100/this.datas.length;
    }
}


Animation.prototype.stopPlay = function() {
    this.playing  = false;
    animManager.stopAnim(this.id);
    //stop motor if mode speed
    for(var c=0;c<this.nbChannels;c++){
        if(this.channels[c].play) {
            //console.log("anim.stopPlay:channel:",c," i:",this.channels[c].i," f:",this.channels[c].f);
            if(this.channels[c].f=="speed"){
                dxlManager.playKey(this.channels[c].f,this.channels[c].i,0.0);
                //console.log("----speed:",0);               
            }
        }
    }
    if(this.s.type == "random"){
        clearTimeout(this.inputTimer);
    }
    
}

// sinus: param[0]: offset, param[1]: Frequency, param[2]: amplitude[0.0,1.0]
Animation.prototype.updateSinus = function() {
    //console.log("time",performance.now());
    var curr_time = performance.now();
    var t0 = curr_time-this.oldTime;
    this.oldTime = curr_time;
    //console.log("time",t0);
    this.sinusTimer += 0.2;
    this.sinusTimer += 6.0;
    var a = this.sinusTimer;
    var v = this.s.params["param2"]*Math.sin(Math.PI*2.0*a*this.s.params["param1"]/100.0) + this.s.params["param0"];
    //var v = this.s.params["param2"]*Math.sin(Math.PI*2.0*a) + this.s.params["param0"];
    var nv = v*0.5 + 0.5;
    for(var c=0;c<this.channels.length;c++){
        if(this.channels[c].play) {
            //dxlManager.playKey(this.channels[c].f,this.channels[c].i,value);
            dxlManager.playKey(this.channels[c].f,this.channels[c].i,v);
           // dxlManager.onNormControl(this.channels[c].i,nv);
        }
    }
}

// random: param0: min value, param1: Interval min, param2: max value, param3: interval max
Animation.prototype.updateRandom = function() {
    var int_min = +this.s.params["param1"];
    var int_max = +this.s.params["param3"];
    var val_min = +this.s.params["param0"];
    var val_max = +this.s.params["param2"];
    var value = Math.random()*(val_max-val_min)+val_min;
    for(var c=0;c<this.channels.length;c++){
        if(this.channels[c].play) {
            // TODO DIDIER2: quelle fonction dois-je appeler?
            //console.log("updateRandom",this.channels[c].i,value);
            dxlManager.playKey(this.channels[c].f,this.channels[c].i,value);
            //dxlManager.onNormControl(this.channels[c].i,nv);
        }
    }
    var t = Math.random()*(int_max-int_min)+int_min;
    this.inputTimer = setTimeout(this.updateRandom.bind(this),t*1000);
}


