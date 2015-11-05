/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("ExportSalesorderController", ExportSalesorderController);

    function ExportSalesorderController(f3Store, $http) {
        console.log('ExportSalesorderController');

        var viewModel = this;
        this.store = f3Store;
        this.salesorderId = null;
        this.exportCompleted = false;

        viewModel.export = function() {

            if ( !viewModel.salesorderId) {
                viewModel.executionStatus = 'INVALID_ID';
                viewModel.successMessage = '';
                viewModel.errorMessage = 'invalid sales order id';
                return;
            }


            var apiUrl = location.href.replace(location.hash, '') +
                '&method=exportSalesOrder&record_id=' + viewModel.salesorderId + '&store_id' + f3Store.id;

            viewModel.showLoadingIcon = true;
            $http.get(apiUrl)
                .success(function(response) {
                    viewModel.executionStatus = response.status;
                    viewModel.successMessage = response.success;
                    viewModel.errorMessage = response.error;
                    viewModel.showLoadingIcon = false;
                });

        };
    }

})();


