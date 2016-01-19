/**
 * Created by Zeeshan Ahmed on 12/14/2015.
 * Description:
 * - This script is responsible for exporting item fulfillments from NetSuite to Magento
 * -
 * Referenced By:
 * -
 * Dependencies:
 * -
 * -
 */

/**
 * FulfillmentExportHelper class that has the functionality of
 */
var FulfillmentExportHelper = (function () {
    return {
        /**
         * Gets Fulfillments based on the the Store Id
         * @param allStores
         * @param storeId
         * @return {object[],[]}
         */
        getFulfillments: function (allStores, storeId) {
            var filters = [];
            var records;
            var result = [];
            var arrCols = [];
            var resultObject;

            Utility.logDebug('getting fulfillments for storeId', storeId);

            var ageOfRecordsToSyncInDays = ConnectorConstants.CurrentStore.entitySyncInfo.fulfillment.ageOfRecordsToSyncInDays;
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
            filters.push(new nlobjSearchFilter('lastmodifieddate', null, 'onorafter', oldDate, null));

            if (!allStores) {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoStore, null, 'is', storeId, null));
            } else {
                filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoStore, null, 'noneof', '@NONE@', null));
            }
            filters.push(new nlobjSearchFilter('type', null, 'anyof', 'ItemShip', null));
            filters.push(new nlobjSearchFilter('type', "createdfrom", 'anyof', ['SalesOrd'], null));
            filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoStore, "createdfrom", 'noneof', '@NONE@', null));
            filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoId, "createdfrom", 'isnotempty', null, null));
            filters.push(new nlobjSearchFilter(ConnectorConstants.Transaction.Fields.MagentoShipmentId, null, 'isempty', null, null));
            filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T', null));

            arrCols.push((new nlobjSearchColumn('internalid', null, null)).setSort(false));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.Transaction.Fields.MagentoId, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.Transaction.Fields.MagentoStore, null, null));

            records = nlapiSearchRecord('itemfulfillment', null, filters, arrCols);

            if (!Utility.isBlankOrNull(records) && records.length > 0) {

                for (var i = 0; i < records.length; i++) {
                    resultObject = {};

                    resultObject.internalId = records[i].getId();
                    resultObject.magentoOrderIds = records[i].getValue(ConnectorConstants.Transaction.Fields.MagentoId, null, null);
                    resultObject.magentoStore = records[i].getValue(ConnectorConstants.Transaction.Fields.MagentoStore, null, null);

                    result.push(resultObject);
                }
            }
            return result;
        },
        appendPackagingInfoInDataObject: function (fulfillmentRecord, fulfillmentDataObject) {
            var packagingArr = [];
            // from SO
            var orderObj = fulfillmentDataObject.nsObjOrder;
            var carrier = orderObj.getFieldValue('carrier') || "";
            var carrierText = orderObj.getFieldText('shipmethod') || "";

            var upsPackage = '';
            var totalPackages;
            // packages sublist is generated by carrier / netsuite feature
            if (fulfillmentRecord.getLineItemCount('packageups') > 0) {
                upsPackage = 'ups';
            }
            if (fulfillmentRecord.getLineItemCount('packageusps') > 0) {
                upsPackage = 'usps';
            }
            if (fulfillmentRecord.getLineItemCount('packagefedex') > 0) {
                upsPackage = 'fedex';
            }
            totalPackages = fulfillmentRecord.getLineItemCount('package' + upsPackage);

            for (var p = 1; p <= totalPackages; p++) {
                var trackingNumber = fulfillmentRecord.getLineItemValue('package' + upsPackage, 'packagetrackingnumber' + upsPackage, p);
                if (!Utility.isBlankOrNull(trackingNumber)) {
                    packagingArr.push({
                        carrier: carrier,
                        carrierText: carrierText,
                        trackingNumber: trackingNumber
                    });
                }
            }
            fulfillmentDataObject.packages = packagingArr;
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
         * Append items and discount data in orderDataObject for exporting sales order
         * @param fulfillmentRecord
         * @param fulfillmentDataObject
         */
        appendItemsInDataObject: function (fulfillmentRecord, fulfillmentDataObject) {
            var arr = [];
            try {
                var itemId;
                var orderItemId;
                var itemQty;
                var line;
                var comment = "";
                var isSerialItem = "";
                var serialNumbers = "";
                var itemDescription = "";
                var itemIdsArr = [];
                var totalLines = fulfillmentRecord.getLineItemCount('item');
                var orderItemIdsMap = fulfillmentDataObject.orderItemIdsMap;

                for (line = 1; line <= totalLines; line++) {
                    itemId = fulfillmentRecord.getLineItemValue('item', "item", line);
                    orderItemId = orderItemIdsMap[itemId];
                    if (!Utility.isBlankOrNull(itemId) && itemIdsArr.indexOf(itemId) === -1) {
                        itemIdsArr.push(itemId);

                        itemQty = fulfillmentRecord.getLineItemValue('item', 'quantity', line);
                        isSerialItem = fulfillmentRecord.getLineItemValue('item', 'isserialitem', line) === "T";
                        serialNumbers = fulfillmentRecord.getLineItemValue('item', 'serialnumbers', line);
                        itemDescription = fulfillmentRecord.getLineItemValue('item', 'itemdescription', line);

                        if (isSerialItem) {
                            comment = comment + ',' + itemDescription + '=' + serialNumbers;
                        }
                        else {
                            comment = '-';
                        }
                    }
                    arr.push({
                        itemId: itemId,
                        orderItemId: orderItemId,
                        itemQty: itemQty,
                        isSerialItem: isSerialItem,
                        serialNumbers: serialNumbers,
                        itemDescription: itemDescription
                    });
                }
                fulfillmentDataObject.items = arr;
            }
            catch (e) {
                Utility.logException('FulfillmentExportHelper.appendItemsInDataObject', e);
                Utility.throwException("GET_FULFILLMENT_DATA_FOR_EXPORT", e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
            }
        },
        /**
         *
         * @param fulfillmentRecord
         * @param fulfillmentDataObject
         */
        appendCommentInDataObject: function (fulfillmentRecord, fulfillmentDataObject) {
            var itemId;
            var line;
            var comment = "";
            var isSerialItem = "";
            var serialNumbers = "";
            var itemDescription = "";
            var itemIdsArr = [];
            var totalLines = fulfillmentRecord.getLineItemCount('item');

            for (line = 1; line <= totalLines; line++) {
                itemId = fulfillmentRecord.getLineItemValue('item', "item", line);
                if (!Utility.isBlankOrNull(itemId) && itemIdsArr.indexOf(itemId) === -1) {
                    itemIdsArr.push(itemId);
                    isSerialItem = fulfillmentRecord.getLineItemValue('item', 'isserialitem', line) === "T";
                    serialNumbers = fulfillmentRecord.getLineItemValue('item', 'serialnumbers', line);
                    itemDescription = fulfillmentRecord.getLineItemValue('item', 'itemdescription', line);

                    if (isSerialItem) {
                        comment += ',' + itemDescription + '=' + serialNumbers;
                    }
                    else {
                        comment = comment === "" ? "" : comment + "-";
                    }
                }
            }

            fulfillmentDataObject.comment = comment;
        },

        /**
         * Gets a fulfillment Order
         * @param fulfillmentInternalId
         * @param store
         * @return {*}
         */
        getFulfillment: function (fulfillmentInternalId, store) {
            var fulfillmentDataObject = null;
            try {
                var fulfillmentRecord = nlapiLoadRecord('itemfulfillment', fulfillmentInternalId, null);
                var orderId = fulfillmentRecord.getFieldValue("orderid");

                var orderRecord = nlapiLoadRecord('salesorder', orderId, null);
                var orderMagentoId = orderRecord.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                fulfillmentDataObject = {};
                fulfillmentDataObject.storeId = '1';
                fulfillmentDataObject.orderIncrementId = orderMagentoId;
                fulfillmentDataObject.nsObjFulfillment = fulfillmentRecord;
                fulfillmentDataObject.nsObjOrder = orderRecord;
                fulfillmentDataObject.orderItemIdsMap = this.getIdMapforOrderItemIds(orderRecord);
                this.appendItemsInDataObject(fulfillmentRecord, fulfillmentDataObject);
                this.appendCommentInDataObject(fulfillmentRecord, fulfillmentDataObject);
                this.appendPackagingInfoInDataObject(fulfillmentRecord, fulfillmentDataObject);

                delete fulfillmentDataObject.nsObjFulfillment;
                delete fulfillmentDataObject.nsObjOrder;
            } catch (e) {
                Utility.logException('FulfillmentExportHelper.getFulfillment', e);
                Utility.throwException("GET_FULFILLMENT_DATA_FOR_EXPORT", e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString());
            }
            Utility.logDebug('getFulfillment', JSON.stringify(fulfillmentDataObject));

            return fulfillmentDataObject;
        },

        /**
         * Set Magento Shipment Id
         * @param shipmentId
         * @param itemFulfillmentId
         * @param fulfillmentRecord
         */
        setMagentoShipmentId: function (shipmentId, itemFulfillmentId, fulfillmentRecord) {
            try {
                var orderItemIdsMap = fulfillmentRecord.orderItemIdsMap;
                var rec = nlapiLoadRecord('itemfulfillment', itemFulfillmentId);
                var totalLines = rec.getLineItemCount('item');
                var line, itemId, orderItemId;
                for (line = 1; line <= totalLines; line++) {
                    itemId = rec.getLineItemValue('item', "item", line);
                    orderItemId = orderItemIdsMap[itemId];
                    rec.setLineItemValue("item", ConnectorConstants.Transaction.Columns.MagentoOrderId, line, orderItemId);
                }
                rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoSync, "T");
                rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoShipmentId, shipmentId + "");
                rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoId, fulfillmentRecord.orderIncrementId + "");
                nlapiSubmitRecord(rec);
            } catch (e) {
                Utility.logException('FulfillmentExportHelper.setMagentoShipmentId', e);
            }
        }
    };
})();


