/**
 * Created by zahmed on 15-Oct-15.
 */

class FeatureVerification {
    static cleanPermissions(permissions) {
        if (!permissions) {
            return [];
        }
        if (!(permissions instanceof Array)) {
            return [];
        }
        return permissions;
    }

    static isPermitted(featureName:string, permissions:any = []) {
        var isAllowed = false;

        permissions = FeatureVerification.cleanPermissions(permissions);

        if (!!featureName) {
            if (permissions.indexOf(featureName) > -1) {
                isAllowed = true;
            }
        }

        return isAllowed;
    }
}

class Features {
    public static IMPORT_SO_FROM_EXTERNAL_SYSTEM:string = "IMPORT_SO_FROM_EXTERNAL_SYSTEM";
    public static UPDATE_SO_FROM_EXTERNAL_SYSTEM:string = "UPDATE_SO_FROM_EXTERNAL_SYSTEM";
    public static IMPORT_SO_GUEST_CUSTOMER:string = "IMPORT_SO_GUEST_CUSTOMER";
    public static IMPORT_SO_DUMMMY_ITEM:string = "IMPORT_SO_DUMMMY_ITEM";
    public static EXPORT_SO_TO_EXTERNAL_SYSTEM:string = "EXPORT_SO_TO_EXTERNAL_SYSTEM";
    public static EXPORT_SO_GUEST_CUSTOMER:string = "EXPORT_SO_GUEST_CUSTOMER";
    public static EXPORT_SO_DUMMMY_ITEM:string = "EXPORT_SO_DUMMMY_ITEM";
    public static EXPORT_SO_SYSTEM_NOTES:string = "EXPORT_SO_SYSTEM_NOTES";
    public static CANCEL_SO_FROM_EXTERNAL_SYSTEM:string = "CANCEL_SO_FROM_EXTERNAL_SYSTEM";
    public static CANCEL_SO_TO_EXTERNAL_SYSTEM:string = "CANCEL_SO_TO_EXTERNAL_SYSTEM";
    public static EXPORT_CUSTOMER_TO_EXTERNAL_SYSTEM:string = "EXPORT_CUSTOMER_TO_EXTERNAL_SYSTEM";
    public static IMPORT_CUSTOMER_FROM_EXTERNAL_SYSTEM:string = "IMPORT_CUSTOMER_FROM_EXTERNAL_SYSTEM";
    public static UPDATE_CUSTOMER_IF_EXISTS:string = "UPDATE_CUSTOMER_IF_EXISTS";
    public static EXPORT_ITEM_TO_EXTERNAL_SYSTEM:string = "EXPORT_ITEM_TO_EXTERNAL_SYSTEM";
    public static EXPORT_ITEM_TIERED_PRICING:string = "EXPORT_ITEM_TIERED_PRICING";
    public static UPDATE_ITEM_TO_EXTERNAL_SYSTEM:string = "UPDATE_ITEM_TO_EXTERNAL_SYSTEM";
    public static EXPORT_INVOICE_TO_EXTERNAL_SYSTEM:string = "EXPORT_INVOICE_TO_EXTERNAL_SYSTEM";
    public static EXPORT_CASH_REFUND_TO_EXTERNAL_SYSTEM:string = "EXPORT_CASH_REFUND_TO_EXTERNAL_SYSTEM";
    public static EXPORT_ITEM_FULFILLMENT_TO_EXTERNAL_SYSTEM:string = "EXPORT_ITEM_FULFILLMENT_TO_EXTERNAL_SYSTEM";
    public static EXPORT_ITEM_FULFILLMENT_TRACKING_INFO:string = "EXPORT_ITEM_FULFILLMENT_TRACKING_INFO";
    public static EXPORT_PROMOTION_TO_EXTERNAL_SYSTEM:string = "EXPORT_PROMOTION_TO_EXTERNAL_SYSTEM";
    public static EXPORT_PRICE_LEVEL_TO_EXTERNAL_SYSTEM:string = "EXPORT_PRICE_LEVEL_TO_EXTERNAL_SYSTEM";
    public static EXPORT_PAYMENT_TERMS_TO_EXTERNAL_SYSTEM:string = "EXPORT_PAYMENT_TERMS_TO_EXTERNAL_SYSTEM";
}


