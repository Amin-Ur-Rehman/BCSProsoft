/**
 * Created by zahmed on 20-Nov-15.
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
 * SyncToStore class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var SyncToStore = (function () {
    return {
        Lists: {
            InternalId: "custpage_ext_sys_info",
            Fields: {
                StoreId: "custpage_store_id",
                StoreRecordId: "custpage_store_record_id",
                StoreRecordIdOther: "custpage_store_record_id_other"
            }
        },
        Fields: {
            Stores: "custpage_stores",
            RecordId: "custpage_record_id",
            RecordType: "custpage_record_type"
        },
        RecordTypes: {
            ExternalSystem: "customrecord_external_system"
        },
        isValidRecordType: function (recordType) {
            return ["term", "pricelevel"].indexOf(recordType) !== -1;
        },
        getExternalSystemRecordList: function (recordType, recordId) {
            var fils = [];
            var results = null;

            fils.push(new nlobjSearchFilter(ExtSysRecordsData.FieldName.NsRecordType, null, "is", recordType, null));
            fils.push(new nlobjSearchFilter(ExtSysRecordsData.FieldName.NsRecordId, null, "is", recordId, null));

            results = ExtSysRecordsData.lookup(fils);

            return results;
        },
        processGetRequest: function (request, response) {
            var recordId = request.getParameter("recordId") || "";
            var recordType = request.getParameter("recordType") || "";
            // get record type and record id
            // check if record type is valid for this UI
            if (!this.isValidRecordType(recordType)) {
                Utility.throwException("DEV", "You are not allowed to sync " + recordType);
            }
            if (!Utility.isBlankOrNull(recordId)) {
                Utility.throwException("DEV", "recordId is not defined or invalid.");
            }

            var form = nlapiCreateForm("Sync " + recordType.toUpperCase() + " To External System", true);
            form.addField(this.Fields.Stores, "select", "Select Store to Export", this.RecordTypes.ExternalSystem);
            form.addField(this.Fields.RecordId, "text", "", null).setDisplayType("hidden").setDefaultValue(recordType);
            form.addField(this.Fields.RecordType, "text", "", null).setDisplayType("hidden").setDefaultValue(recordId);

            var sublist = form.addSubList(this.Lists.InternalId, "staticlist", "External System Info");
            sublist.addField(this.Lists.Fields.StoreId, "select", "Store");
            sublist.addField(this.Lists.Fields.StoreRecordId, "text", "Record Id");
            sublist.addField(this.Lists.Fields.StoreRecordIdOther, "text", "Record Id Other");

            // get store and record ids of external systems
            var externalSystemRecordList = this.getExternalSystemRecordList(recordType, recordId);

            if (externalSystemRecordList.length) {
                for (var i in externalSystemRecordList) {
                    var externalSystemRecord = externalSystemRecordList[i];
                    var line = i + 1;
                    var storeId = externalSystemRecord.externalSystem;
                    var storeRecordId = externalSystemRecord.extSysRecordId;
                    var storeRecordIdOther = externalSystemRecord.extSysRecordIdOther;
                    sublist.setLineItemValue(this.Lists.Fields.StoreId, line, storeId);
                    sublist.setLineItemValue(this.Lists.Fields.StoreRecordId, line, storeRecordId);
                    sublist.setLineItemValue(this.Lists.Fields.StoreRecordIdOther, line, storeRecordIdOther);
                }
            }

            // display forms with store id
            form.addSubmitButton("Submit to Sync");
            // check if record exists currently
            // else
            response.writePage(form);
        },

        processPostRequest: function (request, response) {
            var stores = request.getParameter(this.Fields.Stores) || [];

            if (!(stores instanceof Array)) {
                stores = [stores];
            }

            if (stores.length === 0) {
                Utility.throwException("DEV", "Please select store first to sync.");
            }
            var parameters = {};

            parameters.recordId = request.getParameter(this.Fields.RecordId);
            parameters.recordId = request.getParameter(this.Fields.RecordType);
            parameters.stores = stores[0];// for only single store

            response.sendRedirect("SUITELET", "customscript_sync_to_specific_store_suit", "customdeploy_sync_to_specific_store_suit", false, parameters);
        },
        processRequest: function (request, response) {
            if (request.getMethod() === 'GET') {
                this.processGetRequest(request, response);
            } else {
                this.processPostRequest(request, response);
            }
        },
        /**
         * main method
         */
        main: function (request, response) {
            try {
                this.processRequest(request, response);
            }
            catch (e) {
                var outResponse = {};
                outResponse.Result = "ERROR";
                outResponse.Message = e.name + ", " + e.message;
                Utility.logException('SyncToStore.main', e);
                response.write(JSON.stringify(outResponse));
            }
        }
    };
})();

/**
 * This is the main entry point for SyncToStore suitelet
 * NetSuite must only know about this function.
 * Make sure that the name of this function remains unique across the project.
 */
function SyncToStoreSuiteletMain(request, response) {
    return SyncToStore.main(request, response);
}