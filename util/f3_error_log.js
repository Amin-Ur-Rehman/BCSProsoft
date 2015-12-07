/**
 * A custom object to generate a log record within NetSuite
 */
function f3objLog() {
}
/**
 * Bind with External System (a custom record)
 * @type {string}
 */
f3objLog.prototype.externalSystem = "";
/**
 * Bind with External System (a custom record)
 * @type {string}
 */
f3objLog.prototype.externalSystemText = "";
/**
 * Bind with F3Message.RecordType
 * @type {string}
 */
f3objLog.prototype.recordType = "";
/**
 * Record id of internal or external system
 * @type {string}
 */
f3objLog.prototype.recordId = "";
/**
 * Bind with Custom List having options in F3Message.Action
 * @type {string}
 */
f3objLog.prototype.action = "";
/**
 * A user friendly message
 * @type {string}
 */
f3objLog.prototype.message = "";
/**
 * A developer friendly message
 * @type {string}
 */
f3objLog.prototype.messageDetails = "";
/**
 * Bind with Custom List having options in F3Message.Status
 * @type {string}
 */
f3objLog.prototype.status = "";

/**
 * Created by zahmed on 27-May-15.
 *
 * Class Name: F3Message
 *
 * Description:
 * - This script is responsible for maintaining logs history of records which gets imported
 * - and exported to or from external system
 * -
 * Referenced By:
 * -
 * -
 * Dependency:
 * - f3_utility_methods.js
 */
var F3Message = (function () {
    return {
        InternalId: 'customrecord_f3_message_log',
        FieldName: {
            ExternalSystem: 'custrecord_f3_ml_external_system',// list
            RecordType: 'custrecord_f3_ml_record_type',// text
            RecordId: 'custrecord_f3_ml_record_id',// text
            Action: 'custrecord_f3_ml_action',// list
            Message: 'custrecord_f3_ml_message', // long text
            MessageDetails: 'custrecord_f3_ml_message_details',// long text
            Status: 'custrecord_f3_ml_status'//list
        },
        Status: (function () {
            var Status = [];
            Status[Status["AUDIT"] = 1] = "AUDIT";
            Status[Status["DEBUG"] = 2] = "DEBUG";
            Status[Status["ERROR"] = 3] = "ERROR";
            Status[Status[""] = ""] = "";
            return Status;
        })(),
        RecordType: {
            SALES_ORDER: 'Sales Order',
            CUSTOMER: 'Customer',
            ITEM_FULFILLMENT: 'Item Fulfillment',
            CASH_SALE: "Cash Sale",
            INVOICE: "Invoice",
            CASH_REFUND: "Cash Refund"
        },
        Action: (function () {
            var Action = [];
            Action[Action["SALES_ORDER_IMPORT"] = 1] = "SALES_ORDER_IMPORT";
            Action[Action["SALES_ORDER_EXPORT"] = 2] = "SALES_ORDER_EXPORT";
            Action[Action["ITEM_FULFILLMENT_EXPORT"] = 3] = "ITEM_FULFILLMENT_EXPORT";
            Action[Action["CUSTOMER_IMPORT"] = 4] = "CUSTOMER_IMPORT";
            Action[Action["CUSTOMER_EXPORT"] = 5] = "CUSTOMER_EXPORT";
            Action[Action["CUSTOMER_ADDRESS_IMPORT"] = 6] = "CUSTOMER_ADDRESS_IMPORT";
            Action[Action["CUSTOMER_ADDRESS_EXPORT"] = 7] = "CUSTOMER_ADDRESS_EXPORT";
            Action[Action["CASH_SALE_EXPORT"] = 8] = "CASH_SALE_EXPORT";
            Action[Action["INVOICE_EXPORT"] = 9] = "INVOICE_EXPORT";
            Action[Action["CASH_REFUND_EXPORT"] = 10] = "CASH_REFUND_EXPORT";
            Action[Action["ITEM_FULFILLMENT_TRACKING_NUMBER_EXPORT"] = 11] = "ITEM_FULFILLMENT_TRACKING_NUMBER_EXPORT";
            Action[Action[""] = ""] = "";
            return Action;
        })(),
        /**
         * Create or Update a record with specific name
         *
         * @param {object}data
         * @param {int | string} [id] The internal ID for the record.
         * @return {int} The internal ID for the record.
         */
        upsert: function (data, id) {
            try {
                var rec = !!id ? nlapiLoadRecord(this.InternalId, id, null) : nlapiCreateRecord(this.InternalId, null);
                for (var field in data) {
                    rec.setFieldValue(field, data[field]);
                }
                id = nlapiSubmitRecord(rec);
            } catch (e) {
                Utility.logException('F3Message.upsert', e);
            }
            return id;
        },
        /**
         * Perform a record search using filters and columns.
         * @governance 10 units
         * @restriction returns the first 1000 rows in the search
         *
         * @param {nlobjSearchFilter, nlobjSearchFilter[]} [filters] [optional] A single nlobjSearchFilter object - or - an array of nlobjSearchFilter objects.
         * @return {nlobjSearchResult[]} Returns an array of nlobjSearchResult objects corresponding to the searched records.
         *
         */
        lookup: function (filters) {
            var result = [];
            try {
                var cols = [];
                var fils = filters || [];
                for (var i in this.FieldName) {
                    cols.push(new nlobjSearchColumn(this.FieldName[i], null, null));
                }
                result = nlapiSearchRecord(this.InternalId, null, fils, cols) || [];
            } catch (e) {
                Utility.logException('F3Message.lookup', e);
            }
            return result;
        },
        /**
         * A public method which will be invoked from any where
         * @param {f3objLog} logObj
         */
        log: function (logObj) {
            var data = {};
            data[this.FieldName.ExternalSystem] = logObj.externalSystem;
            data[this.FieldName.RecordType] = logObj.recordType;
            data[this.FieldName.RecordId] = logObj.recordId;
            data[this.FieldName.Action] = logObj.action;
            data[this.FieldName.Message] = logObj.message;
            data[this.FieldName.MessageDetails] = logObj.messageDetails;
            data[this.FieldName.Status] = logObj.status;
            this.upsert(data);
        }
    };
})();

