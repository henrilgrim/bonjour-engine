export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  minQuantity: number;
  categoryId: string;
  supplierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  cnpj: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  notes: string;
  totalPurchases: number;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  createdAt: Date;
  closedAt?: Date;
}
