

function MisGUI(){
    var self = this;
    this.rotAngles = {};
    this.rotSpeeds = {};
    this.recording = false;

    this.dxlEditId = 0;

    $( "#dialog" ).dialog( "close" );

    // not used right now.. leave it in case we want to re-add the scan button
    $('#btMidi').on('click',function(){
        self.scanMidiPorts();
    });

    $('#btmidi').on('click',function(){
        midiPortManager.enabled = this.checked;
        //console.log("*** btmidi", midiPortManager.enabled);
    });

    $('#btcm9').on('click',function(){
        //console.log("btcm9 click",this.checked);
        //var cl = $(this).prop("class");
        if(this.checked){
            cm9Com.open();
            //$(this).prop("class","stopAll").text("OFF");
        }
        else {
            cm9Com.close();
            //$(this).prop("class","connected").text("ON");
        }
    });

    $('#numCm9').on('change',function(){
        console.log("CM9 changed",this.value);
        //$('#btcm9').prop("class","disconnected").text("OFF");
        $('#btcm9').prop("checked",false);
        var v = cm9Com.changeCm9(+this.value);
        this.value=v;
    });

    /* TODELETE
    var inputs = $("#divDxlReg :input");
    inputs.change(function(toto){
        var id = $("#btAdvID").val();
        var addr = +this.name;
        var val  = +this.value;
        console.log("inputs.change:",id,addr," ",val);
        if(addr == 3){
            dxlEditId = val;
            console.log("dxlEditId",val);
        }
        else
            dxlManager.dxlWrite(id,addr,val);
    });

    inputs.keypress(function(e){
        console.log("inputs.keypress<", e.which);
        console.log("inputs.keypress:",this.id,this.name," ",this.value);
        if(e.which==13){
            //$(this).trigger("change");
            $(this).change();
        }
    });
    //inputs.focusout(function(toto){
    //    console.log("inputs.focusout:",this.name," ",this.value);
    //});
    */


}; //MisGUI

//generalisation de MisGUI_sensors
MisGUI.prototype.radioActivate = function(selector,eltid){
    console.log("MisGUI.radioActivate ",selector,eltid);
    $(selector).removeClass("activ");
    if(eltid != undefined)
        $(selector).filter("[eltID="+ eltid + "]").addClass("activ");
}

MisGUI.prototype.radioHide = function(selector,eltid){
    console.log("MisGUI.radioHide ",selector,eltid);
    $(selector).hide();
    $(selector).filter("[eltID="+ eltid + "]").show();
}


/*
  ex: cloneElement(".single-gizmo",42);
  ex: cloneElement(".single-gizmo","giz42","giz41");
  ex: cloneElement(".single-gizmo");
  @param eltID: the parameter eltID of the new cloned element
  @param afterID: when given, the new cloned element will be inserted after the element with the given afterID
 */
MisGUI.prototype.cloneElement = function(selector,eltID,afterID){ //eltID may be a string
    var model = $(selector).first();      //model MUST be first ---> insertAfter
    if(model.length>0){
        //console.log("CLONE:manager:",model.data("manager"));
        var clone = model.clone(true);
        /*inutile?
        if(clone.data("manager")==undefined){
            console.log("CLONE:copy manager:");
            clone.data("manager",model.data("manager"));
            clone.find("*").data("manager",model.data("manager")); //was undefined ?
        }
        */
        if(eltID != undefined){           //set eltID to all clone elts
            clone.attr("eltID",eltID);
            clone.find("*").attr("eltID",eltID);
        }
        if(afterID != undefined){
            var after = $(selector).filter("[eltID="+afterID+"]");
            //console.log("clone after:",after);
            if(after.length>0)
                clone.insertAfter(after);
            else
                clone.insertAfter(model);            
        }
        else
            clone.insertAfter(model);
        clone.show();
        return clone;
    }
}

/*
  ex: removeElement(".single-gizmo","giz42");
*/
MisGUI.prototype.removeElement = function(selector,eltID){
    var elt = $(selector);
    if(eltID != undefined){
        elt = elt.filter("[eltID="+eltID+"]"); //.first(); ALL?
    }
    console.log("MisGUI.removing:",elt);
    elt.remove();  
}

MisGUI.prototype.hideElement = function(selector,eltID){
    var elt = $(selector);
    if(eltID != undefined){
        elt = elt.filter("[eltID="+eltID+"]"); //.first(); ALL?
    }
    console.log("MisGUI.hiding:",elt);
    elt.hide();  
}


/*
ex: html : <div class="myManager">
             <input func="myfunc" ...>
           </div>
    
    initGUIfunction( myManager, "myManager");

    -> manager.cmd(func,eltID,value);

    ex:
    myManager.prototype.cmd = function(func,eltID,value){
        if( this[func]{
            if( eltID == undefined )
                this[func](value);
            else
                this[func](eltID,value);
        }
    }

    className is for use with   setManagerValue() below

*/
MisGUI.prototype.initManagerFunctions = function(manager,className){
    var parents = $("."+className);
    console.log("GUI_MANAGER:",className,parents.length)

    parents.find("*").each(function(i) {
        var func = $(this).attr("func");
        $(this).data("manager",manager); //inutile ? keep manager ?
        //console.log("GUI_MANAGER:",className,func)
        if(func){
            //console.log("INIT:",$(this).prop("tagName"),$(this).prop("type"));

            //TODO ??? click on <p> , <span> , <textarea> ...
            //console.log("INIT:",$(this).prop("manager"),$(this).attr("func"),$(this).prop("type"));

            //$(this).prop("manager",manager); //inutile ? keep manager ?
            switch($(this).prop("type")){
                case "text":
                case "number":
                    $(this).on("keypress",function(e){
                        if(e.keyCode==13){ //trigger change when enter even if not modified
                            //console.log("ENTER:",$(this).data("prevval"),$(this).val());
                            $(this).trigger("change");
                            return false; //but will trhrow change when focus
                        }                            
                    });
                case "select-one": //select
                    //console.log("***",$(this)); 
                    $(this).on("change",function(){
                        console.log("INPUTCHANGE:",manager);
                        //console.log("INPUTCHANGE:",$(this).data("prevval"),$(this).val());
                        //console.log("FUNCCHANGE:",$(this).attr("eltID"),$(this).attr("param"));
                        //$(this).prop("manager").cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());                            
                        // CEC: !!!!! Prob avec prop("manager").. pas bien stocké dans la balise
                        //$(this).prop("manager").cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());                           
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val(),$(this).attr("param"));
                        //$(this).data("prevval",$(this).val());

                    });
                    //console.log($("function",this.val));
                    break;
                case "checkbox":
                    $(this).on("change",function(){
                        console.log("========manager:chk:", $(this).attr("false"),$(this).attr("true"));
                        //DB: TODO attr ou data  ["joint","wheel"] or something like ...
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).prop("checked"),$(this).attr("param"));
                    });
                    break;
                case "submit":  //button
                    $(this).on("click",function(){
                        console.log("button",$(this).attr("func"),manager);
                        // TEST pour le startRecord ds les anims.. j'ai rajouté l'attribut value
                        var v = $(this).attr("value"); // "true","false" --- ou plutôt 0,1 ?? .. et ptet pas utiliser l'arg value...
                        var vstring = "true";
                        if(v == "true") vstring = "false";
                        $(this).attr("value",vstring);
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),true,$(this).attr("param")); //value? param? ... à discuter                           
                        //manager.cmd($(this).attr("func"),$(this).attr("eltID"),vstring,$(this).attr("param")); //value? param? ... à discuter                           
                    });
                    break;
                default:
                    console.log("initManagerFunctions: UNHANDLED:",$(this).prop("tagName"),$(this).prop("type"),func);    
                break   
            }
        }
    });
}

