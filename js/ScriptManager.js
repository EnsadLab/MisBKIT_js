


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
        this.folder = undefined;
        this.currName = "example.js";
        this.script = {}; //current script

        this.current = 0;      //future multiscripts
        this.scriptNames = []; //future multiscripts
        //this.scripts = {}; //future multiscripts { id:{}, ... }

        this.frozen = false;
        this.defaultSce = "\n\nthis.setup = function(){\n}\n\n"
            +"this.loop = function(t){\n}\n";
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

    call(func,...args){ //rest operator -> Array
        //console.log("sriptManager:",func,args)
        if(this.script._running){
            if(typeof(this.script[func])=='function'){
                try{
                    return this.script[func](...args) //spread operator
                }catch(err){
                    if(err!="goto"){
                        if(err!="exit")
                            misGUI.alert("Script Error in "+func+"\n"+err);
                        this.stop();
                    }
                }
            }
        }
    }

    folderIsReady(folder){
        this.folder = folder
        if(this.currName == undefined){ //settings vide
            this.uiNew();
        } 
        else{
            var fn = this.folder+this.currName;
            this.currName=undefined; //prevent saving default script to this name
            console.log("***** SCRIPT FOLDER READY *****",this.folder,this.currName)
            this.loadSource(fn)
        }
        osc.send("glop?")
    }    
    
    setName(name){ //TODO multi
        if( name.indexOf('.')<0 ) //force .js ?
            this.currName = name+".js";
        else
            this.currName = name;            
        this.saveSource(); //if modified ?
    }

    getSettings(){ //TODO multi
        return {
            current:this.current,
            scripts:[this.currName]
        }
    }

    setSettings(obj){ //!!! this.folder MUST be set , 
        this.stop();
        if(obj){
            console.log("*** SCRIPT SETTINGS 1 ***",this.folder)
            this.current = obj.current;
            this.scriptNames = obj.scripts;
            this.currName = this.scriptNames[0]; //TODO multi
            console.log("***** SCRIPT SETTINGS 2*****",this.folder,this.currName)
            if(this.folder != undefined)
                this.loadSource(this.folder+this.currName);
        }
        else
            this.uiNew()
    }

    uiNew(){
        this.stop();
        this.saveSource();
        this.currName = "no_name.js"
        misGUI.showValue({class:this.className,func:"setName",val:this.currName});
        misGUI.setScript(this.defaultSce);
    }

    uiLoad(){ //Becoz folder
        this.stop();
        misGUI.openLoadDialog("Load script :",this.folder+this.currName,this.loadSource.bind(this))
    }
    loadSource( filePath ){
        console.log("LoadSource:",filePath)
        this.stop();
        //save current script if currName defined
        this.saveSource()

        if( filePath.startsWith(this.folder) ){
            // get currName from path ( if subfolder : name = subfolder/xxx.js )
            this.currName = filePath.substr(this.folder.length);
        }
        else { //another user directory ?
            var i = filePath.lastIndexOf('/')+1;
            if(i>1){
                this.currName = filePath.slice(i);
                //this.folder = filePath.slice(0,i); //back to settingsManager ?
                //save folder in settings ?
                //keep user folder --> will be saved there
            }//else ... what !?
        }
        var src = undefined;
        try{ src = fs.readFileSync( filePath , 'utf8'); }
        catch(err){} //file doesnt exist ( first MisKit launch )
        if(src != undefined){
            misGUI.showValue({class:this.className,func:"setName",val:this.currName});
            misGUI.setScript(src);
        }
    }

    uiSave(){
        misGUI.openSaveDialog("Save script",this.folder+this.currName,this.saveSource.bind(this));
    }
    saveSource( pathfile ){
        if(pathfile==undefined){ //save currnet editing
            if( (this.folder==undefined)||(this.currName==undefined) ){
                console.log("scriptManager not saving");
                return; //dont save
            }else
                pathfile = this.folder+this.currName;
        }
        console.log("scriptManager saving",pathfile);
        fs.writeFileSync( pathfile , misGUI.getScript() ); 
    }

    update(){ //called by MisBKIT.js
        if(this.script._running){
            this.script._update();
        }
    }

    runStop(run){
        if(run)this.run();
        else this.stop();        
    }

    run(){ //todo: gui unfreeze ?
        console.log("----RUN----");
        var self = this;
        this.stop();
        this.saveSource(); //modified ?

        var code = "const script = this;\n"
        //add local functions in script
        code += misGUI.getScript()
        code +="function timeout(d,func,arg){"
            +" script._xTimeout = d;"
            +" if(func != undefined)script._nextTask = func;"
            +" if(arg  != undefined)script._nextDuration = arg;}"
            +"function next(name,d){script._nextDuration=d; script._nextTask=name;}"
            +"function goto(task,d){next(task,d);throw('goto')}"
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
                //console.log("----NEXT TASK----",this._currTask,this._nextDuration)
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
                    this.last = ((this._xTimeout-dt)<45); //mmm 45 < ~50
                    var r = self.call(this._currTask,dt);
                    this.last = false;
                }
            }//update

            this.script.log = function(...args){
                var str= this._currTask+" : ";
                args.forEach(e=>{str+=" "+e});
                misGUI.showValue({class:"scriptManager",func:"log",val:str});
            }

            //construct script with own this
            misGUI.scriptOnOff(true);  
            this.script.call(this.script);
            this.script._running = true;
    
            if(this.script._running) // error may stop it
                this.call("setup");

            if(this.script._running) // error may stop it
                this.script.nextTask() //"loop"
            
        }catch(err){
            misGUI.alert("Script construct Error :\n"+err);
        }
    }

    stop(){
        if(this.script._running){
            this.call("onStop");
            this.script._running = false;
            this.script._prevTask = undefined;
            this.script._nextTask = undefined;
            misGUI.scriptOnOff(false);  //update buttons , ... and "freeze"
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

