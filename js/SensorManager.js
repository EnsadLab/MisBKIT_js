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
    //cm9Com.removeAllCallbacks();    
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
        //this.sensors = {};
        this.removeAllSensors();

        //TODO: delete all gui sensor elements

        // create new sensors from the json file
        this.sensorID = 0;
        for(var i=0;i<s.sensors.length;i++){
            //this.sensors.push( new Sensor() );
            var id = "S"+this.sensorID++; 
            this.sensors[id]= new Sensor(); //TODO? new Sensor(id) 
            this.sensors[id].ID = id;
            this.sensors[id].copySettings(s.sensors[i]);
            //console.log("s... ",this.sensors[id].s);
            //console.log("s... ",this.sensors[id].s.cm9Pin);
        }

        //settingsManager.copyPasteFromUserFolder("sensors.json");
        this.updateGUI();
        robusManager.connect(); 


    }

}


SensorManager.prototype.updateGUI = function () {

    // update the sensors panel in the GUI
    $.each(this.sensors, function(i,sensor) {
        misGUI.addSensor(sensor.s,sensor.ID);       
    });    


    // test ...
    //misGUI.setSensorValue("S0",42);
    //misGUI.setSensorRange("S1",50,133,100);
    //misGUI.setSensorTolerance("S0",42);
    //console.log("getPin:",this.getSensorWithPin(7));
}

SensorManager.prototype.changeSetting = function(sensorID,name,value){
    //console.log("SensorManager.changeSetting:",sensorID,name,value);
    var sensor = this.sensors[sensorID];
    if(sensor){
        //tester if sensor.s[name] exists ???
        sensor.s[name]=value;
        switch(name){
                case "valMin":
                case "valMax":
                    //update min max tolerance threshold
                    if(sensor.s.threshold<sensor.s.valMin)sensor.s.threshold=sensor.s.valMin;
                    if(sensor.s.threshold>sensor.s.valMax)sensor.s.threshold=sensor.s.valMax;                    
                    misGUI.changeSensor(sensor.s,sensorID);                
                    break;
                default:            
        }
        //console.log("sensorSetting:",sensor.s);
    }    
}


// called from the GUI when the sensor value has been changed
SensorManager.prototype.handleSensorValue = function(sensorID, sensorValue){
    var sensor = this.sensors[sensorID];
    if(sensorValue >= sensor.s.valMin && sensorValue < (sensor.s.threshold-sensor.s.tolerance)){ 
        sensor.area = 0;
        //console.log("sensor area 0");
        if(sensor.oldArea != sensor.area){
            // trigger animation 1
            //console.log("Trigger left animation ",sensor.s.anim1);
            this.startAnim(sensor.s.anim1, sensor.s.anim2);
        }
    }else if(sensorValue >= (sensor.s.threshold + sensor.s.tolerance) && sensorValue < sensor.s.valMax){
        sensor.area = 1;
        //console.log("sensor area 1");
        if(sensor.oldArea != sensor.area){
            // trigger animation 2
            //console.log("Trigger left animation ",sensor.s.anim2);
            this.startAnim(sensor.s.anim2, sensor.s.anim1);
        }
    }

    sensor.oldArea = sensor.area;
}

//called by cm9Manager // array of sensor values, one loop.
SensorManager.prototype.handlePinValues=function(vals){
    var nbv = vals.length;
    $.each(this.sensors,function(i,sensor) {
        if( sensor.s.cm9Enabled ){
            var pin = +sensor.s.cm9Pin;
            if( (pin>=0)&&(pin<nbv) ){
                sensor.onValue(vals[pin]);
            }
        }
    });
}

//Motor position -> sensor.s.fromMotorIndex
SensorManager.prototype.handleDxlPos=function(index,val){
    console.log("handleDxlPos:",index,val);
    $.each(this.sensors,function(i,sensor) {
        //console.log("handleDxlPos:",i,sensor.s.fromMotorEnabled);
        if(sensor.s.fromMotorEnabled){
            if(+sensor.s.fromMotorIndex == index){
                sensor.onValue(val);
            }
        }
    });        
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
    var result = undefined;  
    $.each(this.sensors, function(i,sensor) {
        //console.log("pin:",sensorPin,sensor.s.pin);
        if( sensor.s.cm9Pin == sensorPin){
            result = sensor;
            return false; //break
        }
    });    
    return result;
}


