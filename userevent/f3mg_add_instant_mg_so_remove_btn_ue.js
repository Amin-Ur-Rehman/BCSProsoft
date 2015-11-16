/**
 * Created by wahajahmed on 5/15/2015.
 */

var AddInstantSORemovalBtnHelper = (function () {
    return {
        config: {
            // recordType: {label: '', url: ''}
            salesorder: {
                label: 'Cancel Magento Sales Order',
                url: '/app/site/hosting/scriptlet.nl?script=customscript_f3mg_remove_magento_so_suit&deploy=customdeploy_f3mg_remove_magento_so_suit'
            }
        },
        /**
         * Adding button for cancelling sales order to external system
         * @param type
         * @param form
         * @param request
         */
        addInstantSORemovalBtn: function (type, form, request) {
            try {
                //Utility.logDebug('type', type.toString());
                if (type.toString() === 'view') {
                    var name,
                        label,
                        script,
                        recordType,
                        url;

                    recordType = nlapiGetRecordType();
                    //Utility.logDebug('recordType', recordType);
                    if (this.config.hasOwnProperty(recordType)) {

                        // TODO: read from configuration
                        name = 'custpage_f3mg_instant_mg_so_remove';
                        label = this.config[recordType].label;
                        var magentoStoreIds = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore);
                        var magentoSync = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoSync);
                        var magentoId = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                        var status = nlapiGetFieldValue('status');

                        url = this.config[recordType].url;
                        url += url.indexOf('?') === -1 ? '?' : '&';
                        url += 'nssoid=' + nlapiGetRecordId();
                        url += '&mgsoid=' + magentoId;
                        url += '&storeid=' + magentoStoreIds;
                        url += '&status=' + 'C';

                        script = "if(confirm('Do you want to cancel this sales order in Magento?'))" +
                            "{" +
                            "InstantSync.openPopupWindow(this,'" + url + "');" +
                            "}";

                        // Show 'Close Magento Sales Order' button if order is synched to magento
                        //Utility.logDebug('magentoStoreIds#magentoId#magentoSync#status', magentoStoreIds+'#'+magentoId+'#'+magentoSync+'#'+status);
                        if (!!magentoStoreIds && !!magentoId && magentoSync === 'T'
                            && (status === ConnectorConstants.NSTransactionStatus.PendingApproval
                            || status === ConnectorConstants.NSTransactionStatus.PendingFulfillment)) {
                            form.addButton(name, label, script);
                        } else {
                            //Utility.logDebug('button rendering status', 'Not rendering');
                        }

                        // set client script to run in view mode
                        form.setScript('customscript_f3mg_instant_syc_cl');

                    }
                }
            } catch (e) {
                Utility.logException('AddInstantSORemovalBtnHelper.addInstantSORemovalBtn', e);
            }
        }

    };
})();

/**
 * All Magento SO removal business logic will be encapsulated in this class.
 */
var AddInstantSORemovalBtn = (function () {
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

            AddInstantSORemovalBtnHelper.addInstantSORemovalBtn(type, form, request);
        }
    };
})();

