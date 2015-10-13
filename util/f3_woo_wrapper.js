/**
 * Created by ubaig on 10/07/2015.
 * TODO:
 * -
 * -
 * -
 * Referenced By:
 * -
 * -
 * -
 * Dependencies:
 * -
 * -
 * -
 * -
 */

/**
 * This is a Wrapper Class for Woo Commerce API
 */
WooWrapper = (function () {

    //region Private Methods

    /**
     * Parses Single Sales Order Response
     * @param serverOrder
     * @returns {*|{customer_id, increment_id, shippingAddress, billingAddress, payment}}
     */
    function parseSingleSalesOrderResponse(serverOrder) {

        var localOrder = ConnectorModels.salesOrderModel();

        localOrder.increment_id = serverOrder.order_number;

        if (serverOrder.shipping_lines && serverOrder.shipping_lines.length > 0) {
            localOrder.shipping_amount = serverOrder.shipping_lines[0].total;
            localOrder.shipment_method = serverOrder.shipping_lines[0].method_id;
        }

        if (serverOrder.customer) {
            localOrder.customer_id = serverOrder.customer.id;

            localOrder.email = serverOrder.customer.email;
            localOrder.firstname = serverOrder.customer.first_name;
            localOrder.middlename = ' ';
            localOrder.lastname = serverOrder.customer.last_name;
            localOrder.group_id = serverOrder.customer.customer_group_id;
            localOrder.prefix = '';
            localOrder.suffix = '';
            localOrder.dob = '';

            localOrder.customer_firstname = localOrder.firstname;
            localOrder.customer_middlename = localOrder.middlename;
            localOrder.customer_lastname = localOrder.lastname;
        }

        if (serverOrder.shipping_address) {
            localOrder.shippingAddress.address_id = 0;
            localOrder.shippingAddress.city = serverOrder.shipping_address.city;
            localOrder.shippingAddress.country_id = serverOrder.shipping_address.country;
            localOrder.shippingAddress.firstname = serverOrder.shipping_address.first_name;
            localOrder.shippingAddress.lastname = serverOrder.shipping_address.last_name;
            localOrder.shippingAddress.postcode = serverOrder.shipping_address.postcode;
            localOrder.shippingAddress.region = serverOrder.shipping_address.state;
            localOrder.shippingAddress.region_id = serverOrder.shipping_address.state;
            localOrder.shippingAddress.street = serverOrder.shipping_address.address_1 + ' ' + serverOrder.shipping_address.address_2;
            localOrder.shippingAddress.telephone = "";
            // TODO: handle flag conditionally
            localOrder.shippingAddress.is_default_billing = false;
            localOrder.shippingAddress.is_default_shipping = true;
        }

        if (serverOrder.billing_address) {
            localOrder.billingAddress.address_id = 0;
            localOrder.billingAddress.city = serverOrder.billing_address.city;
            localOrder.billingAddress.country_id = serverOrder.billing_address.country;
            localOrder.billingAddress.firstname = serverOrder.billing_address.first_name;
            localOrder.billingAddress.lastname = serverOrder.billing_address.last_name;
            localOrder.billingAddress.postcode = serverOrder.billing_address.postcode;
            localOrder.billingAddress.region = serverOrder.billing_address.state;
            localOrder.billingAddress.region_id = serverOrder.billing_address.state;
            localOrder.billingAddress.street = serverOrder.billing_address.address_1 + ' ' + serverOrder.billing_address.address_2;
            localOrder.billingAddress.telephone = serverOrder.billing_address.phone;
            localOrder.billingAddress.is_default_billing = true;
            localOrder.billingAddress.is_default_shipping = false;
        }

        if (serverOrder.line_items && serverOrder.line_items.length > 0) {

            for (var i = 0; i < serverOrder.line_items.length; i++) {
                var serverLineItem = serverOrder.line_items[i];
                localOrder.products.push(parseSingleProductResponse(serverLineItem));
            }

        }

        return localOrder;
    }

    /**
     * Parses Sales Order Response
     * @param serverResponse
     * @returns {Array}
     */
    function parseSalesOrderResponse(serverResponse) {
        var finalResult = [];

        try {
            if (!!serverResponse && serverResponse.length > 0) {
                for (var i = 0; i < serverResponse.length; i++) {
                    var serverOrder = serverResponse[i];

                    Utility.logDebug('serverOrder = ', JSON.stringify(serverOrder));

                    var localOrder = parseSingleSalesOrderResponse(serverOrder);

                    Utility.logDebug('localOrder = ', JSON.stringify(localOrder));
                    finalResult.push(localOrder);
                }
            }
        } catch (e) {
            Utility.logException('Error during parseSalesOrderResponse', e);
        }

        Utility.logDebug('finalResult of parseSalesOrderResponse = ', JSON.stringify(finalResult));
        return finalResult;
    }

    /**
     * Parses Single Product Response
     * @param serverProduct
     * @returns {*|{increment_id, shipping_amount, shipment_method, quantity}}
     */
    function parseSingleProductResponse(serverProduct) {
        var localProduct = ConnectorModels.productModel();

        localProduct.increment_id = serverProduct.id;
        localProduct.shipping_amount = serverProduct.price;
        localProduct.shipment_method = serverProduct.shipment_method;
        localProduct.product_id = serverProduct.sku;
        localProduct.qty_ordered = serverProduct.quantity;
        localProduct.fulfillment_service = serverProduct.fulfillment_service;
        localProduct.fulfillment_status = serverProduct.fulfillment_status;
        localProduct.gift_card = serverProduct.gift_card;
        localProduct.grams = serverProduct.grams;
        localProduct.id = serverProduct.id;
        localProduct.price = serverProduct.price;
        localProduct.requires_shipping = serverProduct.requires_shipping;
        localProduct.sku = serverProduct.sku;
        localProduct.taxable = serverProduct.taxable;
        localProduct.title = serverProduct.title;
        localProduct.variant_id = serverProduct.variant_id;
        localProduct.variant_title = serverProduct.variant_title;
        localProduct.vendor = serverProduct.vendor;
        localProduct.name = serverProduct.name;
        localProduct.variant_inventory_management = serverProduct.variant_inventory_management;
        localProduct.properties = serverProduct.properties;
        localProduct.product_exists = serverProduct.product_exists;
        localProduct.fulfillable_quantity = serverProduct.fulfillable_quantity;
        localProduct.total_discount = serverProduct.total_discount;
        localProduct.tax_lines = serverProduct.tax_lines;
        localProduct.item_id = "";

        return localProduct;
    }

    /**
     * Parses Product Response
     * @param serverResponse
     * @returns {Array}
     */
    function parseProductResponse(serverResponse) {
        var finalResult = [];
        try {
            if (!!serverResponse && serverResponse.length > 0) {
                for (var i = 0; i < serverResponse.length; i++) {
                    var serverProduct = serverResponse[i];

                    var localProduct = parseSingleProductResponse(serverProduct);

                    finalResult.push(localProduct);
                }
            }
        } catch (e) {
            Utility.logException('Error during parseProductResponse', e);
        }

        return finalResult;
    }

    function parseFulfillmentResponse(serverResponse) {
        var finalResult = {
            isOrderStatusCompleted: false
        };
        try {
            if (serverResponse.hasOwnProperty("status") && serverResponse.status.toString() === "completed") {
                finalResult.isOrderStatusCompleted = true;
                finalResult.orderNumber = serverResponse.order_number;
            }
        } catch (e) {
            Utility.logException('Error during parseFulfillmentResponse', e);
        }

        return finalResult;
    }

    function parseSingleCustomerAddressResponse(serverAddress) {

        var localAddress = ConnectorModels.addressModel();

        localAddress.address_id = serverAddress.id;
        localAddress.city = serverAddress.city;
        localAddress.country_id = serverAddress.country_code;
        localAddress.firstname = serverAddress.first_name;
        localAddress.lastname = serverAddress.last_name;
        localAddress.postcode = serverAddress.zip;
        localAddress.region = serverAddress.province;
        localAddress.region_id = serverAddress.province;
        localAddress.street = serverAddress.address1;
        localAddress.telephone = serverAddress.phone;

        localAddress.is_default_billing = false;
        localAddress.is_default_shipping = false;

        if (!!serverAddress.default && (serverAddress.default === true ||
            serverAddress.default === 'true')) {
            localAddress.is_default_billing = true;
            localAddress.is_default_shipping = true;
        }

        return localAddress;
    }

    /**
     * Parses Customer Address Response
     * @param serverResponse
     * @returns {Array}
     */
    function parseCustomerAddressResponse(serverResponse) {
        var finalResult = [];

        try {
            if (!!serverResponse && serverResponse.length > 0) {
                Utility.logDebug('server Customer = ', JSON.stringify(serverResponse));
                var localAddress = parseSingleCustomerAddressResponse(serverResponse.billing_address);
                finalResult.push(localAddress);
                localAddress = parseSingleCustomerAddressResponse(serverResponse.shipping_address);
                finalResult.push(localAddress);

            }
        } catch (e) {
            Utility.logException('Error during parseCustomerAddressResponse', e);
        }

        Utility.logDebug('finalResult of parseCustomerAddressResponse = ', JSON.stringify(finalResult));
        return finalResult;
    }

    /**
     * Parses Customer Response
     * @param serverResponse
     */
    function parseCustomerResponse(serverResponse) {
        var data = {};

        data.id = serverResponse.id;
        data.email = serverResponse.email;
        data.first_name = serverResponse.firstname;
        data.last_name = serverResponse.lastname;
        data.username = serverResponse.username;
        data.billing_address = serverResponse.billing_address;
        data.shipping_address = serverResponse.shipping_address;

        return data;
    }

    /**
     * Make a billing address object
     * @param address
     * @returns {object}
     */
    function getBillingAddress(address) {
        var data = WOOModels.billingAddress();

        data.first_name = address.firstname || "";
        data.last_name = address.lastname || "";
        data.company = address.company || "";
        data.address_1 = address.street1 || "";
        data.address_2 = address.street2 || "";
        data.city = address.city || "";
        data.state = address.region || "";
        data.postcode = address.postcode || "";
        data.country = address.country || "";
        data.email = "";
        data.phone = address.telephone || "";

        return data;
    }

    /**
     * Make a shipping address object
     * @param address
     * @returns {object}
     */
    function getShippingAddress(address) {
        var data = WOOModels.shippingAddress();

        data.first_name = address.firstname || "";
        data.last_name = address.lastname || "";
        data.company = address.company || "";
        data.address_1 = address.street1 || "";
        data.address_2 = address.street2 || "";
        data.city = address.city || "";
        data.state = address.region || "";
        data.postcode = address.postcode || "";
        data.country = address.country || "";

        return data;
    }

    /**
     * Make the default address objects for billing and shipping if found else return blank objects
     * @param customerRecord
     * @returns {{shippingAddress: (*|{}), billingAddress: (*|{})}}
     */
    function getDefaultAddresses(customerRecord) {
        var addresses = customerRecord.addresses;

        var billingAddress = null;
        var shippingAddress = null;

        for (var i in addresses) {
            var address = addresses[i];

            var defaultshipping = address.defaultshipping;
            var defaultbilling = address.defaultbilling;

            if (shippingAddress === null && defaultshipping.toString() === "T") {
                shippingAddress = getShippingAddress(address);
            }

            if (billingAddress === null && defaultbilling.toString() === "T") {
                billingAddress = getBillingAddress(address);
            }

            if (!!billingAddress && !!shippingAddress) {
                break;
            }
        }

        return {
            shippingAddress: shippingAddress || {},
            billingAddress: billingAddress || {}
        };
    }

    /**
     * This method returns customer object data required to upsert the customer to WOO
     * @param customerRecord
     * @param type
     * @returns {object}
     */
    function getCustomerData(customerRecord, type) {
        var data = {};
        data.customer = WOOModels.customer();

        data.customer.email = customerRecord.email;
        data.customer.first_name = customerRecord.firstname;
        data.customer.last_name = customerRecord.lastname;

        if (type.toString() === "create") {
            data.customer.password = customerRecord.password || "";
        } else {
            delete data.customer.username;
        }

        var defaultAddresses = getDefaultAddresses(customerRecord);

        data.customer.billing_address = defaultAddresses.shippingAddress;
        data.customer.shipping_address = defaultAddresses.billingAddress;

        return data;
    }

    /**
     * This method returns an array of line item for sales order
     * @param orderRecord
     * @returns {Array}
     */
    function getSalesOrderLineItems(orderRecord) {
        var lineItems = [];

        var items = orderRecord.items;
        for (var i in items) {
            var item = items[i];

            var itemObj = {};
            // TODO: change sku with product_id if not work
            //itemObj.product_id = 8
            itemObj.sku = item.sku;
            itemObj.quantity = item.quantity;

            lineItems.push(itemObj);
        }

        return lineItems;
    }

    /**
     * This method returns an object of billing address for sales order
     * @param orderRecord
     * @returns {*|{first_name, last_name, company, address_1, address_2, city, state, postcode, country, email, phone}}
     */
    function getSalesOrderBillingAddress(orderRecord) {
        var billingAddress = WOOModels.billingAddress();
        var addresses = orderRecord.customer.addresses;

        for (var i in addresses) {
            var address = addresses[i];
            if (address.isDefaultBilling.toString() === "1") {
                billingAddress.first_name = address.firstName || "";
                billingAddress.last_name = address.lastName || "";
                billingAddress.company = address.company || "";
                billingAddress.address_1 = address.street || "";
                billingAddress.address_2 = "";
                billingAddress.city = address.city || "";
                billingAddress.state = address.stateId || "";
                billingAddress.postcode = address.zipCode || "";
                billingAddress.country = address.country || "";
                billingAddress.email = "";
                billingAddress.phone = address.telephone || "";
            }
        }

        return billingAddress;
    }

    /**
     * * This method returns an object of shipping address for sales order
     * @param orderRecord
     * @returns {*|{first_name, last_name, company, address_1, address_2, city, state, postcode, country}}
     */
    function getSalesOrderShippingAddress(orderRecord) {
        var shippingAddress = WOOModels.shippingAddress();
        var addresses = orderRecord.customer.addresses;

        for (var i in addresses) {
            var address = addresses[i];
            if (address.isDefaultShipping.toString() === "1") {
                shippingAddress.first_name = address.firstName || "";
                shippingAddress.last_name = address.lastName || "";
                shippingAddress.company = address.company || "";
                shippingAddress.address_1 = address.street || "";
                shippingAddress.address_2 = "";
                shippingAddress.city = address.city || "";
                shippingAddress.state = address.stateId || "";
                shippingAddress.postcode = address.zipCode || "";
                shippingAddress.country = address.country || "";
            }
        }

        return shippingAddress;
    }

    /**
     * This method returns an array of shipping lines for sales order
     * @param orderRecord
     * @returns {Array}
     */
    function getSalesOrderShippingLines(orderRecord) {
        var shippingLines = [];
        var shippingInfo = orderRecord.shipmentInfo;

        shippingLines.push({
            method_id: "flat_rate",
            method_title: "Flat Rate",
            total: shippingInfo.shipmentCost
        });

        return shippingLines;
    }

    /**
     * This method returns an object of payment details for sales order
     * @param orderRecord
     * @returns {{}}
     */
    function getSalesOrderPaymentDetails(orderRecord) {
        var paymentDetail = {};
        var paymentInfo = paymentDetail.paymentInfo;

        // TODO: need to be dynamic
        paymentDetail.method_id = "bacs";
        paymentDetail.method_title = "Direct Bank Transfer";
        paymentDetail.paid = true;

        return paymentDetail;
    }

    /**
     * This method returns an object of sales order data required to create sales order to WOO
     * @param orderRecord
     * @returns {object}
     */
    function getSalesOrderData(orderRecord) {
        var data = {};
        data.order = WOOModels.salesOrder();

        // set customer
        data.order.customer_id = orderRecord.customer.customerId;

        // set products in main object
        data.order.line_items = getSalesOrderLineItems(orderRecord);

        // set billing address
        data.order.billing_address = getSalesOrderBillingAddress(orderRecord);

        // set set shipping address
        data.order.shipping_address = getSalesOrderShippingAddress(orderRecord);

        // set shipping lines
        data.order.shipping_lines = getSalesOrderShippingLines(orderRecord);

        // set payment details
        data.order.payment_details = getSalesOrderPaymentDetails(orderRecord);

        return data;
    }

    function getDiscountType(discountType) {
        var type = null;
        if (discountType.toString() === "percent") {
            type = "percent";
        } else {
            type = "fixed_cart";
        }
    }

    function getSingleCouponData(promoCodeRecord) {
        var couponData = WOOModels.coupon();

        if (promoCodeRecord.hasOwnProperty("record_id") && !!promoCodeRecord.record_id) {
            couponData.id = promoCodeRecord.record_id;
        }
        couponData.code = promoCodeRecord.couponCode.toLowerCase();
        couponData.type = getDiscountType(promoCodeRecord.discountType);
        couponData.amount = promoCodeRecord.rate.replace("%", ""); //remove % from value if exist
        couponData.individual_use = promoCodeRecord.numberOfUses.toString() === "MULTIPLEUSES" ? true : false;
        couponData.expiry_date = !!promoCodeRecord.endDate ? nlapiStringToDate(promoCodeRecord.endDate).toISOString() : "";
        couponData.description = promoCodeRecord.description;

        return couponData;
    }

    function getCouponsData(promoCodeRecord) {
        var couponsData = {};

        couponsData.coupons = [];
        couponsData.coupons.push(getSingleCouponData(promoCodeRecord));

        return couponsData;
    }


    function parseCouponsResponse(coupons) {
        var couponsList = [];

        for (var i in coupons) {
            var coupon = coupons[i];
            couponsList.push(parseSingleCouponResponse(coupon));
        }

        return couponsList;
    }

    function parseSingleCouponResponse(coupon) {
        var couponObj = WOOModels.coupon();

        couponObj.id = coupon.id.toString();
        couponObj.code = coupon.code;
        couponObj.type = coupon.type;
        couponObj.created_at = coupon.created_at;
        couponObj.updated_at = coupon.updated_at;
        couponObj.amount = coupon.amount;
        couponObj.individual_use = coupon.individual_use;
        couponObj.product_ids = coupon.product_ids;
        couponObj.exclude_product_ids = coupon.exclude_product_ids;
        couponObj.usage_limit = coupon.usage_limit;
        couponObj.usage_limit_per_user = coupon.usage_limit_per_user;
        couponObj.limit_usage_to_x_items = coupon.limit_usage_to_x_items;
        couponObj.usage_count = coupon.usage_count;
        couponObj.expiry_date = coupon.expiry_date;
        couponObj.enable_free_shipping = coupon.enable_free_shipping;
        couponObj.product_category_ids = coupon.product_category_ids;
        couponObj.exclude_product_category_ids = coupon.exclude_product_category_ids;
        couponObj.exclude_sale_items = coupon.exclude_sale_items;
        couponObj.minimum_amount = coupon.minimum_amount;
        couponObj.maximum_amount = coupon.maximum_amount;
        couponObj.customer_emails = coupon.customer_emails;
        couponObj.description = coupon.description;

        return couponObj;
    }

    /**
     * Sends request to server
     * @param httpRequestData
     */
    function sendRequest(httpRequestData) {

        var finalUrl = WooWrapper.ServerUrl + httpRequestData.url;

        httpRequestData.url = finalUrl;

        Utility.logDebug('Request final = ', finalUrl);

        var oauth = OAuth({
            consumer: {
                public: WooWrapper.UserName,
                secret: WooWrapper.Password
            },
            last_ampersand: true,
            signature_method: 'HMAC-SHA256'
        });

        var finalInfo = oauth.authorize(httpRequestData, null);

        Utility.logDebug('finalInfo = ', JSON.stringify(finalInfo));

        var signedUrl = oauth.generateQueryParam(finalInfo);

        finalUrl = httpRequestData.url + '?' + signedUrl;

        var res = null;

        if (!httpRequestData.headers) {
            httpRequestData.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            };
        }

        Utility.logDebug('Request headers = ', JSON.stringify(httpRequestData.headers));
        Utility.logDebug('httpRequestData = ', JSON.stringify(httpRequestData));

        var body = '';
        var serverResponse = null;

        if (httpRequestData.method === 'GET') {
            if (typeof nlapiRequestURL !== "undefined") {
                Utility.logDebug("httpRequestData.method === GET", "");
                res = nlapiRequestURL(finalUrl, null, httpRequestData.headers);
                body = res.getBody();
                Utility.logDebug("res", res.getBody());
                Utility.logDebug("code", res.getCode());
                serverResponse = eval('(' + body + ')');
            } else {
                jQuery.ajax({
                    url: finalUrl,
                    async: false
                }).done(function (result) {
                    res = result;
                    serverResponse = res;
                });
            }

        } else {
            var postDataString =
                typeof httpRequestData.postData === "object" ?
                    JSON.stringify(httpRequestData.postData) : httpRequestData.postData;

            if (typeof nlapiRequestURL !== "undefined") {
                Utility.logDebug("httpRequestData.method !== GET", "");
                res = nlapiRequestURL(finalUrl, postDataString, httpRequestData.headers, httpRequestData.method);
                Utility.logDebug("res", res.getBody());
                Utility.logDebug("code", res.getCode());
                body = res.getBody();
                serverResponse = eval('(' + body + ')');
            } else {
                jQuery.ajax({
                    url: finalUrl,
                    method: httpRequestData.method,
                    async: false,
                    dataType: 'json',
                    contentType: 'application/json',
                    data: postDataString
                }).done(function (result) {
                    res = result;
                    serverResponse = res;
                });
            }

        }

        return serverResponse;
    }

    //endregion

    //region Public Methods

    return {

        /**
         * Init method
         */
        initialize: function (storeInfo) {
            if (!!storeInfo) {
                WooWrapper.ServerUrl = storeInfo.endpoint;
            } else if (!!ConnectorConstants && !!ConnectorConstants.CurrentStore) {
                WooWrapper.ServerUrl = ConnectorConstants.CurrentStore.endpoint;
            }
        },

        UserName: '',
        Password: '',
        AuthHeader: '',

        ServerUrl: 'http://nsmg.folio3.com:4545/woosite2/wc-api/v3/',

        /**
         * Gets supported Date Format
         * @returns {string}
         */
        getDateFormat: function () {
            return 'ISO';
        },

        getSessionIDFromServer: function (userName, apiKey) {
            var sessionID = 'DUMMY_SESSION_ID';

            WooWrapper.UserName = userName;
            WooWrapper.Password = apiKey;

            return sessionID;
        },

        /**
         * Gets Sales Order from Server
         * @param order
         * @param sessionID
         * @returns {*}
         */
        getSalesOrders: function (order, sessionID) {

            var httpRequestData = {
                url: 'orders',
                method: 'GET',
                data: {
                    created_at_min: order.updateDate
                }
            };

            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                orders: []
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

                if (!!serverResponse && serverResponse.orders) {
                    serverFinalResponse.orders = parseSalesOrderResponse(serverResponse.orders);
                } else {
                    Utility.logDebug('Error in order response', JSON.stringify(serverResponse));
                }

            } catch (e) {
                serverFinalResponse.faultCode = 'SERVER_ERROR';
                serverFinalResponse.faultString = e.toString();

                Utility.logException('Error during getSalesOrders', e);
            }

            // If some problem
            if (!serverFinalResponse.status) {
                var result = {
                    status: false
                };
                result.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
                return result;
            }

            return serverFinalResponse;
        },

        /**
         * Gets Sales Order information for individual order
         * @param increment_id
         * @param sessionID
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        getSalesOrderInfo: function (increment_id, sessionID) {

            var httpRequestData = {
                url: 'orders',
                method: 'GET',
                data: {
                    ids: increment_id
                }
            };
            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: ''
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during getSalesOrders', e);
            }

            if (!!serverResponse && serverResponse.orders) {
                var orders = parseSalesOrderResponse(serverResponse.orders);

                if (!!orders && orders.length > 0) {
                    serverFinalResponse.customer_id = orders[0].customer_id;
                    serverFinalResponse.shippingAddress = orders[0].shippingAddress;
                    serverFinalResponse.billingAddress = orders[0].billingAddress;
                    serverFinalResponse.payment = orders[0].payment;
                    serverFinalResponse.products = orders[0].products;
                }
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        /**
         * Updates item to server
         * @param product
         * @param sessionID
         * @param magID
         * @param isParent
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        updateItem: function (product, sessionID, magID, isParent) {

            // first get the product id here
            /*var productInfo = WooWrapper.getProduct(sessionID, product, '&fields=variants');
             var firstProduct = productInfo[0];
             var httpRequestData = {
             additionalUrl: 'products/' + magID + '.json',
             method: 'PUT',
             postData: {
             product: {
             id: magID,
             variants: [{
             id: firstProduct.variants[0].id,
             price: product.price,
             inventory_quantity: product.quantity,
             product_id: magID
             }
             ]
             }
             }
             };*/
            var httpRequestData = {
                url: 'products/' + magID.toString(),
                method: 'PUT',
                postData: {
                    product: {
                        regular_price: product.price,
                        sale_price: 0,
                        stock_quantity: product.quantity
                    }
                }
            };

            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                product: {}
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during updateItem', e);
            }

            if (!!serverResponse && serverResponse.product) {
                serverFinalResponse.product = parseSingleProductResponse(serverResponse.product);
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        /**
         * Gets Product from the server
         * @param sessionID
         * @param product
         * @param variantRequest
         * @returns {*}
         */
        getProduct: function (sessionID, product, variantRequest) {

            var httpRequestData = {
                url: 'products',
                method: 'GET',
                data: {
                    "filter[sku]": product.magentoSKU
                }
            };

            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                product: {}
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during getProduct', e);
            }

            if (!!serverResponse && serverResponse.hasOwnProperty("products") && serverResponse.products.length > 0) {
                serverFinalResponse.product = parseSingleProductResponse(serverResponse.products[0]);
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        /**
         * This method should create a shippment on WOO Commerce but
         * there is no shipment record on WOO Commerce. So,
         * change order status to Complete as an alternate & will be
         * assumed as shipped order in WOO
         * @param sessionID
         * @param serverItemIds
         * @param serverSOId
         * @return {{status: boolean, faultCode: string, faultString: string, result: Array}}
         *
         * Note: There is no shipment record in WOO, so no partial fulfillment is supported
         */
        createFulfillment: function (sessionID, serverItemIds, serverSOId) {

            var httpRequestData = {
                url: 'orders/' + serverSOId,
                method: 'PUT',
                postData: {
                    "order": {
                        "status": "completed"
                    }
                }
            };

            /*for (var i = 0; i < serverItemIds.length; i++) {
             var serverItem = serverItemIds[i];
             httpRequestData.postData.fulfillment.line_items.push(serverItem);
             }*/

            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                result: []
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during createFulfillment', e);
            }

            if (!!serverResponse && serverResponse.order) {
                var fulfillmentObj = parseFulfillmentResponse(serverResponse.order);

                // check if order status is changed to complete
                if (!!fulfillmentObj && fulfillmentObj.isOrderStatusCompleted) {
                    // for setting order id as shipment id in item fulfillment
                    serverFinalResponse.result = fulfillmentObj.orderNumber;
                }
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        createTracking: function (result, carrier, carrierText, tracking, sessionID, serverSOId) {
            var noteTemplate = "Carrier: <CARRIER> \nTitle: <TITLE> \nTracking Number: <TRACKING_NUMBER>";

            var note = noteTemplate.replace("<CARRIER>", carrier || "");
            note = note.replace("<TITLE>", carrierText || "");
            note = note.replace("<TRACKING_NUMBER>", tracking || "");

            var httpRequestData = {
                url: 'orders/' + serverSOId + '/notes',
                method: 'POST',
                postData: {
                    "order_note": {
                        "note": note,
                        "customer_note": false
                    }
                }
            };

            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                result: []
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during createFulfillment', e);
            }

            if (!!serverResponse && serverResponse.order_note) {
                serverFinalResponse.result.push(serverResponse.order_note);
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        getCustomerAddress: function (customer_id, sessionID) {

            var httpRequestData = {
                url: 'customers/' + customer_id,
                method: 'GET',
                data: {
                    //id: customer_id
                }
            };

            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                addresses: []
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during getCustomerAddress', e);
            }

            if (!!serverResponse && serverResponse.customer) {
                serverFinalResponse.addresses = parseCustomerAddressResponse(serverResponse.customer);
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        /**
         * This method create a sales order to WOO
         * @param internalId
         * @param orderRecord
         * @param store
         * @param sessionId
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        createSalesOrder: function (internalId, orderRecord, store, sessionId) {
            var httpRequestData = {
                url: 'orders',
                method: 'POST',
                postData: getSalesOrderData(orderRecord)
            };
            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: ''
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during createSalesOrder', e);
            }

            if (!!serverResponse && serverResponse.order) {
                var order = serverResponse.order;

                if (!!order) {
                    serverFinalResponse.incrementalIdData = {};
                    serverFinalResponse.incrementalIdData.orderIncrementId = order.order_number.toString();
                }
                // No need to set Line Items Ids here
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        /**
         * This method returns a flag which means that item ids in order's items is needed to be set
         * @returns {boolean}
         */
        hasDifferentLineItemIds: function () {
            return false;
        },

        /**
         * This method create or update a customer to WOO
         * @param customerRecord
         * @param store
         * @param type
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        upsertCustomer: function (customerRecord, store, type) {
            // handling of endpoints for update or create customer
            var httpRequestData = {
                url: 'customers' + (type.toString() === "update" ? "/" + customerRecord.magentoId : ""),
                method: 'POST',
                postData: getCustomerData(customerRecord, type)
            };
            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: ''
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during upsertCustomer - ' + type, e);
            }

            if (!!serverResponse && serverResponse.customer) {
                var customer = parseCustomerResponse(serverResponse.customer);

                Utility.logDebug("upsertCustomer.customer - parseCustomerResponse", JSON.stringify(customer));

                if (!!customer) {
                    serverFinalResponse.result = customer;
                    serverFinalResponse.magentoCustomerId = customer.id;
                }
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },
        /**
         * This method returns a flag which means that separate address call is neeeded to sync customer addresses
         * @returns {boolean}
         */
        requiresAddressCall: function () {
            return false;
        },
        /**
         * This method has no implementation because no separate address call is neeeded to sync customer addresses
         */
        upsertCustomerAddress: function () {
            // no need to implement this function for WOO
            // address will be with in the customer create/update call
        },
        /**
         * This method create or update a multiple coupons to WOO
         * @return {{status: boolean, faultCode: string, faultString: string}}
         */
        upsertCoupons: function (promoCodeRecord) {
            ConnectorConstants.CurrentWrapper.getSessionIDFromServer(ConnectorConstants.CurrentStore.userName, ConnectorConstants.CurrentStore.password);
            var httpRequestData = {
                url: 'coupons/bulk',
                method: 'POST',
                postData: getCouponsData(promoCodeRecord)
            };
            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: ''
            };

            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;
            } catch (e) {
                Utility.logException('Error during upsertCustomer', e);
            }

            if(!!serverResponse.coupons[0].error) {
                serverFinalResponse.status = false;
            }

            if (!!serverResponse && serverFinalResponse.status && !!serverResponse.coupons) {
                var coupons = parseCouponsResponse(serverResponse.coupons);
                Utility.logDebug("upsertCustomer.upsertCoupons - upsertCoupons", JSON.stringify(coupons));
                serverFinalResponse.result = coupons;
                serverFinalResponse.data = coupons;
                serverFinalResponse.data.couponCodeList = [];
                serverFinalResponse.data.record_id = coupons[0].id;
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.message = serverResponse.coupons[0].error.code + '--' + serverResponse.coupons[0].error.message;
            }

            return serverFinalResponse;
        }
    };

    //endregion

})();