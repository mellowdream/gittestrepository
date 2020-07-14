
// Modules to control application lifecycle (main process)

const { app, BrowserWindow, Menu, Tray, shell, ipcMain, ipcRenderer } = require('electron');
const path = require('path');

/* Read config JSON */
let config = require('./config.json');

/* Internal state/var */
let __state = {
  forceQuit: false,
  developerMode: true,
  isTimerRunning: 1,
  basePath: __dirname,
  icoTray: getPathTo(config.icons.find(i => i.id==='tray').asset),
  icoTrayPaused: getPathTo(config.icons.find(i => i.id==='tray.paused').asset),
  urlFallback: "https://think.dj/refreshie/",
}


let mainWindow = null;
let mainTray = null;

function createMainWindow () {

  if (mainWindow!==null) {
    mainWindowVisibility('show');
    return false;
  }

  // Create the browser window.
  mainWindow = new BrowserWindow( {
    width: 800,
    height: 396,
    useContentSize: false,
    alwaysOnTop: false,
    center: true,
    movable: true,
    maximizable: false,
    minimizable: true,
    resizable: false,
    skipTaskbar: false,
    title: config.name,
    icon: __state.icoTray,
    transparent: false,
    frame: false,
    hasShadow: false,
    fullscreen: false,
    fullscreenable: true,
    titleBarStyle: "hidden",
    show: true,
    webPreferences: {
      nodeIntegration: true, // false: default value from Electron v5+
      nodeIntegrationInSubFrames: false, // false: default value from Electron v5+
      nodeIntegrationInWorker: false,
      contextIsolation: false, // true: protect against prototype pollution
      enableRemoteModule: true, // remote
      spellcheck: false,
      experimentalFeatures: false,
      allowRunningInsecureContent: false,
      preload: getPathTo('preload.js'), // use a preload script
    }
  })

  // index.html of the app.
  mainWindow.loadFile( getPathTo( 'app/app.html' ) );

  /* Subscribe to events */
  /* App Ready */
  mainWindow.on('minimize', function() {
    mainWindow.hide();
  });
  /* Close */
  mainWindow.on('close', function(e) {
    if(!__state.forceQuit) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
  /* Quit */
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // delete mainMenu; delete mainTray; delete mainWindow;
    app.quit();
  });

  /* Open the DevTools? */
  /* modes: 'right' | 'bottom' | 'undocked' | 'detach' */
  if(__state.developerMode) mainWindow.webContents.openDevTools({ mode: "detach" } )

}

// app.whenReady() => This method will be called when Electron/Core has finished initialization,
// and is ready to create browser windows. Some APIs can only be used after this event occurs.
app.whenReady().then( () => {

  /* CORE */
  createMainWindow(); // create the main process' window
  setTrayMenu(); // set the tray menu
  ipcSubscriptions(); // inter-process communication subscriptions

  /* Handle SPECIAL CASES */
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  });

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


function setTrayMenu() {

  mainTray = new Tray(__state.icoTray);
  mainTray.setToolTip(config.name);

  let menuItems = [
    {
      label: 'Show App',
      click: function () {
        showMainWindow();
      }
    },
    {
      label: 'Restart',
      click: function () {
        sendToRenderer("restart");
      }
    },
    {
      label: 'Pause/Resume',
      click: function () {
        sendToRenderer("toggle");
      }
    },
    {type: 'separator'},
    {
      label: 'Homepage',
      click: async () => {
        await shell.openExternal(config.url || __state.urlFallback)
      },
    },
    {
      label: 'About ' + config.name,
      click: async () => {
        await shell.openExternal(config.urlAbout ? config.urlAbout : config.url ? config.url : __state.urlFallback)
      },
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function () {
        app.exit(0);
      }
    }
  ];
  /* DEV MODE: Reload app */
  if(__state.developerMode) {
    menuItems.push(
        {type: 'separator'},
        {
          label: 'Relaunch App [DEV]',
          click: async () => {
            app.exit()
            app.relaunch();
          },
        },
        {type: 'separator'},
    )
  }

  let contextMenu = Menu.buildFromTemplate(menuItems);
  mainTray.setContextMenu(contextMenu);

  /* Events */
  /* Show mainWindow on click/double-click of theTray */
  mainTray.on('click',function() {
    mainWindowVisibility('show');
  });
  mainTray.on('double-click',function() {
    /* Windows-only */
    mainWindowVisibility('toggle');
  });

}

/* Inter-process Communication Subscriptions */
function ipcSubscriptions() {
  let channelName = 'synchronous-messages';
  ipcMain.on( channelName, function (e, arg) {
    switch (arg) {
      case "timer-restart":
        __state.isTimerRunning = 1;
        mainTray.setImage(__state.icoTray);
        break;
      case "timer-toggle":
      case "timer-paused":
      case "timer-running":
        /* Flip state, change TrayIco */
        __state.isTimerRunning = !!(1 - Number(__state.isTimerRunning));
        __state.isTimerRunning ?
            mainTray.setImage(__state.icoTray) :
            mainTray.setImage(__state.icoTrayPaused);
        break;
      case 'lockPC':
        lockPC();
        break;
      case 'check-for-updates':
        checkForUpdates();
        break;
      case 'force-quit':
        app.exit();
        break;
      default:
        break;
    }
  })

  /* * /
  // In main process.
  const { ipcMain } = require('electron')
  ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg) // prints "ping"
    event.reply('asynchronous-reply', 'pong')
  })

  ipcMain.on('synchronous-message', (event, arg) => {
    console.log(arg) // prints "ping"
    event.returnValue = 'pong'
  })
  /* */

}


function sendToRenderer(message, channel='channel-main-ipc') {
  return mainWindow.webContents.send(channel, message);
}


/* Handle main window visibility */
function mainWindowVisibility(state) {
  let windowVisible = (mainWindow.isVisible() && !mainWindow.isMinimized());
  switch(state) {
    case 'show':
      showMainWindow();
      break;
    case 'hide':
      mainWindow.hide();
      break;
    case 'toggle':
    default:
      if(windowVisible) mainWindow.hide()
      else { showMainWindow(); }
      break;
  }
}
function showMainWindow() {
  let isMinimized = mainWindow.isMinimized(), isVisible = mainWindow.isVisible();
  if(!isVisible) mainWindow.show();
  if(isMinimized) mainWindow.restore();
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/* HELPER FUNCTIONS */
function getPathTo(filename) {
  if(filename.startsWith('/')) return __dirname + filename;
  return path.join(__dirname, filename);
}
/* Lock Workstation */
let lockPC = () => {
  if(['win32','win64'].includes(process.platform)) {
    const exec = require('child_process').exec;
    const winLockCommand = "rundll32.exe user32.dll, LockWorkStation";
    exec(winLockCommand);
  }
}
let restartApp = () => {
  const exec = require('child_process').exec;
  exec(process.argv.join(' ')); /* Execute the command that was used to run the app*/
  app.exit(0);
}
