/**
* Created by Cecile on 27/07/17.
*/

SensorManager = function () {

    this.sensors = new Array();
    this.configurationFolder = "";

};

SensorManager.prototype.folderIsReady = function(configurationFolder){
    this.configurationFolder = configurationFolder;
    this.loadSensorSettings();
}

SensorManager.prototype.loadSensorSettings = function () {
    console.log("!------loadSensorSettings");
    var json;
    try{
        json = fs.readFileSync(__dirname + "/sensors.json", 'utf8');
    }catch(err){
        if (err.code === 'ENOENT') {
            console.log("File " + __dirname + "/sensors.json not found!");
        }else{
            console.log("Problem loading sensors.json file");
        }
    }
    if (json) {
        
        var s = JSON.parse(json);
        console.log("PARSING sensorMapping.json");
        for(var i=0;i<s.sensors.length;i++){
            this.sensors.push( new Sensor() );
        }

        for (var i = 0; i < s.sensors.length; i++) {
            this.sensors[i].copySettings(s.sensors[i]);
            console.log("!------sensors[i].copySettings");
            this.sensors[i].init(); //DB
            //console.log(s.sensors[i]);
            //console.log(this.sensors[i]);
        }

        this.updateGUI();

        robusManager.connect(); //DB

    }

}

// Method called when user has modified the sensors.json file
SettingsManager.prototype.loadUserSensorsSettings = function () {
    console.log("!------loadUserSensorSettings");
    var json;
    try{
        json = fs.readFileSync(this.configurationFolder + "sensors.json", 'utf8');
    }catch(err){
        if (err.code === 'ENOENT') {
            console.log("File " + this.configurationFolder+ "sensors.json not found!");
        }else{
            console.log("Problem loading sensors.json file");
        }
    }
    if (json) {
        
        var s = JSON.parse(json);
        
        //TODO: check if it works
        for (var i = this.sensors.length-1; i >= 0; i--) {
           // if (this.motorMappings.[i].id == X) {
                this.sensors.splice(i, 1);
                break;
           // }
        }
        console.log("TAB EMPTY " + sensors.length);
        //console.log("PARSING motorMapping.json");
        for(var i=0;i<s.sensors.length;i++){
            this.sensors.push( new Sensor() );
        }

        for (var i = 0; i < s.sensors.length; i++) {
            this.sensors[i].copySettings(s.sensors[i]);
            
            //TODO: update the CC in the GUI!!

            //console.log(s.sensors[i]);
            //console.log(this.sensors[i]);
        }
        settingsManager.copyPasteFromUserFolder("sensors.json");
        this.updateGUI();
    }

}


SensorManager.prototype.updateGUI = function () {

    //TODO: update the sensors panel in the GUI
}

//TODO: test this function when we have the sensor panel in the GUI
SensorManager.prototype.saveMappingSettings = function () {
        
        var s = {}; //settings
        s.sensors = [];

        var nbm = this.sensors.length;
        for (var i = 0; i < nbm; i++) {
            s.sensors.push(this.sensors[i].getSettings());
        }

        var json = JSON.stringify(s, null, 2);
        fs.writeFileSync(__dirname + "/sensors.json", json);
        settingsManager.copyPasteToUserFolder("sensors.json");
        //console.log(json);
};


// Simulates the reloading of the sensors.json file
SensorManager.prototype.onMetaKey=function(char){
    console.log("METAKEY",+char);
    if(char=='m'){ // reset the gui according to the changed elements in the json
        console.log("Resetting sensor settings into GUI");
        this.loadUserSensorsSettings();
    }
}