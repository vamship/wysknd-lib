/**
 * Middlewares module. Provides middleware functions for connect, used by grunt
 * when serving files in debug mode.
 */
'use strict';

var _fs = require('fs');
var _path = require('path');
var _url = require('url');
var _sass = require('node-sass-wrapper');

var _utils = require('./utils');
var _folder = require('./folder');
var _promise = require('./promise');

var mod = {
    /*
     * Gets an object that can be used to inject resource references into the
     * index.html page. Resources to be injected can be specified as a static
     * list, or as a folder path, which will then be traversed to determine
     * the final list of resources to include.
     */
    getResourceInjectorBuilder: function() {
        var _tokenMap = {};
        var _promises = [];
        return {
            /*
             * Adds a mapping of resources to a specific key, which will be
             * used to determine where in the file the resource references
             * will be injected. The sorter determines the order in which
             * the files will be injected.
             */
            add: function(tokenKey, resources, sorter) {
                var scripts = [];
                var styles = [];

                // Sorter routine to order files in a specific way.
                sorter = sorter || function(first, second) {
                    var firstDepth = first.match(/\//g).length;
                    var secondDepth = second.match(/\//g).length;

                    // If both files have the same depth, then sort
                    // alphabetically. If not, sort by depth (shortest depth
                    // first).
                    if (firstDepth === secondDepth) {
                        return first < second ? -1 : 1;
                    } else {
                        return firstDepth < secondDepth ? -1 : 1;
                    }
                };

                var buildResourceList = _promise.deferred();
                if (typeof resources === 'string') {
                    //Traverse a path to determine scripts and styles.
                    _folder.traverse(resources, function(resource) {
                        if (resource.match(/\.js$/i)) {
                            scripts.push(resource);
                        } else if (resource.match(/\.(css|scss|sass)$/i)) {
                            styles.push(resource);
                        }
                    }).success(function() {
                        buildResourceList.resolve();
                    }).fail(function() {
                        buildResourceList.reject();
                    });
                } else {
                    // Styles and scripts have been provided as hard coded values.
                    scripts = resources.scripts || [];
                    styles = resources.styles || [];
                    buildResourceList.resolve();
                }

                buildResourceList.success(function() {
                    var resourceString = '';

                    // Sort all the styles and scripts if a valid sorter has
                    // been provided.
                    if (typeof sorter === 'function') {
                        styles = styles.sort(sorter);
                        scripts = scripts.sort(sorter);
                    }

                    // Generate link tags.
                    styles.forEach(function(item) {
                        resourceString = resourceString +
                            '<link type="text/css" rel="stylesheet" href="' +
                            item.replace(/\.(scss|sass)$/i, '.css') +
                            '"> ';
                    });

                    // Generate script tags
                    scripts.forEach(function(item) {
                        resourceString = resourceString +
                            '<script type="text/javascript" src="' +
                            item + '"></script>';
                    });

                    //Add an entry into the token map
                    _tokenMap[tokenKey] = resourceString;
                }).fail(function() {
                    resourceString = '<script type="text/javascript">' +
                        'alert("Error determining resources from path: ' +
                        resources + '");</script>';
                    //Add an entry into the token map
                    _tokenMap[tokenKey] = resourceString;
                });

                // Add this to the promises list. This way, we can wait for all
                // promises to be fulfilled before genrating the transformer.
                _promises.push(buildResourceList);
            },

            /*
             * Returns a middleware object that will parse the incoming
             * request, and inject resource references where necessary.
             */
            injector: function() {
                var transformer = null;
                _promise.all(_promises, function() {
                    transform = _utils.getTransformer(_tokenMap, true);
                });

                return function(req, res, next) {
                    var resource = _url.parse(req.originalUrl);
                    var resourcePath = resource.pathname.substring(1);

                    if (resourcePath === '') {
                        resourcePath = 'index.html';
                    }
                    resourcePath = resourcePath.toLowerCase();

                    var fileName = resourcePath.split('/').pop()
                                                          .split('?')[0];
                    if (fileName.match(/\.html?$/i)) {
                        _fs.readFile(resourcePath, function(err, data) {
                            if (!err) {
                                res.writeHead(200, {
                                    'content-type': 'text/html'
                                });
                                res.end(transform(data.toString()));
                            } else {
                                res.writeHead(500, {
                                    'content-type': 'text/plain'
                                });
                                res.end(err);
                            }
                        });
                    } else {
                        next();
                    }
                }

            }
        };
    },

    /*
     * Gets a real time SASS compiler middleware that can be injected into
     * the middleware stack of a connect/express web server.
     */
    getSassCompiler: function(source) {
        return function(req, res, next) {
            var resource = _url.parse(req.originalUrl);
            var resourcePath = resource.pathname.substring(1);

            function compilationComplete(err, data) {
                if (!err) {
                    res.writeHead(200, {
                        'Content-Type': 'text/css'
                    });
                    res.end(data);
                } else {
                    // Something went wrong. Send a 500 error.
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Error processing scss file. ' +
                        'Additional info: ' +
                        err
                    );
                }
            }

            // Only do a compilation if the request was for a file under the
            // source folder. Also note that this middleware should be placed
            // after the middleware that handles actual files that exist on
            // the file system, meaning that the middleware will only get
            // called if an actual file does not exist on the file system.
            if (resourcePath.indexOf(source) === 0) {

                // First try to find a matching file with a .scss extension. If
                // no file exists, try the .sass extension.
                var scssFile = resourcePath.replace(/.css$/, '.scss');
                _fs.exists(scssFile, function(exists) {
                    if (exists) {
                        _sass.compile(scssFile,compilationComplete);
                    } else {
                        _sass.compile(resourcePath.replace(/.css$/, '.sass'),
                                        compilationComplete);
                    }
                });
            } else {
                return next();
            }
        };
    }
};

module.exports = mod;
