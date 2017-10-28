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
       // var oldMotorMappings = JSON.parse(JSON.stringify(this.motorMappings))

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
        /*for(var i=0; i < oldMotorMappings.length; i++){
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
        }*/
        //settingsManager.copyPasteFromUserFolder("midiMotorMapping.json"); // TODO: to check!

        // set to default value when entries are empty
        this.checkEmptyEntry(); 

        this.updateGUI();
    }

}

MotorMappingManager.prototype.checkEmptyEntry = function(){

    for(var i=0; i<this.motorMappings.length; i++){
        if(this.motorMappings[i].m.cmd.length < 1){
            this.motorMappings[i].m.cmd = "CC";
        }
        // cannot put nothing actually
        if(this.motorMappings[i].m.nbID == null){
            this.motorMappings[i].m.nbID = this.motorMappings[i].m.motorIndex;
        }
        if(midiPortManager.getNbMidiPortsOnGUI() == 1 && this.motorMappings[i].m.port.length < 1){
            this.motorMappings[i].m.port = midiPortManager.getFirstMidiPortOnGUI();
        }
    }

}
 
MotorMappingManager.prototype.isMapped = function(type,port,cmd,nbID){

    for(var i=0; i<this.motorMappings.length; i++){

        //console.log("enabled: " + this.motorMappings[i].m.enabled);
        //console.log(this.motorMappings[i].m.type + " = " + type);
        //console.log(this.motorMappings[i].m.port + " = " + port);
        //console.log(this.motorMappings[i].m.cmd + " = " + cmd);
        //console.log(this.motorMappings[i].m.nbID + " = " + nbID);

        if( //this.motorMappings[i].m.enabled &&
            //this.motorMappings[i].m.type == type &&
            this.motorMappings[i].m.port == port &&
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
            this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.nbID == nbID)
        {
            motorIDs.push(this.motorMappings[i].m.motorIndex);
        }
    }
    return motorIDs;
};

//called when the index entry has changed in the GUI
MotorMappingManager.prototype.setMidiMotorMappingIndex = function(motorIndex,nbID){
    var found = false;
    for(var i=0; i<this.motorMappings.length; i++){
        if(this.motorMappings[i].m.motorIndex == motorIndex)
        {
            this.motorMappings[i].m.nbID = nbID;
            found = true;
        }
    }
    if(!found) console.log("-> should not happen: motor index not found when mapping");
    // save changes into the file
    this.saveMappingSettings();
};


MotorMappingManager.prototype.setMidiMotorMappingCmd = function(motorIndex,cmd){
    var found = false;
    for(var i=0; i<this.motorMappings.length; i++){
        if(this.motorMappings[i].m.motorIndex == motorIndex)
        {
            this.motorMappings[i].m.cmd = cmd;
            found = true;
        }
    }
    if(!found) console.log("-> should not happen: motor index not found when mapping");
    // save changes into the file
    this.saveMappingSettings();
};

MotorMappingManager.prototype.setMidiMotorMappingPort = function(motorIndex,port){
    var found = false;
    for(var i=0; i<this.motorMappings.length; i++){
        if(this.motorMappings[i].m.motorIndex == motorIndex)
        {
            this.motorMappings[i].m.port = port;
            found = true;
        }
    }
    if(!found) console.log("-> should not happen: motor index not found when mapping");
    // save changes into the file
    this.saveMappingSettings();
};


MotorMappingManager.prototype.updateGUI = function () {
    
    for(var i=0; i<this.motorMappings.length; i++){
        //if(this.motorMappings[i].m.enabled)
        misGUI.midiMotorSettings(this.motorMappings[i].m,midiPortManager.midiPorts);
    }
}


//Called when gui has changed and saves data into the json file
MotorMappingManager.prototype.saveMappingSettings = function () {
        
        var s = {}; //settings
        s.motorMappings = [];

        var nbm = this.motorMappings.length;
        for (var i = 0; i < nbm; i++) {
            //if(this.motorMappings[i].m.nbID != null && !isNaN(this.motorMappings[i].m.nbID))
            s.motorMappings.push(this.motorMappings[i].getSettings());
        }

        var json = JSON.stringify(s, null, 2);
        //fs.writeFileSync(__dirname + "/midiMotorMapping.json", json);
        //settingsManager.copyPasteToUserFolder("midiMotorMapping.json");
        settingsManager.saveToConfigurationFolder("midiMotorMapping.json",json);
        //console.log(json);
};

// Simulates the reloading of the midiMotorMapping.json file
MotorMappingManager.prototype.onMetaKey=function(char){

}


MotorMappingManager.prototype.onKeyCode = function(keyCode){
    if(keyCode=='R'){ // reset the gui according to the changed elements in the json
        console.log("Resetting motor mapping into GUI");
        //this.loadMappingSettings();
        // Bug... the copyying file does not work.. why? because we call it from a key event?
        // for now, we do this... a bit weird I know but it works so.
        //this.saveMappingSettings();
    }
}

