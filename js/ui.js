//UI



// Connexion
$(".btn-connexions").bind('click', showConnexion);

function showConnexion(){
	console.log("========showConnexion========"); //never ????
	$(".connexions").show("slide");
	$(".connexions").css("display", "block");
	$(".btn-connexions").unbind('click', showConnexion);
	$(".btn-connexions").bind('click', hideConnexion);

	$(".btn-connexions").html("close");
}


function hideConnexion(){
	$(".connexions").hide("slide");
	$(".connexions").css("display", "none");	
	$(".btn-connexions").bind('click', showConnexion);
	$(".btn-connexions").unbind('click', hideConnexion);

	$(".btn-connexions").html("Connexions");
}



// Motors panels

$("button.advanced").bind("click", function(){
	misGUI.toggleAdvanced(toggleAdvanced);

	if(toggleAdvanced){
		UIhideAdvanced();
	}else{
		UIshowAdvanced();
	}
})


$("#motor").bind('click', UIhideAdvanced);
$("#motor-adv").bind('click', UIshowAdvanced);

// default at start
UIhideAdvanced();

function UIshowAdvanced(){
	
	$("#motor").css("opacity", 0.3);
	$("#motor-adv").css("opacity", 1);

	$(".allMotors").css("z-index", -1);
	$(".allMotors ").css("display", "none");

	$(".motors-settings").css("z-index", 1);
	$(".motors-settings ").css("display", "block");

	//console.log("coucou");


}


function UIhideAdvanced(){
	console.log("hide");


	$("#motor").css("opacity", 1);
	$("#motor-adv").css("opacity", 0.3);

	$(".allMotors").css("z-index", 1);
	$(".allMotors ").css("display", "block");

	$(".motors-settings").css("z-index", -1);
	$(".motors-settings ").css("display", "none");
	
}


// switch animation/sensors/script

$("#sens").bind('click', showSensors);
$("#anims").bind('click', showAnimations);
$("#script").bind('click', showScript);

// default at start
showAnimations();

function showSensors(){

	// $(".sensorsBTN").css("display", "block");

	$(".sensors ").css("z-index", 1);
	$(".sensors ").css("display", "block");

	$(".animations ").css("z-index", -1);
	$(".animations ").css("display", "none");
	$(".script-panel").css("z-index", -1);
	$(".script-panel").css("display", "none");

	$(this).css("opacity", 1);
	$("#anims").css("opacity", 0.3);
	$("#script").css("opacity", 0.3);

}


function showAnimations(){

	$(".animations ").css("z-index", 1);
	$(".animations ").css("display", "block");

	$(".sensors ").css("z-index", -1);
	$(".sensors ").css("display", "none");
	$(".script-panel").css("z-index", -1);
	$(".script-panel").css("display", "none");




	$("#anims").css("opacity", 1);
	$("#sens").css("opacity", 0.3);
	$("#script").css("opacity", 0.3);

}

function showScript(){

	$(".script-panel ").css("z-index", 1);
	$(".script-panel ").css("display", "block");

	$(".sensors ").css("z-index", -1);
	$(".sensors ").css("display", "none");
	$(".animations").css("z-index", -1);
	$(".animations").css("display", "none");

	$(this).css("opacity", 1);
	$("#sens").css("opacity", 0.3);
	$("#anims").css("opacity", 0.3);

	editor.refresh();
}


// SCript function
$("#run-code").bind('click', function(){
	/*
	$(this).html('Running...');
	$(this).addClass('active');
	$(this).css('opacity', 0.5);
	*/
	/*
	$("#run-code").html('Running...');
	$("#run-code").addClass('active');
	$("#run-code").css('opacity', 0.5);
	$("#stop-code").css('opacity', 1);
	console.log("#runcode:2",this);
	*/
})
function runcode(){
	$("#run-code").html('Running...')
		.addClass('active')
		.css('opacity', 0.5)
	$("#stop-code").css('opacity', 1);
}


//$("#stop-code").bind('click', stopCode);
function stopCode(){
	$("#run-code").html('Run')
		.removeClass('active')
		.css('opacity', 1);
	//$(this).css('opacity', 0.5);  //called from elsewhere (eg stopped before load)
	$("#stop-code").css('opacity', 0.5);
	//$("#stop-code").unbind('click', stopCode); //??? why ???
}

// FOR CODEMIROR (code editor in script mode)
var value = "// minimal example\n\n"
		  + "var a = 0\n\n"
		  + "dxl.setMode(0,'joint')\n\n"
		  + "this.loop = function(){\n"
		  + "  dxl.setAngle(0, Math.sin(a)*150 )\n"
		  + "  a+=0.2\n"
		  + "}\n";
			  
var editor = CodeMirror(document.body.getElementsByClassName("input-code")[0], {
	value: value,
	lineNumbers: true,
	mode: "javascript",
	keyMap: "sublime",
	autoCloseBrackets: true,
	matchBrackets: true,
	showCursorWhenSelecting: false,
	theme: "monokai",
	tabSize: 2
});




$( ".draggable" ).draggable();

$(".modale").css("display", "none");

$(".gear").bind("click", modaleGear);

