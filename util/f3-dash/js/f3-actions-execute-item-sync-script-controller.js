/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("ExecuteItemSyncScriptController", ExecuteItemSyncScriptController);


    // TODO : need to implement inheritance to prevent duplicate code.
    // TODO : we should also consider moving server calls into separate angular services

    function ExecuteItemSyncScriptController(f3Store, $http, $timeout) {
        console.log('ExecuteItemSyncScriptController');

        var viewModel = this;
        viewModel.loading = false;

        viewModel.hasRecords = true;

        viewModel.hideAlert   = function() {
            viewModel.successMessage = null;
            viewModel.errorMessage = null;
        };

        var _$grid = null;



        viewModel.loadGrid = function(options) {
            console.log('datatype();');
            viewModel.loading = true;

            var apiUrl = location.href.replace(location.hash, '') + '&method=getItemSyncScriptDeploymentInstances';
            $http.get(apiUrl)
                .success(function (response) {
                    viewModel.loading = false;

                    console.log('response: ', response);

                    viewModel.hasRecords = (response || []).length > 0;

                    console.log('viewModel.hasRecords: ', viewModel.hasRecords);

                    if (viewModel.hasRecords === true) {
                        _$grid[0].addJSONData(response);
                    }
                    else {
                        _$grid.clearGridData();
                    }

                });

        };



        function initGrid() {

            _$grid = jQuery("#jqGrid");

            jQuery.jgrid.defaults.width = jQuery('.page-content').outerWidth() + 3;

            _$grid.jqGrid({
                autowidth: true,
                forceFit: true,
                shrinkToFit: true,
                styleUI: 'Bootstrap',
                emptyrecords: "No records to view",
                datatype: function(options){ viewModel.loadGrid(options); },
                idPrefix: 'row_',
                loadui: 'block',
                hoverrows: false,
                pgbuttons: false,
                pgtext: null,
                beforeSelectRow: function (rowid, e) {
                    return false;
                },
                onSelectRow: function () {
                    return false;
                },
                onRightClickRow: function () {
                    _$grid.jqGrid('resetSelection');
                },
                gridComplete: function () {
                    //self.onGridCompleteInner();
                },
                colModel: [
                    {label: 'Sync Start Date', name: 'startdate', width: 35},
                    {label: 'Sync End Date', name: 'enddate', width: 35},
                    {label: 'Status', name: 'status', width: 30},
                    {label: 'Percent Complete', name: 'percentcomplete', width: 150}
                ],
                viewrecords: true, // show records label in footer
                height: '350px',
                rowNum: 1000,
                pager: "#jqGridPager"
            });

        }



        initGrid();

        this.execute = function () {
            viewModel.showLoadingIcon = true;

            var apiUrl = location.href.replace(location.hash, '') + '&method=executeItemSyncScript';
            $http.get(apiUrl)
                .success(function(response) {
                    viewModel.executionStatus = response.status;
                    viewModel.successMessage = response.success;
                    viewModel.errorMessage = response.error;
                    viewModel.showLoadingIcon = false;

                    viewModel.loadGrid();

                    var secondsToHideMessage = 5;
                    $timeout(function(){
                        viewModel.successMessage = null;
                        viewModel.errorMessage = null;
                        viewModel.executionStatus = null;
                    }, secondsToHideMessage * 1000);
                });
        };
    }


})();
