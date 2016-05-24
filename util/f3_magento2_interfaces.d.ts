/**
 * Created by akumar on 5/19/2016.
 */


interface SalesShipmentTrack {
    carrier_code: string;
    created_at: string;
    description: string;
    entity_id: number;
    order_id: number;
    parent_id: number;
    qty: number;
    title: string;
    track_number: string;
    updated_at: string;
    weight: number;
    extension_attributes?: any;
}

interface SalesShipmentPackages {
    extensionAttributes?: any;
}

interface SalesShipmentItems {
    additional_data?: string;
    description?: string;
    entity_id: number;
    name: string;
    order_item_id: number;
    parent_id: number;
    price: number;
    product_id: number;
    qty: number;
    row_total?: number;
    sku: string;
    weight: number;
    extension_attributes?: any;
}

interface SalesShipmentComments {
    comment: string;
    created_at: string;
    entity_id: number;
    is_customer_notified: number;
    is_visible_on_front: number;
    parent_id: number;
    extension_attributes?: any;
}

interface SalesShipment {
    billing_address_id: number;
    created_at: string;
    customer_id: number;
    email_sent: number;
    entity_id: number;
    increment_id: string;
    order_id: number;
    shipment_status: number;
    shipping_address_id: number;
    shipping_label: string;
    store_id: number;
    total_qty: number;
    total_weight: number;
    updated_at: string;
    extension_attributes?: any;
    packages: SalesShipmentPackages[];
    items: SalesShipmentItems[];
    tracks: SalesShipmentTrack[];
    comments: SalesShipmentComments[];
}

/**
 * Interface of Customer Object in Magento2
 */
interface Customer {
    id: number;
    group_id: number;
    default_billing: string;
    default_shipping: string;
    created_at: string;
    updated_at: string;
    created_in: string;
    email: string;
    firstname: string;
    lastname: string;
    gender: number;
    store_id: number;
    website_id: number;
    addresses: CustomerAddress[];
    disable_auto_group_change: number;
}

/**
 * Interface of Region of Address of Customer Object in Magento2
 */
interface Region {
    region_code: string;
    region: string;
    region_id: number;
}

/**
 * Interface of Address of Customer Object in Magento2
 */
interface  CustomerAddress {
    id: number;
    customer_id: number;
    region: Region;
    region_id: number;
    country_id: string;
    street: string[];
    telephone: string;
    postcode: string;
    city: string;
    firstname: string;
    lastname: string;
    default_shipping?: boolean;
    default_billing?: boolean;
}


/**
 * Interface for each of custom_attribute item
 */
interface Magento2CustomAttribute {
    attribute_code: string;
    value;
}

/**
 * Key value interface to help create custom_attributes
 */
interface Magento2CustomAttributeValues {
    description?;
    meta_title?;
    meta_keywords?;
    meta_description?;
    display_mode?;
    is_anchor?;
    path?;
    children_count?;
    custom_use_parent_settings?;
    custom_apply_to_products?;
    url_key?;
    url_path?;
}

/**
 * Interface for category in Magento2
 */
interface Magento2Category {
    id?;
    parent_id;
    name: string;
    is_active: boolean;
    position?;
    level?;
    children?: string;
    created_at?: string;
    updated_at?: string;
    path?: string;
    available_sort_by?: Array<any>;
    include_in_menu?: boolean;
    extension_attributes?: any;
    custom_attributes?: Array<Magento2CustomAttribute>;
}

/**
 * Magento2 order item
 */
