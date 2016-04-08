/**
 * Created by zahmed on 28-Mar-16.
 *
 * Class Name:  Magento2Wrapper
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

interface SalesShipmentTrack {
    carrier_code: string;
    created_at: string;
    description: string;
    entity_id: number;
    order_id: number;
    parent_id: number;
    qty: number;
    title: string;
    track_number: string;
    updated_at: string;
    weight: number;
    extension_attributes?: any;
}

interface SalesShipmentPackages {
    extensionAttributes?: any;
}

interface SalesShipmentItems {
    additional_data: string;
    description: string;
    entity_id: number;
    name: string;
    order_item_id: number;
    parent_id: number;
    price: number;
    product_id: number;
    qty: number;
    row_total: number;
    sku: string;
    weight: number;
    extension_attributes?: any;
}

interface SalesShipmentComments {
    comment: string;
    created_at: string;
    entity_id: number;
    is_customer_notified: number;
    is_visible_on_front: number;
    parent_id: number;
    extension_attributes?: any;
}

interface SalesShipment {
    billing_address_id: number;
    created_at: string;
    customer_id: number;
    email_sent: number;
    entity_id: number;
    increment_id: string;
    order_id: number;
    shipment_status: number;
    shipping_address_id: number;
    shipping_label: string;
    store_id: number;
    total_qty: number;
    total_weight: number;
    updated_at: string;
    extension_attributes?: any;
    packages: SalesShipmentPackages[];
    items: SalesShipmentItems[];
    tracks: SalesShipmentTrack[];
    comments: SalesShipmentComments[];
}

/**
 * Interface of Customer Object in Magento2
 */
interface Customer {
    id: number;
    group_id: number;
    default_billing: string;
    default_shipping: string;
    created_at: string;
    updated_at: string;
    created_in: string;
    email: string;
    firstname: string;
    lastname: string;
    gender: number;
    store_id: number;
    website_id: number;
    addresses: CustomerAddress[];
    disable_auto_group_change: number;
}

/**
 * Interface of Region of Address of Customer Object in Magento2
 */
interface Region {
    region_code: string;
    region: string;
    region_id: number;
}

/**
 * Interface of Address of Customer Object in Magento2
 */
interface  CustomerAddress {
    id: number;
    customer_id: number;
    region: Region;
    region_id: number;
    country_id: string;
    street: string[];
    telephone: string;
    postcode: string;
    city: string;
    firstname: string;
    lastname: string;
    default_shipping?: boolean;
    default_billing?: boolean;
}

/**
 * Interface of Request Data Object Object in Magento2
 */
interface HttpRequestData {
    accessToken: string;
    additionalUrl: string;
    method: string;
    headers?: any;
    postData?: any;
    data?: any;
}

/**
 * Magento2Wraper has the functionality of Magento2 CRUD operations
 */
class Magento2Wrapper {
    private ServerUrl = "";
    private UserName = "";
    private Password = "";

    constructor() {
        // intentionally empty contructor 
    }

    /************** public methods **************/

    /**
     * Test call for getting order information
     * @param id
     * @returns {void|any}
     */
    public test(id: string): any {
        let serverResponse;
        let httpRequestData: HttpRequestData = {
            accessToken: "",
            additionalUrl: "orders/" + id,
            data: {},
            method: "GET"
        };
        serverResponse = this.sendRequest(httpRequestData);

        return serverResponse;
    }

    /**
     * Init method
     * @param storeInfo
     */
    public initialize(storeInfo: any): void {
        if (!!storeInfo) {
            this.ServerUrl = storeInfo.endpoint;
        } else if (!!ConnectorConstants && !!ConnectorConstants.CurrentStore) {
            this.ServerUrl = ConnectorConstants.CurrentStore.endpoint;
        }
    }

    /**
     * Get supported Date Format
     * @returns {string}
     */
    public getDateFormat(): string {
        return "ISO";
    }

    /**
     * Get token from Magento
     * @param userName
     * @param apiKey
     * @returns {string}
     */
    public getSessionIDFromServer(userName, apiKey): string {
        // TODO:  Get the token using 2-ledge authentication
        let sessionID = "DUMMY_SESSION_ID";

        this.UserName = userName;
        this.Password = apiKey;

        sessionID = apiKey;

        return sessionID;
    }

