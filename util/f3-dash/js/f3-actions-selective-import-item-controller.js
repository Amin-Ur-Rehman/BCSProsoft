/**
 * Created by zshaikh on 10/8/2015.
 */

(function () {

    'use strict';

    angular.module("f3UC")
        .controller("SelectiveImportItemController", SelectiveImportItemController);

    function SelectiveImportItemController(f3Store, $http) {
        console.log('SelectiveImportItemController');

        var viewModel = this;
        this.store = f3Store;
        this.itemId = null;
        this.itemIdentifier = "";
        this.importCompleted = false;

        viewModel.import = function () {
            viewModel.successMessage = '';

            if (!viewModel.itemId ) {
                viewModel.errorCode = 'INVALID_ID';
                viewModel.hasError = true;
                //viewModel.errorMessage = 'invalid product id';
                return;
            }

            if (!viewModel.itemIdentifier) {
                viewModel.errorCode = 'INVALID_IDENTIFIER';
                viewModel.hasError = true;
                //viewModel.errorMessage = 'invalid product id';
                return;
            }



            var apiUrl = location.href.replace(location.hash, '') +
                '&method=selectiveItemImportScript&record_id=' + viewModel.itemId + '&item_identifier=' + viewModel.itemIdentifier + '&store_id=' + f3Store.id;

            viewModel.showLoadingIcon = true;
            $http.get(apiUrl)
                .success(function (response) {
                    viewModel.executionStatus = response.status;
                    viewModel.successMessage = response.success;
                    viewModel.errorMessage = response.error;
                    viewModel.showLoadingIcon = false;
                });

        };
    }

})();