/**
 * Sample code for logging into custom table/record
 */

/*

 F3Message.log({
 externalSystem: "1",
 externalSystemText: "externalSystemText",
 recordType: F3Message.RecordType.SALES_ORDER,
 recordId: "SO123456879",
 action: F3Message.Action.SALES_ORDER_IMPORT,
 message: "errorMessage",
 messageDetails: "errorMessageDetails",
 status: F3Message.Status.ERROR
 });

 ErrorLogNotification.log({
 externalSystem: "1",
 externalSystemText: "externalSystemText",
 recordType: F3Message.RecordType.SALES_ORDER,
 recordId: "SO123456879",
 action: F3Message.Action.SALES_ORDER_IMPORT,
 message: "errorMessage",
 messageDetails: "errorMessageDetails",
 status: F3Message.Status.ERROR
 });

 ErrorLogNotification.logAndNotify({
 externalSystem: "1",
 externalSystemText: "externalSystemText",
 recordType: ErrorLogNotification.RecordType.SALES_ORDER,
 recordId: "SO123456879",
 action: ErrorLogNotification.Action.SALES_ORDER_IMPORT,
 message: "errorMessage",
 messageDetails: "errorMessageDetails",
 status: ErrorLogNotification.Status.ERROR
 });

 */

/**
 * Create a copy of object in ErrorLogNotification and extend the object
 * @type {F3Message}
 */
ErrorLogNotification = Object.create(F3Message);

/**
 * Configuration for logging and sending email
 * @type {{Author: null, Recipients: Array, LogInCustomRecord: boolean, SendEmail: boolean}}
 */
ErrorLogNotification.Configuration = {
    Author: -1,
    Recipients: [],
    LogInCustomRecord: false,
    SendEmail: true
};

/**
 * Initilize Configuration
 * @param {number|string} author
 * @param {Array} recipients
 * @param {boolean} logInCustomRecord
 * @param {boolean} sendEmail
 * @constructor
 */
ErrorLogNotification.Init = function (author, recipients, logInCustomRecord, sendEmail) {
    this.Configuration.Author = author;
    this.Configuration.Recipients = recipients;
    this.Configuration.LogInCustomRecord = logInCustomRecord;
    this.Configuration.SendEmail = sendEmail;
};

