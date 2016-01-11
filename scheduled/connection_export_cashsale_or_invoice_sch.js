/**
 * Created by Zeeshan Ahmed on 12/14/2015.
 * Description:
 * - This script is responsible for exporting invoices or cash sales from NetSuite to Magento
 * -
 * Referenced By:
 * -
 * Dependencies:
 * -
 * -
 */

/**
 * ExportCOI class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var ExportCOI = (function () {
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
         * @param coiObject
         * @param store
         * @returns {{orderRecord: *, requsetXML: *, responseMagento: *, magentoIdObjArrStr: *, nsCustomerUpdateStatus: *, customerAddresses: *, allAddressedSynched: *, adr: number, logRec: nlobjRecord}}
         */
        processCOI: function (coiObject, store) {
            var coiRecord = COIExportHelper.getCOI(coiObject, store);
            this.sendRequestToMagento(coiRecord);
        },
        sendCOIToSync: function (coiRecord) {
            var magentoInvoiceCreationUrl = '';
            var entitySyncInfo = ConnectorConstants.CurrentStore.entitySyncInfo;
            if (!!entitySyncInfo && !!entitySyncInfo.salesorder.magentoSOClosingUrl) {
                magentoInvoiceCreationUrl = entitySyncInfo.salesorder.magentoSOClosingUrl;
            }
            Utility.logDebug('magentoInvoiceCreationUrl_w', magentoInvoiceCreationUrl);

            var onlineCapturingPaymentMethod = COIExportHelper.checkPaymentCapturingMode(coiRecord);

            var dataObj = {};
            dataObj.increment_id = coiRecord.orderIncrementId;
            dataObj.capture_online = onlineCapturingPaymentMethod.toString();

            var requestParam = {
                "data": JSON.stringify(dataObj),
                "method": "createInvoice"
            };
            Utility.logDebug('requestParam', JSON.stringify(requestParam));

            var resp = nlapiRequestURL(magentoInvoiceCreationUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();

            Utility.logDebug('responseBody_w', responseBody);
            responseBody = JSON.parse(responseBody);
            return responseBody;
        },
        /**
         * Send request to Magento store
         * @param coiRecord
         * @returns {null}
         */
        sendRequestToMagento: function (coiRecord) {
            var responseMagento;

            if (!coiRecord) {
                return null;
            }
            Utility.logDebug('debug', 'Step-5');
            responseMagento = this.sendCOIToSync(coiRecord);
            Utility.logDebug('debug', 'Step-5c');

            if (!!responseMagento.status) {
                if (!!responseMagento.increment_id) {
                    COIExportHelper.setMagentoInvoiceId(responseMagento.increment_id, coiRecord);
                } else {
                    Utility.logDebug('Error', 'Magento Invoice Increment Id not found');
                }
                Utility.logDebug('successfully', 'magento invoice created');
            } else {
                Utility.logException('Some error occurred while creating Magento Invoice', responseMagento.error);
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
                var coiIds, externalSystemArr;

                context.setPercentComplete(0.00);
                Utility.logDebug('Starting', '');

                externalSystemArr = this.extractExternalSystems(externalSystemConfig);

                if (externalSystemArr.length <= 0) {
                    Utility.logDebug('Cash Sale or Invoice Export Script', 'Store(s) is/are not active');
                    return null;
                }

                try {

                    for (var i in externalSystemArr) {

                        var store = externalSystemArr[i];

                        ConnectorConstants.CurrentStore = store;
                        // initialize configuration for logging in custom record and sending error emails
                        ConnectorCommon.initiateEmailNotificationConfig();
                        Utility.logDebug('debug', 'Step-2');
                        coiIds = COIExportHelper.getCOIs(false, store.systemId);

                        Utility.logDebug('fetched cash sales or invoice count', coiIds.length);
                        Utility.logDebug('debug', 'Step-3');

                        if (coiIds.length > 0) {
                            for (var c = 0; c < coiIds.length; c++) {

                                var coiObject = coiIds[c];

                                try {
                                    this.processCOI(coiObject, store);
                                    context.setPercentComplete(Math.round(((100 * c) / coiIds.length) * 100) / 100);  // calculate the results
                                    // displays the percentage complete in the %Complete column on the Scheduled Script Status page
                                    context.getPercentComplete();  // displays percentage complete
                                } catch (e) {
                                    Utility.logDebug("An error occurred while exporting invoice or cashs sale.", e);
                                    ExportCOI.markRecords(coiObject.internalId, e.toString());
                                    /*ErrorLogNotification.logAndNotify({
                                        externalSystem: ConnectorConstants.CurrentStore.systemId,
                                        recordType: F3Message.RecordType.ITEM_FULFILLMENT,
                                        recordId: coiObject.internalId,
                                        action: F3Message.Action.SALES_ORDER_EXPORT,
                                        message: "An error occurred while exporting sales order.",
                                        messageDetails: e instanceof nlobjError ? e.getCode() + '\n' + e.getDetails() : e.toString(),
                                        status: F3Message.Status.ERROR,
                                        externalSystemText: ConnectorConstants.CurrentStore.systemDisplayName
                                    });*/
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
                    Utility.logException('ExportCOI.scheduled - Iterating Orders', e);
                }
                Utility.logDebug(' Ends', '');

            } catch (e) {
                Utility.logException('ExportCOI.scheduled', e);
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
                Utility.logException('ExportCOI.rescheduleIfNeeded', e);
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
                    Utility.logException('ExportCOI.processRecords', e);
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
                Utility.logException('ExportCOI.markRecords', e);
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
            Utility.logDebug('ExportCOI.rescheduleScript', 'Status: ' + status + ' Params: ' + JSON.stringify(params));
        }
    };
})();

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function ExportCOIScheduled(type) {
    return ExportCOI.scheduled(type);
}