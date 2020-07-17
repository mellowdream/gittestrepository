
// Modules to control application lifecycle (main process)

const { app, BrowserWindow, Menu, Tray, shell, ipcMain } = require('electron');
const path = require('path');

/* Read config JSON */
let config = require('./config.json');

/* Internal state/var */
let __state = {
  forceQuit: false,
  developerMode: !app.isPackaged,
  isTimerRunning: 1,
  basePath: __dirname,
  icoTray: getPathTo(config.icons.find(i => i.id==='tray').asset),
  icoTrayPaused: getPathTo(config.icons.find(i => i.id==='tray.paused').asset),
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
    icon: __state.icoTray,
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
    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)  {
      createMainWindow();
    }
  });

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Emitted when remote.require() is called in the renderer process of webContents
app.on('remote-require', function () {
  //event.preventDefault() // Prevents the module from being returned
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
  if(['win32','win64'].includes(process.platform)) {
    const command = "rundll32.exe user32.dll, LockWorkStation";
    const exec = require('child_process').exec(command);
  }
}
let restartApp = () => {
  const exec = require('child_process').exec;
  exec(process.argv.join(' ')); /* Execute the command that was used to run the app*/
  app.exit(0);
}



/* ================ INSTALL SEQUENCE ================ */

function handleSquirrelEvent() {
  if (process.platform !== 'win32' || process.argv.length === 1) {
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

  const spawn = function(command, args) {
    let spawnedProcess;
    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) { }
    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //  explorer context menus
      // Install desktop and start menu shortcuts
      //spawnUpdate(['--createShortcut', exeName]);
      //console.log("--squirrel-install or update. Shortcut + Quit");
      //setTimeout(() => app.quit(), 500);
      //app.quit();
      squirrelInstallTasks()
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers
      // Remove desktop and start menu shortcuts
      //spawnUpdate(['--removeShortcut', exeName]);
      //console.log("--squirrel-uninstall. Remove Shortcut + Quit");
      //setTimeout(() => app.quit(), 500);
      //app.quit();
      squirrelUninstallTasks();
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated
      console.log("--squirrel-obsolete. Quit");
      app.quit();
      return true;
  }
}

function squirrelInstallTasks() {
  let childProcess = require('child_process');
  let updateExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  let target = path.basename(process.execPath);
  let child = childProcess.spawn(updateExe, ["--shortcut-locations=Desktop,StartMenu --createShortcut", target], { detached: true });
  child.on('close', function(code) {
    app.quit();
  });

  /*
  let target = path.basename(process.execPath);
  let updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  let createShortcut = updateDotExe + ' --createShortcut=' + target + ' --shortcut-locations=Desktop,StartMenu' ;
  console.log (createShortcut);
  exec(createShortcut);
  app.quit();
  return true;*/
}

function squirrelUninstallTasks() {
  // Undo anything you did in the --squirrel-install and
  // --squirrel-updated handlers
  let childProcess = require('child_process');
  let updateExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  let target = path.basename(process.execPath);
  let child = childProcess.spawn(updateExe, ["--shortcut-locations=Desktop,StartMenu --createShortcut", target], { detached: true });
  child.on('close', function(code) {
    app.quit();
  });
/*
  let target = path.basename(process.execPath);
  let updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  let createShortcut = updateDotExe + ' --removeShortcut=' + target ;
  console.log (createShortcut);
  exec(createShortcut);
  app.quit();
  return true;*/
}


/* =============== / INSTALL SEQUENCE =============== */
