/**
 * Created by Didier on 20/08/18.
 */
 //TODO : UI : [save as]  or [name]


dxl = require("./DxlManager.js"); //dxl.foo() = dxlManager.foo()
function sleep(millis) {
    console.log("sleep:",millis)
    return new Promise(resolve => setTimeout(resolve, millis));
}


class scriptManager {
    constructor(){
        this.className = "scriptManager";
        this.folder = "";
        this.currentName = "example.js";
        this.scriptNames = ["example.js"];
        this.running = false;
        this.insideLoop = false;
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
        if( name.indexOf('.')<0 ) //force .js ?
            this.currentName = name+".js";
        else
            this.currentName = name;
    }

    uiLoad(){ //Becoz folder
        this.stop();
        misGUI.openLoadDialog("Load script :",this.folder+this.currentName,this.loadSource.bind(this))
    }
    loadSource( filePath ){
        this.stop();
        var i = filePath.lastIndexOf('/')+1;
        if(i>1){
            this.currentName = filePath.slice(i);
            this.folder = filePath.slice(0,i); //back to setting Manager ?
        }
        //else ... what !?

        var code = fs.readFileSync( filePath , 'utf8');
        if(code != undefined){
            misGUI.showValue({class:this.className,func:"setName",val:this.currentName});
            misGUI.setScript(code);
        }
    }

    uiSave(){
        misGUI.openSaveDialog("Save script",this.folder+this.currentName,this.saveSource.bind(this));
    }
    saveSource( pathfile ){
        console.log("scriptManager saving",pathfile);
        if(pathfile!=undefined){
            var code = misGUI.getScript();
            fs.writeFileSync( pathfile , code ); 
        }
    }

    update(){ //called by MisBKIT.js
        if(this.running){
            try{
                this.insideLoop = true;
                this.script.loop();
            }catch(err){
                this.stop();
                misGUI.alert("Script Error :\n"+err);
            }            
            this.insideLoop = false;
        }
    }

    run(){
        console.log("--------");
        this.stop();
        this.saveSource(this.folder+this.currentName); //modified ?
        var code = misGUI.getScript();
        try{
            this.script = new Function(code); //"return 42  OK"
            this.script.call(this.script);    //construct, with good this
            //console.log("function?:",typeof(this.script.setup));

            this.wantstop = false;
            this.delayTime = 0;

            console.log("gene:",typeof(generator))

            /*
            this.sleep = function(ms){
                return new Promise(resolve=>{ setTimeout(resolve,ms)})
            }
            */

            this.script.delay = async function(ms){
                console.log("---- DELAY -----",ms);
                sleep(ms)
                console.log("---- DELAY END-----",ms);
                
                /* NO: this affect all node process !!!
                this.delayTime = Date.now();
                console.log("---- DELAY loop -----",ms,this.delayTime);
                while( (Date.now()-this.delayTime)<ms ){
                    if(this.wantstop){
                        throw { name:"stop",toString:function(){return "STOOOP!";}}
                    }
                }
                console.log("---- DELAY END -----");
                */
                /*
                throw { 
                    name:        "delay", 
                    level:       "Show Stopper", 
                    message:     "_"+ms, 
                    toString:    function(){return this.name + ": " + this.message;} 
                    //okay but how to resume
                  };
                */
            }


            if(typeof(this.script.setup == "function"))
                this.script.setup();
            this.play();
        }catch(err){
            misGUI.alert("Script Error :\n"+err);
            console.log("RUN ERROR")
            //this.logError(err);
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

    /*
    delay(ms){ 
        console.log("---- DELAY -----",ms);
        return new Promise(resolve  => {
            setTimeout(() => {
            resolve(2);
            }, ms);
        });
    }
    */

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

