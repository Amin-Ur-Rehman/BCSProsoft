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

    //adding an inline html field to hold the css for the class dynamically
    var inlineCss = form.addField('custpage_inline_css','inlinehtml','inline Css');
    var stylingCss = "<style>\n";

    stylingCss += '.f3Hyperlink:link {\n' +
        'text-decoration: none;\n' +
        '}\n' +
        '\n' +
        '.f3Hyperlink:visited {\n' +
        'text-decoration: none;\n' +
        '}\n';

    stylingCss+=".f3Hyperlink:hover {\n";
    stylingCss+= "text-decoration: underline;\n";
    stylingCss += '}\n';

    stylingCss += '</style>';

    var addbutton = "<Button onclick='newCFL("+nlapiGetRecordId()+"); return false;'>New Customer Favorites Lines </Button>";

    Utility.logDebug('Work','Started'+type);

    if (type.toString() ===  'view') {

        Utility.logDebug('Work','Started');

        var sublist = form.getSubList('recmachcustrecord_bcs_cust_fav_lines_parent');
        var field = form.getField('custentity_f3_newcfl');

        form.setScript('customscript_f3_remove_customer_sublist');
        !!sublist ? sublist.setDisplayType('hidden') : '';
        !!field ? field.setDefaultValue(addbutton) : '';
        inlineCss.setDefaultValue(stylingCss);

        var customerFavoriteLines = this.createSublist(form);
        var cfl_search = this.loadsearch();

        if(!!cfl_search) {
            customerFavoriteLines.setLineItemValues(cfl_search);
            for(var i=1;i<=cfl_search.length;i++){

                if(!!cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_parent'))
                    customerFavoriteLines.setLineItemValue('custrecord_bcs_cust_fav_lines_parent',i,"<a href ='#' class='f3Hyperlink' style='color:#255599' onclick='openCustomer("+cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_parent')+")'>"+cfl_search[i-1].getText('custrecord_bcs_cust_fav_lines_parent')+"</a>");
                if(!!cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_item'))
                    customerFavoriteLines.setLineItemValue('custrecord_bcs_cust_fav_lines_item',i,"<a href ='#' class='f3Hyperlink' style='color:#255599' onclick='openItem("+cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_item')+")'>"+cfl_search[i-1].getText('custrecord_bcs_cust_fav_lines_item')+"</a>");
                if(!!cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_vendor'))
                    customerFavoriteLines.setLineItemValue('custrecord_bcs_cust_fav_lines_vendor',i,"<a href ='#' class='f3Hyperlink' style='color:#255599' onclick='openVendor("+cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_vendor')+")'>"+cfl_search[i-1].getText('custrecord_bcs_cust_fav_lines_vendor')+"</a>");
                if(!!cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_lastorder'))
                    customerFavoriteLines.setLineItemValue('custrecord_bcs_cust_fav_lines_lastorder',i,"<a href ='#' class='f3Hyperlink' style='color:#255599' onclick='openTransaction("+cfl_search[i-1].getValue('custrecord_bcs_cust_fav_lines_lastorder')+")'>"+cfl_search[i-1].getText('custrecord_bcs_cust_fav_lines_lastorder')+"</a>");
                customerFavoriteLines.setLineItemValue('custpage_edit',i,"<a href ='#' class='f3Hyperlink' style='color: #255599' onclick='openEdit("+cfl_search[i-1].getId()+")'>Edit</a>");
                customerFavoriteLines.setLineItemValue('custpage_remove',i,"<a href ='#' class='f3Hyperlink' style='color:#255599' onclick='removeLine("+cfl_search[i-1].getId()+","+nlapiGetRecordId()+")'>Remove</a>");//); //,

            }
        }

        Utility.logDebug('Work','Completed');
    }

    else if(type.toString() === 'edit'){
        var field = form.getField('custentity_f3_newcfl');

        field.setDisplayType('hidden');
    }

}

/**
 * This function creates the sublist on the customer Record
 * @returns {*}
 */
function createSublist(form){

    var customerFavoriteLines = form.addSubList('custpage_cfl', 'list', 'Customer Favorites Lines', 'custom12'); //custom12

    // customerFavoriteLines.addButton('custpage_button','New Customer Favourites Lines','newCFL(nlapiGetRecordId())');
    customerFavoriteLines.addField('custpage_edit', 'text', 'Edit');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_parent', 'text', 'Customer');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_item', 'text', 'Item');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_manu', 'text', 'MFG');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_oem', 'text', 'OEM#');
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_vendor', 'text', 'Vendor');
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
    customerFavoriteLines.addField('custrecord_bcs_cust_fav_lines_lastorder', 'text', 'last Order#');
    customerFavoriteLines.addField('custpage_remove', 'text', 'Remove');

    return customerFavoriteLines;
}

/**
 * This function load the saved search and get all the records.
 * @returns {Array}
 */
function loadsearch(){

    var start = 0; //UEConstants.
    var end = 1000;
    var s = nlapiLoadSearch('customrecord_bcs_customer_fav_lines_rtyp', 'customsearch56'); //761 56
    s.addFilter(new nlobjSearchFilter( 'custrecord_bcs_cust_fav_lines_parent', null, 'anyof', nlapiGetRecordId() ));
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

