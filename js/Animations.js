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


function Animation(id,folder,name){
    this.id = id;
    this.keyCode = "";
    this.fileFolder = folder;
    this.fileName = name;
    this.recording = false;
    this.playing   = false;
    this.loop      = false;
    this.wStream = null;
    this.intBuff = null;
    this.writeCount = 0;
    this.datas = null;
    this.nbChannels = 0;
    this.channels   = [];
    this.firstIndex = 0;
    this.keySize  = 0;
    this.keyIndex = 0;
};

Animation.prototype.discard=function(){
    this.stopRec();
    this.stopPlay();
    this.datas=null;
}

Animation.prototype.startRec = function(motors,fname){

    var self = this;
    this.recording = false;
    if(fs==null)//versionHTML
        return;


    if(fname) this.fileName = fname;
    var nbm  = motors.length;

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
    for(var m=0;m<nbm;m++){
        var dxl = dxlManager.servoByIndex(motors[m]);
        header.writeInt8(motors[m]|0,ih++);
        header.writeInt8(dxl.m.mode|0,ih++);
    }
    this.firstIndex = ih;

    this.wStream = fs.createWriteStream(this.fileFolder+this.fileName);

    this.wStream.on('error', function (err) {
        misGUI.alert("STREAM ERROR:"+err);
    });


    this.wStream.once('open', function (fd) {
        //console.log('ANIM opened:',self.writeCount," ",fd);
        //misGUI.alert("STREAM OPEN:"+self.writeCount);
    });
    this.wStream.on('finish',function(){
        //console.log('ANIM wStream finish',self.writeCount);
        //misGUI.alert("STREAM FINISH:"+self.writeCount);
    });
    this.wStream.on('close', function () {
        //console.log('ANIM wStream close',self.writeCount);
        self.recording = false;
        self.wStream = null;
        self.load(self.fileName);
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

Animation.prototype.recKey = function(values){
    if(this.wStream) {
        //console.log("REC:",this.writeCount," ",this.recording);
        for (var i = 0; i < this.nbChannels; i++) {
            console.log("rec:",i," v:",values[i]);
            //this.intBuff.writeInt16LE(values[i], i+i);
            this.intBuff.writeFloatLE(values[i], i<<2);//32bit
        }
        this.wStream.write(this.intBuff,function(){
            //console.log("written");
        });
        this.writeCount++;
    }
}

Animation.prototype.save = function(fname){
    console.log("save: keycode:",this.keyCode.charCodeAt(0));
    this.datas.writeInt8(this.keyCode.charCodeAt(0),1);
    if(fname) this.fileName = fname;
    if(this.datas!=null) {
        console.log("saveAnim:",this.fileFolder + this.fileName);
        fs.writeFileSync(this.fileFolder + this.fileName, this.datas);
    }
}

/* 0  0
   1  keycode (8)
   2 nbchannels (16)
   3 channels ....
 */
Animation.prototype.load = function(fname){ //sync
    //console.log("DBG LoadAnim",fname);
    if(fname) this.fileName = fname;
    this.playing = false;
    this.datas   = null;
    var datas = fs.readFileSync(this.fileFolder+this.fileName);
    if(datas){
        //console.log("DBG LoadAnim length:",datas.length);
        //console.log("DBG KeyCode:",datas.readInt8(1));
        if(datas.readInt8(1)!=0)
            this.keyCode = String.fromCharCode(datas.readInt8(1));
        else
            this.keyCode = "";
        
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
        dxlManager.animLoaded(this);
        //this.startPlay();
    }
    else{
        console.log("LOAD ERROR:",this.fileFolder+this.fileName);
    }

};

Animation.prototype.startPlay = function() {
    //console.log("startPlay:");
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
    //setTimeout(testPlay,100);//!!!!!id
}


Animation.prototype.channelEnable=function(num,onoff){
    for(var i=0;i<this.channels.length;i++){
        if(this.channels[i].i==num) {
            //console.log(" channel ",i," m:",num," ",onoff);
            this.channels[i].play = onoff;
        }
    }
}

Animation.prototype.getPercent = function() {
    return (this.datas.length-this.keyIndex)*100/this.datas.length;
}

/**
 * returns % progress
 */
Animation.prototype.playKey = function() {
    if((this.playing==false)||(this.datas==null))
        return 0;

    var ik = this.keyIndex;
    this.keyIndex+=this.keySize;

    //console.log("playkey:",ik," ",this.channels[0].play);

    if(this.keyIndex<this.datas.length){
        for(var c=0;c<this.nbChannels;c++){
            if(this.channels[c].play) {
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
Animation.prototype.stopPlay = function() {
    this.playing  = false;
    dxlManager.stopAnim(this.id);
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
    
}