MisGUI.prototype.setEltID=function(classname,id){
    console.log("setEltID:",classname,$("."+classname).find("*").length);

    $("."+classname).find("*").attr("eltID",id);
}

MisGUI.prototype.changeSettings = function(className,func,params,eltID){
    for( var p in params ){
        this.setManagerValue(className,func,params[p],eltID,p);//class func val id param
    }
}

//opt: {class:classname,id:eltID,func:func,param:param,val:value}
MisGUI.prototype.showValue=function(opt){
    //console.log("showValue:",opt);
    var sel = "."+opt.class+" ";
    if(opt.id!=undefined)sel+="[eltID="+opt.id+"]";
    if(opt.func!=undefined)sel+="[func="+opt.func+"]";
    if(opt.param!=undefined)sel+="[param="+opt.param+"]";
    var elts = $(sel);
    if(elts.length > 0){
        this.setElementValue(elts,opt.val);
    }
    else console.log("*****GUIVALUE NOT FOUND:",sel);
}

//opt: {class:classname,id:eltID,func:func,val:settings}
MisGUI.prototype.showParams=function(opt){
    var sel = "."+opt.class+" ";
    if(opt.id!=undefined)sel+="[eltID="+opt.id+"]";
    if(opt.func!=undefined)sel+="[func="+opt.func+"]";
    var elts = $(sel);
    if(elts.length > 0){
        for( p in opt.val ){
            var e = elts.filter("[param="+p+"]");
            if(e.length>0){
                this.setElementValue(e,opt.val[p]);
            }
            else console.log("showParam:notfound",p);
        }
    }
    else console.log("*****GUIPARAMS NOT FOUND:",sel);
}


//old implementation , for compatibility.  ---> showValue
MisGUI.prototype.setManagerValue = function( className , func , value , eltID, param){   
    var sel = "."+className+" ";
    if(eltID)sel+="[eltID="+eltID+"]";
    if(func)sel+="[func="+func+"]";
    if(param)sel+="[param="+param+"]";
    var elt = $(sel);
    if(elt.length > 0){
        this.setElementValue(elt,value);
    }
    //else console.log("***** GUIVALUE NOT FOUND:",sel);
}

MisGUI.prototype.setElementValue = function(elt,value){
    var self = this;
    elt.each(function(i){ //mutiples elements may handle same value
        var e =$(this);
        switch(e.prop("tagName")){
            case "INPUT":
                switch( e.prop("type") ){
                    case "text":
                    case "number":
                        e.val(value);
                    break;
                case "checkbox":
                    //console.log("CHECKBOX",value);
                    if(e.is(".onoff")) self.onoffState(e,value); //ON , OFF , ERROR
                    else e.prop("checked",value);    
                    break;
                default:
                    console.log("GUIvalue: not handled: INPUT:",func,e.prop("type"));
                }
                break;
            case "SELECT":
                if(Array.isArray(value)){ //fill options with value(s)
                //console.log("select:values[]:"); //,value);
                    e.each(function(i) {  //value != for each ones
                        var prev = $(this).val();
                        //console.log("select:prev:",prev);
                        $(this).empty();
                        for(var i=0;i<value.length;i++){
                            if(value[i].length>0)
                                $(this).append($("<option value=" + "'" + value[i] + "'>" + value[i] + "</option>"));
                        }
                        if( (prev==null)||(prev=="default") ){
                            $(this).val(value[0]);
                            $(this).trigger("change");
                        }
                        else{
                            $(this).val(prev);
                        }
                    });
                }
                else{
                    if($(this).find("option[value='"+value+"']").length>0)e.val(value);
                    else e.prop("selectedIndex", 0); //select first option par defaut
                }
                break;            
            case "P":
            case "SPAN":
            case "TEXTAREA":
            case "DIV":
                e.text(value); // elt.html(value); //TO DISCUSS
                break;
            default:
                console.log("GUIvalue: type?:",func,param,elt.prop("tagName"),e.prop("type"),elt);
        }//switch prop
    });//each elt
    
    /*
    //console.log("MngValue:",elt.prop("tagName"),elt.prop("type"));
    if(elt.is("p")||elt.is("span")||elt.is("textarea")){
        elt.text(value); // elt.html(value); //TO DISCUSS 
    }
    else{ //input select ...
        switch(elt.prop("type")){
            case "select-one":
                if(Array.isArray(value)){ //fill options with value(s)
                    console.log("select:values[:",value);
                    elt.each(function(i) {  //value != for each ones
                        var prev = $(this).val();
                        console.log("select:prev:",prev);
                        $(this).empty();
                        for(var i=0;i<value.length;i++){
                            if(value[i].length>0)
                                $(this).append($("<option value=" + "'" + value[i] + "'>" + value[i] + "</option>"));
                        }
                        if(prev!=null){
                            $(this).val(prev);
                        //else $(this).val(value[0]);
                            $(this).trigger("change");
                        }
                    });
                }
                else{
                    elt.val(value);            }
                break;
            case "text":
            case "number":
                elt.val(value);
                break;
            case "checkbox":
                if(elt.is(".onoff")) this.onoffState(elt,value); //ON , OFF , ERROR
                else elt.prop("checked",value);    
                break;
            default:
                console.log("GUIvalue:type unhandled:",func,elt.prop("type"));
        }
    }
    */
}

/*
  <input type="checkbox" func="xxx" class="onoff"> 
  onoffState( $(this),"ERROR");
*/
MisGUI.prototype.onoffState = function( dolzis , state){
    console.log("MisGUI.prototype.checkState",state);
    switch(state){
        case false:
        case "OFF":
        case 0:
            dolzis.prop("checked",false);
            dolzis.removeClass("error");
            break;            
        case true:
        case "ON":
        case 1:
            dolzis.removeClass("error");
            dolzis.prop("checked",true);
            break;
        case "ERROR":
            console.log("MisGUI.prototype.onoffState ERROR");
        case 3:
            dolzis.addClass("error");
            dolzis.prop("checked",false);
            break;
    }
}

MisGUI.prototype.cmd = function(cmd,index,args) {
    console.log("gui command: ",index," cmd:",cmd," arg:",args);
    if(this[cmd]){
        this[cmd](index,args);
    }
}

/*
MisGUI.prototype.openOSC = function(remoteAddr,remotePort) {
    dxlManager.openOSC(remoteAddr,remotePort);
};
*/

MisGUI.prototype.cm9State=function(state){
    console.log("??????????? DELETE ???????????? MisGUI.prototype.cm9State",state);
    var bt = $("#btcm9");
    switch(state){
        case "ON":
        case true:
            bt.removeClass("error");
            bt.prop("checked",true);
            break;
        case "ERROR":
            bt.addClass("error");
            bt.prop("checked",false);
            this.cm9Info("ERROR");
            break;
        case "OFF":
        case false:
            bt.prop("checked",false);
            this.cm9Info("");
            break;            
    }

    /*
    if(state=='OFF'){
        //console.log("MisGUI.prototype.cm9State OFF?",state);
        //bt.prop("class","disconnected").text("OFF");
        bt.prop("checked",false);
        this.cm9Info("");
    }
    else if(state=='ON')
        //bt.prop("class", "connected").text("ON");
        bt.prop("checked",true);
    else{
        //bt.prop("class", "error").text("ERROR");
        bt.prop("checked",false);
        this.cm9Info("error");        
    }
    bt.prop('disabled',false);
    //this.blockUI(false);
    */
}

