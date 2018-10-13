const ipcRendererfunct = require('electron').ipcRenderer;
const ipcRenderer = require('electron').ipcRenderer;
ipcRendererfunct.on('sync-files', function() {
  backgroundProcess();
});
ipcRenderer.on('launch-pref', function() {
  launchPref();
});
ipcRendererfunct.on('min-interface', function() {
  toggleVisibilityOfMinimizedInterfaceElements();
});
const Store = require('electron-store');
const prefstore = new Store();

//::first run of App default colors
defBgCol = 'rgba(0, 27, 39,.9)';
defTermBgCol = 'rgba(2,39,55,1)';
defTtlBgCol = 'rgba(2,39,55,.9)';
defHlCol = 'rgba(173, 81, 27,1)';
defActCol = 'rgba(250,63,84,1)';
defTxtCol = 'rgba(21,213,234,1)';
//& make sure vars from prefstor are not undefined
var dbgC = prefstore.get('bgCol');
if (dbgC == undefined){ddgC = defBgCol; prefstore.set('bgCol', defBgCol);}
var dtlC = prefstore.get('ttlCol');
if (dtlC == undefined){dtlC = defTtlBgCol; prefstore.set('ttlCol', defTtlBgCol);}
var hlC = prefstore.get('hlCol');
if (hlC == undefined){hlC = defHlCol; prefstore.set('hlCol', defHlCol);}
var txtC = prefstore.get('txtCol');
if (txtC == undefined){txtC = defTxtCol; prefstore.set('txtCol', defTxtCol);}
var actC = prefstore.get('actCol');
if (actC == undefined){actC = defActCol; prefstore.set('actCol', defActCol);}

//::tvar = vars for often-used targets
var inputBoxSource = document.getElementById('sourceTxt');
var inputBoxDestination = document.getElementById('destinationTxt');
var outputBox = document.getElementById('terminal-output');
var sourcePath = "";
var sourceDropTargetTurn = 1;
var destinationPath = "";
var readyPost = document.querySelectorAll('.ready')
var defaultCommand = 'rsync';
var flags = [];
var delFlag = "";
var defaultTitle = document.getElementById('appTitle').innerHTML;
var prefMsg = "Preferences";
var prefState = false;
var mainContentElement = document.getElementById('mainContent');
var prefPaneElement = document.getElementById('prefPane');
var allPrefFieldsOnPage = document.querySelectorAll('.txtEntry');
var allColorPickersOnPage = document.querySelectorAll('.color-picker');
var swapBtn = document.getElementById("swapButton");
var fldrOpts = document.querySelectorAll('.folderOptions');
var fldrOpt = fldrOpts[0];

//::var hl elements state
var folderInsideState = prefstore.get('folderInsideState');
var hlEl01 = document.getElementById('appTitle');
var hlEl02 = document.getElementById('status');
hlElements_txt = [hlEl01, hlEl02];
var hlinput01 = document.getElementById('sourceItemItself');
var hlinput02 = document.getElementById('sourceItemsInside');
var sourceItemsInsideChd = hlinput02.getAttribute('checked');
var hlinput03 = document.getElementById('aFlag');
var hlinput04 = document.getElementById('uFlag');
var hlinput05 = document.getElementById('dFlag');
hlElements_bg = [hlinput01, hlinput02, hlinput03, hlinput04, hlinput05];
var newHlCol_A04 = transparentize(prefstore.get('hlCol'), .3);

//::txt elements/color:vtxt
txtElements_txt = [inputBoxSource,inputBoxDestination, outputBox];//these use var from gui-funct.js
var txtElem_ruleLines = document.querySelectorAll("#wndwLbl, #flagWinLbl");
var submitBtn = document.getElementById('Submit');
var newTxtCol = prefstore.get('txtCol');
var newTxtCol_A04 = transparentize(newTxtCol, .4);
prefFields = ["#prefIntW", "#prefIntH", "#prefIntX", "#prefIntY", ];
var newActCol = prefstore.get('actCol');

