var _utils = require('../../lib/utils');
var _promise = require('../../lib/promise');
var _interact = require('../../lib/interact');
var _testUtils = require('../test-utils');

describe('interact: ', function() {
    it('should expose the the methods required by the interface', function() {
        _testUtils.verifyInterface(_interact, {
            'ask': 'function',
            'createProgressReporter': 'function'
        });
    });

    describe('interact.ask(): ', function() {
        var fNameQuestion = null;
        var lNameQuestion = null;
        var stateQuestion = null;
        var zipCodeQuestion = null;

        beforeEach(function() {
            fNameQuestion = {
                type: 'input',
                name: 'firstName',
                message: 'What is your first name?'
            };
            lNameQuestion = {
                type: 'input',
                name: 'lastName',
                message: 'What is your last name?'
            };
            stateQuestion = {
                type: 'input',
                name: 'state',
                message: 'Which state do you live in?',
                filter: function(answer) {
                    return answer.toUpperCase();
                }
            };
            zipCodeQuestion = {
                type: 'input',
                name: 'zipCode',
                message: 'What is your zip code?',
                validate: function(answer) {
                    if (!answer.match(/[0-9]{5,}/)) {
                        return 'Please enter a 5 digit zip code.';
                    } else {
                        return true;
                    }
                }
            };

        });

        function _userInput(message) {
            if (typeof message === 'object') {
                for (var prop in message) {
                    process.stdin.push(message[prop] + '\n');
                }
            } else {
                process.stdin.push(message + '\n');
            }
        }

        it('should accept questions in the form of an array, and return answers on success', function(done) {
            var expectedAnswers = {
                'firstName': 'John',
                'lastName': 'Doe'
            };

            _interact.ask([fNameQuestion, lNameQuestion]).success(function(answers) {
                expect(answers).toEqual(expectedAnswers);
                done();
            });
            _userInput(expectedAnswers);
        });

        it('should prompt the users for multiple questions, and return answers on success', function(done) {
            var expectedAnswers = {
                'firstName': 'John',
                'lastName': 'Doe'
            };

            _interact.ask(fNameQuestion, lNameQuestion).success(function(answers) {
                expect(answers).toEqual(expectedAnswers);
                done();
            });
            _userInput(expectedAnswers);
        });

        it('should modify a user input according to filter rules', function(done) {
            var expectedAnswers = {
                'state': 'MA'
            };

            _interact.ask(stateQuestion).success(function(answers) {
                expect(answers).toEqual(expectedAnswers);
                done();
            });
            _userInput('ma');
        });

        it('should reject an invalid input from the user', function(done) {
            var expectedAnswers = {
                'zipCode': '02201'
            };

            _interact.ask(zipCodeQuestion).success(function(answers) {
                expect(answers).toEqual(expectedAnswers);
                done();
            });
            _userInput('Boston');
            _userInput(expectedAnswers);
        });
    });


    describe('interact.createProgressReporter(): ', function() {
        var reporter;
        beforeEach(function() {
            reporter = _interact.createProgressReporter();
        });

        afterEach(function() {
            // Clean up.
            reporter.stop();
        });
        it('should expose all methods required by the interface', function() {
            _testUtils.verifyInterface(reporter, {
                'addTracker': 'function',
                'start': 'function',
                'stop': 'function',
                'hasStarted': 'function'
            });
        });

        //TODO: This needs to be worked out. We need some way to check stdout and
        // see if data is being written there correctly.
        xdescribe('interact.createProgressReporter().start(): ', function() {
            it('should repeatedly report progress status when started', function(done) {
                var tracker = reporter.addTracker('[01] Performing step #1');
                var count = 0;
                var oldWrite = process.stdout.write;
                setTimeout(function() {
                    process.stdout.write = function(data, encoding, fd) {
                        console.error('>>>>>' + data + '<<<<<<');
                        //oldWrite.apply(process.stdout, arguments);
                        process.stdout.write = oldWrite;

                        done();
                        //process.stdout.write = oldWrite;
                    };
                }, 00);
                reporter.start();
            }, 2000);
        });

        describe('interact.createProgressReporter().hasStarted(): ', function() {

            it('should return false when invoked before the reporter has been started', function() {
                expect(reporter.hasStarted()).toBe(false);
            });

            it('should return true when invoked after the reporter has been started', function() {
                expect(reporter.hasStarted()).toBe(false);
                reporter.start();
                expect(reporter.hasStarted()).toBe(true);
            });

            it('should return false when invoked after the reporter has been stopped', function() {
                expect(reporter.hasStarted()).toBe(false);
                reporter.start();
                expect(reporter.hasStarted()).toBe(true);
                reporter.stop();
                expect(reporter.hasStarted()).toBe(false);
            });
        });


        describe('interact.createProgressReporter().track(): ', function() {
            it('should expose all methods required by the interface', function() {
                var tracker = reporter.addTracker();
                _testUtils.verifyInterface(tracker, {
                    'getMessage': 'function',
                    'success': 'function',
                    'fail': 'function',
                    'inProgress': 'function'
                });
            });

            it('should return a status message with ellipsis when the task is still pending', function() {
                var message = 'Task #1';
                var spinner = ['[ .    ]',
                    '[ ..   ]',
                    '[ ...  ]',
                    '[ .... ]',
                    '[  ... ]',
                    '[   .. ]',
                    '[    . ]',
                    '[      ]'
                ];
                var tracker = reporter.addTracker(message);
                var index = 0;
                spinner.forEach(function(item) {
                    var expected = _utils.padRight(message, 72) + spinner[index++];
                    expect(tracker.getMessage()).toBe(expected);
                });
            });

            it('should return a status message with "DONE" when the task has completed successfully', function() {
                var message = 'Task #1';
                var expected = _utils.padRight(message, 72) + '[ DONE ]';
                var tracker = reporter.addTracker(message);
                tracker.success();
                expect(tracker.getMessage()).toBe(expected);
            });

            it('should return a status message with "FAIL" when the task has failed', function() {
                var message = 'Task #1';
                var expected = _utils.padRight(message, 72) + '[ FAIL ]';
                var tracker = reporter.addTracker(message);
                tracker.fail();
                expect(tracker.getMessage()).toBe(expected);
            });

            it('should return inProgress() == true when the task has not yet been completed/failed', function() {
                var message = 'Task #1';
                var tracker = reporter.addTracker(message);
                expect(tracker.inProgress()).toBe(true);
            });

            it('should return inProgress() == false when the task has completed successfully', function() {
                var message = 'Task #1';
                var tracker = reporter.addTracker(message);
                tracker.success();
                expect(tracker.inProgress()).toBe(false);
            });

            it('should return inProgress() == true when the task has failed', function() {
                var message = 'Task #1';
                var tracker = reporter.addTracker(message);
                tracker.fail();
                expect(tracker.inProgress()).toBe(false);
            });
        });
    });
});
