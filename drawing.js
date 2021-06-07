let audioStream;
let stream;
let analyzer;
// stereo-analyser-node.jslet audioArray;

let WIDTH = 1000;
let HEIGHT = 700;
const PAPER_OFFSET = 0;

// Compute movement required for new line
var X_MOVE = WIDTH * 0.001;
var Y_MOVE = HEIGHT * 0.001;

let currPitch = 0;

const currentText = '';
let textCoordinates;
let paper;
let area;

let mouseDown = false;
let start, coordys;

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

var audioArray;

var emotionQ = [];
var energyQ = [];
var energyAvg = 10;
var energy = 1;

var harmony = false;
var slowDownFactor = 15;

var emotionChangeAvg = 10;
var energyChangeAvg = 10;

var curvefactor = {
  x: 10,
  y: 10
}

let withEmotions = 0;
const EMOTION_BUTTON_TXT_ADD = "add mood"
const EMOTION_BUTTON_TXT_STOP = "stop mood"
const EMOTION_BUTTON_TXT_LOADING = "mood ..."
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

// for different particles
let vibrations = [];

// Filter for SVGs
let filter;



async function setup() {



  WIDTH = window.screen.width;
  HEIGHT = window.screen.height;

  paper = createPaper(WIDTH, HEIGHT);
  frameRate(200)
  textCoordinates = [WIDTH / 2, 30];

  newSheet();


  // Filter for lines
  filter = paper.createFilter();
  filter.chainEffect("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.1",
    numOctaves: "10"
  });
  filter.chainEffect("feDisplacementMap", {
    in: "SourceGraphic",
    scale: "10"
  });
  filter.merge(filter.getLastResult(), "SourceGraphic");


  var addEmotionButton = document.getElementById("addEmotion");
  var saveEmotionButton = document.getElementById("savePaper");

  audioContext = new AudioContext();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });


  // (START \ STOP) EMOTION
  addEmotionButton.onclick = function(event) {
    if (!withEmotions) {
      addEmotionButton.textContent = EMOTION_BUTTON_TXT_LOADING
      withEmotions = 1
      startPitch(stream, audioContext);
      startEnergy(stream, audioContext);
    } else {
      addEmotionButton.textContent = EMOTION_BUTTON_TXT_ADD
      withEmotions = 0
    }
  };

  var clearButton = document.getElementById("clear");

  // CLEAR PAPER
  clearButton.onclick = function(event) {
    clearPaper();
  };

  // SAVING SVG
  saveEmotionButton.onclick = function(event) {
    svg = paper.toSVG();

    a = document.createElement('a');
    a.download = 'mood.svg';
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

  var draw4me = document.getElementById("draw4me");

  draw4me.onclick = function(event) {
    auto = !auto;

    if (auto) {

      for (let i = 0; i < 5; i++) {
        vibrations.push(new Line({
          x: random(window.innerWidth),
          y: random(window.innerHeight)
        }, p5.Vector.random2D()));
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

function setPaperText() {
  paperText = paper.text(WIDTH / 2, HEIGHT / 2, "").attr({
    fill: '#000000',
    "text-align": "center",
    "font-family": "\"Lucida Console\", \"Courier New\", monospace",
  });
}

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
    }

  });
}

// Pitch is calculated via ML5.js
function startPitch(stream, audioContext) {
  pitch = ml5.pitchDetection('./model/', audioContext, stream, modelLoaded);
}

// Energy is calculated via Meyda.js
function startEnergy(stream, audioContext) {
  // Meyda.js
  if (typeof Meyda === "undefined") {
    console.log("Meyda could not be found! Have you included it?");
  } else {

    var source = audioContext.createMediaStreamSource(stream);

    const analyzer_energy = Meyda.createMeydaAnalyzer({
      "audioContext": audioContext,
      "source": source,
      "bufferSize": 2048,
      "featureExtractors": ["energy"],
      "callback": features => {
        energy = features.energy;
      }
    });
    analyzer_energy.start();
  }
}

function modelLoaded() {
  document.getElementById("addEmotion").textContent = EMOTION_BUTTON_TXT_STOP;
  getPitch();
}

// Get pitch and convert it to Midi values - so it is easier to work with
function getPitch() {
  pitch.getPitch(function(err, frequency) {
    if (frequency) {
      currPitch = freqToMidi(frequency);
      getEmotion();
    }
    if (withEmotions) {
      getPitch();
    }
  })
}

