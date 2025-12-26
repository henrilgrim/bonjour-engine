import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Category, Supplier, Customer, Order } from '@/types';

interface StoreState {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  orders: Order[];
  
  // Products
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Categories
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Suppliers
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Customers
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Orders
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      products: [],
      categories: [
        { id: '1', name: 'Cigarros', description: 'Cigarros e tabaco', color: '#F59E0B', createdAt: new Date() },
        { id: '2', name: 'Bebidas', description: 'Bebidas em geral', color: '#3B82F6', createdAt: new Date() },
        { id: '3', name: 'Acessórios', description: 'Isqueiros, piteiras, etc', color: '#10B981', createdAt: new Date() },
      ],
      suppliers: [],
      customers: [],
      orders: [],

      // Products
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, product) => set((state) => ({
        products: state.products.map((p) => p.id === id ? { ...p, ...product, updatedAt: new Date() } : p)
      })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      // Categories
      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, category) => set((state) => ({
        categories: state.categories.map((c) => c.id === id ? { ...c, ...category } : c)
      })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),

      // Suppliers
      addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] })),
      updateSupplier: (id, supplier) => set((state) => ({
        suppliers: state.suppliers.map((s) => s.id === id ? { ...s, ...supplier } : s)
      })),
      deleteSupplier: (id) => set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) })),

      // Customers
      addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (id, customer) => set((state) => ({
        customers: state.customers.map((c) => c.id === id ? { ...c, ...customer } : c)
      })),
      deleteCustomer: (id) => set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),

      // Orders
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      updateOrder: (id, order) => set((state) => ({
        orders: state.orders.map((o) => o.id === id ? { ...o, ...order } : o)
      })),
      deleteOrder: (id) => set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),
    }),
    {
      name: 'tabacaria-storage',
    }
  )
);
