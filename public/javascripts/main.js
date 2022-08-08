let peerConnection = new RTCPeerConnection()
let localStream;
let remoteStream;

var hostArray = window.location.host.split(':');
var socket = null;
if (hostArray[0] == "localhost") {
    var socket = new WebSocket(`ws://${hostArray[0]}:3000`);
} else {
    socket = new WebSocket(`wss://${hostArray[0]}`);
}
socket.addEventListener("message", onWebSocketMessage, false);
let start = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    remoteStream = new MediaStream()
    document.getElementById('localVideo').srcObject = localStream
    document.getElementById('remoteVideo').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };
}


//1
let connect = async () => {
    //Create Offer
    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {

            console.log('createInitOffer ...:');

            socket.send(JSON.stringify({
                "messageType": "offer",
                "peerDescription": peerConnection.localDescription
            }));
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

//2
let createAnswer = async (offer) => {
    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('createAnswerOffer...:')
            socket.send(JSON.stringify({
                "messageType": "answer",
                "peerDescription": peerConnection.localDescription
            }));
        }
    };

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
}

//3
let addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(answer);
    }
}




// process messages from web socket 
function onWebSocketMessage(evt) {
    var message = JSON.parse(evt.data);

    switch (message.messageType) {
        case "offer":
            console.log("offer")
            createAnswer(message.peerDescription);
            break;
        case "answer":
            console.log("answer")
            addAnswer(message.peerDescription)
            break;
    }
}

document.getElementById('start').addEventListener('click', start);
document.getElementById('connect').addEventListener('click', connect);