function event() {
	this.addlistener = addlistener;
}

function addlistener() {
	var onmessage = function(e) {
		var data = new Object();
		data = JSON.parse(e.data);
		var origin = e.origin;
		var source = e.source;
		Channel.ClearMessage();
		
		if (getFrameName(source) == 'MQbN') {
			Channel.message = data;
			Channel.Send('Graph');
		} else if (getFrameName(source) == 'Graph') {
			if (data.type == 'executeQuery') {
				activateComp('result', data.content.query);
				Channel.message = data;
				setTimeout(function() {
					Channel.Send('Table');
				}, 1000);
			} else if (data.type == 'resultViewComplete') {
				activateComp('queryFormulation');
			} else if (data.type == 'confirm') {
				confirm(data.content.mss, data.content.bck);
			} else if (data.type == "info") {
				inform(data.content.mss);
			} else if (data.type == 'temporal') {
				callWidget(data);
			} else if (data.type == 'Qconfig'){
				callWidget(data);
			} else if (data.type == 'reExecuteQuery') {
				if ($('#bottom_res').is(":visible")) {
					Channel.message = data;
					setTimeout(function() {
						Channel.Send('Table');
					}, 1000);
				}
			} else {
				//TODO:revert once you have graph-tabular sync
				//if (!$('#bottom_res').is(":visible")) {
				Channel.message = data;
				Channel.Send('MQbN');
				Channel.Send('Faceted');
				//	}
			}
		} else if (getFrameName(source) == 'Faceted') {

			if (data.type == 'geoLocation') {
				callWidget(data);
			} else {
				Channel.message = data;
				Channel.Send('Graph');
			}
		} else if (getFrameName(source) == 'widget') {
			Channel.message = data;
			if (data.type == 'temporal')
				Channel.Send('Graph');
			else if (data.type == 'Qconfig')
				Channel.Send('Graph');
			else
				Channel.Send('Faceted');
			$("#popupWidget").popup("close");
		} else if (getFrameName(source) == 'Table') {
			Channel.message = data;
			if (data.type == "sequence" || data.type == "aggregate" || data.type == "stream_op")
				Channel.Send('Graph');
		}

	};

	if ( typeof window.addEventListener != 'undefined') {
		window.addEventListener('message', onmessage, false);
	} else if ( typeof window.attachEvent != 'undefined') {
		window.attachEvent('onmessage', onmessage);
	}
}

function getFrameName(source) {
	for ( i = 0; i < window.frames.length; i++) {
		// This possibly matches for cross origin
		// because in both cases window{} comes
		// if there were a another cross origin
		// frame it would also match
		if (window.frames[i] == source) {
			// Fix here later
			// can not call the name of frame if
			// it is from cross-origin
			if (i == 4)
				return "widget";
			else
				return window.frames[i].name;
		}
	}
}

Event = new event();
Event.addlistener();
