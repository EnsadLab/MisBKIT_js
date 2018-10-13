/**
 * Created by Didier on 28/05/18.
 */
/******** WORK IN PROGRESS **********/

settingsManager = require("./DxlManager.js");
cm9Com = require("./Cm9Manager.js");
dxlManager    = require("./DxlManager.js");
sensorManager = require("./SensorManager.js");
robusManager  = require("./RobusManager.js");
oscManager    = require("./OscManager.js");
oscMobilizing = require("./OscMobilizing.js");

module.exports = class MisBKIT{
    constructor(){
       this.name = "MisBKIT";
    }

    init(){
        console.log("init:",this.name);

        //settingsManager = new SettingsManager();

        //cm9Com = new Cm9TCPclient();

        //robusManager = new RobusManager();

        //dxlManager = new DxlManager();
        //dxlManager = require('./js/DxlManager.js');

        motorMappingManager = new MotorMappingManager();

        //oscManager = new OscManager();

        //sensorManager = new SensorManager();
    
        try{ midiPortManager = new MidiPortManager(); }catch(e){console.log(e);}

        //oscMobilizing = new OscMobilizing();        

        sensorManager.init();
        dxlManager.init(); //before loadSettings
        robusManager.init();
        settingsManager.loadSettings();



    }

}
