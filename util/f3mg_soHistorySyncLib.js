/**
 * Created by sameer on 8/20/15.
 */

/**
 * OrderExportHelper class that has the functionality of
 */
var OrderExportHelper = (function () {
    return {

        /**
         * Gets Orders based on the the Store Id
         * @param allStores
         * @param storeId
         * @return {object[],[]}
         */
        getOrders: function () {
            var resultObject = {},
                records = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
            resultObject.internalId = nlapiGetRecordId();
            resultObject.magentoOrderIds = records.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
            resultObject.magentoStore = records.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore);
            return resultObject;
        },

        /**
         * Get Bill/Ship Address either from customer or sales order for sales order export
         * @param orderRecord
         * @param customerRec
         * @param {string} type {shippingaddress, billingaddress}
         * @param addressId
         * @return {object}
         */

        getAddress: function (orderRecord, customerRec, type, addressId) {

            var address = {};
            var line;
            var addressRec;

            if (type === 'shippingaddress') {
                address.mode = 'shipping';
                address.isDefaultBilling = '0';
                address.isDefaultShipping = '1';
            } else if (type === 'billingaddress') {
                address.mode = 'billing';
                address.isDefaultBilling = '1';
                address.isDefaultShipping = '0';
            }

            address.firstName = customerRec.getFieldValue('firstname') || '';
            address.lastName = customerRec.getFieldValue('lastname') || '';
            address.company = customerRec.getFieldValue('companyname') || '';
            address.fax = customerRec.getFieldValue('fax') || '';

            if (!Utility.isBlankOrNull(addressId)) {
                line = customerRec.findLineItemValue('addressbook', 'internalid', addressId);

                // load  customer subrecord(address)
                addressRec = customerRec.viewLineItemSubrecord('addressbook', 'addressbookaddress', line);


            } else {

                // load  sales order subrecord(shippingaddress)
                addressRec = orderRecord.viewSubrecord(type);
            }

            var street1 = addressRec.getFieldValue('addr1') || '';
            var street2 = addressRec.getFieldValue('addr2') || '';
            var street = street1 + ' ' + street2;
            street = nlapiEscapeXML(street.trim());
            address.street = street || ConnectorConstants.MagentoDefault.Address;
            address.telephone = addressRec.getFieldValue('addrphone') || customerRec.getFieldValue('phone') || ConnectorConstants.MagentoDefault.Telephone;
            address.attention = addressRec.getFieldValue('attention') || '';
            address.addressee = addressRec.getFieldValue('addressee') || '';
            address.city = addressRec.getFieldValue('city') || ConnectorConstants.MagentoDefault.City;
            address.state = addressRec.getFieldText('dropdownstate') || ConnectorConstants.MagentoDefault.State;
            address.stateId = '' || addressRec.getFieldValue('state') || ConnectorConstants.MagentoDefault.StateId;
            address.country = addressRec.getFieldValue('country') || ConnectorConstants.MagentoDefault.Country;
            address.zipCode = addressRec.getFieldValue('zip') || ConnectorConstants.MagentoDefault.Zip;
            address.addressId = '';

            //var state = address.stateId;
            // get magento mapped value
            /*if (!Utility.isBlankOrNull(state)) {
             state = FC_ScrubHandler.getMappedValue('State', state);
             }*/

            //  address.state contains text and address.stateId contains state code
            /*if (state === address.state) {
             address.stateId = '';
             address.state = addressRec.getFieldValue('dropdownstate');
             } else {
             address.stateId = state;
             }*/
            return address;

        },
        /**
         * Get Addresses either from customer or sales order for sales order export
         * @param orderRecord
         * @param customerRec
         * @return {Array}
         */
        getAddresses: function (orderRecord, customerRec) {
            var addresses = [];

            var shippingAddressId = orderRecord.getFieldValue('shipaddresslist');
            var billingAddressId = orderRecord.getFieldValue('billaddresslist');

            addresses.push(this.getAddress(orderRecord, customerRec, 'shippingaddress', shippingAddressId));
            addresses.push(this.getAddress(orderRecord, customerRec, 'billingaddress', billingAddressId));

            return addresses;
        },
        /**
         * Append customer data in orderDataObject for exporting sales order
         * @param orderRecord
         * @param orderDataObject
         */
        appendCustomerInDataObject: function (orderRecord, orderDataObject) {
            var obj = {};

            var entityId = parseInt(orderRecord.getFieldValue('entity'));
            var customerRec = null;
            try {
                customerRec = nlapiLoadRecord('customer', entityId, null);
            }
            catch (e) {
                Utility.logException('OrderExportHelper.appendCustomerInDataObject', e);
            }

            if (Utility.isBlankOrNull(customerRec)) {
                return;
            }

            /* Customer Creation Data */

            // We only cater existing customer in Magento so far
            obj.mode = 'customer';// it can be guest, register & customer
            var magentoId = customerRec.getFieldValue(ConnectorConstants.Entity.Fields.MagentoId);
            var storeId = ConnectorConstants.CurrentStore.systemId;
            obj.customerId = ConnectorCommon.getMagentoIdFromObjArray(magentoId, storeId);
            obj.email = customerRec.getFieldValue('email') || '';
            obj.firstName = customerRec.getFieldValue('firstname') || '';
            obj.lastName = customerRec.getFieldValue('lastname') || '';
            obj.company = '';
            obj.street = '';
            obj.city = '';
            obj.state = '';
            obj.stateId = '';
            obj.country = '';
            obj.telephone = '';
            obj.fax = '';
            obj.isDefaultBilling = '';
            obj.isDefaultShipping = '';
            obj.zipCode = '';
            obj.internalId = entityId;
            obj.magentoCustid = customerRec.getFieldValue('custentity_magento_custid') || '';

            // cater billing and shipping addresses
            obj.addresses = this.getAddresses(orderRecord, customerRec);

            orderDataObject.customer = obj;
        },
        /**
         * Append items data in orderDataObject for exporting sales order
         * @param orderRecord
         * @param orderDataObject
         */
        appendItemsInDataObject: function (orderRecord, orderDataObject) {
            var arr = [];

            try {
                var itemId;
                var sku;
                var itemQty;
                var itemPrice;
                var line;
                var itemIdsArr = [];
                var totalLines = orderRecord.getLineItemCount('item');

                for (line = 1; line <= totalLines; line++) {
                    itemId = orderRecord.getLineItemValue('item', 'item', line);
                    if (!Utility.isBlankOrNull(itemId) && itemIdsArr.indexOf(itemId) === -1) {
                        itemIdsArr.push(itemId);
                    }
                }

                // TODO: need to cater non-synced items
                var magentoItemsMap = ConnectorCommon.getMagentoItemIds(itemIdsArr);

                for (line = 1; line <= totalLines; line++) {
                    itemId = orderRecord.getLineItemValue('item', 'item', line);
                    sku = magentoItemsMap[itemId] || '';
                    itemQty = orderRecord.getLineItemValue('item', 'quantity', line) || 0;
                    itemPrice = orderRecord.getLineItemValue('item', 'rate', line) || 0;

                    var obj = {
                        itemId: itemId,
                        sku: sku,
                        quantity: itemQty,
                        price: itemPrice
                    };
                    arr.push(obj);
                }
            }
            catch (e) {
                Utility.logException('OrderExportHelper.appendItemsInDataObject', e);
            }

            orderDataObject.items = arr;
        },
        /**
         * Append Shipping information in orderDataObject for exporting sales order
         * @param orderRecord
         * @param orderDataObject
         */
        appendShippingInfoInDataObject: function (orderRecord, orderDataObject) {
            var obj = {};

            var carrier = orderRecord.getFieldValue('carrier') || '';
            var method = orderRecord.getFieldValue('shipmethod') || '';
            var shipmentMethod;

            orderDataObject.history += 'NetSuite Ship Carrier:  ' + carrier.toUpperCase() + ' ';
            orderDataObject.history += 'NetSuite Ship Method:  ' + (encodeURIComponent(orderRecord.getFieldText('shipmethod')) || 'BLANK') + ' ';

            // if any of carrier or method is empty then set default
            if (Utility.isBlankOrNull(carrier) || Utility.isBlankOrNull(method)) {
                shipmentMethod = 'DEFAULT';
            } else {
                shipmentMethod = carrier + '_' + method;
            }


            obj.shipmentMethod = FC_ScrubHandler.getMappedValue('ShippingMethod', shipmentMethod);

            // set shipping cost in object
            var shipmentCost = orderRecord.getFieldValue('shippingcost') || '0';
            var handlingcost = orderRecord.getFieldValue('handlingcost') || '0';
            obj.shipmentCost = parseFloat(shipmentCost) + parseFloat(handlingcost);

            orderDataObject.shipmentInfo = obj;
        },

        /**
         * Append Shipping information in orderDataObject for exporting sales order
         * @param orderRecord
         * @param orderDataObject
         */
        appendPaymentInfoInDataObject: function (orderRecord, orderDataObject) {
            var obj = {};

            obj.paymentMethod = 'checkmo';

            orderDataObject.paymentInfo = obj;
        },

        /**
         * Gets a single Order
         * @param parameter
         */
        getOrder: function (orderInternalId, store) {
            var orderDataObject = null;
            try {
                var orderRecord = nlapiLoadRecord('salesorder', orderInternalId, null);

                if (orderRecord !== null) {
                    orderDataObject = {};

                    orderDataObject.storeId = '1';
                    orderDataObject.nsObj = orderRecord;
                    // default is blank
                    orderDataObject.history = '';
                    orderDataObject.status = orderRecord.getFieldValue('orderstatus') || '';
                    orderDataObject.cancelledMagentoSOId = orderRecord.getFieldValue(ConnectorConstants.Transaction.Fields.CancelledMagentoSOId) || '';

                    var customerId = orderRecord.getFieldValue('entity');
                    var magentoCustomerIds = nlapiLookupField('customer', customerId, 'custentity_magento_custid');
                    ExportSalesOrders.processCustomer(customerId, magentoCustomerIds, store);

                    this.appendCustomerInDataObject(orderRecord, orderDataObject);
                    this.appendItemsInDataObject(orderRecord, orderDataObject);
                    this.appendShippingInfoInDataObject(orderRecord, orderDataObject);
                    this.appendPaymentInfoInDataObject(orderRecord, orderDataObject);

                    if(!!orderDataObject.cancelledMagentoSOId) {
                        orderDataObject.history += orderDataObject.cancelledMagentoSOId + 'E';
                    }

                }
            } catch (e) {
                Utility.logException('OrderExportHelper.getOrder', e);
            }
            Utility.logDebug('getOrder', JSON.stringify(orderDataObject));

            return orderDataObject;
        },

        /**
         *
         * @param orderInternalId
         * @param store
         * @param history
         * @returns {*}
         */
        getOrderToSync: function (orderInternalId, store, history) {
            Utility.logDebug('inside getOrderToSync', '');
            var orderDataObject = null;
            try {
                var orderRecord = nlapiLoadRecord('salesorder', orderInternalId, null);

                if (orderRecord !== null) {
                    orderDataObject = {};
                    orderDataObject.storeId = '1';
                    orderDataObject.history = history;
                }
            } catch (e) {
                Utility.logException('OrderExportHelper.getOrder', e);
            }
            Utility.logDebug('getOrder', JSON.stringify(orderDataObject));
            return orderDataObject;
        },

        /**
         Sets Magento Id in the Order record
         * @param parameter
         */
        setOrderMagentoId: function (magentoId, orderId) {
            try {
                nlapiSubmitField('salesorder', orderId, [ConnectorConstants.Transaction.Fields.MagentoSync, ConnectorConstants.Transaction.Fields.MagentoId], ['T', magentoId]);
            } catch (e) {
                Utility.logException('OrderExportHelper.setOrderMagentoId', e);
                ExportSalesOrders.markRecords(orderId, e.toString());
            }
        },

        /**
         * Set Magento Orders Line Ids in Line Items
         * @param orderData
         */
        setLineItemsMagentoOrderLineIds: function (orderInternalId, orderObject, magentoOrderLineIdData) {
            try {
                //Utility.logDebug('orderData.items', JSON.stringify(orderObject.items));
                var itemIdsArray = OrderExportHelper.getItemIdsArray(orderObject.items);
                var lineItemData = ConnectorCommon.getMagentoItemIds(itemIdsArray);
                Utility.logDebug('lineItemData.skuArray', JSON.stringify(lineItemData));
                var soRecord = nlapiLoadRecord('salesorder', orderInternalId);
                for (var i = 1; i <= soRecord.getLineItemCount('item'); i++) {
                    var itemId = soRecord.getLineItemValue('item', 'item', i);
                    var sku = lineItemData[itemId];
                    if(!!sku) {
                        var magentoOrderLineId = magentoOrderLineIdData[sku];
                        if(!!magentoOrderLineId) {
                            soRecord.setLineItemValue('item', 'custcol_mg_order_item_id', i, magentoOrderLineId);
                        }
                    }
                }
                nlapiSubmitRecord(soRecord);

            } catch (e) {
                Utility.logException('OrderExportHelper.setLineItemsMagentoOrderLineIds', e);
                ExportSalesOrders.markRecords(orderInternalId, e.toString());
            }
        },
        /**
         * Convert Line item Ids into Array
         * @param items
         * @returns {Array}
         */
        getItemIdsArray: function (items) {
            var itemIdsArray = [];
            try {
                for (var i = 0; i < items.length; i++) {
                    var obj = items[i];
                    itemIdsArray.push(obj.itemId);
                }
            } catch (e) {
                Utility.logException('OrderExportHelper.getItemIdsArray', e);
            }
            return itemIdsArray;
        },
        /**
         * Description of method setOrderMagentoSync
         * @param parameter
         */
        setOrderMagentoSync: function (orderId) {
            var result = false;
            try {
                nlapiSubmitField('transaction', orderId, 'custbody_magentosync_dev', 'T');
                result = true;
            } catch (e) {
                Utility.logException('OrderExportHelper.setOrderMagentoSync', e);
            }

            return result;
        },

        /**
         * Gets magento Request XML by the information passed
         * @param orderRecord
         * @param sessionId
         */
        getMagentoRequestXml: function (orderRecord, sessionId) {
            Utility.logDebug('inside getMagentoRequestXml...', '...');
            return XmlUtility.getCreateSalesOrderXml(orderRecord, sessionId);
        }
    };
})();


