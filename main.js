const {app, BrowserWindow, Menu} = require('electron');
const {systemPreferences} = require('electron');

const Store = require('electron-store');
const store = new Store();

//control that app menu man!  
systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true)
systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true)
const template = [
  {
    label: 'File',
    submenu: [
      {label: 'Sync Files', 
      accelerator: "CmdOrCtrl+Enter", 
      click: function() {
        var focusedWindow = BrowserWindow.getFocusedWindow();
        focusedWindow.webContents.send('sync-files') } 
      }
    ]
  },
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'selectall'}
      ]
    },
    {
      label: 'View',
      submenu: [
        {role: 'reload', accelerator: "CmdOrCtrl+R"},
        {role: 'forcereload', accelerator: "CmdOrCtrl+Shift+R"},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {label: 'Toggle Minimal Interface', 
        accelerator: "CmdOrCtrl+Shift+M",
        click: function() {
          var focusedWindow = BrowserWindow.getFocusedWindow();
          focusedWindow.webContents.send('min-interface') }
        },
        {role: 'togglefullscreen'}
      ]
    },
    {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More (Cmd-?)',
          accelerator: "CmdOrCtrl+/",
          click () { require('electron').shell.openExternal('file://'+__dirname+'/help/Rsync-GUI-help.html') }
        }
      ]
    }
  ];
  //mac-specific
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {label: 'Preferences', accelerator: "CmdOrCtrl+,", click: function() {
          var focusedWindow = BrowserWindow.getFocusedWindow();
          focusedWindow.webContents.send('launch-pref');
        } },
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    });
    // Window menu
    // template[3].submenu = [
    //   {role: 'close'},
    //   {role: 'minimize'},
    //   {role: 'zoom'},
    //   {type: 'separator'},
    //   {role: 'front'}
    // ];
  };
const menu = Menu.buildFromTemplate(template);


var intW = store.get("intW");
var intH = store.get("intH");
var intX = store.get("intX");
var intY = store.get("intY");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  win = new BrowserWindow({
    width: intW, 
    minWidth: 335,
    height: intH,
    x: intX,
    y: intY,
    center:true,
    transparent: true,
    //frame: false,
    toolbar: true,
    titleBarStyle:"hidden",
    webPreferences:{
      "webSecurity":false
    }
  })

// and load the index.html of the app.
win.loadFile('index.html')

// Open the DevTools.
// win.webContents.openDevTools()

  win.on('closed', () => {

    app.quit();

    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);
//only call the menu when app is ready
app.on('ready', () =>{
  Menu.setApplicationMenu(menu);
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

app.on('activate', () => {

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }

})