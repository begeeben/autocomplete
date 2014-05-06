/**
 *  Author: Yi Fan Liao
 *  Date: 2014/5/5
 *  Description: A simple sandbox pattern tryout for an autocomplete widget. Use DI concept to make the code reusable and testable.
 */

'use strict';

/**
 *  Usage Example:
 *      circular.Module('newModule', ['ajax', function (ajax) {
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

            for (var i = 0; i < modules[name].length; i++) {
                dependencies.push(getModule(modules[name][i]));
            }
        }

        modulesCache[name] = callback.apply(window, dependencies);
        return modulesCache[name];
    }

    function addClass(el, className) {
        if (el.classList) {
            el.classList.add(className);
        } else {
            el.className += ' ' + className;
        }
    }

    function removeClass(el, className) {
        if (el.classList) {
            el.classList.remove(className);
        } else {
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    function toggleClass(el, className) {
        if (el.classList) {
            el.classList.toggle(className);
        } else {
            var classes = el.className.split(' ');
            var existingIndex = classes.indexOf(className);

            if (existingIndex >= 0) {
                classes.splice(existingIndex, 1);
            } else {
                classes.push(className);
            }

            el.className = classes.join(' ');
        }
    }

    // shallow extend
    circular.extend = function (target, source) {
        // check if source is a object
        // if ()
        for (var prop in source) {
            if (source.hasOwnProperty(prop) && !target[prop]) {
                target[prop] = source[prop];
            }
        }

        return target;
    };

    // module getter/setter
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

            options = circular.extend(options, {async: true});

            function reqListener() {
                var data = this.responseText;
                if (this.getResponseHeader('content-type') === 'application/json') {
                    data = JSON.parse(this.responseText);
                }
                console.log(data);
                deferred.resolve(data);
            }

            var oReq = new XMLHttpRequest();
            oReq.onload = reqListener;
            oReq.open('get', options.url, options.async);
            oReq.send();

            return deferred.promise;
        };

        return ajax;
    }]);

    circular.Module('autocompleteSource', ['q', 'ajax', function (q, ajax) {
        var autocompleteSource = {};
        var cache = {};

        function getSource (options) {
            var deferred = q.defer();

            // options = circular.extend(options, {cache: true});

            if (options.cache && cache[options.url]) {
                deferred.resolve(cache[options.url]);
            } else {
                ajax({url: options.url}).then(function(data) {
                    deferred.resolve(data);
                    cache[options.url] = data;
                });
            }

            return deferred.promise;
        }

        autocompleteSource.getSuggestions = function (options) {
            options = circular.extend(options, {maxSuggestions: 10, cache: true});

            return getSource(options).then(function(data) {

            });
        };

        return autocompleteSource;
    }]);

    // autocomplete view handler
    // handles 
    circular.Module('autocompleteView', ['ajax', function () {
        var autocompleteView = {};
        // // root autocomplete DOM elements
        // var roots = {};
        var autofillDom;
        var suggestionDom;
        var suggestionListDom;
        var parser = new DOMParser();

        function getPlainTextTemplate (options) {
            return ajax({});
        }

        function parseDom (htmlPlainText) {
            var doc = parser.parseFromString(htmlPlainText, "text/html");

            autofillDom = doc.querySelector('.cc-autofill');
            suggestionDom = doc.querySelector('.cc-suggestion');
            suggestionListDom = doc.querySelector('.cc-suggestions');
        }

        autocompleteView.init = function (options) {

            getPlainTextTemplate(options).then(function (data) {
                parseDom(data);

                // get root Dom element
                // roots[options.selector] = ...

                // append initial widget dom elements

                // cache dynamic dom elements

                // return root element
            });
        };

        autocompleteView.appendSuggestions = function (data) {

        };

        return autocompleteView;
    }]);

        var autocomplete = {};

        autocomplete.init = function(options) {

        };

        return autocomplete;
    }]);

})(window, document);