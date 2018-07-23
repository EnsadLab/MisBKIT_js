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

	console.log("coucou");


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

	$(this).html('Running...');
	$(this).addClass('active');
	$(this).css('opacity', 0.5);	
	$("#stop-code").css('opacity', 1);	

	$("#stop-code").bind('click', stopCode);
	
})

function stopCode(){
	$("#run-code").html('Run');
	$("#run-code").removeClass('active');
	$("#run-code").css('opacity', 1);
	$(this).css('opacity', 0.5);
	$("#stop-code").unbind('click', stopCode);
}





// FOR CODEMIROR (code editor in script mode)
var value = "// Enter your code here";
  
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


