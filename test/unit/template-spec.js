'use strict';

var _path = require('path');

var _folder = require('../../lib/folder');
var _template = require('../../lib/template');
var _testObj = require('wysknd-test').object;

describe('template: ', function() {
    var ROOT_DIR = _path.join(__dirname, '../..', '.tmp');
    var TARGET_DIR = _path.join(ROOT_DIR, 'app');
    var SCRIPTS_DIR = _path.join(TARGET_DIR, 'scripts');
    var CONTROLLERS_DIR = _path.join(SCRIPTS_DIR, 'controllers');
    var DIRECTIVES_DIR = _path.join(SCRIPTS_DIR, 'directives');
    var TEST_DIR = _path.join(ROOT_DIR, 'test');
    var SPEC_DIR = _path.join(TEST_DIR, 'spec');
    var FUNC_DIR = _path.join(TEST_DIR, 'func');
    var TEMPLATE_DIR = _path.join(ROOT_DIR, 'templates');

    var CONTROLLER_FILE_TEMPLATE = {
        path: _path.join(TEMPLATE_DIR, 'controller-template.js'),
        content: '// TODO: This template needs some content.'
    };
    var CONTROLLER_TEST_TEMPLATE = {
        path: _path.join(TEMPLATE_DIR, 'controller-spec-template.js'),
        content: '// TODO: This template needs some content.'
    };

    it('should expose the the methods required by the interface', function() {
        var errors = _testObj.verifyInterface(_template, {
            'getTemplater': 'function'
        });
        expect(errors).toEqual([]);
    });

    describe('template.getTemplater(): ', function() {
        it('should throw an error if invoked with an incorrect template folder argument', function() {
            var expectedError = 'Invalid template folder specified (arg #1)';

            expect(function() {
                _template.getTemplater();
            }).toThrow(expectedError);

            expect(function() {
                _template.getTemplater({});
            }).toThrow(expectedError);

            expect(function() {
                _template.getTemplater('');
            }).toThrow(expectedError);
        });

        it('should throw an error if invoked with an incorrect target folder argument', function() {
            var templFolder = _folder.createFolder(TEMPLATE_DIR);
            var expectedError = 'Invalid target folder specified (arg #2)';

            expect(function() {
                _template.getTemplater(templFolder);
            }).toThrow(expectedError);

            expect(function() {
                _template.getTemplater(templFolder, {});
            }).toThrow(expectedError);

            expect(function() {
                _template.getTemplater(templFolder, '');
            }).toThrow(expectedError);
        });

        it('should expose methods required by the interface', function() {
            var templFolder = _folder.createFolder(TEMPLATE_DIR);
            var targetFolder = _folder.createFolder(TARGET_DIR);

            var templater = _template.getTemplater(templFolder, targetFolder);
            var errors = _testObj.verifyInterface(templater, {
                'getItemTypes': 'function',
                'getArtifacts': 'function',
                'createItem': 'function'
            });
            expect(errors).toEqual([]);
        });
    });

    describe('template.getTemplater().getItemTypes(): ', function() {
        it('should return an empty array if the templater has been initialized with no item map', function() {
            var templFolder = _folder.createFolder(TEMPLATE_DIR);
            var targetFolder = _folder.createFolder(TARGET_DIR);

            var templater = _template.getTemplater(templFolder, targetFolder);
            expect(templater.getItemTypes()).toEqual([]);
        });

        it('should return an array of item types that the templater has been initialized with', function() {
            var templFolder = _folder.createFolder(TEMPLATE_DIR);
            var targetFolder = _folder.createFolder(TARGET_DIR);

            var templater = _template.getTemplater(templFolder, targetFolder, {
                'controller': {},
                'directive': {},
                'filter': {}
            });

            expect(templater.getItemTypes()).toEqual(['controller', 'directive', 'filter']);
        });
    });

    describe('template.getTemplater().getArtifacts(): ', function() {
        it('should throw an error if invoked with an incorrect item type argument', function() {
            var templFolder = _folder.createFolder(TEMPLATE_DIR);
            var targetFolder = _folder.createFolder(TARGET_DIR);
            var expectedError = 'Invalid item type specified (arg #1)';

            var templater = _template.getTemplater(templFolder, targetFolder);
            expect(function() {
                templater.getArtifacts();
            }).toThrow(expectedError);

            expect(function() {
                templater.getArtifacts({});
            }).toThrow(expectedError);

            expect(function() {
                templater.getArtifacts('');
            }).toThrow(expectedError);
        });
    });
});
