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
        // options = circular.extend(options, {maxSuggestions: 10, cache: true});

        return getSource(options).then(function(data) {
            // filter suggestions according to input
        });
    };

    return autocompleteSource;
}]);

// main autocomplete widget module
// keeps track of every autocomplete dom elements and input events
circular.Module('autocomplete', ['ajax', 'autocompleteSource', function (ajax, autocompleteSource) {

    var autocomplete = {};
    // all autocomplete objects
    var autocompleteList = {};

    var inputDom;
    var autofillDom;
    var suggestionDom;
    var suggestionListDom;

    var parser = new DOMParser();

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
        // console.log(doc);
        // console.log(inputDom);
        // console.log(autofillDom);
        // console.log(suggestionDom);
        // console.log(suggestionListDom);

        suggestionListDom.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    }

    function removeSuggestions () {

    }

    // get autocomplete suggestions
    function getSuggestions(options) {
        return autocompleteSource.getSuggestions(options);
    }

    // append suggestions onto the widget
    function appendSuggestions(data) {

    }

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

    // character input event handler
    function onInput() {

        // circular.removeClass(suggestionListDom, 'is-hidden');
        showSuggestions.bind(this)();

        // update suggestion list
        // getSuggestions(options).then(function(data) {
        //     appendSuggestions(data);
        // });
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
        // this.suggestionList = null;

        this.options = circular.extend(options, {maxSuggestions: 10, cache: true});

        this.root = document.querySelector(options.selector);
        this.inputDom = inputDom.cloneNode(true);
        this.textarea = this.inputDom.querySelector('.cc-textarea');
        circular.addClass(this.root, 'cc-autocomplete');
        this.root.appendChild(this.inputDom);


        // get root Dom element
        // roots[options.selector] = ...
        // append initial widget dom elements

        this.textarea.addEventListener('keydown', onInput.bind(this));
        this.textarea.addEventListener('click', function (event) {
            if (self.textarea.value.trim()) {
                // update suggestion list

                showSuggestions.bind(self)();
                event.stopPropagation();
            }
        });
    };

    View.prototype = {
        insertSuggestion: function () {},
        updateSuggestionList: function () {}
    };

    // cache dom before usage
    var templatePromise = getPlainTextTemplate({url: 'modules/circular.autocomplete.html'}).then(function (data) {
        parseDom(data);
    });

    autocomplete.init = function(options) {

        // options = circular.extend(options, {maxSuggestions: 10});

        if (!options.selector) {
            throw 'please specify element selector for the autocomplete widget';
        }

        // support multiple elements initialization later

        // check if the selector or element has been used

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

        document.addEventListener('click', function() {
            circular.addClass(suggestionListDom, 'is-hidden');
        });
            
    };

    return autocomplete;
}]);