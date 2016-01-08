/*
 Functions:
 1) storeMessage(customerNsId,subject,message)
 Comment: It stores the given message to the customer/lead/prospect/contact/vendor/partner/employee message archive (Message Tab).

 2) isBlankOrNull(str)
 Comment: It returns true if the given string is not 'undefined', null, empty, else it returns false
 */

function isBlankOrNull(str) {
    if (typeof(str) == 'undefined' || str == 'undefined' || str == null || str == '') {
        return true;
    }
    else {
        return false;
    }
}

function getCurrentDate() {
    var dt = new Date();
    return (dt.getMonth() + 1) + '/' + dt.getDate() + '/' + dt.getFullYear();
}

function getCurrentDateTime() {
    var dt = new Date();
    return (dt.getMonth() + 1) + '/' + dt.getDate() + '/' + dt.getFullYear() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();
    //+ '.' + dt.getMilliseconds();
}

function fixPhoneNumber(p) {
    if (!isBlankOrNull(p)) {
        p = replaceAll(p, '-', '');
        p = replaceAll(p, ' ', '');
        p = replaceAll(p, '(', '');
        p = replaceAll(p, ')', '');
        p = replaceAll(p, '.', '');
        p = removePrefixZeros(p);
        return p;
    }
    else {
        return p;
    }
}

function replaceAll(str, str1, str2) {
    while (str.indexOf(str1) >= 0) {
        str = str.replace(str1, str2);
    }
    return str;
}

function removePrefixZeros(p) {
    while (p.indexOf('0') == 0) {
        p = p.substring(1);
    }
    return p;
}

function createReplyLog(receipt, messageId, message) {
    try {
        var rec = nlapiCreateRecord('customrecord_mm_sms_reply');
        var replyDate = getCurrentDateTimeTz(receipt.popupOffset, receipt.dayLight);
        rec.setFieldValue('custrecord_mm_sms_reply_smsreceiptid', receipt.internalId);
        rec.setFieldValue('custrecord_mm_sms_reply_replymsgid', messageId);
        rec.setFieldValue('custrecord_mm_sms_reply_message', message);
        rec.setFieldValue('custrecord_mm_sms_reply_date', replyDate);
        nlapiSubmitRecord(rec, true);
    }
    catch (exp) {
        logError('ERROR', 'createReplyLog', exp);
    }
}

function fixLineBreak(str, placeBR) {
    if (placeBR) {
        str = str.replace(/(\r\n|\n|\r)/gm, '_-_');
    }
    else {
        while (str.indexOf('_-_') >= 0) {
            str = str.replace('_-_', '\n');
        }
    }
    return str;
}

function replaceBR(str) {
    if (!isBlankOrNull(str)) {
        while (str.indexOf('&lt;BR&gt;') >= 0) {
            str = str.replace('&lt;BR&gt;', '\n');
        }
        while (str.indexOf('&lt;br&gt;') >= 0) {
            str = str.replace('&lt;br&gt;', '\n');
        }
        while (str.indexOf('&lt;BR/&gt;') >= 0) {
            str = str.replace('&lt;BR/&gt;', '\n');
        }
        while (str.indexOf('&lt;br/&gt;') >= 0) {
            str = str.replace('&lt;br/&gt;', '\n');
        }
        while (str.indexOf('<BR>') >= 0) {
            str = str.replace('<BR>', '\n');
        }
        while (str.indexOf('<br>') >= 0) {
            str = str.replace('<br>', '\n');
        }
        while (str.indexOf('<BR/>') >= 0) {
            str = str.replace('<BR/>', '\n');
        }
        while (str.indexOf('<br/>') >= 0) {
            str = str.replace('<br/>', '\n');
        }
    }
    return str;
}

