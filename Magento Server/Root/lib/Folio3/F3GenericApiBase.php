<?php
/**
 * Created by PhpStorm.
 * User: zahmed
 * Date: 12-Aug-15
 * Time: 4:13 PM
 */

/**
 * Class F3_Generic_Api_Base contains the base methods which are requested to be called from other system.
 */
class F3_Generic_Api_Base
{
    public function upsertShoppingCart($data)
    {
        $shoppingCartPriceRule = new Shopping_Cart_Price_Rule();
        $response = $shoppingCartPriceRule->upsert($data);
        return $response;
    }

    /*public function upsertCustomerGroup($data)
    {
        $customerGroup = new Customer_Group();
        $response = $customerGroup->upsert($data);
        return $response;
    }

    public function upsertCustomerTaxClass($data)
    {
        $customerTaxClass = new Customer_Tax_Class();
        $response = $customerTaxClass->upsert($data);
        return $response;
    }*/

    public function upsertPriceLevel($data)
    {
        $priceLevel = new Price_Level();
        $response = $priceLevel->upsert($data);
        return $response;
    }

    public function upsertPaymentTerm($data)
    {
        $paymentTerm = new Payment_Term();
        $response = $paymentTerm->upsert($data);
        return $response;
    }

    public function getGiftCardDiscount($data)
    {
        $response = $this->getGiftCardAmount($data);
        return $response;
    }

    private function getGiftCardAmount($data)
    {
        try {
            $quoteId = property_exists($data, "quoteId") && !empty($data->quoteId) ? $data->quoteId : null;

            if ($quoteId == null) {
                throw new Exception("Unable to get giftcard discount. Undefined Quote Id");
            }

            $connectionRead = Mage::getSingleton('core/resource')->getConnection('core_read');

            // SELECT quote_entity_id, giftcard_id, link_id, base_giftcard_amount, giftcard_amount, code FROM aw_giftcard_quote_totals JOIN aw_giftcard ON giftcard_id = entity_id WHERE quote_entity_id=123;

            // making select query
            $select = "SELECT quote_entity_id, giftcard_id, link_id, base_giftcard_amount, giftcard_amount, code FROM aw_giftcard_quote_totals JOIN aw_giftcard ON giftcard_id = entity_id WHERE quote_entity_id = $quoteId";

            // we only need to know if the row exist or not
            $result = $connectionRead->fetchRow($select);

            $responseData = array();

            if (!empty($result)) {
                $responseData["quoteEentityId"] = $result["quote_entity_id"];
                $responseData["giftcardId"] = $result["giftcard_id"];
                $responseData["linkId"] = $result["link_id"];
                $responseData["baseGiftcardAmount"] = $result["base_giftcard_amount"];
                $responseData["giftcardAmount"] = $result["giftcard_amount"];
                $responseData["code"] = $result["code"];
            } else {
                $responseData["quoteEentityId"] = null;
                $responseData["giftcardId"] = null;
                $responseData["linkId"] = null;
                $responseData["baseGiftcardAmount"] = 0;
                $responseData["giftcardAmount"] = 0;
                $responseData["code"] = null;
            }


            // making response object
            $response["status"] = 1;
            $response["message"] = "Gift Card Amount used in Order";
            $response["data"] = $responseData;
        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.getGiftCardAmount - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }

        return $response;
    }

    public function getSalesOrderInfo($data)
    {
        try {
            $orderIncrementId = property_exists($data, "orderIncrementId") && !empty($data->orderIncrementId) ? $data->orderIncrementId : null;

            if ($orderIncrementId == null) {
                throw new Exception("Undefined Order IncrementId");
            }

            $order = Mage::getModel('sales/order')->loadByIncrementId($orderIncrementId);
            $state = $order->getState();
            $status = $order->getStatus();

            $responseData = array();

            $responseData["state"] = !empty($state) ? $state : "";
            $responseData["status"] = !empty($status) ? $status : "";

            // making response object
            $response["status"] = 1;
            $response["message"] = "Sales Order Info";
            $response["data"] = $responseData;
        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.getGiftCardAmount - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }

        return $response;
    }

    public function getSalesOrderList($data){
        try {
            $responseData = array();
            $fromDate = $data->fromDate;
            $statuses = $data->statuses;
            $ordersFound = Mage::getModel('sales/order')->getCollection()
                ->addAttributeToFilter('updated_at', array('gt'=>$fromDate))
                ->addAttributeToFilter('status', array('in' => $statuses));
            $orderIds = array();
            if(isset($ordersFound)) {
                //$responseData["orders_found"] = count($ordersFound);
                foreach ($ordersFound as $order) {
                    $orderIds[] = $order->getIncrementId();
                }
            }
            $responseData["orders"] = $orderIds;
            // making response object
            $response["status"] = 1;
            $response["message"] = "Sales Order List";
            $response["data"] = $responseData;
        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.getSalesOrderList - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }
        return $response;
    }

