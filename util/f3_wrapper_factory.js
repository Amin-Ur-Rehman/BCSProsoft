/**
 * Created by zahmed on 14-Jan-15.
 *
 * Referenced By:
 * -
 * -
 * Dependency:
 * - f3_utility_methods.js
 * -
 */

/**
 * This script is responsible for returning the object on client basis.
 */
F3WrapperFactory = (function () {
    return {
        /**
         * Init method
         */
        getWrapper: function (type) {
            var client = null;

            switch (type) {
                case 'MAGENTO':
                    client = MagentoWrapper;
                    break;
                case 'SHOPIFY':
                    client = ShopifyWrapper;
                    break;
                case 'WOO':
                    client = WooWrapper;
                    break;
                case 'EBAY':
                    client = EbayWrapper;
                    break;
            }

            client.clientType = type;

            return client;
        }
    };
})();

