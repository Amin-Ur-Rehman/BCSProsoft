/**
 * Created by zahmed on 16-Jan-15.
 *
 * Description:
 * - This script is responsible for exporting fulfillmet to Magento store as Shipment
 * -
 * Referenced By:
 * -
 * Dependency:
 * - Script Parameters:
 *   -
 * -
 * - Script Id:
 *   - customscript_magento_item_sync_sch
 * -
 * - Deployment Id:
 *   - customdeploy_magento_item_sync_sch
 * -
 * - Scripts:
 *   - folio3ConnectorLicenseVerification.js
 *   - mc_sync_constants.js
 *   - f3_inventory_sync_script_dao.js
 *   - f3_utility_methods.js
 *   - f3mg_connector_constants.js
 *   - f3mg_connector_common.js
 *   - f3mg_xml_utility.js
 *   - f3_external_system_config_dao.js
 *   - f3_client_factory.js
 *   - f3mg_ns_mg_shipping_methods_map_dao.js
 */

var InvoiceExportHelper = (function () {
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
            //TODO: Write Your code here
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
            try {

                // checking license validation
                if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                    Utility.logDebug('Validate', 'License has expired');
                    return;
                }

                // only executes code when license is valid and type is create
                if (type.toString() === 'create') {

                    var recType = nlapiGetRecordType();
                    Utility.logDebug('recType_w', recType);
                    // if fulfillment is not creating from sales order then terminate
                    if (!(recType == 'cashsale' || recType == 'invoice')) {
                        return;
                    }

                    var recordId = nlapiGetRecordId();
                    Utility.logDebug('recordId_w', recordId);
                    var salesOrderStore = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore);
                    Utility.logDebug('salesOrderStore_w', salesOrderStore);
                    var salesOrderMagentoId = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
                    Utility.logDebug('salesOrderMagentoId_w', salesOrderMagentoId);

                    // if not sales order is not synced with magento then terminate
                    if (Utility.isBlankOrNull(salesOrderStore) || Utility.isBlankOrNull(salesOrderMagentoId)) {
                        return;
                    }

                    ConnectorConstants.initialize();
                    // getting configuration
                    var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
                    var sessionID;

                    var store = externalSystemConfig[salesOrderStore];
                    ConnectorConstants.CurrentStore = store;

                    // Check for feature availability
                    if (!FeatureVerification.isPermitted(Features.EXPORT_INVOICE_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                        Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_INVOICE_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                        return;
                    }

                    ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                    ConnectorConstants.CurrentWrapper.initialize(store);
                    sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password);

                    // if session id is not captured then terminate
                    if (Utility.isBlankOrNull(sessionID)) {
                        Utility.logDebug('sessionID', 'sessionID is empty');
                        return;
                    }

                    this.syncInvoice(sessionID, store);
                }
            } catch (e) {
                Utility.logException('startup - afterSubmit', e);
            }
        },

        /**
         * Sync
         * @param sessionID
         * @param store
         * @param netsuiteSORec
         */
        syncInvoice: function (sessionID, store) {
            var netsuiteInvoiceDetails = this.getNetSuiteInvoiceObj();
            Utility.logDebug('netsuiteInvoiceDetails', JSON.stringify(netsuiteInvoiceDetails));
            var responseBody = ConnectorConstants.CurrentWrapper.createInvoice(sessionID, netsuiteInvoiceDetails, store);
            if(!!responseBody.status) {
                if(!!responseBody.data.increment_id) {
                    Utility.logDebug('Success', 'Other systems Invoice created ');
                    nlapiSubmitField(netsuiteInvoiceDetails.recType, netsuiteInvoiceDetails.recordId, ConnectorConstants.Transaction.Fields.MagentoInvoiceId, responseBody.data.increment_id);
                } else {
                    Utility.logDebug('Error', 'Other systems Invoice Increment Id not found');
                }
                Utility.logDebug('successfully', 'other systems invoice created');
            } else {
                Utility.logException('Some error occurred while creating other systems Invoice', responseBody.message);
            }
        },

        /**
         * Get netsuite Invoice/Cash Sale details
         */
        getNetSuiteInvoiceObj: function() {
            var netsuiteInvoiceDetails = {};
            netsuiteInvoiceDetails.recordId = nlapiGetRecordId();
            netsuiteInvoiceDetails.recType = nlapiGetRecordType();
            netsuiteInvoiceDetails.otherSystemSOId = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
            netsuiteInvoiceDetails.netsuiteSOId = nlapiGetFieldValue('createdfrom');
            netsuiteInvoiceDetails.isSOFromOtherSystem = nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.FromOtherSystem);
            netsuiteInvoiceDetails.sOPaymentMethod = nlapiLookupField('salesorder', netsuiteInvoiceDetails.netsuiteSOId, 'paymentmethod');
            return netsuiteInvoiceDetails;
        },


        /**
         * Set other systems shipment id
         * @param shipmentId
         */
        setShipmentIdInFulFillment: function(shipmentId) {
            var rec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId(), null);
            rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoId, shipmentId + '');
            rec.setFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore, ConnectorConstants.CurrentStore.systemId);
            nlapiSubmitRecord(rec);
        },

        /**
         * Sync fulfillment to other system(magento, woocommerce)
         * @param sessionID
         * @param magentoSO
         */
        syncFulfillmentsMagento: function(sessionID, magentoSO) {
            var fulfillmentXML;
            var responseMagento;
            var magentoSOId = magentoSO.getFieldValue(ConnectorConstants.Transaction.Fields.MagentoId);
            var magentoItemIds = ConnectorCommon.getMagentoItemIds(ConnectorCommon.getFulfillmentItems());

            // getting xml for creating fulfillemnt/shipment in Magento
            fulfillmentXML = MagentoWrapper.getCreateFulfillmentXML(sessionID, magentoItemIds, magentoSOId);
            Utility.logDebug('XmlUtility.getCreateFulfillmentXML', 'EOS ' + fulfillmentXML);

            // create shipment in Magento
            responseMagento = MagentoWrapper.validateFulfillmentExportResponse(MagentoWrapper.soapRequestToMagento(fulfillmentXML));

            if (!responseMagento.status) {
                Utility.logDebug('Error', 'Export fulfillment record -- ID: ' + '--' + responseMagento.faultCode + '--' + responseMagento.faultString);

                return;
            }
            else {
                Utility.logDebug('set magento shipment id', 'Im Setting ID ' + responseMagento.result);
                //nlapiSetFieldValue(ConnectorConstants.Transaction.Fields.MagentoId, responseMagento.result);

                // from SO
                var carrier = magentoSO.getFieldValue('shipcarrier');
                var totalPackages = nlapiGetLineItemCount('package');
                var carrierText = magentoSO.getFieldText('shipmethod');

                Utility.logDebug('carrier', carrier);
                Utility.logDebug('totalPackages', totalPackages);
                Utility.logDebug('carrierText', carrierText);

                for (var p = 1; p <= totalPackages; p++) {
                    var tracking = nlapiGetLineItemValue('package', 'packagetrackingnumber', p);
                    if (Utility.isBlankOrNull(tracking)) {
                        tracking = 0;
                    }
                    // Setting Tracking Number
                    var trackingXML = MagentoWrapper.createTrackingXML(responseMagento.result, carrier, carrierText, tracking, sessionID);
                    var responseTracking = MagentoWrapper.validateTrackingCreateResponse(MagentoWrapper.soapRequestToMagento(trackingXML));
                    Utility.logDebug('CHECK', 'I tried setting shipment tracking id Got this in response : ' + responseTracking.result);
                }
            }

            return responseMagento;
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
function InvoiceExportHelperUserEventBeforeLoad(type, form, request) {
    return InvoiceExportHelper.userEventBeforeLoad(type, form, request);
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
function InvoiceExportHelperUserEventBeforeSubmit(type) {
    return InvoiceExportHelper.userEventBeforeSubmit(type);
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
function InvoiceExportHelperUserEventAfterSubmit(type) {
    return InvoiceExportHelper.userEventAfterSubmit(type);
}
