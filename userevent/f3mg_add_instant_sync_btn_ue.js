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


var AddInstantSyncBtnHelper = (function () {
    return {
        config: {
            // recordType: {label: '', url: ''}
            creditmemo: {
                label: 'Sync To Magento',
                url: '/app/site/hosting/scriptlet.nl?script=customscript_f3mg_instant_syc_suit&deploy=customdeploy_f3mg_instant_syc_suit'
            }
        },
        addInstantSyncBtn: function (type, form, request) {
            try {
                if (type.toString() === 'view') {
                    var name,
                        label,
                        script,
                        recordType,
                        url;

                    recordType = nlapiGetRecordType();

                    if (this.config.hasOwnProperty(recordType)) {

                        // TODO: read from configuration
                        name = 'custpage_f3mg_instant_sync';
                        label = this.config[recordType].label;

                        url = this.config[recordType].url;
                        url += url.indexOf('?') === -1 ? '?' : '&';
                        url += 'recordid=' + nlapiGetRecordId();
                        url += '&recordtype=' + nlapiGetRecordType();
                        url += '&storeid=' + nlapiGetFieldValue(ConnectorConstants.Transaction.Fields.MagentoStore);

                        script = "InstantSync.openPopupWindow(this,'" + url + "')";

                        form.addButton(name, label, script);

                        // set client script to run in view mode
                        form.setScript('customscript_f3mg_instant_syc_cl');

                    }
                }
            } catch (e) {
                Utility.logException('AddInstantSyncBtnHelper.addInstantSyncBtn', e);
            }
        }
    };
})();

/**
 * All business logic will be encapsulated in this class.
 */
var AddInstantSyncBtn = (function () {
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
            AddInstantSyncBtnHelper.addInstantSyncBtn(type, form, request);
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
function AddInstantSyncBtnUserEventBeforeLoad(type, form, request) {
    AddInstantSyncBtn.userEventBeforeLoad(type, form, request);
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
function AddInstantSyncBtnUserEventBeforeSubmit(type) {
    AddInstantSyncBtn.userEventBeforeSubmit(type);
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
function AddInstantSyncBtnUserEventAfterSubmit(type) {
    AddInstantSyncBtn.userEventAfterSubmit(type);
}