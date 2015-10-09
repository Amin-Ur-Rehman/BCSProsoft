/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .config(['$f3ActionsProvider', function ($f3ActionsProvider) {

            $f3ActionsProvider

                .state('view-scrub', {
                    title: 'View Scrub',
                    action: function () {

                        // create url of list
                        var url = nlapiResolveURL('RECORD', 'customrecord_fc_scrub');
                        url = url.replace('custrecordentry', 'custrecordentrylist');

                        // redirect
                        var anchor = document.createElement('a');
                        anchor.setAttribute('href', url);
                        anchor.setAttribute('target', '_blank');
                        document.body.appendChild(anchor);
                        anchor.click();
                    }
                })






                .state('search-orders', {
                    group: 'Search',
                    title: 'Orders',
                    action: function () {
                        var url = nlapiResolveURL('SUITELET', 'customscript_f3mg_search_record_suit', 'customdeploy_f3mg_search_record_suit_dep');
                        var anchor = document.createElement('a');
                        anchor.setAttribute('href', url);
                        anchor.setAttribute('target', '_blank');
                        document.body.appendChild(anchor);
                        anchor.click();
                    }
                })

                .state('search-customers', {
                    group: 'Search',
                    title: 'Customers',
                    url: "/customers",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-search-customers.html",
                    controller: 'SearchCustomersController',
                    controllerAs: 'viewModel'
                })


                .state('search-credit-memo', {
                    group: 'Search',
                    title: 'Credit Memo',
                    url: "/credit-memo",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-search-credit-memo.html",
                    controller: 'SearchCreditMemoController',
                    controllerAs: 'viewModel'
                })






                .state('execute-so-sync-script', {
                    group: 'Execute Script',
                    title: 'SO Sync',
                    url: "/so-sync",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-execute-so-sync-script.html",
                    controller: 'ExecuteSOSyncScriptController',
                    controllerAs: 'viewModel'
                })


                .state('execute-item-sync-script', {
                    group: 'Execute Script',
                    title: 'Item Sync',
                    url: "/item-sync",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-execute-item-sync-script.html",
                    controller: 'ExecuteItemSyncScriptController',
                    controllerAs: 'viewModel'
                })


                .state('execute-cash-refund-script', {
                    group: 'Execute Script',
                    title: 'Cash Refund',
                    url: "/cash-refund",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-execute-cash-refund-script.html",
                    controller: 'ExecuteCashRefundScriptController',
                    controllerAs: 'viewModel'
                })








                .state('view-so-sync-logs', {
                    group: 'View Logs',
                    title: 'SO Sync',
                    url: "/so-sync",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-view-so-sync-logs.html",
                    controller: 'ViewSOSyncLogsController',
                    controllerAs: 'viewModel'
                })


                .state('view-fulfilment-sync-logs', {
                    group: 'View Logs',
                    title: 'Fulfilment Sync',
                    url: "/fulfilment-sync",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-view-fulfilment-sync-logs.html",
                    controller: 'ViewFulfilmentSyncLogsController',
                    controllerAs: 'viewModel'
                })


                .state('view-cash-refund-logs', {
                    group: 'View Logs',
                    title: 'Cash Refund',
                    url: "/cash-refund",
                    templateUrl: f3_base_url + "/f3-dash/templates/actions-view-cash-refund-logs.html",
                    controller: 'ViewCashRefundLogsController',
                    controllerAs: 'viewModel'
                });

        }]);


    angular.module("f3UC")
        .config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise("/");

            $stateProvider

                .state("index", {
                    url: "/",
                    templateUrl: f3_base_url + "/f3-dash/templates/dashboard.html"
                })

                .state("tables", {
                    url: "/tables",
                    templateUrl: f3_base_url + "/f3-dash/templates/tables.html"
                });

        }]);


})();