MisGUI.prototype.cm9Info=function(txt){
    $("#cm9Text").html(txt);
}
    

/*
MisGUI.prototype.midiPort = function(name) {
    $('#selectMidi').val(name);
    var bt = $("#btMidi");
};
*/

// TODO: what was the use of this?
MisGUI.prototype.midiPortManager = function(name) {
    $('#selectMidi').val(name);
    var bt = $("#btMidi");
};

MisGUI.prototype.dxlID =function(index,val) {
    console.log("**************MisGUI.dxlID:", val);
    //this.getMotorUI(index).find(".identity").text(+val);
    this.getMotorStg(index).find("[param=dxlID]").val(+val); //name ou func ? param ?
}

//DELETED MisGUI.prototype.clockwise =function(index,val)

MisGUI.prototype.angleMin =function(index,val){
    //dxlManager.cmdOld("angleMin",index,+val);
    if(this.rotAngles[index]){
    this.rotAngles[index]
        .setDomain(+val)
        .setRange(+val)
        .setMinMax(+val);
    }
}
MisGUI.prototype.angleMax =function(index,val){
    //dxlManager.cmdOld("angleMax",index,val);
    if(this.rotAngles[index]){
        this.rotAngles[index]
        .setDomain(undefined,+val)
        .setRange(undefined,+val)
        .setMinMax(undefined,+val);
    }
}
MisGUI.prototype.speedMin =function(index,val){
    val=+val;
    dxlManager.cmd("speedMin",index,val);
    if(this.rotSpeeds[index]){
        this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(val,undefined)
        .setMinMax(val);
    }
    //console.log("gui-SPEEDMIN:",val);
}
MisGUI.prototype.speedMax =function(index,val){
    //console.log("GUI.speedMax",val);
    val=+val;
    dxlManager.cmd("speedMax",index,val);
    if(this.rotSpeeds[index]){
        this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(undefined,val)
        .setMinMax(undefined,val);
    }
    //console.log("gui-SPEEDMAX:",val);
}

// >>>> dxlManager.midiMapping(EltID,value,"mode")
MisGUI.prototype.midiMode =function(index,value){
    console.log("SETMIDIMODE:",index," val",value);
    /*
    switch(+value){
        case 0:motorMappingManager.setMidiMotorMappingCmd(index,"CC");break;
        case 1:motorMappingManager.setMidiMotorMappingCmd(index,"note");break;
    }
    */
}

MisGUI.prototype.motorMode =function(index,value){
    //console.log("************ MisGUI.mode:",index,value);
    if(this.rotSpeeds[index]){
        switch(value){
            case false: case 0: case "J": case "joint":
                //this.joint(index);
                this.rotSpeeds[index].show(false);
                this.rotAngles[index].show(true);
                break;
            case true: case 1: case "W": case "wheel": case -1://off mode
                //this.wheel(index);
                this.rotAngles[index].show(false);
                this.rotSpeeds[index].show(true);
                this.rotSpeeds[index].setValue(0);
                this.motorSpeed(index,0);            
                break;
        }
    }
}

MisGUI.prototype.onRotary = function(val,rot){
    //console.log("ONROTARY:")
    var i=rot.userData.i;    
    dxlManager.cmd(rot.userData.f,i,val); //"angle" "speed"
    //this.inputVals.eq(i).val(val.toFixed(1));
    
    //var numrot = 
    $("#divMotors .num_rotary").filter("[eltID="+i+"]").val(val.toFixed(1));
    //console.log("onrotary:numrot",numrot);
};

MisGUI.prototype.setCM9Num = function(n){
    //console.log("misGUI.setCM9Num:",n);
    if(n==0){
        $('#numCm9').hide();    
    }
    else{
        $('#numCm9').val(n);
        $('#numCm9').show();
        //$('#btcm9').prop("checked",false);
    }
}

MisGUI.prototype.setValue = function(index,name,val){
    var div = $("#dxlConfig .motorParam").eq(index);
    div.find("input[name="+name+"]").val(val);
}

MisGUI.prototype.motorAngle = function(index,val){
    //console.log("MisGUI.prototype.angle",index,val);

    //if(index<this.rotAngles.length){
    if(this.rotAngles[index]){
        var v = this.rotAngles[index].setValue(+val).value;
        //this.inputVals.eq(index).val(v.toFixed(1));
        $("#divMotors .num_rotary").filter("[eltID="+index+"]").val(v.toFixed(1));

        //console.log("misguiAngle:",val,v);

        
        // SIMULATION FROM MOTOR MAPPING TO SENSOR sans le moteur avec index 2 allumé.
        // TEST -> donc à gicler quand on en a plus besoin.
        // pour tester le BUG observé par Filipe concernant le motor mapping to.
        /*
        if(index == 2){
            console.log("fake mapping to sensor");
            sensorManager.handleDxlPos(2,Math.random());
        }*/
    }
}

MisGUI.prototype.motorSpeed = function(index,val){ //[-100,100]
    if(this.rotSpeeds[+index]){
        var v = this.rotSpeeds[+index].setValue(+val).value;
        $("#divMotors .num_rotary").filter("[eltID="+index+"]").val(v.toFixed(1));
    }
}

MisGUI.prototype.needle = function(index,val){
    if(this.rotAngles[index]){
        this.rotAngles[index].setNeedle(+val);
        this.rotSpeeds[index].setNeedle(+val);
    }
}

MisGUI.prototype.getMotorUI = function(index){
    return $("#divMotors .single-motor").filter("[eltID="+index+"]");
}
MisGUI.prototype.getMotorStg = function(index){
    //return $("#divMotorSettings .single-motor").eq(index);
    return $("#divMotorSettings .single-motor").filter("[eltID="+index+"]");
}

//DELETED MisGUI.prototype.changeDxlID=function(index,val){

MisGUI.prototype.alert = function(msg){
    var bt = dialog.showMessageBox({
        type:"error",
        message:msg, //OSX
        title:msg,   //others
        buttons:["Ok"]
    });
}


MisGUI.prototype.toggleAdvanced = function(onoff){ //true='normal' false='advanced'
    console.log("******************** MisGUI.prototype.toggleAdvanced",onoff);
    //DB: should stop or freeze motors anims sensors ???
}

