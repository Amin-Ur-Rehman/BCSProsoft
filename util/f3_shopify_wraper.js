/**
 * Created by Ubaid Baig on 2.7.15
 *
 * Class Name: ShopifyWrapper
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
 * This is a Wrapper Class for Shopify API
 */
ShopifyWrapper = (function () {

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
        localOrder.customer.updatedAt = serverOrder.updated_at;

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
            Utility.logException('Shopify Wrapper: Error during parseSalesOrderResponse', e);
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
        // price is the original price of item
        localProduct.price = serverProduct.price;
        // discount will be handling usig total discounts of the order. because in api there is no actual
        // discount value of a unit quantity is found and we'll have to calculate unit price after discount which
        // will cause precision erros
        localProduct.original_price = "0";
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
        var data = ShopifyModels.billingAddress();
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
        var data = ShopifyModels.shippingAddress();
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
        data.customer = ShopifyModels.customer();
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
        var billingAddress = ShopifyModels.billingAddress();
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
        var shippingAddress = ShopifyModels.shippingAddress();
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
            //source: "shopify",
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
        data.order = ShopifyModels.salesOrder();
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

        var finalUrl = ShopifyWrapper.ServerUrl + httpRequestData.additionalUrl;

        Utility.logDebug('Request final = ', finalUrl);
        var res = null;

        if (!httpRequestData.headers) {
            httpRequestData.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Basic " + ShopifyWrapper.AuthHeader
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
        // here direclty because it is only for shopify and we can get the info here
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
        var variantObj = ShopifyModels.variant();
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

    function parseCustomerListResponse(customers) {
        var customerList = [];

        if (!(customers instanceof Array)) {
            return customerList;
        }

        for (var i in customers) {
            customerList.push(parseSingleCustomerResponse(customers[i]));
        }

        return customerList;
    }

    function parseSingleCustomerResponse(customer) {
        var data = {};

        data.customer_id = customer.id.toString();
        data.email = customer.email;
        data.firstname = customer.first_name;
        data.middlename = "";
        data.lastname = customer.first_name;
        data.group_id = "";
        data.prefix = "";
        data.suffix = "";
        data.dob = "";

        // Other data
        /*data.accepts_marketing = customer.accepts_marketing;
         data.created_at = customer.created_at;
         data.updated_at = customer.updated_at;
         data.orders_count = customer.orders_count;
         data.state = customer.state;
         data.total_spent = customer.total_spent;
         data.last_order_id = customer.last_order_id;
         data.note =  customer.note ;
         data.verified_email = customer.verified_email;
         data.multipass_identifier = customer.multipass_identifier;
         data.tax_exempt = customer.tax_exempt;
         data.tags = customer.tags;
         data.last_order_name = customer.last_order_name;*/

        // addresses
        data.addresses = [];
        // handle in future if it is required

        return data;
    }

    //endregion

    //region Public Methods

    return {

        /**
         * Init method
         */
        initialize: function (storeInfo) {
            if (!!storeInfo) {
                ShopifyWrapper.ServerUrl = storeInfo.endpoint;
            } else if (!!ConnectorConstants && !!ConnectorConstants.CurrentStore) {
                ShopifyWrapper.ServerUrl = ConnectorConstants.CurrentStore.endpoint;
            }
        },
        RequestHeader: '',
        RequestFooter: '',

        UserName: '',
        Password: '',
        AuthHeader: '',

        ServerUrl: 'https://b388d7f6e9f8b4a83e8c3727a81e0f0b:1a17d30a1d626eece53d366ab0b2b240@f3-test-store-001.myshopify.com/admin/',

        /**
         * Gets supported Date Format
         * @returns {string}
         */
        getDateFormat: function () {
            return 'ISO';
        },

        getSessionIDFromServer: function (userName, apiKey) {
            var sessionID = 'DUMMY_SESSION_ID';

            ShopifyWrapper.UserName = userName;
            ShopifyWrapper.Password = apiKey;

            if (!!base64_encode) {
                ShopifyWrapper.AuthHeader = base64_encode(ShopifyWrapper.UserName + ':' + ShopifyWrapper.Password);
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

            var httpRequestData = {
                additionalUrl: 'orders.json?created_at_min=' + order.updateDate,
                method: 'GET'
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
                Utility.logDebug('Shopify Wrapper: serverFinalResponse', JSON.stringify(serverFinalResponse));
            } catch (e) {
                serverFinalResponse.faultCode = 'SERVER_ERROR';
                serverFinalResponse.faultString = e.toString();

                Utility.logException('Shopify Wrapper: Error during getSalesOrders', e);
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
                additionalUrl: 'orders.json?ids=' + increment_id,
                method: 'GET'
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
                //Utility.logDebug('Shopify Response of Order Details:', JSON.stringify(serverResponse));
                var orders = parseSalesOrderResponse(serverResponse.orders, true);

                if (!!orders && orders.length > 0) {
                    //Utility.logDebug('Shopify parsed Response for Order Details:', JSON.stringify(orders));
                    serverFinalResponse.customer_id = orders[0].customer_id;
                    serverFinalResponse.shippingAddress = orders[0].shippingAddress;
                    serverFinalResponse.billingAddress = orders[0].billingAddress;
                    serverFinalResponse.payment = orders[0].payment;
                    serverFinalResponse.products = orders[0].products;
                    serverFinalResponse.customer = orders[0].customer;
                } else {
                    serverFinalResponse.status = false;
                    serverFinalResponse.faultCode = "RECORD_DOES_NOT_EXIST";
                    serverFinalResponse.faultString = "Order is not found";
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
            var trackingRequest = ShopifyWrapper.createTrackingRequest(result, carrier, carrierText, tracking, sessionID);

            var responseTracking = ShopifyWrapper.validateTrackingCreateResponse(ShopifyWrapper.soapRequestToServer(trackingRequest));

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

            var httpRequestData = {
                additionalUrl: 'customers/' + customer_id + '/addresses.json',
                method: 'GET'
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

            if (!!serverResponse && serverResponse.addresses) {
                serverFinalResponse.addresses = parseCustomerAddressResponse(serverResponse.addresses);
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;
        },

        /**
         * This method create a sales order to Shopify
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
         * This method cancel the order to Shopify
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
                serverFinalResponse.error = "Error in cancelling sales order to Shopify";
            }
            return serverFinalResponse;
        },

        requiresOrderUpdateAfterCancelling: function () {
            return false;
        },

        /**
         * Create invoice / handle payment capturing in shopify
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
             * If SO is from shopify, and its SO payment method is either empty(equal to 'pending' of shopify) or
             * credit card
             */
            if (!!isSOFromOtherSystem && isSOFromOtherSystem == 'T' && (isOnlineMethod || !sOPaymentMethod)
                || (isSOFromOtherSystem != 'T')) {// (isSOFromOtherSystem != 'T') is for exporting invoice from NS to Shopify
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
         * Create refund in shopify
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
         * Calculate total amount to refund on shopify
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
         * @param shopifyProduct
         * @returns {{status: boolean, faultCode: string, faultString: string}}
         */
        updateProduct: function (product, sessionID, productId, isParent, shopifyProduct) {
            shopifyProduct.variants[0].price = product.price;
            shopifyProduct.variants[0].inventory_quantity = product.quantity;
            var httpRequestData = {
                additionalUrl: 'products/' + productId.toString() + '.json',
                method: 'PUT',
                postData: {
                    product: {
                        id: productId.toString(),
                        variants: shopifyProduct.variants
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
         * This method returns the item map between NetSuite and Shopify Wrapper
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
        },

        getCustomerList: function (customerObj) {
            var serverResponse = null;

            // Make Call and Get Data
            var serverFinalResponse = {
                status: false,
                faultCode: '',
                faultString: '',
                product: {}
            };

            var query = "";
            if (customerObj.hasOwnProperty("query") && !!customerObj.query) {
                query = customerObj.query;
            }

            var httpRequestData = {
                additionalUrl: 'customers/search.json?' + query,
                method: 'GET'
            };
            try {
                serverResponse = sendRequest(httpRequestData);
                serverFinalResponse.status = true;

            } catch (e) {
                Utility.logException('Error during getCustomerList', e);
            }

            if (!!serverResponse && serverResponse.customers) {
                serverFinalResponse.customers = parseCustomerListResponse(serverResponse.customers);
            }

            // If some problem
            if (!serverFinalResponse.status) {
                serverFinalResponse.errorMsg = serverFinalResponse.faultCode + '--' + serverFinalResponse.faultString;
            }

            return serverFinalResponse;

        },

        getCustomer: function (customerObj) {
            var customer = null;
            var email = customerObj.email;

            var query = "query=";
            query += "email:" + email;
            customerObj.query = query;

            var customerList;
            var customerListResponse = this.getCustomerList(customerObj);

            if (customerListResponse.hasOwnProperty("customers")) {
                customerList = customerListResponse.customers;
            }

            if (customerList instanceof Array && customerList.length) {
                customer = customerList[0];
            }

            return customer;
        }
    };

    //endregion

})();