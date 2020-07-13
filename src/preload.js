// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

// WHY ARE WE DOING THIS?
// https://github.com/reZach/secure-electron-template/blob/master/docs/secureapps.md

window.getDirname = function () { return __dirname }
window.getConfig = function () { return require('./config.json') }
window.getJQuery = function () { return require('jquery') }

/* * /
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    window.$ = window.jQuery = require('jquery');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});
/* */
