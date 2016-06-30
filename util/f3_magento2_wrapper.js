/**
 * Created by zahmed on 28-Mar-16.
 *
 * Class Name: Magento2Wrapper
 *
 * Description:
 * - This script is responsible for handling Magento 2 API
 * -
 * Referenced By:
 * -
 * -
 * Dependency:
 *   -
 */
// Declaration of all NetSuite SuiteScript 1.0 APIs
/// <reference path="../util/SuiteScriptAPITS.d.ts" />
// Declaration of Existing Custom Libraries methods
/// <reference path="../util/CustomMethods.d.ts" />
// Declaration of Magento2 Interfaces
/// <reference path="../util/f3_magento2_interfaces.d.ts" />
/**
 * Wrapper class for Magento2 REST API
 */
var Magento2Wrapper = (function () {
    function Magento2Wrapper() {
        this.serverUrl = '';
        this.username = '';
        this.password = '';
        this.token = '';
        // intentionally empty contructor 
    }
    /************** public methods **************/
    /**
     * Test call for getting order information
     * @param id
     * @returns {void|any}
     */
    Magento2Wrapper.prototype.test = function (id) {
        var serverResponse;
        var httpRequestData = {
            accessToken: "",
            additionalUrl: "orders/" + id,
            data: {},
            method: "GET"
        };
        serverResponse = this.sendRequest(httpRequestData);
        return serverResponse;
    };
    /**
     * Initializes the wrapper for given store,
     * setting up server url
     *
     * @param storeInfo
     */
    Magento2Wrapper.prototype.initialize = function (storeInfo) {
        if (!!storeInfo) {
            this.serverUrl = storeInfo.endpoint;
        }
        else if (!!ConnectorConstants && !!ConnectorConstants.CurrentStore) {
            this.serverUrl = ConnectorConstants.CurrentStore.endpoint;
        }
    };
    /**
     * Get supported Date Format
     * @returns {string}
     */
    Magento2Wrapper.prototype.getDateFormat = function () {
        return "ISO";
    };
    /**
     * Sets up credential
     *
     * @param userName
     * @param apiKey
     * @returns {string}
     */
    Magento2Wrapper.prototype.getSessionIDFromServer = function (userName, apiKey) {
        // TODO:  Get the token using 2-ledge authentication
        var sessionID = "DUMMY_SESSION_ID";
        this.username = userName;
        this.password = apiKey;
        sessionID = apiKey;
        this.token = apiKey;
        return sessionID;
    };
    /**
     * Get Sales Orders List
     * @param filters
     * @param [sessionId]
     * @returns {any}
     */
    Magento2Wrapper.prototype.getSalesOrders = function (filters, sessionId) {
        var httpRequestData = {
            accessToken: sessionId,
            additionalUrl: "orders",
            method: "GET"
        };
        httpRequestData.additionalUrl += "?" + Magento2WrapperUtility.toParamStrings({
            searchCriteria: {
                filterGroups: [{
                        filters: [{
                                field: Magento2Constants.filter.fields.status,
                                value: ['pending'].join(","),
                                // value: filters.orderStatus.join(","),
                                condition_type: Magento2Constants.filter.condition_types.in
                            }, {
                                field: Magento2Constants.filter.fields.updated_at,
                                value: filters.updateDate,
                                condition_type: Magento2Constants.filter.condition_types.gt
                            }]
                    }]
            }
        }).join("&");
        // Make Call and Get Data
        var serverFinalResponse = {};
        try {
            var serverResponse = this.sendRequest(httpRequestData);
            if (this.isNAE(serverResponse) && serverResponse.hasOwnProperty("items")) {
                serverFinalResponse.orders = this.parseSalesOrderListResponse(serverResponse.items);
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            }
            else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }
            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        }
        catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();
            Utility.logException("Magento2 Wrapper: Error during getSalesOrders", e);
        }
        return serverFinalResponse;
    };
    /**
     *
     */
    Magento2Wrapper.prototype.getSalesOrder = function (entityId, sessionId) {
        var httpRequestData = {
            accessToken: sessionId,
            additionalUrl: "orders/" + entityId,
            method: "GET"
        };
        return this.sendRequest(httpRequestData);
    };
    /**
     * Get Sales Order Information
     * @param incrementId
     * @param [sessionId]
     * @returns {any}
     */
    Magento2Wrapper.prototype.getSalesOrderInfo = function (entityId, sessionId) {
        // Make Call and Get Data
        var serverFinalResponse = {};
        try {
            var serverResponse = this.getSalesOrder(entityId, sessionId);
            if (this.isNAE(serverResponse)) {
                serverFinalResponse = this.parseSingleSalesOrderResponse(serverResponse);
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            }
            else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }
            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        }
        catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();
            Utility.logException("Magento2 Wrapper: Error during getSalesOrders", e);
        }
        return serverFinalResponse;
    };
    Magento2Wrapper.prototype.getCustomerById = function (customerId, sessionId) {
        var httpRequestData = {
            accessToken: sessionId,
            additionalUrl: "customers/" + customerId,
            method: "GET"
        };
        // Make Call and Get Data
        var serverFinalResponse = {};
        try {
            var serverResponse = this.sendRequest(httpRequestData);
            if (this.isNAE(serverResponse)) {
                serverFinalResponse.customer = this.parseSingleCustomerResponse(serverResponse);
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            }
            else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }
            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        }
        catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();
            Utility.logException("Magento2 Wrapper: Error during getSalesOrders", e);
        }
        return serverFinalResponse;
    };
    /**
     * Get Customer Addresses
     * @param customerId
     * @param sessionId
     * @returns {any}
     */
    Magento2Wrapper.prototype.getCustomerAddress = function (customerId, sessionId) {
        var result = {};
        var customerAddresses = [];
        var customerResponse = this.getCustomerById(customerId, sessionId);
        if (customerResponse.status) {
            result.status = true;
            var customer = customerResponse.customer;
            var addresses = customer.addresses;
            addresses.forEach(function (address) {
                customerAddresses.push({
                    city: address.city,
                    company: "",
                    country_id: address.country_id,
                    created_at: "",
                    customer_address_id: address.id,
                    firstname: address.firstname,
                    is_default_billing: address.default_billing,
                    is_default_shipping: address.default_shipping,
                    lastname: address.lastname,
                    postcode: address.postcode,
                    region: address.region.region,
                    region_id: address.region_id,
                    street: address.street,
                    telephone: address.telephone,
                    updated_at: ""
                });
            });
            result.addresses = customerAddresses;
        }
        else {
            result.status = false;
            result.faultCode = customerResponse.faultCode;
            result.faultString = customerResponse.faultString;
        }
        return result;
    };
    /**
     * Copying from Magneto Wrapper to Magento2 Wrapper
     * @param magentoIds
     * @param enviornment
     * @returns {any}
     */
    Magento2Wrapper.prototype.getNsProductIdsByExtSysIds = function (magentoIds, enviornment) {
        var cols = [];
        var filterExpression = "";
        var resultArray = [];
        var result = {};
        result.errorMsg = "";
        try {
            /*filterExpression = "[[";
             for (let x = 0; x < magentoIds.length; x++) {
             // multiple store handling
             let magentoIdForSearching =
             ConnectorCommon.getMagentoIdForSearhing(ConnectorConstants.CurrentStore.systemId, magentoIds[x].product_id);
             filterExpression = filterExpression + "["" + magentoIdId + "','contains','" + magentoIdForSearching + "']";
             if ((x + 1) < magentoIds.length) {
             filterExpression = filterExpression + ",'or' ,";
             }
             }
             filterExpression = filterExpression + ']';
             filterExpression += ',"AND",["type", "anyof", "InvtPart", "NonInvtPart"]]';
             Utility.logDebug(' filterExpression', filterExpression);
             filterExpression = eval(filterExpression);
             cols.push(new nlobjSearchColumn(magentoIdId, null, null));
             let recs = nlapiSearchRecord('item', null, filterExpression, cols);*/
            filterExpression = "[[";
            for (var x = 0; x < magentoIds.length; x++) {
                // multiple store handling
                filterExpression = filterExpression + "[\"itemid\",\"is\",\"" + magentoIds[x].product_id + "\"]";
                if ((x + 1) < magentoIds.length) {
                    filterExpression = filterExpression + ",\"or\" ,";
                }
            }
            filterExpression = filterExpression + "]";
            filterExpression += ",\"AND\",[\"type\", \"anyof\", \"InvtPart\", \"NonInvtPart\", \"GiftCert\"]]";
            Utility.logDebug(" filterExpression", filterExpression);
            filterExpression = JSON.parse(filterExpression);
            cols.push(new nlobjSearchColumn(ConnectorConstants.Item.Fields.MagentoId, null, null));
            cols.push(new nlobjSearchColumn("itemid", null, null));
            var recs = nlapiSearchRecord("item", null, filterExpression, cols);
            if (recs && recs.length > 0) {
                for (var i = 0; i < recs.length; i++) {
                    var obj = {};
                    obj.internalId = recs[i].getId();
                    var itemid = recs[i].getValue("itemid");
                    if (!Utility.isBlankOrNull(itemid)) {
                        var itemidArr = itemid.split(": ");
                        itemid = (itemidArr[itemidArr.length - 1]).trim();
                    }
                    obj.magentoID = itemid;
                    resultArray[resultArray.length] = obj;
                }
            }
            result.data = resultArray;
        }
        catch (ex) {
            Utility.logException("Error in getNetsuiteProductIdByMagentoId", ex);
            result.errorMsg = ex.toString();
        }
        return result;
    };
    /**
     * Copying from Magneto Wrapper to Magento2 Wrapper
     * @param payment
     * @param netsuitePaymentTypes
     * @param magentoCCSupportedPaymentTypes
     * @returns {{paymentmethod: string, pnrefnum: string, ccapproved: string, paypalauthid: string}}
     */
    Magento2Wrapper.prototype.getPaymentInfo = function (payment, netsuitePaymentTypes, magentoCCSupportedPaymentTypes) {
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
        else if (paymentMethod === "paypal_express" || paymentMethod === "payflow_advanced") {
            Utility.logDebug("Condition (2)", "");
            paymentInfo.paymentmethod = paypalPaymentMethod;
            paymentInfo.paypalauthid = payment.authorizedId;
        }
        else {
            Utility.logDebug("Condition (3)", "");
            var otherPaymentMethod = paymentMethod;
            Utility.logDebug("paymentMethodLookup_Key", otherPaymentMethod);
            var paymentMethodLookupValue = FC_ScrubHandler.findValue(system, "PaymentMethod", otherPaymentMethod);
            Utility.logDebug("paymentMethodLookup_Value", paymentMethodLookupValue);
            if (!!paymentMethodLookupValue && paymentMethodLookupValue + "" !== otherPaymentMethod + "") {
                paymentInfo.paymentmethod = paymentMethodLookupValue;
            }
        }
        Utility.logDebug("MagentoWrapper.getPaymentInfo", "End");
        return paymentInfo;
    };
    /**
     * Get Discount for creating order in NetSuite
     * @param salesOrderObj
     * @returns {string|string|*}
     */
    Magento2Wrapper.prototype.getDiscount = function (salesOrderObj) {
        return salesOrderObj.order.discount_amount;
    };
    /**
     * Create Sales Order Shipment
     * @param sessionId
     * @param magentoItemIds
     * @param magentoSOId
     * @param fulfillRec
     * @returns {any}
     */
    Magento2Wrapper.prototype.createFulfillment = function (sessionId, magentoItemIds, magentoSOId, fulfillRec) {
        var httpRequestData = {
            accessToken: sessionId,
            additionalUrl: "shipment/",
            method: "POST",
            postData: this.getShipmentDataForExport(magentoSOId, fulfillRec)
        };
        // Make Call and Get Data
        var serverFinalResponse = {};
        try {
            var serverResponse = this.sendRequest(httpRequestData);
            if (this.isNAE(serverResponse)) {
                var shipment = this.parseSalesShipmentResponse(serverResponse);
                serverFinalResponse.result = shipment.entity_id;
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            }
            else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }
            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        }
        catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();
            Utility.logException("Magento2 Wrapper: Error during getCreateFulfillmentXML", e);
        }
        return serverFinalResponse;
    };
    /**
     * Add Tracking Information in Sales Order Shipment
     * @param shipmentIncrementId
     * @param carrier
     * @param carrierText
     * @param trackingNumber
     * @param sessionId
     * @param magentoSOId
     * @param otherInfo
     * @param fulfillRec
     * @returns {any}
     */
    Magento2Wrapper.prototype.createTracking = function (shipmentIncrementId, carrier, carrierText, trackingNumber, sessionId, magentoSOId, otherInfo, fulfillRec) {
        var httpRequestData = {
            accessToken: sessionId,
            additionalUrl: "shipment/track",
            method: "POST",
            postData: this.getShipmentTrackDataForExport(shipmentIncrementId, carrier, carrierText, trackingNumber, fulfillRec)
        };
        // Make Call and Get Data
        var serverFinalResponse = {};
        try {
            var serverResponse = this.sendRequest(httpRequestData);
            if (this.isNAE(serverResponse)) {
                var shipment = this.parseSalesShipmentTrackResponse(serverResponse);
                serverFinalResponse.result = shipment.entity_id;
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            }
            else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }
            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        }
        catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();
            Utility.logException("Magento2 Wrapper: Error during createTracking", e);
        }
        return serverFinalResponse;
    };
    /**
     * parse response in case of successful payment capturing
     * @param serverResponse
     */
    Magento2Wrapper.prototype.parseInvoiceSuccessResponse = function (serverResponse) {
        return {
            status: 1,
            message: serverResponse.message || '',
            data: {
                increment_id: serverResponse.increment_id.toString() || '',
                id: serverResponse.entity_id.toString() || ''
            }
        };
    };
    /**
     * parse response in case of failure occured in payment capturing
     * @param serverResponse
     */
    Magento2Wrapper.prototype.parseInvoiceFailureResponse = function (serverResponse) {
        return {
            status: 0,
            message: serverResponse.message || ''
        };
    };
    /**
     * Create invoice in magento2
     * @param sessionId
     * @param netsuiteInvoiceObj
     * @param store
     * @returns {string}
     */
    Magento2Wrapper.prototype.createInvoice = function (sessionId, netsuiteInvoiceObj, store) {
        var responseBody = {
            status: 0
        };
        var shouldCaptureAmount = 1; //this.checkPaymentCapturingMode(netsuiteInvoiceObj, store);
        if (!!shouldCaptureAmount) {
            var orderId = netsuiteInvoiceObj.otherSystemSONumber;
            var salesOrder = this.getSalesOrder(orderId, sessionId);
            var httpRequestData = {
                accessToken: sessionId,
                additionalUrl: 'invoices',
                method: 'POST',
                postData: {
                    entity: Magento2WrapperUtility.toInvoiceForCreateInvoice(salesOrder)
                }
            };
            var serverResponse = this.sendRequest(httpRequestData);
            if (!!serverResponse.entity_id) {
                responseBody = this.parseInvoiceSuccessResponse(serverResponse);
            }
            else {
                responseBody = this.parseInvoiceFailureResponse(serverResponse);
            }
        }
        else {
            responseBody = {
                status: 1,
                message: '',
                data: {
                    increment_id: '',
                    entity_id: ''
                }
            };
        }
        return responseBody;
        //
        // let magentoInvoiceCreationUrl = store.entitySyncInfo.salesorder.magentoSOClosingUrl;
        // Utility.logDebug("magentoInvoiceCreationUrl_w", magentoInvoiceCreationUrl);
        //
        // let dataObj = {
        //     "increment_id": "",
        //     "capture_online": ""
        // };
        // dataObj.increment_id = netsuiteInvoiceObj.otherSystemSOId;
        // let onlineCapturingPaymentMethod = this.checkPaymentCapturingMode(netsuiteInvoiceObj, store);
        // dataObj.capture_online = onlineCapturingPaymentMethod.toString();
        // let requestParam = {"data": JSON.stringify(dataObj), "apiMethod": "createInvoice"};
        // Utility.logDebug("requestParam", JSON.stringify(requestParam));
        // let resp = this._nlapiRequestURL(magentoInvoiceCreationUrl, requestParam, null, "POST");
        // let responseBody = resp.getBody();
        // Utility.logDebug("responseBody_w", responseBody);
        // responseBody = JSON.parse(responseBody);
        // return responseBody;
    };
    /**
     * Creates of updates the category and returns category id
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @param magentoCategoryId
     * @returns {string|any|number}
     */
    Magento2Wrapper.prototype.createOrUpdateCategory = function (internalCategory, magentoParentCategoryId, magentoCategoryId) {
        var response;
        var magentoCategory = Magento2WrapperUtility.getMagentoCategory(internalCategory, magentoParentCategoryId);
        if (magentoCategory.id)
            magentoCategory.id = magentoCategoryId;
        var httpRequestData = {
            additionalUrl: 'categories',
            method: 'POST',
            postData: { "category": magentoCategory }
        };
        response = this.sendRequest(httpRequestData);
        return response.id;
    };
    /**
     * Returns categories from category with
     * given categoryId till given depth
     *
     * @param categoryId
     * @param depth
     */
    Magento2Wrapper.prototype.getCategories = function (categoryId, depth) {
        return this.sendRequest({
            additionalUrl: 'categories?rootCategoryId=' + categoryId + '&depth=' + depth,
            method: 'GET'
        });
    };
    /**
     * Creates category for given params
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @returns {any}
     */
    Magento2Wrapper.prototype.createCategory = function (internalCategory, magentoParentCategoryId) {
        return this.createOrUpdateCategory(internalCategory, magentoParentCategoryId);
    };
    /**
     * Updates category for given params
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @param magentoCategoryId
     * @returns {any}
     */
    Magento2Wrapper.prototype.updateCategory = function (internalCategory, magentoParentCategoryId, magentoCategoryId) {
        return this.createOrUpdateCategory(internalCategory, magentoParentCategoryId, magentoCategoryId);
    };
    /**
     * Deletes category for given id
     *
     * @param id
     */
    Magento2Wrapper.prototype.deleteCategory = function (id) {
        return this.sendRequest({
            method: "DELETE",
            additionalUrl: "categories/" + id
        });
    };
    /**
     * Deletes categories within (inclusive) given category id range
     *
     * @param startId
     * @param endId
     */
    Magento2Wrapper.prototype.deleteCategoriesInRange = function (startId, endId) {
        for (var i = startId; i <= endId; ++i) {
            this.deleteCategory(i);
        }
    };
    /**
     * Deletes categories with given category ids
     * @param ids
     */
    Magento2Wrapper.prototype.deleteCategoriesWithIds = function (ids) {
        for (var i = ids.length - 1; i >= 0; --i) {
            this.deleteCategory(ids[i]);
        }
    };
    /************** private methods **************/
    /**
     * Wrapper method for send nlapiRequestURL
     *
     * @param url
     * @param postdata
     * @param headers
     * @param callback
     * @param httpMethod
     * @returns {nlobjResponse}
     * @private
     */
    Magento2Wrapper.prototype._nlapiRequestURL = function (url, postdata, headers, callback, httpMethod) {
        url = url || null;
        postdata = postdata || null;
        headers = headers || {};
        callback = callback || null;
        httpMethod = httpMethod || null;
        // this.setAuthHeaderIfNeeded(headers);
        return nlapiRequestURL(url, postdata, headers, callback, httpMethod);
    };
    /**
     * This method is used to send the request to Magento2 from NetSuite and entertains every Rest API call
     * @param httpRequestData
     * @returns {any}
     */
    Magento2Wrapper.prototype.sendRequest = function (httpRequestData) {
        var finalUrl = this.serverUrl + httpRequestData.additionalUrl;
        Utility.logDebug("Request final = ", finalUrl);
        var res = null;
        if (!httpRequestData.headers) {
            httpRequestData.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (httpRequestData.accessToken || this.token)
            };
        }
        Utility.logDebug("httpRequestData = ", JSON.stringify(httpRequestData));
        if (httpRequestData.method === "GET") {
            res = this._nlapiRequestURL(finalUrl, null, httpRequestData.headers);
        }
        else {
            var postDataString = httpRequestData.postData && typeof httpRequestData.postData === "object" ?
                JSON.stringify(httpRequestData.postData) : httpRequestData.postData;
            res = this._nlapiRequestURL(finalUrl, postDataString, httpRequestData.headers, null, httpRequestData.method);
        }
        var body = res.getBody();
        Utility.logDebug("Magento2 Response Body", body);
        return JSON.parse(body);
    };
    /**
     * Check if response has an error
     * @param serverResponse
     * @returns {boolean}
     */
    Magento2Wrapper.prototype.isNAE = function (serverResponse) {
        var isNotAnError = true;
        if (!serverResponse) {
            isNotAnError = false;
        }
        else if (serverResponse.hasOwnProperty("message")) {
            isNotAnError = false;
        }
        return isNotAnError;
    };
    /**
     * Getting error message from response
     * @param serverResponse
     * @returns {string|Uint8Array}
     */
    Magento2Wrapper.prototype.getErrorMessage = function (serverResponse) {
        return serverResponse.hasOwnProperty("message") ? serverResponse.message : "Unexpected Error";
    };
    /**
     * Parse Sales Order List response
     * @param orders
     * @returns {{increment_id: string, order_id: string}[]}
     */
    Magento2Wrapper.prototype.parseSalesOrderListResponse = function (orders) {
        var ordersList = [];
        for (var i = 0; i < orders.length; i++) {
            var order = {
                increment_id: orders[i].increment_id,
                order_id: orders[i].entity_id
            };
            ordersList.push(order);
        }
        return ordersList;
    };
    /**
     * Parse single sales order response
     * @param order
     * @returns {any}
     */
    Magento2Wrapper.prototype.parseSingleSalesOrderResponse = function (order) {
        var obj = {};
        // getting main fields of sales order
        obj.customer = {};
        obj.customer.increment_id = order.increment_id;
        obj.customer.order_number = order.increment_id;
        obj.customer.order_id = order.entity_id;
        obj.customer.created_at = order.created_at;
        obj.customer.customer_id = order.customer_id;
        obj.customer.firstname = order.customer_firstname;
        obj.customer.lastname = order.customer_lastname;
        obj.customer.email = order.customer_email;
        obj.customer.shipment_method = order.shipping_method;
        obj.customer.shipping_description = order.shipping_description;
        obj.customer.customer_firstname = order.customer_firstname;
        obj.customer.customer_lastname = order.customer_lastname;
        obj.customer.customer_middlename = "";
        obj.customer.grandtotal = order.grand_total;
        obj.customer.store_id = order.store_id;
        obj.customer.shipping_amount = order.shipping_amount;
        obj.customer.discount_amount = order.discount_amount;
        obj.customer.updatedAt = order.updated_at;
        // getting items from sales order
        obj.products = [];
        var items = [];
        if (order.hasOwnProperty("items")) {
            items = order.items;
        }
        items.forEach(function (item) {
            var product = {};
            product.product_id = item.sku;
            product.qty_ordered = item.qty_ordered;
            product.product_type = item.product_type;
            product.item_id = item.item_id;
            product.tax_amount = item.tax_amount;
            product.price = item.price;
            product.original_price = item.original_price;
            product.product_options = null;
            obj.products.push(product);
        });
        // getting shipping address from sales order
        obj.shippingAddress = {};
        if (order.hasOwnProperty("extension_attributes") &&
            order.extension_attributes.hasOwnProperty("shipping_assignments") &&
            order.extension_attributes.shipping_assignments instanceof Array &&
            order.extension_attributes.shipping_assignments.length > 0 &&
            order.extension_attributes.shipping_assignments[0].hasOwnProperty("shipping") &&
            order.extension_attributes.shipping_assignments[0].shipping.hasOwnProperty("address")) {
            var shippingAddress = order.extension_attributes.shipping_assignments[0].shipping.address;
            obj.shippingAddress.address_id = shippingAddress.customer_address_id;
            obj.shippingAddress.street = shippingAddress.street.join(" "); // it will be an array
            obj.shippingAddress.city = shippingAddress.city;
            obj.shippingAddress.phone = shippingAddress.telephone;
            obj.shippingAddress.region = shippingAddress.region;
            obj.shippingAddress.region_id = shippingAddress.region_code;
            obj.shippingAddress.zip = shippingAddress.postcode;
            obj.shippingAddress.country_id = shippingAddress.country_id;
            obj.shippingAddress.firstname = shippingAddress.firstname;
            obj.shippingAddress.lastname = shippingAddress.lastname;
        }
        // getting billing address from sales order
        obj.billingAddress = {};
        if (order.hasOwnProperty("billing_address")) {
            var billingAddress = order.billing_address;
            obj.billingAddress.address_id = billingAddress.customer_address_id;
            obj.billingAddress.street = billingAddress.street.join(" "); // it will be an array
            obj.billingAddress.city = billingAddress.city;
            obj.billingAddress.phone = billingAddress.telephone;
            obj.billingAddress.region = billingAddress.region;
            obj.billingAddress.region_id = billingAddress.region_code;
            obj.billingAddress.zip = billingAddress.postcode;
            obj.billingAddress.country_id = billingAddress.country_id;
            obj.billingAddress.firstname = billingAddress.firstname;
            obj.billingAddress.lastname = billingAddress.lastname;
        }
        // getting payment information
        obj.payment = {};
        if (order.hasOwnProperty("payment")) {
            var payment = order.payment;
            obj.payment.parentId = payment.parent_id;
            obj.payment.amountOrdered = payment.amount_ordered;
            obj.payment.shippingAmount = payment.shipping_amount;
            obj.payment.baseAmountOrdered = payment.base_amount_ordered;
            obj.payment.method = payment.method;
            obj.payment.ccType = "";
            obj.payment.ccLast4 = payment.cc_last4;
            obj.payment.ccExpMonth = "";
            obj.payment.ccExpYear = payment.cc_exp_year;
            obj.payment.paymentId = "";
            obj.payment.authorizedId = "";
        }
        return obj;
    };
    /**
     * Get Customer Information by Id
     * @param serverResponse
     * @returns {any}
     */
    Magento2Wrapper.prototype.parseSingleCustomerResponse = function (serverResponse) {
        var _this = this;
        var customer = {};
        customer.id = serverResponse.id;
        customer.group_id = serverResponse.group_id;
        customer.default_billing = serverResponse.default_billing;
        customer.default_billing = serverResponse.default_billing;
        customer.email = serverResponse.email;
        customer.firstname = serverResponse.firstname;
        customer.lastname = serverResponse.lastname;
        customer.gender = serverResponse.gender;
        customer.store_id = serverResponse.store_id;
        customer.website_id = serverResponse.website_id;
        customer.addresses = [];
        if (serverResponse.addresses && serverResponse.addresses.length > 0) {
            var addresses = serverResponse.addresses;
            addresses.forEach(function (address) { return customer.addresses.push(_this._getCustomerAddress(address)); });
        }
        return customer;
    };
    /**
     * Get Customer Address Object
     * @param serverAddress
     * @returns {any}
     */
    Magento2Wrapper.prototype._getCustomerAddress = function (serverAddress) {
        var address = {};
        address.id = serverAddress.id;
        address.customer_id = serverAddress.customer_id;
        var region = serverAddress.region;
        address.region = {};
        address.region.region = region.region;
        address.region.region_code = region.region_code;
        address.region.region_id = region.region_id;
        address.region_id = region.region_id;
        address.country_id = serverAddress.country_id;
        address.street = serverAddress.street.join(" ");
        address.telephone = serverAddress.telephone;
        address.postcode = serverAddress.postcode;
        address.city = serverAddress.city;
        address.firstname = serverAddress.firstname;
        address.lastname = serverAddress.lastname;
        address.default_shipping = serverAddress.hasOwnProperty("default_shipping") ? serverAddress.default_shipping : false;
        address.default_billing = serverAddress.hasOwnProperty("default_billing") ? serverAddress.default_billing : false;
        return address;
    };
    /**
     * Get Sales Order Shipment data for creating Shipment in Magento
     * @param magentoSOId
     * @param fulfillRec
     * @returns {any}
     */
    Magento2Wrapper.prototype.getShipmentDataForExport = function (magentoSOId, fulfillRec) {
        var shipmentData = {};
        var entity = {};
        entity.items = [];
        // comments and tracks are not working due to Magento bug: https://github.com/magento/devdocs/issues/527
        entity.comments = [];
        // orderId is a mandatory field
        entity.orderId = fulfillRec.getFieldValue(ConnectorConstants.Transaction.Fields.ExternalSystemNumber);
        var itemsCount = fulfillRec.getLineItemCount("item");
        var lineItems = [];
        var comment = "";
        for (var line = 1; line <= itemsCount; line++) {
            var itemReceive = fulfillRec.getLineItemValue("item", "itemreceive", line) === "T";
            if (itemReceive) {
                var itemId = fulfillRec.getLineItemValue("item", ConnectorConstants.Transaction.Columns.MagentoOrderId, line);
                var itemQty = fulfillRec.getLineItemValue("item", "quantity", line);
                var isSerialItem = fulfillRec.getLineItemValue("item", "isserialitem", 1) === "T";
                var itemDescription = fulfillRec.getLineItemValue("item", "itemdescription", line);
                var serialNumbers = fulfillRec.getLineItemValue("item", "serialnumbers", line);
                comment = isSerialItem ? comment + "," + itemDescription + "=" + serialNumbers : comment = "-";
                lineItems.push({
                    itemId: itemId,
                    itemQty: itemQty
                });
            }
        }
        lineItems.forEach(function (item) {
            entity.items.push({
                orderItemId: item.itemId,
                qty: item.itemQty
            });
        });
        // In Magento 1.x version comments were added in the create call.
        // entity.comments.push({comment: comment});
        shipmentData.entity = entity;
        return shipmentData;
    };
    Magento2Wrapper.prototype.parseSalesShipmentResponse = function (serverResponse) {
        var salesShipment = {};
        salesShipment.billing_address_id = serverResponse.billing_address_id;
        salesShipment.created_at = serverResponse.created_at;
        salesShipment.customer_id = serverResponse.customer_id;
        salesShipment.entity_id = serverResponse.entity_id;
        salesShipment.increment_id = serverResponse.increment_id;
        salesShipment.order_id = serverResponse.order_id;
        salesShipment.packages = serverResponse.packages;
        salesShipment.shipping_address_id = serverResponse.shipping_address_id;
        salesShipment.store_id = serverResponse.store_id;
        salesShipment.total_qty = serverResponse.total_qty;
        salesShipment.updated_at = serverResponse.updated_at;
        salesShipment.items = [];
        salesShipment.tracks = [];
        salesShipment.comments = [];
        var items = serverResponse.items || [];
        items.forEach(function (item) {
            salesShipment.items.push({
                entity_id: item.entity_id,
                name: item.name,
                order_item_id: item.order_item_id,
                parent_id: item.parent_id,
                price: item.price,
                product_id: item.product_id,
                qty: item.qty,
                sku: item.sku,
                weight: item.weight
            });
        });
        var tracks = serverResponse.tracks || [];
        tracks.forEach(function (track) {
            salesShipment.tracks.push({
                carrier_code: track.carrier_code,
                created_at: track.created_at,
                description: track.description,
                entity_id: track.entity_id,
                order_id: track.order_id,
                parent_id: track.parent_id,
                qty: track.qty,
                title: track.title,
                track_number: track.track_number,
                updated_at: track.updated_at,
                weight: track.weight
            });
        });
        var comments = serverResponse.comments || [];
        comments.forEach(function (comment) {
            salesShipment.comments.push({
                comment: comment.comment,
                created_at: comment.created_at,
                entity_id: comment.entity_id,
                is_customer_notified: comment.is_customer_notified,
                is_visible_on_front: comment.is_visible_on_front,
                parent_id: comment.parent_id
            });
        });
        return salesShipment;
    };
    /**
     * Get Carrier Code by Shipping Carrier & Method
     * @param carrier
     * @param carrierText
     * @returns {string}
     */
    Magento2Wrapper.prototype.getCarrier = function (carrier, carrierText) {
        var carrierCode = "custom";
        if (carrier === "ups") {
            carrierCode = "ups";
        }
        else {
            carrierText = !!carrierText ? carrierText.toString().toLowerCase() : "";
            var nonupsCarriers = ["usps", "dhl", "fedex", "dhlint"];
            for (var i = 0; i < nonupsCarriers.length; i++) {
                var nonupsCarrier = nonupsCarriers[i];
                if (carrierText.indexOf("usps") !== -1) {
                    carrierCode = nonupsCarrier;
                    break;
                }
            }
        }
        return carrierCode;
    };
    /**
     * Get Sales Order Shipment Track data for adding Rracking Number in Shipment in Magento
     * @param shipmentIncrementId
     * @param carrier
     * @param carrierText
     * @param trackingNumber
     * @param fulfillRec
     * @returns {any}
     */
    Magento2Wrapper.prototype.getShipmentTrackDataForExport = function (shipmentIncrementId, carrier, carrierText, trackingNumber, fulfillRec) {
        var shipmentData = {};
        var entity = {};
        // TODO: verify ids
        entity.parentId = shipmentIncrementId;
        entity.orderId = fulfillRec.getFieldValue(ConnectorConstants.Transaction.Fields.ExternalSystemNumber);
        entity.carrierCode = this.getCarrier(carrier, carrierText);
        entity.title = carrierText;
        entity.trackNumber = trackingNumber;
        shipmentData.entity = entity;
        return shipmentData;
    };
    /**
     *
     * @param serverResponse
     * @returns {SalesShipmentTrack}
     */
    Magento2Wrapper.prototype.parseSalesShipmentTrackResponse = function (serverResponse) {
        var salesShipmentTrack = {};
        salesShipmentTrack.carrier_code = serverResponse.carrier_code;
        salesShipmentTrack.created_at = serverResponse.created_at;
        salesShipmentTrack.description = serverResponse.description;
        salesShipmentTrack.entity_id = serverResponse.entity_id;
        salesShipmentTrack.order_id = serverResponse.order_id;
        salesShipmentTrack.parent_id = serverResponse.parent_id;
        salesShipmentTrack.qty = serverResponse.qty;
        salesShipmentTrack.title = serverResponse.title;
        salesShipmentTrack.track_number = serverResponse.track_number;
        salesShipmentTrack.updated_at = serverResponse.updated_at;
        salesShipmentTrack.weight = serverResponse.weight;
        return salesShipmentTrack;
    };
    /**
     * Check either payment of this Invoice should capture online or not
     * @param netsuiteInvoiceObj
     * @param store
     * @returns {boolean}
     */
    Magento2Wrapper.prototype.checkPaymentCapturingMode = function (netsuiteInvoiceObj, store) {
        var salesOrderId = netsuiteInvoiceObj.netsuiteSOId;
        var isSOFromOtherSystem = netsuiteInvoiceObj.isSOFromOtherSystem;
        var sOPaymentMethod = netsuiteInvoiceObj.sOPaymentMethod;
        var isOnlineMethod = this.isOnlineCapturingPaymentMethod(sOPaymentMethod, store);
        if (!!isSOFromOtherSystem && isSOFromOtherSystem == 'T' && isOnlineMethod) {
            return true;
        }
        else {
            return false;
        }
    };
    /**
     * Check either payment method capturing is online supported or not??
     * @param sOPaymentMethodId
     * @param store
     * @returns {boolean}
     */
    Magento2Wrapper.prototype.isOnlineCapturingPaymentMethod = function (sOPaymentMethodId, store) {
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
            default:
                onlineSupported = false;
                break;
        }
        return onlineSupported;
    };
    return Magento2Wrapper;
}());
/**
 * Provides utility functions for Magento2Wrapper class
 */
