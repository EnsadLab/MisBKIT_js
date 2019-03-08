/**
* Created by Cecile on 27/07/17.
* Deep Modification by Didier:
*  connections moved from Sensor.js
*
*/

/*
* Didier:
* questions:
* isMapped & onMidi ne peuvent-ils être dans le même fonction ? 
* (idem avec dxl)
*
* un seul inputEnabled, au lieu de xxxxEnabled ? 
* ou bien inputDatas = {enabled:true , ... ... ...}
*
*/

var Sensor = require("./Sensor.js");

var connections = [
    "default",
    "distanceSensor",
    "lightSensor",
    "cm9",
    "osc",
    "midi",
    "motor",
    "mobilizing", 
    "animations",
    "robus",
    "sinus",
    "random"
]


class SensorManager{
    constructor(){
        this.className = "sensorManager";
        this.sensors = []; // CEC: changed from object to array; -> much more practical for the sorting
        // or just convert it to array to sort and then again to object.. was practical to do sensors[ID]
        this.configurationFolder = "";
        this.sensorFolder = "";
        this.sensorID = 0;
        this.sensor_files = [];
        this.sensorSelected = undefined;
        this.loading = false;
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

    //MisGUI.prototype.setManagerValue = function( className , func , value , eltID, param){   
    //opt: {class:classname,id:eltID,func:func,param:param,val:value}
    //MisGUI.prototype.showValue=function(opt){


    update(){ //filtre
        $.each(this.sensors, function(i,sensor){
            sensor.update();
        });
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
        //MisGUI.showValue({class:"sensorManager",func:"ena"})


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
        
        MisGUI_sensors.changeSinusRandomParams(sensor.ID,sensor.s.sinusParams);
        MisGUI_sensors.changeSinusRandomParams(sensor.ID,sensor.s.randomParams);
        MisGUI_sensors.selectFilter(sensor.ID,sensor.s.filter);

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

    uiLoad(){ //Becoz folder
        console.log("SensorManager::uiLoad",this.loading);
        if(!this.loading){ //prevent multiclicks 
            this.loading = true
            misGUI.openLoadDialog("Load sensor:",this.sensorFolder,this.loadSensorFromGUI.bind(this),this)
        }
    }

    loadSensorFromGUI(filename){
        console.log("SensorManager::loadSensorFromGUI");
        var sensorID = this.loadSensorFromJson(filename);
        if(sensorID != undefined){
            misGUI.cloneElement(".single-sensor",sensorID); 
            misGUI.cloneElement(".sensor-setting-more",sensorID);  
            this.initSensor(sensorID);
            MisGUI_sensors.selectSensor(sensorID);
        }
        this.loading = false
    }

    resetLoadDialog(){
        this.loading = false;
    }

    loadSensors(){
        this.sensorID = 0;
        for(var index in this.sensor_files){
            sensorManager.loadSensorFromJson(this.sensorFolder + this.sensor_files[index].name + ".json");
        }
        this.init();
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
                //sensor.s.enabled = false;
                this.sensors.push(sensor);
            }
            this.init();    
        }
    }

    cmd(func,eltID,val,param){
        console.log("SensorCmd:",func,eltID,val,param);
        if(this[func]){
            if(eltID!=undefined)return this[func](eltID,val,param);
            else return this[func](val,param);
        }
    }

    selectSensor(eltID,arg){
        MisGUI_sensors.selectSensor(eltID);
        var sensor = this.getSensorWithID(eltID);

        this.setPopupValues(eltID); //Didier: A REVOIR: updates UI parameters
    }

