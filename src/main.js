
// Modules to control Application lifecycle (`main` process)

const { app, BrowserWindow, Menu, Tray, shell, powerMonitor, ipcMain } = require('electron');  // unused: nativeImage, Notification,
const h = require('./helpers.js');
const path = require('path');


/* Read config JSON */
let config = require('./config.json');

/* Internal state/var */
let __state = {
  forceQuit: false,
  developerMode: !app.isPackaged,
  isTimerRunning: 1,
  basePath: __dirname,
  appIcoPath: h.getPathTo(config.icons.find(i => i.id==='app').asset),
  icoTrayPath: getTrayIcon('tray'),
  icoTrayPathPaused: getTrayIcon('tray.paused'),
  urlFallback: "https://think.dj/refreshie/",
}

function getTrayIcon(id) {

  /* Find the icon using id passed from the config array */
  let icoPath = config.icons.find(i => i.id===id).asset;

  /* Is the platform windows, and should we use *.ico instead of *.png? [Better quality on windows] */
  if(h.platformIs('windows') && config.icons.find(i => i.id==='use.ico.for.windows').value) {
    let pos = icoPath.lastIndexOf(".");
    icoPath = icoPath.substr(0, pos < 0 ? icoPath.length : pos) + ".ico";
  }

  return h.getPathTo(icoPath);
}

let mainWindow = null;
let mainTray = null;

// Disable GPU acceleration for better performance
// WHY? https://github.com/electron/electron/issues/13368
app.disableHardwareAcceleration();

/* MAC */
if(h.platformIs('mac')) {
  app.dock.hide();
}
// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.exit()
})

/* App: SINGLE INSTANCE */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.exit();
} else {
  // Second instance?
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus();
    }
  })
}

// app.whenReady() => This method will be called when Electron/Core has finished initialization,
// and is ready to create browser windows. Some APIs can only be used after this event occurs.
app.whenReady().then( () => {

  /* CORE */
  createMainWindow(); // create the main process' window
  setTrayMenu(); // set the tray menu
  ipcSubscriptions(); // inter-process communication subscriptions

  app.on('activate', function () {

    /* Handle SPECIAL CASES */
    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)  {
      createMainWindow();
    }
    // MacOS-specific handlers
    if (h.platformIs('mac')) {
      setMacOS();
    }
  });

  /* Power events */
  // Lock/unlock (Win/Mac)
  powerMonitor.on('lock-screen', () => { timerActionsAuto('lock') } );
  powerMonitor.on('unlock-screen', () => { timerActionsAuto('unlock') } );
  // Suspend/Resume (Win/Lin)
  powerMonitor.on('suspend', () => { timerActionsAuto('lock') } );
  powerMonitor.on('resume', () => { timerActionsAuto('unlock') } );
  // Shutdown (Mac/Lin)
  powerMonitor.on('shutdown', () => { app.quit() } );

});

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
  // Changes you make to `width` and `height` here should be changed in app.css for #container too
  mainWindow = new BrowserWindow( {
    width: 800,
    height: 390,
    useContentSize: false,
    alwaysOnTop: false,
    center: true,
    movable: true,
    maximizable: false,
    minimizable: true,
    resizable: false,
    skipTaskbar: !h.platformIs('linux'), // true only for linux
    title: config.name,
    icon: h.getImage(__state.appIcoPath),
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
      preload: h.getPathTo('/preload.js'), // use a preload script?
      backgroundThrottling: false, // Prevents renderer process code from not running when window is hidden
    }
  })

  // index.html of the app.
  mainWindow.loadFile( h.getPathTo( 'app/app.html' ) ).then( res => {} );

  /* Subscribe to events */
  /* We will override all events to either of: hide/show (rest will be configured from taskbar icon) */
  /* Show / Restore */
  mainWindow.on('show', function(e) {
    //e.preventDefault();
    //showMainWindow();
  });
  mainWindow.on('restore', function(e) {
    //e.preventDefault();
    //showMainWindow();
  });
  /* Minimize / Close */
  mainWindow.on('minimize', function(e) {
    //e.preventDefault();
    //mainWindow.hide();
  });
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
  if(__state.developerMode && config.developerMode) mainWindow.webContents.openDevTools({ mode: "detach" } )

  /* Open all external links in Browser `new-window` is fired when external links are clicked [links must have target="_blank"] */
  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    if(url.startsWith('http')||url.includes('mailto:')) {
      let o = shell.openExternal(url);
    }
  });

}