interface Magento2ProductItem {
    additional_data?:string;
    amount_refunded?:number;
    applied_rule_ids?:string;
    base_amount_refunded?:number;
    base_cost?:number;
    base_discount_amount?:number;
    base_discount_invoiced?:number;
    base_discount_refunded?:number;
    base_discount_tax_compensation_amount?:number;
    base_discount_tax_compensation_invoiced?:number;
    base_discount_tax_compensation_refunded?:number;
    base_original_price?:number;
    base_price?:number;
    base_price_incl_tax?:number;
    base_row_invoiced?:number;
    base_row_total?:number;
    base_row_total_incl_tax?:number;
    base_tax_amount?:number;
    base_tax_before_discount?:number;
    base_tax_invoiced?:number;
    base_tax_refunded?:number;
    base_weee_tax_applied_amount?:number;
    base_weee_tax_applied_row_amnt?:number;
    base_weee_tax_disposition?:number;
    base_weee_tax_row_disposition?:number;
    created_at?:string;
    description?:string;
    discount_amount?:number;
    discount_invoiced?:number;
    discount_percent?:number;
    discount_refunded?:number;
    event_id?:number;
    ext_order_item_id?:string;
    free_shipping?:number;
    gw_base_price?:number;
    gw_base_price_invoiced?:number;
    gw_base_price_refunded?:number;
    gw_base_tax_amount?:number;
    gw_base_tax_amount_invoiced?:number;
    gw_base_tax_amount_refunded?:number;
    gw_id?:number;
    gw_price?:number;
    gw_price_invoiced?:number;
    gw_price_refunded?:number;
    gw_tax_amount?:number;
    gw_tax_amount_invoiced?:number;
    gw_tax_amount_refunded?:number;
    discount_tax_compensation_amount?:number;
    discount_tax_compensation_canceled?:number;
    discount_tax_compensation_invoiced?:number;
    discount_tax_compensation_refunded?:number;
    is_qty_decimal?:number;
    is_virtual?:number;
    item_id?:number;
    locked_do_invoice?:number;
    locked_do_ship?:number;
    name?:string;
    no_discount?:number;
    order_id?:number;
    original_price?:number;
    parent_item_id?:number;
    price?:number;
    price_incl_tax?:number;
    product_id?:number;
    product_type?:string;
    qty_backordered?:number;
    qty_canceled?:number;
    qty_invoiced?:number;
    qty_ordered?:number;
    qty_refunded?:number;
    qty_returned?:number;
    qty_shipped?:number;
    quote_item_id?:number;
    row_invoiced?:number;
    row_total?:number;
    row_total_incl_tax?:number;
    row_weight?:number;
    sku?:string;
    store_id?:number;
    tax_amount?:number;
    tax_before_discount?:number;
    tax_canceled?:number;
    tax_invoiced?:number;
    tax_percent?:number;
    tax_refunded?:number;
    updated_at?:string;
    weee_tax_applied?:string;
    weee_tax_applied_amount?:number;
    weee_tax_applied_row_amount?:number;
    weee_tax_disposition?:number;
    weee_tax_row_disposition?:number;
    weight?:number;
    parent_item?:any;
}

/**
 * Magento2 sales order
 */
interface Magento2SalesOrder {
    adjustment_negative?:number;
    adjustment_positive?:number;
    applied_rule_ids?:string;
    base_adjustment_negative?:number;
    base_adjustment_positive?:number;
    base_currency_code?:string;
    base_discount_amount?:number;
    base_discount_canceled?:number;
    base_discount_invoiced?:number;
    base_discount_refunded?:number;
    base_grand_total?:number;
    base_discount_tax_compensation_amount?:number;
    base_discount_tax_compensation_invoiced?:number;
    base_discount_tax_compensation_refunded?:number;
    base_shipping_amount?:number;
    base_shipping_canceled?:number;
    base_shipping_discount_amount?:number;
    base_shipping_discount_tax_compensation_amnt?:number;
    base_shipping_incl_tax?:number;
    base_shipping_invoiced?:number;
    base_shipping_refunded?:number;
    base_shipping_tax_amount?:number;
    base_shipping_tax_refunded?:number;
    base_subtotal?:number;
    base_subtotal_canceled?:number;
    base_subtotal_incl_tax?:number;
    base_subtotal_invoiced?:number;
    base_subtotal_refunded?:number;
    base_tax_amount?:number;
    base_tax_canceled?:number;
    base_tax_invoiced?:number;
    base_tax_refunded?:number;
    base_total_canceled?:number;
    base_total_due?:number;
    base_total_invoiced?:number;
    base_total_invoiced_cost?:number;
    base_total_offline_refunded?:number;
    base_total_online_refunded?:number;
    base_total_paid?:number;
    base_total_qty_ordered?:number;
    base_total_refunded?:number;
    base_to_global_rate?:number;
    base_to_order_rate?:number;
    billing_address_id?:number;
    can_ship_partially?:number;
    can_ship_partially_item?:number;
    coupon_code?:string;
    created_at?:string;
    customer_dob?:string;
    customer_email?:string;
    customer_firstname?:string;
    customer_gender?:number;
    customer_group_id?:number;
    customer_id?:number;
    customer_is_guest?:number;
    customer_lastname?:string;
    customer_middlename?:string;
    customer_note?:string;
    customer_note_notify?:number;
    customer_prefix?:string;
    customer_suffix?:string;
    customer_taxvat?:string;
    discount_amount?:number;
    discount_canceled?:number;
    discount_description?:string;
    discount_invoiced?:number;
    discount_refunded?:number;
    edit_increment?:number;
    email_sent?:number;
    entity_id?:number;
    ext_customer_id?:string;
    ext_order_id?:string;
    forced_shipment_with_invoice?:number;
    global_currency_code?:string;
    grand_total?:number;
    discount_tax_compensation_amount?:number;
    discount_tax_compensation_invoiced?:number;
    discount_tax_compensation_refunded?:number;
    hold_before_state?:string;
    hold_before_status?:string;
    increment_id?:string;
    is_virtual?:number;
    order_currency_code?:string;
    original_increment_id?:string;
    payment_authorization_amount?:number;
    payment_auth_expiration?:number;
    protect_code?:string;
    quote_address_id?:number;
    quote_id?:number;
    relation_child_id?:string;
    relation_child_real_id?:string;
    relation_parent_id?:string;
    relation_parent_real_id?:string;
    remote_ip?:string;
    shipping_amount?:number;
    shipping_canceled?:number;
    shipping_description?:string;
    shipping_discount_amount?:number;
    shipping_discount_tax_compensation_amount?:number;
    shipping_incl_tax?:number;
    shipping_invoiced?:number;
    shipping_refunded?:number;
    shipping_tax_amount?:number;
    shipping_tax_refunded?:number;
    state?:string;
    status?:string;
    store_currency_code?:string;
    store_id?:number;
    store_name?:string;
    store_to_base_rate?:number;
    store_to_order_rate?:number;
    subtotal?:number;
    subtotal_canceled?:number;
    subtotal_incl_tax?:number;
    subtotal_invoiced?:number;
    subtotal_refunded?:number;
    tax_amount?:number;
    tax_canceled?:number;
    tax_invoiced?:number;
    tax_refunded?:number;
    total_canceled?:number;
    total_due?:number;
    total_invoiced?:number;
    total_item_count?:number;
    total_offline_refunded?:number;
    total_online_refunded?:number;
    total_paid?:number;
    total_qty_ordered?:number;
    total_refunded?:number;
    updated_at?:string;
    weight?:number;
    x_forwarded_for?:string;
    items?:Array<Magento2ProductItem>;
    product_option?:any;
    extension_attributes?:any;

}

