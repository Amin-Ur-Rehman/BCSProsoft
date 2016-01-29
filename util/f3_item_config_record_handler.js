/**
 * Created by zahmed on 25-Jan-16.
 */

var ItemConfigRecordHandler = (function () {
    return {

        /**
         * Get external system categories list
         * @returns {*}
         */
        getAllExternalSystemItemCategoriesList: function () {
            var list = [];

            // if ExternalSystemItemCategories are already fecthed the return extisng ones
            if (ConnectorConstants.ItemConfigRecords.ExternalSystemItemCategory instanceof Array) {
                return ConnectorConstants.ItemConfigRecords.ExternalSystemItemCategory;
            }

            var columns = [];
            columns.push(new nlobjSearchColumn("name", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_ext_sys_cat_sys", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_ext_sys_cat_id", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_ext_sys_cat_code", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_ext_sys_cat_details", null, null));
            columns.push(new nlobjSearchColumn("internalid", null, null).setSort(false));

            var results = Utility.getRecords("customrecord_f3_ext_sys_category", null, null, columns, null);
            if (!!results && results.length > 0) {
                for (var i in results) {
                    var result = results[i];
                    var id = result.getId() || "";
                    var name = result.getValue("name") || "";
                    var externalSystemId = result.getValue("custrecord_f3_ext_sys_cat_sys") || "";
                    var externalSystemText = result.getText("custrecord_f3_ext_sys_cat_sys") || "";
                    var itemCategoryId = result.getValue("custrecord_f3_ext_sys_cat_id") || "";
                    var itemCategoryCode = result.getValue("custrecord_f3_ext_sys_cat_code") || "";
                    var itemCategoryDetails = result.getValue("custrecord_f3_ext_sys_cat_details") || "";

                    list.push({
                        id: id,
                        name: name,
                        externalSystemId: externalSystemId,
                        externalSystemText: externalSystemText,
                        itemCategoryId: itemCategoryId,
                        itemCategoryCode: itemCategoryCode,
                        itemCategoryDetails: itemCategoryDetails
                    });
                }
            }
            return list;
        },

        /**
         * Get Complete List of ExternalSystemItemAttributeSets
         * @return {*}
         */
        getAllExternalSystemAttributeSetList: function () {
            var list = [];

            // if ExternalSystemItemAttributeSets are already fecthed the return extisng ones
            if (ConnectorConstants.ItemConfigRecords.ExternalSystemItemAttributeSets instanceof Array) {
                return ConnectorConstants.ItemConfigRecords.ExternalSystemItemAttributeSets;
            }

            var columns = [];
            columns.push(new nlobjSearchColumn("name", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_set_ext_sys", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_set_id", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_set_code", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_set_details", null, null));
            columns.push(new nlobjSearchColumn("internalid", null, null).setSort(false));

            var results = Utility.getRecords("customrecord_f3_ext_sys_item_att_set", null, null, columns, null);

            if (!!results && results.length > 0) {
                for (var i in results) {
                    var result = results[i];
                    var id = result.getId() || "";
                    var name = result.getValue("name") || "";
                    var externalSystemId = result.getValue("custrecord_f3_item_att_set_ext_sys") || "";
                    var externalSystemText = result.getText("custrecord_f3_item_att_set_ext_sys") || "";
                    var itemAttributeSetId = result.getValue("custrecord_f3_item_att_set_id") || "";
                    var itemAttributeSetCode = result.getValue("custrecord_f3_item_att_set_code") || "";
                    var itemAttributeSetDetails = result.getValue("custrecord_f3_item_att_set_details") || "";

                    list.push({
                        id: id,
                        name: name,
                        externalSystemId: externalSystemId,
                        externalSystemText: externalSystemText,
                        itemAttributeSetId: itemAttributeSetId,
                        itemAttributeSetCode: itemAttributeSetCode,
                        itemAttributeSetDetails: itemAttributeSetDetails
                    });
                }
            }
            return list;
        },

        /**
         * Get Complete List of ExternalSystemItemAttributes
         * @return {*}
         */
        getAllExternalSystemAttributeList: function () {
            var list = [];

            // if ExternalSystemItemAttributes are already fecthed the return extisng ones
            if (ConnectorConstants.ItemConfigRecords.ExternalSystemItemAttributes instanceof Array) {
                return ConnectorConstants.ItemConfigRecords.ExternalSystemItemAttributes;
            }

            var columns = [];
            columns.push(new nlobjSearchColumn("name", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ext_sys", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_id", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_code", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_type", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_use_for_var_prod", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_details", null, null));
            columns.push(new nlobjSearchColumn("internalid", null, null).setSort(false));

            var results = Utility.getRecords("customrecord_f3_ext_sys_item_att", null, null, columns, null);

            if (!!results && results.length > 0) {
                for (var i in results) {
                    var result = results[i];
                    var id = result.getId() || "";
                    var name = result.getValue("name") || "";
                    var externalSystemId = result.getValue("custrecord_f3_item_att_ext_sys") || "";
                    var externalSystemText = result.getText("custrecord_f3_item_att_ext_sys") || "";
                    var itemAttributeId = result.getValue("custrecord_f3_item_att_id") || "";
                    var itemAttributeCode = result.getValue("custrecord_f3_item_att_code") || "";
                    var itemAttributeType = result.getValue("custrecord_f3_item_att_type") || "";
                    var itemAttributeUseForVariantProduct = result.getValue("custrecord_f3_item_att_use_for_var_prod") || "";
                    var itemAttributeDetails = result.getValue("custrecord_f3_item_att_details") || "";

                    list.push({
                        id: id,
                        name: name,
                        externalSystemId: externalSystemId,
                        externalSystemText: externalSystemText,
                        itemAttributeId: itemAttributeId,
                        itemAttributeCode: itemAttributeCode,
                        itemAttributeType: itemAttributeType,
                        itemAttributeUseForVariantProduct: itemAttributeUseForVariantProduct,
                        itemAttributeDetails: itemAttributeDetails
                    });
                }
            }

            return list;
        },

        /**
         * Get Complete List of NetSuite Item Options
         * @return {*}
         */
        getAllNetSuiteItemOptionsList: function () {
            var list = [];

            // if NetSuiteItemOptions are already fecthed the return extisng ones
            if (ConnectorConstants.ItemConfigRecords.NetSuiteItemOptions instanceof Array) {
                return ConnectorConstants.ItemConfigRecords.NetSuiteItemOptions;
            }

            var columns = [];
            columns.push(new nlobjSearchColumn("name", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_ext_sys", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_id", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_type", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_cust_lst_id", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_cust_lst_name", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_use_for_var", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_use_cust_opt", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_item_att_ns_details", null, null));
            columns.push(new nlobjSearchColumn("internalid", null, null).setSort(false));

            var results = Utility.getRecords("customrecord_f3_netsuite_item_att", null, null, columns, null);

            if (!!results && results.length > 0) {
                for (var i in results) {
                    var result = results[i];
                    var id = result.getId() || "";
                    var name = result.getValue("name") || "";
                    var externalSystemId = result.getValue("custrecord_f3_item_att_ns_ext_sys") || "";
                    var externalSystemText = result.getText("custrecord_f3_item_att_ns_ext_sys") || "";
                    var nsItemAttributeId = result.getValue("custrecord_f3_item_att_ns_id") || "";
                    var nsItemAttributeType = result.getValue("custrecord_f3_item_att_ns_type") || "";
                    var nsItemAttributeCustomListId = result.getValue("custrecord_f3_item_att_ns_cust_lst_id") || "";
                    var nsItemAttributeCustomListName = result.getValue("custrecord_f3_item_att_ns_cust_lst_name") || "";
                    var nsItemAttributeUseForVariantProduct = result.getValue("custrecord_f3_item_att_ns_use_for_var") || "";
                    var nsItemAttributeUseAsCustomOption = result.getValue("custrecord_f3_item_att_ns_use_cust_opt") || "";
                    var nsItemAttributeDetails = result.getValue("custrecord_f3_item_att_ns_details") || "";

                    list.push({
                        id: id,
                        name: name,
                        externalSystemId: externalSystemId,
                        externalSystemText: externalSystemText,
                        nsItemAttributeId: nsItemAttributeId,
                        nsItemAttributeType: nsItemAttributeType,
                        nsItemAttributeCustomListId: nsItemAttributeCustomListId,
                        nsItemAttributeCustomListName: nsItemAttributeCustomListName,
                        nsItemAttributeUseForVariantProduct: nsItemAttributeUseForVariantProduct,
                        nsItemAttributeUseAsCustomOption: nsItemAttributeUseAsCustomOption,
                        nsItemAttributeDetails: nsItemAttributeDetails
                    });
                }
            }

            return list;
        },

        /**
         * Get Complete List of ExternalSystemMatrixFieldMap
         * @return {*}
         */
        getAllExternalSystemMatrixFieldMapList: function () {
            var list = [];

            // if ExternalSystemMatrixFieldMap are already fecthed the return extisng ones
            if (ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldMap instanceof Array) {
                return ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldMap;
            }

            var columns = [];
            columns.push(new nlobjSearchColumn("name", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_ext_sys", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_ext_sys_att", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_ns_itm_opt_fld", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_detials", null, null));
            columns.push(new nlobjSearchColumn("internalid", null, null).setSort(false));

            var results = Utility.getRecords("customrecord_f3_ext_sys_mat_fld_map", null, null, columns, null);

            if (!!results && results.length > 0) {
                for (var i in results) {
                    var result = results[i];
                    var id = result.getId() || "";
                    var name = result.getValue("name") || "";
                    var externalSystemId = result.getValue("custrecord_f3_mat_fld_map_ext_sys") || "";
                    var externalSystemText = result.getText("custrecord_f3_mat_fld_map_ext_sys") || "";
                    var externalSystemAttributeId = result.getValue("custrecord_f3_mat_fld_map_ext_sys_att") || "";
                    var externalSystemAttributeText = result.getText("custrecord_f3_mat_fld_map_ext_sys_att") || "";
                    var netSuiteItemOptionField = result.getValue("custrecord_f3_mat_fld_map_ns_itm_opt_fld") || "";
                    var details = result.getValue("custrecord_f3_mat_fld_map_detials") || "";

                    list.push({
                        id: id,
                        name: name,
                        externalSystemId: externalSystemId,
                        externalSystemText: externalSystemText,
                        externalSystemAttributeId: externalSystemAttributeId,
                        externalSystemAttributeText: externalSystemAttributeText,
                        netSuiteItemOptionField: netSuiteItemOptionField,
                        details: details
                    });
                }
            }

            return list;
        },

        /**
         * Get Complete List of ExternalSystemMatrixFieldValues
         * @return {*}
         */
        getAllExternalSystemMatrixFieldValuesList: function () {
            var list = [];

            // if ExternalSystemMatrixFieldValues are already fecthed the return extisng ones
            if (ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldValues instanceof Array) {
                return ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldValues;
            }

            var columns = [];
            columns.push(new nlobjSearchColumn("name", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_val_ext_sys", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_val_fld_map", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_val_ns_fld_val", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_val_os_fld_val", null, null));
            columns.push(new nlobjSearchColumn("custrecord_f3_mat_fld_map_val_details", null, null));
            columns.push(new nlobjSearchColumn("internalid", null, null).setSort(false));

            var results = Utility.getRecords("customrecord_f3_ext_sys_mat_fld_val_map", null, null, columns, null);

            if (!!results && results.length > 0) {
                for (var i in results) {
                    var result = results[i];
                    var id = result.getId() || "";
                    var name = result.getValue("name") || "";
                    var externalSystemId = result.getValue("custrecord_f3_mat_fld_map_val_ext_sys") || "";
                    var externalSystemText = result.getText("custrecord_f3_mat_fld_map_val_ext_sys") || "";
                    var itemMatrixFieldMapId = result.getValue("custrecord_f3_mat_fld_map_val_fld_map") || "";
                    var itemMatrixFieldMapText = result.getText("custrecord_f3_mat_fld_map_val_fld_map") || "";
                    var netSuiteMatrixFieldValue = result.getValue("custrecord_f3_mat_fld_map_val_ns_fld_val") || "";
                    var otherSystemMatrixFieldValue = result.getValue("custrecord_f3_mat_fld_map_val_os_fld_val") || "";
                    var details = result.getValue("custrecord_f3_mat_fld_map_val_details") || "";

                    list.push({
                        id: id,
                        name: name,
                        externalSystemId: externalSystemId,
                        externalSystemText: externalSystemText,
                        itemMatrixFieldMapId: itemMatrixFieldMapId,
                        itemMatrixFieldMapText: itemMatrixFieldMapText,
                        netSuiteMatrixFieldValue: netSuiteMatrixFieldValue,
                        otherSystemMatrixFieldValue: otherSystemMatrixFieldValue,
                        details: details
                    });
                }
            }

            return list;
        },
        /**
         * This method is used to fetch attribute information depending on passing parameters
         * @param currentStoreId
         * @param externalSystemAttributeId
         * @returns {null | object}
         */
        getExternalSystemItemAttributeInfo: function (currentStoreId, externalSystemAttributeId) {
            var externalSystemItemAttributes = ConnectorConstants.ItemConfigRecords.ExternalSystemItemAttributes;
            if (externalSystemItemAttributes instanceof Array) {
                for (var i in externalSystemItemAttributes) {
                    var externalSystemItemAttribute = externalSystemItemAttributes[i];
                    if (externalSystemItemAttribute.externalSystemId.toString() === currentStoreId.toString() &&
                        externalSystemItemAttribute.id.toString() === externalSystemAttributeId.toString()) {
                        return externalSystemItemAttribute;
                    }
                }
            }
            return null;
        },

        /**
         * This method is used to fetch attribute values of external system defined against NetSuite's item
         * option values information depending on passing parameters
         * @param currentStoreId
         * @param externalSystemMatrixFieldMapId
         * @param netSuiteMatrixFieldValue
         * @returns {null | string}
         */
        findExternalSystemMatrixFieldValue: function (currentStoreId, externalSystemMatrixFieldMapId, netSuiteMatrixFieldValue) {
            var externalSystemMatrixFieldValues = ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldValues;
            if (externalSystemMatrixFieldValues instanceof Array) {
                for (var i in externalSystemMatrixFieldValues) {
                    var externalSystemMatrixFieldValue = externalSystemMatrixFieldValues[i];
                    if (externalSystemMatrixFieldValue.externalSystemId.toString() === currentStoreId.toString() &&
                        externalSystemMatrixFieldValue.itemMatrixFieldMapId.toString() === externalSystemMatrixFieldMapId.toString() &&
                        externalSystemMatrixFieldValue.netSuiteMatrixFieldValue.toString() === netSuiteMatrixFieldValue.toString()) {
                        return externalSystemMatrixFieldValue;
                    }
                }
            }
            return null;
        },

        findExternalSystemItemAttributeInternalId: function (curentStoreId, externalSystemItemAttributeCode) {
            var externalSystemItemAttributes = ConnectorConstants.ItemConfigRecords.ExternalSystemItemAttributes;

            for (var i in externalSystemItemAttributes) {
                var externalSystemItemAttribute = externalSystemItemAttributes[i];

                // TODO: check itemAttributeUseForVariantProduct flag if necessary
                if (externalSystemItemAttributeCode === externalSystemItemAttribute.itemAttributeCode &&
                    curentStoreId === externalSystemItemAttribute.externalSystemId) {
                    return externalSystemItemAttribute.id;
                }
            }
            return null;
        },

        findNetSuiteOptionFieldInternalId: function (curentStoreId, externalSystemItemAttributeInternalId) {
            var externalSystemMatrixFieldMap = ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldMap;

            for (var i in externalSystemMatrixFieldMap) {
                var extSysMatrixFieldMap = externalSystemMatrixFieldMap[i];
                if (externalSystemItemAttributeInternalId === extSysMatrixFieldMap.itemAttributeCode &&
                    curentStoreId === extSysMatrixFieldMap.externalSystemId) {
                    return extSysMatrixFieldMap.id;
                }
                return null;
            }
        }
    };

    //endregion


})();