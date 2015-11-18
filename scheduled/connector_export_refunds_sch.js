/**
 * Created by wahajahmed on 5/21/2015.
 */


/**
 * RefundExportHelper class that has the functionality of
 */
var RefundExportHelper = (function () {
    return {

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
                Utility.logException('RefundExportHelper.appendCustomerInDataObject', e);
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
        appendItemsInDataObject: function (creditMemoRecord, creditMemoDataObject, store) {
            creditMemoDataObject.items = [];
            var adjustmentRefundItem = store.entitySyncInfo.cashrefund.adjustmentRefundItem;
            Utility.logDebug('adjustmentRefundItem', adjustmentRefundItem);
            var adjustmentRefundAmount = 0;
            var cashSaleItemsArray = [];
            var totalLines = creditMemoRecord.getLineItemCount('item');
            for (var line = 1; line <= totalLines; line++) {
                var nsId = creditMemoRecord.getLineItemValue('item', 'item', line);
                var qty = creditMemoRecord.getLineItemValue('item', 'quantity', line);
                var amount = creditMemoRecord.getLineItemValue('item', 'amount', line);
                var itemId = creditMemoRecord.getLineItemValue('item', 'item', line);
                var orderItemId = creditMemoRecord.getLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, line);
                if (adjustmentRefundItem != itemId) {
                    if (!Utility.isBlankOrNull(orderItemId)) {
                        cashSaleItemsArray[orderItemId] = {qty: qty, amount: amount};
                    }
                }
                else {
                    adjustmentRefundAmount += parseFloat(amount);
                }
            }
            if (adjustmentRefundAmount > 0) {
                creditMemoDataObject.adjustmentPositive = adjustmentRefundAmount;
            }
            Utility.logDebug('cashSaleItemsArray', JSON.stringify(cashSaleItemsArray));

            // 'created from' would be either a cash sale or an invoice
            var createdFromId = creditMemoRecord.getFieldValue('createdfrom');
            var createdFromRecordType = this.getRecordTypeOfCreatedFromTransaction(createdFromId);
            Utility.logDebug('createdFromId # createdFromRecordType', createdFromId + ' # ' + createdFromRecordType);
            var createdFromRec = nlapiLoadRecord(createdFromRecordType, createdFromId);
            var createdFromRecordLinesCount = createdFromRec.getLineItemCount('item');
            for (var line = 1; line <= createdFromRecordLinesCount; line++) {
                var orderItemId = createdFromRec.getLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, line);
                if (!Utility.isBlankOrNull(orderItemId)) {
                    var lineObj = cashSaleItemsArray[orderItemId];
                    var obj = {};
                    obj.qty = !lineObj ? 0 : lineObj.qty;
                    obj.amount = !lineObj ? 0 : lineObj.amount;
                    obj.orderItemId = orderItemId;
                    creditMemoDataObject.items.push(obj);
                }
            }

            /*for (var line = 1; line <= totalLines; line++) {
             var nsId = creditMemoRecord.getLineItemValue('item', 'item', line);
             var qty = creditMemoRecord.getLineItemValue('item', 'quantity', line);

             //var magentoOrderItemIdMap = magentoOrderItemIdsMap.hasOwnProperty(nsId) ? magentoOrderItemIdsMap[nsId] : null;
             //var orderItemId = !!magentoOrderItemIdMap && magentoOrderItemIdMap.hasOwnProperty('orderItemId') ? magentoOrderItemIdMap.orderItemId : null;
             var itemId = creditMemoRecord.getLineItemValue('item', 'item', line);
             var orderItemId = creditMemoRecord.getLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, line);
             if(adjustmentRefundItem != itemId) {
             if (!Utility.isBlankOrNull(orderItemId)) {
             var obj = {};
             obj.nsId = nsId;
             obj.qty = qty;
             obj.orderItemId = orderItemId;
             creditMemoDataObject.items.push(obj);
             }
             }
             else {
             var amount = creditMemoRecord.getLineItemValue('item', 'amount', line);
             adjustmentRefundAmount += parseFloat(amount);
             }
             }*/
        },

        /**
         * Get record type of the 'Created From' transaction
         * @param internalId
         */
        getRecordTypeOfCreatedFromTransaction: function (internalId) {
            var records = nlapiSearchRecord('transaction', null, [new nlobjSearchFilter('internalid', null, 'is', internalId)]);
            if (!!records && records.length > 0) {
                return records[0].getRecordType();
            }
            return '';
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
            obj.shipmentCost = orderRecord.getFieldValue('shippingcost') || '0';

            orderDataObject.shipmentInfo = obj;
        },

        /**
         Sets Magento Id in the Order record
         * @param parameter
         */
        setOrderExternalSystemId: function (magentoId, orderId) {
            try {
                nlapiSubmitField('salesorder', orderId, [ConnectorConstants.Transaction.Fields.MagentoSync, ConnectorConstants.Transaction.Fields.MagentoId], ['T', magentoId]);
            } catch (e) {
                Utility.logException('RefundExportHelper.setOrderMagentoId', e);
                ExportCustomerRefunds.markRecords(orderId, e.toString());
            }
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
                Utility.logException('RefundExportHelper.setOrderMagentoSync', e);
            }

            return result;
        },

        /**
         * Gets magento Request XML by the information passed
         * @param orderRecord
         * @param sessionId
         */
        getMagentoRequestXml: function (orderRecord, sessionId) {
            return XmlUtility.getCreateSalesOrderXml(orderRecord, sessionId);
        },

        /**
         * Process credit memo to create memo in magento
         * @param record
         * @param sessionID
         * @param store
         */
        processCustomerRefund: function (record, sessionID, store) {
            var cashRefundNsId = record.internalId;
            try {
                // get refund data
                var cashRefund = this.getCustomerRefund(cashRefundNsId, store);

                var responseBody = ConnectorConstants.CurrentWrapper.createCustomerRefund(sessionID, cashRefund, store);
                if (!!responseBody.status) {
                    if (!!responseBody.data.increment_id) {
                        ExportCustomerRefunds.setCashRefundMagentoId(responseBody.data.increment_id, cashRefundNsId);
                    } else {
                        Utility.logDebug('Error', 'Other system Credit Memo Increment Id not found');
                        Utility.throwException("RECORD_DOES_NOT_EXIST", "Other system Credit Memo Increment Id not found");
                    }
                    Utility.logDebug('successfully', 'Other system credit memo created');
                    // this handling is for maintaining order ids in custom record
                    if (this.cashRefundsFromCustomRecord()) {
                        RecordsToSync.markProcessed(record.id, RecordsToSync.Status.Processed);
                    }
                } else {
                    Utility.logException('Some error occurred while creating Other system credit memo', responseBody.error);
                    Utility.throwException("RECORD_EXPORT", 'Some error occurred while creating Other system credit memo - ' + responseBody.error);
                }
            } catch (e) {
                Utility.logException('RefundExportHelper.processCustomerRefund', e);
                // this handling is for maintaining order ids in custom record
                if (this.cashRefundsFromCustomRecord()) {
                    RecordsToSync.markProcessed(record.id, RecordsToSync.Status.ProcessedWithError);
                }
                ExportCustomerRefunds.markRecords(cashRefundNsId, e.toString());
            }
        },

        /**
         * Get Credit Memo request parameters
         * @param cashRefundObj
         */
        getRequestParameters: function (cashRefundObj, store) {
            var params = {};
            params.order_increment_id = cashRefundObj.orderId;
            params.invoice_increment_id = cashRefundObj.invoiceId;
            params.shipping_cost = !!cashRefundObj.shippingCost ? cashRefundObj.shippingCost : 0;
            params.adjustment_positive = !!cashRefundObj.adjustmentPositive ? cashRefundObj.adjustmentPositive : 0;
            params.quantities = [];
            for (var i in cashRefundObj.items) {
                params.quantities.push({
                    order_item_id: cashRefundObj.items[i].orderItemId,
                    qty: cashRefundObj.items[i].qty
                });
                //params.quantities[cashRefundObj.items[i].orderItemId] = cashRefundObj.items[i].qty;
            }

            var onlineCapturingPaymentMethod = this.checkPaymentCapturingMode(cashRefundObj.paymentMethod, cashRefundObj.isSOFromOtherSystem, store);
            params.capture_online = onlineCapturingPaymentMethod.toString();

            return params;
        },

        /**
         * Check either payment of this Invoice should capture online or not
         */
        checkPaymentCapturingMode: function (sOPaymentMethod, isSOFromOtherSystem, store) {
            var isOnlineMethod = this.isOnlineCapturingPaymentMethod(sOPaymentMethod, store);
            if (!!isSOFromOtherSystem && isSOFromOtherSystem == 'T' && isOnlineMethod) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * Check either payment method capturing is online supported or not??
         * @param sOPaymentMethodId
         */
        isOnlineCapturingPaymentMethod: function (sOPaymentMethodId, store) {
            var onlineSupported = false;
            switch (sOPaymentMethodId) {
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.Discover:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.MasterCard:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.Visa:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.AmericanExpress:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.PayPal:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.EFT:
                    onlineSupported = true;
                    break;
                default :
                    onlineSupported = false;
                    break;
            }

            return onlineSupported;
        },

        /**
         * Gets a credit memo data object
         * @param parameter
         */
        getCustomerRefund: function (refundInternalId, store) {
            var cashRefundDataObject = null;
            try {
                var cashRefundRecord = nlapiLoadRecord('cashrefund', refundInternalId, null);

                if (cashRefundRecord !== null) {
                    cashRefundDataObject = {};

                    cashRefundDataObject.storeId = cashRefundRecord.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore);
                    cashRefundDataObject.orderId = cashRefundRecord.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                    cashRefundDataObject.invoiceId = cashRefundRecord.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoInvoiceId);
                    cashRefundDataObject.shippingCost = cashRefundRecord.getFieldValue('shippingcost');
                    cashRefundDataObject.comment = cashRefundRecord.getFieldValue('memo');
                    cashRefundDataObject.adjustmentPositive = '';
                    cashRefundDataObject.adjustmentNegative = '';
                    cashRefundDataObject.notifyCustomer = '0';
                    cashRefundDataObject.includeComment = '1';
                    cashRefundDataObject.refundToStoreCreditAmount = '';// store id optional field know itself
                    cashRefundDataObject.paymentMethod = cashRefundRecord.getFieldValue('paymentmethod');
                    cashRefundDataObject.isSOFromOtherSystem = cashRefundRecord.getFieldValue(ConnectorConstants.Transaction.Fields.FromOtherSystem);
                    cashRefundDataObject.nsObj = cashRefundRecord;

                    this.appendItemsInDataObject(cashRefundRecord, cashRefundDataObject, store);
                }
            } catch (e) {
                Utility.logException('CreditMemoExportHelper.getCustomerRefund', e);
            }
            Utility.logDebug('getCustomerRefund', JSON.stringify(cashRefundDataObject));

            return cashRefundDataObject;
        },
        cashRefundsFromCustomRecord: function () {
            // if deployment id is this it means that we should fetch the orders from custom record instead searching blindly
            return nlapiGetContext().getDeploymentId() === ConnectorConstants.SuiteScripts.ScheduleScript.CashRefundExportToExternalSystem.deploymentId;
        },
        getSalesOrdersFromCustomRecord: function (allStores, storeId) {
            var fils = [];
            var searchResults = null;
            var results = [];

            fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.RecordType, null, "is", "cashrefund", null));
            fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.Status, null, "is", RecordsToSync.Status.Pending, null));
            fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.Operation, null, "is", RecordsToSync.Operation.EXPORT, null));
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
                    results.push({
                        internalId: recordId,
                        id: searchResult.getId()
                    });
                }
            }

            return results;
        },

        getCashRefundsByStore: function (store) {
            var fils = [];
            var records = [];
            var results;

            try {
                var ageOfRecordsToSyncInDays = store.entitySyncInfo.cashrefund.ageOfRecordsToSyncInDays;
                Utility.logDebug('ageOfRecordsToSyncInDays', ageOfRecordsToSyncInDays);
                var currentDate = Utility.getDateUTC(0);
                var oldDate = nlapiAddDays(currentDate, '-' + ageOfRecordsToSyncInDays);
                oldDate = nlapiDateToString(oldDate);
                oldDate = oldDate.toLowerCase();
                oldDate = nlapiDateToString(nlapiStringToDate(oldDate, 'datetime'), 'datetime');
                Utility.logDebug('oldDate', oldDate);
                fils.push(new nlobjSearchFilter('lastmodifieddate', null, 'onorafter', oldDate, null));

                fils.push(new nlobjSearchFilter('mainline', null, 'is', 'T', null));
                fils.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoStore, null, 'is', store.systemId, null));
                fils.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoId, null, 'isnotempty', null, null));
                fils.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.CustomerRefundMagentoId, null, 'isempty', null, null));
                //fils.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoSync, null, 'is', 'T', null));
                //fils.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoSyncStatus, null, 'isempty', null, null));

                results = nlapiSearchRecord('cashrefund', null, fils, null);

                if (!!results) {
                    for (var i in results) {
                        var result = results[i];
                        records.push({
                            internalId: result.getId()
                        });
                    }
                }
            } catch (e) {
                Utility.logException('ExportCustomerRefunds.getRecords', e);
            }

            return records;
        },

        /**
         * Gets customer refunds search records/ids if exist for syncing
         * @return {Array}
         */
        getRecords: function (store) {
            var result = null;

            if (this.cashRefundsFromCustomRecord()) {
                result = this.getSalesOrdersFromCustomRecord(null, store.systemId);
            } else {
                result = this.getCashRefundsByStore(store);
            }

            return result;
        }

    };
})();