    public function cancelSalesOrder($data)
    {
        try {
            $orderIncrementId = property_exists($data, "orderIncrementId") && !empty($data->orderIncrementId) ? $data->orderIncrementId : null;
            $nsTransactionId = property_exists($data, "nsTransactionId") && !empty($data->nsTransactionId) ? $data->nsTransactionId : null;

            if ($orderIncrementId == null) {
                throw new Exception("Undefined Order IncrementId");
            }

            if ($nsTransactionId == null) {
                throw new Exception("Undefined NetSuite Transaction Id");
            }

            $order = Mage::getModel('sales/order')->loadByIncrementId($orderIncrementId);

            $state = Mage_Sales_Model_Order::STATE_CANCELED;
            $order->setData('state', $state);
            $order->setStatus($state);
            $history = $order->addStatusHistoryComment('This order has been cancelled due to editing of its NetSuite Sales Order Having Transaction Id: ' . $nsTransactionId, false);
            $history->setIsCustomerNotified(false);

            $order->save();
            $responseData = array();

            // making response object
            $response["status"] = 1;
            $response["message"] = "Sales Order has been cancelled";
            $response["data"] = $responseData;
        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.cancelSalesOrder - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }

        return $response;
    }

    public function createInvoice($data){
        try {
            $responseArr = array();
            if(isset($data->increment_id)) {
                $increment_id = $data->increment_id;
                $order = Mage::getModel('sales/order')->loadByIncrementId($increment_id);

                $grandTotal = $order->getGrandTotal();
                $totalPaid = $order->getTotalPaid();
                $grandTotal = round($grandTotal, 2);
                $totalPaid = round($totalPaid, 2);
                $invoices = array();
                $selectedInvoice = null;
                foreach ($order->getInvoiceCollection() as $invoice) {
                    $invoices[] = $invoice;
                }
                $invoiceCount = count($invoices);
                if($grandTotal == $totalPaid && $invoiceCount > 0) {
                    $selectedInvoice = $invoices[$invoiceCount - 1];
                    $responseArr["increment_id"] = $selectedInvoice->getIncrementId();
                    $response["status"] = 1;
                    $response["message"] = "Invoice was already created";
                    $response["data"] = $responseArr;
                    return $response;
                }


                if (!$order->canInvoice())
                {
                    Mage::throwException(Mage::helper('core')->__('Cannot create an invoice.'));
                }
                $invoice = Mage::getModel('sales/service_order', $order)->prepareInvoice();
                if (!$invoice->getTotalQty())
                {
                    Mage::throwException(Mage::helper('core')->__('Cannot create an invoice without products.'));
                }
                if ($data->capture_online == 'true')
                {
                    $invoice->setRequestedCaptureCase(Mage_Sales_Model_Order_Invoice::CAPTURE_ONLINE);
                }
                else {
                    $invoice->setRequestedCaptureCase(Mage_Sales_Model_Order_Invoice::NOT_CAPTURE);
                }

                $invoice->register();
                $transactionSave = Mage::getModel('core/resource_transaction')->addObject($invoice)->addObject($invoice->getOrder());
                $transactionSave->save();
                $responseArr["increment_id"] = $invoice->getIncrementId();
                $response["status"] = 1;
                $response["message"] = "Invoice has been created";
                $response["data"] = $responseArr;
            }

        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.createInvoice - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }
        return $response;
    }