function getPhonePrefix(nsId, recordType, ph) {
    var dprefix = '';
    var dprefix1 = '';
    var countryCode = '';
    var mmRecFields = [];
    var mmRecFieldsNonOp = [];

    if (recordType == 'opportunity') {
        mmRecFields = mmRecFields.concat(['st__firstname', 'st__lastname', 'st__entityid', 'st__mobilephone', 'st__phone', 'st__homephone', 'st__altphone', 'st__billcountry', 'st__shipcountry', 'st__country']);
        recs = getEntityRecords([nsId], mmRecFields, recordType);
    }
    else {
        mmRecFieldsNonOp = mmRecFields.concat(['altname', 'firstname', 'lastname', 'entityid', 'mobilephone', 'phone', 'homephone', 'altphone', 'billcountry', 'shipcountry', 'country']);
        try {
            recs = getEntityRecords([nsId], mmRecFieldsNonOp, recordType);
        }
        catch (exp) {
            mmRecFieldsNonOp = mmRecFields.concat(['firstname', 'lastname', 'entityid', 'mobilephone', 'phone', 'homephone', 'altphone', 'billcountry', 'shipcountry', 'country']);
            recs = getEntityRecords([nsId], mmRecFieldsNonOp, recordType);
        }
    }
    if (recs && recs.length > 0) {
        countryCode = getCountryObjSyntax(recs[0]);
        if (countryCode == null) {
            countryCode = nlapiGetContext().getSetting('SCRIPT', 'custscript_sms_defaultdialingcountry');
            countryCode = getCountryCodeByNsId(countryCode);
        }
        if (countryCode != null) {
            dprefix = getInternationalDialingPrefix(countryCode);
            if (dprefix.length > 1) {
                dprefix1 = dprefix.substring(1);
            }
            else {
                dprefix1 = '';
            }
            if (ph == null) {
                phone = getMobileNumberObjSyntax(recs[0]);
            }
            else {
                phone = ph;
            }
            if (phone != null) {
                phone = fixPhoneNumber(phone);
                if (phone.indexOf(dprefix) == 0 || phone.indexOf('+') == 0) {
                    dprefix = '';
                }
                else if (dprefix1.length > 0 && phone.indexOf(dprefix1) == 0) {
                    dprefix = '+';
                }
            }
        }
    }
    return dprefix;
}

function storeMessage(customerNsId, subject, message, empNsId) {
    var msg = nlapiCreateRecord('message');
    msg.setFieldValue('author', nlapiGetUser());
    msg.setFieldValue('entity', customerNsId);
    msg.setFieldValue('recipient', customerNsId);
    msg.setFieldValue('message', message);
    //msg.setFieldValue('messageType', 'SMS');
    msg.setFieldValue('subject', subject);
    nlapiSubmitRecord(msg, true);

    var rec = getEntityRecord(customerNsId);
    if (rec != null) {
        try {
            nlapiSubmitField(rec.getRecordType(), rec.getId(), 'custentity_mm_lastsmssentby', nlapiGetUser());
        } catch (e) {
        }
        try {
            nlapiSubmitField(rec.getRecordType(), rec.getId(), 'custentity_mm_lastsmsmessage', message);
        } catch (e) {
        }
    }
}

function addZeroes(vle, requiredLength) {
    vle = vle.toString();
    var i = vle.length;

    while (i < requiredLength) {

        vle = '0' + vle;
        i++;
    }

    return vle;
}

function logEntry(jobId, state, description) {
    var rec = nlapiCreateRecord('customrecord_magentoconnectorlog');
    rec.setFieldValue('custrecord_jobid', jobId);
    rec.setFieldValue('custrecord_state', state);
    rec.setFieldValue('custrecord_description', description);
    nlapiSubmitRecord(rec);

}


