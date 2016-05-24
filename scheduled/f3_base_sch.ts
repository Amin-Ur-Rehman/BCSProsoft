/**
 * Created by akumar on 5/13/2016.
 */

// Declaration of all NetSuite SuiteScript 1.0 APIs
/// <reference path="../util/SuiteScriptAPITS.d.ts" />

// Reference to NetSuiteSOAPWrapper
/// <reference path="../util/f3_netsuite_soap_wrapper.ts" />

// Reference to ExternalSystemCategory2Dao
/// <reference path="../util/f3_feature_verification.ts" />

// Declaration of Existing Custom Libraries methods
/// <reference path="../util/CustomMethods.d.ts" />

// Reference to ExternalSystemCategory2Dao
/// <reference path="../dao/f3_external_system_category2_dao.ts" />

type ScheduleScriptType = "scheduled" | "ondemand" | "userinterface" | "aborted" | "skipped";

abstract class BaseScheduled {
    protected store;
    protected externalSystemWrapper;
    private externalSystemArr:Array<any>;

    constructor () { }

    public scheduled(type:ScheduleScriptType):boolean {
        if (!MC_SYNC_CONSTANTS.isValidLicense()) {
            Utility.logDebug('LICENSE', 'Your license has been expired.');
            return false;
        }

        // initialize constants
        ConnectorConstants.initialize();
        ConnectorConstants.loadItemConfigRecords();

        // getting configuration
        var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
        this.externalSystemArr = this.extractExternalSystems(externalSystemConfig);

        if (this.externalSystemArr.length <= 0) {
            Utility.logDebug('Customer Export Script', 'Store(s) is/are not active');
            return false;
        }

        return true;
    }

    public iterateOverStoresWithPermittedFeature(feature, callback:((store, externalSystemWrapper:ExternalSystemWrapper)=>any)) {
        for (var i = this.externalSystemArr.length - 1; i >= 0; --i) {
            var store = this.externalSystemArr[i];

            // Check for feature availability
            if (!FeatureVerification.isPermitted(feature, store.permissions)) {
                Utility.logEmergency(';FEATURE PERMISSION', feature+ ' NOT ALLOWED');
                continue;
            }

            var externalSystemWrapper = F3WrapperFactory.getWrapper(store.systemType);
            externalSystemWrapper.initialize(store);
            externalSystemWrapper.getSessionIDFromServer(store.userName, store.password);

            // initialize configuration for logging in custom record and sending error emails
            ConnectorCommon.initiateEmailNotificationConfig();
            ConnectorConstants.CurrentStore = store;
            ConnectorConstants.CurrentWrapper = externalSystemWrapper;

            callback(store, externalSystemWrapper);
        }
    }

    /**
     * Extracts external System Information from the database
     * @param externalSystemConfig
     */
    public extractExternalSystems(externalSystemConfig) {
        var externalSystemArr = [];

        externalSystemConfig.forEach(function (store) {
            ConnectorConstants.CurrentStore = store;
            // initialize configuration for logging in custom record and sending error emails
            ConnectorCommon.initiateEmailNotificationConfig();
            ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
            ConnectorConstants.CurrentWrapper.initialize(store);

            var sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password);
            if (!sessionID) {
                Utility.logDebug('sessionID', 'sessionID is empty');
                return;
            }

            store.sessionID = sessionID;
            // push store object after getting id for updating items in this store
            externalSystemArr.push(store);

        });

        return externalSystemArr;
    }
}
