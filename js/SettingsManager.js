/**
* Created by Cecile on 31/07/17.
*/

function SettingsManager(){
    this.misBKITFolder  = "";
    this.animationFolder = "";
    this.configurationFolder = "";
};

    
SettingsManager.prototype.loadSettings = function(){
    console.log("DIR NAME " + __dirname + "" + "/pathSettings.json");
    var json = fs.readFileSync(__dirname + "/pathSettings.json", 'utf8');
    if (json) {
        var s = JSON.parse(json);

        this.misBKITFolder = s.misBKITFolder;
        this.animationFolder = s.animationFolder;
        this.configurationFolder = s.configurationFolder;

        this.chooseMisBKITFolder();
        
    }
};
SettingsManager.prototype.saveSettings = function () {
    console.log("entering settings manager save");
    var s = {}; //settings

    s.misBKITFolder = this.misBKITFolder;
    s.animationFolder = this.animationFolder;
    s.configurationFolder = this.configurationFolder;
    
    //console.log(this.misBKITFolder);
    //console.log(this.animationFolder);
    //console.log(this.configurationFolder);

    var json = JSON.stringify(s, null, 2);
    fs.writeFileSync(__dirname + "/pathSettings.json", json);
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
                        self.synchroniseFiles();
                        motorMappingManager.folderIsReady(self.configurationFolder);
                        sensorManager.folderIsReady(self.configurationFolder);

                    }
                });
            }
        });
    } else { // if directories have already been created!
        dxlManager.folderIsReady(this.animationFolder);
        this.synchroniseFiles();
        motorMappingManager.folderIsReady(this.configurationFolder);
        sensorManager.folderIsReady(this.configurationFolder);
    }
};

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

    if(fs.existsSync(this.configurationFolder + "sensors.json")){
        // in case the file has been changed while misbkit not running
        settingsManager.copyPasteFromUserFolder('sensors.json');
    }else{
        settingsManager.copyPasteToUserFolder('sensors.json');
    }

}

SettingsManager.prototype.copyPasteToUserFolder = function(filename){
    //console.log("copying from " + __dirname + "/" + filename);
    //console.log("to " + this.configurationFolder + filename);
   fs.writeFileSync(this.configurationFolder + filename, fs.readFileSync(__dirname + "/" + filename));
}


SettingsManager.prototype.copyPasteFromUserFolder = function(filename){

    console.log("should copy to programm folder from ",this.configurationFolder + filename );
    fs.writeFileSync(this.configurationFolder + filename, fs.readFileSync(__dirname + "/" + filename));
    //fs.createReadStream(this.configurationFolder + filename)
      //      .pipe(fs.createWriteStream(__dirname + "/" + filename));
}

//Didier (used by SensorManager.saveSensorSettings)
SettingsManager.prototype.saveToConfigurationFolder = function(filename,data){
    fs.writeFileSync(this.configurationFolder + filename, data );    
}

