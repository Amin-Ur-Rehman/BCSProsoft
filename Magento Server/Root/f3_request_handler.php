<?php

/**
 * Created by PhpStorm.
 * User: zahmed
 * Date: 07-Aug-15
 * Time: 3:25 PM
 */
include_once 'app/Mage.php';
session_start();
session_write_close();
set_time_limit(0);
ini_set('memory_limit', '-1');
umask(0);
Mage::app()->setCurrentStore(Mage_Core_Model_App::ADMIN_STORE_ID);
Mage::log("Mage::getBaseDir('lib') = " . Mage::getBaseDir('lib'), null, date("d_m_Y") . '.log', true);
include_once(Mage::getBaseDir('lib') . '/Folio3/LibraryReferences.php');

/**
 * Class F3_Request_Handler entertains the request coming from other system.
 */
class F3_Request_Handler
{
    /**
     * This function first call when the request comes
     */
    public function processRequest()
    {
        $response = null;
        /**
         * Getting custom header
         * Note: We pass NS-MG-CONNECTOR as name of custom header but in PHP I get HTTP_NS_MG_CONNECTOR.
         */
        Mage::log("F3_Request_Handler.processRequest - Start ", null, date("d_m_Y") . '.log', true);
        //$_HEADERS = getallheaders();
        Mage::log("processRequest 1", null, date("d_m_Y") . '.log', true);
		// TODO: add a header validation check by uncommenting the script
        //$requestHeader = $_HEADERS[ConnectorConstants::CustomHeaderName];
		$requestHeader = ConnectorConstants::CustomHeaderValue;

        Mage::log("processRequest 2 = " . $requestHeader, null, date("d_m_Y") . '.log', true);
        // validate header
        if ($requestHeader === ConnectorConstants::CustomHeaderValue) {
            // process get and post request
            $requestMethod = $_SERVER['REQUEST_METHOD'];
            if ($requestMethod === "POST") {
                $response = $this->post();
            } else {
                $response = $this->get();
            }
        } else {
            // if header is not validated throw an error
            throw new Exception("Invalid Request Header");
        }
        Mage::log("F3_Request_Handler.processRequest - End ", null, date("d_m_Y") . '.log', true);
        echo json_encode($response);
    }

    /**
     * Process get request
     * @return object
     *
     * Note:
     * Get request format:
     * /f3request_handler.php?apiMethod=abcMethod&data={"abc": 123}
     * Header:
     * NS-MG-CONNECTOR: 1234567890
     */
    public function get()
    {
        $response = null;
        Mage::log("F3_Request_Handler.get - Start ", null, date("d_m_Y") . '.log', true);
        throw new Exception("GET request is not process.");
        /*$apiMethod = $_GET["apiMethod"];
        $data = json_decode($_GET["data"], true);
        // process request
        $response = $this->process($apiMethod, $data);
        return $response;*/
        return $response;
    }

    /**
     * Process post request
     * @return object
     *
     * Note:
     * Post request format:
     * /f3request_handler.php
     * Post Data:
     * {"apiMethod":"abcMethod", "data":{"abc": 123}}
     * Header:
     * NS-MG-CONNECTOR: 1234567890
     */
    public function post()
    {
        // getting post data
        Mage::log("F3_Request_Handler.post - Start ", null, date("d_m_Y") . '.log', true);
        Mage::log("apiMethod: " . $_POST["apiMethod"], null, date("d_m_Y") . '.log', true);
        Mage::log("data: " . $_POST["data"], null, date("d_m_Y") . '.log', true);
        $apiMethod = $_POST["apiMethod"];
        $data = json_decode($_POST["data"]);
        // process request
        $response = $this->process($apiMethod, $data);
        Mage::log("F3_Request_Handler.post - End ", null, date("d_m_Y") . '.log', true);
        return $response;
    }

    /**
     * This method is responsible for invoking a method having name contained in $apiMethod by passing $data as parameter
     * @param $apiMethod
     * @param $data
     * @return object
     * @throws Exception
     */
    public function process($apiMethod, $data)
    {
        $response = null;
        // create an object for invkoing requested method
        $f3GenericApiBase = new F3_Generic_Api_Base();

        // check if requested method exist
        if (method_exists($f3GenericApiBase, $apiMethod)) {
            // call the requested method
            $response = $f3GenericApiBase->{$apiMethod}($data);
        } else {
            // if method doesn't not exist throw an error
            throw new Exception("Invalid apiMethod");
        }

        return $response;
    }
}

/**
 * Entry point of the script
 */

try {
    Mage::log("Main 1", null, date("d_m_Y") . '.log', true);
    $f3RequestHandler = new F3_Request_Handler();
    Mage::log("Main 2", null, date("d_m_Y") . '.log', true);
    $f3RequestHandler->processRequest();
    Mage::log("Main 3", null, date("d_m_Y") . '.log', true);
} catch (Exception $e) {
    $response["status"] = 0;
    $response["message"] = $e->getMessage();
    echo json_encode($response);
}