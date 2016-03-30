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
            var resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
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
            var requestParam = { "apiMethod": "getProductInfo", "data": JSON.stringify(dataObj) };
            var resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
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
    /**
     * Assign attributes to a configurable product
     * @param productId
     * @param attributes
     * @param store
     * @returns {any}
     */
    MagentoRestApiWrapper.prototype.assignAttributesToConfigurableProduct = function (productId, attributes, store) {
        var result = {};
        try {
            var customRestApiUrl = store.entitySyncInfo.common.customRestApiUrl;
            var dataObj = {};
            dataObj.configurable_product_id = productId;
            dataObj.products_attributes = attributes;
            var requestParam = { "apiMethod": "assignAttributesToConfigurableProduct", "data": JSON.stringify(dataObj) };
            var resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('assignAttributesToConfigurableProduct responseBody', responseBody);
            var responseBodyData = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.attributeAssignmentId = responseBodyData.data.assignment_id;
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
     * Associate Product to configurable product
     * @param configProductId
     * @param simpleProductId
     * @param store
     * @returns {any}
     */
    MagentoRestApiWrapper.prototype.associateProductToConfigurableProduct = function (configProductId, simpleProductId, store) {
        var result = {};
        try {
            var customRestApiUrl = store.entitySyncInfo.common.customRestApiUrl;
            var dataObj = {};
            dataObj.configurable_product_id = configProductId;
            dataObj.simple_product_id = simpleProductId;
            var requestParam = {
                "apiMethod": "associateProductWithConfigurableProduct",
                "data": JSON.stringify(dataObj)
            };
            var resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('associateProductWithConfigurableProduct responseBody', responseBody);
            var responseBodyData = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.productAssociationId = responseBodyData.data.association_id;
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
    MagentoRestApiWrapper.prototype.reIndexProductsData = function (store) {
        var result = {};
        try {
            var customRestApiUrl = store.entitySyncInfo.common.customRestApiUrl;
            var storeRootUrl = store.entitySyncInfo.item.storeRootPath;
            var dataObj = {};
            dataObj.store_root_path = storeRootUrl;
            var requestParam = { "apiMethod": "reindexProductsData", "data": JSON.stringify(dataObj) };
            var resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody = resp.getBody();
            Utility.logDebug('reindexProductsData responseBody', responseBody);
            var responseBodyData = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
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
    MagentoRestApiWrapper.prototype.getConfigAttrParent = function (configurableAttributesAsArray) {
        var result = [];
        if (configurableAttributesAsArray instanceof Array) {
            for (var i in configurableAttributesAsArray) {
                var configurableAttribute = configurableAttributesAsArray[i];
                var options = [];
                var values = configurableAttribute.values;
                if (values instanceof Array) {
                    for (var v in values) {
                        var value = values[v];
                        options.push({
                            label: value.label,
                            id: value.value_index,
                            pricingValue: value.pricing_value
                        });
                    }
                }
                result.push({
                    attributeId: configurableAttribute.attribute_id,
                    attributeCode: configurableAttribute.attribute_code,
                    frontendLabel: configurableAttribute.frontend_label,
                    storeLabel: configurableAttribute.store_label,
                    options: options
                });
            }
        }
        return result;
    };
    MagentoRestApiWrapper.prototype.getConfigAttrChild = function (configurableAttributesAsArray, product) {
        var result = [];
        var configurableAttributes = configurableAttributesAsArray;
        if (configurableAttributes instanceof Array) {
            for (var i in configurableAttributes) {
                var configurableAttribute = configurableAttributes[i];
                var attributeCode = configurableAttribute.attributeCode;
                result[attributeCode] = product[attributeCode];
            }
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
        result.serverObject = product;
        result.hasParent = false;
        result.parent = {};
        if (!Utility.isBlankOrNull(product.parent)) {
            result.hasParent = true;
            result.parent.type = product.parent.type_id;
            result.parent.attributeSetId = product.parent.attribute_set_id;
            result.parent.entityId = product.parent.entity_id; // this is product id
            result.parent.name = product.parent.name;
            result.parent.description = product.parent.description;
            result.parent.sku = product.parent.sku;
            result.parent.categoryIds = product.parent.category_ids;
            result.parent.createdAt = product.parent.created_at;
            result.parent.updatedAt = product.parent.updated_at;
            result.parent.price = product.parent.price;
            result.parent.usedProductAttributeIds = product.parent.used_product_attribute_ids;
            result.parent.configurableAttributes = this.getConfigAttrParent(product.parent.configurable_attributes_as_array);
            result.parent.serverObject = product.parent;
        }
        if (result.hasParent) {
            result.configurableAttributes = this.getConfigAttrChild(result.parent.configurableAttributes, product);
        }
        if (result.type === "configurable") {
            result.configurableAttributes = this.getConfigAttrParent(product.configurable_attributes_as_array);
        }
        return result;
    };
    return MagentoRestApiWrapper;
})(MagentoWrapper);
//# sourceMappingURL=f3_magento_rest_api_wrapper.js.map