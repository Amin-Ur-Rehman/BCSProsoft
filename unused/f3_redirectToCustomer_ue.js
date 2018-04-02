/**
* Created by Amin on 29-Mar-18.
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
* 1.00     29 Mar 2018     Amin        This script is written to create a runTime sublist on
*                                      customer record to show Customer Favourite Lines records
*                                      as sublist on customer record without pagination.
**/

/**
 * This functions triggers when the customer favourite lines saves and redirect to concern customer record.
 *
 * @param type
 * @param form
 */
function userEventAfterSubmit(type){

    nlapiRequestURL('https://system.sandbox.netsuite.com/app/common/entity/custjob.nl?id='+nlapiGetFieldValue('CUSTRECORD_BCS_CUST_FAV_LINES_PARENT'));

}