//method called when a gui entry has been changed
SensorManager.prototype.saveSensorSettings = function () {
        
        var s = {}; //settings
        s.sensors = [];

        $.each(this.sensors, function(i,sensor) {
            s.sensors.push(sensor.getSettings());
        });    
    
        var json = JSON.stringify(s, null, 2);
        //Didier: dont overwrite default file
        //fs.writeFileSync(__dirname + "/sensors.json", json);
        //settingsManager.copyPasteToUserFolder("sensors.json");
        settingsManager.saveToConfigurationFolder("sensors.json",json);
        //console.log(json);
};

// Simulates the reloading of the sensors.json file
SensorManager.prototype.onMetaKey = function(char){
    console.log("METAKEY",+char);
}

// Simulates the reloading of the sensors.json file //voir index.js keydown Didier
SensorManager.prototype.onKeyCode = function(char){
    console.log("METAKEY",+char);
    if(char=='M'){ // reset the gui according to the changed elements in the json
        console.log("Resetting sensor settings into GUI");
        this.loadSensorSettings();
        this.saveSensorSettings(); // weird but works like this... bug..
    }
}

SensorManager.prototype.removeAllSensors = function(){
    //cm9Com.removeAllCallbacks();    
    robusManager.reset();
    for( id in this.sensors ){
        this.removeSensor(id);        
    }
}

SensorManager.prototype.removeSensor = function(id){
    console.log("removing:",id);
    if( id in this.sensors){
        misGUI.removeSensor(id);
        this.sensors[id].discard();
        delete this.sensors[id];
    }
    for( id in this.sensors ){
        console.log("afterRemove:",id);
    }

}

SensorManager.prototype.getSensorSetting = function(id,wich){
    return this.sensors[id].s[wich];
}

SensorManager.prototype.sensorEnable = function(id,onoff){
    this.sensors[id].s.enabled = onoff;    
    console.log("sensor enable:",id,onoff);
    this.saveSensorSettings();
}

SensorManager.prototype.onName = function(id,val){
    this.sensors[id].s.name = val;
    this.sensors[id].onName(val);
    console.log("changeName:",id,val);
    this.saveSensorSettings();
}

SensorManager.prototype.onTolerance = function(id,val){
    this.sensors[id].s.tolerance = parseInt(val);
    //console.log("changeTolerance:",id,val);
    this.saveSensorSettings();
}

SensorManager.prototype.onThreshold = function(id,val){
    this.sensors[id].s.threshold = parseInt(val);
    //console.log("changeTheshold:",id,val);
    //this.saveSensorSettings(); //done when slider stops cf MisGUI
}

SensorManager.prototype.onChangeAnim = function(id,wich,txt){
    console.log("changed anim:",id,wich,txt);
    this.sensors[id].s[wich]=txt;    
    this.saveSensorSettings();
}

SensorManager.prototype.isMapped = function(type,port,cmd,nbID){
    for(id in this.sensors){
        var s = this.sensors[id].s;
        var cmd_bool = false;
        if(cmd == "note") cmd_bool = true;
        if(s.midiPort == port && s.midiCmd == cmd_bool && s.midiMapping == nbID && s.midiEnabled){
            return true;
        }
    }
    return false;
}

SensorManager.prototype.getSensorIds = function(type,port,cmd,nbID){
    var sensorIDs = new Array();
    for(id in this.sensors){
        var s = this.sensors[id].s;
        var cmd_bool = false;
        if(cmd == "note") cmd_bool = true;
        if(s.midiPort == port && s.midiCmd == cmd_bool && s.midiMapping == nbID && s.midiEnabled){
            sensorIDs.push(id);
        }
    }
    return sensorIDs;
}

SensorManager.prototype.onMidi = function(id,type,arg){
    
    var sensor = this.sensors[id];
    var mappped_arg = Math.round(arg*(sensor.s.valMax-sensor.s.valMin)/127 + sensor.s.valMin);
    this.sensors[id].onValue(mappped_arg);
    
}

SensorManager.prototype.addEmptySensor = function(){
    //console.log("SensorManager.addEmptySensor");
    var id = "S"+this.sensorID; 
    this.sensors[id]= new Sensor(); //TODO? new Sensor(id)
    this.sensors[id].s.name = "Sensor_"+this.sensorID;
    this.sensors[id].ID = id;
    misGUI.addSensor(this.sensors[id].s,id); 
    this.sensorID++;      
}
