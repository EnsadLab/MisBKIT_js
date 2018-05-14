/**
* Created by Cecile on 27/07/17.
*/

class SensorManager{
    constructor(){
        this.className = "sensorManager";
        this.sensors = []; // CEC: changed from object to array; -> much more practical for the sorting
        // or just convert it to array to sort and then again to object.. was practical to do sensors[ID]
        this.configurationFolder = "";
        this.sensorFolder = "";
        this.sensorID = 0;
        this.sensor_files = [];
    }

    cmpReverse(a,b) {
        if (a.s.ID_gui < b.s.ID_gui)
          return 1;
        if (a.s.ID_gui > b.s.ID_gui)
          return -1;
        return 0;
    }

    cmp(a,b) {
        if (a.s.ID_gui < b.s.ID_gui)
          return -1;
        if (a.s.ID_gui > b.s.ID_gui)
          return 1;
        return 0;
    }

    init(){

        console.log("sensorManager.init",this.sensors.length);

        misGUI.initManagerFunctions(this,this.className);

        this.sensors.sort(this.cmpReverse);
        $.each(this.sensors, function(i,sensor){
            misGUI.cloneElement(".single-sensor",sensor.ID);   
        });
        //TODO TODO: le premier element de single-sensor est hide.. pourquoi?
        $.each(this.sensors, function(i,sensor){
            misGUI.cloneElement(".sensor-setting-more",sensor.ID);   
        });
        misGUI.hideElement(".sensor-setting-more","default");
        this.sensors.sort(this.cmp);

        $.each(this.sensors, function(i,sensor){
            sensorManager.initSensor(sensor.ID);
        });


        // select first sensor in the gui
        if(this.sensors.length > 0){
            MisGUI_sensors.selectSensor(this.sensors[0].ID);
        }


    }

    initSensor(eltID){

        var sensor = this.getSensorWithID(eltID);
        if(sensor == undefined) return;

        $.each(sensor.s,function(settings_name,value){
            //console.log(settings_name, value);
            misGUI.setManagerValue("sensorManager","changeSettingsVariable",value,sensor.ID,settings_name);
        });
        // for those where func != changeSettingsVariable
        misGUI.setManagerValue("sensorManager","enable",sensor.s.enabled,sensor.ID);
        misGUI.setManagerValue("sensorManager","onNameText",sensor.s.name,sensor.ID);
        misGUI.setManagerValue("sensorManager","onMinValue",sensor.s.valMin,sensor.ID);
        misGUI.setManagerValue("sensorManager","onMaxValue",sensor.s.valMax,sensor.ID);
        misGUI.setManagerValue("sensorManager","onTolerance",sensor.s.tolerance,sensor.ID);
        misGUI.setManagerValue("sensorManager","onThreshold",sensor.s.threshold,sensor.ID);
        sensorManager.updateTextDescription(sensor.ID);

        MisGUI_sensors.initSlider(sensor.ID,sensor.s.valMin, sensor.s.valMax,sensor.s.threshold,sensor.s.tolerance);
        MisGUI_sensors.setSensorAnims();
        //misGUI.setManagerValue("sensorManager","onChangeAnim",sensor.s.anim1,sensor.ID,"anim1"); // not working.. done now in setSensorAnims method
        //misGUI.setManagerValue("sensorManager","onChangeAnim",sensor.s.anim2,sensor.ID,"anim2"); // not working.. done now in setSensorAnims method
        
        // select input entry
        sensorManager.onSelectInput(sensor.ID,sensor.s.input_entry);

        // init midi inputs and outputs
        MisGUI_sensors.initMidiInput(sensor.ID);
        MisGUI_sensors.initMidiOutput(sensor.ID);
        misGUI.setManagerValue("sensorManager","onMidiInput",sensor.s.midiPortInput,sensor.ID);
        misGUI.setManagerValue("sensorManager","onMidiOutput",sensor.s.midiPortOutput,sensor.ID);

        //TEST
        //MisGUI_sensors.highlightAnim("S0","listAnims-1");
        //MisGUI_sensors.highlightAnim("S1","listAnims-2");

        // add selected output entries
        MisGUI_sensors.hideAllOutputEntries(sensor.ID);
        $.each(sensor.s.output_entries,function(j,output){
            //MisGUI_sensors.addEntry(sensor.ID,output);
            MisGUI_sensors.showEntry(sensor.ID,output);
            
        });
    }

