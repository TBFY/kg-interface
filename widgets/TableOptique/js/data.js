function DataModel() {
	this.submitQuery = submitQuery;
	this.registerTQuery = registerTQuery;
}

function submitQuery(dt) {
	query = dt.content.query;

	if (dt.content.qtype == "plain") {
		if (dt.content.example == "yes") {

			//executing
			$.mobile.loading("show", {
				text : "Executing...",
				textVisible : true,
				theme : "z",
				html : ""
			});


			//submit the query
			$(document).ready(function() {
				$.ajax({
					url : config.resultBase,
					dataType : 'json',
					data: {
							query: dt.content.query,
				      format: 'json',
				      Accept: 'application/sparql-results+json'
				    },
					success : function(data) {
						$.mobile.loading("hide");
						Table.fillTable(data, dt);
					},
					error : function(textStatus, errorThrown) {
						$.mobile.loading("hide");
						$.mobile.loading('show', {
							text : 'Error!',
							textVisible : true,
							theme : 'a',
							textonly : true,
							html : ''
						});
					}
				});
			});
		} else {
			Table.fillTable("", dt);
		}
	} else {
		Table.fillTTable(dt);
	}
}

function registerTQuery() {
	data = {
		method : 'saveQuery',
		id : '1',
		params : {
			name : '',
			desc : '',
			sparqlquery : encodeSpecial(removeFormatting(query)),
			jsonquery : '',
			status : 'temporary',
			type : 'starql'
		}
	};

	$.ajax({
		type : 'POST',
		url : getBaseUrl() + '/REST/JSON/getQFQueryCatalogAccess/',
		dataType : 'json',
		contentType : 'application/json',
		data : JSON.stringify(data),
		processData : false
	}).done(function(data) {
		//extract repository paramater and forward it to iwb
		var repository = getRepository();
		//redirect
		var url = getBaseUrl() + "/resource/StarqlQuery?repository=streaming_test&query=" + encodeURIComponent(data.result);
		window.open(url, '_blank');
	});
}

//get repository
function getRepository() {
	return (getURLParameter($(parent.location).attr('href'), "repository") != null) ? getURLParameter($(parent.location).attr('href'), "repository") : "RDF";
}

//extract url parameters
function getURLParameter(url, name) {
	return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
}

//encode " to ' and escape
function encodeSpecial(text) {
	return escape(text.replace(/\"/g, "'"));
}

function removeFormatting(text) {
	return text.replace("\t", "").replace(/\r?\n|\r/g, " ");
}

dataModel = new DataModel();
