<?php

/**
 * Created by PhpStorm.
 * User: zahmed
 * Date: 05-Aug-15
 * Time: 4:07 PM
 */
include_once (Mage::getBaseDir('lib') . '/Folio3/ConnectorConstants.php');
include_once (Mage::getBaseDir('lib') . '/Folio3/NsRestRequest.php');

class Folio3_CancelOrder_Model_Observer
{
    //public $counter = 1;
    //Mage::log("orderStatusChange " . $this->counter++, null, 'cancel-order.log', true);

    /**
     * This method check that the order is marked as cancel or not.
     * If yes then it cancels the respective order in NetSuite
     * @param Varien_Event_Observer $observer
     */
    public function orderStatusChange(Varien_Event_Observer $observer)
    {
        $original_data = $observer->getEvent()->getData('data_object')->getOrigData();
        $new_data = $observer->getEvent()->getData('data_object')->getData();
        Mage::log(json_encode($original_data));
        Mage::log(json_encode($new_data));
        if (($original_data['state'] !== $new_data['state']) && ($new_data['state'] == Mage_Sales_Model_Order::STATE_CANCELED)) {
            Mage::log("Yes+Cancel", null, 'cancel-order.log', true);
            /**
             * Close order in NetSuite when order is cancelled in Magento
             */
            $this->cancelSalesOrder($new_data['increment_id']);

            // to display message after canceling the order
            // Hint: Observer extends Mage_Adminhtml_Controller_Action class to utilize following methods
            //$this->_getSession()->addError($this->__('The order(s) is canceled'));
            //$this->_getSession()->addSuccess($this->__('%s order(s) have been canceled.', $countCancelOrder));

            //Mage::log(json_encode($new_data), null, 'cancel-order.log', true);
        }
    }

    /**
     * This method sends a request to cancel sales order to NetSuite with increment id and store id
     * We are currently not handling its response
     * @param $orderIncrementId
     */
    public function cancelSalesOrder($orderIncrementId)
    {
        try {
            $data = null;

            // getting public Suitelet URL and Store Id from custom configuration
            $url = Mage::getStoreConfig(ConnectorConstants::SuiteletUrlPath);
            $storeId = Mage::getStoreConfig(ConnectorConstants::StoreIdPath);

            Mage::log($storeId . " " . $url, null, 'cancel-order.log', true);

            // making data for sending request
            $verb = 'POST';
            $data["apiMethod"] = "cancelSalesOrder";
            $data["data"] = array(
                "soIncrementId" => "$orderIncrementId",
                "storeId" => "$storeId"
            );

            // send request to NetSuite
            Mage::log("RequestData=" . json_encode($data), null, 'cancel-order.log', true);
            $response = $this->sendRequest($url, $verb, $data);
            Mage::log("ResponseData= " . $response, null, 'cancel-order.log', true);

            //$responseJson = json_decode($response);

            Mage::log($response, null, 'cancel-order.log', true);
        } catch (Exception $e) {
            Mage::logException($e);
            Mage::log(json_encode($e), null, 'cancel-order.log', true);
        }
    }

    /**
     * Call Suitelet using information from arguments
     * @param $url
     * @param $verb
     * @param $data
     * @return object
     */
    private function sendRequest($url, $verb, $data)
    {
        // Creating object after referring the class from defined namespace
        $nsRequestObject = new \SystemWrapper\Netsuite\NsRestRequest($url, $verb, $data);
        // set headers
        $nsRequestObject->setCustomHeaders('Content-Type: application/json');
        $nsRequestObject->setCustomHeaders(ConnectorConstants::CustomHeaderName . ": " . ConnectorConstants::CustomHeaderValue);
        $response = $nsRequestObject->execute();
        return $response;
    }
}