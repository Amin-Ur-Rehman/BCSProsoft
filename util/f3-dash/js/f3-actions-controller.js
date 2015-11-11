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
                        groupIcon: obj.groupIcon,
                        title: obj.title,
                        navigateUrl: obj.navigateUrl,
                        icon: obj.icon,                        
                        url: obj.url
                    };
                    
                    obj.templateUrl && (state.templateUrl = f3_base_url + obj.templateUrl + '?__cacheId=' + cacheKey);
                    obj.controller && (state.controller = obj.controller);
                    obj.controllerAs && (state.controllerAs = obj.controllerAs);

                    $f3Actions.state(obj.key, state);
                }

                _self.generateMenuData($f3Actions.getAll());


                $state.go('index', $state.params, {reload: true});

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
                            groupIcon: action.groupIcon,
                            actions: []
                        };

                        this.actions.push(foundGroup);
                    }

                    foundGroup.actions.push({
                        title: action.title,
                        key: key,
                        navigateUrl: action.navigateUrl,
                        icon: action.icon,
                        selected: false
                    });

                } else {
                    this.actions.push({
                        title: action.title,
                        key: key,
                        navigateUrl: action.navigateUrl,
                        icon: action.icon,
                        selected: false
                    });
                }
            }
        };


        // ng-click="actionsController.selectAction(action.key)"
        this.selectAction = function(key){
            for (var i = this.actions.length - 1; i >= 0; i--) {
                var action = this.actions[i];
                action.selected = false;
                if(action.actions) {
                    for (var j = action.actions.length - 1; j >= 0; j--) {
                        var subAction = action.actions[j];
                        subAction.selected = false;
                    }
                }
            }


            for (var i = this.actions.length - 1; i >= 0; i--) {
                var action = this.actions[i];
                if(action.key == key) {
                    action.selected = true;
                    break;
                }
                if(action.actions) {
                    for (var j = action.actions.length - 1; j >= 0; j--) {
                        var subAction = action.actions[j];
                        if(subAction.key == key){
                            subAction.selected = true;
                            break;
                        }
                    }
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
