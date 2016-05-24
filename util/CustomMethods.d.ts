/**
 * Created by wahajahmed on 10/13/2015.
 */

declare class Utility {
    public static logDebug(title: string, description: string): void;

    public static logException(title: string, exception: any): void;

    static logEmergency(title:string, description:string):void;
    
    /**
     * Check if value exist or not
     * @param str
     */
    public static isBlankOrNull(str: string): boolean;
}

declare class MagentoWrapper {
    public static _nlapiRequestURL(url: any, postdata?: any, headers?: any, callback?: any, httpMethod?: any): any;
}

declare class ExternalSystemWrapper {
    public initialize(storeInfo:Store):void;
    public getSessionIDFromServer(userName, apiKey);
    public getCategories(rootCategoryId:any, depth:number):any;
    public createCategory(internalCategory:Category, magentoParentCategoryId):any;
    public updateCategory(internalCategory:Category, magentoParentCategoryId, magentoCategoryId):any;
    public deleteCategory(id);
    public getDateFormat();
    public getSalesOrders(filters: any, sessionId?: string):any;
    public getSalesOrderInfo(incrementId: number|string, sessionId?: string): any;
    public getNsProductIdsByExtSysIds(magentoIds: Array<any>, enviornment: any): any;
    public createInvoice(sessionId: string, netsuiteInvoiceObj: any, store: any): any;
}

declare class ConnectorModels {
    public static salesOrderModel(): void;

    public static productModel(): void;
}

declare class ConnectorConstants {
    public static CurrentStore: any;
    public static Item: any;
    public static ScrubsList: any;
    public static Transaction: any;

    public static initializeScrubList(): void;
    static initialize();
    static loadItemConfigRecords();
    static ExternalSystemConfig:Array<any>;
    static CurrentWrapper:ExternalSystemWrapper;
}

declare class ConnectorCommon {
    static createLogRec (recordId, requestData, recordType):any;
    static initiateEmailNotificationConfig():any;
}

declare class FC_ScrubHandler {
    public static findValue(system: any, type: any, key: any): any;
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

declare interface StoreEntitySyncInfoCommon {
    emailFrom?:any;
    emailTo?:any;
    logInCustomRecord?:any;
    sendEmail?:any;
    landingUrls?:any;
    customRestApiUrl:any;
}
declare interface StoreEntitySyncInfo {
    salesorder?:any;
    customer?:any;
    cashrefund?:any;
    item?:any;
    promotioncode?:any;
    giftcertificateitem?:any;
    magentoCustomizedApiUrl?:any;
    IdentifierType?:any;
    common?:StoreEntitySyncInfoCommon;
    authorization?:any;
    netsuite?:StoreNetSuite;
}

declare interface Store {
    internalId:any;
    systemId: any;
    systemDisplayName: any;
    systemDisplayNameValue: any;
    userName: any;
    password: any;
    endpoint: any;
    entitySyncInfo: StoreEntitySyncInfo;
    systemType: any;
    permissions: any;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Interface of Request Data Object Object in Magento2
 */
interface HttpRequestData {
    accessToken?: string;
    additionalUrl: string;
    method: HttpMethod;
    headers?: any;
    postData?: any;
    data?: any;
}

interface KeyValue<T> {
    [s:string]: T;
}
