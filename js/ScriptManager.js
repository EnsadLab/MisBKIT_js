/**
 * Created by Didier on 20/08/18.
 */
 //TODO : UI : [save as]  or [name]

 motor = require("./DxlManager.js"); //motor.foo() = dxlManager.foo()

var delay = function(ms){
    console.log("----- DELAY -----",ms);
}


class scriptManager {
    constructor(){
        console.log("scriptManager constructor")
        this.className = "scriptManager";
        this.folder = "";
        this.currentName = "example.js";
        this.running = false;
        this.script = function(){};
        //should I store source here ?
    }
    
    init(){
        console.log("scriptManager init")
        misGUI.initManagerFunctions(this,this.className);    
    }

    folderIsReady(folder){
        this.folder = folder;
    }    
    
    cmd(func,id,val,param){
        console.log("scriptManager cmd:",func,id,val,param);
        if(this[func]!=undefined){
            this[func](val,param);    
        }
    }

    setName(name){
        if( name.indexOf('.')<0 ) //no extension
            this.currentName = name+".js";
        else
            this.currentName = name;
    }

    load(){ //Becoz folder
        this.stop();
        misGUI.openLoadDialog("Load script :",this.folder+this.currentName,this.loadCurrent.bind(this))
    }

    loadCurrent( filePath ){
        this.stop();        
        console.log("scriptManager loading:",filePath);
        var i = filePath.lastIndexOf('/')+1;
        if(i>1){
            this.currentName = filePath.slice(i);
            this.folder = filePath.slice(0,i);
            misGUI.showValue({class:this.className,func:"setName",val:this.currentName})
        }
        //else ... what !?

        var code = fs.readFileSync( filePath , 'utf8');
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
                misGUI.alert("Script Error :\n"+err);
            }
        }
    }

    run(){
        this.stop();
        this.saveCurrent(this.folder+this.currentName); //modified ?
        var code = misGUI.getScript();
        try{
            this.script = new Function(code); //"return 42  OK"
            this.script.call(this.script);    //construct, with good this
            //console.log("function?:",typeof(this.script.setup));


            this.script.delay = async function(ms){
                console.log("---- DELAY -----",ms);
                return new Promise(resolve  => {
                    setTimeout(() => {
                        console.log("resolve?");
                    resolve(2);
                    }, ms);
                });
            }


            if(typeof(this.script.setup == "function"))
                this.script.setup();
            this.play();
        }catch(err){
            misGUI.alert("Script Error :\n"+err);
            console.log("RUN ERROR")
            this.logError(err);
        }
    }

    play(){
        console.log("---PLAY---");
        if(typeof(this.script.loop) == 'function')
            this.running = true;
    }

    pause(){ //TODO GUI
        this.running = false;
        //-->dont loop. handle intervals or timers ???
    }

    stop(){
        if(typeof(this.script.stop) == 'function'){
            try{ this.script.stop(); }
            catch(err){misGUI.alert("Script Error :\n"+err);}
        }
        this.running = false;
        //misGUI.stopScript();  //update buttons ??? 
        //stopCode(); //??? --> les boutons ne se transforment plus ?????? 
        console.log("scriptManager stopped");
    }

    delay(ms){ 
        console.log("---- DELAY -----",ms);
        return new Promise(resolve  => {
            setTimeout(() => {
            resolve(2);
            }, ms);
        });
    }

    /*
    logError(err){
        console.log("Dump ERROR:",err.lineNumber)
        for (var prop in err){ //nothing!!!
            console.log(prop + err[prop]);
        } 
        console.log(" line",err.lineNumber)
        console.log(" name",err.name)
        console.log(" dscr",err.description)
        console.log(" stack",err.stack)
    }
    */

}
scriptManager  = new scriptManager();
module.exports = scriptManager;

