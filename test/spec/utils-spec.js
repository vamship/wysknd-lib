var _path = require('path');
var _fs = require('fs');
var _stream = require('stream');

var _utils = require('../../lib/utils');
var _testObj = require('wysknd-test').object;
var _testFs = require('wysknd-test').fs;

describe('utils: ', function() {
    it('should expose the the methods required by the interface', function() {
        var errors = _testObj.verifyInterface(_utils, {
            'getAngularJSName': 'function',
            'padRight': 'function',
            'padLeft': 'function',
            'messageCallback': 'function',
            'getTransformer': 'function',
            'transformFile': 'function'
        });
        expect(errors).toEqual([]);
    });

    describe('utils.getAngularJSName(): ', function() {
        it('should return a non string value unchanged', function() {
            var input = {};
            var result = _utils.getAngularJSName(input);
            expect(result).toBe(input);
        });

        it('should return AngularJS compliant string unchanged', function() {
            var compliantModuleName = 'test123Module';
            var result = _utils.getAngularJSName(compliantModuleName);
            expect(result).toBe(compliantModuleName);

            //Make sure that this is case insensitive.
            var nonCompliantModuleName = 'test123module';
            var result2 = _utils.getAngularJSName(nonCompliantModuleName);
            expect(result).toBe(compliantModuleName);
        });

        it('should append "Module" to the end of an otherwise compliant AngularJS string', function() {
            var input = 'test123';
            var result = _utils.getAngularJSName(input);
            expect(result).toBe(input + 'Module');
        });

        it('should append the specified suffix to the end of an otherwise compliant AngularJS string', function() {
            var input = 'test123';
            var suffix = 'App';
            var result = _utils.getAngularJSName(input, suffix);
            expect(result).toBe(input + suffix);;

            var suffix = 'Module';
            result = _utils.getAngularJSName(input, suffix);
            expect(result).toBe(input + suffix);;
        });

        it('should convert a hyphenated string to an AngularJS string', function() {
            var input = 'test-name';
            var angularName = 'testName';
            var suffix = 'App';
            var result = _utils.getAngularJSName(input, suffix);
            expect(result).toBe(angularName + suffix);;

            var suffix = 'Module';
            result = _utils.getAngularJSName(input, suffix);
            expect(result).toBe(angularName + suffix);;
        });
    });

    describe('utils.padRight(): ', function() {
        it('should return an empty string of the specified length if the input is empty', function() {
            var input = '';
            var padSize = 10;
            var padChar = ' ';
            var expected = '          ';

            var result = _utils.padRight(input, padSize);
            expect(result).toBe(expected);
        });

        it('should use the specified character to pad the input', function() {
            var input = '';
            var padSize = 10;
            var padChar = '-';
            var expected = '----------';

            var result = _utils.padRight(input, padSize, padChar);
            expect(result).toBe(expected);
        });

        it('should not pad a string if the max length is less than the string length', function() {
            var input = '1234567890';
            var padSize = 5;

            var result = _utils.padRight(input, padSize);
            expect(result).toBe(input);
        });

        it('should correctly pad a non empty string that is less than the max size', function() {
            var input = '12345';
            var padSize = 10;
            var padChar = '-';
            var expectedRight = input + '-----';

            var result = _utils.padRight(input, padSize, padChar);
            expect(result).toBe(expectedRight);
        });
    });

    describe('utils.padLeft(): ', function() {
        it('should return an empty string of the specified length if the input is empty', function() {
            var input = '';
            var padSize = 10;
            var padChar = ' ';
            var expected = '          ';

            var result = _utils.padLeft(input, padSize);
            expect(result).toBe(expected);
        });

        it('should use the specified character to pad the input', function() {
            var input = '';
            var padSize = 10;
            var padChar = '-';
            var expected = '----------';

            var result = _utils.padLeft(input, padSize, padChar);
            expect(result).toBe(expected);
        });

        it('should not pad a string if the max length is less than the string length', function() {
            var input = '1234567890';
            var padSize = 5;

            var result = _utils.padLeft(input, padSize);
            expect(result).toBe(input);
        });

        it('should correctly pad a non empty string that is less than the max size', function() {
            var input = '12345';
            var padSize = 10;
            var padChar = '-';
            var expectedRight = input + '-----';
            var expectedLeft = '-----' + input;

            var result = _utils.padLeft(input, padSize, padChar);
            expect(result).toBe(expectedLeft);
        });
    });

    describe('utils.getTransformer(): ', function() {
        it('should return a function when invoked.', function() {
            var transform = _utils.getTransformer({}, false);

            expect(typeof transform).toBe('function');
        });

        it('should return an null value if the input is undefined', function() {
            var input = undefined;
            var transform = _utils.getTransformer(null, false);

            expect(transform(input)).toBe(null);
        });

        it('should return the input unaltered if the token map has not been provided', function() {
            var input = 'this is a test';
            var output = '';
            var expected = input;
            var transform = _utils.getTransformer(null, false);

            output = transform(input);
            expect(output).toBe(expected);
        });

        it('should return unaltered content if the token map has no matching tokens', function() {
            var input = 'this is a test';
            var output = '';
            var expected = input;
            var transform = _utils.getTransformer({
                'zzz': 'ZZZ'
            }, false);

            output = transform(input);
            expect(output).toBe(expected);
        });

        it('should replace matching tokens in the input with values from the token map', function() {
            var input = 'this is a test';
            var output = '';
            var expected = 'which was successful';

            var transform = _utils.getTransformer({
                'this': 'which',
                'is a': 'was',
                'test': 'successful'
            }, false);
            output = transform(input);
            expect(output).toBe(expected);
        });

        it('should support regular expressions for tokens', function() {
            var input = 'this is a test';
            var output = '';
            var expected = 'this was a successful test';

            var transform = _utils.getTransformer({
                ' is': ' was',
                '\(test\)$': 'successful $1'
            }, false);
            output = transform(input);
            expect(output).toBe(expected);
        });

        it('should ignore regular expressions when requested', function() {
            var input = 'some cars cost a lot of $$$';
            var output = '';
            var expected = 'some cars cost a lot of money';

            var transform = _utils.getTransformer({
                '$$$': 'money'
            }, true);
            output = transform(input);
            expect(output).toBe(expected);
        });
    });

    describe('utils.transformFile(): ', function() {
        var ROOT_DIR = _path.join(__dirname, '../..', '.tmp');
        var FILE_CONTENTS = 'this is a test';
        var INPUT_FILE = {
            path: _path.join(ROOT_DIR, 'input.txt'),
            contents: FILE_CONTENTS
        }
        var OUTPUT_FILE = {
            path: _path.join(ROOT_DIR, 'output.txt'),
            contents: ''
        }

        beforeEach(function() {
            _testFs.createFolders(ROOT_DIR);
            _testFs.createFiles(INPUT_FILE);
        });

        afterEach(function() {
            _testFs.cleanupFiles(INPUT_FILE);
            _testFs.cleanupFolders(ROOT_DIR);
        });

        function _verifyFile(filePath, contents, done) {
            _fs.readFile(filePath, function(err, data) {
                if (err) {
                    expect(err).toBeUndefined();
                    done();
                } else {
                    expect(data.toString()).toBe(contents);
                    _testFs.cleanupFiles({
                        path: filePath
                    });
                    done();
                }
            });
        }

        it('should throw an error if the source file arg is invalid', function() {
            var error = 'Invalid source file path (arg #1)';

            expect(function() {
                _utils.transformFile();
            }).toThrow(error);
        });

        it('should throw an error if the destination file arg is invalid', function() {
            var error = 'Invalid destination file path (arg #2)';

            expect(function() {
                _utils.transformFile('test.txt');
            }).toThrow(error);
        });

        it('the destination file should be a replica of the source if no transform is passed', function(done) {
            var expectedContents = FILE_CONTENTS;

            _utils.transformFile(INPUT_FILE.path, OUTPUT_FILE.path).success(function() {
                _verifyFile(OUTPUT_FILE.path, expectedContents, done);
            });
        });

        it('the destination file should be transformed according to the transformer if one is passed', function(done) {
            var expectedContents = 'which was successful';

            var transform = function() {
                return expectedContents;
            }

            _utils.transformFile(INPUT_FILE.path, OUTPUT_FILE.path,
                transform).success(function() {
                _verifyFile(OUTPUT_FILE.path, expectedContents, done);
            });
        });
    });

});
