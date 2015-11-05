/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("SearchCustomersController", SearchCustomersController);



    function SearchCustomersController(f3Store, $http) {
        console.log('SearchCustomersController');
             
        var _self = this;
        this.store = f3Store;
        this.customerId = '';
        this.searchCompleted = false;


        this.search = function() {

            _self.searchCompleted = false;

            console.log(this.customerId);
            console.log(_self.customerId);

            var apiUrl = location.href.replace(location.hash, '') +
                '&method=searchCustomer&record_id=' + _self.customerId + '&store_id' + f3Store.id;

            $http.get(apiUrl)
                .success(function(response) {

                    _self.searchCompleted = true;

                    console.log('response: ', response);
                    _self.response = response;

                    if ( response.status === true) {
                        var url_view_event = nlapiResolveURL('RECORD', 'customer', response.data, 'VIEW');
                        _self.navigateUrl = url_view_event;
                    }
                });

        };

    }



})();
