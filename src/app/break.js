const electron = require('electron');
const thisBreakWindow = electron.remote.getCurrentWindow();
const config = require('./../config.json');

/* Moving auto-closing logic from 'ui.js' to here on 07 Aug 16 11:40 pm */
// const remote = electron.remote;
// const appName = remote.app.getName();
// const ipcRendererProc = electron.ipcRenderer;

thisBreakWindow.center();

function closeThis() {
    if("demo"!==localStorage.breakType) localStorage.skippedCount++;
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

if(!parseInt(localStorage.opt_allowSkips)) {
    $("#skipper").css('display','none').fadeOut(0);
}

/* UI Stuff */
let breakType = localStorage.breakType;

let imgSrc = "do.neck.png", desc = '';

let imgStack = [
    {"img":"do.look.png","desc":"Look around"},
    {"img":"do.spine.png","desc":"Flex your back"},
    {"img":"do.neck.png","desc":"Flex your neck and look around"}
];
let longBreakStack = [
    {"img":"do.walk.png","desc":"Take a walk"}
];

let shortBreakWhat = localStorage.shortBreakWhat || "eyes";

/* Decide on IMAGE */
switch (shortBreakWhat) {
    case "eyes":
        imgSrc = imgStack[0].img;
        desc = imgStack[0].desc;
        break;
    case "all":
    default:
        /* Pick a random one */
        let selected = Math.floor(Math.random() * imgStack.length);
        imgSrc = imgStack[selected].img;
        desc = imgStack[selected].desc;
        break;
}

if("long"===breakType) {
    /* Show WALK for long break */
    imgSrc = longBreakStack[0].img;
    desc = longBreakStack[0].desc;
    if(parseInt(localStorage.opt_lockPC)) $("#closingTime").text("Locking PC");
}





jQuery(document).ready(
    function() {

        /* UI */
        $("#breakType").html(breakType);
        $('#whatDo').attr('src', "./assets/images/" + imgSrc).parent().hide().fadeIn(900);
        $("#desc").html(desc);
        if(localStorage.mode==="sgt")  {
            $(".app-container").css('border','none').css('border-radius','0');
        }

        /* Close Countdown */
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