/**
 * Send Email
 * @param logObj
 */
ErrorLogNotification.sendEmail = function (logObj) {
    var subject;
    var body;

    subject = this.makeSubject(logObj);
    body = this.makeBody(logObj);

    try {
        for (var i in this.Configuration.Recipients) {
            nlapiSendEmail(this.Configuration.Author, this.Configuration.Recipients[i], subject, body, null, null, null, null, null, null);
        }
    } catch (e) {
        Utility.logException("ErrorLogNotification.sendEmail", e);
    }
};

/**
 * Create log record and Send Email
 * @param {f3objLog} logObj
 */
ErrorLogNotification.logAndNotify = function (logObj) {
    if (this.Configuration.LogInCustomRecord) {
        this.log(logObj);
    }

    if (this.Configuration.SendEmail) {
        this.sendEmail(logObj);
    }
};

/**
 * Email subject template
 * @return {string}
 */
ErrorLogNotification.templateEmailSubject = function () {
    return "<STATUS> | <ACTION> | <RECORD_ID>";
};

/**
 * Email body template
 * @return {string}
 */
ErrorLogNotification.templateEmailBody = function () {
    var body = "";


    body += "<table>";

    body += "   <tr>";
    body += "       <td>External System:</td>";
    body += "       <td><EXTERNAL_SYSTEM_TEXT></td>";
    body += "   </tr>";

    body += "   <tr>";
    body += "       <td>Record Type: </td>";
    body += "       <td><RECORD_TYPE></td>";
    body += "   </tr>";

    body += "   <tr>";
    body += "       <td>Record Id: </td>";
    body += "       <td><RECORD_ID></td>";
    body += "   </tr>";

    body += "   <tr>";
    body += "       <td>Action: </td>";
    body += "       <td><ACTION></td>";
    body += "   </tr>";

    body += "   <tr>";
    body += "       <td>Status: </td>";
    body += "       <td><STATUS></td>";
    body += "   </tr>";

    body += "   <tr>";
    body += "       <td>Message: </td>";
    body += "       <td><MESSAGE></td>";
    body += "   </tr>";

    body += "   <tr>";
    body += "       <td>Message Details: </td>";
    body += "       <td><MESSAGE_DETAILS></td>";
    body += "   </tr>";

    body += "</table>";

    return body;
};

/**
 * Make email subject
 * @param logObj
 * @return {string}
 */
ErrorLogNotification.makeSubject = function (logObj) {
    var subject = this.templateEmailSubject();

    subject = subject.replace(/<STATUS>/g, this.Status[logObj.status]);
    subject = subject.replace(/<ACTION>/g, this.Action[logObj.action]);
    subject = subject.replace(/<RECORD_ID>/g, logObj.recordId);

    return subject;
};
/**
 * Make email body
 * @param logObj
 * @return {string}
 */
ErrorLogNotification.makeBody = function (logObj) {
    var body = this.templateEmailBody();

    body = body.replace(/<EXTERNAL_SYSTEM_TEXT>/g, logObj.externalSystemText);
    body = body.replace(/<RECORD_TYPE>/g, logObj.recordType);
    body = body.replace(/<RECORD_ID>/g, logObj.recordId);
    body = body.replace(/<ACTION>/g, this.Action[logObj.action]);
    body = body.replace(/<STATUS>/g, this.Status[logObj.status]);
    body = body.replace(/<MESSAGE>/g, logObj.message);
    body = body.replace(/<MESSAGE_DETAILS>/g, logObj.messageDetails);

    return body;
};

F3ErrorCodes = (function () {
    return {
        CREATE_RECORD: "CREATE_RECORD",
        ORDER_EXIST: "ORDER_EXIST",
        ITEM_MAPPING: "ITEM_MAPPING",
        PERMISSION: "PERMISSION",
        RECORD_DOES_NOT_EXIST: "RECORD_DOES_NOT_EXIST",
        RECORD_EXPORT: "RECORD_EXPORT",
        FEATURE_PERMISSION: "FEATURE_PERMISSION",
        FOLIO3: "FOLIO3",
        ALLZOHU: "ALLZOHU",
        FETCHING_ORDER_DETAIL: "FETCHING_ORDER_DETAIL"
    };
})();