function draw() {

  // Automatic drawing
  if (auto) {
    if (withEmotions) {
      getEmotion();
    }

    for (let i = 0; i < vibrations.length; i++) {
      // add new path to the Line object
      vibrations[i].update();
      // draw the latest added path
      vibrations[i].show();
    }

  } else {

    // Manual drawing
    if (mouseDown && start && coordys) {
      var xMovement = Math.abs(start.x - coordys.x);
      var yMovement = Math.abs(start.y - coordys.y);

      if (xMovement > X_MOVE || yMovement > Y_MOVE) {
        if (withEmotions) {
          getEmotion();
        }

        var color_rgb = getColorStr()
        var path;
        if (inCircles) {
          path = paper.circle(start.x, start.y, energyAvg * 0.9 < 1 ? 1 : energyAvg * 0.9).attr({
            fill: darkMode ? "rgb(0,0,0)" : color_rgb,
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            stroke: color_rgb
          });

          // path.filter(filter);
        } else {
          path = paper.path("M{0} {1}Q{0} {1} {2} {3}", start.x, start.y, coordys.x, coordys.y).attr({
            "stroke-width": energyAvg * 0.5 < 1 ? 1 : energyAvg * 0.5,
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            stroke: getColorStr()
          });

          // path.filter(filter);
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
  const allTheSame = (currentValue) => currentValue == currPitch;

  harmony = emotionQ.every(allTheSame);

  // ENERGY by Meyda
  energyQ.push(energy);
  energyAvg = averageQ(energyQ);

  emotionChangeAvg = calculateAverageChange(emotionQ);
  energyChangeAvg = calculateAverageChange(energyQ);

  if (harmony) {
    moodChanged = 0;
  } else {

    if ((avg < 60 && energy <= 30)) {
      if (currMood != 1) {
        prevMood = currMood;
        currMood = 1;
        moodChanged = 1;
        moodCount = 1;
      } else {
        moodChanged = 0;
      }
    } else if ((avg >= 60 && avg < 74 && energyChangeAvg < 1.0) || (avg < 65 && energy > 20)) {
      if (currMood != 2) {
        prevMood = currMood;
        currMood = 2,
          moodChanged = 1;
        moodCount = 1;
      } else {
        moodChanged = 0;
      }
    } else if (avg > 74 && energyChangeAvg < 2.5) {
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
  }

  if (moodChanged) {
    moodCount = 0;
  }

  moodfactor = moodCount / 10;

  if (currPitch > 0) {
    // sad
    if (currMood == 1) {

      curvefactor = {
        x: 0,
        y: 0
      }

      calculateEmotionColor(colorSad, 10, 20);
    }
    // neutral
    else if (currMood == 2) {

      curvefactor = {
        x: random(-10, 10),
        y: random(-10, 10)
      }

      calculateEmotionColor(colorNeutral, 10, 10);
    }
    // happy
    else if (currMood == 3) {

      curvefactor = {
        x: random(-70, 70),
        y: random(-70, 70)
      }

      calculateEmotionColor(colorHappy, 1, 10);
    }

    // Excited
    else if (currMood == 4) {

      curvefactor = {
        x: random(-100, 100),
        y: random(-100, 100)
      }

      calculateEmotionColor(colorExcited, 1, 10);

    }

    prevColor = act_color;
    moodCount++;
  }

}


function calculateEmotionColor(emotionColor, moodMultiplyer, pitchReducer) {
  act_color.h = Math.round(prevColor.h + interpolateColor(act_color.h, emotionColor.hMax) + (moodfactorOperation ? (moodfactor * moodMultiplyer) : moodfactor * (-1 * moodMultiplyer)));
  if (act_color.h < emotionColor.hMin) {
    moodfactorOperation = true;
    moodCount = 1;
  } else if (act_color.h > emotionColor.hMax) {
    moodfactorOperation = false;
    moodCount = 1;
  }

  // + greyer
  act_color.s = Math.round(prevColor.s + interpolateColor(act_color.s, emotionColor.sMax));

  // + brighter
  act_color.l = Math.round(currPitch - pitchReducer)
}

function interpolateColor(color1, color2) {
  return Math.round(0.7 * (color2 - color1));
};

function averageQ(q) {
  if (q.length > 20) {
    q.shift();
  }

  var sum = q.reduce((a, b) => a + b, 0);
  return avg = Math.round(sum / q.length) || 0;
};

function calculateAverageChange(q) {
  var changeSum = 0;
  var i;

  // CHANGE AVERAGE
  for (i = 0; i < q.length - 1; i++) {
    changeSum += Math.abs(q[i] - q[i + 1]);
  }

  return changeSum / q.length;
};


function getColorStr() {

  // Convert HSL to RGB so that the SVG can be saved properly
  // Actually SVG work with HSL as well but saving does not work with HSL in this project
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
  // const paperElement1 = document.createElement("paper");
  var paper = Raphael("paper", WIDTH, HEIGHT);

  return paper;
}

class Line {

  constructor(pos, direction) {
    this.startPos = pos;
    this.endPos = pos;
    this.history = [];
    this.direction = direction;
  }

  update() {
    this.startPos = this.endPos;

    if (!harmony) {
      this.direction = p5.Vector.random2D();
      slowDownFactor = 15;
    } else {
      slowDownFactor = slowDownFactor / 1.5;
    }

    var longness = (energyChangeAvg + emotionChangeAvg) * slowDownFactor;
    var newVec = this.direction.mult(longness);

    this.endPos = {
      x: this.startPos.x + newVec.x,
      y: this.startPos.y + newVec.y
    };

    var angle = 10;
    var savetyCounter = 0;

    // If the line is outside the window try to bring it back in the screen by rotating
    while (((this.endPos.x > (window.innerWidth) || this.endPos.x < -(window.innerWidth)) || (this.endPos.y > window.innerHeight || this.endPos.y < -(window.innerHeight))) && savetyCounter < 36) {

      this.endPos = {
        x: this.startPos.x + newVec.rotate(angle).x,
        y: this.startPos.y + newVec.rotate(angle).y
      };

      angle += 10;
      // Savety count
      savetyCounter++;
    }

    var lineInfo = {
      start: this.startPos,
      end: this.endPos,
      c: getColorStr(),
      e: (energy * 0.7 < 1 ? 1 : energy * 0.7),
      curvefactor: curvefactor
    }

    this.history.push(lineInfo);
  }

  // draw recently added path
  show() {

    var hist = this.history[this.history.length - 1];
    var color_rgb = hist.c;
    var e = hist.e;
    var start = hist.start;
    var end = hist.end;
    var cf = hist.curvefactor;


    if (this.history.length > 2) {

      var path = paper.path("M {0} {1} Q {2} {3} {4} {5}", end.x, end.y, (end.x + cf.x), (end.y + cf.y), start.x, start.y).attr({
        "stroke-width": e,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        stroke: color_rgb
      });

      // Add listeners to SVG, so manually drawing is also possible.
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

    }
  }
}
