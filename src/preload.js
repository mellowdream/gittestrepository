// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

// WHY ARE WE DOING THIS?
// https://github.com/reZach/secure-electron-template/blob/master/docs/secureapps.md

// Uncomment below lines to get Global vars
//window.getDirname = function () { return __dirname }
//window.getConfig = function () { return require('./config.json') }
//window.getJQuery = function () { return require('jquery') }
window.preloadJs = true;

/* * /
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    window.$ = window.jQuery = require('jquery');
  }
}

/* */
