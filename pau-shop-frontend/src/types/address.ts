export interface Address {
  id?: string;
  user_id?: string;

  first_name: string;
  last_name: string;
  phone: string;

  street: string;
  exterior_number: string;
  interior_number?: string | null;

  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;

  created_at?: string;
}

export function formatAddress(address: Address | null): string {
  if (!address) return "";
  return `${address.first_name} ${address.last_name}
${address.street} ${address.exterior_number} ${address.interior_number ?? ""}
${address.neighborhood}, ${address.city}, ${address.state}
${address.postal_code}`;
}