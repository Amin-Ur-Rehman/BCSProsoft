/**
 * Created by wahajahmed on 11/27/2015.
 * TODO:
 * -
 * Referenced By:
 * -
 * -
 * Dependencies:
 * -
 * -
 */

/**
 * ItemExportLibrary class that has the functionality of
 */
var ItemExportLibrary = (function () {
    return {
        configData : {
            ItemTypes : {
                InventoryItem : 'inventoryitem'
            }
        },
        /**
         * Get items on the basis of condition
         * @param criteriaObj
         */
        getItems: function(store, criteriaObj) {
            var results = null;
            if(!!criteriaObj.identifierType && !!criteriaObj.identifierValue) {
                results = this.getItemsByIdentifier(store, criteriaObj);
            } else {
                results = this.getItemsFromPreviousDays(store);
            }

            return results;
        },

        /**
         * Get recently created/modified items from previous days
         */
        getItemsByIdentifier: function(store, criteriaObj) {
            Utility.logDebug('log_w','calling getItemsByIdentifier');
            var filters = [];
            filters.push(new nlobjSearchFilter(criteriaObj.identifierType,  null, 'is', criteriaObj.identifierValue));
            return this.getItemsData(filters);
        },

        /**
         * Get recently created/modified items from previous days
         */
        getItemsFromPreviousDays: function(store) {
            Utility.logDebug('log_w','calling getItemsFromPreviousDays');
            var filters = [];
            var ageOfItemToExportInDays = store.entitySyncInfo.item.ageOfItemToExportInDays;
            var previousDate = this.getPreviousDayDate(ageOfItemToExportInDays);
            filters.push(new nlobjSearchFilter('lastmodifieddate',  null, 'onorafter', previousDate));
            //filters.push(new nlobjSearchFilter('internalid',  null, 'is', '1289'));
            return this.getItemsData(filters);
        },

        /**
         * Get Items data from NetSuite to Export
         */
        getItemsData: function (filters) {
            filters.push(new nlobjSearchFilter('type',  null, 'anyof', ['InvtPart']));
            var results = nlapiSearchRecord('item', null, filters);
            return results;
        },

        /**
         * Get date of the previous no. of days mentioned in config data
         * @param ageOfRecordsInDays
         * @returns {*}
         */
        getPreviousDayDate: function(ageOfRecordsInDays) {
            Utility.logDebug('ageOfRecordsInDays', ageOfRecordsInDays);
            var currentDate = Utility.getDateUTC(0);
            var oldDate = nlapiAddDays(currentDate, '-'+ageOfRecordsInDays);
            oldDate = nlapiDateToString(oldDate);
            oldDate = oldDate.toLowerCase();
            oldDate = nlapiDateToString(nlapiStringToDate(oldDate, 'datetime'), 'datetime');
            Utility.logDebug('PreviousDayDate', oldDate);
            return oldDate;
        },

        /**
         * Process item for external system
         * @param store
         * @param itemInternalId
         * @param itemType
         */
        processItem: function(store, itemInternalId, itemType, createOnly) {
            var itemObject = this.getItemObject(store, itemInternalId, itemType);
            Utility.logDebug('itemObject', JSON.stringify(itemObject));
            // skip export if instructed to created only and record is already exported to other system
            if (!(!!createOnly && itemObject.alreadySyncToCurrentExternalSystem)) {
                var responseBody = this.exportItemToExternalSystem(store, itemInternalId, itemType, itemObject, createOnly);
                Utility.logDebug('ItemExportLibrary.responseBody', JSON.stringify(responseBody));
                if (!!responseBody.status) {
                    if (!!responseBody.data.externalSystemItemId) {
                        var otherSystemsItemIdsArray = this.getExternalSystemIdObjectArrayString(store.systemId, responseBody.data.externalSystemItemId, !!itemObject.externalSystemIdsString ? 'update' : 'create', itemObject.externalSystemIdsString);
                        Utility.logDebug('otherSystemsItemIdsArray', JSON.stringify(otherSystemsItemIdsArray));
                        this.setItemExternalSystemId(itemType, otherSystemsItemIdsArray, itemInternalId);
                    } else {
                        Utility.logDebug('Error', 'Other system Item Id not generated');
                    }
                    Utility.logDebug('successfully', 'Other system Item created');
                } else {
                    Utility.logException('Some error occurred while creating Other system Item', responseBody.error);
                    Utility.throwException("RECORD_EXPORT", 'Some error occurred while creating Other system Item - ' + responseBody.error);
                }
            }

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
                Utility.logException('ItemExportLibrary.setItemExternalSystemId', e);
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
                Utility.logException('ItemExportLibrary.markStatus', e);
            }
        },

        /**
         *
         * @param store
         * @param itemInternalId
         * @param itemType
         */
        getItemObject: function(store, itemInternalId, itemType) {
            var itemRecord = nlapiLoadRecord(itemType, itemInternalId);
            var itemObject = {};
            itemObject.internalId = itemInternalId;
            itemObject.itemType = itemType;
            itemObject.itemId = itemRecord.getFieldValue('itemid');
            itemObject.displayName = itemRecord.getFieldValue('displayname');
            itemObject.upcCode = itemRecord.getFieldValue('upccode');
            itemObject.parentItem = itemRecord.getFieldValue('parent');
            itemObject.isMatrixChildItem = !!itemObject.parentItem;
            itemObject.isMatrixParentItem = false;
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


            itemObject.purchasePrice = itemRecord.getFieldValue('cost');
            itemObject.onlineCustomerPrice = itemRecord.getFieldValue('onlinecustomerprice');
            itemObject.salesPrice = itemRecord.getFieldValue('price');
            this.setTierPriceData(store, itemObject, itemRecord);
            this.setExternalSystemData(store, itemInternalId, itemType, itemObject, itemRecord);


            this.setItemFieldsBasedOnType(store, itemInternalId, itemType, itemObject, itemRecord);

            return itemObject;
        },

        /**
         * Set data fields related to external system
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         */
        setExternalSystemData: function(store, itemInternalId, itemType, itemObject, itemRecord) {
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
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         * @param itemRecord
         */
        checkItemSyncToCurrentStore: function (store, externalSystemIds) {
            var externalSystemId = '';
            if(!!externalSystemIds && externalSystemIds.length > 0) {
                for (var i = 0; i < externalSystemIds.length; i++) {
                    var obj = externalSystemIds[i];
                    if(!!obj.StoreId && obj.StoreId == store.systemId) {
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
        setTierPriceData: function(store, itemObject, itemRecord) {
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
        setItemFieldsBasedOnType: function(store, itemInternalId, itemType, itemObject, itemRecord) {
            switch (itemType) {
                case this.configData.ItemTypes.InventoryItem:
                    ConnectorConstants.CurrentWrapper.setInventoryItemFields(store, itemInternalId, itemType, itemObject, itemRecord);
                    break;
                default:
                    break;
            }
        },

        /**
         * Export Item To External System
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         */
        exportItemToExternalSystem: function(store, itemInternalId, itemType, itemObject, createOnly) {
            var responseBody = null;
            switch (itemType) {
                case this.configData.ItemTypes.InventoryItem:
                    responseBody = this.exportInventoryItemToExternalSystem(store, itemInternalId, itemType, itemObject, createOnly);
                    break;
                default:
                    break;
            }
            return responseBody;
        },

        /**
         * Export Inventory item to External System
         * @param store
         * @param itemInternalId
         * @param itemType
         * @param itemObject
         */
        exportInventoryItemToExternalSystem: function(store, itemInternalId, itemType, itemObject, createOnly) {
            return ConnectorConstants.CurrentWrapper.exportInventoryItem(store, itemInternalId, itemType, itemObject, createOnly);
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