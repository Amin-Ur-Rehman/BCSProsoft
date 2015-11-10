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


        // Make Call and Get Data
        serverOrdersResponse = getSalesOrderList(order, sessionID, ConnectorConstants.CurrentStore);
        Utility.logDebug('syncSalesOrderMagento > serverOrdersResponse', JSON.stringify(serverOrdersResponse));

        // If some problem
        if (!serverOrdersResponse.status) {
            result.errorMsg = serverOrdersResponse.faultCode + '--' + serverOrdersResponse.faultString;
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
                    // Check if this SO already exists
                    if (ConnectorCommon.isOrderSynced(orders[i].increment_id, ConnectorConstants.CurrentStore.systemId)) {
                        Utility.logDebug('Sales Order already exist with Magento Id: ', orders[i].increment_id);
                        continue;
                    }

                    Utility.logDebug('isOrderSynced - ' + orders[i].increment_id, "NO");

                    salesOrderDetails = ConnectorConstants.CurrentWrapper.getSalesOrderInfo(orders[i].increment_id, sessionID);
                    Utility.logDebug('ZEE->salesOrderDetails', JSON.stringify(salesOrderDetails));
                    //Utility.logDebug('stages_w', 'Step-c');

                    // Could not fetch sales order information from Magento
                    if (!salesOrderDetails.status) {
                        Utility.logDebug('Could not fetch sales order information from Magento', 'orderId: ' + orders[i].increment_id);
                        result.errorMsg = salesOrderDetails.faultCode + '--' + salesOrderDetails.faultString;
                        continue;
                    }

                    var shippingAddress = salesOrderDetails.shippingAddress;
                    var billingAddress = salesOrderDetails.billingAddress;
                    var payment = salesOrderDetails.payment;
                    products = salesOrderDetails.products;

                    Utility.logDebug('products', JSON.stringify(products));
                    netsuiteMagentoProductMap = ConnectorConstants.CurrentWrapper.getNsProductIdsByExtSysIds(products);

                    //Utility.logDebug('stages_w', 'Step-e');

                    if (!Utility.isBlankOrNull(netsuiteMagentoProductMap.errorMsg)) {
                        Utility.logDebug('result', JSON.stringify(result));
                        Utility.logDebug('COULD NOT EXECUTE Mapping perfectly', 'Please convey to Folio3');
                        continue;
                    }

                    netsuiteMagentoProductMapData = netsuiteMagentoProductMap.data;
                    Utility.logDebug('After getting product mapping', JSON.stringify(netsuiteMagentoProductMapData));

                    Utility.logDebug('stages_w', 'before getting custoemr');
                    var customer = ConnectorModels.getCustomerObject(salesOrderDetails.customer);
                    Utility.logDebug('stages_w', 'after getting customer');
                    // adding shipping and billing address in customer object getting from sales order
                    customer[0].addresses = ConnectorModels.getAddressesFromOrder(shippingAddress, billingAddress);
                    //Utility.logDebug('ZEE->customer', JSON.stringify(customer));
                    var customerNSInternalId = null;
                    var customerSearchObj = {};
                    var customerIndex = 0;
                    var leadCreateAttemptResult = {};

                    // if order comes with guest customer whose record is not existed in Magento
                    if (Utility.isBlankOrNull(salesOrderDetails.customer.customer_id)) {
                        // Check for feature availability
                        if (!FeatureVerification.isPermitted(Features.IMPORT_SO_GUEST_CUSTOMER, ConnectorConstants.CurrentStore.permissions)) {
                            Utility.logEmergency('FEATURE PERMISSION', Features.IMPORT_SO_GUEST_CUSTOMER + ' NOT ALLOWED');
                            continue;
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

                            ConnectorConstants.Client.createSalesOrder(salesOrderObj);
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
                            ConnectorConstants.Client.updateCustomerInNetSuite(
                                customerSearchObj.netSuiteInternalId, customer[customerIndex], sessionID);
                            customerNSInternalId = customerSearchObj.netSuiteInternalId;
                            Utility.logDebug('Customer Updated in NetSuite', 'Customer Id: ' + customerNSInternalId);
                        }
                        else {
                            // if customer record not found in NetSuite, create a lead record in NetSuite
                            Utility.logDebug('Start Creating Lead', '');
                            leadCreateAttemptResult =
                                ConnectorConstants.Client.createLeadInNetSuite(customer[customerIndex], sessionID, false);
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
                        // create sales order
                        ConnectorConstants.Client.createSalesOrder(salesOrderObj);
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
    if (!!store.entitySyncInfo.common && !!store.entitySyncInfo.common.customRestApiUrl) {
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

            // getting last store id if script has been rescheduled
            lastStoreId = context.getSetting('SCRIPT', ConnectorConstants.ScriptParameters.LastStoreIdSalesOrder);
            // TODO: remove hard coding
            lastStoreId = Utility.isBlankOrNull(lastStoreId) ? 1 : parseInt(lastStoreId);

            for (var system = lastStoreId; system < externalSystemConfig.length; system++) {
                // Add a Check whether categories synched or not , if not then stop and give msg that ensure the sync of categories first
                try {
                    // getting store/system object
                    store = externalSystemConfig[system];
                    if (!store) {
                        //Utility.logDebug('store ' + system, 'This store is null');
                        continue;
                    }
                    // set the percent complete parameter to 0.00
                    context.setPercentComplete(0.00);
                    // set store for ustilizing in other functions
                    ConnectorConstants.CurrentStore = store;
                    // Check for feature availability
                    if (!FeatureVerification.isPermitted(Features.IMPORT_SO_FROM_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                        Utility.logEmergency('FEATURE PERMISSION', Features.IMPORT_SO_FROM_EXTERNAL_SYSTEM + ' NOT ALLOWED');
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
                        continue;
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
                            nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), null);
                        }
                        else {
                            Utility.logDebug('startup', 'JOB RAN SUCCESSFULLyy');
                        }
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