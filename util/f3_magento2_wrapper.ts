/**
 * Created by zahmed on 28-Mar-16.
 *
 * Class Name: Magento2Wrapper
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
 * Wrapper class for Magento2 REST API
 */
class Magento2Wrapper {
    private serverUrl = '';
    private username = '';
    private password = '';
    private token = '';

    /**
     * Initializes the wrapper for given store,
     * setting up server url
     *
     * @param storeInfo
     */
    public initialize(storeInfo:Store):void {
        if (!!storeInfo) {
            this.serverUrl = storeInfo.endpoint;
        } else if (!!ConnectorConstants && !!ConnectorConstants.CurrentStore) {
            this.serverUrl = ConnectorConstants.CurrentStore.endpoint;
        }
    }

    /**
     * Wrapper method for send nlapiRequestURL
     *
     * @param url
     * @param postdata
     * @param headers
     * @param callback
     * @param httpMethod
     * @returns {nlobjResponse}
     * @private
     */
    private _nlapiRequestURL (url : string, postdata? : any , headers? : any, callback? : any, httpMethod? : HttpMethod) {
        url = url || null;
        postdata = postdata || null;
        headers = headers || {};
        callback = callback || null;
        httpMethod = httpMethod || null;

        // this.setAuthHeaderIfNeeded(headers);

        return nlapiRequestURL(url, postdata, headers, callback, httpMethod);
    }

    /**
     * Method for sending request to Magento2 REST API
     *
     * @param httpRequestData
     * @returns {any}
     */
    private sendRequest(httpRequestData:HttpRequestData):void {
        var finalUrl = this.serverUrl + httpRequestData.additionalUrl;
        Utility.logDebug('Request final = ', finalUrl);
        var res = null;
        if (!httpRequestData.headers) {
            httpRequestData.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this.token // this.Password
            };
        }

        // Utility.logDebug('httpRequestData = ', JSON.stringify(httpRequestData));
        if (httpRequestData.method === 'GET') {
            res = this._nlapiRequestURL(finalUrl, null, httpRequestData.headers);
        }
        else {
            var postDataString =  httpRequestData.postData && typeof httpRequestData.postData === "object" ?
                JSON.stringify(httpRequestData.postData) : httpRequestData.postData;
            res = this._nlapiRequestURL(finalUrl, postDataString, httpRequestData.headers, null, httpRequestData.method);
        }

        var body = res.getBody();
        // Utility.logDebug('Magento2 Response Body', body);

        return JSON.parse(body);
    }

    /**
     * Sets up credential
     *
     * @param userName
     * @param apiKey
     * @returns {string}
     */
    public getSessionIDFromServer(userName, apiKey) {
        var sessionID = 'DUMMY_SESSION_ID';

        this.username = userName;
        this.password = apiKey;
        this.token = apiKey;

        return sessionID;
    }

    /**
     * Creates of updates the category and returns category id
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @param magentoCategoryId
     * @returns {string|any|number}
     */
    private createOrUpdateCategory(internalCategory:Category, magentoParentCategoryId, magentoCategoryId?):any {
        var response;

        var magentoCategory = Magento2WrapperUtility.getMagentoCategory(internalCategory, magentoParentCategoryId);
        if (magentoCategory.id) magentoCategory.id = magentoCategoryId;
        var httpRequestData:HttpRequestData = {
            additionalUrl: 'categories',
            method: 'POST',
            postData: {"category":  magentoCategory}
        };

        response = this.sendRequest(httpRequestData);

        return response.id;
    }

    /**
     * Returns categories from category with
     * given categoryId till given depth
     *
     * @param categoryId
     * @param depth
     */
    public getCategories(categoryId, depth) {
        return this.sendRequest({
            additionalUrl: 'categories?rootCategoryId=' + categoryId + '&depth=' + depth,
            method: 'GET'
        });
    }

    /**
     * Creates category for given params
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @returns {any}
     */
    public createCategory(internalCategory:Category, magentoParentCategoryId):any {
        return this.createOrUpdateCategory(internalCategory, magentoParentCategoryId);
    }

    /**
     * Updates category for given params
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @param magentoCategoryId
     * @returns {any}
     */
    public updateCategory(internalCategory:Category, magentoParentCategoryId, magentoCategoryId):any {
        return this.createOrUpdateCategory(internalCategory, magentoParentCategoryId, magentoCategoryId);
    }

    /**
     * Deletes category for given id
     *
     * @param id
     */
    public deleteCategory(id) {
        return this.sendRequest({
            method: "DELETE",
            additionalUrl: "categories/"+id
        });
    }

    /**
     * Deletes categories within (inclusive) given category id range
     *
     * @param startId
     * @param endId
     */
    public deleteCategoriesInRange(startId, endId) {
        for (var i = startId; i <= endId; ++i) {
            this.deleteCategory(i);
        }
    }

    /**
     * Deletes categories with given category ids
     * @param ids
     */
    public deleteCategoriesWithIds(ids) {
        for (var i = ids.length - 1; i >= 0; --i) {
            this.deleteCategory(ids[i]);
        }
    }
}

