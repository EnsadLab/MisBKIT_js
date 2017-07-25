/**
* Created by Cecile on 24/07/17.
*/

MotorMappingManager = function () {

    this.motorMappings = new Array();

};

MotorMappingManager.prototype.loadMappingSettings = function () {
    var json;
    try{
        json = fs.readFileSync(__dirname + "/motorMapping.json", 'utf8');
    }catch(err){
        if (err.code === 'ENOENT') {
            console.log("File " + __dirname + "/motorMapping.json not found!");
        }else{
            console.log("Problem loading motorMaping.json file");
        }
    }
    if (json) {
        
        var s = JSON.parse(json);
        //console.log("PARSING motorMapping.json");
        for(var i=0;i<s.motorMappings.length;i++){
            this.motorMappings.push( new MotorMapping() );
        }

        for (var i = 0; i < s.motorMappings.length; i++) {
            //console.log(s.motorMappings[i]);
            this.motorMappings[i].copySettings(s.motorMappings[i]);
            /*
            console.log(this.motorMappings[i].m.motorID);
            console.log(this.motorMappings[i].m.port);
            console.log(this.motorMappings[i].m.type);
            console.log(this.motorMappings[i].m.nbID);
            console.log(this.motorMappings[i].m.valMin);
            console.log(this.motorMappings[i].m.valMax);
            */
        }

    }

}

MotorMappingManager.prototype.isMapped = function(port,type,nbID){

    for(var i=0; i<this.motorMappings.length; i++){

        //console.log(this.motorMappings[i].m.port + " = " + port);
        //console.log(this.motorMappings[i].m.type + " = " + type);
        //console.log(this.motorMappings[i].m.nbID + " = " + nbID);

        if( this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.type == type &&
            this.motorMappings[i].m.nbID == nbID)
        {
            return true;
        }
    }
    return false;
};

MotorMappingManager.prototype.getMotorID = function(port,type,nbID){
    var motorIDs = new Array();
    for(var i=0; i<this.motorMappings.length; i++){
        if( this.motorMappings[i].m.port == port &&
            this.motorMappings[i].m.type == type &&
            this.motorMappings[i].m.nbID == nbID)
        {
            motorIDs.push(this.motorMappings[i].m.motorID);
        }
    }
    return motorIDs;
};