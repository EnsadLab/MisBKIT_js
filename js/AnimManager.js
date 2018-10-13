class AnimManager {
    constructor(){
        this.name = "AnimManager";
        this.animationID = 0;
        this.recIndices = [];
        this.recording  = false;
        this.recStep    = 0;
        this.recAnim    = null;    
        this.animations = [];
        this.animFolder  = "";
        this.animPlaying = [];
        this.animationFolder = "";

    }
    init(){}
    update(){
        for(var k in this.animPlaying){
            var p = this.animations[k].playKey();
            misGUI.animProgress(k,100-p);
        }    
    }
    loadSettings(){}
    saveSettings(){}
    stopAll(){}
    stopAnim(id){}
    startRec(){}
    stopRec(){}
    recKey(){}
    loadAnim(){}
    saveAnim(){}
    animLoaded(){}
    getAnimId(){}


    test() {
        console.log('hello AnimManager:',this.count);
        this.count++;
        return this.count;
    }
}
var animManager = new AnimManager();
module.exports = animManager;
