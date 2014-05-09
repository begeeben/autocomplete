/**
 *  Author: Yi Fan Liao
 *  Date: 2014/5/9
 *  Description: Autocomplete source module
 *
 *  currently the query for suggestions is performed for the whole text in the textarea
 *  to further enhance performance, queries for suggestions should be able to be performed on the last query
 *  
 */

'use strict';

// consider to extract the dataset conversion logic out and make it accept a mapping callback for different input formats
// duplicates in source should be removed
// actually matchers could be used as singletons, need to redesign this to make the suggestion source configurable

// although the module is designed to hold multiple suggestion sources
// support for suggestions from multiple sources is TBC
circular.Module('autocompleteSource', ['q', 'ajax', 'trieMatcher', function (q, ajax, matcher) {
    var autocompleteSource = {};
    var defaultOptions = {url: 'dataset/tz.json', maxSuggestions: 10, cache: true};
    // ajax cache... should be moved to ajax module later
    var cache = {};
    // cache of every matcher for each dataset source
    var matcherCache = {};

    function getSource (options) {
        var deferred = q.defer();

        if (options.cache && cache[options.url]) {
            deferred.resolve(cache[options.url]);
        } else {
            ajax({url: options.url}).then(function(data) {
                cache[options.url] = data;
                deferred.resolve(data);
            });
        }

        return deferred.promise;
    }

    function getMatcher (options) {
        return getSource(options).then(function (data) {
            matcherCache[options.url] = matcher.create(circular.extend(options, {plaintext: data}));

            return matcherCache[options.url];
        });
    }

    autocompleteSource.init = function (options) {
        options = circular.extend(options, defaultOptions);

        if (!matcherCache[options.url]) {
            if (sourcePromise) {
                sourcePromise = sourcePromise.then(function (matcher) {
                    if (!matcherCache[options.url]) {
                        getMatcher(options);
                    }
                });
            } else {
                sourcePromise = getMatcher(options);
            }
        }
    };

    // TBC
    autocompleteSource.addSource = function (options) {};

    autocompleteSource.getSuggestions = function (queryString, max, excludeArray) {
        var deferred = q.defer();

        if (matcherCache[defaultOptions.url]) {
            // console.log('resolve autocompleteSource.getSuggestions promise from cache');
            deferred.resolve(matcherCache[defaultOptions.url].getMatches(queryString, max, excludeArray));
        } else {
            // console.log('set sourcePromise then callback');
            sourcePromise.then(function (matcher) {
                // console.log('resolve autocompleteSource.getSuggestions promise');
                deferred.resolve(matcher.getMatches(queryString, max, excludeArray));
            });
        }

        return deferred.promise;
    };

    autocompleteSource.getExactMatch = function (queryString) {
        var deferred = q.defer();

        if (matcherCache[defaultOptions.url]) {
            // console.log('resolve autocompleteSource.getSuggestions promise from cache');
            deferred.resolve(matcherCache[defaultOptions.url].getExactMatch(queryString));
        } else {
            // console.log('set sourcePromise then callback');
            sourcePromise.then(function (matcher) {
                // console.log('resolve autocompleteSource.getSuggestions promise');
                deferred.resolve(matcher.getExactMatch(queryString));
            });
        }

        return deferred.promise;
    };

    // preload default source
    var sourcePromise = getMatcher(defaultOptions);

    return autocompleteSource;
}]);