//::vars targeting checkbox flags:vflags
var f_itselfGFXbtn = document.getElementById("sourceItemItself").nextElementSibling;
var f_insideGFXbtn = document.getElementById("sourceItemsInside").nextElementSibling;

var aflag = document.getElementById("aFlag");
var uflag = document.getElementById("uFlag");
var dflag = document.getElementById("dFlag");
var flaggedReadyField1 = inputBoxSource.previousSibling;
var flaggedReadyField2 = inputBoxDestination.previousSibling;
var flagToggle = "closed";
var flag = document.getElementById('flags');
var flagLabel = document.getElementById('flagWinLbl');
var flagTogBtn = document.getElementById('flagTogBtn');
var flagToggleTxt = document.getElementById('flagTogTxt');

//::vars for terminal - code preview:vterm
var termToggle = "closed";
var termLabel = document.getElementById('wndwLbl');
var termTogBtn = document.getElementById('termTogBtn');
var termToggleTxt = document.getElementById('termTogTxt');

//Minimal Interface
var minimizedInterface = prefstore.get("minInt");

//INIT and get ALL pref values from config.json - display them on proper elements
document.getElementById('prefIntW').textContent = prefstore.get('intW');
document.getElementById('prefIntH').textContent = prefstore.get('intH');
document.getElementById('prefIntX').textContent = prefstore.get('intX');
document.getElementById('prefIntY').textContent = prefstore.get('intY');
document.getElementById('html').style.background = prefstore.get('bgCol');
document.getElementById('titlebar').style.background = prefstore.get('ttlCol');

//setting output
function targetTextArea() {return document.getElementById("terminal-output");  };
function targetStatusArea(){return document.getElementById("status");};

//4 functions to turn on/off flags
function flagEmptyCheck(){
  if (flags.length == 0){flags.push("-");}
}
function addRemoveaFlag() {
  //add dash if empty
  flagEmptyCheck(); 
  //if true, add "a" else empty or delete "a"
    if(aflag.checked == true ){
      flags.push("a");
      aflag.setAttribute('checked', 'checked');
    }else{
      if(flags.length <= 2){flags = [];}
      flags = flags.filter(function(item) { 
        return item !== "a";
      });
      aflag.setAttribute('checked', 'unchecked');
    }
  setCodePreview();
  setHlColOfElBasedOnState();
}
function addRemoveuFlag() {
  flagEmptyCheck();
  if(uflag.checked == true ){
    flags.push("u");
    uflag.setAttribute('checked', 'checked');
  }else{
    if(flags.length <= 2){flags = [];}
    flags = flags.filter(function(item) { 
      return item !== "u";
    });
    uflag.setAttribute('checked', 'unchecked');
  }
  setCodePreview();
  setHlColOfElBasedOnState();
}

function addRemovedFlag() {
  var readdflag = dflag.getAttribute('checked')
    if(readdflag == "unchecked" ){
      dflag.setAttribute('checked', 'checked');
      setHlColOfElBasedOnState();
      delFlag = " --delete";
      }else{
        dflag.setAttribute('checked', 'unchecked');
        setHlColOfElBasedOnState();
        delFlag = "";
      }
      setCodePreview();
}
//turn off flags on load
function checkAllFlags(){
  addRemoveaFlag();
  addRemoveuFlag();
}

//concatenate terminal command for preview
function setCodePreview(){  
  outputBox.innerHTML = defaultCommand + " " + flags.join("") + delFlag + " " + sourcePath + " " + destinationPath;
}

//adding-text while typing function
function addToTargetTextArea(msg) {targetTextArea().value += msg;}

//move flag on input fields
function flagInputs(){
  if (sourceDropTargetTurn == 1){
    flaggedReadyField2.classList.remove('readyTargettedIndicator'); 
    flaggedReadyField1.classList.add('readyTargettedIndicator');
  }else{
    flaggedReadyField1.classList.remove('readyTargettedIndicator');
    flaggedReadyField2.classList.add('readyTargettedIndicator');
  }
}
flagInputs();