    removeSensor(eltID,arg){
        console.log("sensorManager.removeSensor", eltID);

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
        console.log("SensorManager.addEmptySensor");
        var id = "S"+this.sensorID; 
        var sensor = new Sensor();
        sensor.ID = id;
        sensor.s.name = "Sensor_name"; // (+ this.sensorID;) to confusing when a previous sensor is there with same id
        sensor.s.ID_gui = this.sensors.length + 1;
        // TODO DIDIER2: solution provisoire... on peut mettre l'adresse par défaut ici....
        sensor.s.oscAdressInput = "/mbk/sensor"+this.sensorID;  //Didier: avec ID
        sensor.s.oscAdressOutput = "/mbk/sensor"+this.sensorID; // ... name ?
        ////////////////////////////////////////////////////////////////////////////////
        // IF WE WANT TO CHANGE THE DEFAULT SINUS AND RANDOM VALUES
        sensor.s.sinusParams = {amplitude:100.0,offset:0.0,period:1.0,current:0};
        sensor.s.randomParams = {valmin:0,valmax:100,intmin:2,intmax:5};
        ////////////////////////////////////////////////////////////////////////////////
        sensor.s.alpha = 0.5;
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
        MisGUI_sensors.changeOscAdress(sensor.ID,sensor.s.oscAdressInput,sensor.s.oscAdressOutput);
        MisGUI_sensors.changeSinusRandomParams(sensor.ID,sensor.s.sinusParams);
        MisGUI_sensors.changeSinusRandomParams(sensor.ID,sensor.s.randomParams);
        misGUI.setManagerValue("sensorManager","onNameText",sensor.s.name,sensor.ID);

        console.log("LUOSPARAMS:",sensor.s.luosInputParams);

        sensor.s.enabled = true; //???
        misGUI.setManagerValue("sensorManager","enable",true,sensor.ID);
        this.updateTextDescription(sensor.ID);
        this.sensorID++;      
    }

    loadSensor(filename){
        console.log("loading sensor",filename);
    }

    enable(eltID,onoff){
        console.log("sensorManager.enable:",onoff);
        var sensor = this.getSensorWithID(eltID); 
        this.getSensorWithID(eltID).s.enabled = onoff;
        this.saveSensorSettings();
        /*
        if(sensor.s.input_entry=="random"){
            console.log("RANDOM onoff:",onoff);
        }
        */
        /*for(var i=0; i<this.sensors.length;i++){
            console.log("test",i,this.sensors[i].ID,this.sensors[i].s.enabled);
        } */ 
    }

    inputOnOff(eltID,onoff,param){ //Didier
        console.log("sensorManager.enableInput:",eltID,onoff,param);
        var sensor = this.getSensorWithID(eltID);
        if(sensor){
            //sensor.inputEnabled = onoff; //remplacer xxxEnabledInput
            sensor.inputOnOff(onoff,param);
        }
    }

    changeSettingsVariable(eltID,value,name){
        console.log("sensorManager.changesettingsvariable",eltID,value,name);
        var sensor = this.getSensorWithID(eltID);
        if(sensor){
            /*
            if(name == "randomEnabledInput"){
                if(value != sensor.s[name]){ // thrown twice
                console.log("RANDOM onoff:",sensor.s.input_entry,value);
                sensor.randomOnOff(value);
                }
           }
           */

            
            // SOLUTION provisoire......
            // je suis fatiguée... y'a sûrement une meilleure manière......
            if(name=="valmin" || name=="valmax" || name=="intmin" || name=="intmax"){
                sensor.s.randomParams[name] = value;
            } else if(name =="offset" || name=="period" || name=="amplitude"){
                sensor.s.sinusParams[name] = value;
            } else if(name == "oscAdressInput"){
                // TODO DIDIER2:// envoyer la nouvelle adresse OSC à l'OSCMANAGER: value
                //DONE: kind of listener later  
                sensor.s.oscAdressInput = value;
            } else if(name == "oscAdressOutput"){
                // TODO DIDIER2: // envoyer la nouvelle adresse OSC à l'OSCMANAGER: value
                //DONE
                sensor.s.oscAdressOutput = value;
            } else {
                sensor.s[name]=value;
            }
            
            
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
            if(name == "randomEnabledInput" || name == "sinusEnabledInput"){
                sensor.inputOnOff(value);
            } 

            this.saveSensorSettings();

        }    
    }

