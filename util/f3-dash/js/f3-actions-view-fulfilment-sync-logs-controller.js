/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("ViewFulfilmentSyncLogsController", ViewFulfilmentSyncLogsController);


    function ViewFulfilmentSyncLogsController(f3StoreId, $http) {
        console.log('ViewFulfilmentSyncLogsController');

        var _self = this;
        this.hasRecords = true;

        initGrid();

        function initGrid() {

            var $grid = jQuery("#jqGrid");

            jQuery.jgrid.defaults.width = jQuery('.page-content').outerWidth();

            $grid.jqGrid({
                autowidth: true,
                forceFit: true,
                shrinkToFit: true,
                styleUI: 'Bootstrap',
                emptyrecords: "No records to view",
                datatype: function (options) {
                    console.log('datatype();');

                    var apiUrl = location.href.replace(location.hash, '') + '&method=getFulfilmentSyncLogs';
                    $http.get(apiUrl)
                        .success(function(response) {

                            console.log('response: ', response);

                            _self.hasRecords = response && response.length > 0;

                            console.log('_self.hasRecords: ', _self.hasRecords);

                            if(!!response && response.length) {
                                $grid[0].addJSONData(response);
                            }
                            else {
                                $grid.clearGridData();
                            }

                        });

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

    }



})();
