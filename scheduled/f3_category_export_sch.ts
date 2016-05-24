/**
 * Created by akumar on 5/9/2016.
 */

// Referencing base class
/// <reference path="../scheduled/f3_base_sch.ts" />

class CategoryExportScheduled extends BaseScheduled {
    public scheduled (type:ScheduleScriptType):boolean {
        if (!super.scheduled(type)) {
            return false;
        }

        try {
            Utility.logDebug('CategoryExportScheduled.scheduled', 'Start');
            
            this.iterateOverStoresWithPermittedFeature(
                Features.EXPORT_CATEGORY_TO_EXTERNAL_SYSTEM,
                this.exportCategories.bind(this)
            );

            Utility.logDebug('CategoryExportScheduled.scheduled', 'End');
        }
        catch (e) {
            Utility.logException('CategoryExportScheduled.scheduled', e);

            return false;
        }

        return true;
    }

    /**
     * This function exports internal categories to external
     * @param store
     * @param externalSystemWrapper
     */
    exportCategories(store:Store, externalSystemWrapper:ExternalSystemWrapper) {
        Utility.logDebug('CategoryExportScheduled.scheduled : store.storeType', store.systemType);

        this.store = store;
        this.externalSystemWrapper = externalSystemWrapper;
        
        var netsuiteWrapper = NetSuiteSOAPWrapper.createInstanceForStore(store);
        var topCategories = netsuiteWrapper.getTopCategoriesWithTree();
        // ConnectorCommon.createLogRec('-', JSON.stringify(topCategories), 'Internal Categories');

        var websites = this.getCategoryWebsites(topCategories);
        var websitesMap = this.setRootCategoriesToExternalSystemAndGetWebsitesMap(websites);

        this.setCategoriesToExternalSystem(topCategories, websitesMap);
        // ConnectorCommon.createLogRec('-', JSON.stringify(wrapper.getCategories(1, 999)), 'External Categories');
    }

    /**
     * Returns array of category websites from
     * given categories
     *
     * @param categories
     * @returns {Array<CategoryWebsite>}
     */
    getCategoryWebsites(categories:Array<Category>):Array<CategoryWebsite> {
        var websites:KeyValue<string> = {};
        for (var i = categories.length - 1; i >= 0; --i) {
            var category = categories[i];
            if (!category.website) continue;

            var websiteId = category.website.internalId;
            if (!websites[websiteId]) {
                websites[websiteId] = category.website.name;
            }
        }

        var categoryWebsites:Array<CategoryWebsite> = [];
        for (var internalId in websites) {
            var categoryWebsite:CategoryWebsite = {
                internalId: internalId,
                name: websites[internalId]
            };

            categoryWebsites.push(categoryWebsite);
        }
        return categoryWebsites;
    }

    /**
     * Sets root categories to external system,
     * and returns updated websites map
     *
     * @param websites
     * @returns {any}
     */
    setRootCategoriesToExternalSystemAndGetWebsitesMap(websites:Array<CategoryWebsite>):any {
        var store = this.store;
        var wrapper = this.externalSystemWrapper;

        var websitesMap = ExternalSystemCategory2Dao.getMapForExternalSystemId(store.systemId, true);
        var justUpdated:any = {};

        var storeId = store.internalId;
        for (var i = websites.length - 1; i >= 0; --i) {
            var website = websites[i];

            Utility.logDebug('CategoryExportScheduled.setRootCategoriesToExternalSystem', website.name);

            var internalId = website.internalId;
            var externalId = websitesMap[internalId];
            var category:Category = {
                itemId: website.name,
                isInactive: false
            };

            if (externalId && !justUpdated[externalId]) {
                Utility.logDebug('CategoryExportScheduled.setRootCategoriesToExternalSystem', 'UPDATE');

                wrapper.updateCategory(category, null, externalId);
            }
            else {
                Utility.logDebug('CategoryExportScheduled.setRootCategorieToExternalSystem', 'CREATE');

                externalId = wrapper.createCategory(category, null);
                if (externalId) {
                    websitesMap[internalId] = externalId;
                    justUpdated[internalId] = true;
                    ExternalSystemCategory2Dao.upsertWithArgs(internalId, externalId, storeId, 'T');
                }
            }
        }

        return websitesMap;
    }

    /**
     * Sets given internal categories to external categories
     *
     * @param internalCategories
     * @param websitesMap
     */
    setCategoriesToExternalSystem(internalCategories:Array<Category>, websitesMap) {
        var store = this.store;
        var wrapper = this.externalSystemWrapper;

        var internalToExternalCategoryIdsMap = ExternalSystemCategory2Dao.getMapForExternalSystemId(store.systemId, false);
        var categoriesToSet:Array<Category> = [].concat(internalCategories);
        var storeId = store.internalId;

        while (categoriesToSet.length > 0) {
            var category:Category = categoriesToSet.shift();
            var internalId = category.internalId;
            var externalId = internalToExternalCategoryIdsMap[internalId];

            Utility.logDebug('CategoryExportScheduled.setCategoriesToExternalSystem', category.itemId);

            var externalParentCategoryId;
            if (category.parentCategory) {
                externalParentCategoryId = internalToExternalCategoryIdsMap[category.parentCategory.internalId];
            } else if (category.website) {
                externalParentCategoryId = websitesMap[category.website.internalId];
            }
            else {
                // TODO: deal with this case
                Utility.logDebug('CategoryExportScheduled.setCategoriesToExternalSystem', 'category skipped; not in any website');
                continue ;
            }

            if (!externalParentCategoryId) {
                Utility.logDebug('CategoryExportScheduled.setCategoriesToExternalSystem', 'externalParentCategoryId can\'t be undefined');
                continue ;
            }

            if (externalId) {
                Utility.logDebug('CategoryExportScheduled.setCategoriesToExternalSystem', 'UPDATE');

                wrapper.updateCategory(category, externalParentCategoryId, externalId);
            }
            else {
                Utility.logDebug('CategoryExportScheduled.setCategoriesToExternalSystem', 'NEW');

                externalId = wrapper.createCategory(category, externalParentCategoryId);
                if (externalId) {
                    internalToExternalCategoryIdsMap[internalId] = externalId;
                    ExternalSystemCategory2Dao.upsertWithArgs(internalId, externalId, storeId, 'F');
                }
            }

            categoriesToSet = categoriesToSet.concat(category.childCategories);
        }
    }

    static main(args) {
        var success = (new CategoryExportScheduled()).scheduled(args);
        if (success) {
            Utility.logDebug('CategoryExportScheduled.main', 'SUCCESSFUL');
        }
    }
}
