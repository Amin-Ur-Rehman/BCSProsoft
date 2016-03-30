/**
 * Created by zahmed on 13-Jan-15.
 *
 * Class Name: ConnectorModels
 *
 * Description:
 * - This class is responsible for creating objects
 * -
 * Referenced By:
 * - connector_salesorder_sch.js
 * -
 * Dependency:
 * - Script Parameters:
 * -
 * - Script Id:
 *   -
 * -
 * - Deployment Id:
 *   -
 * -
 * - Scripts:
 *   -
 */

ConnectorModels = (function () {
    return {
        /**
         * Init method
         */
        initialize: function () {

        },
        /**
         * This function sets make an object from the passing arguments
         * @param {object} order
         * @param {string} invoiceNum
         * @param {object[]} products
         * @param {object[]} netsuiteMagentoProductMap
         * @param {string} CustIdInNS
         * @param {string} configuration
         * @param {object} shippingAddress
         * @param {object} billingAddress
         * @param {object} payment
         * @returns {object}
         */
        getSalesOrderObject: function (order, invoiceNum, products, netsuiteMagentoProductMap, CustIdInNS, configuration, shippingAddress, billingAddress, payment) {
            var salesOrderObject = {};

            salesOrderObject.order = order;
            salesOrderObject.invoiceNum = invoiceNum;
            salesOrderObject.products = products;
            salesOrderObject.netsuiteMagentoProductMap = netsuiteMagentoProductMap;
            salesOrderObject.netsuiteCustomerId = CustIdInNS;
            salesOrderObject.configuration = configuration;
            salesOrderObject.shippingAddress = shippingAddress;
            salesOrderObject.billingAddress = billingAddress;
            salesOrderObject.payment = payment;

            return salesOrderObject;
        },
        /**
         * Make an object array for Customer data fetching from Sales Order
         * @param {object} order
         * @return {Array}
         */
        getCustomerObject: function (order) {
            var result = [];
            var customer = {};

            // not to populate external system id in lead or customer record if this check is on
            customer._isGuestCustomer = false;
            customer.customer_id = order.customer_id;
            customer.email = order.email;
            customer.firstname = order.customer_firstname;
            customer.middlename = !!order.customer_middlename ? order.customer_middlename : ' ';
            customer.lastname = order.customer_lastname;
            customer.group_id = order.customer_group_id;
            customer.prefix = order.customer_prefix;
            customer.suffix = order.customer_suffix;
            customer.dob = order.customer_dob;
            result.push(customer);

            return result;

        },
        /**
         * Make an array of objects for address data using shipping & billing addresses
         * @param {object} shippingAddress
         * @param {object} billingAddress
         * @return {Array}
         */
        getAddressesFromOrder: function (shippingAddress, billingAddress) {
            var result = [];
            var address = {};

            address.address_id = shippingAddress.address_id;
            address.city = shippingAddress.city;
            address.country_id = shippingAddress.country_id;
            address.firstname = shippingAddress.firstname;
            address.lastname = shippingAddress.lastname;
            address.postcode = shippingAddress.zip;
            address.region = shippingAddress.region;
            address.region_id = shippingAddress.region_id;
            address.street = shippingAddress.street;
            address.telephone = shippingAddress.phone;
            address.is_default_billing = false;
            address.is_default_shipping = true;

            result[result.length] = address;

            address = {};

            address.address_id = billingAddress.address_id;
            address.city = billingAddress.city;
            address.country_id = billingAddress.country_id;
            address.firstname = billingAddress.firstname;
            address.lastname = billingAddress.lastname;
            address.postcode = billingAddress.zip;
            address.region = billingAddress.region;
            address.region_id = billingAddress.region_id;
            address.street = billingAddress.street;
            address.telephone = billingAddress.phone;
            address.is_default_billing = true;
            address.is_default_shipping = false;

            result[result.length] = address;

            return result;
        },

        addressModel: function () {
            return {
                address_id: '',
                city: '',
                country_id: '',
                firstname: '',
                lastname: '',
                postcode: '',
                region: '',
                region_id: '',
                street: '',
                telephone: '',
                is_default_billing: false,
                is_default_shipping: false,
                address1: ''
            };
        },

        customerModel: function () {
            return {
                customer_id: '',
                email: '',
                firstname: '',
                middlename: '',
                lastname: '',
                group_id: '',
                prefix: '',
                suffix: '',
                dob: ''
            };
        },

        productModel: function () {
            return {
                increment_id: '',
                product_id: 0,
                shipping_amount: 0,
                shipment_method: '',
                quantity: 0,
                fulfillment_service: '',
                fulfillment_status: null,
                gift_card: false,
                grams: 0,
                id: 0,
                price: '',
                requires_shipping: false,
                sku: '',
                taxable: true,
                title: '',
                variant_id: 0,
                variant_title: '',
                vendor: '',
                name: '',
                variant_inventory_management: null,
                properties: [],
                product_exists: false,
                fulfillable_quantity: 0,
                total_discount: '',
                tax_lines: []
            };
        },

        salesOrderModel: function () {
            return {
                increment_id: '',
                shipping_amount: 0,
                shipment_method: '',
                customer_id: '',
                email: '',
                store_id: '',
                firstname: '',
                middlename: '',
                lastname: '',
                group_id: '',
                prefix: '',
                suffix: '',
                dob: '',
                shippingAddress: ConnectorModels.addressModel(),
                billingAddress: ConnectorModels.addressModel(),
                payment: {},
                products: [],
                order_id: '',
                created_at: '',
                shipping_description: '',
                customer_firstname: '',
                customer_lastname: '',
                grandtotal: '',
                discount_amount: '',
                discount_description: '',
                customer_group_id: '',
                quote_id: '',
                customer_middlename: ''

            };
        }
    };
})();


