/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module("f3UC")
        .controller("ActionsController", ActionsController);

    function ActionsController($f3Actions, $state, f3Store, $stateProvider) {

        console.log('ActionsController', arguments);
        console.log('$f3Actions', $f3Actions);

        //this.selectedAction = null;
        this.storeChanged = function(manual){
            console.log('store changed!', this.selectedStore);
            if(!!this.selectedStore) {
                f3Store.id = this.selectedStore.id;

                if(manual !== true) {
                    console.log('reloading state: ' + $state.current.name);
                    $state.go($state.current.name, $state.params, {reload: true});
                }
            }
        };

        this.storeId = f3Store.id;
        this.groupedActions = {};
        this.actions = [];

        this.selectedStore = _stores && _stores[0];
        this.storeChanged(true); // invoke manually for first time

        this.stores = _stores;

        this.menuState = [];


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
                        action: action.action,
                        icon: action.icon
                    });

                } else {
                    this.actions.push({
                        title: action.title,
                        key: key,
                        action: action.action,
                        icon: action.icon
                    });
                }
            }
        };



        this.generateMenuData($f3Actions.getAll());

    }

})();