MisGUI.prototype.addMotor = function(index,settings){
    //TODO check if index already exists

    //console.log("MisGUI.addMotor",index);
    var cl1 = this.cloneElement("#divMotors .single-motor",index,index-1);
    var cl2 = this.cloneElement("#divMotorSettings .single-motor",index,index-1);



    var svgAngles = cl1.find(".rotAngle").first();
    var svgSpeeds = cl1.find(".rotSpeed").first();    
    //prevent scrolling with mousewheel
    svgAngles.on("mousewheel",function(e){e.preventDefault();});
    svgSpeeds.on("mousewheel",function(e){e.preventDefault();});

    svgAngles.show(); svgSpeeds.hide();//>>>boundrect ok
    var slidopt  = {x:0,y:0};
    var rota = new DUI.Rotary(svgAngles[0],slidopt);
    rota.setDomain(-150,150).setRange(-150,150).setMinMax(-150,150);
    rota.userData = {i:index,f:"angle"};
    rota.callback = this.onRotary.bind(this);
    this.rotAngles[index]=rota;

    svgAngles.hide(); svgSpeeds.show(); //>>>boundrect ok
    var rots = new DUI.Rotary(svgSpeeds[0],slidopt);
    rots.setDomain(-160,160).setRange(-100,100).setMinMax(-100,100);
    rots.userData = {i:index,f:"speed"}; //was velocity
    rots.callback = this.onRotary.bind(this);
    this.rotSpeeds[index]=rots;

    svgSpeeds.hide(); svgAngles.show(); //joint par defaut

    this.showValue({class:"dxlManager",id:index,param:"index",val:index});
    if(settings)
        this.motorSettings(index,settings);
}


MisGUI.prototype.motorSettings = function(index,s){
    if((s==undefined)||(s==null)){//TODO default
        return;
    }
    this.showParams({class:"dxlManager",id:index,val:s});

    $(".thermo [eltID="+index+"]").text("-°"); //wait info

    this.angleMin(index,s.angleMin);
    this.angleMax(index,s.angleMax);
    this.speedMin(index,s.speedMin);
    this.speedMax(index,s.speedMax);
    this.motorMode(index,s.mode); // show/hide rotary , speed at 0
}


MisGUI.prototype.midiMotorSettings = function(midiMappingSettings,midiPorts){
    console.log("MisGUI.prototype.midiMotorSettings",midiPorts);
/*Didier: use this.showParams()
    var motorIndex = midiMappingSettings.motorIndex;
    var midiCmd_int;
    if(midiMappingSettings.cmd == "note") midiCmd_int = true;
    else midiCmd_int = false;
    var midiPort = midiMappingSettings.port;
    var midiIndexMapping = midiMappingSettings.nbID;

    //toggle:
    var parent = this.getMotorStg(motorIndex);
    parent.find("[name=midiMode]").prop("checked",midiCmd_int);

    //index:
    this.setMappingNumberForMotor(motorIndex,midiIndexMapping);

    //selections:
    this.updateMidiMotorSelection(motorIndex,midiPort,midiPorts);
//
*/
    var idx = midiMappingSettings.motorIndex;
    var mod = (midiMappingSettings.cmd == "note"); //CC:false note:true
    var num = midiMappingSettings.nbID;
    //var port = midiMappingSettings.port;
    this.showParams({
        class:"dxlManager"
        ,func:"midiMapping"
        ,id:idx
        ,val:{ mode:mod , num:num } //, port:["none","test 1","test 2"]}
        });

    this.updateMidiMotorSelection(idx,midiMappingSettings.port,midiPorts);
    
}

MisGUI.prototype.updateMidiMotorSelection = function(motorIndex,midiPortSelected,midiPorts){

    //this array should be built in MidiManager ...
    console.log("---------------updateMidiMotorSelection");
    var ports = ["none"]; 
    for(var i=0;i<midiPorts.length;i++){
        var portName = midiPorts[i].portName;
        if(portName.length>0 ){ //&& midiPorts[i].enabledOnGUI){
            ports.push(portName);
        }
    }

    this.showValue({class:"dxlManager",id:motorIndex,param:"port",val:ports});
    //selectMidiMappingPort //default = first option  ("none")
    this.showValue({class:"dxlManager",id:motorIndex,param:"port",val:midiPortSelected});

/*
    //var sel = $("#divMotorSettings .midi-setting").eq(motorIndex);
    //var sel = $("#divMotorSettings .midi-chanel").eq(motorIndex);
    var sel = $("#divMotorSettings .midi-chanel [eltID="+motorIndex+"]");
    //sel.data("id",motorIndex);

    sel.empty();
    sel.append($("<option value=" + "'" + "none" + "'>" + "none" + "</option>"));
    for(var i=0;i<midiPorts.length;i++){
        var portName = midiPorts[i].portName;
        if(portName.length>0 && midiPorts[i].enabledOnGUI){
            //sel.append($("<option value=" + "'" + portName + "'>" + portName + "</option>"));
            sel.append($("<option value=" + "'" + portName + "'" + "name=" + portName + "'>" + portName + "</option>"));
        }
    }
    sel.change(function(){ 
        var id = $(this).data("id"); 
        console.log(id,this.name,this.value);
        motorMappingManager.setMidiMotorMappingPort(id,this.value);
    });

    //this.selectMidiMappingPort(motorIndex,midiPortSelected);
    */
}

//only used in this 
/*
MisGUI.prototype.setMappingNumberForMotor = function(motorIndex, nbID) {
//    if(nbID == null){ 
//        //$("#divMotors .number-for-motor").eq(motorIndex).val(null); // done explicitly for now.. //cec
//        $("#divMotorSettings").find("[name=mapping]").eq(motorIndex).val(null);
//    }else{
//        //$("#divMotors .number-for-motor").eq(motorIndex).val(nbID); //cec
//        $("#divMotorSettings").find("[name=mapping]").eq(motorIndex).val(nbID);
//    }
}
*/

//only used in this
/*
MisGUI.prototype.selectMidiMappingPort = function(motorID, name){   
//    console.log("*******************selectMidiMappingPort:",name);
//    var div = this.getMotorStg(motorID);
//    if( (name==undefined)||(name.length<1) )
//        name = "none";
//    //var sel = div.find(".midi-setting");
//    var sel = div.find(".midi-chanel");
//    sel.val(name);
   if( (name==undefined)||(name.length<1) )
       name = "none";
    this.showValue({class:"dxlManager",id:motorID,param:"port",val:name});
}
*/

