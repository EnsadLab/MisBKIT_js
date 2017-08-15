/**
* Created by Cecile on 24/07/17.
*/

MotorMappingManager = function () {

    this.motorMappings = new Array();
    this.configurationFolder = "";

};

MotorMappingManager.prototype.folderIsReady = function(configurationFolder){
    this.configurationFolder = configurationFolder;
    this.loadMappingSettings();
}

MotorMappingManager.prototype.loadMappingSettings = function () {
    
    var json;
    
    try{
        json = fs.readFileSync(this.configurationFolder+ "midiMotorMapping.json", 'utf8');
    }catch(err){
        if (err.code === 'ENOENT') {
            console.log("File " + this.configurationFolder + "midiMotorMapping.json not found!");
        }else{
            console.log("Problem loading midiMotorMaping.json file");
        }
    }
    if (json) {
         
        var s = JSON.parse(json);
        //console.log(s);
        // copy old versions to see if some motor mappings had been erased
        var oldMotorMappings = JSON.parse(JSON.stringify(this.motorMappings))

        // empty current motorMappings array
        for (var i = this.motorMappings.length-1; i >= 0; i--) {
            this.motorMappings.splice(i, 1);
        }

        // create new motorMappings from json file
        for(var i=0;i<s.motorMappings.length;i++){
            this.motorMappings.push( new MotorMapping() );
        }

        for (var i = 0; i < s.motorMappings.length; i++) {
            this.motorMappings[i].copySettings(s.motorMappings[i]);
        }

        // check whether some motor mappings had been erased. If yes, udpate to gui to "?"
        for(var i=0; i < oldMotorMappings.length; i++){
            var found = false;
            for(var j=0; j<this.motorMappings.length; j++){
                if( this.motorMappings[j].m.cmd == "CC" && 
                    oldMotorMappings[i].m.motorIndex == this.motorMappings[j].m.motorIndex){
                    found = true;
                    break;
                }
            }
            if(!found){
                misGUI.setMappingNumberForMotor(oldMotorMappings[i].m.motorIndex, null);
            }
        }
        settingsManager.copyPasteFromUserFolder("midiMotorMapping.json"); // TODO: to check!
        this.updateGUI();
    }
}

 
MotorMappingManager.prototype.isMapped = function(type,port,cmd,nbID){

    for(var i=0; i<this.motorMappings.length; i++){

        //console.log("enabled: " + this.motorMappings[i].m.enabled);
        //console.log(this.motorMappings[i].m.type + " = " + type);
        //console.log(this.motorMappings[i].m.port + " = " + port);
        //console.log(this.motorMappings[i].m.cmd + " = " + cmd);
        //console.log(this.motorMappings[i].m.nbID + " = " + nbID);

        if( this.motorMappings[i].m.enabled &&
            //this.motorMappings[i].m.type == type &&
            //this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.nbID == nbID)
        {
            return true;
        }
    }
    return false;
};

MotorMappingManager.prototype.getMotorIndex = function(type,port,cmd,nbID){
    var motorIDs = new Array();
    for(var i=0; i<this.motorMappings.length; i++){
        if( this.motorMappings[i].m.enabled && 
            //this.motorMappings[i].m.type == type &&
            //this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.nbID == nbID)
        {
            motorIDs.push(this.motorMappings[i].m.motorIndex);
        }
    }
    return motorIDs;
};

//called when a CC entry has changed in the GUI
MotorMappingManager.prototype.setMidiMotorMapping = function(motorIndex,nbID,cmd){
    var found = false;
    for(var i=0; i<this.motorMappings.length; i++){
        if( // this.motorMappings[i].m.type == "midi" &&
           // this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.motorIndex == motorIndex)
        {
            this.motorMappings[i].m.nbID = nbID;
            found = true;
        }
    }
    if(!found){
        var motorMapping = new MotorMapping();
        motorMapping.m.enabled = true;
        //motorMapping.m.type = "midi";
        //motorMapping.m.port = "";
        motorMapping.m.cmd = "CC"; // when changed from the gui, we assume it is CC
        motorMapping.m.motorIndex = motorIndex;
        motorMapping.m.nbID = nbID;
        this.motorMappings.push(motorMapping);
    }

    // save changes into the file
    this.saveMappingSettings();
}

//TODO: not called yet, but might be useful in the future
MotorMappingManager.prototype.setMotorMapping = function(type,port,cmd,motorIndex,nbID){
    var found = false;
    for(var i=0; i<this.motorMappings.length; i++){
        if( this.motorMappings[i].m.type == type &&
            this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.motorIndex == motorIndex)
        {
            this.motorMappings[i].m.nbID = nbID;
            found = true;
        }
    }
    if(!found){
        var motorMapping = new MotorMapping();
        motorMapping.m.enabled = true;
        motorMapping.m.type = type;
        motorMapping.m.port = port;
        motorMapping.m.cmd = cmd;
        motorMapping.m.motorIndex = motorIndex;
        motorMapping.m.nbID = nbID;
        this.motorMappings.push(motorMapping);
    }

    // save changes into the file
    this.saveMappingSettings();

};


MotorMappingManager.prototype.updateGUI = function () {
    
    for(var i=0; i<this.motorMappings.length; i++){
        //console.log(this.motorMappings[i]);
        // for now, we only consider midi CC mapping in the gui
        if(/*this.motorMappings[i].m.type == "midi" &&*/ 
            this.motorMappings[i].m.cmd == "CC" && this.motorMappings[i].m.enabled){
                misGUI.setMappingNumberForMotor(this.motorMappings[i].m.motorIndex, this.motorMappings[i].m.nbID);
        }
    }
}


//Called when gui has changed and saves data into the json file
MotorMappingManager.prototype.saveMappingSettings = function () {
        
        var s = {}; //settings
        s.motorMappings = [];

        var nbm = this.motorMappings.length;
        for (var i = 0; i < nbm; i++) {
            if(this.motorMappings[i].m.nbID != null && !isNaN(this.motorMappings[i].m.nbID))
                s.motorMappings.push(this.motorMappings[i].getSettings());
        }

        var json = JSON.stringify(s, null, 2);
        fs.writeFileSync(__dirname + "/midiMotorMapping.json", json);
        settingsManager.copyPasteToUserFolder("midiMotorMapping.json");
        //console.log(json);
};

// Simulates the reloading of the midiMotorMapping.json file
MotorMappingManager.prototype.onMetaKey=function(char){
    /*console.log("METAKEY",+char);
    if(char=='r'){ // reset the gui according to the changed elements in the json
        console.log("Resetting motor mapping into GUI");
        this.loadMappingSettings();
        // Bug... the copyying file does not work.. why? because we call it from a key event?
        // for now, we do this... a bit weird I know but it works so.
        this.saveMappingSettings();
    }*/
}


MotorMappingManager.prototype.onKeyCode = function(keyCode){
    /*if(keyCode=='r'){ // reset the gui according to the changed elements in the json
        console.log("Resetting motor mapping into GUI");
        this.loadMappingSettings();
        // Bug... the copyying file does not work.. why? because we call it from a key event?
        // for now, we do this... a bit weird I know but it works so.
        this.saveMappingSettings();
    }*/
}

MotorMappingManager.prototype.onKeyCode = function(){
    console.log("Resetting motor mapping into GUI");
    this.loadMappingSettings();
    // Bug... the copyying file does not work.. why? because we call it from a key event?
    // for now, we do this... a bit weird I know but it works so.
    this.saveMappingSettings();
}