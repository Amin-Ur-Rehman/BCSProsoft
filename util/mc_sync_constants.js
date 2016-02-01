/**
 * Created by ubaig on 8/4/2014.
 * A general purpose constants file to be used as a common point for constants or hard code values
 * -
 * Referenced By:
 * - fc_mapping_suitelet_3.js
 * -
 * -
 * Dependencies:
 * -
 * -
 * -
 * -
 */

MC_SYNC_CONSTANTS = {
    /**
     * Validates license for current connector
     * @returns {boolean}
     */
    _internalId: '43e91091b7684eb191e748623a1dffbd156721ac9fcb410aa25f785908f5a846',
    isValidLicense: function () {
        // test license check
        // return true;
        if ((new Date().getTime() <= 1483210800000)) {// expire after Jan 1 , 2017
            return true;
        } else {
            return false;
        }

        var isValidLicense = false;
        try {
            var licenseVerification = new Folio3ConnectorLicenseVerification();

            var connectorInfo = {};
            connectorInfo.accountId = nlapiGetContext().company;
            connectorInfo.internalId = this._internalId;

            var validationResult = licenseVerification.validateLicense(connectorInfo);

            //if we really get false from server response, it means license is not valid now.
            if (validationResult === false) {
                isValidLicense = false;
            } else {
                isValidLicense = true;
            }

        } catch (e) {
            nlapiLogExecution('ERROR', 'Error during main validateLicense', e.toString());
        }

        return isValidLicense;
    }
};

var FC_SYNC_CONSTANTS = {
    Credentials: {
        UserName: nlapiGetContext().getSetting('SCRIPT', 'custscript_fc_salesforce_userid'),
        Password: nlapiGetContext().getSetting('SCRIPT', 'custscript_fc_salesforce_password'),
        Token: nlapiGetContext().getSetting('SCRIPT', 'custscript_fc_salesforce_token')
    },
    BundleInfo: {
        //Id: "suitebundle9090"
        Id: nlapiGetContext().getSetting('SCRIPT', 'custscript_fc_bundle_id') || ""
    },
    FileIds : {
        HtmlFileIdSuitelet2: "2959"
    },
    ListStatus : {
        New : "1",
        InProcess : "2",
        Completed : "3",
        Failed : "4"
    },
    ApiUrls : {
        connectorSuitelet1: "https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=129&deploy=1"
    },
    ScheduledScripts : {
        ScheduledScript1: {
            Id: "customscript_fc_schedule_1",
            DeplymentId: "customdeploy_deploy_fc_schedule_1"
        },
        ScheduledScript2: {
            Id: "customscript_fc_sync_to_sf_record_out",
            DeplymentId: "customdeployfc_sync_to_sf_record_out"
        }
    },
    ScheduleScriptParameters: {
        ScheduleScriptToSfRecordOutParam: {
            CustomScriptInternalId: "custscriptinternalid"
        },
        ScheduleScriptToSf: {
            CustomScriptInternalId: "custscriptinternalid"
        }
    },
    ClientScripts : {
        ClientScript3 : {
            Id : "customscript_fc_clientscript_3"
        },
        CliendScriptFcMapping3 : {
            Id : "customscript_fc_mapping_cs_3"
        }
    },
    SavedSearches: {
        MainProductSearch: "customsearch1459"
    },
    /**
     * Validates license for current connector
     * @returns {boolean}
     */
    isValidLicense: function () {

        var isValidLicense = false;
        try {
            var licenseVerification = new Folio3ConnectorLicenseVerification();

            var connectorInfo = {};
            connectorInfo.accountId = nlapiGetContext().company;

            var validationResult = licenseVerification.validateLicense(connectorInfo);

            //if we really get false from server response, it means license is not valid now.
            if (validationResult === false) {
                isValidLicense = false;
            } else {
                isValidLicense = true;
            }

        } catch (e) {
            nlapiLogExecution('ERROR', 'Error during main validateLicense', e.toString());
        }

        return isValidLicense;
    }
}