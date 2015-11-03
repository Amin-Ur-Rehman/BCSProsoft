/**
 * Created by zahmed on 13-Jan-15.
 *
 * Description:
 * - This script is responsible for syncing inventory quantity and pricing to Magento store(s)
 * -
 * Referenced By:
 * -
 * Dependency:
 * - Script Parameters:
 *   - InternalId - custscriptcustscriptinternalid - Free-Form Text
 *   - Start Date - custscript_start_date - Date/Time
 * -
 * - Script Id:
 *   - customscript_magento_item_sync_sch
 * -
 * - Deployment Id:
 *   - customdeploy_magento_item_sync_sch
 * -
 * - Scripts:
 *   - folio3ConnectorLicenseVerification.js
 *   - mc_sync_constants.js
 *   - f3_inventory_sync_script_dao.js
 *   - f3_utility_methods.js
 *   - f3mg_connector_constants.js
 *   - f3mg_connector_common.js
 *   - f3mg_xml_utility.js
 *   - f3_external_system_config_dao.js
 *   - f3_client_factory.js
 *   - f3mg_ns_mg_shipping_methods_map_dao.js
 */

function getMagentoParents(itemId) {
    var result = [];
    try {
        var cols = [];
        var fils = [];
        fils.push(new nlobjSearchFilter('custrecord_mpss_parent_matrix_item', null, 'anyof', [itemId], null));
        cols.push(new nlobjSearchColumn('custrecord_mpss_parent_matrix_item', null, null));
        cols.push(new nlobjSearchColumn('custrecord_mpss_magento_id', null, null));
        cols.push(new nlobjSearchColumn('custrecord_mpss_magento_sku', null, null));
        result = nlapiSearchRecord('customrecord_f3_matrix_parent_sync_stats', null, fils, cols) || [];
    } catch (e) {
        Utility.logException('MatrixParentSyncStatus.lookup', e);
    }
    return result;
}


/**
 * Making an object required for generating CatalogProductAttributeTierPriceUpdate XML
 * @param product
 * @return {object}
 *
 * Note: Currently I handle only one curreny USD and base price level having id 1
 *
 * Help:
 * Sublist Sample Code: https://system.netsuite.com/app/help/helpcenter.nl?fid=section_N3216851.html#bridgehead_N3221129
 */
