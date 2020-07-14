/**
* Created by Deepak Thomas
* on 3/23/2016 @ 6:56pm
* Mod1 on 07/07/2016 @ 3:30pm
* Mod2 on 08/07/2016 @ 10:00am
* Mod3 on 10/09/2019 @ 3:00pm
*/

/*;window.$ = require( __dirname + '/assets/js/jquery-1.12.2.min.js');*/

/* Begin scoping function*/
////(function() {

var basePath = __dirname;
const path = require('path');


let audioElement = document.createElement('audio');
audioElement.setAttribute('src', 'assets/sounds/click.wav');


function removeJSorCSS(filename, filetype){
    /* SRC: http://www.javascriptkit.com/javatutors/loadjavascriptcss2.shtml */
    var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none";
    var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none";
    var allsuspects=document.getElementsByTagName(targetelement);
    for (var i=allsuspects.length; i>=0; i--){
        if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1)
        {
            allsuspects[i].parentNode.removeChild(allsuspects[i]);
        }
    }
}

$(document).ready( function() {
    let splashDelay = 20000;
    let elIntro = $("#intro");
    /* IF first time OR Splash is enabled, show splash */
    if( (parseInt(localStorage.opt_splash)>=1) || (parseInt(localStorage.timesOpened)<=1) ) {
        elIntro.css('display','block').fadeIn(500).delay(splashDelay-1000).fadeOut(500);
    }
    activityAnimation(1000);
    /* Auto-remove #intro from DOM after 6 seconds and unload unnecessary JS */
    setTimeout(function() {
        removeJSorCSS("assets/js/splash.anim.js", "js");
        $("#script-splash-anim").empty().attr('src','').remove();
        console.log("Intro element removed");
        return elIntro.remove();
    },splashDelay + 1000);
    elIntro.click( function() {
        elIntro.fadeOut(500);
    });
});

