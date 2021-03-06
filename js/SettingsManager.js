/**
* Created by Cecile on 31/07/17.
*/

function SettingsManager(){
    this.misBKITFolder  = "";
    this.animationFolder = "";
    this.configurationFolder = "";
    this.sensorFolder = "";
    this.scriptFolder = "";
};
var stgmng = new SettingsManager();
module.exports = stgmng;


SettingsManager.prototype.loadSettings = function(){
    console.log("DIR NAME " + __appPath + "" + "/pathSettings.json");
    var json = fs.readFileSync(__appPath + "/pathSettings.json", 'utf8');
    console.log("SETTINGS",json)
    if (json) {
        var s = JSON.parse(json);

        this.misBKITFolder = s.misBKITFolder;
        this.animationFolder = s.misBKITFolder + "Animations/";
        this.configurationFolder = s.misBKITFolder + "Configurations/"; //s.configurationFolder;
        this.sensorFolder = s.misBKITFolder + "Sensors/"; //s.configurationFolder;
        this.scriptFolder = s.misBKITFolder + "Scripts/"

        this.chooseMisBKITFolder();
        
    }
    this.copyScriptExamples();
    console.log("SETTINGS scriptFolder",this.scriptFolder)
    scriptManager.folderIsReady(this.scriptFolder);//in any case , no?
};
SettingsManager.prototype.saveSettings = function () {
    console.log("entering settings manager save");
    var s = {}; //settings

    s.misBKITFolder = this.misBKITFolder;
    //s.animationFolder = this.animationFolder;
    //s.configurationFolder = this.configurationFolder;
    
    //console.log(this.misBKITFolder);
    //console.log(this.animationFolder);
    //console.log(this.configurationFolder);

    var json = JSON.stringify(s, null, 2);
    fs.writeFileSync(__appPath + "/pathSettings.json", json);
    console.log(json);

};



SettingsManager.prototype.chooseMisBKITFolder = function() {    

    //if(this.misBKITFolder.length==0){
    if(!fs.existsSync(this.misBKITFolder)){
        //if(ELECTRON==true) { //needs remote.dialog //didier removed ELECTRON
        var self = this;
        dialog.showOpenDialog({
            title: "First Choose MisBKIT Folder",
            properties: ['openDirectory', 'createDirectory']
        }, function (folder) {
            if (folder) {
                //var slash = folder.lastIndexOf('/') + 1;
                console.log("RecFolder0:",folder);
                var l = folder.length;
                if(folder[l-1]!='/')
                    folder+='/';
                self.misBKITFolder = folder;

                console.log("FOLDER! user " + self.misBKITFolder);

                self.animationFolder = self.misBKITFolder + "Animations/";
                console.log("FOLDER! animation " + self.animationFolder);
                fs.mkdir(self.animationFolder, function (err) {
                    if (err != null && err.code != 'EEXIST') {
                        console.log('failed to create Animations directory', err);
                    } else {
                        console.log('created Animations directory');
                        dxlManager.folderIsReady(self.animationFolder);
                    }
                });

                self.configurationFolder = self.misBKITFolder + "Configurations/";
                console.log("FOLDER! configuration " + self.configurationFolder);
                fs.mkdir(self.configurationFolder, function (err) {
                    if (err != null && err.code != 'EEXIST') {
                        console.log('failed to create Configurations directory', err);
                    } else {
                        console.log('created Configurations directory');
                        self.copyFiles();
                        motorMappingManager.folderIsReady(self.configurationFolder);
                        //sensorManager.folderIsReady(self.configurationFolder);

                    }
                });

                self.sensorFolder = self.misBKITFolder + "Sensors/";
                console.log("FOLDER! sensor " + self.sensorFolder);
                fs.mkdir(self.sensorFolder, function (err) {
                    if (err != null && err.code != 'EEXIST') {
                        console.log('failed to create Sensors directory', err);
                    } else {
                        console.log('created Sensors directory');
                        self.copyFiles();
                        sensorManager.folderIsReady(self.sensorFolder);

                    }
                });

                self.getScriptFolder();

            }
        });
    } else { // if directories have already been created!
        dxlManager.folderIsReady(this.animationFolder);
       // this.synchroniseFiles();
        motorMappingManager.folderIsReady(this.configurationFolder);
        sensorManager.folderIsReady(this.sensorFolder);
    }
};