    onNameText(eltID,txt){
        console.log("sensorManager.onTameText", txt);
        var sensor = this.getSensorWithID(eltID);
        sensor.s.name = txt;
        //sensor.onName(txt); // Didier was little trick
        this.saveSensorSettings();
    }

    onSelectInput(eltID, input){
        
        console.log("change input selection:",input);
        if(this.checkConnection(input) && this.getSensorWithID(eltID) != undefined){
            var sensor = this.getSensorWithID(eltID); //once please ... yup :-)

            if(sensor != undefined){


                //sensor.inputOnOff(false); //Didier //cec.. changed to true et je l'ai mis en bas.
            
                sensor.s.input_entry = input;
        
                // disable previous selected entry - diable all entries
                $.each(connections,function(i,name){
                    var k = name + "EnabledInput";
                    sensorManager.getSensorWithID(eltID).s[k] = false;
                    //console.log("disable:",name);
                    misGUI.setManagerValue("sensorManager","changeSettingsVariable",false,eltID,name+"EnabledInput");
                });
                
                // enable current selected entry
                //console.log("A",input,this.getSensorWithID(eltID).s.midiEnabledInput,this.getSensorWithID(eltID).s["midiEnabledInput"]);
    
                var k = input + "EnabledInput";
                sensor.s[k] = true;
                sensor.inputOnOff(true); //Didier  //cec: changed to true
                MisGUI_sensors.selectEntry(eltID, input);
                misGUI.setManagerValue("sensorManager","changeSettingsVariable",true,eltID,input+"EnabledInput");
                //console.log("B",this.getSensorWithID(eltID).s.midiEnabledInput,this.getSensorWithID(eltID).s["midiEnabledInput"]);
                this.updateTextDescription(eltID);

                console.log("luosSettingParams",sensor.s.luosInputParams)
                this.luosSettingParams(eltID,sensor.s.luosInputParams);

                this.saveSensorSettings();
            }
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

    onSelectFilter(eltID, filter){
        console.log("SensorManager::onSelectFilter",eltID,filter);
        var sensor = this.getSensorWithID(eltID);
        if(sensor){
            sensor.s.filter = filter;
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

    //cannot min > max  becoz anim switcher
    onMinValue(eltID, value){
        console.log("sensorManager.onMinValue",eltID,value);
        var sensor = this.getSensorWithID(eltID);
        if(sensor != undefined){
            var val = +value;
            sensor.s.valMin = val; //parseInt(value); why ???
            MisGUI_sensors.changeMin(eltID,val);  
            if(val > sensor.s.valMax){
                sensor.s.valMax = val
                misGUI.setManagerValue("sensorManager","onMaxValue",val,sensor.ID);
                MisGUI_sensors.changeMax(eltID,val);
            }
            //    this.saveSensorSettings();
            //}else{ // restore previous value
            //    misGUI.setManagerValue("sensorManager","onMinValue",sensor.s.valMin,sensor.ID);
            //    MisGUI_sensors.changeMin(eltID,sensor.s.valMin);
            //}
            this.checkThreshold(eltID);
        }
         
    }

    onMaxValue(eltID, value){
        console.log("sensorManager.onMaxValue",eltID,value);
        var sensor = this.getSensorWithID(eltID);
        if(sensor!= undefined){
            var val = +value;
            sensor.s.valMax = val; //parseInt(value); why ???
            MisGUI_sensors.changeMax(eltID,val);  
            if(val < sensor.s.valMin){
                sensor.s.valMin = val
                misGUI.setManagerValue("sensorManager","onMinValue",val,sensor.ID);
                MisGUI_sensors.changeMin(eltID,val);
            } 
            //if(value > sensor.s.valMin ){
            //    sensor.s.valMax = parseInt(value);
            //    MisGUI_sensors.changeMax(eltID,value);
            //    this.saveSensorSettings();
            //}else{ // restore previous value
            //    misGUI.setManagerValue("sensorManager","onMaxValue",sensor.s.valMax,sensor.ID);
            //    MisGUI_sensors.changeMax(eltID,sensor.s.valMax);
            //}
            this.checkThreshold(eltID);
        }
        //MisGUI_sensors.changeMax(eltID,value);  
    }

    onTolerance(eltID, value){
        console.log("sensorManager.onTolerance",eltID,value);
        if(this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s.tolerance = +value;
            this.saveSensorSettings();
        }
        MisGUI_sensors.changeTolerence(eltID,value);
    }

    onThreshold(eltID, value){
        if(this.getSensorWithID(eltID) != undefined){
            this.getSensorWithID(eltID).s.threshold = +value; //parseInt ???????
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


    removeSensorOutput(eltID,value,param){
        //console.log("SensorManager::removeSensorOutput");
        misguiremoveSensorOutput(undefined,eltID,param);
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
            console.log("SENSORS updateMidiPorts:",sensor.s.midiPortInput+">")
            MisGUI_sensors.initMidiInput(sensor.ID);
            MisGUI_sensors.initMidiOutput(sensor.ID);
            misGUI.setManagerValue("sensorManager","onMidiInput",sensor.s.midiPortInput,sensor.ID);
            misGUI.setManagerValue("sensorManager","onMidiOutput",sensor.s.midiPortOutput,sensor.ID);
        });
    }

    // basically, juste useful for the console output warning..
    checkConnection(str){
        if(! connections.includes(str)){
            console.log("CAREFUL!! A sensor input/output has not been defined correctly in the html code.",str); 
            return false;
        }
        return true;
    }

    activate( name,onoff ){ //<-script
        if(onoff=="false")
            this.deactivate()
        else{ //true or undef
            for(var i=0; i<this.sensors.length;i++){
                if(this.sensors[i].s.name == name){
                    this.sensors[i].s.enabled = true;
                    misGUI.setManagerValue("sensorManager","enable",true,this.sensors[i].ID);
                }
            }
            this.saveSensorSettings();
        }
    }

    deactivate( name ){  //<-script
        for(var i=0; i<this.sensors.length;i++){
            if(this.sensors[i].s.name == name){
                this.sensors[i].s.enabled = false;
                misGUI.setManagerValue("sensorManager","enable",false,this.sensors[i].ID);
            }        
        }
        this.saveSensorSettings();
    }

    value(name,val){ //<-script
        if(val==undefined)
            return this.getValue(name)
        else
            this.setValue(name,val)  
    }

    setValue(name,val){ //<-script
        for(var i=0; i<this.sensors.length;i++){
            if(this.sensors[i].s.name == name){
                this.sensors[i].onValue(+val)
            }
        }
    }

    getValue(name){ //<-script
        for(var i=0; i<this.sensors.length;i++){
            if(this.sensors[i].s.name == name){
                return this.sensors[i].outValue;
            }
        }        
    }

    onMidi(id,type,arg){
        console.log("SensorManager.onMidi:",id,type,arg)
        var sensor = this.getSensorWithID(id);
        if(sensor != undefined){
            //pourquoi round ? no floats ??? ???
            //var mappped_arg = Math.round(arg*(sensor.s.valMax-sensor.s.valMin)/127 + sensor.s.valMin);
            sensor.onValue(mappped_arg);
            
        }
    }

    isMapped(type,port,cmd,nbID){
        console.log("SensorManager.isMapped:",type,port,cmd,nbID)
        for(var i=0; i<this.sensors.length;i++){
            var s = this.sensors[i].s;
            var cmd_bool = false;
            if(cmd == "note") cmd_bool = true;
            if(s.midiPortInput == port && s.midiCmdInput == cmd_bool && s.midiMappingInput == nbID && s.midiEnabledInput){
                console.log("MAPPED")
                return true;
            }
        }
        return false;
    }

    //Didier: replacement of    isMapped() + getSensorIds() + onMidi()
    // what about channel !
    onMidiDatas(port,ch,type,d1,d2){ //TODO ? build a string 'midiID'
        var num = d1;        //CC par default
        var val = d2;
        var cmdbool = false; //Berk
        if(type==1){         //noteOn (noteOff will be thrown)
            cmdbool = false; //others ?
            val = d1;        //note , num should be channel
        }
        $.each(this.sensors, function(i,sensor){
            var s = sensor.s;
            if(s.midiEnabledInput && s.midiPortInput == port && s.midiCmdInput == cmdbool && s.midiMappingInput == num )
                sensor.onNormValue(val/127); // min/max ne servent plus
                //sensor.onValue(val)        // à discuter
        })
    }


    /* TO DELETE ?
    onOscMessage(sensor_name,value,mobilizing,minValue,maxValue){
        console.log("onOscMessage",sensor_name,value,minValue,maxValue);
        var sensor = this.getSensorWithName(sensor_name);
        if(sensor != undefined){
            var mapped_arg = value;
            if(minValue != undefined && maxValue != undefined){
                mapped_arg = Math.round((value-minValue)*(sensor.s.valMax-sensor.s.valMin)/(maxValue-minValue) + parseInt(sensor.s.valMin));
            }else{
                mapped_arg = Math.round(value*(sensor.s.valMax-sensor.s.valMin) + parseInt(sensor.s.valMin));
                //console.log("mapped_arg",mapped_arg);
            }
            if((sensor.s.oscEnabledInput && !mobilizing) || (sensor.s.mobilizingEnabledInput && mobilizing)){
                sensor.onValue(mapped_arg);
            }
        }
    }*/

    onOSC(addr,args){
        for(var i=0; i<this.sensors.length;i++){
            if(this.sensors[i].s.oscAdressInput == addr)
                this.sensors[i].onValue(args[0]);
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
        if(sensor != undefined && sensorValue >= sensor.s.valMin && sensorValue < (sensor.s.threshold-sensor.s.tolerance)){ 
            sensor.area = 0;
            //console.log("sensor area 0");
            if(sensor.oldArea != sensor.area){
                // trigger animation 1
                //console.log("Trigger left animation ",sensor.s.anim1);
                MisGUI_sensors.highlightAnim(sensorID,"listAnims-1");
                this.startAnim(sensor.s.anim1, sensor.s.anim2);
            }
        }else if(sensor != undefined && sensorValue >= (sensor.s.threshold + sensor.s.tolerance)){
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

    disableAll(){ //MisBKIT terminate
        $.each(this.sensors, function(i,sensor) {
            sensor.s.enabled = false;
        //TODO GUI 
        });
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
            return sensor.s.name = name; //????????????????????
        });
    }

    getSensorsByName(name){ //return array
        var sensors = [];
        for(var i=0; i<this.sensors.length;i++){
            if( this.sensors[i].s.name == name )
                sensors.push(this.sensors[i]);
        }
        return sensors;
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

    /*
    getOptions(eltID,currval,param){
        console.log("<------>options:",eltID,currval,param)
        switch(param){
            case "gate":
                return ["gate1","gate2","gate3"];
            case "module":
                return ["mo 1","mo 2","mo 3"];
            case "pin":
                return(["out 1","out 2","out 3"]);
            default:
                console.log("<------>default:",eltID,currval,param)
        }
    }*/

    luosSettingParams(eltID,params){ //force <select> to current value
    /*TODO redo
        var sensor = this.getSensorWithID(eltID);
        if(sensor!=undefined){
            var gates = ["none"].concat(robusManager.getGates())
            if(gates.indexOf(params.gate)<0)
                gates.push(params.gate)

            var modules = robusManager.getAliases(params.gate);
            if(modules.indexOf(params.module)<0)
                modules.unshift(params.module)

            var pins = robusManager.getOutputs(params.gate,params.pin);
            if(pins.indexOf(params.pin)<0)
                pins.unshift(params.pin)
    
            misGUI.showValue({class:"sensorManager",id:eltID,param:"gate",val:gates})
            misGUI.showValue({class:"sensorManager",id:eltID,param:"gate",val:params.gate})
            misGUI.showValue({class:"sensorManager",id:eltID,param:"module",val:modules})
            misGUI.showValue({class:"sensorManager",id:eltID,param:"module",val:params.module})
            misGUI.showValue({class:"sensorManager",id:eltID,param:"pin",val:pins})
            misGUI.showValue({class:"sensorManager",id:eltID,param:"pin",val:params.pin})
        }
    */
    }

    uiLuosParam(eltID,value,param){
        var sensor = this.getSensorWithID(eltID);
        if(sensor!=undefined){
            switch(param){
                case "gate":
                    sensor.s.luosInputParams["gate"]=value;
                    var a = luosManager.getAliases(value);
                    misGUI.showValue({class:"sensorManager",id:eltID,param:"module",val:a}) //TODO html alias
                    value = sensor.s.luosInputParams["alias"]
                    //break; //continue with value=alias
                case "module": //TODO html alias
                    var gate = sensor.s.luosInputParams["gate"] 
                    sensor.s.luosInputParams["alias"]=value;
                    var a = luosManager.getOutputs(gate,value);
                    console.log("*********** getOutputs *******",a)
                    misGUI.showValue({class:"sensorManager",id:eltID,param:"pin",val:a})                    
                    break;
                case "pin":
                    sensor.s.luosInputParams["pin"]=value;
                    break;
                case "inputs":
                    console.log("LUOS INPUT:",value);
            }
            console.log("uiLuosParam:",eltID,value,param);
            console.log("uiLuosParam:",sensor.s.luosInputParams);
        }
    }

    
    /* //Test moche : selector avec tous les inputs d'une gate 
    setLuosGate(id,list){
        misGUI.showValue({class:"sensorManager",param:"inputs",val:list})
    }
    */
    luosNewGate(){
        var gates = ["none"].concat(luosManager.getGates())
        console.log(" luosGates:",gates)
        misGUI.showValue({class:"sensorManager",param:"gate",val:gates})
        //DBG misGUI.showValue({class:"sensorManager",param:"module",val:aliases})
        //DBG misGUI.showValue({class:"sensorManager",param:"pin",val:outs})
    }
 
    //DELETED onLuosValue(gate,alias){
    //DELETED robusInitSelections(){

    //DELETED onSinusPopup(eltID,arg1,arg2){
    //DELETED onRandomPopup(eltID,arg1,arg2){

    setPopupValues(eltID){ //val param
        var sensor = this.getSensorWithID(eltID);
        var entry  = sensor.s.input_entry;
        misGUI.setEltID(entry+"Popup",eltID); //!!! reuse of same html dialog ... toThink
        var p = sensor.s[ entry+"Params" ]; //ex "sinusParams"
        //name in title 
        misGUI.setManagerValue("sensorManager",entry+"Name",sensor.s.name); //ex "sinusName"
        misGUI.changeSettings("sensorManager","inputParam",p,eltID);       //ex "sinusParam"
    }

    //DELETED sinusParam(eltID,value,param){ //eltID,param,value
    //DELETED randomParam(eltID,value,param){

    inputParam(eltID,value,param){
        //console.log("onRandomParam:",eltID,param,value);
        var sensor = this.getSensorWithID(eltID);
        if(sensor != undefined){
            var entry  = sensor.s.input_entry;
            var p = sensor.s[entry+"Params"]; 
            console.log("....Params:",entry,p); //sensor.s[entry+"Param"]);
            sensor.s[entry+"Params"][param]=+value;
        }        
    }



}
var snsmng = new SensorManager();
module.exports = snsmng;


