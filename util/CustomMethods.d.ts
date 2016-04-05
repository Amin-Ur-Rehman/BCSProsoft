/**
 * Created by wahajahmed on 10/13/2015.
 */

declare class Utility {
    public static logDebug(title: string, description: string): void;

    public static logException(title: string, exception: any): void;

    /**
     * Check if value exist or not
     * @param str
     */
    public static isBlankOrNull(str: string): boolean;
}

declare class MagentoWrapper {
    public static _nlapiRequestURL(url: any, postdata?: any, headers?: any, callback?: any, httpMethod?: any): any;
}

declare class ConnectorModels {
    public static salesOrderModel(): void;

    public static productModel(): void;
}
declare class ConnectorConstants {
    public static CurrentStore: any;
    public static Item: any;
    public static ScrubsList: any;

    public static initializeScrubList(): void;
}


declare class FC_ScrubHandler {
    public static findValue(system: any, type: any, key: any): any;
}