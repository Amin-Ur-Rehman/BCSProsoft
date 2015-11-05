/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .config(['$f3ActionsProvider', function ($f3ActionsProvider) {


        }]);


    angular.module("f3UC")
        .config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise("/");

            $stateProvider

                .state("tables", {
                    url: "/tables",
                    templateUrl: f3_base_url + "/f3-dash/templates/tables.html"
                });

        }]);


})();
