/**
 * Created by ubaig on 01/23/2015.
 * Description:
 * - This script is reponsible for exporting sales orders from Magento to NetSuite
 * -
 * Referenced By:
 * -
 * Dependencies:
 * -
 * -
 */

/**
 * OrderExportHelper class that has the functionality of
 */
var OrderExportHelper = (function () {
    return {
        ordersFromCustomRecord: function () {
            // if deployment id is this it means that we should fetch the orders from custom record instead searching blindly
            return nlapiGetContext().getDeploymentId() === ConnectorConstants.SuiteScripts.ScheduleScript.SalesOrderExportToExternalSystem.deploymentId;
        },
        getSalesOrdersFromCustomRecord: function (allStores, storeId) {
            var fils = [];
            var searchResults = null;
            var results = [];

            fils.push(new nlobjSearchFilter(RecordsToSync.FieldName.RecordType, null, "is", "salesorder", null));
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

        getOrdersByStore: function (allStores, storeId) {
            var _storeId;
            var filsExp;

            var records;
            var result = [];
            var arrCols = [];
            var resultObject;
            var yesterday;

            Utility.logDebug('getting orders for storeId', storeId);

            var ageOfRecordsToSyncInDays = ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.ageOfRecordsToSyncInDays;
            //Utility.logDebug('ageOfRecordsToSyncInDays', ageOfRecordsToSyncInDays);

            var currentDate = Utility.getDateUTC(0);
            //Utility.logDebug('currentDate', currentDate);
            var oldDate = nlapiAddDays(currentDate, '-' + ageOfRecordsToSyncInDays);
            //Utility.logDebug('oldDate', oldDate);
            oldDate = nlapiDateToString(oldDate);
            //Utility.logDebug('first nlapiDateToString', oldDate);
            oldDate = oldDate.toLowerCase();
            //Utility.logDebug('oldDate toLowerCase', oldDate);
            oldDate = nlapiDateToString(nlapiStringToDate(oldDate, 'datetime'), 'datetime');
            //Utility.logDebug('oldNetsuiteDate', oldDate);

            yesterday = nlapiDateToString(nlapiStringToDate(nlapiDateToString(nlapiAddDays(currentDate, '-1')).toLowerCase(), 'datetime'), 'datetime');
            _storeId = !allStores ? storeId : "@NONE@";

            filsExp = [
                [ConnectorConstants.Transaction.Fields.MagentoStore, "is", _storeId],
                "AND", ["type", "anyof", "SalesOrd"],
                "AND", ["memorized", "is", "F"],
                "AND", ["mainline", "is", "T"],
                "AND", [ConnectorConstants.Transaction.Fields.MagentoSync, "is", "F"],
                "AND", [ConnectorConstants.Transaction.Fields.MagentoId, "isempty", null],
                "AND", [ConnectorConstants.Transaction.Fields.DontSyncToMagento, "is", "F"],
                "AND", [
                    [
                        ["lastmodifieddate", "onorafter", oldDate], "AND", [ConnectorConstants.Transaction.Fields.MagentoSyncStatus, "isempty", null]
                    ],
                    "OR",
                    [
                        ["datecreated", "onorafter", yesterday], "AND", [ConnectorConstants.Transaction.Fields.MagentoSyncStatus, "isnotempty", null]
                    ]
                ]
            ];

            arrCols.push((new nlobjSearchColumn('internalid', null, null)).setSort(false));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.Transaction.Fields.MagentoId, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.Transaction.Fields.MagentoStore, null, null));
            arrCols.push(new nlobjSearchColumn("tranid", null, null));

            records = nlapiSearchRecord('transaction', null, filsExp, arrCols);

            if (!Utility.isBlankOrNull(records) && records.length > 0) {

                for (var i = 0; i < records.length; i++) {
                    resultObject = {};

                    resultObject.internalId = records[i].getId();
                    resultObject.magentoOrderIds = records[i].getValue(ConnectorConstants.Transaction.Fields.MagentoId, null, null);
                    resultObject.magentoStore = records[i].getValue(ConnectorConstants.Transaction.Fields.MagentoStore, null, null);
                    resultObject.tranid = records[i].getValue("tranid", null, null);

                    result.push(resultObject);
                }
            }
            return result;
        },

        /**
         * Gets Orders based on the the Store Id
         * @param allStores
         * @param storeId
         * @return {object[],[]}
         */
        getOrders: function (allStores, storeId) {
            var result = null;

            if (this.ordersFromCustomRecord()) {
                result = this.getSalesOrdersFromCustomRecord(allStores, storeId);
            } else {
                result = this.getOrdersByStore(allStores, storeId);
            }

            return result;
        },
        /**
         * Get Bill/Ship Address either from customer or sales order for sales order export
         * @param orderRecord
         * @param customerRec
         * @param {string} type {shippingaddress,  billingaddress}
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

            //address.firstName = customerRec.getFieldValue('firstname') || '';
            //address.lastName = customerRec.getFieldValue('lastname') || '';
            address.company = customerRec.getFieldValue('companyname') || '';
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            var isPerson = customerRec.getFieldValue('isperson') === "T";
            var companyName = Utility.getBlankForNull(customerRec.getFieldValue('companyname'));
            var entityid = Utility.getBlankForNull(customerRec.getFieldValue('entityid'));
            if (isPerson) {
                address.firstName = customerRec.getFieldValue('firstname');
                address.middleName = Utility.getBlankForNull(customerRec.getFieldValue('middlename'));
                address.lastName = customerRec.getFieldValue('lastname');
            } else {
                if (Utility.isBlankOrNull(companyName)) {
                    companyName = entityid;
                }
                var names = CustomerSync.getFirstNameLastName(companyName);
                address.firstName = names['firstName'];
                address.middleName = "";
                address.lastName = names['lastName'];
            }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            address.fax = customerRec.getFieldValue('fax') || '';

            if (!Utility.isBlankOrNull(addressId)) {
                line = customerRec.findLineItemValue('addressbook', 'internalid', addressId);

                // load  customer subrecord(address)
                addressRec = customerRec.viewLineItemSubrecord('addressbook', 'addressbookaddress', line);

            } else {

                // load  sales order subrecord(shippingaddress)
                addressRec = orderRecord.viewSubrecord(type);
            }
            if (Utility.isBlankOrNull(addressRec)) {
                throw new CustomException({
                    code: "SALES_ORDER_ADDRESS",
                    message: "Sales Order shipping or billing address is empty.",
                    recordType: "salesorder",
                    recordId: orderRecord.getId(),
                    system: "NetSuite",
                    exception: null,
                    action: "Sales Order Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                });
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
                throw new CustomException({
                    code: "GET_CUSTOMER_DATA_FOR_EXPORT",
                    message: "Error in loading Customer record in NetSuite",
                    recordType: "customer",
                    recordId: entityId,
                    system: "NetSuite",
                    exception: e,
                    action: "Sales Order Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                });
                //Utility.throwException("GET_CUSTOMER_DATA_FOR_EXPORT", e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
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
            //obj.firstName = customerRec.getFieldValue('firstname') || '';
            //obj.lastName = customerRec.getFieldValue('lastname') || '';
            obj.isPerson = customerRec.getFieldValue('isperson') === "T";
            obj.companyName = Utility.getBlankForNull(customerRec.getFieldValue('companyname'));
            obj.entityid = Utility.getBlankForNull(customerRec.getFieldValue('entityid'));
            if (obj.isPerson) {
                obj.firstName = customerRec.getFieldValue('firstname');
                obj.middleName = Utility.getBlankForNull(customerRec.getFieldValue('middlename'));
                obj.lastName = customerRec.getFieldValue('lastname');
            } else {
                if (Utility.isBlankOrNull(obj.companyName)) {
                    obj.companyName = obj.entityid;
                }
                var names = CustomerSync.getFirstNameLastName(obj.companyName);
                obj.firstName = names['firstName'];
                obj.middleName = "";
                obj.lastName = names['lastName'];
            }
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
         * Append items and discount data in orderDataObject for exporting sales order
         * @param orderRecord
         * @param orderDataObject
         */
        appendItemsInDataObject: function (orderRecord, orderDataObject) {
            var arr = [];
            var discountAmount = 0;
            try {
                var itemId;
                var skuOrId;
                var itemQty;
                var itemPrice;
                var line;
                var itemIdsArr = [];
                var giftInfo = {};
                var giftCertRecipientEmail;
                var giftCertFrom;
                var giftCertFromEmail;
                var giftCertRecipientName;
                var giftCertMessage;
                var giftCertNumber;
                var giftCertAmount;
                var totalLines = orderRecord.getLineItemCount('item');

                for (line = 1; line <= totalLines; line++) {
                    itemId = orderRecord.getLineItemValue('item', 'item', line);
                    if (!Utility.isBlankOrNull(itemId) && itemIdsArr.indexOf(itemId) === -1) {
                        itemIdsArr.push(itemId);
                    }
                }

                var magentoItemsMap = ConnectorConstants.CurrentWrapper.getExtSysItemIdsByNsIds(itemIdsArr);
                var setDiscountAtLineLevel = ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.setDiscountAtLineLevel;
                var salesOrderDiscountItem = ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.salesorderDiscountItem;

                for (line = 1; line <= totalLines; line++) {
                    itemId = orderRecord.getLineItemValue('item', 'item', line);
                    skuOrId = magentoItemsMap[itemId] || '';

                    // Check for feature availability
                    if (!skuOrId && !FeatureVerification.isPermitted(Features.EXPORT_SO_DUMMMY_ITEM, ConnectorConstants.CurrentStore.permissions)) {
                        Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                        Utility.throwException("FEATURE_PERMISSION", Features.EXPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                    }
                    itemQty = orderRecord.getLineItemValue('item', 'quantity', line) || 0;
                    itemPrice = orderRecord.getLineItemValue('item', 'rate', line) || 0;

                    // gift card item handling - assuming that if recipient email exit it means that gift item exit
                    giftCertRecipientEmail = orderRecord.getLineItemValue('item', 'giftcertrecipientemail', line);
                    if (!Utility.isBlankOrNull(giftCertRecipientEmail)) {
                        giftCertFrom = orderRecord.getLineItemValue('item', 'giftcertfrom', line);
                        giftCertRecipientName = orderRecord.getLineItemValue('item', 'giftcertrecipientname', line);
                        giftCertMessage = orderRecord.getLineItemValue('item', 'giftcertmessage', line);
                        giftCertNumber = orderRecord.getLineItemValue('item', 'giftcertnumber', line);
                        giftCertAmount = orderRecord.getLineItemValue('item', 'amount', line);
                        // if email not exist set dummy email address
                        giftCertFromEmail = orderRecord.getFieldValue('email') || "empty@empty.com";

                        giftInfo.giftCertRecipientEmail = giftCertRecipientEmail;
                        giftInfo.giftCertFrom = giftCertFrom;
                        giftInfo.giftCertFromEmail = giftCertFromEmail;
                        giftInfo.giftCertRecipientName = giftCertRecipientName;
                        giftInfo.giftCertMessage = giftCertMessage;
                        giftInfo.giftCertNumber = giftCertNumber;
                        giftInfo.giftCertAmount = giftCertAmount;
                    }

                    if (itemId != salesOrderDiscountItem) {
                        var obj = {
                            itemId: itemId,
                            sku: skuOrId,
                            quantity: itemQty,
                            price: itemPrice,
                            giftInfo: giftInfo
                        };
                        arr.push(obj);
                    }
                    else {
                        var itemAmount = orderRecord.getLineItemValue('item', 'amount', line) || 0;
                        discountAmount += (!!itemAmount ? parseFloat(itemAmount) : 0);
                    }
                }
                // Handle body level discount
                var bodyLevelDiscountAmount = orderRecord.getFieldValue('discounttotal');
                discountAmount += (!!bodyLevelDiscountAmount ? parseFloat(bodyLevelDiscountAmount) : 0);
            }
            catch (e) {
                Utility.logException('OrderExportHelper.appendItemsInDataObject', e);
                throw new CustomException({
                    code: "GET_PRODUCTS_DATA_FOR_ORDER_EXPORT",
                    message: "Error in getting items data from Sales Order in NetSuite",
                    recordType: "salesorder",
                    recordId: orderRecord.getId(),
                    system: "NetSuite",
                    exception: e,
                    action: "Sales Order Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                });
                //Utility.throwException("GET_ORDER_DATA_FOR_EXPORT", e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
            }

            orderDataObject.items = arr;
            orderDataObject.discountAmount = Math.abs(parseFloat(discountAmount));
            orderDataObject.orderTotal = orderRecord.getFieldValue('total');
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

            // initialize scrub
            ConnectorConstants.initializeScrubList();
            var system = ConnectorConstants.CurrentStore.systemId;

            Utility.logDebug('key_shipmentMethod', shipmentMethod);
            obj.shipmentMethod = FC_ScrubHandler.findValue(system, "ShippingMethod", shipmentMethod);
            Utility.logDebug('value_shipmentMethod', obj.shipmentMethod);

            if (shipmentMethod === obj.shipmentMethod) {
                obj.shipmentMethod = FC_ScrubHandler.findValue(system, "ShippingMethod", "DEFAULT");
            }

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
        appendPaymentInfoInDataObject: function (orderRecord, orderDataObject, store) {
            var obj = {};

            obj = ConnectorConstants.CurrentWrapper.getPaymentInfoToExport(orderRecord, orderDataObject, store);

            Utility.logDebug("paymentInfo", JSON.stringify(obj));
            orderDataObject.paymentInfo = obj;
        },
        /**
         * This function appends the gift card certificates in order data object
         * @param orderRecord
         * @param orderDataObject
         */
        appendGiftCardInfoInDataObject: function (orderRecord, orderDataObject) {
            var giftCertificates = [];

            // getting gift certificates count
            var count = orderRecord.getLineItemCount("giftcertredemption");

            for (var line = 1; line <= count; line++) {
                // getting gift code as text becasue value returns NetSuite's id of value and amount
                var authCode = orderRecord.getLineItemText("giftcertredemption", "authcode", line);
                var authCodeAppliedAmt = orderRecord.getLineItemValue("giftcertredemption", "authcodeapplied", line) || 0;

                // amount is zero against gift card - skip it
                if (parseFloat(authCodeAppliedAmt) === 0) {
                    continue;
                }

                var obj = {};
                obj.authCode = authCode;
                obj.authCodeAppliedAmt = authCodeAppliedAmt;
                giftCertificates.push(obj);
            }

            orderDataObject.giftCertificates = giftCertificates;
        },

        /**
         * Gets a single Order
         * @param orderInternalId
         * @param store
         * @return {*}
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
                    this.appendPaymentInfoInDataObject(orderRecord, orderDataObject, store);
                    this.appendGiftCardInfoInDataObject(orderRecord, orderDataObject);
                    orderDataObject.taxAmount=orderRecord.getFieldValue('taxtotal');
                    if(orderDataObject.taxAmount==null || orderDataObject.taxAmount==''){
                        orderDataObject.taxAmount=0.00;
                    }
                    if (!!orderDataObject.cancelledMagentoSOId) {
                        orderDataObject.history += orderDataObject.cancelledMagentoSOId + 'E';
                    }

                    delete orderDataObject.nsObj;
                }
            } catch (e) {
                Utility.logException('OrderExportHelper.getOrder', e);
                throw new CustomException({
                    code: "GET_ORDER_DATA_FOR_EXPORT",
                    message: "Error in getting data from Sales Order in NetSuite",
                    recordType: "salesorder",
                    recordId: orderInternalId,
                    system: "NetSuite",
                    exception: e,
                    action: "Sales Order Export NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                });
                //Utility.throwException("GET_ORDER_DATA_FOR_EXPORT", e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
            }
            Utility.logDebug('getOrder', JSON.stringify(orderDataObject));

            return orderDataObject;
        },

        /**
         * Sets Magento Id in the Order record
         * @param magentoId
         * @param orderId
         */
        setOrderExternalSystemId: function (magentoId, orderId) {
            try {
                nlapiSubmitField('salesorder', orderId, [ConnectorConstants.Transaction.Fields.MagentoSync, ConnectorConstants.Transaction.Fields.MagentoId], ['T', magentoId]);
            } catch (e) {
                Utility.logException('OrderExportHelper.setOrderExternalSystemId', e);
                ExportSalesOrders.markRecords(orderId, e.toString());
            }
        },

        /**
         * Set Magento Orders Line Ids in Line Items
         * @param orderInternalId
         * @param orderObject
         * @param magentoOrderLineIdData
         */
        setExternalSystemOrderLineIds: function (orderInternalId, orderObject, magentoOrderLineIdData) {
            try {
                //Utility.logDebug('orderData.items', JSON.stringify(orderObject.items));
                var itemIdsArray = OrderExportHelper.getItemIdsArray(orderObject.items);
                //var lineItemData = ConnectorCommon.getMagentoItemIds(itemIdsArray);
                var lineItemData = ConnectorConstants.CurrentWrapper.getExtSysItemIdsByNsIds(itemIdsArray, "ITEM_ID");
                Utility.logDebug('lineItemData.skuArray', JSON.stringify(lineItemData));
                var soRecord = nlapiLoadRecord('salesorder', orderInternalId);
                for (var i = 1; i <= soRecord.getLineItemCount('item'); i++) {
                    var itemId = soRecord.getLineItemValue('item', 'item', i);
                    var sku = lineItemData[itemId];
                    if (!!sku) {
                        var magentoOrderLineId = magentoOrderLineIdData[sku];
                        if (!!magentoOrderLineId) {
                            soRecord.setLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, i, magentoOrderLineId);
                        }
                    }
                }
                nlapiSubmitRecord(soRecord);

            } catch (e) {
                Utility.logException('OrderExportHelper.setExternalSystemOrderLineIds', e);
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
         * @param orderId
         * @return {boolean}
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
            return ConnectorConstants.CurrentWrapper.getCreateSalesOrderXml(orderRecord, sessionId);
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
                // initialize configuration for logging in custom record and sending error emails
                ConnectorCommon.initiateEmailNotificationConfig();
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
         * Processes Records
         * @param orderObject
         * @param store
         * @returns {{orderRecord: *, requsetXML: *, responseMagento: *, magentoIdObjArrStr: *, nsCustomerUpdateStatus: *, customerAddresses: *, allAddressedSynched: *, adr: number, logRec: nlobjRecord}}
         */
        processOrder: function (orderObject, store) {

            var orderRecord = OrderExportHelper.getOrder(orderObject.internalId, store);

            this.sendRequestToExternalSystem(orderObject.internalId, orderRecord, store, true);
        },

        /**
         * Send request to megento store
         * @param internalId
         * @param orderRecord
         * @param store
         * @param attemptRetryIfNeeded
         * @return {null}
         */
        sendRequestToExternalSystem: function (internalId, orderRecord, store, attemptRetryIfNeeded) {
            var serverResponse;

            Utility.logDebug('debug', 'Step-4');

            if (!orderRecord) {
                return null;
            }

            Utility.logDebug('debug', 'Step-5');

            serverResponse = ConnectorConstants.CurrentWrapper.createSalesOrder(internalId, orderRecord, store, ConnectorConstants.CurrentStore.sessionID);
            Utility.logDebug('sendRequestToExternalSystem.serverResponse', JSON.stringify(serverResponse));

            var incrementalIdData = serverResponse.incrementalIdData;
            var externalSystemOrderLineIdData = serverResponse.magentoOrderLineIdData;

            Utility.logDebug('debug', 'Step-5c');

            if (serverResponse.status) {
                Utility.logDebug('debug', 'Step-6');

                Utility.logDebug('incrementalIdData', incrementalIdData.orderIncrementId);

                OrderExportHelper.setOrderExternalSystemId(incrementalIdData.orderIncrementId, internalId);

                if (ConnectorConstants.CurrentWrapper.hasDifferentLineItemIds()) {
                    OrderExportHelper.setExternalSystemOrderLineIds(internalId, orderRecord, externalSystemOrderLineIdData);
                }
            } else {
                if (attemptRetryIfNeeded) {
                    Utility.logDebug('retrying', 'retrying record synching');
                    //Utility.logDebug('orderRecord.shipmentInfo.shipmentMethod', orderRecord.shipmentInfo.shipmentMethod);

                    var retryStatus = retrySync(serverResponse.faultString, ConnectorConstants.RetryAction.RecordTypes.SalesOrder, orderRecord);

                    //Utility.logDebug('retryStatus.status', retryStatus.status);
                    if (retryStatus.status) {
                        var modifiedRecordObj = retryStatus.recordObj;
                        //Utility.logDebug('modifiedRecordObj.shipmentInfo.shipmentMethod', modifiedRecordObj.shipmentInfo.shipmentMethod);
                        //Utility.logDebug('retrying', 'sending to magento again with modified object');
                        this.sendRequestToExternalSystem(internalId, modifiedRecordObj, store, false);
                    } else {
                        //Log error with fault code that this customer is not synched with magento
                        Utility.logDebug('final stuff', 'orderId  ' + internalId + ' Not Synched Due to Error  :  ' + serverResponse.faultString);
                        ExportSalesOrders.markRecords(internalId, ' Not Synched Due to Error  :  ' + serverResponse.faultString);
                        throw new CustomException({
                            code: serverResponse.faultCode,
                            message: serverResponse.faultString,
                            recordType: "salesorder",
                            recordId: internalId,
                            system: "NetSuite",
                            exception: null,
                            action: "Sales Order Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                        });
                        //Utility.throwException(F3Message.Action.SALES_ORDER_EXPORT, 'Order Internal Id: ' + internalId + ' not synched due to Error :  ' + responseMagento.faultCode + " " + responseMagento.faultString);
                    }
                }
                else {
                    //Log error with fault code that this customer is not synched with magento
                    Utility.logDebug('final stuff', 'orderId  ' + internalId + ' Not Synched Due to Error  :  ' + serverResponse.faultString);
                    ExportSalesOrders.markRecords(internalId, ' Not Synched Due to Error  :  ' + serverResponse.faultString);
                    throw new CustomException({
                        code: serverResponse.faultCode,
                        message: serverResponse.faultString,
                        recordType: "salesorder",
                        recordId: internalId,
                        system: "NetSuite",
                        exception: null,
                        action: "Sales Order Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                    });
                    //Utility.throwException(F3Message.Action.SALES_ORDER_EXPORT, 'Order Internal Id: ' + internalId + ' not synched due to Error :  ' + serverResponse.faultCode + " " + serverResponse.faultString);
                }
            }
        },

        getCustomerFromExternalSystem: function (customerObj) {
            var result = {
                status: false,
                customer: null
            };
            var email = customerObj.email;

            if (Utility.isBlankOrNull(email)) {
                Utility.logDebug("getCustomerFromExternalSystem", "Customer does not have email address");
                return result;
            }

            var customer = ConnectorConstants.CurrentWrapper.getCustomer(customerObj);

            if (customer !== null) {
                result.customer = customer;
                result.status = true;
            }

            return result;
        },

        /**
         * sync customer belongs to current sales order if not synched to magento
         * @param customerId
         * @param externalSystemCustomerIds
         * @param store
         */
        processCustomer: function (customerId, externalSystemCustomerIds, store) {
            var customerObj = {};
            try {
                var customerAlreadySynched = this.customerAlreadySyncToStore(externalSystemCustomerIds, store.systemId);
                Utility.logDebug('magentoCustomerIds  #  store.systemId', externalSystemCustomerIds + '  #  ' + store.systemId);
                Utility.logDebug('customerAlreadySynched', customerAlreadySynched);

                if (!customerAlreadySynched) {
                    customerObj = CUSTOMER.getCustomer(customerId, store);
                    Utility.logDebug("zee->Hello", JSON.stringify(customerObj));
                    var magentoCustomer = this.getCustomerFromExternalSystem(customerObj);
                    Utility.logDebug("zee->magentoCustomer", JSON.stringify(magentoCustomer));
                    if (magentoCustomer.status) {
                        var createOrUpdateMagentoJSONRef = !!externalSystemCustomerIds ? 'update' : 'create';
                        var magentoIdObjArrStr = ConnectorCommon.getMagentoIdObjectArrayString(store.systemId, magentoCustomer.customer.customer_id, createOrUpdateMagentoJSONRef, externalSystemCustomerIds, "");
                        Utility.logDebug("zee->magentoIdObjArrStr", JSON.stringify(magentoIdObjArrStr));
                        var magentoStores = ConnectorCommon.getStoresArrayFromMagentoJsonId(magentoIdObjArrStr);
                        var nsCustomerUpdateStatus = CUSTOMER.setCustomerMagentoId(magentoIdObjArrStr, customerId, magentoStores);
                        if (nsCustomerUpdateStatus) {
                            // load magento ids for furthur use
                            externalSystemCustomerIds = nlapiLookupField('customer', customerId, 'custentity_magento_custid');
                            Utility.logDebug("zee->magentoCustomerIds", JSON.stringify(externalSystemCustomerIds));
                            customerAlreadySynched = this.customerAlreadySyncToStore(externalSystemCustomerIds, store.systemId);
                        }
                    }
                }

                if (!customerAlreadySynched) {
                    customerObj.internalId = customerId;
                    customerObj.magentoCustomerIds = externalSystemCustomerIds;
                    Utility.logDebug('customerObj.internalId', customerObj.internalId);
                    Utility.logDebug('customerObj.magentoCustomerIds', customerObj.magentoCustomerIds);
                    createCustomerInMagento(customerObj, store, customerObj.magentoCustomerIds);
                } else {
                    // check if the customer is modified. If so, update the customer first in Magento
                    var customer = CUSTOMER.getCustomer(customerId, store);
                    customerObj = {};
                    customerObj.internalId = customerId;
                    customerObj.magentoCustomerIds = externalSystemCustomerIds;
                    Utility.logDebug('inside If customer is already synced', 'Starting');
                    if (customer.nsObj.getFieldValue(CustomerSync.FieldName.CustomerModified) === 'T') {
                        // mark customer as unmodified
                        Utility.logDebug('Customer is modified', 'Mark Customer unmodified and start syncing process');
                        nlapiSubmitField(CustomerSync.internalId, customerId, CustomerSync.FieldName.CustomerModified, 'F');
                        try {
                            //update customer in Magento Store
                            Utility.logDebug('Customer Syncing Starting', '');
                            Utility.logDebug('Customer Syncing Starting - Store', JSON.stringify(store));
                            updateCustomerInMagento(customerObj, store, CustomerSync.getMagentoIdMyStore(customerObj.magentoCustomerIds, store.internalId), '');
                            Utility.logDebug('Customer Syncing Finished', '');
                        } catch (e) {
                            Utility.logException('Error in updating Customer to Magento', e);
                            throw new CustomException({
                                code: F3Message.Action.CUSTOMER_EXPORT,
                                message: "Update Customer from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName,
                                recordType: "customer",
                                recordId: customerId,
                                system: "NetSuite",
                                exception: e,
                                action: "Customer Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                            });
                            //Utility.throwException(F3Message.Action.CUSTOMER_EXPORT, e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
                        }
                    }
                    // handling for blank first, last or company names for shipping addresses
                    CUSTOMER.setBlankFields(customerId, null);
                }
            }
            catch (e) {
                Utility.logException('error in processCustomer during sales order synchronization', e);
                if (e instanceof CustomException) {
                    throw e;
                } else {
                    throw new CustomException({
                        code: F3Message.Action.CUSTOMER_EXPORT,
                        message: "Sync Customer from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName,
                        recordType: "customer",
                        recordId: customerId,
                        system: "NetSuite",
                        exception: e,
                        action: "Customer Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName
                    });
                }
                //Utility.throwException(F3Message.Action.CUSTOMER_EXPORT, e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
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

                var specificStoreId, params = {};
                // this handling is for specific store sync handling
                specificStoreId = context.getSetting('SCRIPT', ConnectorConstants.ScriptParameters.SalesOrderExportStoreId);
                Utility.logDebug("specificStoreId", specificStoreId);

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

                        // specific store handling
                        if (!Utility.isBlankOrNull(specificStoreId)) {
                            params[ConnectorConstants.ScriptParameters.SalesOrderExportStoreId] = specificStoreId;
                            if (store.systemId != specificStoreId) {
                                continue;
                            }
                        }

                        // Check for feature availability
                        if (!FeatureVerification.isPermitted(Features.EXPORT_SO_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                            Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_SO_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                            continue;
                        }
                        // Check for feature availability
                        if (FeatureVerification.isPermitted(Features.EXPORT_SO_DUMMMY_ITEM, ConnectorConstants.CurrentStore.permissions)) {
                            ConnectorConstants.initializeDummyItem();
                        } else {
                            Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                        }
                        // initialize configuration for logging in custom record and sending error emails
                        ConnectorCommon.initiateEmailNotificationConfig();
                        ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                        ConnectorConstants.CurrentWrapper.initialize(store);
                        Utility.logDebug('debug', 'Step-2');

                        orderIds = OrderExportHelper.getOrders(false, store.systemId);

                        Utility.logDebug('fetched sales order count', orderIds.length);
                        Utility.logDebug('debug', 'Step-3');

                        if (orderIds.length > 0) {
                            for (var c = 0; c < orderIds.length; c++) {

                                var orderObject = orderIds[c];

                                try {
                                    this.processOrder(orderObject, store);
                                    if (OrderExportHelper.ordersFromCustomRecord()) {
                                        RecordsToSync.markProcessed(orderObject.id, RecordsToSync.Status.Processed);
                                    }
                                    context.setPercentComplete(Math.round(((100 * c) / orderIds.length) * 100) / 100);  // calculate the results

                                    // displays the percentage complete in the %Complete column on the Scheduled Script Status page
                                    context.getPercentComplete();  // displays percentage complete
                                } catch (e) {
                                    // this handling is for maintaining order ids in custom record
                                    if (OrderExportHelper.ordersFromCustomRecord()) {
                                        RecordsToSync.markProcessed(orderObject.id, RecordsToSync.Status.ProcessedWithError);
                                    } else {
                                        ExportSalesOrders.markRecords(orderObject.internalId, e.toString());
                                    }
                                    ErrorLogNotification.logAndNotify({
                                        externalSystem: ConnectorConstants.CurrentStore.systemId,
                                        recordType: "salesorder",
                                        recordId: orderObject.internalId,
                                        recordDetail: "NetSuite # " + orderObject.tranid,
                                        action: "Sales Order Export from NetSuite to " + ConnectorConstants.CurrentStore.systemDisplayName,
                                        message: "An error occurred while exporting sales order.",
                                        messageDetails: e,
                                        status: F3Message.Status.ERROR,
                                        externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName,
                                        system: "NetSuite"
                                    });
                                }
                                if (this.rescheduleIfNeeded(context, params)) {
                                    return null;
                                }
                            }
                        }

                        if (this.rescheduleIfNeeded(context, params)) {
                            return null;
                        }
                    }

                    if (OrderExportHelper.ordersFromCustomRecord()) {
                        var orders = OrderExportHelper.getSalesOrdersFromCustomRecord(true, null);
                        if (orders.length > 0) {
                            Utility.logDebug('startup', 'Reschedule');
                            nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), null);
                            return;
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
         * @param params Object
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
         * @param params Object
         */
        rescheduleScript: function (ctx, params) {
            //var status = 'TEST RUN';
            var status = nlapiScheduleScript(ctx.getScriptId(), ctx.getDeploymentId(), params);
            Utility.logDebug('ExportSalesOrders.rescheduleScript', 'Status: ' + status + ' Params: ' + JSON.stringify(params));
        }
    };
})();

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function ExportSalesOrdersScheduled(type) {
    return ExportSalesOrders.scheduled(type);
}