    public function createCreditMemo($requestData){
        try {
            if(isset($requestData->order_increment_id) && isset($requestData->invoice_increment_id)) {
                //Mage::log('inside createCreditMemo start', null, 'create-creditmemo.log', true);
                $order_increment_id = $requestData->order_increment_id;
                $invoice_increment_id = $requestData->invoice_increment_id;
                //Mage::log('loading order', null, 'create-creditmemo.log', true);
                $order = Mage::getModel('sales/order')->loadByIncrementId($order_increment_id);
                //Mage::log('order loaded', null, 'create-creditmemo.log', true);
                if ($order->canCreditmemo()) {

                    $selectedInvoice = null;
                    //Mage::log('going to get invoice', null, 'create-creditmemo.log', true);
                    //Mage::log('provided invoice: '.$invoice_increment_id, null, 'create-creditmemo.log', true);
                    foreach ($order->getInvoiceCollection() as $invoice) {
                        //Mage::log('going to get current invoice id', null, 'create-creditmemo.log', true);
                        $currentInvoiceIncrementId = $invoice->getIncrementId();
                        //Mage::log('got current invoice id', null, 'create-creditmemo.log', true);
                        //Mage::log('current invoice id: '.$currentInvoiceIncrementId, null, 'create-creditmemo.log', true);
                        if($currentInvoiceIncrementId == $invoice_increment_id) {
                            $selectedInvoice = $invoice;
                            //Mage::log('invoice found', null, 'create-creditmemo.log', true);
                            break;
                        }
                    }
                    if(!isset($selectedInvoice)) {
                        throw new Exception('No Invoice Found with provided invoice id: '+ $invoice_increment_id +' in magento.');
                    }
                    //Mage::log('getting service model', null, 'create-creditmemo.log', true);
                    $service = Mage::getModel('sales/service_order', $order);
                    //Mage::log('setting data properties', null, 'create-creditmemo.log', true);
                    $data = array();
                    $data['shipping_amount'] = (double)$requestData->shipping_cost;
                    $data['adjustment_positive'] = (double)$requestData->adjustment_positive;

                    $quantityArray = array();
                    foreach ($requestData->quantities as $quantity) {
                        $key = (int)$quantity->order_item_id;
                        $value = (int)$quantity->qty;
                        $quantityArray[$key] = $value;
                    }

                    $data['qtys'] = $quantityArray;
                    $creditMemo = $service->prepareInvoiceCreditmemo($selectedInvoice, $data);
                    $creditMemo->setShippingAmount($data['shipping_amount']);
                    $creditMemo->setAdjustmentPositive($data['adjustment_positive']);
                    //$creditMemo->setGrandTotal($data['adjustment_positive']);
                    $creditMemo->setRefundRequested(true);
                    if($requestData->capture_online == 'true') {
                        $creditMemo->setOfflineRequested(false);
                    } else {
                        $creditMemo->setOfflineRequested(true);
                    }

                    $creditMemo->setPaymentRefundDisallowed(false);
                    if(Mage::registry('current_creditmemo')) {
                        Mage::unregister('current_creditmemo');
                    }
                    //Mage::log('going to register current_creditmemo', null, 'create-creditmemo.log', true);
                    Mage::register('current_creditmemo', $creditMemo);
                    //Mage::log('going to register creditmemo', null, 'create-creditmemo.log', true);
                    $creditMemo->register();
                    //Mage::log('going to save creditmemo', null, 'create-creditmemo.log', true);
                    Mage::getModel('core/resource_transaction')->addObject($creditMemo)->addObject($order)->save();

                    # here follows the transactionSave: $this->_saveCreditmemo($creditmemo);
                    $responseArr = array();
                    $responseArr["increment_id"] = $creditMemo->getIncrementId();
                    $response["status"] = 1;
                    $response["message"] = "Credit Memo has been created";
                    $response["data"] = $responseArr;
                }
            }
            else {
                throw new Exception('Please provide order_increment_id and invoice_increment_id values in request param');
            }

        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.createCreditMemo - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }
        return $response;
    }


    /**
     * Assign attributes to configurable product
     * @param $requestData
     * @return mixed
     * @throws Exception
     */
    function assignAttributesToConfigurableProduct($requestData) {
        try {
            if(isset($requestData->configurable_product_id) && isset($requestData->products_attributes)) {
                //Mage::log('inside assignAttributesToConfigurableProduct start', null, 'assignAttributesToConfigurableProduct.log', true);
                $configurable_product_id = $requestData->configurable_product_id;
                $products_attributes = $requestData->products_attributes;

                $configProduct = Mage::getModel('catalog/product')->load($configurable_product_id);
                $newAttributes = array();
                foreach ($products_attributes as $products_attribute) {
                    $configProductAttrCode = $products_attribute->key;

                    $super_attribute= Mage::getModel('eav/entity_attribute')->loadByCode('catalog_product', $configProductAttrCode);
                    $configurableAtt = Mage::getModel('catalog/product_type_configurable_attribute')->setProductAttribute($super_attribute);

                    $newAttribute = array(
                        'id'             => $configurableAtt->getId(),
                        'label'          => $configurableAtt->getLabel(),
                        'position'       => $super_attribute->getPosition(),
                        'values'         => $configurableAtt->getPrices() ? $configProduct->getPrices() : array(),
                        'attribute_id'   => $super_attribute->getId(),
                        'attribute_code' => $super_attribute->getAttributeCode(),
                        'frontend_label' => $super_attribute->getFrontend()->getLabel(),
                    );
                    $newAttributes[] = $newAttribute;
                }

                $existingAttributes = $configProduct->getTypeInstance()->getConfigurableAttributesAsArray();
                $allAttributes = array_merge($existingAttributes, $newAttributes);

                $configProduct->setCanSaveConfigurableAttributes(true);
                $configProduct->setConfigurableAttributesData($allAttributes);
                $configProduct->save();


                /* try {
                     $process = Mage::getModel('index/indexer')->getProcessByCode('catalog_product_attribute');
                     $process->reindexAll();
                 }
                 catch(Exception $e) {
                     Mage::log("F3_Generic_Api_Base.assignAttributesToConfigurableProduct - Exception in Re-indexing products data = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
                 }*/


                $responseArr = array();
                $responseArr["assignment_id"] = '';
                $response["status"] = 1;
                $response["message"] = "Attributes have been assigned to configurable product";
                $response["data"] = $responseArr;

            }
            else {
                throw new Exception('Please provide configurable_product_id and products_attributes values in request param');
            }

        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.assignAttributesToConfigurableProduct - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }
        return $response;
    }

