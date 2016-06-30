/**
 * Created by akumar on 5/9/2016.
 */
/**
 * Wrapper class for NetSuite SOAP API
 */
var NetSuiteSOAPWrapper = (function () {
    function NetSuiteSOAPWrapper() {
        this.xmlHeader = '';
    }
    /**
     * Method for instantiating the wrapper for given store
     *
     * @param store
     * @returns {NetSuiteSOAPWrapper}
     */
    NetSuiteSOAPWrapper.createInstanceForStore = function (store) {
        var instance = new NetSuiteSOAPWrapper();
        instance.initialize(store);
        return instance;
    };
    /**
     * Initializes the wrapper for given store,
     * setting up the xmlHeader
     *
     * @param storeInfo
     */
    NetSuiteSOAPWrapper.prototype.initialize = function (storeInfo) {
        var passport = null;
        var syncInfo = storeInfo.entitySyncInfo;
        if (syncInfo && syncInfo.netsuite) {
            passport = syncInfo.netsuite.soapPassport;
        }
        this.xmlHeader = NetSuiteSOAPWrapperUtility.getXMLHeader(passport);
        return true;
    };
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
    NetSuiteSOAPWrapper.prototype._nlapiRequestURL = function (url, postdata, headers, callback, httpMethod) {
        url = url || null;
        postdata = postdata || null;
        headers = headers || {};
        callback = callback || null;
        httpMethod = httpMethod || null;
        // this.setAuthHeaderIfNeeded(headers);
        return nlapiRequestURL(url, postdata, headers, callback, httpMethod);
    };
    /**
     * Sends soap request for given XML string and action,
     * and returns response Node
     *
     * @param xml
     * @param action
     * @returns {Node}
     */
    NetSuiteSOAPWrapper.prototype.soapRequestToServer = function (xml, action) {
        var NETSUITE_SOAP_API_URL = NetSuiteSOAPConstants.NETSUITE_SOAP_API_URL;
        var headers = {
            "SOAPAction": action
        };
        var res = this._nlapiRequestURL(NETSUITE_SOAP_API_URL, xml, headers);
        var body = res.getBody();
        // Utility.logDebug('requestbody', xml);
        // Utility.logDebug('responsetbody', body);
        var responseXML = nlapiStringToXML(body);
        return responseXML;
    };
    /**
     * Sends SOAP request for given request XML string
     * for "get" soap action, and returns response Node
     *
     * @param xml
     * @returns {Node}
     */
    NetSuiteSOAPWrapper.prototype.get = function (xml) {
        return this.soapRequestToServer(xml, "get");
    };
    /**
     * Returns XML string for requesting site categories
     *
     * @param id
     * @returns {string}
     */
    NetSuiteSOAPWrapper.prototype.getSiteCategoryRequestXML = function (id) {
        Utility.logDebug('NetSuiteSOAPWrapper.getSiteCategoryRequestXML', id);
        NetSuiteSOAPConstants;
        var xml = NetSuiteSOAPConstants.xmlDocOpening +
            this.xmlHeader +
            '<soapenv:Body>' +
            '<urn:get>' +
            '<urn:baseRef ' +
            NetSuiteSOAPConstants.xmlAttribute.xmlns_xsi +
            NetSuiteSOAPConstants.xmlAttribute.xsi_type.RecordRef +
            NetSuiteSOAPConstants.xmlAttribute.type.siteCategory +
            NetSuiteSOAPConstants.xmlAttribute.internalId(id) +
            '>' +
            '</urn:baseRef>' +
            '</urn:get>' +
            '</soapenv:Body>' +
            NetSuiteSOAPConstants.xmlDocClosing;
        return xml;
    };
    /**
     * Returns site category with given id
     *
     * @param id
     * @returns {any}
     */
    NetSuiteSOAPWrapper.prototype.getCategory = function (id) {
        var xml = this.get(this.getSiteCategoryRequestXML(id));
        var xmlRecord = nlapiSelectNode(xml, '//*[name()="record"]');
        return NetSuiteSOAPWrapperUtility.xmlRecordToJSON(xmlRecord);
    };
    /**
     * Returns all array of all site categories flattened
     *
     * @returns {Array}
     */
    NetSuiteSOAPWrapper.prototype.getCategoriesArray = function () {
        var recs = nlapiSearchRecord('sitecategory');
        var recsCount = recs.length;
        var records = [];
        for (var i = 0; i < recsCount; ++i) {
            var rec = recs[i];
            try {
                var record = this.getCategory(rec.getId());
                records.push(record);
                record.childCategories = [];
            }
            catch (e) {
                Utility.logDebug('Failed category', JSON.stringify(e));
            }
        }
        return records;
    };
    /**
     * Returns Object for all site categories
     * with key being internalId and value being category itself
     *
     * @returns {any}
     */
    NetSuiteSOAPWrapper.prototype.getCategories = function () {
        return NetSuiteSOAPWrapperUtility.getCategoriesObject(this.getCategoriesArray());
    };
    /**
     * Returns array of trees of root categories,
     * i.e. each category includes its child categories
     *
     * @returns {Array}
     */
    NetSuiteSOAPWrapper.prototype.getTopCategoriesWithTree = function () {
        var categories = this.getCategories();
        var topCategories = [];
        for (var id in categories) {
            var category = categories[id];
            var parentCategoryId = category.parentCategory ? category.parentCategory.internalId : null;
            if (parentCategoryId) {
                var parentCategory = categories[parentCategoryId];
                parentCategory &&
                    parentCategory.childCategories.push(category);
            }
            else {
                topCategories.push(category);
            }
        }
        return topCategories;
    };
    return NetSuiteSOAPWrapper;
}());
/**
 * Provides utility functions for NetSuiteSOAPWrapper class
 */