// on 1st run dotted line highlight input fields when ready for input
var firstRun = true;
function hlFields(){
  if (firstRun == false){
      if (sourceDropTargetTurn == 1){
        inputBoxSource.parentNode.classList.remove('unreadyTargettedField');
        inputBoxSource.parentNode.classList.add('readyTargettedField');

        inputBoxDestination.parentNode.classList.remove('readyTargettedField');
        inputBoxDestination.parentNode.classList.add('unreadyTargettedField');
      }else{
        inputBoxDestination.parentNode.classList.remove('unreadyTargettedField');
        inputBoxDestination.parentNode.classList.add('readyTargettedField');

        inputBoxSource.parentNode.classList.remove('readyTargettedField');
        inputBoxSource.parentNode.classList.add('unreadyTargettedField');
      }
  }//no else statement needed
} 

//drag-drop COMPLETED highlight background of field function
function guideColor(field){
  var validNode = field.parentNode.firstChild;
  var readyNode = field.parentNode.childNodes[1];
  if(field.innerHTML == ""){
    validNode.style.display = 'none';
  }else{
    validNode.style.display = 'block';
  }
}
//set drag-drop functions
document.ondragover = document.ondrop = (ev) => {ev.preventDefault()
}
document.body.ondrop = (ev) => {
  var checkPath = hlinput02.getAttribute('checked');
  if (sourceDropTargetTurn == 1){
      ev.preventDefault();
      if (checkPath == "checked"){
        sourcePath = (ev.dataTransfer.files[0].path) + "/";
      }
      else{
        sourcePath = (ev.dataTransfer.files[0].path);
      }
      inputBoxSource.innerHTML = sourcePath;
      setCodePreview();
      guideColor(inputBoxSource);
      sourceDropTargetTurn = 2; //set target to 2nd field
  }else{
      ev.preventDefault();
      destinationPath = (ev.dataTransfer.files[0].path);
      inputBoxDestination.innerHTML = destinationPath;
      setCodePreview();
      guideColor(inputBoxDestination);
      sourceDropTargetTurn = 1; //set target to 1st field
      firstRun = false;
  }
  flagInputs();
  hlFields();
  var allFlags = flags.join("");
}

//Typing function
inputBoxSource.onkeyup = function(){
  sourcePath = inputBoxSource.innerHTML;
  setCodePreview();
  guideColor(inputBoxSource);
}
inputBoxDestination.onkeyup = function(){
  destinationPath = inputBoxDestination.innerHTML;
  setCodePreview();
  guideColor(inputBoxDestination);
}

//Set status message
function setStatus(msg){targetStatusArea().innerHTML = msg;};

//trigger the rsync on click
document.getElementById('Submit').addEventListener('click', backgroundProcess);

//custom alert dialog
function customAlert(mes){
  document.getElementById("appTitle").innerHTML = mes;
}

function backgroundProcess() {

  if (inputBoxSource.value =="" || inputBoxSource.value =="/" || inputBoxDestination.value ==""){
    var warningTxt = "Either a source/destination file is missing...";
    customAlert(warningTxt);
      if (inputBoxSource.value ==""){inputBoxSource.parentNode.add =  "inputValid"};
      if (inputBoxDestination.value ==""){inputBoxDestination.parentNode.style.border =  warningCSS};
      setStatus("missing files");
  }
  else{
      const process = require('child_process');   // The power of Node.JS
      var allFlags = flags.join("");
      var syncThis = process.spawn(defaultCommand, [allFlags, sourcePath,destinationPath]);
      // var ls = process.spawn('./test.sh'); //test run file

      syncThis.stdout.on('data', function (data) {
        // console.log('stdout: <' + data+'> ');
            // appendToDroidOutput(data);
        appendToDroidOutput('stdout: <' + data+'> \n');
      });
      
      syncThis.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
      });
  
      syncThis.on('close', function (code) {
        // console.log('child process exited with code ' + code);
            if (code == 0)
            setStatus('rsync process complete');
            else
            setStatus('rsync process exited with code ' + code);
      });
  }
  };

