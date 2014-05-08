/* global describe, it */

(function () {
    'use strict';

    // describe('Give it some context', function () {
    //     describe('maybe a bit more context here', function () {
    //         it('should run here few assertions', function () {

    //         });
    //     });
    // });

    describe('given trieMatcher with data ["Abidjan","Accra","Addis_Ababa","Algiers","Asmara","Bamako","Bangui","Banjul"]', function () {
    	var options = {
    		plaintext: '["Abidjan","Accra","Addis_Ababa","Algiers","Asmara","Bamako","Bangui","Banjul"]',
    	};
    	var matcher = circular.Module('trieMatcher').create(options);

        describe('getMatches("ba")', function () {
        	var matches = matcher.getMatches('ba');

            it('should return a array of 4 items', function () {
            	expect(matches.length).to.equal(4);
            });
        });

        describe('getMatches("aab")', function () {
        	var matches = matcher.getMatches('aab');

        	it('should return null', function () {
        		expect(matches).to.be.null;
        	});
        });
    });
})();
