/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("SearchOrdersController", SearchOrdersController);

    function SearchOrdersController(f3Store, $http) {
        console.log('SearchMagentoOrdersController');

        
        var _self = this;
        var viewModel = this;
        this.store = f3Store;
        this.salesorderId = '';
        this.searchCompleted = false;



        // <jq-grid config="viewModel.salesorders.config" data="viewModel.salesorders.data"></jq-grid>
        viewModel.salesorders = {
            loading: false,
            data: [],
            hasData: !!this.data,
            loadData: function(){

                viewModel.salesorders.loading = true;
                var apiUrl = location.href.replace(location.hash, '') + '&method=getSalesOrders';
                $http.get(apiUrl)
                    .success(function(response) {
                        console.log('response: ', response);
                        viewModel.salesorders.loading = false;
                        viewModel.salesorders.data = response;
                        viewModel.salesorders.hasData = !!response;
                    });
            }
        };


        this.search = function() {

            _self.searchCompleted = false;

            console.log(this.salesorderId);
            console.log(_self.salesorderId);

            var apiUrl = location.href.replace(location.hash, '') +
                '&method=searchSalesOrder&record_id=' + _self.salesorderId + '&store_id' + f3Store.id;

            $http.get(apiUrl)
                .success(function(response) {

                    _self.searchCompleted = true;

                    console.log('response: ', response);
                    _self.response = response;

                    if ( response.status === true) {
                        var url_view_event = nlapiResolveURL('RECORD', 'salesorder', response.data, 'VIEW');
                        _self.navigateUrl = url_view_event;
                    }
                });

        };



        viewModel.salesorders.loadData();

    }

})();
