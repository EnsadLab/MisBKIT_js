/**
 * Created by Didier on 24/04/16.
 */
//const electron = window.require('electron');

//var app = require('electron').remote.require('app')

//var remote  = require('remote');
//require('electron').hideInternalModules()
//VersionHTML
//https://github.com/EnsadLab/MisBKIT_processing.git

//import path from 'path';
//import {remote} from 'electron';
//console.log("PAAAATH:",remote.app.getAppPath());


//var detectSSid = require('detect-ssid');
/*
detectSSid(function(error, ssidname) {
    console.log("SSID",ssidname);
});
*/



const ipc = require('electron').ipcRenderer;
var remote = require('electron').remote;
console.log("DIR PATH:",__dirname )
//var __appPath = remote.app.getAppPath();
var __appPath = __dirname; // global , ok not still inside ./js
console.log("APP PATH:",__appPath )

var dialog = remote.dialog;
const OS = require('os');
var fs = require('fs');

const udp  = require('dgram');
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
var dmxManager = null;

//=============== security :
//https://electronjs.org/docs/tutorial/security#7-override-and-disable-eval
/*
window.eval = global.eval = function () { //??? remove security warning ??? 
    throw new Error(`Sorry, this app does not support window.eval().`)
}
*/

//ipc.on('close) is called before onbeforeunload
window.onbeforeunload=function(){
    ipc.send("message","onbeforeunload!");
}

ipc.on("close",function(e,arg){
    try{
    var step = 0;
    ipc.send("message","onclose"+step);step+=1;
    MBK.terminate();
    ipc.send("message","onclose"+step);step+=1;

    //TODO --> MBK.terminate()
    dxlManager.stopAll();
    ipc.send("message","onclose"+step);step+=1;
    oscMobilizing.close();
    ipc.send("message","onclose"+step);step+=1;
    //robusManager.stopAll();
    //ipc.send("message","onclose"+step);step+=1;
    cm9Com.close();
    ipc.send("message","onclose"+step);step+=1;

    var c=dxlManager.saveSettings();
    ipc.send("message","onclose"+step);step+=1;
    ipc.send("message","savecount:"+c);
    //alert("Quit MisBkit");
    settingsManager.saveSettings();
    ipc.send("message","onclose"+step);step+=1;
    motorMappingManager.saveMappingSettings();
    ipc.send("message","onclose"+step);step+=1;
    sensorManager.saveSensorSettings();
    ipc.send("message","onclose"+step);step+=1;
    }
    catch(err){
        ipc.send("message","ERR:"+err);
    }
    ipc.send("message","closed");
});


/*
$( "#dialog" ).dialog({
    autoOpen: false,
    closeOnEscape: true,
    closeText: "X"
});
$( "#dialog" ).dialog('close');
*/

//DELETED function hideParent(){$(this).parent().hide();}

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

//DELETED function btShowHide(){
//DELETED function toggleShow(){
//DELETED function showConfig(show){



//$(function() {
window.onload = function() {

    //allow cut,copy,paste in scripteditor in release app
    window.addEventListener('keydown', function (e) {
        if( e.metaKey || e.ctrlKey ){
            console.log("window_keydown:",e)
            if (e.keyCode === 88 ) { document.execCommand('cut');}
            else if (e.keyCode === 67 ){ document.execCommand('copy');}
            else if (e.keyCode === 86 ){ document.execCommand('paste');}
        }
    });

    misGUI = new MisGUI();
    misGUI.init();

    MBK = require("./js/MisBKIT.js");
    MBK.init(); //needs misGUI initialized

    
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
        if($(e.target).is('textarea')){
            //console.log("KEYDOWN TEXTAREA:",e)
            return;
        }
    
        //console.log("keyDown-KeyCode:", e);
        //console.log("keyDown-KeyCode:", e.keyCode);
        scriptManager.call("onKey",e.key);
        pythonManager.onKey(e.key);

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
                   
                case 86: //ctrl espace: open devtools
                    console.log("CTRL V:",e);
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
        if($(e.target).is('textarea')){
            //console.log("KEYPRESS TEXTAREA:",e)
            return;
        }

        //console.log("event:",e);
        //console.log("witch:",e.which);
        //console.log("keyCode:", e.keyCode);
        //console.log("charCode:", e.charCode);

        if(e.keyCode!=0) {
            //console.log("char:", String.fromCharCode(e.keyCode));
            if(e.metaKey){
                console.log("press,meta :", String.fromCharCode(e.keyCode));
                dxlManager.onMetaKey(String.fromCharCode(event.keyCode));
                motorMappingManager.onMetaKey(String.fromCharCode(event.keyCode));
            }else{
                dxlManager.onKeyCode(String.fromCharCode(event.keyCode));
                animManager.onKeyCode(String.fromCharCode(event.keyCode));
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