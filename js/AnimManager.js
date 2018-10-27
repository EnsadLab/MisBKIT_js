var Animation = require("./Animations.js");


class AnimManager {
    constructor() {
        //this.name = "AnimManager"; //Didier? unifié ac les autres, non? 
        this.className = "animManager";
        this.animationID = 0;
        //this.recording  = false; // removed.. because we could have multiple anims recording at the same time now.
        this.recStep    = 0;
        this.recAnim    = null;    
        this.animations = [];
        this.animFolder  = "";
        this.animPlaying = [];
        this.animationFolder = "";

    }

    // attention avec les loadSettings.. et l'animation ID qui s'incrémente côté dynamixel..
    init() {
        console.log("--> init AnimManager");
        // hide examples anims
        $("#sortable-anim").find("[eltID='example']").hide();
        misGUI.initManagerFunctions(this,this.className);
    }

    cmd(func,eltID,val,param) {
        console.log("SensorCmd:",func,eltID,val,param);
        if(this[func]){
            if(eltID!=undefined)this[func](eltID,val,param);
            else this[func](val,param);
        }
    }

    addAnim(selectedType) {

        //if(this.animFolder.length>0) //TODO cec: should we check this? 
        console.log("--> add anim");

        // we'll create the name when starting recording!
        var name = "";

        var id = "A"+this.animationID;
        var anim = new Animation("A"+this.animationID,this.animFolder,name);
        anim.recordchannels = [];
        for(var m = 0; m < dxlManager.motors.length; m++){
            var mode = dxlManager.motors[m].m.mode;
            console.log("create recordchannel",m,mode);
            if(mode==0)anim.recordchannels.push({record:false,i:m,f:"angle"});
            else anim.recordchannels.push({record:false,i:m,f:"speed"}); // could be either 1(mode speed) or -1...
        }
        this.animations[id] = anim; 
        this.animationID++;

        misGUI.cloneElement("#anim-" + selectedType,id);
        MisGUI_anims.setRecordTracks(id,anim.recordchannels);

    }

    update() {
        for(var k in this.animPlaying){
            var p = this.animations[k].playKey();
            MisGUI_anims.animProgress(k,100-p);
        }   
        for(var i in this.animations){
            var anim = this.animations[i];
            if(anim.recordingGUI){
                anim.recKey();
            }
        } 
    }

    selectTrackForRecord(eltID,val,param) {
        console.log("selectTrackForRecord",eltID,val,param);
        var anim=this.animations[eltID];
        if(anim){
            anim.setRecordChannel(param,val);
        }
    }

    // called from the dxlManager
    setTrackForRecord(index,mode) {
        for(var k in this.animations){
            var anim = this.animations[k];
            if(anim) {
                console.log("recchannels BEFORE",anim.recordchannels);
                console.log("anim id",anim.id,"index",index,"mode",mode);
                
                if(index >= 0 && index < anim.recordchannels.length) {// should not happen since recordChannels has same lenght as motors
                    if(mode==0) anim.recordchannels[index].f = "angle";
                    else anim.recordchannels[index].f = "speed";
                    console.log("recchannels AFTER",anim.recordchannels);
                    MisGUI_anims.setRecordTracks(anim.id,anim.recordchannels);
                }
                
            }
        }
    }

    selectTrackForPlay(eltID,val,param) {
        console.log("selectTrackForPlay", eltID,val,param);
        this.animChannel(eltID,param,val);
    }

    onRecord(eltID,val) {
        console.log("AnimManager::onRecord",eltID,val);
        var anim=this.animations[eltID];
        if(anim){
            if(anim.recordingGUI){
                this.stopRec(anim);
                MisGUI_anims.stopRec(eltID);
            } else {
                this.startRec(anim);
                MisGUI_anims.startRec(eltID);
            }
        }
    }

    loadSettings(anims) {
        console.log("AnimManager::loadSettings");
        for (var i = 0; i < anims.length; i++) {
            var id = this.animationID++;
            var anim = new Animation("A" + id, this.animFolder, anims[i].name);
            anim.keyCode = anims[i].key;
            console.log("animkey:",anim.keycode);
            anim.load(anims[i].name,true);
        }
    }

    saveSettings() {
        console.log("AnimManager::saveSettings");
    }

    startAnim(eltID) {
        console.log("AnimManager::startAnim",eltID);
        var anim = this.animations[eltID];
        if(anim){
            anim.startPlay();
            this.animPlaying[eltID]=anim; //ok not twice
            MisGUI_anims.playAnim(eltID); // pas top de l'avoir là, non???
        }
    }

    loopAnim(eltID,onoff) { //set anim.loop true/false //?loop count?
        console.log("AnimManager::loopAnim",eltID);
        var anim = this.animations[eltID];
        if(anim){
            anim.loop = onoff;
            MisGUI_anims.loopAnim(eltID,onoff);
        }
    }

