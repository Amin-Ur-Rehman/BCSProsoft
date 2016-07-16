/**
 * Created by nzahid on 30 June 2016.
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
 * Image_Sync_Module class that has the actual functionality of Scheduled Script.
 * All business logic will be encapsulated in this class.
 */
var Image_Sync_Module = (function () {

    return {

        startTime: null
        , minutesAfterReschedule: 50,

        ScriptParams: {
            IdentifierType: 'custscript_f3_identifier_type'
            , IdentifierValue: 'custscript_f3_identifier_value'
            , StoreId: 'custscript_f3_storeid'
        },

        /**
         * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
         * @returns {Void}
         */
        scheduled: function (type) {
            try {
                nlapiLogExecution("DEBUG", "Scheduled Script Started", " ");
                this.startTime = (new Date()).getTime();

                var ctx = nlapiGetContext();
                if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                    nlapiLogExecution("DEBUG", 'LICENSE', 'Your license has been expired.');
                    return null;
                }

                var identifierType = ctx.getSetting('SCRIPT', "custscript_identifiertype");
                var identifierValue = ctx.getSetting('SCRIPT', "custscript_identifiervalue");
                var selectedStoreId = ctx.getSetting('SCRIPT', "custscript_selectedstoreid");
                var savedSearchId = ctx.getSetting('SCRIPT', "custscript_savedsearchid");
                var customImageFields = ctx.getSetting('SCRIPT', "custscript_cust_img_fields");

                if (!!!savedSearchId) {
                    nlapiLogExecution("DEBUG", "Error: ", "No Saved Search ID was specified");
                    return;
                }
                var startIndex = 0;
                var limit = 1000;
                var customImageFieldsLists = [];
                //var savedSearchId = "121";

                if (!!customImageFields) {
                    customImageFieldsLists = customImageFields.split(',');
                }

                customImageFieldsLists.push("storedisplayimage");
                nlapiLogExecution("DEBUG", "Image Fields List Length: ", customImageFieldsLists.length);
                nlapiLogExecution("DEBUG", "Saved Search ID: ", savedSearchId);

                var search = nlapiLoadSearch(null, savedSearchId).runSearch();
                var results = search.getResults(startIndex, limit);

                if (!!results && results.length < 0) {
                    nlapiLogExecution('DEBUG', ' No records found to process', '');
                    return;
                }

                //initialize constants
                ConnectorConstants.initialize();
                ConnectorConstants.loadItemConfigRecords();

                // getting configuration
                var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
                var externalSystemArr = this.extractExternalSystems(externalSystemConfig);

                if (externalSystemArr.length <= 0) {
                    nlapiLogExecution("DEBUG", 'Image Sync Script', 'Store(s) is/are not active');
                    return null;
                }

                try {
                    for (var i in externalSystemArr) {
                        var store = externalSystemArr[i];
                        ConnectorConstants.CurrentStore = store;

                         // Check for feature availability
                         if (!FeatureVerification.isPermitted(Features.EXPORT_ITEM_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                         nlapiLogExecution("DEBUG",';FEATURE PERMISSION', Features.EXPORT_ITEM_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                         continue;
                         }

                        ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                        ConnectorConstants.CurrentWrapper.initialize(store);

                        var criteriaObj = {};
                        criteriaObj.identifierType = identifierType;
                        criteriaObj.identifierValue = identifierValue;
                        criteriaObj.selectedStoreId = selectedStoreId;

                        //var records = this.getRecords(store, criteriaObj);

                        if (!!results && results.length > 0) {
                            this.processRecords(store, results, customImageFieldsLists);
                        } else {
                            return;
                        }

                        if (this.rescheduleIfNeeded(ctx, results, null)) {
                            return null;
                        }
                    }
                } catch (e) {
                    nlapiLogExecution("DEBUG", 'ImageSync.scheduled - Iterating Items', e);
                }
                nlapiLogExecution("DEBUG", 'Ends', 'Ends...');
            } catch (e) {
                nlapiLogExecution("DEBUG", 'ImageSync.scheduled', e);
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
                    nlapiLogExecution("DEBUG", 'sessionID', 'sessionID is empty');
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
        rescheduleIfNeeded: function (context, results, params) {
            try {
                var usageRemaining = context.getRemainingUsage();

                if (usageRemaining < 1000 || results == 1000) {
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

            } catch (e) {
                nlapiLogExecution('ERROR', 'Error during schedule: ', +JSON.stringify(e) + ' , usageRemaining = ' + usageRemaining);
            }
            return false;
        },

        /**
         * sends records to Salesforce using its API
         */
        processRecords: function (store, records, customImageFieldsLists) {
            try {
                //var context = nlapiGetContext();
                var ctx = nlapiGetContext();
                nlapiLogExecution("DEBUG", "Processing Records", "Processing " + records.length + " records");
                var response;
                for (var i = 0; i < records.length; i++) {
                    var obj = {};
                    obj.itemType = records[i].getText("type");
                    obj.itemInternalId = records[i].getValue("internalid");
                    obj.magento = records[i].getValue("custitem_magentoid");
                    obj.magento = JSON.parse(obj.magento);
                    obj.magentoProductId = obj.magento[0].MagentoId;

                    if (!this.deleteImages(store, obj.itemInternalId, obj.itemType, null, null, obj.magentoProductId))
                        return;

                    if (this.rescheduleIfNeeded(ctx, records, null)) {
                        return null;
                    }

                    nlapiLogExecution("DEBUG", "Adding New Image(s)", " ");
                    for (var j = 0; j < customImageFieldsLists.length; j++) {
                        var path = records[i].getValue(customImageFieldsLists[j]);
                        if (!!path) {
                            var file = nlapiLoadFile(path);
                            var itemObject = {
                                image: {
                                    mime: 'image/jpeg',
                                    fullName: file.getName(),
                                    content: file.getValue(),
                                    position: 0
                                }
                            };

                            //store, itemInternalId, itemType, itemObject, createOnly, magentoProductId
                            response = MagentoXmlWrapper.exportProductImage(store, obj.itemInternalId, obj.itemType, itemObject, null, obj.magentoProductId);
                        }
                    }
                    if (!response.error) {
                        nlapiLogExecution("DEBUG", "Marking Record", "Marking Record");
                        this.markRecords(obj.itemType, obj.itemInternalId);
                    }
                    else {
                        nlapiLogExecution("DEBUG", "Error in Processing Records", "Record #" + i + " was not processed");
                    }
                    if (this.rescheduleIfNeeded(ctx, records, null)) {
                        return null;
                    }
                }
                nlapiLogExecution("DEBUG", "All Ok!", "All records have been processed successfully");
                return;

            } catch (err) {
                nlapiLogExecution("DEBUG", "Error in Processing Records", err);
            }
        },

        deleteImages: function (store, itemInternalId, itemType, itemObject, creatOnly, magentoProductId) {
            try {
                var imageList = MagentoXmlWrapper.getMagentoProductImagesList(store, itemInternalId, itemType, null, null, magentoProductId);
                if (imageList.length > 0) {
                    nlapiLogExecution("DEBUG", "Deleting Old Image(s)", " ");
                    for (var j = 0; j < imageList.length; j++) {
                        MagentoXmlWrapper.removeImageFromMagento(store, magentoProductId, imageList[j]);
                    }
                }
                return true;
            } catch (err) {
                nlapiLogExecution("DEBUG", "Error in Deleting Images", err);
                return false;
            }
        },

        /**
         * Marks record as completed
         */
        markRecords: function (itemType, itemId) {
            try {
                if (itemType.indexOf("non") < 0) {
                    nlapiSubmitField("inventoryitem", itemId, "custitem_f3_image_sync", "F", null);
                    nlapiLogExecution("DEBUG", "Record Marked", "Record Marked");
                    return;
                }
            } catch (err) {
                nlapiLogExecution("DEBUG", "Error in Marking Records", err);
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
function Image_Sync_ModuleScheduled(type) {
    return Image_Sync_Module.scheduled(type);
}
