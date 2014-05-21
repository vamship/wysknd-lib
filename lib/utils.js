/**
 * Utils module. Provides utility methods that can be used by other modules.
 */
'use strict';

var _fs = require('fs');
var _path = require('path');

var _promise = require('./promise');

function _getPadString(value, maxLen, padChar) {
    padChar = padChar || ' ';
    var padLen = Math.max(maxLen - value.length, -1) + 1;
    return (new Array(padLen)).join(padChar);
}

var mod = {
    /*
     * Converts a string into a name that is compatible with AngularJS naming
     * conventions.
     */
    getAngularJSName: function(name, type) {
        type = type || 'Module';
        if (typeof name === 'string') {
            name = name.replace(/\-([a-zA-Z0-9])/, function(match, ref) {
                return ref.toUpperCase();
            })
                .replace(new RegExp('$|' + type + '$', 'i'), type);
        }
        return name;
    },

    /* 
     * Pads a given string on the right by as many characters as required so
     * that the resultant string is as long as the specified length.
     */
    padRight: function(value, maxLen, padChar) {
        value = value || '';
        return value + _getPadString(value, maxLen, padChar);
    },

    /* 
     * Pads a given string on the left by as many characters as required so
     * that the resultant string is as long as the specified length.
     */
    padLeft: function(value, maxLen, padChar) {
        value = value || '';
        return _getPadString(value, maxLen, padChar) + value;
    },

    /*
     * Generates a callback that logs a message based on success/failure of an
     * operation.
     */
    messageCallback: function(successMessage, failMessage) {
        return function(err, data) {
            if (!err) {
                console.log(successMessage);
            } else {
                failMessage = failMessage || 'Something went wrong. Additional info: ' + err;
                console.error(failMessage);
            }
        }
    },

    /*
     * Returns a function that can be used to transform input text by performing
     * token replacement for the specified tokens in the token map.
     */
    getTransformer: function(tokenMap, ignoreRegex) {
        return function(data) {
            if (!data) {
                return null;
            }
            var result = data;
            if (tokenMap) {
                for (var token in tokenMap) {
                    if (tokenMap.hasOwnProperty(token)) {
                        var search = ignoreRegex ? token : new RegExp(token);
                        result = result.replace(search, tokenMap[token]);
                    }
                }
            }
            return result;
        }
    },

    /*
     * Performs a token replacement transformation on the contents of the
     * source file, and writes the results to the destination.
     */
    transformFile: function(src, dest, transform) {
        if (typeof src !== 'string' || src.length === 0) {
            throw 'Invalid source file path (arg #1)';
        }
        if (typeof dest !== 'string' || dest.length === 0) {
            throw 'Invalid destination file path (arg #2)';
        }
        if (typeof transform !== 'function') {
            transform = function(data) {
                return data;
            };
        }

        var def = _promise.deferred();
        _fs.readFile(src, function(err, data) {
            if (err) {
                def.reject(err);
            } else {
                var data = transform(data.toString());
                _fs.writeFile(dest, data, function(err, data) {
                    if (err) {
                        def.reject(err);
                    } else {
                        def.resolve();
                    }
                });
            }
        });

        return def.promise();
    }
}

module.exports = mod;
