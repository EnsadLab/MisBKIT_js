


dxl    = require("./DxlManager.js"); //dxl.foo() = dxlManager.foo()
anim   = require("./AnimManager.js");
sensor = require("./SensorManager.js");
midi   = require("./MidiPortManager.js")
osc    = require("./OscManager.js") //tochange osc global
ui     = require("./MisGUI.js");



/*
function scriptSleep(delay,arg){
    return new Promise(resolve=>{setTimeout(()=>{resolve(arg)},delay)})
}
*/
  

//TODO multiple scripts (GUI)
class scriptManager {
    constructor(){
        this.className = "scriptManager";
        this.folder = "";
        this.current = 0; //future multiscripts
        this.scriptNames = ["example.js"]; //future multiscripts
        this.frozen = false;
        //this.scripts = {}; //future multiscripts { id:{}, ... }
        //--------------

        this.script = {};
        this.pauseTimer  = undefined;
        this.nextTask    = undefined;
    }
    
    init(){
        console.log("scriptManager init")
        misGUI.initManagerFunctions(this,this.className);
    }

    // id useless with monoscript 
    cmd(func,id,val,param){
        //console.log("scriptManager cmd:",func,id,val,param);
        if(this[func]!=undefined){
            this[func](val,param);    
        }
    }

    call(func,arg){
        //console.log("sriptManager:",func,arg)
        if(this.script._running){
            if(typeof(this.script[func])=='function'){
                try{
                    return this.script[func](arg)
                }catch(err){
                    if(err!="exit")
                        misGUI.alert("Script Error in "+func+"\n"+err);
                    this.stop();
                }
            }
        }
    }

    folderIsReady(folder){
        this.folder = folder
        this.loadSource(this.folder+this.scriptNames[this.current])
    }    
    
    setName(name){
        if( name.indexOf('.')<0 ) //force .js ?
            this.scriptNames[0] = name+".js";
        else
            this.scriptNames[0] = name;            
        this.saveSource(this.folder+this.scriptNames[0]); //modified ?
    }

    getSettings(){
        return {
            current:this.current,
            scripts:this.scriptNames
        }
    }

    setSettings(obj){ //!!! this.folder MUST be set , 
        this.stop();
        if(obj){
            this.current = obj.current;
            this.scriptNames = obj.scripts;
            //!!! folder is not ready
            //this.loadSource(this.folder+this.scriptNames[this.current]);
        }
    }

    uiNew(){
        this.stop();
        this.saveSource( this.folder+this.scriptNames[0] )
        this.scriptNames[0] = "no_name.js"
        misGUI.showValue({class:this.className,func:"setName",val:this.scriptNames[0]});
        misGUI.setScript("");
    }

    uiLoad(){ //Becoz folder
        this.stop();
        misGUI.openLoadDialog("Load script :",this.folder+this.scriptNames[0],this.loadSource.bind(this))
    }
    loadSource( filePath ){
        console.log("LoadSource:",filePath)
        this.stop();
        this.saveSource( this.folder+this.scriptNames[0] )

        var i = filePath.lastIndexOf('/')+1;
        if(i>1){
            this.scriptNames[0] = filePath.slice(i);
            this.folder = filePath.slice(0,i); //back to settingsManager ?
            //save folder in settings ?
        }
        //else ... what !?

        var code = fs.readFileSync( filePath , 'utf8');
        if(code != undefined){
            misGUI.showValue({class:this.className,func:"setName",val:this.scriptNames[0]});
            misGUI.setScript(code);
        }
    }

    uiSave(){
        misGUI.openSaveDialog("Save script",this.folder+this.scriptNames[0],this.saveSource.bind(this));
    }
    saveSource( pathfile ){
        console.log("scriptManager saving",pathfile);
        if(pathfile!=undefined){
            var src = misGUI.getScript();
            fs.writeFileSync( pathfile , src ); 
        }
    }

    update(){ //called by MisBKIT.js
        if(this.script._running)
            this.script._update();
    }

    run(){ //todo: gui unfreeze ?
        console.log("----RUN----");
        var self = this;
        this.stop();
        this.saveSource(this.folder+this.scriptNames[0]); //modified ?

        var code = "const script = this;\n"
        //add local functions in script
        code += misGUI.getScript()
        code +="function timeout(d,func,arg){"
            + " script._xTimeout = d;"
            +" if(func != undefined)script._nextTask = func;"
            +" if(arg  != undefined)script._nextDuration = arg;}"
            +"function next(name,d){"
            +" script._nextDuration = d;"
            +" script._nextTask = name;}"
            +"function start(name,d){"
            +" script._xTimeout = 0;"
            +" script._nextDuration = d;"
            +" script._nextTask = name;}"
            +"function exit(){throw('exit')}"
                    
        try{
            this.script = new Function(code);
            this.script.first = false;
            this.script.last  = false; 
            this.script._prevTask = undefined;
            this.script._currTask = "loop"
            this.script._nextDuration  = undefined;
            this.script._xTime = 0
            this.script._xTimeout = undefined;

            this.script.nextTask = function(){
                console.log("----NEXT TASK----",this._currTask,this._nextDuration)
                // next duration if set with next() or timeout()
                this._xTimeout=this._nextDuration
                this._nextDuration=undefined
                //task_init if exist
                self.call(this._currTask+"_init")
            
                this._prevTask = "loop"; //??? default ???
                this.first = true;
                this._xTime = Date.now();
                self.call(this._currTask,0);
                this.first = false;
                this.log("")
            }

            this.script._update = function(){
                if(!this._running)
                    return;
                var dt  = Date.now()-this._xTime;
                if( dt>=this._xTimeout ){ //false if timeout=undefined
                    var curr = this._currTask;

                    //task_end if exist
                    self.call(curr+"_end")

                    if(this._nextTask == undefined){
                        //return to 'caller' if next is not set
                        //this._currTask = this._prevTask; //'pop' return to caller
                        this._currTask = "loop";
                    }
                    else{ 
                        this._currTask = this._nextTask;
                        this._nextTask = undefined
                    }
                    this.nextTask();
                }
                else{
                    if( (this._xTimeout-dt)<45 ) //mmmm
                        this.last = true;

                    var r = self.call(this._currTask,dt);
                    this.last = false;
                }
            }//update

            this.script.log = function(...args){
                var str= this._currTask+" : ";
                args.forEach(e=>{str+=" "+e});
                misGUI.showValue({class:"scriptManager",func:"log",val:str});
            }

            //construt script with own this
            console.log("======== CONSTRUCT ========")
            misGUI.scriptOnOff(true);  
            this.script.call(this.script);
            this.script._running = true;
    
            if(this.script._running) // error may stop it
                this.call("setup");

            if(this.script._running) // error may stop it
                this.script.nextTask() //"loop"
            
        }catch(err){
            misGUI.alert("Script Error :\n"+err);
        }
    }

    stop(){
        if(this.script._running){
            this.call("stop");
            this.script._running = false;
            this.script._prevTask = undefined;
            this.script._nextTask = undefined;
            misGUI.scriptOnOff(false);  //update buttons , ... and "freeze"
            console.log("scriptManager stopped");
        }
    }

    freeze(onoff){ //!!! false->run  , true->stop
        console.log("ScriptManager:onFreeze",onoff)
        if(onoff)
            this.stop()
        else //if(this.frozen)
            this.run()
        this.frozen = onoff;
    }

    /*
    delay(ms){ //needs async/await ...
        console.log("---- DELAY -----",ms);
        return new Promise(resolve  => {
            setTimeout(() => {
            resolve(2);
            }, ms);
        });
    }
    */

    
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
}
module.exports = new scriptManager();

