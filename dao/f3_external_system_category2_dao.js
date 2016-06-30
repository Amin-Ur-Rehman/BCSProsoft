/**
 * Created by akumar on 5/10/2016.
 */
// Declaration of all NetSuite SuiteScript 1.0 APIs
/// <reference path="../util/SuiteScriptAPITS.d.ts" />
// Declaration of Existing Custom Libraries methods
/// <reference path="../util/CustomMethods.d.ts" />
var ExternalSystemCategory2Dao = (function () {
    function ExternalSystemCategory2Dao() {
    }
    /**
     * Perform a record search using filters and columns.
     *
     * @param filters
     * @returns {Array}
     */
    ExternalSystemCategory2Dao.lookup = function (filters) {
        var result = [];
        try {
            var cols = [];
            var fils = filters || [];
            for (var i in ExternalSystemCategory2Dao.FieldName) {
                var col = new nlobjSearchColumn(ExternalSystemCategory2Dao.FieldName[i], null, null);
                cols.push(col);
            }
            result = nlapiSearchRecord(ExternalSystemCategory2Dao.INTERNAL_ID, null, fils, cols) || [];
        }
        catch (e) {
            Utility.logException('RecordsToSync.lookup', e);
        }
        return result;
    };
    /**
     * Either inserts or updates data. Upsert = Up[date] + [In]sert
     *
     * @param arg
     * @returns {null}
     */
    ExternalSystemCategory2Dao.upsert = function (arg) {
        var id = null;
        var rec = null;
        if (arg) {
            try {
                rec = Utility.isBlankOrNull(arg.id) ? nlapiCreateRecord(this.INTERNAL_ID) : nlapiLoadRecord(this.INTERNAL_ID, arg.id);
                delete arg.id;
                for (var x in arg) {
                    if (!Utility.isBlankOrNull(x)) {
                        rec.setFieldValue(x, arg[x]);
                    }
                }
                id = nlapiSubmitRecord(rec, true);
            }
            catch (e) {
                Utility.logException('ExternalSystemCategory2Dao.upsert', e);
                throw e;
            }
        }
        return id;
    };
    /**
     * Either inserts or updates data. Upsert = Up[date] + [In]sert
     *
     * @param categoryInternalId
     * @param categoryExternalId
     * @param externalSystemId
     * @param isWebsite
     */
    ExternalSystemCategory2Dao.upsertWithArgs = function (categoryInternalId, categoryExternalId, externalSystemId, isWebsite) {
        var map = {};
        map[ExternalSystemCategory2Dao.FieldName.CATEGORY_NSID] = categoryInternalId;
        map[ExternalSystemCategory2Dao.FieldName.CATEGORY_EXTERNAL_ID] = categoryExternalId;
        map[ExternalSystemCategory2Dao.FieldName.EXTERNAL_SYSTEM] = externalSystemId;
        map[ExternalSystemCategory2Dao.FieldName.IS_WEBSITE] = isWebsite;
        ExternalSystemCategory2Dao.upsert(map);
    };
    /**
     * Returns internal category to external category map object,
     * or internal website to external root category map if isWebsite is true
     *
     * @param externalSystemId
     * @param isWebsite
     * @returns {{}}
     */
    ExternalSystemCategory2Dao.getMapForExternalSystemId = function (externalSystemId, isWebsite) {
        var results = this.lookup([
            new nlobjSearchFilter(this.FieldName.EXTERNAL_SYSTEM, null, 'is', externalSystemId),
            new nlobjSearchFilter(this.FieldName.IS_WEBSITE, null, 'is', isWebsite ? 'T' : 'F')
        ]);
        var map = {};
        for (var i = results.length - 1; i >= 0; --i) {
            var result = results[i];
            var nsId = result.getValue(this.FieldName.CATEGORY_NSID);
            map[nsId] = result.getValue(this.FieldName.CATEGORY_EXTERNAL_ID);
        }
        return map;
    };
    //TODO: for debugging purpose only
    /**
     * Removes all data
     *
     * @param includingExternalSystem
     */
    ExternalSystemCategory2Dao.removeAll = function (includingExternalSystem) {
        if (includingExternalSystem === void 0) { includingExternalSystem = false; }
        var recs = this.lookup([]);
        for (var i = recs.length - 1; i >= 0; --i) {
            var rec = recs[i];
            if (includingExternalSystem) {
                ConnectorConstants.CurrentWrapper.deleteCategory(rec.getValue(this.FieldName.CATEGORY_EXTERNAL_ID));
            }
            nlapiDeleteRecord(this.INTERNAL_ID, rec.getId());
        }
    };
    ExternalSystemCategory2Dao.INTERNAL_ID = 'customrecord_f3_ext_sys_category2';
    ExternalSystemCategory2Dao.FieldName = {
        EXTERNAL_SYSTEM: 'custrecord_f3_ext_sys_cat2_sys',
        CATEGORY_NSID: 'custrecord_f3_ext_sys_cat2_nsid',
        CATEGORY_EXTERNAL_ID: 'custrecord_f3_ext_sys_cat2_extid',
        IS_WEBSITE: 'custrecord_f3_ext_sys_cat2_iswebsite'
    };
    return ExternalSystemCategory2Dao;
}());
//# sourceMappingURL=f3_external_system_category2_dao.js.map