function getTierPriceDataObj(product) {
    // Check the features enabled in the account. See Pricing Sublist Feature Dependencies for
    // details on why this is important.
    var multiCurrency = nlapiGetContext().getFeature('MULTICURRENCY');
    var multiPrice = nlapiGetContext().getFeature('MULTPRICE');
    var quantityPricing = nlapiGetContext().getFeature('QUANTITYPRICING');

    // Set the name of the Price sublist based on features enabled and currency type.
    // See Pricing Sublist Internal IDs for details on why this is important.
    var priceID;
    var currencyID = "USD";

    // Set the ID for the sublist and the price field. Note that if all pricing-related features
    // are disabled, you will set the price in the rate field. See Pricing Sublist Feature Dependencies
    // for details.
    if (!multiCurrency && !multiPrice && !quantityPricing) {
        priceID = "rate";
    }
    else {
        priceID = "price";
        if (multiCurrency) {
            //var internalId = nlapiSearchRecord('currency', null, new nlobjSearchFilter('symbol', null, 'contains', currencyID))[0].getId();
            //for USD as default curremcy id - TODO: generalize in future for more than one currency support
            var internalId = 1;
            // Append the currency ID to the sublist name
            priceID = priceID + internalId;
        }
    }

    var obj = {};
    var itemRec = product.itemRec;
    var catalogProductTierPriceEntityArray = [];
    var qty, price;

    // reading price level from configuration
    var priceLevel = ConnectorConstants.CurrentStore.entitySyncInfo.item.priceLevel;

    for (var i = 2; i <= 5; i++) {
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

    obj.catalogProductTierPriceEntityArray = catalogProductTierPriceEntityArray;
    obj.product = product.magentoSKU;
    obj.identifierType = product.identifierType;

    Utility.logDebug('getTierPriceDataObj', JSON.stringify(obj));

    return obj;
}

/**
 * Sync inventory quantity and price for matirx child and parent products to magento
 * @param product
 * @param productRecordtype
 * @param product_id
 * @param sessionID
 * @param isParent
 */
function syncProduct(product, productRecordtype, product_id, sessionID, isParent) {
    try {
        Utility.logDebug('Sync Product ', isParent);
        // check if Magento Item is in NetSuite
        if (!Utility.isBlankOrNull(product.magentoSKU)) {
            var magID = null;
            var shopifyProduct;
            var response = ConnectorConstants.CurrentWrapper.getProduct(sessionID, product);
            if (response.status) {
                magID = response.product.id;
                // this for urgent fix for shopify - will rewrite this script
                shopifyProduct = response.product;
            }
            //var magID = product.magentoSKU;
            if (Utility.isBlankOrNull(magID)) {
                Utility.logDebug('Product couldn\'t update', product.magentoSKU);
                return;
            }
            var responseMagento = ConnectorConstants.CurrentWrapper.updateItem(product, sessionID, magID, isParent, shopifyProduct);
            // If due to some reason Magento item is unable to update
            // Send Email Magento Side error
            if (!responseMagento.status) {
                var msg = 'Item having Magento Id: ' + magID + ' has not exported. of SKU  -- ' + product.magentoSKU + "FC" + responseMagento.faultCode + '--' + responseMagento.faultString;
                //   var msg = 'Item having Magento Id: ' + product.magentoId + ' has not exported. -- ' + responseMagento.faultCode + '--' + responseMagento.faultString;
                // generateErrorEmail(msg, configuration, 'item');
                Utility.logDebug(" Error From Magento ", msg);
            } else {
                // Updated Successfully
                Utility.logDebug('item: ' + product_id + ' price: ', +product.price + ' item synced successfully - quantity: ' + product.quatity);
                // Check for feature availability
                if (!FeatureVerification.isPermitted(Features.EXPORT_ITEM_TIERED_PRICING, ConnectorConstants.CurrentStore.permissions)) {
                    Utility.logEmergency('FEATURE PERMISSION', Features.EXPORT_ITEM_TIERED_PRICING + ' NOT ALLOWED');
                    return;
                }
                product.tierPriceDataObj = getTierPriceDataObj(product);
                // syncing tier prices after updating item succesfully
                var tierPriceResponse = ConnectorConstants.CurrentWrapper.syncProductTierPrice(product);
                if (tierPriceResponse.status) {
                    Utility.logDebug('Tier Price Update Successfully', 'Magento Id: ' + product.magentoSKU);
                } else {
                    var msg = 'Item having Magento Id: ' + product.magentoSKU + ' has not exported. -- ' + tierPriceResponse.faultCode + '--' + tierPriceResponse.faultString;
                    Utility.logDebug('Tier Price Update Failed', msg);
                }
            }
        }
    } catch (ex) {
        Utility.logException('syncProduct- product id: ' + product_id, ex);
    }
}

function ws_soaftsubm(type) {
    if (MC_SYNC_CONSTANTS.isValidLicense()) {
        // inititlize constants
        ConnectorConstants.initialize();
        // getting configuration
        var externalSystemConfig = ConnectorConstants.ExternalSystemConfig;
        var context = nlapiGetContext();
        // it is for item sync
        var externalSystemArr = [];

        externalSystemConfig.forEach(function (store) {
            ConnectorConstants.CurrentStore = store;
            ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
            ConnectorConstants.CurrentWrapper.initialize(store);
            // Check for feature availability
            if (!FeatureVerification.isPermitted(Features.UPDATE_ITEM_TO_EXTERNAL_SYSTEM, ConnectorConstants.CurrentStore.permissions)) {
                Utility.logEmergency('FEATURE PERMISSION', Features.UPDATE_ITEM_TO_EXTERNAL_SYSTEM + ' NOT ALLOWED');
                return;
            }
            var sessionID = ConnectorConstants.CurrentWrapper.getSessionIDFromServer(store.userName, store.password);
            if (!sessionID) {
                Utility.logDebug('sessionID', 'sessionID is empty');
                return;
            }
            store.sessionID = sessionID;
            // push store object after getting id for updating items in this store
            externalSystemArr.push(store);
        });

        if (externalSystemArr.length === 0) {
            Utility.logDebug('Item Sync Script', 'Item Sync is not enabled');
            return;
        }

        try {
            // set the percent complete parameter to 0.00
            context.setPercentComplete(0.00);
            // set store for ustilizing in other functions

            var scriptStartDate = context.getSetting('SCRIPT', ConnectorConstants.ScriptParameters.ScriptStartDate);
            var lastModifiedDate = ConnectorCommon.getLastModifiedDate();

            if (Utility.isBlankOrNull(scriptStartDate)) {
                var currentDate = Utility.getDateUTC(-8);
                scriptStartDate = nlapiDateToString(currentDate, 'datetimetz');
            }

            var paramInternalId = context.getSetting('SCRIPT', ConnectorConstants.ScriptParameters.LastInternalId);
            Utility.logDebug('Param', paramInternalId);

            Utility.logDebug('startup', 'Start Syncing');

            do {
                // Fetching next 1000 records
                var filter = [];
                var column = [];

                filter.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', !!paramInternalId ? paramInternalId : '-1', null));
                //filter.push(new nlobjSearchFilter('internalid', null, 'is', '387'));
                filter.push(new nlobjSearchFilter(ConnectorConstants.Item.Fields.MagentoSync, null, 'is', 'T', null));
                filter.push(new nlobjSearchFilter('lastmodifieddate', null, 'onorafter', lastModifiedDate, null));
                //filter.push(new nlobjSearchFilter('lastmodifieddate', null, 'onorafter', '8/18/2015 8:15 am', null));
                // for test add this filter by allozhu
                //filter.push(new nlobjSearchFilter('internalid', null, 'anyof', ["728"], null));


                var col = new nlobjSearchColumn('internalid', null, null);
                col.setSort(false);
                column.push(col);
                column.push(new nlobjSearchColumn('modified', null, null));

                var records = nlapiSearchRecord('item', null, filter, column) || [];
                Utility.logDebug('record count', ' ' + records.length);
                Utility.logDebug('parammm', paramInternalId);
                var skip = false;

                if (records.length > 0) {

                    // processing records  //records.length
                    for (var j = 0; j < records.length; j++) {
                        skip = false;
                        var product_id = records[j].getId();

                        if (j == 0) {
                            Utility.logDebug('1st ProductId', product_id);
                        }
                        if (j >= records.length - 1) {
                            Utility.logDebug('Last ProductId', product_id);
                            paramInternalId = product_id;
                        }

                        var itemRec = nlapiLoadRecord(records[j].getRecordType(), product_id, null);
                        Utility.logDebug('itemRec', JSON.stringify(itemRec));

                        // handling multiple stores

                        Utility.logDebug('externalSystemArr length', externalSystemArr.length + ' ');
                        externalSystemArr.forEach(function (store) {
                            Utility.logDebug('Inside externalSystemArr', '');
                            ConnectorConstants.CurrentStore = store;

                            ConnectorConstants.CurrentWrapper = F3WrapperFactory.getWrapper(store.systemType);
                            ConnectorConstants.CurrentWrapper.initialize(store);

                            Utility.logDebug('checkpoint', '1');
                            var magentoId = itemRec.getFieldValue(ConnectorConstants.Item.Fields.MagentoId);
                            // parse object
                            magentoId = !Utility.isBlankOrNull(magentoId) ? JSON.parse(magentoId) : [];
                            //getting magento id from json array for the store
                            magentoId = ConnectorCommon.getMagentoIdFromObjArray(magentoId, store.systemId);
                            Utility.logDebug('checkpoint', '2');
                            // skip item if no magento id found
                            if (Utility.isBlankOrNull(magentoId)) {
                                Utility.logDebug('checkpoint', '3');
                                return;
                            }
                            Utility.logDebug('checkpoint', '4');
                            // getting store price level
                            var soprice = store.entitySyncInfo.item.priceLevel;
                            Utility.logDebug('priceLevel', soprice);
                            Utility.logDebug('checkpoint', '5');
                            var sessionID = store.sessionID;
                            var quantityLocation = store.entitySyncInfo.item.quantityLocation;

                            var product = {};
                            product.itemRec = itemRec;
                            product.identifierType = "sku";

                            // product.queenStock = itemRec.getFieldValue('custitem_queenst_stock');
                            if (!ConnectorCommon.isDevAccount()) {
                                Utility.logDebug('checkpoint', '6');
                                // TODO: check multipricing feature & update dynamic sublist id
                                product.price = itemRec.getLineItemValue('price1', 'price_1_', soprice) || 0;
                                // check  multi location feature
                                if (Utility.isMultiLocInvt()) {
                                    Utility.logDebug('checkpoint', '7');
                                    var locLine = itemRec.findLineItemValue('locations', 'location', quantityLocation);
                                    //product.quatity = itemRec.getLineItemValue('locations', 'quantityonhand', locLine) || 0;
                                    product.quatity = itemRec.getLineItemValue('locations', 'quantityavailable', locLine) || 0;
                                } else {
                                    product.quatity = itemRec.getFieldValue('quantityavailable') || 0;
                                }

                            } else {
                                Utility.logDebug('checkpoint', '8');
                                product.price = itemRec.getLineItemValue('price1', 'price_1_', soprice) || 0;
                                //product.quatity = itemRec.getLineItemValue('locations', 'quantityonhand', 1) || 0;
                                product.quatity = itemRec.getLineItemValue('locations', 'quantityavailable', 1) || 0;
                            }

                            // for woo
                            product.quantity = product.quatity;

                            var productRecordtype = records[j].getRecordType();
                            var matrixType = itemRec.getFieldValue('matrixtype');
                            Utility.logDebug('checkpoint', '9');
                            // if matrix parent then getting magento ids from custom records
                            // TODO: changes matrix science
                            if (matrixType === 'PARENT') {
                                Utility.logDebug('checkpoint', '10');
                                var mgParentRecs = getMagentoParents(product_id);
                                for (var p in mgParentRecs) {
                                    var mgParentRec = mgParentRecs[p];
                                    var mgProductId = mgParentRec.getValue('custrecord_mpss_magento_id');
                                    product.magentoSKU = mgProductId;
                                    Utility.logDebug('updating now matrix... ', 'updating now... ');
                                    syncProduct(product, productRecordtype, product_id, sessionID, true);
                                }
                                // Updated Successfully
                                Utility.logDebug('item id: ' + product_id, 'configurable items are synced successfully');
                                //nlapiSubmitField(productRecordtype, product_id, 'custitem_item_sync', 'F');
                            } else {
                                Utility.logDebug('checkpoint', '11');
                                // if child matrix item
                                product.magentoSKU = magentoId;
                                Utility.logDebug('updating now... ', 'updating now... ');
                                syncProduct(product, productRecordtype, product_id, sessionID, false);
                            }

                            // handle script rescheduling
                            var usageRemaining = context.getRemainingUsage();
                            if (usageRemaining < 2000) {
                                Utility.logDebug('checkpoint', '12');
                                var params = [];
                                params[ConnectorConstants.ScriptParameters.LastInternalId] = product_id;
                                params[ConnectorConstants.ScriptParameters.ScriptStartDate] = scriptStartDate;
                                Utility.logDebug('Scheduled', product_id);
                                nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), params);
                                return true;
                            }

                            context.setPercentComplete(Math.round(((100 * j) / records.length) * 100) / 100);  // calculate the results

                            // displays the percentage complete in the %Complete column on
                            // the Scheduled Script Status page
                            context.getPercentComplete();  // displays percentage complete

                            Utility.logDebug('index', j + ' productId  ' + product_id + ' usageLimt  ' + usageRemaining);
                        });
                    }
                }

            } while (records.length > 0);

            // update date in custom record
            Utility.logDebug('Last Run Date', scriptStartDate);
            InventorySyncScript.updateStatus('Last Run Date', scriptStartDate);

        } catch (e) {
            Utility.logException('ws_soaftsubm', e);
        }
    } else {
        Utility.logDebug('Validate', 'License has expired');
    }
}