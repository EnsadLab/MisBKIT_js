


dxl    = require("./DxlManager.js"); //dxl.foo() = dxlManager.foo()
anim   = require("./AnimManager.js");
sensor = require("./SensorManager.js");
midi   = require("./MidiPortManager.js")
//osc    = require("./OscManager.js") //tochange osc global
ui     = require("./MisGUI.js");


/*
function scriptSleep(delay,arg){
    return new Promise(resolve=>{setTimeout(()=>{resolve(arg)},delay)})
}
*/
  

//TODO multiple scripts
class scriptManager {
    constructor(){
        this.className = "scriptManager";
        this.folder = "";
        this.current = 0; //future multiscripts
        this.scriptNames = ["example.js"]; //future multiscripts
        this.frozen = false;
        //this.scripts = []; //future multiscripts
        //--------------

        this.script = undefined;
        this.pauseTimer  = undefined;
        this.nextTask    = undefined;
    }
    
    init(){
        console.log("scriptManager init")
        misGUI.initManagerFunctions(this,this.className);
    }

    cmd(func,id,val,param){
        console.log("scriptManager cmd:",func,id,val,param);
        if(this[func]!=undefined){
            this[func](val,param);    
        }
    }

    call(func,arg){
        //test if running?
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

    onkey(arg){
        console.log("scriptOnKey:",arg)
    }

    folderIsReady(folder){
        this.folder = folder
        this.loadSettings()
        this.loadSource(this.folder+this.scriptNames[0])
    }    
    
    setName(name){
        if( name.indexOf('.')<0 ) //force .js ?
            this.scriptNames[0] = name+".js";
        else
            this.scriptNames[0] = name;            
        this.saveSource(this.folder+this.scriptNames[0]); //modified ?
    }

    saveSettings(){
        var json = JSON.stringify({
            current:this.current,
            scripts:this.scriptNames
        },null,2);
        settingsManager.saveToConfigurationFolder("scripts.json",json);
    }
    loadSettings(){
        var json=settingsManager.loadConfiguration("scripts.json");
        try{
            var s = JSON.parse(json);
            this.current = s.current;
            this.scriptNames = s.scripts;
            misGUI.showValue({class:this.className,func:"setName",val:this.scriptNames[0]});
        }catch(err){}
    }

    uiLoad(){ //Becoz folder
        this.stop();
        misGUI.openLoadDialog("Load script :",this.folder+this.scriptNames[0],this.loadSource.bind(this))
    }
    loadSource( filePath ){
        console.log("LoadSource:",filePath)
        this.stop();
        var i = filePath.lastIndexOf('/')+1;
        if(i>1){
            this.scriptNames[0] = filePath.slice(i);
            this.folder = filePath.slice(0,i); //back to setting Manager ?
            this.saveSettings();
        }
        //else ... what !?

        var code = fs.readFileSync( filePath , 'utf8');
        if(code != undefined){
            //fs.writeFileSync(this.folder+"settings.json",JSON.stringify(s,null,2) ); 
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
            var code = misGUI.getScript();
            fs.writeFileSync( pathfile , code ); 
        }
    }

    update(){ //called by MisBKIT.js
        if(this.script==undefined)
            return;

        this.script._update();
        /*
        try{
            this.script._update();
        }catch(err){
            var str=err.toString();
            if(str=="pause"){
                console.log("WANTPAUSE");
            }
            else if(str.startsWith("task")){
                console.log("TASK",err);
            }else{
                this.stop();
                misGUI.alert("Script Error :\n"+err);
            }
           misGUI.alert("Script Error :\n"+err);
        }
        */
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
            this.script._prevTask = undefined;
            this.script._currTask = "loop"
            this.script._nextDuration  = undefined;
            this.script._xTime = 0
            this.script._xTimeout = undefined;

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

                    this._xTime = Date.now();

                    // next duration if set with next() or timeout()
                    this._xTimeout=this._nextDuration
                    this._nextDuration=undefined

                    //task_init if exist
                    self.call(this._currTask+"_init")
                    
                    //default "nextTask" = 'caller'
                    console.log("prev=",curr)
                    this._prevTask = curr;
                    dt = 0; //for comming call
                }

                //call task
                var r = self.call(this._currTask,dt);
                if(typeof(r)=='string'){
                    this._nextTask = r;
                    this.script._xTimeout = 0;
                }
            }//update

            //construt script with own this
            this.script.call(this.script);

            //call setup()
            this.call("setup");

            this.play();
            
        }catch(err){
            misGUI.alert("Script Error :\n"+err);
            console.log("RUN ERROR")
        }
    }

    play(){ //TODO : unfreeze ?
        console.log("PLAY:")
        if(this.script){
            this.script._xTime = Date.now();
            this.script._running = true;
        }
    }

    stop(){
        if(this.script){
            this.call("stop");
            this.script._running = false;
            this.script._prevTask = undefined;
            this.script._nextTask = undefined;
        }
        //misGUI.stopScript();  //update buttons ??? 
        //stopCode(); //??? --> les boutons ne se transforment plus ?????? 
        console.log("scriptManager stopped");
    }

    onFreeze(onoff){ //TODO GUI
        if(onoff)
            this.stop()
        else if(this.frozen)
            this.run()
        this.frozen = onoff;
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
scriptManager  = new scriptManager();
module.exports = scriptManager;
