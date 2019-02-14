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
        this.loading = false;

        /// fake values..... fakeManager didnt work
        this.ctrlMotorStopAll = -111;
        this.ctrlAnimStopAll = -111;
        this.ctrlSensorStopAll = -111;
        this.ctrlScriptStopAll = -111;
        this.ctrlModalAnim = -111;
    }

    // attention avec les loadSettings.. et l'animation ID qui s'incrémente côté dynamixel..
    init() {
        this.ctrlStopAll = 0;
        console.log("--> init AnimManager");
        // hide examples anims
        $("#sortable-anim").find("[eltID='example']").hide();
        misGUI.initManagerFunctions(this,this.className);
    }

    cmd(func,eltID,val,param) {
        console.log("AnimManagerCmd:",func,eltID,val,param);
        if(this[func]){
            if(eltID!=undefined)this[func](eltID,val,param);
            else this[func](val,param);
        }
    }

    addAnim(selectedType) {

        //if(this.animFolder.length>0) //TODO cec: should we check this? 
        console.log("--> add anim");

        // we'll create the name when starting recording for type record!
        var name = "";

        if(selectedType != "record") {
            var date = new Date(Date.now());
            var y = date.getFullYear();
            var m = ("00"+(date.getUTCMonth()+1)).slice(-2);
            var d = ("00"+date.getUTCDate()).slice(-2);
            var h = ("00"+date.getHours()).slice(-2);
            var mn = ("00"+date.getMinutes()).slice(-2);
            var s  = ("00"+date.getSeconds()).slice(-2);
            name = y+"-"+m+"-"+d+"-"+h+"h"+mn+"-"+s;
        }

        var id = "A"+this.animationID;
        console.log("ADDING NEW ANIMATION WITH ID",id);
        var anim = new Animation("A"+this.animationID,this.animFolder,name);
        anim.s.type = selectedType;
        anim.recordchannels = [];
        if(selectedType != "record") anim.channels = [];
        for(var m = 0; m < dxlManager.motors.length; m++){
            var mode = dxlManager.motors[m].m.mode;
            console.log("create recordchannel",m,mode);
            if(selectedType == "record"){
                if(mode==0)anim.recordchannels.push({record:false,i:m,f:"angle"});
                else anim.recordchannels.push({record:false,i:m,f:"speed"}); // could be either 1(mode speed) or -1...
            } else {
                if(mode==0)anim.channels.push({play:false,i:m,f:"angle"});
                else anim.channels.push({play:false,i:m,f:"speed"}); // could be either 1(mode speed) or -1...
            
            }
        }
        this.animations[id] = anim; 
        this.animationID++;

        misGUI.cloneElement("#anim-" + selectedType,id,"example","#anim-record");
        console.log("anim.channels.length",anim.channels.length);

        if(selectedType == "record"){
            MisGUI_anims.setRecordTracks(id,anim.recordchannels);
            MisGUI_anims.setRecordingDot(anim.recordchannels);
            MisGUI_anims.disableStartRec(id,true);
        } else {
            MisGUI_anims.setPlayingTracks(id,anim.channels);
            MisGUI_anims.setAnimName(id,anim.fileName);

            // I didn't want to explicit every parameter in the settings of the animation... 
            // more generic this way for future generators
            var params = {};
            if(selectedType == "sinus") anim.s.nbparams = 3; // fake nb param values for now......
            else if(selectedType == "random") anim.s.nbparams = 4;
            else anim.s.nbparams = 0;
            for(var i=0; i<anim.s.nbparams; i++){
                var k = "param" + i;
                if(selectedType == "sinus"){ if(i==0) params[k]=0;else if(i==1)params[k]=1.0;else if(i==2)params[k]=100.0; }
                else if(selectedType == "random"){ if(i==0) params[k]=0;else if(i==1)params[k]=3.0;else if(i==2)params[k]=100.0; else if(i==3)params[k]=5.0;}
                else {
                    params[k] = i*10; // fake values for an unknown type
                }
                
            }
            
            //console.log("params:",params);
            anim.s.params = params;

            misGUI.showParams({
                class: this.className,
                func: "changeParam",
                id: id,
                val: params, 
            });

            // update the animations list in the sensor animation trigger output
            MisGUI_sensors.setSensorAnims();
        
        }

        // we save the animation generators default values
        if(selectedType != "record") anim.save();

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
            // check the number of chanels that needs recording
            if(anim.getRecordChannelsOn() > 0){
                MisGUI_anims.disableStartRec(eltID,false);
            } else {
                MisGUI_anims.disableStartRec(eltID,true);
            }
            MisGUI_anims.setRecordingDot(anim.recordchannels);
        }
       
    }

    // called from the dxlManager.. not the best name for sinus and so on, but I don't want to change dxlmanager
    setTrackForRecord(index,mode) {
        for(var k in this.animations){
            var anim = this.animations[k];
            if(anim) {
                //console.log("anim id",anim.id,"index",index,"mode",mode);
                if(anim.s.type == "record") {
                    if(index >= 0 && index < anim.recordchannels.length) {// should not happen since recordChannels has same lenght as motors
                        if(mode==0) anim.recordchannels[index].f = "angle";
                        else anim.recordchannels[index].f = "speed";
                        MisGUI_anims.setRecordTracks(anim.id,anim.recordchannels);
                        MisGUI_anims.setRecordingDot(anim.recordchannels);
                    }
                } else {
                    if(mode==0) anim.channels[index].f = "angle";
                    else anim.channels[index].f = "speed";
                    MisGUI_anims.setPlayingTracks(anim.id,anim.channels);
                }
                
            }
        }
    }

    selectTrackForPlay(eltID,val,param) {
        console.log("AnimManager::selectTrackForPlay", eltID,val,param);
        this.animChannel(eltID,param,val);
    }

    changeParam(eltID,val,param){
        console.log("AnimManager::changeParam", eltID,val,param);
        var anim=this.animations[eltID];
        if(anim){
            //var paramIndex = parseInt(param.substring("param".length));
            anim.s.params[param] = parseFloat(val);
            console.log("params",anim.s.params);
            anim.save();
        }
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
                MisGUI_anims.startRec(eltID,anim.recordchannels);
            }
        }
    }

    loadSettings(anims) {
        console.log("AnimManager::loadSettings");
        for (var i = 0; i < anims.length; i++) {
            var id = this.animationID++;
            var anim = new Animation("A" + id, this.animFolder, anims[i].name);
            anim.s.keyCode = anims[i].key;
            //console.log("animkey:",anim.keycode);
            anim.load(anims[i].name,true);
        }
    }

    // not used.. done directly in dxlManager
    saveSettings() {
        console.log("AnimManager::saveSettings");
    }

    start(name){ //<-script
        console.log("starting anim from SCRIPT",name,this.animations.length);
        //for(var i=0; i<this.animations.length;i++){
        for (var i in this.animations){
            //console.log("anim name",this.animations[i].fileName);
            if(this.animations[i].fileName == name){
                this.startAnim(this.animations[i].id);
            }
        }        
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

    loop(name,onoff){ //<-script
        //for(var i=0; i<this.animations.length;i++){
        for (var i in this.animations){
            if(this.animations[i].fileName == name){
                this.loopAnim(this.animations[i].id,onoff);
            }
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

    stop(name){ //<-script
        //for(var i=0; i<this.animations.length;i++){
        for (var i in this.animations){
            if(this.animations[i].fileName == name){
                this.stopAnim(this.animations[i].id);
            }
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
            else { //NO MOTOR TO REC.. should not happen anymore since button is disabled now
                anim.recordingGUI = false;
            }
        }
        else{ //open dialogBox ... select anim folder.. should actually not happen.
            anim.recordingGUI = false;
        }
    }

    stopRec(anim) {
        console.log("AnimManager::stopRec");
        anim.recordingGUI = false;
        anim.stopRec();
    }

    resetLoadDialog(){
        this.loading = false;
    }

    uiLoad(){ //Becoz folder
        console.log("AnimManager::uiLoad",this.loading,this.animFolder);
        if(!this.loading){ //prevent multiclicks 
            this.loading = true
            misGUI.openLoadDialog("Load animation:",this.animFolder,this.loadAnim.bind(this),this)
        }
    }
    

    loadAnim(fullPath) {
        console.log("AnimManager::loadAnim");
        console.log("LOADANIM()---------",this.animationID);
        this.loading = false;
        var name  = fullPath;
        var slash = fullPath.lastIndexOf('/')+1;
        if(slash>1){
            this.animFolder = fullPath.substr(0,slash);
            name = fullPath.substr(slash);
        }
        //if(!this.isAnimAlreadLoaded(name)){
            var id = "A"+this.animationID;
            this.animationID++;
            console.log("loadAnim:",this.animFolder," ",name);
            var anim = new Animation(id,this.animFolder,name);
            anim.load(name,true);
        /*} else {
            alert("Animation " + name + " already loaded");
        }*/
    }

    isAnimAlreadLoaded(name) {
        if(name.endsWith(".json")){
            name = name.substring(0,name.length-5);
        }
        for (var k in this.animations) {
            //console.log("TEST",this.animations[k].fileName ,name);
            if(this.animations[k].fileName == name){
                return true;
            }
        }
        return false;
    }

    saveAnim() {
        console.log("AnimManager::saveAnim");
    }

    animLoaded(anim) {
        //this.animations.push({id:this.animationID,a:anim});
        var id = anim.id;
        console.log("ANIMLOADED---------(",id,")",this.animationID);
        this.animations[id]=anim;
        misGUI.cloneElement("#anim-" + anim.s.type,id,"example","#anim-record");
        MisGUI_anims.stopRec(id);
        // update the animations list in the sensor animation trigger output
        MisGUI_sensors.setSensorAnims();
        //MisGUI_anims.setRecordTracks(id,anim.recordchannels);
        //misGUI.addAnim(id,anim.fileName,anim.s.keyCode);
        //misGUI.animTracks(id,anim.channels);
        //this.recAnim = null; //TOTHINK ???
    }

    renameAnim(eltID,val) {
        console.log("AnimManager::renameAnim",eltID,val);
        
        var anim=this.animations[eltID];
        if(anim){
            //if(!this.isAnimAlreadLoaded(val)){
                //console.log(" oldname:",anim.fileName);
                anim.save(val);
                // update the animations list in the sensor animation trigger output
                MisGUI_sensors.setSensorAnims();
            /*} else {
                MisGUI_anims.setAnimName(anim.id,anim.fileName);
                alert("Animation " + val + " already loaded");
            }*/
        }

    }

    // ok.. not so intuitive...
    // faudrait faire autrement maintenant que c'est une croix.. bref, je laisse comme ça pour l'instant
    closeAnim(eltID) {
        console.log("AnimManager::closeAnim",eltID);
        MisGUI_anims.removeAnimation(eltID);
    }

    removeAnim(eltID) {
        console.log("AnimManager::removeAnim",eltID);
        var anim = this.animations[eltID];
        if(anim) {
            console.log("remove",eltID," ",anim.fileName);
            anim.discard();
            delete this.animPlaying[eltID];
            delete this.animations[eltID];
            // update the animations list in the sensor animation trigger output
            MisGUI_sensors.setSensorAnims();
        }
    }

    // To be moved from DxlManager...
    getAnimId(){}

    animChannel(id,num,onoff) {
        var anim=this.animations[id];
        if(anim){
            console.log("animChannel anim",id,num,onoff);
            console.log("with eltID",anim.id);
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
            else if(typeof(keyCode)=='number') //becoz autotype
                keyCode = ""+keyCode; //ascii 48 ='0' 

            keyCode = keyCode.replace(/\u0000/g,'');
            keyCode = keyCode.replace(/ /g,'');

            console.log("setkeycode:",keyCode.length,keyCode);

            if(anim.s.keyCode != keyCode){
                anim.s.keyCode = keyCode;
                console.log("---------> setting keycode",anim.s.keyCode,"and",keyCode);
                //console.log("setkeycode: len:",anim.s.keyCode.length);
                //console.log("setkeycode: charcode0:",anim.s.keyCode.charCodeAt(0));
                //console.log("setkeycode: charcode1:",anim.s.keyCode.charCodeAt(1));
                anim.save();
            }

        }
    }

    onKeyCode(keyCode) {
        console.log("KEYCODE:",keyCode);

        for (var k in this.animations) {
            console.log("animK:",k,this.animations[k].s.keyCode);
            if (this.animations[k].s.keyCode.indexOf(keyCode) >= 0) {
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