/* TABS */
$(document).on('click', '.isTab', function () {
    $active = $(this).attr('aria-controls');
    if(!$(this).is(".isActive")) {
        if( ("undefined"!==audioElement) && (parseInt(localStorage.opt_sounds)) ) audioElement.play();
        $('.hideable').hide();
        $("#" + $active).fadeIn(165);
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

const electron = require('electron');
const {BrowserWindow} = require('electron').remote;
const appName = electron.remote.app.getName();
const remote = electron.remote;
const {shell} = require('electron');

const licenseLength = 16;

function minimizeWindow() {
    /* Returns the BrowserWindow object which this web page belongs to */
    remote.getCurrentWindow().hide();
}


function osAutorunAtStartup(launch) {
    var AutoLaunch = require('auto-launch');
    var appLauncher = new AutoLaunch({
        name: appName,
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
var msg = {
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

var seconds = 1000; /* ms */
var minutes = (60*seconds); /* ms */

var nextShortBreakTimeString = '';
var longBreakEvery = null;
var shortBreakEvery = null;
var breakModalWindow = null;

var totalLongBreaks = 0;
var totalShortBreaks = 0;
var nextBreakAt = null;
var nextShortBreakAt = null;
var noOfShortBreaks = 0;
var secondsPassed = 0;
var shortBreaksElapsed = 0;

var longBreak = null; /* Variable for the longBreak hook */
/* PS: Wasted two days on http://stackoverflow.com/questions/3015319/settimeout-cleartimeout-problems ; 8-10 Aug 2016 */


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
    longBreak = function(){};

    /* Create DOM */
    reincarnate("nextShortBreakIn");
    reincarnate("nextBreakIn");

}

function init() {

    $clearLocalStorageOnEachRun = false;

    /* Set 1 for clearing cache / Debug Mode */
    if($clearLocalStorageOnEachRun) {
        localStorage.clear();
        /* */
        localStorage.longBreakInterval =  60 * seconds;
        localStorage.shortBreakInterval = 20 * seconds;
        localStorage.shortBreakDuration = 2 * seconds;
        /* */
    }

    /* Set persistent variables [DEFAULTS] */
    if(!localStorage.firstTouch) localStorage.firstTouch = new Date(Date.now());
    if(!localStorage.longBreakInterval) localStorage.longBreakInterval = 60 * minutes;
    if(!localStorage.shortBreakInterval) localStorage.shortBreakInterval = 20 * minutes;
    if(!localStorage.shortBreakDuration) localStorage.shortBreakDuration = 20 * seconds;
    if(!localStorage.timesOpened) localStorage.timesOpened = 0;
    if(!localStorage.skippedCount) localStorage.skippedCount = 0;
    if(!localStorage.breakOngoing) localStorage.breakOngoing = 0;
    if(!localStorage.breakType) localStorage.breakType = 'short';
    if(!localStorage.mode) localStorage.mode = 'monk';
    if(!localStorage.count_shortBreaks) localStorage.count_shortBreaks = 0;
    if(!localStorage.count_longBreaks) localStorage.count_longBreaks = 0;
    if(!localStorage.shortBreakWhat) localStorage.shortBreakWhat = "all";

    if(!localStorage.opt_lockPC) localStorage.opt_lockPC = 0;
    if(!localStorage.opt_alwaysOnTop) localStorage.opt_alwaysOnTop = 1;
    if(!localStorage.opt_sounds) localStorage.opt_sounds = 1;
    if(!localStorage.opt_splash) localStorage.opt_splash = 0;
    if(!localStorage.opt_autoStart) localStorage.opt_autoStart = 1;
    if(!localStorage.opt_startMinimized) localStorage.opt_startMinimized = 1;
    if(!localStorage.opt_allowSkips) localStorage.opt_allowSkips = 1;

    if(!localStorage.uLicense) localStorage.uLicense="Register for free at http://think.dj/refreshie";
    if(!localStorage.uEmail) localStorage.uEmail="Register for free at http://think.dj/refreshie";

}

/* Init on APP start */
init();


function naughtyfication() {

    var notiFire = new Notification('Hello!', {
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
    if(1==parseInt(value)) return "1 time";
    return value+" times"
}


function setStats(){

    /* Init UI */
    var count_longBreaks = parseInt(localStorage.count_longBreaks);
    $("#times").text(count_longBreaks);
    if(count_longBreaks) {
        $("#statis").removeClass('virgo');
        $("#meta_welcome").hide();
        $("#meta_hoursSaved").show();
        if(1==count_longBreaks) $("#plural").hide(); else $("#plural").show();
    }
    else {
        $("#statis").addClass('virgo');
        $("#meta_hoursSaved").hide();
        $("#meta_welcome").show();
    }

    /* Set Statistics */
    $("#count_shortBreaks").text(kFormatter(localStorage.count_shortBreaks));
    $("#count_longBreaks").text(kFormatter(localStorage.count_longBreaks));

    $("#count_opened").text(pluralize(localStorage.timesOpened));


    var skippedText = parseInt(localStorage.skippedCount);
    if(0==skippedText) skippedText="none of the";
    else skippedText = skippedText + " of ";
    $("#count_skipped").text(skippedText);

    $("#firstTouch").text(localStorage.firstTouch);

    var totalBreaks = parseInt(localStorage.count_shortBreaks) + parseInt(localStorage.count_longBreaks);
    var percSkips = Math.round( parseInt(localStorage.skippedCount)/( totalBreaks )*100 ) || 0;
    var percSkipsText;

    var skipPercAllowed = 15;

    switch(true) {
        case (0==percSkips):
            percSkipsText = "Don't break the streak!";
            $("#percSkips").removeClass('red').addClass('green');
            break;
        case (percSkips<skipPercAllowed):
            percSkipsText = "Impressive!";
            $("#percSkips").removeClass('red').addClass('green');
            break;
        case (percSkips>=skipPercAllowed && percSkips<99):
            $("#percSkips").removeClass('green').addClass('red');
            percSkipsText = "You need to skip skipping breaks, skipper";
            break;
        case (percSkips>98 && percSkips<101):
            $("#percSkips").removeClass('green').addClass('red');
            percSkipsText = "Why?";
            break;
        case (percSkips>100):
            $("#percSkips").removeClass('green').addClass('red');
            percSkipsText = "U EVEN HUMAN?";
            break;
    }
    $("#percSkips").text("That's a " + percSkips + "% skip-rate. " + percSkipsText);

    if(0==totalBreaks) totalBreaks = '';
    $("#count_totalBreaks").text(totalBreaks);

}

function reverse(s){return s.split("").reverse().join("");}
if (typeof String.prototype.trim != 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

/* License - discontinued */
function validateLicense(email,serial) {
    encEmail = reverse(btoa((email.trim())+"think.dj")).substring(0, licenseLength);
    console.log(encEmail);

    if(serial===encEmail) {
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
if(parseInt(localStorage.timesOpened)==0) {
    console.log("Looks like you are a first timer :)");
    osAutorunAtStartup(1);
}
else {
    /* If NOT Refreshie noob, honor his choice of app start we must */
    if(1==parseInt(localStorage.opt_startMinimized))
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


/////////var shortBreakInterval = parseInt(localStorage.shortBreakInterval);

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
* */


function GUID(length=8) {
    var result, i, j, result = '';
    for(j=0; j<length; j++) {
        if( j == 8 || j == 12|| j == 16|| j == 20) result = result + '-';
        i = Math.floor(Math.random()*16).toString(16).toUpperCase();
        result = result + i;
    }
    return result;
}

function humanizeTime(time) {
    time = time/minutes;
    var unit = " minutes";
    if(time<1) {
        time = time*60;
        unit = " seconds";
    }
    return time + unit;
}


function reincarnate(id) {

    /* Reincarnate destroys a selector and recreates it */
    /* This was added because https://github.com/hilios/jQuery.countdown/issues/215#issuecomment-238989295 */

    $selector = "#" + id;

    if(($($selector).length)) {
        ///$($selector).countdown('remove');
        $($selector).remove();
    }

    if(!($($selector).length))
        $selector = $('<span id="'+id+'">_:_</span>').appendTo($(($selector)+'Inject'));

    $selector.hide().fadeIn(1250);

}

/* Define state and text */
$state = 1;
$stateText = [];
$stateText[0] = "Paused";
$stateText[1] = "Running";

function timer_set_state_ui($statePassed=1) {
    $("#button-action").text($stateText[$statePassed]);
    console.log("Set UI to "+$stateText[$statePassed]);
    /* Yellow Border for timer */
    if("Running"==$stateText[$statePassed]){
        $(".dataBlock .time").removeClass("paused");
    }
    else if("Paused"==$stateText[$statePassed]) {
        $(".dataBlock .time").addClass("paused");
    }
}

function timers($doWhat="toggle") {

    switch($doWhat) {
        case "restart":
            $state = 1;
            restart_longBreak();
            /* Ask mainProcess to change tray icon */
            ipcRenderer.send('timer-trayIcoChangeReq-from-ui', "restart");
            break;
        default:
            $state = 1 - $state;
            timer_set_state_ui($state);
            $('#nextBreakIn').countdown($doWhat);
            $("#nextShortBreakIn").countdown($doWhat);
            /* Ask mainProcess to change tray icon */
            ipcRenderer.send('timer-trayIcoChangeReq-from-ui',$doWhat);
            break;
    }

    return 1;

}

function updateCountdownDOM(element,mins,secs) {
    newHtml = null;
    if(mins<1) {
        newHtml = secs+' s';
    }
    else {
        newHtml = mins+' m';
    }
    /* Redraw iff required */
    if(element.html()!==newHtml) {
        element.html(newHtml);
        //console.log("changed to "+newHtml);
    }
}


function setShortBreakHTML(nextShortBreakAt, last=0) {

    nextShortBreakTimeString = nextShortBreakAt.toLocaleTimeString().replace(/:\d+ /, ' ').toLowerCase(); /* replace takes off seconds */
    $("#nextShortBreakAt").html(nextShortBreakTimeString);

    /*$('#nextShortBreakIn').countdown('stop');*/

    NextShortBreakInSelector = $("#nextShortBreakIn");

    NextShortBreakInSelector.countdown(nextShortBreakAt, function (event) {
        mins = parseInt(event.strftime('%M'));
        secs = parseInt(event.strftime('%S'));
        updateCountdownDOM(NextShortBreakInSelector,mins,secs);
    }).on('finish.countdown', function(event) {
        reincarnate("nextShortBreakIn");
    });

    /* Decide color */
    if(last) {
        /* If it's the last short break, make long break color green */
        /* Next = LONG */
        $('#nextBreakIn').closest(".time").css('border-color', '#94BA0B').toggleClass("active");
        NextShortBreakInSelector.closest(".time").css('border-color', '#e4e4e4');
    }
    else {
        /* Next = Short break */
        $('#nextBreakIn').closest(".time").css('border-color', '#e4e4e4');
        NextShortBreakInSelector.closest(".time").css('border-color', '#94BA0B').toggleClass("active");
    }

}


function setLongBreakHTML(nextLongBreakAt) {

    var longBreakEvery = parseInt(localStorage.longBreakInterval) || (60*minutes);

    var nextLongBreakTimeString = new Date(Date.now() + longBreakEvery);
    nextLongBreakTimeString = nextLongBreakTimeString.toLocaleTimeString().replace(/:\d+ /, ' ').toLowerCase(); /* replace takes off seconds */

    $("#nextLongBreakAt").html(nextLongBreakTimeString);

}



function longBreakTimer() {

    GC();
    init();
    setStats();

    uniqueID = GUID(6);

    var NextBreakInSelector = $('#nextBreakIn');

        console.log("//longBreakTimer " + (totalLongBreaks + 1) + " ~ " + uniqueID + " ");
        console.log("//shortbreaks so far  " + (totalShortBreaks));


        longBreakEvery = parseInt(localStorage.longBreakInterval) || (60 * minutes);
        shortBreakEvery = parseInt(localStorage.shortBreakInterval) || (20 * minutes);

        nextBreakAt = new Date(Date.now() + longBreakEvery);
        setLongBreakHTML(nextBreakAt);

        nextShortBreakAt = new Date(Date.now() + shortBreakEvery);
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

        $("#breakInfo").html("" + noOfShortBreaks + " short breaks and 1 long break per hour");

        NextBreakInSelector.countdown(nextBreakAt, function (event) {
            mins = parseInt(event.strftime('%M'));
            secs = parseInt(event.strftime('%S'));
            updateCountdownDOM(NextBreakInSelector,mins,secs);
        }).on('update.countdown', function (event) {

            secondsPassed = secondsPassed + 1;

            console.log(secondsPassed);

            /* Find multiples of ShortBreak */
            if (((secondsPassed * 1000) % (localStorage.shortBreakInterval)) == 0) {
                /* check with localStorage.shortBreakInterval as it might get updated from Settings in realtime */

                shortBreaksElapsed = shortBreaksElapsed + 1;

                if (shortBreaksElapsed > noOfShortBreaks) {
                    /* Dont show short breaks */
                    console.log("No more short breaks for this session " + uniqueID);
                }
                else {
                    if (shortBreaksElapsed == noOfShortBreaks) {
                        /* Last shortbreak for an hour */
                        /* So, next short break is after the long break */
                        nextShortBreakAt = new Date(Date.now() + (shortBreakEvery * 2));
                        /* Make UI update : It's the last */
                        setShortBreakHTML(nextShortBreakAt, 1);
                    }
                    else {
                        nextShortBreakAt = new Date(Date.now() + shortBreakEvery);
                        /* Make UI update : NEXT Short Break */
                        setShortBreakHTML(nextShortBreakAt);
                    }

                    localStorage.breakType = "short";
                    console.log("Short Break " + shortBreaksElapsed + " for " + uniqueID);
                    startBreak(localStorage.breakType);
                    totalShortBreaks++;
                    console.log("Short Break " + shortBreaksElapsed + " @ +" + secondsPassed);
                }

            }
        }).on('finish.countdown', function (event) {

            reincarnate("nextBreakIn");

            secondsPassed++;
            totalLongBreaks++;

            localStorage.breakType = "long";
            startBreak(localStorage.breakType);
            console.log("Long Break @ +" + secondsPassed);

            if (event.elapsed) {
                /* Restart */
                //setTimeout(longBreakTimer,(parseInt(localStorage.shortBreakDuration)+1));
                /* +1 just to play safe :"> */
            }
            else {
                console.log("WFT?");
            }
            return 1;
        });
    return 1;
}

longBreak = longBreakTimer();

function restart_longBreak(){
    timer_set_state_ui($state=1);
    $(".time").removeClass("active").removeClass("paused");
    longBreak = function(){};
    longBreak = longBreakTimer();
}

/* was killmodal() */
function breakCleanup() {

    if(parseInt(localStorage.breakOngoing)) {
        localStorage.breakOngoing = 0;
        breakModalWindow = null;

        if("long"==localStorage.breakType) {

            /* Restart Long Break */
            restart_longBreak();

            /* Lock PC? */
            if (("Windows" == localStorage.OSName) && parseInt(localStorage.opt_lockPC)) {
                ipcRenderer.send('lockWinPC', 'Lock PC');
            }

        }

    }

    return 1;
}

/*
*
*
* @@@todo
* LAST LEFT OFF HERE
* Need to make one single startbreak() that will adjust accordingly
* decide short/long break, monk or sgt window
* Lock PC?
* Finally, restart main timer if long break
*
* */



function startBreak(type="short",forced="no") {

    /* Debug * /
    return 1;
    /* */

    var optFS = true;
    var optWid = window.screen.availWidth;
    var optHt = window.screen.availHeight;

    localStorage.breakOngoing = 1;

    if("no"==forced) {
        if ("short" == type) localStorage.count_shortBreaks = parseInt(localStorage.count_shortBreaks)+1;
        else if ("long" == type) localStorage.count_longBreaks = parseInt(localStorage.count_longBreaks)+1;
    }
    else localStorage.breakType = "demo";

    if( ("monk"==forced) || ("monk"==localStorage.mode) ) {
        optFS = false;
        optWid = 660;
        optHt = 460;
    }
    if("sgt"==forced) {
        optFS = true;
        optWid = window.screen.width;
        optHt = window.screen.height;
    }

    localStorage.isFullscreen = optFS ? true : false;

    /* Create new FSModal */
    breakModalWindow = new BrowserWindow({
        title: "Break @ " + appName,
        icon: __dirname + "/assets/ico/tray.ico",
        width: optWid,
        height: optHt,
        fullscreen: localStorage.isFullscreen,
        show: true,
        center: true,
        movable: false,
        useContentSize: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        skipTaskbar: false,
        closable: true,
        alwaysOnTop: false,
        transparent: true,
        titleBarStyle: 'hidden',
        frame: false,
        hasShadow: false
    });
    breakModalWindow.on('closed', function() {
        breakModalWindow = null;
        breakCleanup();
    });
    breakModalWindow.on('destroy', function() {
        breakModalWindow = null;
        breakCleanup();
    });
    breakModalWindow.on('unresponsive', function() {
        breakModalWindow = null;
        breakCleanup();
    });

    breakModalWindow.loadFile( getPathTo( 'break.html' ) );
}

/* HELPER FUNCTIONS */
function getPathTo(filename) {
    if(filename.startsWith('/')) return __dirname + filename;
    return path.join(__dirname, filename);
}

/* Handle change in options */
$(function() {
    /* OnChange, update localstore */
    $('input[name=mode]').on('change', function() {
            localStorage.mode = $(this).val();
    });

    $("#shortIntervalDD").val(localStorage.shortBreakInterval/minutes);
    $("#shortBreakDuration").val(localStorage.shortBreakDuration/1000);
    $("#shortBreakWhat").val(localStorage.shortBreakWhat);
    $("#shortIntervalDD").change(function() {
        activityAnimation();
        $newShortInterval = $('option:selected', this).val();
        shortBreakInterval = parseFloat($newShortInterval)*minutes;
        localStorage.shortBreakInterval = shortBreakInterval;
        longBreakTimer();
    });
    $("#shortBreakDuration").change(function() {
        activityAnimation();
        $shortBreakDuration = $('option:selected', this).val();
        shortBreakDuration = parseFloat($shortBreakDuration)*1000;
        localStorage.shortBreakDuration = shortBreakDuration;
    });
    $("#shortBreakWhat").change(function() {
        activityAnimation();
        $shortBreakWhat = $('option:selected', this).val();
        localStorage.shortBreakWhat = $shortBreakWhat;
    });
});

function activityAnimation($timeMS) {
    $timeMS = parseInt($timeMS) || 600;
    $timeMS = Math.ceil($timeMS/3);
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
        // Default var for options.
        var defaults = {
                imgItemClass: 'radio-select-img-item',
                imgItemCheckedClass: 'item-checked',
                hideLabel: true
            },

            /**
             * Method firing when need to update classes.
             */
            syncClassChecked = function( img ) {
                var radioName = img.prev('input[type="radio"]').attr('name');

                $('input[name="' + radioName + '"]').each(function() {
                    // Define img by radio name.
                    var myImg = $(this).next('img');

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
            var img = $(this).next('img');
            // Add item class.
            img.addClass(options.imgItemClass);

            /* CUSTOM CODE: Select MODE onload; 14-aug-16 1:12pm */
            var theSelImg = $('input[name="mode"][value="' + localStorage.mode + '"]').next('img');
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
        startBreak("short","monk");
    });
    $(document).on('click', '#demo-sgt', function () {
        startBreak("short","sgt");
    });

    $(document).on('click', '#button-action', function () {
        timers("toggle");
    });
    $(document).on('click', '#button-action-restart', function () {
        timers("restart");
    });


} );
