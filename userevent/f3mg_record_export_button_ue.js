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

/*
 SalesOrd:A         Sales Order:Pending Approval
 SalesOrd:B         Sales Order:Pending Fulfillment
 SalesOrd:C         Sales Order:Cancelled
 SalesOrd:D         Sales Order:Partially Fulfilled
 SalesOrd:E         Sales Order:Pending Billing/Partially Fulfilled
 SalesOrd:F         Sales Order:Pending Billing
 SalesOrd:G         Sales Order:Billed
 SalesOrd:H         Sales Order:Closed
 */

/**
 * RecordExportButtonUE class that has the actual functionality of userevent script.
 * All business logic will be encapsulated in this class.
 */
var RecordExportButtonUE = (function () {
    return {
        showSyncButton: function () {
            var show = false;
            var recordType = nlapiGetRecordType().toString();

            var externalSystem;
            var externalSystemId;
            var externalSystemOrderId;
            var nsOrderStatus;
            var nsOrderStatusList = ["C", "H"];// Statuses are defined above

            // getting value for external system id
            if (recordType === ConnectorConstants.NSRecordTypes.SalesOrder) {
                externalSystem = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore);
                externalSystemId = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                nsOrderStatus = nlapiGetFieldValue("orderstatus");
                if (!!externalSystem && !externalSystemId && nsOrderStatusList.indexOf(nsOrderStatus) === -1) {
                    show = true;
                }
            }
            if (recordType === ConnectorConstants.NSRecordTypes.CashRefund) {
                externalSystem = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore);
                externalSystemOrderId = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                externalSystemId = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.CustomerRefundMagentoId);

                if (!!externalSystem && !!externalSystemOrderId && !externalSystemId) {
                    show = true;
                }
            }
            if (recordType === ConnectorConstants.NSRecordTypes.PromotionCode) {
                externalSystem = nlapiGetFieldValue(ConnectorConstants.PromoCode.Fields.MagentoStore);
                externalSystemId = nlapiGetFieldValue(ConnectorConstants.PromoCode.Fields.MagentoId);
                if (!!externalSystem && !externalSystemId) {
                    show = true;
                }
            }

            Utility.logDebug("showSyncButton", "recordType: " + recordType + " || externalSystem: " + externalSystem + " || externalSystemId: " + externalSystemId + " || externalSystemOrderId: " + externalSystemOrderId);

            return show;
        },
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
                            // donot show button if record is already synced
                            if (!this.showSyncButton()) {
                                return;
                            }
                            // getting text value for external system in NetSuite record.
                            var externalSystemText = nlapiGetFieldText(ConnectorConstants.Transaction.Fields.MagentoStore);
                            externalSystemText = externalSystemText || nlapiGetFieldText(ConnectorConstants.PromoCode.Fields.MagentoStore);
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
            if (type.toString() === 'edit') {
                var date = new Date(),
                    netSuiteSalesOrderModifiedAt = ConnectorConstants.Transaction.Fields.NetSuiteSalesOrderModifiedAt;
                var dateString =nlapiDateToString(date, 'datetimetz');
                Utility.logDebug('Updating ' + netSuiteSalesOrderModifiedAt, dateString);
                nlapiSetFieldValue(netSuiteSalesOrderModifiedAt, dateString);
            }
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
