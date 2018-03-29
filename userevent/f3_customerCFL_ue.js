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

/**
 * This functions triggers when the customer record is opened for type edit and view.
 * @param type
 * @param form
 */
function beforeLoadSublist(type, form) {

    if (type ===  'edit' || 'view') {

        Utility.logDebug('Work','Started');

        var customerFavoriteLines = this.createSublist(form);

        var cfl_search = this.loadsearch();

        // this.loadsearch();
        // this.getSearch();

        if(!!cfl_search)
            customerFavoriteLines.setLineItemValues(cfl_search);

        Utility.logDebug('Work','Completed');

    }
}

/**
 * This function creates the sublist on the customer Record
 * @returns {*}
 */
function createSublist(form){

    var customerFavoriteLines = form.addSubList('custpage_cfl', 'inlineeditor', 'Customer Favorite Lines', 'general');

    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_parent', 'select', 'Customer', 'customer');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_item', 'select', 'Item', 'item');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_manu', 'text', 'MFG');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_oem', 'text', 'OEM#');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_vendor', 'select', 'Vendor', 'vendor');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_vendorpart', 'text', 'Vendor Part#');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_descriptio', 'text', 'Description');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_cost', 'currency', 'Cost');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_price', 'currency', 'Std Price');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_margin', 'float', 'Mrg%');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_quoted', 'currency', 'Quote Price');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_qty', 'integer', 'Quantity');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_extension', 'currency', 'Extension');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_oldcost', 'currency', 'Old Cost');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_oldmarg', 'float', 'Old Mrg%');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_status', 'checkbox', 'Inactive');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_clastaprov', 'date', 'Last Updated');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_exclweb', 'checkbox', 'Exclude Web');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_contract', 'checkbox', 'Contract');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_dateadded', 'date', 'Date Added');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_dateorder', 'date', 'Date Last Ordered');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_lastorder', 'select', 'last Order#', 'transaction');

    return customerFavoriteLines;
}

/**
 * This function get the searched records from the customer favourite list.
 * @returns {*}
 */
function getSearch(){

    var cfl_search =  nlapiSearchRecord("customrecord_bcs_customer_fav_lines_rtyp",null, null,
        [
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_parent"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_item"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_manu"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_oem"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_vendor"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_vendorpart"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_descriptio"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_cost"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_price"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_margin"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_quoted"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_qty"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_extension"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_oldcost"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_oldmarg"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_status"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_clastaprov"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_exclweb"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_contract"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_dateadded"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_dateorder"),
            new nlobjSearchColumn("custrecord_bcs_cust_fav_lines_lastorder")
        ]
    );

    return cfl_search;

}

/**
 * This function load the saved search and get all the records.
 * @returns {Array}
 */
function loadsearch(){

    var start = 0;
    var end = 1000;
    var s = nlapiLoadSearch('customrecord_bcs_customer_fav_lines_rtyp', 'customsearch56'); //761 56
    var resultSet = s.runSearch();
    var results = resultSet.getResults(start, end);
    var allSearch = [];


    while(!!results){

        allSearch = allSearch.concat(results);
        if(results.length === 1000) {
            start = end;
            end += 1000;
            results = resultSet.getResults(start, end);
        }
        else{
            break;
        }
    }

    Utility.logDebug('Search length', allSearch.length);

    return allSearch;
}

