const { nativeImage } = require('electron');
const path = require('path');

module.exports = {

    /* Find OS/Platform */
    platformIs: function(string = '') {
        const platform = process.platform;
        switch (String(string).toLowerCase()) {
            case 'osx':
            case 'mac':
            case 'macos':
                return 'darwin' === platform;
            case 'win':
            case 'win32':
            case 'win64':
            case 'windows':
                return ['win32','win64'].includes(platform);
            case 'linux':
            case 'ubuntu':
                return 'linux' === platform;
            case 'droid':
            case 'android':
                return 'android' === platform;
            default:
                return false;
        }
    },

    /* Returns native image from path */
    /* Fixes: Image could not be loaded from ... */
    getImage: function(assetPath, prefixPath = false) {
        if(prefixPath) assetPath = this.getPathTo(assetPath);
        return nativeImage.createFromPath(assetPath);
    },

    getPathTo: function(filename) {
        filename = String(filename);
        if(filename.startsWith('/')) return __dirname + filename;
        return path.join(__dirname, filename);
    },

    simplePluralize: function(term, count, prependNumber = false) {
        term = String(term);
        if(1!==Number(count)) term = term + 's' + ' ';
        if(prependNumber) term = String(count) + ' ' + term;
        return term;
    },

    isset: (variable) => {
        try {
            return typeof eval(variable) !== 'undefined';
        } catch (err) {
            return false;
        }
    }

}