// Power-saver mode disabler
// const { powerSaveBlocker } = require('electron');
// const id = powerSaveBlocker.start('prevent-display-sleep');
// let status = powerSaveBlocker.isStarted(id);
// let stop = powerSaveBlocker.stop(id);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
//app.on('window-all-closed', function () {
//  if (h.platformIs('mac')) app.quit()
//})

// Emitted when remote.require() is called in the renderer process of webContents
app.on('remote-require', function () {
  //event.preventDefault() // Prevents the module from being returned
})


function setTrayMenu() {

  mainTray = new Tray(h.getImage(__state.icoTrayPath));
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
      label: 'Restart Breaks',
      click: function () {
        sendToRenderer("restart");
      }
    },
    {
      label: 'Pause/Reset',
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
        app.exit();
      }
    }
  ];

  /* DEV MENU ITEM: Quick-reload app to see changes */
  if(__state.developerMode && config.developerMode) {
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
    /* Mac and Windows only */
    mainWindowVisibility('toggle');
  });
  mainTray.on('right-click',function() {
    mainTray.popUpContextMenu();
  });

}

function setMacOS() {

  app.dock.setIcon(h.getImage(__state.appIcoPath));
  //app.dock.hide();

  /* Set "About" dialog (macOS only)  */
  app.setAboutPanelOptions({
    iconPath: __state.appIcoPath,
    applicationName: config.name,
    applicationVersion: config.version,
    copyright: config.copyright,
    //version: "",
    //credits: "",
    //authors: "",
    //website: ""
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
      mainTray.setImage(h.getImage(__state.icoTrayPath));
      break;
    case 'stop':
    case 'pause':
    case 'paused':
      __state.isTimerRunning = 0;
      mainTray.setImage(h.getImage(__state.icoTrayPathPaused));
      break;
    default:
    case 'toggle':
      /* Flip state, change TrayIco */
      __state.isTimerRunning = !!(1 - Number(__state.isTimerRunning));
      __state.isTimerRunning ?
          mainTray.setImage(h.getImage(__state.icoTrayPath)) :
          mainTray.setImage(h.getImage(__state.icoTrayPathPaused));
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
  let windowIsVisible = (mainWindow.isVisible() && !mainWindow.isMinimized());
  switch(state) {
    case 'show':
      showMainWindow();
      break;
    case 'hide':
      mainWindow.hide();
      break;
    case 'toggle':
    default:
      if(windowIsVisible) mainWindow.hide()
      else { showMainWindow(); }
      break;
  }
}
function showMainWindow() {
  if(mainWindow.isMinimized()) mainWindow.restore();
  if(!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}
function hideMainWindow() {
  if(mainWindow.isVisible()) mainWindow.hide();
  if(!mainWindow.isMinimized()) mainWindow.minimize();
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/* FUNCTIONS */

/* Lock Workstation */
let lockPC = () => {
  // win
  if(h.platformIs('windows')) {
    const command = "rundll32.exe user32.dll, LockWorkStation";
    const commandBackup = __state.basePath + "/app/assets/bin/w.exe quiet lock";
    return require('child_process').exec(command);
  }
  // mac
  else if (h.platformIs('mac')) {
    sendToRenderer('stop'); // lock the timer/pc until we have powerMonitor working for this OS
    const command = "/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend";
    return require('child_process').exec(command);
  }
  // linux
  else if (h.platformIs('linux')) {
    sendToRenderer('stop'); // lock the timer/pc until we have powerMonitor working for this OS
    const command = "gnome-screensaver-command -l";
    return require('child_process').exec(command);
  }
}

/* Restart the app */
let restartApp = () => {
  const exec = require('child_process').exec;
  exec(process.argv.join(' ')); /* Execute the command that was used to run the app*/
  app.exit(0);
}



/* ================ INSTALL SEQUENCE ================ */

function handleSquirrelEvent() {

  if ( !h.platformIs('windows') || process.argv.length === 1) {
    return false;
  }

  /*
  const appFolder = path.resolve(process.execPath, '..');
  const rootFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join( rootFolder, 'Update.exe') );
  const exeName = path.basename(process.execPath);
  var cp = require('child_process');
  var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  var target = path.basename(process.execPath);
  var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
  child.on('close', function(code) {
    app.quit();
  });
  */

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // Add your .exe to the PATH | Write to the registry for things like file associations and explorer context menus
      squirrelInstallerTasks('install');
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and --squirrel-updated handlers
      // Remove desktop and start menu shortcuts
      squirrelInstallerTasks('uninstall');
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before we update to the new version
      // It's the opposite of --squirrel-updated
      app.quit();
      return true;
  }
}



function squirrelInstallerTasks(action='install') {

  const updateExe = "Update.exe";

  const ChildProcess = require('child_process');

  const appFolder = path.resolve(process.execPath, '..');
  const rootFolder = path.resolve(appFolder, '..');
  const updateExePath = path.resolve(path.join(rootFolder, updateExe));
  const target = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess;
    try {
      spawnedProcess = ChildProcess.spawn( command, args, {detached: true} );
    } catch (error) { }
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

  setTimeout(() => { app.quit() }, 1000);

}

/* =============== / INSTALL SEQUENCE =============== */



/* =============== AUTO UPDATER =============== */

const { dialog } = require('electron');
const autoUpdater = require('electron').autoUpdater;
let updateCheckedOnce = false;

function checkForUpdates() {

  let updateUrl = config.urlAppUpdates || __state.urlFallback;
  let appendQS = 'platform=' + process.platform + '&v=' + config.version;
  updateUrl += updateUrl.includes('?')?'&'+appendQS:'?'+appendQS;
  shell.openExternal(updateUrl);
  return true;

  /* Electron AutoUpdater code sample below: Use if needed */
  /* Follow DOC: https://www.electronjs.org/docs/api/auto-updater */

  if(updateCheckedOnce) return;

  /* For Windows, PATH to DIRECTORY that has nupkg and RELEASES files (Windows alone) */
  /* add "Options Indexes" to htaccess if you want listing on that dir */
  //let releaseDIR = config.RESTendpointAppUpdates + '/releases/' + process.platform;

  /* process.platform is one of: 'aix' | 'android' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32' | 'cygwin' | 'netbsd' */
  /* we need win32, linux, darwin */
  let releasesRemoteDirectory = config.RESTendpointAppUpdates + '/releases/?platform=' + process.platform;

  autoUpdater.setFeedURL({ url: releasesRemoteDirectory });

  autoUpdater
      .on('error', function(e) {
        //loggit(e);
        return dialog.showMessageBox(mainWindow, {
          type: 'info',
          icon: h.getImage(__state.appIcoPath),
          buttons: ['Dang!'],
          title: config.name + ": Update Error",
          message: "Something's not right out there. Please try again later.",
          detail: "Umm... \nIt's not you, it's the server"
        });
      })
      .on('checking-for-update', function(e) {
        //loggit('Checking for update at ' + releaseDIR);
      })
      .on('update-available', function(e) {

        var downloadConfirmation = dialog.showMessageBox(mainWindow, {
          type: 'info',
          icon: h.getImage(__state.appIcoPath),
          buttons: ['Proceed'],
          title: config.name + ": Update Available",
          message: 'An update is available. The update will be downloaded in the background. \n\n - Minor Bug fixes \n - UI improvements',
          detail: "Size: ~42 MB"
        });

        //loggit('Downloading update');

        if (downloadConfirmation === 0) {
          return false;
        }

      })
      .on('update-not-available', function(e) {
        //loggit('Update not available');
        return dialog.showMessageBox(mainWindow, {
          type: 'info',
          icon: h.getImage(__state.appIcoPath),
          buttons: ['Cool'],
          title: config.name + ": No update available",
          message: "It seems you're running the latest and greatest version",
          detail: "Woot, woot! \nTalk about being tech-savvy"
        });
      })
      .on('update-downloaded',  function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {

        var index = dialog.showMessageBox(mainWindow, {
          type: 'info',
          icon: h.getImage(__state.appIcoPath),
          buttons: ['Install Update','Later'],
          title: config.name + ": Latest version downloaded",
          message: 'Please restart the app to apply the update',
          detail: releaseName + "\n\n" + releaseNotes
        });

        if (index === 1) return;

        force_quit = true;
        autoUpdater.quitAndInstall();
      });

  autoUpdater.checkForUpdates();

  updateCheckedOnce = true;

  // "Checking for updates: " + releaseDIR + " Install Path: " + appPath;
}

/* =============== / AUTO UPDATER =============== */




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
