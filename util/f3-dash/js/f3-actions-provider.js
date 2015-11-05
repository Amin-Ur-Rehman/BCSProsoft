/**
 * Created by zshaikh on 10/8/2015.
 */

(function() {

    'use strict';

    angular.module('f3UC')
        .provider('$f3Actions', ['$stateProvider', function $F3ActionsProvider($stateProvider) {

            this.actions = {};

            this.state = function (key, obj) {
                console.log('$f3Actions.state(); ',key, obj);
                var group = obj.group;
                if (!!group) {
                    group = group.toLowerCase();
                    group = group.replace(/ /gi, '-');
                    obj.url = group + obj.url;
                }

                this.actions[key] = obj;

                $stateProvider.state(key, obj);

                return this;
            };

            this.getAll = function () {
                return this.actions;
            };

            this.$get = function () {
                return this;
            };

        }]);

})();
