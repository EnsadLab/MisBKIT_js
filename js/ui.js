//UI




$(".btn-connexions").bind('click', showConnexion);

function showConnexion(){
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


// switch animation/sensors 

$("#sens").bind('click', showSensors);
$("#anims").bind('click', showAnimations);

function showSensors(){
	$(".sensors ").css("z-index", 1);
	$(".sensors ").css("display", "block");

	$(".animations ").css("z-index", -1);
	$(".animations ").css("display", "none");
	$(".load").css("display", "none");
	$(".addSensors").css("display", "block");

	$(this).css("opacity", 1);
	$("#anims").css("opacity", 0.3);

}


function showAnimations(){
	$(".animations ").css("z-index", 1);
	$(".animations ").css("display", "block");

	$(".sensors ").css("z-index", -1);
	$(".sensors ").css("display", "none");

	$(".load").css("display", "block");
	$(".addSensors").css("display", "none");



	$(this).css("opacity", 1);
	$("#sens").css("opacity", 0.3);

}


$(".modale").css("display", "none");



$(".gear").bind("click", modaleGear);

$( ".draggable" ).draggable();


function modaleGear(){

	
	var target = $(this).data("id");
	var mod = $("#"+target);	
	console.log("open modale " + target);

	mod.css("display", "block");

	mod.append('<button class="close-modale"><img src="assets/close.png" alt=""></button>');

	mod.find('.close-modale').bind('click', function(event) {
		$(this).remove();
		mod.css("display", "none");
		console.log("close "+ target);
	});

}



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


