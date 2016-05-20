/**
 * Created by zahmed on 13-Jan-15.
 *
 * Description:
 * - This script is responsible for importing salesorders and customer & his addresses from Magento store(s)
 * -
 * Referenced By:
 * -
 * Dependency:
 * - Script Parameters:
 *   -
 * -
 * - Script Id:
 *   - customscript_connectororderimport
 * -
 * - Deployment Id:
 *   - customdeploy_connectororderimport
 * -
 * - Scripts:
 *   - base64_lib.js
 *   - CyberSourceSingleTransactionReport.js
 *   - folio3ConnectorLicenseVerification.js
 *   - mc_sync_constants.js
 *   - f3mg_ns_mg_shipping_methods_map_dao.js
 *   - f3mg_connector_common.js
 *   - f3_external_system_config_dao.js
 *   - f3_utility_methods.js
 *   - f3mg_connector_constants.js
 *   - f3mg_xml_utility.js
 *   - f3_client_factory.js
 *   - f3mg_connector_models.js
 */

var SO_IMPORT_MIN_USAGELIMIT = 1000;        // For the safe side its 1000, we calculate , in actual it is 480

function syncSalesOrderMagento(sessionID, updateDate) {
    var order = {};

    var serverOrdersResponse;
    var salesOrderDetails;
    var orders;
    var products;
    var netsuiteMagentoProductMap;
    var netsuiteMagentoProductMapData;
    var result = {};
    var context;
    var usageRemaining;

    //order.updateDate='2013-07-18 00:00:00';
    try {
        result.errorMsg = '';
        result.infoMsg = '';
        order.updateDate = updateDate;
        order.orderStatus = ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.status || [];

        // Make Call and Get Data

        Utility.logDebug('sessionID', sessionID);
        serverOrdersResponse = getSalesOrderList(order, sessionID, ConnectorConstants.CurrentStore);
        Utility.logDebug('syncSalesOrderMagento > serverOrdersResponse', JSON.stringify(serverOrdersResponse));

        // If some problem
        if (!serverOrdersResponse.status) {
            result.errorMsg = serverOrdersResponse.faultCode + '--' + serverOrdersResponse.faultString;
            ErrorLogNotification.logAndNotify({
                externalSystem: ConnectorConstants.CurrentStore.systemId,
                recordType: "salesorder",
                recordId: "",
                recordDetail: "",
                action: "Sales Order Import from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName,
                message: "An error occurred while getting Slaes Order List from " + ConnectorConstants.CurrentStore.systemDisplayName,
                messageDetails: result.errorMsg,
                status: F3Message.Status.ERROR,
                externalSystemText: ConnectorConstants.CurrentStore.systemType,
                system: "NetSuite"
            });

            return result;
        }

        orders = serverOrdersResponse.orders;

        if (orders !== null) {
            result.infoMsg = orders.length + ' Order(s) Found for Processing ';

            for (var i = 0; i < orders.length; i++) {

                var salesOrderObj = {};

                try {
                    Utility.logDebug('orders[' + i + ']', JSON.stringify(orders[i]));
                    Utility.logDebug('ConnectorConstants.CurrentStore.systemId', ConnectorConstants.CurrentStore.systemId);
                    var nsId;
                    var isUpdated = false;

                    salesOrderDetails = ConnectorConstants.CurrentWrapper.getSalesOrderInfo(orders[i].order_id, sessionID);
                    Utility.logDebug('ZEE->salesOrderDetails', JSON.stringify(salesOrderDetails));

                    // Could not fetch sales order information from Magento
                    if (!salesOrderDetails.status) {
                        Utility.logDebug('Could not fetch sales order information from Magento', 'orderId: ' + orders[i].increment_id);
                        result.errorMsg = salesOrderDetails.faultCode + '--' + salesOrderDetails.faultString;
                        throw new CustomException({
                            code: "GET_ORDER_INFO_FROM_EXTERNAL_SYSTEM",
                            message: result.errorMsg,
                            recordType: "salesorder",
                            recordId: orders[i].order_id,
                            system: ConnectorConstants.CurrentStore.systemType,
                            exception: null,
                            action: "Import Sales Order from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                        });
                    }

                    // Check if this SO already exists
                    nsId = ConnectorCommon.isOrderSynced(orders[i].increment_id, ConnectorConstants.CurrentStore.systemId);
                    if (nsId) {
                        Utility.logDebug('Sales Order already exist with Magento ID: ', orders[i].increment_id);
                        Utility.logDebug('Sales Order already exist with NetSuite ID: ', nsId);
                        // Check for feature availability
                        if (!FeatureVerification.isPermitted(Features.UPDATE_SO_FROM_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                            Utility.logEmergency('FEATURE PERMISSION', Features.UPDATE_SO_FROM_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                            Utility.throwException("ORDER_EXIST", 'Sales Order already exist with Magento Id: ' + orders[i].increment_id);
                            //Utility.throwException("PERMISSION", Features.UPDATE_SO_FROM_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                        } else {
                            // check if order updated
                            isUpdated = ConnectorCommon.isOrderUpdated(orders[i].increment_id, ConnectorConstants.CurrentStore.systemId, salesOrderDetails.customer.updatedAt);
                            Utility.logDebug('isUpdate', isUpdated);
                            if (!isUpdated) {
                                Utility.throwException("ORDER_EXIST", 'Sales Order already exist with Magento Id: ' + orders[i].increment_id);
                            }
                        }
                    }

                    Utility.logDebug('isOrderSynced - ' + orders[i].increment_id, "NO");

                    //Utility.logDebug('stages_w', 'Step-c');

                    var shippingAddress = salesOrderDetails.shippingAddress;
                    var billingAddress = salesOrderDetails.billingAddress;
                    var payment = salesOrderDetails.payment;
                    products = salesOrderDetails.products;
                    
                    Utility.logDebug('products', JSON.stringify(products));
                    netsuiteMagentoProductMap = ConnectorConstants.CurrentWrapper.getNsProductIdsByExtSysIds(products, "BY_MAP");

                    //Utility.logDebug('stages_w', 'Step-e');

                    if (!Utility.isBlankOrNull(netsuiteMagentoProductMap.errorMsg)) {
                        Utility.logDebug('result', JSON.stringify(result));
                        Utility.logDebug('COULD NOT EXECUTE Mapping perfectly', 'Please convey to Folio3');
                        throw new CustomException({
                            code: "GET_ORDER_ITEMS_MAPPING",
                            message: netsuiteMagentoProductMap.errorMsg,
                            recordType: "salesorder",
                            recordId: orders[i].order_id,
                            system: ConnectorConstants.CurrentStore.systemType,
                            exception: null,
                            action: "Import Sales Order from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                        });
                    }

                    netsuiteMagentoProductMapData = netsuiteMagentoProductMap.data;
                    Utility.logDebug('After getting product mapping', JSON.stringify(netsuiteMagentoProductMapData));

                    Utility.logDebug('stages_w', 'before getting custoemr');
                    var customer = ConnectorModels.getCustomerObject(salesOrderDetails.customer);
                    Utility.logDebug('stages_w', 'after getting customer');
                    // adding shipping and billing address in customer object getting from sales order
                    customer[0].addresses = ConnectorModels.getAddressesFromOrder(shippingAddress, billingAddress);
                    Utility.logDebug('ZEE->customer', JSON.stringify([shippingAddress, billingAddress, customer]));
                    var customerNSInternalId = null;
                    var customerSearchObj = {};
                    var customerIndex = 0;
                    var leadCreateAttemptResult = {};

                    // if order comes with guest customer whose record is not existed in Magento
                    if (Utility.isBlankOrNull(salesOrderDetails.customer.customer_id)) {
                        customer[customerIndex]._isGuestCustomer = true;
                        // Check for feature availability
                        if (!FeatureVerification.isPermitted(Features.IMPORT_SO_GUEST_CUSTOMER, ConnectorConstants.CurrentStore.permissions)) {
                            Utility.logEmergency('FEATURE PERMISSION', Features.IMPORT_SO_GUEST_CUSTOMER + ' NOT ALLOWED');
                            Utility.throwException("PERMISSION", Features.IMPORT_SO_GUEST_CUSTOMER + ' NOT ALLOWED');
                        }
                        Utility.logDebug('Guest Customer Exists', '');

                        // adding shipping and billing address in customer object getting from sales order
                        //customer[0].addresses = ConnectorModels.getAddressesFromOrder(shippingAddress, billingAddress);
                        //Utility.logDebug('stages_w', 'Step-h');
                        // searching customer record in NetSuite
                        customerSearchObj = ConnectorConstants.Client.searchCustomerInNetSuite(customer[customerIndex].email, null);
                        //Utility.logDebug('stages_w', 'Step-i');
                        // if customer record found in NetSuite, update the customer record
                        if (customerSearchObj.status) {
                            customerNSInternalId = customerSearchObj.netSuiteInternalId;
                        } else {
                            Utility.logDebug('Start Creating Lead', '');
                            leadCreateAttemptResult = ConnectorConstants.Client.createLeadInNetSuite(customer[customerIndex], sessionID, true);
                            Utility.logDebug('Attempt to create lead', JSON.stringify(leadCreateAttemptResult));
                            if (!Utility.isBlankOrNull(leadCreateAttemptResult.errorMsg) || !Utility.isBlankOrNull(leadCreateAttemptResult.infoMsg)) {
                                continue;
                            }
                            Utility.logDebug('End Creating Lead', '');
                            customerNSInternalId = leadCreateAttemptResult.id;
                        }

                        Utility.logDebug('NetSuite Id for Guest Customer:', customerNSInternalId);

                        if (!!customerNSInternalId) {
                            // make order data object
                            salesOrderObj = ConnectorModels.getSalesOrderObject(salesOrderDetails.customer, '', products,
                                netsuiteMagentoProductMapData, customerNSInternalId, '', shippingAddress,
                                billingAddress, payment);

                            Utility.logDebug('ZEE->salesOrderObj', JSON.stringify(salesOrderObj));

                            if (!!nsId) {
                                ConnectorConstants.Client.updateSalesOrder(salesOrderObj, nsId);
                            } else {
                                ConnectorConstants.Client.createSalesOrder(salesOrderObj);
                            }

                        }
                    }
                    else {
                        // create or update customer record
                        // start creating customer
                        Utility.logDebug('Magento Customer Id: ', customer[customerIndex].customer_id);

                        // searching customer record in NetSuite
                        customerSearchObj =
                            ConnectorConstants.Client.searchCustomerInNetSuite(customer[customerIndex].email, customer[customerIndex].customer_id);

                        // if customer record found in NetSuite, update the customer record
                        if (customerSearchObj.status) {
                            var objUpdateCustomer = ConnectorConstants.Client.updateCustomerInNetSuite(
                                customerSearchObj.netSuiteInternalId, customer[customerIndex], sessionID);
                            customerNSInternalId = customerSearchObj.netSuiteInternalId;
                            Utility.logDebug('Customer Updated in NetSuite', 'Customer Id: ' + customerNSInternalId);
                        }
                        else {
                            // if customer record not found in NetSuite, create a lead record in NetSuite
                            Utility.logDebug('Start Creating Lead', '');
                            leadCreateAttemptResult = ConnectorConstants.Client.createLeadInNetSuite(customer[customerIndex], sessionID, false);
                            Utility.logDebug('Attempt to create lead', JSON.stringify(leadCreateAttemptResult));
                            if (!Utility.isBlankOrNull(leadCreateAttemptResult.errorMsg) || !Utility.isBlankOrNull(leadCreateAttemptResult.infoMsg)) {
                                continue;
                            }
                            Utility.logDebug('End Creating Lead', '');
                            customerNSInternalId = leadCreateAttemptResult.id;
                        }

                        // make order data object
                        salesOrderObj = ConnectorModels.getSalesOrderObject(
                            salesOrderDetails.customer, '', products, netsuiteMagentoProductMapData, customerNSInternalId, '',
                            shippingAddress, billingAddress, payment);
                        Utility.logDebug('ZEE->salesOrderObj', JSON.stringify(salesOrderObj));

                        // create/update sales order
                        if (!!nsId) {
                            // Check for feature availability
                            if (!FeatureVerification.isPermitted(Features.UPDATE_SO_FROM_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                                Utility.logEmergency('FEATURE PERMISSION', Features.UPDATE_SO_FROM_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                                Utility.throwException("ORDER_EXIST", 'Sales Order already exist with Magento Id: ' + orders[i].increment_id);
                                //Utility.throwException("PERMISSION", Features.UPDATE_SO_FROM_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                            } else {
                                Utility.logDebug("Before: updateSalesOrder", "Before");
                                ConnectorConstants.Client.updateSalesOrder(salesOrderObj, nsId);
                                Utility.logDebug("After: updateSalesOrder", "After");
                            }
                        } else {
                            Utility.logDebug("Before: createSalesOrder", "Before");
                            ConnectorConstants.Client.createSalesOrder(salesOrderObj);
                            Utility.logDebug("After: createSalesOrder", "After");
                        }
                    }

                    // this handling is for maintaining order ids in custom record
                    if (ordersFromCustomRecord()) {
                        RecordsToSync.markProcessed(orders[i].id, RecordsToSync.Status.Processed);
                    }

                    // Write Code to handle Re-scheduling in case of going down than min Governance
                    context = nlapiGetContext();
                    usageRemaining = context.getRemainingUsage();

                    if (usageRemaining <= SO_IMPORT_MIN_USAGELIMIT) {
                        result.infoMsg = 'Reschedule';
                        return result;
                    }


                    // set script complate percentage
                    context.setPercentComplete(Math.round(((100 * i) / orders.length) * 100) / 100);  // calculate the results

                    // displays the percentage complete in the %Complete column on
                    // the Scheduled Script Status page
                    context.getPercentComplete();

                }
                catch (ex) {
                    Utility.logException('SO of Order ID ' + orders[i].increment_id + ' Failed', ex);
                    if (!(ex instanceof nlobjError && ex.getCode().toString() === "ORDER_EXIST")) {
                        ErrorLogNotification.logAndNotify({
                            externalSystem: ConnectorConstants.CurrentStore.systemId,
                            recordType: "salesorder",
                            recordId: orders[i].order_id,
                            recordDetail: ConnectorConstants.CurrentStore.systemDisplayName + " # " + orders[i].increment_id,
                            action: "Sales Order Import from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName,
                            message: "An error occurred while creating Sales Order in NetSuite",
                            messageDetails: ex,
                            status: F3Message.Status.ERROR,
                            externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName,
                            system: ConnectorConstants.CurrentStore.systemType
                        });
                    }
                    // this handling is for maintaining order ids in custom record
                    if (ordersFromCustomRecord()) {
                        RecordsToSync.markProcessed(orders[i].id, RecordsToSync.Status.ProcessedWithError);
                    }
                }

                // TODO: Just for testing purpose, remove it then
                //i = orders.length;
            }
        }
        else {
            result.infoMsg = 'No Order(s) Found';
            return result;
        }

    }
    catch (ex) {
        Utility.logDebug('syncSalesOrderMagento', ex);
        result.errorMsg = ex.toString();
    }

    return result;

}

/**
 * Get list of sales order from magento according to provided parameters
 * @param soListParams
 * @param sessionID
 * @param store
 * @returns {*}
 */
function getSalesOrderList(soListParams, sessionID, store) {
    var responseMagentoOrders = null;

    if (ordersFromCustomRecord()) {
        responseMagentoOrders = getSalesOrdersFromCustomRecord(null, store.systemId);
    }
    else if (!!store.entitySyncInfo.common && !!store.entitySyncInfo.common.customRestApiUrl) {
        Utility.logDebug('Inside MagentoRestApiWrapper', 'getSalesOrdersList call');
        var mgRestAPiWrapper = new MagentoRestApiWrapper();
        responseMagentoOrders = mgRestAPiWrapper.getSalesOrdersList(soListParams.updateDate, store.entitySyncInfo.salesorder.status, store);
        Utility.logDebug('responseMagentoOrders from MagentoRestApiWrapper', JSON.stringify(responseMagentoOrders));
    }
    else {
        responseMagentoOrders = ConnectorConstants.CurrentWrapper.getSalesOrders(soListParams, sessionID);
    }

    return responseMagentoOrders;
}
function startup(type) {
    if (type.toString() === 'scheduled' || type.toString() === 'userinterface' || type.toString() === 'ondemand') {
        if (MC_SYNC_CONSTANTS.isValidLicense()) {
            // inititlize constants
            ConnectorConstants.initialize();
            // getting configuration
            var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
            var sessionID;
            var context = nlapiGetContext();
            var result = {};
            var soUpdateDate;
            var lastStoreId;
            var store;
            var specificStoreId;

            // getting last store id if script has been rescheduled
            lastStoreId = context.getSetting('SCRIPT', ConnectorConstants.ScriptParameters.LastStoreIdSalesOrder);
            // TODO: remove hard coding
            lastStoreId = Utility.isBlankOrNull(lastStoreId) ? 1 : parseInt(lastStoreId);

            // this handling is for specific store sync handling
            specificStoreId = context.getSetting('SCRIPT', ConnectorConstants.ScriptParameters.SalesOrderImportStoreId);
            Utility.logDebug("specificStoreId", specificStoreId);
            if (!Utility.isBlankOrNull(specificStoreId)) {
                lastStoreId = specificStoreId;
            }

            //for (var system = lastStoreId, specificStoreCount = 0; system < externalSystemConfig.length; system++, specificStoreCount++) {
            for (var system  in externalSystemConfig) {
                // Add a Check whether categories synched or not , if not then stop and give msg that ensure the sync of categories first
                try {
                    // if specific store id exist then iterate loop only for one time
                    //if (!Utility.isBlankOrNull(specificStoreId) && specificStoreCount !== 0) {
                    //    break;
                    //}

                    if(!!specificStoreId)
                    {
                        if(system !== specificStoreId)
                        continue;
                    }

                    // getting store/system object
                    store = externalSystemConfig[system];
                    if (!store) {
                        //Utility.logDebug('store ' + system, 'This store is null');
                        continue;
                    }

                    Utility.logDebug("StoreId", system.toString());

                    // set the percent complete parameter to 0.00
                    context.setPercentComplete(0.00);
                    // set store for ustilizing in other functions
                    ConnectorConstants.CurrentStore = store;
                    ConnectorCommon.initiateEmailNotificationConfig();
                    // Check for feature availability
                    if (!FeatureVerification.isPermitted(Features.IMPORT_SO_FROM_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                        Utility.logEmergency('FEATURE PERMISSION', Features.IMPORT_SO_FROM_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                        ErrorLogNotification.logAndNotify({
                            externalSystem: ConnectorConstants.CurrentStore.systemId,
                            recordType: "salesorder",
                            recordId: nlapiGetRecordId(),
                            recordDetail : "",
                            action: F3Message.Action.SALES_ORDER_IMPORT,
                            message: Features.IMPORT_SO_FROM_EXTERNAL_SYSTEM + ' NOT ALLOWED',
                            messageDetails: "Please convey to Folio3.",
                            status: F3Message.Status.ERROR,
                            externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName,
                            system : ConnectorConstants.CurrentStore.systemType
                        });
                        return;
                    }
                    ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                    ConnectorConstants.CurrentWrapper.initialize(store);

                    // Check for feature availability
                    if (FeatureVerification.isPermitted(Features.IMPORT_SO_DUMMMY_ITEM, ConnectorConstants.CurrentStore.permissions)) {
                        ConnectorConstants.initializeDummyItem();
                    } else {
                        Utility.logEmergency('FEATURE PERMISSION', Features.IMPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                    }

                    var sofrequency = store.entitySyncInfo.salesorder.noOfDays;
                    //var sofrequency = 120;

                    soUpdateDate = ConnectorCommon.getUpdateDate(-1 * sofrequency,
                        ConnectorConstants.CurrentWrapper.getDateFormat());
                    Utility.logDebug('soUpdateDate', soUpdateDate);

                    sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password);
                    if (!sessionID) {
                        Utility.logDebug('sessionID', 'sessionID is empty');
                        ErrorLogNotification.logAndNotify({
                            externalSystem: ConnectorConstants.CurrentStore.systemId,
                            recordType: "salesorder",
                            recordId: "",
                            recordDetail: "",
                            action: "Sales Order Import from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName,
                            message: "Unable to fetch Session Id from " + ConnectorConstants.CurrentStore.systemDisplayName,
                            messageDetails: "Look into logs",
                            status: F3Message.Status.ERROR,
                            externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName,
                            system: "NetSuite"
                        });
                        return;
                    }

                    Utility.logDebug('startup', 'Start Syncing');

                    result = syncSalesOrderMagento(sessionID, soUpdateDate);

                    // Something Wrong with SO Sync
                    if (!Utility.isBlankOrNull(result.errorMsg)) {
                        Utility.logDebug('Master Scheduler', 'Job Ending With Message ' + result.errorMsg);
                    }
                    else {
                        if (result.infoMsg.toString() === 'Reschedule') {
                            Utility.logDebug('startup', 'Reschedule');
                            var params = {};
                            params[ConnectorConstants.ScriptParameters.LastStoreIdSalesOrder] = system;
                            params[ConnectorConstants.ScriptParameters.SalesOrderImportStoreId] = specificStoreId;
                            nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), null);
                            return;
                        }
                        else if (ordersFromCustomRecord()) {
                            var orders;
                            var params = {};

                            // specific store handling
                            if (!Utility.isBlankOrNull(specificStoreId)) {
                                orders = getSalesOrdersFromCustomRecord(false, specificStoreId);
                                params[ConnectorConstants.ScriptParameters.SalesOrderImportStoreId] = specificStoreId;
                            } else {
                                orders = getSalesOrdersFromCustomRecord(true, null);
                            }

                            if (orders.length > 0) {
                                Utility.logDebug('startup', 'Reschedule');
                                nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), params);
                                return;
                            }
                        }
                        Utility.logDebug('startup', 'JOB RAN SUCCESSFULLyy');
                    }
                } catch (ex) {
                    Utility.logException('startup', ex);
                }
            }
        } else {
            Utility.logDebug('Validate', 'License has expired');
        }
    }
}

var ordersFromCustomRecord = function () {
    // if deployment id is this it means that we should fetch the orders from custom record instead searching blindly
    return nlapiGetContext().getDeploymentId() === ConnectorConstants.SuiteScripts.ScheduleScript.SalesOrderImportFromExternalSystem.deploymentId;
};

var getSalesOrdersFromCustomRecord = function (allStores, storeId) {
    var fils = [];
    var searchResults = null;
    var results = {
        orders: [],
        status: false
    };
    var orders = [];

    fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.RecordType, null, "is", "salesorder", null));
    fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.Status, null, "is", RecordsToSync.Status.Pending, null));
    fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.Operation, null, "is", RecordsToSync.Operation.IMPORT, null));
    if (!allStores) {
        fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.ExternalSystem, null, 'is', storeId, null));
    } else {
        fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.ExternalSystem, null, 'noneof', '@NONE@', null));
    }

    searchResults = RecordsToSync.lookup(fils);

    for (var i in searchResults) {
        var searchResult = searchResults[i];
        var recordId = searchResult.getValue(RecordsToSync.FieldName.RecordId);
        if (!!recordId) {
            orders.push({
                increment_id: recordId,
                id: searchResult.getId()
            });
        }
    }

    results.orders = orders;
    results.status = true;

    return results;
};