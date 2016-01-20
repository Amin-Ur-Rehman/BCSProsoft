/**
 * Created by Ubaid Baig on 2.7.15
 *
 * Class Name: EbayWrapper
 *
 * Description:
 * - This script is responsible for handling Shopfiy API
 * -
 * Referenced By:
 * -
 * -
 * Dependency:
 *   -
 *   -
 */

/**
 * This is a Wrapper Class for Ebay API
 */
EbayWrapper = (function () {

    var storeConfiguration = null;
    var BUYER_CHECKOUT_MESSAGE;
    var auctionDataCollection  = {};

    //region Private Methods

    /**
     * Parses Single Sales Order Response from listing
     * @param serverOrder
     * @returns {*|{customer_id, increment_id, shippingAddress, billingAddress, payment}}
     */

    function parseSingleSalesOrderResponse(serverOrder) {

        var localOrder = ConnectorModels.salesOrderModel();

        localOrder.increment_id = serverOrder.id;

        if (serverOrder.shipping_lines && serverOrder.shipping_lines.length > 0) {
            localOrder.shipping_amount = serverOrder.shipping_lines[0].price;
            localOrder.shipment_method = serverOrder.shipping_lines[0].code;
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
            localOrder.shippingAddress.country_id = serverOrder.shipping_address.country_code;
            localOrder.shippingAddress.firstname = serverOrder.shipping_address.first_name;
            localOrder.shippingAddress.lastname = serverOrder.shipping_address.last_name;
            localOrder.shippingAddress.postcode = serverOrder.shipping_address.zip;
            localOrder.shippingAddress.region = serverOrder.shipping_address.province;// province_code
            localOrder.shippingAddress.region_id = serverOrder.shipping_address.province;// province_code
            localOrder.shippingAddress.street = serverOrder.shipping_address.address1;
            localOrder.shippingAddress.telephone = serverOrder.shipping_address.phone;
            localOrder.shippingAddress.is_default_billing = false;
            localOrder.shippingAddress.is_default_shipping = true;
        }

        if (serverOrder.billing_address) {
            localOrder.billingAddress.address_id = 0;
            localOrder.billingAddress.city = serverOrder.billing_address.city;
            localOrder.billingAddress.country_id = serverOrder.billing_address.country_code;
            localOrder.billingAddress.firstname = serverOrder.billing_address.first_name;
            localOrder.billingAddress.lastname = serverOrder.billing_address.last_name;
            localOrder.billingAddress.postcode = serverOrder.billing_address.zip;
            localOrder.billingAddress.region = serverOrder.billing_address.province;// province_code
            localOrder.billingAddress.region_id = serverOrder.billing_address.province;// province_code
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
     * Parse single sales order details response
     * @param serverOrder
     * @returns {*}
     */
    function parseSingleSalesOrderDetailsResponse(serverOrder) {

        var localOrder = ConnectorModels.salesOrderModel();
        var address1;
        var address2;
        localOrder.increment_id = serverOrder.id.toString();
        // hack for SO list logic changes
        localOrder.customer = {};
        localOrder.customer.increment_id = serverOrder.id.toString();

        if (serverOrder.shipping_lines && serverOrder.shipping_lines.length > 0) {
            localOrder.shipping_amount = serverOrder.shipping_lines[0].price;
            localOrder.shipment_method = serverOrder.shipping_lines[0].source + '_' + serverOrder.shipping_lines[0].code;
            // hack for SO list logic changes
            localOrder.customer.shipping_amount = localOrder.shipping_amount;
            localOrder.customer.shipment_method = localOrder.shipment_method;
            localOrder.customer.shipping_description = '';
        } else {
            localOrder.shipping_amount = 0;
            localOrder.shipment_method = '';
            // hack for SO list logic changes
            localOrder.customer.shipping_amount = 0;
            localOrder.customer.shipment_method = '';
            localOrder.customer.shipping_description = '';
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
            // hack for SO list logic changes
            localOrder.customer.customer_id = serverOrder.customer.id;
            localOrder.customer.email = serverOrder.customer.email;
            localOrder.customer.firstname = serverOrder.customer.first_name;
            localOrder.customer.middlename = ' ';
            localOrder.customer.lastname = serverOrder.customer.last_name;
            localOrder.customer.group_id = serverOrder.customer.customer_group_id;
            localOrder.customer.prefix = '';
            localOrder.customer.suffix = '';
            localOrder.customer.dob = '';
            localOrder.customer.customer_firstname = localOrder.customer.firstname;
            localOrder.customer.customer_middlename = localOrder.customer.middlename;
            localOrder.customer.customer_lastname = localOrder.customer.lastname;

            // Remaining properties, needed by change in magento order listing call
            /*
             That call bring only order increment ids now, all the other properties are fetched from
             order detail call now
             */
            localOrder.customer.order_id = serverOrder.order_number.toString();
            localOrder.customer.created_at = serverOrder.created_at.toString();
            localOrder.customer.grandtotal = serverOrder.total_price.toString();
            localOrder.customer.store_id = '';
            localOrder.customer.discount_amount = serverOrder.total_discounts.toString();
        }

        if (serverOrder.shipping_address) {
            localOrder.shippingAddress.address_id = 0;
            localOrder.shippingAddress.city = serverOrder.shipping_address.city;
            localOrder.shippingAddress.country_id = serverOrder.shipping_address.country_code;
            localOrder.shippingAddress.firstname = serverOrder.shipping_address.first_name;
            localOrder.shippingAddress.lastname = serverOrder.shipping_address.last_name;
            localOrder.shippingAddress.postcode = serverOrder.shipping_address.zip;
            localOrder.shippingAddress.region = serverOrder.shipping_address.province;// province_code
            localOrder.shippingAddress.region_id = serverOrder.shipping_address.province;// province_code
            address1 = !!serverOrder.shipping_address.address1 ? serverOrder.shipping_address.address1 : "";
            address2 = !!serverOrder.shipping_address.address2 ? serverOrder.shipping_address.address2 : "";
            localOrder.shippingAddress.street = (address1 + " " + address2).trim();
            localOrder.shippingAddress.telephone = serverOrder.shipping_address.phone;
            localOrder.shippingAddress.is_default_billing = false;
            localOrder.shippingAddress.is_default_shipping = true;
        }

        if (serverOrder.billing_address) {
            localOrder.billingAddress.address_id = 0;
            localOrder.billingAddress.city = serverOrder.billing_address.city;
            localOrder.billingAddress.country_id = serverOrder.billing_address.country_code;
            localOrder.billingAddress.firstname = serverOrder.billing_address.first_name;
            localOrder.billingAddress.lastname = serverOrder.billing_address.last_name;
            localOrder.billingAddress.postcode = serverOrder.billing_address.zip;
            localOrder.billingAddress.region = serverOrder.billing_address.province;// province_code
            localOrder.billingAddress.region_id = serverOrder.billing_address.province;// province_code
            address1 = !!serverOrder.billing_address.address1 ? serverOrder.billing_address.address1 : "";
            address2 = !!serverOrder.billing_address.address2 ? serverOrder.billing_address.address2 : "";
            localOrder.billingAddress.street = (address1 + " " + address2).trim();
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
        Utility.logDebug('going to set gateway', serverOrder.gateway);
        if (!!serverOrder.gateway) {
            localOrder.payment.method = serverOrder.gateway;
        } else {
            localOrder.payment.method = '';
        }
        Utility.logDebug('going to set financial_status', serverOrder.financial_status);
        if (!!serverOrder.financial_status) {
            localOrder.payment.financial_status = serverOrder.financial_status;
        } else {
            localOrder.payment.financial_status = '';
        }

        if (serverOrder.payment_details) {
            // @zee: No need to do this
            //localOrder.payment.method = serverOrder.payment_details.method_id;
            localOrder.payment.methodTitle = serverOrder.payment_details.method_title;
            localOrder.payment.paid = serverOrder.payment_details.paid;

            localOrder.payment.parentId = '';
            localOrder.payment.amountOrdered = '';
            localOrder.payment.shippingAmount = '';
            localOrder.payment.baseAmountOrdered = '';


            localOrder.payment.ccType = serverOrder.payment_details.credit_card_company;
            localOrder.payment.ccLast4 = serverOrder.payment_details.credit_card_number;
            localOrder.payment.ccExpMonth = '';
            localOrder.payment.ccExpYear = '';
            localOrder.payment.paymentId = '';
        }

        return localOrder;
    }

    /**
     * Parses Sales Order Response
     * @param serverResponse
     * @param isOrderDetailsResponse
     * @returns {Array}
     */
    function parseSalesOrderResponse(serverResponse, isOrderDetailsResponse) {
        var finalResult = [];

        try {
            if (!!serverResponse && serverResponse.length > 0) {
                for (var i = 0; i < serverResponse.length; i++) {
                    var serverOrder = serverResponse[i];

                    Utility.logDebug('serverOrder = ', JSON.stringify(serverOrder));

                    var localOrder = null;
                    if (!!isOrderDetailsResponse) {
                        Utility.logDebug('log_w', 'parsing SO details server response');
                        localOrder = parseSingleSalesOrderDetailsResponse(serverOrder);
                    } else {
                        Utility.logDebug('log_w', 'parsing SO list server response');
                        localOrder = parseSingleSalesOrderResponse(serverOrder);
                    }


                    Utility.logDebug('localOrder = ', JSON.stringify(localOrder));
                    finalResult.push(localOrder);
                }
            }
        } catch (e) {
            Utility.logException('Ebay Wrapper: Error during parseSalesOrderResponse', e);
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

        localProduct.increment_id = serverProduct.id.toString();
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
        localProduct.item_id = serverProduct.id.toString();
        localProduct.variants = serverProduct.variants;

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
            if (serverResponse.hasOwnProperty("status") && serverResponse.status.toString() === "success") {
                finalResult.isOrderStatusCompleted = true;
                finalResult.id = serverResponse.id;
                finalResult.order_id = serverResponse.order_id;

                finalResult.service = serverResponse.service;

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
        localAddress.region = serverAddress.province;//province_code
        localAddress.region_id = serverAddress.province;//province_code
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
                for (var i = 0; i < serverResponse.length; i++) {
                    var serverAddress = serverResponse[i];

                    Utility.logDebug('server Address = ', JSON.stringify(serverAddress));

                    var localAddress = parseSingleCustomerAddressResponse(serverAddress);

                    Utility.logDebug('local Address = ', JSON.stringify(localAddress));
                    finalResult.push(localAddress);
                }
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
        var data = EbayModels.billingAddress();
        data.first_name = address.firstname || "";
        data.last_name = address.lastname || "";
        data.company = address.company || "";
        data.address_1 = address.street1 || "";
        data.address_2 = address.street2 || "";
        data.city = address.city || "";
        data.province = address.region || "";
        data.zip = address.postcode || "";
        data.country = address.country || "";
        data.phone = address.telephone || "";
        return data;
    }

    /**
     * Make a shipping address object
     * @param address
     * @returns {object}
     */
    function getShippingAddress(address) {
        var data = EbayModels.shippingAddress();
        data.first_name = address.firstname || "";
        data.last_name = address.lastname || "";
        data.company = address.company || "";
        data.address_1 = address.street1 || "";
        data.address_2 = address.street2 || "";
        data.city = address.city || "";
        data.province = address.region || "";
        data.zip = address.postcode || "";
        data.country = address.country || "";
        data.phone = address.telephone || "";
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
        data.customer = EbayModels.customer();
        data.customer.email = customerRecord.email;
        data.customer.first_name = customerRecord.firstname;
        data.customer.last_name = customerRecord.lastname;
        /*if (type.toString() === "create") {
         data.customer.password = customerRecord.password || "";
         } else {
         delete data.customer.username;
         }*/
        var defaultAddresses = getDefaultAddresses(customerRecord);
        data.customer.addresses.push(defaultAddresses.shippingAddress);
        data.customer.addresses.push(defaultAddresses.billingAddress);
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
            itemObj.variant_id = item.sku;
            itemObj.quantity = item.quantity;
            itemObj.price = item.price;
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
        var billingAddress = EbayModels.billingAddress();
        var addresses = orderRecord.customer.addresses;
        for (var i in addresses) {
            var address = addresses[i];
            if (address.isDefaultBilling.toString() === "1") {
                billingAddress.first_name = address.firstName || "";
                billingAddress.last_name = address.lastName || "";
                billingAddress.company = address.company || "";
                billingAddress.address1 = address.street || "";
                billingAddress.address2 = "";
                billingAddress.city = address.city || "";
                billingAddress.province_code = address.stateId || "";
                billingAddress.zip = address.zipCode || "";
                billingAddress.country_code = address.country || "";
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
        var shippingAddress = EbayModels.shippingAddress();
        var addresses = orderRecord.customer.addresses;
        for (var i in addresses) {
            var address = addresses[i];
            if (address.isDefaultShipping.toString() === "1") {
                shippingAddress.first_name = address.firstName || "";
                shippingAddress.last_name = address.lastName || "";
                shippingAddress.company = address.company || "";
                shippingAddress.address1 = address.street || "";
                shippingAddress.address2 = "";
                shippingAddress.city = address.city || "";
                shippingAddress.province_code = address.stateId || "";
                shippingAddress.zip = address.zipCode || "";
                shippingAddress.country_code = address.country || "";
                shippingAddress.phone = address.telephone || "";
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
            //source: "Ebay",
            code: shippingInfo.shipmentMethod,
            title: shippingInfo.shipmentMethod,
            price: shippingInfo.shipmentCost
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
        //var paymentInfo = orderRecord.paymentInfo;
        //paymentDetail.method_id = paymentInfo.paymentMethod;
        //paymentDetail.method_title = paymentInfo.paymentMethodTitle;
        //paymentDetail.paid = false;
        return paymentDetail;
    }

    /**
     * This method returns an object of discount lines for sales order
     * @param orderRecord
     * @returns {{}}
     */
    function getSalesOrderDiscountLines(orderRecord) {
        var discountLines = [];
        if (orderRecord.discountAmount > 0) {
            discountLines.push({
                amount: orderRecord.discountAmount,
                code: "NetSuite Discount",
                type: "fixed_amount"
            });
        }
        return discountLines;
    }

    /**
     * This method returns an object of sales order data required to create sales order to WOO
     * @param orderRecord
     * @returns {object}
     */
    function getSalesOrderData(orderRecord) {
        var data = {};
        data.order = EbayModels.salesOrder();
        data.order.email = orderRecord.customer.email;
        data.order.financial_status = "pending";// todo generalize if necessary
        // set customer
        data.order.customer.id = orderRecord.customer.customerId;
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
        // set discount lines
        data.order.discount_codes = getSalesOrderDiscountLines(orderRecord);
        data.order.total_discounts = orderRecord.discountAmount > 0 ? orderRecord.discountAmount : 0;
        data.order.processing_method = "manual";
        data.order.payment_gateway_names = ["manual"];
        data.order.gateway = "manual";
        data.order.transactions = [
            {
                "kind": "authorization",
                "status": "success",
                "amount": orderRecord.orderTotal,// this might be causing error in future
                "message": "Chay Script"
            }
        ];

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

    //function parseResponse(_serverResponse, _function, _type) {
    //    var serverResponse;
    //    var error = getErrorIfExist(_serverResponse, _type);
    //    if (error === null) {
    //        serverResponse = _function(_serverResponse);
    //    } else {
    //        serverResponse = {
    //
    //        };
    //    }
    //    return serverResponse;
    //}
    /**
     * {"coupons":[{"id":0,"error":{"code":"woocommerce_api_coupon_code_already_exists","message":"The coupon code already exists"}
     * {"errors":[{"code":"","message":""}]}
     * @param serverResponse
     * @param type
     */
    function getErrorIfExist(serverResponse, type) {
        var errorObject = null;
        var error;
        if (serverResponse.hasOwnProperty("errors")) {
            error = serverResponse.errors[0];
            errorObject = {
                code: error.code,
                message: error.message
            };
        }//else {
        //    var data = serverResponse.hasOwnProperty(type) ? serverResponse[type] : null;
        //    if (data === null) {
        //        errorObject = {
        //            code: "DEV",
        //            message: "Blank Response"
        //        };
        //    }
        //
        //    if (data instanceof Array) {
        //        for (var i in data) {
        //            var responseObj = data[i];
        //            if (responseObj.hasOwnProperty("error")) {
        //                error = responseObj.error;
        //                if (!errorObject.hasOwnProperty("code")) {
        //                    errorObject.code = "";
        //                } else {
        //                    errorObject.code += " | ";
        //                }
        //                if (!errorObject.hasOwnProperty("message")) {
        //                    errorObject.message = "";
        //                } else {
        //                    errorObject.message += " | ";
        //                }
        //            }
        //        }
        //    }
        //}
        return errorObject;
    }

    /**
     * Sends request to server
     * @param httpRequestData
     */
    function sendRequest(httpRequestData) {

        var finalUrl = EbayWrapper.ServerUrl + httpRequestData.additionalUrl;

        Utility.logDebug('Request final = ', finalUrl);
        var res = null;

        if (!httpRequestData.headers) {
            httpRequestData.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic " + EbayWrapper.AuthHeader
            };
        }

        Utility.logDebug('finalUrl = ', finalUrl);
        Utility.logDebug('httpRequestData = ', JSON.stringify(httpRequestData));

        if (httpRequestData.method === 'GET') {
            res = nlapiRequestURL(finalUrl, null, httpRequestData.headers);
        } else {
            var postDataString = typeof httpRequestData.postData === "object" ?
                JSON.stringify(httpRequestData.postData) : httpRequestData.postData;

            res = nlapiRequestURL(finalUrl, postDataString, httpRequestData.headers, httpRequestData.method);
        }

        var body = res.getBody();
        Utility.logDebug('w_request body', body);
        var serverResponse = eval('(' + body + ')');

        return serverResponse;
    }

    function getCreateFulfillmentLineItemsData() {
        var lineItems = [];
        // we are in after submit event of item fulfillment that's why I have accessed the record
        // here direclty because it is only for Ebay and we can get the info here
        var linesCount = nlapiGetLineItemCount('item');
        for (var lineNum = 1; lineNum <= linesCount; lineNum++) {
            var isLineFulfill = nlapiGetLineItemValue('item', 'itemreceive', lineNum);
            // if line is not fulfill skip it
            if (isLineFulfill !== "T") {
                continue;
            }
            var itemId = nlapiGetLineItemValue('item', ConnectorConstants.Transaction.Columns.MagentoOrderId, lineNum);
            var itemQty = nlapiGetLineItemValue('item', 'quantity', lineNum);
            // make line items which will be fulfilled
            lineItems.push({
                id: itemId,
                quantity: itemQty
            });
        }
        return lineItems;
    }

    function getCreateFulfillmentTrackingNumbersData() {
        var trackingNumbersData = {};
        var trackingNumbers = [];
        var packageCarrier = '';
        var totalPackages;
        // packages sublist is generated by carrier / netsuite feature
        if (nlapiGetLineItemCount('packageups') > 0) {
            packageCarrier = 'ups';
        }
        if (nlapiGetLineItemCount('packagefedex') > 0) {
            packageCarrier = 'fedex';
        }
        // get tracking numbers if exist
        totalPackages = nlapiGetLineItemCount('package' + packageCarrier);
        for (var p = 1; p <= totalPackages; p++) {
            var trackingNumber = nlapiGetLineItemValue('package' + packageCarrier, 'packagetrackingnumber' + packageCarrier, p);
            if (Utility.isBlankOrNull(trackingNumber)) {
                continue;
            }
            trackingNumbers.push(trackingNumber);
        }
        trackingNumbersData.trackingNumbers = trackingNumbers;
        return trackingNumbersData;
    }

    function getCreateFulfillmentData() {
        var data = {
            "tracking_numbers": [],
            "line_items": []
        };
        var lineItems = getCreateFulfillmentLineItemsData();
        var trackingNumbersData = getCreateFulfillmentTrackingNumbersData();
        if (lineItems.length === 0) {
            Utility.throwException("ALLZOHU", "No lines are found to be fulfilled");
        }
        data.line_items = lineItems;
        data.tracking_numbers = trackingNumbersData.trackingNumbers;
        return data;
    }

    function parseCancelSalesOrderResponse(serverResponse) {
        var finalResult = {
            status: false
        };
        if (serverResponse.hasOwnProperty("status") && serverResponse.status.toString() === "cancelled") {
            finalResult.status = true;
        }
        return finalResult;
    }

    function parseSingleProductVariantResponse(variant) {
        var variantObj = EbayModels.variant();
        variantObj.id = variant.id;
        variantObj.product_id = variant.product_id;
        variantObj.title = variant.title;
        variantObj.sku = variant.sku;
        variantObj.position = variant.position;
        variantObj.grams = variant.grams;
        variantObj.inventory_policy = variant.inventory_policy;
        variantObj.fulfillment_service = variant.fulfillment_service;
        variantObj.inventory_management = variant.inventory_management;
        variantObj.price = variant.price;
        variantObj.compare_at_price = variant.compare_at_price;
        variantObj.option1 = variant.option1;
        variantObj.option2 = variant.option2;
        variantObj.option3 = variant.option3;
        variantObj.created_at = variant.created_at;
        variantObj.updated_at = variant.updated_at;//2015-09-02T14:47:57-04:00
        variantObj.taxable = variant.taxable;
        variantObj.requires_shipping = variant.requires_shipping;
        variantObj.barcode = variant.barcode;
        variantObj.inventory_quantity = variant.inventory_quantity;
        variantObj.old_inventory_quantity = variant.old_inventory_quantity;
        variantObj.image_id = variant.image_id;
        variantObj.weight = variant.weight;
        variantObj.weight_unit = variant.weight_unit;
        return variantObj;
    }

    function getOrderLineIdData(lineItems) {
        var data = {};
        for (var i in lineItems) {
            var lineItem = lineItems[i];
            data[lineItem.sku] = lineItem.id.toString();
        }
        return data;
    }


    HttpHeadersValues = {
        X_EBAY_API_SITEID: '0',
        // Content_Type : 'text/xml',
        // Request_Payload : '',
        X_EBAY_API_COMPATIBILITY_LEVEL: '849'
    }

    var Operations = {
        findItemsByKeywords: 'findItemsByKeywords',
        SetNotificationPreferences: 'SetNotificationPreferences',
        GetClientAlertsAuthToken: 'GetClientAlertsAuthToken',
        Login: 'Login',
        GetUserAlerts: 'GetUserAlerts',
        Logout: 'Logout',
        GetItemTransactions: 'GetItemTransactions',
        GetItem: 'GetItem',
        CompleteSale: 'CompleteSale',
        GetNotificationPreferences: 'GetNotificationPreferences',
        GetMyeBaySelling: 'GetMyeBaySelling',
        GeteBayOfficialTime: 'GeteBayOfficialTime',
        GetSuggestedCategories: 'GetSuggestedCategories',
        VerifyAddItem: 'VerifyAddItem',
        AddItem: 'AddItem',
        ReviseItem: 'ReviseItem',
        VerifyAddFixedPriceItem: 'VerifyAddFixedPriceItem',
        AddFixedPriceItem: 'AddFixedPriceItem',
        ReviseFixedPriceItem: 'ReviseFixedPriceItem'
    }

    HttpHeaders = {
        X_EBAY_API_COMPATIBILITY_LEVEL: 'X-EBAY-API-COMPATIBILITY-LEVEL',
        X_EBAY_API_DEV_NAME: 'X-EBAY-API-DEV-NAME',
        SECURITY_APPNAME: 'X-EBAY-API-APP-NAME',
        X_EBAY_API_CERT_NAME: 'X-EBAY-API-CERT-NAME',
        X_EBAY_API_CALL_NAME: 'X-EBAY-API-CALL-NAME',
        X_EBAY_API_SITEID: 'X-EBAY-API-SITEID'
        // Content_Type : 'Content-Type',
        // Request_Payload : 'Request Payload'
    }

    //get response page count
    function getResponsePageCount() {
        try {
            //TODO: fetch from configuration
            var durationdays = 20;
            //TODO: fetch from configuration
            var orderStatusFilter = 2;
            var orderStatus = getOrderStatus(orderStatusFilter);

            Utility.logDebug('orderStatusFilter', orderStatusFilter);

            if (isNaN(durationdays) || durationdays < 1) {
                durationdays = 1;
            }

            var pageNumber = 1;

            Utility.logDebug('pageNumber durationdays orderStatus', pageNumber + '  ' + durationdays + '   ' + orderStatus);

            var GetMyebaySellingResponse = GetMyEbaySelling(pageNumber, durationdays, orderStatus);

            var regex = new RegExp('"', 'g');
            var responseString = GetMyebaySellingResponse.getBody().replace(regex, '\"');

            Utility.logDebug('GetMyebaySellingResponse', responseString);


            //updateResponseinFile(GetMyebaySellingResponse .getBody())
            var pageCount = GetPageCount(GetMyebaySellingResponse);
            return pageCount;

        } catch (ex) {
            Utility.logException('Error in getResponsePageCount', 'Error Message:' + ex.message + ' Error:' + ex.toString());
        }
    }


    //Return Number of pages of MyebaySelling Request
    function GetPageCount(GetMyebaySellingResponse) {
        try {
            Utility.logDebug('Response Body', nlapiEscapeXML(GetMyebaySellingResponse.getBody()));
            var ordersXml;
            var regex = new RegExp('"', 'g');
            ordersXml = GetMyebaySellingResponse.getBody().replace(regex, '\"');

            var transactionXml = nlapiStringToXML(ordersXml);

            var totalNumberOfPages = nlapiSelectValue(transactionXml, '//nlapi:TotalNumberOfPages');


            Utility.logDebug('Total Number Of Pages', totalNumberOfPages);

            return totalNumberOfPages;
        } catch (ex) {
            Utility.logDebug('error in GetAuctions', ex.toString());
        }
    }


    //get order status Text
    function getOrderStatus(orderStatusId) {
        try {
            orderStatus = {
                1: 'All',
                2: 'AwaitingPayment',
                3: 'AwaitingShipment',
                4: 'CustomCode',
                5: 'PaidAndShipped'

            };
            return orderStatus[orderStatusId];
        } catch (ex) {
            Utility.logException('Error in getOrderStatus', 'Error Message:' + ex.message + ' Error:' + ex.toString());
        }
    }

    function GetMyEbaySelling(pagenumber, durationdays, orderStatusFilter) {
        var postData = generateXmlForMyEbaySelling(pagenumber, durationdays, orderStatusFilter);
        return callXmlService(Operations.GetMyeBaySelling, postData, null);
    }

    function callXmlService(operation, postData, credentials,customHeaders) {
        try {

            var headers = [];
            for (var key in HttpHeadersValues) {
                headers[HttpHeaders[key]] = HttpHeadersValues[key];
            }
            var params = getHttpCredentials(credentials);
            for (var key in params) {
                headers[key] = params[key];
            }
            headers[HttpHeaders.X_EBAY_API_CALL_NAME] = operation;
            var url = storeConfiguration.endpoint;
            var response = nlapiRequestURL(url, postData, headers);

            var headerValues = [];
            Utility.logDebug('customHeaders',JSON.stringify(customHeaders));
            if(!!customHeaders) {
                for (var header in headers) {
                    Utility.logDebug('header',header +'   In Custom Header:  ' +customHeaders[header] );

                    if(!!customHeaders[header]) {
                        headers[header] = customHeaders[header];

                    }
                    headerValues.push(header + '  ' + headers[header]);
                }
            }




            var res = responseCheck(response);
            var logRec = nlapiCreateRecord('customrecord_ebayreqxml');
            logRec.setFieldValue('custrecord_xml',postData);
            logRec.setFieldValue('custrecord_endpoint',url);
            logRec.setFieldValue('custrecord_headers',JSON.stringify(headerValues));
            logRec.setFieldValue('custrecord_response',res.getBody());
            nlapiSubmitRecord(logRec);

            //return responseCheck(response);
            return res;
        } catch (exp) {
            Utility.logException('Error', exp);
            throw exp;
        }
    }



    function responseCheck(response) {
        try {
            var responseString;
            var regex = new RegExp('"', 'g');
            responseString = response.getBody().replace(regex, '\"');
            nlapiLogExecution('DEBUG', 'responseString', responseString);
            var responseXml = nlapiStringToXML(responseString);
            var ack = nlapiSelectValue(responseXml, '//nlapi:Ack');
            var expirationNode = null;
            if (ack == 'Failure') {
                var errorNode = nlapiSelectNode(responseXml, '//nlapi:Errors');
                var errorCode = nlapiSelectValue(errorNode, '//nlapi:ErrorCode');
                var shortErrorMessage = nlapiSelectValue(errorNode, '//nlapi:ShortMessage');
                var longErrorMessage = nlapiSelectValue(errorNode, '//nlapi:LongMessage');
                Utility.logException('eBay Error Code', errorCode);
                Utility.logException( 'Short eBay Error Message', shortErrorMessage);
                Utility.logException('Long  eBay Error Message', longErrorMessage);
                expirationNode = nlapiSelectNode(responseXml, '//nlapi:HardExpirationWarning');
                if (expirationNode != null && expirationNode != undefined && expirationNode != '') {
                    nlapiLogExecution('ERROR', 'eBay Auth Token is expiring', 'Please generate new ebay auth token otherwise eBay connector stop working.');
                    var subject = 'eBay AuthToken Expiration Warning';
                    var body = 'Hi,\nYour eBay AuthToken will expire soon.\nPlease generate new eBay AuthToken and update it in eBay configuration record otherwise eBay Connector will not working.';
                    sendNotification(subject, body);
                }
                if (errorCode == '702') {
                    var subject = 'eBay Server Timeout';
                    var body = 'Hi,\n eBay server Timeout your request.\nPlease try later or contact your administrator.';
                    sendNotification(subject, body);

                }
                if (errorCode == '932' || errorCode == '16110' || errorCode == '17470') {
                    var subject = 'eBay AuthToken Expired';
                    var body = 'Hi,\nYour eBay AuthToken has been expired.\nPlease generate new token and update it in eBay configuration record otherwise eBay Connector will not working.';
                    sendNotification(subject, body);
                }

            }
            if (ack == 'Warning') {
                expirationNode = nlapiSelectNode(responseXml, '//nlapi:HardExpirationWarning');
                if (expirationNode != null && expirationNode != undefined && expirationNode != '') {
                    Utility.logException('eBay Auth Token is expiring', 'Please generate new ebay auth token otherwise eBay connector stop working.');
                    var subject = 'eBay AuthToken Expiration Warning';
                    var body = 'Hi,\nYour eBayAuthToken will expire soon.\nPlease generate new eBay AuthToken and update it in eBay configuration record otherwise eBay Connector will not working.';
                    sendNotification(subject, body);
                }
            }

            return response;
        } catch (ex) {
            Utility.logException('Error in responseCheck', 'Error Message:' + ex.message);
            Utility.logException('Error in responseCheck', 'Error:' + ex.toString());
            throw ex;
        }
    }

    function sendNotification(subject, body) {
        //TODO : fetch from configuration
        var to = 'smehmood@folio3.com';
        //TODO : fetch from configuration
        var from = '3042'; //Employee Id

        if (to && from) {
            var toArr = to.split(',');
            for (var i = 0, l = toArr.length; i < l; i++) {
                try {
                    nlapiSendEmail(from, toArr[i], subject, body);
                } catch (e) {
                    Utility.logException('Email Error', 'Cannot send email to ' + toArr[i] + ' error:' + e);
                }
            }
        }
    }

    function getHttpCredentials(credentials) {
        var params = [];
        params[HttpHeaders.SECURITY_APPNAME] = storeConfiguration.entitySyncInfo.ebayKeys.appid;
        params[HttpHeaders.X_EBAY_API_DEV_NAME] = storeConfiguration.entitySyncInfo.ebayKeys.devid;
        params[HttpHeaders.X_EBAY_API_CERT_NAME] = storeConfiguration.entitySyncInfo.ebayKeys.certid;
        return params;
    }


    function generateXmlForMyEbaySelling(pagenumber, durationdays, orderStatusFilter) {
        var operation = Operations.GetMyeBaySelling;
        var xml = getBasicXmlHeader(operation, null) + '<SoldList>' + '<DurationInDays>' + durationdays + '</DurationInDays>' + '<Include>1</Include>' + '<IncludeNotes>0</IncludeNotes>' + '<OrderStatusFilter>' + orderStatusFilter + '</OrderStatusFilter>' + '<Pagination> ' + '<EntriesPerPage>200</EntriesPerPage>' + '<PageNumber>' + pagenumber + '</PageNumber>' + '</Pagination>' + '<Sort>EndTimeDescending</Sort>' + '</SoldList>' + '<WarningLevel>High</WarningLevel>' + getBasicXmlFooter(operation);
        return xml;
    }

    function getBasicXmlFooter(operation) {
        return '</' + Operations[operation] + 'Request>';
    }

    function getBasicXmlHeader(operation) {
        Utility.logDebug('storeConfiguration', JSON.stringify(storeConfiguration));
        var authToken = storeConfiguration.entitySyncInfo.ebayKeys.token;
        var xml = '<?xml version="1.0" encoding="utf-8"?>' + '<' + Operations[operation] + 'Request xmlns="urn:ebay:apis:eBLBaseComponents">' + '<RequesterCredentials>' + '<eBayAuthToken>'
            + '<![CDATA[' + authToken + ']]>' + '</eBayAuthToken>' + '</RequesterCredentials>';
        return xml;
    }

    //get all the recent ebay orders
    function getRecentAuctions(pageNumber) {
        try {
            //TODO: to fetch from configuration
            var durationdays = 20;
            var orderStatusFilter = 2;
            var orderStatus = getOrderStatus(orderStatusFilter);

            Utility.logDebug('orderStatusFilter', orderStatusFilter);
            if (isNaN(durationdays) || durationdays < 1) {
                durationdays = 1;
            }
            var GetMyebaySellingResponse = GetMyEbaySelling(pageNumber, durationdays, orderStatus);
            var auctions = GetAuctions(GetMyebaySellingResponse);
            return auctions;
        } catch (ex) {
            Utility.logException('Error in getRecentAuctions', 'Error Message:' + ex.message + ' Error:' + ex.toString());
        }

    }


    function  GetAuctions (GetMyebaySellingResponse) {
        try {
            var ebayTransactionsArray = [];
            var j = 0;
            var ordersXml;
            var regex = new RegExp('"', 'g');
            ordersXml = GetMyebaySellingResponse.getBody().replace(regex, '\"');
            var transactionXml = nlapiStringToXML(ordersXml);
            Utility.logDebug('TransactionXML', nlapiEscapeXML(ordersXml));
            var transactionArray = nlapiSelectNode(transactionXml, '//nlapi:OrderTransactionArray');
            Utility.logDebug('transactionArray', transactionArray);
            var transactions = transactionArray.childNodes;
            Utility.logDebug('length', transactions.length);
            for (var i = 0; i < transactions.length; i++) {
                var transaction = transactions.item(i);
                var tnode = nlapiSelectNode(transaction, 'nlapi:Transaction');
                if (tnode != undefined && tnode != null) {
                    ebayTransactionsArray[j] = XMLtoObj(tnode);
                    j++;
                } else {
                    //if single buyer purchase multiple items
                    var orderTransactionArray = nlapiSelectNode(transaction, 'nlapi:Order/nlapi:TransactionArray');
                    var orderTransactions = orderTransactionArray.childNodes;
                    for (var k = 0; k < orderTransactions.length; k++) {
                        var orderTransaction = orderTransactions.item(k);
                        ebayTransactionsArray[j] = XMLtoObj(orderTransaction);
                        j++;
                    }
                }
            }
            return ebayTransactionsArray;
        } catch (ex) {
            Utility.logDebug('error in GetDataFromMultiplePages', ex.toString());
        }
    }


    function XMLtoObj(transactionXML) {
        try {
            var orderObj = {};
            var customer = nlapiSelectNode(transactionXML, 'nlapi:Buyer');
            orderObj.BuyerEmail = nlapiSelectValue(customer, 'nlapi:Email');
            orderObj.BuyerUserName = nlapiSelectValue(customer, 'nlapi:UserID');
            var item = nlapiSelectNode(transactionXML, 'nlapi:Item');
            orderObj.Title = nlapiSelectValue(item, 'nlapi:Title');
            orderObj.ItemID = nlapiSelectValue(item, 'nlapi:ItemID');
            orderObj.TransactionID = nlapiSelectValue(transactionXML, 'nlapi:TransactionID');
            orderObj.QuantitySold = nlapiSelectValue(transactionXML, 'nlapi:QuantityPurchased');
            orderObj.TransactionPrice = nlapiSelectValue(transactionXML, 'nlapi:TotalTransactionPrice');
            var shipping = nlapiSelectNode(item, 'nlapi:ShippingDetails/nlapi:ShippingServiceOptions');
            orderObj.ShippingCost = nlapiSelectValue(shipping, 'nlapi:ShippingServiceCost');
            orderObj.CreatedDate = nlapiSelectValue(transactionXML, 'nlapi:CreatedDate');
            return orderObj;
        } catch (ex) {
            Utility.logDebug('error in XMLtoObj', ex.toString());
        }
    }
    //get ebay user info
    function getEbayUser(auctionId, transactionId) {
        try {
            if (auctionId == transactionId) {
                transactionId = 0;
            }
            var userResponse = GetUserDetails(auctionId, 1, transactionId);
            var user = GetEbayUser(userResponse, transactionId, auctionId);
            return user;
        } catch (ex) {
            Utility.logException('Error in getEbayUser', 'Error Message:' + ex.message + ' Error:' + ex.toString());
        }
    }

    //get Item Details
    function getSKU(itemID) {
        try {
            Utility.logDebug('ItemID', itemID);
            var itemResponse = GetItemDetails(itemID);
            Utility.logDebug('ItemResponse', itemResponse);
            var itemId = GetEbayItem(itemResponse);
            Utility.logDebug('ebay item id', itemId);
            return itemId;
        } catch (ex) {
            Utility.logException('Error in getSKU', 'Error Message:' + ex.message + ' Error:' + ex.toString());
        }
    }


    function GetEbayItem(itemResponse)
    {
        try {
            var ordersXml;
            var regex = new RegExp('"', 'g');
            ordersXml = itemResponse.getBody().replace(regex, '\"');
            var itemId = null;
            var itemXml = nlapiStringToXML(ordersXml);
            Utility.logDebug( 'itemXML', nlapiEscapeXML(ordersXml));
            var itemNode = nlapiSelectNode(itemXml, '//nlapi:Item');
            Utility.logDebug('itemNode', itemNode);
            var nodeList = nlapiSelectNode(itemNode, '//nlapi:ItemSpecifics');
            Utility.logDebug('nodeList', nodeList);
            var namearr = nlapiSelectValues(nodeList, '//nlapi:Name');
            var valuearr = nlapiSelectValues(nodeList, '//nlapi:Value');
            if (nodeList == null || nodeList == "null") {
                return null;
            }
            for (var i = 0; i < namearr.length; i++) {
                if (namearr[i] == 'SKU') {
                    itemId = valuearr[i];
                }
            }
            if (itemId != null && itemId != "" && itemId != undefined)
                return itemId;
            else
                return null;
        } catch (ex) {
            Utility.logDebug('error in get ebay item:' + ex.toString(), ex.message);
            return null;
        }
    }

    function generateXmlForGetItemRequest  (itemId){
        var operation = Operations.GetItem;
        Utility.logDebug('RequestXmlHeader',getBasicXmlHeader(operation));
        Utility.logDebug('RequestXmlFooter',getBasicXmlFooter(operation));
        var xml = getBasicXmlHeader(operation)
            + ' <ItemID>' + itemId + '</ItemID>'
            + '<IncludeItemSpecifics>1</IncludeItemSpecifics>'
            + getBasicXmlFooter(operation);
        return xml;
    }

    function GetItemDetails  (itemId) {
        var postData = generateXmlForGetItemRequest(itemId);
        var customHeaders = {};
        customHeaders["X-EBAY-API-COMPATIBILITY-LEVEL"] = "905";
        return callXmlService(Operations.GetItem, postData,null,customHeaders);
    }


    function GetEbayUser (userResponse,transactionID,auctionID)
    {
        var userXml = nlapiStringToXML(userResponse.getBody());
        Utility.logDebug('UserXML',userResponse.getBody());
        var transactionArray=nlapiSelectNode(userXml,'//nlapi:TransactionArray');
        var transactions = transactionArray.childNodes;
        var transactionXml;
        for(var i=0;i<transactions.length;i++)
        {
            var transaction= transactions.item(i);
            if(transaction.nodeType===1)
            {
                if(transactionID != auctionID)
                {
                    if(nlapiSelectValue(transaction,'nlapi:TransactionID')==transactionID)
                    {
                        transactionXml=transaction;
                        break;
                    }
                }
                else
                {
                    transactionXml=transaction;
                    break;
                }
            }
        }
        if(transactionXml!="" && transactionXml != null && transactionXml != undefined)
        {
            var userObj = {};
            var customer = nlapiSelectNode(transactionXml,'nlapi:Buyer');
            //userObj.Email = nlapiSelectValue(customer,'nlapi:Email');
            userObj.UserName = nlapiSelectValue(customer,'nlapi:UserID');
            var shippingAddress = nlapiSelectNode(customer,'nlapi:BuyerInfo/nlapi:ShippingAddress');
            var tempName = nlapiSelectValue(shippingAddress ,'nlapi:Name');
            tempName = tempName.split(" ");
            userObj.Status = nlapiSelectValue(shippingAddress ,'nlapi:Status');
            userObj.Phone = nlapiSelectValue(shippingAddress ,'nlapi:Phone');
            userObj.PostalCode = nlapiSelectValue(shippingAddress ,'nlapi:PostalCode');
            userObj.Address1 = nlapiSelectValue(shippingAddress ,'nlapi:Street1');
            userObj.Address2 = nlapiSelectValue(shippingAddress ,'nlapi:Street2');
            userObj.City = nlapiSelectValue(shippingAddress ,'nlapi:CityName');
            userObj.State = nlapiSelectValue(shippingAddress ,'nlapi:StateOrProvince');
            userObj.CountryCode = nlapiSelectValue(shippingAddress ,'nlapi:Country');
            userObj.CountryName = nlapiSelectValue(shippingAddress ,'nlapi:CountryName');
            userObj._isGuestCustomer = false;
            userObj.customer_id = 1;
            userObj.email = nlapiSelectValue(customer,'nlapi:Email');
            userObj.customer_firstname = tempName[0];
            userObj.customer_middlename = '';
            userObj.customer_lastname = tempName[1];
            userObj.group_id = null;
            userObj.customer_prefix = '';
            userObj.customer_suffix = '';
            userObj.customer_dob = null;


            Utility.logDebug('USERNAME',userObj.UserName);
            Utility.logDebug('TempNAME',tempName);
            var buyerMessageNode = nlapiSelectNode(transactionXml,'nlapi:BuyerCheckoutMessage');
            if(buyerMessageNode != null && buyerMessageNode != '' && buyerMessageNode != undefined)
            {
                BUYER_CHECKOUT_MESSAGE = nlapiSelectValue(transactionXml ,'nlapi:BuyerCheckoutMessage');
            }
            else
            {
                BUYER_CHECKOUT_MESSAGE = '';
            }
            return userObj;
        }
        else
        {
            return false;
        }
    }

    function GetUserDetails(itemId, pageNumber, transactionId) {
        var postData = generateXmlForGetUserRequest(itemId, pageNumber, transactionId);
        return callXmlService(Operations.GetItemTransactions, postData, null);
    }

    function generateXmlForGetUserRequest(itemId, pageNumber, transactionId) {
        var operation = Operations.GetItemTransactions;
        var xml = getBasicXmlHeader(operation, null) + ' <ItemID>' + itemId + '</ItemID>' + '<TransactionID>' + transactionId + '</TransactionID>' + ' <Pagination>' + '<EntriesPerPage>200</EntriesPerPage>' + '<PageNumber>' + pageNumber + '</PageNumber>' + '</Pagination>' + getBasicXmlFooter(operation);
        return xml;
    }

    //endregion

    //region Public Methods

    return {

        /**
         * Init method
         */
        initialize: function (storeInfo) {
            if (!!storeInfo) {
                this.storeConfiguration = storeInfo;
                storeConfiguration = storeInfo;
                Utility.logDebug('this.storeConfiguration', JSON.stringify(this.storeConfiguration));
            }
        },
        storeConfiguration: {},
        RequestHeader: '',
        RequestFooter: '',

        UserName: '',
        Password: '',
        AuthHeader: '',

        ServerUrl: 'https://b388d7f6e9f8b4a83e8c3727a81e0f0b:1a17d30a1d626eece53d366ab0b2b240@f3-test-store-001.myEbay.com/admin/',


        /**
         * Gets supported Date Format
         * @returns {string}
         */
        getDateFormat: function () {
            return 'ISO';
        },

        getSessionIDFromServer: function (userName, apiKey) {
            var sessionID = 'DUMMY_SESSION_ID';

            EbayWrapper.UserName = userName;
            EbayWrapper.Password = apiKey;

            if (!!base64_encode) {
                EbayWrapper.AuthHeader = base64_encode(EbayWrapper.UserName + ':' + EbayWrapper.Password);
            }

            return sessionID;
        },

        /**
         * Gets Sales Order from Server
         * @param order
         * @param sessionID
         * @returns {*}
         */
        getSalesOrders: function (order, sessionID) {
            var serverFinalResponse = {};
            serverFinalResponse.orders = [];
            var dataObject;
            serverFinalResponse.status = false;

            var pageCount = getResponsePageCount();
            Utility.logDebug('pageCount', pageCount);
            for (var i = 1; i <= pageCount; i++) {
                Utility.logDebug('Response Pages Number', i);
                //get Auctions on the page
                var AuctionResult = getRecentAuctions(i);
                if(!!AuctionResult) {
                    Utility.logDebug('AuctionResult', AuctionResult.length);
                    for (var j in AuctionResult) {
                        dataObject = {};
                        dataObject.increment_id  = AuctionResult[j].TransactionID;
                        dataObject.order_id  = AuctionResult[j].TransactionID;
                        dataObject.itemid = AuctionResult[j].ItemID;
                        auctionDataCollection[dataObject.increment_id] = dataObject;
                        serverFinalResponse.orders.push(dataObject);
                        //TODO :added break to procss only one transaction during development
                        break;
                    }
                }
                else
                    Utility.logDebug('AuctionResult', 'is null');
            }
            serverFinalResponse.status = true;
            //ConnectorConstants.Client = F3ClientFactory.createClient('F3BaseV1Ebay');
            return serverFinalResponse;
        },



        /**
         * Gets Sales Order information for individual order
         * @param increment_id
         * @param sessionID
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        getSalesOrderInfo: function (increment_id, sessionID) {
            var serverFinalResponse = {};

            //serverFinalResponse.shippingAddress
            //serverFinalResponse.billingAddress;

            serverFinalResponse.customer =  getEbayUser(auctionDataCollection[increment_id].itemid, increment_id);
            if(!!serverFinalResponse.customer) {
                serverFinalResponse.customer.increment_id = increment_id;
                serverFinalResponse.customer.order_number = increment_id;
            }

            Utility.logDebug('increment_id : ' + increment_id +'  auctionDataCollection[increment_id].itemid  ' + auctionDataCollection[increment_id].itemid );
            Utility.logDebug('serverFinalResponse.customer' , JSON.stringify(serverFinalResponse.customer));

            if(!!serverFinalResponse.customer) {
                serverFinalResponse.shippingAddress = {};
                serverFinalResponse.shippingAddress.address_id = 1;
                serverFinalResponse.shippingAddress.city = serverFinalResponse.customer.City;
                serverFinalResponse.shippingAddress.country_id = serverFinalResponse.customer.CountryCode;
                serverFinalResponse.shippingAddress.firstname = serverFinalResponse.customer.FirstName;
                serverFinalResponse.shippingAddress.lastname = serverFinalResponse.customer.LastName;
                serverFinalResponse.shippingAddress.postcode = serverFinalResponse.customer.PostalCode;
                serverFinalResponse.shippingAddress.region = '';
                serverFinalResponse.shippingAddress.region_id = '';
                serverFinalResponse.shippingAddress.street = '';
                serverFinalResponse.shippingAddress.telephone = serverFinalResponse.customer.Phone;
                serverFinalResponse.shippingAddress.is_default_billing = false;
                serverFinalResponse.shippingAddress.is_default_shipping = true;

                serverFinalResponse.billingAddress = {};
                serverFinalResponse.billingAddress.address_id = 1;
                serverFinalResponse.billingAddress.city = serverFinalResponse.customer.City;
                serverFinalResponse.billingAddress.country_id = serverFinalResponse.customer.CountryCode;
                serverFinalResponse.billingAddress.firstname = serverFinalResponse.customer.FirstName;
                serverFinalResponse.billingAddress.lastname = serverFinalResponse.customer.LastName;
                serverFinalResponse.billingAddress.postcode = serverFinalResponse.customer.PostalCode;
                serverFinalResponse.billingAddress.region = '';
                serverFinalResponse.billingAddress.region_id = '';
                serverFinalResponse.billingAddress.street = '';
                serverFinalResponse.billingAddress.telephone = serverFinalResponse.customer.Phone;
                serverFinalResponse.billingAddress.is_default_billing = true;
                serverFinalResponse.billingAddress.is_default_shipping = false;
            }

            serverFinalResponse.payment = {};
            serverFinalResponse.products = [];
            serverFinalResponse.products[0] = {};
            serverFinalResponse.products[0].item_id = getSKU(auctionDataCollection[increment_id].itemid);
            //serverFinalResponse.customer


            serverFinalResponse.faultCode = '';
            serverFinalResponse.faultString = '';
            serverFinalResponse.status = true;
            return serverFinalResponse;
        },

        /**
         * Updates item to server
         * @param product
         * @param sessionID
         * @param productId
         * @param isParent
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        updateItem: function (product, sessionID, productId, isParent) {


            var serverFinalResponse = null;


            serverFinalResponse = this.updateVariant(product, productId);


            return serverFinalResponse;
        },

        /**
         * Gets Product from the server
         * @param sessionID
         * @param product
         * @returns {*}
         */
        getProduct: function (sessionID, product) {


            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                product: {}
            };

            var httpRequestData = {
                additionalUrl: 'products/' + product.magentoSKU + '.json',
                method: 'GET'
            };
            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during getProduct', e);
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

        createFulfillment: function (sessionID, serverItemIds, serverSOId) {

            var httpRequestData = {
                additionalUrl: 'orders/' + serverSOId + '/fulfillments.json',
                method: 'POST',
                postData: {
                    "fulfillment": getCreateFulfillmentData()
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

            if (!!serverResponse && serverResponse.fulfillment) {
                var fulfillmentObj = parseFulfillmentResponse(serverResponse.fulfillment);

                // check if order status is changed to complete
                if (!!fulfillmentObj && fulfillmentObj.isOrderStatusCompleted) {
                    // for setting order id as shipment id in item fulfillment
                    serverFinalResponse.result = fulfillmentObj.id;
                }
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        createTracking: function (result, carrier, carrierText, tracking, sessionID, serverSOId) {
            var trackingRequest = EbayWrapper.createTrackingRequest(result, carrier, carrierText, tracking, sessionID);

            var responseTracking = EbayWrapper.validateTrackingCreateResponse(EbayWrapper.soapRequestToServer(trackingRequest));

            return responseTracking;


            var httpRequestData = {
                additionalUrl: 'orders/' + serverSOId + '/fulfillments.json',
                method: 'PUT',
                postData: {
                    "fulfillment": {
                        "tracking_number": tracking
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

            if (!!serverResponse && serverResponse.orders) {
                var fulfillmentArray = parseFulfillmentResponse(serverResponse);

                if (!!fulfillmentArray && fulfillmentArray.length > 0) {
                    serverFinalResponse.result = fulfillmentArray;
                }
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        getCustomerAddress: function (customer_id, sessionID) {

            var serverFinalResponse = {};
            serverFinalResponse.status = true;
            serverFinalResponse.faultCode = '';
            serverFinalResponse.faultString = '';
            serverFinalResponse.addresses = null;

            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        /**
         * This method create a sales order to Ebay
         * @param internalId
         * @param orderRecord
         * @param store
         * @param sessionId
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        createSalesOrder: function (internalId, orderRecord, store, sessionId) {
            var httpRequestData = {
                additionalUrl: 'orders.json',
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
                serverFinalResponse.incrementalIdData = {};
                serverFinalResponse.incrementalIdData.orderIncrementId = order.id.toString();
                serverFinalResponse.magentoOrderLineIdData = getOrderLineIdData(order.line_items);
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
            return true;
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
                additionalUrl: 'customers' + (type.toString() === "update" ? "/" + customerRecord.magentoId : "") + ".json",
                method: (type.toString() === "update") ? 'PUT' : "POST",
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
            return true;
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
            if (!!serverResponse.coupons[0].error) {
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
        },
        /**
         * This method cancel the order to Ebay
         * @param data
         * @return {{status: boolean, faultCode: string, faultString: string, result: Array}}
         */
        cancelSalesOrder: function (data) {
            var httpRequestData = {
                additionalUrl: 'orders/' + data.orderIncrementId + "/cancel.json",
                method: 'POST',
                postData: {
                    //"amount": true,
                    "restock": true,
                    "reason": "other",
                    "email": false
                }
            };
            var serverResponse = null;
            var error = null;
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
                error = getErrorIfExist(serverResponse);
            } catch (e) {
                Utility.logException('Error during cancelSalesOrder', e);
            }
            if (error !== null) {
                serverFinalResponse.status = false;
                serverFinalResponse.error = error.code + " -- " + error.message;
                return serverFinalResponse;
            }
            if (!!serverResponse && !!serverResponse.order) {
                //var cancelSalesOrderResponse = parseCancelSalesOrderResponse(serverResponse.order);
                // order status is changed to cancelled
                serverFinalResponse.status = true;
            }
            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.error = "Error in cancelling sales order to Ebay";
            }
            return serverFinalResponse;
        },

        requiresOrderUpdateAfterCancelling: function () {
            return false;
        },

        /**
         * Create invoice / handle payment capturing in Ebay
         * @param sessionID
         * @param netsuiteInvoiceObj
         * @param store
         * @returns {{}}
         */
        createInvoice: function (sessionID, netsuiteInvoiceObj, store) {

            var responseBody = {};
            var shouldCaptureAmount = this.checkPaymentCapturingMode(netsuiteInvoiceObj, store);
            if (!!shouldCaptureAmount) {
                var orderId = netsuiteInvoiceObj.otherSystemSOId;
                var httpRequestData = {
                    additionalUrl: 'orders/' + orderId + '/transactions.json',
                    method: 'POST',
                    postData: {
                        transaction: {
                            kind: "capture"
                        }
                    }
                };

                var serverResponse = sendRequest(httpRequestData);
                if (!!serverResponse.transaction) {
                    responseBody = this.parseInvoiceSuccessResponse(serverResponse);
                } else {
                    responseBody = this.parseInvoiceFailureResponse(serverResponse);
                }

            } else {
                responseBody.status = 1;
                responseBody.message = '';
                responseBody.data = {increment_id: ''};
            }
            return responseBody;
        },
        /**
         * parse response in case of successful payment capturing
         * @param serverResponse
         */
        parseInvoiceSuccessResponse: function (serverResponse) {
            var responseBody = {};
            responseBody.status = 1;
            responseBody.message = serverResponse.transaction.message || '';
            responseBody.data = {increment_id: serverResponse.transaction.id.toString() || ''};
            return responseBody;
        },
        /**
         * parse response in case of failure occured in payment capturing
         * @param serverResponse
         */
        parseInvoiceFailureResponse: function (serverResponse) {
            var responseBody = {};
            responseBody.status = 0;
            if (!!serverResponse.responseJSON && !!serverResponse.responseJSON.errors
                && !!serverResponse.responseJSON.errors.base && serverResponse.responseJSON.errors.base.length > 0) {
                responseBody.message = serverResponse.responseJSON.errors.base[0];
            } else {
                responseBody.message = '';
            }
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
            /**
             * If SO is from Ebay, and its SO payment method is either empty(equal to 'pending' of Ebay) or
             * credit card
             */
            if (!!isSOFromOtherSystem && isSOFromOtherSystem == 'T' && (isOnlineMethod || !sOPaymentMethod)
                || (isSOFromOtherSystem != 'T')) {// (isSOFromOtherSystem != 'T') is for exporting invoice from NS to Ebay
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
                    onlineSupported = true;
                    break;
                default :
                    onlineSupported = false;
                    break;
            }

            return onlineSupported;
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

            var paymentMethod = payment.method;
            var financialStatus = payment.financial_status;
            // if no payment method found return
            if (!paymentMethod) {
                return paymentInfo;
            }
            // initialize scrub
            ConnectorConstants.initializeScrubList();
            var system = ConnectorConstants.CurrentStore.systemId;
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
            else {
                Utility.logDebug("Condition (3)", "");
                var otherPaymentMethod = paymentMethod + '_' + financialStatus;
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

        /**
         * Create refund in Ebay
         * @param sessionID
         * @param cashRefundObj
         * @param store
         * @return {{}}
         */
        createCustomerRefund: function (sessionID, cashRefundObj, store) {
            var responseBody = {};
            var refundingAmount = this.calculateAmountToRefund(cashRefundObj);
            var orderId = cashRefundObj.orderId;
            var httpRequestData = {
                additionalUrl: 'orders/' + orderId + '/transactions.json',
                method: 'POST',
                postData: {
                    transaction: {
                        kind: "refund",
                        amount: refundingAmount
                    }
                }
            };

            var serverResponse = sendRequest(httpRequestData);
            if (!!serverResponse.transaction) {
                responseBody = this.parseRefundSuccessResponse(serverResponse);
            } else {
                responseBody = this.parseRefundFailureResponse(serverResponse);
            }
            return responseBody;
        },

        /**
         * Calculate total amount to refund on Ebay
         * @param cashRefundObj
         */
        calculateAmountToRefund: function (cashRefundObj) {
            var totalAmountToRefund = 0;
            if (!!cashRefundObj.items && cashRefundObj.items.length > 0) {
                for (var i = 0; i < cashRefundObj.items.length; i++) {
                    var obj = cashRefundObj.items[i];
                    totalAmountToRefund += parseFloat(obj.amount);
                }
            }
            if (!!cashRefundObj.adjustmentPositive) {
                totalAmountToRefund += parseFloat(cashRefundObj.adjustmentPositive);
            }
            if (!!cashRefundObj.shippingCost) {
                totalAmountToRefund += parseFloat(cashRefundObj.shippingCost);
            }
            return totalAmountToRefund;
        },

        /**
         * parse response in case of successful payment capturing
         * @param serverResponse
         */
        parseRefundSuccessResponse: function (serverResponse) {
            var responseBody = {};
            responseBody.status = 1;
            responseBody.message = serverResponse.transaction.message || '';
            responseBody.data = {increment_id: serverResponse.transaction.id.toString() || ''};
            return responseBody;
        },
        /**
         * parse response in case of failure occured in payment capturing
         * @param serverResponse
         */
        parseRefundFailureResponse: function (serverResponse) {
            var responseBody = {};
            responseBody.status = 0;
            if (!!serverResponse.responseJSON && !!serverResponse.responseJSON.errors
                && !!serverResponse.responseJSON.errors.base && serverResponse.responseJSON.errors.base.length > 0) {
                responseBody.message = serverResponse.responseJSON.errors.base[0];
            } else {
                responseBody.message = '';
            }
            return responseBody;
        },

        getPaymentInfoToExport: function (orderRecord, orderDataObject, store) {
            var obj = {};
            // initialize scrub
            ConnectorConstants.initializeScrubList();
            var system = ConnectorConstants.CurrentStore.systemId;

            var paymentMethod = orderRecord.getFieldValue('paymentmethod');
            if (!!paymentMethod) {
                obj.paymentMethod = FC_ScrubHandler.findValue(system, "PaymentMethod", paymentMethod);
                obj.paymentMethodTitle = FC_ScrubHandler.findValue(system, "PaymentMethodTitle", paymentMethod);
            } else {
                var defaultMagentoPaymentMethod = FC_ScrubHandler.findValue(system, "PaymentMethod", "DEFAULT_EXT");
                obj.paymentMethodTitle = FC_ScrubHandler.findValue(system, "PaymentMethodTitle", "DEFAULT_EXT");
                obj.paymentMethod = defaultMagentoPaymentMethod;
            }
            return obj;
        },
        updateVariant: function (product, productId) {
            var httpRequestData = {
                additionalUrl: '/variants/' + productId.toString() + '.json',
                method: 'PUT',
                postData: {
                    variant: {
                        id: productId.toString(),
                        inventory_quantity: product.quantity,
                        price: product.price
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
            if (!!serverResponse && serverResponse.variant) {
                serverFinalResponse.product = parseSingleProductVariantResponse(serverResponse.variant);
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
         * @param productId
         * @param isParent
         * @param EbayProduct
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        updateProduct: function (product, sessionID, productId, isParent, EbayProduct) {
            EbayProduct.variants[0].price = product.price;
            EbayProduct.variants[0].inventory_quantity = product.quantity;
            var httpRequestData = {
                additionalUrl: 'products/' + productId.toString() + '.json',
                method: 'PUT',
                postData: {
                    product: {
                        id: productId.toString(),
                        variants: EbayProduct.variants
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
         * This method returns the item map between NetSuite and Ebay Wrapper
         * @param magentoIds
         * @return {Object}
         */
        getNsProductIdsByExtSysIds: function (magentoIds) {
            var cols = [];
            var filterExpression = "";
            var resultArray = [];
            var result = {};
            var magentoIdId;
            magentoIdId = ConnectorConstants.Item.Fields.MagentoId;
            result.errorMsg = '';
            try {
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
         * Get Ebay Item Ids by NetSuite Item Ids
         * @param itemIdsArr
         * @param fieldType
         * @return {Object}
         */
        getExtSysItemIdsByNsIds: function (itemIdsArr, fieldType) {
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
                        var magentoId;
                        if (fieldType === "ITEM_ID") {
                            magentoId = result[i].getValue('itemid');
                            magentoId = magentoId.split(':');
                            magentoItemIds[result[i].getId()] = (magentoId[magentoId.length - 1]).trim();
                        } else {
                            magentoId = result[i].getValue(ConnectorConstants.Item.Fields.MagentoId);
                            magentoId = !Utility.isBlankOrNull(magentoId) ? JSON.parse(magentoId) : [];
                            magentoId = ConnectorCommon.getMagentoIdFromObjArray(magentoId, ConnectorConstants.CurrentStore.systemId);
                            magentoItemIds[result[i].getId()] = magentoId;
                        }
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

        },
        /**
         * Export Inventory Item to WooCommerce Store
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         */
        exportInventoryItem: function (store, itemInternalId, itemType, itemObject, createOnly) {
            var responseBody = {};
            responseBody.status = 1;
            responseBody.message = '';
            responseBody.data = {};
            return responseBody;
        }
    };

    //endregion

})();


EbayCommunication = (function () {


})();