    stopAnim(eltID) {
        console.log("AnimManager::stopAnim",eltID);
        var anim = this.animPlaying[eltID];
        if(anim) {
            delete this.animPlaying[eltID];
            anim.stopPlay();
            MisGUI_anims.animCheck(eltID,0);
        }
    }

    stopAll(){
        console.log("AnimManager::stopAll");
        
        for (var k in this.animPlaying) {
            this.animations[k].stopPlay();
            MisGUI_anims.animCheck(k, 0);
        }
        for (var k in this.animPlaying) {
            delete this.animPlaying[k];
        }
    }

    startRec(anim) {
        console.log("AnimManager::startRec");
        if(this.animFolder.length>0){
            if(anim.getRecordChannelsOn() > 0 && anim.recordchannels.length > 0) {
                anim.startRec();
                anim.recordingGUI = true;
            }
            else { //NO MOTOR TO REC
                //misGUI.recOff();
                // TODO: put the startRecording to StopRecording!!!!
                console.log("in here c");
                resetRecording(anim.id);
                anim.recordingGUI = false;
            }
        }
        else{ //open dialogBox ... select anim folder.. should actually not happen.
            // misGUI.recOff();
            // TODO: put the startRecording to StopRecording!!!!
            resetRecording(anim.id);
            anim.recordingGUI = false;
        }
    }

    stopRec(anim) {
        console.log("AnimManager::stopRec");
        anim.recordingGUI = false;
        anim.stopRec();
    }
    

    loadAnim(fullPath) {
        console.log("AnimManager::loadAnim");
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
        anim.load(name,true);
    }

    saveAnim() {
        console.log("AnimManager::saveAnim");
    }

    animLoaded(anim) {
        //this.animations.push({id:this.animationID,a:anim});
        var id = anim.id;
        console.log("ANIMLOADED---------(",id,")",this.animationID);
        this.animations[id]=anim;
        var selectedType = "record";
        misGUI.cloneElement("#anim-" + selectedType,id);
        MisGUI_anims.stopRec(id);
        //MisGUI_anims.setRecordTracks(id,anim.recordchannels);
        //misGUI.addAnim(id,anim.fileName,anim.keyCode);
        //misGUI.animTracks(id,anim.channels);
        //this.recAnim = null; //TOTHINK ???
    }

    renameAnim(eltID,val) {
        console.log("AnimManager::renameAnim",eltID,val);
        var anim=this.animations[eltID];
        if(anim){
            console.log(" oldname:",anim.fileName);
            anim.save(val);
        }
    }

    removeAnim(eltID) {
        console.log("AnimManager::removeAnim",eltID);
        var anim = this.animations[eltID];
        if(anim) {
            console.log("remove",eltID," ",anim.fileName);
            anim.discard();
            delete this.animPlaying[eltID];
            delete this.animations[eltID];
        }
    }

    // To be moved from DxlManager...
    getAnimId(){}

    animChannel(id,num,onoff) {
        var anim=this.animations[id];
        if(anim){
            console.log("animChannel anim true");
            anim.channelEnable(num,onoff);
        }
    }

    onKeyShortcut(eltID,val) {
        console.log("AnimManager::onKeyShortcut",eltID,val);
        this.setKeyCode(eltID,val,true);
    }

    /*
    // we made it readonly... easier
    onKeyShortcutRec(eltID,val) {
        console.log("AnimManager::onKeyShortcutRec",eltID,val);
        this.setKeyCode(eltID,val,false);
    }
    */

    setKeyCode(eltID,keyCode) {
        var anim = this.animations[eltID];
        if(anim){
            if( keyCode==undefined){
                keyCode = "";
            }
            keyCode = keyCode.replace(/\u0000/g,'');
            keyCode = keyCode.replace(/ /g,'');

            console.log("setkeycode:",keyCode.length,keyCode);

            if(anim.keyCode != keyCode){
                anim.keyCode = keyCode;
                console.log("---------> setting keycode",anim.keyCode,"and",keyCode);
                //console.log("setkeycode: len:",anim.keyCode.length);
                //console.log("setkeycode: charcode0:",anim.keyCode.charCodeAt(0));
                //console.log("setkeycode: charcode1:",anim.keyCode.charCodeAt(1));
                anim.save();
            }

        }
    }

    onKeyCode(keyCode) {
        console.log("KEYCODE:",keyCode);

        for (var k in this.animations) {
            console.log("animK:",k,this.animations[k].keyCode);
            if (this.animations[k].keyCode.indexOf(keyCode) >= 0) {
                this.startAnim(k);
                MisGUI_anims.animCheck(k, 1);
            }
        }
        
    }


    test() {
        console.log('hello AnimManager:',this.count);
        this.count++;
        return this.count;
    }
}
var animManager = new AnimManager();
module.exports = animManager;