    // called from settingsManager when json settings file had been read
    /*folderIsReady(configurationFolder){
        this.configurationFolder = configurationFolder;
        this.loadSensorSettings();
    }*/

    // new one!!!!
    folderIsReady(sensorFolder){
        this.sensorFolder = sensorFolder;
        //this.loadSensorSettings();
        this.loadSensors();
    }

    setLoadedSensors(sensor_files){
        this.sensor_files = sensor_files;
    }

    loadSensorFromGUI(filename){
        var sensorID = this.loadSensorFromJson(filename);
        if(sensorID != undefined){
            misGUI.cloneElement(".single-sensor",sensorID); 
            misGUI.cloneElement(".sensor-setting-more",sensorID);  
            this.initSensor(sensorID);
            MisGUI_sensors.selectSensor(sensorID);
        }
    }

    loadSensors(){
        this.sensorID = 0;
        for(var index in this.sensor_files){
            sensorManager.loadSensorFromJson(this.sensorFolder + this.sensor_files[index].name + ".json");
        }
        this.init();
        //robusManager.connect(); // CEC: Didier? est-ce toujours nécessaire? NON
    }

    loadSensorFromJson(fullFilenamePath){
        var json;
        try{
            json = fs.readFileSync(fullFilenamePath, 'utf8');
        }catch(err){
            if (err.code === 'ENOENT') {
                console.log("File " + fullFilenamePath + " not found!");
            }else{
                console.log("Problem loading " + fullFilenamePath + " file");
            }
        }
        if (json) {
            // create new sensors from the json file
            console.log("adding new sensor",this.sensors.length);
            var s = JSON.parse(json);
            var sensor = new Sensor();
            sensor.ID = "S"+this.sensorID++;
            sensor.copySettings(s);
            this.sensors.push(sensor);
            return sensor.ID;
        }
        
    }

