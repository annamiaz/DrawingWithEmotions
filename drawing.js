let audioStream;
let stream;
let analyzer;
let audioArray;

let WIDTH = 1000;
let HEIGHT = 700;
const PAPER_OFFSET = 0;

// Compute movement required for new line
var xMove = Math.round(WIDTH * .0001);
var yMove = Math.round(HEIGHT * .0001);

// Min must be 1
var X_MOVE = xMove ? xMove : 1;
var Y_MOVE = yMove ? yMove : 1;


let currPitch = 0;

const currentText = '';
let textCoordinates;
let paper;
let area;

let mouseDown = false;
let start, coordys;
/*= start = {
  x: 0,
  y: 0
};*/
let topPos = 0;
let leftPos = 0;

var act_color = {
  h: 100,
  s: 100,
  l: 0
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
  hMin: 30,
  hMax: 60,
  sMin: 80,
  sMax: 100,
  l: 50
}

let colorExcited = {
  hMin: 0,
  hMax: 20,
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
var energyAvg = 10;
var energy = 1;

var emotionChangeAvg = 10;
var energyChangeAvg = 10;

var curvefactor = {x: 10, y: 10}

let withEmotions = 0;
const EMOTION_BUTTON_TXT_ADD = "add emotions"
const EMOTION_BUTTON_TXT_STOP = "stop emotions"
const EMOTION_BUTTON_TXT_LOADING = "emotions ..."
const LINE_TXT = "do it in lines"
const CIRCLE_TXT = "do it in circles"
const AUTO_DRAW = "draw for me"
const AUTO_DRAW_STOP = "stop drawing"

var paperText;


var inCircles = false;
var darkMode = false;

// sound upload
let upload;
let sound;

// auto drawing
let auto = false;
let initAutoPos = {
  x: 0,
  y: 0
};

let request;

let vibrations = [];
// taken from p5.Sound
/*function freqToMidi(f) {
  const mathlog2 = Math.log(f / 440) / Math.log(2);
  const m = Math.round(12 * mathlog2) + 69;
  return m;
};*/

/*function map(n, start1, stop1, start2, stop2) {
  const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  return newval;
};*/


async function setup() {

  WIDTH = window.screen.width;
  HEIGHT = window.screen.height;

  paper = createPaper(WIDTH, HEIGHT);
  frameRate(200)
  textCoordinates = [WIDTH / 2, 30];



 // "M 50 150 Q 225 20 400 150 T 750 150"
  /*paper.path("M 50 150 Q 100 50 200 250").attr({
    fill: "rgb(0,0,0)",
    stroke: rgb(10,0,0)
  });*/



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
  addEmotionButton.onclick = function(event) {
    if (!withEmotions) {
      addEmotionButton.textContent = EMOTION_BUTTON_TXT_LOADING
      withEmotions = 1
      startPitch(stream, audioContext);
    } else {
      addEmotionButton.textContent = EMOTION_BUTTON_TXT_ADD
      withEmotions = 0
    }
  };

  var clearButton = document.getElementById("clear");

  clearButton.onclick = function(event) {
    clearPaper();
  };

  saveEmotionButton.onclick = function(event) {
    svg = paper.toSVG();


    a = document.createElement('a');
    a.download = 'emotions.svg';
    a.type = 'image/svg';
    blob = new Blob([svg], {
      "type": "image/svg"
    });
    a.href = (window.URL || webkitURL).createObjectURL(blob);
    a.click();
  };

  var circleButton = document.getElementById("doItInCircles");
  var darkModeButton = document.getElementById("darkMode");
  circleButton.onclick = function(event) {
    if (!inCircles) {
      inCircles = true;
      darkModeButton.style.visibility = 'visible';
      circleButton.textContent = LINE_TXT;
    } else {
      inCircles = false;
      darkModeButton.style.visibility = 'hidden';
      circleButton.textContent = CIRCLE_TXT;
    }
  }

  darkModeButton.onclick = function(event) {
    darkMode = !darkMode;
  }


  //upload = createFileInput(handleFile, false);
  //upload.class("myButtons");

  //var paperElem = document.getElementById("paper");
  //upload.position(paperElem.offsetTop + 3,  paperElem.offsetLeft+HEIGHT + 100);

  var draw4me = document.getElementById("draw4me");

  draw4me.onclick = function(event) {
    auto = !auto;

    if (auto) {

      for (let i = 0; i < 5; i++) {
        vibrations.push(new Particle(random(width), random(height)));
      }
      draw4me.textContent = AUTO_DRAW_STOP;
      paperText.remove()
      initAutoPos.x = random(topPos, WIDTH);
      initAutoPos.y = random(leftPos, HEIGHT);
    } else {
      draw4me.textContent = AUTO_DRAW;
      setPaperText();
    }

  };

}


// EMOTION UPLOAD
function handleFile(file) {
  // print(file);

  if (file.type === 'audio') {
    console.log("audio");
    sound = loadSound(file.data, playSound, displayError, waitForSound);


  } else {
    sound = null;
    // TODO: error message
  }
}

function playSound() {

  sound.play()
}

function displayError() {
  // TODO ERROR
}

function waitForSound() {
  console.log("Waiting...");
}

function setPaperText() {
  paperText = paper.text(WIDTH / 2, HEIGHT / 2, "Click to activate Pencil").attr({
    fill: '#000000',
    "text-align": "center",
    "font-family": "\"Lucida Console\", \"Courier New\", monospace",
  });
}

// setup()

function newSheet() {
  mouseDown = false;
  area = paper.rect(PAPER_OFFSET, PAPER_OFFSET, WIDTH, HEIGHT);

  area.attr({
    fill: "white"
  });

  setPaperText();

  // EVENTS
  area.click(function(event) {
    if (!mouseDown) {
      paperText.remove();
      var paperElem = document.getElementById("paper");
      topPos = paperElem.offsetTop;
      leftPos = paperElem.offsetLeft;

      console.log("topPos: " + topPos)
      console.log("leftPos: " + leftPos)
      mouseDown = true;
      start = {
        x: event.clientX - leftPos,
        y: event.clientY - topPos
      };
    } else {
      start = 0;
      coordys = 0;
      mouseDown = false;
    }
  });;

  area.mousemove(function(event) {
    if (mouseDown) {
      coordys = {
        x: event.clientX - leftPos,
        y: event.clientY - topPos
      };
      //drawLine();
    }

  });
}

function startPitch(stream, audioContext) {
  pitch = ml5.pitchDetection('./model/', audioContext, stream, modelLoaded);
}

function modelLoaded() {
  document.getElementById("addEmotion").textContent = EMOTION_BUTTON_TXT_STOP;
  getPitch();
}

function getPitch() {
  pitch.getPitch(function(err, frequency) {
    if (frequency) {
      const midiNum = freqToMidi(frequency);
      currPitch = midiNum;
      // document.querySelector('#currPitch').textContent += " " + currPitch;

      console.log("getEmotion")
      getEmotion();
    }
    if (withEmotions) {
      getPitch();
    }
  })
}

function draw() {



  if (auto) {
    if (withEmotions) {
      getEmotion();
    }

    // var color_rgb = getColorStr()

    for (let i = 0; i < vibrations.length; i++) {

      vibrations[i].update();
      vibrations[i].show();
    }

    /* paper.circle(initAutoPos.x, initAutoPos.y, energyAvg * 0.3 < 1 ? 1 : energyAvg * 0.3).attr({
      fill: darkMode ? "rgb(0,0,0)" : color_rgb,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      stroke: color_rgb
    });

    initAutoPos.x = random(topPos, WIDTH);
    initAutoPos.y = random(leftPos, HEIGHT);*/

  } else {
    if (mouseDown && start && coordys) {
      var xMovement = Math.abs(start.x - coordys.x);
      var yMovement = Math.abs(start.y - coordys.y);

      if (inCircles && xMovement > X_MOVE || yMovement > Y_MOVE) {
        //  console.log(getColorStr());
        if (withEmotions) {
          getEmotion();
        }

        var color_rgb = getColorStr()
        var path;
        if (inCircles) {
          path = paper.circle(start.x, start.y, energyAvg * 0.3 < 1 ? 1 : energyAvg * 0.3).attr({
            fill: darkMode ? "rgb(0,0,0)" : color_rgb,
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            stroke: color_rgb
          });
        } else {
          path = paper.path("M{0} {1}Q{0} {1} {2} {3}", start.x, start.y, coordys.x, coordys.y).attr({
            "stroke-width": energyAvg * 0.3 < 1 ? 1 : energyAvg * 0.3,
            fill: "rgb(0,0,0)",
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            stroke: getColorStr()
          });
        }

        path.mousemove(function(event) {
          if (mouseDown) {
            coordys = {
              x: event.clientX - leftPos,
              y: event.clientY - topPos
            };
            //drawLine();
          }
        });
        path.click(function(event) {
          if (!mouseDown) {
            mouseDown = true;
          } else {
            mouseDown = false;
          }
        });
        start = coordys;
      }
    }
  }
}

function getEmotion() {

  // PITCH
  emotionQ.push(currPitch);
  var avg = averageQ(emotionQ);


  // ENERGY
  analyzer.getByteFrequencyData(audioArray);
  energy = audioArray.reduce((a, b) => a + b, 0) * 0.001;
  energyQ.push(energy);
  energyAvg = averageQ(energyQ);

  emotionChangeAvg = calculateAverageChange(emotionQ);
  energyChangeAvg = calculateAverageChange(energyQ);

  // console.log("Average: " + avg);
  // console.log("AverageChange: " + emotionChangeAvg);
  // console.log("Energy Average : " + energyAvg);
  // console.log("Energy CHange Average : " + energyChangeAvg);

  // interferance between colors - halbieren wieder halbieren wieder halbieren

  if ((avg < 65 && energyAvg <= 20)) {
    if (currMood != 1) {
      prevMood = currMood;
      currMood = 1;
      moodChanged = 1;
      moodCount = 1;
    } else {
      moodChanged = 0;
    }
  } else if ((avg >= 65 && avg < 74 && energyAvg < 40 && energyChangeAvg < 1.0) || (avg < 65 && energyAvg > 20)) {
    if (currMood != 2) {
      prevMood = currMood;
      currMood = 2,
        moodChanged = 1;
      moodCount = 1;
    } else {
      moodChanged = 0;
    }
  } else if (avg > 74 && emotionChangeAvg < 0.5 && energyAvg < 30 && energyChangeAvg < 1.0) {
    if (currMood != 3) {
      prevMood = currMood;
      currMood = 3;
      moodChanged = 1;
      moodCount = 1;
    } else {
      moodChanged = 0;
    }
  } else { // if (avg > 74 && emotionChangeAvg >= 0.5){
    if (currMood != 4) {
      prevMood = currMood;
      currMood = 4;
      moodChanged = 1;
      moodCount = 1;
    } else {
      moodChanged = 0;
    }
  }

  if (moodChanged) {
    moodCount = 0;
  }

  moodfactor = moodCount / 10;

  if (currPitch > 0) {
    // sad
    if (currMood == 1) {

      curvefactor = {x: 0, y: 0}

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
    else if (currMood == 2) {

      curvefactor = {x: random(-10, 10), y: random(-10, 10)}
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
    else if (currMood == 3) {

      curvefactor = {x: random(-100, 100), y: random(-100, 100)}
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
    else if (currMood == 4) {
      /*color.h = Math.round(prevColor.h + interpolateColor(color.h, colorExcited.hMin)) + moodfactor;
      if(color.h < colorExcited.hMin || color.h > colorExcited.hMax){
        color.h -= moodCount;
        moodCount = 1;
      }*/
      curvefactor = {x: random(-100, 100), y: random(-100, 100)}

      calculateEmotionColor(colorExcited, 1, 10);

      //color.s = Math.round(prevColor.s + interpolateColor(color.s, colorExcited.sMax));
      //color.l = Math.round(currPitch-10)
    }


    prevColor = act_color;
    moodCount++;
  }

}


function calculateEmotionColor(emotionColor, moodMultiplyer, pitchReducer) {
  //console.log(getColorStr());
  act_color.h = Math.round(prevColor.h + interpolateColor(act_color.h, emotionColor.hMax) + (moodfactorOperation ? (moodfactor * moodMultiplyer) : moodfactor * (-1 * moodMultiplyer)));
  //console.log(moodfactorOperation ? (moodfactor*moodMultiplyer) : moodfactor*(-1*moodMultiplyer))
  if (act_color.h < emotionColor.hMin) {
    moodfactorOperation = true;
    moodCount = 1;
  } else if (act_color.h > emotionColor.hMax) {
    moodfactorOperation = false;
    moodCount = 1;
  }

  // + greyer
  act_color.s = Math.round(prevColor.s + interpolateColor(act_color.s, emotionColor.sMax));
  act_color.l = Math.round(currPitch - pitchReducer)
}

function interpolateColor(color1, color2) {
  return Math.round(0.7 * (color2 - color1));
};

function averageQ(q) {
  if (q.length > 5) {
    q.shift();
  }

  var sum = q.reduce((a, b) => a + b, 0);
  return avg = Math.round(sum / q.length) || 0;
};

function calculateAverageChange(q) {
  var changeSum = 0;
  var i = 0

  // CHANGE AVERAGE
  while (i < q.length - 1) {
    changeSum += Math.abs(q[i] - q[i + 1]);
    i++;
  }

  return changeSum / q.length;
};


function getColorStr() {

  // I Have to convert
  var h = act_color.h;
  var s = act_color.s;
  var l = act_color.l;

  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs((h / 60) % 2 - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return "rgb(" + r + "," + g + "," + b + ")";
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


class Particle {

  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.history = [];
  }

  update() {
    this.x = this.x + random(-(energyChangeAvg+emotionChangeAvg)*50, (energyChangeAvg+emotionChangeAvg)*50);
    this.y = this.y + random(-(energyChangeAvg+emotionChangeAvg)*50, (energyChangeAvg+emotionChangeAvg)*50);

    let v = createVector(WIDTH / 2 + this.x, HEIGHT / 2 + this.y);

    var pixelInfo = {
      pos: v,
      c: getColorStr(),
      e: (energyAvg * 0.3 < 1 ? 1 : energyAvg * 0.3),
      curvefactor: curvefactor
    }

    this.history.push(pixelInfo);

    //console.log(this.history.length);

    /*if (this.history.length > 100) {
      this.history.splice(0, 1);
    }*/
  }

  show() {
    //stroke(255);
    //beginShape();

    //for (let i = 0; i < this.history.length; i++) {
    //if(this.history.lenght > 0){
    /*  var hist = this.history[this.history.length - 1];
      console.log(hist);
      var color_rgb = hist.c;
    if (this.history.length > 2){
      var hist = this.history[this.history.length - 2];
      console.log(hist);
      var color_rgb = hist.c;
      var e = hist.e;
      let pos = hist.pos;
      paper.circle(pos.x, pos.y, e).attr({
        fill: darkMode ? "rgb(0,0,0)" : color_rgb,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        stroke: color_rgb
      });
    }*/

    var hist = this.history[this.history.length - 1];

    var color_rgb = hist.c;
    var e = hist.e;
    var pos = hist.pos;
    var cf = hist.curvefactor;





    if (this.history.length > 2) {
      var hist2 = this.history[this.history.length - 2];
      var pos2 = hist2.pos;
      paper.path("M {0} {1} Q {2} {3} {4} {5}", pos.x, pos.y, (pos.x+cf.x), (pos.y+cf.y), pos2.x, pos2.y).attr({
        "stroke-width": e,
        //fill: "rgb(0,0,0)",
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        stroke: color_rgb
      });


      // Versuch 2
      /* paper.path("M {0} {1} Q{2} {3} {4} {5}", pos.x, pos.y, pos2.x, pos2.y, pos2.x + 10, pos2.y + 10).attr({
        "stroke-width": e,
        fill: "rgb(0,0,0)",
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        stroke: color_rgb
      });*/

      // auto = false;
    }

    //noStroke();
    //fill(200);
    //ellipse(this.x, this.y, 24, 24);
  }
}
