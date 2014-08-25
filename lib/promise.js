/**
 * Promises module. Provides support for jQuery like promises.
 */
'use strict';

var STATUS_PENDING = 'pending';
var STATUS_SUCCESS = 'success';
var STATUS_FAIL = 'fail';
var RESULT_TYPE_DONE = 'done';

module.exports = {
    /* 
     * Monitors an array of promises, and triggers a callback when all
     * of the promises in the array are resolved.
     */
    all: function(promises, callback) {
        function _checkComplete() {
            if (successfulPromises.length + failedPromises.length === count) {
                if (typeof callback === 'function') {
                    callback(successfulPromises, failedPromises);
                }
            }
        };

        var successfulPromises = [];
        var failedPromises = [];

        if (promises instanceof Array) {
            var count = promises.length;
            if(count === 0) {
                // There are no promises. Just resolve and return.
                _checkComplete();
                return;
            }

            promises.forEach(function(item) {
                // Register a callback to track all successful and failed 
                // promises.
                item.success(function() {
                    successfulPromises.push(item);
                    _checkComplete();
                });
                item.fail(function() {
                    failedPromises.push(item);
                    _checkComplete();
                });
            });
        } else {
            throw 'Invalid argument: promises. Must be an array';
        }
    },

    /* 
     * Creates a new deferred object that follows the promise pattern.
     */
    deferred: function() {
        var _status = STATUS_PENDING;
        var _args;
        var _callbacks = {
            success: [],
            fail: [],
            done: []
        };

        function _registerCallback(resultType, callback) {
            if (typeof callback !== 'function') {
                //Invalid input args. Throw an error.
                throw 'Invalid argument: callback. Must be a function.';
            }

            if (_status !== STATUS_PENDING) {
                if (_status === resultType || resultType === RESULT_TYPE_DONE) {
                    // Promise has already been satisfied. Just invoke the
                    // callback.
                    callback.apply(null, _args);
                }
            } else {
                // Promise has not yet been satisfied. Remember it, and
                // invoke when ready.
                _callbacks[resultType].push(callback);
            }
        }

        function _satisfy(resultType, args) {
            if (_status !== STATUS_PENDING) {
                return;
            }
            _args = args;
            _status = resultType;

            function doCallback(item, index) {
                item.apply(null, _args);
            }

            //Trigger any callbacks that have been queued.
            _callbacks[resultType].forEach(doCallback);
            _callbacks.done.forEach(doCallback);

            //Clear out any callback references.
            _callbacks.succes = [];
            _callbacks.fail = [];
            _callbacks.done = [];
        }

        var _promise = {
            /*
             * Invoked to allow callers to register callbacks that will be
             * triggered on completion of the deferred activity. This callback
             * will be triggered whether or not the completion was successful.
             */
            done: function(callback) {
                _registerCallback(RESULT_TYPE_DONE, callback);
                return (_promise);
            },

            /*
             * Invoked to allow callers to register callbacks that will be
             * triggered on successful completion of the deferred activity.
             */
            success: function(callback) {
                _registerCallback(STATUS_SUCCESS, callback);
                return (_promise);
            },

            /*
             * Invoked to allow callers to register callbacks that will be
             * triggered on unsuccessful completion of the deferred activity.
             */
            fail: function(callback) {
                _registerCallback(STATUS_FAIL, callback);
                return (_promise);
            },

            /* 
             * Returns the results returned by the deferred activity.
             */
            results: function() {
                return _args;
            }
        }

        var deferredObject = {
            /*
             * Allows a callback to be registered that will be called once the
             * deferred has been resolved or rejected.
             */
            done: _promise.done,

            /*
             * Allows a callback to be registered that will be called once the
             * deferred has been resolved.
             */
            success: _promise.success,

            /*
             * Allows a callback to be registered that will be called once the
             * deferred has been rejected.
             */
            fail: _promise.fail,

            /*
             * Fulfills the promise by resolving it.
             */
            resolve: function() {
                _satisfy(STATUS_SUCCESS, Array.prototype.slice.call(arguments, 0));
            },

            /*
             * Fulfills the promise by rejecting it.
             */
            reject: function() {
                _satisfy(STATUS_FAIL, Array.prototype.slice.call(arguments, 0));
            },

            /*
             * Gets a promise associated with the deferred object.
             */
            promise: function() {
                return Object.create(_promise);
            },

            /*
             * Generates a callback that resolves/rejects the deferred object
             * based on the success/failure of an operation, determined by the
             * first argument in.
             */
            getResolver: function() {
                var ctxArgs = Array.prototype.slice.call(arguments, 0);
                return function(err, data) {
                    if (!err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        deferredObject.resolve.apply(null,
                            ctxArgs.concat(args));
                    } else {
                        deferredObject.reject.apply(null,
                            ctxArgs.concat([err]));
                    }
                };
            },

            /*
             * Generates a callback that resolves/rejects the deferred after a
             * specified number of steps have been completed, indicated by the
             * invocation of stepComplete().
             */
            getMultiStepResolver: function(count) {
                var _count = count;
                var ctxArgs = Array.prototype.slice.call(arguments, 1);

                // If the step count is zero, resolve immediately.
                if (_count === 0) {
                    deferredObject.resolve.apply(null, ctxArgs);
                }

                return {
                    /*
                     * Indicates that a specific step was completed. The
                     * promise will be treated as resolved if this method
                     * is invoked a given number of times.
                     */
                    stepComplete: function() {
                        var ca
                        _count--;
                        if (_count === 0) {
                            var args = Array.prototype.slice.call(arguments, 0);
                            deferredObject.resolve.apply(null,
                                ctxArgs.concat(args));
                        }
                    },

                    /*
                     * Rejects the deferred object without waiting for any
                     * further processing.
                     */
                    reject: function() {
                        var args = Array.prototype.slice.call(arguments, 0);
                        deferredObject.reject.apply(null, ctxArgs.concat(args));
                    }
                }
            }
        };

        return deferredObject;
    }
};


//function _wrapCallback(callback, deferred) {
//    return function() {
//        try {
//            var ret = callback.apply(null, arguments);
//            if (false) { //Check here if the return is another deferred.
//                ret.success(function() {
//                    deferred.resolve.apply(deferred, arguments);
//                });
//                ret.fail(function() {
//                    deferred.reject.apply(deferred, arguments);
//                });
//            } else {
//                deferred.resolve(ret);
//            }
//        } catch (err) {
//            deferred.reject(err);
//        }
//    };
//}
