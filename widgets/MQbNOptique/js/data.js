function DataModel() {
	this.getConcepts = getConcepts;
	this.processCore = processCore;
	this.processNeighbour = processNeighbour;
	this.findNameSpace = findNameSpace;
}

//get concepts and relatipnships pairs
function getConcepts(cId, id, reCreate) {
	if (cId == '0') {
		$.ajax({
		  url: config.sparqlBase,
		  dataType: "json",
		  data: {
				query: "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "+
							 "PREFIX owl: <http://www.w3.org/2002/07/owl#> "+
							 "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
							 "PREFIX vqs: <http://eu.optique.ontology/annotations#>\n"+
							 " SELECT ?c ?l "+
							 "WHERE {"+
							 "?c rdf:type owl:Class."+
							 "?c rdfs:label ?l. "+
							 "}" ,
		      format: 'json',
		      Accept: 'application/sparql-results+json'
		    },
		  success: function(data) {
				result = dataModel.processCore(data);
				mQbN.loadPage(id, result, reCreate);
				mQbN.changePage(id, 'slidefade');
		  }
		});
	} else {
		$.ajax({
		  url: config.sparqlBase,
		  dataType: "json",
		  data: {
				query:"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"+
							"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"+
							"PREFIX owl: <http://www.w3.org/2002/07/owl#>\n"+
							"SELECT DISTINCT ?p ?pl ?c ?cl ?w WHERE {\n"+
							"	{{SELECT ?s WHERE {?s rdfs:subClassOf <"+ cId +">}}\n"+
							"		UNION\n"+
							"	{SELECT ?s WHERE {<"+ cId +"> rdfs:subClassOf ?s}}\n"+
  						"		UNION\n"+
							"	{SELECT ?s WHERE {BIND(<"+ cId +"> AS ?s)}}}.\n"+
							"	{\n"+
							"		?p rdfs:domain ?s.\n"+
							"		?p a owl:ObjectProperty.\n"+
							"		?p rdfs:range ?c.\n"+
							"		BIND('direct' as ?w)\n"+
							"	} UNION {\n"+
							"		?p rdfs:domain ?s.\n"+
							"		?p a owl:ObjectProperty.\n"+
							"		?p rdfs:range ?t.\n"+
							"		?c rdfs:subClassOf ?t.\n"+
							"		BIND('direct' as ?w)\n"+
							"	} UNION {\n"+
							"		?p rdfs:range ?s.\n"+
							"		?p rdfs:domain ?c.\n"+
							"		?p a owl:ObjectProperty.\n"+
							"		BIND('inverse' as ?w)\n"+
							"	} UNION {\n"+
							"		?p rdfs:range ?s.\n"+
							"   	?p rdfs:domain ?t.\n"+
							"  		?p a owl:ObjectProperty.\n"+
							"   	?c rdfs:subClassOf ?t.\n"+
							"   	BIND('inverse' as ?w)\n"+
							"  } UNION {\n"+
							"  		?s rdfs:subClassOf ?cn.\n"+
							"  		?cn rdf:type owl:Restriction.\n"+
							"  		?cn owl:onProperty ?p.\n"+
							"  		?cn owl:someValuesFrom ?c.\n"+
							"  		BIND('direct' as ?w)\n"+
							"  } UNION {\n"+
							"   	?s rdfs:subClassOf ?cn.\n"+
							"  		?cn rdf:type owl:Restriction.\n"+
							"  		?cn owl:onProperty ?p.\n"+
							"  		?cn owl:someValuesFrom ?t.\n"+
							"   	?c rdfs:subClassOf ?t.\n"+
							"   	BIND('direct' as ?w)\n"+
							"  } UNION {\n"+
							"   	?cn owl:someValuesFrom ?s.\n"+
							"  		?c rdfs:subClassOf ?cn.\n"+
							"   	?cn rdf:type owl:Restriction.\n"+
							"   	?cn owl:onProperty ?p.\n"+
							"   	BIND('inverse' as ?w)\n"+
							"  } UNION {\n"+
							"   	?cn owl:someValuesFrom ?s.\n"+
							"   	?t rdfs:subClassOf ?cn.\n"+
							"   	?cn rdf:type owl:Restriction.\n"+
							"   	?cn owl:onProperty ?p.\n"+
							"   	?c rdfs:subClassOf ?t.\n"+
							"   	BIND('inverse' as ?w)\n"+
							"  } UNION {\n"+
							"  		?s rdfs:subClassOf ?cn.\n"+
							"  		?cn rdf:type owl:Restriction.\n"+
							"  		?cn owl:onProperty ?p.\n"+
							"  		?cn owl:allValuesFrom ?c.\n"+
							"  		BIND('direct' as ?w)\n"+
							"  } UNION {\n"+
							"   	?s rdfs:subClassOf ?cn.\n"+
							"  		?cn rdf:type owl:Restriction.\n"+
							"  		?cn owl:onProperty ?p.\n"+
							"  		?cn owl:allValuesFrom ?t.\n"+
							"   	?c rdfs:subClassOf ?t.\n"+
							"   	BIND('direct' as ?w)\n"+
							"  } UNION {\n"+
							"   	?cn owl:allValuesFrom ?s.\n"+
							"  		?c rdfs:subClassOf ?cn.\n"+
							"   	?cn rdf:type owl:Restriction.\n"+
							"   	?cn owl:onProperty ?p.\n"+
							"   	BIND('inverse' as ?w)\n"+
							"  } UNION {\n"+
							"   	?cn owl:allValuesFrom ?s.\n"+
							"   	?t rdfs:subClassOf ?cn.\n"+
							"   	?cn rdf:type owl:Restriction.\n"+
							"   	?cn owl:onProperty ?p.\n"+
							"   	?c rdfs:subClassOf ?t.\n"+
							"   	BIND('inverse' as ?w)\n"+
							"  } \n"+
							"	MINUS{?i owl:inverseOf ?p}\n"+
							"  	?p rdfs:label ?pl.\n"+
							"  	?c rdfs:label ?cl.\n"+
							"}",
		      format: 'json',
		      Accept: 'application/sparql-results+json'
		    },
		  success: function(data) {
				result = dataModel.processNeighbour(data);
				mQbN.loadPage(id, result, reCreate);
				mQbN.changePage(id, 'slidefade');
		  }
		});
	}
}

