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



SensorManager.prototype.loadSensorSettings = function() {
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

        // copy old versions to see if some motor mappings had been erased
        var oldSensors = JSON.parse(JSON.stringify(this.sensors))

        // empty current sensors array
        for (var i = this.sensors.length-1; i >= 0; i--) {
            this.sensors.splice(i, 1);
        }

        // create new sensors from the json file
        for(var i=0;i<s.sensors.length;i++){
            this.sensors.push( new Sensor() );
        }

        for (var i = 0; i < s.sensors.length; i++) {
            this.sensors[i].copySettings(s.sensors[i]);
        }

        // Check whether some sensors had been erased
        // ...

        settingsManager.copyPasteFromUserFolder("sensors.json");
        this.updateGUI();
    }

}


SensorManager.prototype.updateGUI = function () {

    //TODO: update the sensors panel in the GUI
    for(var i=0; i < this.sensors.length; i++){
        misGUI.addSensor(this.sensors[i].s,i);
    }

    // test ...
    misGUI.setSensorValue(0,66);
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