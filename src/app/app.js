"use strict";
/**
 * Created by Deepak Thomas
 * Mod 0 on 3/23/2016 @ 6:56pm (creation)
 * Mod1 on 07/07/2016 @ 3:30pm | Mod2 on 08/07/2016 @ 10:00am (enhancements; bug fixes)
 * Mod3 on 10/09/2019 @ 3:00pm (enhancements: pause/reset)
 * Mod4 on 12/07/2020 @ 4:00pm (Upgrade to Electron 9; Config; Security enhancements)
 * Mod5 on 24/07/2020 @ 11:00am
 */

/* Begin scoping function*/
////(function() {

let config = require('./../config.json');
const h = require('./../helpers.js');

/* Audio Elements */
let audioClick = document.createElement('audio');
audioClick.setAttribute('src', config.audio.click);
let audioBreakStart = document.createElement('audio');
audioBreakStart.setAttribute('src', config.audio.breakStart);
let audioBreakEnd = document.createElement('audio');
audioBreakEnd.setAttribute('src', config.audio.breakEnd);

function removeJSorCSS(filename, filetype) {
    /* SRC: http://www.javascriptkit.com/javatutors/loadjavascriptcss2.shtml */
    let targetEl=(filetype=="js")? "script" : (filetype=="css")? "link" : "none";
    let targetAttr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none";
    let allTagEl=document.getElementsByTagName(targetEl);
    for (let i=allTagEl.length; i>=0; i--){
        if (allTagEl[i] && allTagEl[i].getAttribute(targetAttr)!=null && allTagEl[i].getAttribute(targetAttr).indexOf(filename)!=-1)
        {
            allTagEl[i].parentNode.removeChild(allTagEl[i]);
        }
    }
}

/* SPLASH ANIMATION */
$(document).ready( function() {
    let splashDelay = 4200;
    let elIntro = $("#intro");
    /* First timer OR splash-screen enabled => show splash */
    if( (parseInt(localStorage.opt_splash)>=1) || (parseInt(localStorage.timesOpened)<=1) ) {
        elIntro.css('display','flex').fadeIn(500).delay(splashDelay-1000).fadeOut(500);
    }
    activityAnimation(1000);
    /* Auto-remove #intro from DOM and offload unnecessary JS */
    setTimeout(function() {
        removeJSorCSS("assets/js/splash.anim.js", "js");
        $("#script-splash-anim").empty().attr('src','').remove();
        elIntro.remove();
        console.log("Intro element destroyed");
        return true;
    },splashDelay + 1000);
    elIntro.click( function() {
        elIntro.fadeOut(500);
    });
});

/* TABS */
$(document).on('click', '.isTab, .isTabHT', function () {
    let target = $(this).attr('aria-controls');
    let appender = $(this).attr('data-append')?$(this).attr('data-append'):'';
    if(!$(this).is(".isActive")) {
        /* Hide/show corresponding tabs */
        $('.isHideable' + appender).hide();
        $("#" + target).fadeIn(200).addClass('ani-fx');
        $('.isTab' + appender).removeClass('isActive').attr("aria-selected", "false");
        $(this).attr('aria-selected', "true").addClass('isActive');
        /* Sound? */
        if( (audioClick) && (parseInt(localStorage.opt_sounds)) ) audioClick.play();
    }
});


/* https://www.npmjs.com/package/node-notifier * /
const path = require('path');
const notifier = require('node-notifier');
notifier.notify({
    title: 'Upcoming Short Break',
    subtitle: 'in 5 minutes',
    message: 'Hello from node, Mr. User!',
    icon: path.join(__dirname, '/assets/c.128.png'), // Absolute path (doesn't work on balloons)
    sounds: true,  ///Only Notification Center or Windows Toasters
    wait: true, ////Wait with callback, until user action is taken against notification
    contentImage: path.join(__dirname, 'assets/fg.png'), // Absolute Path to Attached Image (Content Image)
    open: void 0 // URL to open on Click
}, function (err, response) {
    // Response is response from notification
});

notifier.on('click', function (notifierObject, options) {
    // Triggers if `wait: true` and user clicks notification
    alert('aa');
});

notifier.on('timeout', function (notifierObject, options) {
    // Triggers if `wait: true` and notification closes
});

/* */

const { BrowserWindow } = require('electron').remote;
const { shell, nativeImage } = require('electron');
const electron = require('electron');
const remote = electron.remote;
const thisWindow = remote.getCurrentWindow();


function minimizeWindow() {
    thisWindow.minimize();
}
function closeWindow() {
    thisWindow.close();
}

/* Statuses */
const statusIs = {
    PAUSED_BY_SYSTEM: -1,
    PAUSED: 0,
    RUNNING: 1,
};
Object.freeze(statusIs);

