'use strict';

var _promise = require('../../lib/promise');
var _testObj = require('wysknd-test').object;

describe('promise: ', function() {
    var def;
    var successCallback;
    var failCallback;
    var doneCallback;

    beforeEach(function() {
        def = _promise.deferred();
        successCallback = jasmine.createSpy('[Success]');
        failCallback = jasmine.createSpy('[Fail]');
        doneCallback = jasmine.createSpy('[Done]');

        def.success(successCallback);
        def.fail(failCallback);
        def.done(doneCallback);
    });

    describe('promise.deferred(): ', function() {

        it('should expose the the methods required by the interface', function() {
            var errors = _testObj.verifyInterface(def, {
                'done': 'function',
                'success': 'function',
                'fail': 'function',
                'resolve': 'function',
                'reject': 'function',
                'promise': 'function',
                'getResolver': 'function',
                'getMultiStepResolver': 'function'
            });
            expect(errors).toEqual([]);
        });

        it('should invoke the success and done callbacks when resolved', function() {
            def.resolve('abc', '123');
            expect(successCallback).toHaveBeenCalledWith('abc', '123');
            expect(failCallback).not.toHaveBeenCalled();
            expect(doneCallback).toHaveBeenCalledWith('abc', '123');
        });

        it('should only invoke callbacks once even when resolved multiple times', function() {
            def.resolve('abc', '123');
            def.resolve('abc', '123');
            def.resolve('abc', '123');

            expect(successCallback).toHaveBeenCalledWith('abc', '123');
            expect(failCallback).not.toHaveBeenCalled();
            expect(doneCallback).toHaveBeenCalledWith('abc', '123');

            expect(successCallback.callCount).toBe(1);
            expect(doneCallback.callCount).toBe(1);
        });

        it('should invoke the fail and done callbacks when rejected', function() {
            def.reject('abc', '123');
            expect(successCallback).not.toHaveBeenCalled();
            expect(failCallback).toHaveBeenCalledWith('abc', '123');
            expect(doneCallback).toHaveBeenCalledWith('abc', '123');
        });

        it('should only invoke callbacks once even when rejected multiple times', function() {
            def.reject('abc', '123');
            def.reject('abc', '123');
            def.reject('abc', '123');

            expect(successCallback).not.toHaveBeenCalled();
            expect(failCallback).toHaveBeenCalledWith('abc', '123');
            expect(doneCallback).toHaveBeenCalledWith('abc', '123');

            expect(failCallback.callCount).toBe(1);
            expect(doneCallback.callCount).toBe(1);
        });

        it('should immdediately invoke a success/done callback if the deferred is already resolved', function() {
            def.resolve('abc', '123');

            var lateSuccess = jasmine.createSpy('[Late Success]');
            var lateFail = jasmine.createSpy('[Late Fail]');
            var lateDone = jasmine.createSpy('[Late Done]');

            def.success(lateSuccess)
                .fail(lateFail)
                .done(lateDone);

            expect(lateSuccess).toHaveBeenCalledWith('abc', '123');
            expect(lateFail).not.toHaveBeenCalled();
            expect(lateDone).toHaveBeenCalledWith('abc', '123');
        });

        it('should immdediately invoke a fail/done callback if the deferred is already rejected', function() {
            def.reject('abc', '123');

            var lateSuccess = jasmine.createSpy('[Late Success]');
            var lateFail = jasmine.createSpy('[Late Fail]');
            var lateDone = jasmine.createSpy('[Late Done]');

            def.success(lateSuccess)
                .fail(lateFail)
                .done(lateDone);

            expect(lateSuccess).not.toHaveBeenCalled();
            expect(lateFail).toHaveBeenCalledWith('abc', '123');
            expect(lateDone).toHaveBeenCalledWith('abc', '123');
        });

        describe('promise.deferred().promise(): ', function() {
            it('should expose methods required by the interface', function() {
                var promise = def.promise();

                //TODO: This test is bogus. Given that the promise is a cloned
                //object, it has no own properties.
                var errors = _testObj.verifyInterface(promise, {
                    'done': 'function',
                    'success': 'function',
                    'fail': 'function',
                    'results': 'function'
                });
                expect(errors).toEqual([]);
            });

            it('should allow callers to listen for resolutions', function() {
                def.promise()
                    .success(successCallback)
                    .fail(failCallback)
                    .done(doneCallback);
                def.resolve('abc', '123');

                expect(successCallback).toHaveBeenCalledWith('abc', '123');
                expect(failCallback).not.toHaveBeenCalled();
                expect(doneCallback).toHaveBeenCalledWith('abc', '123');
            });

            it('should allow callers to listen for rejections', function() {
                def.promise()
                    .success(successCallback)
                    .fail(failCallback)
                    .done(doneCallback);
                def.reject('abc', '123');

                expect(successCallback).not.toHaveBeenCalled();
                expect(failCallback).toHaveBeenCalledWith('abc', '123');
                expect(failCallback).toHaveBeenCalledWith('abc', '123');
            });
        });


        describe('promise.deferred().getResolver(): ', function() {
            it('should be a function', function() {
                var resolver = def.getResolver();

                expect(typeof resolver).toBe('function');
            });

            it('should resolve when the callback is called without an error', function(done) {
                var msg = 'TEST_SUCCESS_MESSAGE';
                var msg2 = 'TEST_SUCCESS_MESSAGE_2';
                var ctx = 'TEST_CONTEXT_VALUE';
                var resolver = def.getResolver(ctx);

                var asyncMethod = function(callback) {
                    setTimeout(function() {
                        callback(null, msg, msg2);
                        expect(successCallback).toHaveBeenCalledWith(ctx, msg, msg2);
                        expect(failCallback).not.toHaveBeenCalled();
                        expect(doneCallback).toHaveBeenCalledWith(ctx, msg, msg2);
                        done();
                    }, 100);
                }
                asyncMethod(resolver);

            }, 1000);

            it('should reject when the callback is called with an error', function(done) {
                var msg = 'TEST_ERROR_MESSAGE';
                var ctx = 'TEST_CONTEXT_VALUE';
                var resolver = def.getResolver(ctx);

                var asyncMethod = function(callback) {
                    setTimeout(function() {
                        callback(msg);
                        expect(successCallback).not.toHaveBeenCalled();
                        expect(failCallback).toHaveBeenCalledWith(ctx, msg);
                        expect(doneCallback).toHaveBeenCalledWith(ctx, msg);
                        done();
                    }, 100);
                }
                asyncMethod(resolver);

            }, 1000);
        });


        describe('promise.deferred().getMultiStepResolver(): ', function() {
            it('should expose methods required by the interface', function() {
                var resolver = def.getMultiStepResolver(5);

                var errors = _testObj.verifyInterface(resolver, {
                    'stepComplete': 'function',
                    'reject': 'function'
                });
                expect(errors).toEqual([]);
            });

            it('should reject immediately when reject() is called', function() {
                var msg = 'TEST_ERROR_MESSAGE';
                var msg2 = 'TEST_ERROR_MESSAGE_2';
                var ctx = 'TEST_CONTEXT_VALUE';
                var resolver = def.getMultiStepResolver(5, ctx);

                resolver.reject(msg, msg2);
                expect(successCallback).not.toHaveBeenCalled();
                expect(failCallback).toHaveBeenCalledWith(ctx, msg, msg2);
                expect(doneCallback).toHaveBeenCalledWith(ctx, msg, msg2);
            });

            it('should resolve immediately if the input count is 0', function() {
                var ctx = 'TEST_CONTEXT_VALUE';
                var resolver = def.getMultiStepResolver(0, ctx);

                expect(successCallback).toHaveBeenCalledWith(ctx);
                expect(failCallback).not.toHaveBeenCalled();
                expect(doneCallback).toHaveBeenCalledWith(ctx);
            });

            it('should resolve only after the specified number of stepComplete() methods are called', function() {
                var msg = 'TEST_SUCCESS_MESSAGE';
                var msg2 = 'TEST_SUCCESS_MESSAGE_2';
                var ctx = 'TEST_CONTEXT_VALUE';

                var stepCount = 5;
                var resolver = def.getMultiStepResolver(stepCount, ctx);

                for (var index = 0; index < stepCount - 1; index++) {
                    resolver.stepComplete();
                    expect(successCallback).not.toHaveBeenCalled();
                    expect(failCallback).not.toHaveBeenCalled();
                    expect(doneCallback).not.toHaveBeenCalled();
                }

                resolver.stepComplete(msg, msg2);
                expect(successCallback).toHaveBeenCalledWith(ctx, msg, msg2);
                expect(failCallback).not.toHaveBeenCalled();
                expect(doneCallback).toHaveBeenCalledWith(ctx, msg, msg2);
            });
        });
    });
});
