/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("ActionsController", ActionsController);

    function ActionsController($f3Actions, $state, f3Store, $http, f3Utility) {

        console.log('ActionsController', arguments);
        console.log('$f3Actions', $f3Actions);

        var _self = this;

        this.storeChanged = function(manual){
            console.log('store changed!', this.selectedStore);
            if(!!this.selectedStore) {
                f3Store.id = this.selectedStore.id;

                if (manual !== true) {
                    var apiUrl = location.href.replace(location.hash, '');
                    apiUrl = f3Utility.updateQS(apiUrl, 'store_id', f3Store.id);
                    window.location.href = apiUrl;
                    //+ '&method=getMenu&store_id=' + f3Store.id;
                }
            }
        };

        this.actions = [];
        this.stores = _stores;

        

        this.selectedStore = findStore(_stores, _selectedStoreJson.id);
        this.storeChanged(true); // invoke manually for first time


        var apiUrl = location.href.replace(location.hash, '') + '&method=getMenu&store_id=' + f3Store.id;

        console.log('apiUrl: ' + apiUrl);
        $http.get(apiUrl)
            .success(function(response) {

                console.log('$http.get().success();//');

                var menuItems = _.sortBy(response, function(item){
                    return item.menuOrder;
                });

                var cacheKey = (new Date()).getTime();
                for (var i = 0; i < menuItems.length; i++) {
                    var obj = menuItems[i];
                    var state = {
                        group: obj.group,
                        title: obj.title,
                        navigateUrl: obj.navigateUrl,
                        templateUrl: f3_base_url + obj.templateUrl + '?__cacheId=' + cacheKey,
                        controller: obj.controller,
                        controllerAs: obj.controllerAs,
                        url: obj.url
                    };
                    
                    $f3Actions.state(obj.key, state);
                }

                _self.generateMenuData($f3Actions.getAll());

            });


        // convert to heirarchial menu
        this.generateMenuData = function(allActions) {

            for (var key in allActions) {
                var action = allActions[key];

                if (!!action.group) {

                    var foundGroup = this.actions.filter(function (item) {
                        return item.group == action.group
                    })[0];

                    if (!foundGroup) {

                        foundGroup = {
                            group: action.group,
                            actions: []
                        };

                        this.actions.push(foundGroup);
                    }

                    foundGroup.actions.push({
                        title: action.title,
                        key: key,
                        navigateUrl: action.navigateUrl,
                        icon: action.icon
                    });

                } else {
                    this.actions.push({
                        title: action.title,
                        key: key,
                        navigateUrl: action.navigateUrl,
                        icon: action.icon
                    });
                }
            }
        };


        function findStore(stores, id) {
            var found = null;
            for (var i = stores.length - 1; i >= 0; i--) {
                var obj = stores[i];
                if(obj.id == id) {
                    found = obj;
                    break;
                }
            };
            return found;
        }
    }

})();