//Toggle terminal view
termTogBtn.addEventListener('click', toggleThatTerminal);
function toggleThatTerminal(){
  //if closed, open it
  if(termToggle == "closed"){ 
    outputBox.classList.remove('closed');
    termLabel.classList.remove('closed');
    termToggleTxt.innerHTML = 'CLOSE';
    termToggle = "open";
  }//if open, close it
  else{ 
    outputBox.classList.add('closed');
    termLabel.classList.add('closed');
    termToggleTxt.innerHTML = 'OPEN';
    termToggle = "closed";
  }
}
//Toggle flag options
flagTogBtn.addEventListener('click', toggleThoseOptions);
function toggleThoseOptions(){
  if(flagToggle=="closed"){ 
    flag.classList.remove('closed');
    flagLabel.classList.remove('closed');
    flagToggle = "open";
    flagToggleTxt.innerHTML = 'CLOSE';
  }else{
    flag.classList.add('closed');
    flagLabel.classList.add('closed');
    flagToggle = "closed";
    flagToggleTxt.innerHTML = 'OPEN';
  }
}
//make the swap button work
swapBtn.addEventListener('click', swapThosePaths);
function swapThosePaths(){
  var a = sourcePath;
  var b = destinationPath;

  sourcePath = b ; //sourc is now dest
  destinationPath = a ; //dest is now source
  inputBoxSource.innerHTML = sourcePath;
  inputBoxDestination.innerHTML = destinationPath;
  setCodePreview();
  guideColor(inputBoxSource);
  guideColor(inputBoxDestination);
}

//TO DO
//√ Do not run if empty 
//√ Make code view collapsable
//√ Detect if the source is a file or folder and put the / in automatically
//√ Make a swap button
//√ Saved some preferences
//Last 5 destinations
//See if I can output actual terminal feedback/progress

function transparentize(tcol, op){
  var A04 = op;
  var A04p = A04 + ")";
  newCol = tcol.split(', ');
  newCol.splice(3,1, A04p);
  newCol = newCol.join(', ');
  newCol_A04 = newCol;
  return(newCol_A04);
}

//action elements/color
smButtons = document.querySelectorAll("#swapButton,#termTogBtn,#flagTogBtn,.reset"); //change to objects later

//show/hide pref pane
document.getElementById('preferencesIcon').addEventListener('click', launchPref);
function launchPref(){
  if (prefState == false){
    customAlert(prefMsg);
    mainContentElement.style.display = "none";
    prefPaneElement.classList.remove('closed');
    prefState = true;
  }else{
    prefPaneElement.classList.add('closed');
    customAlert(defaultTitle);
    mainContentElement.style.display = "block";
    prefState = false;
  }
}

