

function MisGUI(){
    var self = this;
    this.rotAngles =[];
    this.rotSpeeds =[];
    this.inputVals; //DB storage of <input> rotary values
    this.recording = false;
    this.serialPort = null;

    this.dxlEditId = 0;

    this.settings = [
        {
            index:0,
            Id:0,
            mode:0,
            inverse: 0,
            angleRng:[-150,150],
            speedRng:[-100,1000]
        }
    ];

    $( "#dialog" ).dialog( "close" );

    //prevent scrolling with mousewheel
    $(".rotAngle").on("mousewheel",function(e){e.preventDefault();}); //<<<index.js
    $(".rotSpeed").on("mousewheel",function(e){e.preventDefault();}); //<<<index.js

    /*Didier
    $('#selectSerial').change(function(){
        console.log("serialPort:",this.value);
        var bt = $("#btSerial");
        bt.prop('disabled', true); //error may take a long time

        if(this.value == "scan"){
            console.log("SCAN");
            self.scanSerial();
            bt.prop("class","disconnected").text("OFF");
            bt.prop('disabled', false);
            return;
        }
        self.openSerial();
    });
    */

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



}; //MisGUI


/*
  ex: cloneElement(".single-gizmo",42);
  ex: cloneElement(".single-gizmo","giz42");
  ex: cloneElement(".single-gizmo");
 */
MisGUI.prototype.cloneElement = function(selector,eltID){ //eltID may be a string
    var model = $(selector).first();      //model MUST be first ---> insertAfter
    if(model.length>0){
        //console.log("model manager:",model.prop("manager"));
        var clone = model.clone(true);
        if(model.prop("manager")!=undefined){
            clone.find("*").prop("manager",model.prop("manager")); //was undefined ?
        }
        if(eltID != undefined){           //set eltID to all clone elts
            clone.attr("eltID",eltID);
            clone.find("*").attr("eltID",eltID);
        }
        clone.insertAfter(model);
        clone.show();
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
    console.log("MisGUI.removing:",elt);
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
    parents.find("*").each(function(i) {
        var func = $(this).attr("func");
        $(this).prop("manager",manager); //inutile ? keep manager ?
        if(func){
            //console.log("INIT:",$(this).prop("tagName"),$(this).prop("type"));

            //TODO ??? click on <p> , <span> , <textarea> ...
            //console.log("INIT:",$(this).prop("manager"),$(this).attr("func"),$(this).prop("type"));

            //$(this).prop("manager",manager); //inutile ? keep manager ?
            switch($(this).prop("type")){
                case "text":
                case "number":
                    $(this).on("keydown",function(e){
                        if(e.keyCode==13) //trigger change when enter even if not modified
                            $(this).trigger("change");                            
                    });
                case "select-one": //select
                    //console.log("***",$(this)); 
                    $(this).on("change",function(){
                        console.log("FUNCCHANGE:",$(this).attr("eltID"),$(this).attr("param"));
                        //$(this).prop("manager").cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());                            
                        // CEC: !!!!! Prob avec prop("manager").. pas bien stocké dans la balise
                        //$(this).prop("manager").cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());                           
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val(),$(this).attr("param")); 
                    });
                    //console.log($("function",this.val));
                    break;
                case "checkbox":
                    $(this).on("change",function(){
                        //console.log("manager", $(this).prop("manager"));
                        console.log("manager:chk:", $(this).attr("eltID"));
                        //console.log("checkbox...",func,$(this).attr("name"));
                        // CEC: !!!!! Prob avec prop("manager").. pas bien stocké dans la balise
                        // $(this).prop("manager").cmd($(this).attr("func"),$(this).attr("eltID"),$(this).prop("checked"));   
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).prop("checked"),$(this).attr("param"));                         
                    });
                    break;
                case "submit":  //button
                    //console.log("button",$(this).attr("func"));
                    $(this).on("click",function(){
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),true,$(this).attr("param")); //value? param? ... à discuter                           
                    });
                    break;
                default:
                    console.log("initManagerFunctions: UNHANDLED:",$(this).prop("tagName"),$(this).prop("type"));    
                break   
            }
        }
    });
}

MisGUI.prototype.setEltID=function(classname,id){
    $("."+classname).find("*").attr("eltID",id);
}


MisGUI.prototype.changeSettings = function(className,func,params,eltID){
    for( var p in params ){
        this.setManagerValue(className,func,params[p],eltID,p);//class func val id param
    }
}

