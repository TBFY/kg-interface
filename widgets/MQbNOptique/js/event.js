function event() {
	this.addlistener = addlistener;
}

function addlistener() {
	var onmessage = function(e) {
		var data = new Object();
		data = JSON.parse(e.data);
		var origin = e.origin;

		if (data.type == 'nodeSelected' || data.type == 'nodeAdded') {
			mQbN.getPage(data.content.conceptId, data.content.conceptLabel);
		}
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