    /**
     * Associate Simple Product with configurable product
     * @param $requestData
     * @return mixed
     * @throws Exception
     */
    function associateProductWithConfigurableProduct($requestData) {
        try {
            if(isset($requestData->configurable_product_id) && isset($requestData->simple_product_id)) {
                //Mage::log('inside assignAttributesToConfigurableProduct start', null, 'assignAttributesToConfigurableProduct.log', true);
                $configurable_product_id = $requestData->configurable_product_id;
                $simple_product_id = $requestData->simple_product_id;

                $configProduct = Mage::getModel('catalog/product')->load($configurable_product_id);

                $existingAssociatedProductsIds = $configProduct->getTypeInstance()->getUsedProductIds();
                $allAssociatedProductIds = array();
                $allAssociatedProductIds[] = $simple_product_id;
                foreach ($existingAssociatedProductsIds as $existingAssociatedProductsId ) {
                    $allAssociatedProductIds[] = $existingAssociatedProductsId;
                }

                Mage::getResourceModel('catalog/product_type_configurable')->saveProducts($configProduct, $allAssociatedProductIds);


                /*try {
                    $process = Mage::getModel('index/indexer')->getProcessByCode('catalog_product_attribute');
                    $process->reindexAll();
                }
                catch(Exception $e) {
                    Mage::log("F3_Generic_Api_Base.associateProductWithConfigurableProduct - Exception in Re-indexing products data = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
                }*/


                $responseArr = array();
                $responseArr["association_id"] = '';
                $response["status"] = 1;
                $response["message"] = "Product has been associated to configurable product";
                $response["data"] = $responseArr;

            }
            else {
                throw new Exception('Please provide configurable_product_id and simple_product_id values in request param');
            }

        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.associateProductWithConfigurableProduct - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }
        return $response;
    }

    function reindexProductsData($requestData) {
        try {
            //@var $indexCollection Mage_Index_Model_Resource_Process_Collection
            /*$indexCollection = Mage::getModel('index/process')->getCollection();
            foreach ($indexCollection as $index) {
                //@var $index Mage_Index_Model_Process
                $index->reindexAll();
            }*/

            //$processes = Mage::getSingleton('index/indexer')->getProcessesCollection();
            //$processes->walk('reindexAll');

            if(isset($requestData->store_root_path)) {
                //exec('php /var/www/html/f3store6/shell/indexer.php --reindex all >> /var/www/html/f3store6/log.txt');

                $storeRootPath = $requestData->store_root_path;
                $reIndexingCommand = 'php '.$storeRootPath.'/shell/indexer.php --reindex all >> '.$storeRootPath.'/log.txt';
                exec($reIndexingCommand);

                $response["status"] = 1;
                $response["message"] = "Data Re-indexing job invoked successfully.";
            }
            else {
                throw new Exception('Please provide store_root_path values in request param');
            }
        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.reindexProductsData - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }
        return $response;
    }

    private function validateGetProductRequestData($data)
    {
        $productType = $data->productType;
        $productId = $data->productId;
        $identifierType = $data->identifierType;

        if (empty($productType)) {
            throw new Exception("Product Type is empty");
        }
        if (empty($productId)) {
            throw new Exception("Product Id is empty");
        }
        if (empty($identifierType)) {
            throw new Exception("Identifier Type is empty");
        }

        $productTypes = array("simple", "configurable", "grouped", "bundle", "virtual", "downloadable");
        if (!in_array($productType, $productTypes)) {
            throw new Exception("Product Type is invalid");
        }
        $identifierTypes = array("sku", "id");
        if (!in_array($identifierType, $identifierTypes)) {
            throw new Exception("Identifier Type is invalid");
        }
    }