WOOModels = (function () {
    return {
        billingAddress: function () {
            return {
                "first_name": "",
                "last_name": "",
                "company": "",
                "address_1": "",
                "address_2": "",
                "city": "",
                "state": "",
                "postcode": "",
                "country": "",
                "email": "",
                "phone": ""
            };
        },
        shippingAddress: function () {
            return {
                "first_name": "",
                "last_name": "",
                "company": "",
                "address_1": "",
                "address_2": "",
                "city": "",
                "state": "",
                "postcode": "",
                "country": ""
            };
        },
        salesOrder: function () {
            return {
                "payment_details": {},//{"method_id": "bacs", "method_title": "Direct Bank Transfer", "paid": true}
                "billing_address": this.billingAddress(),
                "shipping_address": this.shippingAddress(),
                "customer_id": 0,
                "line_items": [],//{"product_id": 546, "quantity": 2},{"product_id": 613, "quantity": 1, "variations": {"pa_color": "Black"}},
                "shipping_lines": [] //{"method_id": "flat_rate", "method_title": "Flat Rate", "total": 10}

            };
        },
        customer: function () {
            return {
                "email": "",
                "first_name": "",
                "last_name": "",
                "username": "",
                "billing_address": this.billingAddress(),
                "shipping_address": this.shippingAddress()
            };
        },
        coupon: function () {
            return {
                "code": "",
                "type": "", //{fixed_cart, percent, fixed_product and percent_product. Default is fixed_cart}
                "amount": 0,
                "individual_use": false,
                "product_ids_array": [],
                "exclude_product_ids_array": [],
                "usage_limit": null,
                "usage_limit_per_user": null,
                "limit_usage_to_x_items": null,
                "expiry_date": "",//{UTC DateTime}
                "enable_free_shipping": false,
                "product_category_ids": [],
                "exclude_product_category_ids": [],
                "exclude_sale_items": true,
                "minimum_amount": 0,
                "maximum_amount": 0,
                "customer_emails": [],
                "description": ""
            };
        }
    };
})();

ShopifyModels=(function () {
    return {
        billingAddress: function () {
            return {
                "first_name": "",
                "last_name": "",
                "company": "",
                "address1": "",
                "address2": "",
                "city": "",
                "province_code": "",
                "zip": "",
                "country_code": "",
                "phone": ""
            };
        },
        shippingAddress: function () {
            return {
                "first_name": "",
                "last_name": "",
                "company": "",
                "address1": "",
                "address2": "",
                "city": "",
                "province_code": "",
                "zip": "",
                "country_code": "",
                "phone": ""
            };
        },
        salesOrder: function () {
            return {
                "customer": {},
                "line_items": [],
                "financial_status": "",
                "email": "",
                "shipping_lines": [],
                "billing_address": this.billingAddress(),
                "shipping_address": this.shippingAddress()
            };
        },
        customer: function () {
            return {
                "email": "",
                "first_name": "",
                "last_name": "",
                "verified_email" : false,
                "addresses": []
            };
        },
        coupon: function () {
            return {
                "code": "",
                "type": "", //{fixed_cart, percent, fixed_product and percent_product. Default is fixed_cart}
                "amount": 0,
                "individual_use": false,
                "product_ids_array": [],
                "exclude_product_ids_array": [],
                "usage_limit": null,
                "usage_limit_per_user": null,
                "limit_usage_to_x_items": null,
                "expiry_date": "",//{UTC DateTime}
                "enable_free_shipping": false,
                "product_category_ids": [],
                "exclude_product_category_ids": [],
                "exclude_sale_items": true,
                "minimum_amount": 0,
                "maximum_amount": 0,
                "customer_emails": [],
                "description": ""
            };
        },
        variant: function () {
            return {
                "id": 0,
                "product_id": 0,
                "title": "",
                "sku": "",
                "position": 0,
                "grams": 0,
                "inventory_policy": "",
                "fulfillment_service": "",
                "inventory_management": "",
                "price": 0,
                "compare_at_price": null,
                "option1": "",
                "option2": null,
                "option3": null,
                "created_at": "",
                "updated_at": "",//2015-09-02T14:47:57-04:00
                "taxable": false,
                "requires_shipping": false,
                "barcode": "",
                "inventory_quantity": 0,
                "old_inventory_quantity": 0,
                "image_id": 0,
                "weight": 0,
                "weight_unit": ""
            };
        }
    };
})();