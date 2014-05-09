/* ----------------------------------------------------------------------------
 * Folder module. Allows creation of objects that represent folders, and allows
 * basic operations on them.
 * ---------------------------------------------------------------------------*/
var _fs = require('fs');
var _path = require('path');
var _promise = require('./promise');
var _utils = require('./utils');

function _createTree(folder, tree) {
    // If the first argument is a string, convert it into a folder.
    if (typeof folder === 'string') {
        folder = mod.createFolder(folder);
    }
    if (tree) {
        // Loop through each sub folder specification.
        for (var folderName in tree) {
            // Create the subfolder.
            var subFolder = folder.addSubFolder(folderName);

            // Build out the tree under the sub folder.
            _createTree(subFolder, tree[folderName]);
        }
    }
    return folder;
}

var mod = {
    /*
     * Recursively traverses the file system, and invokes the callback method
     * for each item encountered.
     */
    traverse: function(folderPath, callback, level) {
        level = level || 1;
        if (typeof callback !== 'function') {
            throw 'The callback argument must be a valid function.';
        }

        var treeTraversed = _promise.deferred();
        var dirContentsReady = _promise.deferred();

        function _rejectTraversal() {
            treeTraversed.reject(folderPath);
        };

        // Attempt to read the contents of the folder.
        _fs.readdir(folderPath, dirContentsReady.getResolver());

        // Handler to handle when the folder contents are ready.
        dirContentsReady.success(function(data) {
            // Create a resolver that will complete the promise after all
            // items have been processed.
            var resolver = treeTraversed.getMultiStepResolver(data.length);

            // The contents of the folder have been read. Process them.
            data.forEach(function(item) {
                var itemStats = _promise.deferred();
                var itemPath = _path.join(folderPath, item);

                _fs.lstat(itemPath, itemStats.getResolver());

                itemStats.success(function(data) {
                    if (data.isDirectory()) {
                        // Let the listener know that we found an item.
                        callback(itemPath, level, true);

                        // Traverse the child folder, and only mark this
                        // activity as completed once the child is finished.
                        mod.traverse(itemPath, callback, level + 1)
                            .success(resolver.stepComplete)
                            .fail(resolver.reject);
                    } else {
                        // Let the listener know that we found an item.
                        callback(itemPath, level, false);

                        // Nothing to wait for. Mark the step as completed.
                        resolver.stepComplete();
                    }

                    //Could not get child item stats. Traversal failed.
                }).fail(_rejectTraversal);
            });

            // Could not read child items. Traversal failed.
        }).fail(_rejectTraversal);

        return treeTraversed.promise();
    },

    /*
     * Creates an object that represents a specific folder, and provides
     * utility methods against the object.
     */
    createFolder: function(path) {
        if (typeof path !== 'string') {
            throw 'Input path must be a valid string';
        }
        var _folderName;
        var _folderPath;
        var _subFolders = [];

        _folderName = _path.basename(path);
        _folderPath = _path.join(_path.dirname(path), _folderName) + '/';

        var folderObj = {
            /*
             * Returns the name of the folder.
             */
            getName: function() {
                return _folderName;
            },

            /*
             * Returns the path of the folder.
             */
            getPath: function() {
                return _folderPath;
            },

            /*
             * Returns the absolute path of the folder.
             */
            getAbsolutePath: function() {
                return _path.resolve(_folderPath);
            },

            /*
             * Adds a sub folder to the current folder.
             */
            addSubFolder: function(folderName) {
                if (typeof folderName !== 'string' || folderName.match(/[\\\/]/)) {
                    throw 'Sub folder name must be a valid string without delimiters.';
                }
                var subFolderPath = _path.join(_folderPath, folderName);
                var subFolder = mod.createFolder(subFolderPath);
                _subFolders[folderName] = subFolder;

                return subFolder;
            },

            /*
             * Returns a reference to an existing sub folder, provided it
             * has been created via the addSubFolder method.
             */
            getSubFolder: function(folderName) {
                return _subFolders[folderName];
            },

            /*
             * Returns the path of the specified child item, relative to the
             * current folder.
             */
            getChildPath: function(subPath, tokenMap, ignoreRegex) {
                if (typeof subPath !== 'string' || subPath.length === 0) {
                    return _folderPath;
                }
                tokenMap = tokenMap || {};
                ignoreRegex = !! ignoreRegex;

                var transform = _utils.getTransformer(tokenMap, ignoreRegex);
                subPath = transform(subPath);
                return _path.join(_folderPath, subPath);
            },

            /*
             * Gets a string glob that can be used to match all
             * folders/files in the current folder and all sub folders,
             * optionally filtered by file extension.
             */
            allFilesPattern: function(extension) {
                extension = (extension && '*.' + extension) || '*';
                return _folderPath + '**/' + extension;
            },

            /* 
             * Returns a string representation of the current state of the
             * folder (exists, symbolic link, does not exist, etc.
             */
            getStatus: function() {
                var absPath = _path.resolve(_folderPath);
                if (!_fs.existsSync(absPath)) {
                    return '[DOES NOT EXIST]';
                } else {
                    var stats = _fs.lstatSync(absPath);
                    if (stats.isDirectory()) {
                        return '[DIR]';
                    } else if (stats.isSymbolicLink()) {
                        return '[LINK]';
                    } else {
                        return '[FILE]';
                    }
                }
            },

            /*
             * Ensures that a physical copy of the folder exists at the path
             * represented by this folder.
             */
            ensureFolder: function() {
                var def = _promise.deferred();

                _fs.exists(_folderPath, function(exists) {
                    if (exists) {
                        def.resolve();
                    } else {
                        _fs.mkdir(_folderPath, function(err) {
                            if (!err) {
                                def.resolve();
                            } else {
                                def.reject();
                            }
                        });
                    }
                });

                return def.promise();
            },

            /*
             * Ensures that the current folder and all of its defined subtrees
             * exist on the file system.
             */
            ensureFolderTree: function() {
                var def = _promise.deferred();

                folderObj.ensureFolder().success(function() {
                    var subFolderCount = 0;
                    for (var folderName in _subFolders) {
                        subFolderCount++;
                    }

                    if (subFolderCount > 0) {
                        var resolver = def.getMultiStepResolver(subFolderCount);
                        for (var folderName in _subFolders) {
                            _subFolders[folderName].ensureFolderTree()
                                .success(function() {
                                    resolver.stepComplete();
                                }).fail(function() {
                                    resolver.reject();
                                });
                        }
                    } else {
                        def.resolve();
                    }
                });

                return def.promise();
            }
        };

        return folderObj;
    },

    /* 
     * Creates a folder tree that mimics the tree specified by the
     * input object. This object has the form:
     * {
     *      "subFolderName" : {
     *          "subFolderName": <null or other subfolders>,
     *          "subFolderName": <null or other subfolders>,
     *          "subFolderName": <null or other subfolders>,
     *          ...
     *       },
     *      "subFolderName" : {
     *          "subFolderName": <null or other subfolders>,
     *          "subFolderName": <null or other subfolders>,
     *          "subFolderName": <null or other subfolders>,
     *          ...
     *       }
     *      ...
     * }
     */
    createFolderTree: function(rootPath, tree) {
        if (!tree || typeof tree !== 'object') {
            throw 'Invalid folder tree specified';
        }
        return _createTree(rootPath, tree);
    }
}

module.exports = mod;
