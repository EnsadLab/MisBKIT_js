/**
 * Created by Didier on 24/04/16.
 */
//const electron = window.require('electron');

//var app = require('electron').remote.require('app')
//var remote  = require('remote');
//require('electron').hideInternalModules()
//VersionHTML
//https://github.com/EnsadLab/MisBKIT_processing.git


//var detectSSid = require('detect-ssid');
/*
detectSSid(function(error, ssidname) {
    console.log("SSID",ssidname);
});
*/

const ipc = require('electron').ipcRenderer;
var remote = require('electron').remote;
var dialog = remote.dialog;
const OS = require('os');
var fs = require('fs');

const udp  = require('dgram');
const osc  = require('osc-min');
const serialPort = require('serialport');


//GLOBALS >>> MisBKIT.js ????
var MBK = null;
var settingsManager = null; //cf SettingsManager.js
var dxlManager = null;
var misGUI     = null; //cf MisGui.js
var midiPortManager = null; //cf MidiPortManager.js
var motorMappingManager = null; //cf MotorMappingManager.js
var sensorManager = null; //cf SensorManager.js
var oscManager = null; //cf OscManager.js
var cm9Com     = null;
var robusManager = null;
var oscMobilizing = null;

//=============== security :
//https://electronjs.org/docs/tutorial/security#7-override-and-disable-eval
window.eval = global.eval = function () { //??? remove security warning ??? 
    throw new Error(`Sorry, this app does not support window.eval().`)
}

//ipc.on('close) is called before onbeforeunload
window.onbeforeunload=function(){
    ipc.send("message","onbeforeunload!");
}

ipc.on("close",function(e,arg){
        ipc.send("message","onclose");
        dxlManager.stopAll();
        var c = dxlManager.saveSettings();
        ipc.send("message","savecount:"+c);
        //alert("Quit MisBkit");
        settingsManager.saveSettings();
        motorMappingManager.saveMappingSettings();
        sensorManager.saveSensorSettings();
        oscMobilizing.close();
        robusManager.stopAll();
        cm9Com.close();
});


/*
$( "#dialog" ).dialog({
    autoOpen: false,
    closeOnEscape: true,
    closeText: "X"
});
$( "#dialog" ).dialog('close');
*/

function hideParent(){
 $(this).parent().hide();
}

/*
function toggleButton(){ //toggleButton($(this))
    var zis=$(this);
    var v = (this.value|0)+1 ;
    if(zis.data("colors")) {
        if(v>=zis.data("colors").length)v=0;
        zis.css("background-color", zis.data("colors")[v]);
    }
    if(zis.data("togs")) {
        if(v>=zis.data("togs").length)v=0;
        zis.text(zis.data("togs")[v]);
    }
    this.value = v;
    return v;
}
*/

/*
function setToggleBt(v){ //this = element
    var zis=$(this);
    var d = zis.data("togs");
    //console.log("togs2:",d.length);
    //console.log("togs2:",d);
    if(v>= d.length)v=0;
    if(d[v][0])zis.css("background-color",d[v][0]);
    if(d[v][1])zis.text(d[v][1]);
    this.value = v;
    return v;
}
function toggleButton(){ //click on .toggleBt
    return setToggleBt.call(this,(this.value|0)+1);
}
*/

function btShowHide(){
    var target = $(this).data("target");
    $(target).each(function(i) {
        if (this.style.display == "none")
            $(this).show();
        else
            $(this).hide();
    });
}

function toggleShow(){
    var t = setToggleBt.call(this,(this.value|0)+1);
    var target = $(this).data("target");
    $(target).each(function(i) {
        if(t)
            $(this).show();
        else
            $(this).hide();
    });
}



function showConfig(show){
  if(show){
     //$("#MotorSliders").hide(); //.style.display = 'none';
     $("#dxlConfig").show(); //style.display = 'inline-block';
     // $(".fixed").show();
  }
  else{
     $("#dxlConfig")[0].style.display = 'none';
     //$("#MotorSliders")[0].style.display = 'inline-block';
     // $(".fixed").hide();
  }
};



