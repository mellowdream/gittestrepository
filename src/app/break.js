const electron = require('electron');
const thisBreakWindow = electron.remote.getCurrentWindow();
const config = require('./../config.json');

/* Moving auto-closing logic from 'ui.js' to here on 07 Aug 16 11:40 pm */
// const remote = electron.remote;
// const appName = remote.app.getName();
// const ipcRendererProc = electron.ipcRenderer;

thisBreakWindow.center();

let isDemoBreak = () => ["demo"].includes(localStorage.breakType);

function closeThis() {
    if(!isDemoBreak()) localStorage.skippedCount++;
    breakCleanup();
}

function breakCleanup() {
    $("#ttl").remove();
    thisBreakWindow.close();
}


jQuery(document).ready(
    function() {
        /* Branding */
        $(".app-title").html(config.name);
        $(".app-tagline").html(config.tagline)
        /* Hooks */
        $(".action-close").click(() => closeThis());
    }
);

/* ========================================== */

console.log("Hello from the other side...");

if(!isDemoBreak() && !parseInt(localStorage.opt_allowSkips)) {
    $("#skipper").css('display','none').fadeOut(0);
}

/* UI Stuff */
let breakType = localStorage.breakType;

let curBreakImage = "do.neck.png", curBreakTitle = '';

let imgStack = [
    ...config.assetsShortBreak
];
let longBreakStack = [
    ...config.assetsLongBreak
];

let shortBreakType = localStorage.shortBreakType || "eyes";

/* Decide on IMAGE */
switch (shortBreakType) {
    case "eyes":
        curBreakImage = imgStack[0].img;
        curBreakTitle = imgStack[0].title;
        break;
    case "all":
    default:
        /* Pick a random one */
        let random = Math.floor(Math.random() * imgStack.length);
        curBreakImage = imgStack[random].img;
        curBreakTitle = imgStack[random].title;
        break;
}

if("long"===breakType) {
    /* Show WALK for long break */
    curBreakImage = longBreakStack[0].img;
    curBreakTitle = longBreakStack[0].title;
    if(parseInt(localStorage.opt_lockPC)) $("#closingTime").text("Locking PC");
}


jQuery(document).ready(
    function() {

        /* UI */
        $("#breakType").text(breakType);
        $('#breakImage').attr('src', curBreakImage).parent().hide().fadeIn(750);
        $("#breakTitle").text(curBreakTitle);
        if(localStorage.isFullscreen===true) {
            $(".app-container").css('border','none').css('border-radius','0');
        }

        /* Close Countdown automatically after timeout */
        let ttl = new Date(Date.now() + parseInt(localStorage.shortBreakDuration));
        $('#ttl').countdown(ttl, function (event) {
            $(this).html(event.strftime('%S s'));
        }).on('finish.countdown', function(event) {
            breakCleanup();
        });

        /* APNG */
        APNG.ifNeeded().then(function() {
            var images = document.querySelectorAll(".apng");
            for (var i = 0; i < images.length; i++) {
                APNG.animateImage(images[i]);
            }
        });

    }
);