    private function simple($product)
    {
        $productData = new StdClass();

        // getting all attributes of product - start
        $attributes = $product->getAttributes();
        // get all attributes of a product
        foreach ($attributes as $attribute) {
            $attributeCode = $attribute->getAttributeCode();
            if (!empty($attributeCode)) {
                $productData->{$attributeCode} = $product->getData($attributeCode);
            }
        }
        // getting all attributes of product - end

        // get category ids
        $productData->category_ids = $product->getCategoryIds();

        // get information form parent
        $productData->parent = null;
        // getting parent product - start
        $parent = Mage::getModel('catalog/product_type_configurable')->getParentIdsByChild($product->getId());
        if (sizeof($parent) > 0) {
            $parentProduct = Mage::getModel('catalog/product')->load($parent[0]);
            $productData->parent = $this->configurable($parentProduct);
        } else {
            $parent = Mage::getModel('catalog/product_type_grouped')->getParentIdsByChild($product->getId());
            if (sizeof($parent) > 0) {
                $parentProduct = Mage::getModel('catalog/product')->load($parent[0]);
                $productData->parent = $this->grouped($parentProduct);
            }
        }
        // getting parent product - end

        return $productData;
    }

    private function configurable($product)
    {
        $productData = new StdClass();

        // getting all attributes of product - start
        $attributes = $product->getAttributes();
        //$productData->attributes= $attributes;

        // get category ids
        $productData->category_ids = $product->getCategoryIds();

        // get all attributes of a product
        foreach ($attributes as $attribute) {
            $attributeCode = $attribute->getAttributeCode();
            if (!empty($attributeCode)) {
                $productData->{$attributeCode} = $product->getData($attributeCode);
            }
        }
        // getting all attributes of product - end

        $productData->used_product_attribute_ids = $product->getTypeInstance()->getUsedProductAttributeIds();
        $productData->configurable_attributes_as_array = $product->getTypeInstance()->getConfigurableAttributesAsArray();
        $productData->configurable_attributesData = $product->getConfigurableAttributesData();
        $productData->configurable_products_data = $product->getConfigurableProductsData();

        /**
         * Get child products id (only ids)
         */
        $productData->child_product_ids = Mage::getModel('catalog/product_type_configurable')->getChildrenIds($product->getId());

        /**
         * Get children products (all associated children products data)
         */
        /*$productData->childProducts = array();
        $childProducts = Mage::getModel('catalog/product_type_configurable')->getUsedProducts(null, $product);

        foreach ($childProducts as $childProduct) {
            $type = $childProduct->getTypeId();
            array_push($productData->childProducts, $type);
            array_push($productData->childProducts, $this->{$type}($childProduct));
        }*/

        return $productData;
    }

    private function grouped($product)
    {
        throw new Exception("Product Type (grouped) is not supported");
    }

    private function bundle($product)
    {
        throw new Exception("Product Type (bundle) is not supported");
    }

    private function virtual($product)
    {
        throw new Exception("Product Type (virtual) is not supported");
    }

    private function downloadable($product)
    {
        throw new Exception("Product Type (downloadable)) is not supported");
    }

    private function getProduct($data)
    {
        $this->validateGetProductRequestData($data);

        $product = null;
        $productType = $data->productType;
        $productId = $data->productId;
        $identifierType = $data->identifierType;

        try {
            $product = Mage::getModel('catalog/product');
            $product = $identifierType === "sku" ? $product->loadByAttribute($identifierType, $productId) : $product->load($productId);
        } catch (Exception $e) {
            throw $e;
        }

        if (method_exists($this, $productType)) {
            $productData = $this->{$productType}($product);
        } else {
            throw new Exception("Product Type ($productType) is not supported");
        }

        return $productData;
    }

    public function getProductInfo($data)
    {
        try {
            $responseData = array();
            $responseData["product"] = $this->getProduct($data);
            // making response object
            $response["status"] = 1;
            $response["message"] = "getProductInfo";
            $response["data"] = $responseData;
        } catch (Exception $e) {
            Mage::log("F3_Generic_Api_Base.getProductInfo - Exception = " . $e->getMessage(), null, date("d_m_Y") . '.log', true);
            throw new Exception($e->getMessage());
        }

        return $response;
    }
}