var SalesOrderActionsManager = (function () {

    var salesOrderActionsManagerConfig = {
        recordTypes: {
            externalSystem: {
                internalId: "customrecord_external_system",
                fields: {
                    defaultStore: "custrecord_es_default_store"
                }
            }
            , salesOrder: {
                internalId: "salesorder",
                fields: {
                    magentoStore: "custbody_f3mg_magento_store"
                }
            }
        }
    };

    /**
     * get default store Id if exist
     * @returns {*}
     */
    function getDefaultStoreId() {
        var defaultStoreId = null;
        var recs = nlapiSearchRecord(salesOrderActionsManagerConfig.recordTypes.externalSystem.internalId, null
            , [new nlobjSearchFilter(salesOrderActionsManagerConfig.recordTypes.externalSystem.fields.defaultStore, null, 'is', 'T')], []);
        if (!!recs && recs.length > 0) {
            defaultStoreId = recs[0].getId();
        }
        return defaultStoreId;
    }

    return {

        /**
         * Set default store Id
         * @param type
         * @param form
         * @param request
         */
        setDefaultStore: function (type, form, request) {
            try {
                //Utility.logDebug('type', type.toString());
                if (type.toString() === 'create' || type.toString() === 'edit') {
                    var defaultStoreId = getDefaultStoreId();
                    if (!!defaultStoreId) {
                        var magentoStore = nlapiGetFieldValue(salesOrderActionsManagerConfig.recordTypes.salesOrder.fields.magentoStore);
                        //Utility.logDebug('defaultStoreId', defaultStoreId);
                        //Utility.logDebug('magentoStore', magentoStore);
                        if (!magentoStore) {
                            nlapiSetFieldValue(salesOrderActionsManagerConfig.recordTypes.salesOrder.fields.magentoStore, defaultStoreId);
                        }
                    }
                }
            } catch (e) {
                Utility.logException('SalesOrderActionsManager.setDefaultStore', e);
            }
        },
        /**
         * Reset 'Dont Sync To Magento' checkbox field
         * @param type
         * @param form
         * @param request
         */
        setDontSyncToMagentoField: function (type, form, request) {
            try {
                if (type.toString() === 'edit') {
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.DontSyncToMagento, 'F');
                }
            } catch (e) {
                Utility.logException('SalesOrderActionsManager.setDontSyncToMagentoField', e);
            }
        },

        /**
         * Clear magento related fields in case of copy sales order
         * @param type
         * @param form
         * @param request
         */
        handleCopySalesOrderScenario: function (type, form, request) {
            try {
                if (type == 'copy') {
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.MagentoSync, 'F');
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore, '');
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId, '');
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.MagentoSyncStatus, '');
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.CancelledMagentoSOId, '');
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.CustomerRefundMagentoId, '');
                    nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.DontSyncToMagento, 'F');
                    Utility.logDebug('Magento Related Data Fields', 'Fields Cleared');
                }
            }
            catch (ex) {
                Utility.logException('SalesOrderActionsManager.handleCopySalesOrderScenario', e);
            }
        },

        cancelOrCloseSalesOrder: function (type) {
            Utility.logDebug('SalesOrderActionsManager.cancelOrCloseSalesOrder', "Start");
            Utility.logDebug("type", type);
            try {
                if (type.toString() === "cancel") {
                    Utility.logDebug('cancelOrderToExternalSystem', "Start");
                    this.cancelOrderToExternalSystem();
                    Utility.logDebug('cancelOrderToExternalSystem', "End");
                } else if (type !== "delete") {
                    if (this.isOrderClose()) {
                        this.closeOrderToExternalSystem();
                    }
                }
            }
            catch (ex) {
                nlapiLogExecution('ERROR', 'SalesOrderUserEvent.userEventAfterSubmit(); ', ex);
            }
            Utility.logDebug('SalesOrderActionsManager.cancelOrCloseSalesOrder', "End");
        },
        isOrderClose: function () {
            var isClose = false;

            var oldRec = nlapiGetOldRecord();
            var newRec = nlapiGetNewRecord();

            var oldStatus = oldRec.getFieldValue('status');
            var newStatus = newRec.getFieldValue('status');

            Utility.logDebug("oldStatus", oldStatus);
            Utility.logDebug("newStatus", newStatus);

            if (oldStatus !== newStatus && newStatus === "H") {
                isClose = true;
            }

            return isClose;
        },
        cancelOrderToExternalSystem: function () {
            this.delegateToSuitelet();
        },

        closeOrderToExternalSystem: function () {
            this.delegateToSuitelet();
        },
        delegateToSuitelet: function (status) {
            var ctx = nlapiGetContext();
            var newRec = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), [
                "status",
                ConnectorConstants.Transaction.Fields.MagentoStore,
                ConnectorConstants.Transaction.Fields.MagentoId
            ]);
            var magentoStoreIds = newRec[ConnectorConstants.Transaction.Fields.MagentoStore];
            var magentoId = newRec[ConnectorConstants.Transaction.Fields.MagentoId];
            var nsSoId = nlapiGetRecordId();
            var status = newRec['status'];

            var url = nlapiResolveURL("SUITELET", ConnectorConstants.SuiteScripts.Suitelet.UpdateSOToExternalSystem.id, ConnectorConstants.SuiteScripts.Suitelet.UpdateSOToExternalSystem.deploymentId, "EXTERNAL");
            url += url.indexOf('?') === -1 ? '?' : '&';
            url += 'nssoid=' + nsSoId;
            url += '&mgsoid=' + magentoId;
            url += '&storeid=' + magentoStoreIds;
            url += '&status=' + status;

            //url = ctx.getSetting("SCRIPT", "custscript_base_url") + url;

            Utility.logDebug("url", url);

            var response = nlapiRequestURL(url);
            var responseBody = response.getBody();
            Utility.logDebug("Cancel/Close Order Response", responseBody);
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
function AddMagentoSORemovalBtnBeforeLoad(type, form, request) {
    //AddInstantSORemovalBtn.userEventBeforeLoad(type, form, request);
    SalesOrderActionsManager.handleCopySalesOrderScenario(type, form, request);
}


function SalesOrderBeforeSubmit(type, form, request) {
    SalesOrderActionsManager.setDefaultStore(type, form, request);
    SalesOrderActionsManager.setDontSyncToMagentoField(type, form, request);
}


function SalesOrderAfterSubmit(type, form, request) {
    SalesOrderActionsManager.cancelOrCloseSalesOrder(type);
}