interface Magento2Comment {
    comment:string,
    created_at:string,
    entity_id:number,
    is_customer_notified:number,
    is_visible_on_front:number,
    parent_id:number,
    extension_attributes:any
}

interface Magento2InvoiceItem {
    additional_data?:string;
    base_cost?:number;
    base_discount_amount?:number;
    base_discount_tax_compensation_amount?:number;
    base_price?:number;
    base_price_incl_tax?:number;
    base_row_total?:number;
    base_row_total_incl_tax?:number;
    base_tax_amount?:number;
    description?:string;
    discount_amount?:number;
    entity_id?:number;
    discount_tax_compensation_amount?:number;
    name?:string;
    order_item_id?:number;
    parent_id?:number;
    price?:number;
    price_incl_tax?:number;
    product_id?:number;
    qty?:number;
    row_total?:number;
    row_total_incl_tax?:number;
    sku?:string;
    tax_amount?:number;
    extension_attributes?:any
}
/**
 * Magento2 Invoice
 */
interface Magento2Invoice {
    base_currency_code?:string;
    base_discount_amount?:number;
    base_grand_total?:number;
    base_discount_tax_compensation_amount?:number;
    base_shipping_amount?:number;
    base_shipping_discount_tax_compensation_amnt?:number;
    base_shipping_incl_tax?:number;
    base_shipping_tax_amount?:number;
    base_subtotal?:number;
    base_subtotal_incl_tax?:number;
    base_tax_amount?:number;
    base_total_refunded?:number;
    base_to_global_rate?:number;
    base_to_order_rate?:number;
    billing_address_id?:number;
    can_void_flag?:number;
    created_at?:string;
    discount_amount?:number;
    discount_description?:string;
    email_sent?:number;
    entity_id?:number;
    global_currency_code?:string;
    grand_total?:number;
    discount_tax_compensation_amount?:number;
    increment_id?:string;
    is_used_for_refund?:number;
    order_currency_code?:string;
    order_id?:number;
    shipping_address_id?:number;
    shipping_amount?:number;
    shipping_discount_tax_compensation_amount?:number;
    shipping_incl_tax?:number;
    shipping_tax_amount?:number;
    state?:number;
    store_currency_code?:string;
    store_id?:number;
    store_to_base_rate?:number;
    store_to_order_rate?:number;
    subtotal?:number;
    subtotal_incl_tax?:number;
    tax_amount?:number;
    total_qty?:number;
    transaction_id?:string;
    updated_at?:string;
    items?:Array<Magento2InvoiceItem>;
    comments?:Array<Magento2Comment>;
    extension_attributes?:any;
}

interface Magento2RequestFilter {
    field:string;
    value:string;
    condition_type?:string;
}
interface Magento2RequestFilterGroup {
    filters?:Array<Magento2RequestFilter>;
}
interface Magento2RequestSearchCriteria {
    filterGroups?:Array<Magento2RequestFilterGroup>;
}
interface Magento2RequestParams {
    searchCriteria?:Magento2RequestSearchCriteria;
}
