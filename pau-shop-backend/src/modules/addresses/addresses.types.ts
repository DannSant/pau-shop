export interface ShippingAddress {
  id: string;
  user_id: string;

  street: string;
  exterior_number: string;
  interior_number?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;

  created_at: string;
}

export interface CreateAddressDTO {
  street: string;
  exterior_number: string;
  interior_number?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface UpdateAddressDTO extends Partial<CreateAddressDTO> {}
