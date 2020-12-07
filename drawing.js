// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
A game using pitch Detection with CREPE
=== */

// Pitch variables
let crepe;
const voiceLow = 100;
const voiceHigh = 500;
let audioStream;
let stream;

const WIDTH = 1000;
const HEIGHT = 1000;
const PAPER_OFFSET = 10;

// Compute movement required for new line
var xMove = Math.round(WIDTH * .001);
var yMove = Math.round(HEIGHT * .001);

// Min must be 1
var X_MOVE = xMove ? xMove : 1;
var Y_MOVE = yMove ? yMove : 1;

console.log(X_MOVE);
console.log(Y_MOVE);

// Circle variables
const circleSize = 42;
const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Text variables
let goalNote = 0;
let currentNote = '';
const currentText = '';
let textCoordinates;
let paper;

let mouseDown = false;
let start, end, coordys;
let topPos = 0;
let leftPos = 0;

let withEmotions = 0;
const EMOTION_BUTTON_TXT_ADD = "Add Emotions"
const EMOTION_BUTTON_TXT_STOP = "Stop Emotions"


let request;
// taken from p5.Sound
function freqToMidi(f) {
  const mathlog2 = Math.log(f / 440) / Math.log(2);
  const m = Math.round(12 * mathlog2) + 69;
  return m;
};

function map(n, start1, stop1, start2, stop2) {
  const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  return newval;
};



async function setup() {
  paper = createPaper(WIDTH, HEIGHT);
  textCoordinates = [WIDTH / 2, 30];

  area = paper.rect(PAPER_OFFSET,PAPER_OFFSET, WIDTH, HEIGHT);
  area.attr({fill: "grey"});

  topPos = document.getElementById("paper").offsetTop;
  leftPos = document.getElementById("paper").offsetLeft;

  // EVENTS
  area.mousedown(function (event) {
     mouseDown = true;
     start = { x: event.clientX - leftPos,
              y: event.clientY - topPos};
     console.log("start: ");
     console.log(start.x + " " +start.y)
  });
  area.mouseup(function (event) {
     mouseDown = false;
    });

  area.mousemove(function (event) {
     coordys = { x: event.clientX - leftPos,
              y: event.clientY - topPos};
     if (mouseDown) {
      var xMovement = Math.abs(start.x - coordys.x);
      var yMovement = Math.abs(start.y - coordys.y);

      console.log("move: ");
      console.log(coordys.x + " " +coordys.y)
      if (xMovement > X_MOVE || yMovement > Y_MOVE) {
       paper.path("M{0} {1}L{2} {3}", start.x, start.y, coordys.x, coordys.y);
       start = coordys;
      }
     }

    });

  addEmotionButton = document.getElementById("addEmotion");

  audioContext = new AudioContext();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });



  addEmotionButton.onclick = function (event) {
    if (!withEmotions){
      addEmotionButton.textContent = EMOTION_BUTTON_TXT_STOP
      withEmotions = 1
      startPitch(stream, audioContext);
    }
    else{
      addEmotionButton.textContent = EMOTION_BUTTON_TXT_ADD
      withEmotions = 0
    }

  };





}
setup()

function startPitch(stream, audioContext) {
  pitch = ml5.pitchDetection('./model/', audioContext, stream, modelLoaded);
}

function modelLoaded() {
  document.querySelector('#status').textContent = 'Model Loaded';
  getPitch();
}

function getPitch() {
  pitch.getPitch(function (err, frequency) {
    if (frequency) {
      const midiNum = freqToMidi(frequency);
      currentNote = midiNum;
      document.querySelector('#currentNote').textContent += " " + currentNote;
    }
    if(withEmotions){
      getPitch();
    }
  })
}

function draw() {
  request = requestAnimationFrame(draw)
  clearPaper();
  paper.circle(PAPER_OFFSET+20, PAPER_OFFSET+20, 20).attr({fill: "green"});

}

// Clear the paper
function clearPaper() {
  // paper.rect(PAPER_OFFSET,PAPER_OFFSET, WIDTH, HEIGHT).attr({fill: "pink"});
}

function createPaper() {
  // Create drawing Area
  const paperElement1 = document.createElement("paper");
  var paper = Raphael("paper", 1000, 1000);
  //var sheet = paper.rect(PAPER_OFFSET,PAPER_OFFSET, WIDTH, HEIGHT)
  //sheet.attr({fill: "blue"});

  return paper;
}
