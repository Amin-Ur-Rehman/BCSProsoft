/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("ViewCashRefundLogsController", ViewCashRefundLogsController);


    function ViewCashRefundLogsController(f3Store, $http) {
        console.log('ViewCashRefundLogsController');

        var $grid = null;
        var viewModel = this;
        viewModel.hasRecords = true;


        viewModel.filters = {
            startDate: null,
            endDate: null,
            logType: ''
        };


        viewModel.filter = function() {
            viewModel.loadGrid();
        };


        viewModel.loadGrid = function(options) {  
            console.log('datatype();');

            var apiUrl = location.href.replace(location.hash, '') + '&method=getCashRefundSyncLogs';

            apiUrl = apiUrl + '&logType=' + (viewModel.filters.logType||'');    
            apiUrl = apiUrl + '&startDate=' + (viewModel.filters.startDate||'');
            apiUrl = apiUrl + '&endDate=' + (viewModel.filters.endDate||'');

            $http.get(apiUrl)
                .success(function(response) {

                    console.log('response: ', response);

                    viewModel.hasRecords = (response || []).length > 0;

                    console.log('viewModel.hasRecords: ', viewModel.hasRecords);

                    if(viewModel.hasRecords === true) {
                        $grid[0].addJSONData(response);
                    }
                    else {
                        $grid.clearGridData();
                    }

                });
        };

        

        function initGrid() {

            $grid = jQuery("#jqGrid");

            jQuery.jgrid.defaults.width = jQuery('.page-content').outerWidth();

            $grid.jqGrid({
                autowidth: true,
                forceFit: true,
                shrinkToFit: true,
                styleUI: 'Bootstrap',
                emptyrecords: "No records to view",
                datatype: function (options) {
                    viewModel.loadGrid(options);   
                },
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
                    $grid.jqGrid('resetSelection');
                },
                gridComplete: function () {
                    //self.onGridCompleteInner();
                },
                colModel: [
                    {hidden: true, label: '', name: 'guid', key: true},
                    {label: 'Type', name: 'type', width: 30},
                    {label: 'Date', name: 'date', width: 35},
                    {label: 'Time', name: 'time', width: 30},
                    {label: 'Title', name: 'title', width: 150},
                    {label: 'Detail', name: 'detail', width: 250}
                ],
                viewrecords: true, // show records label in footer
                height: '500px',
                rowNum: 1000,
                pager: "#jqGridPager"
            });

        }


        initGrid();

    }



})();