let __state = {
    developerMode: !electron.remote.app.isPackaged,
    status: statusIs.RUNNING,
    basePath: __dirname,
    appIcoPath: h.getPathTo(config.icons.find(i => i.id==='app').asset),
};


function autorunOSstart(shouldLaunch) {
    let AutoLaunch = require('auto-launch');
    let appLauncher = new AutoLaunch({
        name: remote.app.getName(),
        isHidden: true
    });
    if(shouldLaunch) {
        appLauncher.enable();
        console.log("AutoLaunch Enabled");
    } else {
        appLauncher.disable();
        console.log("AutoLaunch Disabled");
    }
}

/* TOASTER * /
let msg = {
    title : "Awesome!",
    message : "Check this out!<br>Check this out!<br>Check this out!<br>Check this out!<br>Check this out!<br>Check this out!<br>",
    detail : "PI is equal to 3! - 0.0<br>PI is equal to 3! - 0.0<br>PI is equal to 3! - 0.0<br>PI is equal to 3! - 0.0<br>",
    width : 440,
    // height : 160, window will be autosized
    timeout : 6000,
    focus: true // set focus back to main window
};
ipc.send('electron-toaster-message', msg);
/* */


/* All scoped variables */

let seconds = 1000; /* ms */
let minutes = (60*seconds); /* ms */

let nextShortBreakTimeString = '';
let longBreakEvery = null;
let shortBreakEvery = null;
let breakModalWindow = null;

let totalLongBreaks = 0;
let totalShortBreaks = 0;
let nextLongBreakAt = null;
let nextShortBreakAt = null;
let noOfShortBreaks = 0;
let secondsPassed = 0;
let shortBreaksElapsed = 0;

let longBreak = null; /* Variable for the longBreak hook */

function GC() {

    nextShortBreakTimeString = '';
    longBreakEvery = null;
    shortBreakEvery = null;
    breakModalWindow = null;

    /* totalLongBreaks = 0; */
    /* totalShortBreaks = 0; */
    nextLongBreakAt = null;
    nextShortBreakAt = null;
    noOfShortBreaks = 0;
    secondsPassed = 0;
    shortBreaksElapsed = 0;

    longBreak = null;
    longBreak = () => {};

    /* (Re)Create DOM */
    reincarnate("nextShortBreakIn");
    reincarnate("nextLongBreakIn");

}

const isset = (variable) => {
    try { return typeof eval(variable) !== 'undefined'; }
    catch (err) { return false; }
};

function initAppSetDefaults() {

    let defaultSettings = {
        /* App Setting Defaults */
        firstTouch: new Date(Date.now()),
        longBreakInterval: 60 * minutes,
        shortBreakInterval: 20 * minutes,
        shortBreakDuration: 20 * seconds,
        timesOpened: 0,
        breakOngoing: 0,
        skippedLastBreak: 0,
        mode: 'monk',
        breakType: 'short',
        shortBreakType: 'all',
        count_skipped: 0,
        count_shortBreaks: 0,
        count_longBreaks: 0,
        /* Options */
        opt_lockPC: 0, // lock PC after a long break?
        opt_alwaysOnTop: 1, // break-screen should be always on top of all windows?
        opt_sounds: 1, // click and start-break sounds?
        opt_splash: 1, // continue to show splash screen animation after first-run?
        opt_autoStart: 1, // autostart with OS?
        opt_startMinimized: 1, // automatically minimize to tray after first-run?
        opt_allowSkips: 1,
        /* License */
        uLicense: "Register for free at http://think.dj/refreshie",
        uEmail: "Register for free at http://think.dj/refreshie",
    }

    /* DEV Vars*/
    let devModeForTesting = false; /* Set true for clearing cache / Debug Mode */
    if(devModeForTesting) {
        localStorage.clear();
        localStorage.longBreakInterval  = 60 * seconds;
        localStorage.shortBreakInterval = 20 * seconds;
        localStorage.shortBreakDuration =  2 * seconds;
    }

    /* Set config persistent if no value is set [DEFAULTS] */
    for (const [key, value] of Object.entries(defaultSettings)) {
        if(!localStorage[key] && !isset(localStorage[key])) {
            localStorage[key] = value;
        }
    }

}

/* Init on APP start */
initAppSetDefaults();


function notifire() {
    return shell.openExternal(config.UrlContact);
}


function openURL(url) {
    return shell.openExternal(url);
    /* https://github.com/electron/electron/issues/1344
    * Ended up using child_process.execSync('start http://example.com') on Win32 and child_process.execSync('open http://example.com') on Darwin so the browser actually pops up and gets focus.
    * On Linux, you can use xdg-open: child_process.execSync('xdg-open http://example.com')
    */
}

