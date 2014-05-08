'use strict';

// console.log('\'Allo \'Allo!');

// circular.Module('ajax')({url: 'dataset/tz.json', async: true})

// .then(function (data) {
// 	console.log('then!!!!!');
// 	console.log(data);

// 	return {test: 'success!'};
// })

// .then(function (data) {
// 	console.log('then again');
// 	console.log(data);

// 	return {test: 'ok!'};
// })

// .then(function (data) {
// 	console.log('finally!');
// 	console.log(data);
// });

// circular.Module('ajax')({url: 'modules/circular.autocomplete.html'});

circular.Module('autocomplete').init({
	selector: '#test'
});

circular.Module('autocomplete').init({
	selector: '#small',
	maxSuggestions: 5
});

circular.Module('autocomplete').init({
	selector: '#large',
	maxSuggestions: 100
});

circular.Module('autocomplete').init({
	selector: '#another-test',
	name: 'customName'
});


circular.Module('autocomplete').init({selector: '#and-another'});

circular.Module('autocomplete').init({selector: '#another'});

circular.Module('autocomplete').init({
	selector: '#stopit',
	name: 'require',
	required: true
});

circular.Module('autocomplete').init({
	selector: '#default',
	text: 'default text'
});

circular.Module('autocomplete').init({
	selector: '#fill',
	text: 'tai'
});

circular.Module('autocomplete').init({
	selector: '#enter',
	text: 'tai'
});

circular.Module('autocomplete').init({
	selector: '#keys'
});