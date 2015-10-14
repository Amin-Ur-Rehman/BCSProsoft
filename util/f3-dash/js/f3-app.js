/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC", [
        "ui.bootstrap",
        "ui.router",
        "ngCookies",
        "chart.js"
    ]);



    // set height of sidebar dynamically.
    jQuery(function setHeight() {
        //var headerHeight = jQuery('#div__header').outerHeight();
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
            $subMenu.toggle();

            console.log('bindLinks(); // $this:', $this);
            console.log('bindLinks(); // $subMenu:', $subMenu);
        });

        console.log('bindLinks(); // end');
    });


})();
