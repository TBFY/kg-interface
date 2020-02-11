function DataModel() {
	this.getQueries = getQueries;
	this.deleteQuery = deleteQuery;
	this.saveQuery = saveQuery;
	this.getQuery = getQuery;
	this.updateQuery = updateQuery;
	this.encodeSpecial = encodeSpecial;
	this.decodeSpecial = decodeSpecial;
	this.getBaseUrl = getBaseUrl;
	this.removeFormatting = removeFormatting;
}

//encode " to ' and escape
function encodeSpecial(text) {
	return escape(text.replace(/\"/g, "'"));
}

//decode
function decodeSpecial(text) {
	text = unescape(text);
	return text.replace(/\'/g, "\"");
}

function removeFormatting(text){
	
	return text.replace("\t", "").replace(/\r?\n|\r/g, " ");
}

//find the base url
function getBaseUrl() {
	var base;

	if (getURLParameter($(parent.location).attr('href'), "base") != null) {
		base = getURLParameter($(parent.location).attr('href'), "base");
	} else {

		if (window.location.protocol == 'http:' || window.location.protocol == 'https:')
			base = window.location.protocol + "//" + window.location.host;
		else
			base = window.location.host;
	}

	return base;
}

//extract url parameters
function getURLParameter(url, name) {
	return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
}

// delete query
function deleteQuery(id) {
	$.ajax({
		url : this.getBaseUrl() + "/REST/JSON/getQFQueryCatalogAccess/?method=deleteQuery&params=[%22" + id + "%22]&id=1",
		dataType : 'json',
		context : document.body
	}).done(function(data) {
		dataModel.getQueries();
	});
}

//save query
function saveQuery(name, desc, sq, jq, st, typ) {
	var status;
	var data;

	//we only save as draft or final
	if (st == 'finalDraft')
		status = 'draft';
	else
		status = st;

	data = {
		method : 'saveQuery',
		id : '1',
		params : {
			name : name,
			desc : desc,
			sparqlquery : encodeSpecial(removeFormatting(sq)),
			jsonquery : encodeSpecial(jq),
			status : status,
			type: typ
		}
	};
	
	
	$.ajax({
		type : 'POST',
		url : this.getBaseUrl() + '/REST/JSON/getQFQueryCatalogAccess/',
		dataType : 'json',
		contentType : 'application/json',
		data : JSON.stringify(data),
		processData : false
	}).done(function(data) {
		
		// experiment stuff
		// remove if
		if (exp == "false")
			setQuery(data.result, st);

		dataModel.getQueries();
	});
}

//update query
function updateQuery(id, name, desc, sq, jq, st, typ) {
	var status;
	var data;

	//we only save as draft or final
	if (st == "finalDraft")
		status = "draft";
	else
		status = st;

	data = {
		method : 'updateQuery',
		id : '1',
		params : {
			queryID : id,
			name : name,
			desc : desc,
			sparqlquery : encodeSpecial(removeFormatting(sq)),
			jsonquery : encodeSpecial(jq),
			status : status,
			type: typ
		}
	};
	$.ajax({
		type : 'POST',
		url : this.getBaseUrl() + '/REST/JSON/getQFQueryCatalogAccess/',
		dataType : 'json',
		contentType : 'application/json',
		data : JSON.stringify(data),
		processData : false
	}).done(function(data) {
		setQuery(id, st);
		dataModel.getQueries();
	});
}

//load query
function getQuery(qId) {
	$.ajax({
		url : this.getBaseUrl() + "/REST/JSON/getQFQueryCatalogAccess/?method=getQuery&params=[%22" + qId + "%22]&id=1",
		dataType : 'json',
		context : document.body
	}).done(function(data) {
		var json = decodeSpecial(data.result.jsonQuery);
		tree.loadQuery(JSON.parse(json));
		setQuery(data.result.queryId, data.result.status);
		dataModel.getQueries();
	});
}

//get all the stored queries
function getQueries() {
	$.ajax({
		url : this.getBaseUrl() + "/REST/JSON/getQFQueryCatalogAccess/?method=getAvailableQueries&id=1",
		dataType : 'json',
		context : document.body
	}).done(function(data) {
		listQueries(data.result.options);
	});
}

dataModel = new DataModel();
