/**
 * Created by ubaig on 28/08/2015.
 * TODO:
 * -
 * -
 * -
 * Referenced By:
 * -
 * -
 * -
 * Dependencies:
 * -
 * -
 * -
 * -
 */

/**
 * Dashboard API Class, can be placed anywhere
 * @type {{handleRequest, getCustomersCount, getSalesOrders, getItemsCount}}
 */
var ConnectorDashboardApi = (function () {
    return {

        handleRequest: function (method, request, response) {
            switch (method) {
                case 'getCustomersCount':
                    return this.getCustomersCount(request, response);
                    break;
                case 'getSalesOrders':
                    return this.getSalesOrders(request, response);
                    break;
                case 'getSalesOrderCount':
                    return this.getSalesOrderCount(request, response);
                    break;
                case 'getItemsCount':
                    return this.getItemsCount(request, response);
                    break;
                case 'getFailedSalesOrders':
                    return this.getFailedSalesOrders(request, response);
                    break;

                case 'importSalesOrder':
                    return this.importSalesOrder(request, response);
                    break;

                case 'getSOSyncLogs':
                    return this.getSOSyncLogs(request, response);
                    break;
                case 'getFulfilmentSyncLogs':
                    return this.getFulfilmentSyncLogs(request, response);
                    break;
                case 'getItemSyncLogs':
                    return this.getItemSyncLogs(request, response);
                    break;
                case 'getCashRefundSyncLogs':
                    return this.getCashRefundSyncLogs(request, response);
                    break;

                case 'executeSOSyncScript':
                    return this.executeSOSyncScript(request, response);
                    break;
                case 'executeItemSyncScript':
                    return this.executeItemSyncScript(request, response);
                    break;
                case 'executeCashRefundSyncScript':
                    return this.executeCashRefundSyncScript(request, response);
                    break;

                case 'searchSalesOrder':
                    return this.searchSalesOrder(request, response);
                    break;

                case 'searchCashRefund':
                    return this.searchCashRefund(request, response);
                    break;


                case 'getMenu':
                    return this.getMenu(request, response);
                    break;
            }

            return [];
        },

        getCustomersCount: function(request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = [];
            var searchText = '[{"StoreId":"'+ storeId +'"';
            var storeFilter = new nlobjSearchFilter('custentity_magento_custid', null, 'contains', searchText);
            var searchCol = new nlobjSearchColumn('internalid',null, 'COUNT');
            var results = nlapiSearchRecord('customer',null, storeFilter, searchCol);

            if (results != null && results.length > 0) {

                finalResponse = ConnectorCommon.getObjects(results);
            }
            return finalResponse;
        },

        getSalesOrderCount: function(request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = this.getResultFromSavedSearch(storeId,  'customsearch_f3_so_count_by_store');
            return finalResponse;
        },

        getResultFromSavedSearch: function (storeId, savedSearchName, storeField) {
            var finalResponse = [];
            storeField  = storeField || 'custbody_f3mg_magento_store';

            var storeFilter = new nlobjSearchFilter(storeField, null, 'anyof', storeId);
            var results = nlapiSearchRecord(null, savedSearchName, storeFilter);

            //Utility.logDebug('savedSearchName # storeId # storeField # results.length', savedSearchName + ' # ' +storeId+ ' # ' +storeField+ ' # ' + (!!results ? results.length : 'null'));
            if (results != null && results.length > 0) {
                //Utility.logDebug('results', JSON.stringify(results));
                finalResponse = ConnectorCommon.getObjects(results);
            }
            return finalResponse;
        },

        getSalesOrders: function(request, response) {

            var storeId = request.getParameter('store_id');
            var finalResponse = this.getResultFromSavedSearch(storeId,  'customsearch_f3_so_by_store',
                                    'custbody_f3mg_magento_store');
            return finalResponse;
        },

        getItemsCount: function(request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = this.getResultFromSavedSearch(storeId,  'customsearch_f3_item_count_by_store',
                                    'custitem_f3mg_magento_stores');
            return finalResponse;
        },

        getFailedSalesOrders: function(request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = this.getResultFromSavedSearch(storeId,  'customsearch_f3_failed_so_by_store',
                'custbody_f3mg_magento_store');

            if (finalResponse != null && finalResponse.length > 0) {
                for (var i = 0; i < finalResponse.length; i++) {
                    finalResponse[i].url = nlapiResolveURL('RECORD', 'salesorder', finalResponse[i].internalid);
                }
            }

            return finalResponse;
        },


        importSalesOrder: function(request, response) {
            var storeId = request.getParameter('store_id');
            var salesorderId = request.getParameter('record_id');
            return this.executeScheduledScript('customscript_connectororderimport', 'customdeploy_connectororderimport2', {
                salesorderIds: [salesorderId]
            });
        },

        executeCashRefundSyncScript: function(request, response) {
            return this.executeScheduledScript('customscript_cashrefund_export_sch', 'customdeploy_cashrefund_export_dep2');
        },
        executeItemSyncScript: function(request, response) {
            return this.executeScheduledScript('customscript_magento_item_sync_sch', 'customdeploy_magento_item_sync_sch2');
        },
        executeSOSyncScript: function(request, response) {
            return this.executeScheduledScript('customscript_connectororderimport', 'customdeploy_connectororderimport2');
        },
        executeScheduledScript: function(scriptId, deploymentId, parameters) {
            var result = {
                success: true,
                error: false
            };


            // TODO : need to pass parameters to following method
            var status = nlapiScheduleScript(scriptId, deploymentId);

            var msg = 'scriptId: ' + scriptId + ' --- deploymentId: ' +deploymentId + ' --- status: ' + status;
            Utility.logDebug('executeScheduledScript(); ', msg);

            result.status = status;

            if (status === 'QUEUED' || status === 'INQUEUE' || status === 'INPROGRESS' || status === 'SCHEDULED') {
                result.success = true;
                result.error = false;
            }
            else {
                result.success = false;
                result.error = true;
            }

            return result;
        },

        getCashRefundSyncLogs: function(request, response) {
            return this.getExecutionLogs('customscript_cashrefund_export_sch');
        },
        getItemSyncLogs: function(request, response) {
            return this.getExecutionLogs('customscript_magento_item_sync_sch');
        },
        getFulfilmentSyncLogs: function(request, response) {
            return this.getExecutionLogs('customscript_magento_fulfillment_ue');
        },
        getSOSyncLogs: function(request, response) {
            return this.getExecutionLogs('customscript_connectororderimport');
        },
        getExecutionLogs: function(scriptId) {

            var finalResponse = [];
            var cols = [];
            var filters = [];

            cols.push(new nlobjSearchColumn('title'));
            cols.push(new nlobjSearchColumn('detail'));
            cols.push(new nlobjSearchColumn('type'));
            cols.push(new nlobjSearchColumn('date').setSort(true));
            cols.push(new nlobjSearchColumn('time').setSort(true));

            filters.push(new nlobjSearchFilter('scriptid', 'script', 'is', scriptId));

            var results = nlapiSearchRecord('scriptexecutionlog', null, filters, cols);
            if (results != null && results.length > 0) {
                finalResponse = ConnectorCommon.getObjects(results);
            }

            return finalResponse;
        },





        searchCashRefund: function (request, response) {
            var storeId = request.getParameter('store_id');
            var recordId = request.getParameter('record_id');
            return this.searchExternalSystemRecord('cashrefund', recordId, storeId);
        },

        searchSalesOrder: function (request, response) {
            var storeId = request.getParameter('store_id');
            var recordId = request.getParameter('record_id');


            return this.searchExternalSystemRecord('salesorder', recordId, storeId);
        },

        /**
         * Search NetSuite respective record for provided magento Id
         * @param recordType
         * @param recordId
         */
        searchExternalSystemRecord: function(recordType, recordId, storeId) {
            var netSuiteRecordId = {
                status: false,
                data: null
            };

            Utility.logDebug('searchExternalSystemRecord(); // recordType: ', recordType);
            Utility.logDebug('searchExternalSystemRecord(); // recordId: ', recordId);

            if (!recordId) {
                return netSuiteRecordId;
            }

            recordId = recordId || '';

            var filters = [];

            //filters.push(new nlobjSearchFilter('custbody_f3mg_magento_store', null, 'anyof', storeId));

            if (recordType == 'salesorder') {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoId, null, 'is', recordId.trim()));
            }
            else if (recordType == 'cashrefund') {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.CustomerRefundMagentoId, null, 'is', recordId.trim()));
            }

            try {

                var result = nlapiSearchRecord(recordType, null, filters);
                Utility.logDebug('searchExternalSystemRecord(); // nlapiSearchRecord(); result: ', JSON.stringify(result));

                if (!!result && result.length > 0) {
                    var id = result[0].getId();

                    netSuiteRecordId.status = true;
                    netSuiteRecordId.data = id;
                }

            } catch (ex) {
                Utility.logException('Error in searchExternalSystemRecord();', ex.toString());
            }

            Utility.logDebug('searchExternalSystemRecord(); // return netSuiteRecordId: ', netSuiteRecordId);
            Utility.logDebug('searchExternalSystemRecord(); // end', '');
            return netSuiteRecordId;
        },


        getMenu: function(request, response) {
            var storeId = request.getParameter('store_id');
            var menu = [];
            var productList = ExternalSystemConfig.getAll();

            var foundStore = null;
            if (!!productList && productList.length > 0) {
                for (var i = 0; i < productList.length; i++) {
                    var obj = productList[i];
                    if (obj.internalId == storeId) {
                        foundStore = obj;
                        break;
                    }
                }
            }

            if (!!foundStore) {
                var permissions = foundStore.permissions;
                menu = this.generateMenuFromPermission(permissions);
            }

            return menu;
        },

        generateMenuFromPermission: function(permissions){
            var menu = [];
            if (!!permissions && permissions.length > 0) {
                for (var j = 0; j < permissions.length; j++) {
                    var permission = permissions[j];
                    switch (permission) {
                        case 'IMPORT_SO_FROM_EXTERNAL_SYSTEM':
                            menu.push({
                                group: 'Import SO',
                                title: 'Import Sales Order',
                                url: '/import-salesorder',
                                templateUrl: "/f3-dash/templates/actions-import-salesorder.html",
                                controller: 'ImportSalesorderController',
                                controllerAs: 'viewModel'
                            });
                            break;
                        default:
                            break;
                    }
                }
            }
            return menu;
        }
    };
})();

