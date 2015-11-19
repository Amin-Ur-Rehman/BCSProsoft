/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       11 September 2014     Ubaid Baig
 *
 */


/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suite_api(request, response) {
    var outResponse = {};
    try {
        /*var headers = request.getAllHeaders();
        for (var header in headers) {
            nlapiLogExecution('DEBUG', 'header: ' + header, 'value: ' + headers[header]);
        }

        var params = request.getAllParameters();
        for (var param in params) {
            nlapiLogExecution('DEBUG', 'parameter: ' + param, 'value: ' + params[param]);
        }*/

        var header = request.getHeader(WsmUtilityApiConstants.Header.NetSuiteMagentoConnector.Name);
        var shopifyHeader = request.getHeader(WsmUtilityApiConstants.Header.ShopifyToNetSuite.Name);

        if (header === WsmUtilityApiConstants.Header.NetSuiteMagentoConnector.Value || verify_webhook(request.getBody(), shopifyHeader)) {
            outResponse = processRequest(request, response);
        } else {
            throwError('DEV_ERR', 'Invalid Call', true);
        }
    }
    catch (e) {
        outResponse.Result = WsmUtilityApiConstants.Response.Result.Error;
        outResponse.Message = e.name + ", " + e.message;

        nlapiLogExecution('DEBUG', 'outResponse', JSON.stringify(outResponse));
    }

    response.setContentType('JSON');
    response.write(JSON.stringify(outResponse));
}