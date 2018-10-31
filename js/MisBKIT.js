/**
 * Created by Didier on 28/05/18.
 */
/******** WORK IN PROGRESS **********/

settingsManager = require("./SettingsManager.js");
cm9Com = require("./Cm9Manager.js");
dxlManager    = require("./DxlManager.js");
sensorManager = require("./SensorManager.js");
robusManager  = require("./RobusManager.js");
oscManager    = require("./OscManager.js");
oscMobilizing = require("./OscMobilizing.js");
scriptManager = require("./ScriptManager.js");
animManager = require("./AnimManager.js");

module.exports = class MisBKIT{
    constructor(){
       this.name = "MisBKIT";
       this.updateTimer;
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
        animManager.init();
        dxlManager.init(); //before loadSettings
        robusManager.init();
        scriptManager.init();
        oscManager.init();

        settingsManager.loadSettings();

        this.updateTimer = setInterval(this.update.bind(this),45); //~50ms

    }

    stop(){
        clearInterval(this.updateTimer);
        scriptManager.stop();
    }

    update(){ //"Mainloop"
        animManager.update();
        scriptManager.update();
    }

}
