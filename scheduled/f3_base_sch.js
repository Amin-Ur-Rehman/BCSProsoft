/**
 * Created by akumar on 5/13/2016.
 */
var BaseScheduled = (function () {
    function BaseScheduled() {
    }
    BaseScheduled.prototype.scheduled = function (type) {
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
    };
    BaseScheduled.prototype.iterateOverStoresWithPermittedFeature = function (feature, callback) {
        for (var i = this.externalSystemArr.length - 1; i >= 0; --i) {
            var store = this.externalSystemArr[i];
            // Check for feature availability
            if (!FeatureVerification.isPermitted(feature, store.permissions)) {
                Utility.logEmergency(';FEATURE PERMISSION', feature + ' NOT ALLOWED');
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
    };
    /**
     * Extracts external System Information from the database
     * @param externalSystemConfig
     */
    BaseScheduled.prototype.extractExternalSystems = function (externalSystemConfig) {
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
    };
    return BaseScheduled;
}());
//# sourceMappingURL=f3_base_sch.js.map