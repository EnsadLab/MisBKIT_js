/**
 * Created by Didier on 28/05/18.
 */
/******** WORK IN PROGRESS **********/

//Globals ... TODO remove ?
settingsManager = require("./SettingsManager.js");
cm9Com = require("./Cm9Manager.js");
dxlManager    = require("./DxlManager.js");
sensorManager = require("./SensorManager.js");
robusManager  = require("./RobusManager.js");
oscManager    = require("./OscManager.js");
oscMobilizing = require("./OscMobilizing.js");
scriptManager = require("./ScriptManager.js");
animManager   = require("./AnimManager.js");
pythonManager = require("./PythonManager.js");
dmxManager    = require("./DmxManager.js");;
//fakeManager    = require("./fakeManager.js");;


//acces them by little name
var managers = {
    dxl    :require("./DxlManager.js"),
    anim   :require("./AnimManager.js"),
    sensor :require("./SensorManager.js"),
    midi   :require("./MidiPortManager.js"),
    osc    :require("./OscManager.js"),
    python :require("./PythonManager.js"),
    ui     :require("./MisGUI.js"),
    dmx    :require("./DmxManager.js"),
//    fake   :require("./fakeManager.js")
}

//module.exports = class MisBKIT{
class MisBKIT{
    constructor(){
       this.name = "MisBKIT";
       this.updateTimer;

       this.ctrlStopAll = 0;
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
        console.log("======================== init: fakeManager");
        //fakeManager.init();
        console.log("======================== init: sensorManager");
        sensorManager.init();
        console.log("======================== init: animManager");
        animManager.init();
        console.log("======================== init: dxlManager");
        dxlManager.init(); //before loadSettings
        console.log("======================== init: robusManager");
        robusManager.init();
        console.log("======================== init: scriptManager");
        scriptManager.init();
        console.log("======================== init: oscManager");
        oscManager.init();
        console.log("======================== init: pythonManager");
        pythonManager.init();
        console.log("======================== init: dmxManager");
        dmxManager.init();

        console.log("======================== init: settingsManager");
        settingsManager.loadSettings();

        this.updateTimer = setInterval(this.update.bind(this),45); //~50ms

        //Test: this.stringFunc( "dxl.setAngle(0,90,val1,123.456.789,val3,234,5.678)")
    }

    // "manager.function(param1,param2 ...)"
    stringFunc( str ){ 
        //TODO throw errors ?
        //console.log("MBK:stringFunc:",str);
        var spl = str.split(/[()]/);
        var mf  = spl[0].split('.');
        var m = managers[mf[0]];
        if(m!=undefined){
            var f= mf[1];
            if( typeof(m[f])=='function' ){
                var args = spl[1].split(',');
                for(var i=0;i<args.length;i++){
                    var a = +args[i]
                    if(!isNaN(a)) //127.0.0.1 -> NaN
                        args[i]=a
                }
                return m[f](...args);
            }
        }
    }

    // "manager.function param1 param2 ...)"
    stringCmd( str ){ 
        //TODO throw errors ?
        var spl = str.split(' ');
        var mf  = spl[0].split('.');
        var m = managers[mf[0]];

        if(m!=undefined){
            var f= mf[1];
            if( typeof(m[f])=='function' ){
                var args = spl.slice(1);
                for(var i=0;i<args.length;i++){
                    var a = +args[i]
                    if(!isNaN(a)) //127.0.0.1 -> NaN !!! "" -> 0
                        args[i]=a
                }
                return m[f](...args);
            }
        }
    }

    update(){ //"Mainloop"
        sensorManager.update();
        scriptManager.update(); //may command anim,motors ...
        animManager.update();
    }

    terminate(){
        clearInterval(this.updateTimer);
        pythonManager.close(); //! important ! 
        scriptManager.stop();  //! important ! 
        scriptManager.saveSource();
        sensorManager.disableAll();
        dmxManager.close();
    }

}
module.exports = new MisBKIT();
