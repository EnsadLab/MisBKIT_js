/**
* Created by Cecile on 24/07/17.
*/

MotorMappingManager = function () {

    this.motorMappings = new Array();
    this.configurationFolder = "";

};

MotorMappingManager.prototype.loadMappingSettings = function () {
    var json;
    try{
        json = fs.readFileSync(__dirname + "/motorMapping.json", 'utf8');
    }catch(err){
        if (err.code === 'ENOENT') {
            console.log("File " + __dirname + "/motorMapping.json not found!");
        }else{
            console.log("Problem loading motorMaping.json file");
        }
    }
    if (json) {
        
        var s = JSON.parse(json);
        //console.log("PARSING motorMapping.json");
        for(var i=0;i<s.motorMappings.length;i++){
            this.motorMappings.push( new MotorMapping() );
        }

        for (var i = 0; i < s.motorMappings.length; i++) {
            this.motorMappings[i].copySettings(s.motorMappings[i]);
            //console.log(s.motorMappings[i]);
            //console.log(this.motorMappings[i]);
        }
        this.updateGUI();
    }
}


// Method called when user has modified the motorMapping.json file
MotorMappingManager.prototype.loadUserMappingSettings = function () {
    var json;
    try{
        json = fs.readFileSync(this.configurationFolder + "/motorMapping.json", 'utf8');
    }catch(err){
        if (err.code === 'ENOENT') {
            console.log("File " + this.configurationFolder+ "/motorMapping.json not found!");
        }else{
            console.log("Problem loading motorMaping.json file");
        }
    }
    if (json) {
        
        var s = JSON.parse(json);

        //TODO: check if it works
        for (var i = this.motorMappings.length-1; i >= 0; i--) {
           // if (this.motorMappings.[i].id == X) {
                this.motorMappings.splice(i, 1);
                break;
           // }
        }
        console.log("TAB EMPTY " + motorMappings.length);
        //console.log("PARSING motorMapping.json");
        for(var i=0;i<s.motorMappings.length;i++){
            this.motorMappings.push( new MotorMapping() );
        }

        for (var i = 0; i < s.motorMappings.length; i++) {
            this.motorMappings[i].copySettings(s.motorMappings[i]);

            //TODO: update the CC in the GUI!!

            //console.log(s.motorMappings[i]);
            //console.log(this.motorMappings[i]);
        }
        settingsManager.copyPasteFromUserFolder("/motorMapping.json");
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
            this.motorMappings[i].m.type == type &&
            this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.nbID == nbID)
        {
            return true;
        }
    }
    return false;
};

MotorMappingManager.prototype.getMotorID = function(type,port,cmd,nbID){
    var motorIDs = new Array();
    for(var i=0; i<this.motorMappings.length; i++){
        if( this.motorMappings[i].m.enabled && 
            this.motorMappings[i].m.type == type &&
            this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.nbID == nbID)
        {
            motorIDs.push(this.motorMappings[i].m.motorID);
        }
    }
    return motorIDs;
};

//TODO: test this function when we have the CC mapping input in the GUI
MotorMappingManager.prototype.setMotorMapping = function(type,port,cmd,motorID,nbID){
    var found = false;
    for(var i=0; i<this.motorMappings.length; i++){
        if( this.motorMappings[i].m.type == type &&
            this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.cmd == cmd &&
            this.motorMappings[i].m.motorID == motorID)
        {
            this.motorMappings[i].m.nbID = nbID;
            //TODO: change CC in GUI
            found = true;
        }
    }
    if(!found){
        var motorMapping = new MotorMapping();
        motorMapping.m.enabled = true;
        motorMapping.m.type = type;
        motorMapping.m.port = port;
        motorMapping.m.cmd = cmd;
        motorMapping.m.motorID = motorID;
        motorMapping.m.nbID = nbID;
        this.motorMappings.push(motorMapping);
        //TODO: change CC in GUI
    }

    // save changes into the file
    saveMappingSettings();

};


MotorMappingManager.prototype.updateGUI = function () {

    //TODO: update the CC in the GUI
}


//TODO: test this function when we have the CC mapping input in the GUI
MotorMappingManager.prototype.saveMappingSettings = function () {
        
        var s = {}; //settings
        s.motorMappings = [];

        var nbm = this.motorMappings.length;
        for (var i = 0; i < nbm; i++) {
            s.motorMappings.push(this.motorMappings[i].getSettings());
        }

        var json = JSON.stringify(s, null, 2);
        fs.writeFileSync(__dirname + "/motorMapping.json", json);
        settingsManager.copyPasteToUserFolder("/motorMapping.json");
        //console.log(json);
};

// Simulates the reloading of the motorMapping.json file
MotorMappingManager.prototype.onMetaKey=function(char){
    console.log("METAKEY",+char);
    if(char=='r'){ // reset the gui according to the changed elements in the json
        console.log("Resetting motor mapping into GUI");
        this.loadUserMappingSettings();
    }
}