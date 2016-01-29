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
    public getSalesOrdersList(fromDate:string, statuses:Array<string>, store:any) {
        var result:any = {};
        try {
            var customRestApiUrl:string = store.entitySyncInfo.common.customRestApiUrl;

            var dataObj:any = {};
            dataObj.fromDate = fromDate;
            dataObj.statuses = statuses;
            var requestParam = {"apiMethod": "getSalesOrderList", "data": JSON.stringify(dataObj)};
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody:string = resp.getBody();
            Utility.logDebug('getSalesOrdersList responseBody', responseBody);

            var responseBodyData:any = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.orders = this.getSalesOrderParsedData(responseBodyData.data.orders);
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    public getItemInfo(productType:string, productId:string, identifierType:string, store:any) {
        var result:any = {};
        try {
            var customRestApiUrl:string = store.entitySyncInfo.common.customRestApiUrl;
            var dataObj:any = {};
            dataObj.productType = productType;
            dataObj.productId = productId;
            dataObj.identifierType = identifierType;
            var requestParam = {"apiMethod": "getItemInfo", "data": JSON.stringify(dataObj)};
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody:string = resp.getBody();
            Utility.logDebug('getItemInfo responseBody', responseBody);

            var responseBodyData:any = JSON.parse(responseBody);
            if (!!responseBodyData.status) {
                result.status = true;
                result.product = this.getItemInfoParsedData(responseBodyData.data.product);
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch (ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    /**
     * Error message response
     * @param result
     * @param errorMessage
     */
    private setErrorResponse(result:any, errorMessage:string) {
        result.status = false;
        result.faultCode = 'ERROR';
        result.faultString = errorMessage;
    }

    /**
     * Get Sales order parsed data
     * @param soList
     */
    private getSalesOrderParsedData(soList:any) {
        var soDataList:Array<any> = [];
        for (var i = 0; i < soList.length; i++) {
            var incrementalId:string = soList[i];
            var obj:any = {};
            obj.increment_id = incrementalId;
            soDataList.push(obj);
        }
        return soDataList;
    }

    private getTierPrices(tierPrices:Array<any>) {
        var result:Array<any> = [];

        for (var i in tierPrices) {
            var tierPrice = tierPrices[i];
            result.push({
                priceQty: tierPrice.price_qty,
                price: tierPrice.price,
            });
        }
        return result;
    }

    private getItemInfoParsedData(product:any):any {
        var result:any = {};

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
                                pricingValue: value.pricing_value,
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

        if(result.hasParent) {
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
    }
}
