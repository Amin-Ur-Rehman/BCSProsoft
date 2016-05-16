/**
 * Created by wahajahmed on 10/13/2015.
 */

declare class Utility {
    static logDebug(title:string, description:string):void;

    static logException(title:string, exception:any):void;

    static logEmergency(title:string, description:string):void;
    
    /**
     * Check if value exist or not
     * @param str
     */
    static isBlankOrNull(str:string):boolean;
}

declare class MagentoWrapper {

}

declare class ExternalSystemWrapper {
    public initialize(storeInfo:Store):void;
    public getSessionIDFromServer(userName, apiKey);
    public getCategories(rootCategoryId:any, depth:number):any;
    public createCategory(internalCategory:Category, magentoParentCategoryId):any;
    public updateCategory(internalCategory:Category, magentoParentCategoryId, magentoCategoryId):any;
    public deleteCategory(id);
}
declare class ConnectorModels {
    static salesOrderModel():void;

    static productModel():void;
}
declare class ConnectorConstants {
    static CurrentStore:any;
    static initialize();
    static loadItemConfigRecords();
    static ExternalSystemConfig:Array<any>;
    static CurrentWrapper:ExternalSystemWrapper;
}
declare class ConnectorCommon {
    static createLogRec (recordId, requestData, recordType):any;
    static initiateEmailNotificationConfig():any;
}

declare interface BaseRecord {
    internalId?:string;
}

declare interface CategoryParentCategory extends BaseRecord {
    name: string;
}

declare interface CategoryWebsite extends BaseRecord {
    name: string;
}

declare interface Category extends BaseRecord {
    childCategories?: Array<Category>;
    parentCategory?: CategoryParentCategory;
    itemId: string;
    isInactive: boolean;
    website?: any;
    description?: any;
    excludeFromSitemap?: boolean;
    metaTagHtml?: string;
    pageTitle?: string;
    searchKeywords?: string;
    urlComponent?: string;
}

declare class MC_SYNC_CONSTANTS {
    static isValidLicense():boolean;
}

declare class F3WrapperFactory {
    static getWrapper(type:any):any;
}

declare interface NetSuiteSOAPPassport {
    email:string;
    password:string;
    account:string;
}

declare interface StoreNetSuite {
    soapPassport?:NetSuiteSOAPPassport;
}

declare interface Store {
    internalId:any;
    systemId: any;
    systemDisplayName: any;
    systemDisplayNameValue: any;
    userName: any;
    password: any;
    endpoint: any;
    entitySyncInfo: any;
    systemType: any;
    permissions: any;
    netsuite?: StoreNetSuite
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface HttpRequestData {
    additionalUrl: string;
    method: HttpMethod;
    headers?: any;
    postData?: any;
    data?: any;
}

interface KeyValue<T> {
    [s:string]: T;
}

type NetSuiteSOAPAction = "get";
