
// Modules to control application lifecycle (main process)

const { app, BrowserWindow, Menu, Tray, shell, powerMonitor, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');

/* Read config JSON */
let config = require('./config.json');

/* Internal state/var */
let __state = {
  forceQuit: false,
  developerMode: !app.isPackaged,
  isTimerRunning: 1,
  basePath: __dirname,
  icoTrayPath: getPathTo(config.icons.find(i => i.id==='tray').asset),
  icoTrayPathPaused: getPathTo(config.icons.find(i => i.id==='tray.paused').asset),
  urlFallback: "https://think.dj/refreshie/",
}


let mainWindow = null;
let mainTray = null;


/* App: SINGLE INSTANCE */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus();
    }
  })
}

/* INSTALL: HANDLE SQUIRREL INSTALLER */
// this should be placed at top of main.js to handle setup events like install/uninstall
if (handleSquirrelEvent()) {
  return;
}
/* */

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
    icon: getImage(__state.icoTrayPath),
    backgroundColor: 'rgba(255,255,255,0)',
    transparent: false,
    hasShadow: true,
    frame: false,
    darkTheme: false,
    opacity: 1,
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
  mainWindow.on('minimize', function(e) {
    e.preventDefault();
    mainWindow.setSkipTaskbar(true);
    mainWindow.hide();
    //tray = createTray();
  });
  mainWindow.on('restore', function(e) {
    mainWindow.show();
    mainWindow.setSkipTaskbar(false);
    //tray.destroy();
  });
  /* Close */
  mainWindow.on('close', function(e) {
    if(!__state.forceQuit) {
      e.preventDefault();
      mainWindow.hide();
    }
    return false;
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
    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)  {
      createMainWindow();
    }
  });

  /* Power events */
  powerMonitor.on("lock-screen", () => { timerActionsAuto('lock') } );
  powerMonitor.on("suspend", () => { timerActionsAuto('lock') } );
  powerMonitor.on("unlock-screen", () => {  timerActionsAuto('unlock') } );
  powerMonitor.on("resume", () => { timerActionsAuto('unlock') } );

});

// Power-saver mode disabler
// const { powerSaveBlocker } = require('electron');
// const id = powerSaveBlocker.start('prevent-display-sleep');
// let status = powerSaveBlocker.isStarted(id);
// let stop = powerSaveBlocker.stop(id);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (!platformIs('mac')) app.quit()
})

// Emitted when remote.require() is called in the renderer process of webContents
app.on('remote-require', function () {
  //event.preventDefault() // Prevents the module from being returned
})


