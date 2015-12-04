/**
 * Created by wahajahmed on 11/27/2015.
 * TODO:
 * -
 * Referenced By:
 * -
 * -
 * Dependencies:
 * -
 * -
 */

/**
 * ItemExportManager class that has the actual functionality of Item Export.
 * All business logic will be encapsulated in this class.
 */
var ItemExportManager = (function () {
    return {

        startTime: null,
        minutesAfterReschedule: 15,

        ScriptParams: {
            IdentifierType: 'custscript_f3_identifier_type',
            IdentifierValue: 'custscript_f3_identifier_value'
        },

        /**
         * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
         * @returns {Void}
         */
        scheduled: function (type) {
            try {
                Utility.logDebug('Starting', 'Starting...');
                this.startTime = (new Date()).getTime();

                var ctx = nlapiGetContext();
                if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                    Utility.logDebug('LICENSE', 'Your license has been expired.');
                    return null;
                }

                var identifierType = ctx.getSetting('SCRIPT', this.ScriptParams.IdentifierType);
                var identifierValue = ctx.getSetting('SCRIPT', this.ScriptParams.IdentifierType);
                //nlapiLogExecution('DEBUG', 'lastId: ' + lastId, '');

                //initialize constants
                ConnectorConstants.initialize();

                // getting configuration
                var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;

                var externalSystemArr = this.extractExternalSystems(externalSystemConfig);

                if (externalSystemArr.length <= 0) {
                    Utility.logDebug('Customer Export Script', 'Store(s) is/are not active');
                    return null;
                }

                try {
                    for (var i in externalSystemArr) {
                        var store = externalSystemArr[i];
                        ConnectorConstants.CurrentStore = store;

                        // Check for feature availability
                        if (!FeatureVerification.isPermitted(Features.EXPORT_ITEM_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                            Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_ITEM_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                            continue;
                        }

                        ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                        ConnectorConstants.CurrentWrapper.initialize(store);

                        Utility.logDebug('debug', 'Step-2');
                        var criteriaObj = {};
                        criteriaObj.identifierType = identifierType;
                        criteriaObj.identifierValue = identifierValue;
                        var records = this.getRecords(store, criteriaObj);
                        Utility.logDebug('fetched items count', !!records ? records.length : '0');

                        if (!!records && records.length > 0) {
                            Utility.logDebug('debug', 'Step-3');
                            this.processRecords(store, records);
                        } else {
                            nlapiLogExecution('DEBUG', ' No records found to process', '');
                        }

                        if (this.rescheduleIfNeeded(ctx, null)) {
                            return null;
                        }
                    }
                }
                catch(e) {
                    Utility.logException('ItemExportManager.scheduled - Iterating Items', e);
                }
                Utility.logDebug('Ends', 'Ends...');
            }
            catch (e) {
                Utility.logException('ItemExportManager.scheduled', e);
            }
        },

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
        getRecords: function (store, criteriaObj) {
            var records = ItemExportLibrary.getItems(store, criteriaObj);

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

                if (usageRemaining < 4500) {
                    this.rescheduleScript(context, params);
                    return true;
                }

                var endTime = (new Date()).getTime();

                var minutes = Math.round(((endTime - this.startTime) / (1000 * 60)) * 100) / 100;
                nlapiLogExecution('DEBUG', 'Time', 'Minutes: ' + minutes + ' , endTime = ' + endTime + ' , startTime = ' + this.startTime);
                // if script run time greater than 50 mins then reschedule the script to prevent time limit exceed error

                if (minutes > this.minutesAfterReschedule) {
                    this.rescheduleScript(context, params);
                    return true;
                }

            }
            catch (e) {
                nlapiLogExecution('ERROR', 'Error during schedule: ', +JSON.stringify(e) + ' , usageRemaining = ' + usageRemaining);
            }
            return false;
        },

        /**
         * sends records to Salesforce using its API
         */
        processRecords: function (store, records) {
            var context = nlapiGetContext();
            Utility.logDebug('inside processRecords', 'processRecords');

           if(!!records && records.length) {
               var itemInternalId = '';
               var itemRecordType = '';
               for (var i = 0; i < records.length; i++) {
                   try {
                       var itemInternalId = records[i].getId();
                       var itemRecordType = records[i].getRecordType();
                       Utility.logDebug('itemInternalId  #  itemRecordType', itemInternalId  +'  #  '+  itemRecordType);
                       ItemExportLibrary.processItem(store, itemInternalId, itemRecordType);

                       if (this.rescheduleIfNeeded(context, null)) {
                           return;
                       }
                   } catch (e) {
                       Utility.logException('Error during processRecords', e);
                       ItemExportLibrary.markStatus(itemRecordType, itemInternalId, e.toString());
                   }
               }
           }
        },

        /**
         * Marks record as completed
         */
        markRecords: function () {

            try {
                //TODO: Write your own logic here
            } catch (e) {

            }
        },

        /**
         * Call this method to reschedule current schedule script
         * @param ctx nlobjContext Object
         */
        rescheduleScript: function (ctx, params) {
            var status = nlapiScheduleScript(ctx.getScriptId(), ctx.getDeploymentId(), params);
        }
    };
})();

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function ItemExportManagerScheduled(type) {
    return ItemExportManager.scheduled(type);
}