//on click - return prefs to default
document.getElementById('prefIntW').addEventListener("focusout", function(){
  prefstore.set('intW', Number(this.textContent));
});
document.getElementById('prefIntH').addEventListener("focusout", function(){
  prefstore.set('intH', Number(this.textContent));
});
document.getElementById('prefIntX').addEventListener("focusout", function(){
  if(this.textContent == ''){prefstore.set("intX", "center")}
  else{prefstore.set('intX', Number(this.textContent))};
});
document.getElementById('prefIntY').addEventListener("focusout", function(){
  if(this.textContent == ''){prefstore.set("intY", "center")}
  else{prefstore.set('intY', Number(this.textContent))};
});
document.getElementById('prefXyLabel').addEventListener("click", function(){
  prefstore.set('intX', 'center');prefstore.set('intY', 'center');
});
document.getElementById('bgpckLbl').addEventListener("click", function(){
  document.getElementById('html').style.background = bgpickr.options.default;
  prefstore.set('bgCol', bgpickr.options.default);
  bgpickr.setColor(bgpickr.options.default);
});
document.getElementById('ttlpckLbl').addEventListener("click", function(){
  document.getElementById('titlebar').style.background = ttlpickr.options.default;
  prefstore.set('ttlCol', ttlpickr.options.default); 
  ttlpickr.setColor(ttlpickr.options.default); 
});
document.getElementById('hlpckLbl').addEventListener("click", function(){
  prefstore.set('hlCol', hlpickr.options.default); 
  hlpickr.setColor(hlpickr.options.default);
  var col =  hlpickr.options.default;
});
document.getElementById('txtpckLbl').addEventListener("click", function(){
  prefstore.set('txtCol', hlpickr.options.default); 
  txtpickr.setColor(txtpickr.options.default); 
});
document.getElementById('actpckLbl').addEventListener("click", function(){
  prefstore.set('actCol', actpickr.options.default); //write to file
  actpickr.setColor(actpickr.options.default); //write to picker
});

//add click and focus functions to css-highlight the field divs contents
allPrefFieldsOnPage.forEach(function(div, index) {
  div.addEventListener('click', function() {
    this.classList.add('active');
  });
  div.addEventListener('focusout', function() {
    changeClass(index);
  });
});

//fields have content? change css accordingly
changeClass = function(fieldIndex) {
  if(allPrefFieldsOnPage[fieldIndex].textContent == ""){
    allPrefFieldsOnPage[fieldIndex].classList.remove('active');
  }else{
    allPrefFieldsOnPage[fieldIndex].classList.add('active');
  }
};

const bgpickr = new Pickr({
  el: '#bgpck',
  default: defBgCol,
  position: 'left',
  components: {
      preview: false,
      opacity: true,
      hue: true,
      interaction: {
          hex: true,
          rgba: true,
          hsva: true,
          input: true,
          clear: true,
          save: true
      }
  },
  onSave(hsva, instance01){
    var initCol = hsva.toRGBA().toString()
    prefstore.set('bgCol', initCol);
    document.getElementById('html').style.background = initCol;
    document.getElementById('terminal-output').style.background = initCol;
  }
});
bgpickr.setColor(prefstore.get('bgCol'));

const ttlpickr = new Pickr({
  el: '#ttlpck',
  default: defTtlBgCol,
  position: 'left',
  components: {
      preview: false,
      opacity: true,
      hue: true,
      interaction: {
          hex: true,
          rgba: true,
          hsva: true,
          input: true,
          clear: true,
          save: true
      }
  },
  onSave(hsva, instance02){
    var initCol = hsva.toRGBA().toString()
    prefstore.set('ttlCol', initCol);
    document.getElementById('titlebar').style.background = initCol;
  }
});
ttlpickr.setColor(prefstore.get('ttlCol'));

const hlpickr = new Pickr({
  el: '#hlpck',
  default: defHlCol,
  position: 'left',
  components: {
      preview: false,
      opacity: true,
      hue: true,
      interaction: {
          hex: true,
          rgba: true,
          hsva: true,
          input: true,
          clear: true,
          save: true
      }
    },
    onSave(hsva, instance03){
      var initCol = hsva.toRGBA().toString();
      prefstore.set('hlCol', initCol);
      initCol = prefstore.get('hlCol');
      hlC = initCol;
      newHlCol_A04 = transparentize(initCol, .3);
      //runs on start:
      changeHlColorAll();
    }
});
hlpickr.setColor(prefstore.get('hlCol'));

