/**
 * Created by wahajahmed on 7/8/2015.
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
 * SalesOrderScriptHelper class that has the actual functionality of client script.
 * All business logic will be encapsulated in this class.
 */
var SalesOrderScriptHelper = (function () {
    return {
        config: {
            recordType: {
                transaction: {
                    Fields: {
                        MagentoId: 'custbody_magentoid',
                        MagentoSync: 'custbody_magentosyncdev',
                        MagentoStore: 'custbody_f3mg_magento_store',
                        MagentoSyncStatus: 'custbody_f3mg_magento_sync_status',
                        CancelledMagentoSOId: 'custbody_f3mg_cancelled_mg_so_id',
                        CustomerRefundMagentoId: 'custbody_cash_refund_magentoid'
                    }
                }
            },

            messages: function () {
                var storeText = nlapiGetFieldText(SalesOrderScriptHelper.config.recordType.transaction.Fields.MagentoStore);
                return {
                    cancelConfirmation: "You Should Cancel " + storeText + " Sales Order before editing this Order to reflect changes in " + storeText + ". Do want to proceed for cancellation button?"
                };
            },

            isMagentoStore: function () {
                var storeId = nlapiGetFieldValue(SalesOrderScriptHelper.config.recordType.transaction.Fields.MagentoStore);
                try {
                    if (!!storeId) {
                        // quick fix
                        var systemType = nlapiLookupField("customrecord_external_system_config", storeId, "custrecord_esc_system_type");
                        if (systemType === "MAGENTO") {
                            return true;
                        }
                    }
                } catch (e) {
                    Utility.logException("SalesOrderScriptHelper.isMagentoStore", e);
                }
                return false;
            }
        },
        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Access mode: create, copy, edit
         * @returns {Void}
         */
        clientPageInit: function (type) {
            if (this.config.isMagentoStore()) {
                var magentoSync = nlapiGetFieldValue(this.config.recordType.transaction.Fields.MagentoSync);
                var magentoId = nlapiGetFieldValue(this.config.recordType.transaction.Fields.MagentoId);
                if (!!magentoId && magentoSync === 'T') {
                    if (confirm(this.config.messages().cancelConfirmation)) {
                        //alert('redirection in its way.');
                        var id = nlapiGetRecordId();
                        var soViewUrl = nlapiResolveURL('RECORD', 'salesorder', id, 'VIEW');
                        window.location.href = soViewUrl;
                        //nlapiSetRedirectURL('RECORD', 'salesorder', id, false);
                        return true;
                    }
                }
            }
        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @returns {Boolean} True to continue save, false to abort save
         */
        clientSaveRecord: function () {

            return true;
        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @param {String} name Field internal id
         * @param {Number} linenum Optional line item number, starts from 1
         * @returns {Boolean} True to continue changing field value, false to abort value change
         */
        clientValidateField: function (type, name, linenum) {

            return true;
        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @param {String} name Field internal id
         * @param {Number} linenum Optional line item number, starts from 1
         * @returns {Void}
         */
        clientFieldChanged: function (type, name, linenum) {

        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @param {String} name Field internal id
         * @returns {Void}
         */
        clientPostSourcing: function (type, name) {

        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @returns {Void}
         */
        clientLineInit: function (type) {

        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @returns {Boolean} True to save line item, false to abort save
         */
        clientValidateLine: function (type) {

            return true;
        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @returns {Void}
         */
        clientRecalc: function (type) {

        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @returns {Boolean} True to continue line item insert, false to abort insert
         */
        clientValidateInsert: function (type) {

            return true;
        },

        /**
         * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
         * @appliedtorecord recordType
         *
         * @param {String} type Sublist internal id
         * @returns {Boolean} True to continue line item delete, false to abort delete
         */
        clientValidateDelete: function (type) {

            return true;
        }
    };
})();


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function SalesOrderScriptHelperclientPageInit(type) {
    return SalesOrderScriptHelper.clientPageInit(type);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @returns {Boolean} True to continue save, false to abort save
 */
function SalesOrderScriptHelperclientSaveRecord() {

    return
    return SalesOrderScriptHelper.clientSaveRecord();
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function SalesOrderScriptHelperclientValidateField(type, name, linenum) {

    return SalesOrderScriptHelper.clientValidateField(type, name, linenum);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function SalesOrderScriptHelperclientFieldChanged(type, name, linenum) {
    return SalesOrderScriptHelper.clientFieldChanged(type, name, linenum);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function SalesOrderScriptHelperclientPostSourcing(type, name) {
    return SalesOrderScriptHelper.clientPostSourcing(type, name);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function SalesOrderScriptHelperclientLineInit(type) {
    return SalesOrderScriptHelper.clientLineInit(type);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function SalesOrderScriptHelperclientValidateLine(type) {

    return SalesOrderScriptHelper.clientValidateLine(type);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function SalesOrderScriptHelperclientRecalc(type) {
    return SalesOrderScriptHelper.clientRecalc(type);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item insert, false to abort insert
 */
function SalesOrderScriptHelperclientValidateInsert(type) {

    return SalesOrderScriptHelper.clientValidateInsert(type);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item delete, false to abort delete
 */
function SalesOrderScriptHelperclientValidateDelete(type) {

    return SalesOrderScriptHelper.clientValidateDelete(type);
}