function kFormatter(num) {
    return num > 999 ? (num/1000).toFixed(1) + ' k' : num;
}


function setStats() {
    /* Init Stats UI */
    let count_longBreaks = parseInt(localStorage.count_longBreaks);
    $("#meta_hoursSaved_times").text(count_longBreaks);
    /* Show `Thumbs-up Badge` after user has completed at-least one long break */
    if(count_longBreaks) {
        $("#stats").removeClass('virgo');
        if(count_longBreaks>=42) $("#stats").addClass('star');
        $("#meta_welcome").hide();
        $("#meta_hoursSaved").show();
        $("#meta_hoursSaved_hours").html(h.simplePluralize('hour', count_longBreaks));
    }
    /* Show Congratulations `Newbie badge` */
    else {
        $("#stats").addClass('virgo');
        $("#meta_hoursSaved").hide();
        $("#meta_welcome").show();
    }

    /* Set Statistics */
    $("#count_shortBreaks").text(kFormatter(localStorage.count_shortBreaks));
    $("#count_longBreaks").text(kFormatter(localStorage.count_longBreaks));
    $("#count_opened").text(h.simplePluralize('time', localStorage.timesOpened, true));

    let skippedText = parseInt(localStorage.count_skipped);
    if(!skippedText) skippedText = "none of the";
    else skippedText = skippedText + " of ";
    $("#count_skipped").text(skippedText);

    $("#firstTouch").text(localStorage.firstTouch);

    let totalBreaks = parseInt(localStorage.count_shortBreaks) + parseInt(localStorage.count_longBreaks);
    let percSkips = Math.round( parseInt(localStorage.count_skipped)/( totalBreaks )*100 ) || 0;
    let percSkipsText;

    let skipPercAllowed = 15;

    let el = $("#percSkips");
    switch(true) {
        case (!percSkips):
            percSkipsText = "Don't break the streak!";
            el.removeClass('red').addClass('green');
            break;
        case (percSkips<skipPercAllowed):
            percSkipsText = "Impressive!";
            el.removeClass('red').addClass('green');
            break;
        case ( (percSkips>=skipPercAllowed) && (percSkips<99) ):
            el.removeClass('green').addClass('red');
            percSkipsText = "You need to skip skipping breaks, skipper";
            break;
        case ((percSkips>98) && (percSkips<101)):
            el.removeClass('green').addClass('red');
            percSkipsText = "Why?";
            break;
        case (percSkips>100):
            el.removeClass('green').addClass('red');
            percSkipsText = "U EVEN HUMAN?";
            break;
    }
    el.text("That's a " + percSkips + "% skip-rate. " + percSkipsText);
    if(!totalBreaks) totalBreaks = '';
    $("#count_totalBreaks").text(totalBreaks);
}

function reverse(s){ return s.split("").reverse().join("") }

/* License - deprecated/discontinued */
const licenseLength = 16;
function validateLicense(email,serial) {
    let encEmail = reverse(btoa((email.trim())+"think.dj")).substring(0, licenseLength);
    return serial === encEmail;
}
function checkLicense() {
    if( (licenseLength===localStorage.uLicense.length) && (validateLicense(localStorage.uEmail, localStorage.uLicense)) ) {
        console.log("App is Registered");
        return true;
    }
    else {
        console.log("App unregistered. Register at http://think.dj/refreshie");
        return false;
    }
}
////checkLicense();


/* First time? */
if(!parseInt(localStorage.timesOpened)) {
    console.log("Looks like you are a first timer :)");
    autorunOSstart(1);
}
else {
    /* If not a Refreshie `noob`, honor his choice of app start, we must */
    (1===parseInt(localStorage.opt_startMinimized)) ?
        minimizeWindow():
        () => {};
}
localStorage.timesOpened = parseInt(localStorage.timesOpened)+1;

/*
* LocalStorage Info
* Web storage can be viewed simplistically as an improvement on cookies, providing much greater storage capacity
* 10 MB per origin in Google Chrome, 5 MB Mozilla Firefox, and Opera;
* 10 MB per storage area in Internet Explorer;
*/
function fract(n){ return Number(String(n).split('.')[1] || 0); }
function localStoreTest() {
    localStorage.uuid = fract(Math.random());
    console.log('localStorage=');console.log(localStorage);
}

/*
* NOTE: BreakScreenDuration must always be lesser than BreakInterval
*
*  NEW LOGIC
* ==========================================
*  Implemented on 09-Jul-2016 @ 8:00pm
*  Has one core timer that is for LongBreak
*  Mode(%) of shortBreak is checked in the timer to display short breaks
*
*/

