let audioStream;
let stream;
let analyzer;
let audioArray;

const WIDTH = 1000;
const HEIGHT = 700;
const PAPER_OFFSET = 10;

// Compute movement required for new line
var xMove = Math.round(WIDTH * .00001);
var yMove = Math.round(HEIGHT * .00001);

// Min must be 1
var X_MOVE = xMove ? xMove : 1;
var Y_MOVE = yMove ? yMove : 1;


let currPitch = 0;

const currentText = '';
let textCoordinates;
let paper;
let area;

let mouseDown = false;
let start, end, coordys;
let topPos = 0;
let leftPos = 0;

var color = {
  h: 100,
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
  hMin: 40,
  hMax: 60,
  sMin: 80,
  sMax: 100,
  l: 50
}

let colorExcited = {
  hMin: 0,
  hMax: 40,
  sMin: 80,
  sMax: 100,
  l: 50
}

// 1 sad - 2 neutral - 3 happy
let currMood = 0;
let prevMood = 0;
let moodChanged = 1;

let moodfactorOperation = true;
let moodfactor = 1;
let moodCount = 0;

var emotionQ = [];
var energyQ = [];
var energyAvg = 1;
var energy = 1;

let withEmotions = 0;
const EMOTION_BUTTON_TXT_ADD = "add emotions"
const EMOTION_BUTTON_TXT_STOP = "stop emotions"


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
  var saveEmotionButton = document.getElementById("savePaper");

  audioContext = new AudioContext();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });

  analyzer = audioContext.createAnalyser();
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyzer);

  analyzer.fftSize = 2048;
  var bufferLength = analyzer.frequencyBinCount;
  audioArray = new Uint8Array(bufferLength);
  analyzer.getByteTimeDomainData(audioArray);


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

 saveEmotionButton.onclick = function (event) {
   var circle2 = paper.circle(70, 60, 50);
   paper.path("M100 100L200 300").attr({"stroke-width": 3, fill: "blue"});
   svg = paper.toSVG();


   a = document.createElement('a');
    a.download = 'emotions.svg';
    a.type = 'image/svg';
    blob = new Blob([svg], {"type": "image/svg"});
    a.href = (window.URL || webkitURL).createObjectURL(blob);
    a.click();
 };

}



setup()

