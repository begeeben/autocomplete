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

        });
    };

    return autocompleteSource;
}]);

// // autocomplete view handler
// // handles 
// circular.Module('autocompleteView', ['ajax', function () {
//     var autocompleteView = {};
//     // // root autocomplete DOM elements
//     // var roots = {};
//     var autofillDom;
//     var suggestionDom;
//     var suggestionListDom;
//     var parser = new DOMParser();

//     function getPlainTextTemplate (options) {
//         return ajax({});
//     }

//     function parseDom (htmlPlainText) {
//         var doc = parser.parseFromString(htmlPlainText, "text/html");

//         autofillDom = doc.querySelector('.cc-autofill');
//         suggestionDom = doc.querySelector('.cc-suggestion');
//         suggestionListDom = doc.querySelector('.cc-suggestions');
//     }

//     function removeSuggestions (root) {

//     }

//     autocompleteView.init = function (options) {

//         getPlainTextTemplate(options).then(function (data) {
//             parseDom(data);

//             // get root Dom element
//             // roots[options.selector] = ...

//             // append initial widget dom elements

//             // cache dynamic dom elements

//             // return root element
//         });
//     };

//     autocompleteView.appendSuggestions = function (root) {

//     };

//     return autocompleteView;
// }]);

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

        console.log(doc);
        console.log(inputDom);
        console.log(autofillDom);
        console.log(suggestionDom);
        console.log(suggestionListDom);
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

    // character input event handler
    function onInput() {


        getSuggestions(options).then(function(data) {
            appendSuggestions(data);
        });
    }

    // submit event handler
    function onSubmit() {}

    // validate data
    function validateInput() {}

    var View = function (options) {
        // Dom caches
        this.root = null;
        this.autofill = null;
        this.textarea = null;
        this.suggestionList = null;

        this.options = circular.extend(options, {maxSuggestions: 10, cache: true});

        this.root = document.querySelector(options.selector);
        circular.addClass(this.root, 'cc-autocomplete');
        this.root.appendChild(inputDom.cloneNode(true));
        this.root.appendChild(suggestionListDom.cloneNode(true));

        // get root Dom element
        // roots[options.selector] = ...
        // append initial widget dom elements

        // this.textarea.addEventListener('', onInput);
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
        templatePromise.then(function() {
            autocompleteList[options.selector] = new View(options);
        });
            
    };

    return autocomplete;
}]);