/**
 * Created by Deepak Thomas
 * Mod 0 on 3/23/2016 @ 6:56pm (creation)
 * Mod1 on 07/07/2016 @ 3:30pm | Mod2 on 08/07/2016 @ 10:00am (enhancements; bug fixes)
 * Mod3 on 10/09/2019 @ 3:00pm (enhancements: pause)
 * Mod4 on 12/07/2020 @ 4:00pm (Upgrade to Electron 9; Config; Security enhancements)
 */

/* Begin scoping function*/
////(function() {

let config = require('./../config.json');
const path = require('path');

let basePath = window.getDirname();

/* Audio Elements */
let audioClick = document.createElement('audio');
audioClick.setAttribute('src', config.audioClickSound);
let audioStartBreak = document.createElement('audio');
audioStartBreak.setAttribute('src', config.audioBreakStart);


function removeJSorCSS(filename, filetype){
    /* SRC: http://www.javascriptkit.com/javatutors/loadjavascriptcss2.shtml */
    let targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none";
    let targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none";
    let allsuspects=document.getElementsByTagName(targetelement);
    for (let i=allsuspects.length; i>=0; i--){
        if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1)
        {
            allsuspects[i].parentNode.removeChild(allsuspects[i]);
        }
    }
}

$(document).ready( function() {
    let splashDelay = 4200;
    let elIntro = $("#intro");
    /* IF first time OR Splash is enabled, show splash */
    if( (parseInt(localStorage.opt_splash)>=1) || (parseInt(localStorage.timesOpened)<=1) ) {
        elIntro.css('display','flex').fadeIn(500).delay(splashDelay-1000).fadeOut(500);
    }
    activityAnimation(1000);
    /* Auto-remove #intro from DOM after 6 seconds and unload unnecessary JS */
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
$(document).on('click', '.isTab', function () {
    let target = $(this).attr('aria-controls');
    if(!$(this).is(".isActive")) {
        if( ("undefined"!==audioClick) && (parseInt(localStorage.opt_sounds)) ) audioClick.play();
        $('.isHideable').hide();
        $("#" + target).fadeIn(200);
        $('.isTab').removeClass('isActive').attr("aria-selected", "false");
        $(this).attr('aria-selected', "true").addClass('isActive');
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

const {BrowserWindow} = require('electron').remote;
const {shell} = require('electron');
const electron = require('electron');
const remote = electron.remote;


function minimizeWindow() {
    /* Returns the BrowserWindow object which this web page belongs to */
    remote.getCurrentWindow().hide();
}

let __state = {
     developerMode: !electron.remote.app.isPackaged,
};



function osAutorunAtStartup(launch) {
    let AutoLaunch = require('auto-launch');
    let appLauncher = new AutoLaunch({
        name: remote.app.getName(),
        isHidden: false
    });
    if(!launch) {
        appLauncher.disable();
        console.log("AutoLaunch Disabled");
    }
    else {
        appLauncher.enable();
        console.log("AutoLaunch Enabled");
    }
}

/*
    .then(function(enabled){
    console.log("Auto-start with OS is enabled");
    if(enabled) return;
    return appLauncher.enable();
}).then(function(err){
    console.log("Auto-start ERR:  " + err);
});

//appLauncher.disable();


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
let nextBreakAt = null;
let nextShortBreakAt = null;
let noOfShortBreaks = 0;
let secondsPassed = 0;
let shortBreaksElapsed = 0;

let longBreak = null; /* Variable for the longBreak hook */
/* PS: Spent two days on http://stackoverflow.com/questions/3015319/settimeout-cleartimeout-problems; 8-10 Aug 2016 */


function GC() {

    nextShortBreakTimeString = '';
    longBreakEvery = null;
    shortBreakEvery = null;
    breakModalWindow = null;

    /*totalLongBreaks = 0;*/
    /*totalShortBreaks = 0;*/
    nextBreakAt = null;
    nextShortBreakAt = null;
    noOfShortBreaks = 0;
    secondsPassed = 0;
    shortBreaksElapsed = 0;

    longBreak = null;
    longBreak = () => {};

    /* (Re)Create DOM */
    reincarnate("nextShortBreakIn");
    reincarnate("nextBreakIn");

}

function initAppSetDefaults() {

    let defaultSettings = {
        /* Defaults */
        firstTouch: new Date(Date.now()),
        longBreakInterval: 60 * minutes,
        shortBreakInterval: 20 * minutes,
        shortBreakDuration: 20 * seconds,
        timesOpened: 0,
        skippedCount: 0,
        breakOngoing: 0,
        breakType: 'short',
        mode: 'monk',
        count_shortBreaks: 0,
        count_longBreaks: 0,
        shortBreakType: "all",
        /* Options */
        opt_lockPC: 0,
        opt_alwaysOnTop: 1,
        opt_sounds: 1,
        opt_splash: 0,
        opt_autoStart: 1,
        opt_startMinimized: 1,
        opt_allowSkips: 1,
        /* License */
        uLicense: "Register for free at http://think.dj/refreshie",
        uEmail: "Register for free at http://think.dj/refreshie",
    }

    /* DEV Vars*/
    devModeForTesting = false; /* Set true for clearing cache / Debug Mode */
    if(devModeForTesting) {
        localStorage.clear();
        localStorage.longBreakInterval  = 60 * seconds;
        localStorage.shortBreakInterval = 20 * seconds;
        localStorage.shortBreakDuration =  2 * seconds;
    }

    /* Set config persistent [DEFAULTS] */
    for (const [key, value] of Object.entries(defaultSettings)) {
        if(!localStorage[key]) {
            localStorage[key] = value;
        }
    }

}

/* Init on APP start */
initAppSetDefaults();


function naughtyfication() {

    let notiFire = new Notification('Hello!', {
        body: "I'd love to hear from you. Requests, kudos, bugs, rants et al."
    });

    notiFire.onclick = function () {
        console.log('Notification clicked :o oooooo!');
    };

    shell.openExternal('mailto:shout@think.dj?subject=RE(freshie): ');
}


function OpenURL(url) {
    return shell.openExternal(url);
    /* https://github.com/electron/electron/issues/1344
    I ended up using child_process.execSync('start http://example.com') on Win32 and child_process.execSync('open http://example.com') on Darwin so the browser actually pops up and gets focus.
    * On Linux, you can use xdg-open: child_process.execSync('xdg-open http://example.com')
    */
}

function kFormatter(num) {
    return num > 999 ? (num/1000).toFixed(1) + ' k' : num;
}

function pluralize(value) {
    if(1===parseInt(value)) return "1 time";
    return value + " times";
}


function setStats() {

    /* Init UI */
    let count_longBreaks = parseInt(localStorage.count_longBreaks);
    $("#times").text(count_longBreaks);
    if(count_longBreaks) {
        $("#stats").removeClass('virgo');
        $("#meta_welcome").hide();
        $("#meta_hoursSaved").show();
        if(1===count_longBreaks) $("#plural").hide(); else $("#plural").show();
    }
    else {
        $("#stats").addClass('virgo');
        $("#meta_hoursSaved").hide();
        $("#meta_welcome").show();
    }

    /* Set Statistics */
    $("#count_shortBreaks").text(kFormatter(localStorage.count_shortBreaks));
    $("#count_longBreaks").text(kFormatter(localStorage.count_longBreaks));
    $("#count_opened").text(pluralize(localStorage.timesOpened));

    let skippedText = parseInt(localStorage.skippedCount);
    if(!skippedText) skippedText="none of the";
    else skippedText = skippedText + " of ";
    $("#count_skipped").text(skippedText);

    $("#firstTouch").text(localStorage.firstTouch);

    let totalBreaks = parseInt(localStorage.count_shortBreaks) + parseInt(localStorage.count_longBreaks);
    let percSkips = Math.round( parseInt(localStorage.skippedCount)/( totalBreaks )*100 ) || 0;
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
if (typeof String.prototype.trim != 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

/* License - deprecated/discontinued */
const licenseLength = 16;
function validateLicense(email,serial) {
    let encEmail = reverse(btoa((email.trim())+"think.dj")).substring(0, licenseLength);
    console.log(encEmail);
    if (serial===encEmail) {
        return true;
    }
    else {
        return false;
    }
}
function checkLicense() {
    if( (licenseLength==localStorage.uLicense.length) && (validateLicense(localStorage.uEmail, localStorage.uLicense)) ) {
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
    osAutorunAtStartup(1);
}
else {
    /* If Nnot a Refreshie `noob`, honor his choice of app start, we must */
    if(1===parseInt(localStorage.opt_startMinimized))
        minimizeWindow();
}
localStorage.timesOpened = parseInt(localStorage.timesOpened)+1;

/*
* LocalStorage Info
* Web storage can be viewed simplistically as an improvement on cookies, providing much greater storage capacity
* 10 MB per origin in Google Chrome, 5 MB Mozilla Firefox, and Opera;
* 10 MB per storage area in Internet Explorer;
*/
function fract(n){ return Number(String(n).split('.')[1] || 0); }
function localStore()
{
    localStorage.uuid = fract(Math.random());
    console.log('localStorage=');console.log(localStorage);
}

/*
* NOTE: BreakScreenDuration must always be lesser than BreakInterval
*/
/*
*
*  NEW LOGIC
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

    /* Reincarnate destroys a selector and recreates it */
    /* This was added because https://github.com/hilios/jQuery.countdown/issues/215#issuecomment-238989295 */

    let $selector = "#" + id;

    if(($($selector).length)) {
        ///$($selector).countdown('remove');
        $($selector).remove();
    }

    if(!($($selector).length))
        $selector = $('<span id="'+id+'">_:_</span>').appendTo($(($selector)+'Inject'));

    $selector.hide().fadeIn(1250);

}

/* Define state and text */
let $state = 1;
let $stateText = [ "Paused", "Running" ];

function timer_set_state_ui(state=1) {
    $("#button-action").text($stateText[state]);
    console.log("Set UI to "+$stateText[state]);
    /* Yellow Border for timer */
    let el = $(".dataBlock .time");
    switch (String($stateText[state]).toLowerCase()) {
        case "running":
            el.removeClass("paused");
            break;
        case "paused":
        default:
            el.addClass("paused");
            break;
    }
}

function timers(action="toggle") {
    let prefix = 'timer-';
    switch(action) {
        case "restart":
            $state = 1;
            restart_longBreak();
            /* Ask mainProcess to change tray icon */
            ipcRenderer.send('synchronous-messages', prefix+"restart");
            break;
        default:
            $state = 1 - $state;
            timer_set_state_ui($state);
            $('#nextBreakIn').countdown(action);
            $("#nextShortBreakIn").countdown(action);
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


function setShortBreakHTML(nextShortBreakAt, last=0) {

    nextShortBreakTimeString =
        nextShortBreakAt.toLocaleTimeString()
        .replace(/:\d+ /, ' ')
        .toLowerCase(); /* Take off seconds */

    $("#nextShortBreakAt").html(nextShortBreakTimeString);
    /*$('#nextShortBreakIn').countdown('stop');*/

    let nextShortBreakInSelector = $("#nextShortBreakIn");
    let nextBreakInSelector = $("#nextBreakIn");

    nextShortBreakInSelector.countdown(nextShortBreakAt, function (event) {
        mins = parseInt(event.strftime('%M'));
        secs = parseInt(event.strftime('%S'));
        updateCountdownDOM(nextShortBreakInSelector,mins,secs);
    })
    .on('finish.countdown', function(event) {
        reincarnate("nextShortBreakIn");
    });

    /* Decide color */
    if(last) {
        /* Next = Long Break */
        /* If it's the last short break, focus long break with block highlight */
        nextBreakInSelector.closest(".time").css('border-color', 'var(--color-status-good)').toggleClass("active");
        nextShortBreakInSelector.closest(".time").css('border-color', 'var(--color-status-default)');
    }
    else {
        /* Next = Short break */
        nextBreakInSelector.closest(".time").css('border-color', 'var(--color-status-default)');
        nextShortBreakInSelector.closest(".time").css('border-color', 'var(--color-status-good)').toggleClass("active");
    }

}


function setLongBreakHTML(nextLongBreakAt) {
    let longBreakEvery = parseInt(localStorage.longBreakInterval) || (60 * minutes);
    let nextLongBreakTimeString = new Date(Date.now() + longBreakEvery);
    nextLongBreakTimeString = nextLongBreakTimeString.toLocaleTimeString().replace(/:\d+ /, ' ').toLowerCase(); /* replace takes off seconds */
    $("#nextLongBreakAt").html(nextLongBreakTimeString);
}



function initMainTimer() {

    GC();
    initAppSetDefaults();
    setStats();

    let uniqueID = GUID(6);
    let nextBreakInSelector = $('#nextBreakIn');

    console.log("=== BREAK TIMER ID: " + uniqueID + " ===");
    console.log("//longBreaks so far:", totalLongBreaks);
    console.log("//shortBreaks so far:", totalShortBreaks);

    longBreakEvery = parseInt(localStorage.longBreakInterval) || (60 * minutes);
    shortBreakEvery = parseInt(localStorage.shortBreakInterval) || (20 * minutes);

    let now = Date.now();
    nextBreakAt = new Date(now + longBreakEvery);
    setLongBreakHTML(nextBreakAt);

    nextShortBreakAt = new Date(now + shortBreakEvery);
    setShortBreakHTML(nextShortBreakAt);

    /* Calculate number of short breaks */
    noOfShortBreaks = (Math.floor(longBreakEvery / shortBreakEvery)) - 1;
    noOfShortBreaks < 0 ? noOfShortBreaks = 0 : null;

    /* * /
     console.log("Short Break Screentime " + humanizeTime(parseInt(localStorage.shortBreakDuration)));
     console.log("Short break every "+ humanizeTime(shortBreakEvery));
     console.log("Long break every "+ humanizeTime(longBreakEvery));
     console.log("" + noOfShortBreaks + " short breaks and 1 long break");
     /* */

    let pluralize = noOfShortBreaks===1?'':'s';
    $("#breakInfo").html("" + noOfShortBreaks + " short break" + pluralize + " and 1 long break per hour");

    nextBreakInSelector.countdown(nextBreakAt, function (e) {
        let mm = parseInt(e.strftime('%M'));
        let ss = parseInt(e.strftime('%S'));
        updateCountdownDOM(nextBreakInSelector, mm, ss);
    })
        .on('update.countdown', function (e) {

        secondsPassed = secondsPassed + 1;

        //console.log(secondsPassed); // log every second passed?

        /* Find multiples of ShortBreak */
        if ( ( (secondsPassed * 1000) % (shortBreakEvery) ) === 0 ) {
            /* check with `localStorage.shortBreakInterval` as it might get updated from Settings in realtime (REMOVED for performance) */

            shortBreaksElapsed = shortBreaksElapsed + 1;

            if (shortBreaksElapsed > noOfShortBreaks) {
                /* Dont show short breaks */
                console.log("No more short breaks for this session " + uniqueID);
            }
            else {
                let now = Date.now();
                if (shortBreaksElapsed === noOfShortBreaks) {
                    /* Last shortbreak for an hour */
                    /* So, next short break is after the long break */
                    nextShortBreakAt = new Date(now + (shortBreakEvery * 2));
                    /* Make UI update : It's the last */
                    setShortBreakHTML(nextShortBreakAt, 1);
                }
                else {
                    nextShortBreakAt = new Date(now + shortBreakEvery);
                    /* Make UI update : NEXT Short Break */
                    setShortBreakHTML(nextShortBreakAt);
                }

                localStorage.breakType = "short";
                startBreak(localStorage.breakType);
                totalShortBreaks++;
                console.log(`Break ${uniqueID}: SHORT #${shortBreaksElapsed} @ ${secondsPassed}`);
            }

        }
    })
        .on('finish.countdown', function (e) {

        reincarnate("nextBreakIn");

        secondsPassed++;
        totalLongBreaks++;

        /* Long break */
        localStorage.breakType = "long";
        startBreak(localStorage.breakType);
        console.log(`Break ${uniqueID}: LONG #${totalLongBreaks} @ ${secondsPassed}`);
        if (e.elapsed) {
            /* Restart */
            setTimeout( () => initMainTimer() , parseInt(localStorage.shortBreakDuration)+1 );
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

breakCleanup = () => {
    // alert("Cleanup on Aisle 4");
    breakModalWindow = null;
    if(parseInt(localStorage.breakOngoing)) {
        localStorage.breakOngoing = 0;
        if("long" === localStorage.breakType) {
            /* Restart Long Break */
            restart_longBreak();
            /* Lock PC? (WINDOWS ONLY) */
            if (("Windows" === localStorage.OSName) && parseInt(localStorage.opt_lockPC)) {
                ipcRenderer.send('synchronous-messages', 'lockPC');
            }
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

    if( ("undefined"!==audioStartBreak) && (parseInt(localStorage.opt_sounds)) ) audioStartBreak.play();

    /* Create break Window */
    breakModalWindow = new BrowserWindow({
        title: remote.app.getName() + " break",
        icon: __dirname + "/assets/ico/tray.ico",
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
    breakModalWindow.on('closed', () => breakCleanup() );
    breakModalWindow.on('hide', () => breakCleanup() );
    breakModalWindow.on('unresponsive', () => breakCleanup() );

    /* Load contents */
    breakModalWindow.loadFile( getPathTo( 'break.html' ) );

    if(__state.developerMode) breakModalWindow.webContents.openDevTools({ mode: "detach" } );
    if(parseInt(localStorage.opt_alwaysOnTop)) {
        /* If AlwaysOnTop is always giving a blank screen for first run, uncomment below line */
        // makeAlwaysOnTop = setTimeout( () => breakModalWindow.setAlwaysOnTop(true), 500);
    }


}

/* HELPER FUNCTIONS */
function getPathTo(filename) {
    if(filename.startsWith('/')) return __dirname + filename;
    return path.join(__dirname, filename);
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

jQuery(document).ready(
    function() {
        /* Branding */
        $(".app-title").html(config.name);
        $(".app-tagline").html(config.tagline)
        $(".app-version").html(config.version)
        /* Hooks */
        $(".action-minimize").click(() => minimizeWindow());
        $(".action-notification").click( () => naughtyfication());
        $(".action-quit").click( () => quitIt());
        $(".action-update").click( () => checkForUpdates());
    }
);




$(document).ready(function() {

    let $iCheckSelectors = "input.icheck";

    $($iCheckSelectors).iCheck({
        checkboxClass: 'icheckbox_square',
        radioClass: 'iradio_square',
        increaseArea: '20%'
    });

    /* Set Values */
    $opts = ["opt_autoStart","opt_lockPC","opt_startMinimized","opt_sounds","opt_splash","opt_alwaysOnTop","opt_allowSkips"];
    $.each( $opts, function( key, value ) {
        $selector = $("#"+value);
        if(0==$selector.length) return 0;
        if(1==parseInt(localStorage[value])) $selector.iCheck('check');
        else $selector.iCheck('uncheck');
    });

    $($iCheckSelectors).on('ifToggled', function(event){
        activityAnimation(160);
        $what = event.target.id;

        if ($(this).is(":checked")){ localStorage[$what] = 1; }
        else { localStorage[$what] = 0; }

        switch($what) {
            case "opt_autoStart":
                osAutorunAtStartup(parseInt(localStorage[$what]));
                break;
        }

    });

});

// In renderer process (web page).
const ipcRenderer = require('electron').ipcRenderer;

function checkForUpdates() {
    activityAnimation(1100);
    console.log(ipcRenderer.sendSync('synchronous-messages','check-for-updates'));
}

function quitIt() {
    return ipcRenderer.sendSync('synchronous-messages', 'force-quit');
}

ipcRenderer.on('ipc-channel-main', function (event, args) {
    timers(args);
});

$(document).ready(function(){

    return;

    let $blogURL = "http://im.think.dj/introducing-refreshie/?from=app";

    let $updatesCached = true;
    let $updatesCachedTTL = 24*5;

    let $fallbackUpdates = [
        {
            "title":"Refreshie v1.0",
            "desc":"What started out as a hunt for a good fatigue-buster app ended as <a href='#' onclick='OpenURL($blogURL)'>Refreshie</a>. Watch this space for lots more kickass updates"
        }
    ];

    // Set defaults in case Web fetch fails:
    let $updates = $fallbackUpdates;

    let $updateSelctor = $("#messageCenter");

    let $webURL = config.urlUpdatesRESTEndpoint;
    console.log("Web URL Base: " + $webURL);

    $.ajax({
        url          : $webURL, /* TRIAL -- 100 Posts: http://s.typicode.com/posts */
        localCache   : $updatesCached, /* Required. Either a boolean, in which case localStorage will be used, or OBJ that implements the Storage interface */
        cacheTTL     : $updatesCachedTTL,
        cacheKey     : '_ajax_upd_',
        isCacheValid : true
    }).done(function(response){
        console.log("Updates received from server", response);
        response = tryParseJSON(response);
        if(response) {
            $updates = response;
        }
    }).fail(function (jqXHR, textStatus) {
        $updates = $fallbackUpdates;
    }).complete( function() {
        $.each($updates, function(index, item) {
            $updateSelctor.append('<li><b><span class="icon icon-bubble"></span> '+item.title+'</b><span class="desc">'+item.desc+'</span></li>');
        });
    });

    /* Check if server response is JSON */
    function tryParseJSON (jsonString) {
        try {
            let obj = JSON.parse(jsonString);
            // Handle non-exception-throwing cases:
            // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
            // but... JSON.parse(null) returns null, and typeof null === "object",
            // so we must check for that, too. Thankfully, null is falsey, so this suffices:
            if (obj && typeof obj === "object") {
                return obj;
            }
        }
        catch (e) { }
        return false;
    }


});
