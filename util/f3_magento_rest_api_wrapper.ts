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
class MagentoRestApiWrapper extends MagentoWrapper{

    /**
     * get Sales Orders Increment Ids list
     * @param fromDate
     * @param statuses
     * @param store
     */
    public getSalesOrdersList(fromDate: string, statuses: Array<string>, store: any) {
        var result: any  = {};
        try {
            var customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;

            var dataObj: any = {};
            dataObj.fromDate = fromDate;
            dataObj.statuses = statuses;
            var requestParam = {"apiMethod": "getSalesOrderList", "data": JSON.stringify(dataObj)};
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody: string = resp.getBody();
            Utility.logDebug('getSalesOrdersList responseBody', responseBody);

            var responseBodyData: any = JSON.parse(responseBody);
            if(!!responseBodyData.status) {
                result.status = true;
                result.orders = this.getSalesOrderParsedData(responseBodyData.data.orders);
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch(ex) {
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
        result.faultCode = 'ERROR';
        result.faultString = errorMessage;
    }
    /**
     * Get Sales order parsed data
     * @param soList
     */
    private getSalesOrderParsedData(soList: any) {
        var soDataList: Array<any> = [];
        for (var i = 0; i < soList.length; i++) {
            var incrementalId: string = soList[i];
            var obj: any = {};
            obj.increment_id = incrementalId;
            soDataList.push(obj);
        }
        return soDataList;
    }

    /**
     * Assign attributes to a configurable product
     * @param productId
     * @param attributes
     * @param store
     * @returns {any}
     */
    public assignAttributesToConfigurableProduct(productId: string, attributes: Array<any>, store: any) {
        var result: any  = {};
        try {
            var customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;

            var dataObj: any = {};
            dataObj.configurable_product_id = productId;
            dataObj.products_attributes = attributes;
            var requestParam = {"apiMethod": "assignAttributesToConfigurableProduct", "data": JSON.stringify(dataObj)};
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody: string = resp.getBody();
            Utility.logDebug('assignAttributesToConfigurableProduct responseBody', responseBody);

            var responseBodyData: any = JSON.parse(responseBody);
            if(!!responseBodyData.status) {
                result.status = true;
                result.attributeAssignmentId = responseBodyData.data.assignment_id;
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch(ex) {
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
        var result: any  = {};
        try {
            var customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;

            var dataObj: any = {};
            dataObj.configurable_product_id = configProductId;
            dataObj.simple_product_id = simpleProductId;
            var requestParam = {"apiMethod": "associateProductWithConfigurableProduct", "data": JSON.stringify(dataObj)};
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody: string = resp.getBody();
            Utility.logDebug('associateProductWithConfigurableProduct responseBody', responseBody);

            var responseBodyData: any = JSON.parse(responseBody);
            if(!!responseBodyData.status) {
                result.status = true;
                result.productAssociationId = responseBodyData.data.association_id;
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch(ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }

    public reIndexProductsData(store: any) {
        var result: any  = {};
        try {
            var customRestApiUrl: string = store.entitySyncInfo.common.customRestApiUrl;
            var storeRootUrl: string = store.entitySyncInfo.item.storeRootPath;
            var dataObj: any = {};
            dataObj.store_root_path = storeRootUrl;
            var requestParam = {"apiMethod": "reindexProductsData", "data": JSON.stringify(dataObj)};
            var resp = nlapiRequestURL(customRestApiUrl, requestParam, null, 'POST');
            var responseBody: string = resp.getBody();
            Utility.logDebug('reindexProductsData responseBody', responseBody);

            var responseBodyData: any = JSON.parse(responseBody);
            if(!!responseBodyData.status) {
                result.status = true;
            } else {
                this.setErrorResponse(result, responseBodyData.message);
            }
        }
        catch(ex) {
            this.setErrorResponse(result, ex.toString());
        }
        return result;
    }
}
