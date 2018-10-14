/**
 * Created by Didier on 20/08/18.
 */

 //TODO : UI : [save as]  or [name]


class scriptManager {
    constructor(){
        console.log("scriptManager constructor")
        this.className = "scriptManager";
        this.folder = "";
        this.currentName = "example.js";
        this.running = false;
        this.script;
    }
    
    init(){
        console.log("scriptManager init")
        misGUI.initManagerFunctions(this,this.className);    
    }

    folderIsReady(folder){
        console.log("scriptManager:folder:",folder);
        this.folder = folder;
    }    
    
    cmd(func,id,val,param){
        console.log("scriptManager cmd:",func,id,val,param);
        if(this[func]!=undefined){
            this[func](val,param);    
        }
    }

    load(){
        console.log("scriptManager load");
        this.stop();
        misGUI.openLoadDialog("Load script :",this.folder+this.currentName,this.loadCurrent.bind(this))
    }

    loadCurrent( filePath ){
        this.stop();
        console.log("scriptManager loading:",filePath);
        var code = fs.readFileSync( filePath , 'utf8');
        console.log("scriptManager loaded:",code);
        if(code != undefined){
            misGUI.setScript(code);
        }
    }

    save(){
        misGUI.openSaveDialog("Save script",this.folder+this.currentName,this.saveCurrent.bind(this));
    }

    saveCurrent( pathfile ){
        console.log("scriptManager saving",pathfile);
        if(pathfile!=undefined){
            var code = misGUI.getScript();
            fs.writeFileSync( pathfile , code ); 
        }
    }

    update(){ //called by MisBKIT.js
        if(this.running){
            try{
                this.script.loop();
            }catch(err){
                this.stop();
                console.log("*** SCRIPT ERROR ****:",err);
            }
        }
    }

    run(){
        this.stop();
        this.saveCurrent(this.folder+this.currentName);

        var code = misGUI.getScript();
        this.script = new Function(code); //"return 42  OK"
        this.script.call(this.script); //construct, with good this
        if(this.script["setup"]!=undefined){
            try{ this.script.setup(); }
            catch(err){console.log("***** script setup :",err)}
        }
        if(this.script["loop"]!=undefined)
            this.running = true;
        else
            this.stop()
    }

    stop(){
        this.running = false;
        //misGUI.stopScript();  //update buttons ??? 
        //stopCode(); //??? --> les boutons ne se transforment plus ?????? 
        console.log("scriptManager stopped");
    }


}
scriptManager  = new scriptManager();
module.exports = scriptManager;

