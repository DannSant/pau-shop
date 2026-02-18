export interface CreateOrderItemDTO {
  product_id: string;
  quantity: number;
}

export interface CreateOrderDTO {
  shipping_address_id: string;
  items: CreateOrderItemDTO[];
}
