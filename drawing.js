// Pitch variables
let crepe;
let audioStream;
let stream;

const WIDTH = 1000;
const HEIGHT = 1000;
const PAPER_OFFSET = 10;

// Compute movement required for new line
var xMove = Math.round(WIDTH * .0001);
var yMove = Math.round(HEIGHT * .0001);

// Min must be 1
var X_MOVE = xMove ? xMove : 1;
var Y_MOVE = yMove ? yMove : 1;

// Circle variables
const circleSize = 42;
const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Text variables
let goalNote = 0;
let currentNote = 0;

const currentText = '';
let textCoordinates;
let paper;
let area;

let mouseDown = false;
let start, end, coordys;
let topPos = 0;
let leftPos = 0;

var color = {
  h: 155,
  s: 100,
  l: 50
}

var prevColor = {
  h: 155,
  s: 100,
  l: 50
}

let colorSad = {
  hMin: 190,
  hMax: 280,
  sMin: 20,
  sMax: 45,
  l: 50
}

let colorNeutral = {
  hMin: 80,
  hMax: 190,
  sMin: 45,
  sMax: 70,
  l: 50,
}

let colorHappy = {
  hMin: 50,
  hMax: 60,
  sMin: 80,
  sMax: 100,
  l: 50
}

// 1 sad - 2 neutral - 3 happy
let currMood = 0;
let prevMood = 0;
let moodChanged = 1;

let moodCount = 0;

var emoQueue = [];

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

  newSheet();

  var addEmotionButton = document.getElementById("addEmotion");

  audioContext = new AudioContext();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });

  // (START \ STOP) EMOTION
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

 var clearButton = document.getElementById("clear");

 clearButton.onclick = function (event) {
   clearPaper();
 };

}

setup()

function newSheet(){
  area = paper.rect(PAPER_OFFSET,PAPER_OFFSET, WIDTH, HEIGHT);
  area.attr({fill: "ivory"});

  topPos = document.getElementById("paper").offsetTop;
  leftPos = document.getElementById("paper").offsetLeft;

  // EVENTS
  area.mousedown(function (event) {
     mouseDown = true;
     start = { x: event.clientX - leftPos,
              y: event.clientY - topPos};
  });
  area.mouseup(function (event) {
     mouseDown = false;
    });

  area.mousemove(function (event) {
     coordys = { x: event.clientX - leftPos,
              y: event.clientY - topPos};
     if (mouseDown) {
        drawLine();

     }

    });
}

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
      getEmotion();
    }
    if(withEmotions){
      getPitch();
    }
  })
}

function drawLine(){
  var xMovement = Math.abs(start.x - coordys.x);
  var yMovement = Math.abs(start.y - coordys.y);
  if (xMovement > X_MOVE || yMovement > Y_MOVE) {
  console.log(getColorStr());
   getEmotion();
   paper.path("M{0} {1}L{2} {3}", start.x, start.y, coordys.x, coordys.y).attr({stroke:  getColorStr(), "stroke-width": 3});
   start = coordys;
 }
}

function getEmotion(){
   emoQueue.push(currentNote);

   if(emoQueue.length > 20){
     console.log("SHIFT " + emoQueue.length);
     emoQueue.shift();
   }

   var sum = emoQueue.reduce((a, b) => a + b, 0);
   var avg = Math.round(sum / emoQueue.length) || 0;
   console.log("Average: " + avg + "Queue l: " + emoQueue.length);

   // interferance between colors - halbieren wieder halbieren wieder halbieren

   if(avg < 68){
     if(currMood != 1){
       prevMood = currMood;
       currMood = 1;
       moodChanged = 1;
     }
     else{
       moodChanged = 0;
     }
   }

   else if(avg >= 68 && currentNote < 75){
     if(currMood != 2){
       prevMood = currMood;
       currMood = 2,
       moodChanged = 1;
     }
     else{
       moodChanged =0;
     }
   }
   else{
     if(currMood != 3){
       prevMood = currMood;
       currMood = 3;
       moodChanged = 1;
     }
     else{
       moodChanged = 0;
     }
   }

   if(moodChanged){
     console.log("MOODCHANGED");
     moodCount = 0;
   }

   // sad
   if (avg < 68){
     // blue
     // color.r = Math.round((100 + color.r + prevColor.r)/3);
     color.h = Math.round(prevColor.h + interpolateColor(color.h, colorSad.hMin)) + moodCount;
     if(color.h < colorSad.hMin || color.h > colorSad.hMax){
       color.h -= moodCount;
       moodCount = 1;
     }
     // + greyer
     color.s = Math.round(prevColor.s + interpolateColor(color.s, colorSad.sMin));
     color.l = Math.round(currentNote-20)
   }
   // neutral
   else if(avg >= 68 && currentNote < 75){
     // greenish
     // color.r = Math.round((100 + color.r + prevColor.r)/3);
     color.h = Math.round(prevColor.h + interpolateColor(color.h, colorNeutral.hMin)) + moodCount;
     if(color.h < colorNeutral.hMin || color.h > colorNeutral.hMax){
       color.h -= moodCount;
       moodCount = 1;
     }
     color.s = Math.round(prevColor.s + interpolateColor(color.s, colorNeutral.sMin));
     color.l = Math.round(currentNote-10)
   }
   // happy
   else{
     // yellow
     // color.r = Math.round((50 + color.r + prevColor.r)/3);
     color.h = Math.round(prevColor.h + interpolateColor(color.h, colorHappy.hMin)) + moodCount;
     if(color.h < colorHappy.hMin || color.h > colorHappy.hMax){
       color.h -= moodCount;
       moodCount = 1;
     }

     color.s = Math.round(prevColor.s + interpolateColor(color.s, colorHappy.sMax));
     color.l = Math.round(currentNote-10)
   }


     prevColor = color;
     moodCount++;
     console.log("MoodCount: " + moodCount);

}

var interpolateColor = function(color1, color2) {
  return Math.round(0.7*(color2-color1));
};

function getColorStr(){
  // using HSL
  // hue, saturation, lightness
  return  "hsl("+ color.h +","+ color.s +","+ color.l +")";
}

function draw() {
  request = requestAnimationFrame(draw)
  clearPaper();
  paper.circle(PAPER_OFFSET+20, PAPER_OFFSET+20, 20).attr({fill: "green"});

}

// Clear the paper
function clearPaper() {
  paper.clear();
  newSheet();
}

function createPaper() {
  // Create drawing Area
  const paperElement1 = document.createElement("paper");
  var paper = Raphael("paper", 1000, 1000);
  //var sheet = paper.rect(PAPER_OFFSET,PAPER_OFFSET, WIDTH, HEIGHT)
  //sheet.attr({fill: "blue"});

  return paper;
}
