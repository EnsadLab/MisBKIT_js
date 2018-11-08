

// BEGIN MisGUI_sensors NAMESPACE
var MisGUI_sensors = {}; // namespace javascript simulation

MisGUI_sensors.anim_names = [];


MisGUI_sensors.selectSensor = function(eltID){    
    if(eltID != undefined){
    /*
        $(".single-sensor").removeClass("activ");
        $(".single-sensor").filter("[eltID="+ eltID + "]").addClass("activ");
    */
        misGUI.radioActivate(".single-sensor",eltID);
    /*    
        $(".sensor-setting-more").hide();
        $(".sensor-setting-more").filter("[eltID="+ eltID + "]").show();
    */
       misGUI.radioHide(".sensor-setting-more",eltID);

    }
}

MisGUI_sensors.removeSensor = function(eltID){
    $(".single-sensor").filter("[eltID="+ eltID + "]").remove();
    $(".sensor-setting-more").filter("[eltID="+ eltID + "]").remove();
    //TODO TODO: in the case where this one was selected, should we select another automatically?
}

// takes as entryName: cm9, osc, midi, mobilizing or mapping
MisGUI_sensors.selectEntry = function(eltID,entryName){
    $(".sensor-setting-more .input-wrapper").filter("[eltID="+ eltID + "]").find("section").hide();
    $(".sensor-setting-more .input-wrapper").filter("[eltID="+ eltID + "]").find("section[name="+entryName+"]").show();
}

MisGUI_sensors.hideAllOutputEntries = function(eltID,entryName){
    //$(".sensor-setting-more").find("[id=sortable-sens-output]").filter("[eltID="+ eltID + "]").find("li").hide();
    $(".sensor-setting-more #sortable-sens-output").filter("[eltID="+ eltID + "]").find("section").hide();
   
}

MisGUI_sensors.showEntry = function(eltID,entryName){
    //$(".sensor-setting-more").find("[id=sortable-sens-output]").filter("[eltID="+ eltID + "]").find("li[name="+entryName+"]").show();
   $(".sensor-setting-more #sortable-sens-output").filter("[eltID="+ eltID + "]").find("section[name="+entryName+"]").show();
   
}

MisGUI_sensors.addEntry = function(eltID,entryName){
    //$(".sensor-setting-more").find("[id=sortable-sens-output]").filter("[eltID="+ eltID + "]").find("li[name="+entryName+"]").show();
    $(".sensor-setting-more #sortable-sens-output").find("section[name="+entryName+"]").filter("[eltID="+ eltID + "]").show();    
    var list = $(".sensor-setting-more #sortable-sens-output").filter("[eltID="+ eltID + "]");
    var items = list.children();
    list.find("li[name="+entryName+"]").insertBefore(items.first());
}


MisGUI_sensors.initMidiInput = function(eltID){
    var midiSelection = $(".sensor-setting-more .input-wrapper").filter("[eltID="+ eltID + "]").find("[name=midiPortInput]");
    midiSelection.empty();
    for(var i=0; i<midiPortManager.midiPorts.length; i++){
        if(midiPortManager.midiPorts[i].enabledOnGUI){ // TODO: ou tester juste enable.. a voir le 2-3
            var p = midiPortManager.midiPorts[i].portName;
            midiSelection.append($("<option value=" + "'" + p + "'>" + p + "</option>"));
        }
    }
}

MisGUI_sensors.initMidiOutput = function(eltID){
    var midiSelection = $(".sensor-setting-more").find("[id=sortable-sens-output]").filter("[eltID="+ eltID + "]").find("[name=midiPortOutput]");
    midiSelection.empty();
    for(var i=0; i<midiPortManager.midiPorts.length; i++){
        if(midiPortManager.midiPorts[i].enabledOnGUI){ // TODO: ou tester juste enable.. a voir le 2-3
            var p = midiPortManager.midiPorts[i].portName;
            midiSelection.append($("<option value=" + "'" + p + "'>" + p + "</option>"));
        }
    }
}

//TODO TODO: move this to setManagerValue??? elt.val(value); doesnt work for <p>
MisGUI_sensors.updateTextDescription = function(eltID,txt){
    $(".single-sensor").filter("[eltID="+ eltID + "]").find("[func=textDescription]").text(txt);
    //console.log("<p> type ??? ",$(".single-sensor").filter("[eltID="+ eltID + "]").find("[func=textDescription]").attr("type"));
}

MisGUI_sensors.changeOscAdress = function(eltID,adressInput, adressOutput){
    $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find("input[param=oscAdressInput]").val(adressInput);
    $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find("input[param=oscAdressOutput]").val(adressOutput);
}

