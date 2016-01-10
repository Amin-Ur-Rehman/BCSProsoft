var ScheduledScriptConstant = {
    Minutes: 50,
    RemainingUsage: 1000,
    StartTime: (new Date()).getTime()
};

var errorMsg = '';

function customerExport() {

    if (MC_SYNC_CONSTANTS.isValidLicense()) {

        var context = nlapiGetContext();

        var scheduleScriptInvokedFormUserEvent = context.getSetting('SCRIPT', ConnectorConstants.ScheduleScriptInvokedFormUserEvent);
        Utility.logDebug('scheduleScriptInvokedFormUserEvent', scheduleScriptInvokedFormUserEvent);

        // inititlize constants
        ConnectorConstants.initialize();
        // getting configuration
        var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;

        var customerIds;
        var customerRecord;
        var requsetXML;
        var responseMagento;
        var magentoResposeOnCustomer;
        var usageRemaining;
        var magentoIdObjArrStr;
        var nsCustomerUpdateStatus;
        var customerAddresses;
        var allAddressedSynched;
        var externalSystemArr = [];
        var scannedAddressForMagento;
        var magentoReferences;
        var customerSynched;
        var magentoStoreAndCustomer;


        externalSystemConfig.forEach(function (store) {
            ConnectorConstants.CurrentStore = store;
            // initialize configuration for logging in custom record and sending error emails
            ConnectorCommon.initiateEmailNotificationConfig();
            ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
            var sessionID = MagentoWrapper.getSessionIDFromServer(store.userName, store.password);
            if (!sessionID) {
                Utility.logDebug('empty sessionID', 'sessionID is empty');
                return;
            }
            store.sessionID = sessionID;
            // push store object after getting id for updating items in this store
            externalSystemArr.push(store);

        });

        if (externalSystemArr.length === 0) {
            Utility.logDebug('Customer Export Script', 'Customer Export is not enabled');
            return;
        }

        try {

            if (!!scheduleScriptInvokedFormUserEvent && scheduleScriptInvokedFormUserEvent == 'T') {
                customerIds = CUSTOMER.getCustomersSubmittedFromUserEvent();
            } else {
                //Get ids of all customer which has custentity_magentosync_dev (Magento Sync) field marked No
                //customerIds = CUSTOMER.getCustomers();
            }
            //Is Customer(s) Exists for Sync
            if (customerIds != null && customerIds.length > 0) {
                for (var c = 0; c < customerIds.length; c++) {
                    nlapiLogExecution('audit', 'Customer:' + customerIds[c].internalId + '  S.No:' + c + ' Started');
                    Utility.logDebug('Customer ' + customerIds[c].internalId);
                    errorMsg = '';
                    try {
                        externalSystemArr.forEach(function (store) {
                            try {
                                magentoReferences = customerIds[c].magentoCustomerIds;
                                magentoStoreAndCustomer = getStoreCustomerIdAssociativeArray(magentoReferences);
                                //Decide whether to Create or Update Customer
                                if (isBlankOrNull(magentoReferences) || isBlankOrNull(magentoStoreAndCustomer[store.systemId]) || magentoStoreAndCustomer[store.systemId] === '0') {
                                    Utility.logDebug('Customer Create Block ' + magentoReferences);
                                    customerSynched = createCustomerInMagento(customerIds[c], store);
                                    Utility.logDebug('End Create Block ');
                                } else {
                                    Utility.logDebug('Customer Update Block ');
                                    //Update Customer for Current Store
                                    customerSynched = updateCustomerInMagento(customerIds[c], store, magentoStoreAndCustomer[store.systemId], magentoReferences);
                                    Utility.logDebug('End Update Block ');
                                }
                            } catch (ex) {
                                Utility.logDebug('Internal Catch Block, Iternation failed for Customer + Store : ' + customerIds[c].internalId + ' StoreId:' + store.systemId, ex.toString());
                            }
                        });

                        if (customerSynched) {
                            nsCustomerUpdateStatus = CUSTOMER.setCustomerMagentoSync(customerIds[c].internalId);
                            if (!!scheduleScriptInvokedFormUserEvent && scheduleScriptInvokedFormUserEvent == 'T') {
                                RecordsToSync.markProcessed(customerIds[c].customRecordInternalId, RecordsToSync.Status.Processed);
                            }
                        }
                        else {

                            if (isBlankOrNull(errorMsg))
                                errorMsg = 'Unknown Error';

                            CUSTOMER.setCustomerMagentoSync_Error(customerIds[c].internalId, errorMsg);
                        }

                        if (rescheduleIfRequired(null)) {
                            return;
                        }

                    } catch (ex) {

                        CUSTOMER.setCustomerMagentoSync_Error(customerIds[c].internalId, ex.toString());

                        Utility.logDebug('Internal Catch Block, Iternation failed for Customer : ' + customerIds[c].internalId, ex.toString());

                    }

                    nlapiLogExecution('audit', 'Customer:' + customerIds[c].internalId + '  S.No:' + c + ' Ended');

                }
            } else {
                Utility.logDebug('No Customers found to sync');
            }
        } catch (ex) // main Try

        {

            Utility.logDebug('Catch Block', ex.toString());

        }


    }


}