/**
 * ExportSalesOrders class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var ExportSalesOrders = (function () {
    return {

        startTime: (new Date()).getTime(),
        minutesAfterReschedule: 50,
        usageLimit: 500,

        /**
         * Extracts external System Information from the database
         * @param externalSystemConfig
         */
        extractExternalSystems: function (externalSystemConfig) {
            var externalSystemArr = [];

            externalSystemConfig.forEach(function (store) {
                ConnectorConstants.CurrentStore = store;
                var sessionID = XmlUtility.getSessionIDFromMagento(store.userName, store.password);
                if (!sessionID) {
                    Utility.logDebug('sessionID', 'sessionID is empty');
                    return;
                }
                store.sessionID = sessionID;
                // push store object after getting id for updating items in this store
                externalSystemArr.push(store);

            });

            return externalSystemArr;
        },

        /**
         * Processes Records
         * @param orderObject
         * @param store
         * @returns {{orderRecord: *, requsetXML: *, responseMagento: *, magentoIdObjArrStr: *, nsCustomerUpdateStatus: *, customerAddresses: *, allAddressedSynched: *, adr: number, logRec: nlobjRecord}}
         */
        processOrder: function (orderObject, store, history) {
            Utility.logDebug('In Order Record...', '');
            var orderRecord = OrderExportHelper.getOrderToSync(orderObject.internalId, store, history);
            Utility.logDebug('Order Record... Sending Request to Magento', JSON.stringify(orderRecord));
            this.sendRequestToMagento(orderObject.internalId, orderRecord, store, true);
        },

        /**
         * Send request to megento store
         * @param orderRecord
         */
        sendRequestToMagento: function(internalId, orderRecord, store, attemptRetryIfNeeded) {
            var magentoIdObjArrStr,
                nsOrderUpdateStatus,
                requestXml,
                responseMagento;
            //this.processCustomer(orderRecord.customer, store);

            Utility.logDebug('debug', 'Step-4');

            if (!orderRecord) {
                return null;
            }

            Utility.logDebug('debug', 'Step-5 - getMagentoRequestXml');

            requestXml = OrderExportHelper.getMagentoRequestXml(orderRecord, store.sessionID);
            Utility.logDebug('debug', 'Step-5a - returned from getting xml');
            ConnectorCommon.createLogRec(internalId, requestXml);

            Utility.logDebug('store.endpoint', store.endpoint);

            var xml = XmlUtility.soapRequestToMagento(requestXml);

            responseMagento = XmlUtility.validateAndTransformSalesorderCreationResponse(xml, 0);

            Utility.logDebug('debug', 'Step-5c');

            if (responseMagento.status) {
                Utility.logDebug('debug', 'Step-6');

                var incrementalIdData = XmlUtility.transformCreateSalesOrderResponse(xml);
                Utility.logDebug('incrementalIdData', incrementalIdData.orderIncrementId);

                var magentoOrderLineIdData = XmlUtility.transformCreateSalesOrderResponseForOrderLineId(xml);

                OrderExportHelper.setOrderMagentoId(incrementalIdData.orderIncrementId, internalId);
                OrderExportHelper.setLineItemsMagentoOrderLineIds(internalId, orderRecord, magentoOrderLineIdData);

            } else {
                if(attemptRetryIfNeeded) {
                    Utility.logDebug('retrying', 'retrying record synching');
                    //Utility.logDebug('orderRecord.shipmentInfo.shipmentMethod', orderRecord.shipmentInfo.shipmentMethod);

                    var retryStatus = retrySync(responseMagento.faultString, ConnectorConstants.RetryAction.RecordTypes.SalesOrder, orderRecord);
                    //Utility.logDebug('retryStatus.status', retryStatus.status);
                    if(retryStatus.status) {
                        var modifiedRecordObj = retryStatus.recordObj;
                        //Utility.logDebug('modifiedRecordObj.shipmentInfo.shipmentMethod', modifiedRecordObj.shipmentInfo.shipmentMethod);
                        //Utility.logDebug('retrying', 'sending to magento again with modified object');
                        this.sendRequestToMagento(internalId, modifiedRecordObj, store, false);
                    } else {
                        //Log error with fault code that this customer is not synched with magento
                        Utility.logDebug('final stuff', 'orderId  ' + internalId + ' Not Synched Due to Error  :  ' + responseMagento.faultString);
                        ExportSalesOrders.markRecords(internalId, ' Not Synched Due to Error  :  ' + responseMagento.faultString);
                    }
                }
                else {
                    //Log error with fault code that this customer is not synched with magento
                    Utility.logDebug('final stuff', 'orderId  ' + internalId + ' Not Synched Due to Error  :  ' + responseMagento.faultString);
                    ExportSalesOrders.markRecords(internalId, ' Not Synched Due to Error  :  ' + responseMagento.faultString);
                }
            }
        },

        /**
         * sync customer belongs to current sales order if not synched to magento
         * @param customer
         * @param store
         */
        processCustomer: function(customerId, magentoCustomerIds, store) {

            try {
                var customerAlreadySynched = this.customerAlreadySyncToStore(magentoCustomerIds, store.systemId);
                Utility.logDebug('magentoCustomerIds  #  store.systemId', magentoCustomerIds + '  #  ' + store.systemId);
                Utility.logDebug('customerAlreadySynched', customerAlreadySynched);
                if(!customerAlreadySynched) {
                    var customerObj = {};
                    customerObj.internalId = customerId;
                    customerObj.magentoCustomerIds = magentoCustomerIds;
                    Utility.logDebug('customerObj.internalId', customerObj.internalId);
                    Utility.logDebug('customerObj.magentoCustomerIds', customerObj.magentoCustomerIds);
                    if(!!customerObj.magentoCustomerIds) {
                        createCustomerInMagento(customerObj, store, customerObj.magentoCustomerIds);
                    } else {
                        createCustomerInMagento(customerObj, store);
                    }
                } else {
                    // check if the customer is modified. If so, update the customer first in Magento
                    var customer = CustomerSync.getCustomer(customerId, store.systemId);
                    var customerObj = {};
                    customerObj.internalId = customerId;
                    customerObj.magentoCustomerIds = magentoCustomerIds;
                    Utility.logDebug('inside If customer is already synced', 'Starting');
                    if(customer.nsObj.getFieldValue(CustomerSync.FieldName.CustomerModified) === 'T') {
                        // mark customer as unmodified
                        Utility.logDebug('Customer is modified', 'Mark Customer unmodified and start syncing process');
                        nlapiSubmitField(CustomerSync.internalId, customerId, CustomerSync.FieldName.CustomerModified, 'F');
                        try {
                            //update customer in Magento Store
                            Utility.logDebug('Customer Syncing Starting', '');
                            Utility.logDebug('Customer Syncing Starting - Store', JSON.stringify(store));
                            CustomerSync.updateCustomerInMagento(customerObj, store, CustomerSync.getMagentoIdMyStore(customerObj.magentoCustomerIds, store.internalId), '');
                            Utility.logDebug('Customer Syncing Finished', '');
                        } catch(ex) {
                            Utility.logException('Error in updating Customer to Magento', ex);
                        }
                    }
                }
            }
            catch (ex) {
                Utility.logException('error in processCustomer during sales order synchronization', ex);
            }
        },

        /**
         * Check either customer already synchronized to current store
         * @param magentoCustomerId
         * @param storeId
         */
        customerAlreadySyncToStore: function(magentoCustomerId, storeId) {
            var alreadySync = false;
            try {
                if (!!magentoCustomerId) {
                    var storesCustomersIds = JSON.parse(magentoCustomerId);
                    if (!!storesCustomersIds && storesCustomersIds.length > 0) {
                        for (var i = 0; i < storesCustomersIds.length; i++) {
                            var obj = storesCustomersIds[i];
                            if (!!obj.StoreId && obj.StoreId == storeId) {
                                alreadySync = true;
                                break;
                            }
                        }
                    }
                }
            }
            catch (ex) {
                Utility.logException('error in customerAlreadySyncToStore?', ex);
            }
            return alreadySync;
        },

        /**
         * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
         * @returns {Void}
         */
        scheduled: function (type) {
            try {

                if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                    Utility.logDebug('LICENSE', 'Your license has been expired.');
                    return null;
                }

                // initialize constants
                ConnectorConstants.initialize();

                // getting configuration
                var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
                var context = nlapiGetContext();
                var orderIds, externalSystemArr;

                context.setPercentComplete(0.00);
                Utility.logDebug('Starting', '');

                externalSystemArr = this.extractExternalSystems(externalSystemConfig);

                if (externalSystemArr.length <= 0) {
                    Utility.logDebug('Customer Export Script', 'Store(s) is/are not active');
                    return null;
                }

                try {

                    for (var i in externalSystemArr) {

                        var store = externalSystemArr[i];

                        ConnectorConstants.CurrentStore = store;

                        Utility.logDebug('debug', 'Step-2');

                        orderIds = OrderExportHelper.getOrders(false, store.systemId);

                        Utility.logDebug('fetched sales order count', orderIds.length);
                        Utility.logDebug('debug', 'Step-3');

                        if (orderIds.length > 0) {
                            for (var c = 0; c < orderIds.length; c++) {

                                var orderObject = orderIds[c];

                                try {
                                    this.processOrder(orderObject, store);
                                    context.setPercentComplete(Math.round(((100 * c) / orderIds.length) * 100) / 100);  // calculate the results

                                    // displays the percentage complete in the %Complete column on the Scheduled Script Status page
                                    context.getPercentComplete();  // displays percentage complete
                                } catch (e) {
                                    ExportSalesOrders.markRecords(orderObject.internalId, e.toString());
                                }
                                if (this.rescheduleIfNeeded(context, null)) {
                                    return null;
                                }
                            }
                        }

                        if (this.rescheduleIfNeeded(context, null)) {
                            return null;
                        }
                    }

                } catch (e) {
                    Utility.logException('ExportSalesOrders.scheduled - Iterating Orders', e);
                }
                Utility.logDebug(' Ends', '');

            } catch (e) {
                Utility.logException('ExportSalesOrders.scheduled', e);
            }
        },

        parseFloatNum: function (num) {
            var no = parseFloat(num);
            if (isNaN(no)) {
                no = 0;
            }
            return no;
        },

        getDateUTC: function (offset) {
            var today = new Date();
            var utc = today.getTime() + (today.getTimezoneOffset() * 60000);
            offset = parseInt(this.parseFloatNum(offset * 60 * 60 * 1000));
            today = new Date(utc + offset);
            return today;
        },

        isRunningTime: function () {
            return true; // todo undo
            var currentDate = this.getDateUTC(0);
            var dateTime = nlapiDateToString(currentDate, 'datetimetz');

            var time = nlapiDateToString(currentDate, 'timeofday');

            var strArr = time.split(' ');

            if (strArr.length > 1) {
                var hour = 0;
                var AmPm = strArr[1];
                var timeMinsArr = strArr[0].split(':');

                if (timeMinsArr.length > 0) {
                    hour = parseInt(timeMinsArr[0]);
                }

                if (AmPm === 'am' && hour >= 1 && hour < 7) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Gets record from DAO
         * @returns {*}
         */
        getRecords: function (lastId) {

            //HACK: TODO: Need to remove this hard coded id
            var filter = [];
            if (!lastId) {
                lastId = '0';
            }
            filter.push(new nlobjSearchFilter('internalidnumber', 'parent', 'greaterthanorequalto', lastId, null));
            //TODO: Put your logic here
            var records = null;

            return records;
        },

        /**
         * Reschedules only there is any need
         * @param context Context Object
         * @returns {boolean} true if rescheduling was necessary and done, false otherwise
         */
        rescheduleIfNeeded: function (context, params) {
            try {
                var usageRemaining = context.getRemainingUsage();

                if (usageRemaining < this.usageLimit) {
                    this.rescheduleScript(context, params);
                    return true;
                }

                var endTime = (new Date()).getTime();

                var minutes = Math.round(((endTime - this.startTime) / (1000 * 60)) * 100) / 100;
                Utility.logDebug('Time', 'Minutes: ' + minutes + ' , endTime = ' + endTime + ' , startTime = ' + this.startTime);
                // if script run time greater than 50 mins then reschedule the script to prevent time limit exceed error

                if (minutes > this.minutesAfterReschedule) {
                    this.rescheduleScript(context, params);
                    return true;
                }

            } catch (e) {
                Utility.logException('ExportSalesOrders.rescheduleIfNeeded', e);
            }
            return false;
        },

        /**
         * sends records to Salesforce using its API
         */
        processRecords: function (records) {
            var context = nlapiGetContext();

            Utility.logDebug('inside processRecords', 'processRecords');

            //HACK: Need to remove this
            var count = records.length;

            Utility.logDebug('value of count', count);

            for (var i = 0; i < count; i++) {
                try {
                    // handle the script to run only between 1 am to 7 am inclusive
                    if (!this.isRunningTime()) {

                        return;
                    }

                    if (this.rescheduleIfNeeded(context, params)) {
                        return;
                    }

                } catch (e) {
                    Utility.logException('ExportSalesOrders.processRecords', e);
                }
            }
        },

        /**
         * Marks record as completed
         */
        markRecords: function (orderId, msg) {

            try {
                nlapiSubmitField('salesorder', orderId, ConnectorConstants.Transaction.Fields.MagentoSyncStatus, msg);
            } catch (e) {
                Utility.logException('ExportSalesOrders.markRecords', e);
            }
        },

        /**
         * Call this method to reschedule current schedule script
         * @param ctx nlobjContext Object
         */
        rescheduleScript: function (ctx, params) {
            //var status = 'TEST RUN';
            var status = nlapiScheduleScript(ctx.getScriptId(), ctx.getDeploymentId(), params);
            Utility.logDebug('ExportSalesOrders.rescheduleScript', 'Status: ' + status + ' Params: ' + JSON.stringify(params));
        }
    };
})();