MisGUI_sensors.changeSinusRandomParams = function(eltID,s){
    for(var k in s){
        //console.log("????",k,"a",s,"b",s[k]);
        $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find("input[param=" + k+"]").val(s[k]);
    }
}


MisGUI_sensors.changeMin = function(eltID,minValue){
    var sel = $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find(".slider-range");
    sel.slider( "option", "min" ,parseInt(minValue));
    var max = sel.slider( "option", "max" );
    var value = sel.slider( "option", "value");
    var tolerance = sel.slider( "option", "toler");
    this.sensorAnimWidth(eltID, minValue, max, value, tolerance);
}

MisGUI_sensors.changeMax = function(eltID,maxValue){
    var sel = $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find(".slider-range");
    var min = sel.slider( "option", "min" );
    sel.slider( "option", "max", parseInt(maxValue ));
    var value = sel.slider( "option", "value");
    var tolerance = sel.slider( "option", "toler");
    console.log("min",min,maxValue);
    this.sensorAnimWidth(eltID, min, maxValue, value, tolerance);
}

MisGUI_sensors.changeTolerence = function(eltID,tolerance){
    var sel = $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find(".slider-range");
    var min = sel.slider( "option", "min" );
    var max = sel.slider( "option", "max" );
    var value = sel.slider( "option", "value");
    sel.slider( "option", "toler",parseInt(tolerance));
    this.sensorAnimWidth(eltID, min, max, value, tolerance);
}

MisGUI_sensors.changeThreshold = function(eltID,threshold){
    var sel = $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find(".slider-range");
    var min = sel.slider( "option", "min" );
    var max = sel.slider( "option", "max" );
    sel.slider( "option", "value", threshold);
    var tolerance = sel.slider( "option", "toler");
    var selec = $("#sortable-sens-output .currentV").filter("[eltID="+ eltID + "]");
    selec.html(threshold);
    this.sensorAnimWidth(eltID, min, max, threshold, tolerance);

}

MisGUI_sensors.highlightAnim = function(eltID,animName){
    $(".sensor-setting-more").find("[class*='listAnims']").filter("[eltID="+ eltID + "]").removeClass("active");
    var sel = $(".sensor-setting-more ."+animName).filter("[eltID="+ eltID + "]").addClass("active");
}


MisGUI_sensors.sensorAnimWidth = function(eltID, min, max, cur, tolVal){

    console.log("sensorAnimWidth",min,max,cur,tolVal);
    minVal = min;
    maxVal = max;
    curVal = cur;
    tolVal = tolVal;

    selec = $("#sortable-sens-output .animation").filter("[eltID="+ eltID + "]");
    
    var total = Math.abs(max-min);
    
    percent = Math.abs(cur-min)*100/total;
    
    var anim1 = selec.find(".select-anim-1");
    var anim2 = selec.find(".select-anim-2");
    var curentVal = selec.find(".currentV");
    var tol_ui = selec.find(".tolerance-ui");
    var tol_Val = parseInt(tolVal);
    var til_Val_input = selec.find(".tolerance");



    anim1.width(parseInt(percent)+"%");
    anim2.width(parseInt(100-percent)+"%");

    curentVal.css("left", percent-50+"%");
    til_Val_input.css("left", percent-10+"%");


    MisGUI_sensors.toleranceUI(tol_ui, tolVal, cur, min, max);


}


MisGUI_sensors.toleranceUI = function(element, val, cur, min, max){

    console.log("toleranceUI",val);
    //var total = max+Math.abs(min) //again !!! GRRRR
    var total = Math.abs(max-min);
    
    element.width(val*100/total + "%");

    percent = Math.abs(min-cur)*100/total;
   
    var half_w = parseInt(element[0].style.width)/2;
    //console.log(percent);

    element.css("left", percent - half_w +"%");

}



MisGUI_sensors.initSlider = function(eltID,minVal,maxVal,threshold,tolVal){

    //console.log("minVal",minVal,maxVal,threshold,tolVal);

    minVal = parseInt(minVal);
    maxVal = parseInt(maxVal);
    tolVal = parseInt(tolVal);
    threshold = parseInt(threshold);
    //console.log("minVal2",minVal);
    $(".sensor-setting-more").filter("[eltID="+ eltID + "]").find(".slider-range").slider({
        min: minVal,
        max: maxVal,
        value: threshold,
        toler: tolVal,
        slide: function( ev, ui ) {
            var id = $(this).data("id");
            var v  = $(this).slider("value");
            $(this).parent().find(".currentV").html(v); 
            MisGUI_sensors.sensorAnimWidth($(this).attr("eltID")
                    ,  $(this).slider("option","min")
                    ,  $(this).slider("option","max")
                    , v
                    , $(this).slider("option","toler")
            );
    
            /// v = current value udated;

            // select threshold.. not working in html..
            // $(this).parent().find(".currentV").val(v);
    
        },
        stop: function(ev,ui) {
            var v  = $(this).slider("value");
            var eltID = $(this).attr("eltID");
            sensorManager.onThreshold(eltID,v);
            //sensorManager.saveSensorSettings(); 
    
            /// v = current value udated;
    
        }
    }); 
    MisGUI_sensors.sensorAnimWidth(eltID,minVal, maxVal, threshold, tolVal);
    var selec = $("#sortable-sens-output .currentV").filter("[eltID="+ eltID + "]");
    selec.html(threshold);
    //selec.val(threshold);
    

}