function GUID(length=8) {
    let i, j, result = '';
    for(j=0; j<length; j++) {
        if( j === 8 || j === 12|| j === 16|| j === 20) result = result + '-';
        i = Math.floor(Math.random()*16).toString(16).toUpperCase();
        result = result + i;
    }
    return result;
}

function humanizeTime(time) {
    time = (time/minutes);
    let unit = " minutes";
    if(time<1) {
        time = time*60;
        unit = " seconds";
    }
    return time + unit;
}


function reincarnate(id) {

    /* `Reincarnate` destroys a selector and then recreates it */
    /* Added because of this bug: https://github.com/hilios/jQuery.countdown/issues/215#issuecomment-238989295 */

    let $selector = "#" + id;

    /* Remove all event handlers */
    $($selector).off();
    let elem = document.getElementById($selector);
    if(elem) elem.replaceWith(elem.cloneNode(true));

    /* Delete node */
    if(($($selector).length)) {
        $($selector).remove();
    }

    /* Re-create by appending */
    if(!($($selector).length))
        $selector = $('<span id="'+id+'"><span class="blink182">_:_</span></span>').appendTo( $( $selector + 'Injectable' ) );

    $selector.hide(0).fadeIn(1250);

}

/* Define state and text */
let $state = statusIs.RUNNING;
let $stateText = [ "Restart", "Stop" ]; /* "Paused", "Running" */

$("#button-action").text($stateText[statusIs.RUNNING]);

function timer_set_state_ui(state = 1) {
    $("#button-action").text($stateText[state]);
    console.log("Set UI to "+$stateText[state]);
    /* Yellow Border for timer */
    let el = $(".dataBlock .time");
    switch (state) {
        case statusIs.RUNNING:
            el.removeClass("paused");
            break;
        case statusIs.PAUSED:
        default:
            el.addClass("paused");
            break;
    }
}

let startAt = Date.now();
let pausedAt = 0;
let pausedFor = 0;

function timers(action = "toggle") { /* action: 'start' | 'stop' | 'restart' | 'toggle' */
    let prefix = 'timer-';
    switch(action) {
        case "restart":
            $state = 1;
            restart_longBreak();
            /* Ask mainProcess to change tray icon */
            ipcRenderer.send('synchronous-messages', prefix+"restart");
            break;
        default:
        case "toggle":
            $state = 1 - $state;
            timer_set_state_ui($state);
            if(!$state) {
                /* From Running TO Paused */
                pausedAt = Date.now();
                pausedFor = 0;
            }
            else {
                /* From Paused TO RESUME */
                console.log('Restarting time');
                pausedFor = Math.ceil( (Date.now() - pausedAt) / 1000 );
                pausedAt = 0;
                console.log("Paused for ", pausedFor);

                /* OVERRIDE till FIX @todo */
                return timers("restart");
            }

            $('#nextLongBreakIn').countdown("toggle");
            $("#nextShortBreakIn").countdown("toggle");
            /* Ask mainProcess to change tray icon */
            ipcRenderer.send('synchronous-messages', prefix+action);
            break;
    }
    return true;
}

function updateCountdownDOM(element,mins,secs) {
    let newHtml = '';
    (mins<1)?
        newHtml = secs + ' s':
        newHtml = mins + ' m';
    /* Redraw iff required */
    if(element.html()!==newHtml) {
        element.html(newHtml);
    }
}


function setupShortBreak( nextShortBreakAt, finalShortBreak = false ) {

    nextShortBreakTimeString =
        nextShortBreakAt.toLocaleTimeString()
        .replace(/:\d+ /, ' ').toLowerCase(); /* Take off seconds */

    $("#nextShortBreakAt").html(nextShortBreakTimeString);
    /*$('#nextShortBreakIn').countdown('stop');*/

    let nextShortBreakInSelector = $("#nextShortBreakIn");
    let nextLongBreakInSelector = $("#nextLongBreakIn");

    nextShortBreakInSelector.countdown(nextShortBreakAt, function (event) {
        let mm = parseInt(event.strftime('%M'));
        let ss = parseInt(event.strftime('%S'));
        updateCountdownDOM(nextShortBreakInSelector, mm, ss);
    })
    .on('finish.countdown', function(event) {
        nextShortBreakInSelector.countdown('remove');
        reincarnate("nextShortBreakIn");
    });

    /* Decide color */
    if(finalShortBreak) {
        /* If it's the last short break, focus long break with block highlight */
        nextLongBreakInSelector.closest(".time").css('border-color', 'var(--color-status-good)').toggleClass("active");
        nextShortBreakInSelector.closest(".time").css('border-color', 'var(--color-status-default)');
    }
    else {
        /* Next = a short break */
        nextLongBreakInSelector.closest(".time").css('border-color', 'var(--color-status-default)');
        nextShortBreakInSelector.closest(".time").css('border-color', 'var(--color-status-good)').toggleClass("active");
    }

}