/*

*/
MisGUI.prototype.setManagerValue = function( className , func , value , eltID, param){
    //console.log("GUIvalue:",className , func, value , eltID, param);
    var elt = $('.'+className+" [func="+func+"]");
    if(eltID != undefined){
        elt = elt.filter("[eltID="+eltID+"]")
    }
    if(param != undefined){
        elt = elt.filter("[param="+param+"]");
    }
    //console.log("GUIvalue:",className,func,elt.prop("tagName"),elt.prop("type")); //,value);   
    switch(elt.prop("tagName")){
        case "INPUT":
            switch( elt.prop("type") ){
                case "text":
                case "number":
                    elt.val(value);
                    break;
                case "checkbox":
                    if(elt.is(".onoff")) this.onoffState(elt,value); //ON , OFF , ERROR
                    else elt.prop("checked",value);    
                    break;
                default:
                    console.log("GUIvalue: not handled: INPUT:",func,elt.prop("type"));
            }
            break;
        case "SELECT":
            if(Array.isArray(value)){ //fill options with value(s)
                //console.log("select:values[]:"); //,value);
                elt.each(function(i) {  //value != for each ones
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
                //var exist = $(this).find("option[value='"+value+"']").length;
                //console.log("?????exist?????:",func,value,exist);
                elt.val(value);
            }
            break;            
        case "P":
        case "SPAN":
        case "TEXTAREA":
            elt.text(value); // elt.html(value); //TO DISCUSS
            break;
        default:
            console.log("GUIvalue: type?:",func,elt.prop("tagName"),elt.prop("type"));
    }
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
    this.getMotorUI(index).find(".identity").text(+val);
    this.getMotorStg(index).find("[param=dxlID]").val(+val); //name ou func ? param ?
}

MisGUI.prototype.clockwise =function(index,val){
    console.log("********************MisGUI.prototype.clockwise",val);
    dxlManager.cmdOld("clockwise",index,+val);
}

MisGUI.prototype.angleMin =function(index,val){
    //dxlManager.cmdOld("angleMin",index,+val);
    this.rotAngles[index]
        .setDomain(+val)
        .setRange(+val)
        .setMinMax(+val);
}
MisGUI.prototype.angleMax =function(index,val){
    //dxlManager.cmdOld("angleMax",index,val);
    this.rotAngles[index]
        .setDomain(undefined,+val)
        .setRange(undefined,+val)
        .setMinMax(undefined,+val);
}
MisGUI.prototype.speedMin =function(index,val){
    //console.log("GUI.speedMin",val);
    val=+val;
    dxlManager.cmdOld("speedMin",index,val);
    this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(val,undefined)
        .setMinMax(val);
    //console.log("gui-SPEEDMIN:",val);
}
MisGUI.prototype.speedMax =function(index,val){
    val=+val;
    dxlManager.cmdOld("speedMax",index,val);
    this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(undefined,val)
        .setMinMax(undefined,val);
    //console.log("gui-SPEEDMAX:",val);
}


MisGUI.prototype.midiMode =function(index,value){
    //console.log("SETMIDIMODE:",index," ",value);
    switch(+value){
        case 0:motorMappingManager.setMidiMotorMappingCmd(index,"CC");break;
        case 1:motorMappingManager.setMidiMotorMappingCmd(index,"note");break;
    }
}

MisGUI.prototype.mode =function(index,value){
    //console.log("MisGUI.mode:",index,value);
    switch(value){
        case false:
        case "J":
        case 0:
            this.joint(index);
            break;
        case true:
        case "W":
        case 1:
            this.wheel(index);
            break;
    }
}

MisGUI.prototype.joint = function(index){
    dxlManager.cmdOld("joint",index);
    this.rotSpeeds[index].show(false);
    this.rotAngles[index].show(true);
};
MisGUI.prototype.wheel =function(index){
    dxlManager.cmdOld("wheel",index);
    this.rotAngles[+index].show(false);
    this.rotSpeeds[+index].show(true);
    this.rotSpeeds[+index].setValue(0);
    this.speed(+index,0);
};

MisGUI.prototype.onRotary = function(val,rot){
    var i=rot.userData.i; 
    //console.log("on rotary");
    dxlManager.cmdOld(rot.userData.f,i,val); //"angle" "velocity"
    this.inputVals.eq(i).val(val.toFixed(1));
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

MisGUI.prototype.angle = function(index,val){
    if(index<this.rotAngles.length){
        var v = this.rotAngles[index].setValue(+val).value;
        this.inputVals.eq(index).val(v.toFixed(1));
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

MisGUI.prototype.speed = function(index,val){ //[-100,100]
    //console.log("MisGUI.speed:",index,val)
    if(index<this.rotSpeeds.length){
        var v = this.rotSpeeds[index].setValue(+val).value;
        this.inputVals.eq(index).val(v.toFixed(1));
       // console.log("misguiSpeed:",val,v);
    }
}


MisGUI.prototype.needle = function(index,val){
    if(index<this.rotAngles.length) {
        this.rotAngles[index].setNeedle(+val);
        this.rotSpeeds[index].setNeedle(+val);
    }
}

/*DB
MisGUI.prototype.normValue=function(index,val)
{
    if(index<this.rotAngles.length)
        this.rotAngles[index].setNormValue(+val,false);
}
*/

MisGUI.prototype.recCheck=function(index,val)
{
    console.log("recCheck:[",index,"]",val);
    dxlManager.cmdOld("recCheck",index,val);
}


MisGUI.prototype.test = function(){

}

MisGUI.prototype.getMotorUI = function(index){
    return $("#divMotors .single-motor").eq(index);
}
MisGUI.prototype.getMotorStg = function(index){
    return $("#divMotorSettings .single-motor").eq(index);
}

//DELETED MisGUI.prototype.changeDxlID=function(index,val){

MisGUI.prototype.alert = function(msg){
    var bt = dialog.showMessageBox({
        type:"error",
        //title:"change ID to "+val+" ?", //OSX: no title ???
        message:msg,
        buttons:["Ok"]
    });
}


MisGUI.prototype.toggleAdvanced = function(onoff){
    //console.log("MisGUI.prototype.toggleAdvanced",onoff);
    if(onoff) { //current state
        for(var i=0;i<6;i++){
            var parent = this.getMotorUI(i);
            var chk = parent.find("[name=enable]").prop("checked");
            console.log("DBG-check:",i," ",chk);
            parseBlinker();
            if(chk)
                dxlManager.cmdOld("enable",i,true);

        }
    }
    else
        dxlManager.stopAll();
}

MisGUI.prototype.motorSettings = function(index,s){
    //console.log("GUI:motorSettings:",index,s);
    if((s==undefined)||(s==null)){//TODO default
        return;
    }

    var parent = this.getMotorUI(index);
    //parent.find(".identity").text(s.id);
    parent.find("[param=dxlID]").text(s.id);
    parent.find("[name=enable]").prop("checked",s.enabled);
    parent.find("[name=mode]").prop( "checked",((s.mode==1)||(s.mode=="W")) );
    parent.find(".motor-index").text(index);

    var parent = this.getMotorStg(index);

    parent.find("[param=dxlID]").val(s.id);
    parent.find("[param=clockwise]").prop("checked",s.clockwise);
    parent.find("[param=angleMin]").val(s.angleMin);
    parent.find("[param=angleMax]").val(s.angleMax);
    parent.find("[param=speedMin]").val(s.speedMin); //*(100/1023));
    parent.find("[param=speedMax]").val(s.speedMax); //*(100/1023));

    $(".thermo").eq(index).html("-°");

    this.angleMin(index,s.angleMin);
    this.angleMax(index,s.angleMax);
    this.speedMin(index,s.speedMin);
    this.speedMax(index,s.speedMax);
    //this.rotAngles[index].show((s.mode==0));
    //this.rotSpeeds[index].show((s.mode==1));
    //console.log("MisGUI.motorSettings:",s.mode);
    this.mode(index,s.mode);
    this.rotSpeeds[index].setValue(0);


}


MisGUI.prototype.midiMotorSettings = function(midiMappingSettings,midiPorts){

    var motorIndex = midiMappingSettings.motorIndex;
    var midiCmd_int;
    if(midiMappingSettings.cmd == "note") midiCmd_int = 1;
    else midiCmd_int = 0;
    var midiPort = midiMappingSettings.port;
    var midiIndexMapping = midiMappingSettings.nbID;

    //toggle:
    var parent = this.getMotorStg(motorIndex);
    parent.find("[name=midiMode]").prop("checked",midiCmd_int);

    //index:
    this.setMappingNumberForMotor(motorIndex,midiIndexMapping);

    //selections:
    this.updateMidiMotorSelection(motorIndex,midiPort,midiPorts);

}

MisGUI.prototype.updateMidiMotorSelection = function(motorIndex,midiPortSelected,midiPorts){

    //var sel = $("#divMotorSettings .midi-setting").eq(motorIndex);
    var sel = $("#divMotorSettings .midi-chanel").eq(motorIndex);
    sel.data("id",motorIndex);


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


    this.selectMidiMappingPort(motorIndex,midiPortSelected);
}

MisGUI.prototype.setMappingNumberForMotor = function(motorIndex, nbID) {
    if(nbID == null){ 
        //$("#divMotors .number-for-motor").eq(motorIndex).val(null); // done explicitly for now.. //cec
        $("#divMotorSettings").find("[name=mapping]").eq(motorIndex).val(null);
    }else{
        //$("#divMotors .number-for-motor").eq(motorIndex).val(nbID); //cec
        $("#divMotorSettings").find("[name=mapping]").eq(motorIndex).val(nbID);
    }
}


MisGUI.prototype.selectMidiMappingPort = function(motorID, name){        
    var div = this.getMotorStg(motorID);
    //var sel = div.find(".listAnims [name="+wich+"]");
    if( (name==undefined)||(name.length<1) )
        name = "none";
    //var sel = div.find(".midi-setting");
    var sel = div.find(".midi-chanel");
    sel.val(name);
}

MisGUI.prototype.init =function(){
    console.log("----- INIT GUI -----");

    var parent = $("#divAnims").find("[name=listAnims]");
    var tanim = parent.find(".single-anim:first");
    tanim.hide();

    var self = this;

    //clone MotorsConfig(advanced)
    //var parent = $("#dxlConfig");
    var model = $("#divMotorSettings .single-motor");
    var after = model;
    model.data("index",0); model.find("*").data("index",0); //old
    model.attr("eltID",0);
    model.find("*").attr("eltID",0);
for(var i=1;i<6;i++) {
        var clone = model.clone();
        clone.data("index",i);  //old
        clone.find("*").data("index",i); //old
        clone.attr("eltID",i);
        clone.find("*").attr("eltID",i);
        clone.insertAfter(after);
        after = clone;
    }

    // clone single-motors
    var parent = $("#divMotors");
    model = parent.find(".single-motor");
    model.data("index",0); //old
    model.find("*").data("index",0); //old
    model.attr("eltID",0);
    model.find("*").attr("eltID",0);
    for(var i=1;i<6;i++) {
        var clone = model.clone();
        clone.data("index",i);  //old
        clone.find("*").data("index",i); //old
        clone.attr("eltID",""+i);
        clone.find("*").attr("eltID",i);        
        clone.appendTo(parent);
        clone.find(".midi-blinker").bind("mouseover", frontBlinkInfo);
        clone.find(".midi-blinker").css("display", "none");
    }
/*
    var test = parent.find(".single-motor");
    console.log("test:nbMotors:",test.length);
    for(var i=0;i<6;i++){
        console.log("motor:eltID:",test.filter("[eltID="+i+"]").data("index"));
    }
*/
    $(".single-motor").contextmenu(function() {
        var index = $(this).data("index");
        if(index != undefined){
            openDxlControl(index);
        }
    });

    //this.motorMappings = $("#divMotors .number-for-motor"); //cec
    //this.motorMappings = $("#divMotorSettings .set-value");
    //TODO: TALK WITH DIDIER... there are multiple set-value that are generated: 35 of them
    //CHECK angle min and max..
    //for now use the name "mapping" for selecting
    this.motorMappings = $("#divMotorSettings").find("[name=mapping]");
    for(var i=0;i<this.motorMappings.length;i++) {                      
        $(this.motorMappings[i]).data("index",i);     
    }

    this.motorMappings.on("change",function(){  
        var index = $(this).data("index");        
        var val = $(this).val();       
        //console.log("misgui:: setmidimotormapping will be called", index, val);          
        motorMappingManager.setMidiMotorMappingIndex(index,parseInt(val)); // Gui only treats CC midi mappings for now
    });

    //create rotaries
    var svgAngles = $(".rotAngle");
    var svgSpeeds = $(".rotSpeed");
    svgSpeeds.show();

    var slidopt  = {x:0,y:0};

    //var color = "#C0C0C0";
    for(var i=0;i<svgAngles.length;i++) {
        var rota = new DUI.Rotary(svgAngles[i],slidopt);
        rota.setDomain(-150,150).setRange(-150,150).setMinMax(-150,150);
        rota.userData = {i:i,f:"angle"};
        rota.callback = this.onRotary.bind(this);
        this.rotAngles.push(rota);

        var rots = new DUI.Rotary(svgSpeeds[i],slidopt);
        rots.setDomain(-160,160).setRange(-100,100).setMinMax(-100,100);
        rots.userData = {i:i,f:"velocity"}; //speed
        rots.callback = this.onRotary.bind(this);
        this.rotSpeeds.push(rots);
    }
    svgSpeeds.hide();

    //DB
    this.inputVals = $("#divMotors .num_rotary");
    for(var i=0;i<this.inputVals.length;i++) {
        //console.log("num_rotary:",i);
        this.inputVals.eq(i).val(0);
        $(this.inputVals[i]).data("index",i);
    }

    this.inputVals.on("change",function(){
        var index = $(this).data("index");
        var mode = dxlManager.getMode(index);
        var val = $(this).val();
        //console.log("num_rotary change:",index,mode,val);
        if(mode==0){
            dxlManager.setAngle(index,val);
            //self.angle(index,val); //rem called by dxlManager
        }
        else{
            dxlManager.setSpeed(index,val);
            //self.speed(index,val); //rem called by dxlManager
        }
    });
    this.inputVals.on("keydown",function(ev){
        //console.log("inputVals.on(keydown):",ev);
        if(ev.keyCode==13){
            var index = $(this).data("index");
            var mode = dxlManager.getMode(index);
            var val = $(this).val();
            if(mode==0){
                dxlManager.setAngle(index,val);
            }
            else{
                dxlManager.setSpeed(index,val);
            }    
        }
    });





    $("#divMotorSettings .cmd").on('change',function(){
        var index = $(this).data("index");
        var cmd = this.name;
        //var val = parseFloat(this.value);
        //console.log("DBG cmd:",index," ",cmd," ",v);
        self[cmd](index,this.value);
    });


    $(".motors .cmdTog").on('click',function(){
        var v = this.checked ? 1 : 0;
        var index = $(this).data("index");
        var cmd = this.name;
        console.log("*********** cmdTog:",index," ",cmd," ",v);
        if(self[this.name])
            self[cmd](index,v);
        else
            dxlManager.cmdOld(cmd,index,v);
    });

    $("#motor-freeze").on('click',function(){
        if($('#motor-freeze').is(":checked"))
            dxlManager.freezeAllMotors();
        else
            dxlManager.unfreezeAllMotors();
    });

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

    /*
        $(".playAnim").on("click",function(){
            UIplayAnim();
        var onoff = this.value; //$(this).data("onoff");
        console.log("Play:",onoff); //$(this).data("onoff"));
    });
    */

    $("#loadAnim").on("click",function(){
        //dialog.showOpenDialog({properties:['multiSelections']},function(filenames) {
        // /* versionHTML
        dialog.showOpenDialog({properties:['openFile','multiSelections']},function(filenames) {
            if(filenames){
                for(var i=0;i<filenames.length;i++) {
                    dxlManager.loadAnim(filenames[i]);
                }
            }
        });
        // * /
    });

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
            console.log("*** anim stop all");
            dxlManager.stopAllAnims();
            dxlManager.stopAllMotors();
        }
    });

    $("#loadSensor").on("click",function(){
        //dialog.showOpenDialog({properties:['multiSelections']},function(filenames) {
        // /* versionHTML
        dialog.showOpenDialog({properties:['openFile','multiSelections']},function(filenames) {
            if(filenames){
                for(var i=0;i<filenames.length;i++) {
                    //console.log("FILENAME",filenames[i]);
                    sensorManager.loadSensorFromGUI(filenames[i]);
                }
            }
        });
        // * /
    });

    $("#sensor-freeze").on('click',function(){
        if($('#sensor-freeze').is(":checked")){
            console.log("*** sensor freeze all");
            sensorManager.freezeAllSensors();
            dxlManager.stopAllMotors();
        }else{
            console.log("*** sensor unfreeze all");
            sensorManager.unfreezeAllSensors();
        }
    });

    // hide default animation, also when no animations are loaded
    var parent = $("#sortable-anim");
    var model = parent.find(".single-anim:first");
    model.hide();

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


    $("#addEmptySensor").on("click",function(){
        sensorManager.addEmptySensor();
    })


    /*
    //MOBILIZING : test de data-func
    $("#mbzOnOff").on("change",function(){
        console.log("mbzOnOff:",$(this).data("dest"),this.checked);
        //eval($(this).data("func"))(this.checked); this messed
        //eval($(this).data("func")).onOff(this.checked); this ok
        eval($(this).data("func")+"("+this.checked+");"); //ok
        
        
    });
    */
    

    $(".midiPlug").bind("mouseenter", midiPanelOver);//mouseover
    function midiPanelOver(){
        console.log("midi over");
        misGUI.scanMidiPorts();
    }
    

    //this.scanSerial();    /*Didier*/
    this.scanMidiPorts();
    this.scanIPv4(); //Didier

 
}//init


MisGUI.prototype.enableOSC = function(onoff){
    $("#divOSC").find("#btOSC").prop("checked",onoff);
}

MisGUI.prototype.showOSC = function(settings){
    console.log("==========showosc:",settings);
    var div = $("#divOSC");
    div.find("[name=oscLocalPort]").val(settings.oscLocalPort);
    div.find("[name=oscRemoteIP]").val(settings.oscRemoteIP);
    div.find("[name=oscRemotePort]").val(settings.oscRemotePort);    
}


MisGUI.prototype.clearDxlRegs = function(id) {
    var inputs = $("#divDxlReg :input");
    inputs.val('?');
    $("#btAdvID").val(id);
    //dxlManager.startReadDxl(id); //async >> showDxlReg
}

MisGUI.prototype.showDxlReg = function(id,addr,val){
    var nm = ("000"+addr).slice(-3);
    var inp = $('#divDxlReg').find("[name="+nm+"]");
    if(inp){
        inp.val(val);
    }
}


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


MisGUI.prototype.divAnim = function(animId){
    return $('.single-anim[data-id='+animId+']');
}

MisGUI.prototype.addAnim = function(animId,aName,keyCode) {
    console.log("================MisGUI:addAnim:", animId, " ", aName);

    var self = this;
    //var parent = $("#divAnims").find("[name=listAnims]");
    var parent = $("#sortable-anim");
    var model = parent.find(".single-anim:first");
    model.hide();
    var clone = model.clone();
    clone.attr('data-id', animId); //select only find attr
    clone.children().data("id", animId); //only first level !!! !!! !!!

    clone.find("input").attr('data-id', animId);
    clone.find("button").attr('data-id', animId);

    var tracks = clone.find("[name=track]");
    var nt = tracks.length;
    for (var i = 0; i < nt; i++) {
        $(tracks[i]).prop("class", "motor-none");
        $(tracks[i]).data("index", i);
    }

    tracks.on("click", function () {
        var v = this.checked ? 1 : 0;
        //console.log("DBG_track:", $(this).data("id"), " i:", $(this).data("index"), " ", v);
        self.track($(this).data("id"));
    });

    clone.find(".close").on("click", function () {
        //killAnim
        var animId = $(this).data("id");
        var a = self.divAnim(animId);
        if (a.length > 0) {
            a.remove();
            dxlManager.removeAnim(animId);
        }
        console.log("GUI.killanim:");
        //self.setSensorAnims();  //?????      
        MisGUI_sensors.setSensorAnims();
    });

    clone.find(".play").on("click", function () {
        UIplayAnim(this);
        dxlManager.startAnim($(this).data("id"));
    });

    clone.find(".stop").on("click", function () {
        console.log("stop:", $(this).data("id"));
        dxlManager.stopAnim($(this).data("id"));
        UIstopAnim(this);
    });


    clone.find(".loop").css("opacity",0.6);

    clone.find(".loop").on("click", function () {
        var onoff = UIloopAnim(this);
        dxlManager.loopAnim($(this).data("id"), onoff);
    });

    clone.find("[name=animName]")
        .val(aName)
        .on("change", function () {
            var zis = $(this);
            dxlManager.renameAnim(zis.data("id"), zis.val());
            //self.setSensorAnims();
            MisGUI_sensors.setSensorAnims();
        });

    clone.find("[name=animKey]")
        .val(keyCode)
        .on("change",function(){
            var zis = $(this);
            dxlManager.setKeyCode(zis.data("id"),zis.val());
    });


    /*
        //bt.data("id",this.animId);
        bt.on("click",function(){
            var id = $(this).data("id");
            console.log("ClickAnim id:",id," ",this.name);
        }).data("id",animId);
    */


    clone.insertAfter(model);
    clone.show();

    //this.setSensorAnims();
    MisGUI_sensors.setSensorAnims();
    
}

MisGUI.prototype.playAnim=function(id,v){
    if(v>0)dxlManager.startAnim(id);
    else dxlManager.stopAnim(id);
}

MisGUI.prototype.animCheck=function(animId,v){
    if(v)UIplayAnim(this.divAnim(animId).find(".play"));
    else UIstopAnim(this.divAnim(animId).find(".stop"));
}

MisGUI.prototype.animLoopOnOff=function(animId,onoff){
    var bt = this.divAnim(animId).find(".loop:first");
    if(bt){
        UIloopAnim(bt,onoff);
    }
}


MisGUI.prototype.animProgress=function(animId,v) {
    //$('.divAnim[data-id=' + animId + ']:first').find('[name="progress"]:first').val(v);
    var parent = $('.single-anim[data-id='+animId+']');
    parent.find('[name="progress"]:first').val(v);
}


/**
 *
 * @param animId
 * @param tracks {play:true,i:imot,f:"angle"}
 */
MisGUI.prototype.animTracks=function(animId,tracks){
    var parent = $('.single-anim[data-id='+animId+']')
    //console.log("DBG_animTracks:",parent.length);
    var bts = parent.find('[name="track"]');
    var nbt = bts.length;
    for(var i=0;i<nbt;i++){
        $(bts[i]).prop("class","motor-none").prop("checked",false);
    }
    for(var i=0;i<tracks.length;i++){
        var im = tracks[i].i; //!!! test nbm
        console.log("DGBtracks:",tracks[i].f);

        if(tracks[i].f=="angle")$(bts[im]).prop("class","motor-angle");
        else if(tracks[i].f=="speed")$(bts[im]).prop("class","motor-speed");
        $(bts[im]).prop("checked",true);
    }

};


MisGUI.prototype.track=function(animId,v) {
    var parent = $('.single-anim[data-id='+animId+']')
    var bts = parent.find('[name="track"]');
    for(var i=0;i<bts.length;i++) {
        var onoff = $(bts[i]).prop("checked");
        console.log("click track:",i," ",onoff);
        dxlManager.animChannel(animId,i,onoff);
    }
}

MisGUI.prototype.divSensor = function(sensorId){
    return $('.single-sensor[data-id='+sensorId+']');
}

MisGUI.prototype.addSensor = function(settings, id){
    //console.log("CLONE",id);
    var self = this;
    var parent = $(".sensors").find("[name=listSensors]");
    var model = parent.find(".single-sensor:first");
    model.hide();
    var clone = model.clone();
    clone.attr('data-id', id); //select only find attr
    //clone.children().data("id", id); //only first level !!! !!! !!!
    clone.find('*').data("id", id); //only first level !!! !!! !!!

    //clone.find("input").attr('data-id', id);
    //clone.find("button").attr('data-id', id);
    //clone.find("button").attr('data-id', id);
    // and also select/option in this case no???

    //clone.find(".cmdTog") //GRRRRRRRRRRRR 
    clone.find("[name=sensorOnOff]")
        .attr('data-id', id)
        .attr('checked',settings.enabled)
        .on("click",function(){
            //console.log("sensorOnOff:",id,v);    
            var v = this.checked ? true : false;
            var id = $(this).data("id");
            sensorManager.sensorEnable(id,v);
        });
    
    //var nm = clone.find("[name=sensorName]");
    //console.log("------sensorName:",nm.length);

    clone.find("[name=sensorName]")//(".name")
        .val(settings.name)
        .on("change", function () {
            sensorManager.onName($(this).data("id"), $(this).val());
    });


    // clone.find("[name=tolerance]") //(".tolerance")
    //     .val(settings.tolerance)
    //     .on("input",function(){
    //         sensorManager.onTolerance($(this).data("id"), $(this).val());
    //         //toleranceUI(clone.find(".tolerance-ui"), settings.tolerance, settings.threshold, settings.valMin, settings.valMax);
    //         clone.find(".slider-range").slider("option","toler",settings.tolerance);
    //         sensorAnimWidth(clone.find(".sensor-range"), settings.valMin, settings.valMax, settings.threshold, settings.tolerance);
    //         //clone inside callback ????
    //     });


    // clone.find(".close").on("click", function () {
    //     //self.removeSensor($(this).data("id"));
    //     console.log("guiremove:",$(this).data("id"));
    //     sensorManager.removeSensor($(this).data("id"));
    // });


    this.setSensorAnims();
    
    //clone.find(".listAnims").change(function(){ 
    clone.find("[class*='listAnims']").change(function(){
        var id = $(this).data("id"); //!!!parent.parent!!!
        console.log("animselect:",id,this.name,this.value);
        sensorManager.onChangeAnim(id,this.name,this.value);
    });
    clone.find("[name=anim1]").val(settings.amim1);
    clone.find("[name=anim2]").val(settings.amim2);
   


    var thres = settings.threshold;
    var smin = settings.valMin;
    var smax = settings.valMax;

    var rng = clone.find(".sensor-range");
    rng.find(".minV").html(smin);
    rng.find(".currentV").html(thres);
    rng.find(".maxV").html(smax);
    
    // clone.find(".slider-range").slider({
    // $(".sensor-setting-more").find(".slider-range").slider({
    //     min: smin,
    //     max: smax,
    //     value: thres,
    //     toler: 789,
    //     slide: function( ev, ui ) {
    //         //console.log("slidetol:",$(this).slider("option","toler"));
    //         var id = $(this).data("id");
    //         var v  = $(this).slider("value");
    //         $(this).parent().find(".currentV").html(v);        
    //         // sensorManager.onThreshold(id,v);
    //         // sensorAnimWidth(ev, min, max, v);
    //         //console.log("slide:",id,min,max);
    //         //sensorAnimWidth(clone.find(".sensor-range"), min, max, v, settings.tolerance); 
    //         //GRRRRRRRRRRRRRRRRRRRRRR min max settings !!!!!
    //         sensorAnimWidth($(this).find(".sensor-range")
    //                 , $(this).slider("option","min")
    //                 , $(this).slider("option","max")
    //                 , v
    //                 , $(this).slider("option","toler")
    //         );
    //     },
    //     stop: function(ev,ui) {
    //         var v  = $(this).slider("value");
    //         // sensorManager.onThreshold(id,v);
    //         sensorManager.saveSensorSettings();            
    //     }
    // });

    clone.find(".cmdOnOff").on("click",function(){
        console.log("cmdOnOff:",$(this).data("id"),this.name,this.checked ? true : false);
        sensorManager.changeSetting($(this).data("id"),this.name,this.checked ? true : false);
    })

    clone.find(".cmdInt").change(function(){
        console.log("cmdInt:",$(this).data("id"),this.name,parseInt($(this).val()));
        sensorManager.changeSetting($(this).data("id"),this.name,parseInt($(this).val()));
    })

    clone.find(".cmdString").change(function(){
        console.log("cmdString:",$(this).data("id"),this.name,$(this).val());
        sensorManager.changeSetting($(this).data("id"),this.name,$(this).val());
    })


    parent.append(clone); 
    //this.setSensorRange(id,settings.valMin,settings.valMax,settings.threshold);//after append
    clone.show();
    //indexMotor();


    // clone.find(".moreSensorSetting").bind('click', sensorSettings);
    // clone.find(".options .cmdOnOff").bind('click', echoActiveSetting);

    //Didier ...
    /*
    clone.find("[name=cm9Enabled]")
        .attr('data-id', id)
        .attr('checked',settings.cm9Enabled)
        .on("click",function(){
        //var v = this.checked ? true : false;
        sensorManager.changeSetting(id,"cm9Enabled",this.checked ? true : false);
    });
    clone.find("[name=cm9Pin]").change(function(){
        sensorManager.changeSetting(id,"cm9Pin",parseInt($(this).val()));
    });
    */

    this.changeSensor(settings,id);
    
}

MisGUI.prototype.logMinMax = function(id){
    var ssor = this.divSensor(id);
    console.log("------------3 changeSensor:",ssor.find(".slider-range").slider("option","max"));
}    

MisGUI.prototype.changeSensor = function(settings, id){
    var self = this;
    var ssor = this.divSensor(id);

    //these may be useful later ?
    //ssor.find(".name").val(settings.name);
    //ssor.find(".tolerance").val(settings.tolerance);
    //ssor.find("[name=anim1]").val(settings.amim1);
    //ssor.find("[name=anim2]").val(settings.amim2);
    
    var rng = ssor.find(".sensor-range");
    rng.find(".minV").html(settings.valMin);
    //rng.find(".currentV").html(settings.threshold);
    rng.find(".maxV").html(settings.valMax);

    //console.log("------------7 changeSensor:",ssor.find(".slider-range").slider("option","max"));
    var sld = ssor.find(".slider-range");
    sld.slider( "option","min",+settings.valMin );
    sld.slider( "option","max",+settings.valMax );
    sld.slider( "option","toler",+settings.tolerance );
        
    //console.log("RNG:",rng.slider( "option","min"));

    //Didier ...
    ssor.find("[name=valMin]").val(settings.valMin);
    ssor.find("[name=valMax]").val(settings.valMax);
    //toleranceUI(ssor.find(".tolerance-ui"), settings.tolerance, settings.threshold, settings.valMin, settings.valMax);    
    sensorAnimWidth(ssor.find(".sensor-range"),settings.valMin,settings.valMax,settings.threshold, settings.tolerance);
    
    ssor.find("[name=oscEnabled]").attr('checked',settings.oscEnabled);

    var midiSelection = ssor.find("[name=midiPort]");
    midiSelection.empty();
    for(var i=0; i<midiPortManager.midiPorts.length; i++){
        if(midiPortManager.midiPorts[i].enabledOnGUI){ // TODO: ou tester juste enable.. a voir le 2-3
            var p = midiPortManager.midiPorts[i].portName;
            midiSelection.append($("<option value=" + "'" + p + "'>" + p + "</option>"));
        }
    }

    ssor.find("[name=midiEnabled]").attr('checked',settings.midiEnabled);
    ssor.find("[name=midiPort]").val(settings.midiPort);
    ssor.find("[name=midiMapping]").val(settings.midiMapping);
    ssor.find("[name=midiCmd]").attr('checked',settings.midiCmd);
    
    ssor.find("[name=cm9Enabled]").attr('checked',settings.cm9Enabled);
    ssor.find("[name=cm9Pin]").val(settings.cm9Pin);
    ssor.find("[name=mobilizingEnabled]").attr('checked',settings.mobilizingEnabled);
    ssor.find("[name=fromMotorEnabled]").attr('checked',settings.fromMotorEnabled);
    ssor.find("[name=fromMotorIndex]").val(settings.fromMotorIndex);
    ssor.find("[name=toMotorEnabled]").attr('checked',settings.toMotorEnabled);
    ssor.find("[name=toMotorIndex]").val(settings.toMotorIndex);
    
}



// wich = "anim1" or "anim2" cf html 
MisGUI.prototype.selectSensorAnim = function(sensorID, wich, name){        
    var div = this.divSensor(sensorID);

    var sel = div.find(".listAnims [name="+wich+"]");
    if( (name==undefined)||(name.length<1) )
        name = "none";
    sel.val(name);
}

MisGUI.prototype.setSensorValue = function(sensorID, sensorValue, percent){
    var div = this.divSensor(sensorID);
    div.find(".live-value").html(sensorValue.toString().substr(0,6));
    if(percent < 0 ) percent = 0;
    if(percent > 100) percent = 100;
    div.find(".live-value-ui").css("left", percent+"%");
}

MisGUI.prototype.getSensorTolerance = function(sensorID){
    var div = this.divSensor(sensorID);
    return div.find("[name=tolerance]")/*(".tolerance")*/.value();
}
MisGUI.prototype.setSensorTolerance = function(sensorID,val){
    var div = this.divSensor(sensorID);
    console.log("setSensorTolerance:")
    //....
}

MisGUI.prototype.setSensorAnims = function(names){
    
    if(names==undefined){ //get names from html
        var qnames = $("[name=animName]");
        names = [];    
        qnames.each(function() {
            names.push($(this).val());
        });
    }
    
    var sel = $("#sortable-sens").find("[class*='listAnims']"); //listAnims-1 & listAnims-2
    
    //console.log("setSensorAnims:",names);
    //console.log("selectanims:",sel.length);

    sel.empty();
    sel.append($("<option value=" + "'" + "none" + "'>" + "none" + "</option>"));
    for(var i=0;i<names.length;i++){
        if(names[i].length>0)
            sel.append($("<option value=" + "'" + names[i] + "'>" + names[i] + "</option>"));
    }

    //restore current selection
    sel.each(function(){
        var id = $(this).data("id");
        if(id!=undefined){
            var nm = $(this).attr("name");
            var n = sensorManager.getSensorSetting(id,nm);
            $(this).val(n);
        }

    });
}

/*
MisGUI.prototype.setSensorRange = function(sensorID,min,max,val){

    var div = this.divSensor(sensorID).find(".sensor-range");
    //div.find(".slider-range").val(val);
    var slid = div.find(".slider-range:first");

    div.find(".minV").html(min);
    div.find(".maxV").html(max);

    hmin = div.find(".minV");
    console.log("rangediv:",hmin);
    
    console.log("slider-range:",sensorID,min,max,val);
    slid.data("min",min);
    slid.data("max",max);
    if(val != undefined){
        slid.data("value",val); //???
    }
    //console.log("slider-range:",slid);
    //GRRRR
    //slid.slider( "value", val );
    //slid.slider( "option", "value", val );
    //$(slid).data( "value", val );
    //$(".slider-range").slider( "value", val );
    //var v = slid.slider("value");
    //console.log("slider-range:",slid);  
};
*/

/*
MisGUI.prototype.getSensorThres = function(sensorID){
    //GRRRRRRRR
}
*/
//MisGUI.prototype.removeSensor = function(sensorID){
MisGUI.prototype.removeSensor = function(sensorID){
    var div = this.divSensor(sensorID);
    console.log("remove:",div);
    div.remove();
};   



/*Didier
MisGUI.prototype.scanSerial = function(){
    var self = this;
    var selector = $("#selectSerial");
    selector.empty();
    selector.append($("<option value='' ></option>"));
    cm9Com.list(function(ports){
        for (var i = 0; i < ports.length; i++) {
            var p = ports[i];
            var n = p;
            if (p.indexOf("/dev/") == 0)
                n = p.substring(5);
            selector.append($("<option value=" + "'"+p+"'>" + n + "</option>"));
            if (n.indexOf("usb") >= 0) {
                selector.val(n); //par default
            }
        }
        selector.append($("<option value='scan' >scan</option>"));
        if(self.serialPort != null)
            $("#selectSerial").val(self.serialPort);
    });
};
*/

MisGUI.prototype.scanMidiPorts = function(){
    var self = this;
    var sel = $("#midi-available");
    
    console.log("Scanning midi ports");

    sel.empty();

    if(midiPortManager){  
        midiPortManager.hidePortsFromGUI();
        for(var i=0;i<100;i++){
            var n = midiPortManager.getPortName(i);
            if(n){
                //console.log("Found midi port: " + n);
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


MisGUI.prototype.setSensorRange = function(id,min,max,tolerance,threshold){
    console.log("setSensorRange:");
    var div = this.divSensor(id);
    //toleranceUI(div.find(".tolerance-ui"),tolerance,threshold,min,max);
    // sensorAnimWidth(div.find(".sensor-range"),min,max,threshold,tolerance);
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
function indexMotor(){
    for (var i = 0; i < $(".motor-index").length; i++) {
        $(".motor-index").eq(i).html(i+1);
        console.log(i);
    };
}



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

$(".midiPlug").bind("mouseover", midiPanelOver);
function midiPanelOver(){
    console.log("midi over");
}


    
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

$("#closeDxl").on('click',function(){
    $("#dynamixel-ctrl").css("display","none");
})

var openDxlControl = function(index){
    $("#dynamixel-ctrl").css("display", "block");
    var dxlID = dxlManager.getIDByIndex(index);
    $("#btAdvID").val(dxlID);
    console.log("dxlCtrl:",index,dxlID);
    misGUI.clearDxlRegs(dxlID); //refresh
    dxlManager.startReadDxl(dxlID); //async >> showDxlReg            
}

//before cleaning : 2162