function setTrayMenu() {

  mainTray = new Tray(getImage(__state.icoTrayPath));
  mainTray.setToolTip(config.name);

  let menuItems = [
    {
      label: 'Show App',
      click: function () {
        showMainWindow();
      }
    },
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
      label: 'Lock PC',
      click: () => lockPC()
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
            relaunchApp();
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


function relaunchApp() {
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit();
}


function timerActions(action) {
  switch (action.toLowerCase()) {
    case 'start':
    case 'restart':
      __state.isTimerRunning = 1;
      mainTray.setImage(getImage(__state.icoTrayPath));
      break;
    case 'stop':
    case 'pause':
    case 'paused':
      __state.isTimerRunning = 0;
      mainTray.setImage(getImage(__state.icoTrayPathPaused));
      break;
    default:
    case 'toggle':
      /* Flip state, change TrayIco */
      __state.isTimerRunning = !!(1 - Number(__state.isTimerRunning));
      __state.isTimerRunning ?
          mainTray.setImage(getImage(__state.icoTrayPath)) :
          mainTray.setImage(getImage(__state.icoTrayPathPaused));
      break;
  }
}

let timerAutoPaused = false;
function timerActionsAuto(state) {
  const delay = 1000;
  switch (state.toLowerCase()) {
    case 'lock':
      if(!timerAutoPaused && __state.isTimerRunning) {
        setTimeout(() => {
          sendToRenderer("toggle");
          timerAutoPaused = true;
        }, delay);
      }
      break;
    case 'unlock':
      if(timerAutoPaused) {
        setTimeout(() => {
          sendToRenderer("restart");
          timerAutoPaused = false;
        } , delay);
      }
      break;
    default:
      break;
  }
}


/* Inter-process Communication Subscriptions */
function ipcSubscriptions() {
  let channelName = 'synchronous-messages';
  ipcMain.on( channelName, function (e, arg) {
    switch (arg) {
      case "timer-restart":
        timerActions("start");
        break;
      case "timer-toggle":
      case "timer-paused":
      case "timer-running":
        timerActions("toggle");
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


function sendToRenderer(message, channel='ipc-channel-main') {
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

/* FUNCTIONS */
function getPathTo(filename) {
  if(filename.startsWith('/')) return __dirname + filename;
  return path.join(__dirname, filename);
}
/* Lock Workstation */
let lockPC = () => {
  if(platformIs('windows')) {
    const command = "rundll32.exe user32.dll, LockWorkStation";
    const commandBackup = __state.basePath + "/app/assets/bin/w.exe quiet lock";
    return require('child_process').exec(command);
  }
}
let restartApp = () => {
  const exec = require('child_process').exec;
  exec(process.argv.join(' ')); /* Execute the command that was used to run the app*/
  app.exit(0);
}

/* Returns native image from path */
/* Fixes: Image could not be loaded from ... */
function getImage(assetPath, prefixPath = false) {
  if(prefixPath) assetPath = path.join(__state.basePath, assetPath);
  return nativeImage.createFromPath(assetPath);
}
function platformIs(string = '') {
  let platform = process.platform;
  switch (String(string).toLowerCase()) {
    case 'mac':
    case 'macos':
      return 'darwin' === platform;
    case 'win':
    case 'win32':
    case 'win64':
    case 'windows':
      return ['win32','win64'].includes(platform);
    case 'linux':
    case 'ubuntu':
      return 'linux' === platform;
    case 'droid':
    case 'android':
      return 'android' === platform;
    default:
      return false;
  }
}

/* ================ INSTALL SEQUENCE ================ */

function handleSquirrelEvent() {
  if ( !platformIs('windows') || process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join( rootFolder, 'Update.exe') );
  const exeName = path.basename(process.execPath);
  /*
  var cp = require('child_process');
  var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  var target = path.basename(process.execPath);
  var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
  child.on('close', function(code) {
    app.quit();
  });*/

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // Add your .exe to the PATH | Write to the registry for things like file associations and explorer context menus
      squirrelInstallTasks();
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and --squirrel-updated handlers
      // Remove desktop and start menu shortcuts
      squirrelUninstallTasks();
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before we update to the new version
      // It's the opposite of --squirrel-updated
      console.log("--squirrel-obsolete. Quit");
      app.quit();
      return true;
  }
}



function squirrelInstallerTasks(action='install') {

  const updateExe = "Update.exe";

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootFolder = path.resolve(appFolder, '..');
  const updateExePath = path.resolve(path.join(rootFolder, updateExe));
  const target = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;
    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}
    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateExePath, args);
  };

  switch(action) {
    case "install":
      // let child = childProcess.spawn(updateExePath, ["--shortcut-locations=Desktop,StartMenu --createShortcut", target], { detached: true });
      // child.on('close', function(code) { app.quit(); });
      spawnUpdate(['--createShortcut', target]);
      break;
    case "uninstall":
      spawnUpdate(['--removeShortcut', target]);
      break;
  }

  setTimeout(() => { app.quit()}, 1000);

}

/* =============== / INSTALL SEQUENCE =============== */



/* =================================================== */
// GLOBAL SHORTCUTS
/* =================================================== * /

const shortcutKey = 'PrintScreen'; // CommandOrControl+X

const { globalShortcut } = require('electron');

app.on('ready', () => {
  if (globalShortcut.isRegistered(shortcutKey)) return;
  const ret = globalShortcut.register(shortcutKey, () => {
    sendToRenderer("capture-image")
    return true;
  })
  if (!ret) {
    // Reg failed; Handle
  }
});

app.on('will-quit', () => {
  globalShortcut.unregister(shortcutKey);
  globalShortcut.unregisterAll();
})

/* */
