let mediaRecorder;
let audioChunks = [];

const startBtn = document.getElementById("startRecording");
const stopBtn = document.getElementById("stopRecording");
const status = document.getElementById("recordingStatus");

startBtn.addEventListener("click", async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });

    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.start();

    status.innerText = "🔴 Recording...";
    startBtn.disabled = true;
    stopBtn.disabled = false;

});

stopBtn.addEventListener("click", () => {

    mediaRecorder.stop();

    mediaRecorder.onstop = () => {

    const audioBlob = new Blob(audioChunks, {
        type: "audio/webm"
    });

    const audioURL = URL.createObjectURL(audioBlob);

    const player = document.getElementById("audioPlayer");

    player.src = audioURL;
    player.style.display = "block";

    const formData = new FormData();

formData.append(
    "audio",
    audioBlob,
    "recording.webm"
);

fetch("/upload-recording", {
    method: "POST",
    body: formData
})
.then(response => response.json())
.then(data => {

    console.log(data);

    status.innerText = data.message;

})
.catch(error => {

    console.error(error);

    alert(error);

    status.innerText = "Upload Failed";

});

};

    status.innerText = "✅ Recording Finished";

    startBtn.disabled = false;
    stopBtn.disabled = true;



});