    loadSensorSettings() {
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
    
            // create new sensors from the json file
            this.sensorID = 0;
            for(var i=0;i<s.sensors.length;i++){
                var sensor = new Sensor();
                sensor.ID = "S"+this.sensorID++;
                sensor.copySettings(s.sensors[i]);
                this.sensors.push(sensor);
            }

            this.init();    
        }
    }


    cmd(func,eltID,arg1,arg2){
        console.log("SensorCmd:",func,eltID,arg1,arg2);
        if(this[func]){
            if(eltID!=undefined)this[func](eltID,arg1,arg2);
            else this[func](arg1,arg2);
        }
    }

    selectSensor(eltID,arg){
        console.log("sensorManager.selectSensor ",eltID);
        MisGUI_sensors.selectSensor(eltID);
    }

    removeSensor(eltID,arg){
        console.log("sensorManager.removeSensor", eltID);

        /*
        for(var index in this.sensors){
            console.log("REMOVE TEST: sesnsor: ",this.sensors[index].ID);
        }*/

        var sensor = this.getSensorWithID(eltID);
        if(sensor != undefined){
            sensor.discard();
        }
        var index = this.sensors.indexOf(sensor);

        if(index != -1){
            this.sensors.splice(index,1);
        }
        MisGUI_sensors.removeSensor(eltID);

        /*
        for(var index in this.sensors){
            console.log("REMOVE TEST: sesnsor: ",this.sensors[index].ID);
        }*/

        this.saveSensorSettings();

    }

    addEmptySensor (){
        //console.log("SensorManager.addEmptySensor");
        var id = "S"+this.sensorID; 
        var sensor = new Sensor();
        sensor.ID = id;
        sensor.s.name = "Sensor_name"; // (+ this.sensorID;) to confusing when a previous sensor is there with same id
        sensor.s.ID_gui = this.sensors.length + 1;
        this.sensors.push(sensor);
        misGUI.cloneElement(".single-sensor",sensor.ID); 
        misGUI.cloneElement(".sensor-setting-more",sensor.ID);  
        this.onSelectInput(sensor.ID,"default");
        MisGUI_sensors.initMidiInput(sensor.ID);
        MisGUI_sensors.initMidiOutput(sensor.ID);
        misGUI.setManagerValue("sensorManager","onMidiInput",sensor.s.midiPortInput,sensor.ID);
        misGUI.setManagerValue("sensorManager","onMidiOutput",sensor.s.midiPortOutput,sensor.ID);
        MisGUI_sensors.initSlider(sensor.ID,sensor.s.valMin, sensor.s.valMax,sensor.s.threshold,sensor.s.tolerance);
        MisGUI_sensors.setSensorAnims();
        MisGUI_sensors.hideAllOutputEntries(sensor.ID);
        MisGUI_sensors.selectSensor(sensor.ID);
        misGUI.setManagerValue("sensorManager","onNameText",sensor.s.name,sensor.ID);
        sensor.s.enabled = true;
        misGUI.setManagerValue("sensorManager","enable",true,sensor.ID);
        this.updateTextDescription(sensor.ID);
        this.sensorID++;      
    }

    loadSensor(filename){
        console.log("loading sensor",filename);
    }

    enable(eltID,onoff){
        console.log("sensorManager.enable:",onoff);
        this.getSensorWithID(eltID).s.enabled = onoff;
        this.saveSensorSettings();
        /*for(var i=0; i<this.sensors.length;i++){
            console.log("test",i,this.sensors[i].ID,this.sensors[i].s.enabled);
        } */ 
    }

    changeSettingsVariable(eltID,value,name){
        console.log("sensorManager.changesettingsvariable",eltID,value,name);
        var sensor = this.getSensorWithID(eltID);
        if(sensor){
            sensor.s[name]=value;
                        //tester if sensor.s[name] exists ???
            /*TODO TODO: old version..
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
            */
           this.saveSensorSettings();
        }    
    }


    onNameText(eltID,txt){
        console.log("sensorManager.onTameText", txt);
        var sensor = this.getSensorWithID(eltID);
        sensor.s.name = txt;
        sensor.onName(txt); // Didier little trick
        this.saveSensorSettings();
    }

    onSelectInput(eltID, input){
        
        console.log("change input selection:",input);
        if(this.checkConnection(input) && this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s.input_entry = input;
    
            // disable previous selected entry - diable all entries
            $.each(connections,function(i,name){
                var k = name + "EnabledInput";
                sensorManager.getSensorWithID(eltID).s[k] = false;
                misGUI.setManagerValue("sensorManager","changeSettingsVariable",false,eltID,name+"EnabledInput");
            });
            
            // enable current selected entry
            //console.log("A",input,this.getSensorWithID(eltID).s.midiEnabledInput,this.getSensorWithID(eltID).s["midiEnabledInput"]);
 
            var k = input + "EnabledInput";
            this.getSensorWithID(eltID).s[k] = true;
    
            MisGUI_sensors.selectEntry(eltID, input);
            misGUI.setManagerValue("sensorManager","changeSettingsVariable",true,eltID,input+"EnabledInput");
            //console.log("B",this.getSensorWithID(eltID).s.midiEnabledInput,this.getSensorWithID(eltID).s["midiEnabledInput"]);
            this.updateTextDescription(eltID);

            this.robusInitSelections();

            this.saveSensorSettings();
        }

    }


    onSelectOutput(eltID, output){
        console.log("add output selection:",output);
        if(this.checkConnection(output) && this.getSensorWithID(eltID) != undefined){
            var sensor = this.getSensorWithID(eltID);
            if(!sensor.s.output_entries.includes(output)){
                sensor.s.output_entries.push(output);
            }
            var k = output + "EnabledOutput";
            sensor.s[k] = true;
            misGUI.setManagerValue("sensorManager","changeSettingsVariable",true,eltID,output+"EnabledOutput");
            MisGUI_sensors.addEntry(eltID,output);
            // CEC: put it back to default state.. to be discussed
            misGUI.setManagerValue("sensorManager","onSelectOutput","default",eltID);
            this.updateTextDescription(eltID);
            this.saveSensorSettings();
        }
    }

    updateTextDescription(id){
        
        if(this.getSensorWithID(id) != undefined){
            var sensor = this.getSensorWithID(id);
            
            if(sensor.s.input_entry == "default"){
                sensor.textDescription = "to ";
            }else{
                sensor.textDescription = sensor.s.input_entry + " to ";
            }
            var index = 0;
            for(var i=0; i<sensor.s.output_entries.length;i++){
                if( sensor.s.output_entries[i] != "default"){
                    if(index != 0) sensor.textDescription += " / " // != 1 because of "default" value
                    sensor.textDescription += sensor.s.output_entries[i];
                    index++;
                }
            }
            console.log("textDescription",sensor.textDescription);
            //misGUI.setManagerValue("sensorManager","textDescription",sensor.textDescription,sensor.ID);
            if(sensor.textDescription.length == 0 || sensor.textDescription == "to ") sensor.textDescription = "no selected input/outputs";
            MisGUI_sensors.updateTextDescription(sensor.ID,sensor.textDescription);
        }
    }

    onMinValue(eltID, value){
        console.log("sensorManager.onMinValue",eltID,value);
        var sensor = this.getSensorWithID(eltID);
        if(sensor != undefined){
            if(value < sensor.s.valMax){
                sensor.s.valMin = parseInt(value);
                MisGUI_sensors.changeMin(eltID,value);  
                this.saveSensorSettings();
            }else{ // restore previous value
                misGUI.setManagerValue("sensorManager","onMinValue",sensor.s.valMin,sensor.ID);
                MisGUI_sensors.changeMin(eltID,sensor.s.valMin);
            }
            this.checkThreshold(eltID);
        }
         
    }

    onMaxValue(eltID, value){
        console.log("sensorManager.onMaxValue",eltID,value);
        var sensor = this.getSensorWithID(eltID);
        if(sensor!= undefined){
            if(value > sensor.s.valMin ){
                sensor.s.valMax = parseInt(value);
                MisGUI_sensors.changeMax(eltID,value);
                this.saveSensorSettings();
            }else{ // restore previous value
                misGUI.setManagerValue("sensorManager","onMaxValue",sensor.s.valMax,sensor.ID);
                MisGUI_sensors.changeMax(eltID,sensor.s.valMax);
            }
            this.checkThreshold(eltID);
        }
        MisGUI_sensors.changeMax(eltID,value); 
        
    }

    onTolerance(eltID, value){
        console.log("sensorManager.onTolerance",eltID,value);
        if(this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s.tolerance = parseInt(value);
            this.saveSensorSettings();
        }
        MisGUI_sensors.changeTolerence(eltID,value);
    }

    onThreshold(eltID, value){
        if(this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s.threshold = parseInt(value);
            this.saveSensorSettings();
        }
        MisGUI_sensors.changeThreshold(eltID,value);
    }

    checkThreshold(eltID){
        var sensor = this.getSensorWithID(eltID);
        if(sensor != undefined){
            if(sensor.s.threshold < sensor.s.valMin){
                sensor.s.threshold = sensor.s.valMin;
                MisGUI_sensors.changeThreshold(eltID,sensor.s.threshold);
            }else if(sensor.s.threshold > sensor.s.valMax){
                sensor.s.threshold = sensor.s.valMax;
                MisGUI_sensors.changeThreshold(eltID,sensor.s.threshold);
            }
        }
    }

    onChangeAnim(eltID,txt,wich){
        console.log("sensorAnim.onChangeAnim:",eltID,wich,txt);
        if(this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s[wich] = txt;
            this.saveSensorSettings();
        }
    }

    // method called from MisGUI_sensors and not directly from the html code
    removeOutput(eltID, output){
        if(this.getSensorWithID(eltID) != undefined && output != undefined){
            var index = this.getSensorWithID(eltID).s.output_entries.indexOf(output);
            if (index > -1) {
                this.getSensorWithID(eltID).s.output_entries.splice(index, 1);
            }
            var k = output+"EnabledOutput";
            this.getSensorWithID(eltID).s[k] = false;
            misGUI.setManagerValue("sensorManager","changeSettingsVariable",false,eltID,output+"EnabledOutput");
            this.updateTextDescription(eltID);
            this.saveSensorSettings();
        }
    }

    onMidiInput(eltID,midiPort){
        console.log("sensorManager.onMidiInput",eltID,midiPort);
        if(this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s.midiPortInput = midiPort;
            this.saveSensorSettings();
        }
    }

    onMidiOutput(eltID,midiPort){
        console.log("sensorManager.onMidiOutput",eltID,midiPort);
        if(this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s.midiPortOutput = midiPort;
            this.saveSensorSettings();
        }
    }

    // called after scanning new midi ports
    updateMidiPorts(){
        $.each(this.sensors, function(i, sensor){
            MisGUI_sensors.initMidiInput(sensor.ID);
            MisGUI_sensors.initMidiOutput(sensor.ID);
            misGUI.setManagerValue("sensorManager","onMidiInput",sensor.s.midiPortInput,sensor.ID);
            misGUI.setManagerValue("sensorManager","onMidiOutput",sensor.s.midiPortOutput,sensor.ID);
        });
    }

    // basically, juste useful for the console output warning..
    checkConnection(str){
        if(! connections.includes(str)){
            console.log("CAREFUL!! A sensor input/output has not been defined correctly in the html code."); 
            return false;
        }
        return true;
    }

    onMidi(id,type,arg){
        var sensor = this.getSensorWithID(id);
        if(sensor != undefined){
            var mappped_arg = Math.round(arg*(sensor.s.valMax-sensor.s.valMin)/127 + sensor.s.valMin);
            sensor.onValue(mappped_arg);
        }
    }

    isMapped(type,port,cmd,nbID){
        for(var i=0; i<this.sensors.length;i++){
            var s = this.sensors[i].s;
            var cmd_bool = false;
            if(cmd == "note") cmd_bool = true;
            if(s.midiPortInput == port && s.midiCmdInput == cmd_bool && s.midiMappingInput == nbID && s.midiEnabledInput){
                return true;
            }
        }
        return false;
    }

    onOscMessage(sensor_name,value,mobilizing,minValue,maxValue){
        console.log("onOscMessage",sensor_name,value,minValue,maxValue);
        var sensor = this.getSensorWithName(sensor_name);
        if(sensor != undefined){
            var mapped_arg = value;
            if(minValue != undefined && maxValue != undefined){
                mapped_arg = Math.round((value-minValue)*(sensor.s.valMax-sensor.s.valMin)/(maxValue-minValue) + parseInt(sensor.s.valMin));
                //mappped_arg = Math.round((value -minValue)*(maxValue-minValue));
            }else{
                //console.log("value",value);
                //console.log("(sensor.s.valMax-sensor.s.valMin) ",(sensor.s.valMax-sensor.s.valMin) );
                //console.log("value*(sensor.s.valMax-sensor.s.valMin) ",value*(sensor.s.valMax-sensor.s.valMin) );
                //console.log("value*(sensor.s.valMax-sensor.s.valMin)+valMin ",value*(sensor.s.valMax-sensor.s.valMin)+sensor.s.valMin );
                mapped_arg = Math.round(value*(sensor.s.valMax-sensor.s.valMin) + parseInt(sensor.s.valMin));
                //console.log("mapped_arg",mapped_arg);
            }
            if((sensor.s.oscEnabledInput && !mobilizing) || (sensor.s.mobilizingEnabledInput && mobilizing)){
                sensor.onValue(mapped_arg);
            }
        }
    }
    
    getSensorIds(type,port,cmd,nbID){
        var sensorIDs = new Array();
        for(var i=0; i<this.sensors.length;i++){
            var s = this.sensors[i].s;
            var cmd_bool = false;
            if(cmd == "note") cmd_bool = true;
            if(s.midiPortInput == port && s.midiCmdInput == cmd_bool && s.midiMappingInput == nbID && s.midiEnabledInput){
                sensorIDs.push(this.sensors[i].ID);
            }
        }
        return sensorIDs;
    }

    handleSensorValueForAnims(sensorID, sensorValue){
        //console.log("handleSensorValue",sensorID,sensorValue);
        var sensor = this.getSensorWithID(sensorID);
        //TODO TODO: check when tolerance is entered as a string type..
        //console.log(sensor.s.threshold,sensor.s.tolerance,sensor.s.valMin,sensor.s.valMax);
        if(sensor != undefined && sensorValue >= sensor.s.valMin && sensorValue < (sensor.s.threshold-parseInt(sensor.s.tolerance))){ 
            sensor.area = 0;
            //console.log("sensor area 0");
            if(sensor.oldArea != sensor.area){
                // trigger animation 1
                //console.log("Trigger left animation ",sensor.s.anim1);
                MisGUI_sensors.highlightAnim(sensorID,"listAnims-1");
                this.startAnim(sensor.s.anim1, sensor.s.anim2);
            }
        }else if(sensor != undefined && sensorValue >= (sensor.s.threshold + parseInt(sensor.s.tolerance))){
            sensor.area = 1;
            //console.log("sensor area 1");
            if(sensor.oldArea != sensor.area){
                // trigger animation 2
                //console.log("Trigger right animation ",sensor.s.anim2);
                MisGUI_sensors.highlightAnim(sensorID,"listAnims-2");
                this.startAnim(sensor.s.anim2, sensor.s.anim1);
            }
        }
    
        sensor.oldArea = sensor.area;
    }

    startAnim(animPlaying, animStopping){

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



    //called by cm9Manager // array of sensor values, one loop.
    handlePinValues(vals){
        var nbv = vals.length;
        $.each(this.sensors,function(i,sensor) {
            if( sensor.s.cm9EnabledInput ){
                var pin = +sensor.s.cm9Pin;
                if( (pin>=0)&&(pin<nbv) ){
                    sensor.onValue(vals[pin]);
                }
            }
        });
    }

    //Motor position -> sensor.s.fromMotorIndex
    handleDxlPos(index,nval){
        //console.log("handleDxlPos:",index,nval);
        $.each(this.sensors,function(i,sensor) {
            //console.log("handleDxlPos:",i,sensor.s.motorEnabledInput);
            if(sensor.s.motorEnabledInput){
                if(+sensor.s.fromMotorIndex == index){
                    sensor.onNormValue(nval);
                }
            }
        });        
    }


    getSensorWithPin(sensorPin){
        var result = undefined;  
        $.each(this.sensors, function(i,sensor) {
            console.log("pin:",sensorPin,sensor.s.pin);
            if( sensor.s.cm9Pin == sensorPin){
                result = sensor;
                return false; //break
            }
        });    
        return result;
    }

    freezeAllSensors(){
        for(var index in this.sensors){
            this.sensors[index].freezeSensor();
        }
    }
    
    unfreezeAllSensors(){
        for(var index in this.sensors){
            this.sensors[index].unfreezeSensor();
        }
    }
    

    // Simulates the reloading of the sensors.json file //voir index.js keydown Didier
    onKeyCode(char){
        console.log("METAKEY",+char);
        if(char=='M'){ // reset the gui according to the changed elements in the json
            console.log("Resetting sensor settings into GUI");
            this.loadSensorSettings();
            this.saveSensorSettings(); // weird but works like this... bug..
        }
    }

    getSensorWithID(ID){
        return this.sensors.find(function(sensor){
            return sensor.ID == ID;
        });
    }

    getSensorWithName(name){
        return this.sensors.find(function(sensor){
            return sensor.s.name = name;
        });
    }


    getSensorSetting(eltID,wich){
        var sensor = this.getSensorWithID(eltID);
        if(sensor != undefined){
            return this.getSensorWithID(eltID).s[wich];
        }
    }

    //method called when the application is closed
    saveSensorSettings() {

        // save sensor order
        var items = $(".sensors #sortable-sens").children();
        $.each(items,function(index,item){
            //console.log(item);
            var eltID = $(item).attr("eltID");
            var sensor = sensorManager.getSensorWithID(eltID);
            if(sensor != undefined){
                sensor.s.ID_gui = index;
                //console.log("list with eltID",eltID,sensor.s.ID_gui);
            }
        });
        
        var s = {}; //sensor settings

        $.each(this.sensors, function(i,sensor) {
            for(var k in sensor.s){
                s[k]=sensor.s[k];
            }
            var json = JSON.stringify(s, null, 2);
            //console.log(json);
            settingsManager.saveToSensorFolder(sensor.s.name + ".json",json);
        });    

    }

    onRobusParam(eltID,value,param){
        //console.log("onRobusParam:",eltID,value,param);
        var sensor = this.getSensorWithID(eltID);
        if(sensor != undefined){
            sensor.s.robusParams[param]=value;
            //console.log("robusParam:",sensor.s.robusParams);
            //robusManager.addSensorEmitter(eltID,sensor.s.robusParams);

        }
    }

    //event {gate: ,alias: ,p0:value ,p1:value ,...}
    onRobusValue(event){
        for(var i=0; i<this.sensors.length;i++){
            if( this.sensors[i].s.robusEnabledInput ){ //this.sensors[i].s.input_entry=="robus"){
                var p = this.sensors[i].s.robusParams;
                if(event.gate==p.gate && event.alias==p.module ){
                    //console.log("onRobusValue:",p.pin);
                    if(event[p.pin])
                        this.sensors[i].onValue(event[p.pin]);
                }
            }
        }
    }

    //className , func , value , eltID, param
    robusInitSelections(){
        var gates = robusManager.getGates();
        //console.log("robusInitSelections:",gates)
        for(var i=0; i<this.sensors.length;i++){
            var sensor = this.sensors[i];
            if(this.sensors[i].s.input_entry=="robus"){ //?do it for all sensors?
                misGUI.setManagerValue("robusInput","onRobusParam",gates,sensor.ID,"gate");
                var modules = robusManager.getModules(sensor.s.robusParams);
                misGUI.setManagerValue("robusInput","onRobusParam",modules,sensor.ID,"module");
                var pins = robusManager.getPins(sensor.s.robusParams);
                misGUI.setManagerValue("robusInput","onRobusParam",pins,sensor.ID,"pin");
            }
        }
    }


}


