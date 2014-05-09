var _inquirer = require('inquirer');
var _promise = require('./promise');
var _utils = require('./utils');

var SPINNER_STATES = ['[ .    ]',
    '[ ..   ]',
    '[ ...  ]',
    '[ .... ]',
    '[  ... ]',
    '[   .. ]',
    '[    . ]',
    '[      ]'
];
var DONE_MESSAGE = '[ DONE ]';
var FAILED_MESSAGE = '[ FAIL ]';
var mod = {
    /*
     * Uses the inquirer module to prompt the user with the specified
     * questions, and returns a promise that will be resolved when the
     * user interaction is completed.
     */
    ask: function(questions) {
        if (!(questions instanceof Array)) {
            questions = Array.prototype.slice.call(arguments, 0);
        }
        var def = _promise.deferred();

        _inquirer.prompt(questions, function(answers) {
            def.resolve(answers);
        });
        return def.promise();
    },

    /*
     * Creates a progress reporter object that can show in place status updates
     * for multiple asynchronous jobs. These updates are refreshed at periodic
     * intervals.
     */
    createProgressReporter: function(interval, width) {
        var _trackers = [];
        var _interval = interval || 100;
        var _width = width || 80;
        var _bar = null;
        var _intervalState = null;

        // Separator that spans the width of the box.
        var SEPARATOR = (new Array(_width + 1)).join('-');

        //Adjust the width to allow for the status on the right.
        _width = _width - DONE_MESSAGE.length;

        function _showMessage(message) {
            // This behavior is inconsistent. Suppress for now.
            //if (message && _bar) {
            //    _bar.log.write(message);
            //}
        }

        var reporter = {
            /*
             * Adds a tracker to the reporter. The status of this tracker will
             * be reported by the reporter when it has been started.
             */
            addTracker: function(message) {
                var _index = -1;
                var _message = _utils.padRight(message, _width);
                var _status = 'pending';

                var tracker = {
                    /* 
                     * Gets a message associated with the tracker.
                     */
                    getMessage: function() {
                        if (_status === 'pending') {
                            _index = (_index + 1) % SPINNER_STATES.length;
                            return _message + SPINNER_STATES[_index];
                        } else if (_status === 'done') {
                            return _message + DONE_MESSAGE;
                        } else if (_status === 'fail') {
                            return _message + FAILED_MESSAGE;
                        }
                    },

                    /*
                     * Marks the task being tracked as having completed
                     * successfully.
                     */
                    success: function(message) {
                        if (_status === 'pending') {
                            _status = 'done';
                            _showMessage(message);
                        }
                    },

                    /*
                     * Marks the task being tracked as failed.
                     */
                    fail: function() {
                        if (_status === 'pending') {
                            _status = 'fail';
                            _showMessage(message);
                        }
                    },

                    /* 
                     * Determines whether or not the task is still in progress
                     * i.e., done() or fail() have not yet been called.
                     */
                    inProgress: function() {
                        return (_status === 'pending');
                    }
                };

                _trackers.push(tracker);
                return tracker;
            },

            /*
             * Starts the progress reporter, which will show the status of all
             * the trackers, updated at some frequency.
             */
            start: function() {
                if (_intervalState === null) {
                    _bar = new _inquirer.ui.BottomBar();
                    var noTaskCounter = 0;

                    _intervalState = setInterval(function() {
                        var message = SEPARATOR + '\n';
                        var allComplete = true;
                        _trackers.forEach(function(tracker) {
                            message += tracker.getMessage() + '\n';
                            if (tracker.inProgress()) {
                                allComplete = false;
                            }
                        });
                        // If all tasks are complete, and have been that way
                        // for a few of iterations, shut down the reporter.
                        if (allComplete) {
                            noTaskCounter++;
                            if (noTaskCounter > 5) {
                                //Dump out what we have before shutting down.
                                message += SEPARATOR + '\n\n';
                                _bar.updateBottomBar(message);
                                reporter.stop();
                            } else {
                                message += 'checking for other tasks ...\n';
                            }
                        } else {
                            //At least one pending task. Keep updating.
                            _bar.updateBottomBar(message);
                        }
                    }, _interval);
                }
            },

            /*
             * Stops the progress tracker. All progress reports will no longer
             * be shown.
             */
            stop: function() {
                if (_intervalState) {
                    clearInterval(_intervalState);
                    _bar.close();
                    _intervalState = null;
                }
            },

            /*
             * Returns a boolean value that specifies whether or not the tracker
             * has been started.
             */
            hasStarted: function() {
                return !!_intervalState;
            }
        };

        return reporter;
    }
};

module.exports = mod;