function getStoreCustomerIdAssociativeArray(data) {
    var storeIdCustomerIdArray;
    var associativeArray = [];

    if (!!data) {
        storeIdCustomerIdArray = JSON.parse(data);

        if (!!storeIdCustomerIdArray && storeIdCustomerIdArray.length > 0) {
            for (var i = 0; i < storeIdCustomerIdArray.length; i++) {
                associativeArray[storeIdCustomerIdArray[i].StoreId] = storeIdCustomerIdArray[i].MagentoId;
            }
        }

    }

    return associativeArray;
}


function createCustomerInMagento(nsCustomerObject, store, existingMagentoReferenceInfo) {
    var customerRecord = CUSTOMER.getCustomer(nsCustomerObject.internalId, store);
    var responseMagento;
    var customerSynched = false;
    var createOrUpdateMagentoJSONRef = 'create';

    if (!!customerRecord) {
        responseMagento = ConnectorConstants.CurrentWrapper.upsertCustomer(customerRecord, store, "create");
        Utility.logDebug('createCustomerInMagento', JSON.stringify(responseMagento));
        if (!!responseMagento && !!responseMagento.status && responseMagento.status) {

            if (!!existingMagentoReferenceInfo) {
                createOrUpdateMagentoJSONRef = 'update';
            }

            var magentoIdObjArrStr = ConnectorCommon.getMagentoIdObjectArrayString(store.systemId, responseMagento.magentoCustomerId, createOrUpdateMagentoJSONRef, existingMagentoReferenceInfo, customerRecord.password);
            var magentoStores = ConnectorCommon.getStoresArrayFromMagentoJsonId(magentoIdObjArrStr);
            Utility.logDebug("magentoStores", magentoStores.join(","));
            var nsCustomerUpdateStatus = CUSTOMER.setCustomerMagentoId(magentoIdObjArrStr, nsCustomerObject.internalId, magentoStores);

            //Address Sync
            if (nsCustomerUpdateStatus) {
                if (ConnectorConstants.CurrentWrapper.requiresAddressCall()) {
                    customerSynched = createAddressesInMagento(customerRecord, store, responseMagento.magentoCustomerId);
                } else {
                    customerSynched = true;
                }
                Utility.logDebug("createCustomerInMagento", "customerSynched: " + customerSynched);
                if (!customerSynched) {
                    throw new CustomException({
                        code: F3Message.Action.CUSTOMER_EXPORT,
                        message: "Sync Newly Created Customer Addresses from NetSuite to Magento",
                        recordType: "customer",
                        recordId: responseMagento.magentoCustomerId,
                        system: "Magento",
                        exception: null,
                        action: "Export Customer Addresses from NetSuite to Magento"
                    });
                    //Utility.throwException(F3Message.Action.CUSTOMER_ADDRESS_EXPORT, "Error occurred in creating customer addresses in Magento. Magento Customer Id: " + responseMagento.magentoCustomerId);
                }
            }
        } else {
            errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
            Utility.logDebug('errored responseMagento ', responseMagento.faultCode + '    ' + responseMagento.faultString);
        }
    }

    return customerSynched;
}

function updateCustomerInMagento(nsCustomerObject, store, magentoId, existingMagentoReferenceInfo) {

    var customerRecord = CUSTOMER.getCustomer(nsCustomerObject.internalId, store);
    var responseMagento;
    var customerSynched = false;

    if (!!customerRecord) {
        customerRecord.magentoId = magentoId;
        responseMagento = ConnectorConstants.CurrentWrapper.upsertCustomer(customerRecord, store, "update");
        Utility.logDebug('updateCustomerInMagento', JSON.stringify(responseMagento));
        if (ConnectorConstants.CurrentWrapper.requiresAddressCall()) {
            if (!!responseMagento && !!responseMagento.status && responseMagento.status && responseMagento.updated == "true") {
                //Address Sync
                customerSynched = updateAddressesInMagento(customerRecord, store, magentoId);

            } else {
                var errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
                Utility.logDebug('responseMagento ', errorMsg);
            }
        } else {
            customerSynched = true;
        }
    }

    return customerSynched;
}


