

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
        this.pyshell;
        this.pyVersion = 'python3' //{pythonPath:'python3'}
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
            scriptFile:this.scriptFile
        };
    }
    setSettings( obj ){
        this.close()
        if(obj.python != undefined)
            this.pyVersion = obj.python
        if(obj.scriptFile != undefined)
            this.scriptFile = obj.scriptFile
        console.log("python settings:",this)
        misGUI.showValue({class:this.className,func:"scriptPath",val:this.scriptFile})
    }

    scriptPath( fullpath ){
        this.close()
        console.log("python:script:",fullpath)
        this.scriptFile = fullpath;
    }

    onOff( onoff ){
        console.log("python:onOff:",onoff)
        if(onoff)this.open();
        else this.close();
    }

    open(){ // connection syntax
        var self=this;
        this.close()
        try{
            console.log("new PythonShell")
            this.pyshell = new PythonShell(this.scriptFile,{
                pythonPath:this.pyVersion,
                pythonOptions: ['-u'], // get print results in real-time    
            },function(){
                console.log("python new callback ?")
            });
            console.log("on PythonShell")
            this.pyshell.on("stderr",function(err){
                console.log("python.stderr:",err)
                self.close();
                misGUI.showValue({class:self.className,func:"onOff",val:"ERROR"})
            })
            this.pyshell.on('message',function (msg) {
                console.log("python msg:",msg);
                //TODO exec message
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
            this.pyshell.send("bye bye"); //should wait a little
            this.pyshell.end(function (err,code,signal) {
                if(err){
                    console.log("pyshell end error:",err)
                    misGUI.alert("Python Error :\n"+err);
                }
                console.log('python end code  :' + code);
                console.log('python end signal:' + signal);
              });
              this.pyshell = undefined;        
        }
        //immediat ... to allow an open true just after close
        misGUI.showValue({class:this.className,func:"onOff",val:false})
    } 



}
module.exports = new PythonManager()

