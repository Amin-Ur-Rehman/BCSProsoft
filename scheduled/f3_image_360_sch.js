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

var nsRequestMethod= {
    nsURL: 'http://192.3.20.181//f3_request_handler.php',
    nsMethodCreate: 'createBulkImageDir'
};
var Image360Field={
    RecordType:'type',
    ImageField:'custitem_360_images',
    ImageSync: 'custitem_image_360',
    IsInactive:'isinactive',
    SpecificStore:'custscript_360_image_exp_storeid'
}
var Image360Sync = (function() {
    return {
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
            var orderIds, externalSystemArr;
            var lastOrderId = context.getSetting('SCRIPT', 'custscript_parm_iternal_id');

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
                    orderIds = this.getOrderList(false, store.systemId,lastOrderId);
                    Utility.logDebug('fetched sales order count', orderIds.length);
                    Utility.logDebug('debug', 'Step-3');

                    if (orderIds.length > 0) {
                        for (var c = 0; c < orderIds.length; c++) {
                            var orderObject = orderIds[c];
                            try{
                                var rec= nlapiLoadRecord(orderObject.recordType,orderObject.id);
                                var arrImageList= this.processImageRecord(rec);
                                for(var imgList=0; imgList<arrImageList.length; imgList++){
                                    var image= this.getImageForProcess(arrImageList[imgList]);
                                    var imageUrl="http://yowzafitness.bloopdesigns.com/media/magictoolbox/magic360/"+image.charAt(0).toLowerCase()+"/"+image.charAt(1).toLowerCase()+"/"+image.toLowerCase();
                                    Utility.logDebug("360Sync: ImageURL",imageUrl);
                                    // var response= this.toDataUrl(imageUrl);
                                    var response= nlapiRequestURL(imageUrl);
                                    var sku= rec.getFieldValue('itemid');
                                    Utility.logDebug("sku",sku);
                                    Utility.logDebug("base64",response,image);
                                //     if(response.body != null || response.body != '') {
                                //         var itemObject = {
                                //                 "mime": response.contentType,
                                //                 "fullName": image.toLowerCase(),
                                //                 "content": response.body,
                                //                 "sku": sku
                                //         };
                                //
                                //         var requestParam = {
                                //             "apiMethod": nsRequestMethod.nsMethodCreate,
                                //             "data": JSON.stringify(itemObject)
                                //         };
                                //         Utility.logDebug('Data1', JSON.stringify(requestParam));
                                //         var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam, null, 'POST');
                                //
                                //     }
                                // }
                                // var itemObject1 = {
                                //     "content": 'iergh234CDdsfssssfds110dfd'
                                // };
                                // var requestParam1={
                                //     "apiMethod":'moveImages',
                                //     "data": JSON.stringify(itemObject1)
                                //
                                // };
                                // var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam1, null, 'POST');
                                //
                                // var removeDirObject={
                                //     "sku": sku
                                // };
                                // var requestParam2={
                                //     "apiMethod":'removeDirectory',
                                //     "data": JSON.stringify(removeDirObject)
                                //
                                // };
                                // var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam2, null, 'POST');
                                    var res= this.imageRequestToMagento(response,sku,image)

                                }
                            }
                            catch(e){
                                Utility.logDebug("Error in process Image");
                            }
                            if(res){
                                rec.setFieldValue(Image360Field.ImageSync,'T');
                            }
                            var params=[];
                            params['custscript_parm_iternal_id']=orderObject.id;
                            if(res){
                                if (this.rescheduleIfNeeded(context, params)) {
                                    return null;
                                }
                            }
                        }
                    }
                }
            }
            catch (e){
                Utility.logDebug("Error","Error");
            }
        },

        imageRequestToMagento: function(res,sku,image){
            try{
                var response=res;
                if(response.body != null || response.body != '') {
                    var itemObject = {
                        "mime": response.contentType,
                        "fullName": image.toLowerCase(),
                        "content": response.body,
                        "sku": sku
                    };
                    var requestParam = {
                        "apiMethod": nsRequestMethod.nsMethodCreate,
                        "data": JSON.stringify(itemObject)
                    };
                    Utility.logDebug('Data1', JSON.stringify(requestParam));
                    var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam, null, 'POST');
                }
                var itemObject1 = {
                    "content": 'iergh234CDdsfssssfds110dfd'
                };
                var requestParam1={
                    "apiMethod":'moveImages',
                    "data": JSON.stringify(itemObject1)
                };
                var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam1, null, 'POST');

                var removeDirObject={
                    "sku": sku
                };
                var requestParam2={
                    "apiMethod":'removeDirectory',
                    "data": JSON.stringify(removeDirObject)
                };
                var response = nlapiRequestURL(nsRequestMethod.nsURL, requestParam2, null, 'POST');
                return true;

            }
            catch (e){
                Utility.logDebug("Error","Error at sending Image");
                return false;
            }
        },
        getImageForProcess: function(imageValue){
            var index=imageValue.lastIndexOf('/');
            var image=imageValue.slice(index+1,imageValue.length)
            return image;
        },
        processImageRecord: function (rec) {
            var array=[];
            var imageField=rec.getFieldValue(Image360Field.ImageField);
            var imageFieldXml=nlapiStringToXML(imageField);
            var imageFieldNode=nlapiSelectNode(imageFieldXml,'/a');
            var imageFieldValue=imageFieldNode.getAttribute('rel');
            array=imageFieldValue.split('*');
            return array;
        },

        toDataUrl: function(url) {
            var xhr = nlapiRequestURL(url);
            var body= xhr.getBody();
            var base64=btoa(body);
            return base64;
        },
        getOrderList: function (allStores, storeId,lastOrderId) {
            var result = this.getOrdersByStore(allStores, storeId,lastOrderId);
            return result;
        },
        getOrdersByStore: function (allStores, storeId, lastOrderId){
            var fils = [];
            var searchResults = null;
            var results = [];
            var arrCols=[];
            fils.push(new nlobjSearchFilter(Image360Field.RecordType, null, "anyof", ['InvtPart','NonInvtPart','Kit','Assembly']));
            fils.push(new nlobjSearchFilter(Image360Field.ImageSync, null, "is",'T', null));
            fils.push(new nlobjSearchFilter(Image360Field.IsInactive, null, "is",'F', null));
            fils.push(new nlobjSearchFilter(Image360Field.ImageField,null,'isnotempty','',null));
            fils.push(new nlobjSearchFilter("internalidnumber",null,"greaterthan",(lastOrderId == null)? 0 : lastOrderId));
            // fils.push(new nlobjSearchFilter('internalid',null,'is','4043',null));
            arrCols.push((new nlobjSearchColumn('internalid', null, null)).setSort(true));

            // if (!!allstores) {
            //     fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'is', storeId, null));
            // }
            // else {
            //     fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'noneof', '@NONE@', null));
            // }
            results= nlapiSearchRecord('item',null,fils,arrCols);
            return results;
        },
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