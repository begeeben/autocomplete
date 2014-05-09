/**
 *  Author: Yi Fan Liao
 *  Date: 2014/5/9
 *  Description: matcher modules
 *
 *  currently the query for suggestions is performed for the whole text in the textarea
 *  to further enhance performance, queries for suggestions should be able to be performed on the last query
 *  
 */

'use strict';

// consider to extract the dataset conversion logic out and make it accept a mapping callback for different input formats
// duplicates in source should be removed
// actually matchers could be used as singletons, need to redesign this to make the suggestion source configurable

// TBC
// Regex based string matching, test plaintext directly using Regex
circular.Module('regexMatcher', [function () {
    var Matcher = function (options) {
        var tempArray;
        this.options = circular.extend(options, {maxSuggestions: 10});

        this.plaintext = options.plaintext;
        // convert the plaintext to array
        // sort the array
        // convert it back to plaintext
        tempArray = JSON.parse(this.plaintext);
        // sort the array
        tempArray.sort();
        this.plaintext = tempArray.join('"');
    };

    Matcher.prototype = {
        getMatches: function (queryString, max) {
            var substrRegex = new RegExp(queryString, 'gi');
            var matches = this.plaintext.match(substrRegex);

            return matches;
        }
    };

    return {
        create: function (options) {
            return new Matcher(options);
        }
    };
}]);

// loop based string matching, less memory space required than the trie based one
// TBC:
//      duplicates
//      modify regex, still buggy
circular.Module('loopMatcher', [function() {
    var Matcher = function (options) {
        this.options = circular.extend(options, {maxSuggestions: 10});

        this.plaintext = options.plaintext;
        this.sourceArray = JSON.parse(this.plaintext);
        // sort the array
        this.sourceArray.sort();
        this.suggested = null;
    };

    Matcher.prototype = {
        getMatches: function (queryString, max) {
            var substrRegex = new RegExp(queryString, 'gi');
            var matches = [];
            var sourceArray = this.sourceArray;

            var i = 0;
            max = max || this.options.maxSuggestions;
            while (i<sourceArray.length && matches.length < max) {
                if (substrRegex.test(sourceArray[i])) {
                    matches.push(sourceArray[i]);
                }
                i++;
            }

            return matches.length > 0 ? matches : null;
        }
    };

    return {
        create: function (options) {
            return new Matcher(options);
        }
    };
}]);

// wonder if this solutions will out perform others: http://stackoverflow.com/a/679017
// trie based string matching, requires more space, should be faster, write speed test later
//
// case insensitive
circular.Module('trieMatcher', [function() {
    function Node () {
        this.ids = [];
        this.children = {};
    }

    var Matcher = function (options) {
        var i, j, len, sourceString, sourceChar, node;

        this.options = circular.extend(options, {maxSuggestions: 10});

        this.plaintext = options.plaintext;
        this.sourceArray = JSON.parse(this.plaintext);
        // sort the array
        this.sourceArray.sort();
        this.suggested = null;

        // construct the trie
        this.trie = new Node();
        for (i=0, len=this.sourceArray.length; i<len; i++) {
            node = this.trie;
            sourceString = this.sourceArray[i];
            for (j=0; j<sourceString.length; j++) {
                sourceChar = sourceString[j].toLowerCase();
                if (!node.children[sourceChar]) {
                    node.children[sourceChar] = new Node();
                }
                node.children[sourceChar].ids.push(i);
                node = node.children[sourceChar];
            }
        }
    };

    Matcher.prototype = {
        getMatches: function (queryString, max, excludeArray) {
            var self = this;
            // var substrRegex = new RegExp(queryString, 'gi');
            var matches = [];
            // var sourceArray = this.sourceArray;
            var node = this.trie;
            // var suggestedIds = [];
            // var nodeStack = [];
            // var i = 0;
            max = max || this.options.maxSuggestions;
            // queryChar = queryString[i].toLowerCase();
            excludeArray = excludeArray || [];

            var nodeQueue = [];
            // breadth first traveral for the search starting node
            function traverse (node) {
                search (queryString, node);

                if (matches.length < max) {
                    for (var key in node.children) {
                        nodeQueue.push(node.children[key]);
                    }

                    if (nodeQueue.length > 0) {
                        traverse(nodeQueue.shift());
                    }
                }
            }

            // depth first search
            function search (queryString, node) {
                var queryChar;
                var i=0;
                while (i<queryString.length && node) {
                    // depth first search
                    queryChar = queryString[i].toLowerCase();
                    // lastNode = node;
                    node = node.children[queryChar];
                    i++;
                }

                if (node) {
                    for (var j=0; j<node.ids.length && matches.length < max; j++) {
                        // check if it's already matched
                        if (matches.indexOf(self.sourceArray[node.ids[j]]) === -1 &&
                            excludeArray.indexOf(self.sourceArray[node.ids[j]]) === -1) {
                            matches.push(self.sourceArray[node.ids[j]]);
                        }
                    }
                }
            }

            traverse(node);
                
            return matches.length > 0 ? matches : null;
        },
        getExactMatch: function (queryString) {

        }
    };

    return {
        create: function (options) {
            return new Matcher(options);
        }
    };
}]);