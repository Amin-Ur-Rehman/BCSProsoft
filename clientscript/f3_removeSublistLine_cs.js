/**
 * Created by Amin on 30-Mar-18.
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
 * 1.00     30 Mar 2018     Amin        This script is written to create a runTime sublist on
 *                                      customer record to show Customer Favourite Lines records
 *                                      as sublist on customer record without pagination.
 **/

function newCFL(id) {

    window.open("/app/common/custom/custrecordentry.nl?rectype=5&pf=CUSTRECORD_BCS_CUST_FAV_LINES_PARENT&pi="+id+"&pr=-2","_self");
}


function openEdit(id){

    window.open("/app/common/custom/custrecordentry.nl?rectype=5&id="+id+'&e=T',"_self");

}

function openCustomer(id){

    window.open("/app/common/entity/custjob.nl?id="+id);

}

function openItem(id){

    window.open("/app/common/item/item.nl?id="+id);

}

function openVendor(id){

    window.open("/app/common/entity/vendor.nl?id="+id);

}

function openTransaction(id){

    window.open("/app/accounting/transactions/salesord.nl?id="+id);

}


function removeLine(id,recordId){

    nlapiRequestURL("/app/common/custom/attachrecord.nl?id="+id+'&custfield=CUSTRECORD_BCS_CUST_FAV_LINES_PARENT&machine=custpage_cfl&recordid='+recordId+"&action=remove");

    window.location.reload(true);

}