function createAddressesInMagento(customerRecordObject, store, magentoCustomerId) {

    var customerAddresses = customerRecordObject.addresses;
    var scannedAddressForMagento;
    var allAddressedSynched = true;

    for (var adr = 0; adr < customerAddresses.length; adr++) {
        scannedAddressForMagento = ConnectorCommon.getScannedAddressForMagento(customerAddresses[adr]);
        if (scannedAddressForMagento) {
            allAddressedSynched = createSingleAddressInMagento(customerRecordObject, customerAddresses[adr], (adr + 1), scannedAddressForMagento, magentoCustomerId, store);
        }
    }

    return allAddressedSynched;
}


function updateAddressesInMagento(customerRecordObject, store, magentoCustomerId) {
    var customerAddresses = customerRecordObject.addresses;
    var scannedAddressForMagento;
    var allAddressedSynched = true;
    var currentAddressStoresInfo;
    var magentoIdStoreRef;

    for (var adr = 0; adr < customerAddresses.length; adr++) {

        scannedAddressForMagento = ConnectorCommon.getScannedAddressForMagento(customerAddresses[adr]);

        if (scannedAddressForMagento) {
            magentoIdStoreRef = customerAddresses[adr].magentoIdStoreRef;
            currentAddressStoresInfo = getStoreCustomerIdAssociativeArray(magentoIdStoreRef);

            if (isBlankOrNull(magentoIdStoreRef) || isBlankOrNull(currentAddressStoresInfo[store.systemId]) || currentAddressStoresInfo[store.systemId] === '0') {
                //Create
                allAddressedSynched = createSingleAddressInMagento(customerRecordObject, customerAddresses[adr], (adr + 1), scannedAddressForMagento, magentoCustomerId, store);

            } else if (currentAddressStoresInfo[store.systemId] !== '-1') {
                //Address Update
                allAddressedSynched = UpdateSingleAddressInMagento(customerRecordObject, customerAddresses[adr], (adr + 1), scannedAddressForMagento, magentoCustomerId, store, currentAddressStoresInfo);
            }
        }
    }

    return allAddressedSynched;
}


function createSingleAddressInMagento(customerRecordObject, customerAddressObj, customerAddressLineNo, scannedAddressForMagento, magentoCustomerId, store) {
    var addressCreated = true;
    var responseMagento;
    var errorMsg = "";

    responseMagento = ConnectorConstants.CurrentWrapper.upsertCustomerAddress(scannedAddressForMagento, store, magentoCustomerId, "create");

    if (!responseMagento.status) {
        errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
        addressCreated = false;
        Utility.logDebug("Address is not exported", "Error: " + errorMsg + ". " + JSON.stringify(scannedAddressForMagento));
    }

    return addressCreated;
}


function UpdateSingleAddressInMagento(customerRecordObject, customerAddressObj, customerAddressLineNo, scannedAddressForMagento, magentoCustomerId, store, currentAddressStoresInfo) {
    var addressCreated = true;
    var responseMagento;
    var errorMsg = "";

    responseMagento = ConnectorConstants.CurrentWrapper.upsertCustomerAddress(scannedAddressForMagento, store, magentoCustomerId, "update");

    if (!responseMagento.status) {
        errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
        Utility.logDebug("Address is not exported", "Error: " + errorMsg + ". " + JSON.stringify(scannedAddressForMagento));
        addressCreated = false;
    }

    return addressCreated;
}


// check if the script is required to be scheduled
function rescheduleIfRequired(params) {
    var context = nlapiGetContext();
    var endTime;
    var minutes;

    endTime = (new Date()).getTime();
    minutes = Math.round(((endTime - ScheduledScriptConstant.StartTime) / (1000 * 60)) * 100) / 100;

    if (context.getRemainingUsage() < ScheduledScriptConstant.RemainingUsage) {
        nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), params);
        return true;
    }

    if (minutes > ScheduledScriptConstant.Minutes) {
        nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), params);
        return true;
    }

    return false;
}