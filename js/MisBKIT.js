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

        dxlManager = new DxlManager();

        motorMappingManager = new MotorMappingManager();

        oscManager = new OscManager();


        sensorManager = new SensorManager();
    
        try{ midiPortManager = new MidiPortManager(); }catch(e){console.log(e);}

        oscMobilizing = new OscMobilizing();        

        sensorManager.init();
        dxlManager.init(); //before loadSettings
        robusManager.init();
        settingsManager.loadSettings();

    }

}
