/**
 *  Author: Yi Fan Liao
 *  Date: 2014/5/6
 *  Description: Autocomplete modules
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
        getMatches: function (queryString, max) {
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
                        if (matches.indexOf(self.sourceArray[node.ids[j]]) === -1) {
                            matches.push(self.sourceArray[node.ids[j]]);
                        }
                    }
                }
            }

            traverse(node);

            // var i=0, queryChar;
            // while (i<queryString.length && node) {
            //     // depth first search
            //     queryChar = queryString[i].toLowerCase();
            //     // lastNode = node;
            //     node = node.children[queryChar];
            //     i++;
            // }

            // if (node) {
            //     for (var j=0; j<node.ids.length && matches.length < max; j++) {
            //         matches.push(this.sourceArray[node.ids[j]]);
            //     }
            // }
                
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

    autocompleteSource.getSuggestions = function (queryString, max) {
        var deferred = q.defer();

        if (matcherCache[defaultOptions.url]) {
            // console.log('resolve autocompleteSource.getSuggestions promise from cache');
            deferred.resolve(matcherCache[defaultOptions.url].getMatches(queryString, max));
        } else {
            // console.log('set sourcePromise then callback');
            sourcePromise.then(function (matcher) {
                // console.log('resolve autocompleteSource.getSuggestions promise');
                deferred.resolve(matcher.getMatches(queryString, max));
            });
        }

        return deferred.promise;
    };

    // preload default source
    var sourcePromise = getMatcher(defaultOptions);

    return autocompleteSource;
}]);

// main autocomplete widget module
// load autocomplete template
// keeps track of every autocomplete dom elements and events
circular.Module('autocomplete', ['ajax', 'autocompleteSource', function (ajax, autocompleteSource) {

    var autocomplete = {};
    // all autocomplete objects
    var autocompleteList = {};
    // dom template cache
    var inputDom;
    var autofillDom;
    var suggestionDom;
    var suggestionListDom;

    var parser = new DOMParser();

    // should find a way for specifying the template url for async loading
    // or use build tool to integrate the html template in the javascript
    function getPlainTextTemplate (options) {
        return ajax({url: options.url});
    }

    function parseDom (htmlPlainText) {
        var doc = parser.parseFromString(htmlPlainText, 'text/html');

        inputDom = doc.querySelector('.cc-input');
        autofillDom = doc.querySelector('.cc-autofill');
        suggestionDom = doc.querySelector('.cc-suggestion');
        suggestionListDom = doc.querySelector('.cc-suggestions');

        inputDom.removeChild(autofillDom);
        suggestionListDom.removeChild(suggestionDom);

        suggestionListDom.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    }

    function removeSuggestions () {

    }

    // get autocomplete suggestions
    function getSuggestions(queryString) {
        var self = this;
        autocompleteSource.getSuggestions(queryString, this.options.maxSuggestions).then(function (data) {
            updateSuggestions.bind(self)(data);
        });
    }

    // append suggestions onto the widget
    function updateSuggestions(data) {
        var self = this;
        var node;
        // clear suggestions
        suggestionListDom.innerHTML = '';

        if (data) {
            for (var i=0, len=data.length; i<len; i++) {
                // clone suggestion dom
                node = suggestionDom.cloneNode(true);
                node.innerHTML = data[i];
                node.addEventListener('click', function (event) {
                    insertSuggestion.bind(self)(event.target.innerHTML);
                });
                // append to suggestion list
                suggestionListDom.appendChild(node);
            }
            showSuggestions.bind(self)();
        } else {
            circular.addClass(suggestionListDom, 'is-hidden');
            
        }
    }

    // need to check if the div is in the viewport later
    function showSuggestions() {
        if (suggestionListDom) {
            // move it just below the relative input
            var x = circular.getX(this.textarea, document.body);
            var y = circular.getY(this.textarea, document.body);

            suggestionListDom.style.top = y + 28 + 'px';
            suggestionListDom.style.left = x + 5 + 'px';

            circular.removeClass(suggestionListDom, 'is-hidden');
        }
    }

    // fill the value on the left hand side of the textarea
    function insertSuggestion(value) {
        var self = this;
        var node = autofillDom.cloneNode(true);
        node.querySelector('.cc-autofill-text').innerHTML = value;
        node.querySelector('.cc-autofill-remove').addEventListener('click', function (event) {
            // update textarea width
            self.textarea.style.width = self.textarea.offsetWidth + node.offsetWidth + parseInt(getComputedStyle(node).marginLeft) + parseInt(getComputedStyle(node).marginRight) + 'px';
            self.textarea.focus();
            // remove autofill
            self.inputDom.removeChild(node);
            if (self.textarea.value.trim()) {
                showSuggestions.bind(self)();
            }
            event.stopPropagation();
        });
        this.inputDom.insertBefore(node, this.textarea);
        // update textarea width
        this.textarea.style.width = this.textarea.offsetWidth - node.offsetWidth - parseInt(getComputedStyle(node).marginLeft) - parseInt(getComputedStyle(node).marginRight) + 'px';
        this.textarea.value = '';
        this.textarea.focus();
        circular.addClass(suggestionListDom, 'is-hidden');
    }

    function onInput(event) {
        if (this.textarea.value.trim()) {
            getSuggestions.bind(this)(this.textarea.value);
        } else {
            circular.addClass(suggestionListDom, 'is-hidden');
        }        
    }

    // character input event handler
    //
    // should be called using onKeypress.bind(this)()
    //      guess this make it harder to read and maintain in the future...
    //      read: http://stackoverflow.com/a/7688882/1400167
    function onKeypress(event) {
        // var queryString = this.textarea.value;
        var key = event.keyCode || event.which;
        this.queryString += String.fromCharCode(key);

        // console.log(key);
        // console.log(String.fromCharCode(key));
        console.log(this.queryString);
        console.log(document.querySelectorAll('.cc-textarea')[1].value);
        // if (event.which) {
        //     console.log()
        // }

        // update suggestion list
        getSuggestions(this.queryString).then(function(data) {
            console.log(data);
            // appendSuggestions(data);
        });

        // circular.removeClass(suggestionListDom, 'is-hidden');
        showSuggestions.bind(this)();
    }

    // handle backspace and delete
    function onKeydown(event) {
        var key = event.keyCode || event.which;
        // console.log(key);
        // console.log(String.fromCharCode(key));

        if (key === 8) {
            // backspace pressed
            this.queryString = this.queryString.substr(0, this.queryString.length-1);
            console.log(this.queryString);
            console.log(document.querySelectorAll('.cc-textarea')[1].value);
        } else if (key === 46) {
            // delete pressed
            console.log(this.queryString);
        }

    }

    // submit event handler
    function onSubmit() {}

    // validate data
    function validateInput() {}

    var View = function (options) {
        var self = this;
        // Dom caches
        this.root = null;
        this.inputDom = null;
        this.textarea = null;
        this.queryString = '';

        this.options = circular.extend(options, {maxSuggestions: 10, cache: true});

        // get root Dom element
        this.root = document.querySelector(options.selector);
        this.inputDom = inputDom.cloneNode(true);
        this.textarea = this.inputDom.querySelector('.cc-textarea');
        // calculate textarea size

        circular.addClass(this.root, 'cc-autocomplete');
        // append initial widget dom elements
        this.root.appendChild(this.inputDom);

        this.textarea.addEventListener('input', onInput.bind(this));
        // this.textarea.addEventListener('keypress', onKeypress.bind(this));
        // this.textarea.addEventListener('keydown', onKeydown.bind(this));
        this.textarea.addEventListener('click', function (event) {
            if (self.textarea.value.trim()) {
                // update suggestion list
                getSuggestions.bind(self)(self.textarea.value);
                // showSuggestions.bind(self)();
                event.stopPropagation();
            }
        });
    };

    // View.prototype = {
    //     insertSuggestion: function () {},
    //     updateSuggestionList: function () {}
    // };

    // cache dom before usage
    var templatePromise = getPlainTextTemplate({url: 'modules/circular.autocomplete.html'}).then(function (data) {
        parseDom(data);
    });

    autocomplete.init = function(options) {

        // options = circular.extend(options, {maxSuggestions: 10});

        if (!options.selector) {
            throw 'please specify element selector for the autocomplete widget';
        }

        // support selector for multiple elements initialization later

        // check if the selector or element has been initialized

        // maybe cache some dataset first

        // check if template has been loaded
        if (inputDom) {
            autocompleteList[options.selector] = new View(options);
            templatePromise = null;
        } else {
            templatePromise = templatePromise.then(function() {
                autocompleteList[options.selector] = new View(options);

                if (!document.querySelector('.cc-suggestions')) {
                    document.body.appendChild(suggestionListDom);
                }
                    
            });
        }
            
    };

    document.addEventListener('click', function() {
        if (suggestionListDom) {
            circular.addClass(suggestionListDom, 'is-hidden');
        }
    });

    return autocomplete;
}]);