MisGUI.prototype.init =function(){
    console.log("----- INIT GUI -----");
    var self = this;
    
    this.initMotorDiv();

    /* >>> this.initMotorDiv(); + this.addMotor
    //clone MotorsConfig(advanced)
    //var parent = $("#dxlConfig");
    var model = $("#divMotorSettings .single-motor");
    var after = model;
    model.data("index",0); model.find("*").data("index",0); //old
    model.attr("eltID",0);
    model.find("*").attr("eltID",0);
    for(var i=1;i<6;i++) {
        var clone = model.clone();
        //clone.data("index",i);  //old
        //clone.find("*").data("index",i); //old
        clone.attr("eltID",i);
        clone.find("*").attr("eltID",i);
        clone.insertAfter(after);
        after = clone;
    }

    // clone single-motors
    var parent = $("#divMotors");
    model = parent.find(".single-motor");
    //model.data("index",0); //old
    //model.find("*").data("index",0); //old
    model.attr("eltID",0);
    model.find("*").attr("eltID",0);
    for(var i=1;i<6;i++) {
        var clone = model.clone();
        //clone.data("index",i);  //old
        //clone.find("*").data("index",i); //old
        clone.attr("eltID",i);
        clone.find("*").attr("eltID",i);        
        clone.appendTo(parent);
        clone.find(".midi-blinker").bind("mouseover", frontBlinkInfo);
        clone.find(".midi-blinker").css("display", "none");
    }
    */



    //create rotaries
    /*
    var svgAngles = $(".rotAngle");
    var svgSpeeds = $(".rotSpeed");

    svgAngles.show(); //to have a good bounding rect
    svgSpeeds.show();

    var slidopt  = {x:0,y:0};

    //var color = "#C0C0C0";
    for(var i=1;i<svgAngles.length;i++) {
        var rota = new DUI.Rotary(svgAngles[i],slidopt);
        rota.setDomain(-150,150).setRange(-150,150).setMinMax(-150,150);
        rota.userData = {i:i,f:"angle"};
        rota.callback = this.onRotary.bind(this);
        //this.rotAngles.push(rota); //not an array any more
        this.rotAngles[i]=rota;

        var rots = new DUI.Rotary(svgSpeeds[i],slidopt);
        rots.setDomain(-160,160).setRange(-100,100).setMinMax(-100,100);
        rots.userData = {i:i,f:"velocity"}; //speed
        rots.callback = this.onRotary.bind(this);
        //this.rotSpeeds.push(rots);
        this.rotSpeeds[i]=rots;
    }
    svgSpeeds.hide();
    */

    //DB DELETED inputVals
    //this.inputVals = $("#divMotors .num_rotary");
    /*
    for(var i=0;i<this.inputVals.length;i++) {
        //console.log("num_rotary:",i);
        this.inputVals.eq(i).val(0);
        $(this.inputVals[i]).data("index",i);
    }
    */

    /*
    this.inputVals.on("change",function(){
        //var index = $(this).data("index");
        var index = $(this).attr("eltID");
        var mode = dxlManager.getMode(index);
        var val = $(this).val();
        console.log("num_rotary change:",+index,mode,val);
        if(mode==0){
            dxlManager.setAngle(+index,val);
            //self.angle(index,val); //rem called by dxlManager
        }
        else{
            dxlManager.setSpeed(+index,val);
            //self.speed(index,val); //rem called by dxlManager
        }
    });
    */
    /*
    this.inputVals = $("#divMotors .num_rotary");
    var parent = $(".single-motor").filter("[eltID="+index+"]"); //OK
    console.log("inputval:parent",parent);
    */
    /*
    this.inputVals.on("keydown",function(ev){
        if(ev.keyCode==13){
            var index = $(this).attr("eltID");
           console.log("inputVals.on(keydown):",index,$(this).val());
           dxlManager.onControl(+index,+$(this).val());
        }
    });
 
    //TODELETE ?
    $("#divMotorSettings .cmd").on('change',function(){
        //var index = $(this).data("index");
        var index = +$(this).attr("eltID");        
        var cmd = this.name;
        console.log("************************GUI .cmd:",index," ",cmd," ",v);
        //var val = parseFloat(this.value);
        //console.log("DBG cmd:",index," ",cmd," ",v);
        self[cmd](index,this.value);
    });

    //TODELETE ?
    $(".motors .cmdTog").on('click',function(){
        var v = this.checked ? 1 : 0;
        //var index = $(this).data("index");
        var index = +$(this).attr("eltID");        
        var cmd = this.name;
        console.log("************************ cmdTog:",index," ",cmd," ",v);
        if(self[this.name])
            self[cmd](index,v);
        else
            dxlManager.cmdOld(cmd,index,v);
    });
    */

    /* removed by alex
    $("button.start-rec").on("click",function() {
        if(self.recording){
            self.recording = false;
            dxlManager.stopRec();
            UIstoprecording();
            self.recording = false;
        }
        else{
            UIstartRec(); //!!! avant dxlManager.startRec()
            self.recording = true;
            dxlManager.startRec();
        }
    });
    */

    $("#loadAnim").on("click",function(){
        //TODO generic  loadUI , with folder
        dialog.showOpenDialog({properties:['openFile','multiSelections']},function(filenames) {
            if(filenames){
                for(var i=0;i<filenames.length;i++) {
                    animManager.loadAnim(filenames[i],false);
                }
            }
        });
    });

    // ??? is it used??
    // --> NO....
    $("#saveAnim").on("click",function(){
        if(dialog) {
            // / *versionHTML
            console.log("saveAnim..."); //properties
            dialog.showSaveDialog(function (filenames) {
                if (filenames) {
                    console.log(filenames.length);
                    console.log(filenames[0]);
                    var slash = filenames[0].lastIndexOf('/') + 1;
                    var path = filenames[0].substr(0, slash);
                    var name = filenames[0].substr(slash);
                    console.log(path, " ", name);

                }
            });
        }
    });

    $("#anim-freeze").on('click',function(){
        if($('#anim-freeze').is(":checked")){
            console.log("---- anim stop all");
            //animManager.stopAll();
            //dxlManager.stopAllMotors();
            dxlManager.stopAll();
        }
    });

    /* see sensorManager.uiLoad
    $("#loadSensor").on("click",function(){
        dialog.showOpenDialog({properties:['openFile','multiSelections']},function(filenames) {
            if(filenames){
                for(var i=0;i<filenames.length;i++) {
                    sensorManager.loadSensorFromGUI(filenames[i]);
                }
            }
        });
    });
    */

    $("#sensor-freeze").on('click',function(){
        if($('#sensor-freeze').is(":checked")){
            console.log("----- sensor freeze all");
            sensorManager.freezeAllSensors();
            dxlManager.stopAllMotors();
        }else{
            console.log("----- sensor unfreeze all");
            sensorManager.unfreezeAllSensors();
        }
    });

    // hide default animation, also when no animations are loaded
    /*
    var parent = $("#sortable-anim");
    var model = parent.find(".single-anim:first");
    model.hide();
    */

    // hide default sensor, also when no sensors are loaded
    var parentS = $(".sensors").find("[name=listSensors]");
    var modelS = parentS.find(".single-sensor:first");
    modelS.hide();

    $("#btScan").on("click",function() {
        $("#btScan").css('background', 'white');
		$("#btScan").css('color', 'black');
        dxlManager.startScan();
    });

    $( "#opener" ).click(function() {
        $( "#dialog" ).dialog( "open" );
    });

    /*
    for(var i=0;i<1;i++){
        $( "#dialog" ).append('<br><input type="text"><label>Label :</label>');
    }
    */
    /*
    $("#btDxlIDx").on("change",function(){
        console.log("DxlId:",this.value);
        $('#divDxlReg [id^="addr"]').val("?");
        dxlManager.readRegs(this.value);
    });
    */


    //ROBUS
    /*
    var robs = $("#robusRobots");
    var bt   = $("#robusOnOff2");
    robs.on("click",function(){
        bt.prop("class","disconnected").text("OFF");
    });    
    robs.on("change",function(){
        //console.log("DBG-ROBUSCHANGE",robs.val());
        //var spl = this.value.split("\n");
    });
    bt.on('click',function(){
        var cl = $(this).prop("class");
        if(cl=="connected"){
            robusManager.close();
        }
        else {
            var list=robs.val().split("\n");
            for (var i = 0; i < list.length; i++){
                var n = list[i].trim();
                if(n.length>1)
                    robusManager.connect(list[i].trim());                
            }
        }
    });
    $("#robusInfo").on('click',function(){
        var txt = robusManager.getInfo();
        $("#robusTxt").val(txt);        
    });
    $("#robusReset").on('click',function(){
        robusManager.reset();
        $("#robusOnOff2").prop("class","disconnected").text("OFF");        
        $("#robusTxt").val("");        
    });
    */

    /*
    divOsc = $("#divOSC");
    divOsc.find("#btOSC").click(function(){
        console.log("osc ON",this.checked);
        oscManager.onOff(this.checked);
    });
    divOsc.find(".cmdInt").change(function(){
        console.log("osc:",this.name);
        oscManager.changeParam(this.name,parseInt($(this).val()));
    });
    divOsc.find(".cmdString").change(function(){
        console.log("osc:",this.name);
        oscManager.changeParam(this.name,$(this).val());
    });
    divOsc.on("mouseenter",function(){
        console.log("divOSC:mouseenter");
        misGUI.scanIPv4();
    });
    */


    $("#addEmptySensor").on("click",function(){
        sensorManager.addEmptySensor();
    })
    
    $(".midiPlug").bind("mouseenter", midiPanelOver);//mouseover
    function midiPanelOver(){
        //console.log("midi over");
        misGUI.scanMidiPorts();
    }

    //this.scanSerial();    /*Didier*/
    this.scanMidiPorts();
    this.scanIPv4(); //Didier

 
}//init

