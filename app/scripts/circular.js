/**
 *  Author: Yi Fan Liao
 *  Date: 2014/5/5
 *  Description: A simple sandbox pattern tryout for building modular apps. Use DI concept to make the code reusable and testable.
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
    // key value pairs of module definitions
    var modules = {};
    // run time module instances
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

    circular.addClass = function (el, className) {
        if (el.classList) {
            el.classList.add(className);
        } else {
            el.className += ' ' + className;
        }
    };

    circular.removeClass = function (el, className) {
        if (el.classList) {
            el.classList.remove(className);
        } else {
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    };

    circular.toggleClass = function (el, className) {
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
    };

    circular.getY = function (element, container) {
        var y = 0;
        while (element && element !== container) {
            y += element.offsetTop;
            element = element.offsetParent;
        }
        return y;
    };

    circular.getX = function (element, container) {
        var x = 0;
        while (element && element !== container) {
            x += element.offsetLeft;
            element = element.offsetParent;
        }
        return x;
    };

    // shallow extend
    circular.extend = function (target, source) {
        // check if source is a object
        target = target || {};

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

    // have to check if this simple q implementation follows the Promise/A+ spec
    circular.Module('q', [function () {
        var q = {};

        function defer() {
            var callbacks = [];
            var resolved;
            // var error;

            return {
                resolve: function (data) {
                    resolved = data;

                    if (callbacks) {
                        for (var i=0; i<callbacks.length; i++) {
                            callbacks[i][0](resolved);
                        }

                        callbacks = undefined;
                    }
                },
                reject: function (error) {

                },
                promise: {
                    then: function (onSuccess, onError) {
                        var deferred = defer();

                        if (callbacks) {
                            callbacks.push([function (resolved) {
                                deferred.resolve(onSuccess(resolved));
                            }, function (error) {
                                deferred.reject(onError(error));
                            }]);
                        // } else if (error) {

                        } else {
                            deferred.resolve(onSuccess(resolved));
                        }

                        return deferred.promise;
                    }
                }
            };
        }

        q.defer = defer;

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
                // console.log(data);
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

})(window, document);