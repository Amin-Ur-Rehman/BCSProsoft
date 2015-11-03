/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .config(['$f3ActionsProvider', function ($f3ActionsProvider) {


            //
            //
            //$f3ActionsProvider
            //
            //    .state('Import SO', {
            //        title: 'Import Sales Order',
            //        url: "/import-salesorder",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-import-salesorder.html",
            //        controller: 'ImportSalesorderController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //    .state('Export SO', {
            //        title: 'Export Sales Order',
            //        url: "/export-salesorder",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-export-salesorder.html",
            //        controller: 'ExportSalesorderController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //    .state('search-orders', {
            //        group: 'Search',
            //        title: 'Orders',
            //        url: "/orders",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-search-orders.html",
            //        controller: 'SearchOrdersController',
            //        controllerAs: 'viewModel'
            //    })
            //    //.state('search-orders', {
            //    //    group: 'Search',
            //    //    title: 'Orders',
            //    //    action: function () {
            //    //        var url = nlapiResolveURL('SUITELET', 'customscript_f3mg_search_record_suit', 'customdeploy_f3mg_search_record_suit_dep');
            //    //        var anchor = document.createElement('a');
            //    //        anchor.setAttribute('href', url);
            //    //        anchor.setAttribute('target', '_blank');
            //    //        document.body.appendChild(anchor);
            //    //        anchor.click();
            //    //    }
            //    //})
            //
            //    .state('search-customers', {
            //        group: 'Search',
            //        title: 'Customers',
            //        url: "/customers",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-search-customers.html",
            //        controller: 'SearchCustomersController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //    .state('search-credit-memo', {
            //        group: 'Search',
            //        title: 'Credit Memo',
            //        url: "/credit-memo",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-search-credit-memo.html",
            //        controller: 'SearchCreditMemoController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //
            //
            //
            //
            //    .state('synchronize-salesorders', {
            //        group: 'Synchronize',
            //        title: 'Sales Orders',
            //        icon: 'refresh',
            //        url: "/salesorders",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-execute-so-sync-script.html",
            //        controller: 'ExecuteSOSyncScriptController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //    .state('synchronize-items', {
            //        group: 'Synchronize',
            //        title: 'Items',
            //        icon: 'refresh',
            //        url: "/items",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-execute-item-sync-script.html",
            //        controller: 'ExecuteItemSyncScriptController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //    .state('synchronize-cash-refunds', {
            //        group: 'Synchronize',
            //        title: 'Cash Refunds',
            //        icon: 'refresh',
            //        url: "/cash-refunds",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-execute-cash-refund-script.html",
            //        controller: 'ExecuteCashRefundScriptController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //
            //
            //
            //
            //
            //    .state('view-so-sync-logs', {
            //        group: 'View Logs',
            //        title: 'SO Sync',
            //        url: "/so-sync",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-view-so-sync-logs.html",
            //        controller: 'ViewSOSyncLogsController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //    .state('view-fulfilment-sync-logs', {
            //        group: 'View Logs',
            //        title: 'Fulfilment Sync',
            //        url: "/fulfilment-sync",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-view-fulfilment-sync-logs.html",
            //        controller: 'ViewFulfilmentSyncLogsController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //    .state('view-cash-refund-logs', {
            //        group: 'View Logs',
            //        title: 'Cash Refund',
            //        url: "/cash-refund",
            //        templateUrl: f3_base_url + "/f3-dash/templates/actions-view-cash-refund-logs.html",
            //        controller: 'ViewCashRefundLogsController',
            //        controllerAs: 'viewModel'
            //    })
            //
            //
            //    .state('view-scrub', {
            //        title: 'View Scrub',
            //        action: function () {
            //
            //            // create url of list
            //            var url = nlapiResolveURL('RECORD', 'customrecord_fc_scrub');
            //            url = url.replace('custrecordentry', 'custrecordentrylist');
            //
            //            // redirect
            //            var anchor = document.createElement('a');
            //            anchor.setAttribute('href', url);
            //            anchor.setAttribute('target', '_blank');
            //            document.body.appendChild(anchor);
            //            anchor.click();
            //        }
            //    });

        }]);


    angular.module("f3UC")
        .config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise("/");

            $stateProvider

                .state("index", {
                    url: "/",
                    templateUrl: f3_base_url + "/f3-dash/templates/dashboard.html",
                    controller: 'MasterController'
                })

                .state("tables", {
                    url: "/tables",
                    templateUrl: f3_base_url + "/f3-dash/templates/tables.html"
                });

        }]);


})();