function setupLongBreak(nextLongBreakAt) {
    let longBreakEvery = parseInt(localStorage.longBreakInterval) || (60 * minutes);
    let nextLongBreakTimeString = new Date(startAt + longBreakEvery);
    nextLongBreakTimeString = nextLongBreakTimeString.toLocaleTimeString().replace(/:\d+ /, ' ').toLowerCase(); /* replace takes off seconds */
    $("#nextLongBreakAt").html(nextLongBreakTimeString);
}

function initMainTimer() {

    GC();
    initAppSetDefaults();
    setStats();

    let uniqueID = GUID(6);
    let nextLongBreakInSelector = $('#nextLongBreakIn');

    console.log("=== " + uniqueID + " [BREAK TIMER ID] ===");
    console.log("// longBreaks so far:", totalLongBreaks);
    console.log("// shortBreaks so far:", totalShortBreaks);

    longBreakEvery = parseInt(localStorage.longBreakInterval) || (60 * minutes);
    shortBreakEvery = parseInt(localStorage.shortBreakInterval) || (20 * minutes);

    startAt = Date.now();
    nextLongBreakAt = new Date(startAt + longBreakEvery);
    setupLongBreak(nextLongBreakAt);

    nextShortBreakAt = new Date(startAt + shortBreakEvery);
    setupShortBreak(nextShortBreakAt);

    /* Calculate number of short breaks */
    noOfShortBreaks = (Math.floor(longBreakEvery / shortBreakEvery)) - 1;
    noOfShortBreaks < 0 ? noOfShortBreaks = 0 : null;

    /* * /
     console.log("Short Break Screentime " + humanizeTime(parseInt(localStorage.shortBreakDuration)));
     console.log("Short break every "+ humanizeTime(shortBreakEvery));
     console.log("Long break every "+ humanizeTime(longBreakEvery));
     console.log("" + noOfShortBreaks + " short breaks and 1 long break");
     /* */

    $("#breakInfo").html("" + noOfShortBreaks + " short " + h.simplePluralize('break', noOfShortBreaks) + " and 1 long break per hour");

    nextLongBreakInSelector.countdown(nextLongBreakAt, function (e) {
        let mm = parseInt(e.strftime('%M'));
        let ss = parseInt(e.strftime('%S'));
        updateCountdownDOM(nextLongBreakInSelector, mm, ss);
    })
        .on('update.countdown', function (e) {

        secondsPassed = secondsPassed + 1;

        // console.log(secondsPassed); // log every second passed?

        /* Find multiples of short breaks */
        if ( ( (secondsPassed * 1000) % (shortBreakEvery) ) === 0 ) {
            /* check with `localStorage.shortBreakInterval` as it might get updated from Settings in realtime => REMOVED for performance reasons */

            shortBreaksElapsed = shortBreaksElapsed + 1;

            if (shortBreaksElapsed > noOfShortBreaks) {
                /* Dont show short breaks */
                console.log("No more short breaks for this session " + uniqueID);
            }
            else {
                let now = Date.now();
                if (shortBreaksElapsed === noOfShortBreaks) {
                    /* Last short break for an hour */
                    /* So, next short break is after the long break */
                    nextShortBreakAt = new Date(now + (shortBreakEvery * 2));
                    /* Make UI update : It's the last */
                    setTimeout( () => { setupShortBreak(nextShortBreakAt, true); }, localStorage.shortBreakDuration);
                }
                else {
                    /* More short breaks pending */
                    nextShortBreakAt = new Date(now + shortBreakEvery);
                    /* Make UI update for next Short Break */
                    setTimeout( () => { setupShortBreak(nextShortBreakAt, false); }, localStorage.shortBreakDuration);
                }

                localStorage.breakType = "short";
                startBreak(localStorage.breakType);
                totalShortBreaks++;
                console.log(`Break ${uniqueID}: SHORT #${shortBreaksElapsed} @ ${secondsPassed}`);
            }

        }
    })
        .on('finish.countdown', function (e) {

        nextLongBreakInSelector.countdown('remove');
        reincarnate("nextLongBreakIn");

        secondsPassed++;
        totalLongBreaks++;

        /* Long break */
        localStorage.breakType = "long";
        startBreak(localStorage.breakType);
        console.log(`Break ${uniqueID}: LONG #${totalLongBreaks} @ ${secondsPassed}`);
        if (e.elapsed) {
            /* Restart */
            setTimeout( () => {initMainTimer() }, parseInt(localStorage.shortBreakDuration) + 1 );
        }
        else { console.log("WTF?"); }

        return true;
    });

    return true;
}

