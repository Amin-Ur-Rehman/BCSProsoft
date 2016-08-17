/**
 * Created by zahmed on 13-Mar-15.
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
 * InstantSync class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var InstantSync = (function () {
    return {
        InternalId:'customrecord_image_sync_order_tracking',
        FieldName:{
            OrderIncrementsIds:'custrecord_isot_increment_ids',
            storeId: 'custrecord_isot_storeid',
            IteratedOrderIds:'custrecord_isot_iterated_ids'
        },
        // process credit memo
        // funtion name is same as record type
        // creditmemo: function (recordId) {
        //     var responseObj = {
        //         error: ''
        //     };
        //
        //     try {
        //         var creditMemoNsId = recordId;
        //
        //         Utility.logDebug('after  CreditMemoExportHelper.getCreditMemo', '');
        //
        //         // get credit card data
        //         var creditMemo = CreditMemoExportHelper.getCreditMemo(creditMemoNsId);
        //
        //         Utility.logDebug('after calling CreditMemoExportHelper.getCreditMemo', '');
        //
        //         if (creditMemo.items.length === 0) {
        //             Utility.throwException(null, 'No item found to refund');
        //         }
        //
        //         // TODO: get session
        //         var sessionID = ConnectorConstants.CurrentStore.sessionID;
        //
        //         var requestXml = MagentoWrapper.getCreditMemoCreateXml(creditMemo, sessionID);
        //         var responseMagento = MagentoWrapper.validateAndTransformResponse(MagentoWrapper.soapRequestToServer(requestXml), MagentoWrapper.transformCreditMemoCreateResponse);
        //
        //         if (responseMagento.status) {
        //             CreditMemoExportHelper.setCreditMemoMagentoId(responseMagento.result.creditMemoId, creditMemoNsId);
        //         } else {
        //             Utility.logDebug('CreditMemoExportHelper.processCreditMemo', responseMagento.faultString);
        //             //ExportCreditMemos.markRecords(creditMemoNsId, responseMagento.faultString);
        //             responseObj.error += responseMagento.faultString + '\n';
        //         }
        //
        //     } catch (e) {
        //         Utility.logException('InstantSync.creditmemo', e);
        //         responseObj.error += e.toString() + '\n';
        //     }
        //
        //     return responseObj;
        // },

        serializedinventoryitem: function (recordId,recordtype) {
            var responseObj = {
                error: ''
            };
            try {
                this.createRecordEntry(recordId,recordtype);
                Utility.logDebug("recordID", recordId);
            }
            catch (e) {
                Utility.logException('InstantSync.serializeditem', e);
                responseObj.error += e.toString() + '\n';
            }
            return responseObj;
        },
        /**
         * Set cusrrent Store and generate session id using store id
         * @param externalSystemConfig
         * @param storeId
         */
        setCurrentStoreWithSession: function (externalSystemConfig, storeId) {
            for (var index in externalSystemConfig) {
                var store = externalSystemConfig[index];
                if (index.toString() === storeId) {
                    ConnectorConstants.CurrentStore = store;
                    ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                    var sessionID = MagentoWrapper.getSessionIDFromServer(store.userName, store.password);
                    if (!sessionID) {
                        Utility.logDebug('sessionID', 'sessionID is empty');
                        break;
                    }
                    store.sessionID = sessionID;
                    break;
                }
            }
        },

        closeWindow: function (seconds) {

            function closeWin(seconds) {
                setTimeout(function () {
                    window.close();
                }, seconds * 1000);
            }

            var script = '';

            script += '<script>';
            script += closeWin.toString();
            script += "closeWin(" + seconds + ");";
            script += '</script>';

            return script;
        },

        /**
         * Handle get request
         * @param request
         * @param response
         */
        processGetRequest: function (request, response) {
            Utility.logDebug("processGetRequest","processGetRequest");
            var ctx = nlapiGetContext();
            var recordId = request.getParameter('recordid');
            var recordType = request.getParameter('recordtype');
            var storeId = request.getParameter('storeid');
            var url = nlapiResolveURL('SUITELET', ctx.getScriptId(), ctx.getDeploymentId());

            var form = nlapiCreateForm('', true);
            Utility.logDebug("processGetRequest",url+"storeId:"+storeId+"recordType"+recordType+"recordId"+recordId);
            form.addField('custpage_recordid', 'text').setDisplayType('hidden').setDefaultValue(recordId);
            form.addField('custpage_recordtype', 'text').setDisplayType('hidden').setDefaultValue(recordType);
            form.addField('custpage_storeid', 'text').setDisplayType('hidden').setDefaultValue(storeId);
            form.addField('custpage_url', 'text').setDisplayType('hidden').setDefaultValue(url);

            //var htmlField = form.addField('custpage_req', 'inlinehtml');

            //var jsCode = ' <script> jQuery(document).ready(function(){ processRecord(); }); </script>';

            //htmlField.setDefaultValue(jsCode);

            form.setScript('customscript_f3mg_instant_syc_cl');

            response.writePage(form);
        },
        processPostRequest: function (request, response) {

            Utility.logDebug('request.getBody()', request.getBody());

            var postdata = JSON.parse(request.getBody());

            var recordId = postdata.recordId;
            var recordType = postdata.recordType;
            var storeId = postdata.storeId;

            var responseObj = {};

            if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                Utility.logDebug('LICENSE', 'Your license has been expired.');
                responseObj.msg = 'Your license has been expired.';
                responseObj.status = false;
                response.write(JSON.stringify(responseObj));
            } else {

                // initialize constants
                ConnectorConstants.initialize();

                // getting configuration
                var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;

                this.setCurrentStoreWithSession(externalSystemConfig, storeId);

                if (Utility.objectSize(ConnectorConstants.CurrentStore) === 0) {
                    responseObj.msg = 'Store is not Setup';
                    responseObj.status = false;
                    response.write(JSON.stringify(responseObj));
                }

                Utility.logDebug('before calling ' + recordType, '');

                // process record
                responseObj = this[recordType](recordId,recordType);

                Utility.logDebug('after calling ' + recordType, '');

                if (responseObj.hasOwnProperty('error') && !Utility.isBlankOrNull(responseObj.error)) {
                    responseObj.msg = responseObj.error;
                    responseObj.status = false;
                    response.write(JSON.stringify(responseObj));
                } else {
                    responseObj.msg = 'Record has been scynced';
                    responseObj.status = true;
                    response.write(JSON.stringify(responseObj));
                }
            }
        },
        //////////
        createRecordEntry: function(dataIn,dataType) {
            var orderIds = dataIn;
            var itemType=dataType
            var storeId = ConnectorConstants.CurrentStore.systemId;

            nlapiLogExecution('DEBUG', 'createRecordEntry', 'orderIds: ' + orderIds+itemType);
            nlapiLogExecution('DEBUG', 'createRecordEntry', 'storeId: ' + storeId);

            var id;

            if (!Utility.isBlankOrNull(orderIds)) {
                var data = {};
                nlapiLogExecution('DEBUG', 'createRecordEntry', 'storeId1: ' + storeId);
                // sort array
                orderIds = orderIds.split(',').sort().join(',');
                nlapiLogExecution('DEBUG', 'createRecordEntry', 'orderIds1: ' + orderIds);
                var itemObj={
                    "id":orderIds,
                    "recordType": itemType
                };
                data[InstantSync.FieldName.OrderIncrementsIds] = JSON.stringify(itemObj);
                data[InstantSync.FieldName.StoreId] = storeId;
                id = this.upsert(data);

                nlapiLogExecution('DEBUG', 'createRecordEntry', 'Id: ' + id);
               // var status = nlapiScheduleScript('customscript_saleorder_import_groupbuy','customdeploy_saleorder_import_groupby_de', null);
                Utility.logDebug('initiateScheduledScript', 'Status:' + status);
            }

            if (!id) {
                this.throwError('DEV_ERR', 'Data Not Sent');

            }

        },


        upsert: function (data, id) {
            try {
                Utility.logDebug("Data", data.toSource()+ "@@@"+this.InternalId);
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
        ///////////
        /**
         * main method
         */
        main: function (request, response) {
            var method = request.getMethod();

            if (method.toString() === 'GET') {
                this.processGetRequest(request, response);
            } else {
                this.processPostRequest(request, response);
            }
        }
    };
})();

/**
 * This is the main entry point for InstantSync suitelet
 * NetSuite must only know about this function.
 * Make sure that the name of this function remains unique across the project.
 */
function InstantSyncSuiteletMain(request, response) {
    InstantSync.main(request, response);
}