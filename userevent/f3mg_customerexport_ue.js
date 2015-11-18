/**
 * Created by sameer on 08/31/2015.
 * Description:
 * - This script is responsible for exporting customer to Magento store instantly
 * -
 * Referenced By:
 * -
 * Dependencies:
 * -
 * -
 */


var errorMsg = '';

function customerExportAfterSubmit(type) {
    try {
        Utility.logDebug('Customer Export Script entry', 'type: ' + type);
        if (type.toString() === 'create' || type.toString() === 'edit') {

            // checking license validation
            if (!MC_SYNC_CONSTANTS.isValidLicense()) {
                Utility.logEmergency('Validate', 'License has expired');
                return;
            }

            // inititlize constants
            ConnectorConstants.initialize();
            // getting configuration
            var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
            // it is for customer sync
            var externalSystemArr = [];

            externalSystemConfig.forEach(function (store) {
                ConnectorConstants.CurrentStore = store;
                ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                ConnectorConstants.CurrentWrapper.initialize(store);
                // Check for feature availability
                if (!FeatureVerification.isPermitted(Features.EXPORT_CUSTOMER_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                    Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_CUSTOMER_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                    return;
                }
                var sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password);
                if (!sessionID) {
                    Utility.logDebug('sessionID', 'sessionID is empty');
                    return;
                }
                store.sessionID = sessionID;
                // push store object after getting id for updating items in this store
                externalSystemArr.push(store);
            });

            if (externalSystemArr.length === 0) {
                Utility.logDebug('Customer Export Script', 'Store(s) are not enabled');
                return;
            }

            var nsCustomerUpdateStatus;
            var magentoReferences;
            var customerSynched;
            var magentoStoreAndCustomer;

            //get Customer to be synced
            var customerId = CUSTOMER.getCustomerForInstantSync(nlapiGetRecordId());// why is it so necessary?
            Utility.logDebug('customerId', JSON.stringify(customerId));
            if (!!customerId && customerId.length > 0) {
                customerId = customerId[0];
                Utility.logDebug('Customer ', customerId.internalId);
                if (Utility.isBlankOrNull(customerId.externalSystems)) {
                    customerId.externalSystems = [];
                } else {
                    customerId.externalSystems = customerId.externalSystems.split(',');
                }
                errorMsg = '';
                try {
                    externalSystemArr.forEach(function (store) {
                        try {
                            ConnectorConstants.CurrentStore = store;
                            ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                            ConnectorConstants.CurrentWrapper.initialize(store);

                            magentoReferences = customerId.magentoCustomerIds;
                            magentoStoreAndCustomer = getStoreCustomerIdAssociativeArray(magentoReferences);
                            //Decide whether to Create or Update Customer
                            if (isBlankOrNull(magentoReferences) || isBlankOrNull(magentoStoreAndCustomer[store.systemId]) || magentoStoreAndCustomer[store.systemId] === '0') {
                                Utility.logDebug('Customer Create Block ', magentoReferences);
                                // check if current store is selected in customer record
                                if (customerId.externalSystems.indexOf(store.systemId) > -1) {
                                    customerSynched = createCustomerInMagento(customerId, store);
                                } else {
                                    Utility.logDebug("store is not selected", store.systemId);
                                }
                                Utility.logDebug('End Create Block ', "");
                            } else {
                                Utility.logDebug('Customer Update Block ', "");
                                //Update Customer for Current Store
                                customerSynched = updateCustomerInMagento(customerId, store, magentoStoreAndCustomer[store.systemId], magentoReferences);
                                Utility.logDebug('End Update Block ', "");
                            }
                        } catch (ex) {
                            Utility.logDebug('Internal Catch Block, Iternation failed for Customer + Store : ' + customerId.internalId + ' StoreId:' + store.systemId, ex.toString());
                        }
                    });
                    if (customerSynched) {
                        nsCustomerUpdateStatus = CUSTOMER.setCustomerMagentoSync(customerId.internalId);
                    } else {
                        if (isBlankOrNull(errorMsg)) {
                            errorMsg = 'Unknown Error';
                        }
                        CUSTOMER.setCustomerMagentoSync_Error(customerId.internalId, errorMsg);
                    }
                } catch (ex) {
                    CUSTOMER.setCustomerMagentoSync_Error(customerId.internalId, ex.toString());
                    Utility.logDebug('Internal Catch Block, Iternation failed for Customer : ' + customerId.internalId, ex.toString());
                }
            }


        } else {
            Utility.logDebug('In starter Else block', '');
        }
    } catch (ex) {
        Utility.logDebug('Catch Block', ex.toString());
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


/*
 function createCustomerInMagento(nsCustomerObject, store, existingMagentoReferenceInfo) {

 var customerRecord = CUSTOMER.getCustomer(nsCustomerObject.internalId, store);
 var requsetXML;
 var responseMagento;
 var customerSynched = false;
 var createOrUpdateMagentoJSONRef = 'create';
 if (!!customerRecord) {
 requsetXML = CUSTOMER.getMagentoCreateCustomerRequestXML(customerRecord, store.sessionID);
 Utility.logDebug('customer_requsetXML ', requsetXML);
 Utility.logDebug('store_wahaj ', JSON.stringify(store));
 responseMagento = XmlUtility.validateCustomerExportOperationResponse(XmlUtility.soapRequestToMagentoSpecificStore(requsetXML, store), 'create');
 Utility.logDebug('responseMagento_wahaj ', JSON.stringify(responseMagento));
 if (!!responseMagento && !!responseMagento.status && responseMagento.status) {
 if (!!existingMagentoReferenceInfo)
 createOrUpdateMagentoJSONRef = 'update';
 magentoIdObjArrStr = ConnectorCommon.getMagentoIdObjectArrayString(store.systemId, responseMagento.magentoCustomerId, createOrUpdateMagentoJSONRef, existingMagentoReferenceInfo, customerRecord.password);
 nsCustomerUpdateStatus = CUSTOMER.setCustomerMagentoId(magentoIdObjArrStr, nsCustomerObject.internalId);
 customerRecord = CUSTOMER.getCustomer(nsCustomerObject.internalId, store);
 //Address Sync
 if (nsCustomerUpdateStatus) {
 customerSynched = createAddressesInMagento(customerRecord, store, responseMagento.magentoCustomerId);
 }
 nlapiSubmitRecord(customerRecord.nsObj);
 } else {
 errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
 Utility.logDebug('errored responseMagento ', responseMagento.faultCode + '    ' + responseMagento.faultString);
 }

 }
 return customerSynched;
 }
 function updateCustomerInMagento(nsCustomerObject, store, magentoId, existingMagentoReferenceInfo) {

 var customerRecord = CUSTOMER.getCustomer(nsCustomerObject.internalId, store);
 var requsetXML;
 var responseMagento;
 var customerSynched = false;


 if (!!customerRecord) {

 customerRecord.magentoId = magentoId;
 requsetXML = CUSTOMER.getMagentoUpdateCustomerRequestXML(customerRecord, store.sessionID);

 responseMagento = XmlUtility.validateCustomerExportOperationResponse(XmlUtility.soapRequestToMagentoSpecificStore(requsetXML, store), 'update');

 if (!!responseMagento && !!responseMagento.status && responseMagento.status && responseMagento.updated == "true") {
 customerRecord = CUSTOMER.getCustomer(nsCustomerObject.internalId, store);
 customerSynched = updateAddressesInMagento(customerRecord, store, magentoId);
 nlapiSubmitRecord(customerRecord.nsObj);

 } else {
 errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
 Utility.logDebug('responseMagento ', responseMagento.faultCode + '    ' + responseMagento.faultString);
 }
 }
 return customerSynched;
 }
 function createAddressesInMagento(customerRecordObject, store, magentoCustomerId) {
 var customerAddresses = CUSTOMER.getNSCustomerAddresses(customerRecordObject);
 var scannedAddressForMagento;
 var requsetXML;
 var responseMagento;
 var allAddressedSynched = true;
 var createOrUpdateMagentoJSONRef = 'create';
 var thisStoreAddressInfo;

 for (var adr = 0; adr < customerAddresses.length; adr++) {
 scannedAddressForMagento = ConnectorCommon.getScannedAddressForMagento(customerAddresses[adr]);
 if (scannedAddressForMagento) {
 allAddressedSynched = createSingleAddressInMagento(customerRecordObject, customerAddresses[adr], (adr + 1), scannedAddressForMagento, magentoCustomerId, store);
 }
 }
 return allAddressedSynched;
 }
 function updateAddressesInMagento(customerRecordObject, store, magentoCustomerId) {
 var customerAddresses = CUSTOMER.getNSCustomerAddresses(customerRecordObject);
 var scannedAddressForMagento;
 var allAddressedSynched = true;
 var otherStoreAddressInfo;
 var createOrUpdateMagentoJSONRef = 'create';
 var thisStoreAddressInfo;
 var currentAddressStoresInfo;
 var magentoIdStoreRef;


 for (var adr = 0; adr < customerAddresses.length; adr++) {

 scannedAddressForMagento = ConnectorCommon.getScannedAddressForMagento(customerAddresses[adr]);

 if (scannedAddressForMagento) {

 magentoIdStoreRef = customerAddresses[adr].magentoIdStoreRef;
 currentAddressStoresInfo = getStoreCustomerIdAssociativeArray(magentoIdStoreRef);


 if (isBlankOrNull(magentoIdStoreRef) || isBlankOrNull(currentAddressStoresInfo[store.systemId]) || currentAddressStoresInfo[store.systemId] === '0') //Create
 {
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
 var requsetXML;
 var responseMagento;
 var otherStoreAddressInfo;
 var thisStoreAddressInfo;
 var currentAddressSubRecord;
 var createOrUpdateMagentoJSONRef = 'create';

 requsetXML = CUSTOMER.getMagentoCreateAddressRequestXML(scannedAddressForMagento, store.sessionID, magentoCustomerId);

 responseMagento = XmlUtility.validateCustomerAddressExportOperationResponse(XmlUtility.soapRequestToMagentoSpecificStore(requsetXML, store), 'create');

 if (!responseMagento.status) {

 errorMsg = errorMsg + '   ' + responseMagento.faultCode + '    ' + responseMagento.faultString;
 ;
 addressCreated = false;

 } else {

 otherStoreAddressInfo = customerAddressObj.magentoIdStoreRef;

 if (isBlankOrNull(otherStoreAddressInfo))
 createOrUpdateMagentoJSONRef = 'update';

 Utility.logDebug('address store info  ', 'store.systemId  ' + store.systemId + '    ' + responseMagento.magentoAddressId + '    ' + createOrUpdateMagentoJSONRef + '    ' + JSON.stringify(otherStoreAddressInfo));


 thisStoreAddressInfo = ConnectorCommon.getMagentoIdObjectArrayString(store.systemId, responseMagento.magentoAddressId, createOrUpdateMagentoJSONRef, otherStoreAddressInfo);


 customerRecordObject.nsObj.selectLineItem('addressbook', customerAddressLineNo);

 currentAddressSubRecord = customerRecordObject.nsObj.editCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
 currentAddressSubRecord.setFieldValue(ConnectorConstants.OtherCustom.MagentoId, thisStoreAddressInfo);
 currentAddressSubRecord.commit();

 customerRecordObject.nsObj.commitLineItem('addressbook');

 }


 return addressCreated;
 }
 function UpdateSingleAddressInMagento(customerRecordObject, customerAddressObj, customerAddressLineNo, scannedAddressForMagento, magentoCustomerId, store, currentAddressStoresInfo) {
 var addressCreated = true;
 var requsetXML;
 var responseMagento;

 requsetXML = CUSTOMER.getMagentoUpdateAddressRequestXML(scannedAddressForMagento, store.sessionID, currentAddressStoresInfo[store.systemId]);

 responseMagento = XmlUtility.validateCustomerAddressExportOperationResponse(XmlUtility.soapRequestToMagentoSpecificStore(requsetXML, store), 'update');

 if (!responseMagento.status) {
 errorMsg = errorMsg + '   ' + responseMagento.faultCode + '    ' + responseMagento.faultString;
 ;
 addressCreated = false;
 }

 return addressCreated;
 }
 */