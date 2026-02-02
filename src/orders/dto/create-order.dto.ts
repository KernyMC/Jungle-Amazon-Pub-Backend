export class CreateOrderDto {
  items!: {
    menuItemId: string;
    name: string;
    quantity: number;
    basePrice: number;
    options?: {
      groupTitle: string;
      selections: { label: string; extraPrice: number }[];
    }[];
    notes?: string;
  }[];
  userPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  couponCode?: string;
}

export class UpdateOrderDto {
  status?: string;
  notes?: string;
}
