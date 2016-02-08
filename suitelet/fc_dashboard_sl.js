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

                case 'getSalesOrderCount':
                    return this.getSalesOrderCount(request, response);
                    break;
                case 'getItemsCount':
                    return this.getItemsCount(request, response);
                    break;
                case 'getFailedSalesOrders':
                    return this.getFailedSalesOrders(request, response);
                    break;
                case 'getFailedSalesOrdersImported':
                    return this.getFailedSalesOrdersImported(request, response);
                    break;


                case 'getCustomersGraph':
                    return this.getCustomersGraph(request, response);
                    break;


                case 'getSalesOrders':
                    return this.getSalesOrders(request, response);
                    break;
                case 'getCustomers':
                    return this.getCustomers(request, response);
                    break;
                case 'getItems':
                    return this.getItems(request, response);
                    break;


                case 'importSalesOrder':
                    return this.importSalesOrder(request, response);
                    break;
                case 'exportSalesOrder':
                    return this.exportSalesOrder(request, response);
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


                case 'getSOSyncScriptDeploymentInstances':
                    return this.getSOSyncScriptDeploymentInstances(request, response);
                    break;
                case 'getItemSyncScriptDeploymentInstances':
                    return this.getItemSyncScriptDeploymentInstances(request, response);
                    break;
                case 'getCashRefundSyncScriptDeploymentInstances':
                    return this.getCashRefundSyncScriptDeploymentInstances(request, response);
                    break;


                case 'executeSOSyncScript':
                    return this.executeSOSyncScript(request, response);
                    break;
                case 'executeItemSyncScript':
                    return this.executeItemSyncScript(request, response);
                    break;
                case 'executeItemExportScript':
                    return this.executeItemExportScript(request, response);
                    break;
                case 'executeItemImportScript':
                    return this.executeItemImportScript(request, response);
                    break;
                case 'selectiveItemExportScript':
                    return this.selectiveItemExportScript(request, response);
                    break;
                case 'selectiveItemImportScript':
                    return this.selectiveItemImportScript(request, response);
                    break;
                case 'getItemExportScriptDeploymentInstances':
                    return this.getItemExportScriptDeploymentInstances(request, response);
                    break;
                case 'getItemImportScriptDeploymentInstances':
                    return this.getItemImportScriptDeploymentInstances(request, response);
                    break;
                case 'executeCashRefundSyncScript':
                    return this.executeCashRefundSyncScript(request, response);
                    break;


                case 'searchSalesOrder':
                    return this.searchSalesOrder(request, response);
                    break;
                case 'searchCustomer':
                    return this.searchCustomer(request, response);
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

        getCustomersCount: function (request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = [];
            var searchText = '[{"StoreId":"' + storeId + '"';
            var storeFilter = new nlobjSearchFilter('custentity_magento_custid', null, 'contains', searchText);
            var searchCol = new nlobjSearchColumn('internalid', null, 'COUNT');
            var results = nlapiSearchRecord('customer', null, storeFilter, searchCol);

            if (results != null && results.length > 0) {
                finalResponse = ConnectorCommon.getObjects(results);
            }
            return finalResponse;
        },

        getSalesOrderCount: function (request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = this.getResultFromSavedSearch(storeId, 'customsearch_f3_so_count_by_store');
            return finalResponse;
        },

        getResultFromSavedSearch: function (storeId, savedSearchName, storeField) {
            var finalResponse = [];
            storeField = storeField || 'custbody_f3mg_magento_store';

            var storeFilter = new nlobjSearchFilter(storeField, null, 'anyof', storeId);
            var results = nlapiSearchRecord(null, savedSearchName, storeFilter);

            //Utility.logDebug('savedSearchName # storeId # storeField # results.length', savedSearchName + ' # ' +storeId+ ' # ' +storeField+ ' # ' + (!!results ? results.length : 'null'));
            if (results != null && results.length > 0) {
                //Utility.logDebug('results', JSON.stringify(results));
                finalResponse = ConnectorCommon.getObjects(results);
            }
            return finalResponse;
        },


        getCustomersGraph: function (request, response) {
            var storeId = request.getParameter('store_id');

            return this.getResultFromSavedSearch(storeId, 'customsearch_f3_graph_top_rev_cust');
        },

        getExternalSystemRecords: function (recordType, storeId) {

            var finalResponse = [];
            var filters = [];
            var cols = [];

            if (recordType === 'salesorder') {
                filters.push(new nlobjSearchFilter('custbody_f3mg_magento_store', null, 'anyof', [storeId]));
                filters.push(new nlobjSearchFilter('custbody_magentoid', null, 'isnotempty', ""));
                filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
                cols.push(new nlobjSearchColumn('status'));
                cols.push(new nlobjSearchColumn('tranid'));
                cols.push(new nlobjSearchColumn('lastmodifieddate').setSort(true));
                cols.push(new nlobjSearchColumn('custbody_magentoid').setLabel('externalSystemRecordId'));
                cols.push(new nlobjSearchColumn('entity'));
                cols.push(new nlobjSearchColumn('total'));
                cols.push(new nlobjSearchColumn('status'));
            }
            else if (recordType === 'customer') {
                var searchText = '{"StoreId":"' + storeId + '"';
                filters.push(new nlobjSearchFilter('custentity_magento_custid', null, 'contains', searchText));
                cols.push(new nlobjSearchColumn('companyname'));
                cols.push(new nlobjSearchColumn('email'));
                cols.push(new nlobjSearchColumn('isperson'));
                cols.push(new nlobjSearchColumn('firstname'));
                cols.push(new nlobjSearchColumn('lastname'));
                cols.push(new nlobjSearchColumn('custentity_magento_custid'));
                cols.push(new nlobjSearchColumn('lastmodifieddate').setSort(true));
                cols.push(new nlobjSearchColumn('entitystatus'));
                cols.push(new nlobjSearchColumn('billaddress'));
                cols.push(new nlobjSearchColumn('shipaddress'));
                cols.push(new nlobjSearchColumn('entityid'));
            }
            else if (recordType === 'item') {
                var searchText = '{"StoreId":"' + storeId + '"';
                filters.push(new nlobjSearchFilter(ConnectorConstants.Item.Fields.MagentoId, null, 'contains', searchText));
                cols.push(new nlobjSearchColumn('itemid'));
                cols.push(new nlobjSearchColumn('displayname'));
                cols.push(new nlobjSearchColumn('modified').setSort(true));
            }

            var results = nlapiSearchRecord(recordType, null, filters, cols);
            if (results != null && results.length > 0) {
                finalResponse = ConnectorCommon.getObjects(results);
            }

            for(var i in finalResponse){
                var finalResponseTemp = finalResponse[i].custentity_magento_custid;
                if(!!finalResponseTemp){
                    finalResponseTemp = JSON.parse(finalResponseTemp);
                    for(var j in finalResponseTemp){
                        if(finalResponseTemp[j].StoreId == storeId){
                            finalResponse[i].custentity_magento_custid = finalResponseTemp[j].MagentoId;
                            break;
                        }
                    }
                }
            }

            return finalResponse;
        },
        getSalesOrders: function (request, response) {
            var storeId = request.getParameter('store_id');

            return this.getExternalSystemRecords('salesorder', storeId);
        },
        getCustomers: function (request, response) {

            var storeId = request.getParameter('store_id');

            return this.getExternalSystemRecords('customer', storeId);
        },

        getItems: function (request, response) {

            var storeId = request.getParameter('store_id');

            return this.getExternalSystemRecords('item', storeId);
        },


        getItemsCount: function (request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = this.getResultFromSavedSearch(storeId, 'customsearch_f3_item_count_by_store',
                'custitem_f3mg_magento_stores');
            return finalResponse;
        },

        getFailedSalesOrders: function (request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = this.getResultFromSavedSearch(storeId, 'customsearch_f3_failed_so_by_store',
                'custbody_f3mg_magento_store');

            if (finalResponse != null && finalResponse.length > 0) {
                for (var i = 0; i < finalResponse.length; i++) {
                    finalResponse[i].url = nlapiResolveURL('RECORD', 'salesorder', finalResponse[i].internalid);
                }
            }

            return finalResponse;
        },

        getFailedSalesOrdersImported: function (request, response) {
            var storeId = request.getParameter('store_id');
            var finalResponse = [];
            var fils = [];
            var cols = [];

            fils.push(new nlobjSearchFilter(F3Message.FieldName.ExternalSystem, null, 'is', storeId));
            fils.push(new nlobjSearchFilter(F3Message.FieldName.RecordType, null, 'is', "salesorder"));
            cols.push(new nlobjSearchColumn(F3Message.FieldName.Message, null, null));
            cols.push(new nlobjSearchColumn(F3Message.FieldName.MessageDetails, null, null));
            cols.push(new nlobjSearchColumn(F3Message.FieldName.RecordId, null, null));
            cols.push(new nlobjSearchColumn(F3Message.FieldName.Action, null, null));
            cols.push(new nlobjSearchColumn("created", null, null).setSort(true));

            var results = nlapiSearchRecord(F3Message.InternalId, null, fils, cols);

            if (!!results && results.length > 0) {
                //Utility.logDebug('results', JSON.stringify(results));
                finalResponse = ConnectorCommon.getObjects(results);
            }
            return finalResponse;
        },


        importSalesOrder: function (request, response) {
            var storeId = request.getParameter('store_id');
            var salesorderId = request.getParameter('record_id');
            var params = {};

            var data = {};
            data[RecordsToSync.FieldName.RecordId] = salesorderId;
            data[RecordsToSync.FieldName.RecordType] = RecordsToSync.RecordTypes.SalesOrder;
            data[RecordsToSync.FieldName.Action] = RecordsToSync.Actions.ImportSalesOrder;
            data[RecordsToSync.FieldName.Status] = RecordsToSync.Status.Pending;
            data[RecordsToSync.FieldName.Operation] = RecordsToSync.Operation.IMPORT;
            data[RecordsToSync.FieldName.ExternalSystem] = storeId;
            RecordsToSync.upsert(data);

            /*return this.executeScheduledScript(
             'customscript_connectororderimport',
             'customdeploy_salesorder_import_using_cr',
             {
             salesorderIds: [salesorderId]
             }
             );*/
            params[ConnectorConstants.ScriptParameters.SalesOrderImportStoreId] = storeId;
            return this.executeScheduledScript(
                'customscript_connectororderimport',
                'customdeploy_salesorder_import_using_cr',
                params);
        },

        exportSalesOrder: function (request, response) {
            var storeId = request.getParameter('store_id');
            var salesorderId = request.getParameter('record_id');
            var params = {};

            var data = {};
            data[RecordsToSync.FieldName.RecordId] = salesorderId;
            data[RecordsToSync.FieldName.RecordType] = RecordsToSync.RecordTypes.SalesOrder;
            data[RecordsToSync.FieldName.Action] = RecordsToSync.Actions.SyncSoSystemNotes;
            data[RecordsToSync.FieldName.Status] = RecordsToSync.Status.Pending;
            data[RecordsToSync.FieldName.Operation] = RecordsToSync.Operation.EXPORT;
            data[RecordsToSync.FieldName.ExternalSystem] = storeId;
            RecordsToSync.upsert(data);

            /*return this.executeScheduledScript(
             'customscript_salesorder_export',
             'customdeploy_salesorder_export_using_cr',
             {
             salesorderIds: [salesorderId]
             }
             );*/
            params[ConnectorConstants.ScriptParameters.SalesOrderExportStoreId] = storeId;
            return this.executeScheduledScript(
                'customscript_salesorder_export',
                'customdeploy_salesorder_export_using_cr',
                params);
        },

        executeCashRefundSyncScript: function (request, response) {
            var storeId = request.getParameter('store_id');
            var params = {};
            params[ConnectorConstants.ScriptParameters.CashRefundExportStoreId] = storeId;
            return this.executeScheduledScript(
                'customscript_cashrefund_export_sch',
                'customdeploy_cashrefund_export_dep2',
                params
            );
        },
        executeItemSyncScript: function (request, response) {
            var storeId = request.getParameter('store_id');
            var params = {};
            params[ConnectorConstants.ScriptParameters.InventoryExportStoreId] = storeId;
            return this.executeScheduledScript(
                'customscript_magento_item_sync_sch',
                'customdeploy_magento_item_sync_sch2',
                params
            );
        },
        executeItemExportScript: function (request, response) {
            return this.executeScheduledScript(
                'customscript_item_export_sch',
                'customdeploy_item_export_sch_dash',
                null
            );
        },
        executeItemImportScript: function (request, response) {
            return this.executeScheduledScript(
                'customscript_item_import_sch',
                'customdeploy_item_import_sch_dash',
                null
            );
        },

        selectiveItemExportScript: function (request, response) {
            var storeId = request.getParameter('store_id');
            var itemId = request.getParameter('record_id');
            var params = {};

            /*var data = {};
            data[RecordsToSync.FieldName.RecordId] = itemId;
            data[RecordsToSync.FieldName.RecordType] = RecordsToSync.RecordTypes.SalesOrder;
            data[RecordsToSync.FieldName.Action] = RecordsToSync.Actions.SyncSoSystemNotes;
            data[RecordsToSync.FieldName.Status] = RecordsToSync.Status.Pending;
            data[RecordsToSync.FieldName.Operation] = RecordsToSync.Operation.EXPORT;
            data[RecordsToSync.FieldName.ExternalSystem] = storeId;
            RecordsToSync.upsert(data);*/

            params[ConnectorConstants.ScriptParameters.SelectiveItemExportStoreId] = storeId;
            params[ConnectorConstants.ScriptParameters.SelectiveItemExportIdentifierType] = 'internalid';
            params[ConnectorConstants.ScriptParameters.SelectiveItemExportIdentifierValue] = itemId;
            return this.executeScheduledScript(
                'customscript_item_export_sch',
                'customdeploy_item_export_sch_dash',
                params);
        },

        selectiveItemImportScript:function (request, response) {
            var storeId = request.getParameter('store_id');
            var itemId = request.getParameter('record_id');
            var itemIdentifier = request.getParameter('item_identifier');
            var params = {};

            /*var data = {};
             data[RecordsToSync.FieldName.RecordId] = itemId;
             data[RecordsToSync.FieldName.RecordType] = RecordsToSync.RecordTypes.SalesOrder;
             data[RecordsToSync.FieldName.Action] = RecordsToSync.Actions.SyncSoSystemNotes;
             data[RecordsToSync.FieldName.Status] = RecordsToSync.Status.Pending;
             data[RecordsToSync.FieldName.Operation] = RecordsToSync.Operation.EXPORT;
             data[RecordsToSync.FieldName.ExternalSystem] = storeId;
             RecordsToSync.upsert(data);*/

            params[ConnectorConstants.ScriptParameters.SelectiveItemImportStoreId] = storeId;
            params[ConnectorConstants.ScriptParameters.SelectiveItemImportIdentifierType] = itemIdentifier;
            params[ConnectorConstants.ScriptParameters.SelectiveItemImportIdentifierValue] = itemId;
            return this.executeScheduledScript(
                'customscript_item_import_sch',
                'customdeploy_item_import_sch_dash',
                params);
        },

        executeSOSyncScript: function (request, response) {
            var storeId = request.getParameter('store_id');
            var params = {};
            params[ConnectorConstants.ScriptParameters.SalesOrderImportStoreId] = storeId;
            return this.executeScheduledScript(
                'customscript_connectororderimport',
                'customdeploy_connectororderimport2',
                params
            );
        },
        executeScheduledScript: function (scriptId, deploymentId, parameters) {
            var result = {
                success: true,
                error: false
            };


            // TODO : need to pass parameters to following method
            var status = nlapiScheduleScript(scriptId, deploymentId, parameters);

            var msg = 'scriptId: ' + scriptId + ' --- deploymentId: ' + deploymentId + ' --- status: ' + status;
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

        getCashRefundSyncLogs: function (request, response) {
            return this.getExecutionLogs(
                'customscript_cashrefund_export_sch',
                'customdeploy_cashrefund_export_dep2',
                request
            );
        },
        getItemSyncLogs: function (request, response) {
            return this.getExecutionLogs(
                'customscript_magento_item_sync_sch',
                'customdeploy_magento_item_sync_sch2',
                request
            );
        },
        getFulfilmentSyncLogs: function (request, response) {
            return this.getExecutionLogs(
                'customscript_magento_fulfillment_ue',
                'customdeploy_magento_fulfillment_ue',
                request
            );
        },
        getSOSyncLogs: function (request, response) {
            return this.getExecutionLogs(
                'customscript_connectororderimport',
                'customdeploy_connectororderimport2',
                request
            );
        },
        getExecutionLogs: function (scriptId, deploymentId, request) {

            var finalResponse = [];
            var cols = [];
            var filters = [];

            var startDate = request.getParameter('startDate');
            var endDate = request.getParameter('endDate');
            var logType = request.getParameter('logType');

            Utility.logDebug('getExecutionLogs(); // startDate: ', startDate);
            Utility.logDebug('getExecutionLogs(); // endDate: ', endDate);
            Utility.logDebug('getExecutionLogs(); // logType: ', logType);

            cols.push(new nlobjSearchColumn('title'));
            cols.push(new nlobjSearchColumn('detail'));
            cols.push(new nlobjSearchColumn('type'));
            cols.push(new nlobjSearchColumn('date').setSort(true));
            cols.push(new nlobjSearchColumn('time').setSort(true));

            filters.push(new nlobjSearchFilter('scriptid', 'script', 'is', scriptId));
            filters.push(new nlobjSearchFilter('scriptid', 'scriptdeployment', 'is', deploymentId));

            if (startDate && endDate) {
                filters.push(new nlobjSearchFilter('date', null, 'within', [startDate, endDate]));
            }
            else if (startDate && !endDate) {
                filters.push(new nlobjSearchFilter('date', null, 'onorafter', startDate));
            }
            else if (!startDate && endDate) {
                filters.push(new nlobjSearchFilter('date', null, 'onorbefore', endDate));
            }

            if (!!logType) {
                filters.push(new nlobjSearchFilter('type', null, 'anyof', [logType]));
            }

            var results = nlapiSearchRecord('scriptexecutionlog', null, filters, cols);
            if (results != null && results.length > 0) {
                finalResponse = ConnectorCommon.getObjects(results);
            }

            return finalResponse;
        },

        getSOSyncScriptDeploymentInstances: function (request, response) {
            return this.getScriptDeploymentInstances(
                'customscript_connectororderimport',
                'customdeploy_connectororderimport2'
            );
        },
        getItemSyncScriptDeploymentInstances: function (request, response) {
            return this.getScriptDeploymentInstances(
                'customscript_magento_item_sync_sch',
                'customdeploy_magento_item_sync_sch2'
            );
        },
        getItemExportScriptDeploymentInstances: function (request, response) {
            return this.getScriptDeploymentInstances(
                'customscript_item_export_sch',
                'customdeploy_item_export_sch_dash'
            );
        },
        getItemImportScriptDeploymentInstances: function (request, response) {
            return this.getScriptDeploymentInstances(
                'customscript_item_import_sch',
                'customdeploy_item_import_sch_dash'
            );
        },
        getCashRefundSyncScriptDeploymentInstances: function (request, response) {
            return this.getScriptDeploymentInstances(
                'customscript_cashrefund_export_sch',
                'customdeploy_cashrefund_export_dep2'
            );
        },
        getScriptDeploymentInstances: function (scriptId, deploymentId) {

            var finalResponse = [];
            var filters = [];

            filters.push(new nlobjSearchFilter('scriptid', 'script', 'is', scriptId));
            filters.push(new nlobjSearchFilter('scriptid', 'scriptdeployment', 'is', deploymentId));

            var results = nlapiSearchRecord(null, 'customsearch_scheduled_script_instances', filters);

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


        searchCustomer: function (request, response) {
            var storeId = request.getParameter('store_id');
            var recordId = request.getParameter('record_id');


            return this.searchExternalSystemRecord('customer', recordId, storeId);
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
         * @param storeId
         */
        searchExternalSystemRecord: function (recordType, recordId, storeId) {
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

            if (recordType === 'salesorder') {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoId, null, 'is', recordId.trim()));
            }
            else if (recordType === 'cashrefund') {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.CustomerRefundMagentoId, null, 'is', recordId.trim()));
            }
            else if (recordType === 'customer') {
                var searchFormat = ConnectorConstants.MagentoIdFormat;
                searchFormat = searchFormat.replace(/<STOREID>/gi, storeId);
                searchFormat = searchFormat.replace(/<MAGENTOID>/gi, recordId);
                //var searchText = '[{"StoreId":"'+storeId+'","MagentoId":'+recordId+'}]';
                filters.push(new nlobjSearchFilter(ConnectorConstants.Entity.Fields.MagentoId, null, 'contains', searchFormat));
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


        getMenu: function (request, response) {
            var storeId = request.getParameter('store_id');
            var menu = [];
            var productList = ExternalSystemConfig.getAll();
            Utility.logDebug('ConnectorDashboardApi.getMenu(); // productList: ', JSON.stringify(productList));

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


            Utility.logDebug('ConnectorDashboardApi.getMenu(); // foundStore: ', JSON.stringify(foundStore));

            if (!!foundStore) {
                var permissions = foundStore.permissions;
                menu = this.generateMenuFromPermission(permissions);
            }

            return menu;
        },

        generateMenuFromPermission: function (permissions) {

            Utility.logDebug('ConnectorDashboardApi.generateMenuFromPermission(); // permissions: ', JSON.stringify(permissions));

            var menu = [];

            menu.push({
                key: 'index',
                menuOrder: 0,
                title: 'Dashboard',
                icon: 'icon-screen-desktop',
                url: '/',
                templateUrl: "/f3-dash/templates/dashboard.html",
                controller: 'MasterController',
                controllerAs: 'viewModel'
            });

            if (!!permissions && permissions.length > 0) {
                for (var j = 0; j < permissions.length; j++) {
                    var permission = permissions[j];

                    switch (permission) {
                        case 'IMPORT_SO_FROM_EXTERNAL_SYSTEM':
                            menu.push({
                                key: 'import-so',
                                menuOrder: 10,
                                title: 'Import Sales Order',
                                icon: 'icon-cloud-download',
                                url: '/import-salesorder',
                                templateUrl: "/f3-dash/templates/actions-import-salesorder.html",
                                controller: 'ImportSalesorderController',
                                controllerAs: 'viewModel'
                            });

                            menu.push({
                                key: 'synchronize-salesorders',
                                menuOrder: 1,
                                group: 'Synchronize',
                                groupIcon: 'icon-refresh',
                                icon: 'icon-notebook',
                                title: 'Sales Orders',
                                url: "/salesorders",
                                templateUrl: "/f3-dash/templates/actions-execute-so-sync-script.html",
                                controller: 'ExecuteSOSyncScriptController',
                                controllerAs: 'viewModel'
                            });

                            menu.push({
                                key: 'view-so-sync-logs',
                                menuOrder: 7,
                                group: 'View Logs',
                                groupIcon: 'icon-graph',
                                icon: 'icon-notebook',
                                title: 'Sales Orders',
                                url: "/so-sync",
                                templateUrl: "/f3-dash/templates/actions-view-so-sync-logs.html",
                                controller: 'ViewSOSyncLogsController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'EXPORT_SO_TO_EXTERNAL_SYSTEM':
                            menu.push({
                                key: 'export-so',
                                menuOrder: 11,
                                title: 'Export Sales Order',
                                icon: 'icon-cloud-upload',
                                url: '/export-salesorder',
                                templateUrl: "/f3-dash/templates/actions-export-salesorder.html",
                                controller: 'ExportSalesorderController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'SEARCH_ORDERS':
                            menu.push({
                                key: 'search-orders',
                                menuOrder: 4,
                                group: 'Search',
                                groupIcon: 'icon-magnifier',
                                icon: 'icon-notebook',
                                title: 'Sales Orders',
                                url: "/salesorders",
                                templateUrl: "/f3-dash/templates/actions-search-orders.html",
                                controller: 'SearchOrdersController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'SEARCH_CUSTOMERS':
                            menu.push({
                                key: 'search-customers',
                                menuOrder: 5,
                                group: 'Search',
                                groupIcon: 'icon-magnifier',
                                icon: 'icon-users',
                                title: 'Customers',
                                url: "/customers",
                                templateUrl: "/f3-dash/templates/actions-search-customers.html",
                                controller: 'SearchCustomersController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'SEARCH_CASH_REFUNDS':
                            menu.push({
                                key: 'search-cash-refunds',
                                menuOrder: 6,
                                group: 'Search',
                                groupIcon: 'icon-magnifier',
                                icon: 'icon-action-undo',
                                title: 'Cash Refunds',
                                url: "/cash-refunds",
                                templateUrl: "/f3-dash/templates/actions-search-credit-memo.html",
                                controller: 'SearchCreditMemoController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'EXPORT_ITEM_TO_EXTERNAL_SYSTEM':
                            menu.push({
                                key: 'synchronize-exportitems',
                                menuOrder: 2,
                                group: 'Synchronize',
                                groupIcon: 'icon-refresh',
                                icon: 'icon-list',
                                title: 'Items Export',
                                url: "/itemsexport",
                                templateUrl: "/f3-dash/templates/actions-execute-item-export-sync-script.html",
                                controller: 'ExecuteItemExportScriptController',
                                controllerAs: 'viewModel'
                            });
                            menu.push({
                                key: 'selective-exportitems',
                                menuOrder: 19,
                                group: '',
                                groupIcon: 'icon-refresh',
                                icon: 'icon-list',
                                title: 'Selective Items Export',
                                url: "/selective-itemsexport",
                                templateUrl: "/f3-dash/templates/actions-selective-export-item.html",
                                controller: 'SelectiveExportItemController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'IMPORT_ITEM_FROM_EXTERNAL_SYSTEM':
                            menu.push({
                                key: 'synchronize-importitems',
                                menuOrder: 2,
                                group: 'Synchronize',
                                groupIcon: 'icon-refresh',
                                icon: 'icon-list',
                                title: 'Items Import',
                                url: "/itemsimport",
                                templateUrl: "/f3-dash/templates/actions-execute-item-import-sync-script.html",
                                controller: 'ExecuteItemImportScriptController',
                                controllerAs: 'viewModel'
                            });
                            menu.push({
                                key: 'selective-importitems',
                                menuOrder: 19,
                                group: '',
                                groupIcon: 'icon-refresh',
                                icon: 'icon-list',
                                title: 'Selective Items Import',
                                url: "/selective-itemsimport",
                                templateUrl: "/f3-dash/templates/actions-selective-import-item.html",
                                controller: 'SelectiveImportItemController',
                                controllerAs: 'viewModel'
                            });
                            break;
                        //Todo: Enable this specific item export later
                        /*case 'EXPORT_ITEM_TO_EXTERNAL_SYSTEM':
                         menu.push({
                         key: 'export-item',
                         menuOrder: 11,
                         title: 'Export Specific Item',
                         icon: 'icon-cloud-upload',
                         url: '/export-specific-item',
                         templateUrl: "/f3-dash/templates/actions-export-item.html",
                         controller: 'ExportSalesorderController',
                         controllerAs: 'viewModel'
                         });
                         break;*/

                        case 'UPDATE_ITEM_TO_EXTERNAL_SYSTEM':
                            menu.push({
                                key: 'synchronize-items',
                                menuOrder: 2,
                                group: 'Synchronize',
                                groupIcon: 'icon-refresh',
                                icon: 'icon-list',
                                title: 'Items Inventory',
                                url: "/items",
                                templateUrl: "/f3-dash/templates/actions-execute-item-sync-script.html",
                                controller: 'ExecuteItemSyncScriptController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'EXPORT_CASH_REFUND_TO_EXTERNAL_SYSTEM':
                            menu.push({
                                key: 'synchronize-cash-refunds',
                                menuOrder: 3,
                                group: 'Synchronize',
                                groupIcon: 'icon-refresh',
                                icon: 'icon-action-undo',
                                title: 'Cash Refunds',
                                url: "/cash-refunds",
                                templateUrl: "/f3-dash/templates/actions-execute-cash-refund-script.html",
                                controller: 'ExecuteCashRefundScriptController',
                                controllerAs: 'viewModel'
                            });

                            menu.push({
                                key: 'view-cash-refund-logs',
                                menuOrder: 8,
                                group: 'View Logs',
                                groupIcon: 'icon-graph',
                                icon: 'icon-action-undo',
                                title: 'Cash Refunds',
                                url: "/cash-refunds",
                                templateUrl: "/f3-dash/templates/actions-view-cash-refund-logs.html",
                                controller: 'ViewCashRefundLogsController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'EXPORT_ITEM_FULFILLMENT_TO_EXTERNAL_SYSTEM':
                            menu.push({
                                key: 'view-fulfilment-sync-logs',
                                menuOrder: 9,
                                group: 'View Logs',
                                groupIcon: 'icon-graph',
                                icon: 'icon-trophy',
                                title: 'Fulfillments',
                                url: "/fulfillment-sync",
                                templateUrl: "/f3-dash/templates/actions-view-fulfilment-sync-logs.html",
                                controller: 'ViewFulfilmentSyncLogsController',
                                controllerAs: 'viewModel'
                            });
                            break;

                        case 'VIEW_SCRUB':
                            menu.push({
                                key: 'view-scrub',
                                menuOrder: 12,
                                title: 'View Scrub',
                                icon: 'icon-eye',
                                navigateUrl: (function () {
                                    // create url of list
                                    var url = nlapiResolveURL('RECORD', 'customrecord_fc_scrub');
                                    url = url.replace('custrecordentry', 'custrecordentrylist');
                                    return url;

                                    //// redirect
                                    //var anchor = document.createElement('a');
                                    //anchor.setAttribute('href', url);
                                    //anchor.setAttribute('target', '_blank');
                                    //document.body.appendChild(anchor);
                                    //anchor.click();
                                })()
                            });
                            break;

                        default:
                            break;
                    }
                }
            }


            Utility.logDebug('ConnectorDashboardApi.generateMenuFromPermission(); // menu: ', JSON.stringify(menu));

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

        // SIDEBAR_TEMPLATE : '<li class="sidebar-title">' +
        //                     '  <select ng-change="actionsController.storeChanged()" ng-model="actionsController.selectedStore" ' +
        //                         'ng-options="store.name for store in actionsController.stores"></select>' +
        //                     '</li>' +
        //                     '<li class="sidebar-list">' +
        //                     '  <a href="#/">Dashboard <span class="menu-icon fa fa-tachometer"></span></a>' +
        //                     '</li>' +
        //                     '<li class="sidebar-list" ng-repeat="action in actionsController.actions track by $index">' +
        //                     '  <a ng-if="!!action.group" class="submenu-link"><span ng-bind="action.group"></span> <span class="menu-icon fa fa-minus"></span></a>' +
        //                     '  <a ng-if="!action.group && !action.navigateUrl" ui-sref="{{ action.key }}" > <span ng-bind="action.title"></span> <span class="menu-icon fa fa-{{ action.icon }}"></span></a>' +
        //                     '  <a ng-if="!!action.navigateUrl" ng-href="{{ action.navigateUrl }}" target="_blank"> <span ng-bind="action.title"></span> <span class="menu-icon {{ action.icon }}"></span></a>' +
        //                     '  <ul ng-if="!!action.actions">' +
        //                     '    <li class="sidebar-list" ng-repeat="subAction in action.actions">' +
        //                     '      <a ng-if="!subAction.navigateUrl" ui-sref="{{ subAction.key }}" > <span ng-bind="subAction.title"></span> <span class="menu-icon fa fa-{{ subAction.icon }}"></span></a>' +
        //                     '      <a ng-if="!!subAction.navigateUrl" ng-href="{{ subAction.navigateUrl }}" target="_blank"> <span ng-bind="subAction.title"></span> <span class="menu-icon {{ subAction.icon }}"></span></a>' +
        //                     '    </li>' +
        //                     '  </ul>' +
        //                     '</li>',


        /**
         * Description of method getFileUrl
         * @param parameter
         */
        getFileUrl: function () {
            try {
                var bundleId = FC_SYNC_CONSTANTS.BundleInfo.Id;

                if (!bundleId || bundleId.length <= 0) {
                    return "SuiteScripts/NS-SF-Con/util/";//This will be change in future if necessary
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
            indexPageValue = indexPageValue.replace('[STORES_JSON]', JSON.stringify(sideBar && sideBar.stores || []));
            indexPageValue = indexPageValue.replace('[SELECTED_STORE_JSON]', JSON.stringify(sideBar && sideBar.selectedStore || {}));
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


                    form = nlapiCreateForm('Folio3 Connector');
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

                var sidebarFile = nlapiLoadFile(this.getFileUrl() + "f3-dash/templates/_sidebar.html");

                var template = sidebarFile.getValue(); //this.SIDEBAR_TEMPLATE;
                var productList = ExternalSystemConfig.getAll();

                var stores = [];
                var selectedStore = null;

                for (var i = 0; i < productList.length; i++) {
                    var obj = productList[i];
                    var url = nlapiResolveURL('SUITELET', 'customscript_dashboard_sl', 'customdeploy_dashboard_sl');
                    url = url + '&store_id=' + obj.internalId;
                    obj.url = url;

                    var store = {
                        id: obj.internalId,
                        name: obj.systemDisplayName,
                        url: obj.url
                    };
                    stores.push(store);

                    if (store.id == store_id) {
                        selectedStore = store;
                    }
                }


                if (selectedStore == null) {
                    selectedStore = stores && stores[0];
                }


                //var template = this.SIDEBAR_TEMPLATE;
                //finalResult = finalResult + template;

                return {stores: stores, sidebarHtml: template, selectedStore: selectedStore};

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