var Magento2WrapperUtility = (function () {
    function Magento2WrapperUtility() {
    }
    /**
     * Returns Magento2CustomAttribute object for given params
     *
     * @param attributeCode
     * @param value
     * @returns {{attribute_code: string, value: any}}
     */
    Magento2WrapperUtility.getCustomAttribute = function (attributeCode, value) {
        return {
            attribute_code: attributeCode,
            value: value
        };
    };
    /**
     * Returns Array of Magento2CustomAttributes for given key value dictionary
     *
     * @param dictionary
     * @returns {Array<Magento2CustomAttribute>}
     */
    Magento2WrapperUtility.getCustomAttributes = function (dictionary) {
        var customAttributes = [];
        for (var attrKey in dictionary) {
            var attrValue = dictionary[attrKey];
            if (attrValue || typeof (attrValue) != "undefined") {
                customAttributes.push(this.getCustomAttribute(attrKey, attrValue));
            }
        }
        return customAttributes;
    };
    /**
     * Returns Magento2Category equivalent of internal Category
     * for given parameters
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @param magentoCategoryId
     * @returns {Magento2Category}
     */
    Magento2WrapperUtility.getMagentoCategory = function (internalCategory, magentoParentCategoryId, magentoCategoryId) {
        var customAttributes = this.getCustomAttributes({
            description: internalCategory.description,
            meta_title: internalCategory.pageTitle,
            meta_description: internalCategory.metaTagHtml,
            meta_keywords: internalCategory.searchKeywords,
            url_key: internalCategory.urlComponent // TODO: set a unique key if not existing
        });
        var magentoCategory = {
            include_in_menu: !internalCategory.excludeFromSitemap,
            parent_id: magentoParentCategoryId || 1,
            name: internalCategory.itemId,
            // TODO: set the actual value for is_active when Magento2 API allows updating inactive category
            is_active: true,
            custom_attributes: customAttributes
        };
        if (magentoCategoryId)
            magentoCategory.id = magentoCategoryId;
        return magentoCategory;
    };
    Magento2WrapperUtility.toParamStrings = function (requestParams) {
        var arr = [];
        function parse(obj, pre) {
            if (typeof obj == "string" || typeof obj == "number") {
                arr.push(pre + "=" + obj);
            }
            else {
                for (var key in obj) {
                    parse(obj[key], pre + "[" + key + "]");
                }
            }
        }
        for (var key in requestParams) {
            parse(requestParams[key], key);
        }
        return arr;
    };
    Magento2WrapperUtility.toInvoiceForCreateInvoice = function (salesOrder) {
        var items = salesOrder.items;
        var invoiceItems = [];
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var invoiceItem = {
                order_item_id: item.item_id,
                qty: item.qty_ordered,
                price: item.price,
                price_incl_tax: item.price_incl_tax,
                base_cost: item.base_cost,
                base_discount_amount: item.base_discount_amount,
                base_discount_tax_compensation_amount: item.base_discount_tax_compensation_amount,
                base_price: item.base_price,
                base_price_incl_tax: item.base_price_incl_tax,
                base_row_total: item.base_row_total,
                base_row_total_incl_tax: item.base_row_total_incl_tax,
                base_tax_amount: item.base_tax_amount,
                discount_amount: item.discount_amount,
                discount_tax_compensation_amount: item.discount_tax_compensation_amount,
                name: item.name,
                product_id: item.product_id,
                row_total: item.row_total,
                row_total_incl_tax: item.row_total_incl_tax,
                sku: item.sku,
                tax_amount: item.tax_amount
            };
            invoiceItems.push(invoiceItem);
        }
        return {
            order_id: salesOrder.entity_id,
            base_currency_code: salesOrder.base_currency_code,
            base_discount_amount: salesOrder.base_discount_amount,
            base_grand_total: salesOrder.base_grand_total,
            base_discount_tax_compensation_amount: salesOrder.base_discount_tax_compensation_amount,
            base_shipping_amount: salesOrder.base_shipping_amount,
            base_shipping_discount_tax_compensation_amnt: salesOrder.base_shipping_discount_tax_compensation_amnt,
            base_shipping_incl_tax: salesOrder.base_shipping_incl_tax,
            base_shipping_tax_amount: salesOrder.base_shipping_tax_amount,
            base_subtotal: salesOrder.base_subtotal,
            base_subtotal_incl_tax: salesOrder.base_subtotal_incl_tax,
            base_tax_amount: salesOrder.base_tax_amount,
            base_to_global_rate: salesOrder.base_to_global_rate,
            base_to_order_rate: salesOrder.base_to_order_rate,
            billing_address_id: salesOrder.billing_address_id,
            discount_amount: salesOrder.discount_amount,
            global_currency_code: salesOrder.global_currency_code,
            grand_total: salesOrder.grand_total,
            discount_tax_compensation_amount: salesOrder.discount_tax_compensation_amount,
            order_currency_code: salesOrder.order_currency_code,
            // shipping_address_id: ??,
            shipping_amount: salesOrder.shipping_amount,
            shipping_discount_tax_compensation_amount: salesOrder.shipping_discount_tax_compensation_amount,
            shipping_incl_tax: salesOrder.shipping_incl_tax,
            shipping_tax_amount: salesOrder.shipping_tax_amount,
            state: salesOrder.state,
            store_currency_code: salesOrder.store_currency_code,
            store_id: salesOrder.store_id,
            subtotal: salesOrder.subtotal,
            subtotal_incl_tax: salesOrder.subtotal_incl_tax,
            tax_amount: salesOrder.tax_amount,
            total_qty: salesOrder.total_qty_ordered,
            updated_at: salesOrder.updated_at,
            items: invoiceItems
        };
    };
    return Magento2WrapperUtility;
}());
/**
 * Constants for Magento2 REST API
 */
var Magento2Constants = (function () {
    function Magento2Constants() {
    }
    Magento2Constants.filter = {
        fields: {
            status: 'status',
            updated_at: 'updated_at',
        },
        condition_types: {
            in: 'in',
            gt: 'gt'
        }
    };
    return Magento2Constants;
}());
//# sourceMappingURL=f3_magento2_wrapper.js.map