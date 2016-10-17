/**
 * Created by zahmed on 14-Jan-15.
 *
 * Class Name: MagentoWrapper
 *
 * Description:
 * - This script is responsible for handling xml
 * -
 * Referenced By:
 * -
 * -
 * Dependency:
 *   -
 *   -
 */
MagentoXmlWrapper = (function () {

    var MagentoItemTypes = {
        SimpleProduct: 'simple',
        GroupedProduct: 'grouped',
        ConfigurableProduct: 'configurable',
        VirtualProduct: 'virtual',
        BundleProduct: 'bundle',
        DownloadableProduct: 'downloadable'
    };

    /**
     * Return WOO Item Type depending on NetSuite Item data
     * @param itemType
     * @param itemObject
     * @returns {*}
     */
    function getMagentoItemType(itemType, itemObject) {
        var type;
        switch (itemType) {
            case ItemExportLibrary.configData.ItemTypes.InventoryItem:
            case ItemExportLibrary.configData.ItemTypes.SerializedInventoryItem:
                type = itemObject.isMatrix
                    ? (itemObject.isMatrixParentItem ?
                    MagentoItemTypes.ConfigurableProduct : MagentoItemTypes.SimpleProduct)
                    : MagentoItemTypes.SimpleProduct;
                break;
        }
        return type;
    }

    return {
        /**
         * Init method
         */
        initialize: function (storeInfo) {
        },
        XmlHeader: '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento"><soapenv:Header/><soapenv:Body>',
        XmlFooter: '</soapenv:Body></soapenv:Envelope>',

        ImageUploadXml: '<urn:catalogProductAttributeMediaCreate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><sessionId xsi:type="xsd:string">[SESSIONID]</sessionId><product xsi:type="xsd:string">[PRODUCTID]</product><data xsi:type="urn:catalogProductAttributeMediaCreateEntity"><file xsi:type="urn:catalogProductImageFileEntity"><content xsi:type="xsd:string">[CONTENT]</content><mime xsi:type="xsd:string">[MIME]</mime><name xsi:type="xsd:string">[NAME]</name></file><label xsi:type="xsd:string">[LABEL]</label><position xsi:type="xsd:string">[POSITION]</position><types xsi:type="urn:ArrayOfString" soapenc:arrayType="xsd:string[]"><item>[TYPE]</item></types><exclude xsi:type="xsd:string">[EXCLUDE]</exclude></data></urn:catalogProductAttributeMediaCreate>',
        ImageListXml: '<urn:catalogProductAttributeMediaList soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><sessionId xsi:type="xsd:string">[SESSIONID]</sessionId><product xsi:type="xsd:string">[PRODUCTID]</product></urn:catalogProductAttributeMediaList>',
        ImageRemoveXml: '<urn:catalogProductAttributeMediaRemove soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><sessionId xsi:type="xsd:string">[SESSIONID]</sessionId><product xsi:type="xsd:string">[PRODUCTID]</product><file xsi:type="xsd:string">[FILE]</file></urn:catalogProductAttributeMediaRemove>',

        OrderRequestXMLHeader: '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"><soapenv:Header/><soapenv:Body>',
        OrderRequestXmlFooter: '</soapenv:Body></soapenv:Envelope>',

        /**
         * Request a URL to an external or internal resource.
         * @restriction NetSuite maintains a white list of CAs that are allowed for https requests. Please see the online documentation for the complete list.
         * @governance 10 units
         *
         * @param {string} url 		A fully qualified URL to an HTTP(s) resource
         * @param {string, Object} 	[postdata] - string, document, or Object containing POST payload
         * @param {Object} 			[headers] - Object containing request headers.
         * @param {function} 		[callback] - available on the Client to support asynchronous requests. function is passed an nlobjServerResponse with the results.
         * @param {string} 		[httpMethod]
         * @return {nlobjServerResponse}
         *
         * @exception {SSS_UNKNOWN_HOST}
         * @exception {SSS_INVALID_HOST_CERT}
         * @exception {SSS_REQUEST_TIME_EXCEEDED}
         *
         * @since	2007.0
         */
        _nlapiRequestURL: function (url, postdata, headers, callback, httpMethod) {
            url = url || null;
            postdata = postdata || null;
            headers = headers || {};
            callback = callback || null;
            httpMethod = httpMethod || null;

            this.setAuthHeaderIfNeeded(headers);

            return nlapiRequestURL(url, postdata, headers, callback, httpMethod);
        },
        /**
         * Adding Authorization header if required to access the website
         * @param {Object}            [headers] - Object containing request headers.
         */
        setAuthHeaderIfNeeded: function (headers) {
            var auth = ConnectorConstants.CurrentStore.entitySyncInfo.hasOwnProperty("authorization") ?
                ConnectorConstants.CurrentStore.entitySyncInfo.authorization : null;

            if (auth !== null) {
                var isRequired = auth.isRequired;
                var username = auth.username;
                var password = auth.password;
                if (isRequired && !!username && !!password) {
                    headers["Authorization"] = "Basic " + nlapiEncrypt(username + ":" + password, "base64");
                }
            }
        },

        /**
         * Gets supported Date Format
         * @returns {string}
         */
        getDateFormat: function () {
            return 'MAGENTO_CUSTOM';
        },
        soapRequestToServer: function (xml) {
            var res = this._nlapiRequestURL(ConnectorConstants.CurrentStore.endpoint, xml);
            var body = res.getBody();
            Utility.logDebug('requestbody', xml);
            Utility.logDebug('responsetbody', body);
            var responseXML = nlapiStringToXML(body);

            return responseXML;
        },
        soapRequestToServerSpecificStore: function (xml, store) {
            var res = this._nlapiRequestURL(store.endpoint, xml);
            var body = res.getBody();
            Utility.logDebug('requestbody', xml);
            Utility.logDebug('responsetbody', body);
            var responseXML = nlapiStringToXML(body);

            return responseXML;
        },
        getSessionIDFromMagento: function (userName, apiKey) {
            var sessionID = null;
            var loginXML = this.getLoginXml(userName, apiKey);
            try {
                var responseXML = this.soapRequestToMagento(loginXML);
                sessionID = nlapiSelectValue(responseXML, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:loginResponse/loginReturn");
            } catch (ex) {
                Utility.logException('XmlUtility.getSessionIDFromMagento', ex);
            }

            return sessionID;
        },
        getLoginXml: function (userName, apiKey) {
            var loginXML = '';

            loginXML += this.XmlHeader;
            loginXML += '<urn:login soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            loginXML += '   <username xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + userName + '</username>';
            loginXML += '   <apiKey xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + apiKey + '</apiKey>';
            loginXML += '</urn:login>';
            loginXML += this.XmlFooter;

            return loginXML;
        },
        getSalesOrderListXML: function (order, sessionID) {
            var soXML;

            soXML = this.XmlHeader;
            soXML = soXML + '<urn:salesOrderList>';

            soXML = soXML + '<sessionId urn:type="xsd:string">' + sessionID + '</sessionId>';

            soXML = soXML + '<filters xsi:type="urn:filters">';
            soXML = soXML + '<filter SOAP-ENC:arrayType="urn:associativeEntity[0]" xsi:type="urn:associativeArray">';
            soXML = soXML + '</filter>';

            //soXML = soXML + '<complex_filter SOAP-ENC:arrayType="urn:complexFilter[4]" xsi:type="urn:complexFilterArray">';
            soXML = soXML + '<complex_filter SOAP-ENC:arrayType="urn:complexFilter[2]" xsi:type="urn:complexFilterArray">';

            soXML = soXML + '<item xsi:type="ns1:complexFilter">';

            soXML = soXML + '<key xsi:type="xsd:string">updated_at</key>';
            soXML = soXML + '<value xsi:type="ns1:associativeEntity">';
            soXML = soXML + '<key xsi:type="xsd:string">gt</key>';
            soXML = soXML + '<value xsi:type="xsd:string">' + order.updateDate + '</value>';
            soXML = soXML + '</value>';
            soXML = soXML + '</item>';

            var orderStatusFilster = ConnectorConstants.CurrentStore.entitySyncInfo.salesorder.status;

            soXML = soXML + '<item xsi:type="ns1:complexFilter">';
            soXML = soXML + '<key xsi:type="xsd:string">status</key>';
            soXML = soXML + '<value xsi:type="ns1:associativeEntity">';
            soXML = soXML + '<key xsi:type="xsd:string">in</key>';
            for (var i = 0; i < orderStatusFilster.length; i++) {
                soXML = soXML + '<value xsi:type="xsd:string">' + orderStatusFilster[i] + '</value>';
            }
            soXML = soXML + ' </value>';
            soXML = soXML + '</item>';

            /*soXML = soXML + '<item xsi:type="ns1:complexFilter">';
             soXML = soXML + '<key xsi:type="xsd:string">customer_id</key>';
             soXML = soXML + '<value xsi:type="ns1:associativeEntity">';
             soXML = soXML + '<key xsi:type="xsd:string">in</key>';
             soXML = soXML + '<value xsi:type="xsd:string">530</value>';
             soXML = soXML + ' </value>';
             soXML = soXML + '</item>';
             soXML = soXML + '<item xsi:type="ns1:complexFilter">';
             soXML = soXML + '<key xsi:type="xsd:string">increment_id</key>';
             soXML = soXML + '<value xsi:type="ns1:associativeEntity">';
             soXML = soXML + '<key xsi:type="xsd:string">in</key>';
             soXML = soXML + '<value xsi:type="xsd:string">100093349</value>';
             soXML = soXML + ' </value>';
             soXML = soXML + '</item>';*/

            soXML = soXML + '</complex_filter>';

            soXML = soXML + '</filters>';

            soXML = soXML + '</urn:salesOrderList>';
            soXML = soXML + this.XmlFooter;

            return soXML;

        },
        getLoadCustomersXML: function (customer, sessionID) {
            var customerXML;

            customerXML = this.XmlHeader;
            customerXML = customerXML + '<urn:customerCustomerList>';
            customerXML = customerXML + '<sessionId urn:type="xsd:string">' + sessionID + '</sessionId>';
            customerXML = customerXML + '</urn:customerCustomerList>';
            customerXML = customerXML + this.XmlFooter;

            return customerXML;

        },
        getSalesOrderListByCustomerXML: function (customerId, sessionID) {
            var soXML;

            soXML = this.XmlHeader;
            soXML = soXML + '<urn:salesOrderList>';

            soXML = soXML + '<sessionId urn:type="xsd:string">' + sessionID + '</sessionId>';

            soXML = soXML + '<filters xsi:type="urn:filters">';
            soXML = soXML + '<filter SOAP-ENC:arrayType="urn:associativeEntity[0]" xsi:type="urn:associativeArray">';
            soXML = soXML + '</filter>';
            soXML = soXML + '<complex_filter SOAP-ENC:arrayType="urn:complexFilter[1]" xsi:type="urn:complexFilterArray">';
            soXML = soXML + '<item xsi:type="ns1:complexFilter">';
            soXML = soXML + '<key xsi:type="xsd:string">customer_id</key>';
            soXML = soXML + '<value xsi:type="ns1:associativeEntity">';
            soXML = soXML + '<key xsi:type="xsd:string">eq</key>';
            soXML = soXML + '<value xsi:type="xsd:string">' + customerId + '</value>';

            soXML = soXML + '</value>';
            soXML = soXML + '</item>';
            soXML = soXML + '</complex_filter>';
            soXML = soXML + '</filters>';

            soXML = soXML + '</urn:salesOrderList>';
            soXML = soXML + this.XmlFooter;

            return soXML;

        },
        getInvoiceListXML: function (order, sessionID) {
            var ilXML;

            ilXML = this.XmlHeader;
            ilXML = ilXML + '<urn:salesOrderInvoiceList soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            ilXML = ilXML + '<sessionId xsi:type="xsd:string">' + sessionID + '</sessionId>';
            ilXML = ilXML + '<filters xsi:type="urn:filters">';

            ilXML = ilXML + '<complex_filter SOAP-ENC:arrayType="urn:complexFilter[1]" xsi:type="urn:complexFilterArray">';
            ilXML = ilXML + '<item xsi:type="ns1:complexFilter">';
            ilXML = ilXML + '<key xsi:type="xsd:string">updated_at</key>';
            ilXML = ilXML + '<value xsi:type="ns1:associativeEntity">';
            ilXML = ilXML + '<key xsi:type="xsd:string">gt</key>';
            ilXML = ilXML + '<value xsi:type="xsd:string">' + order.updateDate + '</value>';
            ilXML = ilXML + '</value>';
            ilXML = ilXML + '</item>';
            ilXML = ilXML + '</complex_filter>';
            ilXML = ilXML + '</filters>';
            ilXML = ilXML + '</urn:salesOrderInvoiceList>';
            ilXML = ilXML + this.XmlFooter;
            return ilXML;

        },
        getSalesOrderInfoXML: function (orderid, sessionID) {
            var soXML;

            soXML = this.XmlHeader;
            soXML = soXML + '<urn:salesOrderInfo>';
            soXML = soXML + '<sessionId urn:type="xsd:string">' + sessionID + '</sessionId>';
            soXML = soXML + '<orderIncrementId urn:type="xsd:string">' + orderid + '</orderIncrementId>';
            soXML = soXML + '</urn:salesOrderInfo>';
            soXML = soXML + this.XmlFooter;

            return soXML;

        },
        getUpdateItemXML: function (item, sessionID, magID, isParent) {
            Utility.logDebug('item json', JSON.stringify(item));

            var xml = '';

            xml = this.XmlHeader + '<urn:catalogProductUpdate>';
            xml = xml + '<sessionId>' + sessionID + '</sessionId>';
            xml = xml + '<product>' + magID + '</product>';

            xml = xml + '<productData xsi:type="urn:catalogProductCreateEntity">';
            xml = xml + '<price xsi:type="xsd:string">' + item.price + '</price>';
            xml = xml + '<special_price xsi:type="xsd:string">' + item.specialPrice + '</special_price>';

            xml = xml + '<stock_data xsi:type="urn:catalogInventoryStockItemUpdateEntity" xs:type="type:catalogInventoryStockItemUpdateEntity">';

            if (isParent) {
                item.quatity = 0;
            }
            xml = xml + '<qty xsi:type="xsd:string" xs:type="type:string">' + item.quatity + '</qty>';
            if (item.quatity >= 1) {
                xml = xml + '<is_in_stock xsi:type="xsd:string" xs:type="type:string">' + 1 + '</is_in_stock>';
            }

            xml = xml + '</stock_data>';
            xml = xml + '</productData>';
            // TODO: generalize storeView
            xml = xml + '<storeView xsi:type="xsd:string">1</storeView>';
            xml = xml + '</urn:catalogProductUpdate>';
            xml = xml + this.XmlFooter;

            return xml;

        },
        getCreateFulfillmentXML: function (sessionID, magentoItemIds, magentoSOId, fulfillRec) {
            Utility.logDebug('getCreateFulfillmentXML', 'Enter in getCreateFulfillmentXML() fun');
            var itemsQuantity = fulfillRec.getLineItemCount('item');
            var shipmentXML;

            shipmentXML = this.XmlHeader + '<urn:salesOrderShipmentCreate>';
            shipmentXML = shipmentXML + '<sessionId urn:type="xsd:string">' + sessionID + '</sessionId>';
            shipmentXML = shipmentXML + '<orderIncrementId urn:type="xsd:string">' + magentoSOId + '</orderIncrementId>';

            var lineItems = [];
            for (var line = 1; line <= itemsQuantity; line++) {
                if (fulfillRec.getLineItemValue('item', 'itemreceive', line) == 'T') {
                    //var itemId = magentoItemIds[nlapiGetLineItemValue('item', 'item', line)];
                    var itemId = fulfillRec.getLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, line);
                    Utility.logDebug('orrrder Item Id', itemId);
                    var itemQty = fulfillRec.getLineItemValue('item', 'quantity', line);
                    if (fulfillRec.getLineItemValue('item', 'isserialitem', 1) === 'T') {
                        comment = comment + ',' + fulfillRec.getLineItemValue('item', 'itemdescription', line) + '=' + fulfillRec.getLineItemValue('item', 'serialnumbers', line);
                    } else {
                        comment = '-';
                    }

                    lineItems.push({
                        itemId: itemId,
                        itemQty: itemQty
                    });
                }
            }

            shipmentXML = shipmentXML + '<itemsQty  SOAP-ENC:arrayType="urn:orderItemIdQty[' + lineItems.length + ']" xsi:type="urn:orderItemIdQtyArray">';
            Utility.logDebug('xml', nlapiEscapeXML(shipmentXML));

            var comment = '';

            for (var i = 0; i < lineItems.length; i++) {
                var lineItem = lineItems[i];
                Utility.logDebug('xml', nlapiEscapeXML(shipmentXML));
                shipmentXML = shipmentXML + '<item xsi:type="urn:orderItemIdQty">';
                shipmentXML = shipmentXML + '<order_item_id type="xsd:int">' + lineItem.itemId + '</order_item_id>';
                shipmentXML = shipmentXML + '<qty type="xsd:double">' + lineItem.itemQty + '</qty>';
                shipmentXML = shipmentXML + '</item>';
                Utility.logDebug('itemId', lineItem.itemId);
                Utility.logDebug('Quantity', lineItem.itemQty);
                Utility.logDebug('xml', nlapiEscapeXML(shipmentXML));
            }


            shipmentXML = shipmentXML + '</itemsQty>';
            shipmentXML = shipmentXML + ' <comment xsi:type="xsd:string">' + comment + '</comment>';
            shipmentXML = shipmentXML + '</urn:salesOrderShipmentCreate>';

            shipmentXML = shipmentXML + this.XmlFooter;

            Utility.logDebug('getCreateFulfillmentXML', 'Exit from getCreateFulfillmentXML() funciton');

            return shipmentXML;

        },
        getCarrier: function (carrier, carrierText) {
            var _carrier;
            if (carrier === "ups") {
                _carrier = "ups";
            } else {
                carrierText = !!carrierText ? carrierText.toString().toLowerCase() : "";
                if (carrierText.indexOf("usps") !== -1) {
                    _carrier = "usps";
                }
                else if (carrierText.indexOf("dhl") !== -1) {
                    _carrier = "dhl";
                }
                else if (carrierText.indexOf("fedex") !== -1) {
                    _carrier = "fedex";
                }
                else if (carrierText.indexOf("dhlint") !== -1) {
                    _carrier = "dhlint";
                }
                else {
                    _carrier = "custom";
                }
            }
            return _carrier;
        },
        createTrackingXML: function (id, carrier, carrierText, tracking, sessionID) {
            // Add TrackingNum for shipment - XML
            var tShipmentXML = '';
            tShipmentXML = this.XmlHeader;
            tShipmentXML = tShipmentXML + '<urn:salesOrderShipmentAddTrack soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            tShipmentXML = tShipmentXML + '<sessionId xsi:type="xsd:string">' + sessionID + '</sessionId>';
            tShipmentXML = tShipmentXML + '<shipmentIncrementId xsi:type="xsd:string">' + id + '</shipmentIncrementId>';

            tShipmentXML = tShipmentXML + '<carrier xsi:type="xsd:string">' + this.getCarrier(carrier, carrierText) + '</carrier>';

            tShipmentXML = tShipmentXML + '<title xsi:type="xsd:string">' + carrierText + '</title>';
            tShipmentXML = tShipmentXML + '<trackNumber xsi:type="xsd:string">' + tracking + '</trackNumber>';
            tShipmentXML = tShipmentXML + '</urn:salesOrderShipmentAddTrack>';
            tShipmentXML = tShipmentXML + this.XmlFooter;
            nlapiLogExecution('AUDIT', 'XML', nlapiEscapeXML(tShipmentXML));
            return tShipmentXML;
        },
        getCustomerAddressXML: function (customerID, sessionID) {
            var custAddrListXML;

            custAddrListXML = this.XmlHeader;

            custAddrListXML = custAddrListXML + '<urn:customerAddressList>';
            custAddrListXML = custAddrListXML + '<sessionId urn:type="xsd:string">' + sessionID + '</sessionId>';
            custAddrListXML = custAddrListXML + '<customerId urn:type="xsd:int">' + customerID + '</customerId>';
            custAddrListXML = custAddrListXML + '</urn:customerAddressList>';

            custAddrListXML = custAddrListXML + this.XmlFooter;

            return custAddrListXML;
        },
        getCreateItemXML: function (product, sessionID, categoryIds) {
            var xml = '';

            xml = this.XmlHeader + '<urn:catalogProductCreate>';
            xml = xml + '<sessionId xsi:type="xsd:string">' + sessionID + '</sessionId>';
            xml = xml + '<type xsi:type="xsd:string">simple</type>';
            xml = xml + '<set xsi:type="xsd:string">4</set>';
            xml = xml + '<sku xsi:type="xsd:string">' + product.internalId + '</sku>';
            xml = xml + '<productData xsi:type="urn:catalogProductCreateEntity">';
            xml = xml + '<additional_attributes xsi:type="urn:catalogProductAdditionalAttributesEntity">';

            xml = xml + '<categories SOAP-ENC:arrayType="xsd:string[' + categoryIds.length + ']" xsi:type="urn:ArrayOfString">';

            if (!Utility.isBlankOrNull(categoryIds) && categoryIds.length > 0) {
                for (var i = 0; i < categoryIds.length; i++) {
                    xml = xml + ' <item xsi:type="xsd:string">' + categoryIds[i] + '</item>';
                }
            }

            xml = xml + '</categories>';

            xml = xml + '<websites SOAP-ENC:arrayType="xsd:string[1]" xsi:type="urn:ArrayOfString"><item xsi:type="xsd:string">1</item></websites>';
            xml = xml + '<name xsi:type="xsd:string">' + product.name + '</name>';
            xml = xml + '<description xsi:type="xsd:string">' + product.description + '</description>';
            xml = xml + '<short_description xsi:type="xsd:string">' + product.description + '</short_description>';
            xml = xml + '<weight xsi:type="xsd:string">0.0000</weight>';
            xml = xml + '<status xsi:type="xsd:string">1</status>';
            xml = xml + '<visibility xsi:type="xsd:string">4</visibility>';
            xml = xml + '<price xsi:type="xsd:string">' + product.price + '</price>';
            xml = xml + '<tax_class_id xsi:type="xsd:string">0</tax_class_id>';
            xml = xml + '<stock_data xsi:type="urn:catalogInventoryStockItemUpdateEntity" xs:type="type:catalogInventoryStockItemUpdateEntity">';

            xml = xml + '<qty xsi:type="xsd:string" xs:type="type:string">' + product.quatity + '</qty>';
            if (product.quatity >= 1) {
                xml = xml + '<is_in_stock xsi:type="xsd:string" xs:type="type:string">' + 1 + '</is_in_stock>';
            }

            xml = xml + '</stock_data>';


            xml = xml + '</productData>';
            xml = xml + '</urn:catalogProductCreate>';
            Utility.logDebug('response', (xml));
            xml = xml + this.XmlFooter;

            return xml;

        },
        getProductListXML: function (sessionID, product) {
            var xml;
            xml = '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '<soapenv:Header/>';
            xml = xml + '<soapenv:Body>';
            xml = xml + '<urn:catalogProductList soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '<sessionId xsi:type="xsd:string">' + sessionID + '</sessionId>';
            xml = xml + '<filters xsi:type="urn:filters">';
            xml = xml + '<filter xsi:type="urn:associativeArray" soapenc:arrayType="urn:associativeEntity[1]">';
            xml = xml + '<item>';
            xml = xml + '<key>sku</key>';
            xml = xml + '<value>' + product.magentoSKU + '</value>';
            xml = xml + '</item>';
            xml = xml + '</filter>';
            xml = xml + '</filters>';
            xml = xml + '</urn:catalogProductList>';
            xml = xml + '</soapenv:Body>';
            xml = xml + '</soapenv:Envelope>';
            return xml;
        },
        getUpdateFulfillmentXML: function (fulfillmentId, sessionID) {
            Utility.logDebug('Enter in getUpdateFulfillmentXML() funciton', 'fulfillmentId: ' + fulfillmentId);

            var xml = '';

            Utility.logDebug('Exit from getUpdateFulfillmentXML() funciton', 'fulfillmentId: ' + fulfillmentId);

            return xml;

        },

        transformCustAddrListXMLtoArray: function (addresses) {
            var result = [];
            var address;

            for (var i = 0; i < addresses.length; i++) {
                address = {};

                address.customer_address_id = nlapiSelectValue(addresses[i], 'customer_address_id');
                address.created_at = nlapiSelectValue(addresses[i], 'created_at');
                address.updated_at = nlapiSelectValue(addresses[i], 'updated_at');
                address.city = nlapiSelectValue(addresses[i], 'city');
                address.company = nlapiSelectValue(addresses[i], 'company');
                address.country_id = nlapiSelectValue(addresses[i], 'country_id');
                address.firstname = nlapiSelectValue(addresses[i], 'firstname');
                address.lastname = nlapiSelectValue(addresses[i], 'lastname');
                address.postcode = nlapiSelectValue(addresses[i], 'postcode');
                address.region = nlapiSelectValue(addresses[i], 'region');
                address.region_id = nlapiSelectValue(addresses[i], 'region_id');
                address.street = nlapiSelectValue(addresses[i], 'street');
                address.telephone = nlapiSelectValue(addresses[i], 'telephone');
                address.is_default_billing = eval(nlapiSelectValue(addresses[i], 'is_default_billing'));
                address.is_default_shipping = eval(nlapiSelectValue(addresses[i], 'is_default_shipping'));

                result[result.length] = address;
            }

            return result;
        },

        transformSalesOrderListXMLtoArray: function (orders) {
            var result = [];

            for (var i = 0; i < orders.length; i++) {

                var order = {};
                order.increment_id = nlapiSelectValue(orders[i], 'increment_id');
                order.order_id = nlapiSelectValue(orders[i], 'order_id');
                order.created_at = nlapiSelectValue(orders[i], 'created_at');
                order.customer_id = nlapiSelectValue(orders[i], 'customer_id');
                order.firstname = nlapiSelectValue(orders[i], 'firstname');
                order.lastname = nlapiSelectValue(orders[i], 'lastname');
                order.email = nlapiSelectValue(orders[i], 'customer_email');
                order.shipment_method = nlapiSelectValue(orders[i], 'shipping_method');
                order.shipping_description = nlapiSelectValue(orders[i], 'shipping_description');
                order.customer_firstname = nlapiSelectValue(orders[i], 'customer_firstname');
                order.customer_lastname = nlapiSelectValue(orders[i], 'customer_lastname');
                order.grandtotal = nlapiSelectValue(orders[i], 'grand_total');
                order.store_id = nlapiSelectValue(orders[i], 'store_id');
                order.shipping_amount = nlapiSelectValue(orders[i], 'shipping_amount');
                order.discount_amount = nlapiSelectValue(orders[i], 'discount_amount');
                order.discount_description = nlapiSelectValue(orders[i], 'discount_description');
                order.customer_middlename = nlapiSelectValue(orders[i], 'customer_middlename');
                order.customer_middlename = order.customer_middlename ? order.customer_middlename : '';
                order.customer_group_id = nlapiSelectValue(orders[i], 'customer_group_id');
                order.quote_id = nlapiSelectValue(orders[i], 'quote_id');

                result.push(order);
            }

            return result;
        },
        transformInvoiceListToArray: function (invoices) {
            var result = [];
            var invoice;
            for (var i = 0; i < invoices.length; i++) {
                invoice = {};
                invoice.increment_id = nlapiSelectValue(invoices[i], 'increment_id');
                invoice.order_id = nlapiSelectValue(invoices[i], 'order_id');
                result[invoice.order_id] = invoice.increment_id;
            }

            return result;
        },
        transformSalesOrderInfoXMLtoshippingAddress: function (shipping) {
            var shippingObj = {};

            shippingObj.address_id = nlapiSelectValue(shipping[0], 'address_id');
            shippingObj.street = nlapiSelectValue(shipping[0], 'street');
            shippingObj.city = nlapiSelectValue(shipping[0], 'city');
            shippingObj.phone = nlapiSelectValue(shipping[0], 'telephone');
            shippingObj.region = nlapiSelectValue(shipping[0], 'region');
            shippingObj.region_id = nlapiSelectValue(shipping[0], 'region_id');
            shippingObj.zip = nlapiSelectValue(shipping[0], 'postcode');
            shippingObj.country_id = nlapiSelectValue(shipping[0], 'country_id');
            shippingObj.firstname = nlapiSelectValue(shipping[0], 'firstname');
            shippingObj.lastname = nlapiSelectValue(shipping[0], 'lastname');

            return shippingObj;
        },
        transformSalesOrderInfoXMLtobillingAddress: function (billing) {
            var billingObj = {};

            billingObj.address_id = nlapiSelectValue(billing[0], 'address_id');
            billingObj.street = nlapiSelectValue(billing[0], 'street');
            billingObj.city = nlapiSelectValue(billing[0], 'city');
            billingObj.phone = nlapiSelectValue(billing[0], 'telephone');
            billingObj.region = nlapiSelectValue(billing[0], 'region');
            billingObj.region_id = nlapiSelectValue(billing[0], 'region_id');
            billingObj.zip = nlapiSelectValue(billing[0], 'postcode');
            billingObj.country_id = nlapiSelectValue(billing[0], 'country_id');
            billingObj.firstname = nlapiSelectValue(billing[0], 'firstname');
            billingObj.lastname = nlapiSelectValue(billing[0], 'lastname');

            return billingObj;
        },
        transformSalesOrderInfoXMLtoPayment: function (payment) {
            var paymentObj = {};

            paymentObj.parentId = nlapiSelectValue(payment[0], 'parent_id');
            paymentObj.amountOrdered = nlapiSelectValue(payment[0], 'amount_ordered');
            paymentObj.shippingAmount = nlapiSelectValue(payment[0], 'shipping_amount');
            paymentObj.baseAmountOrdered = nlapiSelectValue(payment[0], 'base_amount_ordered');
            paymentObj.method = nlapiSelectValue(payment[0], 'method');
            paymentObj.ccType = nlapiSelectValue(payment[0], 'cc_type');
            paymentObj.ccLast4 = nlapiSelectValue(payment[0], 'cc_last4');
            paymentObj.ccExpMonth = nlapiSelectValue(payment[0], 'cc_exp_month');
            paymentObj.ccExpYear = nlapiSelectValue(payment[0], 'cc_exp_year');
            paymentObj.paymentId = nlapiSelectValue(payment[0], 'payment_id');

            return paymentObj;
        },
        transformSalesOrderCustomerInfoXMLtoArray: function (xml) {
            var customer = {};
            var order = nlapiSelectNode(xml, "//result");
            customer.increment_id = nlapiSelectValue(order, 'increment_id');
            customer.order_number = nlapiSelectValue(order, 'increment_id');
            customer.order_id = nlapiSelectValue(order, 'order_id');
            customer.created_at = nlapiSelectValue(order, 'created_at');
            customer.customer_id = nlapiSelectValue(order, 'customer_id');
            customer.firstname = nlapiSelectValue(order, 'customer_firstname');
            customer.lastname = nlapiSelectValue(order, 'customer_lastname');
            customer.email = nlapiSelectValue(order, 'customer_email');
            customer.shipment_method = nlapiSelectValue(order, 'shipping_method');
            customer.shipping_description = nlapiSelectValue(order, 'shipping_description');
            customer.customer_firstname = nlapiSelectValue(order, 'customer_firstname');
            customer.customer_lastname = nlapiSelectValue(order, 'customer_lastname');
            customer.grandtotal = nlapiSelectValue(order, 'grand_total');
            customer.store_id = nlapiSelectValue(order, 'store_id');
            customer.shipping_amount = nlapiSelectValue(order, 'shipping_amount');
            customer.discount_amount = nlapiSelectValue(order, 'discount_amount');
            customer.customer_middlename = nlapiSelectValue(order, 'customer_middlename');
            customer.customer_middlename = customer.customer_middlename ? customer.customer_middlename : '';
            customer.updatedAt = nlapiSelectValue(order, 'updated_at')
            return customer;
        },
        transformSalesOrderInfoXMLtoArray: function (products) {
            var result = [];
            var product;
            var skuArr = [];

            for (var i = 0; i < products.length; i++) {
                product = {};
                var sku = nlapiSelectValue(products[i], 'sku');
                if (skuArr.indexOf(sku) === -1) {
                    skuArr.push(sku);
                    product.product_id = sku; // TODO: check sku
                    product.qty_ordered = nlapiSelectValue(products[i], 'qty_ordered');
                    product.product_type = nlapiSelectValue(products[i], 'product_type');
                    product.item_id = nlapiSelectValue(products[i], 'item_id');
                    product.tax_amount = nlapiSelectValue(products[i], 'tax_amount');
                    product.tax_percent= nlapiSelectValue(products[i],'tax_percent');
                    var unSerializedObject = null;
                    var productOptions = nlapiSelectValue(products[i], 'product_options');
                    if (!!productOptions) {
                        try {
                            unSerializedObject = Unserializer.unserialize(productOptions);
                        }
                        catch (e) {
                            nlapiLogExecution('Error', 'Error in unserializing product options.', 'product_id: ' + product.product_id);
                        }
                    }
                    product.price = nlapiSelectValue(products[i], 'price');
                    product.original_price = nlapiSelectValue(products[i], 'original_price');
                    product.product_options = unSerializedObject;
                    // get ammount for dummy item
                    result[result.length] = product;
                }
            }

            return result;
        },
        tranformCustomerXMLtoArray: function (customers) {
            var result = [];
            var customer;
            var middleName;

            for (var i = 0; i < customers.length; i++) {
                customer = {};
                customer.customer_id = nlapiSelectValue(customers[i], 'customer_id');
                customer.email = nlapiSelectValue(customers[i], 'email');
                customer.firstname = nlapiSelectValue(customers[i], 'firstname');
                middleName = Utility.getBlankForNull(nlapiSelectValue(customers[i], 'middlename'));
                customer.middlename = middleName ? middleName + ' ' : '';
                customer.lastname = nlapiSelectValue(customers[i], 'lastname');
                customer.group_id = nlapiSelectValue(customers[i], 'group_id');
                customer.prefix = Utility.getBlankForNull(nlapiSelectValue(customers[i], 'prefix'));
                customer.suffix = nlapiSelectValue(customers[i], 'suffix');
                customer.dob = nlapiSelectValue(customers[i], 'dob');

                result.push(customer);
            }

            return result;
        },

        validateResponse: function (xml, operation) {
            var responseMagento = {};
            var faultCode;
            var faultString;
            if (operation === 'order') {
                var orders = nlapiSelectNodes(xml, "//result/item");
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                if (!Utility.isBlankOrNull(faultCode)) {
                    responseMagento.status = false; // Means There is fault
                    responseMagento.faultCode = faultCode; // Fault Code
                    responseMagento.faultString = faultString; //Fault String
                } else if (!Utility.isBlankOrNull(orders)) {
                    responseMagento.status = true;
                    responseMagento.orders = this.transformSalesOrderListXMLtoArray(orders);
                } else // Not Attribute ID Found, Nor fault code found
                {
                    responseMagento.status = false;
                    responseMagento.faultCode = '000';
                    responseMagento.faultString = 'Unexpected Error';
                }
            } else if (operation === 'product') {

                var products = nlapiSelectNodes(xml, "//items/item");
                var shipping = nlapiSelectNodes(xml, "//shipping_address");
                var billing = nlapiSelectNodes(xml, "//billing_address");
                var payment = nlapiSelectNodes(xml, "//payment");
                var statusHistory = nlapiSelectNodes(xml, "//status_history/item");
                var authorizedId;
                // Utility.logDebug('payment XML', nlapiXMLToString(payment));
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                if (!Utility.isBlankOrNull(faultCode)) {
                    responseMagento.status = false; // Means There is fault
                    responseMagento.faultCode = faultCode; // Fault Code
                    responseMagento.faultString = faultString; //Fault String
                } else if (!Utility.isBlankOrNull(products)) {
                    responseMagento.status = true;
                    responseMagento.customer = this.transformSalesOrderCustomerInfoXMLtoArray(xml);
                    responseMagento.products = this.transformSalesOrderInfoXMLtoArray(products);
                    responseMagento.shippingAddress = this.transformSalesOrderInfoXMLtoshippingAddress(shipping);
                    responseMagento.billingAddress = this.transformSalesOrderInfoXMLtobillingAddress(billing);
                    responseMagento.payment = this.transformSalesOrderInfoXMLtoPayment(payment);
                    authorizedId = ConnectorCommon.getAuthorizedId(statusHistory);
                    //Utility.logDebug('authorizedId_w', authorizedId);
                    responseMagento.payment.authorizedId = authorizedId;
                } else // Not Attribute ID Found, Nor fault code found
                {
                    //nlapiLogExecution('Debug','Error in validateResponse-operation=product ');
                    responseMagento.status = false;
                    responseMagento.faultCode = '000';
                    responseMagento.faultString = 'Unexpected Error';
                }
            } else if (operation === 'invoice') {
                var invoices = nlapiSelectNodes(xml, "//result/item");
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                if (!Utility.isBlankOrNull(faultCode)) {
                    responseMagento.status = false; // Means There is fault
                    responseMagento.faultCode = faultCode; // Fault Code
                    responseMagento.faultString = faultString; //Fault String
                } else if (!Utility.isBlankOrNull(invoices)) {
                    responseMagento.status = true;
                    responseMagento.invoices = this.transformInvoiceListToArray(invoices);
                } else {
                    // Not Attribute ID Found, Nor fault code found
                    responseMagento.status = false;
                    responseMagento.faultCode = '000';
                    responseMagento.faultString = 'Unexpected Error';
                }
            }
            return responseMagento;
        },
        validateResponseCustomer: function (xml) {

            Utility.logDebug('Debug', 'validateResponse started');

            Utility.logDebug('response', nlapiXMLToString(xml));

            var responseMagento = {};


            var faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
            var faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
            var customers = nlapiSelectNodes(xml, "//storeView/item");

            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false; // Means There is fault
                responseMagento.faultCode = faultCode; // Fault Code
                responseMagento.faultString = faultString; //Fault String
                nlapiLogExecution('Debug', 'Mageno-Category Delete Operation Faild', responseMagento.faultString);
            } else if (!Utility.isBlankOrNull(customers)) {
                responseMagento.status = true;
                responseMagento.customers = this.tranformCustomerXMLtoArray(customers);
            } else // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                nlapiLogExecution('Debug', 'Mageno-Customer Import Operation Faild', responseMagento.faultString);

            }


            return responseMagento;

        },
        validateItemExportResponse: function (xml, operation) {
            var responseMagento = {};
            var magentoItemID;
            var faultCode;
            var faultString;

            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                if (operation === 'create') {
                    magentoItemID = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductCreateResponse/result");
                } else if (operation === 'update') {
                    magentoItemID = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductUpdateResponse/result");
                }


            } catch (ex) {
                Utility.logException('MagentoWrapper.validateItemExportResponse', ex);
            }


            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false; // Means There is fault
                responseMagento.faultCode = faultCode; // Fault Code
                responseMagento.faultString = faultString; //Fault String
                Utility.logDebug('Mageno-Item Export Operation Faild', responseMagento.faultString);
            } else if (!Utility.isBlankOrNull(magentoItemID)) {
                responseMagento.status = true; // Means There is fault
                responseMagento.result = magentoItemID;
            } else // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                Utility.logDebug('Mageno-Item Export Operation Faild', responseMagento.faultString);

            }

            return responseMagento;
        },
        validateGetIDResponse: function (xml) {
            var responseMagento = {};
            var magentoItemID;
            var faultCode;
            var faultString;

            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");


                magentoItemID = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductListResponse/storeView/item/product_id");


            } catch (ex) {
                Utility.logException('MagentoWrapper.validateGetIDResponse', ex);
            }

            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false; // Means There is fault
                responseMagento.faultCode = faultCode; // Fault Code
                responseMagento.faultString = faultString; //Fault String
                Utility.logDebug('Mageno-Item Export Operation Faild', responseMagento.faultString);
            } else if (!Utility.isBlankOrNull(magentoItemID)) {
                responseMagento.status = true; // Means There is fault
                responseMagento.result = magentoItemID;
                responseMagento.product = {};
                responseMagento.product.id = magentoItemID;
            } else // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                Utility.logDebug('Mageno-Item Export Operation Faild', responseMagento.faultString);

            }

            return responseMagento;
        },
        validateCustomerAddressResponse: function (xml) {
            var responseMagento = {};

            var customerAddresses = nlapiSelectNodes(xml, "//result/item");
            var faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
            var faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false; // Means There is fault
                responseMagento.faultCode = faultCode; // Fault Code
                responseMagento.faultString = faultString; //Fault String

            } else if (!Utility.isBlankOrNull(customerAddresses)) {
                responseMagento.status = true;
                responseMagento.addresses = this.transformCustAddrListXMLtoArray(customerAddresses);
            } else // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';


            }

            return responseMagento;
        },
        validateCustomerExportOperationResponse: function (xml, operation) {
            var faultCode = "";
            var faultString;
            var responseMagento = {};

            var magentoCustomerId;
            var updated;
            responseMagento.status = true;

            responseMagento.status = true;

            nlapiLogExecution('debug', 'operation', operation);


            try {

                if (operation == "create") {

                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;


                    if (!!responseMagento.faultCode) {
                        responseMagento.status = false;
                    }

                    if (responseMagento.status) {
                        magentoCustomerId = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:customerCustomerCreateResponse/result");
                        responseMagento.magentoCustomerId = magentoCustomerId;
                    }

                } else if (operation == "update") {

                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;


                    if (!!responseMagento.faultCode) {
                        responseMagento.status = false;
                    }

                    if (responseMagento.status) {
                        responseMagento.updated = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:customerCustomerUpdateResponse/result");

                    }


                }

            } catch (ex) {


                Utility.logException('MagentoWrapper.validateCustomerExportOperationResponse', ex);

            }

            return responseMagento;

        },
        validateCustomerAddressExportOperationResponse: function (xml, operation) {
            var faultCode = "";
            var faultString;
            var responseMagento = {};
            responseMagento.status = true;

            try {

                if (operation == "create") {
                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;


                    if (!!responseMagento.faultCode != "") {
                        responseMagento.status = false;
                    }

                    if (responseMagento.status) {
                        magentoAddressId = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:customerAddressCreateResponse/result");
                        responseMagento.magentoAddressId = magentoAddressId;
                    }

                } else if (operation == "update") {

                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;


                    if (!!responseMagento.faultCode) {
                        responseMagento.status = false;
                    }

                    if (responseMagento.status) {
                        responseMagento.updated = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:customerAddressUpdateResponse/result");

                    }

                }

            } catch (ex) {
                Utility.logException('MagentoWrapper.validateCustomerAddressExportOperationResponse', ex);
            }


            Utility.logDebug('responseMagento', JSON.stringify(responseMagento));

            return responseMagento;
        },
        validateTrackingCreateResponse: function (xml, operation) {
            Utility.logDebug('XML', nlapiEscapeXML(xml));
            var responseMagento = {};
            var magentoFulfillmentID;
            var faultCode;
            var faultString;


            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                //  if (operation=='create')
                magentoFulfillmentID = nlapiSelectValue(xml, "//result");
                //else if (operation=='update')
                //magentoFulfillmentID= nlapiSelectValue(xml,"SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductUpdateResponse/result");


            } catch (ex) {
                Utility.logException('MagentoWrapper.validateTrackingCreateResponse', ex);
            }


            if (faultCode != null) {
                responseMagento.status = false; // Means There is fault
                responseMagento.faultCode = faultCode; // Fault Code
                responseMagento.faultString = faultString; //Fault String
                Utility.logDebug('Tracking Number Add Operation Failed', responseMagento.faultString + ' - ' + responseMagento.faultCode);
                ConnectorCommon.generateErrorEmail('Tracking Number Add Operation Failed  ' + responseMagento.faultString, '', 'order');
            } else if (magentoFulfillmentID != null) {
                responseMagento.status = true; // Means There is fault
                responseMagento.result = magentoFulfillmentID;
            } else // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                Utility.logDebug('Tracking Number Add Operation Failed', responseMagento.faultString + ' - ' + responseMagento.faultCode);
                ConnectorCommon.generateErrorEmail('Tracking Number Add Operation Failed ' + responseMagento.faultString, '', 'order');

            }

            return responseMagento;
        },
        validateFulfillmentExportResponse: function (xml, operation) {
            var responseMagento = {};
            var magentoFulfillmentID;
            var faultCode;
            var faultString;


            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                //  if (operation=='create')
                magentoFulfillmentID = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:salesOrderShipmentCreateResponse/shipmentIncrementId");
                //else if (operation=='update')
                //magentoFulfillmentID= nlapiSelectValue(xml,"SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductUpdateResponse/result");


            } catch (ex) {
                Utility.logException('MagentoWrapper.validateFulfillmentExportResponse', ex);
            }


            if (faultCode != null) {
                responseMagento.status = false; // Means There is fault
                responseMagento.faultCode = faultCode; // Fault Code
                responseMagento.faultString = faultString; //Fault String
                Utility.logDebug('Mageno-Fulfillment Export Operation Failed', responseMagento.faultString);
                ConnectorCommon.generateErrorEmail('Fulfilment couldnt get to Magento , Please convey this to folio3 : ' + responseMagento.faultString, '', 'order');
            } else if (magentoFulfillmentID != null) {
                responseMagento.status = true; // Means There is fault
                responseMagento.result = magentoFulfillmentID;
            } else // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                Utility.logDebug('Mageno-Fulfillment Export Operation Failed', responseMagento.faultString);
                ConnectorCommon.generateErrorEmail('Fulfilment couldnt get to Magento , Please convey this to folio3 : ' + responseMagento.faultString, '', 'order');

            }

            return responseMagento;
        },
        /**
         * Validate the xml and fetch the data using passed method/function
         * @param xml
         * @param {function} method - this method will always retrun an object
         * @return {object}
         */
        validateAndTransformResponse: function (xml, method) {
            var responseMagento = {};
            var faultCode;
            var faultString;

            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                responseMagento.data = method(xml);
            } catch (ex) {
                Utility.logException('MagentoWrapper.validateAndTransformResponse', ex);
            }

            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false;
                responseMagento.faultCode = faultCode;
                responseMagento.faultString = faultString;
                Utility.logDebug('An error has occurred with request xml', responseMagento.faultString);
            } else if (responseMagento.hasOwnProperty('data') && Utility.objectSize(responseMagento.data) > 0) {
                responseMagento.status = true;
                responseMagento.result = responseMagento.data;
            } else {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                Utility.logDebug('An error has occurred with request xml', responseMagento.faultString);
            }

            return responseMagento;
        },

        /**
         * validate and transform xml response of salesorder creation call
         * @param xml
         * @param incrementalIdData
         * @returns {{}}
         */
        validateAndTransformSalesorderCreationResponse: function (xml) {
            var responseMagento = {};
            var faultCode;
            var faultString;
            responseMagento.incrementalIdData = null;

            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
            } catch (ex) {
                Utility.logException('XmlUtility.validateAndTransformResponse', ex);
            }

            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false;
                responseMagento.faultCode = faultCode;
                responseMagento.faultString = faultString;
                Utility.logDebug('An error has occurred with request xml', responseMagento.faultString);
            } else {
                var incrementalIdData = this.transformCreateSalesOrderResponse(xml);
                if (!!incrementalIdData) {
                    responseMagento.status = true;
                    responseMagento.incrementalIdData = incrementalIdData;
                } else {
                    responseMagento.status = false;
                    responseMagento.faultCode = '000';
                    responseMagento.faultString = 'Unexpected Error';
                    Utility.logDebug('An error has occurred with request xml', responseMagento.faultString);
                }
            }

            return responseMagento;
        },

        /**
         * Description of method getCustomerXmlForSaleOrder
         * @param parameter
         */
        getCustomerXmlForSaleOrder: function (customer) {
            var customerXml = '';

            customerXml = customerXml + '<customer xsi:type="urn:customCustomerEntity" xs:type="type:customCustomerEntity" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';
            customerXml = customerXml + '<entity xsi:type="urn:shoppingCartCustomerEntity" xs:type="type:shoppingCartCustomerAddressEntity">';
            customerXml = customerXml + '<mode xsi:type="xsd:string" xs:type="type:string">' + customer.mode + '</mode>';
            customerXml = customerXml + '<customer_id xsi:type="xsd:int" xs:type="type:int">' + customer.customerId + '</customer_id>';
            customerXml = customerXml + '<email xsi:type="xsd:string" xs:type="type:string">' + customer.email + '</email>';
            customerXml = customerXml + '<firstname xsi:type="xsd:string" xs:type="type:string">' + customer.firstName + '</firstname>';
            customerXml = customerXml + '<lastname xsi:type="xsd:string" xs:type="type:string">' + customer.lastName + '</lastname>';
            customerXml = customerXml + '<company xs:type="type:string">' + customer.company + '</company>';
            customerXml = customerXml + '<street xs:type="type:string">' + customer.street + '</street>';
            customerXml = customerXml + '<city xs:type="type:string">' + customer.city + '</city>';
            customerXml = customerXml + '<region xs:type="type:string">' + customer.state + '</region>';
            customerXml = customerXml + '<region_id xs:type="type:string">' + customer.stateId + '</region_id>';
            customerXml = customerXml + '<postcode xs:type="type:string">' + customer.zipCode + '</postcode>';
            customerXml = customerXml + '<country_id xs:type="type:string">' + customer.country + '</country_id>';
            customerXml = customerXml + '<telephone xs:type="type:string">' + customer.telephone + '</telephone>';
            customerXml = customerXml + '<fax xs:type="type:string">' + customer.fax + '</fax>';
            customerXml = customerXml + '<is_default_billing xs:type="type:int">' + customer.isDefaultBilling + '</is_default_billing>';
            customerXml = customerXml + '<is_default_shipping xs:type="type:int">' + customer.isDefaultShipping + '</is_default_shipping>';
            customerXml = customerXml + '</entity>';

            customerXml = customerXml + '<address xsi:type="urn:shoppingCartCustomerAddressEntityArray" soapenc:arrayType="urn:shoppingCartCustomerAddressEntity[' + customer.addresses.length + ']" xs:type="type:shoppingCartCustomerAddressEntity">';

            for (var i in customer.addresses) {
                var address = customer.addresses[i];
                customerXml = customerXml + '<item>';
                customerXml = customerXml + '<mode xsi:type="http://www.w3.org/2001/XMLSchema" xmlns:xn="http://www.w3.org/2000/xmlns/">' + address.mode + '</mode>';
                customerXml = customerXml + '<firstname xsi:type="xsd:string" xs:type="type:string">' + address.firstName + '</firstname>';
                customerXml = customerXml + '<lastname xsi:type="xsd:string" xs:type="type:string">' + address.lastName + '</lastname>';
                customerXml = customerXml + '<address_id xsi:type="xsd:string" xs:type="type:string">' + address.addressId + '</address_id>';
                customerXml = customerXml + '<company xs:type="type:string">' + address.company + '</company>';
                customerXml = customerXml + '<street xs:type="type:string">' + address.street + '</street>';
                customerXml = customerXml + '<city xs:type="type:string">' + address.city + '</city>';
                customerXml = customerXml + '<region xs:type="type:string">' + address.state + '</region>';
                customerXml = customerXml + '<region_id xs:type="type:string">' + address.state + '</region_id>';
                customerXml = customerXml + '<postcode xs:type="type:string">' + address.zipCode + '</postcode>';
                customerXml = customerXml + '<country_id xs:type="type:string">' + address.country + '</country_id>';
                customerXml = customerXml + '<telephone xs:type="type:string">' + address.telephone + '</telephone>';
                customerXml = customerXml + '<fax xs:type="type:string">' + address.fax + '</fax>';
                customerXml = customerXml + '<is_default_billing xs:type="type:int">' + address.isDefaultBilling + '</is_default_billing>';
                customerXml = customerXml + '<is_default_shipping xs:type="type:int">' + address.isDefaultShipping + '</is_default_shipping>';
                customerXml = customerXml + '</item>';
            }

            customerXml = customerXml + '</address>';
            customerXml = customerXml + '</customer>';

            return customerXml;
        },

        /**
         * Description of method getProductsXmlForSaleOrder
         * @param parameter
         */
        getProductsXmlForSaleOrder: function (items) {

            var productXml = '';

            productXml = productXml + '<products xsi:type="urn:shoppingCartProductEntityArray" soapenc:arrayType="urn:shoppingCartProductEntity[1]">';

            for (var counter = 0; counter < items.length; counter++) {
                var item = items[counter];

                productXml += '<item>';
                productXml += '<sku>' + encodeURIComponent(item.sku) + '</sku>';
                productXml += '<qty>' + item.quantity + '</qty>';
                productXml += '<customprice>' + item.price + '</customprice>';

                // making xml for gift product if exist
                productXml += this.getProductGiftInfoXml(item);

                productXml += '</item>';
            }

            productXml = productXml + '</products>';

            return productXml;
        },

        /**
         * making xml for gift product if exist
         * @param {Object} item
         * @return {string}
         */
        getProductGiftInfoXml: function (item) {
            var xml = "";

            // if item object is null or undefined then return blank
            if (Utility.isBlankOrNull(item)) {
                return xml;
            }

            // if item object don't has giftInfo property then return blank
            if (!item.hasOwnProperty("giftInfo")) {
                return xml;
            }

            var giftInfo = item.giftInfo;

            // if item object has giftInfo object and andn gift info attributes count is zero then return blank
            if (Object.keys(giftInfo).length === 0) {
                return xml;
            }

            xml += '<f3_gc_info xsi:type="urn:f3GcInfoEntityArray" soapenc:arrayType="urn:f3GcInfoEntity[1]">';

            xml += '<f3GcInfoEntity>';

            xml += '<aw_gc_sender_name>' + giftInfo.giftCertFrom + '</aw_gc_sender_name>';
            xml += '<aw_gc_sender_email>' + giftInfo.giftCertFromEmail + '</aw_gc_sender_email>';
            xml += '<aw_gc_recipient_name>' + giftInfo.giftCertRecipientName + '</aw_gc_recipient_name>';
            xml += '<aw_gc_recipient_email>' + giftInfo.giftCertRecipientEmail + '</aw_gc_recipient_email>';
            xml += '<aw_gc_message>' + giftInfo.giftCertMessage + '</aw_gc_message>';
            xml += '<aw_gc_code>' + giftInfo.giftCertNumber + '</aw_gc_code>';
            xml += '<aw_gc_amount>' + giftInfo.giftCertAmount + '</aw_gc_amount>';
            xml += '</f3GcInfoEntity>';

            xml += '</f3_gc_info>';

            return xml;
        },

        /**
         * Description of method getShippingAndPaymentXml
         * @param shipmentMethod
         * @param paymentMethod
         * @return {string}
         */
        getShippingAndPaymentXml: function (shipmentMethod, paymentMethod) {

            var shippingAndPaymentXml = '';

            shippingAndPaymentXml = shippingAndPaymentXml + '<shippingmethod xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + shipmentMethod + '</shippingmethod>';
            shippingAndPaymentXml = shippingAndPaymentXml + '<paymentmethod xsi:type="urn:shoppingCartPaymentMethodEntity" xs:type="type:shoppingCartPaymentMethodEntity" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';
            shippingAndPaymentXml = shippingAndPaymentXml + '<method xsi:type="xsd:string" xs:type="type:string">' + paymentMethod + '</method>';
            shippingAndPaymentXml = shippingAndPaymentXml + '</paymentmethod>';

            return shippingAndPaymentXml;
        },

        /**
         * Shipping information XML
         * @param shipmentInfo
         * @return {string}
         */
        getShippingXml: function (shipmentInfo) {
            var shippingXml = '';
            shippingXml += '<shippingmethod xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + shipmentInfo.shipmentMethod + '</shippingmethod>';
            shippingXml += '<customshippingcost xsi:type="xsd:double" xs:type="type:double" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + shipmentInfo.shipmentCost + '</customshippingcost>';
            return shippingXml;
        },
        /**
         * Payment information XML
         * @param paymentInfo
         * @return {string}
         */
        getPaymentXml: function (paymentInfo) {
            var paymentXml = '';

            paymentXml += '<paymentmethod xsi:type="urn:shoppingCartPaymentMethodEntity" xs:type="type:shoppingCartPaymentMethodEntity" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';
            paymentXml += '<method xsi:type="xsd:string" xs:type="type:string">' + paymentInfo.paymentMethod + '</method>';
            if (!!paymentInfo.ccType) {
                paymentXml += '<cc_type xsi:type="xsd:string" xs:type="type:string">' + paymentInfo.ccType + '</cc_type>';
                if (!!paymentInfo.ccNumber) {
                    paymentXml += '<cc_number xsi:type="xsd:string" xs:type="type:string">' + paymentInfo.ccNumber + '</cc_number>';
                }
                if (!!paymentInfo.ccOwner) {
                    paymentXml += '<cc_owner xsi:type="xsd:string" xs:type="type:string">' + paymentInfo.ccOwner + '</cc_owner>';
                }
                if (!!paymentInfo.ccExpiryYear) {
                    paymentXml += '<cc_exp_year xsi:type="xsd:string" xs:type="type:string">' + paymentInfo.ccExpiryYear + '</cc_exp_year>';
                }
                if (!!paymentInfo.ccExpiryMonth) {
                    paymentXml += '<cc_exp_month xsi:type="xsd:string" xs:type="type:string">' + paymentInfo.ccExpiryMonth + '</cc_exp_month>';
                }
            }
            paymentXml += '</paymentmethod>';

            return paymentXml;
        },
        /**
         * History XML
         * @param history
         * @return {string}
         */
        getHistoryXml: function (history) {
            var historyXml = '';

            historyXml += '<history xsi:type="xsd:string" xs:type="type:string">' + history + '</history>';

            return historyXml;
        },
        /**
         * status XML
         * @param history
         * @return {string}
         */
        getStatusXml: function (status) {
            var statusXml = '';

            statusXml += '<status xsi:type="xsd:string" xs:type="type:string">' + status + '</status>';

            return statusXml;
        },
        /**
         * Create XML chunk for gift certificates applied to the order for discount
         * @param {Array} giftCertificates
         * @return {string}
         */
        getGiftCertificatesXml: function (giftCertificates) {
            var giftCertificatesXml = "";

            giftCertificatesXml += '<giftCodes xsi:type="urn:giftCodeEntityArray" soapenc:arrayType="urn:giftCodeEntity[' + giftCertificates.length + ']">';

            for (var counter = 0; counter < giftCertificates.length; counter++) {
                var giftCertificate = giftCertificates[counter];

                giftCertificatesXml += '<giftCodeEntity>';
                giftCertificatesXml += '<auth_code>' + giftCertificate.authCode + '</auth_code>';
                giftCertificatesXml += '<auth_code_applied_amt>' + giftCertificate.authCodeAppliedAmt + '</auth_code_applied_amt>';
                giftCertificatesXml += '</giftCodeEntity>';
            }

            giftCertificatesXml += '</giftCodes>';

            return giftCertificatesXml;
        },

        discountXmlData: function(discountAmount){
            var xml = '';
            var discAmount = discountAmount
            if (discAmount == null || discAmount == '') {
                discAmount = 0.00;
            }
            discAmount = -discAmount;
            xml += '<discount_amount>' + discAmount + '</discount_amount>';
            return xml;
        },
        /**
         * Additional data xml
         * @param orderDataObject
         * @returns {string}
         */
        getAdditionalData: function (orderDataObject) {
            var xml = '';

            xml += '<additionalData>';
            xml += '<discount_amount>' + orderDataObject.discountAmount + '</discount_amount>';
            xml += '<ns_tran_id>' + orderDataObject.nsTranId + '</ns_tran_id>';
            xml += '<ns_internal_id>' + orderDataObject.nsInternalId + '</ns_internal_id>';
            xml += '</additionalData>';

            return xml;
        },

        /**
         * status XML
         * @param history
         * @return {string}
         */
        getCustomTaxData: function (tax) {
            var taxXml = '';

            taxXml += '<tax xsi:type="xsd:double" xs:type="type:double">' + tax + '</tax>';

            return taxXml;
        },
        /**
         * Creates XML for Sales Order and returns
         * @param orderCreationInfo
         * @param sessionId
         * @returns {string} XML String
         */
        getCreateSalesOrderXml: function (orderCreationInfo, sessionId) {
            var orderXml;
            var storeId = orderCreationInfo.storeId;
            var customer = orderCreationInfo.customer;
            var items = orderCreationInfo.items;
            var shipmentInfo = orderCreationInfo.shipmentInfo;
            var paymentInfo = orderCreationInfo.paymentInfo;
            var history = orderCreationInfo.history;
            var status = orderCreationInfo.status;
            var customTax=orderCreationInfo.taxAmount;
            var giftCertificates = orderCreationInfo.giftCertificates;
            var discountAmount= orderCreationInfo.discountAmount;
            var customerXml = this.getCustomerXmlForSaleOrder(customer);
            var productsXml = this.getProductsXmlForSaleOrder(items);
            var shippingXml = this.getShippingXml(shipmentInfo);
            var paymentXml = this.getPaymentXml(paymentInfo);
            var historyXml = this.getHistoryXml(history);
            var statusXml = this.getStatusXml(status);
            var customTaxXml=this.getCustomTaxData(customTax);
            var discountXml=this.discountXmlData(discountAmount)
            var giftCertificatesXml = this.getGiftCertificatesXml(giftCertificates);
            var additionalDataXml = this.getAdditionalData(orderCreationInfo);

            orderXml = this.XmlHeader;
            orderXml = orderXml + '<urn:folio3_salesOrderCreateSalesOrder soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            orderXml = orderXml + '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionId + '</sessionId>';
            orderXml = orderXml + '<storeId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + storeId + '</storeId>';
            orderXml = orderXml + customerXml;
            orderXml = orderXml + productsXml;
            orderXml = orderXml + shippingXml;
            orderXml = orderXml + paymentXml;
            orderXml = orderXml + historyXml;
            orderXml = orderXml + statusXml;
            orderXml = orderXml + customTaxXml;
            orderXml=  orderXml+ discountXml;
            orderXml = orderXml + giftCertificatesXml;
            orderXml = orderXml + additionalDataXml;
            orderXml = orderXml + '</urn:folio3_salesOrderCreateSalesOrder>';
            orderXml = orderXml + this.XmlFooter;

            return orderXml;

        },

        /**
         * This function transform create sales order response into object
         * @param xml
         * @return {object}
         */
        transformCreateSalesOrderResponse: function (xml) {
            var obj = {};

            //Utility.logDebug('response xml for logging', nlapiXMLToString(xml));

            var itemNodes = nlapiSelectNodes(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:folio3_salesOrderCreateSalesOrderResponse/result/item");

            for (var i in itemNodes) {
                var itemNode = itemNodes[i];
                var fieldId = nlapiSelectValue(itemNode, 'field_id');
                var fieldValue = nlapiSelectValue(itemNode, 'field_value');
                obj[fieldId] = fieldValue;
            }

            return obj;
        },
        getCreateCategoryXML: function (category, sessionID) {
            var categoryXML = '';
            categoryXML = this.XmlHeader + '<urn:catalogCategoryCreate>';
            categoryXML = categoryXML + '<sessionId xsi:type="xsd:string">' + sessionID + '</sessionId>';
            if (!isBlankOrNull(category.magentoParentID)) categoryXML = categoryXML + '<parentId xsi:type="xsd:string">' + category.magentoParentID + '</parentId>';
            else //It is root category
                categoryXML = categoryXML + '<parentId xsi:type="xsd:string">1</parentId>';
            categoryXML = categoryXML + '<categoryData xsi:type="urn:catalogCategoryEntityCreate">';
            //categoryXML = categoryXML + '<name xsi:type="xsd:string">'+extractCategoryName(category.name)+'</name>';
            categoryXML = categoryXML + '<name xsi:type="xsd:string">' + category.name + '</name>';
            categoryXML = categoryXML + '<is_active xsi:type="xsd:int">' + category.active + '</is_active>';
            if (!isBlankOrNull(category.level)) categoryXML = categoryXML + '<position xsi:type="xsd:int">' + (category.level + 1) + '</position>';
            else categoryXML = categoryXML + '<position xsi:type="xsd:int">1</position>';
            categoryXML = categoryXML + '<available_sort_by SOAP-ENC:arrayType="xsd:string[0]" xsi:type="urn:ArrayOfString">';
            categoryXML = categoryXML + '<item xsi:type="xsd:string">position</item>';
            categoryXML = categoryXML + '</available_sort_by>';
            //categoryXML = categoryXML + '<custom_design xsi:type="xsd:string"></custom_design>';
            //categoryXML = categoryXML +  '<custom_design_apply  xsi:type="xsd:int"></custom_design_apply>';
            //categoryXML = categoryXML +  '<custom_design_from xsi:type="xsd:string"></custom_design_from>';
            //categoryXML = categoryXML + '<custom_design_to xsi:type="xsd:string"></custom_design_to>';
            //categoryXML = categoryXML + '<custom_layout_update xsi:type="xsd:string"></custom_layout_update>';
            categoryXML = categoryXML + '<default_sort_by xsi:type="xsd:string">position</default_sort_by>';
            //categoryXML = categoryXML + '<description xsi:type="xsd:string"></description>';
            //categoryXML = categoryXML + '<display_mode xsi:type="xsd:string"></display_mode>';
            //categoryXML = categoryXML + '<is_anchor xsi:type="xsd:int"></is_anchor>';
            //categoryXML = categoryXML + '<landing_page xsi:type="xsd:int"></landing_page>';
            //categoryXML = categoryXML + '<meta_description xsi:type="xsd:string"></meta_description>';
            //categoryXML = categoryXML + '<meta_keywords xsi:type="xsd:string"></meta_keywords>';
            //categoryXML = categoryXML + '<meta_title xsi:type="xsd:string"></meta_title>';
            //categoryXML = categoryXML + '<page_layout xsi:type="xsd:string"></page_layout>';
            //categoryXML = categoryXML + '<url_key xsi:type="xsd:string"></url_key>';
            categoryXML = categoryXML + '<include_in_menu xsi:type="xsd:int">1</include_in_menu>';
            categoryXML = categoryXML + '</categoryData>';
            categoryXML = categoryXML + '<storeView xsi:type="xsd:string">1</storeView>';
            categoryXML = categoryXML + '</urn:catalogCategoryCreate>';
            categoryXML = categoryXML + this.XmlFooter;
            return categoryXML;
        },
        getUpdateCategoryXML: function (category, sessionID) {
            var categoryXML = '';
            categoryXML = this.XmlHeader + '<urn:catalogCategoryUpdate>';
            categoryXML = categoryXML + '<sessionId xsi:type="xsd:string">' + sessionID + '</sessionId>';
            categoryXML = categoryXML + '<categoryId xsi:type="xsd:int" xs:type="type:int" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + category.magentoId + '</categoryId>';
            categoryXML = categoryXML + '<categoryData xsi:type="urn:catalogCategoryEntityCreate">';
            //categoryXML = categoryXML + '<name xsi:type="xsd:string">'+extractCategoryName(category.name)+'</name>';
            categoryXML = categoryXML + '<name xsi:type="xsd:string">' + category.name + '</name>';
            categoryXML = categoryXML + '<is_active xsi:type="xsd:int">' + category.active + '</is_active>';
            categoryXML = categoryXML + '<available_sort_by SOAP-ENC:arrayType="xsd:string[0]" xsi:type="urn:ArrayOfString">';
            categoryXML = categoryXML + '<item xsi:type="xsd:string">position</item>';
            categoryXML = categoryXML + '</available_sort_by>';
            //categoryXML = categoryXML + '<custom_design xsi:type="xsd:string"></custom_design>';
            //categoryXML = categoryXML +  '<custom_design_apply  xsi:type="xsd:int"></custom_design_apply>';
            //categoryXML = categoryXML +  '<custom_design_from xsi:type="xsd:string"></custom_design_from>';
            //categoryXML = categoryXML + '<custom_design_to xsi:type="xsd:string"></custom_design_to>';
            //categoryXML = categoryXML + '<custom_layout_update xsi:type="xsd:string"></custom_layout_update>';
            categoryXML = categoryXML + '<default_sort_by xsi:type="xsd:string">position</default_sort_by>';
            //categoryXML = categoryXML + '<description xsi:type="xsd:string"></description>';
            //categoryXML = categoryXML + '<display_mode xsi:type="xsd:string"></display_mode>';
            //categoryXML = categoryXML + '<is_anchor xsi:type="xsd:int"></is_anchor>';
            //categoryXML = categoryXML + '<landing_page xsi:type="xsd:int"></landing_page>';
            //categoryXML = categoryXML + '<meta_description xsi:type="xsd:string"></meta_description>';
            //categoryXML = categoryXML + '<meta_keywords xsi:type="xsd:string"></meta_keywords>';
            //categoryXML = categoryXML + '<meta_title xsi:type="xsd:string"></meta_title>';
            //categoryXML = categoryXML + '<page_layout xsi:type="xsd:string"></page_layout>';
            //categoryXML = categoryXML + '<url_key xsi:type="xsd:string"></url_key>';
            categoryXML = categoryXML + '<include_in_menu xsi:type="xsd:int">1</include_in_menu>';
            categoryXML = categoryXML + '</categoryData>';
            categoryXML = categoryXML + '<storeView xsi:type="xsd:string">1</storeView>';
            categoryXML = categoryXML + '</urn:catalogCategoryUpdate>';
            categoryXML = categoryXML + this.XmlFooter;
            return categoryXML;
        },
        validateCreateCategoryOperationResponse: function (xml, operation) {
            var faultCode = "";
            var faultString;
            var responseMagento = {};
            var magentoCategoryId;
            var updated;
            responseMagento.status = true;
            try {
                if (operation == "create") {
                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;
                    if (!!responseMagento.faultCode) {
                        responseMagento.status = false;
                    }
                    if (responseMagento.status) {
                        magentoCategoryId = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogCategoryCreateResponse/result");
                        responseMagento.magentoCategoryId = magentoCategoryId;
                    }
                } else if (operation == "update") {
                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;
                    if (!!responseMagento.faultCode) {
                        responseMagento.status = false;
                    }
                    if (responseMagento.status) {
                        responseMagento.updated = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogCategoryUpdateResponse/result");
                    }
                }
            } catch (ex) {
                Utility.logException('MagentoWrapper.validateCategoryExportOperationResponse', ex);
            }
            return responseMagento;
        },

        validateItemOperationResponse: function (xml, operation) {
            var faultCode = "";
            var faultString;
            var responseMagento = {};
            var magentoItemId;
            var updated;
            responseMagento.status = true;
            try {
                if (operation == "create") {
                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;
                    if (!!responseMagento.faultCode) {
                        responseMagento.status = false;
                    }
                    if (responseMagento.status) {
                        magentoItemId = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductCreateResponse/result");
                        responseMagento.magentoItemId = magentoItemId;
                    }
                } else if (operation == "update") {
                    faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                    faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                    responseMagento.faultCode = faultCode;
                    responseMagento.faultString = faultString;
                    if (!!responseMagento.faultCode) {
                        responseMagento.status = false;
                    }
                    if (responseMagento.status) {
                        responseMagento.updated = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductUpdateResponse/result");
                    }
                }
            } catch (ex) {
                Utility.logException('MagentoWrapper.validateItemOperationResponse', ex);
            }
            return responseMagento;
        },

        transformCreateSalesOrderResponseForOrderLineId: function (xml) {
            var obj = {};

            var itemNodes = nlapiSelectNodes(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:folio3_salesOrderCreateSalesOrderResponse/orderitementityarray/item");

            for (var i in itemNodes) {
                var itemNode = itemNodes[i];
                var productSku = nlapiSelectValue(itemNode, 'product_sku');
                var orderItemId = nlapiSelectValue(itemNode, 'order_item_id');
                obj[productSku] = orderItemId;
            }

            return obj;
        },
        /**
         * Creates XML for Credit Memo and returns
         * @param creditMemoInfo
         * @param sessionId
         * @returns {string} XML String
         */
        getCreditMemoCreateXml: function (creditMemoInfo, sessionId) {
            var creditMemoXml = '';
            creditMemoXml += this.XmlHeader;

            creditMemoXml += '<urn:salesOrderCreditmemoCreate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            creditMemoXml += '  <sessionId xmlns:xs="http://www.w3.org/2000/XMLSchema-instance" xsi:type="xsd:string" xs:type="type:string">' + sessionId + '</sessionId>';
            creditMemoXml += '  <orderIncrementId xmlns:xs="http://www.w3.org/2000/XMLSchema-instance" xsi:type="xsd:string" xs:type="type:string">' + creditMemoInfo.orderId + '</orderIncrementId>';
            creditMemoXml += '  <creditmemoData xmlns:xs="http://www.w3.org/2000/XMLSchema-instance" xsi:type="urn:salesOrderCreditmemoData" xs:type="type:salesOrderCreditmemoData">';
            creditMemoXml += '      <qtys xsi:type="urn:orderItemIdQtyArray" soapenc:arrayType="urn:orderItemIdQty[' + creditMemoInfo.items.length + ']" type="urn:Magento">';

            for (var i in creditMemoInfo.items) {
                creditMemoXml += '          <orderItemIdQty>';
                creditMemoXml += '              <order_item_id type="http://www.w3.org/2001/XMLSchema">' + creditMemoInfo.items[i].orderItemId + '</order_item_id>';
                creditMemoXml += '              <qty xs:type="type:double">' + creditMemoInfo.items[i].qty + '</qty>';
                creditMemoXml += '          </orderItemIdQty>';
            }

            creditMemoXml += '      </qtys>';
            creditMemoXml += '      <shipping_amount xsi:type="xsd:double" xs:type="type:double">' + creditMemoInfo.shippingCost + '</shipping_amount>';
            creditMemoXml += '      <adjustment_positive xsi:type="xsd:double" xs:type="type:double">' + creditMemoInfo.adjustmentPositive + '</adjustment_positive>';
            creditMemoXml += '      <adjustment_negative xsi:type="xsd:double" xs:type="type:double">' + creditMemoInfo.adjustmentNegative + '</adjustment_negative>';
            creditMemoXml += '  </creditmemoData>';
            creditMemoXml += '  <comment xmlns:xs="http://www.w3.org/2000/XMLSchema-instance" xsi:type="xsd:string" xs:type="type:string">' + creditMemoInfo.comment + '</comment>';
            creditMemoXml += '  <notifyCustomer xmlns:xs="http://www.w3.org/2000/XMLSchema-instance" xsi:type="xsd:int" xs:type="type:int">' + creditMemoInfo.notifyCustomer + '</notifyCustomer>';
            creditMemoXml += '  <includeComment xmlns:xs="http://www.w3.org/2000/XMLSchema-instance" xsi:type="xsd:int" xs:type="type:int">' + creditMemoInfo.includeComment + '</includeComment>';
            creditMemoXml += '  <refundToStoreCreditAmount xmlns:xs="http://www.w3.org/2000/XMLSchema-instance" xsi:type="xsd:string" xs:type="type:string">' + creditMemoInfo.refundToStoreCreditAmount + '</refundToStoreCreditAmount>';
            creditMemoXml += '</urn:salesOrderCreditmemoCreate>';

            creditMemoXml += this.XmlFooter;

            return creditMemoXml;
        },
        /**
         * This function transform create credit memo response into object
         * @param xml
         * @return {object}
         */
        transformCreditMemoCreateResponse: function (xml) {
            var obj = {};
            var creditMemoId = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:salesOrderCreditmemoCreateResponse/result");
            obj.creditMemoId = creditMemoId;
            return obj;
        },
        /* Function to generate xml for addSalesOrderComment call
         * @param {string} sessionID - magento session id
         * @param {object} dataObject- to hold data of netsuite needed for addComment call
         * @returns {string} XML String
         */
        getAddSalesOrderCommentXML: function (sessionID, dataObject) {
            var xml = '';
            if (!!sessionID && !!dataObject) {
                xml = xml + '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Magento">';
                xml = xml + '<soapenv:Header/>';
                xml = xml + '<soapenv:Body>';
                xml = xml + '<urn:salesOrderAddComment soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
                xml = xml + '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionID + '</sessionId>';
                xml = xml + '<orderIncrementId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + dataObject.soMagentoId + '</orderIncrementId>';
                xml = xml + '<comment xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + dataObject.history + '</comment>';
                xml = xml + '<status xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + dataObject.orderstatus + '</status>';
                xml = xml + '<notify xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance"/>';
                xml = xml + '</urn:salesOrderAddComment>';
                xml = xml + '</soapenv:Body>';
                xml = xml + '</soapenv:Envelope>';
            }
            return xml;
        },
        /* Function to parse and validate response received against addComments call
         * @param {string} xml - response xml received from magento
         */
        validateAddCommentResponse: function (xml) {
            var responseMagento = {};
            responseMagento.status = true;
            try {
                responseMagento.faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                responseMagento.faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                if (!!responseMagento.faultCode) {
                    responseMagento.status = false;
                }
            } catch (ex) {
                Utility.logException('XmlUtility.validateAddCommentResponse', ex);
            }
            return responseMagento;
        },

        getSessionIDFromServer: function (userName, apiKey, required) {
            if (typeof required === "boolean" && !required) {
                return "DUMMY_SESSION_ID";
            }
            var sessionID = null;
            var loginXML = this.getLoginXml(userName, apiKey);
            try {
                var responseXML = this.soapRequestToServer(loginXML);
                sessionID = nlapiSelectValue(responseXML, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:loginResponse/loginReturn");
            } catch (ex) {
                Utility.logException('MagentoWrapper.getSessionIDFromServer', ex);
            }
            return sessionID;
        },

        /**
         * Gets Sales Order from Magento
         * @param order
         * @param sessionID
         * @returns {*}
         */
        getSalesOrders: function (order, sessionID) {
            var orderXML = MagentoWrapper.getSalesOrderListXML(order, sessionID);
            // Make Call and Get Data
            var responseMagentoOrders = MagentoWrapper.validateResponse(MagentoWrapper.soapRequestToServer(orderXML), 'order');

            // If some problem
            if (!responseMagentoOrders.status) {
                var result = {};
                result.errorMsg = responseMagentoOrders.faultCode + '--' + responseMagentoOrders.faultString;
                return result;
            }

            return responseMagentoOrders;
        },

        getSalesOrderInfo: function (increment_id, sessionID) {
            var productXML = MagentoWrapper.getSalesOrderInfoXML(increment_id, sessionID);

            var responseMagentoProducts = MagentoWrapper.validateResponse(MagentoWrapper.soapRequestToServer(productXML), 'product');

            // If some problem
            if (!responseMagentoProducts.status) {
                var result = {};
                result.errorMsg = responseMagentoProducts.faultCode + '--' + responseMagentoProducts.faultString;
                return result;
            }

            return responseMagentoProducts;
        },

        updateItem: function (product, sessionID, magID, isParent) {
            var itemXML = MagentoWrapper.getUpdateItemXML(product, sessionID, magID, isParent);

            var responseMagento = MagentoWrapper.validateItemExportResponse(MagentoWrapper.soapRequestToServer(itemXML), 'update');

            return responseMagento;
        },

        getProduct: function (sessionID, product) {
            var xml = MagentoWrapper.getProductListXML(sessionID, product);
            var response = MagentoWrapper.validateGetIDResponse(MagentoWrapper.soapRequestToServer(xml));

            return response;
        },

        createFulfillment: function (sessionID, magentoItemIds, magentoSOId, fulfillRec) {
            var fulfillmentXML = MagentoWrapper.getCreateFulfillmentXML(sessionID, magentoItemIds, magentoSOId, fulfillRec);

            Utility.logDebug('MagentoWrapper.getCreateFulfillmentXML', 'EOS ' + fulfillmentXML);

            var responseMagento = MagentoWrapper.validateFulfillmentExportResponse(MagentoWrapper.soapRequestToServer(fulfillmentXML));

            return responseMagento;
        },

        /**
         * Create invoice in magento
         * @param sessionID
         * @param netsuiteInvoiceObj
         * @param store
         * @returns {string}
         */
        createInvoice: function (sessionID, netsuiteInvoiceObj, store) {
            var magentoInvoiceCreationUrl = store.entitySyncInfo.salesorder.magentoSOClosingUrl;
            Utility.logDebug('magentoInvoiceCreationUrl_w', magentoInvoiceCreationUrl);

            var dataObj = {};
            dataObj.increment_id = netsuiteInvoiceObj.otherSystemSOId;
            var onlineCapturingPaymentMethod = this.checkPaymentCapturingMode(netsuiteInvoiceObj, store);
            dataObj.capture_online = onlineCapturingPaymentMethod.toString();
            var requestParam = {"data": JSON.stringify(dataObj), "apiMethod": "createInvoice"};
            Utility.logDebug('requestParam', JSON.stringify(requestParam));
            var resp = this._nlapiRequestURL(magentoInvoiceCreationUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('responseBody_w', responseBody);
            responseBody = JSON.parse(responseBody);
            if(responseBody.status)
                responseBody.data.id = responseBody.data.increment_id;
            return responseBody;
        },

        /**
         * Check either payment of this Invoice should capture online or not
         * @param netsuiteInvoiceObj
         * @param store
         * @returns {boolean}
         */
        checkPaymentCapturingMode: function (netsuiteInvoiceObj, store) {
            var salesOrderId = netsuiteInvoiceObj.netsuiteSOId;
            var isSOFromOtherSystem = netsuiteInvoiceObj.isSOFromOtherSystem;
            var sOPaymentMethod = netsuiteInvoiceObj.sOPaymentMethod;
            var isOnlineMethod = this.isOnlineCapturingPaymentMethod(sOPaymentMethod, store);
            if (!!isSOFromOtherSystem && isSOFromOtherSystem == 'T' && isOnlineMethod) {
                return true;
            } else {
                return false;
            }
            //Utility.logDebug('salesOrderId # isSOFromOtherSystem # sOPaymentMethod', salesOrderId + ' # ' + isSOFromOtherSystem + ' # ' + sOPaymentMethod);
        },

        /**
         * Check either payment method capturing is online supported or not??
         * @param sOPaymentMethodId
         * @param store
         * @returns {boolean}
         */
        isOnlineCapturingPaymentMethod: function (sOPaymentMethodId, store) {
            var onlineSupported = false;
            switch (sOPaymentMethodId) {
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.Discover:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.MasterCard:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.Visa:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.AmericanExpress:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.PayPal:
                case store.entitySyncInfo.salesorder.netsuitePaymentTypes.EFT:
                    onlineSupported = true;
                    break;
                default :
                    onlineSupported = false;
                    break;
            }

            return onlineSupported;
        },

        /**
         * Create refund in magento
         * @param sessionID
         * @param netsuiteRefundObj
         * @param store
         */
        createCustomerRefund: function (sessionID, cashRefund, store) {
            if (cashRefund.items.length === 0 && !cashRefund.adjustmentPositive) {
                Utility.throwException(null, 'No item found to refund');
            }
            Utility.logDebug('cashRefund object', JSON.stringify(cashRefund));
            var params = this.getCustomerRefundRequestParameters(cashRefund, store);
            var requestParam = {"data": JSON.stringify(params), "apiMethod": "createCreditMemo"};
            Utility.logDebug('requestParam', JSON.stringify(requestParam));
            var magentoCreditMemoCreationUrl = store.entitySyncInfo.salesorder.magentoSOClosingUrl;
            Utility.logDebug('magentoCreditMemoCreationUrl', magentoCreditMemoCreationUrl);
            var resp = this._nlapiRequestURL(magentoCreditMemoCreationUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('responseBody_w', responseBody);
            responseBody = JSON.parse(responseBody);
            return responseBody;


            /*var requestXml = XmlUtility.getCreditMemoCreateXml(cashRefund, store.sessionID);
             Utility.logDebug('cashRefund requestXml', requestXml);
             var responseMagento = XmlUtility.validateAndTransformResponse(XmlUtility.soapRequestToMagento(requestXml), XmlUtility.transformCreditMemoCreateResponse);

             if (responseMagento.status) {
             ExportCustomerRefunds.setCashRefundMagentoId(responseMagento.result.creditMemoId, cashRefundNsId);
             } else {
             Utility.logDebug('RefundExportHelper.processCustomerRefund', responseMagento.faultString);
             ExportCustomerRefunds.markRecords(cashRefundNsId, responseMagento.faultString);
             }*/
        },

        /**
         * Get Credit Memo request parameters
         * @param cashRefundObj
         */
        getCustomerRefundRequestParameters: function (cashRefundObj, store) {
            var params = {};
            params.order_increment_id = cashRefundObj.orderId;
            params.invoice_increment_id = cashRefundObj.invoiceId;
            params.shipping_cost = !!cashRefundObj.shippingCost ? cashRefundObj.shippingCost : 0;
            params.adjustment_positive = !!cashRefundObj.adjustmentPositive ? cashRefundObj.adjustmentPositive : 0;
            params.quantities = [];
            for (var i in cashRefundObj.items) {
                params.quantities.push({
                    order_item_id: cashRefundObj.items[i].orderItemId,
                    qty: cashRefundObj.items[i].qty
                });
                //params.quantities[cashRefundObj.items[i].orderItemId] = cashRefundObj.items[i].qty;
            }

            var onlineCapturingPaymentMethod = this.checkRefundPaymentCapturingMode(cashRefundObj.paymentMethod, cashRefundObj.isSOFromOtherSystem, store);
            params.capture_online = onlineCapturingPaymentMethod.toString();

            return params;
        },

        /**
         * Check either payment of this Invoice should capture online or not
         * @param sOPaymentMethod
         * @param isSOFromOtherSystem
         * @param store
         * @returns {boolean}
         */
        checkRefundPaymentCapturingMode: function (sOPaymentMethod, isSOFromOtherSystem, store) {
            var isOnlineMethod = this.isOnlineCapturingPaymentMethod(sOPaymentMethod, store);
            if (!!isSOFromOtherSystem && isSOFromOtherSystem == 'T' && isOnlineMethod) {
                return true;
            } else {
                return false;
            }
        },
        createTracking: function (result, carrier, carrierText, tracking, sessionID, serverSOId) {
            var trackingXML = MagentoWrapper.createTrackingXML(result, carrier, carrierText, tracking, sessionID);

            var responseTracking = MagentoWrapper.validateTrackingCreateResponse(MagentoWrapper.soapRequestToServer(trackingXML));

            return responseTracking;
        },

        getCustomerAddress: function (customerID, sessionID) {
            var custAddrXML = MagentoWrapper.getCustomerAddressXML(customerID, sessionID);

            var addressResponse =
                MagentoWrapper.validateCustomerAddressResponse(MagentoWrapper.soapRequestToServer(custAddrXML));

            return addressResponse;

        },

        createSalesOrder: function (internalId, orderRecord, store, sessionId) {
            var requestXml = ConnectorConstants.CurrentWrapper.getCreateSalesOrderXml(orderRecord, sessionId);

            ConnectorCommon.createLogRec(internalId, requestXml, "Sales Order Export");

            Utility.logDebug('store.endpoint', store.endpoint);
            Utility.logDebug('requestXml', requestXml);

            var xml = MagentoWrapper.soapRequestToServer(requestXml);

            var responseMagento = ConnectorConstants.CurrentWrapper.validateAndTransformSalesorderCreationResponse(xml);
            responseMagento.magentoOrderLineIdData = null;

            if (responseMagento.status) {
                responseMagento.magentoOrderLineIdData = ConnectorConstants.CurrentWrapper.transformCreateSalesOrderResponseForOrderLineId(xml);
            }

            return responseMagento;
        },

        hasDifferentLineItemIds: function () {
            return true;
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
                xml = xml + '<prefix xsi:type="xsd:string" xs:type="type:string"></prefix>';
                xml = xml + '<suffix xsi:type="xsd:string" xs:type="type:string"></suffix>';
                xml = xml + '<dob xsi:type="xsd:string" xs:type="type:string"></dob>';
                xml = xml + '<taxvat xsi:type="xsd:string" xs:type="type:string"></taxvat>';
                xml = xml + '<gender xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.gender + '</gender>';
                //xml = xml + '<group_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.pricelevel + '</group_id>';
                xml = xml + '</customerData>';
                xml = xml + '</urn:customerCustomerCreate>';
                xml = xml + '</soapenv:Body>';
                xml = xml + '</soapenv:Envelope>';

            }

            return xml;

        },

        getMagentoUpdateCustomerRequestXML: function (customerDataObject, sessionId) {
            Utility.logDebug('Update Price Level', customerDataObject.pricelevel);
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
                xml = xml + '<prefix xsi:type="xsd:string" xs:type="type:string"></prefix>';
                xml = xml + '<suffix xsi:type="xsd:string" xs:type="type:string"></suffix>';
                xml = xml + '<dob xsi:type="xsd:string" xs:type="type:string"></dob>';
                xml = xml + '<taxvat xsi:type="xsd:string" xs:type="type:string"></taxvat>';
                xml = xml + '<gender xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.gender + '</gender>';
                xml = xml + '<group_id xsi:type="xsd:int" xs:type="type:int">' + customerDataObject.pricelevel + '</group_id>';
                xml = xml + '</customerData>';
                xml = xml + '</urn:customerCustomerUpdate>';
                xml = xml + '</soapenv:Body>';
                xml = xml + '</soapenv:Envelope>';
            }

            return xml;

        },
        getMagentoCreateAddressRequestXML: function (customerAddressObject, sessionId, magentoCustomerId) {
            var xml = '';

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
        upsertCustomer: function (customerRecord, store, type) {
            var requsetXML = type.toString() === "create" ? this.getMagentoCreateCustomerRequestXML(customerRecord, store.sessionID)
                : this.getMagentoUpdateCustomerRequestXML(customerRecord, store.sessionID);

            Utility.logDebug('customer_requsetXML ', requsetXML);
            Utility.logDebug('store_wahaj ', JSON.stringify(store));
            ConnectorCommon.createLogRec('Customer', requsetXML, "Customer");
            var responseMagento = MagentoWrapper.validateCustomerExportOperationResponse(MagentoWrapper.soapRequestToServerSpecificStore(requsetXML, store), type);
            Utility.logDebug('responseMagento_wahaj ', JSON.stringify(responseMagento));
            return responseMagento;
        },
        requiresAddressCall: function () {
            return true;
        },
        upsertCustomerAddress: function (scannedAddressForMagento, store, magentoCustomerId, type) {
            var requsetXML = type.toString() === "create" ? this.getMagentoCreateAddressRequestXML(scannedAddressForMagento, store.sessionID, magentoCustomerId)
                : this.getMagentoUpdateAddressRequestXML(scannedAddressForMagento, store.sessionID, magentoCustomerId);

            ConnectorCommon.createLogRec('Customer', requsetXML, "Address");
            var responseMagento = MagentoWrapper.validateCustomerAddressExportOperationResponse(MagentoWrapper.soapRequestToServerSpecificStore(requsetXML, store), type);
            return responseMagento;
        },
        upsertCoupons: function (promoCodeRecord) {
            var magentoUrl = this.getMagentoUrl(ConnectorConstants.CurrentStore);
            Utility.logDebug('magentoUrl', magentoUrl);

            var authHeaderName = WsmUtilityApiConstants.Header.NetSuiteMagentoConnector.Name;
            var authHeaderValue = WsmUtilityApiConstants.Header.NetSuiteMagentoConnector.Value;
            var requestHeaders = {};
            requestHeaders[authHeaderName] = authHeaderValue;

            var requestParam = {
                "apiMethod": "upsertShoppingCart",
                "data": JSON.stringify(promoCodeRecord)
            };
            Utility.logDebug('requestParam', JSON.stringify(requestParam));
            //Utility.logDebug('requestHeaders', JSON.stringify(requestHeaders));

            var resp = this._nlapiRequestURL(magentoUrl, requestParam, requestHeaders, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('export promo code responseBody', responseBody);
            var responseMagento = JSON.parse(responseBody);

            return responseMagento;
        },

        getMagentoUrl: function (store) {
            var magentoUrl = '';
            if (!!store) {
                var entitySyncInfo = store.entitySyncInfo;
                if (!!entitySyncInfo && !!entitySyncInfo.magentoCustomizedApiUrl) {
                    magentoUrl = entitySyncInfo.magentoCustomizedApiUrl;
                }
            }
            return magentoUrl;
        },

        cancelSalesOrder: function (data) {
            var store = ConnectorConstants.CurrentStore;
            var magentoUrl = this.getMagentoUrl(store);
            //Utility.logDebug('magentoUrl', magentoUrl);

            var authHeaderName = WsmUtilityApiConstants.Header.NetSuiteMagentoConnector.Name;
            var authHeaderValue = WsmUtilityApiConstants.Header.NetSuiteMagentoConnector.Value;
            var requestHeaders = {};
            requestHeaders[authHeaderName] = authHeaderValue;

            var requestParam = {
                "apiMethod": "cancelSalesOrder",
                "data": JSON.stringify(data)
            };
            Utility.logDebug('requestParam', JSON.stringify(requestParam));

            var resp = this._nlapiRequestURL(magentoUrl, requestParam, requestHeaders, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('cancelSalesOrder responseBody', responseBody);
            var resposeObj = JSON.parse(responseBody);
            var responseMagento = {
                status: true
            };

            if (resposeObj.status === 0) {
                responseMagento.status = false;
                responseMagento.error = resposeObj.message;
            }

            return responseMagento;
        },

        requiresOrderUpdateAfterCancelling: function () {
            return true;
        },

        getCatalogProductAttributeTierPriceUpdateXML: function (tierPriceDataObj, sessionID) {
            var xml = '';

            xml += this.XmlHeader;

            xml += '<urn:catalogProductAttributeTierPriceUpdate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            xml += '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionID + '</sessionId>';
            xml += '<product xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + tierPriceDataObj.product + '</product>';

            var catalogProductTierPriceEntityArray = tierPriceDataObj.catalogProductTierPriceEntityArray;

            xml += '<tier_price xsi:type="urn:catalogProductTierPriceEntityArray" soapenc:arrayType="urn:catalogProductTierPriceEntity[' + catalogProductTierPriceEntityArray.length + ']">';

            for (var i in catalogProductTierPriceEntityArray) {

                var catalogProductTierPriceEntity = catalogProductTierPriceEntityArray[i];

                xml = xml + '<catalogProductTierPriceEntity>';
                xml = xml + '<qty xsi:type="xsd:int">' + catalogProductTierPriceEntity.qty + '</qty>';
                xml = xml + '<price xsi:type="xsd:double">' + catalogProductTierPriceEntity.price + '</price>';
                xml = xml + '<special_price xsi:type="xsd:string">' + catalogProductTierPriceEntity.specialPrice + '</special_price>';
                xml = xml + '</catalogProductTierPriceEntity>';
            }

            xml += '</tier_price>';
            xml += '<identifierType xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + tierPriceDataObj.identifierType + '</identifierType>';
            xml += '</urn:catalogProductAttributeTierPriceUpdate>';

            xml += this.XmlFooter;

            return xml;
        },
        transformCatalogProductAttributeTierPriceUpdateResponse: function (xml) {
            var obj = {};

            var result = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductAttributeTierPriceUpdateResponse/result");
            obj.result = result;

            return obj;
        },

        syncProductTierPrice: function (product) {
            var tierPriceDataObj = product.tierPriceDataObj;

            var sessionID = ConnectorConstants.CurrentStore.sessionID;
            var catalogProductAttributeTierPriceUpdateXML = this.getCatalogProductAttributeTierPriceUpdateXML(tierPriceDataObj, sessionID);
            var responseMagento = this.validateAndTransformResponse(this.soapRequestToServer(catalogProductAttributeTierPriceUpdateXML), this.transformCatalogProductAttributeTierPriceUpdateResponse);

            return responseMagento;
        },


        getCCType: function (ccType, netsuitePaymentTypes) {
            ccType += '';
            // Visa
            if (ccType === '001' || ccType === '0001' || ccType === 'VI') {
                return netsuitePaymentTypes.Visa;
            }
            // Master Card
            if (ccType === '002' || ccType === '0002' || ccType === 'MC') {
                return netsuitePaymentTypes.MasterCard;
            }
            // American Express
            if (ccType === '003' || ccType === '0003' || ccType === 'AE') {
                return netsuitePaymentTypes.AmericanExpress;
            }
            // Discover
            if (ccType === '004' || ccType === '0004' || ccType === 'DI') {// Diners in Magento
                return netsuitePaymentTypes.Discover;
            }
            return '';
        },
        getPaymentInfo: function (payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes) {
            var paymentInfo = {
                "paymentmethod": "",
                "pnrefnum": "",
                "ccapproved": "",
                "paypalauthid": ""
            };
            Utility.logDebug("MagentoWrapper.getPaymentInfo", "Start");
            var paypalPaymentMethod = netsuitePaymentTypes.PayPal;

            /*if (payment.method.toString() === 'ccsave') {
             rec.setFieldValue('paymentmethod', this.getCCType(payment.ccType, netsuitePaymentTypes));
             if(!!payment.authorizedId) {
             rec.setFieldValue('pnrefnum', payment.authorizedId);
             }
             rec.setFieldValue('ccapproved', 'T');
             return;
             }
             //paypal_direct
             else if (payment.method.toString() === 'paypal_direct') {
             rec.setFieldValue('paymentmethod', this.getCCType(payment.ccType, netsuitePaymentTypes));
             rec.setFieldValue('pnrefnum', payment.authorizedId);
             rec.setFieldValue('ccapproved', 'T');
             return;
             }*/

            var paymentMethod = (payment.method);

            Utility.logDebug("paymentMethod", paymentMethod);
            Utility.logDebug("!paymentMethod", !paymentMethod);

            // if no payment method found return
            if (!paymentMethod) {
                return paymentInfo;
            }

            // initialize scrub
            ConnectorConstants.initializeScrubList();
            var system = ConnectorConstants.CurrentStore.systemId;

            Utility.logDebug("ConnectorConstants.ScrubsList", JSON.stringify(ConnectorConstants.ScrubsList));

            paymentMethod = (paymentMethod + "").toLowerCase();

            Utility.logDebug("system", system);
            Utility.logDebug("paymentMethod", paymentMethod);

            if (!!payment.ccType && magentoCCSupportedPaymentTypes.indexOf(paymentMethod) > -1) {
                Utility.logDebug("Condition (1)", "");
                paymentInfo.paymentmethod = FC_ScrubHandler.findValue(system, "CreditCardType", payment.ccType);
                Utility.logDebug("paymentInfo.paymentmethod", paymentInfo.paymentmethod);
                if (!!payment.authorizedId) {
                    paymentInfo.pnrefnum = payment.authorizedId;
                }
                paymentInfo.ccapproved = "T";
            }
            else if (paymentMethod === 'paypal_express' || paymentMethod === 'payflow_advanced') {
                Utility.logDebug("Condition (2)", "");
                paymentInfo.paymentmethod = paypalPaymentMethod;
                paymentInfo.paypalauthid = payment.authorizedId;
            }
            else {
                Utility.logDebug("Condition (3)", "");
                var otherPaymentMethod = paymentMethod;
                Utility.logDebug("paymentMethodLookup_Key", otherPaymentMethod);
                var paymentMethodLookupValue = FC_ScrubHandler.findValue(system, 'PaymentMethod', otherPaymentMethod);
                Utility.logDebug("paymentMethodLookup_Value", paymentMethodLookupValue);
                if (!!paymentMethodLookupValue && paymentMethodLookupValue != otherPaymentMethod) {
                    paymentInfo.paymentmethod = paymentMethodLookupValue;
                }
            }
            Utility.logDebug("MagentoWrapper.getPaymentInfo", "End");
            return paymentInfo;
        },

        getPaymentInfoToExport: function (orderRecord, orderDataObject, store) {
            var obj = {};
            // initialize scrub
            ConnectorConstants.initializeScrubList();
            var system = ConnectorConstants.CurrentStore.systemId;

            var allMagentoPaymentMethodConfigured = store.entitySyncInfo.salesorder.allMagentoPaymentMethodConfigured;
            var paymentMethod = orderRecord.getFieldValue('paymentmethod');
            if (!!allMagentoPaymentMethodConfigured && allMagentoPaymentMethodConfigured == 'true' && !!paymentMethod) {
                var ccNumber = orderRecord.getFieldValue('ccnumber');
                var ccExpireDate = orderRecord.getFieldValue('ccexpiredate');
                var ccName = orderRecord.getFieldValue('ccname');

                Utility.logDebug("paymentMethodLookup_Key", paymentMethod);
                var paymentMethodLookupValue = FC_ScrubHandler.findValue(system, "PaymentMethod", paymentMethod);
                Utility.logDebug("paymentMethodLookup_Value", paymentMethodLookupValue);
                var paymentMethodDetail = (paymentMethodLookupValue + '').split('_');
                var magentoPaymentMethod = paymentMethodDetail.length === 2 ? paymentMethodDetail[0] : '';
                var magentoCCType = paymentMethodDetail.length === 2 ? paymentMethodDetail[1] : '';
                // If payment method still not found in mapping, then set default
                if (!magentoPaymentMethod) {
                    magentoPaymentMethod = FC_ScrubHandler.findValue(system, "PaymentMethod", "DEFAULT_EXT");
                }
                obj.paymentMethod = magentoPaymentMethod;
                obj.ccType = magentoCCType;
                obj.ccNumber = '';
                if (!!ccNumber) {
                    var dummyCCNumber = this.getDummyCreditCardNumber(store, ccNumber, paymentMethod);
                    if (!!dummyCCNumber) {
                        obj.ccNumber = dummyCCNumber;
                        orderDataObject.history += '  ##  ' + store.entitySyncInfo.salesorder.dummyCreditCardMessage + '  ##  ';
                    }
                }
                obj.ccOwner = !!ccName ? ccName : '';
                obj.ccExpiryYear = '';
                obj.ccExpiryMonth = '';
                if (!!ccExpireDate) {
                    // Keep it safe
                    try {
                        var expiryDetails = (ccExpireDate).split('/');
                        obj.ccExpiryMonth = expiryDetails.length === 2 ? expiryDetails[0] : '';
                        obj.ccExpiryYear = expiryDetails.length === 2 ? expiryDetails[1] : '';
                    } catch (e) {
                    }
                }
            } else {
                var defaultMagentoPaymentMethod = FC_ScrubHandler.findValue(system, "PaymentMethod", "DEFAULT_EXT");
                obj.paymentMethod = defaultMagentoPaymentMethod;
            }
            return obj;
        },
        /**
         * Get dummy credit card number according to credit card type, otherwise show netsuite entered credit card number
         * @param store
         */
        getDummyCreditCardNumber: function (store, netSuiteCCNumber, ccType) {
            var ccNumber = '';
            var creditCardsDataList = store.entitySyncInfo.salesorder.netsuiteCreditCardInfo;
            for (var i = 0; i < creditCardsDataList.length; i++) {
                var obj = creditCardsDataList[i];
                if (obj.id == ccType) {
                    ccNumber = obj.dummyNumber;
                    break;
                }
            }
            return ccNumber;
        },

        getNsProductIdsByExtSysIds: function (magentoIds, enviornment) {
            var cols = [];
            var filterExpression = "";
            var resultArray = [];
            var result = {};
            var magentoIdId;

            if (enviornment === 'production') {
                magentoIdId = 'custitem_magentoid';
            } else {
                //magentoIdId = 'custitem_magento_sku';
                magentoIdId = ConnectorConstants.Item.Fields.MagentoId;
            }

            result.errorMsg = '';

            try {
                /*filterExpression = "[[";
                 for (var x = 0; x < magentoIds.length; x++) {
                 // multiple store handling
                 var magentoIdForSearching = ConnectorCommon.getMagentoIdForSearhing(ConnectorConstants.CurrentStore.systemId, magentoIds[x].product_id);
                 filterExpression = filterExpression + "['" + magentoIdId + "','contains','" + magentoIdForSearching + "']";
                 if ((x + 1) < magentoIds.length) {
                 filterExpression = filterExpression + ",'or' ,";
                 }
                 }
                 filterExpression = filterExpression + ']';
                 filterExpression += ',"AND",["type", "anyof", "InvtPart", "NonInvtPart"]]';
                 Utility.logDebug(' filterExpression', filterExpression);
                 filterExpression = eval(filterExpression);
                 cols.push(new nlobjSearchColumn(magentoIdId, null, null));
                 var recs = nlapiSearchRecord('item', null, filterExpression, cols);*/

                filterExpression = "[[";
                for (var x = 0; x < magentoIds.length; x++) {
                    // multiple store handling
                    filterExpression = filterExpression + "['itemid','is','" + magentoIds[x].product_id + "']";
                    if ((x + 1) < magentoIds.length) {
                        filterExpression = filterExpression + ",'or' ,";
                    }
                }
                filterExpression = filterExpression + ']';
                filterExpression += ',"AND",["type", "anyof", "InvtPart", "NonInvtPart", "GiftCert"]]';
                Utility.logDebug(' filterExpression', filterExpression);
                filterExpression = eval(filterExpression);
                cols.push(new nlobjSearchColumn(magentoIdId, null, null));
                cols.push(new nlobjSearchColumn('itemid', null, null));
                var recs = nlapiSearchRecord('item', null, filterExpression, cols);

                if (recs && recs.length > 0) {
                    for (var i = 0; i < recs.length; i++) {
                        var obj = {};
                        obj.internalId = recs[i].getId();

                        var itemid = recs[i].getValue('itemid');
                        if (!Utility.isBlankOrNull(itemid)) {
                            var itemidArr = itemid.split(':');
                            itemid = (itemidArr[itemidArr.length - 1]).trim();
                        }
                        obj.magentoID = itemid;
                        resultArray[resultArray.length] = obj;
                    }
                }
                result.data = resultArray;
            } catch (ex) {
                Utility.logException('Error in getNetsuiteProductIdByMagentoId', ex);
                result.errorMsg = ex.toString();
            }
            return result;
        },
        /**
         * Get Shopify Item Ids by NetSuite Item Ids
         * @param itemIdsArr
         * @return {Object}
         */
        getExtSysItemIdsByNsIds: function (itemIdsArr) {
            var magentoItemIds = {};

            if (itemIdsArr.length > 0) {
                var fils = [];
                var cols = [];
                var result;

                fils.push(new nlobjSearchFilter('internalid', null, 'anyof', itemIdsArr, null));
                cols.push(new nlobjSearchColumn(ConnectorConstants.Item.Fields.MagentoId, null, null));
                cols.push(new nlobjSearchColumn('itemid', null, null));// this is purest specific

                result = nlapiSearchRecord('item', null, fils, cols) || [];

                if (result.length > 0) {
                    for (var i in result) {
                        var magentoId = result[i].getValue('itemid');
                        magentoId = magentoId.split(':');
                        magentoItemIds[result[i].getId()] = (magentoId[magentoId.length - 1]).trim();
                        /*
                         This logic will work for Magento and WOO b/c custom field contains product id
                         in other systems as well as with Shopify
                         var magentoId = result[i].getValue(ConnectorConstants.Item.Fields.MagentoId);
                         magentoId = !Utility.isBlankOrNull(magentoId) ? JSON.parse(magentoId) : [];
                         magentoId = ConnectorCommon.getMagentoIdFromObjArray(magentoId, ConnectorConstants.CurrentStore.systemId);
                         magentoItemIds[result[i].getId()] = magentoId;
                         */
                    }
                }
            }

            return magentoItemIds;
        },
        /**
         * Set inventory item related fields in Item Object
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         */
        setInventoryItemFields: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            itemObject.otherSystemItemType = getMagentoItemType(itemType, itemObject);

            if (itemObject.tierPricingEnabled && !!itemObject.catalogProductTierPriceEntityArray && itemObject.catalogProductTierPriceEntityArray.length > 0) {
                itemObject.price = itemObject.catalogProductTierPriceEntityArray[0].price;
                itemObject.specialPrice = itemObject.catalogProductTierPriceEntityArray[0].specialPrice;
            }

            if (itemObject.isInactive === 'T') {
                itemObject.magentoStatus = store.entitySyncInfo.item.status.disabled;
            } else {
                itemObject.magentoStatus = store.entitySyncInfo.item.status.enabled;
            }

            if (itemObject.isOnline === 'T') {
                itemObject.magentoVisibility = store.entitySyncInfo.item.visibility.visible;
                if (itemObject.isMatrixChildItem) {
                    if (!!store.entitySyncInfo.item.showMatrixChildIndependently && store.entitySyncInfo.item.showMatrixChildIndependently == 'true') {
                        itemObject.magentoVisibility = store.entitySyncInfo.item.visibility.visible;
                    } else {
                        itemObject.magentoVisibility = store.entitySyncInfo.item.visibility.notVisible;
                    }
                }
            } else {
                itemObject.magentoVisibility = store.entitySyncInfo.item.visibility.notVisible;
            }

            itemObject.additionalAttributes = [];
            itemObject.configurableProductAttributes = [];
            if (!!itemObject.matrixParentAttributes && itemObject.matrixParentAttributes.length > 0) {
                for (var i = 0; i < itemObject.matrixParentAttributes.length; i++) {
                    var matrixParentAttr = itemObject.matrixParentAttributes[i];
                    if (matrixParentAttr.netSuiteItemOptionUseForVariantProduct === 'F') {
                        itemObject.additionalAttributes.push({
                            key: matrixParentAttr.itemAttributeCode,
                            value: matrixParentAttr.itemAttributeValues
                        });
                    } else {
                        itemObject.configurableProductAttributes.push({
                            key: matrixParentAttr.itemAttributeCode,
                            value: matrixParentAttr.itemAttributeValues
                        });
                    }
                }
            }

            if (!!itemObject.matrixChildAttributes && itemObject.matrixChildAttributes.length > 0) {
                for (var i = 0; i < itemObject.matrixChildAttributes.length; i++) {
                    var matrixChildAttr = itemObject.matrixChildAttributes[i];
                    itemObject.additionalAttributes.push({
                        key: matrixChildAttr.itemAttributeCode,
                        value: matrixChildAttr.itemAttributeValue
                    });
                }
            }

            if (!!itemObject.nonMatrixProductAttributes && itemObject.nonMatrixProductAttributes.length > 0) {
                for (var i = 0; i < itemObject.nonMatrixProductAttributes.length; i++) {
                    var nonMatrixAttr = itemObject.nonMatrixProductAttributes[i];
                    itemObject.additionalAttributes.push({
                        key: nonMatrixAttr.itemAttributeCode,
                        value: nonMatrixAttr.itemAttributeValue
                    });
                }
            }


            // Image specfic properties
            itemObject.image.types = 'image';
            itemObject.image.position = 0;
        },


        /**
         * Export Inventory Item to Magento Store
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         */

        exportInventoryItem: function (store, itemInternalId, itemType, itemObject, createOnly) {
            var responseBody = null;
            try {
                var id = itemObject.currentExternalSystemId;
                var createRecord = true;
                if (!!id) {
                    createRecord = false;
                }
                
                var parsedResponse = null;
                if (createRecord) {
                    // if id not exist then create record
                    var createProductXml = this.getCreateProductXml(store, itemInternalId, itemType, itemObject, createOnly);
                    var responseXml = MagentoWrapper.soapRequestToServer(createProductXml);
                    parsedResponse = ConnectorConstants.CurrentWrapper.validateAndTransformProductCreationResponse(responseXml);
                } else {
                    // if id exist then update record
                    var updateProductXml = this.getUpdateProductXml(store, itemInternalId, itemType, itemObject, createOnly);
                    var responseXml = MagentoWrapper.soapRequestToServer(updateProductXml);
                    parsedResponse = ConnectorConstants.CurrentWrapper.validateAndTransformProductUpdationResponse(responseXml);
                }
                Utility.logDebug('status  #  productId', parsedResponse.status + '  #  ' + parsedResponse.productId);

                // If this item is a parent item of a matrix item
                if (itemObject.isMatrixParentItem && createRecord) {
                    //Assign configurable attributes to configurable product
                    if (parsedResponse.status) {
                        var productId = parsedResponse.productId;
                        var mgRestAPiWrapper = new MagentoRestApiWrapper();
                        //Utility.logDebug('itemObject.additionalAttributes', JSON.stringify(itemObject.additionalAttributes));
                        //Utility.logDebug('itemObject.configurableProductAttributes', (!itemObject.configurableProductAttributes ? 'null' : JSON.stringify(itemObject.configurableProductAttributes)));
                        if (!!itemObject.configurableProductAttributes && itemObject.configurableProductAttributes.length > 0) {
                            var responseMagentoAssignAttr = mgRestAPiWrapper.assignAttributesToConfigurableProduct(productId, itemObject.configurableProductAttributes, store);
                            Utility.logDebug('responseMagentoAssignAttr from MagentoRestApiWrapper', JSON.stringify(responseMagentoAssignAttr));
                        }
                    } else {
                        //TODO: throw exception
                    }
                }

                // If this item is a child item of a matrix item
                var parentCreationResponse = null;
                if (itemObject.isMatrixChildItem && createRecord) {
                    if (parsedResponse.status) {
                        // check if parent already exist and associate it with that parent
                        if (!!itemObject.MatrixParent && !!itemObject.MatrixParent.currentExternalSystemId) {
                            Utility.logDebug('Association Status', 'Parent Product already exported, Creating association....');
                            var parentMatrixExternalSystemId = itemObject.MatrixParent.currentExternalSystemId;
                            var simpleProductId = parsedResponse.productId;
                            this.associateToConfigurableProduct(parentMatrixExternalSystemId, simpleProductId, store);
                        } else if (!!itemObject.MatrixParent) {
                            // Create parent matrix item first
                            Utility.logDebug('Association Status 1', 'Parent Product not exported, First exporting parent....');
                            parentCreationResponse = this.exportInventoryItem(store
                                , itemObject.MatrixParent.internalId, itemObject.MatrixParent.itemType
                                , itemObject.MatrixParent, createOnly);
                            if (parentCreationResponse.status) {
                                Utility.logDebug('Association Status 2', 'Now Creating association with exported parent....');
                                var parentMatrixExternalSystemId = parentCreationResponse.data.externalSystemItemId;
                                var simpleProductId = parsedResponse.productId;
                                this.associateToConfigurableProduct(parentMatrixExternalSystemId, simpleProductId, store);
                            }
                        }
                    } else {
                        //TODO: throw exception
                    }
                }

                if (!!store.entitySyncInfo.item.exportProductImages
                    && store.entitySyncInfo.item.exportProductImages == 'true'
                    && !!itemObject.image.fileId) {
                    this.exportProductImage(store, itemInternalId, itemType, itemObject, createOnly, createRecord ? parsedResponse.productId : id);
                }

                if (parsedResponse.status) {
                    parsedResponse.sku = parsedResponse.itemId;
                    responseBody = this.parseItemSuccessResponse(parsedResponse, parentCreationResponse);
                } else {
                    responseBody = this.parseItemFailureResponse(parsedResponse);
                }
            }
            catch (ex) {
                responseBody = this.parseItemFailureResponse(null, ex);
            }
            return responseBody;
        },

        /**
         * Export Product Image
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @param magentoProductId
         */
        exportProductImage: function (store, itemInternalId, itemType, itemObject, createOnly, magentoProductId) {
            var responseBody = null;
            try {
                var createRecord = true;
                if (!!itemObject.currentExternalSystemId) {
                    createRecord = false;
                }

                if (createRecord) {
                    responseBody = this.addProductImage(store, itemInternalId, itemType, itemObject, createOnly, magentoProductId);
                } else {
                    responseBody = this.UpdateProductImage(store, itemInternalId, itemType, itemObject, createOnly, magentoProductId);
                }
            }
            catch (ex) {
                responseBody = this.parseItemFailureResponse(null, ex);
            }
            return responseBody;
        },

        /**
         * Add product image in magento
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @param magentoProductId
         */
        addProductImage: function (store, itemInternalId, itemType, itemObject, createOnly, magentoProductId) {
            //Utility.logDebug('adding product image', 'Start');
            var parsedResponse = null;
            var createImageXml = this.getCreateImageXml(store, itemInternalId, itemType, itemObject, createOnly, magentoProductId);
            //Utility.logDebug('createImageXml', createImageXml);
            //ConnectorCommon.createLogRec(magentoProductId, createImageXml, "Image Export - Create");

            var responseXml = MagentoWrapper.soapRequestToServer(createImageXml);
            var response = this.validateAndTransformProductAttributeMediaCreateResponse(responseXml);

            return response;
        },

        /**
         * Get create image xml
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @param magentoProductId
         */
        getCreateImageXml: function (store, itemInternalId, itemType, itemObject, createOnly, magentoProductId) {
            var xml;
            xml = this.OrderRequestXMLHeader;
            xml += this.ImageUploadXml;
            xml += this.OrderRequestXmlFooter;

            xml = xml.replace('[CONTENT]', itemObject.image.content);
            xml = xml.replace('[MIME]', itemObject.image.mime);
            xml = xml.replace('[POSITION]', itemObject.image.position);
            /*if (itemObject.image.types === 'image' || itemObject.image.types === 'small_image') {
             xml = xml.replace('[TYPE]', 'NULL');
             } else {
             xml = xml.replace('[TYPE]', itemObject.image.types);
             }*/
            xml = xml.replace('[TYPE]', 'image</item><item>small_image</item><item>thumbnail');

            xml = xml.replace('[LABEL]', itemObject.image.fullName);
            xml = xml.replace('[NAME]', itemObject.image.fullName);
            xml = xml.replace('[EXCLUDE]', '0');

            xml = xml.replace('[SESSIONID]', ConnectorConstants.CurrentStore.sessionID);
            xml = xml.replace('[PRODUCTID]', magentoProductId);

            return xml;
        },

        /**
         * Update Product Image in magento
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @param magentoProductId
         * @constructor
         */
        UpdateProductImage: function (store, itemInternalId, itemType, itemObject, createOnly, magentoProductId) {
            var parsedResponse = null;
            var magentoImagesList = this.getMagentoProductImagesList(store, itemInternalId, itemType, itemObject, createOnly, magentoProductId);
            Utility.logDebug('magentoImagesList', JSON.stringify(magentoImagesList));

            for (var i = 0; i < magentoImagesList.length; i++) {
                this.removeImageFromMagento(store, magentoProductId, magentoImagesList[i]);
            }

            this.addProductImage(store, itemInternalId, itemType, itemObject, createOnly, magentoProductId);
        },

        /**
         * Get magento product images list
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @param magentoProductId
         */
        getMagentoProductImagesList: function (store, itemInternalId, itemType, itemObject, createOnly, magentoProductId) {
            var xmlRequest = this.ImageListXml;
            xmlRequest = xmlRequest.replace('[SESSIONID]', ConnectorConstants.CurrentStore.sessionID);
            xmlRequest = xmlRequest.replace('[PRODUCTID]', magentoProductId);
            var getMagentoProductImagesListXml = this.OrderRequestXMLHeader + xmlRequest + this.OrderRequestXmlFooter;
            Utility.logDebug('getMagentoProductImagesList xmlRequest', getMagentoProductImagesListXml);
            var imgListResponse = MagentoWrapper.soapRequestToServer(getMagentoProductImagesListXml);
            Utility.logDebug('getMagentoProductImagesList response', imgListResponse);

            var imageList = [];
            try {
                var imageFiles = nlapiSelectNodes(imgListResponse, '//item');
                if (!!imageFiles) {
                    for (var i = 0; i < imageFiles.length; i++) {
                        imageList.push(nlapiSelectValue(imageFiles[i], 'file'));
                    }
                }
            } catch (ex) {
                Utility.logException('Error in parsing magento images list for product: ' + magentoProductId, ex);
            }
            return imageList;
        },

        /**
         * Remove Image from magento
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @param magentoProductId
         */
        removeImageFromMagento: function (store, magentoProductId, magentoImageFile) {
            var xmlRequest = this.ImageRemoveXml;
            xmlRequest = xmlRequest.replace('[SESSIONID]', ConnectorConstants.CurrentStore.sessionID);
            xmlRequest = xmlRequest.replace('[PRODUCTID]', magentoProductId);
            xmlRequest = xmlRequest.replace('[FILE]', magentoImageFile);
            var removeImageFromMagentoXml = this.OrderRequestXMLHeader + xmlRequest + this.OrderRequestXmlFooter;
            Utility.logDebug('removeImageFromMagento xmlRequest', removeImageFromMagentoXml);
            var imgListResponse = MagentoWrapper.soapRequestToServer(removeImageFromMagentoXml);
            Utility.logDebug('removeImageFromMagento response', imgListResponse);
        },

        /**
         * Re-index Products data
         * @param store
         */
        reIndexProductsData: function (store) {
            var mgRestAPiWrapper = new MagentoRestApiWrapper();
            var responseMagentoReIndexJob = mgRestAPiWrapper.reIndexProductsData(store);
            Utility.logDebug('responseMagentoReIndexJob from MagentoRestApiWrapper', JSON.stringify(responseMagentoReIndexJob));
        },

        /**
         * Associate simple product to config product
         * @param configProductId
         * @param simpleProductId
         * @param store
         */
        associateToConfigurableProduct: function (configProductId, simpleProductId, store) {
            Utility.logDebug('configProductId # simpleProductId', configProductId + '   #   ' + simpleProductId)
            var mgRestAPiWrapper = new MagentoRestApiWrapper();
            var responseMagentoAssignAttr = mgRestAPiWrapper.associateProductToConfigurableProduct(configProductId, simpleProductId, store);
            Utility.logDebug('responseMagentoAssignAttr from MagentoRestApiWrapper', JSON.stringify(responseMagentoAssignAttr));
        },

        /**
         * validate and transform xml response of product creation call
         * @param xml
         * @param incrementalIdData
         * @returns {{}}
         */
        validateAndTransformProductCreationResponse: function (xml) {
            var responseMagento = {};
            var faultCode;
            var faultString;
            responseMagento.productId = null;

            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
            } catch (ex) {
                Utility.logException('XmlUtility.validateAndTransformResponse', ex);
            }

            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false;
                responseMagento.faultCode = faultCode;
                responseMagento.faultString = faultString;
                Utility.logDebug('An error has occurred with Product Creation request xml', responseMagento.faultString);
            } else {
                var productId = this.transformProductCreationResponse(xml);
                if (!!productId) {
                    responseMagento.status = true;
                    responseMagento.productId = productId;
                } else {
                    responseMagento.status = false;
                    responseMagento.faultCode = '000';
                    responseMagento.faultString = 'Unexpected Error';
                    Utility.logDebug('An error has occurred with request xml', responseMagento.faultString);
                }
            }

            return responseMagento;
        },

        /**
         * This function transform create product response into object
         * @param xml
         * @return {object}
         */
        transformProductCreationResponse: function (xml) {
            //Utility.logDebug('response xml for logging', nlapiXMLToString(xml));
            var productId = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductCreateResponse/result");
            return productId;
        },

        /**
         * validate and transform xml response of product updation call
         * @param xml
         * @param incrementalIdData
         * @returns {{}}
         */
        validateAndTransformProductUpdationResponse: function (xml) {
            var responseMagento = {};
            var faultCode;
            var faultString;
            responseMagento.productId = null;

            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
            } catch (ex) {
                Utility.logException('XmlUtility.validateAndTransformResponse', ex);
            }

            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false;
                responseMagento.faultCode = faultCode;
                responseMagento.faultString = faultString;
                Utility.logDebug('An error has occurred with Product Updation request xml', responseMagento.faultString);
            } else {
                var isUpdated = this.transformProductUpdationResponse(xml);
                if (!!isUpdated) {
                    responseMagento.status = true;
                } else {
                    responseMagento.status = false;
                    responseMagento.faultCode = '000';
                    responseMagento.faultString = 'Unexpected Error';
                    Utility.logDebug('An error has occurred with request xml', responseMagento.faultString);
                }
            }

            return responseMagento;
        },

        /**
         * This function transform update product response into object
         * @param xml
         * @return {object}
         */
        transformProductUpdationResponse: function (xml) {
            //Utility.logDebug('response xml for logging', nlapiXMLToString(xml));
            var isUpdated = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductUpdateResponse/result");
            return isUpdated;
        },

        /**
         * validate and transform xml response of product image attribute create call
         * @param xml
         * @returns {{}}
         */
        validateAndTransformProductAttributeMediaCreateResponse: function (xml) {
            var faultCode, faultString, result;
            var response = {};

            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
                result = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/ns1:catalogProductAttributeMediaCreateResponse/result");
            } catch (ex) {
                Utility.logException('XmlUtility.validateAndTransformProductAttributeMediaCreateResponse', ex);
            }


            if (!Utility.isBlankOrNull(faultCode)) {
                response.status = false;
                response.faultCode = faultCode;
                response.faultString = faultString;
                Utility.logDebug('An error has occurred with Product Image creation request xml', response.faultString);
            } else {
                if (!!result) {
                    response.status = true;
                    response.result = result;
                } else {
                    response.status = false;
                    response.faultCode = '000';
                    response.faultString = 'Unexpected Error';
                    Utility.logDebug('An error has occurred with request xml', response.faultString);
                }
            }

            return response;
        },

        /**
         * Parse item export success response
         * @param serverResponse
         */
        parseItemSuccessResponse: function (serverResponse, parentServerResponse) {
            var responseBody = {};
            responseBody.status = 1;
            responseBody.message = 'Product exported successfully';
            responseBody.data = {
                externalSystemItemId: serverResponse.productId || '',
                sku: serverResponse.sku || ''
            };

            if (!!parentServerResponse) {
                responseBody.data.parent = {
                    externalSystemItemId: parentServerResponse.data.externalSystemItemId || '',
                    sku: parentServerResponse.data.sku || ''
                };
            }

            return responseBody;
        },

        /**
         * Parse item export failure response
         * @param serverResponse
         */
        parseItemFailureResponse: function (serverResponse, exp) {
            var errMsg = '';
            if (!!serverResponse) {
                errMsg = 'faultCode: ' + serverResponse.faultCode + '   #   faultString: ' + serverResponse.faultString;
            } else {
                errMsg = exp.toString();
            }

            var responseBody = {};
            responseBody.status = 0;
            responseBody.message = errMsg;
            responseBody.error = errMsg;
            return responseBody;
        },

        /**
         * Get Create product XML
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @returns {*}
         */
        getCreateProductXml: function (store, itemInternalId, itemType, itemObject, createOnly) {
            Utility.logDebug('Create Block');
            itemObject.itemAttributeSet.externalSystemItemAttrSetId='4';
            var xml;
            xml = this.OrderRequestXMLHeader;
            xml = xml + '<urn:catalogProductCreate soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            xml = xml + '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + ConnectorConstants.CurrentStore.sessionID + '</sessionId>';
            xml = xml + '<type xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + itemObject.otherSystemItemType + '</type>';

            xml = xml + '<set xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + itemObject.itemAttributeSet.externalSystemItemAttrSetId + '</set>';
            xml = xml + '<sku xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + itemObject.itemId + '</sku>';
            xml = xml + '<productData xsi:type="urn:catalogProductCreateEntity" xs:type="type:catalogProductCreateEntity" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';


            xml = xml + '<categories xsi:type="urn:ArrayOfString" soapenc:arrayType="xsd:string[' + itemObject.externalSystemCategories.length + ']" xs:type="type:catalogProductTierPriceEntity">';
            if (itemObject.externalSystemCategories.length > 0) {
                for (var i = 0; i < itemObject.externalSystemCategories.length; i++) {
                    xml = xml + '<item xsi:type="xsd:string">' + itemObject.externalSystemCategories[i].externalSystemId + '</item>';
                }
            }
            xml = xml + '</categories>';

            xml = xml + '<websites xsi:type="urn:ArrayOfString" soapenc:arrayType="xsd:string[' + itemObject.externalSystemCategories.length + ']" xs:type="type:catalogProductTierPriceEntity">';
            if (store.entitySyncInfo.item.websiteIds.length > 0) {
                for (var i = 0; i < store.entitySyncInfo.item.websiteIds.length; i++) {
                    xml = xml + '<item xsi:type="xsd:string">' + store.entitySyncInfo.item.websiteIds[i] + '</item>';
                }
            }
            xml = xml + '</websites>';

            xml = xml + '<name xsi:type="xsd:string">' + (!!itemObject.displayName ? itemObject.displayName : itemObject.itemId) + '</name>';
            xml = xml + '<description xsi:type="xsd:string">' + itemObject.storeDetailedDescription.trim() + '</description>';
            xml = xml + '<short_description xsi:type="xsd:string">' + itemObject.storeDescription.trim() + '</short_description>';
            xml = xml + '<weight xsi:type="xsd:string">' + (!!itemObject.itemWeight ? itemObject.itemWeight : '0') + '</weight>';
            xml = xml + '<status xsi:type="xsd:string">' + itemObject.magentoStatus + '</status>';
            xml = xml + '<url_key xsi:type="xsd:string">' + itemObject.urlComponent + '</url_key>';
            xml = xml + '<visibility xsi:type="xsd:string">' + itemObject.magentoVisibility + '</visibility>';
            xml = xml + '<price xsi:type="xsd:string">' + itemObject.price + '</price>';
            xml = xml + '<special_price xsi:type="xsd:string">' + itemObject.specialPrice + '</special_price>';
            xml = xml + '<tax_class_id xsi:type="xsd:string">' + store.entitySyncInfo.item.taxClass + '</tax_class_id>';
            xml = xml + '<meta_title xsi:type="xsd:string">' + itemObject.pageTitle + '</meta_title>';
            xml = xml + '<meta_keyword xsi:type="xsd:string">' + itemObject.searchKeywords + '</meta_keyword>';
            xml = xml + '<meta_description xsi:type="xsd:string">' + itemObject.metaTagHtml + '</meta_description>';
            xml = xml + '<custom_design xsi:type="xsd:string">' + store.entitySyncInfo.item.customDesign + '</custom_design>';

            if (itemObject.isMatrixParentItem) {
                xml = xml + '<has_options xsi:type="xsd:string">0</has_options>';
                xml = xml + '<options_container xsi:type="xsd:string">' + store.entitySyncInfo.item.optionsContainer + '</options_container>';
            }

            xml = xml + '<stock_data xsi:type="urn:catalogInventoryStockItemUpdateEntity" xs:type="type:catalogInventoryStockItemUpdateEntity">';
            xml = xml + '<qty xsi:type="xsd:string" xn:type="http://www.w3.org/2001/XMLSchema">' + itemObject.quatity + '</qty>';
            xml = xml + '<is_in_stock xsi:type="xsd:int" xs:type="type:int">' + store.entitySyncInfo.item.stockAvailability + '</is_in_stock>';
            xml = xml + '<manage_stock xsi:type="xsd:int" xs:type="type:int">' + store.entitySyncInfo.item.manageStock + '</manage_stock>';
            xml = xml + '<use_config_manage_stock xsi:type="xsd:int" xs:type="type:int">' + store.entitySyncInfo.item.useConfigManageStock + '</use_config_manage_stock>';
            xml = xml + '</stock_data>';

            if (itemObject.additionalAttributes.length > 0) {
                //*
                // set additional attributes: start
                xml = xml + '<additional_attributes xsi:type="urn:catalogProductAdditionalAttributesEntity">';
                xml = xml + '<single_data xsi:type="urn:associativeArray" soapenc:arrayType="urn:associativeEntity[' + itemObject.additionalAttributes.length + ']">';

                itemObject.additionalAttributes.forEach(function (addAttr) {
                    xml = xml + '<item>';
                    xml = xml + '<key xsi:type="xsd:string">' + addAttr.key + '</key>';
                    xml = xml + '<value xsi:type="xsd:string">' + addAttr.value + '</value>';
                    xml = xml + '</item>';
                });

                xml = xml + '</single_data>';
                xml = xml + '</additional_attributes>';
                // set additional attributes: end
                //*/
            }

            xml = xml + '</productData>';
            xml = xml + '<storeView xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + store.entitySyncInfo.item.storeView + '</storeView>';
            xml = xml + '</urn:catalogProductCreate>';

            xml = xml + this.OrderRequestXmlFooter;

            //nlapiLogExecution('DEBUG', 'request XML', xml);

            return xml;
        },

        /**
         * Get Update product XML
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param createOnly
         * @returns {*}
         */
        getUpdateProductXml: function (store, itemInternalId, itemType, itemObject, createOnly) {
            itemObject.itemAttributeSet.externalSystemItemAttrSetId='4';
            var xml = '';
            xml = this.OrderRequestXMLHeader;
            xml += '<urn:catalogProductUpdate>';
            xml = xml + '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + ConnectorConstants.CurrentStore.sessionID + '</sessionId>';
            xml = xml + '<product xsi:type="xsd:string">' + itemObject.currentExternalSystemId + '</product>';
            xml = xml + '<type xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + itemObject.otherSystemItemType + '</type>';

            xml = xml + '<set xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + itemObject.itemAttributeSet.externalSystemItemAttrSetId + '</set>';
            xml = xml + '<sku xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + itemObject.itemId + '</sku>';
            xml = xml + '<productData xsi:type="urn:catalogProductCreateEntity" xs:type="type:catalogProductCreateEntity" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">';


            xml = xml + '<categories xsi:type="urn:ArrayOfString" soapenc:arrayType="xsd:string[' + itemObject.externalSystemCategories.length + ']" xs:type="type:catalogProductTierPriceEntity">';
            if (itemObject.externalSystemCategories.length > 0) {
                for (var i = 0; i < itemObject.externalSystemCategories.length; i++) {
                    xml = xml + '<item xsi:type="xsd:string">' + itemObject.externalSystemCategories[i].externalSystemId + '</item>';
                }
            }
            xml = xml + '</categories>';

            xml = xml + '<websites xsi:type="urn:ArrayOfString" soapenc:arrayType="xsd:string[' + itemObject.externalSystemCategories.length + ']" xs:type="type:catalogProductTierPriceEntity">';
            if (store.entitySyncInfo.item.websiteIds.length > 0) {
                for (var i = 0; i < store.entitySyncInfo.item.websiteIds.length; i++) {
                    xml = xml + '<item xsi:type="xsd:string">' + store.entitySyncInfo.item.websiteIds[i] + '</item>';
                }
            }
            xml = xml + '</websites>';

            xml = xml + '<name xsi:type="xsd:string">' + (!!itemObject.displayName ? itemObject.displayName : itemObject.itemId) + '</name>';
            xml = xml + '<description xsi:type="xsd:string">' + itemObject.storeDetailedDescription + '</description>';
            xml = xml + '<short_description xsi:type="xsd:string">' + itemObject.storeDescription + '</short_description>';
            xml = xml + '<weight xsi:type="xsd:string">' + (!!itemObject.itemWeight ? itemObject.itemWeight : '') + '</weight>';
            xml = xml + '<status xsi:type="xsd:string">' + itemObject.magentoStatus + '</status>';
            xml = xml + '<url_key xsi:type="xsd:string">' + itemObject.urlComponent + '</url_key>';
            xml = xml + '<visibility xsi:type="xsd:string">' + itemObject.magentoVisibility + '</visibility>';
            xml = xml + '<price xsi:type="xsd:string">' + itemObject.price + '</price>';
            xml = xml + '<special_price xsi:type="xsd:string">' + itemObject.specialPrice + '</special_price>';
            xml = xml + '<tax_class_id xsi:type="xsd:string">' + store.entitySyncInfo.item.taxClass + '</tax_class_id>';
            xml = xml + '<meta_title xsi:type="xsd:string">' + itemObject.pageTitle + '</meta_title>';
            xml = xml + '<meta_keyword xsi:type="xsd:string">' + itemObject.searchKeywords + '</meta_keyword>';
            xml = xml + '<meta_description xsi:type="xsd:string">' + itemObject.metaTagHtml + '</meta_description>';
            xml = xml + '<custom_design xsi:type="xsd:string">' + store.entitySyncInfo.item.customDesign + '</custom_design>';

            if (itemObject.isMatrixParentItem) {
                xml = xml + '<has_options xsi:type="xsd:string">0</has_options>';
                xml = xml + '<options_container xsi:type="xsd:string">' + store.entitySyncInfo.item.optionsContainer + '</options_container>';
            }

            xml = xml + '<stock_data xsi:type="urn:catalogInventoryStockItemUpdateEntity" xs:type="type:catalogInventoryStockItemUpdateEntity">';
            xml = xml + '<qty xsi:type="xsd:string" xn:type="http://www.w3.org/2001/XMLSchema">' + itemObject.quatity + '</qty>';
            xml = xml + '<is_in_stock xsi:type="xsd:int" xs:type="type:int">' + store.entitySyncInfo.item.stockAvailability + '</is_in_stock>';
            xml = xml + '<manage_stock xsi:type="xsd:int" xs:type="type:int">' + store.entitySyncInfo.item.manageStock + '</manage_stock>';
            xml = xml + '<use_config_manage_stock xsi:type="xsd:int" xs:type="type:int">' + store.entitySyncInfo.item.useConfigManageStock + '</use_config_manage_stock>';
            xml = xml + '</stock_data>';

            if (itemObject.additionalAttributes.length > 0) {
                //*
                // set additional attributes: start
                xml = xml + '<additional_attributes xsi:type="urn:catalogProductAdditionalAttributesEntity">';
                xml = xml + '<single_data xsi:type="urn:associativeArray" soapenc:arrayType="urn:associativeEntity[' + itemObject.additionalAttributes.length + ']">';

                itemObject.additionalAttributes.forEach(function (addAttr) {
                    xml = xml + '<item>';
                    xml = xml + '<key xsi:type="xsd:string">' + addAttr.key + '</key>';
                    xml = xml + '<value xsi:type="xsd:string">' + addAttr.value + '</value>';
                    xml = xml + '</item>';
                });

                xml = xml + '</single_data>';
                xml = xml + '</additional_attributes>';
                // set additional attributes: end
                //*/
            }

            xml = xml + '</productData>';
            //xml = xml + '<storeView xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + store.entitySyncInfo.item.storeView + '</storeView>';
            xml = xml + '</urn:catalogProductUpdate>';
            xml = xml + this.OrderRequestXmlFooter;

            return xml;

        },
        /**
         * Get Customer List XML
         * @param obj
         * @param sessionID
         * @returns {string}
         */
        getCustomerListXML: function (obj, sessionID) {
            var customerXML = "";

            customerXML += this.XmlHeader;
            customerXML += '<urn:customerCustomerList>';
            customerXML += '<sessionId urn:type="xsd:string">' + sessionID + '</sessionId>';

            customerXML += '<filters>';

            // making simple associative array
            if (obj.hasOwnProperty("filters") && obj.filters instanceof Array) {
                var filters = obj.filters;
                if (filters.length > 0) {
                    customerXML += '<filter>';
                    for (var i in filters) {
                        customerXML += '<associativeEntity>';
                        customerXML += '<key xs:type="type:string">' + filters[i].key + '</key>';
                        customerXML += '<value xs:type="type:string">' + filters[i].value + '</value>';
                        customerXML += '</associativeEntity>';
                    }
                    customerXML += '</filter>';
                }
            }

            if (obj.hasOwnProperty("complexFilters") && obj.complexFilters instanceof Array) {
                // TODO: implement in future
            }
            customerXML += '</filters>';

            customerXML += '</urn:customerCustomerList>';
            customerXML += this.XmlFooter;

            return customerXML;
        },

        /**
         * Get Customer Lists
         * @param obj
         * @returns {object[]}
         */
        getCustomerList: function (obj) {
            var result = [];
            Utility.logDebug("Hello","2");
            var xml = this.getCustomerListXML(obj, ConnectorConstants.CurrentStore.sessionID);
            Utility.logDebug("Hello","3");
            var responseXML = this.soapRequestToServer(xml);
            var responseMagento = this.validateResponseCustomer(responseXML);
            if (!responseMagento.status) {
                result.errorMsg = responseMagento.faultCode + '--' + responseMagento.faultString;
            } else {
                if (!!responseMagento.customers) {
                    result = responseMagento.customers;
                }
            }
            return result;
        },

        /**
         * Get Customer w.r.t. email id
         * @param customerObj
         * @returns {object | null}
         */
        getCustomer: function (customerObj) {
            var customer = null;
            var email = customerObj.email;

            var filters = [];
            filters.push({key: "email", value: email});
            customerObj.filters = filters;
            Utility.logDebug("Hello","1");
            var customerList = this.getCustomerList(customerObj);
            Utility.logDebug("Hello","4");

            if (customerList instanceof Array && customerList.length > 0) {
                customer = customerList[0];
            }

            return customer;
        },
        /**
         * Get Discount for creating order in NetSuite
         * @param salesOrderObj
         * @returns {string|string|*}
         */
        getDiscount: function (salesOrderObj) {
            return salesOrderObj.order.discount_amount;
        },
        /**
         * Get previous date w.r.t. Magento for making filter in XML
         * @param ageOfItemToImportInDays
         * @param format
         * @returns {string|*}
         */
        getPreviousDayDate: function (ageOfItemToImportInDays, format) {
            var currentDate = new Date();
            var soUpdateDate;
            soUpdateDate = nlapiAddDays(currentDate, ageOfItemToImportInDays);
            soUpdateDate = soUpdateDate.getFullYear() + '-' + Utility.addZeroes((soUpdateDate.getMonth() + 1), 2) + '-' + Utility.addZeroes(soUpdateDate.getDate(), 2) + ' ' + Utility.addZeroes(soUpdateDate.getHours(), 2) + ':' + Utility.addZeroes(soUpdateDate.getMinutes(), 2) + ':' + '00';
            return soUpdateDate
        },
        /**
         * Make an associative entity for filters
         * @param key
         * @param value
         * @returns {string}
         */
        getAssociativeEntity: function (key, value) {
            var xml = "";
            xml += "<value>";
            xml += '<key xs:type="type:string">' + key + '</key>';
            if (value instanceof Array) {
                for (var i in  value) {
                    xml += '<value xs:type="type:string">' + value[i] + '</value>';
                }
            } else {
                xml += '<value xs:type="type:string">' + value + '</value>';
            }
            xml += "</value>";
            return xml;
        },
        /**
         * Make a complex filter
         * @param key
         * @param value
         * @returns {string}
         */
        getComplexFilter: function (key, value) {
            var xml = "";
            xml += '<complexFilter>';
            xml += '<key xs:type="type:string">' + key + '</key>';
            xml += this.getAssociativeEntity(value.key, value.value);
            xml += '</complexFilter>';
            return xml;
        },
        /**
         * Make an associativeArray filters for XML request
         * @param filters
         * @returns {string}
         * Sample: filters: [{key: "gt", value: [itemListData.previousDate]}]
         */
        getSimpleFilters: function (filters) {
            var xml = "";
            if (filters instanceof Array && filters.length > 0) {
                if (filters.length > 0) {
                    xml += '<filter>';
                    for (var i in filters) {
                        xml += this.getAssociativeEntity(filters[i].key, filters[i].value);
                    }
                    xml += '</filter>';
                }
            }
            return xml;
        },
        /**
         * Make a complexFilterArray filters for XML request
         * @param complexFilters
         * @returns {string}
         * Sample complexFilters: [{key: "updated_at", value: {key: "gt", value: [itemListData.previousDate]}}]
         */
        getComplexFilters: function (complexFilters) {
            var xml = "";
            if (complexFilters instanceof Array && complexFilters.length > 0) {
                xml += '<complex_filter>';
                for (var i in complexFilters) {
                    var complexFilter = complexFilters[i];
                    xml += this.getComplexFilter(complexFilter.key, complexFilter.value);
                }
                xml += '</complex_filter>';
            }
            return xml;
        },
        /**
         * Item List XML
         * @param obj
         * @param sessionId
         * @returns {string}
         */
        getItemListXML: function (obj, sessionId) {
            var xml = "";
            xml += this.XmlHeader;
            xml += '<urn:catalogProductList>';
            xml += '<sessionId urn:type="xsd:string">' + sessionId + '</sessionId>';
            xml += '<filters>';
            // making simple filters
            if (obj.hasOwnProperty("filters")) {
                xml += this.getSimpleFilters(obj.filters);
            }
            // making complex filters
            if (obj.hasOwnProperty("complexFilters")) {
                xml += this.getComplexFilters(obj.complexFilters);
            }
            xml += '</filters>';
            xml += '</urn:catalogProductList>';
            xml += this.XmlFooter;
            return xml;
        },
        /**
         * Get Category Ids from a node from Items List XML
         * @param xml
         * @returns {Array}
         */
        getCategoryIds: function (xml) {
            var websiteIds = [];
            var items = nlapiSelectNodes(xml, "website_ids");
            if (items instanceof Array) {
                for (var i in items) {
                    var websiteId = nlapiSelectValue(items[i], "item");
                    websiteIds.push(websiteId);
                }
            }
            return websiteIds;
        },
        /**
         * Get Website Ids from a node from Items List XML
         * @param xml
         * @returns {Array}
         */
        getWebsiteIds: function (xml) {
            var categoryIds = [];
            var items = nlapiSelectNodes(xml, "category_ids");
            if (items instanceof Array) {
                for (var i in items) {
                    var categoryId = nlapiSelectValue(items[i], "item");
                    categoryIds.push(categoryId);
                }
            }
            return categoryIds;
        },
        /**
         * Trasform Items List XML into array of objects
         * @param items
         * @returns {object[]}
         */
        tranformItemListXMLtoArray: function (items) {
            var itemList = [];
            for (var i in items) {
                var obj = {};
                var item = items[i];
                obj.product_id = nlapiSelectValue(item, "product_id");
                obj.sku = nlapiSelectValue(item, "sku");
                obj.name = nlapiSelectValue(item, "name");
                obj.type = nlapiSelectValue(item, "type");
                obj.category_ids = this.getCategoryIds(item);
                obj.website_ids = this.getWebsiteIds(item);
                itemList.push(obj);
            }
            return itemList;
        },
        /**
         * validate list of items
         * @param xml
         * @returns {object}
         */
        validateResponseItemList: function (xml) {
            Utility.logDebug('Debug', 'validateResponseItemList started');
            Utility.logDebug('response', nlapiXMLToString(xml));
            var responseMagento = {};
            var faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
            var faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");
            var items = nlapiSelectNodes(xml, "//storeView/item");
            if (!Utility.isBlankOrNull(faultCode)) {
                responseMagento.status = false; // Means There is fault
                responseMagento.faultCode = faultCode; // Fault Code
                responseMagento.faultString = faultString; //Fault String
                nlapiLogExecution('Debug', 'Mageno-ItemList GET Operation Failed', responseMagento.faultString);
            } else if (!Utility.isBlankOrNull(items)) {
                responseMagento.status = true;
                responseMagento.items = this.tranformItemListXMLtoArray(items);
            } else // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                nlapiLogExecution('Debug', 'Mageno-ItemList GET Operation Failed', responseMagento.faultString);
            }
            return responseMagento;
        },
        /**
         * Get list of items
         * @param obj
         * @returns {Array}
         */
        getItemList: function (obj) {
            var result = [];
            var xml = this.getItemListXML(obj, ConnectorConstants.CurrentStore.sessionID);
            var responseMagento = this.validateResponseItemList(this.soapRequestToServer(xml));
            if (!responseMagento.status) {
                result.errorMsg = responseMagento.faultCode + '--' + responseMagento.faultString;
            } else {
                if (!!responseMagento.items) {
                    result = responseMagento.items;
                }
            }
            return result;
        },
        /**
         * Get Item List with respect to product id and identifier type
         * @param criteriaObj
         * @returns {Array}
         */
        getItemsById: function (criteriaObj) {
            var itemListData = {};
            var items = [];
            var complexFilters = [];
            complexFilters.push({
                key: criteriaObj.identifierType,
                value: {
                    key: "in",
                    value: [
                        criteriaObj.identifierValue
                    ]
                }
            });
            itemListData.filters = null;
            itemListData.complexFilters = complexFilters;
            var itemsList = this.getItemList(itemListData);
            if (itemsList instanceof Array && itemsList.length > 0) {
                items = itemsList;
            }
            return items;
        },
        /**
         * Get Item List with respect to date filter
         * @param itemListData
         * @returns {Array}
         */
        getItems: function (itemListData) {
            var items = [];
            var complexFilters = [];
            complexFilters.push({key: "updated_at", value: {key: "gt", value: [itemListData.previousDate]}});
            /*complexFilters.push({
             key: "sku",
             value: {
             key: "in",
             value: [
             //"Pmtk006",
             //"acj005ZEE",
             ///"Pmtk006xs",
             //"Pmtk006s"
             ]
             }
             });*/
            itemListData.filters = null;
            itemListData.complexFilters = complexFilters;
            var itemsList = this.getItemList(itemListData);
            if (itemsList instanceof Array && itemsList.length > 0) {
                items = itemsList;
            }
            return items;
        },
        /**
         * Transform Magento Item object into our acceptable object format
         * @param product
         * @returns {object}
         */
        tranformItemForNetSuite: function (product) {
            Utility.logDebug("tranformItemForNetSuite - START", JSON.stringify(arguments));
            var result = {};
            var type = product.type;
            if (type === "simple") {
                result = ItemImportLibrary.transformSimpleItemForNetSuite(product);
            } else if (type === "configurable") {
                result = ItemImportLibrary.transformConfigurableItemForNetSuite(product);
            }
            Utility.logDebug("tranformItemForNetSuite - END", JSON.stringify(result));
            return result;
        },
        /**
         * Getting item information from Magento using custom call
         * @param store
         * @param record
         */
        getItemInfo: function (store, record) {
            var item = null;
            if (!!store.entitySyncInfo.common && !!store.entitySyncInfo.common.customRestApiUrl) {
                Utility.logDebug('Inside MagentoRestApiWrapper', 'getItemInfo call');
                var mgRestAPiWrapper = new MagentoRestApiWrapper();
                var responseMagentoItemInfo = mgRestAPiWrapper.getItemInfo(record.type, record.product_id, "id", store);
                Utility.logDebug('responseMagentoItemInfo from MagentoRestApiWrapper', JSON.stringify(responseMagentoItemInfo));
                item = this.tranformItemForNetSuite(responseMagentoItemInfo.product);
            }
            return item;
        },
        /**
         *
         * @param shipmentId
         * @param trackingNumberId
         * @param sessionID
         * @returns {string}
         */

        removeTrackXML: function (shipmentId, trackingNumberId, sessionID) {
            // remove tracking numbers
            var xml = '';

            xml += this.XmlHeader;
            xml += '<urn:salesOrderShipmentRemoveTrack soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
            xml += '<sessionId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + sessionID + '</sessionId>';
            xml += '<shipmentIncrementId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + shipmentId + '</shipmentIncrementId>';
            xml += '<trackId xsi:type="xsd:string" xs:type="type:string" xmlns:xs="http://www.w3.org/2000/XMLSchema-instance">' + trackingNumberId + '</trackId>';
            xml += '</urn:salesOrderShipmentRemoveTrack>';
            xml += this.XmlFooter;

            return xml;
        },

        /**
         *
         * @param xml
         * @returns {{}}
         */
        validateRemoveTrackResponse: function (xml) {
            Utility.logDebug('XML', nlapiEscapeXML(xml));
            var responseMagento = {};
            var magentoFulfillmentID;
            var faultCode;
            var faultString;


            try {
                faultCode = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultcode");
                faultString = nlapiSelectValue(xml, "SOAP-ENV:Envelope/SOAP-ENV:Body/SOAP-ENV:Fault/faultstring");

                //  if (operation=='create')
                magentoFulfillmentID = nlapiSelectValue(xml, "//result");

            } catch (ex) {
                Utility.logException('XmlUtility.validateRemoveTrackResponse', ex);
            }


            if (faultCode != null) {
                responseMagento.status = false;       // Means There is fault
                responseMagento.faultCode = faultCode;   // Fault Code
                responseMagento.faultString = faultString; //Fault String
                Utility.logDebug('Tracking Number Remove Operation Failed', responseMagento.faultString + ' - ' + responseMagento.faultCode);
            }
            else if (magentoFulfillmentID != null) {
                responseMagento.status = true;       // Means There is fault
                responseMagento.result = magentoFulfillmentID;
            }
            else    // Not Attribute ID Found, Nor fault code found
            {
                responseMagento.status = false;
                responseMagento.faultCode = '000';
                responseMagento.faultString = 'Unexpected Error';
                Utility.logDebug('Tracking Number Remove Operation Failed', responseMagento.faultString + ' - ' + responseMagento.faultCode);
            }

            return responseMagento;
        }
    };
})();

/**
 * Copying MagentoXmlWrapper properties in MagentoWrapper
 * @constructor
 */
MagentoWrapper = function () {
};
for (var i in MagentoXmlWrapper) {
    if (MagentoXmlWrapper.hasOwnProperty(i)) {
        MagentoWrapper[i] = MagentoXmlWrapper[i];
    }
}

function replaceLineBreaks(data) {
    var replacedData = data.replace("\r \n", "<br>");
    return replacedData;
}