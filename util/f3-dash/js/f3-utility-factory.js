/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module('f3UC')
        .factory('f3Utility', function ($f3Actions) {

            return {

                qs: function (key) {
                    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
                    var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
                    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
                },
                updateQS: function (uri, key, value) {
                    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
                    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
                    if (uri.match(re)) {
                        return uri.replace(re, '$1' + key + "=" + value + '$2');
                    }
                    else {
                        return uri + separator + key + "=" + value;
                    }
                }

            }

        });

})();
