/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module('f3UC', [
        'ui.bootstrap',
        'ui.router',
        'ngCookies',
        'chart.js',
        'ngAnimate'
    ]);



    angular.module("f3UC").directive('ngEnter', function NgEnterDirective() {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    });



    angular.module("f3UC").directive('jqGrid', function () {
        return {
            restrict: 'E',
                scope: {
                config: '=',
                data: '=',
            },
            link: function (scope, element, attrs) {
                var table;

                scope.$watch('config', function (newValue) {
                  element.children().empty();
                  table = angular.element('<table></table>');
                  table[0].id = 'jqtable_' + (new Date()).getTime();
                  element.append(table);

                  newValue = newValue || {};

                  $(table).jqGrid(newValue);
                });

                scope.$watch('data', function (newValue, oldValue) {
                    
                    if(newValue && newValue.length > 0) {
                        $(table)[0].addJSONData(newValue);
                    }
                    else {
                        $(table).clearGridData();
                    }
                });
            }
        };
    });

    

    // set height of sidebar dynamically.
    jQuery(function setHeight() {
        var headingHeight = jQuery('.uir-page-title').parent().outerHeight();
        var documentHeight = jQuery(document.body).height();
        var sidebarHeight = documentHeight - headingHeight;
        jQuery('.sidebar').height(sidebarHeight + 'px');
    });


    // set height of sidebar dynamically.
    jQuery(function bindLinks() {
        console.log('bindLinks(); // start');
        //var headerHeight = jQuery('#div__header').outerHeight();
        var $sidebar = jQuery('.sidebar');
        $sidebar.on('click', 'a.submenu-link', function() {

            console.log('bindLinks(); // click');
            var $this = jQuery(this);
            var $subMenu = $this.next();
            $subMenu.toggle(200);
            $this.find('.menu-icon').toggleClass('fa-minus').toggleClass('fa-plus');

            console.log('bindLinks(); // $this:', $this);
            console.log('bindLinks(); // $subMenu:', $subMenu);
        });

        console.log('bindLinks(); // end');
    });



    google.load("visualization", "1", {packages:["corechart"]});


})();