// Didier: TODO generic getUserFolder( name , callback )
//    eg /Scripts is not created if misBKITFolder allready exists 
SettingsManager.prototype.getScriptFolder = function(){   //name , cb ){
    this.scriptFolder = this.misBKITFolder + "Scripts/";
    if(!fs.existsSync(this.scriptFolder)){
        console.log("FOLDER! script " + this.scriptFolder);
        fs.mkdir(this.scriptFolder, function (err) {
            if (err != null && err.code != 'EEXIST') {
                console.log('failed to create Scripts directory', err);
            } else {
                console.log('created Scripts directory');
            }
        });
    }
    return this.scriptFolder; //? what if error
}


// check whether the files already exist in the user directory. If yes, use these ones as the user
// could have changed them while not running misBKIT.
SettingsManager.prototype.synchroniseFiles = function(){
    //console.log("synchronise file: " + this.configurationFolder + "midiMotorMapping.json");

    if(fs.existsSync(this.configurationFolder + "midiMotorMapping.json")){
        // in case the file has been changed while misbkit not running
        settingsManager.copyPasteFromUserFolder('midiMotorMapping.json'); // can't reach this in callback
    }else{
        settingsManager.copyPasteToUserFolder('midiMotorMapping.json');
    }

    /*
    if(fs.existsSync(this.configurationFolder + "sensors.json")){
        // in case the file has been changed while misbkit not running
        settingsManager.copyPasteFromUserFolder('sensors.json');
    }else{
        settingsManager.copyPasteToUserFolder('sensors.json');
    }*/

}

SettingsManager.prototype.copyFiles = function(){
    this.copyPasteToUserFolder('midiMotorMapping.json');
    //this.copyPasteToUserFolder('sensors.json');
}

SettingsManager.prototype.copyPasteToUserFolder = function(filename){
    //console.log("copying from " + __dirname + "/" + filename);
    //console.log("to " + this.configurationFolder + filename);
   fs.writeFileSync(this.configurationFolder + filename, fs.readFileSync(__appPath + "/" + filename));
}


SettingsManager.prototype.copyPasteFromUserFolder = function(filename){

    console.log("should copy to programm folder from ",this.configurationFolder + filename );
    fs.writeFileSync(this.configurationFolder + filename, fs.readFileSync(__appPath + "/" + filename));
    //fs.createReadStream(this.configurationFolder + filename)
      //      .pipe(fs.createWriteStream(__dirname + "/" + filename));
}

SettingsManager.prototype.saveToConfigurationFolder = function(filename,data){
    console.log("SAVE SETTINGS:",this.configurationFolder)
    fs.writeFileSync(this.configurationFolder + filename, data );    
}

SettingsManager.prototype.saveToSensorFolder = function(filename,data){
    fs.writeFileSync(this.sensorFolder + filename, data ); 
}

SettingsManager.prototype.loadConfiguration = function(filename){
    console.log("loading:",this.configurationFolder + filename )
    var datas = undefined;
    try{
        datas = fs.readFileSync( this.configurationFolder + filename , 'utf8');
    }catch(err){
        console.log("loadConfiguration:",err);
    } //Alert?
    return datas;
}

SettingsManager.prototype.copyScriptExamples = function(){
    var dest = this.getScriptFolder()+"examples/";
    console.log("**********exampletFolder:*************",dest)
    if(!fs.existsSync(dest))
        fs.mkdirSync( dest )

    var sce = __appPath+'/scriptExamples/' //local examples
    fs.readdirSync(sce).forEach(file => {
        //console.log('/scriptExamples/',sce+file ,dest+file);
        //dont need to be sync ? should overwrite user ?
        //fs.copyFile( sce+file,dest+file,fs.constants.COPYFILE_EXCL,(err)=>{
        //    if(err) console.log("copyScriptExamples:",err);
        //})
        try{ fs.copyFileSync( sce+file,dest+file,fs.constants.COPYFILE_EXCL ) }
        catch(err){}
    })
}
