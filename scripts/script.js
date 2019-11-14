try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}


var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

let sensors = [
    "Temperature" ,
    "Proximity" ,
    "Accelerometer",
    "IR" , "Infrared" ,
    "Pressure" ,
    "Light" ,
    "Ultrasonic" ,
    "Smoke", "Gas" , "Alcohol" ,
    "Touch" ,
    "Color" ,
    "Humidity" ,
    "Tilt" ,
    "Flow" , "Level",
    "weather", "stock", "cryptocurrency", "football"

];
let actors = [
  'Gmail',
  'Facebook',
  'Telegram',
  'Instagram',
  'Pinterest',
  'twitter',
];
let mapping = [
  'mapping',
  'notification',
  'range',
  'higher',
  'lower',
  'less',
  'below',
  'compare',
  'threshold',
];

let citiesInEngland = ['Avon', 'Bedfordshire', 'Berkshire', 'Buckinghamshire', 'Cambridgeshire', 'Cheshire', 'Cleveland', 'Cornwall', 'Cumbria', 'Derbyshire', 'Devon', 'Dorset', 'Durham', 'East Sussex', 'Essex', 'Gloucestershire', 'Hampshire', 'Herefordshire', 'Hertfordshire', 'Isle of Wight', 'Kent', 'Lancashire', 'Leicestershire', 'Lincolnshire', 'London', 'Merseyside', 'Middlesex', 'Norfolk', 'Northamptonshire', 'Northumberland', 'North Humberside', 'North Yorkshire', 'Nottinghamshire', 'Oxfordshire', 'Rutland', 'Shropshire', 'Somerset', 'South Humberside', 'South Yorkshire', 'Staffordshire', 'Suffolk', 'Surrey', 'Tyne and Wear', 'Warwickshire', 'West Midlands', 'West Sussex', 'West Yorkshire', 'Wiltshire', 'Worcestershire'];

var fuzzyLib = FuzzySet(citiesInEngland.concat(mapping, actors, sensors));

// Get all notes from previous sessions and display them.
if (!localStorage.getItem('spokenwords')) localStorage.setItem('spokenwords', ' ');
renderNotes(localStorage.getItem('spokenwords'));



/*-----------------------------
Voice Recognition
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses.
recognition.continuous = true;

// This block is called every time the Speech APi captures a line.
recognition.onresult = function(event) {

  // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far.
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;

  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function() {
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function() {
  instructions.text('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('No speech was detected. Try again.');
  };
}



/*-----------------------------
App buttons and input
------------------------------*/

$('#start-record-btn').on('click', function(e) {
  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
});


$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  instructions.text('Voice recognition paused.');
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('keypress', function(event) {
  noteContent = $(this).val();

  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    if(!noteContent.length) {
      instructions.text('Could not save empty note. Please add a message to your note.');
    }
    else {
      // Save note to localStorage.
      // The key is the dateTime with seconds, the value is the content of the note.
      saveNote(noteContent);

      // Reset variables and update UI.
      renderNotes(noteContent);
      noteContent = '';
      noteTextarea.val('');
      instructions.text('Note saved successfully.');
    }

  }

})


$('#save-note-btn').on('click', function(e) {
  recognition.stop();

  if(!noteContent.length) {
    instructions.text('Could not save empty note. Please add a message to your note.');
  }
  else {
    // Save note to localStorage.
    // The key is the dateTime with seconds, the value is the content of the note.
    saveNote(noteContent);

    // Reset variables and update UI.
    renderNotes(noteContent);
    noteContent = '';
    noteTextarea.val('');
    instructions.text('Note saved successfully.');
  }

})


notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected note.
  if(target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});



/*-----------------------------
Speech Synthesis
------------------------------*/

function readOutLoud(message) {
  var speech = new SpeechSynthesisUtterance();

  // Set the text and voice attributes.
  speech.text = message;
  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;

  window.speechSynthesis.speak(speech);
}



/*-----------------------------
Helper Functions
------------------------------*/


function renderNotes(content){
  let spokenwords = content.split(' ');
  spokenwords.forEach(function(word) {
    if (word.replace(/\s/g, '').length){
      let button = document.createElement('button');
      button.innerHTML = word;
      button.className = "vbutton";
      button.onclick = function(){
        if (word == 'clear'){
          localStorage.clear();
          document.getElementById('notes').innerHTML = "";
        } else {
            readOutLoud(word);return false;
        }
      };
      document.getElementById('notes').appendChild(button);
      let fuzzyResult = fuzzyLib.get(word, null ,.50);
      if (fuzzyResult != null){
        console.log(fuzzyResult);
        fuzzyResult.forEach(function(close){
          let suggestion = document.createElement('button');
          suggestion.innerHTML = close[1];
          suggestion.className = "vsuggest";
          suggestion.onclick = function(){
            readOutLoud(close[1]);return false;
          };
          document.getElementById('notes').appendChild(suggestion);
        })
      }
    }
  });

}


function saveNote(content) {
  localStorage.setItem('spokenwords', localStorage.getItem('spokenwords')+ ' ' + content);
}
