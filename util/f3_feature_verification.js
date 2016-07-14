/**
 * Created by zahmed on 15-Oct-15.
 */
var FeatureVerification = (function () {
    function FeatureVerification() {
    }
    FeatureVerification.cleanPermissions = function (permissions) {
        if (!permissions) {
            return [];
        }
        if (!(permissions instanceof Array)) {
            return [];
        }
        return permissions;
    };
    FeatureVerification.isPermitted = function (featureName, permissions) {
        if (permissions === void 0) { permissions = []; }
        var isAllowed = false;
        permissions = FeatureVerification.cleanPermissions(permissions);
        if (!!featureName) {
            if (permissions.indexOf(featureName) > -1) {
                isAllowed = true;
            }
        }
        return isAllowed;
    };
    return FeatureVerification;
}());
var Features = (function () {
    function Features() {
    }
    Features.IMPORT_SO_FROM_EXTERNAL_SYSTEM = "IMPORT_SO_FROM_EXTERNAL_SYSTEM";
    Features.UPDATE_SO_FROM_EXTERNAL_SYSTEM = "UPDATE_SO_FROM_EXTERNAL_SYSTEM";
    Features.IMPORT_SO_GUEST_CUSTOMER = "IMPORT_SO_GUEST_CUSTOMER";
    Features.IMPORT_SO_DUMMMY_ITEM = "IMPORT_SO_DUMMMY_ITEM";
    Features.EXPORT_SO_TO_EXTERNAL_SYSTEM = "EXPORT_SO_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_SO_GUEST_CUSTOMER = "EXPORT_SO_GUEST_CUSTOMER";
    Features.EXPORT_SO_DUMMMY_ITEM = "EXPORT_SO_DUMMMY_ITEM";
    Features.EXPORT_SO_SYSTEM_NOTES = "EXPORT_SO_SYSTEM_NOTES";
    Features.CANCEL_SO_FROM_EXTERNAL_SYSTEM = "CANCEL_SO_FROM_EXTERNAL_SYSTEM";
    Features.CANCEL_SO_TO_EXTERNAL_SYSTEM = "CANCEL_SO_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_CUSTOMER_TO_EXTERNAL_SYSTEM = "EXPORT_CUSTOMER_TO_EXTERNAL_SYSTEM";
    Features.IMPORT_CUSTOMER_FROM_EXTERNAL_SYSTEM = "IMPORT_CUSTOMER_FROM_EXTERNAL_SYSTEM";
    Features.UPDATE_CUSTOMER_IF_EXISTS = "UPDATE_CUSTOMER_IF_EXISTS";
    Features.EXPORT_ITEM_TO_EXTERNAL_SYSTEM = "EXPORT_ITEM_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_CATEGORY_TO_EXTERNAL_SYSTEM = "EXPORT_CATEGORY_TO_EXTERNAL_SYSTEM";
    Features.IMPORT_ITEM_FROM_EXTERNAL_SYSTEM = "IMPORT_ITEM_FROM_EXTERNAL_SYSTEM";
    Features.EXPORT_ITEM_TIERED_PRICING = "EXPORT_ITEM_TIERED_PRICING";
    Features.UPDATE_ITEM_TO_EXTERNAL_SYSTEM = "UPDATE_ITEM_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_INVOICE_TO_EXTERNAL_SYSTEM = "EXPORT_INVOICE_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_CASH_REFUND_TO_EXTERNAL_SYSTEM = "EXPORT_CASH_REFUND_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_ITEM_FULFILLMENT_TO_EXTERNAL_SYSTEM = "EXPORT_ITEM_FULFILLMENT_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_ITEM_FULFILLMENT_TRACKING_INFO = "EXPORT_ITEM_FULFILLMENT_TRACKING_INFO";
    Features.EXPORT_PROMOTION_TO_EXTERNAL_SYSTEM = "EXPORT_PROMOTION_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_PRICE_LEVEL_TO_EXTERNAL_SYSTEM = "EXPORT_PRICE_LEVEL_TO_EXTERNAL_SYSTEM";
    Features.EXPORT_PAYMENT_TERMS_TO_EXTERNAL_SYSTEM = "EXPORT_PAYMENT_TERMS_TO_EXTERNAL_SYSTEM";
    return Features;
}());
//# sourceMappingURL=f3_feature_verification.js.map