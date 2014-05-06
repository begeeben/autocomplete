'use strict';

console.log('\'Allo \'Allo!');

circular.Module('ajax')({url: 'dataset/tz.json', async: true})

.then(function (data) {
	console.log('then!!!!!');
	console.log(data);

	return {test: 'success!'};
})

.then(function (data) {
	console.log('then again');
	console.log(data);

	return {test: 'ok!'};
})

.then(function (data) {
	console.log('finally!');
	console.log(data);
});

