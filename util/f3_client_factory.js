/**
 * Created by zahmed on 14-Jan-15
 *
 * Referenced By:
 * -
 * -
 * Dependency:
 * - f3_utility_methods.js
 * -
 */

/**
 * This script is responsible for returning the object on client basis.
 */
F3ClientFactory = (function () {
    return {
        /**
         * Init method
         */
        createClient: function (type) {
            var client = null;

            switch (type) {
                case "925507":
                    client = new F3FmwShopifyClient();
                    break;
                case "938277":
                    client = new F3KablaWooClient();
                    break;
                case "585361":
                    client= new F3IntekShopifyClient();
                    break;
                case "926253":
                    client= new F3AlphaOmegaClient();
                    break;
                default :
                    client = new F3ClientBase();// F3ClientBase
            }

            client.clientType = type;

            return client;
        }
    };
})();

/**
 * This class is responsible for setting the default fields in Magento Connector entities
 * @returns {{setCustomerFields: setCustomerFields, itemFetch: itemFetch, setSalesOrderFields: setSalesOrderFields, setCustomerAddressFields: setCustomerAddressFields}}
 * @constructor
 */
function F3ClientBase() {

    // private member conatins the type of the cleint
    var type = null;

    var self = {
        /**
         * getter
         * @returns {string}
         */
        get clientType() {
            return this.type;
        },

        /**
         * setter
         * @returns {void}
         */
        set clientType(type) {
            this.type = type || 'Folio3';
        },

        /**
         * Description of method setCustomerFields
         * @param {nlobjRecord} rec
         * @return {nlobjRecord}
         */
        setCustomerFields: function (rec) {
            try {

            } catch (e) {
                Utility.logException('setCustomerFields', e);
            }
            return rec;
        },

        /**
         * Description of method itemFetch
         * @return {nlobjSearchResult[],[]}
         */
        itemFetch: function () {
            var result = [];
            try {

            } catch (e) {
                Utility.logException('itemFetch', e);
            }
            return result;
        },

        /**
         * Description of method setCustomerAddressFields
         * @param {nlobjRecord} rec
         * @return {nlobjRecord}
         */
        setCustomerAddressFields: function (rec) {
            try {

            } catch (e) {
                Utility.logException('setCustomerAddressFields', e);
            }
            return rec;
        },

        /**
         * Find customer in search result with passed magento id
         * @param results
         * @param magentoId
         * @return {*}
         */
        getResultObjWithMagentoId: function (results, magentoId) {
            var result = null;

            if (!Utility.isBlankOrNull(magentoId)) {
                for (var i = 0; i < results.length && result === null; i++) {
                    var tempMagentoId = results[i].getValue(ConnectorConstants.Entity.Fields.MagentoId) || '';
                    // if id found/ customer is already synced then terminate the loop.
                    if (tempMagentoId.indexOf(magentoId) > 0) {
                        result = results[i];
                    }
                }
            }

            return result;
        },

        /**
         * Find customer in Search result with not synced with current store
         * @param results
         * @param storeId
         * @return {*}
         */
        getResultObjNotSyncedWithStore: function (results, storeId) {
            var result = null;

            for (var i = 0; i < results.length && result === null; i++) {
                // check if it has passed email id and not synced with current store
                var tempMagentoId = results[i].getValue(ConnectorConstants.Entity.Fields.MagentoId) || '';
                var magentoId = ConnectorCommon.getMagentoIdFromObjArray(tempMagentoId, storeId);
                if (Utility.isBlankOrNull(magentoId)) {
                    result = results[i];
                }

            }

            return result;
        },

        /**
         * Set Discount line in Sales Order line item
         * @param {nlobjRecord} rec
         * @param {object} salesOrderObj
         */
        setDiscountInOrder: function (rec, salesOrderObj) {
            // Discount handling
            Utility.logDebug('discountAmount setp-1', salesOrderObj.order.discount_amount);
            var discountAmount = ConnectorConstants.CurrentWrapper.getDiscount(salesOrderObj);
            //discountAmount = !Utility.isBlankOrNull(discountAmount) && !isNaN(discountAmount) ? parseFloat(Math.abs(discountAmount)) : 0;
            Utility.logDebug('discountAmount step-2', discountAmount);

            if (!!discountAmount && parseFloat(discountAmount) !== 0) {
                if (!!ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.setDiscountAtLineLevel
                    && ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.setDiscountAtLineLevel === 'true') {
                    // Line item level discount handling
                    var currentLintItemCount = rec.getLineItemCount('item');
                    //Utility.logDebug('currentLintItemCount: ', currentLintItemCount);
                    //Utility.logDebug('Set SO Discount Item Id: ', ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.salesorderDiscountItem);
                    rec.setLineItemValue('item', 'item', currentLintItemCount + 1, ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.salesorderDiscountItem);
                    rec.setLineItemValue('item', 'price', currentLintItemCount + 1, '-1');
                    rec.setLineItemValue('item', 'amount', currentLintItemCount + 1, '-' + (Math.abs(parseFloat(discountAmount))).toString());
                    rec.setLineItemValue('item', 'taxcode', currentLintItemCount + 1, '-7');
                }
                else {
                    // Body level discount handling
                    rec.setFieldValue('discountitem', ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.salesorderDiscountItem);
                    rec.setFieldValue('discountrate', '-' + (Math.abs(parseFloat(discountAmount))).toString());
                }

            }
        },

        /**
         * Search the customer with email or formatted magentoId
         * @param {string} magentoId
         * @param {string} email
         * @return {object} {status: boolean, [netSuiteInternalId: string], [netSuiteMagentoId: string]}
         */
        searchCustomerInNetSuite: function (email, magentoId) {
            var magentoFormattedId;
            var result;
            var filExp = [];
            var cols = [];
            var results;
            var resultobj = {'status': false};

            magentoFormattedId = ConnectorCommon.getMagentoIdForSearching(ConnectorConstants.CurrentStore.systemId, magentoId);
            cols.push(new nlobjSearchColumn(ConnectorConstants.Entity.Fields.MagentoId, null, null));
            cols.push(new nlobjSearchColumn('internalid', null, null).setSort(true));

            filExp.push(['email', 'is', email]);

            if (!Utility.isBlankOrNull(magentoId)) {
                filExp.push('OR');
                filExp.push([ConnectorConstants.Entity.Fields.MagentoId, 'contains', magentoFormattedId]);
            }

            results = ConnectorCommon.getRecords('customer', filExp, cols);

            if (results.length > 0) {
                // Assuming that there should be only one customer with one Id
                result = this.getResultObjWithMagentoId(results, magentoId);

                // getting first customer search object if not synced with current store
                if (result === null) {
                    result = this.getResultObjNotSyncedWithStore(results, ConnectorConstants.CurrentStore.systemId);
                }

                if (result !== null) {
                    resultobj.netSuiteInternalId = result.getId();
                    resultobj.netSuiteMagentoId = result.getValue(ConnectorConstants.Entity.Fields.MagentoId, null, null);
                    resultobj.status = true;
                }
            }
            return resultobj;
        },

        /**
         * Description of method create sales order
         * @param salesOrderObj
         */
        createSalesOrder: function (salesOrderObj) {
            Utility.logDebug("F3BaseV1Client.createSalesOrder", "Start");
            Utility.logDebug("F3BaseV1Client.salesOrderObj", JSON.stringify(salesOrderObj));
            var rec;
            try {
                rec = nlapiCreateRecord('salesorder', null);

                Utility.logDebug("createSalesOrder", "setSalesOrderFields");
                this.setSalesOrderFields(rec, salesOrderObj);
                var order = salesOrderObj.order;
                var payment = salesOrderObj.payment;
                Utility.logDebug("createSalesOrder", "setShippingInformation");
                // set shipping information
                this.setShippingInformation(salesOrderObj, rec);
                Utility.logDebug("createSalesOrder", "setPayment");
                // set payment details
                this.setPayment(rec, payment, ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes
                    , ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.magentoCCSupportedPaymentTypes);
                Utility.logDebug("createSalesOrder", "setSalesOrderLineItemFields");
                // set products in order
                this.setSalesOrderLineItemFields(rec, salesOrderObj);
                Utility.logDebug("createSalesOrder", "setDiscountInOrder");
                // set discount if found in order
                this.setDiscountInOrder(rec, salesOrderObj);
                Utility.logDebug("createSalesOrder", "setGiftCardLineItem");
                // set gift card in order
                this.setGiftCardLineItem(rec, salesOrderObj.order.quote_id);

                //Utility.logDebug('All items set_w', 'All items set');
                //Utility.logDebug('payment.ccType_w', payment.ccType);
                //Utility.logDebug('payment.authorizedId_w', payment.authorizedId);

                // TODO: if required
                // get coupon code from magento order
                /*var couponCode = ConnectorCommon.getCouponCode(order.increment_id);

                 if (couponCode) {
                 Utility.logDebug('start setting coupon code', '');
                 //rec.setFieldValue('couponcode', couponCode);
                 rec.setFieldValue('discountitem', '14733');// item: DISCOUNT
                 rec.setFieldValue('discountrate', order.discount_amount || 0);
                 Utility.logDebug('end setting coupon code', '');
                 }*/
                //rec.setFieldValue('subsidiary', '3');// TODO generalize
                Utility.logDebug('Going to submit SO', 'Submitting');
                //var id = nlapiSubmitRecord(rec, {disabletriggers: true, ignoremandatoryfields: true}, false);
                var id = nlapiSubmitRecord(rec, true, true);
                Utility.logDebug('Netsuite SO-ID for magento order ' + order.increment_id, id);
            }
            catch (ex) {
                Utility.logException('F3BaseV1Client.createSalesOrder', ex);
                throw new CustomException({
                    code: F3Message.Action.SALES_ORDER_IMPORT,
                    message: "An error occurred while creating Sales Order in NetSuite",
                    recordType: "salesorder",
                    recordId: order.increment_id,
                    system: ConnectorConstants.CurrentStore.systemType,
                    exception: ex,
                    action: "Import Sales Order from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                });
            }
            Utility.logDebug("F3BaseV1Client.createSalesOrder", "End");
        },

        /**
         * Set Sales Order Fields
         * @param rec
         * @param salesOrderObj
         */
        setSalesOrderFields: function (rec, salesOrderObj) {

            var order = salesOrderObj.order;

            var magentoIdId;
            var magentoSyncId;
            var externalSystemSalesOrderModifiedAt;


            magentoIdId = ConnectorConstants.Transaction.Fields.MagentoId;
            magentoSyncId = ConnectorConstants.Transaction.Fields.MagentoSync;
            externalSystemSalesOrderModifiedAt = ConnectorConstants.Transaction.Fields.ExternalSystemSalesOrderModifiedAt;
            var netsuiteCustomerId = salesOrderObj.netsuiteCustomerId;

            // set csutomer in order
            rec.setFieldValue('entity', netsuiteCustomerId);
            rec.setFieldValue(magentoSyncId, 'T');
            rec.setFieldValue(magentoIdId, order.increment_id.toString());
            rec.setFieldValue('tranid', order.order_number);
            rec.setFieldValue(ConnectorConstants.Transaction.Fields.ExternalSystemNumber, order.order_id + "");
            rec.setFieldValue(externalSystemSalesOrderModifiedAt, order.updatedAt);
            //rec.setFieldValue('memo', 'Test Folio3');

            // isDummyItemSetInOrder is set in while setting line items in order
            if (salesOrderObj.isDummyItemSetInOrder) {
                // A = Pending Approval
                // if order has dummy item then set status to A (Pending Approval)
                rec.setFieldValue('orderstatus', 'A');
            }
            else {
                rec.setFieldValue('orderstatus', 'B');
            }

            rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore, ConnectorConstants.CurrentStore.systemId);
            rec.setFieldValue(ConnectorConstants.Transaction.Fields.FromOtherSystem, 'T');
        },

        /**
         * Set Products in sales order
         * @param rec
         * @param salesOrderObj
         */
        setSalesOrderLineItemFields: function (rec, salesOrderObj) {
            var products = salesOrderObj.products;
            var netsuiteMagentoProductMap = salesOrderObj.netsuiteMagentoProductMap;

            var containsSerialized = false;
            var netSuiteItemID;

            for (var x = 0; x < products.length; x++) {
                Utility.logDebug('products.length is createSalesOrder', products.length);
                Utility.logDebug('products[x].product_id in createSalesOrder', products[x].product_id);

                var objIDPlusIsSerial = ConnectorCommon.getNetsuiteProductIdByMagentoIdViaMap(netsuiteMagentoProductMap, products[x].product_id);
                netSuiteItemID = objIDPlusIsSerial.netsuiteId;
                var isSerial = objIDPlusIsSerial.isSerial;
                Utility.logDebug('Netsuite Item ID', netSuiteItemID);

                var customPriceLevel = ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.customPriceLevel;
                if (!!netSuiteItemID) {
                    rec.setLineItemValue('item', 'item', x + 1, netSuiteItemID);
                    rec.setLineItemValue('item', 'quantity', x + 1, products[x].qty_ordered);

                    // handling for custom product amount
                    rec.setLineItemValue('item', 'price', x + 1, customPriceLevel);
                    rec.setLineItemValue('item', 'rate', x + 1, products[x].price);

                    if (products[x].product_type === ConnectorConstants.MagentoProductTypes.GiftCard
                        && !!products[x].product_options) {
                        var certificateNumber = '';
                        rec.setLineItemValue('item', 'giftcertrecipientemail', x + 1, products[x].product_options.aw_gc_recipient_email);
                        rec.setLineItemValue('item', 'giftcertfrom', x + 1, products[x].product_options.aw_gc_sender_name);
                        rec.setLineItemValue('item', 'giftcertrecipientname', x + 1, products[x].product_options.aw_gc_recipient_name);
                        rec.setLineItemValue('item', 'giftcertmessage', x + 1, '');
                        if (!!products[x].product_options.aw_gc_created_codes && products[x].product_options.aw_gc_created_codes.length > 0) {
                            certificateNumber = products[x].product_options.aw_gc_created_codes[0];
                        }
                        rec.setLineItemValue('item', 'giftcertnumber', x + 1, certificateNumber);
                        // set price level 'custom'
                        rec.setLineItemValue('item', 'price', x + 1, '-1');
                        // set custom amount
                        rec.setLineItemValue('item', 'amount', x + 1, products[x].product_options.aw_gc_amounts);
                        if (!!ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.settaxcode)
                           // rec.setLineItemValue('item', 'taxcode', x + 1, ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.taxcode);// -Not Taxable-
                        rec.setLineItemValue('item', 'istaxable', x + 1, 'F'); // -Not Taxable-

                    }

                    rec.setLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, x + 1, products[x].item_id.toString());
                    // set tax amount
                    var taxAmount = products[x].tax_amount;
                    taxAmount = !Utility.isBlankOrNull(taxAmount) && !isNaN(taxAmount) ? parseFloat(taxAmount) : 0;
                    // tax handling for line items
                    if (taxAmount > 0) {
                        rec.setLineItemValue('item', 'istaxable', x + 1, 'T');

                    }
                }
                else {
                    // Check for feature availability
                    if (!FeatureVerification.isPermitted(Features.IMPORT_SO_DUMMMY_ITEM, ConnectorConstants.CurrentStore.permissions)) {
                        Utility.logEmergency('FEATURE PERMISSION', Features.IMPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                        Utility.throwException("FEATURE_PERMISSION", Features.IMPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                    }
                    Utility.logDebug('Set Dummy Item Id: ', ConnectorConstants.DummyItem.Id);
                    rec.setLineItemValue('item', 'item', x + 1, ConnectorConstants.DummyItem.Id);
                    salesOrderObj.isDummyItemSetInOrder = true;
                    rec.setLineItemValue('item', 'amount', x + 1, '0');
                    rec.setLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, x + 1, products[x].item_id.toString());
                    //Added check to avoid error on setting -7 as default tax code
                    if (!!ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.settaxcode)
                        rec.setLineItemValue('item', 'taxcode', x + 1, ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.taxcode);


                }

                if (isSerial === 'T') {
                    containsSerialized = true;
                }
            }
        },

        /**
         * Update Sales Order
         * @param salesOrderObj
         * @param nsSalesOrderId
         */
        updateSalesOrder: function (salesOrderObj, nsSalesOrderId) {
            Utility.logDebug("F3BaseV1Client.updateSalerOrder", "Start ID: " + nsSalesOrderId);
            Utility.logDebug("F3BaseV1Client.salesOrderObj", JSON.stringify(salesOrderObj));

            var order = salesOrderObj.order;
            var products = salesOrderObj.products;
            var netsuiteMagentoProductMap = salesOrderObj.netsuiteMagentoProductMap;
            var netsuiteCustomerId = salesOrderObj.netsuiteCustomerId;
            var payment = salesOrderObj.payment;

            var magentoIdId;
            var magentoSyncId;
            var isDummyItemSetInOrder = '';
            var externalSystemSalesOrderModifiedAt;
            var containsSerialized = false;
            var netSuiteItemID;

            magentoIdId = ConnectorConstants.Transaction.Fields.MagentoId;
            magentoSyncId = ConnectorConstants.Transaction.Fields.MagentoSync;
            externalSystemSalesOrderModifiedAt = ConnectorConstants.Transaction.Fields.ExternalSystemSalesOrderModifiedAt;

            var rec = nlapiLoadRecord('salesorder', nsSalesOrderId);

            var addresses = this.getDefaultAddresses(rec.getFieldValue('entity'));

            Utility.logDebug('default addresses', JSON.stringify(addresses));
            // setting default addresses
            if (!!addresses) {
                rec.setFieldValue('shipaddresslist', addresses.shipAddress);
                rec.setFieldValue('billaddresslist', addresses.shipAddress);
            }

            Utility.logDebug('setting payment ', '');
            Utility.logDebug('outside check', '');
            Utility.logDebug('order.shipment_method', order.shipment_method);
            Utility.logDebug('products', JSON.stringify(products));

            if (!order.shipment_method && this.checkAllProductsAreGiftCards(products)) {
                Utility.logDebug('inside check', '');
                // If shipment_method iss empty, and all products in order are 'gift cards',
                // (Note: No shipping information required if you add only gift cards product in an order)
                salesOrderObj.order.shipment_method = "DEFAULT_NS";
            }

            // set customer in order
            rec.setFieldValue('entity', netsuiteCustomerId);

            // set shipping information
            this.setShippingInformation(salesOrderObj, rec);

            // set payment details
            this.setPayment(rec
                , payment
                , ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes
                , ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.magentoCCSupportedPaymentTypes);


            // Clearing Discount Fields
            // this.clearDiscountFields(rec);


            var productId = [];
            for (var i = 0; i < products.length; i++) {
                productId.push(products[i].item_id.toString());
            }

            // remove unwanted line items

            this.clearExtraItemLines(rec, productId);

            for (var x = 0; x < products.length; x++) {
                Utility.logDebug('products.length is createSalesOrder', products.length);
                Utility.logDebug('products[x].product_id in createSalesOrder', products[x].product_id);
                var newLineNumber = rec.getLineItemCount('item') + 1;
                var objIDPlusIsSerial = ConnectorCommon.getNetsuiteProductIdByMagentoIdViaMap(netsuiteMagentoProductMap, products[x].product_id);
                netSuiteItemID = objIDPlusIsSerial.netsuiteId;
                var isSerial = objIDPlusIsSerial.isSerial;
                Utility.logDebug('Netsuite Item ID', netSuiteItemID);
                var lineNumber = rec.findLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, products[x].item_id.toString());
                lineNumber = lineNumber > 0 ? lineNumber : newLineNumber;
                Utility.logDebug('lineNumber', lineNumber);
                Utility.logDebug('products[x].item_id.toString()', products[x].item_id.toString());

                if (!!netSuiteItemID) {
                    rec.setLineItemValue('item', 'item', lineNumber, netSuiteItemID);
                    rec.setLineItemValue('item', 'quantity', lineNumber, products[x].qty_ordered);
                    rec.setLineItemValue('item', 'price', lineNumber, 1);
                    if (products[x].product_type === ConnectorConstants.MagentoProductTypes.GiftCard
                        && !!products[x].product_options) {
                        var certificateNumber = '';
                        rec.setLineItemValue('item', 'giftcertrecipientemail', lineNumber, products[x].product_options.aw_gc_recipient_email);
                        rec.setLineItemValue('item', 'giftcertfrom', lineNumber, products[x].product_options.aw_gc_sender_name);
                        rec.setLineItemValue('item', 'giftcertrecipientname', lineNumber, products[x].product_options.aw_gc_recipient_name);
                        rec.setLineItemValue('item', 'giftcertmessage', lineNumber, '');
                        if (!!products[x].product_options.aw_gc_created_codes && products[x].product_options.aw_gc_created_codes.length > 0) {
                            certificateNumber = products[x].product_options.aw_gc_created_codes[0];
                        }
                        rec.setLineItemValue('item', 'giftcertnumber', lineNumber, certificateNumber);
                        // set price level 'custom'
                        rec.setLineItemValue('item', 'price', lineNumber, '-1');
                        // set custom amount
                        rec.setLineItemValue('item', 'amount', lineNumber, products[x].product_options.aw_gc_amounts);
                        rec.setLineItemValue('item', 'taxcode', lineNumber, '-7');// -Not Taxable-
                    }

                    rec.setLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, lineNumber, products[x].item_id.toString());
                    // set tax amount
                    var taxAmount = products[x].tax_amount;
                    taxAmount = !Utility.isBlankOrNull(taxAmount) && !isNaN(taxAmount) ? parseFloat(taxAmount) : 0;

                    // tax handling for line items
                    if (taxAmount > 0) {
                        rec.setLineItemValue('item', 'taxcode', lineNumber, ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.taxCode);
                    }
                }
                else {
                    // Check for feature availability
                    if (!FeatureVerification.isPermitted(Features.IMPORT_SO_DUMMMY_ITEM, ConnectorConstants.CurrentStore.permissions)) {
                        Utility.logEmergency('FEATURE PERMISSION', Features.IMPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                        Utility.throwException("FEATURE_PERMISSION", Features.IMPORT_SO_DUMMMY_ITEM + ' NOT ALLOWED');
                    }
                    Utility.logDebug('Set Dummy Item Id: ', ConnectorConstants.DummyItem.Id);
                    rec.setLineItemValue('item', 'item', lineNumber, ConnectorConstants.DummyItem.Id);
                    isDummyItemSetInOrder = true;
                    rec.setLineItemValue('item', 'amount', lineNumber, '0');
                    rec.setLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, lineNumber, products[x].item_id.toString());
                    rec.setLineItemValue('item', 'taxcode', lineNumber, '-7');// -Not Taxable-
                }

                if (isSerial == 'T') {
                    containsSerialized = true;
                }

            }


            // set discount if found in order
            this.setDiscountInOrder(rec, order.discount_amount);

            var quoteId = order.quote_id;
            if (!!quoteId) {
                this.setGiftCardLineItem(rec, quoteId);
            }

            try {
                rec.setFieldValue(magentoSyncId, 'T');
                rec.setFieldValue(magentoIdId, order.increment_id.toString());
                rec.setFieldValue(externalSystemSalesOrderModifiedAt, order.updatedAt);

                if (isDummyItemSetInOrder) {
                    rec.setFieldValue('orderstatus', 'A');
                } else {
                    rec.setFieldValue('orderstatus', 'B');
                }

                rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore, ConnectorConstants.CurrentStore.systemId);
                rec.setFieldValue(ConnectorConstants.Transaction.Fields.FromOtherSystem, 'T');

                // TODO generalize
                Utility.logDebug('Going to submit SO', 'Submitting');
                var id = nlapiSubmitRecord(rec, true, true);
                Utility.logDebug('Netsuite SO-ID for magento order ' + order.increment_id, id);
            }
            catch (ex) {
                Utility.logException('F3BaseV1Client.createSalesOrder', ex);
                throw new CustomException({
                    code: F3Message.Action.SALES_ORDER_IMPORT,
                    message: "An error occurred while updating Sales Order in NetSuite",
                    recordType: "salesorder",
                    recordId: order.increment_id,
                    system: ConnectorConstants.CurrentStore.systemType,
                    exception: new CustomException({
                        code: F3Message.Action.SALES_ORDER_IMPORT,
                        message: "An error occurred while updating Sales Order in NetSuite",
                        recordType: "salesorder",
                        recordId: nsSalesOrderId,
                        system: "NetSuite",
                        exception: ex,
                        action: "Import Sales Order from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                    }),
                    action: "Import Sales Order from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                });
            }
            Utility.logDebug("F3BaseV1Client.updateSalesOrder", "End");
        },

        /**
         * Get Default addresses of customer entity
         * @param entityId
         * @returns {{}}
         */
        getDefaultAddresses: function (entityId) {
            var customer = nlapiLoadRecord('customer', entityId);
            var address = {};
            for (var i = 1; i <= customer.getLineItemCount('addressbook'); i++) {
                if (customer.getLineItemValue('addressbook', 'defaultbilling', i) === 'T') {
                    address.billAddress = customer.getLineItemValue('addressbook', 'internalid', i);
                }
                if (customer.getLineItemValue('addressbook', 'defaultshipping', i) === 'T') {
                    address.shipAddress = customer.getLineItemValue('addressbook', 'internalid', i);
                }
            }
            return address;
        },

        /**
         * Remove line items of specific product
         * @param rec
         * @param productId
         */
        clearExtraItemLines: function (rec, productId) {
            var lineCount = rec.getLineItemCount('item');
            for (var i = lineCount; i >= 1; i--) {
                if (productId.indexOf(rec.getLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, i)) < 0) {
                    rec.removeLineItem('item', i);
                }
            }

        },

        /**
         * Clear Discount Fields
         * @param rec
         */
        clearDiscountFields: function (rec) {
            // Line item level discount handling
            var currentLintItemCount = rec.getLineItemCount('item');
            for (var i = 1; i <= currentLintItemCount; i++) {
                rec.setLineItemValue('item', 'price', i, '-7');
                rec.setLineItemValue('item', 'amount', i, '0');
                rec.setLineItemValue('item', 'taxcode', i, '-7');
            }
            // Body level discount handling
            rec.setFieldValue('discountitem', '');
            rec.setFieldValue('discountrate', '');
        },

        /**
         * Set Payment Information in Sales Order
         * @param rec
         * @param payment
         * @param netsuitePaymentTypes
         * @param magentoCCSupportedPaymentTypes
         */
        setPayment: function (rec, payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes) {
            Utility.logDebug("F3BaseV1Client.setPayment", "Start");
            var paymentInfo = ConnectorConstants.CurrentWrapper.getPaymentInfo(payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes);

            Utility.logDebug("External Payment", JSON.stringify(payment));
            Utility.logDebug("paymentInfo", JSON.stringify(paymentInfo));

            rec.setFieldValue("paymentmethod", paymentInfo.paymentmethod);
            rec.setFieldValue("pnrefnum", paymentInfo.pnrefnum);
            rec.setFieldValue("ccapproved", paymentInfo.ccapproved);
            rec.setFieldValue("paypalauthid", paymentInfo.paypalauthid);

            Utility.logDebug("F3BaseV1Client.setPayment", "End");
        },

        /**
         * Check either all products are gift cards or not??
         */
        checkAllProductsAreGiftCards: function (products) {
            for (var x = 0; x < products.length; x++) {
                if (products[x].product_type != ConnectorConstants.MagentoProductTypes.GiftCard) {
                    return false;
                }
            }
            return true;
        },

        /**
         * Description of method: Create Lead Record in NetSuite
         * @param magentoCustomerObj
         * @param sessionID
         * @param isGuest
         * @return {Object}
         */
        createLeadInNetSuite: function (magentoCustomerObj, sessionID, isGuest) {
            debugger;
            Utility.logDebug("this.createLeadInNetSuite", "Start");
            Utility.logDebug("magentoCustomerObj", JSON.stringify(magentoCustomerObj));
            Utility.logDebug("sessionID", JSON.stringify(sessionID));

            var result = {
                errorMsg: '',
                infoMsg: ''
            };
            try {
                var rec = nlapiCreateRecord('lead', {recordmode: "dynamic"});
                //rec.setFieldValue('isperson', 'T');
                //rec.setFieldValue('subsidiary', '3');// TODO: generalize location
                //   rec.setFieldValue('salutation', '');

                // zee: get customer address list: start

                var responseMagento;
                var addresses = {};

                if (!isGuest) {
                    responseMagento = ConnectorConstants.CurrentWrapper.getCustomerAddress(magentoCustomerObj.customer_id, sessionID);

                    if (!responseMagento.status) {
                        result.errorMsg = responseMagento.faultCode + '--' + responseMagento.faultString;
                        Utility.logDebug('Importing Customer', 'Customer having Magento Id: ' + magentoCustomerObj.customer_id + ' has not imported. -- ' + result.errorMsg);
                        throw new CustomException({
                            code: F3Message.Action.CUSTOMER_ADDRESS_IMPORT,
                            message: result.errorMsg,
                            recordType: "customer",
                            recordId: magentoCustomerObj.customer_id,
                            system: ConnectorConstants.CurrentStore.systemType,
                            exception: null,
                            action: "Import Customer Addresses from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                        });
                        //return result;
                    }

                    addresses = responseMagento.addresses;

                    if (!Utility.isBlankOrNull(addresses)) {
                        rec = ConnectorCommon.setAddresses(rec, addresses);
                    }

                    // setting sales order addresses
                    addresses = magentoCustomerObj.addresses;
                    rec = ConnectorCommon.setAddresses(rec, addresses, 'order');

                } else {
                    // if guest customer comes

                    if (!Utility.isBlankOrNull(addresses)) {
                        rec = ConnectorCommon.setAddresses(rec, magentoCustomerObj.addresses, 'order');
                    }
                }

                // zee: get customer address list: end

                rec.setFieldValue('isperson', 'T');
                //rec.setFieldValue('autoname', 'T');

                // set if customer is taxable or not
                var groupId = magentoCustomerObj.group_id;

                Utility.logDebug("Magento GroupId =  " + groupId, "Config Magento GroupId =  " + ConnectorConstants.CurrentStore.entitySyncInfo.customer.magentoCustomerGroups.taxExempt);

                if (groupId == ConnectorConstants.CurrentStore.entitySyncInfo.customer.magentoCustomerGroups.taxExempt) {
                    rec.setFieldValue('taxable', "F");
                } else {
                    rec.setFieldValue('taxable', "T");
                }

                // mulitple stores handling

                var magentoIdObjArrStr = ConnectorCommon.getMagentoIdObjectArrayString(ConnectorConstants.CurrentStore.systemId, isGuest ? 'Guest' : magentoCustomerObj.customer_id, 'create', null);

                if (Utility.isOneWorldAccount()) {
                    rec.setFieldValue('subsidiary', ConnectorConstants.CurrentStore.entitySyncInfo.customer.subsidiary);
                }

                // if customer is guest then no need to set the external system id
                if (!magentoCustomerObj._isGuestCustomer) {
                    rec.setFieldValue(ConnectorConstants.Entity.Fields.MagentoId, magentoIdObjArrStr);
                }

                rec.setFieldValue(ConnectorConstants.Entity.Fields.MagentoSync, 'T');
                rec.setFieldValue('email', magentoCustomerObj.email);
                rec.setFieldValue('firstname', magentoCustomerObj.firstname);
                rec.setFieldValue('middlename', magentoCustomerObj.middlename);
                rec.setFieldValue('lastname', magentoCustomerObj.lastname);//TODO: check
                rec.setFieldValue(ConnectorConstants.Entity.Fields.MagentoStore, ConnectorConstants.CurrentStore.systemId);

                //  rec.setFieldValue('salutation','');


                result.id = nlapiSubmitRecord(rec, false, true);
            } catch (ex) {
                result.errorMsg = ex.toString();
                Utility.logException('createLeadInNetSuite', ex);
                throw new CustomException({
                    code: F3Message.Action.CUSTOMER_IMPORT,
                    message: "An error occurred while importing Customer in NetSuite from " + ConnectorConstants.CurrentStore.systemDisplayName,
                    recordType: "customer",
                    recordId: magentoCustomerObj.customer_id,
                    system: ConnectorConstants.CurrentStore.systemType,
                    exception: ex,
                    action: "Import Customer from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                });
            }

            Utility.logDebug("this.createLeadInNetSuite", "End");

            return result;
        },

        /**
         * Description of method: Update Customer Record in NetSuite
         * @param customerId
         * @param magentoCustomerObj
         * @param sessionID
         * @return {Object}
         */
        updateCustomerInNetSuite: function (customerId, magentoCustomerObj, sessionID) {
            debugger;
            Utility.logDebug("F3BaseV1Client.updateCustomerInNetSuite", "Start");
            Utility.logDebug("customerId", JSON.stringify(customerId));
            Utility.logDebug("magentoCustomerObj", JSON.stringify(magentoCustomerObj));
            Utility.logDebug("sessionID", JSON.stringify(sessionID));
            var result = {};
            try {
                var rec = nlapiLoadRecord('customer', customerId, {recordmode: "dynamic"});

                // mulitple stores handling

                var existingMagentoId = rec.getFieldValue(ConnectorConstants.Entity.Fields.MagentoId);
                var magentoIdObjArrStr = ConnectorCommon.getMagentoIdObjectArrayString(ConnectorConstants.CurrentStore.systemId, magentoCustomerObj.customer_id, 'update', existingMagentoId);

                rec.setFieldValue(ConnectorConstants.Entity.Fields.MagentoId, magentoIdObjArrStr);
                rec.setFieldValue(ConnectorConstants.Entity.Fields.MagentoSync, 'T');
                rec.setFieldValue('email', magentoCustomerObj.email);
                rec.setFieldValue('firstname', magentoCustomerObj.firstname);
                rec.setFieldValue('middlename', magentoCustomerObj.middlename);
                rec.setFieldValue('lastname', magentoCustomerObj.lastname);
                var _existingStores = rec.getFieldValues(ConnectorConstants.Entity.Fields.MagentoStore) || [];

                // getFieldValues returns readonly array
                var existingStores = [];
                for (var i in _existingStores) {
                    existingStores.push(_existingStores[i]);
                }

                if (existingStores instanceof Array) {
                    if (existingStores.indexOf(ConnectorConstants.CurrentStore.systemId) === -1) {
                        existingStores.push(ConnectorConstants.CurrentStore.systemId);
                    }
                } else {
                    existingStores = "";
                }

                rec.setFieldValue(ConnectorConstants.Entity.Fields.MagentoStore, existingStores);
                //  rec.setFieldValue('salutation','');

                // set if customer is taxable or not
                var groupId = magentoCustomerObj.group_id || "";

                Utility.logDebug("Magento GroupId =  " + groupId, "Config Magento GroupId =  " + ConnectorConstants.CurrentStore.entitySyncInfo.customer.magentoCustomerGroups.taxExempt);

                if (groupId == ConnectorConstants.CurrentStore.entitySyncInfo.customer.magentoCustomerGroups.taxExempt) {
                    rec.setFieldValue('taxable', "F");
                } else {
                    rec.setFieldValue('taxable', "T");
                }

                // zee: get customer address list: start

                var custAddrXML;
                var responseMagento;
                var addresses;

                responseMagento = ConnectorConstants.CurrentWrapper.getCustomerAddress(magentoCustomerObj.customer_id, sessionID);

                if (!responseMagento.status) {
                    result.errorMsg = responseMagento.faultCode + '--' + responseMagento.faultString;
                    Utility.logDebug('Importing Customer', 'Customer having Magento Id: ' + magentoCustomerObj.customer_id + ' has not imported. -- ' + result.errorMsg);
                    throw new CustomException({
                        code: F3Message.Action.CUSTOMER_ADDRESS_IMPORT,
                        message: result.errorMsg,
                        recordType: "customer",
                        recordId: magentoCustomerObj.customer_id,
                        system: ConnectorConstants.CurrentStore.systemType,
                        exception: null,
                        action: "Import Customer Addresses from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                    });
                }

                addresses = responseMagento.addresses;
                Utility.logDebug("set customer addresses from addressbook", JSON.stringify(addresses));

                if (!Utility.isBlankOrNull(addresses)) {
                    rec = ConnectorCommon.setAddresses(rec, addresses);
                }
                // setting magento addresses from sales order
                addresses = magentoCustomerObj.addresses;
                Utility.logDebug("set customer addresses from salesorder", JSON.stringify(addresses));
                rec = ConnectorCommon.setAddresses(rec, addresses, 'order');

                // zee: get customer address list: end

                var id = nlapiSubmitRecord(rec, true, true);
            } catch (ex) {
                Utility.logException("updateCustomerInNetSuite", ex);
                throw new CustomException({
                    code: F3Message.Action.CUSTOMER_IMPORT,
                    message: "An error occurred while updating customer in NetSuite from " + ConnectorConstants.CurrentStore.systemDisplayName,
                    recordType: "customer",
                    recordId: customerId,
                    system: "NetSuite",
                    exception: ex,
                    action: "Import Customer Addresses from " + ConnectorConstants.CurrentStore.systemDisplayName + " to NetSuite"
                });
            }
            Utility.logDebug('Customer updated in NetSuite', 'Customer Id: ' + id);
            Utility.logDebug("F3BaseV1Client.updateCustomerInNetSuite", "End");
        },

        /**
         * Get Discount amount from magento agaist quote id and apply in order here.
         * @param rec
         * @param quoteId
         */
        setGiftCardLineItem: function (rec, quoteId) {
            if (Utility.isBlankOrNull(quoteId)) {
                Utility.logDebug("setGiftCardLineItem", "No need to handle gift card item");
                return;
            }
            // set gift card discount amount
            var discount = 0;
            var giftCertCode = null;
            try {
                Utility.logDebug("setGiftCardLineItem - quoteId", quoteId);
                var url = ConnectorConstants.CurrentStore.entitySyncInfo.magentoCustomizedApiUrl;
                var headers = {};
                headers['X-HTTP-NS-MG-CONNECTOR'] = "5ac0d7e1-7d9c-430b-af7c-ec66f64781c4";
                var postData = {};
                postData.data = JSON.stringify({"quoteId": quoteId});
                postData.apiMethod = "getGiftCardDiscount";
                var response = nlapiRequestURL(url, postData, headers).getBody();
                Utility.logDebug("setGiftCardLineItem - response", response);
                var responseData = JSON.parse(response);

                if (responseData["status"] == 1) {
                    discount = responseData.data["giftcardAmount"];
                    Utility.logDebug("setGiftCardLineItem - giftcardAmount", discount);
                    discount = !Utility.isBlankOrNull(discount) && !isNaN(discount) ? parseFloat(Math.abs(discount)) : 0;
                    Utility.logDebug("setGiftCardLineItem - giftcardAmount", discount);
                    giftCertCode = responseData.data["code"];
                }

                if (discount > 0) {
                    var giftCertCodeId = this.getGiftCertcode(giftCertCode);

                    rec.setLineItemValue("giftcertredemption", "authcode", 1, giftCertCodeId);
                    rec.setLineItemValue("giftcertredemption", "authcodeapplied", 1, discount);
                } else {
                    Utility.logDebug("setGiftCardLineItem", "Gift Card is not found in Magento Sales Order");
                }

            } catch (e) {
                Utility.logException('Error in Fetching Discount', e);
            }
        },

        /**
         * Set Gift Code in NetSuite and returns its internal id
         * @param code
         * @returns {*}
         */
        getGiftCertcode: function (code) {
            if (Utility.isBlankOrNull(code)) {
                return null;
            }

            var fils = [];
            var results = null;
            var giftCertcode = null;

            fils.push(new nlobjSearchFilter("giftcertcode", null, "is", code, null));

            results = nlapiSearchRecord("giftcertificate", null, fils, null);

            if (!!results) {
                giftCertcode = results[0].getId();
            }

            return giftCertcode;
        },

        /**
         * This method sets the shipping cost,
         * @param salesOrderObj
         * @param rec
         */
        setShippingInformation: function (salesOrderObj, rec) {
            var order = salesOrderObj.order;
            var products = salesOrderObj.products;

            if (!order.shipment_method && this.checkAllProductsAreGiftCards(products)) {
                Utility.logDebug('inside check', '');
                // If shipment_method is empty, and all products in order are 'gift cards',
                // (Note: No shipping information required if you add only gift cards product in an order)
                order.shipment_method = "DEFAULT_NS";
            }

            // settting shipping method: start

            var orderShipMethod = order.shipment_method + '';
            var shippingCost = order.shipping_amount || 0;

            Utility.logDebug('XML', 'orderShipMethod: ' + orderShipMethod);

            //var nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod_' + systemId, orderShipMethod);
            var nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod', orderShipMethod);
            var shippingCarrier;
            var shippingMethod;

            Utility.logDebug('SCRUB', 'nsShipMethod: ' + nsShipMethod);

            // if no mapping is found then search for default
            if (orderShipMethod === nsShipMethod) {
                //nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod_' + systemId, 'DEFAULT_NS');
                nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod', 'DEFAULT_NS');
            }

            Utility.logDebug('Final SCRUB', 'nsShipMethod: ' + nsShipMethod);

            nsShipMethod = (nsShipMethod + '').split('_');

            shippingCarrier = nsShipMethod.length === 2 ? nsShipMethod[0] : '';
            shippingMethod = nsShipMethod.length === 2 ? nsShipMethod[1] : '';

            if (!(Utility.isBlankOrNull(shippingCarrier) || Utility.isBlankOrNull(shippingMethod))) {
                rec.setFieldValue('shipcarrier', shippingCarrier);
                rec.setFieldValue('shipmethod', shippingMethod);
                rec.setFieldValue('shippingcost', shippingCost);
            } else {
                rec.setFieldValue('shipcarrier', '');
                rec.setFieldValue('shipmethod', '');
                rec.setFieldValue('shippingcost', '');
            }

            Utility.logDebug('order.shipping_amount ', order.shipping_amount);
            Utility.logDebug('setting method ', nsShipMethod.join(','));

            // settting shipping method: end
        },

        /**
         * Create simple inventory item
         * @param itemObject
         * @returns {string}
         */
        upsertInventoyItemSimple: function (itemObject) {
            Utility.logDebug("upsertInventoyItemSimple", "");
            var recordId;
            // append internal id in the item object if product is found in NetSuite
            this.appendInternalIdIfItemExist(ConnectorConstants.CurrentStore.systemId, itemObject);
            recordId = ConnectorConstants.Client.upsertInventoryItem(itemObject);
            Utility.logDebug("upsertInventoyItemSimple", "recordId: " + recordId);

            return recordId;
        },
        /**
         * Create matrix parent inventory item
         * @param itemObject
         * @returns {string}
         */
        upsertInventoyItemMatrixParent: function (itemObject) {
            Utility.logDebug("upsertInventoyItemMatrixParent", "");
            var recordId;
            // append internal id in the item object if product is found in NetSuite
            this.appendInternalIdIfItemExist(ConnectorConstants.CurrentStore.systemId, itemObject);
            recordId = ConnectorConstants.Client.upsertInventoryItem(itemObject);

            Utility.logDebug("upsertInventoyItemMatrixParent", "recordId: " + recordId);
            return recordId;
        },

        /**
         * Get matrix parent inventory item internal id
         * @param itemObject
         * @returns {string}
         */
        getInvItemMatrixParentId: function (itemObject) {
            Utility.logDebug("getInvItemMatrixParentId", "");
            var itemSearchObj, recordId = null;
            // check if item is already created
            itemSearchObj = ItemImportLibrary.getItemIfAlreadySyncedInNS(ConnectorConstants.CurrentStore.systemId, itemObject.id);
            Utility.logDebug("itemSearchObj", JSON.stringify(itemSearchObj));
            if (!Utility.isBlankOrNull(itemSearchObj)) {
                // if product exist simply return the internal id
                recordId = itemSearchObj.internalId;
            } else {
                // if parent item is not exist then create a parent item first
                recordId = this.upsertInventoyItemMatrixParent(itemObject);
            }
            Utility.logDebug("getInvItemMatrixParentId", "recordId: " + recordId);
            return recordId;
        },
        /**
         * Create matrix child inventory item
         * @param itemObject
         * @returns {string}
         */
        upsertInventoyItemMatrixChild: function (itemObject) {
            Utility.logDebug("upsertInventoyItemMatrixChild", "");
            var recordId;
            var matrixParentId;

            // getting parent matrix item's internal id
            matrixParentId = this.getInvItemMatrixParentId(itemObject.parent);

            // if parent item id is not found in any case then throw an error
            if (Utility.isBlankOrNull(matrixParentId)) {
                Utility.throwException("RECORD_DOESNOT_EXIST", "Parent Record Id is not found")
            }

            // adding matrix parent item internal id in child product object
            itemObject.matrixParentId = matrixParentId;
            // append internal id in the item object if product is found in NetSuite
            this.appendInternalIdIfItemExist(ConnectorConstants.CurrentStore.systemId, itemObject);
            recordId = this.upsertInventoryItem(itemObject);

            Utility.logDebug("upsertInventoyItemMatrixChild", "recordId: " + recordId);

            return recordId;
        },
        upsertItemKitParent: function (itemObject) {
        },
        upsertItemKitChild: function (itemObject) {
        },
        upsertItemGroupParent: function (itemObject) {
        },
        upsertItemGroupChild: function (itemObject) {
        },
        upsertNonInventoyItemMatrixParent: function (itemObject) {
        },
        upsertNonInventoyItemMatrixChild: function (itemObject) {
        },
        upsertNonInventoyItemSimple: function (itemObject) {
        },

        /**
         * Append internal id and record type in itemObject
         * @param storeId
         * @param itemObject
         */
        appendInternalIdIfItemExist: function (storeId, itemObject) {
            Utility.logDebug("appendInternalIdIfItemExist", "1");
            // check if item is already created
            var itemSearchObj = ItemImportLibrary.getItemIfAlreadySyncedInNS(ConnectorConstants.CurrentStore.systemId, itemObject.id);
            Utility.logDebug("itemSearchObj", JSON.stringify(itemSearchObj));
            if (!Utility.isBlankOrNull(itemSearchObj)) {
                // update item
                itemObject.netSuiteRecordType = itemSearchObj.itemType;
                itemObject.netSuiteInternalId = itemSearchObj.internalId;
                Utility.logDebug("appendInternalIdIfItemExist", "2");
            }
            Utility.logDebug("appendInternalIdIfItemExist", "3");
        },

        /**
         * Upsert item in NetSuite
         * @param itemObject
         * @returns {string}
         */
        upsertItem: function (itemObject) {
            if (itemObject.itemType === "inventory") {
                if (itemObject.matrixType === "PARENT") {
                    return this.upsertInventoyItemMatrixParent(itemObject);
                }
                else if (itemObject.matrixType === "CHILD") {
                    return this.upsertInventoyItemMatrixChild(itemObject);
                } else {
                    // assume itemObject.matrixType is empty
                    return this.upsertInventoyItemSimple(itemObject);
                }
            }
            else if (itemObject.itemType === "noninventory") {
                if (itemObject.matrixType === "PARENT") {
                    return this.upsertNonInventoyItemMatrixParent(itemObject);
                }
                else if (itemObject.matrixType === "CHILD") {
                    return this.upsertNonInventoyItemMatrixChild(itemObject);
                } else {
                    // assume itemObject.matrixType is empty
                    return this.upsertNonInventoyItemSimple(itemObject);
                }
            }
            else if (itemObject.itemType === "kit") {
                // TODO: implement including kitType attribute
                if (itemObject.kitType === "PARENT") {
                    return this.upsertItemKitParent(itemObject);
                }
                else {
                    return this.upsertItemKitChild(itemObject);
                }
            }
            else if (itemObject.itemType === "group") {
                // TODO: implement including groupType attribute
                if (itemObject.groupType === "PARENT") {
                    return this.upsertItemGroupParent(itemObject);
                }
                else {
                    return this.upsertItemGroupChild(itemObject);
                }
            }
        },
        setMatrixItemAttributes: function (itemRec, data) {
            // define the Item's options
            for (var i in data.matrixAttributes) {
                var matrixAttribute = data.matrixAttributes[i];

                var attributeId = matrixAttribute.attributeId;
                var attributeValues = matrixAttribute.attributeValues;
                // for setting item option value in child product we need to add a prefix in field id
                itemRec.setFieldValue((!!data.matrixParentId ? "matrixoption" : "") + attributeId, attributeValues);
            }
        },

        setCustomAttributes: function (itemRec, data) {
            for (var i in data.customAttributes) {
                var customAttribute = data.customAttributes[i];

                var attributeId = customAttribute.attributeId;
                var attributeValues = customAttribute.attributeValues;
                // for setting item option value in child product we need to add a prefix in field id
                itemRec.setFieldValue(attributeId, attributeValues);
            }
        },
        /**
         * Get an array of external system store ids
         * @param itemRec
         * @returns {Array}
         */
        getStoresToSet: function (itemRec) {
            var newStores = [];
            var existingStores = itemRec.getFieldValues(ConnectorConstants.Item.Fields.MagentoStores);
            existingStores = !Utility.isBlankOrNull(existingStores) ? existingStores : [];

            // selecting stores in item record
            if (existingStores instanceof Array) {
                if (existingStores.length === 0) {
                    newStores.push(ConnectorConstants.CurrentStore.systemId);
                }
                else if (existingStores.length > 0) {
                    newStores = newStores.concat(existingStores);
                    newStores.push(ConnectorConstants.CurrentStore.systemId);
                }
                else {
                    newStores = existingStores;
                }
            }
            return newStores;
        },
        /**
         * Get an array of external system ids
         * @param itemRec
         * @param data
         * @returns {Array}
         */
        getExternalSystemIdToSet: function (itemRec, data) {
            var isCreating = !data.hasOwnProperty("netSuiteInternalId");
            var newExternalSystemIds = [];
            var itemIdJSON;
            var existingExternalSystemIds = itemRec.getFieldValue(ConnectorConstants.Item.Fields.MagentoId);
            existingExternalSystemIds = !Utility.isBlankOrNull(existingExternalSystemIds) ? JSON.parse(existingExternalSystemIds) : [];

            if (isCreating) {
                // making a JSON array
                if (existingExternalSystemIds instanceof Array) {
                    itemIdJSON = JSON.parse(ConnectorCommon.getMagentoIdForSearching(ConnectorConstants.CurrentStore.systemId, data.id));
                    if (existingExternalSystemIds.length === 0) {
                        newExternalSystemIds.push(itemIdJSON);
                    } else if (existingExternalSystemIds.length > 0) {
                        newExternalSystemIds = newExternalSystemIds.concat(existingExternalSystemIds);
                        newExternalSystemIds.push(itemIdJSON);
                    } else {
                        newExternalSystemIds = existingExternalSystemIds;
                    }
                }
            } else {
                newExternalSystemIds = existingExternalSystemIds;
            }

            return newExternalSystemIds;
        },
        /**
         * Upsert inventory item in NetSuite
         * @param data
         * @returns {string}
         */
        upsertInventoryItem: function (data) {
            Utility.logDebug("upsertInventoryItem", JSON.stringify(data));
            debugger;
            var isCreating = !data.hasOwnProperty("netSuiteInternalId");
            // create Matrix Item Parent/Child/Simple
            var inventoryItem = isCreating ? nlapiCreateRecord('inventoryitem') : nlapiLoadRecord('inventoryitem', data.netSuiteInternalId, {recordmode: "dynamic"});

            inventoryItem.setFieldValue('itemid', data.itemId);
            inventoryItem.setFieldValue('displayname', data.displayName);
            inventoryItem.setFieldValue('matrixtype', data.matrixType);
            inventoryItem.setFieldValue('parent', data.matrixParentId);

            // set matrix item attributes
            this.setMatrixItemAttributes(inventoryItem, data);

            // set custom attributes
            this.setCustomAttributes(inventoryItem, data);

            // set categories and attribute set
            inventoryItem.setFieldValue(ConnectorConstants.Item.Fields.ExternalSystemAttrSet, data.attributeSet);
            inventoryItem.setFieldValue(ConnectorConstants.Item.Fields.ExternalSystemItemCategory, data.categories);

            var stores = this.getStoresToSet(inventoryItem);
            var externalSystemIds = this.getExternalSystemIdToSet(inventoryItem, data);

            inventoryItem.setFieldValue(ConnectorConstants.Item.Fields.MagentoStores, stores);
            inventoryItem.setFieldValue(ConnectorConstants.Item.Fields.MagentoId, JSON.stringify(externalSystemIds));
            inventoryItem.setFieldValue(ConnectorConstants.Item.Fields.MagentoSync, "T");

            var id = nlapiSubmitRecord(inventoryItem);

            return id;
        }

    };
    return self;
}

/**
 * Create an object for FMW Client
 * @returns {object}
 * @constructor
 */
function F3FmwShopifyClient() {
    var currentClient = new F3ClientBase();

    /**
     * Set Payment Information in Sales Order
     * @param rec
     * @param payment
     * @param netsuitePaymentTypes
     * @param magentoCCSupportedPaymentTypes
     */
    currentClient.setPayment = function (rec, payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes) {
        Utility.logDebug("F3BaseV1Client.setPayment", "Start");
        var paymentInfo = ConnectorConstants.CurrentWrapper.getPaymentInfo(payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes);

        Utility.logDebug("External Payment", JSON.stringify(payment));
        Utility.logDebug("paymentInfo", JSON.stringify(paymentInfo));

        rec.setFieldValue("paymentmethod", paymentInfo.paymentmethod);

        // all other fields set to blank when importing orders from Shopify
        rec.setFieldValue("ccnumber", "");
        rec.setFieldValue("ccexpiredate", "");
        rec.setFieldValue("debitcardissueno", "");
        rec.setFieldValue("validfrom", "");
        rec.setFieldValue("ccname", "");
        rec.setFieldValue("ccstreet", "");
        rec.setFieldValue("cczipcode", "");
        rec.setFieldValue("ccapproved", "F");
        rec.setFieldValue("ccavsstreetmatch", "");
        rec.setFieldValue("ccavszipmatch", "");
        rec.setFieldValue("creditcardprocessor", "");
        rec.setFieldValue("pnrefnum", "");
        rec.setFieldValue("authcode", "");
        rec.setFieldValue("isrecurringpayment", "F");
        rec.setFieldValue("paypalauthid", "");
        rec.setFieldValue("paypaltranid", "");
        rec.setFieldValue("paypalstatus", "");

        Utility.logDebug("F3BaseV1Client.setPayment", "End");
    };

    return currentClient;
}


function F3KablaWooClient() {
    var currentClient = new F3ClientBase();

    /**
     * Set Payment Information in Sales Order
     * @param rec
     * @param payment
     * @param netsuitePaymentTypes
     * @param magentoCCSupportedPaymentTypes
     */
    currentClient.setPayment = function (rec, payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes) {
        Utility.logDebug("F3BaseV1Client.setPayment", "Start");
        var paymentInfo = ConnectorConstants.CurrentWrapper.getPaymentInfo(payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes);

        Utility.logDebug("External Payment", JSON.stringify(payment));
        Utility.logDebug("paymentInfo", JSON.stringify(paymentInfo));

        /*rec.setFieldValue("paymentmethod", paymentInfo.paymentmethod);
         rec.setFieldValue("pnrefnum", paymentInfo.pnrefnum);
         rec.setFieldValue("ccapproved", paymentInfo.ccapproved);
         rec.setFieldValue("paypalauthid", paymentInfo.paypalauthid);*/

        rec.setFieldValue("paymentmethod", "");
        rec.setFieldValue("pnrefnum", "");
        rec.setFieldValue("ccapproved", "");
        rec.setFieldValue("paypalauthid", "");

        Utility.logDebug("F3BaseV1Client.setPayment", "End");
    };

    return currentClient;
}
/**
 *
 * @returns {F3ClientBase}
 * @constructor
 * IntekAmerica customized Set Sales Order Function
 */
function F3IntekShopifyClient() {

    var currentClient = new F3ClientBase();
    /**
     *
     * @param rec
     * @param salesOrderObj
     */
    currentClient.setSalesOrderFields = function(rec, salesOrderObj) {

        var order = salesOrderObj.order;

        var magentoIdId;
        var magentoSyncId;
        var externalSystemSalesOrderModifiedAt;

        magentoIdId = ConnectorConstants.Transaction.Fields.MagentoId;
        magentoSyncId = ConnectorConstants.Transaction.Fields.MagentoSync;
        externalSystemSalesOrderModifiedAt = ConnectorConstants.Transaction.Fields.ExternalSystemSalesOrderModifiedAt;
        var netsuiteCustomerId = salesOrderObj.netsuiteCustomerId;

        // set csutomer in order
        rec.setFieldValue('entity', netsuiteCustomerId);
        rec.setFieldValue(magentoSyncId, 'T');
        rec.setFieldValue(magentoIdId, order.increment_id.toString());
        rec.setFieldValue('tranid', order.order_number);
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.ExternalSystemNumber, order.order_id + "");
        rec.setFieldValue(externalSystemSalesOrderModifiedAt, order.updatedAt);
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.PhoneNo,salesOrderObj.phone);
        //rec.setFieldValue('memo', 'Test Folio3');

        // isDummyItemSetInOrder is set in while setting line items in order
        if (salesOrderObj.isDummyItemSetInOrder) {
            // A = Pending Approval
            // if order has dummy item then set status to A (Pending Approval)
            rec.setFieldValue('orderstatus', 'A');
        } else {
            rec.setFieldValue('orderstatus', 'B');
        }

        rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore, ConnectorConstants.CurrentStore.systemId);
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.FromOtherSystem, 'T');
        var _storeID = ConnectorConstants.CurrentStore.systemId;
        Utility.logDebug(_storeID);
        if (_storeID == 1) {
            rec.setFieldValue(ConnectorConstants.Transaction.Fields.Class, 19);
            Utility.logDebug(ConnectorConstants.Transaction.Fields.Class);
        } else if (_storeID == 2) {
            rec.setFieldValue(ConnectorConstants.Transaction.Fields.Class, 20);
        }
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.Location, 5);
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.SalesOrderType, 4);
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.SalesReresentative,18);
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.ShippingMethod,85);
        rec.setFieldValue(ConnectorConstants.Transaction.Fields.ShippingTerms,2);
        Utility.logDebug(ConnectorConstants.Transaction.Fields.SalesOrderType);
    }
    return currentClient;
}
function F3AlphaOmegaClient(){
    var currentClient = new F3ClientBase();
    /**
     * This method sets the shipping cost,
     * @param salesOrderObj
     * @param rec
     */
    currentClient.setShippingInformation=function (salesOrderObj, rec) {
        var order = salesOrderObj.order;
        var products = salesOrderObj.products;

        if (!order.shipment_method && this.checkAllProductsAreGiftCards(products)) {
            Utility.logDebug('inside check', '');
            // If shipment_method is empty, and all products in order are 'gift cards',
            // (Note: No shipping information required if you add only gift cards product in an order)
            order.shipment_method = "DEFAULT_NS";
        }

        // settting shipping method: start

        var orderShipMethod = order.shipment_method + '';
        var shippingCost = order.shipping_amount || 0;

        Utility.logDebug('XML', 'orderShipMethod: ' + orderShipMethod);

        //var nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod_' + systemId, orderShipMethod);
        var nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod', orderShipMethod);
        var shippingCarrier;
        var shippingMethod;

        Utility.logDebug('SCRUB', 'nsShipMethod: ' + nsShipMethod);

        // if no mapping is found then search for default
        if (orderShipMethod === nsShipMethod) {
            //nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod_' + systemId, 'DEFAULT_NS');
            nsShipMethod = FC_ScrubHandler.getMappedValue('ShippingMethod', 'DEFAULT_NS');
        }

        Utility.logDebug('Final SCRUB', 'nsShipMethod: ' + nsShipMethod);

        nsShipMethod = (nsShipMethod + '').split('_');

        shippingCarrier = nsShipMethod.length === 2 ? nsShipMethod[0] : '';
        shippingMethod = nsShipMethod.length === 2 ? nsShipMethod[1] : '';

        if (!(Utility.isBlankOrNull(shippingCarrier) || Utility.isBlankOrNull(shippingMethod))) {
            rec.setFieldValue('shipcarrier', shippingCarrier);
            rec.setFieldValue('custbody_shippingcarrier', shippingMethod);
            rec.setFieldValue('shippingcost', shippingCost);
        } else {
            rec.setFieldValue('shipcarrier', '');
            rec.setFieldValue('shipmethod', '');
            rec.setFieldValue('shippingcost', '');
        }

        Utility.logDebug('order.shipping_amount ', order.shipping_amount);
        Utility.logDebug('setting method ', nsShipMethod.join(','));

        // settting shipping method: end
    }
    return currentClient;
}