/**
 * ConnectorDashboard class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var ConnectorDashboard = (function () {
    return {

        SIDEBAR_TEMPLATE : '<li class="sidebar-title">' +
                            '  <select ng-change="actionsController.storeChanged()" ng-model="actionsController.selectedStore" ' +
                                'ng-options="store.name for store in actionsController.stores"></select>' +
                            '</li>' +
                            '<li class="sidebar-list">' +
                            '  <a href="#/">Dashboard <span class="menu-icon fa fa-tachometer"></span></a>' +
                            '</li>' +
                            '<li class="sidebar-list" ng-repeat="action in actionsController.actions track by $index">' +
                            '  <a ng-if="!!action.group" class="submenu-link"><span ng-bind="action.group"></span> <span class="menu-icon fa fa-minus"></span></a>' +
                            '  <a ng-if="!action.group && !action.action" ui-sref="{{ action.key }}" > <span ng-bind="action.title"></span> <span class="menu-icon fa fa-{{ action.icon }}"></span></a>' +
                            '  <a ng-if="!action.group && !!action.action" ng-click="action.action()" target="_blank"> <span ng-bind="action.title"></span> <span class="menu-icon fa fa-{{ action.icon }}"></span></a>' +
                            '  <ul ng-if="!!action.actions">' +
                            '    <li class="sidebar-list" ng-repeat="subAction in action.actions">' +
                            '      <a ng-if="!subAction.action" ui-sref="{{ subAction.key }}" > <span ng-bind="subAction.title"></span> <span class="menu-icon fa fa-{{ subAction.icon }}"></span></a>' +
                            '      <a ng-if="!!subAction.action" ng-click="subAction.action()" target="_blank"> <span ng-bind="subAction.title"></span> <span class="menu-icon fa fa-{{ subAction.icon }}"></span></a>' +
                            '    </li>' +
                            '  </ul>' +
                            '</li>',



        /**
         * Description of method getFileUrl
         * @param parameter
         */
        getFileUrl: function () {
            try {
                var bundleId = FC_SYNC_CONSTANTS.BundleInfo.Id;

                if (!bundleId || bundleId.length <= 0 || bundleId.toString() === 'suitebundle9090') {
                    return "SuiteScripts/NS-SF-Con/util/";
                } else {
                    return "SuiteBundles/Bundle " + bundleId.replace('suitebundle', '') + '/util/';
                }
            } catch (e) {
                Utility.logException('Error', e);
            }
        },

        extractPageContent: function (request, fileUrl) {
            var indexPageValue = '';

            var store_id = request.getParameter('store_id');

            //if (!store_id || store_id.length <= 0) {
            //    indexPageValue = 'Please select a Product first.';
            //    return indexPageValue;
            //}

            var data = nlapiLoadFile(this.getFileUrl() + "f3-dash/index.html");

            indexPageValue = data.getValue();
            var sideBar = this.createSideBar(store_id, fileUrl);
            indexPageValue = indexPageValue.replace(/<BASE_URL>/g, fileUrl);
            indexPageValue = indexPageValue.replace('[STORES_JSON]', JSON.stringify(sideBar && sideBar.stores || {}));
            indexPageValue = indexPageValue.replace('[SIDE_BAR]', sideBar && sideBar.sidebarHtml || '');

            return indexPageValue;

        },



        handleApiRequest: function (method, request, response) {
            response.setContentType('JSON');

            var result = ConnectorDashboardApi.handleRequest(method, request, response);

            //result = result || '';

            response.write(JSON.stringify(result));
        },
        /**
         * Get request method
         * @param request
         * @param response
         */
        getMethod: function (request, response) {
            try {

                var method = request.getParameter('method');

                Utility.logDebug('method = ', method);

                if (method && method.length > 0) {

                    this.handleApiRequest(method, request, response);

                } else {
                    var fileUrl = "/c." + nlapiGetContext().company + '/' + FC_SYNC_CONSTANTS.BundleInfo.Id + '/util/',
                        form, // NetSuite Form
                        html, // inline html type field to display custom html
                        indexPageValue; // external html page


                    form = nlapiCreateForm('Folio3 Connector - Dashboard');
                    //form.setScript(FC_SYNC_CONSTANTS.ClientScripts.ClientScript3.Id); // Constants.Netsuite.Scripts.ClientScriptId
                    html = form.addField('inlinehtml', 'inlinehtml', '');

                    indexPageValue = this.extractPageContent(request, fileUrl);

                    html.setDefaultValue(indexPageValue);

                    response.writePage(form);
                }
            } catch (e) {
                Utility.logException('error in getMethod', e);
                throw e;
            }
        },

        /**
         * Description of method redirectToPage
         * @param parameter
         */
        redirectToPage: function (request, response) {
            try {
                var context = nlapiGetContext();
                var param = [];
                response.sendRedirect('SUITELET', context.getScriptId(), context.getDeploymentId(), false, param);

            } catch (e) {
                Utility.logException('Error during main redirectToPage', e);
            }
        },

        /**
         * Description of method createSideBar
         * @param parameter
         */
        createSideBar: function (store_id, fileUrl) {
            try {
                var template = this.SIDEBAR_TEMPLATE;
                var finalResult = '';
                var productList = ExternalSystemConfig.getAll();

                var stores = [];
                for (var i = 0; i < productList.length; i++) {
                    var obj = productList[i];
                    var url = nlapiResolveURL('SUITELET', 'customscript_dashboard_sl', 'customdeploy_dashboard_sl');
                    url = url + '&store_id=' + obj.internalId;
                    obj.url = url;

                    stores.push({
                        id: obj.internalId,
                        name: obj.systemDisplayName,
                        url: obj.url
                    });
                }

                var template = this.SIDEBAR_TEMPLATE;

                finalResult = finalResult + template;

                return { stores: stores, sidebarHtml :  finalResult };

            } catch (e) {
                Utility.logException('Error during main createSideBar', e);
            }

            return null;
        },

        /**
         * main method
         */
        main: function (request, response) {
            this.getMethod(request, response);
        }
    };
})();

/**
 * This is the main entry point for ConnectorDashboard suitelet
 * NetSuite must only know about this function.
 * Make sure that the name of this function remains unique across the project.
 */
function ConnectorDashboardSuiteletMain(request, response) {
    return ConnectorDashboard.main(request, response);
}