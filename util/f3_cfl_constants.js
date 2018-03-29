/**
 * Created by Amin on 27-Mar-18.
 *
 * - Script Id:
 *   -
 *
 * - Deployment Id:
 *  -
 *
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Folio3 Pvt. Ltd. and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 *
 *
 *
 * Version  Date            Author           Remarks
 * 1.00     27 Mar 2018     Amin        This script is written to create a runTime sublist on
 *                                      customer record to show Customer Favourite Lines records
 *                                      as sublist on customer record without pagination.
 **/
var UEConstants = /** @class */ (function () {
    function UEConstants() {
    }
    UEConstants.subListConstants = {
        subListId: "custpage_cfl",
        subListType: "inlineeditor",
        subListName: "Customer Favorite Lines",
        subListTab: "general",
        sublistFields: {
            type: {
                select: "select",
                text: "text",
                currency: "currency",
                float: "float",
                integer: "integer",
                checkbox: "checkbox",
                date: "date"
            },
            record: {
                Customer: "customer",
                Item: "item",
                Vendor: "vendor",
                Transaction: "transaction"
            },
            id: {
                Customer: "custrecord_bcs_cust_fav_lines_parent",
                Item: 'custrecord_bcs_cust_fav_lines_item',
                MFG: 'custrecord_bcs_cust_fav_lines_manu',
                OEM: 'custrecord_bcs_cust_fav_lines_oem',
                Vendor: 'custrecord_bcs_cust_fav_lines_vendor',
                VendorPart: 'custrecord_bcs_cust_fav_lines_vendorpart',
                Description: 'custrecord_bcs_cust_fav_lines_descriptio',
                Cost: 'custrecord_bcs_cust_fav_lines_cost',
                StdPrice: 'custrecord_bcs_cust_fav_lines_price',
                MRG: 'custrecord_bcs_cust_fav_lines_margin',
                QuotePrice: 'custrecord_bcs_cust_fav_lines_quoted',
                Quantity: 'custrecord_bcs_cust_fav_lines_qty',
                Extension: 'custrecord_bcs_cust_fav_lines_extension',
                OldCost: 'custrecord_bcs_cust_fav_lines_oldcost',
                OldMrg: 'custrecord_bcs_cust_fav_lines_oldmarg',
                Inactive: 'custrecord_bcs_cust_fav_lines_status',
                LastUpdated: 'custrecord_bcs_cust_fav_lines_clastaprov',
                ExcludeWeb: 'custrecord_bcs_cust_fav_lines_exclweb',
                Contract: 'custrecord_bcs_cust_fav_lines_contract',
                DateAdded: 'custrecord_bcs_cust_fav_lines_dateadded',
                DateLastOrdered: 'custrecord_bcs_cust_fav_lines_dateorder',
                lastOrder: 'custrecord_bcs_cust_fav_lines_lastorder',
            },
            name: {
                Customer: "Customer",
                Item: "Item",
                MFG: "MFG:",
                OEM: "OEM#",
                Vendor: "Vendor:",
                VendorPart: "Vendor Part#",
                Description: "Description",
                Cost: "Cost",
                StdPrice: "Std Price",
                Mrg: "Mrg%",
                QuotePrice: "Quote Price",
                Quantity: "Quantity",
                Extension: "Extension",
                OldCost: "Old Cost",
                OldMrg: "Old Mrg%",
                Inactive: "Inactive",
                LastUpdated: "Last Updated",
                ExcludeWeb: "Exclude Web",
                Contract: "Contract",
                DateAdded: "Date Added",
                DateLastOrder: "Date Last Order",
                lastOrder: "lastOrder#"
            }
        }
    };
    UEConstants.HTTP_REQUEST_TYPE = {
        POST: "POST",
        GET: "GET",
        DELETE: "DELETE",
        PUT: "PUT"
    };
    return UEConstants;
}());
