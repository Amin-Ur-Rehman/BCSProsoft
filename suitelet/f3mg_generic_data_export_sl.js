/**
 * Created by wahajahmed on 8/6/2015.
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
 * GenericDataExportManager class that has the actual functionality of generic data export suitelet.
 * All business logic will be encapsulated in this class.
 */
var GenericDataExportManager = (function () {
    return {
        /**
         * main method
         */
        main: function (request, response) {
            if (request.getMethod() === 'GET') {
                var recordId = request.getParameter("recordId");
                var recordType = request.getParameter("recordType");
                var result = this.exportData(recordId, recordType);
                if (!!result && !!result.status) {
                    var msg;
                    if (result.hasOwnProperty("msg")) {
                        msg = result.msg;
                    } else {
                        msg = "Record has been exported to magento. Please close this popup.";
                    }
                    response.write(msg);
                } else {
                    response.write('Some error occurred during record export:<br /><br />' + result.error);
                }
            }
        },
        /**
         * Export provided record to magento
         * @param recordId
         * @param recordType
         * @returns {*}
         */
        exportData: function (recordId, recordType) {
            var result = null;
            if (recordType == ConnectorConstants.NSRecordTypes.PromotionCode) {
                result = this.exportPromotionCode(recordId, recordType);
            }
            else if (recordType == ConnectorConstants.NSRecordTypes.PriceLevel) {
                result = this.exportPriceLevel(recordId, recordType);
            }
            else if (recordType == ConnectorConstants.NSRecordTypes.PaymentTerm) {
                result = this.exportPaymentTerm(recordId, recordType);
            }
            else if (recordType == ConnectorConstants.NSRecordTypes.SalesOrder) {
                result = this.exportSalesOrder(recordId, recordType);
            }

            return result;
        },
        /**
         * Export provided Promotion code record to magento
         * @param recordId
         * @param recordType
         * @returns {{status: boolean, error: string}}
         */
        exportPromotionCode: function (recordId, recordType) {
            var result = {
                status: false,
                error: ""
            };

            try {
                var internalId = recordId;
                var promoCodeRecord = PromoCodesExportHelper.getPromoCode(internalId, null);

                // initialize constants
                ConnectorConstants.initialize();
                // getting configuration
                var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
                ConnectorConstants.CurrentStore = externalSystemConfig[promoCodeRecord.magentoStore];
                // Check for feature availability
                if (!FeatureVerification.isPermitted(Features.IMPORT_SO_FROM_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                    Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_PROMOTION_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                    result.error = Features.EXPORT_PROMOTION_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED';
                    result.status = false;
                    return result;
                }

                Utility.logDebug('promoCodeRecord', JSON.stringify(promoCodeRecord));
                var response = PromoCodesExportHelper.sendRequestToExternalSystem(internalId, promoCodeRecord);
                result.status = response.status;
                if (!response.status) {
                    result.error = response.message;
                }
            }
            catch (ex) {
                result.status = false;
                if (ex instanceof nlobjError) {
                    result.error = 'Code: ' + ex.getCode() + ',  Detail: ' + ex.getDetails();
                } else {
                    result.error = ex.toString();
                }
                nlapiLogExecution('ERROR', 'error in GenericDataExportManager.exportPromotionCode', result.error);
            }

            return result;
        },

        exportPriceLevel: function (recordId, recordType) {
            var status = true;
            var error = '';
            var magentoUrl = '';
            try {
                var internalId = recordId;
                var priceLevelRecord = PriceLevelExportHelper.getPriceLevel(internalId, null);
                Utility.logDebug('priceLevelRecord', JSON.stringify(priceLevelRecord));
                var response = PriceLevelExportHelper.sendRequestToExternalSystem(internalId, priceLevelRecord);
                status = response.status;
                if (!response.status) {
                    error = response.message;
                }
            }
            catch (ex) {
                status = false;
                if (ex instanceof nlobjError) {
                    error = 'Code: ' + ex.getCode() + ',  Detail: ' + ex.getDetails();
                } else {
                    error = ex.toString();
                }
                nlapiLogExecution('ERROR', 'error in GenericDataExportManager.exportPriceLevel', error);
            }

            var result = {
                status: status,
                error: error
            };
            return result;
        },

        exportPaymentTerm: function (recordId, recordType) {
            var status = true;
            var error = '';
            var magentoUrl = '';
            try {
                var internalId = recordId;
                var paymentTermRecord = PaymentTermExportHelper.getPaymentTerm(internalId, null);
                Utility.logDebug('paymentTermRecord', JSON.stringify(paymentTermRecord));
                var response = PaymentTermExportHelper.sendRequestToExternalSystem(internalId, paymentTermRecord);
                status = response.status;
                if (!response.status) {
                    error = response.message;
                }
            }
            catch (ex) {
                status = false;
                if (ex instanceof nlobjError) {
                    error = 'Code: ' + ex.getCode() + ',  Detail: ' + ex.getDetails();
                } else {
                    error = ex.toString();
                }
                nlapiLogExecution('ERROR', 'error in GenericDataExportManager.exportPaymentTerm', error);
            }

            var result = {
                status: status,
                error: error
            };
            return result;
        },

        exportSalesOrder: function (recordId, recordType) {
            var status = true;
            var error = '';
            var msg = '';
            try {
                var orderData = nlapiLookupField(recordType, recordId, [ConnectorConstants.Transaction.Fields.MagentoStore, ConnectorConstants.Transaction.Fields.MagentoId]);

                if (!!orderData[ConnectorConstants.Transaction.Fields.MagentoId]) {
                    msg = "Sales Order is already synced. Please close the window.";
                }
                else if (!!orderData[ConnectorConstants.Transaction.Fields.MagentoStore]) {
                    msg = "Please select External System first. Please close the window. ";
                } else {
                    var data = {};
                    data[RecordsToSync.FieldName.RecordId] = recordId;
                    data[RecordsToSync.FieldName.RecordType] = RecordsToSync.RecordTypes.SalesOrder;
                    data[RecordsToSync.FieldName.Action] = RecordsToSync.Actions.SyncSoSystemNotes;
                    data[RecordsToSync.FieldName.Status] = RecordsToSync.Status.Pending;
                    data[RecordsToSync.FieldName.ExternalSystem] = nlapiLookupField(recordType, recordId, ConnectorConstants.Transaction.Fields.MagentoStore);
                    RecordsToSync.upsert(data);
                    nlapiScheduleScript(ConnectorConstants.SuiteScripts.ScheduleScript.SalesOrderExportToExternalSystem.id, ConnectorConstants.SuiteScripts.ScheduleScript.SalesOrderExportToExternalSystem.deploymentId);
                    msg = "Please close the window. Sales Order will be synced in few minutes.";
                }
            }
            catch (ex) {
                status = false;
                if (ex instanceof nlobjError) {
                    error = 'Code: ' + ex.getCode() + ',  Detail: ' + ex.getDetails();
                } else {
                    error = ex.toString();
                }
                nlapiLogExecution('ERROR', 'error in GenericDataExportManager.exportSalesOrder', error);
            }

            var result = {
                status: status,
                msg: msg,
                error: error
            };
            return result;
        }
    };
})();

/**
 * This is the main entry point for GenericDataExportManager suitelet
 * NetSuite must only know about this function.
 * Make sure that the name of this function remains unique across the project.
 */
function GenericDataExportManagerSuiteletMain(request, response) {
    return GenericDataExportManager.main(request, response);
}