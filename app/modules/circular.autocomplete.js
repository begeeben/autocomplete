/**
 *  Author: Yi Fan Liao
 *  Date: 2014/5/6
 *  Description: Autocomplete module
 *
 *  currently the query for suggestions is performed for the whole text in the textarea
 *  to further enhance performance, queries for suggestions should be able to be performed on the last query
 *  
 */

'use strict';

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
            var target = event.target;

            if (target && target.className === 'cc-suggestion') {
                insertSuggestion.bind(lastView)(target.textContent);
            }

            event.stopPropagation();
        });
    }

    function removeSuggestions () {

    }

    // get autocomplete suggestions
    function getSuggestions(queryString) {
        var self = this;
        autocompleteSource.getSuggestions(queryString, this.options.maxSuggestions, this.filled).then(function (data) {
            updateSuggestions.bind(self)(data);
        });
    }

    // validate data
    function validateInput() {}

    // append suggestions onto the widget
    function updateSuggestions(data) {
        var self = this;
        var node;

        lastView = this;

        // clear suggestions
        suggestionListDom.innerHTML = '';

        if (data) {
            for (var i=0, len=data.length; i<len; i++) {
                // check if the data is already filled
                if (self.filled.indexOf(data[i]) === -1) {
                    // clone suggestion dom
                    node = suggestionDom.cloneNode(true);
                    node.innerHTML = data[i];
                    // append to suggestion list
                    suggestionListDom.appendChild(node);
                }
            }
            if (suggestionListDom.children.length>0) {
                showSuggestions.bind(self)();
            } else {
                hideSuggestions();
            }
            
        } else {
            hideSuggestions();
            
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

    function hideSuggestions() {
        suggestionListDom.innerHTML = '';
        circular.addClass(suggestionListDom, 'is-hidden');
    }

    // fill the value on the left hand side of the textarea
    function insertSuggestion(value) {
        var self = this;
        var node = autofillDom.cloneNode(true);
        self.filled.push(value);
        node.querySelector('.cc-autofill-text').innerHTML = value;
        this.inputDom.insertBefore(node, this.textarea);
        // update textarea width
        this.textarea.style.width = this.textarea.offsetWidth - node.offsetWidth - parseInt(getComputedStyle(node).marginLeft) - parseInt(getComputedStyle(node).marginRight) + 'px';
        this.textarea.value = '';
        this.textarea.setCustomValidity('');
        this.textarea.focus();
        hideSuggestions();

        console.log(self.filled);
    }

    function removeFilled(node) {
        var self = this;
        // update textarea width
        self.textarea.style.width = self.textarea.offsetWidth + node.offsetWidth + parseInt(getComputedStyle(node).marginLeft) + parseInt(getComputedStyle(node).marginRight) + 'px';
        self.textarea.focus();
        // remove autofill
        self.filled.splice(self.filled.indexOf(node.querySelector('.cc-autofill-text').innerHTML), 1);
        self.inputDom.removeChild(node);
        if (self.textarea.value.trim()) {
            getSuggestions.bind(self)(self.textarea.value);
        }

        console.log(self.filled);
    }

    function onInput(event) {
        if (this.textarea.value.trim()) {
            getSuggestions.bind(this)(this.textarea.value);
        } else {
            hideSuggestions();
        }        
    }

    // character input event handler
    //
    // should be called using onKeypress.bind(this)()
    //      guess this make it harder to read and maintain in the future...
    //      read: http://stackoverflow.com/a/7688882/1400167
    // TBC
    function onKeypress(event) {
        // var queryString = this.textarea.value;
        var key = event.keyCode || event.which;
        this.queryString += String.fromCharCode(key);

        // update suggestion list
        getSuggestions(this.queryString);
    }

    // handle backspace and delete
    function onKeydown(event) {
        var key = event.keyCode || event.which;
        var value = this.textarea.value;
        var suggestion = suggestionListDom.querySelector('.cc-suggestion') ? suggestionListDom.querySelector('.cc-suggestion').textContent : '';

        switch (key) {
            // backslash
            case 8:
                if (this.textarea.previousElementSibling && this.textarea.selectionStart === 0) {
                    removeFilled.bind(this)(this.textarea.previousElementSibling);
                    event.preventDefault();
                }
                break;
            // tab
            case 9:
                if (value && suggestion && !value.match(new RegExp(suggestion, 'i'))) {
                    this.textarea.value = suggestion;

                    event.preventDefault();
                }
                break;
            // enter
            case 13:
                if (value && suggestion) {
                    insertSuggestion.bind(this)(suggestion);
                }
                event.preventDefault();
                break;
            // left
            case 37:
                if (this.textarea.previousElementSibling && this.textarea.selectionStart === 0) {
                    this.textarea.previousElementSibling.focus();
                    lastView = this;
                }
                break;
            // down arrow
            case 39:
            case 40:
                if (suggestion) {
                    suggestionListDom.querySelector('.cc-suggestion').focus();
                    lastView = this;
                }
                event.preventDefault();
                break;
        }
    }

    // submit event handler
    function onSubmit() {}

    var View = function (options) {
        var self = this;
        // Dom caches
        this.root = null;
        this.inputDom = null;
        this.textarea = null;
        this.hiddenInput = null;
        this.queryString = '';
        // track filled data
        this.filled = [];

        // this.options = circular.extend(options, {maxSuggestions: 10, cache: true});
        this.options = options;

        // get root Dom element
        this.root = document.querySelector(options.selector);
        this.inputDom = inputDom.cloneNode(true);
        this.textarea = this.inputDom.querySelector('.cc-textarea');

        circular.addClass(this.root, 'cc-autocomplete');
        // append initial widget dom elements
        this.root.appendChild(this.inputDom);

        if (options.required) {
        //     this.textarea.setAttribute('required', true);
            this.textarea.setCustomValidity('required');
        }
        if (options.text.trim()) {
            this.textarea.value = options.text.trim();
        } 
        // this.textarea.setAttribute('name', this.options.name);
        this.hiddenInput = this.textarea.nextElementSibling;
        this.hiddenInput.setAttribute('name', this.options.name);

        this.inputDom.addEventListener('click', function (event) {
            var target = event.target;
            if (target && target.className === 'cc-textarea') {
                if (target.value.trim()) {
                    getSuggestions.bind(self)(self.textarea.value);
                    event.stopPropagation();
                }
            } else if (target && target.className === 'cc-autofill-remove') {
                removeFilled.bind(self)(target.parentNode.parentNode);
                event.stopPropagation();
            }
        });

        this.textarea.addEventListener('input', onInput.bind(this));
        // this.textarea.addEventListener('keypress', onKeypress.bind(this));
        this.textarea.addEventListener('keydown', onKeydown.bind(this));
        this.textarea.addEventListener('keyup', function (event) {
            var isValid = true;
            var errMessage;
            var value = this.value.trim();
            var closestSuggestion = suggestionListDom.querySelector('.cc-suggestion') ? suggestionListDom.querySelector('.cc-suggestion').textContent : '';
            // 1st check if textarea is empty or not, if not is the value match any suggestion
            if (value) {
                // need unicode normalization to fix unicode comparison failed issue
                // http://stackoverflow.com/a/10805884/1400167
                if (closestSuggestion && value.match(new RegExp(closestSuggestion, 'i'))) {
                    // insertSuggestion.bind(self)(closestSuggestion);
                    // this.setCustomValidity('');
                } else {
                    // invalid
                    isValid = false;
                    errMessage = 'no result matches';
                }
            } else if (self.options.required) {
                // 2nd if yes, see if there's any autofill element
                // if no suggestion selected
                if (self.filled.length === 0) {
                    isValid = false;
                    errMessage = 'required';
                }
            }

            this.setCustomValidity(isValid ? '' : errMessage);

        });
        this.textarea.addEventListener('focus', function (event) {
            var value = this.value.trim();
            if (value) {
                getSuggestions.bind(self)(value);
            }
        });
        this.textarea.addEventListener('blur', function (event) {
            var value = this.value.trim();
            var closestSuggestion = suggestionListDom.querySelector('.cc-suggestion') ? suggestionListDom.querySelector('.cc-suggestion').textContent : '';

            if (value && closestSuggestion && value.match(new RegExp(closestSuggestion, 'i'))) {
                insertSuggestion.bind(self)(closestSuggestion);
            }
            // if validated, fill hidden inputs
            if (this.checkValidity) {
                self.hiddenInput.value = self.filled ? self.filled.join(',') : '';
            }

        });

        // better cache forms and event handler
        // var form = findAncestor(this.root, 'FORM');
        // form.addEventListener('submit', function (event) {});
    };

    // cache dom before usage
    var templatePromise = getPlainTextTemplate({url: 'modules/circular.autocomplete.html'}).then(function (data) {
        parseDom(data);
    });

    var initCount = 0;
    // the current autocomplete widget a user is working on
    var lastView;

    autocomplete.init = function(options) {

        options = circular.extend(options, {
            // name: 'cc-auto-' + Object.keys(autocompleteList).length,
            name: 'cc-auto-' + initCount,
            required: false,
            maxSuggestions: 10,
            text: ''
            // cache: true
        });

        if (!options.selector) {
            console.log('please specify element selector for the autocomplete widget');
            return;
        }

        if (!document.querySelector(options.selector)) {
            console.log('no element found');
            return;
        }

        // support selector for multiple elements initialization later

        // check if the selector or element has been initialized

        initCount++;

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
            hideSuggestions();
        }
    });

    document.querySelector('body').addEventListener('keydown', function(event) {
        var key = event.keyCode || event.which;
        var target = event.target;
        
        if (target.className === 'cc-suggestion') {
            switch (key) {
                // tab
                case 9:
                // enter
                case 13:
                    insertSuggestion.bind(lastView)(target.textContent);
                    event.preventDefault();
                    break;
                // esc
                case 27:
                    lastView.textarea.focus();
                    break;
                // up
                case 37:
                case 38:
                    if (target.previousElementSibling) {
                        target.previousElementSibling.focus();
                        event.preventDefault();
                    } else {
                        lastView.textarea.focus();
                        event.preventDefault();
                    }
                    break;
                // down arrow
                case 39:
                case 40:
                    if (target.nextElementSibling) {
                        target.nextElementSibling.focus();
                        event.preventDefault();
                    }
                    break;
            }
            event.stopImmediatePropagation();
        } else if (target.className === 'cc-autofill') {
            switch (key) {
                // backsplash
                case 8:
                // enter
                case 13:
                // delete
                case 46:
                    removeFilled.bind(lastView)(target);
                    event.preventDefault();
                    break;
                // esc
                case 27:
                    lastView.textarea.focus();
                    break;
                // left
                case 37:
                // case 38:
                    if (target.previousElementSibling) {
                        target.previousElementSibling.focus();
                        event.preventDefault();
                    }
                    break;
                // right arrow
                case 39:
                // case 40:
                    if (target.nextElementSibling) {
                        target.nextElementSibling.focus();
                        event.preventDefault();
                    }
                    break;
            }
            event.stopImmediatePropagation();
        }
    });

    return autocomplete;
}]);