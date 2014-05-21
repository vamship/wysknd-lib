/**
 * Templater module. Exposes methods that allow the creation of files based on
 * templates
 */
'use strict';

var _utils = require('./utils');

var mod = {
    /*
     * Returns an object that can then be used to generate file artifacts
     * based on templates.
     */
    getTemplater: function(templateFolder, targetFolder, itemMap) {
        if (typeof templateFolder !== 'object' || typeof templateFolder.getPath !== 'function') {
            throw 'Invalid template folder specified (arg #1)';
        }
        if (typeof targetFolder !== 'object' || typeof targetFolder.getPath !== 'function') {
            throw 'Invalid target folder specified (arg #2)';
        }

        itemMap = itemMap || {};
        var _items = [];

        for (var prop in itemMap) {
            _items.push(prop);
        }

        return {
            /*
             * Returns an array of items that the templater has been
             * initialized with.
             */
            getItemTypes: function() {
                return _items;
            },
            /*
             * Returns an array of artifact objects, each of which can be used
             * to generate tempated artifacts on the file system.
             */
            getArtifacts: function(itemType, transform) {
                if (typeof itemType !== 'string' || itemType.length === 0) {
                    throw 'Invalid item type specified (arg #1)';
                }
            },
            createItem: function() {}
        };
    }
};

module.exports = mod;