function newSheet(){
  area = paper.rect(PAPER_OFFSET,PAPER_OFFSET, WIDTH, HEIGHT);
  area.attr({fill: "ivory"});

  // EVENTS
  window.addEventListener("click", function (event){
    if(!mouseDown){
       var paperElem = document.getElementById("paper");
       topPos = paperElem.offsetTop;
       leftPos = paperElem.offsetLeft;
       mouseDown = true;
       start = { x: event.clientX - leftPos,
                y: event.clientY - topPos};

    }
    else{
      mouseDown = false;
    }
    });;

  area.mousemove(function (event) {
     if (mouseDown) {
        coordys = { x: event.clientX - leftPos,
        y: event.clientY - topPos};
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
      currPitch = midiNum;
      // document.querySelector('#currPitch').textContent += " " + currPitch;
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
  // console.log(getColorStr());
   if(withEmotions){
     getEmotion();
   }
   paper.path("M{0} {1}Q{0} {1} {2} {3}", start.x, start.y, coordys.x, coordys.y).attr({"stroke-width": energyAvg*0.5 < 1 ? 1: energyAvg*0.5,
                    fill:  "rgb(0,0,0)",
                    "stroke-linejoin": "round",
                    "stroke-linecap":"round",
                    stroke:  getColorStr()});
   start = coordys;
 }
}

function getEmotion(){

  // PITCH
  emotionQ.push(currPitch);
  var avg = averageQ(emotionQ);


   // ENERGY
   analyzer.getByteFrequencyData(audioArray);
   energy = audioArray.reduce((a, b) => a + b, 0)*0.001;
   energyQ.push(energy);
   energyAvg = averageQ(energyQ);



   var emotionChangeAvg = calculateAverageChange(emotionQ);
   var energyChangeAvg = calculateAverageChange(energyQ);

   // console.log("Average: " + avg);
   // console.log("AverageChange: " + emotionChangeAvg);
   // console.log("Energy Average : " + energyAvg);
   // console.log("Energy CHange Average : " + energyChangeAvg);

   // interferance between colors - halbieren wieder halbieren wieder halbieren

   if((avg < 65 && energyAvg <= 20) ){
     if(currMood != 1){
       prevMood = currMood;
       currMood = 1;
       moodChanged = 1;
       moodCount = 1;
     }
     else{
       moodChanged = 0;
     }
   }

   else if((avg >= 65 && avg < 74 && energyAvg < 40 && energyChangeAvg < 1.0) || (avg < 65 && energyAvg > 20)){
     if(currMood != 2){
       prevMood = currMood;
       currMood = 2,
       moodChanged = 1;
       moodCount = 1;
     }
     else{
       moodChanged =0;
     }
   }
   else if (avg > 74 && emotionChangeAvg < 0.5 && energyAvg < 30 && energyChangeAvg < 1.0){
     if(currMood != 3){
       prevMood = currMood;
       currMood = 3;
       moodChanged = 1;
       moodCount = 1;
     }
     else{
       moodChanged = 0;
     }
   }
   else {// if (avg > 74 && emotionChangeAvg >= 0.5){
     if(currMood != 4){
       prevMood = currMood;
       currMood = 4;
       moodChanged = 1;
       moodCount = 1;
     }
     else{
       moodChanged = 0;
     }
   }

   if(moodChanged){
     moodCount = 0;
   }

  moodfactor = moodCount/10;

  if(currPitch > 0){
     // sad
     if (currMood == 1){

       // blue
       // color.r = Math.round((100 + color.r + prevColor.r)/3);
       /*color.h = Math.round(prevColor.h + interpolateColor(color.h, colorSad.hMin)) + moodfactorOperation? moodfactor*10: moodfactor*-10;
       if(color.h < colorSad.hMin){
         moodfactorOperation = 1
         moodCount = 1;
       }
       else if (color.h > colorSad.hMax) {
         moodfactorOperation = 0
         moodCount = 1;
       }*/
       // + greyer
       //color.s = Math.round(prevColor.s + interpolateColor(color.s, colorSad.sMax));
       //color.l = Math.round(currPitch-20)
       calculateEmotionColor(colorSad, 10, 20);
     }
     // neutral
     else if(currMood == 2){

       // greenish
       // color.r = Math.round((100 + color.r + prevColor.r)/3);
       /*color.h = Math.round(prevColor.h + interpolateColor(color.h, colorNeutral.hMin)) + moodfactor*10;
       if(color.h < colorNeutral.hMin || color.h > colorNeutral.hMax){
         color.h -= moodCount;
         moodCount = 1;
       }*/
       //color.s = Math.round(prevColor.s + interpolateColor(color.s, colorNeutral.sMax));
       // color.l = Math.round(currPitch-10)
       calculateEmotionColor(colorNeutral, 10, 10);
     }
     // happy
     else if (currMood == 3){

       // yellow
       // color.r = Math.round((50 + color.r + prevColor.r)/3);
       /*color.h = Math.round(prevColor.h + interpolateColor(color.h, colorHappy.hMin)) + moodfactor;
       if(color.h < colorHappy.hMin || color.h > colorHappy.hMax){
         color.h -= moodCount;
         moodCount = 1;
       }*/

       //color.s = Math.round(prevColor.s + interpolateColor(color.s, colorHappy.sMax));
       //color.l = Math.round(currPitch-10)
       calculateEmotionColor(colorHappy, 1, 10);
     }

     // Excited
     else if (currMood == 4){
       /*color.h = Math.round(prevColor.h + interpolateColor(color.h, colorExcited.hMin)) + moodfactor;
       if(color.h < colorExcited.hMin || color.h > colorExcited.hMax){
         color.h -= moodCount;
         moodCount = 1;
       }*/
       calculateEmotionColor(colorExcited, 1, 10);

       //color.s = Math.round(prevColor.s + interpolateColor(color.s, colorExcited.sMax));
       //color.l = Math.round(currPitch-10)
     }


       prevColor = color;
       moodCount++;
   }

}


function calculateEmotionColor(emotionColor, moodMultiplyer, pitchReducer){
  //console.log(getColorStr());
  color.h = Math.round(prevColor.h + interpolateColor(color.h, emotionColor.hMin) + (moodfactorOperation ? (moodfactor*moodMultiplyer) : moodfactor*(-1*moodMultiplyer)));
  //console.log(moodfactorOperation ? (moodfactor*moodMultiplyer) : moodfactor*(-1*moodMultiplyer))
  if(color.h < emotionColor.hMin){
    moodfactorOperation = true;
    moodCount = 1;
  }
  else if (color.h > emotionColor.hMax) {
    moodfactorOperation = false;
    moodCount = 1;
  }
  // + greyer
  color.s = Math.round(prevColor.s + interpolateColor(color.s, emotionColor.sMax));
  color.l = Math.round(currPitch-pitchReducer)
}

function interpolateColor(color1, color2) {
  return Math.round(0.7*(color2-color1));
};

function averageQ(q){
  if(q.length > 20){
    q.shift();
  }

  var sum = q.reduce((a, b) => a + b, 0);
  return avg = Math.round(sum / q.length) || 0;
};

function calculateAverageChange(q){
  var changeSum = 0;
  var i = 0

  // CHANGE AVERAGE
  while (i < q.length-1){
     changeSum += Math.abs(q[i] - q[i+1]);
     i++;
  }

  return changeSum/q.length;
};


function getColorStr(){

  // I Have to convert
   var h = color.h;
   var s = color.s;
   var l = color.l;

   s /= 100;
   l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
     x = c * (1 - Math.abs((h / 60) % 2 - 1)),
     m = l - c/2,
     r = 0,
     g = 0,
     b = 0;

  if (0 <= h && h < 60) {
         r = c; g = x; b = 0;
       } else if (60 <= h && h < 120) {
         r = x; g = c; b = 0;
       } else if (120 <= h && h < 180) {
         r = 0; g = c; b = x;
       } else if (180 <= h && h < 240) {
         r = 0; g = x; b = c;
       } else if (240 <= h && h < 300) {
         r = x; g = 0; b = c;
       } else if (300 <= h && h < 360) {
         r = c; g = 0; b = x;
       }
       r = Math.round((r + m) * 255);
       g = Math.round((g + m) * 255);
       b = Math.round((b + m) * 255);

       return "rgb(" + r + "," + g + "," + b + ")";




  // using HSL
  // hue, saturation, lightness
  // return  "hsl("+ color.h +","+ color.s +","+ color.l +")";
}

function draw() {
  request = requestAnimationFrame(draw)
  clearPaper();
  paper.circle(PAPER_OFFSET+20, PAPER_OFFSET+20, 20).attr({fill: "green"});

}


function SaveDatFileBro(localstorage) {
    localstorage.root.getFile("myEmotions.png", {create: true},
    function(DatFile) {
            DatFile.createWriter(function(DatContent) {
                    var blob = new Blob(paper.toSVG(), {type: "image/png"});
                    DatContent.write(blob);
              });
  });
}

// Clear the paper
function clearPaper() {
  paper.clear();
  newSheet();
}

function createPaper() {
  // Create drawing Area
  const paperElement1 = document.createElement("paper");
  var paper = Raphael("paper", WIDTH, HEIGHT);
  //var sheet = paper.rect(PAPER_OFFSET,PAPER_OFFSET, WIDTH, HEIGHT)
  //sheet.attr({fill: "blue"});

  return paper;
}
