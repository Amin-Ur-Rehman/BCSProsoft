/**
 * Created by wahajahmed on 18-May-15.
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
 * RemoveMagentoSO class that has the actual functionality of suitelet.
 * All business logic will be encapsulated in this class.
 */
var RemoveMagentoSO = (function () {
    return {
        /**
         *
         * @param recordId
         * @returns {{error: string}}
         */
        removeSalesOrder: function (soId, status) {
            var responseObj = {
                error: ''
            };

            try {


            } catch (e) {
                Utility.logException('RemoveMagentoSO.removeSalesOrder', e);
                responseObj.error += e.toString() + '\n';
            }

            return responseObj;
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

            try {
                var nsSoInternalId = request.getParameter('nssoid');
                var mgSoInternalId = request.getParameter('mgsoid');
                var storeId = request.getParameter('storeid');
                var status = request.getParameter('status');
                var magentoSOClosingUrl = '';

                var salesOrderfields = [];
                salesOrderfields.push(ConnectorConstants.Transaction.Fields.MagentoSync);
                salesOrderfields.push(ConnectorConstants.Transaction.Fields.MagentoId);
                salesOrderfields.push(ConnectorConstants.Transaction.Fields.CancelledMagentoSOId);

                var salesOrderData = nlapiLookupField(ConnectorConstants.NSTransactionTypes.SalesOrder, nsSoInternalId, salesOrderfields);

                var magentoSync = salesOrderData[ConnectorConstants.Transaction.Fields.MagentoSync];
                var magentoId = salesOrderData[ConnectorConstants.Transaction.Fields.MagentoId];
                var cancelledMagentoId = salesOrderData[ConnectorConstants.Transaction.Fields.CancelledMagentoSOId];

                if (magentoSync === 'F' && !magentoId && !!cancelledMagentoId) {
                    response.write('This Sales Order has already been Cancelled in Magento.');
                }
                else {
                    ConnectorConstants.initialize();
                    // getting configuration
                    var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
                    var sessionID;

                    var store = externalSystemConfig[storeId];
                    ConnectorConstants.CurrentStore = store;
                    // Check for feature availability
                    if (!FeatureVerification.isPermitted(Features.CANCEL_SO_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                        Utility.logEmergency('FEATURE PERMISSION', Features.CANCEL_SO_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                        response.write("Cancelling Sales Order to External System is not allowed.");
                        return;
                    }
                    ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                    ConnectorConstants.CurrentWrapper.initialize(store);
                    sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password, false);

                    var dataObj = {};
                    dataObj.orderIncrementId = mgSoInternalId;
                    dataObj.status = status;
                    dataObj.nsTransactionId = nsSoInternalId;

                    var responseBody = ConnectorConstants.CurrentWrapper.cancelSalesOrder(dataObj);

                    if (!!responseBody.status) {
                        if (ConnectorConstants.CurrentWrapper.requiresOrderUpdateAfterCancelling()) {
                            var fields = [];
                            fields.push(ConnectorConstants.Transaction.Fields.MagentoId);
                            fields.push(ConnectorConstants.Transaction.Fields.MagentoSync);
                            fields.push(ConnectorConstants.Transaction.Fields.CancelledMagentoSOId);
                            fields.push(ConnectorConstants.Transaction.Fields.DontSyncToMagento);
                            var values = [];
                            values.push('');
                            values.push('F');
                            values.push(mgSoInternalId);
                            values.push('T');
                            Utility.logDebug('ConnectorConstants.NSTransactionTypes.SalesOrder', ConnectorConstants.NSTransactionTypes.SalesOrder);
                            Utility.logDebug('nsSoInternalId', nsSoInternalId);
                            Utility.logDebug('fields', JSON.stringify(fields));
                            Utility.logDebug('values', JSON.stringify(values));
                            nlapiSubmitField(ConnectorConstants.NSTransactionTypes.SalesOrder, nsSoInternalId, fields, values);
                        }

                        var script = '';
                        //script += '<script>window.opener.location.reload(); setTimeout(function(){window.close();}, 3000);</script>';
                        var msg = 'This Sales Order has been Cancelled. <br /><br />';
                        response.write(msg + script);

                    } else {
                        response.write('Some error occured while closing Magento Sales Order. <br />Error: ' + responseBody.error);
                    }
                }

            }
            catch (e) {
                response.write('Some error occured while closing Magento Sales Order. <br />Error: ' + e.message);
                Utility.logException('some error occurred while removing Magento SO', e);
            }
        },
        processPostRequest: function (request, response) {

            Utility.logDebug('request.getBody()', request.getBody());

            response.write('Post: its coming here...');
        },
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
 * This is the main entry point for Remove Magento SO suitelet
 */
function removeMagentoSoSuiteletMain(request, response) {
    RemoveMagentoSO.main(request, response);
}