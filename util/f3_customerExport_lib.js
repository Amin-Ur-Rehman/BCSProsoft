CUSTOMER = {


    getCustomers: function () {

        var arrFils = [];
        var recs;
        var result = [];
        var arrCols = [];
        var resultObject;
        var CUSTOMER_STATUSES = ConnectorConstants.CustomerTypesToExport;


        arrFils.push(new nlobjSearchFilter('entitystatus', null, 'anyof', CUSTOMER_STATUSES));

        arrFils.push(new nlobjSearchFilter('custentity_magentosync_dev', null, 'is', 'F'));

        //arrFils.push(new nlobjSearchFilter('custentity_magentosync_msg', null, 'isempty'));

        arrCols.push(new nlobjSearchColumn('custentity_magento_custid'));


        recs = nlapiSearchRecord('customer', null, arrFils, arrCols);


        if (recs != null && recs.length > 0) {

            for (var i = 0; i < recs.length; i++) {
                resultObject = new Object();

                resultObject.internalId = recs[i].getId();
                resultObject.magentoCustomerIds = recs[i].getValue('custentity_magento_custid');

                result.push(resultObject);

            }

        }


        return result;
    },
    getCustomersCount: function () {
        var arrFils = [];
        var recs;
        var result = [];
        var arrCols = [];
        var resultObject;
        var CUSTOMER_STATUSES = ConnectorConstants.CustomerTypesToExport;
        arrFils.push(new nlobjSearchFilter('entitystatus', null, 'anyof', CUSTOMER_STATUSES));
        arrFils.push(new nlobjSearchFilter('custentity_magentosync_dev', null, 'is', 'F'));
        arrFils.push(new nlobjSearchFilter('custentity_magentosync_msg', null, 'isempty'));
        arrFils.push(new nlobjSearchFilter('custentity_magentosync_msg', null, 'isempty'));
        arrCols.push(new nlobjSearchColumn('custentity_magento_custid'));
        recs = nlapiSearchRecord('customer', null, arrFils, arrCols);
        if (recs != null && recs.length > 0) {
            for (var i = 0; i < recs.length; i++) {
                resultObject = new Object();
                resultObject.internalId = recs[i].getId();
                resultObject.magentoCustomerIds = recs[i].getValue('custentity_magento_custid');
                result.push(resultObject);
            }
        }
        return result;
    },
    getCustomersSubmittedFromUserEvent: function () {
        var recs;
        var result = [];
        var resultObject;
        recs = RecordsToSync.getRecords(RecordsToSync.RecordTypes.Customer, RecordsToSync.Status.Pending);
        if (recs != null && recs.length > 0) {
            for (var i = 0; i < recs.length; i++) {
                resultObject = new Object();
                resultObject.customRecordInternalId = recs[i].internalId;
                resultObject.internalId = recs[i].recordId;
                resultObject.magentoCustomerIds = nlapiLookupField(RecordsToSync.RecordTypes.Customer, resultObject.internalId, 'custentity_magento_custid');
                result.push(resultObject);
            }
            //Utility.logDebug('getCustomersSubmittedFromUserEvent', JSON.stringify(result))
        }

        return result;
    },
    getEmailAddressIfEmpty: function (email, internalId) {
        if (!Utility.isBlankOrNull(email)) {
            return email;
        }

        var newEmail;
        var lastPart = ConnectorConstants.CurrentStore.entitySyncInfo.customer.noEmailAddress || "@noemail.com";
        newEmail = "ns-customer-" + internalId + lastPart;
        return newEmail;
    },
    setCustomerMagentoId: function (magentoId, customerId, magentoStores) {
        var result = false;

        try {

            var rec = nlapiLoadRecord("customer", customerId);
            rec.setFieldValue(ConnectorConstants.Entity.Fields.MagentoId, magentoId);
            if (!Utility.isBlankOrNull(magentoStores) && magentoStores.length > 0) {
                rec.setFieldValues(ConnectorConstants.Entity.Fields.MagentoStore, magentoStores);
            }
            // handling customer with no email address
            var email = rec.getFieldValue("email");
            Utility.logDebug("Zee->Email", email);
            if (Utility.isBlankOrNull(email)) {
                email = this.getEmailAddressIfEmpty(email, customerId);
                rec.setFieldValue("email", email);
                Utility.logDebug("Zee->NewEmail", email);
            }

            // fixes for customer having either no fisrtname or no lastname or companyname - start
            var isIndividual = rec.getFieldValue("isperson") === "T";
            var entityId = rec.getFieldValue("entityid");

            if (isIndividual) {
                // handling for individual customer
                var firstName = rec.getFieldValue("firstname");
                var lastName = rec.getFieldValue("lastname");

                if (Utility.isBlankOrNull(firstName) && !Utility.isBlankOrNull(lastName)) {
                    rec.setFieldValue("firstname", lastName);
                }
                else if (!Utility.isBlankOrNull(firstName) && Utility.isBlankOrNull(lastName)) {
                    rec.setFieldValue("lastname", firstName);
                }
                else if (Utility.isBlankOrNull(firstName) && Utility.isBlankOrNull(lastName)) {
                    rec.setFieldValue("firstname", entityId);
                    rec.setFieldValue("lastname", entityId);
                }
            } else {
                // handling for company customer
                var companyName = rec.getFieldValue("companyname");
                if (Utility.isBlankOrNull(companyName)) {
                    rec.setFieldValue("companyname", entityId);
                }
            }

            // fixes for customer having either no fisrtname or no lastname - end

            nlapiSubmitRecord(rec);

            result = true;

        } catch (ex) {
        }


        return result;

    },
    setCustomerMagentoSync: function (customerId) {
        var result = false;

        try {

            nlapiSubmitField('customer', customerId, 'custentity_magentosync_dev', 'T');

        } catch (ex) {
        }


        return result;

    },
    setCustomerMagentoSync_Error: function (customerId, errorMsg) {
        var result = false;

        try {

            nlapiSubmitField('customer', customerId, 'custentity_magentosync_msg', errorMsg);

        } catch (ex) {
        }


        return result;

    },
    getCustomer: function (customerInternalId, storeInfo) {

        var customerRecord = nlapiLoadRecord('customer', customerInternalId);
        var customerDataObject;
        var names;


        if (customerRecord != null) {
            customerDataObject = {};
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

                names = getFirstNameLastName(customerDataObject.companyName);

                customerDataObject.firstname = names['firstName'];
                customerDataObject.middlename = "";
                customerDataObject.lastname = names['lastName'];
            }

            customerDataObject.password = this.getRandomPassword();

            customerDataObject.website_id = "1";
            //customerDataObject.store_id = storeInfo.systemId;
            // Further we will get this store ID from configuration
            customerDataObject.store_id = "1";
            var taxable = customerRecord.getFieldValue('taxable');
            if (taxable == 'F') {
                customerDataObject.group_id = storeInfo.entitySyncInfo.customer.magentoCustomerGroups.taxExempt;
            } else {
                customerDataObject.group_id = storeInfo.entitySyncInfo.customer.magentoCustomerGroups.general;
            }
            customerDataObject.prefix = getBlankForNull(customerRecord.getFieldValue('salutation'));
            customerDataObject.suffix = "";
            customerDataObject.dob = "";
            customerDataObject.taxvat = "";
            customerDataObject.gender = "";
            customerDataObject.nsObj = customerRecord;


            customerDataObject.addresses = CUSTOMER.getNSCustomerAddresses(customerDataObject);
        }

        return customerDataObject;
    },
    getNSCustomerAddresses: function (customerRecordObject) {
        var customerAddresses = [];
        var addressObject;
        var names;
        var customerRecord = customerRecordObject.nsObj;
        var addressSubRecord;

        for (var i = 1; i <= customerRecord.getLineItemCount('addressbook'); i++) {
            addressObject = {};
            addressObject.defaultshipping = getBlankForNull(customerRecord.getLineItemValue('addressbook', 'defaultshipping', i));
            addressObject.defaultbilling = getBlankForNull(customerRecord.getLineItemValue('addressbook', 'defaultbilling', i));
            addressObject.country = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'country', i)));
            addressObject.firstname = nlapiEscapeXML(getBlankForNull(customerRecord.getLineItemValue('addressbook', 'addressee', i)));
            names = getFirstNameLastName(addressObject.firstname);
            addressObject.firstname = nlapiEscapeXML(names['firstName']);
            addressObject.lastname = nlapiEscapeXML(names['lastName']);

            if (addressObject.firstname == "") {
                addressObject.firstname = customerRecordObject.firstname;
            }

            if (addressObject.lastname == "") {
                addressObject.lastname = customerRecordObject.lastname;
            }

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

    },
    getMagentoCreateCustomerRequestXML: function (customerDataObject, sessionId) {
        var xml = '';

        if (customerDataObject != null) {
            xml = xml + '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento">';
            xml = xml + '<soapenv:Header/>';
            xml = xml + '<soapenv:Body>';
            xml = xml + '<urn:customerCustomerCreate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionId + '</sessionId>';
            xml = xml + '<customerData xsi:type="urn:customerCustomerEntityToCreate" xs:type="type:customerCustomerEntityToCreate" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';
            xml = xml + '<customer_id xsi:type="xsd:int" xs:type="type:int"/>';
            xml = xml + '<email xsi:type="xsd:string" xs:type="type:string">' + nlapiEscapeXML(customerDataObject.email) + '</email>';
            xml = xml + '<firstname xsi:type="xsd:string" xs:type="type:string">' + nlapiEscapeXML(customerDataObject.firstname) + '</firstname>';
            xml = xml + '<lastname xsi:type="xsd:string" xs:type="type:string">' + nlapiEscapeXML(customerDataObject.lastname) + '</lastname>';
            xml = xml + '<middlename xsi:type="xsd:string" xs:type="type:string"></middlename>';
            xml = xml + '<password xsi:type="xsd:string" xs:type="type:string">' + nlapiEscapeXML(customerDataObject.password) + '</password>';
            xml = xml + '<website_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.website_id + '</website_id>';
            xml = xml + '<store_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.store_id + '</store_id>';
            xml = xml + '<group_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.group_id + '</group_id>';
            xml = xml + '<prefix xsi:type="xsd:string" xs:type="type:string"></prefix>';
            xml = xml + '<suffix xsi:type="xsd:string" xs:type="type:string"></suffix>';
            xml = xml + '<dob xsi:type="xsd:string" xs:type="type:string"></dob>';
            xml = xml + '<taxvat xsi:type="xsd:string" xs:type="type:string"></taxvat>';
            xml = xml + '<gender xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.gender + '</gender>';
            xml = xml + '</customerData>';
            xml = xml + '</urn:customerCustomerCreate>';
            xml = xml + '</soapenv:Body>';
            xml = xml + '</soapenv:Envelope>';

        }

        return xml;

    },
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
    getMagentoCreateAddressRequestXML: function (customerAddressObject, sessionId, magentoCustomerId) {
        var xml = '';
        var firstName;
        var lastName;
        var names;

        if (customerAddressObject != null) {


            xml = xml + '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '<soapenv:Header/>';
            xml = xml + '<soapenv:Body>';
            xml = xml + '<urn:customerAddressCreate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '            <sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionId + '</sessionId>';
            xml = xml + '            <customerId xsi:type="xsd:int" xs:type="type:int" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + magentoCustomerId + '</customerId>';
            xml = xml + '            <addressData xsi:type="urn:customerAddressEntityCreate" xs:type="type:customerAddressEntityCreate" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';
            //                <!--You may enter the following 16 items in any order-->
            //                <!--Optional:-->
            xml = xml + '                <city xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.city + '</city>';
            //                <!--Optional:-->
            xml = xml + '                <company xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.company + '</company>';
            //                <!--Optional:-->
            xml = xml + '                <country_id xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.country + '</country_id>';
            //                <!--Optional:-->
            xml = xml + '                <fax xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.fax + '</fax>>';
            //                <!--Optional:-->
            xml = xml + '                <firstname xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.firstname + '</firstname>';
            //                <!--Optional:-->
            xml = xml + '                <lastname xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.lastname + '</lastname>';
            //                <!--Optional:-->
            xml = xml + '                <middlename xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.middlename + '</middlename>>';
            //                <!--Optional:-->
            xml = xml + '                <postcode xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.postcode + '</postcode>';
            //                <!--Optional:-->
            xml = xml + '                <prefix xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.prefix + '</prefix>';
            //                <!--Optional:-->
            xml = xml + '                <region_id xsi:type="xsd:int" xs:type="type:int">' + customerAddressObject.region + '</region_id>';
            //                <!--Optional:-->
            xml = xml + '                <region xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.region_text + '</region>';
            //                <!--Optional:-->

            xml = xml + '<street xsi:type="urn:ArrayOfString" soapenc:arrayType="xsd:string[]" xs:type="type:string">';
            xml = xml + '    <item>' + customerAddressObject.street1 + '</item>';
            xml = xml + '    <item>' + customerAddressObject.street2 + '</item>';
            xml = xml + '</street>';
            xml = xml + ' <suffix xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.suffix + '</suffix>';
            xml = xml + ' <fax xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.fax + '</fax>';


            //                <!--Optional:-->
            xml = xml + '                <telephone xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.telephone + '</telephone>';
            //                <!--Optional:-->
            xml = xml + '                <is_default_billing xsi:type="xsd:boolean" xs:type="type:boolean">' + customerAddressObject.defaultbilling + '</is_default_billing>';
            //                <!--Optional:-->
            xml = xml + '                <is_default_shipping xsi:type="xsd:boolean" xs:type="type:boolean">' + customerAddressObject.defaultshipping + '</is_default_shipping>';
            xml = xml + '            </addressData>';
            xml = xml + '        </urn:customerAddressCreate>';
            xml = xml + '    </soapenv:Body>';
            xml = xml + '</soapenv:Envelope>';


        }

        return xml;
    },
    getMagentoUpdateAddressRequestXML: function (customerAddressObject, sessionId, magentoAddressId) {
        var xml = '';
        var firstName;
        var lastName;
        var names;

        if (customerAddressObject != null) {


            xml = xml + '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '<soapenv:Header/>';
            xml = xml + '<soapenv:Body>';
            xml = xml + '<urn:customerAddressUpdate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '            <sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionId + '</sessionId>';
            xml = xml + '            <addressId xsi:type="xsd:int" xs:type="type:int" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + magentoAddressId + '</addressId>';
            xml = xml + '            <addressData xsi:type="urn:customerAddressEntityCreate" xs:type="type:customerAddressEntityCreate" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';
            //                <!--You may enter the following 16 items in any order-->
            //                <!--Optional:-->
            xml = xml + '                <city xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.city + '</city>';
            //                <!--Optional:-->
            xml = xml + '                <company xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.company + '</company>';
            //                <!--Optional:-->
            xml = xml + '                <country_id xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.country + '</country_id>';
            //                <!--Optional:-->
            xml = xml + '                <fax xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.fax + '</fax>>';
            //                <!--Optional:-->
            xml = xml + '                <firstname xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.firstname + '</firstname>';
            //                <!--Optional:-->
            xml = xml + '                <lastname xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.lastname + '</lastname>';
            //                <!--Optional:-->
            xml = xml + '                <middlename xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.middlename + '</middlename>>';
            //                <!--Optional:-->
            xml = xml + '                <postcode xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.postcode + '</postcode>';
            //                <!--Optional:-->
            xml = xml + '                <prefix xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.prefix + '</prefix>';
            //                <!--Optional:-->
            xml = xml + '                <region_id xsi:type="xsd:int" xs:type="type:int">' + customerAddressObject.region + '</region_id>';
            //                <!--Optional:-->
            xml = xml + '                <region xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.region_text + '</region>';
            //                <!--Optional:-->

            xml = xml + '<street xsi:type="urn:ArrayOfString" soapenc:arrayType="xsd:string[]" xs:type="type:string">';
            xml = xml + '    <item>' + customerAddressObject.street1 + '</item>';
            xml = xml + '    <item>' + customerAddressObject.street2 + '</item>';
            xml = xml + '</street>';
            xml = xml + ' <suffix xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.suffix + '</suffix>';
            xml = xml + ' <fax xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.fax + '</fax>';


            //                <!--Optional:-->
            xml = xml + '                <telephone xsi:type="xsd:string" xs:type="type:string">' + customerAddressObject.telephone + '</telephone>';
            //                <!--Optional:-->
            xml = xml + '                <is_default_billing xsi:type="xsd:boolean" xs:type="type:boolean">' + customerAddressObject.defaultbilling + '</is_default_billing>';
            //                <!--Optional:-->
            xml = xml + '                <is_default_shipping xsi:type="xsd:boolean" xs:type="type:boolean">' + customerAddressObject.defaultshipping + '</is_default_shipping>';
            xml = xml + '            </addressData>';
            xml = xml + '        </urn:customerAddressUpdate>';
            xml = xml + '    </soapenv:Body>';
            xml = xml + '</soapenv:Envelope>';


        }

        return xml;
    },
    getRandomPassword: function () {
        var randomstring = Math.random().toString(36).slice(-8);
        return randomstring;
    },

    /**
     *
     * @param customerInternalId
     * @returns {*}
     */
    getCustomerForInstantSync: function (customerInternalId) {
        var arrFils = [];
        var recs;
        var result = [];
        var arrCols = [];
        var resultObject;
        var CUSTOMER_STATUSES = ConnectorConstants.CustomerTypesToExport;
        arrFils.push(new nlobjSearchFilter('internalid', null, 'is', customerInternalId));
        arrFils.push(new nlobjSearchFilter('entitystatus', null, 'anyof', CUSTOMER_STATUSES));
        arrCols.push(new nlobjSearchColumn(ConnectorConstants.Entity.Fields.MagentoId));
        arrCols.push(new nlobjSearchColumn(ConnectorConstants.Entity.Fields.MagentoStore));
        recs = nlapiSearchRecord('customer', null, arrFils, arrCols);
        if (!!recs && recs.length > 0) {
            for (var i = 0; i < recs.length; i++) {
                resultObject = {};
                resultObject.internalId = recs[i].getId();
                resultObject.magentoCustomerIds = recs[i].getValue(ConnectorConstants.Entity.Fields.MagentoId);
                resultObject.externalSystems = recs[i].getValue(ConnectorConstants.Entity.Fields.MagentoId);
                result.push(resultObject);
            }
        }
        return result;
    }
};


