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
            return ConnectorConstants.CurrentWrapper.getItemsById( criteriaObj);
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
            // TODO: undo after testing
            //return;

            var parentRecordId = "";
            if (!Utility.isBlankOrNull(itemObject.parent)) {
                Utility.logDebug("In Parent Check", "");
                // check if item is already created
                var itemSearchObj = this.getItemIfAlreadySyncedInNS(ConnectorConstants.CurrentStore.systemId, itemObject.parent.id);
                Utility.logDebug("itemSearchObj", itemSearchObj);
                if (!Utility.isBlankOrNull(itemSearchObj)) {
                    // update item
                    itemObject.parent.netSuiteRecordType = itemSearchObj.itemType;
                    itemObject.parent.netSuiteInternalId = itemSearchObj.internalId;
                }

                parentRecordId = ConnectorConstants.Client.upsertInventoryItem(itemObject.parent);
                itemObject.matrixParentId = parentRecordId;
                Utility.logDebug("parentRecordId", parentRecordId);
            }

            // check if item is already created
            var itemSearchObj = this.getItemIfAlreadySyncedInNS(ConnectorConstants.CurrentStore.systemId, itemObject.id);
            Utility.logDebug("itemSearchObj", itemSearchObj);
            if (!Utility.isBlankOrNull(itemSearchObj)) {
                // update item
                itemObject.netSuiteRecordType = itemSearchObj.itemType;
                itemObject.netSuiteInternalId = itemSearchObj.internalId;
            }

            parentRecordId = ConnectorConstants.Client.upsertInventoryItem(itemObject);
            Utility.logDebug("Child/SimpleRecordId", parentRecordId);
        },
        /**
         * Set items external system ids array
         * @param itemRecordType
         * @param externalSystemItemId
         * @param netSuiteItemId
         */
        setItemExternalSystemId: function (itemRecordType, externalSystemItemId, netSuiteItemId) {
            try {
                nlapiSubmitField(itemRecordType, netSuiteItemId, [ConnectorConstants.Item.Fields.MagentoId, ConnectorConstants.Item.Fields.MagentoSync], [externalSystemItemId, 'T']);
            } catch (e) {
                Utility.logException('ItemImportLibrary.setItemExternalSystemId', e);
                this.markStatus(itemRecordType, netSuiteItemId, e.toString());
            }
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
         *
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param [_itemObject]
         */
        getItemObject: function (store, itemInternalId, itemType, _itemObject) {
            var itemObject = {};
            // this condition is responsible to break the recursion
            if (!!_itemObject &&
                (!_itemObject.isMatrix ||
                (_itemObject.isMatrixParentItem && !_itemObject.isMatrixChildItem))) {
                return itemObject;
            }
            var itemRecord = nlapiLoadRecord(itemType, itemInternalId);
            itemObject.internalId = itemInternalId;
            itemObject.itemType = itemType;
            itemObject.itemId = itemRecord.getFieldValue('itemid');
            itemObject.displayName = itemRecord.getFieldValue('displayname');
            itemObject.upcCode = itemRecord.getFieldValue('upccode');
            itemObject.parentItem = itemRecord.getFieldValue('parent');
            itemObject.isMatrixChildItem = itemRecord.getFieldValue('matrixtype') === "CHILD";
            itemObject.isMatrixParentItem = itemRecord.getFieldValue('matrixtype') === "PARENT";
            itemObject.isMatrix = itemObject.isMatrixParentItem || itemObject.isMatrixChildItem;

            itemObject.category = itemRecord.getFieldValue('category');
            itemObject.isTaxable = itemRecord.getFieldValue('istaxable');
            itemObject.itemWeight = itemRecord.getFieldValue('weight');
            itemObject.isDropshipItem = itemRecord.getFieldValue('isdropshipitem');
            itemObject.isSpecialOrderItem = itemRecord.getFieldValue('isspecialorderitem');
            itemObject.isTaxable = itemRecord.getFieldValue('istaxable');

            itemObject.purchaseDescription = itemRecord.getFieldValue('purchasedescription');
            itemObject.salesDescription = itemRecord.getFieldValue('salesdescription');
            itemObject.stockDescription = itemRecord.getFieldValue('stockdescription');
            itemObject.storeDisplayName = itemRecord.getFieldValue('storedisplayname');
            itemObject.featuredDescription = itemRecord.getFieldValue('featureddescription');
            itemObject.storeDescription = itemRecord.getFieldValue('storedescription');
            itemObject.storeDetailedDescription = itemRecord.getFieldValue('storedetaileddescription');
            itemObject.urlComponent = itemRecord.getFieldValue('urlcomponent');
            var imageField = store.entitySyncInfo.item.imageField;
            imageField = imageField || 'storedisplayimage';
            itemObject.imageFileId = itemRecord.getFieldValue(imageField);
            itemObject.imageFileUrl = nlapiLookupField('file', itemObject.imageFileId, 'url');
            var imageBaseUrl = store.entitySyncInfo.item.imageBaseUrl;
            itemObject.imageFullUrl = imageBaseUrl + itemObject.imageFileUrl;

            itemObject.purchasePrice = itemRecord.getFieldValue('cost');
            itemObject.onlineCustomerPrice = itemRecord.getFieldValue('onlinecustomerprice');
            itemObject.salesPrice = itemRecord.getFieldValue('price');
            this.setTierPriceData(store, itemObject, itemRecord);
            this.setExternalSystemData(store, itemInternalId, itemType, itemObject, itemRecord);

            this.setItemFieldsBasedOnType(store, itemInternalId, itemType, itemObject, itemRecord);

            this.setExternalSystemCategory(store, itemInternalId, itemType, itemObject, itemRecord);
            this.setExternalSystemItemAttributeSet(store, itemInternalId, itemType, itemObject, itemRecord);

            if (itemObject.isMatrix) {
                this.setMatrixRelatedFields(store, itemInternalId, itemType, itemObject, itemRecord);
            }

            itemObject.MatrixParent = this.getItemObject(store, itemObject.parentItem, itemType, itemObject);

            return itemObject;
        },

        /**
         * Set external system category
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         * @returns {*}
         */
        setExternalSystemCategory: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            itemObject.externalSystemCategory = {};
            itemObject.externalSystemCategory.netsuiteCategoryId = itemRecord.getFieldValue('custitem_f3_ext_sys_item_category');
            itemObject.externalSystemCategory.externalSystemCategoryId = '';
            if (!!itemObject.externalSystemCategory.netsuiteCategoryId) {
                var externalSystemCategories = ConnectorConstants.ItemConfigRecords.ExternalSystemItemCategory;
                var extSysCategoryObj = _.findWhere(externalSystemCategories, {id: itemObject.externalSystemCategory.netsuiteCategoryId});
                itemObject.externalSystemCategory.externalSystemCategoryId = !!extSysCategoryObj ? extSysCategoryObj.itemCategoryId : '';
            }
        },

        /**
         * Set external system item attribute set
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         */
        setExternalSystemItemAttributeSet: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            itemObject.itemAttributeSet = {};
            itemObject.itemAttributeSet.netsuiteItemAttrSetId = itemRecord.getFieldValue('custitem_f3_ext_sys_item_attribute_set');
            itemObject.itemAttributeSet.externalSystemItemAttrSetId = '';
            if (!!itemObject.itemAttributeSet.netsuiteItemAttrSetId) {
                var externalSystemItemAttrSets = ConnectorConstants.ItemConfigRecords.ExternalSystemItemAttributeSets;
                var extSysItemAttrSetObj = _.findWhere(externalSystemItemAttrSets, {id: itemObject.itemAttributeSet.netsuiteItemAttrSetId});
                itemObject.itemAttributeSet.externalSystemItemAttrSetId = !!extSysItemAttrSetObj ? extSysItemAttrSetObj.itemAttributeSetId : '';
            }
        },

        /**
         * Set Matrix attributes fields in the item object
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         */
        setMatrixRelatedFields: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            if (itemObject.isMatrixParentItem) {
                // set attributes for parent
                itemObject.matrixParentAttributes = this.getMatrixParentAttributes(store, itemInternalId, itemType, itemObject, itemRecord);
            }
            if (itemObject.isMatrixChildItem) {
                // set attributes for child
                itemObject.matrixChildAttributes = this.getMatrixChildAttributes(store, itemInternalId, itemType, itemObject, itemRecord);
            }
        },
        /**
         * This is just a object template for making parent attribute array.
         * Note: It is not used anywhere
         */
        MatrixParentAttributesObjectTemplate: {
            externalSystemMatrixFieldMapId: "",
            netSuiteItemOptionField: "",
            externalSystemAttributeId: "",
            netSuiteMatrixFieldValues: [], // parent
            netSuiteMatrixFieldValuesInCustomRecord: [], // parent
            itemAttributeSetId: "",
            itemAttributeId: "",
            itemAttributeCode: "",
            itemAttributeName: "",
            itemAttributeValues: [], // parent
            itemAttributeValuesMap: [] // parent
        },
        /**
         * Get Matrix Parent Attributes array based on Item Option fields defined in Custom
         * Record from NetSuite Parent Matrix Item Record
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         * @returns {Array}
         */
        getMatrixParentAttributesList: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            var matrixParentAttributesList = [];
            /*
             {"name":"Color1","slug":"color1","position":"0","visible":false,"variation":true,"options":["Black1","Green1"]},
             {"name":"Size1","slug":"size1","position":"1","visible":false,"variation":true,"options":["Small1","Large1"]}
             */
            var externalSystemMatrixFieldMap = ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldMap;
            var fieldMap;
            if (externalSystemMatrixFieldMap instanceof Array) {
                // iterating through custom item options defined in ExternalSystemMatrixFieldMap record
                for (var i in externalSystemMatrixFieldMap) {
                    Utility.logDebug('w_externalSystemMatrixFieldMap', JSON.stringify(externalSystemMatrixFieldMap))
                    fieldMap = externalSystemMatrixFieldMap[i];
                    var netSuiteItemOptionsObj = this.getNetSuiteItemOptionObject(fieldMap.externalSystemId, fieldMap.netSuiteItemOptionField);
                    var netSuiteItemOptionField = !!netSuiteItemOptionsObj ? netSuiteItemOptionsObj.nsItemAttributeId : '';
                    var externalSystemId = fieldMap.externalSystemId;
                    // if custom item option field is defined in custom record and this field has options defined in
                    // matrix parent item then push this field into an array for future use
                    if (externalSystemId.toString() === ConnectorConstants.CurrentStore.systemId.toString() && !!netSuiteItemOptionField) {
                        if (matrixParentAttributesList.indexOf(fieldMap.netSuiteItemOptionField) === -1) {
                            var netSuiteMatrixFieldValues = null;
                            if (netSuiteItemOptionsObj.nsItemAttributeType == ConnectorConstants.Item.FieldTypes.Select
                                && netSuiteItemOptionsObj.nsItemAttributeUseForVariantProduct === 'T'
                                && itemRecord.getFieldValues(netSuiteItemOptionField) instanceof Array) {
                                netSuiteMatrixFieldValues = itemRecord.getFieldValues(netSuiteItemOptionField);
                            } else {
                                netSuiteMatrixFieldValues = itemRecord.getFieldValue(netSuiteItemOptionField);
                            }
                            matrixParentAttributesList.push({
                                externalSystemMatrixFieldMapId: fieldMap.id,
                                netSuiteItemOptionField: fieldMap.netSuiteItemOptionField,
                                netSuiteItemOptionFieldType: netSuiteItemOptionsObj.nsItemAttributeType,
                                netSuiteItemOptionUseForVariantProduct: netSuiteItemOptionsObj.nsItemAttributeUseForVariantProduct,
                                netSuiteItemOptionUseAsCustomOption: netSuiteItemOptionsObj.nsItemAttributeUseAsCustomOption,
                                externalSystemAttributeId: fieldMap.externalSystemAttributeId,
                                netSuiteMatrixFieldValues: netSuiteMatrixFieldValues,
                                netSuiteMatrixFieldValuesInCustomRecord: []
                            });
                        }
                    }
                }
            }
            return matrixParentAttributesList;
        },

        /**
         * Get NetSuite Item Option Object
         * @param externalSystemId
         * @param netSuiteItemOptionFieldRecordId
         */
        getNetSuiteItemOptionObject: function (externalSystemId, netSuiteItemOptionFieldRecordId) {
            var netSuiteItemOptions = ConnectorConstants.ItemConfigRecords.NetSuiteItemOptions;
            var netSuiteItemOptionsObj = _.findWhere(netSuiteItemOptions, {
                externalSystemId: externalSystemId,
                id: netSuiteItemOptionFieldRecordId
            });
            return netSuiteItemOptionsObj;
        },

        /**
         * Set External System Item Attribute information in matrixParentAttributesList
         * @param matrixParentAttributesList
         */
        setExternalSystemItemAttributeInfoInMatrixParentAttributesList: function (matrixParentAttributesList) {
            var fieldMap;
            // append external system item attribute information in newMap
            for (var j in matrixParentAttributesList) {
                fieldMap = matrixParentAttributesList[j];
                var externalSystemItemAttribute = ItemConfigRecordHandler.getExternalSystemItemAttributeInfo(ConnectorConstants.CurrentStore.systemId, fieldMap.externalSystemAttributeId);
                if (!!externalSystemItemAttribute) {
                    fieldMap.itemAttributeId = externalSystemItemAttribute.itemAttributeId;
                    fieldMap.itemAttributeCode = externalSystemItemAttribute.itemAttributeCode;
                    fieldMap.itemAttributeName = externalSystemItemAttribute.name;
                    fieldMap.itemAttributeValues = [];
                    fieldMap.itemAttributeValuesMap = [];
                }
            }
        },
        /**
         * Set External System Matrix Field Values of NetSuite Item Attributes in matrixParentAttributesList
         * Also make an array of Matrix Item Option's Values which are found in Custom Record
         * @param matrixParentAttributesList
         */
        setExternalSystemMatrixFieldValuesInMatrixParentAttributesList: function (matrixParentAttributesList) {
            var fieldMap;
            // append external system item attribute information in newMap
            for (var k in matrixParentAttributesList) {
                fieldMap = matrixParentAttributesList[k];
                if (fieldMap.netSuiteItemOptionFieldType == ConnectorConstants.Item.FieldTypes.Select) {
                    // If field type if select list
                    var netSuiteMatrixFieldValues = fieldMap.netSuiteMatrixFieldValues;
                    if (fieldMap.nsItemAttributeUseForVariantProduct === 'T') {
                        // If item attribute is using for variant product, then netSuiteMatrixFieldValues will contains array of values
                        for (var l in netSuiteMatrixFieldValues) {
                            var netSuiteMatrixFieldValue = netSuiteMatrixFieldValues[l];
                            var externalSystemMatrixFieldValue = ItemConfigRecordHandler.findExternalSystemMatrixFieldValue(ConnectorConstants.CurrentStore.systemId, fieldMap.externalSystemMatrixFieldMapId, netSuiteMatrixFieldValue);
                            if (!!externalSystemMatrixFieldValue) {
                                fieldMap.itemAttributeValues.push(externalSystemMatrixFieldValue.otherSystemMatrixFieldValue);
                                // make an array of matrix item option's values which are found in custom record
                                fieldMap.netSuiteMatrixFieldValuesInCustomRecord.push(netSuiteMatrixFieldValue);
                            }
                        }
                    }
                    else {
                        //otherwise netSuiteMatrixFieldValues will have a single value
                        var externalSystemMatrixFieldValue = ItemConfigRecordHandler.findExternalSystemMatrixFieldValue(ConnectorConstants.CurrentStore.systemId, fieldMap.externalSystemMatrixFieldMapId, netSuiteMatrixFieldValues);
                        if (!!externalSystemMatrixFieldValue) {
                            fieldMap.itemAttributeValues = externalSystemMatrixFieldValue.otherSystemMatrixFieldValue;
                        }
                    }
                    // make a two-way value map for attribute value
                    //Lines Commented by Wahaj
                    //fieldMap.itemAttributeValuesMap[netSuiteMatrixFieldValue] = externalSystemMatrixFieldValue.otherSystemMatrixFieldValue;
                    //fieldMap.itemAttributeValuesMap[externalSystemMatrixFieldValue.otherSystemMatrixFieldValue] = netSuiteMatrixFieldValue;
                } else {
                    fieldMap.itemAttributeValues = fieldMap.netSuiteMatrixFieldValues;
                }
            }
        },
        /**
         * Get Matrix Parent Attributes Information List
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         * @returns {*}
         */
        getMatrixParentAttributes: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            var matrixParentAttributesList = this.getMatrixParentAttributesList(store, itemInternalId, itemType, itemObject, itemRecord);
            this.setExternalSystemItemAttributeInfoInMatrixParentAttributesList(matrixParentAttributesList);
            this.setExternalSystemMatrixFieldValuesInMatrixParentAttributesList(matrixParentAttributesList);
            return matrixParentAttributesList;
        },

        /**
         * This is just a object template for making child attribute array.
         * Note: It is not used anywhere
         */
        MatrixChildAttributesObjectTemplate: {
            externalSystemMatrixFieldMapId: "",
            netSuiteItemOptionField: "",
            externalSystemAttributeId: "",
            netSuiteMatrixFieldValue: "", // child
            itemAttributeSetId: "",
            itemAttributeId: "",
            itemAttributeCode: "",
            itemAttributeName: "",
            itemAttributeValue: "", // child
            itemAttributeValueMap: [] // child
        },
        /**
         * Get Matrix Child Attributes array based on Item Option fields defined in Custom
         * Record from NetSuite Parent Child Item Record
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         * @returns {Array}
         */
        getMatrixChildAttributesList: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            var matrixChildAttributesList = [];
            /*
             {"name":"Color1","slug":"color1","option":"Black1"},
             {"name":"Size1","slug":"size1","option":"Large1"}
             */
            var externalSystemMatrixFieldMap = ConnectorConstants.ItemConfigRecords.ExternalSystemMatrixFieldMap;
            var fieldMap;
            if (externalSystemMatrixFieldMap instanceof Array) {
                // iterating through custom item options defined in ExternalSystemMatrixFieldMap record
                for (var i in externalSystemMatrixFieldMap) {
                    fieldMap = externalSystemMatrixFieldMap[i];
                    var netSuiteItemOptionsObj = this.getNetSuiteItemOptionObject(fieldMap.externalSystemId, fieldMap.netSuiteItemOptionField);
                    var netSuiteItemOptionField = !!netSuiteItemOptionsObj ? netSuiteItemOptionsObj.nsItemAttributeId : '';
                    var externalSystemId = fieldMap.externalSystemId;
                    // if custom item option field is defined in custom record and this field has options defined in
                    // matrix parent item then push this field into an array for future use
                    if (externalSystemId.toString() === ConnectorConstants.CurrentStore.systemId.toString() && !!netSuiteItemOptionField && !!itemRecord.getFieldValue(netSuiteItemOptionField)) {
                        if (matrixChildAttributesList.indexOf(fieldMap.netSuiteItemOptionField) === -1) {
                            matrixChildAttributesList.push({
                                externalSystemMatrixFieldMapId: fieldMap.id,
                                netSuiteItemOptionField: fieldMap.netSuiteItemOptionField,
                                externalSystemAttributeId: fieldMap.externalSystemAttributeId,
                                netSuiteMatrixFieldValue: itemRecord.getFieldValue(netSuiteItemOptionField)
                            });
                        }
                    }
                }
            }
            return matrixChildAttributesList;
        },
        /**
         * Set External System Item Attribute information in matrixChildAttributesList
         * @param matrixChildAttributesList
         */
        setExternalSystemItemAttributeInfoInMatrixChildAttributesList: function (matrixChildAttributesList) {
            var fieldMap;
            // append external system item attribute information in newMap
            for (var j in matrixChildAttributesList) {
                fieldMap = matrixChildAttributesList[j];
                var externalSystemItemAttribute = ItemConfigRecordHandler.getExternalSystemItemAttributeInfo(ConnectorConstants.CurrentStore.systemId, fieldMap.externalSystemAttributeId);
                if (!!externalSystemItemAttribute) {
                    fieldMap.itemAttributeId = externalSystemItemAttribute.itemAttributeId;
                    fieldMap.itemAttributeCode = externalSystemItemAttribute.itemAttributeCode;
                    fieldMap.itemAttributeName = externalSystemItemAttribute.name;
                    fieldMap.itemAttributeValue = "";
                    fieldMap.itemAttributeValueMap = [];
                }
            }
        },
        /**
         * Set External System Matrix Field Values of NetSuite Item Attributes in matrixChildAttributesList
         * Also make an array of Matrix Item Option's Values which are found in Custom Record
         * @param matrixChildAttributesList
         */
        setExternalSystemMatrixFieldValueInMatrixChildAttributesList: function (matrixChildAttributesList) {
            var fieldMap;
            // append external system item attribute information in newMap
            for (var k in matrixChildAttributesList) {
                fieldMap = matrixChildAttributesList[k];
                var netSuiteMatrixFieldValue = fieldMap.netSuiteMatrixFieldValue;
                if (fieldMap.netSuiteItemOptionFieldType == ConnectorConstants.Item.FieldTypes.Select) {
                    var externalSystemMatrixFieldValue = ItemConfigRecordHandler.findExternalSystemMatrixFieldValue(ConnectorConstants.CurrentStore.systemId, fieldMap.externalSystemMatrixFieldMapId, netSuiteMatrixFieldValue);
                    fieldMap.itemAttributeValue = externalSystemMatrixFieldValue.otherSystemMatrixFieldValue;
                    // make a two-way value map for attribute value
                    //Lines Commented by wahaj
                    //fieldMap.itemAttributeValueMap[netSuiteMatrixFieldValue] = fieldMap.itemAttributeValue;
                    //fieldMap.itemAttributeValueMap[fieldMap.itemAttributeValue] = netSuiteMatrixFieldValue;
                } else {
                    fieldMap.itemAttributeValue = netSuiteMatrixFieldValue;
                }
            }
        },
        /**
         * Get Matrix Child Attributes Information List
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         * @returns {*|Array}
         */
        getMatrixChildAttributes: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            var matrixChildAttributesList = this.getMatrixChildAttributesList(store, itemInternalId, itemType, itemObject, itemRecord);
            this.setExternalSystemItemAttributeInfoInMatrixChildAttributesList(matrixChildAttributesList);
            this.setExternalSystemMatrixFieldValueInMatrixChildAttributesList(matrixChildAttributesList);
            return matrixChildAttributesList;
        },


        /**
         * Set data fields related to external system
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         */
        setExternalSystemData: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            itemObject.externalSystemIdsString = itemRecord.getFieldValue(ConnectorConstants.Item.Fields.MagentoId);
            itemObject.externalSystemIds = [];
            itemObject.alreadySyncToCurrentExternalSystem = false;
            itemObject.currentExternalSystemId = '';
            try {
                itemObject.externalSystemIds = JSON.parse(itemObject.externalSystemIdsString);
                var externalSystemId = this.checkItemSyncToCurrentStore(store, itemObject.externalSystemIds);
                itemObject.alreadySyncToCurrentExternalSystem = !!externalSystemId;
                itemObject.currentExternalSystemId = externalSystemId;
            }
            catch (ex) {
                Utility.logException('Error in parsing externalSystemIds string into json', ex);
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
         * Get items tier pricing
         * @param store
         * @param itemObject
         * @param itemRecord
         * @returns {Array}
         */
        setTierPriceData: function (store, itemObject, itemRecord) {
            // Check the features enabled in the account. See Pricing Sublist Feature Dependencies for
            // details on why this is important.
            var multiCurrency = nlapiGetContext().getFeature('MULTICURRENCY');
            var multiPrice = nlapiGetContext().getFeature('MULTPRICE');
            var quantityPricing = nlapiGetContext().getFeature('QUANTITYPRICING');

            // Set the name of the Price sublist based on features enabled and currency type.
            // See Pricing Sublist Internal IDs for details on why this is important.
            var priceID;
            var currencyID = "USD";
            var obj = {};
            var itemRec = itemRecord;
            var catalogProductTierPriceEntityArray = [];
            var qty, price;

            // Set the ID for the sublist and the price field. Note that if all pricing-related features
            // are disabled, you will set the price in the rate field. See Pricing Sublist Feature Dependencies
            // for details.
            if (!multiCurrency && !multiPrice && !quantityPricing) {
                itemObject.tierPricingEnabled = false;
                priceID = "rate";
                itemObject.price = itemRec.getFieldValue(priceID);
            }
            else {
                itemObject.tierPricingEnabled = true;
                priceID = "price";
                if (multiCurrency) {
                    //var internalId = nlapiSearchRecord('currency', null, new nlobjSearchFilter('symbol', null, 'contains', currencyID))[0].getId();
                    //for USD as default curremcy id - TODO: generalize in future for more than one currency support
                    var internalId = 1;
                    // Append the currency ID to the sublist name
                    priceID = priceID + internalId;
                }

                // reading price level from configuration
                var priceLevel = store.entitySyncInfo.item.priceLevel;

                for (var i = 1; i <= 5; i++) {
                    var catalogProductTierPriceEntity = {};
                    // update tier price if tiers exist
                    if (!!itemRec.getMatrixValue(priceID, 'price', i)) {

                        qty = itemRec.getMatrixValue(priceID, 'price', i);
                        //price = itemRec.getLineItemValue('price', 'price_' + i + '_', priceLevel);
                        price = itemRec.getLineItemMatrixValue(priceID, 'price', priceLevel, i);

                        catalogProductTierPriceEntity.qty = qty;
                        catalogProductTierPriceEntity.price = price;

                        catalogProductTierPriceEntityArray.push(catalogProductTierPriceEntity);
                    }
                }

                Utility.logDebug('catalogProductTierPriceEntityArray', JSON.stringify(catalogProductTierPriceEntityArray));
                itemObject.catalogProductTierPriceEntityArray = catalogProductTierPriceEntityArray;
            }
        },

        /**
         * Set item specific fields
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         */
        setItemFieldsBasedOnType: function (store, itemInternalId, itemType, itemObject, itemRecord) {
            switch (itemType) {
                case this.configData.ItemTypes.InventoryItem:
                    ConnectorConstants.CurrentWrapper.setInventoryItemFields(store, itemInternalId, itemType, itemObject, itemRecord);
                    break;
                default:
                    break;
            }
        },

        /**
         * Import Item To External System
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         */
        importItemToExternalSystem: function (store, itemInternalId, itemType, itemObject, createOnly) {
            var responseBody = null;
            switch (itemType) {
                case this.configData.ItemTypes.InventoryItem:
                    responseBody = this.importInventoryItemToExternalSystem(store, itemInternalId, itemType, itemObject, createOnly);
                    break;
                default:
                    break;
            }
            return responseBody;
        },

        /**
         * Import Inventory item to External System
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         */
        importInventoryItemToExternalSystem: function (store, itemInternalId, itemType, itemObject, createOnly) {
            return ConnectorConstants.CurrentWrapper.importInventoryItem(store, itemInternalId, itemType, itemObject, createOnly);
        },

        /**
         * Get external system's external ids array
         * @param storeId
         * @param externalSystemId
         * @param type
         * @param existingId
         * @returns {*}
         */
        getExternalSystemIdObjectArrayString: function (storeId, externalSystemId, type, existingIdsArray) {
            var magentoIdObjArr = [];
            if (type === 'create') {
                var obj1 = {};
                obj1.StoreId = storeId;
                obj1.MagentoId = externalSystemId;
                magentoIdObjArr.push(obj1);
            }
            else if (type === 'update') {
                if (!!existingIdsArray) {
                    var isAlreadyExist = false;
                    magentoIdObjArr = JSON.parse(existingIdsArray);
                    for (var i in magentoIdObjArr) {
                        var tempMagentoIdObj = magentoIdObjArr[i];
                        if (tempMagentoIdObj.StoreId === storeId) {
                            isAlreadyExist = true;
                            tempMagentoIdObj.MagentoId = externalSystemId;
                        }
                    }
                    if (!isAlreadyExist) {
                        var obj2 = {};
                        obj2.StoreId = storeId;
                        obj2.MagentoId = externalSystemId;
                        magentoIdObjArr.push(obj2);
                    }
                } else {
                    var obj3 = {};
                    obj3.StoreId = storeId;
                    obj3.MagentoId = externalSystemId;
                    magentoIdObjArr.push(obj3);
                }
            }

            return JSON.stringify(magentoIdObjArr);
        }

    };
})();