const txtpickr = new Pickr({
  el: '#txtpck',
  default: defTxtCol,
  position: 'left',
  components: {
      preview: false,
      opacity: true,
      hue: true,
      interaction: {
          hex: true,
          rgba: true,
          hsva: true,
          input: true,
          clear: true,
          save: true
      }
    },
    onSave(hsva, instance04){      
      var initCol = hsva.toRGBA().toString();
      prefstore.set('txtCol', initCol);
      newTxtCol_A04 = transparentize(initCol, .4);
      changeTxtColor(txtElements_txt, smButtons, initCol, newTxtCol_A04);
    }
});
txtpickr.setColor(prefstore.get('txtCol'));

const actpickr = new Pickr({
  el: '#actpck',
  default: defActCol,
  position: 'left',
  components: {
      preview: false,
      opacity: true,
      hue: true,
      interaction: {
          hex: true,
          rgba: true,
          hsva: true,
          input: true,
          clear: true,
          save: true
      }
    },
    onSave(hsva, instance05){
      var initCol = hsva.toRGBA().toString();
      prefstore.set('actCol', initCol);
      changeActColor(readyPost, smButtons, initCol);
    }
});
actpickr.setColor(prefstore.get('actCol'));

function changeActColor(classN, classNhov, actncolor){
  var changeTheseElements = classN;
  // var changeTheseElementsWithHover = document.querySelectorAll(classNhov);
    // set Submit button
    submitBtn.addEventListener('mouseover', function(){this.style.background = actncolor;});

    //cycle through targets and apply color
    changeTheseElements.forEach(function(p, index) {
      changeTheseElements[index].style.background = actncolor;
    });
        //hovers need it applied twice
        classNhov.forEach(function(div, index) {
          classNhov[index].addEventListener('mouseover', function(){
            this.style.backgroundColor = actncolor;
      });
    });
};
function changeHlColorAll(){
  hlElements_txt.forEach(function(p, index) {
    hlElements_txt[index].style.color = hlC;
    });
    setHlColOfElBasedOnState();
}
function setHlColOfElBasedOnState(){
  hlElements_bg.forEach(function(input, index) {
    var thisCheck = hlElements_bg[index].getAttribute('checked');
    var thisNext = hlElements_bg[index].nextElementSibling; 
        if (thisCheck == 'checked' ){   
          thisNext.style.backgroundColor = hlC;
          thisNext.style.border = 'inset 1px transparent';
        }else{
          thisNext.style.backgroundColor = 'transparent';          
          thisNext.style.border = 'solid 3px '+newTxtCol_A04;
        }
  });
}

function changeTxtColor(txt, bg, col, coltransparent){
  document.getElementById('preferencesIcon').style.color = coltransparent;
    var changeTheseFields = document.querySelectorAll(prefFields);
    document.getElementById('titlebar').style.borderBottomColor = col;

    txt.forEach(function(p, index) {
      txt[index].style.color = col;
    });
    submitBtn.style.background = col;
    submitBtn.addEventListener('mouseleave', function(){this.style.background = col});
    document.getElementById('mainContent').style.color = coltransparent;
    document.getElementById('prefPane').style.color = coltransparent;
    txtElem_ruleLines.forEach(function(div, index){
      txtElem_ruleLines[index].style.borderColor = coltransparent;
    })
    bg.forEach(function(div, index){
      bg[index].style.backgroundColor = coltransparent;
      bg[index].addEventListener('mouseout', function(){
        this.style.background = coltransparent;
      });
    });
    changeTheseFields.forEach(function(div, index){
      changeTheseFields[index].style.backgroundColor = coltransparent;
      changeTheseFields[index].style.color = col;      
    });
    hlElements_bg.forEach(function(input, index) {
      var thisCheck = hlElements_bg[index].getAttribute('checked');
        if (thisCheck == 'checked' ){   
          //nothing
        }else{
          var thisNext = hlElements_bg[index].nextElementSibling; 
          thisNext.style.borderColor = coltransparent;
        }
    });
  inputBoxSource.parentNode.style.borderColor = coltransparent;
  inputBoxDestination.parentNode.style.borderColor = coltransparent;
}

