function DataModel() {
	this.getFields = getFields;
	this.getSubclasses = getSubclasses;
	this.processFields = processFields;
	this.processSubclasses = processSubclasses;
	this.findNameSpace = findNameSpace;
}

//get concepts and relatipnships pairs
function getFields(dt, reCreate) {
		$.ajax({
		  url: config.sparqlBase,
		  dataType: "json",
		  data: {
				query: "PREFIX owl: <http://www.w3.org/2002/07/owl#> \n"+
								"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n"+
								"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n"+
								"PREFIX ocds: <http://data.tbfy.eu/ontology/ocds#> \n"+
								" SELECT ?d ?dl ?r \n"+
								"WHERE {\n"+
								"  	{"+
								"    	?d a owl:DatatypeProperty.\n"+
								"    	?d rdfs:domain <" + dt.conceptId + ">.\n"+
								"    	OPTIONAL{?d rdfs:range ?r.}\n"+
								"  	}\n"+
								"  	UNION\n"+
								"  	{\n"+
								"    	?d a owl:DatatypeProperty.\n"+
								"    	?d rdfs:domain ?s.\n"+
								"    	<" + dt.conceptId + "> rdfs:subClassOf ?s.\n"+
								"    	OPTIONAL{?d rdfs:range ?r.}\n"+
								"  	}\n"+
								"    UNION\n"+
								"  	{\n"+
								"    	?d a owl:DatatypeProperty.\n"+
								"    	?d rdfs:domain ?s.\n"+
								"    	?s rdfs:subClassOf <" + dt.conceptId + ">.\n"+
								"    	OPTIONAL{?d rdfs:range ?r.}\n"+
								"  	}\n"+
								"  	UNION\n"+
								"  	{\n"+
								"    	<" + dt.conceptId + "> ocds:usesDataProperty ?d. \n"+
								"  	}\n"+
								"  	UNION\n"+
								"  	{\n"+
								"    	?s ocds:usesDataProperty ?d.\n"+
								"    	<" + dt.conceptId + "> rdfs:subClassOf ?s. \n"+
								"  	}\n"+
								"  	UNION\n"+
								"  	{\n"+
								"    	?s ocds:usesDataProperty ?d.\n"+
								"    	?s rdfs:subClassOf <" + dt.conceptId + ">. \n"+
								"  	}\n"+
								"  	?d rdfs:label ?dl. \n"+
								"}\n",
		      format: 'json',
		      Accept: 'application/sparql-results+json'
		    },
		  success: function(data) {
					var response = dataModel.processFields(data)
					dataModel.getSubclasses(dt, response, reCreate);
		  }
		});
}

//add subclass information
function getSubclasses(dt, response, reCreate) {
	$.ajax({
		url: config.sparqlBase,
		dataType: "json",
		data: {
			query: "PREFIX owl: <http://www.w3.org/2002/07/owl#> "+
						"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
						"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "+
						" SELECT ?c ?cl "+
						"WHERE {"+
						"?c rdfs:subClassOf <" + dt.conceptId + ">."+
						"?c rdfs:label ?cl. "+
						"}",
				format: 'json',
				Accept: 'application/sparql-results+json'
			},
		success: function(data) {
				var sub = processSubclasses(data);
				response.fields = response.fields.concat(sub);
				Facet.loadPage(dt.nodeId, response, reCreate);
				Facet.changePage(dt.nodeId, 'flip');
				Facet.sortPage(dt.output, dt.constraint);
		}
	});
}

function processFields(data){
	var json = new Object();
	var ns = new Object();
	json.fields = new Array();

	for(var i=0; i < data.results.bindings.length; i++){

		var e = jQuery.grep(json.fields, function(obj) {
				return obj.id === data.results.bindings[i]["d"].value;
		});

		if(e.length <= 0){
			json.fields.push(new Object());
			var indx = json.fields.length-1;

			ns = dataModel.findNameSpace(data.results.bindings[i]["d"].value);
			json.fields[indx].id = data.results.bindings[i]["d"].value;
			json.fields[indx].ns = ns.nspace;
			json.fields[indx].desc = "";
			json.fields[indx].name = ns.name;
			json.fields[indx].label = data.results.bindings[i]["dl"].value;
			json.fields[indx].inputType = "text";
			json.fields[indx].type = "string";

			if("r" in data.results.bindings[i]){
				var dpt = dataModel.findNameSpace(data.results.bindings[i]["r"].value);
				json.fields[indx].type = dpt.name;
			}

			if(json.fields[indx].type == "dateTime"){
					json.fields[indx].inputType = "date-range";
			} else if("mn" in data.results.bindings[i] && "mx" in data.results.bindings[i]){
				json.fields[indx].inputType = "rangeSlider";
				json.fields[indx].option = new Object();
				json.fields[indx].option.minInclusive = data.results.bindings[i]["mn"].value;
				json.fields[indx].option.maxInclusive = data.results.bindings[i]["mx"].value;
				json.fields[indx].option.stepValue = 1;
				if(json.fields[indx].type == "string")
					json.fields[indx].type = "integer";
			} else if(("vl" in data.results.bindings[i])){
				json.fields[indx].option = new Object();
				json.fields[indx].inputType = "select";
				var ops = jQuery.grep(data.results.bindings, function(obj) {
						return obj["d"].value === json.fields[indx].id;
				});
				for(var ix=0;ix<ops.length;ix++)
					json.fields[indx].option[ix] = ops[ix]["vl"].value ;
			}
		}
	}

	return json;
}

function processSubclasses(data){
	var json = [];
	var ns = new Object();
	var nsc = new Object();

	if( data.results.bindings.length > 0){
		var json = new Object();
		// general data
		json.id = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
		json.name = "type";
		json.ns = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
		json.desc = "subclass";
		json.label = "Type";
		json.inputType = "subclass";
		json.type = "concept";
		json.options = new Array();
		for(var i=0; i < data.results.bindings.length; i++){
			//subclass options
			nsc = dataModel.findNameSpace(data.results.bindings[i]["c"].value);
			json.options[i] = new Object();
			json.options[i].id = data.results.bindings[i]["c"].value;
			json.options[i].ns = nsc.nspace;
			json.options[i].desc = "";
			json.options[i].name = nsc.name;
			json.options[i].label = data.results.bindings[i]["cl"].value;
		}
	}

	return json;
}
// find the name space and name
function findNameSpace(uri){
	var ns = new Object();
	ns.nspace = uri.replace(/(\/|#)[^#\/]*$/, "$1");
	ns.name = uri.replace (ns.nspace, "");

	return ns;
}

//extract url parameters
function getURLParameter(url, name) {
	return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
}

dataModel = new DataModel();