//$(function() {
window.onload = function() {

    misGUI     = new MisGUI();
    misGUI.init();

    // TODO: ordering had to be changed -> @Didier: is it a problem how it is now? No
    //settingsManager = new SettingsManager(); >>>>>> MISBKIT.js

    //cm9Com = new Cm9TCPclient(); >>>>>> MISBKIT.js

    //robusManager = new RobusManager(); >>>>>> MISBKIT.js

    //motorMappingManager = new MotorMappingManager(); >>>>>> MISBKIT.js

    //oscManager = new OscManager(); >>>>>> MISBKIT.js
    //dxlManager = new DxlManager(); >>>>>> MISBKIT.js
    //sensorManager = new SensorManager(); >>>>>> MISBKIT.js



    var MisBKit = require("./js/MisBKIT.js");
    var MBK = new MisBKit();
    MBK.init();

    
    //try{ midiPortManager = new MidiPortManager(); }catch(e){console.log(e);} >>>>>> MISBKIT.js
    //sensorManager.init(); >>>>>> MISBKIT.js
    //settingsManager.loadSettings(); >>>>>> MISBKIT.js

    //oscManager.open();

    //oscMobilizing = new OscMobilizing(); >>>>>> MISBKIT.js
    
    //robusManager.init(); >>>>>> MISBKIT.js

    //dxlManager.loadSettings(); //-> now called from settingsManager when directories are ready    
    //motorMappingManager.loadMappingSettings(); //-> now called from settingsManager when directories are ready
    //sensorManager.loadSensorSettings(); //-> now called from settingsManager when directories are ready

    //$(".rotAngle").on("mousewheel",function(e){e.preventDefault();}); //>>>>>>>> MisGUI
    //$(".rotSpeed").on("mousewheel",function(e){e.preventDefault();}); //>>>>>>>> MisGUI

    //dxlManager.update(); //start //>>>>>> MISBKIT.js


    $('body').keydown(function(e) {
        if($(e.target).is('input'))
            return;
        if($(e.target).is('textarea'))
            return;

        console.log("keyDown-KeyCode:", e.keyCode);

        if(e.metaKey || e.ctrlKey){
            console.log("keyDown-metaKC:",e.keyCode);
            switch(e.keyCode){
                case 83: //ctrl s
                    settingsManager.saveSettings();
                    sensorManager.saveSensorSettings();
                    dxlManager.saveSettings();
                    break;
                case 82: //ctrl r   
                    motorMappingManager.onKeyCode();
                    break;
                case 77: //ctrl m   
                    sensorManager.onKeyCode('M'); //patch Didier
                    break;
                /*    
                case 9: //tab
                    //console.log("CTRL TAB");
                    /*
                    var dlg = $("#dialog");
                    if (dlg.dialog('isOpen'))
                        dlg.dialog('close');
                    else {
                        //dxlManager.stopAll();
                        dlg.dialog('open');
                    }
                    
                    break;
                */
                case 65: //ctrl a :selectionne la page (berk)
                    break;

                case 32: //ctrl espace: open devtools
                    ipc.send('devTools');
                    break;
                   
                default: // <ctl q><ctl tab> .... 
                    console.log("< default >");
                    return; //default behavior
            }
            return false; //handled
            
        }
        
            /*
                
            if(e.keyCode==83){
                settingsManager.saveSettings();
                dxlManager.saveSettings();
            }else
                return false; //ctrl s
            if(e.keyCode == 82){
                motorMappingManager.onKeyCode();
            }
            
            if(e.keyCode==9) {
                console.log("CTRL TAB");
                var dlg = $("#dialog");
                if (dlg.dialog('isOpen'))
                    dlg.dialog('close');
                else {
                    //dxlManager.stopAll();
                    dlg.dialog('open');
                }
            }
        }
        */
        
        //console.log("down event:",e);
        //console.log("down witch:",e.which);
        //console.log("down keyCode:", e.keyCode);
        //console.log("down charCode:", e.charCode);
        if(e.which==32) { //prevent select current widget
            dxlManager.stopAll();
            return false;
        }

    });


    $('body').keypress(function(e){
        //console.log("DBG-keytarget:", e.target);
        //console.log("DBG-keypress:", e.keyCode);
        if($(e.target).is('input'))
            return;
        if($(e.target).is('textarea'))
            return;

        //console.log("event:",e);
        //console.log("witch:",e.which);
        //console.log("keyCode:", e.keyCode);
        //console.log("charCode:", e.charCode);

        if(e.keyCode!=0) {
            //console.log("char:", String.fromCharCode(e.keyCode));
            if(e.metaKey){
                console.log("char:", String.fromCharCode(e.keyCode));
                dxlManager.onMetaKey(String.fromCharCode(event.keyCode));
                motorMappingManager.onMetaKey(String.fromCharCode(event.keyCode));
            }else{
                dxlManager.onKeyCode(String.fromCharCode(event.keyCode));
                motorMappingManager.onKeyCode(String.fromCharCode(event.keyCode));
                sensorManager.onKeyCode(String.fromCharCode(event.keyCode));
            }return false;
        }
    });

    //var dialog = document.getElementById("dialog");
    //var dlgBt = document.getElementById("btDialog");
    //dlgBt.onclick = function(){dialog.show();}
    //console.log("DIRNAME",__dirname);

    //ipc.send('devTools','on');

    //$('body').openDevTools();



};