    /**
     * Get Sales Orders List
     * @param filters
     * @param [sessionId]
     * @returns {any}
     */
    public getSalesOrders(filters: any, sessionId?: string): any {
        let httpRequestData: HttpRequestData = {
            accessToken: sessionId,
            additionalUrl: "orders",
            method: "GET"
        };
        httpRequestData.additionalUrl += "?";

        httpRequestData.additionalUrl += "searchCriteria[filterGroups][0][filters][0][field]=" + "status";
        httpRequestData.additionalUrl += "&searchCriteria[filterGroups][0][filters][0][value]=" + filters.orderStatus.join(",");
        httpRequestData.additionalUrl += "&searchCriteria[filterGroups][0][filters][0][condition_type]=" + "in";

        httpRequestData.additionalUrl += "&searchCriteria[filterGroups][0][filters][1][field]=" + "updated_at";
        httpRequestData.additionalUrl += "&searchCriteria[filterGroups][0][filters][1][value]=" + filters.updateDate;
        httpRequestData.additionalUrl += "&searchCriteria[filterGroups][0][filters][1][condition_type]=" + "gt";


        // Make Call and Get Data
        let serverFinalResponse: any = {};

        try {
            let serverResponse: any = this.sendRequest(httpRequestData);

            if (this.isNAE(serverResponse) && serverResponse.hasOwnProperty("items")) {
                serverFinalResponse.orders = this.parseSalesOrderListResponse(serverResponse.items);
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            } else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }

            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        } catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();

