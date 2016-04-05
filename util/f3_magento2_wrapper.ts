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
    addresses: Array<CustomerAddress>;
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
    street: Array<string>;
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
    public test(id: string) {
        let serverResponse;
        let httpRequestData: HttpRequestData = {
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
     * Gets supported Date Format
     * @returns {string}
     */
    public getDateFormat(): string {
        return "ISO";
    }

    /**
     * Get token from Magento
     * @param userName
     * @param apiKey
     * @returns {any}
     */
    public getSessionIDFromServer(userName, apiKey) {
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

    public getCustomerById(customerId: string|number): any {
        let httpRequestData: HttpRequestData = {
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

        let customerResponse = this.getCustomerById(customerId);
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
                "Authorization": "Bearer " + this.Password
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
     * Parse Sales Order List response
     * @param orders
     * @returns {Array<any>}
     */
    private parseSalesOrderListResponse(orders: any): Array<any> {
        let ordersList: Array<any> = [];

        for (let i = 0; i < orders.length; i++) {
            let order = {
                increment_id: orders[i].increment_id,
                order_id: orders[i].increment_id,
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
        obj.customer.order_id = order.order_id;
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
     * Get Customer Information by Id
     * @param serverResponse
     * @returns {any}
     */
    private parseSingleCustomerResponse(serverResponse: Customer): Customer {
        let customer: any = {};

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
}


/********************************************** HELP **********************************************
 *
 * Filters structure in get calls
 *
 {
     "search_criteria":  {
     "filter_groups":  [
         {
             "filters":  [
                 {
                     "field":  "attribute_name",
                     "value":  [string|int|float],
                     "condition_type":  [string]; optional
 }
     more entries
 ]
 }
     more entries
 ],
     "current_page":  [int] page number; optional
     "page_size":  [int] number of items on a page; optional
     "sort_orders":  [ optional
         {
             "field":  "attribute_name",
             "direction":  [int] -1 or 1
         }
         more entries
     ]
 }
 }
 ********************************************** HELP ***********************************************/