function modaleGear(){
	var target = $(this).data("id");
	var mod = $("#"+target);	
	console.log("ui.js:open modale " + target);
	mod.css("display", "block");

	// mod.append('<button class="close-modale"><img src="assets/close.png" alt=""></button>');
	// Didier: close-modale n'est actif que si on l'a ouvert avec le 'gear' ???
	/*
	mod.find('.close-modale').bind('click', function(event) {
		mod.css("display", "none");
		console.log("close "+ target);
	});
	*/
	
};

$('.close-modale').on("click",function(){
	$(this).parents(".modale").css("display", "none");
})


function loadSensor(){

	var sensorElemtList = [];
	var sensorMinList = [];
	var sensorMaxList = [];
	var sensorDefList = [];
	// var sensorTargetList = [];

	for (var i = 0; i < $(".single-sensor").length; i++) {

		var target = $(".single-sensor").eq(i).find(".slider-range");

		sensorElemtList.push(target);


		var minVal = target.data('min');
		var maxVal = target.data('max');
		var defaultVal = target.data('default');
		// var targetAmount = $("#"+target.data('id')+"");

		console.log("UI loadSensor:",minVal, maxVal, defaultVal);



		target.slider({
		  //range: "min",
		  min: minVal,
		  max: maxVal,
		  value: 0,
		  
		  slide: function( event, ui ) {
				console.log("???slide???");
		  		var minVal = $(this).data('min');
				var maxVal = $(this).data('max');
				var defaultVal = $(this).data('default');

				$(this).parent().find(".minV").html(minVal);
				$(this).parent().find(".maxV").html(maxVal);
				$(this).parent().find(".currentV").html($(this).slider("value"));


		  },
		  create: function( event, ui ) {
			var minVal = $(this).data('min');
				var maxVal = $(this).data('max');
				var defaultVal = $(this).data('default');

				$(this).slider("value",120);
				

				$(this).parent().find(".minV").html(minVal);
				$(this).parent().find(".maxV").html(maxVal);
				$(this).parent().find(".currentV").html(defaultVal);
		  }
		});


	
	};



}




// Function to call for indexing sensors
loadSensor();





//RIGHT CLICK FOR SENSORS
$(".single-sensor").contextmenu(function(e) {
    contextmenuBox(e.pageX, e.pageY, "single-sensor");
    $(this).addClass('selected');

});

//RIGHT CLICK FOR SENSOR OUTPUT
$("#sortable-sens-output section").contextmenu(function(e) {
    contextmenuBox(e.pageX, e.pageY, "sensor-output");
    $(this).addClass('selected');
});

//RIGHT CLICK FOR ANIMATIONS
$(".single-anim").contextmenu(function(e) {
	console.log("youhou");
	$(".single-anim").removeClass('selected'); // careful.. in Alex code, there were two versions...
    contextmenuBox(e.pageX, e.pageY, "single-anim");
    $(this).addClass('selected');

});



// CONTEXT MENU

function contextmenuBox(x, y, elemt){

	console.log("elmt",elemt);

    if($(".context-box")){
        $(".context-box").remove();
        $("#sortable-sens-output section").removeClass('selected');
        //$("#sortable-sens .selected").removeClass('selected');
    }

    // SENSOR-OUTPUT CASE
    if(elemt === "sensor-output"){
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

		// TODO: check if it is still working
        $(".remove-output").bind("click", removeSensorOutput);
    
    }

	// SINGLE-SENSOR CASE
	// TODO: in the previous version, we used the cross button... be sure it works!!
    else if(elemt === "single-sensor"){

        var div = document.createElement("DIV");
        div.className = "context-box";
        div.style.left = x+"px";
        div.style.top = y+"px";

        var span1 = document.createElement("SPAN");
        span1.innerHTML = "Edit";
        span1.className = "edit-context";


        var span2 = document.createElement("SPAN");
        span2.innerHTML = "Remove";
        span2.className = "remove-sensor";


        div.appendChild(span1);
        div.appendChild(span2);


        document.body.appendChild(div);

        $(".remove-sensor").bind("click", function(){
            var eltID = $("#sortable-sens .selected").attr('eltID');
			sensorManager.removeSensor(eltID);
        });


    }

    // ANIMATION
    else if(elemt === "single-anim"){
		console.log("yeeh ain single anim");
		
    	var div = document.createElement("DIV");
        div.className = "context-box";
        div.style.left = x+"px";
        div.style.top = y+"px";

        var span1 = document.createElement("SPAN");
        span1.innerHTML = "Edit";
        span1.className = "edit-context";


        var span2 = document.createElement("SPAN");
        span2.innerHTML = "Remove";
        span2.className = "remove-animation";


        div.appendChild(span1);
        div.appendChild(span2);


        document.body.appendChild(div);

         $(".remove-animation").bind("click", function(){
			MisGUI_anims.removeAnimation();
        });
    }

    $("body").bind("click", removeContext);

}

function removeContext(){
    if($(".context-box")){
        $(".context-box").remove();
        $("#sortable-sens-output section").removeClass('selected');      
        $("#sortable-sens .selected").removeClass('selected');
    	$(".single-anim").removeClass('selected');

    }
}


/*
//clone.find("[name=animKey]")
$(single-motor).find("[name=mapping]")
	.val(keyCode)
	.on("change",function(){
		var zis = $(this);
		//dxlManager.setKeyCode(zis.data("id"),zis.val());
	}
//});
*/


