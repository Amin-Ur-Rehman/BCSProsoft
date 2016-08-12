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
var Image360Field={
    RecordType:'type',
    ImageField:'custitem_360_images',
    ImageSync: 'custitem_image_360',
    IsInactive:'isinactive',
    SpecificStore:'custscript_360_image_exp_storeid'
}
var Image360Sync = (function() {
    return {

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
                    orderIds = this.getOrderList(false, store.systemId);
                    Utility.logDebug('fetched sales order count', orderIds.length);
                    Utility.logDebug('debug', 'Step-3');

                    if (orderIds.length > 0) {
                        for (var c = 0; c < orderIds.length; c++) {
                            var orderObject = orderIds[c];
                            try{
                                var rec= nlapiLoadRecord(orderObject.recordType,orderObject.id);
                                var arrImageList= this.processImageRecord(rec);
                                for(var imgList=0; imgList<=arrImageList.length; imgList++){
                                    var image= this.getImageForProcess(arrImageList[imgList]);
                                    var imageUrl="http://yowzafitness.bloopdesigns.com/media/magictoolbox/magic360/"+image.charAt(0).toLowerCase()+"/"+image.charAt(1).toLowerCase()+"/"+image.toLowerCase();
                                    Utility.logDebug("360Sync: ImageURL",imageUrl);
                                    // var response= this.toDataUrl(imageUrl);
                                    var response= nlapiRequestURL(imageUrl);
                                    Utility.logDebug("base64",response);
                                }
                            }
                            catch(e){
                                Utility.logDebug("Error in process Image");
                            }
                        }
                    }
                }
            }
            catch (e){
                Utility.logDebug("Error","Error");
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
        getOrderList: function (allStores, storeId) {
            var result = this.getOrdersByStore(allStores, storeId);
            return result;
        },
        getOrdersByStore: function (allStores, storeId){
            var fils = [];
            var searchResults = null;
            var results = [];
            var arrCols=[];
            fils.push(new nlobjSearchFilter(Image360Field.RecordType, null, "anyof", ['InvtPart','NonInvtPart','Kit','Assembly']));
            fils.push(new nlobjSearchFilter(Image360Field.ImageSync, null, "is",'F', null));
            fils.push(new nlobjSearchFilter(Image360Field.IsInactive, null, "is",'F', null));
            fils.push(new nlobjSearchFilter(Image360Field.ImageField,null,'isnotempty','',null));
            fils.push(new nlobjSearchFilter('internalid',null,'is','4043',null));
            // if (!!allstores) {
            //     fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'is', storeId, null));
            // }
            // else {
            //     fils.push(new nlobjSearchFilter(ImageSync.FieldName.ExternalSystem, null, 'noneof', '@NONE@', null));
            // }
            results= nlapiSearchRecord('item',null,fils,null);
            return results;
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