            Utility.logException("Magento2 Wrapper: Error during getSalesOrders", e);
        }

        return serverFinalResponse;
    }

    /**
     * Get Sales Order Information
     * @param incrementId
     * @param [sessionId]
     * @returns {any}
     */
    public getSalesOrderInfo(incrementId: number|string, sessionId?: string): any {
        let httpRequestData: HttpRequestData = {
            accessToken: sessionId,
            additionalUrl: "orders/" + incrementId,
            method: "GET"
        };

        // Make Call and Get Data
        let serverFinalResponse: any = {};

        try {
            let serverResponse: any = this.sendRequest(httpRequestData);

            if (this.isNAE(serverResponse)) {
                serverFinalResponse = this.parseSingleSalesOrderResponse(serverResponse);
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            } else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }

            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        } catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();

            Utility.logException("Magento2 Wrapper: Error during getSalesOrders", e);
        }

        return serverFinalResponse;
    }

    public getCustomerById(customerId: string|number, sessionId: string): any {
        let httpRequestData: HttpRequestData = {
            accessToken: sessionId,
            additionalUrl: "customers/" + customerId,
            method: "GET"
        };

        // Make Call and Get Data
        let serverFinalResponse: any = {};

        try {
            let serverResponse: any = this.sendRequest(httpRequestData);

            if (this.isNAE(serverResponse)) {
                serverFinalResponse.customer = this.parseSingleCustomerResponse(serverResponse);
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            } else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }

            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        } catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();

            Utility.logException("Magento2 Wrapper: Error during getSalesOrders", e);
        }

        return serverFinalResponse;
    }

    /**
     * Get Customer Addresses
     * @param customerId
     * @param sessionId
     * @returns {any}
     */
    public getCustomerAddress(customerId: string|number, sessionId?: string): any {
        let result: any = {};
        let customerAddresses: any = [];

        let customerResponse = this.getCustomerById(customerId, sessionId);
        if (customerResponse.status) {
            result.status = true;
            let customer: Customer = customerResponse.customer;
            let addresses = customer.addresses;

            addresses.forEach(address => {
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

        } else {
            result.status = false;
            result.faultCode = customerResponse.faultCode;
            result.faultString = customerResponse.faultString;
        }

        return result;
    }

    /**
     * Copying from Magneto Wrapper to Magento2 Wrapper
     * @param magentoIds
     * @param enviornment
     * @returns {any}
     */
    public getNsProductIdsByExtSysIds(magentoIds: Array<any>, enviornment: any): any {
        let cols = [];
        let filterExpression: any = "";
        let resultArray = [];
        let result: any = {};

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
            for (let x = 0; x < magentoIds.length; x++) {
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
            let recs = nlapiSearchRecord("item", null, filterExpression, cols);

            if (recs && recs.length > 0) {
                for (let i = 0; i < recs.length; i++) {
                    let obj: any = {};
                    obj.internalId = recs[i].getId();

                    let itemid = recs[i].getValue("itemid");
                    if (!Utility.isBlankOrNull(itemid)) {
                        let itemidArr = itemid.split(": ");
                        itemid = (itemidArr[itemidArr.length - 1]).trim();
                    }
                    obj.magentoID = itemid;
                    resultArray[resultArray.length] = obj;
                }
            }
            result.data = resultArray;
        } catch (ex) {
            Utility.logException("Error in getNetsuiteProductIdByMagentoId", ex);
            result.errorMsg = ex.toString();
        }
        return result;
    }

    /**
     * Copying from Magneto Wrapper to Magento2 Wrapper
     * @param payment
     * @param netsuitePaymentTypes
     * @param magentoCCSupportedPaymentTypes
     * @returns {{paymentmethod: string, pnrefnum: string, ccapproved: string, paypalauthid: string}}
     */
    public getPaymentInfo(payment: any, netsuitePaymentTypes: any, magentoCCSupportedPaymentTypes: any) {
        let paymentInfo = {
            "paymentmethod": "",
            "pnrefnum": "",
            "ccapproved": "",
            "paypalauthid": ""
        };
        Utility.logDebug("MagentoWrapper.getPaymentInfo", "Start");
        let paypalPaymentMethod = netsuitePaymentTypes.PayPal;

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

        let paymentMethod = (payment.method);

        Utility.logDebug("paymentMethod", paymentMethod);

        // if no payment method found return
        if (!paymentMethod) {
            return paymentInfo;
        }

        // initialize scrub
        ConnectorConstants.initializeScrubList();
        let system = ConnectorConstants.CurrentStore.systemId;

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
        } else if (paymentMethod === "paypal_express" || paymentMethod === "payflow_advanced") {
            Utility.logDebug("Condition (2)", "");
            paymentInfo.paymentmethod = paypalPaymentMethod;
            paymentInfo.paypalauthid = payment.authorizedId;
        } else {
            Utility.logDebug("Condition (3)", "");
            let otherPaymentMethod = paymentMethod;
            Utility.logDebug("paymentMethodLookup_Key", otherPaymentMethod);
            let paymentMethodLookupValue = FC_ScrubHandler.findValue(system, "PaymentMethod", otherPaymentMethod);
            Utility.logDebug("paymentMethodLookup_Value", paymentMethodLookupValue);
            if (!!paymentMethodLookupValue && paymentMethodLookupValue + "" !== otherPaymentMethod + "") {
                paymentInfo.paymentmethod = paymentMethodLookupValue;
            }
        }
        Utility.logDebug("MagentoWrapper.getPaymentInfo", "End");
        return paymentInfo;
    }

    /**
     * Get Discount for creating order in NetSuite
     * @param salesOrderObj
     * @returns {string|string|*}
     */
    public getDiscount(salesOrderObj: any): number|string {
        return salesOrderObj.order.discount_amount;
    }

    /**
     * Create Sales Order Shipment
     * @param sessionId
     * @param magentoItemIds
     * @param magentoSOId
     * @param fulfillRec
     * @returns {any}
     */
    public createFulfillment(sessionId: string, magentoItemIds: any, magentoSOId: string, fulfillRec: nlobjRecord): any {
        let httpRequestData: HttpRequestData = {
            accessToken: sessionId,
            additionalUrl: "shipment/",
            method: "POST",
            postData: this.getShipmentDataForExport(magentoSOId, fulfillRec)
        };

        // Make Call and Get Data
        let serverFinalResponse: any = {};

        try {
            let serverResponse: any = this.sendRequest(httpRequestData);

            if (this.isNAE(serverResponse)) {
                let shipment: SalesShipment = this.parseSalesShipmentResponse(serverResponse);
                serverFinalResponse.result = shipment.entity_id;
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            } else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }

            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        } catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();

            Utility.logException("Magento2 Wrapper: Error during getCreateFulfillmentXML", e);
        }

        return serverFinalResponse;
    }

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
    public createTracking(shipmentIncrementId: string, carrier: string, carrierText: string, trackingNumber: string, sessionId: string,
                          magentoSOId: string, otherInfo: any, fulfillRec: nlobjRecord) {
        let httpRequestData: HttpRequestData = {
            accessToken: sessionId,
            additionalUrl: "shipment/track",
            method: "POST",
            postData: this.getShipmentTrackDataForExport(shipmentIncrementId, carrier, carrierText, trackingNumber, fulfillRec)
        };

        // Make Call and Get Data
        let serverFinalResponse: any = {};

        try {
            let serverResponse: any = this.sendRequest(httpRequestData);

            if (this.isNAE(serverResponse)) {
                let shipment: SalesShipmentTrack = this.parseSalesShipmentTrackResponse(serverResponse);
                serverFinalResponse.result = shipment.entity_id;
                serverFinalResponse.status = true;
                serverFinalResponse.faultCode = "";
                serverFinalResponse.faultString = "";
            } else {
                serverFinalResponse.status = false;
                serverFinalResponse.faultCode = "API_ERROR";
                serverFinalResponse.faultString = this.getErrorMessage(serverResponse);
                Utility.logDebug("Error in order response", JSON.stringify(serverResponse));
            }

            Utility.logDebug("Magento2 Wrapper: serverFinalResponse", JSON.stringify(serverFinalResponse));
        } catch (e) {
            serverFinalResponse.status = false;
            serverFinalResponse.faultCode = "SERVER_ERROR";
            serverFinalResponse.faultString = e.toString();

            Utility.logException("Magento2 Wrapper: Error during createTracking", e);
        }

        return serverFinalResponse;
    }

    /************** private methods **************/

    /**
     * This method is used to send the request to Magento2 from NetSuite and entertains every Rest API call
     * @param httpRequestData
     * @returns {any}
     */
    private sendRequest(httpRequestData: HttpRequestData): void {
        let finalUrl = this.ServerUrl + httpRequestData.additionalUrl;

        Utility.logDebug("Request final = ", finalUrl);
        let res = null;

        if (!httpRequestData.headers) {
            httpRequestData.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + httpRequestData.accessToken
            };
        }

        Utility.logDebug("httpRequestData = ", JSON.stringify(httpRequestData));

        if (httpRequestData.method === "GET") {
            res = nlapiRequestURL(finalUrl, null, httpRequestData.headers);
        } else {
            let postDataString = typeof httpRequestData.postData === "object" ?
                JSON.stringify(httpRequestData.postData) : httpRequestData.postData;

            res = nlapiRequestURL(finalUrl, postDataString, httpRequestData.headers, httpRequestData.method);
        }

        let body = res.getBody();
        Utility.logDebug("Magento2 Response Body", body);
        return JSON.parse(body);
    }

    /**
     * Check if response has an error
     * @param serverResponse
     * @returns {boolean}
     */
    private isNAE(serverResponse: any): boolean {
        let isNotAnError = true;
        if (!serverResponse) {
            isNotAnError = false;
        } else if (serverResponse.hasOwnProperty("message")) {
            isNotAnError = false;
        }
        return isNotAnError;
    }

    /**
     * Getting error message from response
     * @param serverResponse
     * @returns {string|Uint8Array}
     */
    private getErrorMessage(serverResponse: any): string {
        return serverResponse.hasOwnProperty("message") ? serverResponse.message : "Unexpected Error";
    }

    /**
     * Parse Sales Order List response
     * @param orders
     * @returns {{increment_id: string, order_id: string}[]}
     */
    private parseSalesOrderListResponse(orders: any): {increment_id: string, order_id: string}[] {
        let ordersList: {increment_id: string, order_id: string}[] = [];

        for (let i = 0; i < orders.length; i++) {
            let order = {
                increment_id: orders[i].increment_id,
                order_id: orders[i].increment_id
            };

            ordersList.push(order);
        }

        return ordersList;
    }

    /**
     * Parse single sales order response
     * @param order
     * @returns {any}
     */
    private parseSingleSalesOrderResponse(order: any): any {
        let obj: any = {};

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

        let items = [];
        if (order.hasOwnProperty("items")) {
            items = order.items;
        }

        items.forEach(item => {
            let product: any = {};

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

            let shippingAddress = order.extension_attributes.shipping_assignments[0].shipping.address;
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
            let billingAddress = order.billing_address;
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
            let payment = order.payment;
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
    }

    /**
     * Get Customer Information by Id
     * @param serverResponse
     * @returns {any}
     */
    private parseSingleCustomerResponse(serverResponse: Customer): Customer {
        let customer: Customer = {} as Customer;

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
            let addresses = serverResponse.addresses;

            addresses.forEach(address => customer.addresses.push(this._getCustomerAddress(address)));
        }

        return customer;
    }

    /**
     * Get Customer Address Object
     * @param serverAddress
     * @returns {any}
     */
    private _getCustomerAddress(serverAddress: CustomerAddress): CustomerAddress {
        let address: any = {};

        address.id = serverAddress.id;
        address.customer_id = serverAddress.customer_id;

        let region: Region = serverAddress.region;

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
    }

    /**
     * Get Sales Order Shipment data for creating Shipment in Magento
     * @param magentoSOId
     * @param fulfillRec
     * @returns {any}
     */
    private getShipmentDataForExport(magentoSOId: string, fulfillRec: nlobjRecord): any {
        let shipmentData: any = {};
        let entity: any = {};

        entity.items = [];
        // comments and tracks are not working due to Magento bug: https://github.com/magento/devdocs/issues/527
        entity.comments = [];
        // orderId is a mandatory field
        entity.orderId = fulfillRec.getFieldValue(ConnectorConstants.Transaction.Fields.ExternalSystemNumber);

        let itemsCount: number = fulfillRec.getLineItemCount("item");
        let lineItems: Array<{itemId: string , itemQty: string}> = [];
        let comment = "";

        for (let line = 1; line <= itemsCount; line++) {
            let itemReceive: boolean = fulfillRec.getLineItemValue("item", "itemreceive", line) === "T";

            if (itemReceive) {
                let itemId = fulfillRec.getLineItemValue("item", ConnectorConstants.Transaction.Columns.MagentoOrderId, line);
                let itemQty = fulfillRec.getLineItemValue("item", "quantity", line);
                let isSerialItem: boolean = fulfillRec.getLineItemValue("item", "isserialitem", 1) === "T";
                let itemDescription: string = fulfillRec.getLineItemValue("item", "itemdescription", line);
                let serialNumbers: string = fulfillRec.getLineItemValue("item", "serialnumbers", line);

                comment = isSerialItem ? comment + "," + itemDescription + "=" + serialNumbers : comment = "-";

                lineItems.push({
                    itemId: itemId,
                    itemQty: itemQty
                });
            }
        }

        lineItems.forEach(item => {
            entity.items.push({
                orderItemId: item.itemId,
                qty: item.itemQty
            });
        });

        // In Magento 1.x version comments were added in the create call.
        // entity.comments.push({comment: comment});

        shipmentData.entity = entity;

        return shipmentData;
    }

    private parseSalesShipmentResponse(serverResponse: SalesShipment): SalesShipment {
        let salesShipment: SalesShipment = {} as SalesShipment;

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

        let items = serverResponse.items || [];

        items.forEach(item => {
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

        let tracks = serverResponse.tracks || [];

        tracks.forEach(track => {
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

        let comments = serverResponse.comments || [];

        comments.forEach(comment => {
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
    }

    /**
     * Get Carrier Code by Shipping Carrier & Method
     * @param carrier
     * @param carrierText
     * @returns {string}
     */
    private getCarrier(carrier: string, carrierText: string) {
        let carrierCode = "custom";
        if (carrier === "ups") {
            carrierCode = "ups";
        } else {
            carrierText = !!carrierText ? carrierText.toString().toLowerCase() : "";

            let nonupsCarriers = ["usps", "dhl", "fedex", "dhlint"];

            for (let i = 0; i < nonupsCarriers.length; i++) {
                let nonupsCarrier = nonupsCarriers[i];
                if (carrierText.indexOf("usps") !== -1) {
                    carrierCode = nonupsCarrier;
                    break;
                }
            }
        }

        return carrierCode;
    }

    /**
     * Get Sales Order Shipment Track data for adding Rracking Number in Shipment in Magento
     * @param shipmentIncrementId
     * @param carrier
     * @param carrierText
     * @param trackingNumber
     * @param fulfillRec
     * @returns {any}
     */
    private getShipmentTrackDataForExport(shipmentIncrementId: string, carrier: string, carrierText: string, trackingNumber: string,
                                          fulfillRec: nlobjRecord): any {
        let shipmentData: any = {};
        let entity: any = {};

        // TODO: verify ids
        entity.parentId = shipmentIncrementId;
        entity.orderId = fulfillRec.getFieldValue(ConnectorConstants.Transaction.Fields.ExternalSystemNumber);
        entity.carrierCode = this.getCarrier(carrier, carrierText);
        entity.title = carrierText;
        entity.trackNumber = trackingNumber;

        shipmentData.entity = entity;

        return shipmentData;
    }

    /**
     *
     * @param serverResponse
     * @returns {SalesShipmentTrack}
     */
    private parseSalesShipmentTrackResponse(serverResponse: SalesShipmentTrack): SalesShipmentTrack {
        let salesShipmentTrack = {} as SalesShipmentTrack;

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
    }
}