function getUpdateDate(days) {
    var currentDate = new Date();
    var soUpdateDate;

    soUpdateDate = nlapiAddDays(currentDate, days);

    //soUpdateDate=addZeroes(soUpdateDate.getDate(),2) + '-' + addZeroes((soUpdateDate.getMonth()+1),2) + '-' +  soUpdateDate.getFullYear() + ' ' + soUpdateDate.getHours()  + ':'+ soUpdateDate.getMinutes() + ':' + '00';

    soUpdateDate = soUpdateDate.getFullYear() + '-' + addZeroes((soUpdateDate.getMonth() + 1), 2) + '-' + addZeroes(soUpdateDate.getDate(), 2) + ' ' + addZeroes(soUpdateDate.getHours(), 2) + ':' + addZeroes(soUpdateDate.getMinutes(), 2) + ':' + '00';

    return soUpdateDate
}

function getBlankForNull(data) {
    var returnValue;

    if (isBlankOrNull(data)) returnValue = ''; else returnValue = data;

    return returnValue;

}

/**
 * Check either to retry synchronization process
 * @param message
 * @param recordType
 * @param recordObj
 */
function retrySync(providedMessage, recordType, recordObj) {
    var result = {status: false, recordObj: null};
    var statusObj = checkRetrySyncNeeded(providedMessage);
    //Utility.logDebug('statusObj.status', statusObj.status);
    if(statusObj.status) {
        result.status = true;
        result.recordObj = getModifiedObject(statusObj.message, recordType, recordObj);
    }
    return result;
}

/**
 * Check either need to retry synchronization process or not
 * @param message
 */
function checkRetrySyncNeeded(providedMessage) {
    var result = {status: false, message: ''};
    var messages = getRetryProcessMessagesList();
    for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        providedMessage = providedMessage.toLowerCase();
        //Utility.logDebug('providedMessage', providedMessage);
        //Utility.logDebug('message', message.toLowerCase());
        if(message.toLowerCase().indexOf(providedMessage) > -1) {
            result.status = true;
            result.message = message;
            break;
        }
    }
    return result;
}

/**
 * Get retry messages list
 * @returns {Array}
 */
function getRetryProcessMessagesList() {
    var messagesArray = [];
    messagesArray.push(ConnectorConstants.RetryAction.Messages.SpecifyShippingMethod);
    return messagesArray;
}

function getModifiedObject(message, recordType, recordObj) {
    if(recordType == ConnectorConstants.RetryAction.RecordTypes.SalesOrder) {
        //Utility.logDebug('getModifiedObject.message', message);
        if(message == ConnectorConstants.RetryAction.Messages.SpecifyShippingMethod) {
            //Utility.logDebug('setting default shipmentMethod', ConnectorConstants.DefaultValues.shippingMethod);
            var data = {};
            data.shippingCountry = getShippingCountry(recordObj.customer.addresses);
            //Set default shipping method
            recordObj.shipmentInfo.shipmentMethod = getDefaultShippingMethod(data);
        }
    }

    return recordObj;
}

/**
 * Get default shipping method
 * @param data
 * @returns {string}
 */
function getDefaultShippingMethod(data) {
    // @Zee: Plz check if it is Magento Specific or Store Specific and
    // don't use this file for future, if any method is needed from here move 
    // it to Utility file or 
    var defaultShippingMethod = '';
    /*if(data.shippingCountry == 'US') {
        defaultShippingMethod = ConnectorConstants.DefaultValues.shippingMethod.UPS_GND;
    } else {
        defaultShippingMethod = ConnectorConstants.DefaultValues.shippingMethod.UPS_XPD;
    }*/
    // hack for the orders shipping method
    defaultShippingMethod = ConnectorConstants.DefaultValues.shippingMethod.FLAT_RATE;
    return defaultShippingMethod;
}

/**
 * Get shipping country from addresses array
 * @param addresses
 * @returns {string}
 */
function getShippingCountry(addresses) {
    var shippingCountry = '';
    for (var i = 0; i < addresses.length; i++) {
        var address = addresses[i];
        if(address.mode = 'shipping') {
            shippingCountry = address.country;
            break;
        }
    }
    return shippingCountry;
}