/**
 * ExportFulfillments class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var ExportFulfillments = (function () {
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
         * @param fulfillmentObject
         * @param store
         * @returns {{orderRecord: *, requsetXML: *, responseMagento: *, magentoIdObjArrStr: *, nsCustomerUpdateStatus: *, customerAddresses: *, allAddressedSynched: *, adr: number, logRec: nlobjRecord}}
         */
        processFulfillment: function (fulfillmentObject, store) {
            var fulfillmentRecord = FulfillmentExportHelper.getFulfillment(fulfillmentObject.internalId, store);
            this.sendRequestToMagento(fulfillmentObject.internalId, fulfillmentRecord);
        },
        sendFulfillmentToSync: function (internalId, fulfillmentRecord) {
            var requestXml = XmlUtility.getSalesOrderShipmentCreateXml(ConnectorConstants.CurrentStore.sessionID, fulfillmentRecord);
            ConnectorCommon.createLogRec(internalId, requestXml);
            var xml = XmlUtility.soapRequestToMagento(requestXml);
            return XmlUtility.validateFulfillmentExportResponse(xml);
        },
        addTrackingNumbersInShipment: function (fulfillmentRecord, orderShipmentId) {
            var result = {
                status: false,
                trackingNumbersIds: [],
                errorMessages: []
            };
            var packages = fulfillmentRecord.packages;
            var totalPackages = packages.length;
            var havingErrorInTrackingNumberExport = false;
            var errorTrackingNumber = [];
            var trackingNumbersIds = [];

            if (totalPackages > 0) {
                for (var p in packages) {
                    var f_package = packages[p];
                    var trackingXML = XmlUtility.createTrackingXML(orderShipmentId, f_package.carrier, f_package.carrierText, f_package.trackingNumber, ConnectorConstants.CurrentStore.sessionID);
                    var responseTracking = XmlUtility.validateTrackingCreateResponse(XmlUtility.soapRequestToMagento(trackingXML));
                    if (!responseTracking.status) {
                        havingErrorInTrackingNumberExport = true;
                        errorTrackingNumber.push(responseTracking.faultString + ' - ' + responseTracking.faultCode);
                    } else {
                        Utility.logDebug('CHECK', 'Setting shipment tracking id Got this in response : ' + responseTracking.result);
                        trackingNumbersIds.push(responseTracking.result);
                    }
                }
            } else {
                havingErrorInTrackingNumberExport = false;
            }

            result.status = !havingErrorInTrackingNumberExport;
            result.trackingNumbersIds = trackingNumbersIds;
            result.errorMessages = errorTrackingNumber;

            return result;
        },

        /**
         * Send request to megento store
         * @param internalId
         * @param fulfillmentRecord
         * @returns {null}
         */
        sendRequestToMagento: function (internalId, fulfillmentRecord) {
            var responseMagento;

            if (!fulfillmentRecord) {
                return null;
            }
            Utility.logDebug('debug', 'Step-5');
            responseMagento = this.sendFulfillmentToSync(internalId, fulfillmentRecord);
            Utility.logDebug('debug', 'Step-5c');

            if (responseMagento.status) {
                Utility.logDebug('debug', 'Step-6');
                var orderShipmentId = responseMagento.result;

                FulfillmentExportHelper.setMagentoShipmentId(orderShipmentId, internalId, fulfillmentRecord);

                Utility.logDebug('set magento shipment id', 'Im Setting ID ' + orderShipmentId);
                var addTrackingNumbersInShipmentResponse = this.addTrackingNumbersInShipment(fulfillmentRecord, orderShipmentId);

                if (!addTrackingNumbersInShipmentResponse.status) {
                    Utility.logException("Add Tracking Numbers", addTrackingNumbersInShipmentResponse.errorMessages);
                    Utility.logException("An error occurred while exporting fulfillment tracking numbers", addTrackingNumbersInShipmentResponse.errorMessages.join(","));
                    /* ErrorLogNotification.logAndNotify({
                     externalSystem: ConnectorConstants.CurrentStore.systemId,
                     recordType: F3Message.RecordType.ITEM_FULFILLMENT,
                     recordId: nlapiGetRecordId(),
                     action: F3Message.Action.ITEM_FULFILLMENT_TRACKING_NUMBER_EXPORT,
                     message: "An error has occurred while exporting tracking numbers of item fulfillment to Magento",
                     messageDetails: addTrackingNumbersInShipmentResponse.errorMessages,
                     status: F3Message.Status.ERROR,
                     externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName
                     });*/
                }
            } else {
                // unable to create shipment
                Utility.logException("An error has occurred while exporting item fulfillment to Magento", responseMagento.faultCode + '--' + responseMagento.faultString);
                /*ErrorLogNotification.logAndNotify({
                 externalSystem: ConnectorConstants.CurrentStore.systemId,
                 recordType: F3Message.RecordType.ITEM_FULFILLMENT,
                 recordId: nlapiGetRecordId(),
                 action: F3Message.Action.ITEM_FULFILLMENT_EXPORT,
                 message: "An error has occurred while exporting item fulfillment to Magento",
                 messageDetails: responseMagento.faultCode + '--' + responseMagento.faultString,
                 status: F3Message.Status.ERROR,
                 externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName
                 });*/
            }
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
                var fulfillmentIds, externalSystemArr;

                context.setPercentComplete(0.00);
                Utility.logDebug('Starting', '');

                externalSystemArr = this.extractExternalSystems(externalSystemConfig);

                if (externalSystemArr.length <= 0) {
                    Utility.logDebug('Fulfillment Export Script', 'Store(s) is/are not active');
                    return null;
                }

                try {

                    for (var i in externalSystemArr) {

                        var store = externalSystemArr[i];

                        ConnectorConstants.CurrentStore = store;
                        // initialize configuration for logging in custom record and sending error emails
                        ConnectorCommon.initiateEmailNotificationConfig();
                        Utility.logDebug('debug', 'Step-2');
                        fulfillmentIds = FulfillmentExportHelper.getFulfillments(false, store.systemId);

                        Utility.logDebug('fetched fulfillment count', fulfillmentIds.length);
                        Utility.logDebug('debug', 'Step-3');

                        if (fulfillmentIds.length > 0) {
                            for (var c = 0; c < fulfillmentIds.length; c++) {

                                var fulfillmentObject = fulfillmentIds[c];

                                try {
                                    this.processFulfillment(fulfillmentObject, store);
                                    context.setPercentComplete(Math.round(((100 * c) / fulfillmentIds.length) * 100) / 100);  // calculate the results
                                    // displays the percentage complete in the %Complete column on the Scheduled Script Status page
                                    context.getPercentComplete();  // displays percentage complete
                                } catch (e) {
                                    ExportFulfillments.markRecords(fulfillmentObject.internalId, e.toString());
                                    /* ErrorLogNotification.logAndNotify({
                                     externalSystem: ConnectorConstants.CurrentStore.systemId,
                                     recordType: F3Message.RecordType.ITEM_FULFILLMENT,
                                     recordId: fulfillmentObject.internalId,
                                     action: F3Message.Action.SALES_ORDER_EXPORT,
                                     message: "An error occurred while exporting fulfillment.",
                                     messageDetails: e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString(),
                                     status: F3Message.Status.ERROR,
                                     externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName
                                     });*/
                                    Utility.logException("An error occurred while exporting fulfillment", e);
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
                    Utility.logException('ExportFulfillments.scheduled - Iterating Orders', e);
                }
                Utility.logDebug(' Ends', '');

            } catch (e) {
                Utility.logException('ExportFulfillments.scheduled', e);
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
                Utility.logException('ExportFulfillments.rescheduleIfNeeded', e);
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
                    Utility.logException('ExportFulfillments.processRecords', e);
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
                Utility.logException('ExportFulfillments.markRecords', e);
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
            Utility.logDebug('ExportFulfillments.rescheduleScript', 'Status: ' + status + ' Params: ' + JSON.stringify(params));
        }
    };
})();

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function ExportFulfillmentsScheduled(type) {
    return ExportFulfillments.scheduled(type);
}