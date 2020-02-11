function channel(){
	var message;
	// methods
	this.Send	=	Send;
	this.ClearMessage = ClearMessage; 
}	

function Send(receiver){
	if(receiver == 'parent' )
		window.parent.postMessage(JSON.stringify(Channel.message), '*'); 
	else
		window.frames[receiver].postMessage(JSON.stringify(Channel.message), '*'); 
}

//clear message object
function ClearMessage() {
	for (prop in Channel.message) {
		if (Channel.message.hasOwnProperty(prop)) {
			delete Channel.message[prop];
		}
	}
}

Channel	=	new channel();
Channel.message = new Object();






