'use strict';

var _path = require('path');
var _fs = require('fs');

var _folder = require('../../lib/folder');
var _testObj = require('wysknd-test').object;
var _testFs = require('wysknd-test').fs;

describe('folder: ', function() {
    // Declaration of file and folder definitions. Nothing is being created
    // now. The creation/deletion of folders will be left to individual
    // tests or beforeEach/afterEach routines.
    var ROOT_DIR = _path.join(__dirname, '../..', '.tmp');
    var APP_DIR = _path.join(ROOT_DIR, 'app');
    var SCRIPTS_DIR = _path.join(APP_DIR, 'scripts');
    var CONTROLLERS_DIR = _path.join(SCRIPTS_DIR, 'controllers');
    var DIRECTIVES_DIR = _path.join(SCRIPTS_DIR, 'directives');
    var TEST_DIR = _path.join(ROOT_DIR, 'test');
    var SPEC_DIR = _path.join(TEST_DIR, 'spec');
    var FUNC_DIR = _path.join(TEST_DIR, 'func');

    var APP_JS = {
        path: _path.join(APP_DIR, 'app.js'),
        content: '// app.js'
    };

    var TEST_CONTROLLER_JS = {
        path: _path.join(CONTROLLERS_DIR, 'test-controller.js'),
        content: '// test-controller.js'
    };

    var TEST_DIRECTIVE_JS = {
        path: _path.join(DIRECTIVES_DIR, 'test-directive.js'),
        content: '// test-directive.js'
    };

    var SYM_LINK = {
        path: _path.join(ROOT_DIR, 'app.js.lnk'),
        linkTo: APP_JS.path
    };

    it('should expose the the methods required by the interface', function() {
        var errors = _testObj.verifyInterface(_folder, {
            'traverse': 'function',
            'createFolder': 'function',
            'createFolderTree': 'function'
        });
        expect(errors).toEqual([]);
    });

    describe('folder.traverse(): ', function() {
        beforeEach(function() {
            _testFs.createFolders(ROOT_DIR,
                APP_DIR,
                SCRIPTS_DIR,
                CONTROLLERS_DIR,
                DIRECTIVES_DIR);

            _testFs.createFiles(APP_JS,
                TEST_CONTROLLER_JS,
                TEST_DIRECTIVE_JS,
                SYM_LINK);
        });

        afterEach(function() {
            _testFs.cleanupFiles(APP_JS,
                TEST_CONTROLLER_JS,
                TEST_DIRECTIVE_JS,
                SYM_LINK);

            _testFs.cleanupFolders(DIRECTIVES_DIR,
                CONTROLLERS_DIR,
                SCRIPTS_DIR,
                APP_DIR,
                ROOT_DIR);
        });

        it('should correctly traverse a nested folder structure.', function(done) {
            var items = {};

            function mapFile(item, level, isFolder) {
                items[item] = {
                    item: item,
                    level: level,
                    isFolder: isFolder
                };
            }
            _folder.traverse(ROOT_DIR, mapFile).success(function() {
                expect(items[APP_DIR]).toEqual({
                    item: APP_DIR,
                    level: 1,
                    isFolder: true
                });
                expect(items[SCRIPTS_DIR]).toEqual({
                    item: SCRIPTS_DIR,
                    level: 2,
                    isFolder: true
                });
                expect(items[CONTROLLERS_DIR]).toEqual({
                    item: CONTROLLERS_DIR,
                    level: 3,
                    isFolder: true
                });
                expect(items[DIRECTIVES_DIR]).toEqual({
                    item: DIRECTIVES_DIR,
                    level: 3,
                    isFolder: true
                });

                expect(items[APP_JS.path]).toEqual({
                    item: APP_JS.path,
                    level: 2,
                    isFolder: false
                });
                expect(items[TEST_CONTROLLER_JS.path]).toEqual({
                    item: TEST_CONTROLLER_JS.path,
                    level: 4,
                    isFolder: false
                });
                expect(items[TEST_DIRECTIVE_JS.path]).toEqual({
                    item: TEST_DIRECTIVE_JS.path,
                    level: 4,
                    isFolder: false
                });
                expect(items[SYM_LINK.path]).toEqual({
                    item: SYM_LINK.path,
                    level: 1,
                    isFolder: false
                });
                done();
            });
        }, 1000);
    });

    describe('folder.createFolder(): ', function() {
        beforeEach(function() {
            _testFs.createFolders(ROOT_DIR,
                APP_DIR,
                SCRIPTS_DIR,
                CONTROLLERS_DIR,
                DIRECTIVES_DIR);

            _testFs.createFiles(APP_JS,
                TEST_CONTROLLER_JS,
                TEST_DIRECTIVE_JS,
                SYM_LINK);
        });

        afterEach(function() {
            _testFs.cleanupFiles(APP_JS,
                TEST_CONTROLLER_JS,
                TEST_DIRECTIVE_JS,
                SYM_LINK);

            _testFs.cleanupFolders(DIRECTIVES_DIR,
                CONTROLLERS_DIR,
                SCRIPTS_DIR,
                SPEC_DIR,
                FUNC_DIR,
                TEST_DIR,
                APP_DIR,
                ROOT_DIR);
        });

        it('should expose the the methods required by the interface', function() {
            var folder = _folder.createFolder('./test');

            var errors = _testObj.verifyInterface(folder, {
                'getName': 'function',
                'getPath': 'function',
                'getAbsolutePath': 'function',
                'addSubFolder': 'function',
                'getSubFolder': 'function',
                'getChildPath': 'function',
                'allFilesPattern': 'function',
                'getStatus': 'function',
                'ensureFolder': 'function',
                'ensureFolderTree': 'function'
            });
            expect(errors).toEqual([]);
        });

        it('should return the folder name of a delimited folder string correctly', function() {
            var folderName = 'd';
            var folderPath = 'a/b/c/';

            var folder = _folder.createFolder(folderPath + folderName);
            expect(folder.getName()).toBe(folderName);

            folder = _folder.createFolder('./');
            expect(folder.getName()).toBe('.');
        });

        it('should return a normalized path for the folder, with trailing "/" characters', function() {
            var folderPath = 'a/b/c/d';
            var expectedPath = 'a/b/c/d/';

            var folder = _folder.createFolder(folderPath);
            expect(folder.getPath()).toBe(expectedPath);

            folder = _folder.createFolder('.');
            expect(folder.getPath()).toBe('./');
        });

        it('should return the absolute path of a folder correctly', function() {
            var folderPath = 'a/b/c/d';
            var expectedPath = _path.join(__dirname, '../..', 'a/b/c/d');

            var folder = _folder.createFolder(folderPath);
            expect(folder.getAbsolutePath()).toBe(expectedPath);
        });

        it('should return a folder object when addSubFolder() is invoked', function() {
            var folderPath = 'a/b/c/d';

            var folder = _folder.createFolder(folderPath);
            var subFolder = folder.addSubFolder('e');

            expect(typeof subFolder).toBe('object');
            var index = subFolder.getPath().indexOf(folder.getPath());
            expect(index).toBe(0);
            index = subFolder.getAbsolutePath().indexOf(folder.getAbsolutePath());
            expect(index).toBe(0);

            // Make sure that the folder and sub folder are of the same type
            // (same methods and properties).
            for (var prop in folder) {
                expect(subFolder[prop]).toBeDefined();
            }
            for (var prop in subFolder) {
                expect(folder[prop]).toBeDefined();
            }
        });

        it('should return a sub folder when getSubFolder() is invoked', function() {
            var folderPath = 'a/b/c/d';

            var folder = _folder.createFolder(folderPath);
            var subFolder = folder.addSubFolder('e');

            var result = folder.getSubFolder('e');

            expect(result).toBe(subFolder);
        });

        it('should return an undefined value when an invalid subfolder is requested', function() {
            var folderPath = 'a/b/c/d';

            var folder = _folder.createFolder(folderPath);
            expect(folder.getSubFolder('bad-folder')).toBeUndefined();
        });

        it('should return the path to the parent folder when getChildPath() is invoked with no or undefined args', function() {
            var folderPath = 'a/b/c/d';
            var expectedPath = 'a/b/c/d/';

            var folder = _folder.createFolder(folderPath);
            var childPath = folder.getChildPath();
            expect(childPath).toBe(expectedPath);
        });

        it('should return a path with the folder as the parent when getChildPath() is invoked', function() {
            var folderPath = 'a/b/c/d';
            var expectedPath = 'a/b/c/d/test.txt';

            var folder = _folder.createFolder(folderPath);
            var childPath = folder.getChildPath('test.txt');
            expect(childPath).toBe(expectedPath);
        });

        it('should transform the file name with token replacement when a token map is passed to getChildPath()', function() {
            var folderPath = 'a/b/c/d';
            var expectedPath = 'a/b/c/d/test123Module.js';

            var folder = _folder.createFolder(folderPath);
            var childPath = folder.getChildPath('${MODULE_NAME}.js', {
                '${MODULE_NAME}': 'test123Module'
            }, true);
            expect(childPath).toBe(expectedPath);
        });

        it('should return expected globbing patterns when allFilesPattern() is invoked', function() {
            var folderPath = 'a/b/c/d';
            var allFilesPattern = 'a/b/c/d/**/*';
            var jsFilesPattern = 'a/b/c/d/**/*.js'

            var folder = _folder.createFolder(folderPath);
            var result = folder.allFilesPattern();
            expect(result).toBe(allFilesPattern);

            var result = folder.allFilesPattern('js');
            expect(result).toBe(jsFilesPattern);
        });

        it('should return valid status values when getStatus() is invoked', function() {
            var imaginaryFolder = _folder.createFolder('/does/not/exist');
            var existingFolder = _folder.createFolder(APP_DIR);
            var file = _folder.createFolder(APP_JS.path);
            var link = _folder.createFolder(SYM_LINK.path);

            expect(imaginaryFolder.getStatus()).toBe('[DOES NOT EXIST]');
            expect(existingFolder.getStatus()).toBe('[DIR]');
            expect(file.getStatus()).toBe('[FILE]');
            expect(link.getStatus()).toBe('[LINK]');
        });

        it('should create a new folder on the file system if one does not exist', function(done) {
            var newFolder = _folder.createFolder(TEST_DIR);

            expect(_fs.existsSync(TEST_DIR)).toBe(false);
            newFolder.ensureFolder().success(function() {
                expect(_fs.existsSync(TEST_DIR)).toBe(true);
                var stats = _fs.lstatSync(TEST_DIR);
                expect(stats.isDirectory()).toBe(true);

                done();
            });
        }, 1000);

        it('should not create any new folders if one already exists.', function(done) {
            var newFolder = _folder.createFolder(TEST_DIR);

            _fs.mkdirSync(TEST_DIR);

            newFolder.ensureFolder().success(function() {
                expect(_fs.existsSync(TEST_DIR)).toBe(true);

                var stats = _fs.lstatSync(TEST_DIR);
                expect(stats.isDirectory()).toBe(true);

                done();
            });
        }, 1000);

        it('should ensure that all folders under the current tree exist on the file system.', function(done) {
            var rootFolder = _folder.createFolder(ROOT_DIR);

            //This should exist on the fs. (beforeEach)
            var appFolder = rootFolder.addSubFolder('app');
            var scriptsFolder = appFolder.addSubFolder('scripts');

            //These are new folders to be created.
            var testFolder = rootFolder.addSubFolder('test');
            var specFolder = testFolder.addSubFolder('spec');
            var funcFolder = testFolder.addSubFolder('func');

            //Initial expectations.
            expect(_fs.existsSync(rootFolder.getPath())).toBe(true);
            expect(_fs.existsSync(appFolder.getPath())).toBe(true);
            expect(_fs.existsSync(scriptsFolder.getPath())).toBe(true);
            expect(_fs.existsSync(testFolder.getPath())).toBe(false);
            expect(_fs.existsSync(specFolder.getPath())).toBe(false);
            expect(_fs.existsSync(funcFolder.getPath())).toBe(false);

            rootFolder.ensureFolderTree().success(function() {
                expect(_fs.existsSync(rootFolder.getPath())).toBe(true);
                expect(_fs.existsSync(appFolder.getPath())).toBe(true);
                expect(_fs.existsSync(scriptsFolder.getPath())).toBe(true);
                expect(_fs.existsSync(testFolder.getPath())).toBe(true);
                expect(_fs.existsSync(specFolder.getPath())).toBe(true);
                expect(_fs.existsSync(specFolder.getPath())).toBe(true);

                done();
            });
        }, 2000);

    });

    describe('folder.createFolderTree(): ', function() {
        it('should initialize a folder tree', function() {
            var root = _folder.createFolderTree('./root', {
                "app": {
                    "scripts": {
                        "controllers": null,
                        "directives": null,
                        "services": null,
                        "filters": null
                    },
                    "styles": null,
                    "views": null
                },
                "test": {
                    "spec": null,
                    "functional": null
                },
                "working": {
                    "build": {
                        ".tmp": null,
                        "scripts": null,
                        "styles": null,
                        "views": null
                    }
                }
            });

            function _verifyFolder(folder, name) {
                expect(folder).toBeDefined();
                expect(folder.getName()).toBe(name);
            }

            _verifyFolder(root, 'root');

            var app = root.getSubFolder('app');
            _verifyFolder(app, 'app');

            var scripts = app.getSubFolder('scripts');
            _verifyFolder(scripts, 'scripts');
            _verifyFolder(scripts.getSubFolder('controllers'), 'controllers');
            _verifyFolder(scripts.getSubFolder('directives'), 'directives');
            _verifyFolder(scripts.getSubFolder('services'), 'services');
            _verifyFolder(scripts.getSubFolder('filters'), 'filters');

            var test = root.getSubFolder('test');
            _verifyFolder(test, 'test');
            _verifyFolder(test.getSubFolder('spec'), 'spec');
            _verifyFolder(test.getSubFolder('functional'), 'functional');

            var working = root.getSubFolder('working');
            _verifyFolder(working, 'working');

            var build = working.getSubFolder('build');
            _verifyFolder(build.getSubFolder('.tmp'), '.tmp');
            _verifyFolder(build.getSubFolder('scripts'), 'scripts');
            _verifyFolder(build.getSubFolder('styles'), 'styles');
            _verifyFolder(build.getSubFolder('views'), 'views');
        });
    });
});
