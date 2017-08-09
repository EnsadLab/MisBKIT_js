/**
* Created by Cecile on 31/07/17.
*/

function SettingsManager(){

    this.misBKITFolder  = "";
    this.animationFolder = "";
    this.configurationFolder = "";

};

// TODO: why is that necessary?
if(NODE==false){ //needs fs midi
    SettingsManager.prototype.saveSettings = function(){}
    SettingsManager.prototype.loadSettings = function(){}
}
else {    
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

        // TODO: hmmm... when exactly? Each time we load something new...
        this.copyPasteFromUserFolder('/motorMapping.json');
        this.copyPasteFromUserFolder('/sensors.json');
    };

}

SettingsManager.prototype.chooseMisBKITFolder = function() {    

    if(this.misBKITFolder.length==0){
        if(ELECTRON==true) { //needs remote.dialog
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
                    this.misBKITFolder = folder;

                    console.log("FOLDER! NEW !!! " + this.misBKITFolder);

                    this.animationFolder = this.misBKITFolder + "Animations";
                    console.log("FOLDER! NEW !!! " + this.animationFolder);
                    fs.mkdir(this.animationFolder, function (err) {
                        if (err.code != 'EEXIST') {
                            console.log('failed to create Animations directory', err);
                        } else {
                            console.log('created Animations directory');
                            dxlManager.folderIsReady(this.animationFolder);
                        }
                    });

                    this.configurationFolder = this.misBKITFolder + "Configurations";
                    console.log("FOLDER! NEW !!! " + this.configurationFolder);
                    fs.mkdir(this.configurationFolder, function (err) {
                        if (err.code != 'EEXIST') {
                            console.log('failed to create Configurations directory', err);
                        } else {
                            console.log('created Configurations directory');
                            motorMappingManager.configurationFolder = this.configurationFolder;
                            sensorsManager.configurationFolder = this.configurationFolder;
                            
                            this.synchroniseFiles();

                        }
                    });
                }
            });
        }
    } else { // if directories have already been created!
        dxlManager.folderIsReady(this.animationFolder);
        this.synchroniseFiles();
    }
};

// check whether the files already exist in the user directory. If yes, use these ones as the user
// could have changed them while not running misBKIT.
SettingsManager.prototype.synchroniseFiles = function(){
    fs.exists(this.configurationFolder + "/motorMapping.js",function(exists){
        if(exists){
            // in case the file has been changed while misbkit not running
            settingsManager.copyPasteFromUserFolder('/motorMapping.json'); // can't reach this in callback
        }else{
            settingsManager.copyPasteToUserFolder('/motorMapping.json');
        }
    });

    fs.exists(this.configurationFolder + "/sensors.js",function(exists){
        if(exists){
            // in case the file has been changed while misbkit not running
            settingsManager.copyPasteFromUserFolder('/sensors.json');
        }else{
            settingsManager.copyPasteToUserFolder('/sensors.json');
        }
    });
}

SettingsManager.prototype.copyPasteToUserFolder = function(filename){

    fs.createReadStream(__dirname + filename)
            .pipe(fs.createWriteStream(this.configurationFolder + filename));
}


SettingsManager.prototype.copyPasteFromUserFolder = function(filename){

    fs.createReadStream(this.configurationFolder + filename)
            .pipe(fs.createWriteStream(__dirname + filename));
}

