$(document).ready(function() {
	//cache false
	$.ajaxSetup({ cache: false });
	
	//load content first
	informLoad();

	if (getURLParameter($(location).attr('href'), "ont") == null) {
		//list available ontologies
		$.ajax({
			url : getBaseUrl() + "/REST/JSON/getQFOntologyAccess/?method=getAvailableOntologies&id=1",
			dataType : 'json',
			username : (getURLParameter($(location).attr('href'), "u") != null) ? getURLParameter($(location).attr('href'), "u") : "admin",
			password : (getURLParameter($(location).attr('href'), "p") != null) ? getURLParameter($(location).attr('href'), "p") : "iwb",
			context : document.body
		}).done(function(data) {
			for (var i = 0; i < data.result.length; i++) {
				$("#ontology").append('<option value="' + data.result[i] + '" selected="selected">' + data.result[i] + '</optio>');
			}
			$("#ontology").val('none');
			$("#ontology").selectmenu('refresh');
			$.mobile.hidePageLoadingMsg();
			$("#content").show();

		});
	} else {
		loadOntology(getURLParameter($(location).attr('href'), "ont"));
	}
	//load user selected ontology
	$("#loadOnt").on("click", function() {
		if ($("#ontology").val() != "none") {
			informLoad();
			loadOntology($("#ontology").val());
		}
	});

});
//show loading overlay
function informLoad() {
	//load content first
	$.mobile.loading('show', {
		text : 'Loading...',
		textVisible : true,
		theme : 'b',
		html : ""
	});
	$("#content").hide();
}

function loadOntology(ont) {
	//load ontology
	$.ajax({
		url : getBaseUrl() + "/REST/JSON/getQFOntologyAccess/?method=loadOntology&params=[%22" + ont + "%22]&id=1",
		dataType : 'json',
		username : (getURLParameter($(location).attr('href'), "u") != null) ? getURLParameter($(location).attr('href'), "u") : "admin",
		password : (getURLParameter($(location).attr('href'), "p") != null) ? getURLParameter($(location).attr('href'), "p") : "iwb",
		context : document.body
	}).done(function(data) {
		//console.log('ontology loaded!');
		//extract repository paramater and forward it to start.html
		var repository = (getURLParameter($(location).attr('href'), "repository") != null) ? getURLParameter($(location).attr('href'), "repository") : "RDF";
		var q = (getURLParameter($(location).attr('href'), "q") != null) ? getURLParameter($(location).attr('href'), "q") : "";
		var exp = (getURLParameter($(location).attr('href'), "exp") != null) ? getURLParameter($(location).attr('href'), "exp") : "false";
		var ds = (getURLParameter($(location).attr('href'), "ds") != null) ? getURLParameter($(location).attr('href'), "ds") : "";
		var base = getBaseUrl();
		//redirect
		window.location.href = "start.html?repository=" + repository + "&ontologyURI=" + ont + "&base=" + base+ "&ds="+ ds +"&exp="+exp+"&q="+q;
	});
}

//extract url parameters
function getURLParameter(url, name) {
	return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
}

//find the base url
function getBaseUrl() {
	var base;

	if (getURLParameter($(location).attr('href'), "base") != null) {
		base = getURLParameter($(location).attr('href'), "base");
	} else {

		if (window.location.protocol == 'http:' || window.location.protocol == 'https:')
			base = window.location.protocol + "//" + window.location.host;
		else
			base = window.location.host;
	}

	return base;
}
