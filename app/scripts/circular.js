/**
 *  Author: Yi Fan Liao
 *  Date: 2014/5/5
 *  Description: A simple sandbox pattern tryout for an autocomplete widget. Use DI concept to make the code reusable and testable.
 */

'use strict';

/**
 *  Usage:
 *      circular.Module('newModule', ['ajax', 'repeater', function (ajax, repeater) {
 *          return {
 *              run: function() {}   
 *          };
 *      }]);
 *
 *      circular.Module('newModule').run();
 *
 *  Modules in circular are designed as Singletons.
 *
 *  Modules:
 *
 */

(function(window, document, undefined) {

    var circular = window.circular || (window.circular = {});
    var modules = {};
    var modulesCache = {};

    function getModule(name) {
        var dependencies = [], callback;

        // check if module has been initialized
        if (modulesCache[name]) {
            return modulesCache[name];
        }

        if (modules[name]) {
            callback = modules[name].pop();

            for (var i = modules[name].length - 1; i >= 0; i--) {
                dependencies.push(getModule(modules[name][i]));
            }
        }

        modulesCache[name] = callback.apply(window, dependencies);
        return modulesCache[name];
    }

    circular.Module = function() {
        var args, moduleName, injections;

        args = Array.prototype.slice.call(arguments);

        moduleName = (args[0] && typeof args[0] === 'string') ? args[0] : null;

        if (!moduleName) {
            throw 'please specify module name';
        }

        injections = args.pop();

        // require a module
        if (typeof injections === 'string') {
            return getModule(moduleName);
        }

        // module definition
        modules[moduleName] = injections;
    };

    circular.Module('q', [function () {
        var q = {};

        var Promise = function() {
            this.successCallback = null;
            this.failedCallback = null;
        };

        Promise.prototype = {
            // successCallback: null,
            // failedCallback: null,
            then: function(successCallback, failedCallback) {
                var deferred = new Defer();
                // // implement input check later
                this.successCallback = function (data) {
                    deferred.resolve(successCallback(data));
                };

                // if (this.failedCallback) {
                this.failedCallback = function (error) {
                    deferred.reject(failedCallback(error));
                };
                // }

                return deferred.promise;
            }
        };

        var Defer = function() {
            this.promise = new Promise();
        };

        Defer.prototype = {
            promise: null,
            resolve: function(data) {
                // this.promise.successCallbacks.forEach(function(callback) {
                //     window.setTimeout(function() {
                //         callback(data);
                //     }, 0);
                // });
                if (typeof this.promise.successCallback === 'function') {
                    this.promise.successCallback(data);
                }
            },

            reject: function(error) {
                // this.promise.failedCallbacks.forEach(function(callback) {
                //     window.setTimeout(function() {
                //         callback(error);
                //     }, 0);
                // });
                if (typeof this.promise.failedCallback === 'function') {
                    this.promise.failedCallback(error);
                }
            }
        };

        q.defer = function () {
            return new Defer();
        };

        return q;
    }]);

    circular.Module('ajax', ['q', function (q) {
        var ajax = function (options) {
            var deferred = q.defer();

            function reqListener() {
                var parsed = JSON.parse(this.responseText);
                console.log(parsed);
                deferred.resolve(parsed);
            }

            var oReq = new XMLHttpRequest();
            oReq.onload = reqListener;
            oReq.open('get', options.url, options.async);
            oReq.send();

            return deferred.promise;
        };

        return ajax;
    }]);

    circular.Module('repeater', [function () {
        var repeater = {};

        repeater.constructDom = function (data) {

        };

        return repeater;
    }]);

    circular.Module('autocomplete', ['ajax', 'repeater', function (ajax, repeater) {

        var autocomplete = {};

        autocomplete.init = function(options) {

        };

        return autocomplete;
    }]);

})(window, document);