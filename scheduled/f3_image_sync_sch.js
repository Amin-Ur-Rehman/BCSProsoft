/**
 * Updated By Anas Khurshid
 * Created by nzahid on 30 June 2016.
 * TODO:
 * -
 * Referenced By:
 * -
 * -
 * Dependencies:
 * magento_wrapper.js
 * connector_constants.js
 *
 * -
 * -
 */

/**
 * Image_Sync_Module class that has the actual functionality of Scheduled Script.
 * All business logic will be encapsulated in this class.
 */

ImageSync = {
    FieldName: {
        RecordType: 'type',
        ImageSync: 'custitem_f3_image_sync',
        IsInactive: 'isinactive',
        ExternalSystem: 'custitem_f3mg_magento_stores'
    }
};
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
                var storeId;
                var ctx = nlapiGetContext();
                if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                    nlapiLogExecution("DEBUG", 'LICENSE', 'Your license has been expired.');
                    return null;
                }

                var identifierType = ctx.getSetting('SCRIPT', "custscript_identifiertype");
                var identifierValue = ctx.getSetting('SCRIPT', "custscript_identifiervalue");
                var selectedStoreId = ctx.getSetting('SCRIPT', "custscript_selectedstoreid");
                // var savedSearchId = ctx.getSetting('SCRIPT', "custscript_savedsearchid");
                var customImageFields = ctx.getSetting('SCRIPT', "custscript_cust_img_fields");
                //
                // if (!savedSearchId) {
                //     nlapiLogExecution("DEBUG", "Error: ", "No Saved Search ID was specified");
                //     return;
                // }
                var startIndex = 0;
                var limit = 1000;
                var customImageFieldsLists = [];
                //var savedSearchId = "121";

                if (!!customImageFields) {
                    customImageFieldsLists = customImageFields.split(',');
                }
                customImageFieldsLists.push("storedisplayimage");
                nlapiLogExecution("DEBUG", "Image Fields List Length: ", customImageFieldsLists.length);
                // nlapiLogExecution("DEBUG", "Saved Search ID: ", savedSearchId);
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
                        if (!!selectedStoreId) {
                            if (selectedStoreId !== store.systemId) {
                                continue;
                            }
                        }
                        if (!store) {
                            //Utility.logDebug('store ' + system, 'This store is null');
                            continue;
                        }
                        storeId = store.systemId;
                        // Check for feature availability
                        if (!FeatureVerification.isPermitted(Features.EXPORT_ITEM_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                            nlapiLogExecution("DEBUG", ';FEATURE PERMISSION', Features.EXPORT_ITEM_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                            continue;
                        }

                        ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                        ConnectorConstants.CurrentWrapper.initialize(store);
                        var results = this.getImageToSyncItems(null, storeId);

                        //////
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
         * Process Records: gets the images of items and send it to the Store
         * @param store Store
         * @param records Search Results
         * @param customImageFieldsLists List of Custom Fields to get images from
         */
        processRecords: function (store, records, customImageFieldsLists) {
            try {
                //var context = nlapiGetContext();
                var ctx = nlapiGetContext();
                nlapiLogExecution("DEBUG", "Processing Records", "Processing " + records.length + " records");
                var response;
                for (var i = 0; i < records.length; i++) {
                    var obj = {};
                    obj.itemType = records[i].getRecordType();
                    obj.itemInternalId = records[i].getValue("internalid");
                    obj.magento = records[i].getValue("custitem_magentoid");
                    obj.magento = JSON.parse(obj.magento);
                    obj.magentoProductId = obj.magento[0].MagentoId;
                    var rec = nlapiLoadRecord(obj.itemType, obj.itemInternalId);
                    if (!this.deleteImages(store, obj.itemInternalId, obj.itemType, null, null, obj.magentoProductId))
                        return;
                    nlapiLogExecution("DEBUG", "Adding New Image(s)", JSON.stringify(rec));
                    for (var j = 0; j < customImageFieldsLists.length; j++) {
                        var path = rec.getFieldValue(customImageFieldsLists[j]);
                        nlapiLogExecution("DEBUG", "Adding New Image(s)" + j, customImageFieldsLists[j] + "path" + path);
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
                            response = ConnectorConstants.CurrentWrapper.exportProductImage(store, obj.itemInternalId, obj.itemType, itemObject, null, obj.magentoProductId);
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

        /**
         * Delete Images: Delete the existing images of the items at the store
         * @param store Store
         * @param items related fields such ID, Type, ItemObject(Image object) MagentoProductID,
         * @returns boolean false if there is an error, true otherwise
         */
        deleteImages: function (store, itemInternalId, itemType, itemObject, creatOnly, magentoProductId) {
            try {
                var imageList = ConnectorConstants.CurrentWrapper.getMagentoProductImagesList(store, itemInternalId, itemType, null, null, magentoProductId);
                if (imageList.length > 0) {
                    nlapiLogExecution("DEBUG", "Deleting Old Image(s)", " ");
                    for (var j = 0; j < imageList.length; j++) {
                        ConnectorConstants.CurrentWrapper.removeImageFromMagento(store, magentoProductId, imageList[j]);
                    }
                }
                return true;
            } catch (err) {
                nlapiLogExecution("DEBUG", "Error! Cannot Delete Image(s)", err);
                return false;
            }
        },

        /**
         * MarkRecords: Uncheck the field "ImageSync" when the Item's images has been successfully synced to a store
         * @param itemType
         * @param itemID
         * @returns void
         */
        markRecords: function (itemType, itemId) {
            try {
                nlapiSubmitField(itemType, itemId, "custitem_f3_image_sync", "F", null);
                nlapiLogExecution("DEBUG", "Record Marked", "Record Marked");
                return;
            } catch (err) {
                nlapiLogExecution("DEBUG", "Error! Cannot Mark Record(s)", err);
            }
        },


        getImageToSyncItems: function (allstores, storeId) {
            var fils = [];
            var searchResults = null;
            var results = [];
            var arrCols = [];
            fils.push(new nlobjSearchFilter(ImageSync.FieldName.RecordType, null, "anyof", ['InvtPart', 'NonInvtPart', 'Kit', 'Assembly']));
            fils.push(new nlobjSearchFilter(ImageSync.FieldName.ImageSync, null, "is", 'T', null));
            fils.push(new nlobjSearchFilter(ImageSync.FieldName.IsInactive, null, "is", 'F', null));
            if (!!allstores) {
                fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'is', storeId, null));
            }
            else {
                fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'noneof', '@NONE@', null));
            }
            arrCols.push((new nlobjSearchColumn('internalid', null, null)).setSort(true));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.ItemId, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.Name, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.Type, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.Parent, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.DisplayImage, null, null));
            // arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.CustomImage, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.DispalyThumbnail, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.MagentoId, null, null));
            arrCols.push(new nlobjSearchColumn(ConnectorConstants.ImageSync.Fields.MagentoStore, null, null));
            results = nlapiSearchRecord('item', null, fils, arrCols);
            return results;
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