longBreak = initMainTimer();

function restart_longBreak() {
    timer_set_state_ui(1);
    $(".time").removeClass("active").removeClass("paused");
    longBreak = () => {};
    longBreak = initMainTimer();
}

let breakCleanup = () => {
    console.log("breakCleanup()");
    breakModalWindow = null;
    if(parseInt(localStorage.breakOngoing)) {
        localStorage.breakOngoing = 0;
        if( (audioBreakEnd) && (parseInt(localStorage.opt_sounds)) ) audioBreakEnd.play();
        switch(localStorage.breakType) {
            case "long":
                /* Lock PC? */
                if ( parseInt(localStorage.opt_lockPC) && (!parseInt(localStorage.skippedLastBreak)) ) {
                    ipcRenderer.send('synchronous-messages', 'lockPC');
                }
                /* Restart Long Break */
                restart_longBreak();
                break;
            case "short":
                break;
            case "demo":
            default:
                break;
        }
    }
    return true;
}

function startBreak(type = "short", forcedMode = '') {

    console.log('startBreak: ', {"type": type, "forcedMode": forcedMode} );

    /* Init vars with defaults */
    let optFullScreen = true;
    let optWidth = window.screen.availWidth;
    let optHeight = window.screen.availHeight;

    switch (type) {
        case "demo":
            break;
        case "long":
            localStorage.count_longBreaks = parseInt(localStorage.count_longBreaks) + 1;
            break;
        case "short":
        default:
            localStorage.count_shortBreaks = parseInt(localStorage.count_shortBreaks) + 1
            break;
    }

    if( (forcedMode && "monk" === forcedMode) || (!forcedMode && "monk" === localStorage.mode) ) {
        optFullScreen = false;
        optWidth = 660;
        optHeight = 460;
    }

    /* Set localstorage */
    localStorage.breakOngoing = 1;
    localStorage.breakType!==type? localStorage.breakType=type : null;
    localStorage.isFullscreen = optFullScreen;

    if( (audioBreakStart) && (parseInt(localStorage.opt_sounds)) ) audioBreakStart.play();

    /* Create break Window */
    breakModalWindow = new BrowserWindow({
        title: remote.app.getName() + " break",
        icon: h.getImage(__state.appIcoPath),
        width: optWidth,
        height: optHeight,
        fullscreen: optFullScreen,
        show: true,
        center: true,
        movable: false,
        useContentSize: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        skipTaskbar: true,
        closable: true,
        titleBarStyle: "hidden",
        alwaysOnTop: !!(parseInt(localStorage.opt_alwaysOnTop)),
        backgroundColor: 'transparent',
        transparent: false,
        frame: false,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: true, // false: default value from Electron v5+
            enableRemoteModule: true,
        }
    });

    /* Subscribe to events */
    breakModalWindow.on('closed', () => { breakCleanup() } );
    breakModalWindow.on('hide', () => { breakCleanup() } );
    breakModalWindow.on('unresponsive', () => { breakCleanup() } );

    /* Load contents */
    breakModalWindow.loadFile(h.getPathTo('/app/break.html')).then( res => {} );

    if(__state.developerMode && config.developerMode) breakModalWindow.webContents.openDevTools({ mode: "detach" } );
    if(parseInt(localStorage.opt_alwaysOnTop)) {
        /* If AlwaysOnTop is always giving a blank screen for first run, uncomment below line */
        // makeAlwaysOnTop = setTimeout( () => breakModalWindow.setAlwaysOnTop(true), 500);
    }


}

/* Handle change in options */
$(function() {

    $("#shortIntervalDD").val(localStorage.shortBreakInterval/minutes);
    $("#shortBreakDuration").val(localStorage.shortBreakDuration/1000);
    $("#shortBreakType").val(localStorage.shortBreakType);

    /* Changes */
    $('input[name=mode]').on('change', function() {
        localStorage.mode = $(this).val();
    });
    $("#shortIntervalDD").change(function() {
        activityAnimation();
        let $newShortInterval = $('option:selected', this).val();
        let shortBreakInterval = parseFloat($newShortInterval)*minutes;
        localStorage.shortBreakInterval = shortBreakInterval;
        initMainTimer();
    });
    $("#shortBreakDuration").change(function() {
        activityAnimation();
        let $shortBreakDuration = $('option:selected', this).val();
        let shortBreakDuration = parseFloat($shortBreakDuration)*1000;
        localStorage.shortBreakDuration = shortBreakDuration;
        initMainTimer();
    });
    $("#shortBreakType").change(function() {
        activityAnimation();
        let $shortBreakType = $('option:selected', this).val();
        localStorage.shortBreakType = $shortBreakType;
    });
});