function getFirstNameLastName(data) {

    var array = data.split(' ');
    var firstName = '';
    var lastName;
    var result = [];

    lastName = array[array.length - 1];

    for (var i = 0; i < array.length - 1; i++) {
        firstName = firstName + array[i] + ' ';

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

}


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

            if (!!customerRecord) {
                customerDataObject = new Object();
                customerDataObject.isPerson = customerRecord.getFieldValue('isperson');
                customerDataObject.email = getBlankForNull(customerRecord.getFieldValue('email'));
                customerDataObject.companyName = getBlankForNull(customerRecord.getFieldValue('companyname'));
                customerDataObject.entityid = getBlankForNull(customerRecord.getFieldValue('entityid'));
                if (customerDataObject.isPerson === "T") {
                    customerDataObject.firstname = customerRecord.getFieldValue('firstname');
                    customerDataObject.middlename = getBlankForNull(customerRecord.getFieldValue('middlename'));
                    customerDataObject.lastname = customerRecord.getFieldValue('lastname');
                } else {
                    if (customerDataObject.companyName === "") {
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

            var customerRecord = CUSTOMER.getCustomer(nsCustomerObject.internalId, store);
            var responseMagento;
            var customerSynched = false;

            if (!!customerRecord) {
                customerRecord.magentoId = magentoId;
                responseMagento = ConnectorConstants.CurrentWrapper.upsertCustomer(customerRecord, store, "update");
                if (!!responseMagento && !!responseMagento.status && responseMagento.status && responseMagento.updated === "true") {
                    //Address Sync
                    customerSynched = CUSTOMER.updateAddressesInMagento(customerRecord, store, magentoId);
                } else {
                    var errorMsg = responseMagento.faultCode + '    ' + responseMagento.faultString;
                    Utility.logDebug('responseMagento ', errorMsg);
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
            var customerAddresses = customerRecordObject.addresses;
            var scannedAddressForMagento;
            var allAddressedSynched = true;
            var currentAddressStoresInfo;
            var magentoIdStoreRef;
            for (var adr = 0; adr < customerAddresses.length; adr++) {
                scannedAddressForMagento = ConnectorCommon.getScannedAddressForMagento(customerAddresses[adr]);
                if (scannedAddressForMagento) {
                    magentoIdStoreRef = customerAddresses[adr].magentoIdStoreRef;
                    currentAddressStoresInfo = this.getStoreCustomerIdAssociativeArray(magentoIdStoreRef);
                    if (isBlankOrNull(magentoIdStoreRef) || isBlankOrNull(currentAddressStoresInfo[store.systemId]) || currentAddressStoresInfo[store.systemId] === '0') //Create
                    {
                        allAddressedSynched = CUSTOMER.createSingleAddressInMagento(customerRecordObject, customerAddresses[adr], (adr + 1), scannedAddressForMagento, magentoCustomerId, store);
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
            responseMagento = XmlUtility.validateCustomerAddressExportOperationResponse(XmlUtility.soapRequestToMagentoSpecificStore(requsetXML, store), 'create');

            if (!responseMagento.status) {
                errorMsg = errorMsg + '   ' + responseMagento.faultCode + '    ' + responseMagento.faultString;
                addressCreated = false;
            } else {
                otherStoreAddressInfo = customerAddressObj.magentoIdStoreRef;
                if (!!isBlankOrNull(otherStoreAddressInfo)) {
                    createOrUpdateMagentoJSONRef = 'update';
                }
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
            responseMagento = XmlUtility.validateCustomerAddressExportOperationResponse(XmlUtility.soapRequestToMagentoSpecificStore(requsetXML, store), 'update');
            if (!responseMagento.status) {
                errorMsg = errorMsg + '   ' + responseMagento.faultCode + '    ' + responseMagento.faultString;
                ;
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