//InitPref on load radio determining item vs folder contents
function initFolderContentsCheckedState(fldrCntntState){
  if (fldrCntntState == true){
    hlinput01.setAttribute('checked', 'unchecked');
    hlinput02.setAttribute('checked', 'checked');
  }else {
    hlinput01.setAttribute('checked', 'checked');
    hlinput02.setAttribute('checked', 'unchecked');
  }
  setHlColOfElBasedOnState(); //set color
  addSlashToSourcePath(); //set that path
}

f_itselfGFXbtn.addEventListener("click", switchFolderContentsCheckedState, false);
f_insideGFXbtn.addEventListener("click", switchFolderContentsCheckedState, false);
aflag.addEventListener("change", addRemoveaFlag, false);
uflag.addEventListener("change", addRemoveuFlag, false);
dflag.addEventListener("change", addRemovedFlag, false);

// macro
function radioMacro(){
  switchFolderContentsCheckedState();
}

//switch radio determining item vs folder contents
function switchFolderContentsCheckedState(){
  if (folderInsideState == true){
    folderInsideState = false;
    hlinput01.setAttribute('checked', 'checked');
    hlinput02.setAttribute('checked', 'unchecked');
  }else {
    folderInsideState = true;
    hlinput01.setAttribute('checked', 'unchecked');
    hlinput02.setAttribute('checked', 'checked');
  }
  setHlColOfElBasedOnState(); //set those colors
  setFolderInsideStatePref(); //dump var to pref file
  addSlashToSourcePath(); //set that path
}
//setPref for folderContents on interaction
function setFolderInsideStatePref(){
  prefstore.set('folderInsideState', folderInsideState);
}

// item/folder set path accordingly
function addSlashToSourcePath(){
  var checkPath = hlinput02.getAttribute('checked');
  if (checkPath == "checked"){
        if(sourcePath =="" || sourcePath =="/"){
          sourcePath = "/";
          inputBoxSource.innerHTML =  'Step1: Add folder (Sync contents)' + sourcePath;
        }else{
          sourcePath = sourcePath.concat("/");
          inputBoxSource.innerHTML = sourcePath;
        }
  }else if (checkPath == "unchecked"){
      if(sourcePath =="" || sourcePath =="/"){
        sourcePath = "";
        inputBoxSource.innerHTML = sourcePath;
      }else{
        sourcePath = sourcePath.slice(0, -1);
        inputBoxSource.innerHTML = sourcePath;
      }
  }else{console.log('this is null for some reason')
  }
  setCodePreview();
}

//MinimalInterface functions
 function toggleVisibilityOfMinimizedInterfaceElements(){
  if (minimizedInterface == true){
    minimizedInterface = false;
    prefstore.set('minInt', minimizedInterface);
    initVisibilityOfMinimizedInterfaceElements(); 
  }else{
    minimizedInterface = true;
    prefstore.set('minInt', minimizedInterface);
    initVisibilityOfMinimizedInterfaceElements();
  }
}

function initVisibilityOfMinimizedInterfaceElements(){
  if (minimizedInterface == true){
    titlebar.style.visibility = 'hidden';
    preferencesIcon.style.display = 'none';
    appTitle.style.display = 'none';
    fldrOpt.style.display = 'none';
    termLabel.style.display = 'none';
    hlEl02.style.display = 'none';
    statusLabel.style.display = 'none';
    flagWinLbl.style.display = 'none';  
  }else{
    titlebar.style.visibility = 'shown';
    preferencesIcon.style.display = 'block';
    appTitle.style.display = 'block';
    fldrOpt.style.display = 'block';
    termLabel.style.display = 'block';
    hlEl02.style.display = 'block';
    statusLabel.style.display = 'block';
    flagWinLbl.style.display = 'block';
  }
  return;
}
function loadFunctions(){
  checkAllFlags();
  initFolderContentsCheckedState(folderInsideState);
  setCodePreview();
  initVisibilityOfMinimizedInterfaceElements();
}
document.onload = loadFunctions();