/**
 * Interface for each of custom_attribute item
 */
interface Magento2CustomAttribute {
    attribute_code:string;
    value;
}

/**
 * Key value interface to help create custom_attributes
 */
interface Magento2CustomAttributeValues {
    description?;
    meta_title?;
    meta_keywords?;
    meta_description?;
    display_mode?;
    is_anchor?;
    path?;
    children_count?;
    custom_use_parent_settings?;
    custom_apply_to_products?;
    url_key?;
    url_path?;
}

/**
 * Interface for category in Magento2
 */
interface Magento2Category {
    id?;
    parent_id;
    name: string;
    is_active: boolean;
    position?;
    level?;
    children?:string;
    created_at?:string;
    updated_at?:string;
    path?:string;
    available_sort_by?:Array<any>;
    include_in_menu?: boolean;
    extension_attributes?:any;
    custom_attributes?: Array<Magento2CustomAttribute>;
}

/**
 * Provides utility functions for Magento2Wrapper class
 */
class Magento2WrapperUtility {
    /**
     * Returns Magento2CustomAttribute object for given params
     *
     * @param attributeCode
     * @param value
     * @returns {{attribute_code: string, value: any}}
     */
    static getCustomAttribute(attributeCode:string,value):Magento2CustomAttribute {
        return {
            attribute_code: attributeCode,
            value: value
        }
    }

    /**
     * Returns Array of Magento2CustomAttributes for given key value dictionary
     *
     * @param dictionary
     * @returns {Array<Magento2CustomAttribute>}
     */
    static getCustomAttributes(dictionary:Magento2CustomAttributeValues):Array<Magento2CustomAttribute> {
        var customAttributes:Array<Magento2CustomAttribute> = [];

        for (var attrKey in dictionary) {
            var attrValue = dictionary[attrKey];
            if (attrValue || typeof (attrValue) != "undefined") {
                customAttributes.push(this.getCustomAttribute(attrKey, attrValue));
            }
        }

        return customAttributes;
    }

    /**
     * Returns Magento2Category equivalent of internal Category
     * for given parameters
     *
     * @param internalCategory
     * @param magentoParentCategoryId
     * @param magentoCategoryId
     * @returns {Magento2Category}
     */
    static getMagentoCategory(internalCategory: Category, magentoParentCategoryId, magentoCategoryId?):Magento2Category {
        var customAttributes = this.getCustomAttributes({
            description: internalCategory.description,
            meta_title: internalCategory.pageTitle,
            meta_description: internalCategory.metaTagHtml,
            meta_keywords: internalCategory.searchKeywords,
            url_key: internalCategory.urlComponent // TODO: set a unique key if not existing
        });

        var magentoCategory:Magento2Category = {
            include_in_menu: !internalCategory.excludeFromSitemap,
            parent_id: magentoParentCategoryId || 1,
            name: internalCategory.itemId,
            // TODO: set the actual value for is_active when Magento2 API allows updating inactive category
            is_active: true, //!internalCategory.isInactive,
            custom_attributes: customAttributes
        };

        if (magentoCategoryId) magentoCategory.id = magentoCategoryId;

        return magentoCategory;
    }
}
