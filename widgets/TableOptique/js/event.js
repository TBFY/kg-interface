function event() {
	this.addlistener = addlistener;
}

function addlistener() {
	var onmessage = function(e) {
		var data = JSON.parse(e.data);
		var origin = e.origin;
		dataModel.submitQuery(data);
	};

	if ( typeof window.addEventListener != 'undefined') {
		window.addEventListener('message', onmessage, false);
	} else if ( typeof window.attachEvent != 'undefined') {
		window.attachEvent('onmessage', onmessage);
	}
}

function getFrameId(source) {
	for ( i = 0; i < window.parent.frames.length; i++) {
		if (window.parent.frames[i] == source) {
			return i;
		}
	}
}

Event = new event();
Event.addlistener();
