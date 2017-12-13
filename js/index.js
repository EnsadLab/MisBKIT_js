/**
 * Created by Didier on 24/04/16.
 */
//const electron = window.require('electron');

//var app = require('electron').remote.require('app')
//var remote  = require('remote');
//require('electron').hideInternalModules()
//VersionHTML
//https://github.com/EnsadLab/MisBKIT_processing.git


var remote = require('electron').remote;
var dialog = remote.dialog;
const OS = require('os');

const udp  = require('dgram');
const osc  = require('osc-min'); 

var fs = null;

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

try {
    var ipc = require("electron").ipcRenderer;
    fs = require('fs');
    console.log("USE FS");
    //var remote = require('electron').remote;
    //var dialog = remote.require('dialog');
    ipc.on("close",function(e,arg){
        dxlManager.saveSettings();
        settingsManager.saveSettings();
        motorMappingManager.saveMappingSettings();
        robusManager.reset();
        cm9Com.removeAllCallbacks();
        cm9Com.close();
        oscMobilizing.close();
    });

}catch(e){}


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


window.onbeforeunload=function(){
        //cm9Com.close();
        //dxlManager.serialOnOff(false);
        dxlManager.saveSettings();
        sensorManager.saveSensorSettings();
        settingsManager.saveSettings();
}


//$(function() {
window.onload = function() {

    /*V02
    $(".btHide").on('click',hideParent);
    $(".btShowHide").on('click',btShowHide);
    $(".toggleBt").on("click",toggleButton);
    $(".toggleShow").on("click",toggleShow);
    */

    // TODO: ordering had to be changed -> @Didier: is it a problem how it is now? No
    settingsManager = new SettingsManager();
    cm9Com = new CM9udp();
    robusManager = new RobusManager();

    motorMappingManager = new MotorMappingManager();

    dxlManager = new DxlManager();
    sensorManager = new SensorManager();
    try{ midiPortManager = new MidiPortManager(); }catch(e){console.log(e);}
    misGUI     = new MisGUI();
    misGUI.init();

    settingsManager.loadSettings();

    oscManager = new OscManager();
    oscManager.init();

    oscMobilizing = new OscMobilizing();
    //dxlManager.loadSettings(); //-> now called from settingsManager when directories are ready
    
    //try{ cm9Com = new SerialClass(); }catch(e){}
    //try{ oscCm9 = new OSCcm9(); cm9Com.open();}catch(e){}
    //try{ cm9Com = new CM9_UDP(); cm9Com.open();}catch(e){}
    
    //motorMappingManager.loadMappingSettings(); //-> now called from settingsManager when directories are ready
    //sensorManager.loadSensorSettings(); //-> now called from settingsManager when directories are ready

    $(".rotAngle").on("mousewheel",function(e){e.preventDefault();});
    $(".rotSpeed").on("mousewheel",function(e){e.preventDefault();});

    dxlManager.update(); //start


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
        console.log("DBG-keypress:", e.keyCode);
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
};