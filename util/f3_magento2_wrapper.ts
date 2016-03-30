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

interface HttpRequestData {
    additionalUrl: string;
    method: string;
    headers?: any;
    postData?: any;
    data?: any;
}

class Magento2Wrapper {
    private  ServerUrl = '';
    private  UserName = '';
    private  Password = '';

    constructor() {
    }

    private sendRequest(httpRequestData:HttpRequestData):void {
        var finalUrl = this.ServerUrl + httpRequestData.additionalUrl;

        Utility.logDebug('Request final = ', finalUrl);
        var res = null;

        if (!httpRequestData.headers) {
            httpRequestData.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this.Password
            };
        }

        Utility.logDebug('httpRequestData = ', JSON.stringify(httpRequestData));

        if (httpRequestData.method === 'GET') {
            res = nlapiRequestURL(finalUrl, null, httpRequestData.headers);
        } else {
            var postDataString = typeof httpRequestData.postData === "object" ?
                JSON.stringify(httpRequestData.postData) : httpRequestData.postData;

            res = nlapiRequestURL(finalUrl, postDataString, httpRequestData.headers, httpRequestData.method);
        }

        var body = res.getBody();
        Utility.logDebug('Magento2 Response Body', body);
        return eval('(' + body + ')');
    }

    /**
     * Init method
     * @param storeInfo
     */
    public initialize(storeInfo:any):void {
        if (!!storeInfo) {
            this.ServerUrl = storeInfo.endpoint;
        } else if (!!ConnectorConstants && !!ConnectorConstants.CurrentStore) {
            this.ServerUrl = ConnectorConstants.CurrentStore.endpoint;
        }
    }

    /**
     * Gets supported Date Format
     * @returns {string}
     */
    public getDateFormat() {
        return 'ISO';
    }

    public getSessionIDFromServer(userName, apiKey) {
        var sessionID = 'DUMMY_SESSION_ID';

        this.UserName = userName;
        this.Password = apiKey;

        return sessionID;
    }

    public getSalesOrders(filters:any):any {
        return this.test("11");
    }

    public test(id:string) {
        var serverResponse;
        var httpRequestData:HttpRequestData = {
            additionalUrl: 'orders/' + id,
            method: 'GET',
            data: {}
        };
        serverResponse = this.sendRequest(httpRequestData);

        return serverResponse;
    }
}