function activityAnimation($timeMS) {
    $timeMS = parseInt($timeMS) || 300;
    $("#loadingIndicator").stop().fadeIn($timeMS).delay($timeMS).fadeOut($timeMS);
}


////})();
/* // End scoping function */



/*!
 * Author: Yakir Sitbon.
 * Project Url: https://github.com/KingYes/jquery-radio-image-select
 * Author Website: http://www.yakirs.net/
 * Version: 1.0.1
 **/
(function($) {
    // Register jQuery plugin.
    $.fn.radioImageSelect = function( options ) {
        // Default let for options.
        let defaults = {
                imgItemClass: 'radio-select-img-item',
                imgItemCheckedClass: 'item-checked',
                hideLabel: true
            },
            /**
             * Method firing when need to update classes.
             */
            syncClassChecked = function( img ) {
                let radioName = img.prev('input[type="radio"]').attr('name');

                $('input[name="' + radioName + '"]').each(function() {
                    // Define img by radio name.
                    let myImg = $(this).next('img');

                    // Add / Remove Checked class.
                    if ( $(this).prop('checked') ) {
                        myImg.addClass(options.imgItemCheckedClass);
                    } else {
                        myImg.removeClass(options.imgItemCheckedClass);
                    }
                });
            };

        // Parse args..
        options = $.extend( defaults, options );

        // Start jQuery loop on elements..
        return this.each(function() {
            $(this)
                // First all we are need to hide the radio input.
                .hide()
                // And add new img element by data-image source.
                .after('<img src="' + $(this).data('image') + '" alt="radio image" />');

            // Define the new img element.
            let img = $(this).next('img');
            // Add item class.
            img.addClass(options.imgItemClass);

            /* CUSTOM CODE: Select MODE onload; 14-aug-16 1:12pm */
            let theSelImg = $('input[name="mode"][value="' + localStorage.mode + '"]').next('img');
            theSelImg.addClass(options.imgItemCheckedClass);

            // Check if need to hide label connected.
            if ( options.hideLabel ) {
                $('label[for=' + $(this).attr('id') + ']').hide();
            }

            // Create click event on img element.
            img.on('click', function(e) {
                $(this)
                    // Prev to current radio input.
                    .prev('input[type="radio"]')
                    // Set checked attr.
                    .prop('checked', true)
                    // Run change event for radio element.
                    .trigger('change');

                // Firing the sync classes.
                syncClassChecked($(this));
                activityAnimation(150);
            } );
        });
    }
}) (jQuery);

jQuery(document).ready( function($) {

    /* SET radio button value from LocalStorage */
    /* Remove all checked */
    /* LEARNING: .attr() did not work on checked for radio. Changed to .prop() */
    $('input[name=mode]').prop('checked', false);
    /* Set localstore value */
    $('input[name="mode"][value="' + localStorage.mode + '"]').prop('checked', true).trigger('change');

    $('input.radioImageSelect').radioImageSelect();

    $(document).on('click', '#demo-monk', function () {
        localStorage.breakType = "demo";
        startBreak("demo","monk");
    });
    $(document).on('click', '#demo-sgt', function () {
        localStorage.breakType = "demo";
        startBreak("demo","sgt");
    });

    $(document).on('click', '#button-action', function () {
        timers("toggle");
    });
    $(document).on('click', '#button-action-restart', function () {
        timers("restart");
    });


} );


/* Rewrite HTML content from config */
jQuery(document).ready( function() {

    /* Branding */
    $(".app-title").html(config.name);
    $(".app-tagline").html(config.tagline)
    $(".app-version").html(config.version)

    /* There is some Refreshie-specific code related to code-licensing in Updates/Author-info tab */
    /* If this product is re-branded, hide this content */
    if( ! (config.name==="Refreshie" && config.author.toString().includes('thinkdj')) ) {
        $("#refreshie-stuff").hide();
    }

    /* Rewrite splash screen */
    $("#rw-splash-img").attr('src', config.splashScreen.imgMainLogo);
    $("#rw-splash-copyright").html(config.splashScreen.subText);

    /* Re-write Author Block / Company Info */
    $("#rw-co-name").html(config.companyInfo.name);
    $("#rw-co-img").attr('src', config.companyInfo.img);
    $("#rw-co-links").empty();
    config.companyInfo.links.forEach( link => {
        $("#rw-co-links").append(`<a href="${link.url}" target="_blank" rel="external" class="co-link" title="${link.title}">${link.name}</a>`);
    });
    $("#rw-co-description").html(config.companyInfo.description);

    /* Hooks */
    $(".action-minimize").click( () => minimizeWindow() );
    $(".action-notification").click( () => notifire() );
    $(".action-quit").click( () => quitIt() );
    $(".action-update").click( () => checkForUpdates() );
});




