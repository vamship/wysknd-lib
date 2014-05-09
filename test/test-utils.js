var _fs = require('fs');

function _getArgArray(args) {
    if (args[0] instanceof Array) {
        return args[0];
    }
    return Array.prototype.slice.call(args, 0);
}

module.exports = {
    /*
     * Tests that the given object matches the specified interface.
     */
    verifyInterface: function(target, interface) {
        // Make sure that every expected member exists.
        for (var prop in interface) {
            // Make sure that the members are defined. Do some formmating
            // so that the error messages are understandable.
            var expectedResult = prop + ': defined';
            var result = prop + ': ' + (target[prop] ? 'defined' : 'undefined');
            expect(result).toBe(expectedResult);
        }

        // Make sure that every member has the correct type. This second
        // iteration will also ensure that no additional methods are
        // defined in the target.
        for (var prop in target) {
            if (target.hasOwnProperty(prop)) {
                var expectedType = interface[prop];
                if (expectedType !== 'ignore') {
                    var type = prop + ': ' + (typeof target[prop]);
                    expect(type).toBe(prop + ': ' + expectedType);
                }
            }
        }
    },

    /*
     * Creates all of the folders specified in the array.
     */
    createFolders: function() {
        var items = _getArgArray(arguments);
        items.forEach(function(item) {
            try {
                _fs.mkdirSync(item);
            } catch (e) {};
        });
    },

    /*
     * Creates all of the files specified in the array.
     */
    createFiles: function() {
        var items = _getArgArray(arguments);
        items.forEach(function(item) {
            var contents;
            var linkTarget;
            var filePath;
            if (typeof item === 'object') {
                contents = item.contents;
                linkTarget = item.linkTo;
                filePath = item.path;
            } else if (typeof item === 'string') {
                filePath = item;
            }
            if (typeof filePath !== 'string' && filePath.length === 0) {
                throw 'file path not specified';
            }

            contents = contents || '';
            try {
                if (linkTarget) {
                    _fs.symlinkSync(linkTarget, filePath);
                } else {
                    _fs.writeFileSync(filePath, contents);
                }
            } catch (e) {};
        });
    },

    /*
     * Cleans up all of the folders specified in the array. If the folder
     * does not exist, the resultant error will be ignored.
     */
    cleanupFolders: function() {
        var items = _getArgArray(arguments);
        items.forEach(function(item) {
            try {
                _fs.rmdirSync(item);
            } catch (e) {
                // Eat the exception.
            }
        });
    },

    /*
     * Cleans up all of the files specified in the array. If the file
     * does not exist, the resultant error will be ignored.
     */
    cleanupFiles: function() {
        var items = _getArgArray(arguments);
        items.forEach(function(item) {
            try {
                _fs.unlinkSync(item.path);
            } catch (e) {
                // Eat the exception.
            }
        });
    }
}
