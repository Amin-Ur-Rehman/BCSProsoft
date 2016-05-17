/**
 * Created by wahajahmed on 10/13/2015.
 */

// Declaration of all NetSuite SuiteScript 1.0 APIs
/// <reference path="../util/SuiteScriptAPITS.d.ts" />

// Declaration of Existing Custom Libraries methods
/// <reference path="../util/CustomMethods.d.ts" />

/**
 * Wrapper class for magento custom rest api
 */
class MagentoRestApiWrapper extends MagentoWrapper {

    /**
     * get Sales Orders Increment Ids list
     * @param fromDate
     * @param statuses
     * @param store
     */
    public getSalesOrdersList(fromDate: string, statuses: Array<string>, store: any) {
        let result: any = {};
        try {
            let customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;

            let dataObj: any = {};
            dataObj.fromDate = fromDate;
            dataObj.statuses = statuses;
            let requestParam = {"apiMethod": "getSalesOrderList", "data": JSON.stringify(dataObj)};
            let resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, "POST");
            let responseBody: string = resp.getBody();
            Utility.logDebug("getSalesOrdersList responseBody", responseBody);

            let responseBodyData: any = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.orders = this.getSalesOrderParsedData(responseBodyData.data.orders);
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        } catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    public getItemInfo(productType: string, productId: string, identifierType: string, store: any) {
        let result: any = {};
        try {
            let customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;
            let dataObj: any = {};
            dataObj.productType = productType;
            dataObj.productId = productId;
            dataObj.identifierType = identifierType;
            let requestParam = {"apiMethod": "getProductInfo", "data": JSON.stringify(dataObj)};
            let resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, "POST");
            let responseBody: string = resp.getBody();
            Utility.logDebug("getItemInfo responseBody", responseBody);

            let responseBodyData: any = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.product = this.getItemInfoParsedData(responseBodyData.data.product);
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        } catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    /**
     * Assign attributes to a configurable product
     * @param productId
     * @param attributes
     * @param store
     * @returns {any}
     */
    public assignAttributesToConfigurableProduct(productId: string, attributes: Array<any>, store: any) {
        let result: any = {};
        try {
            let customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;

            let dataObj: any = {};
            dataObj.configurable_product_id = productId;
            dataObj.products_attributes = attributes;
            let requestParam = {"apiMethod": "assignAttributesToConfigurableProduct", "data": JSON.stringify(dataObj)};
            let resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, "POST");
            let responseBody: string = resp.getBody();
            Utility.logDebug("assignAttributesToConfigurableProduct responseBody", responseBody);

            let responseBodyData: any = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.attributeAssignmentId = responseBodyData.data.assignment_id;
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        } catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    /**
     * Associate Product to configurable product
     * @param configProductId
     * @param simpleProductId
     * @param store
     * @returns {any}
     */
    public associateProductToConfigurableProduct(configProductId: string, simpleProductId: string, store: any) {
        let result: any = {};
        try {
            let customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;

            let dataObj: any = {};
            dataObj.configurable_product_id = configProductId;
            dataObj.simple_product_id = simpleProductId;
            let requestParam = {
                "apiMethod": "associateProductWithConfigurableProduct",
                "data": JSON.stringify(dataObj)
            };
            let resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, "POST");
            let responseBody: string = resp.getBody();
            Utility.logDebug("associateProductWithConfigurableProduct responseBody", responseBody);

            let responseBodyData: any = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.productAssociationId = responseBodyData.data.association_id;
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        } catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    public reIndexProductsData(store: any) {
        let result: any = {};
        try {
            let customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;
            let storeRootUrl: string = store.entitySyncInfo.item.storeRootPath;
            let dataObj: any = {};
            dataObj.store_root_path = storeRootUrl;
            let requestParam = {"apiMethod": "reindexProductsData", "data": JSON.stringify(dataObj)};
            let resp = MagentoWrapper._nlapiRequestURL(customRestApiUrl, requestParam, null, "POST");
            let responseBody: string = resp.getBody();
            Utility.logDebug("reindexProductsData responseBody", responseBody);

            let responseBodyData: any = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        } catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    /**
     * Error message response
     * @param result
     * @param errorMessage
     */
    private setErrorResponse(result: any, errorMessage: string) {
        result.status = false;
        result.faultCode = "ERROR";
        result.faultString = errorMessage;
    }

    /**
     * Get Sales order parsed data
     * @param soList
     */
    private getSalesOrderParsedData(soList: any) {
        let soDataList: Array<any> = [];
        for (let i = 0; i < soList.length; i++) {
            let incrementalId: string = soList[i];
            let obj: any = {};
            obj.increment_id = incrementalId;
            soDataList.push(obj);
        }
        return soDataList;
    }

    private getTierPrices(tierPrices: Array<any>) {
        let result: Array<any> = [];

        tierPrices.forEach(tierPrice => {
            result.push({
                price: tierPrice.price,
                priceQty: tierPrice.price_qty,
            });
        });

        return result;
    }

    private getConfigAttrParent(configurableAttributesAsArray: Array<any>) {
        let result: any = [];
        if (configurableAttributesAsArray instanceof Array) {
            configurableAttributesAsArray.forEach(configurableAttribute => {
                let options = [];
                let values: Array<any> = configurableAttribute.values;
                if (values instanceof Array) {
                    values.forEach(value => {
                        options.push({
                            id: value.value_index,
                            label: value.label,
                            pricingValue: value.pricing_value,
                        });
                    });
                }

                result.push({
                    attributeCode: configurableAttribute.attribute_code,
                    attributeId: configurableAttribute.attribute_id,
                    frontendLabel: configurableAttribute.frontend_label,
                    options: options,
                    storeLabel: configurableAttribute.store_label
                });

            });
        }

        return result;
    }

    private getConfigAttrChild(configurableAttributesAsArray: any, product: any) {
        let result: any = [];

        let configurableAttributes: Array<any> = configurableAttributesAsArray;
        if (configurableAttributes instanceof Array) {
            configurableAttributes.forEach(configurableAttribute => {
                let attributeCode = configurableAttribute.attributeCode;
                result[attributeCode] = product[attributeCode];
            });
        }

        return result;
    }

    private getItemInfoParsedData(product: any): any {
        let result: any = {};

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
    }
}
