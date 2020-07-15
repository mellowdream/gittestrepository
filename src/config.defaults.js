

let browserWindowDefaults = {
    useContentSize: false,
    alwaysOnTop: false,
    center: true,
    movable: true,
    maximizable: false,
    minimizable: true,
    resizable: false,
    skipTaskbar: false,
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
}

let webContentsDefault = {
    nodeIntegration: true, // false: default value from Electron v5+
    nodeIntegrationInSubFrames: false, // false: default value from Electron v5+
    nodeIntegrationInWorker: false,
    contextIsolation: false, // true: protect against prototype pollution
    enableRemoteModule: true, // remote
    spellcheck: false,
    experimentalFeatures: false,
    allowRunningInsecureContent: false,
}