/**
 * ExportCustomerRefunds class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var ExportCustomerRefunds = (function () {
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
                ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                ConnectorConstants.CurrentWrapper.initialize(store);
                var sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password);
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
         Sets Magento Id in the Order record
         * @param parameter
         */
        setCashRefundMagentoId: function (magentoId, creditMemoId) {
            try {
                nlapiSubmitField('cashrefund', creditMemoId, [ConnectorConstants.Transaction.Fields.MagentoSync, ConnectorConstants.Transaction.Fields.CustomerRefundMagentoId], ['T', magentoId]);
            } catch (e) {
                Utility.logException('CreditMemoExportHelper.setCashRefundMagentoId', e);
                ExportCustomerRefunds.markRecords(creditMemoId, e.toString());
            }
        },

        /**
         * sends refund records to other system
         * @param records
         * @param sessionID
         * @param store
         */
        processRecords: function (records, sessionID, store) {
            var context = nlapiGetContext();
            var params = {};
            var count = records.length;

            Utility.logDebug('ExportCustomerRefunds.processRecords', 'value of count: ' + count);

            for (var i = 0; i < count; i++) {

                RefundExportHelper.processCustomerRefund(records[i], sessionID, store);

                if (this.rescheduleIfNeeded(context, params)) {
                    return;
                }
            }
        },

        /**
         * sync customer belongs to current sales order if not synched to magento
         * @param customer
         * @param store
         */
        processCustomer: function (customerId, magentoCustomerIds, store) {

            try {
                var customerAlreadySynched = this.customerAlreadySyncToStore(magentoCustomerIds, store.systemId);
                Utility.logDebug('magentoCustomerIds  #  store.systemId', magentoCustomerIds + '  #  ' + store.systemId);
                Utility.logDebug('customerAlreadySynched', customerAlreadySynched);
                if (!customerAlreadySynched) {
                    var customerObj = {};
                    customerObj.internalId = customerId;
                    customerObj.magentoCustomerIds = magentoCustomerIds;
                    Utility.logDebug('customerObj.internalId', customerObj.internalId);
                    Utility.logDebug('customerObj.magentoCustomerIds', customerObj.magentoCustomerIds);
                    if (!!customerObj.magentoCustomerIds) {
                        createCustomerInMagento(customerObj, store, customerObj.magentoCustomerIds);
                    } else {
                        createCustomerInMagento(customerObj, store);
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
        customerAlreadySyncToStore: function (magentoCustomerId, storeId) {
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

                Utility.logDebug('ExportCustomerRefunds.scheduled', 'Starting');

                if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                    Utility.logDebug('LICENSE', 'Your license has been expired.');
                    return null;
                }

                // initialize constants
                ConnectorConstants.initialize();

                // getting configuration
                var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
                var context = nlapiGetContext();
                var records, externalSystemArr;

                context.setPercentComplete(0.00);
                Utility.logDebug('Starting', '');

                externalSystemArr = this.extractExternalSystems(externalSystemConfig);

                if (externalSystemArr.length <= 0) {
                    Utility.logDebug('Cash Refund Export Script', 'Store(s) is/are not active');
                    return null;
                }

                try {

                    for (var i in externalSystemArr) {

                        var store = externalSystemArr[i];

                        ConnectorConstants.CurrentStore = store;
                        // Check for feature availability
                        if (!FeatureVerification.isPermitted(Features.EXPORT_CASH_REFUND_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                            Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_CASH_REFUND_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                            continue;
                        }
                        ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                        ConnectorConstants.CurrentWrapper.initialize(store);
                        //var sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password);
                        // There is no use for session id for current magento, because its creating using custom php api,
                        // In future if its needed for woocommerce or magento, we will uncomment the above line
                        var sessionID = '';
                        Utility.logDebug('debug', 'Step-2');

                        var records = RefundExportHelper.getRecords(store);

                        if (records !== null && records.length > 0) {
                            Utility.logDebug('fetched refunds count', records.length);
                            Utility.logDebug('debug', 'Step-3');
                            this.processRecords(records, sessionID, store);
                        } else {
                            Utility.logDebug('ExportCustomerRefunds.scheduled', 'No records found to process - StoreId: ' + store.systemId);
                        }

                        if (this.rescheduleIfNeeded(context, null)) {
                            return null;
                        }

                        Utility.logDebug('ExportCustomerRefunds.scheduled', ' Ends');
                    }

                    if (RefundExportHelper.cashRefundsFromCustomRecord()) {
                        var orders = RefundExportHelper.getSalesOrdersFromCustomRecord(true, null);
                        if (orders.length > 0) {
                            Utility.logDebug('startup', 'Reschedule');
                            nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), null);
                            return;
                        }
                    }

                } catch (e) {
                    Utility.logException('ExportCustomerRefunds.scheduled - Iterating Orders', e);
                }
                Utility.logDebug(' Ends', '');

            } catch (e) {
                Utility.logException('ExportCustomerRefunds.scheduled', e);
            }
        },

        /**
         * Marks record as completed
         */
        markRecords: function (orderId, msg) {

            try {
                nlapiSubmitField('cashrefund', orderId, ConnectorConstants.Transaction.Fields.MagentoSyncStatus, msg);
            } catch (e) {
                Utility.logException('ExportCustomerRefunds.markRecords', e);
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
                Utility.logException('ExportCustomerRefunds.rescheduleIfNeeded', e);
            }
            return false;
        },

        /**
         * Call this method to reschedule current schedule script
         * @param ctx nlobjContext Object
         */
        rescheduleScript: function (ctx, params) {
            //var status = 'TEST RUN';
            var status = nlapiScheduleScript(ctx.getScriptId(), ctx.getDeploymentId(), params);
            Utility.logDebug('ExportCustomerRefunds.rescheduleScript', 'Status: ' + status + ' Params: ' + JSON.stringify(params));
        }
    };
})();

function ExportCustomerRefundsScheduled(type) {
    return ExportCustomerRefunds.scheduled(type);
}