MisGUI.prototype.initMotorDiv = function(){
    //before addMotor
    
    //hide model , will be cloned
    $("#divMotors .single-motor").hide();
    $("#divMotorSettings .single-motor").hide();

    //prevent scrolling with mousewheel
    $(".rotAngle").on("mousewheel",function(e){e.preventDefault();}); //<<<index.js
    $(".rotSpeed").on("mousewheel",function(e){e.preventDefault();}); //<<<index.js
       
    $("#motor-freeze").on('click',function(){
        if($('#motor-freeze').is(":checked"))
            dxlManager.freezeAllMotors();
        else
            dxlManager.unfreezeAllMotors();
    });

    //---- dxlDialog ----
    $(".single-motor").contextmenu(function() { 
        var index = $(this).attr("eltID");
        console.log("motor.contextmenu:",index);
        if(index != undefined){
            $("#dynamixel-ctrl").css("display", "block");
            var dxlID = dxlManager.getIDByIndex(index);     //berk
            misGUI.clearDxlRegs(dxlID); //refresh
            dxlManager.startReadDxl(dxlID); //async >> showDxlReg            
        }
    });
    
    $("#btAdvID").on("change",function() {
        var id = $("#btAdvID").val();
        //console.log("#btDxlRefresh click ",id);
        self.clearDxlRegs(+id);
        dxlManager.startReadDxl(+id); //async >> showDxlReg            
    });
    $("#btAdvID").keypress(function(e){
        if(e.which==13){
            $(this).change();
        }
    });
    $("#btDxlRefresh").on("click",function(){
        $("#btAdvID").change();
    });
    $("#changeDxlID").keypress(function(e){
        //console.log("KEY:",e);
        if(e.key=='Enter'){
            var prevID = parseInt($("#btAdvID").val());
            if(isNaN(prevID)){
                alert("Scan a valid Motor");
                return;
            }
            var newID = parseInt($(this).val());
            if(isNaN(newID)||(newID<1)||(newID>253)){
                alert("Not a valid Dynamixel ID");
                return;
            }
            if( confirm("Change dynamixel ID #"+prevID+"  to  #"+newID+" ?") ){
                misGUI.clearDxlRegs(newID);
                $("#btAdvID").val(newID);
                dxlManager.changeDxlID(prevID,newID); //->startReadDxl(newID)
            }
        }
    });
    
    /*DB: >>>> dxlManager.midiMapping(...,"num")
    //motorMappings : TODO à verifier
    var motorMappings = $("#divMotorSettings").find("[name=mapping]");
    motorMappings.on("change",function(){  

        //var index = $(this).data("index");
        var index = +$(this).attr("eltID");      
        var val = $(this).val();       
        console.log("misgui:: setmidimotormapping will be called", index, val);          
        motorMappingManager.setMidiMotorMappingIndex(index,parseInt(val)); // Gui only treats CC midi mappings for now
    });
    */

}


/*
MisGUI.prototype.enableOSC = function(onoff){
    $("#divOSC").find("#btOSC").prop("checked",onoff);
}
*/
/*
MisGUI.prototype.showOSC = function(settings){
    console.log("==========showosc:",settings);
    var div = $("#divOSC");
    div.find("[name=oscLocalPort]").val(settings.oscLocalPort);
    div.find("[name=oscRemoteIP]").val(settings.oscRemoteIP);
    div.find("[name=oscRemotePort]").val(settings.oscRemotePort);    
}
*/

MisGUI.prototype.openLoadDialog = function( title , path , callback ){
    dialog.showOpenDialog({
            title:title, //no effect ???
            message:title, //osX
            defaultPath:path,
            properties:['openFile','multiSelections']
        },
        function(filenames){
            if(callback){
                if(filenames){
                    for(var i=0;i<filenames.length;i++) {
                        console.log("load:",filenames[i]);
                        callback(filenames[i]);
                    }
                }
            }
            console.log("showOpenDialog:DONE")
        }
    );
};

MisGUI.prototype.openSaveDialog = function( title , path , callback ){
    dialog.showSaveDialog({   
            title:title, //no effect ???
            message:title, //osX
            defaultPath:path
        },
        function( filepath ){
            if( (path!=undefined)&&(callback!=undefined) )
                callback(filepath);
        }
    );
};

//TODELETE
MisGUI.prototype.setDxlRegDEL=function(i,name,val){
    var inp = $( "#divDxlReg #addr"+i).eq(0);
    console.log("inputs:",inp.length);
    if(inp.length<1){
    //if(inp==undefined){
        //$( "#divDxlReg" ).append('<br><input type="text" size="5em" id="addr'+i+'"> '+name);
        inp = $('<br><input type="text" size="5em" id="addr'+i+'">');
        inp.data("addr",i);
        $( "#divDxlReg" ).append(inp,name);
        inp.on("change",function(){
            //misGUI.changeDxlReg()
            console.log("CHANGE REG:",this.id,this.value,$(this).data("addr"));
            dxlManager.writeReg($("#btDxlIDx").val(),$(this).data("addr"),this.value);
        });
    }
    inp.val(val);
/*

    var lbls = $( "#dialog label #addr"+i" );
    console.log("inputs:",inps.length,i);
    if(i<inps.length){
        $(inps[i]).val(val);
        $(lbls[i]).text(" "+name);
    }
    */
}

MisGUI.prototype.recOff=function(){ //V02 ok
    //console.log("DBG misGui.recOff 1");
    self.recording = false;
    UIstoprecording();
    self.recording = false;
    //console.log("DBG misGui.recOff 2");
}

MisGUI.prototype.dxlEnabled = function(index,val){
    var bt = $("#divMotors .single-motor").eq(index).find("[name=enable]");
    bt.prop("checked",(val!=0));
}

// TODO: we leave it for now since it is used by OSC and Sensors
MisGUI.prototype.divAnim = function(animId){
    return $('.single-anim[eltID='+animId+']');
}


