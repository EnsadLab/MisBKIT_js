

/*
*   launch python script,
*     and exchange string messages
*     stdout  &  stdin
*     python3  print   &  input    
*/

var {PythonShell} = require('python-shell');

class PythonManager{
    constructor(){
        this.className = "pythonManager"
        this.scriptFile;
        this.arguments = "";
        this.forwards = ""; //Array ? object ?
        this.pyVersion = 'python' //{pythonPath:'python3'}
        this.pyshell;
        this._args = [];
    }

    init(){
        misGUI.initManagerFunctions(this,this.className);
    }

    //dont need id for now 
    cmd(func,id,val,param){
        console.log("pythonManager cmd:",func,id,val,param);
        if(this[func]!=undefined){
            this[func](val,param);    
        }        
    }

    getSettings(){
        console.log("python.getSettings:")
        return {
            python:this.pyVersion,
            scriptFile:this.scriptFile,
            arguments:this.arguments,
            forwards:this.forwards
        };
    }

    setSettings( obj ){
        this.close()
        if(obj.python != undefined) this.pyVersion = obj.python;
        if(obj.scriptFile != undefined) this.scriptFile = obj.scriptFile;
        if(obj.arguments != undefined) this.arguments = obj.arguments;
        if(obj.forwards != undefined) this.forwards = obj.forwards; //NO GUI?
        misGUI.showValue({class:this.className,func:"setPyVersion",val:this.pyVersion})
        misGUI.showValue({class:this.className,func:"scriptPath",val:this.scriptFile})
        this.argLine(obj.arguments) //split the text
    }

    argLine( str ){
        this.arguments = str
        if( (typeof(str)=='string')&&(str!="") )this._args = str.split(" ");
        else if(typeof(str)=='number')this._args = [str];
        else this._args = [];
        misGUI.showValue({class:this.className,func:"argLine",val:str})
    }

    uiLoad(){
        this.close();
        misGUI.openLoadDialog("Python to launch:",this.scriptFile,this.scriptPath.bind(this))
    }

    scriptPath( fullpath ){
        this.close()
        console.log("python:script:",fullpath)
        this.scriptFile = fullpath;
        misGUI.showValue({class:this.className,func:"scriptPath",val:this.scriptFile})
    }

    setPyVersion(str){
        this.pyVersion = str;  
    }

    onOff( onoff ){
        console.log("python:onOff:",onoff)
        if(onoff)this.open();
        else this.close();
    }

    send(str){
        if(this.pyshell){
            try{ this.pyshell.send(str) }
            catch(err){
                misGUI.alert("Python Error :\n"+err);
            }
        }
    }

    open(){ // connection syntax
        var self=this;
        this.close()
        try{
            console.log("new PythonShell")
            this.pyshell = new PythonShell(this.scriptFile,{
                pythonPath:this.pyVersion,
                pythonOptions: ['-u'], // get print results in real-time 
                args: this._args 
            },function(){
                console.log("python new callback ?")
            });
            this.pyshell.on("stderr",function(err){
                console.log("python.stderr:",err)
                self.close();
                misGUI.showValue({class:self.className,func:"onOff",val:"ERROR"})
                misGUI.alert("Python Error:\n"+err);
            })
            this.pyshell.on("close",function(){
                console.log("PYSHELL on close")
                misGUI.showValue({class:self.className,func:"onOff",val:false})
            })
            this.pyshell.on('message',function (msg) {
                //EXEC message :
                var rep = MBK.stringCmd(msg);
                if(rep != undefined)
                    self.send(""+rep)
                console.log("python msg:<"+msg+">rep:",rep);
            });
            misGUI.showValue({class:this.className,func:"onOff",val:true})
        }catch(err){
            misGUI.alert("Python Error :\n"+err);
            this.close();
            misGUI.showValue({class:this.className,func:"onOff",val:"ERROR"})
        }
    }

    close(){ // connection syntax
        if(this.pyshell){
            var self = this;
            try{ this.pyshell.send("bye\n"); }//should wait a little ? error at the end -> dont close
            catch(err){console.log("Python error before closing:",err)}
            this.pyshell.end(function (err,code,signal) {
                if(err){
                    console.log("pyshell end error:",err)
                    misGUI.alert("Python Error :\n"+err);
                    //self.pyshell.terminate(function(){
                    //    console.log("PYSHELL TERMINATED")
                    //})
                }
                console.log('python end code  :' + code);
                console.log('python end signal:' + signal);
              });
              this.pyshell = undefined;        
        }
        //immediat ... to allow an open true just after close
        misGUI.showValue({class:this.className,func:"onOff",val:false})
    } 

    //??? more simple than xxx.addlistener ???
    setForwards( str ){ //"dxlpos,sensors,midi,osc"
        this.forwards = str;
    }

    onDxlpos(arr){  //array ["dxlpos" + motor positions ]
        //from python you can use dxl.position(index) to get a motor's current position 
        if(this.forwards.indexOf("dxlpos")>=0){
            this.send("dxlpos "+arr.join(' '));
        }
    }

    onMidi(obj){ //{port:portID,midi:msg}
        if(this.forwards.indexOf("midi")>=0){
            this.send("midi "+obj.port+" "+msg[0]+" "+msg[1]+" "+msg[2]);
        }
    }

    //we could add a sensor output "Python" , with a custom name
    onSensor(name,val){  //array of motor positions
        if(this.forwards.indexOf("sensor")>=0){ //fit with 'sensors
            this.send("sensor "+name+" "+val);
        }
    }

    onOsc(addr,args){//addr string , args Array
        if(this.forwards.indexOf("osc")>=0){
            this.send("osc "+addr+" "+args.joint(' '));
        }
    }

    onKey( key ){
        if(this.forwards.indexOf("key")>=0){
            this.send("key "+key);
        }
    }

    //need anim ?

}
module.exports = new PythonManager()

