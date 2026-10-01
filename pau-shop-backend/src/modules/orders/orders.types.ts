export interface CreateOrderItemDTO {
  product_id: string;
  quantity: number;
}

export interface CreateOrderDTO {
  shipping_address_id: string;
  items: CreateOrderItemDTO[];
}

export const SHIPPING_STATUSES = ["pending", "shipped", "arrived"] as const;
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];
