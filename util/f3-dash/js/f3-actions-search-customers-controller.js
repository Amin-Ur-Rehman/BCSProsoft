/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("SearchCustomersController", SearchCustomersController);



    function SearchCustomersController(f3Store, f3Utility, $http) {
        console.log('SearchCustomersController');
             
        var _self = this;
        this.store = f3Store;
        this.customerId = '';
        this.searchCompleted = false;
        var viewModel = this;

        // <jq-grid config="viewModel.customers.config" data="viewModel.customers.data"></jq-grid>
        viewModel.customers = {
            loading: false,
            data: [],
            hasData: !!this.data,
            loadData: function(){

                viewModel.customers.loading = true;
                var apiUrl = location.href.replace(location.hash, '') + '&method=getCustomers';
                apiUrl = f3Utility.updateQS(apiUrl, 'store_id', f3Store.id);

                $http.get(apiUrl)
                    .success(function(response) {
                        console.log('response: ', response);
                        viewModel.customers.loading = false;
                        viewModel.customers.data = response;
                        viewModel.customers.hasData = !!response;
                    });
            }
        };


        this.search = function() {

            _self.searchCompleted = false;

            console.log(this.customerId);
            console.log(_self.customerId);

            var apiUrl = location.href.replace(location.hash, '') +
                '&method=searchCustomer&record_id=' + _self.customerId;

            apiUrl = f3Utility.updateQS(apiUrl, 'store_id', f3Store.id);

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


        viewModel.customers.loadData();

    }



})();
