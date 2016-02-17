/**
 * Created by zahmed on 25-Jan-16.
 */

/**
 * ItemImportLibrary class that has the functionality of
 */
var ItemImportLibrary = (function () {
    return {
        configData: {
            ItemTypes: {
                InventoryItem: 'inventoryitem'
            }
        },
        /**
         * Get items on the basis of condition
         * @param criteriaObj
         */
        getItems: function (store, criteriaObj) {
            var results = null;

            if (!!criteriaObj.identifierType && !!criteriaObj.identifierValue) {
                results = this.getItemsByIdentifier(store, criteriaObj);
            } else {
                results = this.getItemsFromPreviousDays(store);
            }

            return results;
        },

        /**
         * Get recently created/modified items from previous days
         */
        getItemsByIdentifier: function (store, criteriaObj) {
            Utility.logDebug('log_w', 'calling getItemsByIdentifier');
            return ConnectorConstants.CurrentWrapper.getItemsById(criteriaObj);
        },

        /**
         * Get recently created/modified items from previous days
         */
        getItemsFromPreviousDays: function (store) {
            Utility.logDebug('log_w', 'calling getItemsFromPreviousDays');
            var ageOfItemToImportInDays = store.entitySyncInfo.item.ageOfItemToImportInDays;
            //var previousDate = this.getPreviousDayDate(ageOfItemToImportInDays);
            var previousDate = ConnectorConstants.CurrentWrapper.getPreviousDayDate(ageOfItemToImportInDays);
            var itemListData = {};
            itemListData.previousDate = previousDate;
            //filters.push(new nlobjSearchFilter('internalid', null, 'is', '1270'));// matrix child
            return ConnectorConstants.CurrentWrapper.getItems(itemListData);
        },

        /**
         * Get date of the previous no. of days mentioned in config data
         * @param ageOfRecordsInDays
         * @returns {*}
         */
        getPreviousDayDate: function (ageOfRecordsInDays) {
            Utility.logDebug('ageOfRecordsInDays', ageOfRecordsInDays);
            var currentDate = Utility.getDateUTC(0);
            var oldDate = nlapiAddDays(currentDate, '-' + ageOfRecordsInDays);
            oldDate = nlapiDateToString(oldDate);
            oldDate = oldDate.toLowerCase();
            oldDate = nlapiDateToString(nlapiStringToDate(oldDate, 'datetime'), 'datetime');
            Utility.logDebug('PreviousDayDate', oldDate);
            return oldDate;
        },

        /**
         * Get the item info if already sycned with store
         * @param currentStoreId
         * @param extSysId
         * @returns {*}
         */
        getItemIfAlreadySyncedInNS: function (currentStoreId, extSysId) {
            if (!Utility.isBlankOrNull(currentStoreId) && !Utility.isBlankOrNull(extSysId)) {
                var itemIdJSON = ConnectorCommon.getMagentoIdForSearching(currentStoreId, extSysId);

                var filExp = [];
                var cols = [];
                var results;

                if (!Utility.isBlankOrNull(itemIdJSON)) {
                    filExp.push([ConnectorConstants.Item.Fields.MagentoId, 'contains', itemIdJSON]);
                }

                cols.push(new nlobjSearchColumn(ConnectorConstants.Item.Fields.MagentoId, null, null));
                cols.push(new nlobjSearchColumn('internalid', null, null).setSort(true));

                results = ConnectorCommon.getRecords('item', filExp, cols);

                if (results instanceof Array && results.length > 0) {
                    return {
                        itemType: results[0].getRecordType(),
                        internalId: results[0].getId()
                    };
                }
            }

            return null;
        },

        /**
         * Process item for external system
         * @param store
         * @param record
         */
        processItem: function (store, record) {
            var itemObject = ConnectorConstants.CurrentWrapper.getItemInfo(store, record);
            Utility.logDebug('itemObject', JSON.stringify(itemObject));
            var recordId = ConnectorConstants.Client.upsertItem(itemObject);
            Utility.logDebug("Child/SimpleRecordId", recordId);
        },

        /**
         * mark Items record status
         * @param itemRecordType
         * @param netsuiteItemId
         * @param msg
         */
        markStatus: function (itemRecordType, netsuiteItemId, msg) {
            try {
                nlapiSubmitField(itemRecordType, netsuiteItemId, ConnectorConstants.Item.Fields.MagentoSyncStatus, msg);
            } catch (e) {
                Utility.logException('ItemImportLibrary.markStatus', e);
            }
        },

        /**
         * Check if item already synched to current store
         * @param store
         * @param externalSystemIds
         * @returns {string}
         */
        checkItemSyncToCurrentStore: function (store, externalSystemIds) {
            var externalSystemId = '';
            if (!!externalSystemIds && externalSystemIds.length > 0) {
                for (var i = 0; i < externalSystemIds.length; i++) {
                    var obj = externalSystemIds[i];
                    if (!!obj.StoreId && obj.StoreId == store.systemId) {
                        externalSystemId = obj.MagentoId;
                    }
                }
            }
            return externalSystemId;
        },

        /**
         * Transform Product Object for NetSuite with NS values of select fields for simple/child inventory item
         * @param product
         * @returns {object}
         */
        transformSimpleItemForNetSuite: function (product) {
            Utility.logDebug("transformSimpleItemForNetSuite - START", JSON.stringify(arguments));
            var result = {};
            result.parent = null;
            result.itemType = "inventory";
            result.id = product.entityId;
            result.itemId = product.sku;
            result.attributeSet = ItemConfigRecordHandler.getNetSuiteAttributeSetId(ConnectorConstants.CurrentStore.systemId, product.attributeSetId);
            result.categories = ItemConfigRecordHandler.getNetSuiteCategoryIds(ConnectorConstants.CurrentStore.systemId, product.categoryIds);
            result.displayName = product.name;
            result.matrixType = "";
            result.matrixParentId = "";
            result.matrixAttributes = this.transformAttributesForNetSuiteChildItem(product.configurableAttributes);
            result.customAttributes = ItemConfigRecordHandler.getCustomAttributesWrtSet(ConnectorConstants.CurrentStore.systemId, product, result);
            if (product.hasParent) {
                result.parent = this.transformConfigurableItemForNetSuite(product.parent);
                result.matrixType = "CHILD";
            }
            Utility.logDebug("transformSimpleItemForNetSuite - END", JSON.stringify(result));
            return result;
        },

        /**
         * Transform Product Object for NetSuite with NS values of select fields for parent inventory item
         * @param product
         * @returns {object}
         */
        transformConfigurableItemForNetSuite: function (product) {
            Utility.logDebug("transformConfigurableItemForNetSuite - START", JSON.stringify(arguments));
            var result = {};
            result.itemType = "inventory";
            result.id = product.entityId;
            result.itemId = product.sku;
            result.attributeSet = ItemConfigRecordHandler.getNetSuiteAttributeSetId(ConnectorConstants.CurrentStore.systemId, product.attributeSetId);
            result.categories = ItemConfigRecordHandler.getNetSuiteCategoryIds(ConnectorConstants.CurrentStore.systemId, product.categoryIds);
            result.displayName = product.name;
            result.matrixType = "PARENT";
            result.matrixParentId = "";
            result.matrixAttributes = this.transformAttributesForNetSuiteParentItem(product.configurableAttributes);
            result.customAttributes = ItemConfigRecordHandler.getCustomAttributesWrtSet(ConnectorConstants.CurrentStore.systemId, product);
            Utility.logDebug("transformConfigurableItemForNetSuite - END", JSON.stringify(result));
            return result;
        },

        /**
         * Get NetSuite Item Option Field Id with respect to External System Field Id/Item Attribute
         * @param attributeId
         * @returns {string}
         */
        getAttributeIdForNetSuite: function (attributeId) {
            Utility.logDebug("getAttributeIdForNetSuite - START", JSON.stringify(arguments));
            var nsAttributeId;
            var externalSystemItemAttributeInternalId;
            var externalSystemItemAttribute = ItemConfigRecordHandler.findExternalSystemItemAttribute(ConnectorConstants.CurrentStore.systemId, attributeId);
            externalSystemItemAttributeInternalId = externalSystemItemAttribute.id;
            Utility.logDebug("externalSystemItemAttribute", JSON.stringify(externalSystemItemAttribute));
            var extSysMatrixFldMap = ItemConfigRecordHandler.findExtSysMatrixFldMapByExtSysItemAttrInternalId(ConnectorConstants.CurrentStore.systemId, externalSystemItemAttributeInternalId);
            var netSuiteItemAttributeInternalId = extSysMatrixFldMap.netSuiteItemOptionField;
            Utility.logDebug("extSysMatrixFldMap", JSON.stringify(extSysMatrixFldMap));
            var netSuiteItemAttribute = ItemConfigRecordHandler.findNetSuiteItemAttribute(ConnectorConstants.CurrentStore.systemId, netSuiteItemAttributeInternalId);
            nsAttributeId = netSuiteItemAttribute.nsItemAttributeId;
            Utility.logDebug("netSuiteItemAttribute", JSON.stringify(netSuiteItemAttribute));
            Utility.logDebug("getAttributeIdForNetSuite - END", JSON.stringify(nsAttributeId));
            return nsAttributeId;
        },

        /**
         * Get NetSuite Item Option Field values with respect to External System Field/Item Attribute values for child
         * item
         * @param attributeId
         * @param externaSystemAttributeValue
         * @returns {string}
         */
        getAttributeValuesForNetSuiteChildItem: function (attributeId, externaSystemAttributeValue) {
            Utility.logDebug("getAttributeValuesForNetSuiteChildItem - START", JSON.stringify(arguments));
            var value;
            var externalSystemItemAttributeInternalId;
            var extSysMatrixFldMapInternalId;
            var externalSystemItemAttribute = ItemConfigRecordHandler.findExternalSystemItemAttribute(ConnectorConstants.CurrentStore.systemId, attributeId);
            externalSystemItemAttributeInternalId = externalSystemItemAttribute.id;
            Utility.logDebug("externalSystemItemAttribute", JSON.stringify(externalSystemItemAttribute));
            var extSysMatrixFldMap = ItemConfigRecordHandler.findExtSysMatrixFldMapByExtSysItemAttrInternalId(ConnectorConstants.CurrentStore.systemId, externalSystemItemAttributeInternalId);
            extSysMatrixFldMapInternalId = extSysMatrixFldMap.id;
            Utility.logDebug("extSysMatrixFldMap", JSON.stringify(extSysMatrixFldMap));
            value = ItemConfigRecordHandler.findNetSuiteMatrixFieldValue(ConnectorConstants.CurrentStore.systemId, extSysMatrixFldMapInternalId, externaSystemAttributeValue);
            Utility.logDebug("getAttributeValuesForNetSuiteChildItem - END", JSON.stringify(value));
            return value;
        },

        /**
         * Get NetSuite Item Option Field values with respect to External System Field/Item Attribute values for parent
         * item
         * @param attributeId
         * @param externaSystemAttributeValues
         * @returns {string[]}
         */
        getAttributeValuesForNetSuiteParentItem: function (attributeId, externaSystemAttributeValues) {
            Utility.logDebug("getAttributeValuesForNetSuiteParentItem - START", JSON.stringify(arguments));
            var values = [];
            var externalSystemItemAttributeInternalId;
            var extSysMatrixFldMapInternalId;
            var externalSystemItemAttribute = ItemConfigRecordHandler.findExternalSystemItemAttribute(ConnectorConstants.CurrentStore.systemId, attributeId);
            externalSystemItemAttributeInternalId = externalSystemItemAttribute.id;
            Utility.logDebug("externalSystemItemAttribute", JSON.stringify(externalSystemItemAttribute));
            var extSysMatrixFldMap = ItemConfigRecordHandler.findExtSysMatrixFldMapByExtSysItemAttrInternalId(ConnectorConstants.CurrentStore.systemId, externalSystemItemAttributeInternalId);
            extSysMatrixFldMapInternalId = extSysMatrixFldMap.id;
            Utility.logDebug("extSysMatrixFldMap", JSON.stringify(extSysMatrixFldMap));
            for (var i in externaSystemAttributeValues) {
                var externaSystemAttributeValue = externaSystemAttributeValues[i];
                var value = ItemConfigRecordHandler.findNetSuiteMatrixFieldValue(ConnectorConstants.CurrentStore.systemId, extSysMatrixFldMapInternalId, externaSystemAttributeValue.id);
                Utility.logDebug("value", JSON.stringify(value));
                values.push(value);
            }
            Utility.logDebug("getAttributeValuesForNetSuiteParentItem - END", JSON.stringify(values));
            return values;
        },

        /**
         * Transform configurableAttributes field ids & values into an array for child product
         * @param configurableAttributes
         * @returns {Array} = [{attributeId: "",attributeValues: []}]
         */
        transformAttributesForNetSuiteChildItem: function (configurableAttributes) {
            var attributes = [];
            for (var attributeId in configurableAttributes) {
                var attributeValue = configurableAttributes[attributeId];
                var nsAttributeId = this.getAttributeIdForNetSuite(attributeId);
                var nsAttributeValue = this.getAttributeValuesForNetSuiteChildItem(attributeId, attributeValue);
                attributes.push({
                    attributeId: nsAttributeId,
                    attributeValues: nsAttributeValue
                });
            }
            return attributes;
        },

        /**
         * Transform configurableAttributes field ids & values into an array for parent product
         * @param configurableAttributes
         * @returns {Array} = [{attributeId: "",attributeValues: []}]
         */
        transformAttributesForNetSuiteParentItem: function (configurableAttributes) {
            Utility.logDebug("transformAttributesForNetSuiteParentItem - START", JSON.stringify(arguments));
            var attributes = [];
            for (var i in configurableAttributes) {
                var configurableAttribute = configurableAttributes[i];
                var nsAttributeId = this.getAttributeIdForNetSuite(configurableAttribute.attributeCode);
                var nsAttributeValues = this.getAttributeValuesForNetSuiteParentItem(configurableAttribute.attributeCode, configurableAttribute.options);
                attributes.push({
                    attributeId: nsAttributeId,
                    attributeValues: nsAttributeValues
                });
            }
            Utility.logDebug("transformAttributesForNetSuiteParentItem - END", JSON.stringify(attributes));
            return attributes;
        }
    };
})();