$(document).ready(function() {

    let $iCheckSelectors = "input.icheck";

    $($iCheckSelectors).iCheck({
        checkboxClass: 'icheckbox_square',
        radioClass: 'iradio_square',
        increaseArea: '20%'
    });

    /* Set Values */
    let $opts = ["opt_autoStart","opt_lockPC","opt_startMinimized","opt_sounds","opt_splash","opt_alwaysOnTop","opt_allowSkips"];
    $.each( $opts, function( key, value ) {
        let $selector = $("#"+value);
        if(0===$selector.length) return 0;
        if(1===parseInt(localStorage[value])) $selector.iCheck('check');
        else $selector.iCheck('uncheck');
    });

    $($iCheckSelectors).on('ifToggled', function(event){
        activityAnimation(160);
        let $what = event.target.id;

        if ($(this).is(":checked")){ localStorage[$what] = 1; }
        else { localStorage[$what] = 0; }

        switch($what) {
            case "opt_autoStart":
                autorunOSstart(parseInt(localStorage[$what]));
                break;
        }

    });

});

// In renderer process (web page).
const ipcRenderer = require('electron').ipcRenderer;

function checkForUpdates() {
    activityAnimation(1100);
    ipcRenderer.send('synchronous-messages', 'check-for-updates');
}

function quitIt() {
    return ipcRenderer.send('synchronous-messages', 'force-quit'); // sendSync
}

ipcRenderer.on('ipc-channel-main', function (event, args) {

    switch(args) {
        case 'restart':
        case 'toggle':
        case 'start':
        case 'stop':
            timers(args);
            break;
        case "capture-image":
            break;
        default:
            break;
    }
    console.log('rx', args);

});

/* Cache */
const cacheKey = '__cache_updates';
let ttlOld = localStorage.getItem(cacheKey + 'cachettl');
// HTTP cache refreshed with new data?
function HttpCacheRefreshed() {
    return !(ttlOld === localStorage.getItem(cacheKey + 'cachettl'));
}

$(document).ready(function() {

    updatesProcess('default.updates.json');

    let $webURL = isset(config.companyInfo.RESTendpointCompanyUpdates)?config.companyInfo.RESTendpointCompanyUpdates:'';
    if(!$webURL) return;

    const $updatesCached = true; /* Server calls needs to be cached? */
    const $updatesCachedTTL = 24*7; /* # of Hours; */

    $.ajax( $webURL, {
        localCache   : $updatesCached, /* Required. Either a boolean, in which case localStorage will be used, or an obj that implements the Storage interface */
        cacheTTL     : $updatesCachedTTL,
        cacheKey     : cacheKey,
        isCacheValid : true
    })
    .done( function(response) {
        updatesProcess(response);
    });

});


function updatesProcess(response) {

    // Set defaults in case Web fetch fails:
    let $updates = require('./../default.updates.json');

    let $updateSelector = $("#messageCenter");

    response = tryDecodeJSON(response);
    if(response) {
        $updates = response;
    }
    /* Inject updates into HTML */
    $updateSelector.empty();
    $.each($updates, function(index, item) {
        let linkString = (item.url)?
            `<span class="link"><a href="${item.url}" target="_blank">${item.urlTitle||item.url}</a></span>`:
            '';
        $updateSelector.append(`
            <li>
                <span class="title"><span class="icon icon-bells"></span> ${item.title||'title'}</span>
                <span class="date">${item.date||'date'}</span>
                <span class="desc">${item.body||'desc'}</span>
                ${linkString}
            </li>
            `);
    });

    /* Logic for showing update-highlighter */
    if( (parseInt(localStorage.timesOpened)<=3) || HttpCacheRefreshed() ) {
        $("#updatesCount").fadeIn(500); // Highlight? Display a `star` next to Updates menu item
        if(HttpCacheRefreshed()) $("#a-updates").click(); // New data? Focus on Updates Tab
    }
}

/* Check if server response is a valid JSON */
function tryDecodeJSON (res) {
    if(!res) return false;
    if(typeof res === 'string') {
        if(h.isJSON(res)) {
            let obj = JSON.parse(res);
            // Handle non-exception-throwing cases:
            // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking
            if (obj && typeof obj === "object") {
                return obj;
            }
        }
        // is string, but not JSON
        return false;
    }
    else if (typeof res === 'object') {
        // Already JSON object
        return res;
    }
    return false;
}