MisGUI.prototype.scanMidiPorts = function(){
    var self = this;
    var sel = $("#midi-available");
    
    console.log("----------------> Scanning midi ports");

    sel.empty();

    if(midiPortManager){  
        midiPortManager.hidePortsFromGUI();
        for(var i=0;i<100;i++){
            var n = midiPortManager.getPortName(i);
            if(n){
                console.log("Found midi port: " + n);
                midiPortManager.addMidiPort(n,i);
                sel.append($("<input class=" + "'" + "styled-checkbox small" + "'" + "type=" + "'" + "checkbox"
                + "'" + "id=" + "'" + n + "'>&nbsp;" + n + "<br>"));
            }else
                break;
        }
        $("#midi-available :input[type='checkbox']").each(
            function() {
                var portName =  $(this).prop("id");
                //console.log("PortName ", portName);
                $(this).prop("checked",midiPortManager.isMidiPortEnabled(portName));
                $(this).change(function(){
                    var flag = $(this).prop("checked");
                    //console.log("change ..... TO ",flag);
                    if(flag){
                        midiPortManager.open(portName);
                    }else{
                        midiPortManager.close(portName);
                    }
                });
            }
        );  
        console.log("-----> midi motor mappings",motorMappingManager.motorMappings.length);
        for(var i=0; i<motorMappingManager.motorMappings.length; i++){
            var m = motorMappingManager.motorMappings[i].m;
            this.updateMidiMotorSelection(m.motorIndex,m.port,midiPortManager.midiPorts);
        }

        sensorManager.updateMidiPorts();
        /*
        for(id in sensorManager.sensors){
            this.changeSensor(sensorManager.sensors[id].s,id)
        }*/
    }
};


//??? only in MisGUI 
MisGUI.prototype.simSelectMidiPorts = function(midiEnabled){

    //if(midiEnabled){
        $('#btmidi').prop("checked",midiEnabled);
    //}
    $("#midi-available :input[type='checkbox']").each(
        function() {
            var portName =  $(this).prop("id");
            console.log("PortName ", portName);
            $(this).prop("checked",midiPortManager.isMidiPortEnabled(portName));
        }
    ); 
}

MisGUI.prototype.scanIPv4 = function(){
    var self = this;
    var infoIP = $(".infoIP");
    var nbIP = infoIP.length;
    for(var i=1;i<nbIP;i++){
        infoIP.eq(i).remove();
    }
    var info = infoIP.eq(0);
    var mbzSrv = "ws://127.0.0.1:8080<br>"; 
    //var selector = $("#selectOSC");
    //selector.empty();
    try {
        var interfaces = OS.networkInterfaces();
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var addr = interfaces[k][k2];
                if (addr.internal == false && (addr.family == "IPv4")) {
                    console.log("localIP:",addr.address);
                    //selector.append($("<option value=" + "'" + addr.address + "'>" + addr.address + "</option>"));
                    var clone = info.clone(info);
                    clone.html("Local IP: "+addr.address);
                    clone.insertAfter(info);
                    info = clone;
                    mbzSrv+="ws://"+addr.address+":8080<br>";          
                }
            }
        }
    }catch(e){}
    //selector.append($("<option value='scan' >scan</option>"));
    //*/
    $(".mbzIP").html(mbzSrv);
    $(".infoIP").on("click",function(){
        misGUI.scanIPv4();
    })
    $(".mbzIP").on("click",function(){
        misGUI.scanIPv4();
    })



}

/*
MisGUI.prototype.robusOnOff = function(onoff){
    if(onoff){
        $("#robusOnOff2").prop("class","connected").text("ON");
        var txt = robusManager.getInfo();
        $("#robusTxt").val(txt);        
    }
    else
        $("#robusOnOff2").prop("class","disconnected").text("OFF");
};
MisGUI.prototype.robusWait = function(text){
        $("#robusOnOff2").prop("class","disconnected").text("WAIT");
};
MisGUI.prototype.robusInfo = function(text){
    $("#robusTxt").val(text);
};
MisGUI.prototype.robusAppendInfo = function(text){
    $("#robusTxt").val($("#robusTxt").val()+text);
};
*/


MisGUI.prototype.blockUI=function(block){
    if(block)
        $.blockUI({ message: null });
    else
        $.unblockUI({onUnblock: function(){}});
}

MisGUI.prototype.scanProgress =function(val){
    //console.log("scanProgress:",val);
    if(val >= $("#scanProgress").attr('max') - 1){ // TODO: talk about the progress bar with Didier!
        $("#scanProgress").val(0);
        $("#btScan").css('background', 'transparent');
		$("#btScan").css('color', 'white');
    }
    else{
        $("#scanProgress").val(val);
    }
}

MisGUI.prototype.temperature = function(index,value){
    var prevt = parseInt($(".thermo").eq(index).html());
    $(".thermo").eq(index).html(value+"°");
    if(prevt==value)
        return;
    var motodiv = $(".single-motor").eq(index);
    if(value>=68){
        motodiv.css("background", "rgba(255,82,97,0.5)");
        motodiv.css("opacity", "0.3");
        motodiv.css("pointer-events", "none");
        motodiv.find(".thermo").css("color", "#FF7F52");
        //$("#alertThermo").css("display", "block");
        //$("#alertThermo").append('<p>Attention ! le moteur '+ $(".single-motor").eq(index).find(".motor-index").html() +' est en surchauffe, il est arrêté.</p>')
        //$("#alertThermo").find('.close-modale').bind('click', function(event) {
        //    $("#alertThermo").css("display", "none");
        //    $("#alertThermo p").remove();
        //});
    }
    else if(value>=60){
        motodiv.css("opacity", "1");
        motodiv.find(".thermo").css("color", "#FF7F52");
        motodiv.css("pointer-events", "auto");
    }
    else{
        motodiv.css("opacity", "1");
        motodiv.find(".thermo").css("color", "#99FF00");
        motodiv.css("background", "");
        motodiv.css("pointer-events", "auto");
    }

}

//---------------- dynamixel dialog box ------------------
MisGUI.prototype.clearDxlRegs = function(dxlid) {
    $("#btAdvID").val(dxlid);
    var inputs = $("#divDxlReg :input");
    //misGUI.setEltID("dxlPopup",dxlID);
    inputs.attr("eltID",dxlid);          //!!! set all inputs'eltID to dxlID !!!
    inputs.val('?');
}

MisGUI.prototype.showDxlReg = function(id,addr,val){ //showValue ?
    var nm = ("000"+addr).slice(-3);
    $('#divDxlReg').find("[param="+nm+"]").val(val);
}

//------------------ editor ------------------------------

MisGUI.prototype.getScript = function(){
    return editor.getValue(); // cf ui.js
}

MisGUI.prototype.setScript = function(code){
    editor.setValue(code); // cf ui.js
}

MisGUI.prototype.scriptOnOff = function(onoff){
    console.log("====== scriptOnOff =====",onoff)
    if(onoff){
        $("#run-code").html('Running...')
            .addClass('active')
            .css('opacity', 0.5)
        $("#stop-code").css('opacity', 1);
    }
    else{
        $("#run-code").html('Run')
    		.removeClass('active')
    		.css('opacity', 1);
    	$("#stop-code").css('opacity', 0.5);
    }
}


// updateSlider(
//     $("#sortable-sens-output .animation .minval").val(), 
//     $("#sortable-sens-output .animation .maxval").val(), 
//     $("#sortable-sens-output .animation .tolerance").val(), 
//     $("#sortable-sens-output .animation .slider-range").data("default")
// );

// function sensorSettings(){

