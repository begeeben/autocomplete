'use strict';

console.log('\'Allo \'Allo!');

circular.Module('ajax')({url: 'dataset/tz.json', async: true}).then(function (data) {
	console.log('then!!!!!');
	console.log(data);
});