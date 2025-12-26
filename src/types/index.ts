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

export type CustomerRating = 1 | 2 | 3 | 4 | 5;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  notes: string;
  rating: CustomerRating; // 1-5 estrelas
  creditBalance: number; // Saldo devedor (positivo = devendo)
  totalPurchases: number;
  totalPaid: number; // Total já pago
  createdAt: Date;
}

// Calcula o limite de crédito baseado no rating e histórico
export const calculateCreditLimit = (customer: Customer): number => {
  const baseLimit = customer.rating * 50; // R$50 por estrela
  const historyBonus = Math.min(customer.totalPaid * 0.1, 200); // 10% do histórico, max R$200
  return baseLimit + historyBonus;
};

export const getAvailableCredit = (customer: Customer): number => {
  const limit = calculateCreditLimit(customer);
  return Math.max(0, limit - customer.creditBalance);
};

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'credit_line';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  paymentMethod?: PaymentMethod;
  paidAmount?: number; // Quanto foi pago (pode ser menos que total se usou crédito)
  creditUsed?: number; // Quanto foi usado do crédito
  createdAt: Date;
  closedAt?: Date;
}

export const formatDuration = (start: Date, end?: Date): string => {
  const endTime = end || new Date();
  const diff = endTime.getTime() - new Date(start).getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  credit_line: 'Fiado',
};
