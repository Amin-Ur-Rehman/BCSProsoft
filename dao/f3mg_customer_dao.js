/**
 * Created by Sameer Ahmed on 06-Aug-15.
 *
 * Description:
 * - This is a dao for customer operations.
 * -
 * Referenced By:
 * -
 * - userevent/markCustomerModified_ue.js
 * - scheduled/connection_export_so_sch.js
 * -
 * Dependency:
 * - lib/connector-common-lib.js
 * - util/f3_utility_methods.js
 * - util/f3_customerExport_lib.js
 */
CustomerSync = (function () {
    return {
        internalId: 'customer',
        FieldName: {
            CustomerModified: 'custentity_fc_customer_modified'
        },

        /**
         * Get Customer Data
         * @param customerInternalId
         * @param storeInfo
         * @returns {*}
         */
        getCustomer: function (customerInternalId, storeInfo) {

            var customerRecord = nlapiLoadRecord('customer', customerInternalId);
            var customerDataObject;
            var customerAddresses;
            var customerAddressObject;
            var names;

            if (customerRecord != null) {
                customerDataObject = new Object();
                customerDataObject.isPerson = customerRecord.getFieldValue('isperson');
                customerDataObject.email = getBlankForNull(customerRecord.getFieldValue('email'));
                customerDataObject.companyName = getBlankForNull(customerRecord.getFieldValue('companyname'));
                customerDataObject.entityid = getBlankForNull(customerRecord.getFieldValue('entityid'));
                if (customerDataObject.isPerson == "T") {
                    customerDataObject.firstname = customerRecord.getFieldValue('firstname');
                    customerDataObject.middlename = getBlankForNull(customerRecord.getFieldValue('middlename'));
                    customerDataObject.lastname = customerRecord.getFieldValue('lastname');
                } else {
                    if (customerDataObject.companyName == "") {
                        customerDataObject.companyName = customerDataObject.entityid;
                    }
                    names = this.getFirstNameLastName(customerDataObject.companyName);
                    customerDataObject.firstname = names['firstName'];
                    customerDataObject.middlename = "";
                    customerDataObject.lastname = names['lastName'];
                }
                customerDataObject.password = this.getRandomPassword();
                customerDataObject.website_id = "1";
                //customerDataObject.store_id = storeInfo.systemId;
                // Further we will get this store ID from configuration
                customerDataObject.store_id = "1";
                customerDataObject.group_id = "";
                customerDataObject.prefix = getBlankForNull(customerRecord.getFieldValue('salutation'));
                customerDataObject.suffix = "";
                customerDataObject.dob = "";
                customerDataObject.taxvat = "";
                customerDataObject.gender = "";
                customerDataObject.nsObj = customerRecord;
                customerDataObject.email = CUSTOMER.getEmailAddressIfEmpty(customerDataObject.email, customerInternalId);
            }
            return customerDataObject;
        },

        /**
         * Update Existing customer in Magento Store
         * @param nsCustomerObject
         * @param store
         * @param magentoId
         * @param existingMagentoReferenceInfo
         * @returns {boolean}
         */
        updateCustomerInMagento: function (nsCustomerObject, store, magentoId, existingMagentoReferenceInfo) {

            var customerRecord = this.getCustomer(nsCustomerObject.internalId, store);
            var requsetXML;
            var responseMagento;
            var addressSynched;
            var customerSynched = false;

            if (!!customerRecord) {
                customerRecord.magentoId = magentoId;
                requsetXML = this.getMagentoUpdateCustomerRequestXML(customerRecord, store.sessionID);
                ConnectorCommon.createLogRec('Sameer-test', requsetXML);
                responseMagento = ConnectorConstants.CurrentWrapper.validateCustomerExportOperationResponse(ConnectorConstants.CurrentWrapper.soapRequestToServer(requsetXML, store), 'update');
                if (!!responseMagento && !!responseMagento.status && responseMagento.status && responseMagento.updated === "true") {
                    //magentoIdObjArrStr = ConnectorCommon.getMagentoIdObjectArrayString(store.systemId, magentoId, 'update', existingMagentoReferenceInfo);
                    //nsCustomerUpdateStatus = CUSTOMER.setCustomerMagentoId(magentoIdObjArrStr, nsCustomerObject.internalId);
                    customerRecord = this.getCustomer(nsCustomerObject.internalId, store);
                    //if (nsCustomerUpdateStatus) {
                    //Address Sync
                    customerSynched = this.updateAddressesInMagento(customerRecord, store, magentoId);
                    //}
                    if(!customerSynched){
                        throw new CustomException({
                            code: F3Message.Action.CUSTOMER_EXPORT,
                            message: "Sync Customer Addresses from NetSuite to Magento",
                            recordType: "customer",
                            recordId: magentoId,
                            system: "Magento",
                            exception: null,
                            action:  "Customer Address export to Magento"
                        });
                        //Utility.throwException(F3Message.Action.CUSTOMER_ADDRESS_EXPORT, "Error occurred in updating all the customer addresses in Magento. Magento Customer Id: " + magentoId);
                    }
                    // Zee: no need to update customer if magento id is already set
                    //nlapiSubmitRecord(customerRecord.nsObj);
                } else {
                    errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
                    Utility.logDebug('responseMagento ', responseMagento.faultCode + '    ' + responseMagento.faultString);
                    throw new CustomException({
                        code: responseMagento.faultCode,
                        message: responseMagento.faultString,
                        recordType: "customer",
                        recordId: magentoId,
                        system: "Magento",
                        exception: null,
                        action: "Customer export to Magento"
                    });
                    //Utility.throwException(F3Message.Action.CUSTOMER_EXPORT, "Error occurred in updating customer in Magento. Magento Customer Id: " + magentoId + ". " + errorMsg);
                }
            }
            return customerSynched;
        },

        /**
         * Update Customer Address in Magento Store
         * @param customerRecordObject
         * @param store
         * @param magentoCustomerId
         * @returns {boolean}
         */
        updateAddressesInMagento: function (customerRecordObject, store, magentoCustomerId) {
            var customerAddresses = this.getNSCustomerAddresses(customerRecordObject);
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
                    currentAddressStoresInfo = this.getStoreCustomerIdAssociativeArray(magentoIdStoreRef);
                    if (isBlankOrNull(magentoIdStoreRef) || isBlankOrNull(currentAddressStoresInfo[store.systemId]) || currentAddressStoresInfo[store.systemId] === '0') //Create
                    {
                        allAddressedSynched = this.createSingleAddressInMagento(customerRecordObject, customerAddresses[adr], (adr + 1), scannedAddressForMagento, magentoCustomerId, store);
                    } else if (currentAddressStoresInfo[store.systemId] !== '-1') {
                        //Address Update
                        allAddressedSynched = this.UpdateSingleAddressInMagento(customerRecordObject, customerAddresses[adr], (adr + 1), scannedAddressForMagento, magentoCustomerId, store, currentAddressStoresInfo);
                    }
                }
            }
            return allAddressedSynched;
        },
        /**
         * @param data
         * @returns {Array}
         */
        getStoreCustomerIdAssociativeArray: function (data) {
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
        },

        /**
         * Create New Single address in Magento Store
         * @param customerRecordObject
         * @param customerAddressObj
         * @param customerAddressLineNo
         * @param scannedAddressForMagento
         * @param magentoCustomerId
         * @param store
         * @returns {boolean}
         */
        createSingleAddressInMagento: function (customerRecordObject, customerAddressObj, customerAddressLineNo, scannedAddressForMagento, magentoCustomerId, store) {
            var addressCreated = true;
            var requsetXML;
            var responseMagento;
            var otherStoreAddressInfo;
            var thisStoreAddressInfo;
            var currentAddressSubRecord;
            var createOrUpdateMagentoJSONRef = 'create';
            requsetXML = CUSTOMER.getMagentoCreateAddressRequestXML(scannedAddressForMagento, store.sessionID, magentoCustomerId);
            ConnectorCommon.createLogRec('Sameer-test', requsetXML);
            responseMagento = ConnectorConstants.CurrentWrapper.validateCustomerAddressExportOperationResponse(ConnectorConstants.CurrentWrapper.soapRequestToServer(requsetXML, store), 'create');

            if (!responseMagento.status) {
                errorMsg = errorMsg + '   ' + responseMagento.faultCode + '    ' + responseMagento.faultString;
                addressCreated = false;
            } else {
                otherStoreAddressInfo = customerAddressObj.magentoIdStoreRef;
                if (!!isBlankOrNull(otherStoreAddressInfo))
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
        },

        /**
         * Update Single Address in Magento Store
         * @param customerRecordObject
         * @param customerAddressObj
         * @param customerAddressLineNo
         * @param scannedAddressForMagento
         * @param magentoCustomerId
         * @param store
         * @param currentAddressStoresInfo
         * @returns {boolean}
         * @constructor
         */
        UpdateSingleAddressInMagento: function (customerRecordObject, customerAddressObj, customerAddressLineNo, scannedAddressForMagento, magentoCustomerId, store, currentAddressStoresInfo) {
            var addressCreated = true;
            var requsetXML;
            var responseMagento;
            requsetXML = getMagentoUpdateAddressRequestXML(scannedAddressForMagento, store.sessionID, currentAddressStoresInfo[store.systemId]);
            ConnectorCommon.createLogRec('Sameer-test', requsetXML);
            responseMagento = ConnectorConstants.CurrentWrapper.validateCustomerAddressExportOperationResponse(ConnectorConstants.CurrentWrapper.soapRequestToServer(requsetXML, store), 'update');
            if (!responseMagento.status) {
                errorMsg = errorMsg + '   ' + responseMagento.faultCode + '    ' + responseMagento.faultString;
                addressCreated = false;
            }
            return addressCreated;
        },

        /**
         * Get First and Last name of Customer
         * @param data
         * @returns {Array}
         */
        getFirstNameLastName: function (data) {
            var customerData = data.split(' ');
            var firstName = '';
            var lastName;
            var result = [];
            lastName = customerData[customerData.length - 1];
            for (var i = 0; i < customerData.length - 1; i++) {
                firstName = firstName + customerData[i] + ' ';
            }
            firstName = firstName.trim();
            result['firstName'] = firstName;
            result['lastName'] = lastName;
            if (isBlankOrNull(result['firstName'])) {
                result['firstName'] = result['lastName'];
            }
            if (isBlankOrNull(result['lastName']))
                result['lastName'] = '';
            return result;
        },

        /**
         * Generates a random password
         * @returns {string}
         */
        getRandomPassword: function () {
            var randomstring = Math.random().toString(36).slice(-8);
            return randomstring;
        },

        /**
         *
         * @param customerDataObject
         * @param sessionId
         * @returns {string}
         */
        getMagentoUpdateCustomerRequestXML: function (customerDataObject, sessionId) {
            var xml = '';

            if (customerDataObject != null) {
                xml = xml + '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento">';
                xml = xml + '<soapenv:Header/>';
                xml = xml + '<soapenv:Body>';
                xml = xml + '<urn:customerCustomerUpdate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
                xml = xml + '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionId + '</sessionId>';
                xml = xml + '<customerId xsi:type="xsd:int" xs:type="type:int" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + customerDataObject.magentoId + '</customerId>';
                xml = xml + '<customerData xsi:type="urn:customerCustomerEntityToCreate" xs:type="type:customerCustomerEntityToCreate" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';
                xml = xml + '<customer_id xsi:type="xsd:int" xs:type="type:int"/>';
                xml = xml + '<email xsi:type="xsd:string" xs:type="type:string">' + nlapiEscapeXML(customerDataObject.email) + '</email>';
                xml = xml + '<firstname xsi:type="xsd:string" xs:type="type:string">' + nlapiEscapeXML(customerDataObject.firstname) + '</firstname>';
                xml = xml + '<lastname xsi:type="xsd:string" xs:type="type:string">' + nlapiEscapeXML(customerDataObject.lastname) + '</lastname>';
                xml = xml + '<middlename xsi:type="xsd:string" xs:type="type:string"></middlename>';
                //xml = xml + '<password xsi:type="xsd:string" xs:type="type:string"></password>';
                xml = xml + '<website_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.website_id + '</website_id>';
                xml = xml + '<store_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.store_id + '</store_id>';
                xml = xml + '<group_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.group_id + '</group_id>';
                xml = xml + '<prefix xsi:type="xsd:string" xs:type="type:string"></prefix>';
                xml = xml + '<suffix xsi:type="xsd:string" xs:type="type:string"></suffix>';
                xml = xml + '<dob xsi:type="xsd:string" xs:type="type:string"></dob>';
                xml = xml + '<taxvat xsi:type="xsd:string" xs:type="type:string"></taxvat>';
                xml = xml + '<gender xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.gender + '</gender>';
                xml = xml + '</customerData>';
                xml = xml + '</urn:customerCustomerUpdate>';
                xml = xml + '</soapenv:Body>';
                xml = xml + '</soapenv:Envelope>';
            }
            return xml;
        },
        getMagentoIdMyStore: function (array, storeId) {
            var id;
            Utility.logDebug('store', storeId);
            Utility.logDebug('array', JSON.stringify(array));
            var array = JSON.parse(array);
            for (var i = 0; i < array.length; i++) {
                Utility.logDebug('Inside For', i);
                if (array[i].StoreId === storeId) {
                    Utility.logDebug('Condition passed', i + ' array[i].StoreId ' + array[i].StoreId + ' storeId ' + storeId);
                    id = array[i].MagentoId;
                    Utility.logDebug('id', id);
                }
            }
            return id;
        },
        getNSCustomerAddresses: function (customerRecordObject) {
            var customerAddresses = [];
            var addressObject;
            var names;
            var customerRecord = customerRecordObject.nsObj;
            var addressSubRecord;

            for (var i = 1; i <= customerRecord.getLineItemCount('addressbook'); i++) {
                addressObject = new Object();
                addressObject.defaultshipping = getBlankForNull(customerRecord.getLineItemValue('addressbook', 'defaultshipping', i));
                addressObject.defaultbilling = getBlankForNull(customerRecord.getLineItemValue('addressbook', 'defaultbilling', i));
                addressObject.country = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'country', i)));
                addressObject.firstname = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'addressee', i)));
                names = this.getFirstNameLastName(addressObject.firstname);
                addressObject.firstname = nlapiEscapeXML(names['firstName']);
                addressObject.lastname = nlapiEscapeXML(names['lastName']);
                if (addressObject.firstname === "")
                    addressObject.firstname = customerRecordObject.firstname;
                if (addressObject.lastname === "")
                    addressObject.lastname = customerRecordObject.lastname;
                addressObject.middlename = '';
                addressObject.suffix = '';
                addressObject.prefix = '';
                addressObject.company = '';
                addressObject.prefix = '';
                addressObject.fax = '';
                addressObject.vatnumber = '';
                addressObject.telephone = getBlankForNull(customerRecord.getLineItemValue('addressbook', 'phone', i));
                addressObject.city = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'city', i)));
                addressObject.street1 = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'addr1', i)));
                addressObject.street2 = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'addr2', i)));
                addressObject.region = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'state', i)));
                addressObject.region_text = addressObject.region;
                addressObject.postcode = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'zip', i)));
                customerRecord.selectLineItem('addressbook', i);
                addressSubRecord = customerRecord.viewCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
                addressObject.magentoIdStoreRef = getBlankForNull(addressSubRecord.getFieldValue('custrecord_magento_id'));
                customerAddresses.push(addressObject);
            }
            return customerAddresses;

        }
    }
})();