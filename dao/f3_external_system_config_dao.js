/**
 * Created by zahmed on 12-Jan-15.
 *
 * Description:
 * - This file is responsible for fetching external system configuration
 * - e.g. Magento Store
 * -
 * Referenced By:
 * - connector_salesorder_sch.js
 * - connector_customer_sch_new.js
 * - connector_item_sch.js
 * -
 * Dependency:
 * - f3_utility_methods.js
 */

ExternalSystemConfig = (function () {
    return {
        InternalId: 'customrecord_external_system_config',
        FieldName: {
            SystemDisplayName: 'custrecord_esc_system_display_name',
            SystemId: 'custrecord_esc_system_id',
            UserName: 'custrecord_esc_username',
            Password: 'custrecord_esc_password',
            Endpoint: 'custrecord_esc_endpoint',
            EntitySyncInfo: 'custrecord_esc_entity_sync_info',
            SystemType: 'custrecord_esc_system_type',
            Permission: 'custrecord_esc_permission'
        },
        /**
         * Perform a record search using filters and columns.
         * @governance 10 units
         * @restriction returns the first 1000 rows in the search
         *
         * @param {nlobjSearchFilter, nlobjSearchFilter[]} [filters] [optional] A single nlobjSearchFilter object - or - an array of nlobjSearchFilter objects.
         * @return {nlobjSearchResult[]} Returns an array of nlobjSearchResult objects corresponding to the searched records.
         *
         * @since    Jan 12, 2015
         */
        lookup: function (filters) {
            var result = [];
            try {
                var cols = [];
                var fils = filters || [];
                for (var i in this.FieldName) {
                    var col = new nlobjSearchColumn(this.FieldName[i], null, null);
                    cols.push(col);
                }
                result = nlapiSearchRecord(this.InternalId, null, fils, cols) || [];
            } catch (e) {
                Utility.logException('ExternalSystemConfig.lookup', e);
            }
            return result;
        },
        /**
         * Getting external system information from custom table
         * @returns {Array} Returns an array of objects
         */
        getConfig: function () {
            var systemConfig = [];
            var res = this.lookup(new nlobjSearchFilter('isinactive',null,'is','F'));

            for (var i in res) {
                var config = res[i];

                var internalId = config.getId();
                var systemId = config.getValue(this.FieldName.SystemId, null, null);
                var systemDisplayName = config.getText(this.FieldName.SystemDisplayName, null, null);
                var systemDisplayNameValue = config.getValue(this.FieldName.SystemDisplayName, null, null);
                var userName = config.getValue(this.FieldName.UserName, null, null);
                var password = config.getValue(this.FieldName.Password, null, null);
                var endpoint = config.getValue(this.FieldName.Endpoint, null, null);
                var entitySyncInfo = JSON.parse(config.getValue(this.FieldName.EntitySyncInfo, null, null));
                var permissions = JSON.parse(config.getValue(this.FieldName.Permission, null, null) || "[]");

                //TODO: Need to pick this from Database
                var systemType = config.getValue(this.FieldName.SystemType, null, null);

                var obj = {
                    internalId:internalId,
                    systemId: systemId,
                    systemDisplayName: systemDisplayName,
                    systemDisplayNameValue: systemDisplayNameValue,
                    userName: userName,
                    password: password,
                    endpoint: endpoint,
                    entitySyncInfo: entitySyncInfo,
                    systemType: systemType,
                    permissions: permissions
                };

                systemConfig[systemId] = obj;
            }
            Utility.logDebug('ExternalSystemConfig.getConfig', JSON.stringify(systemConfig));
            return systemConfig;
        },

        /**
         * Gets All Configuration Information
         * @returns {Array} Returns an array of objects
         */
        getAll: function () {
            var systemConfig = [];
            var res = this.lookup(new nlobjSearchFilter('isinactive',null,'is','F'));

            for (var i in res) {
                var config = res[i];

                var internalId = config.getId();
                var systemId = config.getValue(this.FieldName.SystemId, null, null);
                var systemDisplayName = config.getText(this.FieldName.SystemDisplayName, null, null);
                var userName = config.getValue(this.FieldName.UserName, null, null);
                var password = config.getValue(this.FieldName.Password, null, null);
                var endpoint = config.getValue(this.FieldName.Endpoint, null, null);
                var entitySyncInfo = JSON.parse(config.getValue(this.FieldName.EntitySyncInfo, null, null));
                var permissions = JSON.parse(config.getValue(this.FieldName.Permission, null, null) || "[]");

                //TODO: Need to pick this from Database
                var systemType = config.getValue(this.FieldName.SystemType, null, null);

                var obj = {
                    internalId:internalId,
                    systemId: systemId,
                    systemDisplayName: systemDisplayName,
                    userName: userName,
                    password: password,
                    endpoint: endpoint,
                    entitySyncInfo: entitySyncInfo,
                    systemType: systemType,
                    permissions: permissions
                };

                systemConfig.push(obj);
            }
            Utility.logDebug('ExternalSystemConfig.getConfig', JSON.stringify(systemConfig));
            return systemConfig;
        }
    };
})();