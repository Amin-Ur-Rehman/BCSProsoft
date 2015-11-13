/**
 * Created by wahajahmed on 8/7/2015.
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
 * WotpClient class that has the actual functionality of client script.
 * All business logic will be encapsulated in this class.
 */
var RecordExportButtonUE = (function () {
    return {
        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Operation types: create, edit, view, copy, print, email
         * @param {nlobjForm} form Current form
         * @param {nlobjRequest} request Request object
         * @returns {Void}
         */
        userEventBeforeLoad: function (type, form, request) {
            try {
                var recordType = nlapiGetRecordType();
                //Utility.logDebug('recordType', recordType);
                var eligibleRecordTypes = ConnectorCommon.getEligibleRecordTypeForExportButton();
                if (eligibleRecordTypes.indexOf(recordType) > -1) {
                    var context = nlapiGetContext();
                    var executionContext = context.getExecutionContext();
                    if (executionContext.toString() === 'userinterface') {
                        if (type.toString() === 'view') {
                            // getting text value for external system in NetSuite record.
                            var externalSystemText = nlapiGetFieldText(ConnectorConstants.Transaction.Fields.MagentoStore);
                            externalSystemText = externalSystemText || nlapiGetFieldText(ConnectorConstants.PromoCode.Fields.MagentoStore);
                            // getting value for external system id
                            var externalSystemId = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                            externalSystemId = externalSystemId || nlapiGetFieldValue(ConnectorConstants.PromoCode.Fields.MagentoId);
                            // donot show button if record is already synced
                            if (!!externalSystemId || !externalSystemText) {
                                return;
                            }
                            externalSystemText = externalSystemText || "External System";
                            var recordInternalId = nlapiGetRecordId();
                            var suiteletUrl = nlapiResolveURL('SUITELET', ConnectorConstants.SuiteScripts.Suitelet.GenericDataExport.id, ConnectorConstants.SuiteScripts.Suitelet.GenericDataExport.deploymentId);
                            var script = "var recordId = nlapiGetRecordId(); var recordType = nlapiGetRecordType(); var url = '" + suiteletUrl + "&recordId=" + recordInternalId + "&recordType=" + recordType + "'; window.open(url,'Processing','width=200,height=200');";
                            form.addButton('custpage_btn_sync_to_magento', 'Sync To ' + externalSystemText, script);
                        }
                    }
                }
            } catch (ex) {
                Utility.logException('GenericRecordExportButtonUE.userEventBeforeLoad', ex);
            }
        },
        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Operation types: create, edit, delete, xedit
         *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
         *                      pack, ship (IF)
         *                      markcomplete (Call, Task)
         *                      reassign (Case)
         *                      editforecast (Opp, Estimate)
         * @returns {Void}
         */
        userEventBeforeSubmit: function (type) {
            //TODO: Write Your code here
        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Operation types: create, edit, delete, xedit,
         *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
         *                      pack, ship (IF only)
         *                      dropship, specialorder, orderitems (PO only)
         *                      paybills (vendor payments)
         * @returns {Void}
         */
        userEventAfterSubmit: function (type) {
            //TODO: Write Your code here
        }
    };
})();

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function RecordExportButtonUserEventBeforeLoad(type, form, request) {
    return RecordExportButtonUE.userEventBeforeLoad(type, form, request);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function RecordExportButtonUserEventBeforeSubmit(type) {
    return RecordExportButtonUE.userEventBeforeSubmit(type);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function RecordExportButtonUserEventAfterSubmit(type) {
    return RecordExportButtonUE.userEventAfterSubmit(type);
}