/*

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
        /* ignore for now..
        for(var i=0;i<s.sensors.length;i++){
            //this.sensors.push( new Sensor() );
            var id = "S"+this.sensorID++; 
            this.sensors[id]= new Sensor(); //TODO? new Sensor(id) 
            this.sensors[id].ID = id;
            this.sensors[id].copySettings(s.sensors[i]);
            //console.log("s... ",this.sensors[id].s);
            //console.log("s... ",this.sensors[id].s.cm9Pin);
        }*/

        //settingsManager.copyPasteFromUserFolder("sensors.json");

        /* for now..
        this.updateGUI();
        robusManager.connect(); 


    }

}


SensorManager.prototype.updateGUI = function () {

    console.log("classname: ",this.className);
    misGUI.initManagerFunctions(this,this.className);
    misGUI.cloneElement(".single-sensor",1);
    misGUI.cloneElement(".single-sensor",2);
    misGUI.cloneElement(".single-sensor",3);


    // update the sensors panel in the GUI
    /* ignore for now
    $.each(this.sensors, function(i,sensor) {
        misGUI.addSensor(sensor.s,sensor.ID);       
    });
    */    


    // test ...
    //misGUI.setSensorValue("S0",42);
    //misGUI.setSensorRange("S1",50,133,100);
    //misGUI.setSensorTolerance("S0",42);
    //console.log("getPin:",this.getSensorWithPin(7));

    /* for now..
}



SensorManager.prototype.changeSetting = function(sensorID,name,value){
    console.log("SensorManager.changeSetting:",sensorID,name,value);
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
    }else if(sensorValue >= (sensor.s.threshold + sensor.s.tolerance)){
        sensor.area = 1;
        //console.log("sensor area 1");
        if(sensor.oldArea != sensor.area){
            // trigger animation 2
            //console.log("Trigger right animation ",sensor.s.anim2);
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
SensorManager.prototype.handleDxlPos=function(index,nval){
    //console.log("handleDxlPos:",index,nval);
    $.each(this.sensors,function(i,sensor) {
        //console.log("handleDxlPos:",i,sensor.s.fromMotorEnabled);
        if(sensor.s.fromMotorEnabled){
            if(+sensor.s.fromMotorIndex == index){
                sensor.onNormValue(nval);
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
    console.log("Sensors removing:",id);
    if( id in this.sensors){
        misGUI.removeSensor(id);
        this.sensors[id].discard();
        delete this.sensors[id];
    }
    for( id in this.sensors ){
        console.log("afterRemove:",id);
    }

}

SensorManager.prototype.freezeAllSensors = function(){
    for(id in this.sensors){
        var s = this.sensors[id].freezeSensor();
    }
}

SensorManager.prototype.unfreezeAllSensors = function(){
    for(id in this.sensors){
        var s = this.sensors[id].unfreezeSensor();
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

// SensorManager.prototype.onTolerance = function(id,val){
//     this.sensors[id].s.tolerance = parseInt(val);
//     //console.log("changeTolerance:",id,val);
//     this.saveSensorSettings();
// }

// SensorManager.prototype.onThreshold = function(id,val){
//     this.sensors[id].s.threshold = parseInt(val);
//     //console.log("changeTheshold:",id,val);
//     //this.saveSensorSettings(); //done when slider stops cf MisGUI
// }

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

*/
