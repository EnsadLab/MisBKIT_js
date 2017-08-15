/**
* Created by Cecile on 27/07/17.
*/


SensorManager = function () {

    //this.sensors = new Array();
    this.sensors = {};
    this.configurationFolder = "";
    this.sensorID = 0;
};

SensorManager.prototype.folderIsReady = function(configurationFolder){
    this.configurationFolder = configurationFolder;
    this.loadSensorSettings();
}


// Method called when user has modified the sensors.json file
SensorManager.prototype.loadSensorSettings = function () {
    console.log("!------loadUserSensorSettings");
    robusManager.reset(); //DB important: remove allcallbacks

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

        // copy old versions to see if some sensors had been erased
        var oldSensors = JSON.parse(JSON.stringify(this.sensors))

        // empty current sensors array
        /*
        for (var i = this.sensors.length-1; i >= 0; i--) {
            this.sensors.splice(i, 1);
        }
        */
        this.sensors = {};

        // create new sensors from the json file
        this.sensorID = 0;
        for(var i=0;i<s.sensors.length;i++){
            //this.sensors.push( new Sensor() );
            var id = "S"+this.sensorID++; 
            this.sensors[id]= new Sensor(); //TODO? new Sensor(id) 
            this.sensors[id].ID = id;
            this.sensors[id].copySettings(s.sensors[i]);
        }

        /*
        for (var i = 0; i < s.sensors.length; i++) {
            this.sensors[i].copySettings(s.sensors[i]);
        }
        */

        // Check whether some sensors had been erased
        // ...

        settingsManager.copyPasteFromUserFolder("sensors.json");
        this.updateGUI();
        robusManager.connect(); //DB
    }

}


SensorManager.prototype.updateGUI = function () {

    //TODO: update the sensors panel in the GUI
    /*
    for(var i=0; i < this.sensors.length; i++){
        misGUI.addSensor(this.sensors[i].s,i);
    }
    */
    $.each(this.sensors, function(i,sensor) {
        misGUI.addSensor(sensor.s,sensor.ID);        
    });    


    // test ...
    misGUI.setSensorValue("S0",66);
}

SensorManager.prototype.setSensorValue = function(sensorPin, sensorValue){
    var sensor = this.getSensorWithPin(sensorPin);
    
    // TODO: change value in GUI, which will automatically call then handleSensorValue...
    // misGUI.setSensorValue(...);

    // For now... we just call directly handleSensorValue to test the function
    this.handleSensorValue(sensor.ID,sensorValue);

}

// called from the GUI when the sensor value has been changed
SensorManager.prototype.handleSensorValue = function(sensorId, sensorValue){
    //var sensor = this.getSensorWithID(sensorId); // hmmm.. or just use the pin to identify...
    var sensor = this.sensors[sensorID];
    if(sensorValue >= sensor.s.valMin && sensorValue < (sensor.s.threshold-sensor.s.tolerance)){ 
        sensor.area = 0;
        if(sensor.oldArea != sensor.area){
            // trigger animation 1
            this.startAnim(sensor.s.anim1, sensor.s.anim2);
        }
    }else if(sensorValue >= (sensor.s.threshold + sensor.s.tolerance) && sensorValue < sensor.s.valMax){
        sensor.area = 1;
        if(sensor.oldAra != sensor.area){
            // trigger animation 2
            this.startAnim(sensor.s.anim2, sensor.s.anim1);
        }
    }
    sensor.oldArea = sensor.area;
}

SensorManager.prototype.startAnim = function(animPlaying, animStopping){

    // start playing animations
    var animIDs = dxlManager.getAnimID(animPlaying);
    for(var i=0; i<animIDs.length; i++){ 
        var divAnim = misGUI.divAnim(animIDs[i]);
        divAnim.find(".play").click();
    }

    // stop other animations
    animIDs = dxlManager.getAnimID(animStopping);
    for(var i=0; i<animIDs.length; i++){ 
        var divAnim = misGUI.divAnim(animIDs[i]);
        divAnim.find(".stop").click();
    }

}

SensorManager.prototype.getSensorWithPin = function(sensorPin){
    /*
    for(var i=0; i<this.sensors.length; i++){
        if(this.sensors[i].s.pin == sensorPin){
            return this.sensors[i];
        }
    }
    */
    $.each(this.sensors, function(i,sensor) {
        if( sensor.s.pin == sensorPin){
            return sensor;
        }
    });    
    return undefined;
}

/*
SensorManager.prototype.getSensorWithID = function(sensorID){
    for(var i=0; i<this.sensors.length; i++){
        if(this.sensors[i].ID == sensorID){
            return this.sensors[i];
        }
    }
}
*/

//TODO: test this function when we have the sensor panel in the GUI
SensorManager.prototype.saveSensorSettings = function () {
        
        var s = {}; //settings
        s.sensors = [];

        /*
        var nbm = this.sensors.length;
        for (var i = 0; i < nbm; i++) {
            s.sensors.push(this.sensors[i].getSettings());
        }
        */
        $.each(this.sensors, function(i,sensor) {
            s.sensors.push(sensor[i].getSettings());
        });    
    
        var json = JSON.stringify(s, null, 2);
        fs.writeFileSync(__dirname + "/sensors.json", json);
        settingsManager.copyPasteToUserFolder("sensors.json");
        //console.log(json);
};


// Simulates the reloading of the sensors.json file
SensorManager.prototype.onMetaKey = function(char){
    console.log("METAKEY",+char);
    if(char=='m'){ // reset the gui according to the changed elements in the json
        console.log("Resetting sensor settings into GUI");
        this.loadUserSensorsSettings();
    }
}