function processCore(data){
	var json = new Object();
	var ns = new Object();
	json.options = new Array();

	for(var i=0; i < data.results.bindings.length; i++){
		ns = dataModel.findNameSpace(data.results.bindings[i]["c"].value);
		json.options[i] = new Object();
		json.options[i].id = data.results.bindings[i]["c"].value;
		json.options[i].ns = ns.nspace;
		json.options[i].desc = "";
		json.options[i].cnt = 0;
		json.options[i].name = ns.name;
		json.options[i].label = data.results.bindings[i]["l"].value;
	}

	return json;
}

function processNeighbour(data){
	var json = new Object();
	var ns = new Object();
	var nsp = new Object();
	json.options = new Array();

	for(var i=0; i < data.results.bindings.length; i++){
		var el = data.results.bindings[i];
		//target ceoncept
		ns = dataModel.findNameSpace(el["c"].value);
		json.options[i] = new Object();
		json.options[i].id = el["c"].value;
		json.options[i].ns = ns.nspace;
		json.options[i].desc = "";
		json.options[i].cnt = 0;
		json.options[i].name = ns.name;
		json.options[i].label = el["cl"].value;
		//property
		nsp = dataModel.findNameSpace(el["p"].value);
		json.options[i].prop = new Object();
		json.options[i].prop.id = el["p"].value;
		json.options[i].prop.ns = nsp.nspace;
		json.options[i].prop.desc = (el["w"].value == "inverse" ? "(inv)" : "") + " " + el["pl"].value;
		json.options[i].prop.name = (el["w"].value == "inverse" ? "^" : "") + nsp.name;
		json.options[i].prop.label = (el["w"].value == "inverse" ? "(inv)" : "") + " " + el["pl"].value;
	}
	console.log();
	return json;
}

function findNameSpace(uri){
	var ns = new Object();

	ns.nspace = uri.replace(/(\/|#)[^#\/]*$/, "$1");
	ns.name = uri.replace (ns.nspace, "");
	
	return ns;
}

dataModel = new DataModel();