MisGUI_sensors.setSensorValue = function(eltID, sensorValue, percent, fsensorValue, fpercent){
    var div = $(".sensor-setting-more").filter("[eltID="+ eltID + "]");
    div.find(".live-value").html(fsensorValue.toString().substr(0,6));
    if(fpercent < 0 ) fpercent = 0;
    if(fpercent > 100) fpercent = 100;
    if(percent < 0 ) percent = 0;
    if(percent > 100) percent = 100;
    div.find(".live-value-ui").css("left", fpercent+"%"); // green circle
    div.find(".grey").css("left", percent+"%"); // gray circle
    var divThumbnail = $(".sensor-setting").filter("[eltID="+ eltID + "]");
    divThumbnail.find(".live-value-ui").css("left", percent+"%");
   // console.log("value",sensorValue);
}


MisGUI_sensors.setSensorAnims = function(names){
    
   
    if(names==undefined){ //get names from html
        var qnames = $("[name=animName]");
        names = [];    
        qnames.each(function() {
            names.push($(this).val());
        });
    }
    this.anim_names = names;
    
    var sel = $(".sensor-setting-more").find("[class*='listAnims']"); //listAnims-1 & listAnims-2
    

    sel.empty();
    sel.append($("<option value=" + "'" + "none" + "'>" + "none" + "</option>"));
    for(var i=0;i<names.length;i++){
        if(names[i].length>0)
            sel.append($("<option value=" + "'" + names[i] + "'>" + names[i] + "</option>"));
    }

    //restore current selection
    sel.each(function(){
        var eltID = $(this).attr("eltID");
        if(eltID!=undefined){
            var nm = $(this).attr("param");
            var n = sensorManager.getSensorSetting(eltID,nm);
            if(MisGUI_sensors.anim_names.includes(n)){
                $(this).val(n);
            }
        }

    });
}

MisGUI_sensors.initRobusSelect = function(gate,modules){
    var sels = $(".robusInput select").filter("[param='module']");; //[param*=module]");
    console.log("initRobusSelect:",sels.length);
}


// END MisGUI_sensors NAMESPACE simulation




//RIGHT CLICK FOR OUTPUT
/*
$("#sortable-sens-output section").contextmenu(function(e) {
    contextmenuBox(e.pageX, e.pageY);
    $(this).addClass('selected');
});
*/  

/*
function contextmenuBox(x, y){

    if($(".context-box")){
        $(".context-box").remove();
        $("#sortable-sens-output section").removeClass('selected');
    }

    var div = document.createElement("DIV");
    div.className = "context-box";
    div.style.left = x+"px";
    div.style.top = y+"px";

    var span1 = document.createElement("SPAN");
    span1.innerHTML = "Edit";
    span1.className = "edit-context";

    var span2 = document.createElement("SPAN");
    span2.innerHTML = "Remove";
    span2.className = "remove-output";

    div.appendChild(span1);
    div.appendChild(span2);

    document.body.appendChild(div);

    //$(".remove-output").bind("click", removeOutput);

    $("body").bind("click", removeContext);

}*/


/*
function removeContext(){
    if($(".context-box")){
        $(".context-box").remove();
        $("#sortable-sens-output section").removeClass('selected');      
    }
}
*/

function removeSensorOutput(){
    var eltID = $("#sortable-sens-output .selected").attr('eltID');
    var name = $("#sortable-sens-output .selected").attr('name');

    console.log("REMOVE OUTPUT ENTRY",eltID,name);

    $(".sensor-setting-more #sortable-sens-output .selected").filter("[eltID="+ eltID + "]").hide();
    $("#sortable-sens-output section").filter("[eltID="+ eltID + "]").removeClass('selected');  
    
    /// Update removed output.
    sensorManager.removeOutput(eltID,name);
}


/*
$(".currentV").on('input', changeCur);

function changeCur(element){
    curVal = $(this).val();

    $(".sensor-setting-more").find(".slider-range").slider({
        min: minVal,
        max: maxVal,
        value: curVal,
        toler: tolVal
    });

    sensorAnimWidth(element, minVal, maxVal, curVal, tolVal)

}*/
