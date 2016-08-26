/**
 * Created by {Anas} on {12/08/2016}.
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
 * <Project_Name> class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */

var nsRequestMethod = {
    nsURL: 'http://192.3.20.181/f3_request_handler.php',
    nsMethodCreate: 'createBulkImageDir'
};
var Image360Field = {
    RecordType: 'type',
    ImageField: 'custitem_360_images',
    ImageSync: 'custitem_image_360',
    IsInactive: 'isinactive',
    SpecificStore: 'custscript_360_image_exp_storeid'
}
var Image360Sync = (function () {
    return {
        InternalId: 'customrecord_image_sync_order_tracking',
        FieldName: {
            OrderIncrementIds: 'custrecord_isot_increment_ids',// last run date time
            StoreId: 'custrecord_isot_storeid',
            IteratedOrderIds: 'custrecord_isot_iterated_ids',
            FailedOrderIds: 'custrecord_isot_failed_id'
        },
        startTime: null
        , minutesAfterReschedule: 50,
        /**
         * Extracts external System Information from the database
         * @param externalSystemConfig
         */
        extractExternalSystems: function (externalSystemConfig) {
            var externalSystemArr = [];

            externalSystemConfig.forEach(function (store) {
                ConnectorConstants.CurrentStore = store;
                // initialize configuration for logging in custom record and sending error emails
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
         * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
         * @returns {Void}
         */
        scheduled: function (type) {
            this.startTime = (new Date()).getTime();
            if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                Utility.logDebug('LICENSE', 'Your license has been expired.');
                return null;
            }

            // initialize constants
            ConnectorConstants.initialize();

            // getting configuration
            var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
            var context = nlapiGetContext();
            var orderIds, externalSystemArr, iteratedOrderIds, failedOrderIds, internalId;
            var lastOrderId = context.getSetting('SCRIPT', 'custscript_parm_iternal_id');
            var isCustomRecord = '';
            var specificStoreId, params = {};
            // this handling is for specific store sync handling
            specificStoreId = context.getSetting('SCRIPT', Image360Field.SpecificStore);
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
                        params[Image360Field.SpecificStore] = specificStoreId;
                        if (store.systemId != specificStoreId) {
                            continue;
                        }
                    }
                    isCustomRecord = this.checkIfCustomRecord(context.getDeploymentId());
                    if (isCustomRecord) {
                        var orderSearchObject = this.getCustomOrderList(store.systemId);
                        Utility.logDebug("orderSearchObject", JSON.stringify(orderSearchObject));
                        for (var j = 0; j < orderSearchObject.length; j++) {
                            orderIds = orderSearchObject[j].orderIncrementIds;
                            iteratedOrderIds = orderSearchObject[j].iteratedOrderIds;
                            failedOrderIds = orderSearchObject[j].failedOrderIds;
                            internalId = orderSearchObject[j].internalId;
                            Utility.logDebug('debug', JSON.stringify(orderSearchObject[j].orderIncrementIds));
                            orderIds = JSON.parse(orderIds);
                            this.iterateImageIds(context, orderIds, isCustomRecord, failedOrderIds, iteratedOrderIds, internalId);

                        }
                    }
                    else {
                        orderIds = this.getOrderList(false, store.systemId, lastOrderId);
                        this.iterateImageIds(context, orderIds, isCustomRecord);
                    }
                    ;
                    Utility.logDebug('debug', 'END');

                }
            }
            catch (e) {
                Utility.logDebug("Error", "Error");
            }
        },

        iterateImageIds: function (context, orderIds, isCustomRecord, failedOrderIds, iteratedOrderIds, internalId) {
            Utility.logDebug('debug', 'Step-3');
            Utility.logDebug('length', orderIds.length);
            if (orderIds.length > 0) {

                for (var c = 0; c < orderIds.length; c++) {
                    var orderObject = orderIds[c];
                    Utility.logDebug('debug', orderIds[c]);
                    if (isCustomRecord) {
                        orderObject = orderIds[c];
                    }
                    try {
                        var rec = nlapiLoadRecord(orderObject.recordType, orderObject.id);
                        var arrImageList = this.processImageRecord(rec);
                        for (var imgList = 0; imgList < arrImageList.length; imgList++) {
                            var image = this.getImageForProcess(arrImageList[imgList]);
                            var imageUrl = "http://yowzafitness.bloopdesigns.com/media/magictoolbox/magic360/" + image.charAt(0).toLowerCase() + "/" + image.charAt(1).toLowerCase() + "/" + image.toLowerCase();
                            Utility.logDebug("360Sync: ImageURL", imageUrl);
                            // var response= this.toDataUrl(imageUrl);
                            var response = nlapiRequestURL(imageUrl);
                            var sku = rec.getFieldValue('itemid');
                            Utility.logDebug("sku", sku);
                            Utility.logDebug("base64", response, image);
                            var res = this.imageRequestToMagento(response, sku, image)
                        }
                        if (res)
                            var removeRes = this.moveImagetoMagicDirectory(sku)
                    }
                    catch (e) {
                        Utility.logDebug("Error in process Image");
                        if (isCustomRecord) {
                            Utility.logDebug("failedOrderIds", orderObject.id);
                            failedOrderIds.push(orderObject.id);
                        }
                    }
                    if (res) {
                        Utility.logDebug("isCustomRecord", isCustomRecord);
                        if (isCustomRecord) {
                            Utility.logDebug("iteratedOrderIds", orderObject.id);
                            iteratedOrderIds.push(orderObject.id);
                        }
                        rec.setFieldValue(Image360Field.ImageSync, 'F');
                        nlapiSubmitRecord(rec);
                    }
                    var params = [];
                    params['custscript_parm_iternal_id'] = orderObject.id;
                    if (res) {
                        if (isCustomRecord) {
                            Utility.logDebug("res1", res);
                            this.updateOrderInfo('', iteratedOrderIds, failedOrderIds, internalId);
                        }
                        if (this.rescheduleIfNeeded(context, params)) {
                            return null;
                        }
                    }
                    else {
                        if (isCustomRecord) {
                            Utility.logDebug("failedOrderIds1", orderObject.id);
                            failedOrderIds.push(orderObject.id);
                            this.updateOrderInfo('', iteratedOrderIds, failedOrderIds, internalId);
                        }
                        continue;
                    }
                }
            }
        },
        moveImagetoMagicDirectory: function (sku) {

            var itemObject1 = {
                "content": 'iergh234CDdsfssssfds110dfd'
            };
            var requestParam1 = {
                "apiMethod": 'moveImages',
                "data": JSON.stringify(itemObject1)
            };
            var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam1, null, 'POST');

            var removeDirObject = {
                "sku": sku
            };
            var requestParam2 = {
                "apiMethod": 'removeDirectory',
                "data": JSON.stringify(removeDirObject)
            };
            var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam2, null, 'POST');
            Utility.logDebug("REMOVED IMAGE", "removed Image");
        },

        imageRequestToMagento: function (res, sku, image) {
            try {
                var response = res;
                if (response.body != null || response.body != '') {
                    var itemObject = {
                        "mime": response.contentType,
                        "fullName": image.toLowerCase(),
                        "content": response.body,
                        "sku": sku
                    };
                    Utility.logDebug("response.contentType", response.contentType);
                    if (response.contentType == "image/jpeg") {
                        var requestParam = {
                            "apiMethod": nsRequestMethod.nsMethodCreate,
                            "data": JSON.stringify(itemObject)
                        };
                        Utility.logDebug('Data1', JSON.stringify(requestParam));
                        var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam, null, 'POST');
                        return true;
                    }
                    else {
                        Utility.logDebug('Data1', JSON.stringify(requestParam));
                        return false;
                    }
                }
                return false;
            }
            catch (e) {
                Utility.logDebug("Error", "Error at sending Image");
                return false;
            }
        },


        getImageForProcess: function (imageValue) {
            var index = imageValue.lastIndexOf('/');
            var image = imageValue.slice(index + 1, imageValue.length)
            return image;
        },
        processImageRecord: function (rec) {
            var array = [];
            var imageField = rec.getFieldValue(Image360Field.ImageField);
            var imageFieldXml = nlapiStringToXML(imageField);
            var imageFieldNode = nlapiSelectNode(imageFieldXml, '/a');
            var imageFieldValue = imageFieldNode.getAttribute('rel');
            array = imageFieldValue.split('*');
            return array;
        },

        toDataUrl: function (url) {
            var xhr = nlapiRequestURL(url);
            var body = xhr.getBody();
            var base64 = btoa(body);
            return base64;
        },

        checkIfCustomRecord: function (deploymentId) {
            nlapiLogExecution("DEBUG", "deploymentId", deploymentId + "###" + deploymentId.toString());
            if (deploymentId.toString() === 'customdeploy_image_360_sync_ns_dep') {
                return true;
            }
            else {
                return false;
            }
        },
        getOrderList: function (allStores, storeId, lastOrderId) {
            var result = this.getOrdersByStore(allStores, storeId, lastOrderId);
            return result;
        },
        getOrdersByStore: function (allStores, storeId, lastOrderId) {
            var fils = [];
            var searchResults = null;
            var results = [];
            var arrCols = [];
            fils.push(new nlobjSearchFilter(Image360Field.RecordType, null, "anyof", ['InvtPart', 'NonInvtPart', 'Kit', 'Assembly']));
            fils.push(new nlobjSearchFilter(Image360Field.ImageSync, null, "is", 'T', null));
            fils.push(new nlobjSearchFilter(Image360Field.IsInactive, null, "is", 'F', null));
            fils.push(new nlobjSearchFilter(Image360Field.ImageField, null, 'isnotempty', '', null));
            fils.push(new nlobjSearchFilter("internalidnumber", null, "greaterthan", (lastOrderId == null) ? 0 : lastOrderId));
            // fils.push(new nlobjSearchFilter('internalid',null,'is','4043',null));
            arrCols.push((new nlobjSearchColumn('internalid', null, null)).setSort(true));

            // if (!!allstores) {
            //     fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'is', storeId, null));
            // }
            // else {
            //     fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'noneof', '@NONE@', null));
            // }
            results = nlapiSearchRecord('item', null, fils, arrCols);
            return results;
        },
        getCustomOrderList: function (store) {
            var filters = [];
            var records;
            var result = [];
            var arrCols = [];

            filters.push(new nlobjSearchFilter(this.FieldName.OrderIncrementIds, null, 'isnotempty', null, null));

            arrCols.push((new nlobjSearchColumn('created', null, null)).setSort(false));
            arrCols.push(new nlobjSearchColumn(this.FieldName.OrderIncrementIds, null, null));
            arrCols.push(new nlobjSearchColumn(this.FieldName.IteratedOrderIds, null, null));
            arrCols.push(new nlobjSearchColumn(this.FieldName.FailedOrderIds, null, null));

            records = nlapiSearchRecord(this.InternalId, null, filters, arrCols);
            nlapiLogExecution("DEBUG", "records", JSON.stringify(records));
            if (!!records && records.length > 0) {
                result = this.getOrderInfoObjects(records);
            }
            nlapiLogExecution("DEBUG", "records", JSON.stringify(result));
            return result;
        },

        ////

        getOrderInfoObjects: function (records) {
            var result = [];
            for (var i = 0; i < records.length; i++) {
                var resultObject = {};
                // get empty array if value doesn't exist
                var orderIncrementIds = records[i].getValue(this.FieldName.OrderIncrementIds, null, null) || [];
                var iteratedOrderIds = records[i].getValue(this.FieldName.IteratedOrderIds, null, null) || [];
                var failedOrderIds = records[i].getValue(this.FieldName.FailedOrderIds, null, null) || [];

                // if value exists the then split it by comma
                if (!Utility.isBlankOrNull(orderIncrementIds)) {
                    orderIncrementIds = orderIncrementIds.split(',');
                }
                if (!Utility.isBlankOrNull(iteratedOrderIds)) {
                    iteratedOrderIds = iteratedOrderIds.split(',');
                }
                if (!Utility.isBlankOrNull(failedOrderIds)) {
                    failedOrderIds = failedOrderIds.split(',');
                }
                resultObject.internalId = records[i].getId();
                resultObject.orderIncrementIds = orderIncrementIds
                resultObject.iteratedOrderIds = iteratedOrderIds;
                resultObject.failedOrderIds = failedOrderIds;

                result.push(resultObject);
            }
            return result;
        },

        updateOrderInfo: function (orderIncrementIds, iteratedOrderIds, failedOrderIds, internalId) {
            Utility.logDebug("updateOrderInfo", "orderIncrementIds" + JSON.stringify(orderIncrementIds) + "iteratedOrderIds" + iteratedOrderIds + "failedOrderIds" + JSON.stringify(failedOrderIds) + "internalId" + internalId);
            var data = {};
            data[this.FieldName.OrderIncrementIds] = [''];
            data[this.FieldName.IteratedOrderIds] = iteratedOrderIds.join(',');
            data[this.FieldName.FailedOrderIds] = failedOrderIds.join(',');
            this.upsert(data, internalId);
        },


        upsert: function (data, id) {
            try {
                Utility.logDebug("Data", data.toSource() + "@@@" + this.InternalId);
                var rec = !!id ? nlapiLoadRecord(this.InternalId, id, null) : nlapiCreateRecord(this.InternalId, null);
                for (var field in data) {
                    rec.setFieldValue(field, data[field]);
                }
                id = nlapiSubmitRecord(rec, true, true);
            } catch (e) {
                Utility.logException('MagentoOrderTracking.upsert', e);
            }
            return id;
        },
        //
        /**
         * Reschedules only there is any need
         * @param context Context Object
         * @returns {boolean} true if rescheduling was necessary and done, false otherwise
         */
        rescheduleIfNeeded: function (context, params) {
            try {
                var usageRemaining = context.getRemainingUsage();

                if (usageRemaining < 1000) {
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
function Image360SyncScheduled(type) {
    return Image360Sync.scheduled(type);
}