/**
 * Created by wahajahmed on 10/13/2015.
 */

declare class Utility {
    static logDebug(title:string, description:string):void;

    static logException(title:string, exception:any):void;

    /**
     * Check if value exist or not
     * @param str
     */
    static isBlankOrNull(str:string):boolean;
}

declare class MagentoWrapper {

}

declare class ConnectorModels {
    static salesOrderModel():void;

    static productModel():void;
}
declare class ConnectorConstants {
    static CurrentStore:any;
}