var NetSuiteSOAPWrapperUtility = (function () {
    function NetSuiteSOAPWrapperUtility() {
    }
    /**
     * Returns Object with key being internal and value Category
     * for given categories
     *
     * @param categories
     * @returns {KeyValue<Category>}
     */
    NetSuiteSOAPWrapperUtility.getCategoriesObject = function (categories) {
        var categoriesObject = {};
        for (var i = categories.length - 1; i >= 0; --i) {
            var category = categories[i];
            categoriesObject[category.internalId] = category;
        }
        return categoriesObject;
    };
    NetSuiteSOAPWrapperUtility.getXMLHeader = function (soapPassport) {
        var passport = soapPassport || {
            email: '',
            password: '',
            account: ''
        };
        return '<soapenv:Header>' +
            '<urn:preferences/>' +
            '<urn:partnerInfo/>' +
            '<urn:applicationInfo/>' +
            '<urn:passport>' +
            '<urn1:email>' + passport.email + '</urn1:email>' +
            '<urn1:password>' + passport.password + '</urn1:password>' +
            '<urn1:account>' + passport.account + '</urn1:account>' +
            '</urn:passport>' +
            '</soapenv:Header>';
    };
    /**
     * Parses given XML record node to JSON and returns it
     *
     * @param xmlRecord
     * @returns {any}
     */
    NetSuiteSOAPWrapperUtility.xmlRecordToJSON = function (xmlRecord) {
        var nodes = nlapiSelectNodes(xmlRecord, '*');
        if (nodes.length) {
            var obj;
            var isArray = (xmlRecord.localName.substr(-4).toLowerCase() == "list");
            if (isArray) {
                obj = [];
            }
            else {
                obj = {};
            }
            for (var i = nodes.length - 1; i >= 0; --i) {
                var node = nodes[i];
                var res = this.xmlRecordToJSON(node);
                var name = node.localName;
                if (isArray) {
                    obj.push(res);
                }
                else {
                    obj[name] = res;
                }
            }
            var attrs = nlapiSelectNodes(xmlRecord, '@*');
            for (var i = attrs.length - 1; i >= 0; --i) {
                var attr = attrs[i];
                if (attr.prefix != "xmlns") {
                    obj[attr.localName] = attr.nodeValue;
                }
            }
            return obj;
        }
        var value = xmlRecord.textContent; //nlapiSelectValue(xmlRecord,'../*[name()="'+xmlRecord.tagName+'"]');
        return value == "true" ? true : value == "false" ? false : value;
    };
    return NetSuiteSOAPWrapperUtility;
}());
/**
 * Constants for NetSuite SOAP API
 */
var NetSuiteSOAPConstants = (function () {
    function NetSuiteSOAPConstants() {
    }
    NetSuiteSOAPConstants.NETSUITE_SOAP_API_URL = "https://webservices.netsuite.com/services/NetSuitePort_2015_1";
    NetSuiteSOAPConstants.xmlDocOpening = '<?xml version="1.0"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:messages_2015_1.platform.webservices.netsuite.com" xmlns:urn1="urn:core_2015_1.platform.webservices.netsuite.com">';
    NetSuiteSOAPConstants.xmlDocClosing = '</soapenv:Envelope>';
    NetSuiteSOAPConstants.xmlAttribute = {
        xsi_type: {
            RecordRef: ' xsi:type="urn1:RecordRef" '
        },
        xmlns_xsi: ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ',
        type: {
            siteCategory: ' type="siteCategory" '
        },
        internalId: function (id) {
            return ' internalId="' + id + '" ';
        }
    };
    return NetSuiteSOAPConstants;
}());
//# sourceMappingURL=f3_netsuite_soap_wrapper.js.map