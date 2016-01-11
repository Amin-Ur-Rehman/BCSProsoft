/**
 * Created by Zeeshan Ahmed on 12/15/2015.
 */

/**
 * COIExportHelper class that has the functionality of
 */
var COIExportHelper = (function () {
    return {
        /**
         * Gets Cash Sales or Invoices based on the the Store Id
         * @param allStores
         * @param storeId
         * @return {object[],[]}
         */
        getCOIs: function (allStores, storeId) {
            var filters = [];
            var records;
            var result = [];
            var arrCols = [];
            var resultObject;

            Utility.logDebug('getting cash sales order invoices for storeId', storeId);

            var ageOfRecordsToSyncInDays = ConnectorConstants.CurrentStore.entitySyncInfo.cashsaleOrInvoice.ageOfRecordsToSyncInDays;
            //Utility.logDebug('ageOfRecordsToSyncInDays', ageOfRecordsToSyncInDays);

            var currentDate = Utility.getDateUTC(0);
            //Utility.logDebug('currentDate', currentDate);
            var oldDate = nlapiAddDays(currentDate, ageOfRecordsToSyncInDays * -1);
            //Utility.logDebug('oldDate', oldDate);
            oldDate = nlapiDateToString(oldDate);
            //Utility.logDebug('first nlapiDateToString', oldDate);
            oldDate = oldDate.toLowerCase();
            //Utility.logDebug('oldDate toLowerCase', oldDate);
            oldDate = nlapiDateToString(nlapiStringToDate(oldDate, 'datetime'), 'datetime');
            //Utility.logDebug('oldNetSuiteDate', oldDate);
            filters.push(new nlobjSearchFilter('lastmodifieddate', null, 'onorafter', oldDate, null));

            if (!allStores) {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoStore, null, 'is', storeId, null));
            } else {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoStore, null, 'noneof', '@NONE@', null));
            }
            filters.push(new nlobjSearchFilter('type', null, 'anyof', ["CashSale", "CustInv"], null));
            filters.push(new nlobjSearchFilter('type', "createdfrom", 'anyof', ['SalesOrd'], null));
            filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoId, "createdfrom", 'isnotempty', null, null));
            filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoStore, "createdfrom", 'noneof', '@NONE@', null));
            filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoInvoiceId, null, 'isempty', null, null));
            filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T', null));

            arrCols.push((new nlobjSearchColumn('internalid', null, null)).setSort(false));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.Transaction.Fields.MagentoId, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.Transaction.Fields.MagentoStore, null, null));

            records = nlapiSearchRecord('transaction', null, filters, arrCols);

            if (!Utility.isBlankOrNull(records) && records.length > 0) {

                for (var i = 0; i < records.length; i++) {
                    resultObject = {};

                    resultObject.internalId = records[i].getId();
                    resultObject.recordType = records[i].getRecordType();
                    resultObject.magentoOrderIds = records[i].getValue(ConnectorConstants.Transaction.Fields.MagentoId, null, null);
                    resultObject.magentoStore = records[i].getValue(ConnectorConstants.Transaction.Fields.MagentoStore, null, null);

                    result.push(resultObject);
                }
            }
            return result;
        },
        getIdMapforOrderItemIds: function (nsObjOrder) {
            var line, itemId, orderItemId, map = {};
            var totalLines = nsObjOrder.getLineItemCount('item');
            for (line = 1; line <= totalLines; line++) {
                itemId = nsObjOrder.getLineItemValue('item', "item", line);
                orderItemId = nsObjOrder.getLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, line);
                if (!map.hasOwnProperty(itemId)) {
                    map[itemId] = orderItemId;
                }
            }
            return map;
        },
        /**
         * Gets a fulfillment Order
         * @param coiObject
         * @param store
         * @return {*}
         */
        getCOI: function (coiObject, store) {
            var coiDataObject = null;
            try {
                var recordType = coiObject.recordType;
                var coiInternalId = coiObject.internalId;
                var coiRecord = nlapiLoadRecord(recordType, coiInternalId, null);
                var orderInternalId = coiRecord.getFieldValue("createdfrom");
                var orderRecord = nlapiLoadRecord("salesorder", orderInternalId);

                coiDataObject = {};
                coiDataObject.storeId = '1';
                coiDataObject.recordType = recordType;
                coiDataObject.coiInternalId = coiInternalId;
                coiDataObject.orderIncrementId = orderRecord.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                coiDataObject.isOrderFromOtherSystem = orderRecord.getFieldValue(ConnectorConstants.Transaction.Fields.FromOtherSystem) == "T";
                coiDataObject.orderPaymentMethod = orderRecord.getFieldValue("paymentmethod");
                coiDataObject.orderItemIdsMap = this.getIdMapforOrderItemIds(orderRecord);
                coiDataObject.nsObj = coiRecord;

                delete coiDataObject.nsObj;
            } catch (e) {
                Utility.logException('COIExportHelper.getCOI', e);
                Utility.throwException("GET_INVOICE_OR_CASH_SALE_DATA_FOR_EXPORT", e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
            }
            Utility.logDebug('getCOI', JSON.stringify(coiDataObject));

            return coiDataObject;
        },

        /**
         * Set Magento Invoice Id in Cash Sale or Invoice
         * @param invoiceId
         * @param coiRecord
         */
        setMagentoInvoiceId: function (invoiceId, coiRecord) {
            try {
                var orderItemIdsMap = coiRecord.orderItemIdsMap;
                var rec = nlapiLoadRecord(coiRecord.recordType, coiRecord.coiInternalId);
                var totalLines = rec.getLineItemCount('item');
                var line, itemId, orderItemId;
                for (line = 1; line <= totalLines; line++) {
                    itemId = rec.getLineItemValue('item', "item", line);
                    orderItemId = orderItemIdsMap[itemId];
                    rec.setLineItemValue("item", ConnectorConstants.Transaction.Columns.MagentoOrderId, line, orderItemId);
                }
                rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoSync, "T");
                rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoInvoiceId, invoiceId + "");
                rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoId, coiRecord.orderIncrementId + "");
                nlapiSubmitRecord(rec);
            } catch (e) {
                Utility.logException('COIExportHelper.setMagentoInvoiceId', e);
            }
        },
        /**
         * Check either payment of this Invoice should capture online or not
         */
        checkPaymentCapturingMode: function (coiRecord) {
            var isOnlineMethod = this.isOnlineCapturingPaymentMethod(coiRecord.orderPaymentMethod);
            return (coiRecord.isOrderFromOtherSystem && isOnlineMethod);
        },
        /**
         * Check either payment method capturing is online supported or not??
         * @param sOPaymentMethodId
         */
        isOnlineCapturingPaymentMethod: function (sOPaymentMethodId) {
            var onlineSupported = false;
            switch (sOPaymentMethodId) {
                case ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes.Discover:
                case ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes.MasterCard:
                case ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes.Visa:
                case ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes.AmericanExpress:
                case ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes.PayPal:
                case ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.netsuitePaymentTypes.EFT:
                    onlineSupported = true;
                    break;
                default :
                    onlineSupported = false;
                    break;
            }

            return onlineSupported;
        }
    };
})();