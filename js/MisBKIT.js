/**
 * Created by Didier on 28/05/18.
 */
/******** WORK IN PROGRESS **********/


module.exports = class MisBKIT{
    constructor(){
       this.name = "MisBKIT";
       this.momo = undefined;
    }

    init(){
        console.log("init:",this.name);

        settingsManager = new SettingsManager();

        cm9Com = new Cm9TCPclient();

        robusManager = new RobusManager();

        motorMappingManager = new MotorMappingManager();

        oscManager = new OscManager();

        dxlManager = new DxlManager();

        sensorManager = new SensorManager();
    
        try{ midiPortManager = new MidiPortManager(); }catch(e){console.log(e);}

        oscMobilizing = new OscMobilizing();        

        sensorManager.init();
        settingsManager.loadSettings();
        robusManager.init();
        dxlManager.init(); //start

    }

}
