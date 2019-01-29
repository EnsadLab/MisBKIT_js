'use strict';

// install node : https://nodejs.org/en/
// sudo npm install -g
// npm install electron-prebuilt -g
// in directory:
// npm install serialport
// npm install midi
//
// npm install midi --runtime=electron --target=2.0.1 --disturl=https://atom.io/download/atom-shell --abi=53

//electron-packager . --platform=darwin --arch=x64 --overwrite --icon=misbkit.icns --prune=true --electronVersion=2.0.1
//electron-packager . --platform=darwin --arch=x64 --overwrite --icon=misbkit.icns --prune=true --out=/Users/Didier/Documents/Dev/_MisBKIT_releases

// git test....

//cecile path: /Users/Cecile ?
//didier path: /Users/Didier/Documents/
var ctrlStopAll = 0;

const electron = require('electron');
var fs = require('fs');

const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
var ipc = require("electron").ipcMain;

var mainWindow   = null;
var appPath = "";



app.on('window-all-closed', function() {
  //if (process.platform != 'darwin') {
    app.quit();
  //}
});

app.on('ready', function() {

  //console.log("process.env.NODE_ENV:",process.env.NODE_ENV )
  //console.log("process.env.DEBUG_PROD",process.env.DEBUG_PROD )

  console.log("versions:",process.versions); //v5.10.0
  //console.log("version electron:",process.versions['electron']); //v5.10.0
  //console.log("version chrome:",process.versions['chrome']); //v5.10.0
  //mainWindow = new BrowserWindow({width: 1280, height: 760});
  mainWindow = new BrowserWindow({width: 1520, height: 760});

  mainWindow.loadURL('file://' + __dirname + '/index.html');
  //mainWindow.loadURL('file://' + __dirname + '/index_alex.html');

  //mainWindow.show();
  ////////// TO PUT IN COMMENT WHEN EXPORTING
  appPath = app.getAppPath(); 
  if(appPath.includes("/Didier/")||appPath.includes("/cecilebucher/"))
    mainWindow.webContents.openDevTools();


  mainWindow.on('close', function() {
    mainWindow.webContents.send("close");
    console.log(" close ...");
  });

  mainWindow.on('closed', function() {
    console.log(" ... closed");
    mainWindow = null;
  });

  console.log("USERDATA:",app.getPath('userData'));
  console.log("DESKTOP:",app.getPath('desktop'));
  //console.log("DOCUMENT:",app.getPath('document'));
  console.log("APPPATH:",app.getAppPath());
  console.log("LOCALES:",app.getLocale());


});


ipc.on('devTools', function (event,arg) {
  mainWindow.webContents.openDevTools();
});


ipc.on('message', function (event,arg) {
  console.log("message:evt:",arg);
});

ipc.on('console', function (event,arg) {
  console.log("console:");
  mainWindow.webContents.openDevTools();
});

ipc.on('capture',function (event,arg) {
  console.log("capture:",arg);
  mainWindow.capturePage(function(img){
    var png = img.toPng();
    fs.writeFile( __dirname +"/test.png",png,function(err){
      console.log("capture error:",err);
    })
  })

});

