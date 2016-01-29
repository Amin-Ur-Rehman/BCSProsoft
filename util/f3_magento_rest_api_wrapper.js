/**
 * Created by wahajahmed on 10/13/2015.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// Declaration of all NetSuite SuiteScript 1.0 APIs
/// <reference path="../util/SuiteScriptAPITS.d.ts" />
// Declaration of Existing Custom Libraries methods
/// <reference path="../util/CustomMethods.d.ts" />
/**
 * Wrapper class for magento custom rest api
 */
var MagentoRestApiWrapper = (function (_super) {
    __extends(MagentoRestApiWrapper, _super);
    function MagentoRestApiWrapper() {
        _super.apply(this, arguments);
    }
    /**
     * get Sales Orders Increment Ids list
     * @param fromDate
     * @param statuses
     * @param store
     */
    MagentoRestApiWrapper.prototype.getSalesOrdersList = function (fromDate, statuses, store) {
        var result = {};
        try {
            var customRestApiUrl = store.entitySyncInfo.common.customRestApiUrl;
            var dataObj = {};
            dataObj.fromDate = fromDate;
            dataObj.statuses = statuses;
            var requestParam = { "apiMethod": "getSalesOrderList", "data": JSON.stringify(dataObj) };
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('getSalesOrdersList responseBody', responseBody);
            var responseBodyData = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.orders = this.getSalesOrderParsedData(responseBodyData.data.orders);
            }
            else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    };
    MagentoRestApiWrapper.prototype.getItemInfo = function (productType, productId, identifierType, store) {
        var result = {};
        try {
            var customRestApiUrl = store.entitySyncInfo.common.customRestApiUrl;
            var dataObj = {};
            dataObj.productType = productType;
            dataObj.productId = productId;
            dataObj.identifierType = identifierType;
            var requestParam = { "apiMethod": "getItemInfo", "data": JSON.stringify(dataObj) };
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('getItemInfo responseBody', responseBody);
            var responseBodyData = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.product = this.getItemInfoParsedData(responseBodyData.data.product);
            }
            else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    };
    /**
     * Error message response
     * @param result
     * @param errorMessage
     */
    MagentoRestApiWrapper.prototype.setErrorResponse = function (result, errorMessage) {
        result.status = false;
        result.faultCode = 'ERROR';
        result.faultString = errorMessage;
    };
    /**
     * Get Sales order parsed data
     * @param soList
     */
    MagentoRestApiWrapper.prototype.getSalesOrderParsedData = function (soList) {
        var soDataList = [];
        for (var i = 0; i < soList.length; i++) {
            var incrementalId = soList[i];
            var obj = {};
            obj.increment_id = incrementalId;
            soDataList.push(obj);
        }
        return soDataList;
    };
    MagentoRestApiWrapper.prototype.getTierPrices = function (tierPrices) {
        var result = [];
        for (var i in tierPrices) {
            var tierPrice = tierPrices[i];
            result.push({
                priceQty: tierPrice.price_qty,
                price: tierPrice.price
            });
        }
        return result;
    };
    MagentoRestApiWrapper.prototype.getItemInfoParsedData = function (product) {
        var result = {};
        result.type = product.type_id;
        result.attributeSetId = product.attribute_set_id;
        result.entityId = product.entity_id; // this is product id
        result.name = product.name;
        result.description = product.description;
        result.sku = product.sku;
        result.categoryIds = product.category_ids;
        result.createdAt = product.created_at;
        result.updatedAt = product.updated_at;
        result.price = product.price;
        result.tierPrices = this.getTierPrices(product.tier_price);
        result.configurableAttributes = [];
        result.hasParent = false;
        result.parent = {};
        if (!Utility.isBlankOrNull(product.parent)) {
            result.hasParent = true;
            result.parent.type = product.type_id;
            result.parent.attributeSetId = product.attribute_set_id;
            result.parent.entityId = product.entity_id; // this is product id
            result.parent.name = product.name;
            result.parent.description = product.description;
            result.parent.sku = product.sku;
            result.parent.categoryIds = product.category_ids;
            result.parent.createdAt = product.created_at;
            result.parent.updatedAt = product.updated_at;
            result.parent.price = product.price;
            result.parent.usedProductAttributeIds = product.used_product_attribute_ids;
            result.parent.configurableAttributes = [];
            var configurableAttributes = result.parent.configurable_attributes_as_array;
            if (configurableAttributes instanceof Array) {
                for (var i in configurableAttributes) {
                    var configurableAttribute = configurableAttributes[i];
                    var options = [];
                    var values = configurableAttribute.values;
                    if (values instanceof Array) {
                        for (var v in values) {
                            var value = values[v];
                            options.push({
                                label: value.label,
                                id: value.value_id,
                                pricingValue: value.pricing_value
                            });
                        }
                    }
                    result.parent.configurableAttributes.push({
                        attributeId: configurableAttribute.attribute_id,
                        attributeCode: configurableAttribute.attribute_code,
                        frontendLabel: configurableAttribute.frontend_label,
                        storeLabel: configurableAttribute.store_label,
                        options: options
                    });
                }
            }
        }
        if (result.hasParent) {
            var configurableAttributes = result.parent.configurableAttributes;
            if (configurableAttributes instanceof Array) {
                for (var i in configurableAttributes) {
                    var configurableAttribute = configurableAttributes[i];
                    var attributeCode = configurableAttribute.attributeCode;
                    result.configurableAttributes[attributeCode] = product[attributeCode];
                }
            }
        }
        return result;
    };
    return MagentoRestApiWrapper;
})(MagentoWrapper);
//# sourceMappingURL=f3_magento_rest_api_wrapper.js.map