//     var target = $(this).parent().parent().children();
//     target.addClass('blury')
//     var settings = $(this).parent().parent().find(".sensor-setting-more")
//     settings.removeClass('blury')
//     settings.css("display", "block");

//     // NEW
//     $(".sensor-setting-more").bind("mouseenter", stopScroll);
//     $(".sensor-setting-more").bind("mouseleave", initScroll);
//     $(".select-setting").on('change', selectSettings);



//     $(this).parent().parent().find("button.set").bind("click", function(event) {
//         settings.css("display", "none");        
//         target.removeClass('blury');

//     });
// }

// SCroll gestion
// function initScroll(e){
//     $(".sensors").css("overflow", "auto");
// }
// function stopScroll(e){
//     $(".sensors").css("overflow", "hidden");
// }




// function selectSettings() {
//     var target = $(this).val();
//     if(target){
//         $(".options").children().css("display", "none");
//         $("."+target).css("display", "block");
//     }
// }



function echoActiveSetting(){
    var info = $(this).data('label');
    console.log(info);
    var sensor = $(this).closest("li");
    console.log(sensor);
    sensor.find(".echo").html(info)
}


// PULL OFF
/*
function indexMotor(){
    for (var i = 0; i < $(".motor-index").length; i++) {
        $(".motor-index").eq(i).html(i+1);
        console.log(i);
    };
}
*/


// STOP ALL
//Motors

$("input.btnGlobalMotor").bind('click', function() {
    
    if($(".allMotors").css("pointer-events")=="none"){
        $(".allMotors").css("opacity", 1);
        $(".allMotors").css("pointer-events", "auto");
    }else{
        $(".allMotors").css("opacity", 0.3);
        $(".allMotors").css("pointer-events", "none");
    }
    
});


//Animations

$("input.btnGlobalAnim").bind('click', function() {

    if($(".animations").css("pointer-events")=="none"){
        $(".animations").css("opacity", 1);
        $(".animations").css("pointer-events", "auto");
    }else{
        $(".animations").css("opacity", 0.3);
        $(".animations").css("pointer-events", "none");
    }

});


// Sensors
$("input.btnGlobalSensors").bind('click', function() {

    if($(".sensors").css("pointer-events")=="none"){
        $(".sensors").css("opacity", 1);
        $(".sensors").css("pointer-events", "auto");
    }else{
        $(".sensors").css("opacity", 0.3);
        $(".sensors").css("pointer-events", "none");
    }

});



// Temperature motors

// var clockForThermo = setInterval(function(){ thermoCheck()}, 1000);

//TODO DB call this func


// Midi frontBlink info
var clockForMidiBlink = setInterval(function(){ checkMidiBlink()}, 500);

function checkMidiBlink(){
    var elmt = $(".motors-settings .midi-chanel");
    for (var i = 0; i < elmt.length; i++) {
        
        var settingTarget = $(".motors-settings .single-motor").eq(i);
        var infoChanel = settingTarget.find('.midi-chanel option:selected' ).val();
        var indexMapping = settingTarget.find('.midiMapping').val();
        var infoMode;
        if(settingTarget.find('.toggle-small').eq(1).find('input[type="checkbox"]:checked')[0]){
            infoMode = "Note";
        }else{
            infoMode = "CC";
        }

        //console.log("midi infos: motor",i,infoChanel,indexMapping,infoMode);
        if(motorMappingManager.isMappingActive(i)){
            $('.allMotors').find('.single-motor').eq(i).find('.midi-blinker').css("display", "block");
        }else{
            $('.allMotors').find('.single-motor').eq(i).find('.midi-blinker').css("display", "none");
        }
    }
    motorMappingManager.setAllMappingActive(false);

}

MisGUI.prototype.setMidiBlinkOn = function(motorIndex){
    $('.allMotors').find('.single-motor').eq(motorIndex).find('.midi-blinker').css("display", "block");
}



//parseBlinker();
function parseBlinker(){
    var elmt = $(".motors-settings .midi-chanel");
    for (var i = 0; i < elmt.length; i++) {
        if(elmt.eq(i).find('option:selected').val() == "none"){
            console.log(elmt.eq(i).find('option:selected').val());
            $('.allMotors').find('.single-motor').eq(i).find('.midi-blinker').css("display", "none");
        }else{
            console.log(elmt.eq(i).find('option:selected').val());
            $('.allMotors').find('.single-motor').eq(i).find('.midi-blinker').css("display", "block");
        }
    };
}


function frontBlinkInfo(){
    var i = $(this).parent().index();
    console.log(i);
    var settingTarget = $(".motors-settings .single-motor").eq(i);
    var infoChanel = settingTarget.find('.midi-chanel option:selected' ).val();
    var indexMapping = settingTarget.find('.midiMapping').val();
    var infoMode;

    if(settingTarget.find('.toggle-small').eq(1).find('input[type="checkbox"]:checked')[0]){
        infoMode = "Note";
    }else{
        infoMode = "CC";
    }

    $(".midi-blinker").prop('title', infoChanel+' - '+infoMode+' - '+indexMapping);

}

/*
MisGUI.prototype.showCm9Num = function(onoff){
    if(onoff)$("#numCm9").show();
    else($("#numCm9").hide());
}
*/

$(".cm9Plug").on("mouseover",function(){
    //console.log("cm9Plug mouseover");
    cm9Com.checkConnection();
})

/* already done in the init() function
$(".midiPlug").bind("mouseover", midiPanelOver);
function midiPanelOver(){
    //console.log("midi over");
}
*/


// NEW animation modale -- Alex changes
$("#newAnim").bind('click', function(){
    $("#modalNewAnim").css("display", "block");
    $("#modalNewAnim button:first-of-type").prop("disabled",true);

});


//cancel
$("#modalNewAnim").find("#newAnimCancel").bind('click', function(){
    $("#modalNewAnim").css("display", "none");    
})

//select
$("#modalNewAnim").find("span").bind('click', function(){

    //console.log("yeeha!!!!!");
    if($(this).hasClass('selected')){
        //console.log("------> selected",this.id,"a",this.value);
        /*
        // TODO: removed because it comes twice in this bind... why?? Wasn't like this in my version.
        $(this).removeClass('selected');
        console.log($(this));
        console.log("#modalNewAnim",$("#modalNewAnim"));
        $("#modalNewAnim span").removeClass('selected');
        $("#modalNewAnim button:first-of-type").css("opacity", 0.3);
        $("#modalNewAnim button:first-of-type").prop("disabled",true);
        */

    }else{
        console.log("------> NOT selected",this.id,"a",this.value);
        $("#modalNewAnim span").removeClass('selected');
        $(this).addClass('selected');
        $("#modalNewAnim button:first-of-type").css("opacity", 1);
        $("#modalNewAnim button:first-of-type").prop("disabled",false);
    }

})

// load
$("#modalNewAnim").find("#newAnimLoad").bind('click', function(){
    // TODO BUG: pourquoi on rentre ici deux fois... un lien ac l'autre bug du select??
    var selectedType = $(".listAnimType .selected").attr("name");
    console.log("load anim "+ selectedType);
    if(selectedType != undefined){
        $("#modalNewAnim span").removeClass('selected');
        $("#modalNewAnim").find("#newAnimLoad").css("opacity", 0.3);
        $("#modalNewAnim").css("display", "none"); 
        animManager.addAnim(selectedType);
    }
})
