import localforage from 'localforage';

// ---- Types ----

export type Product = {
  id: string;
  name: string;
  category: string;       // category name or categoryId, depending on how you wire it
  price: number;
  cost: number;
  stockQty: number;
  sku: string;
  imageUrl: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
};

export type InvoiceStatus = 'draft' | 'unpaid' | 'paid' | 'overdue' | 'cancelled';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;          // ISO string
  total: number;
  status: InvoiceStatus;
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  price: number;         // unit price
  total: number;         // quantity * price
};

// ---- LocalForage instances ----

localforage.config({
  name: 'zavino-furniture-shop',
  version: 1.0,
});

export const productsStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'products',
});

export const categoriesStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'categories',
});

export const customersStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'customers',
});

export const invoicesStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'invoices',
});

export const invoiceItemsStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'invoiceItems',
});

// ---- Helper functions (optional, but handy) ----

export async function seedIfEmpty() {
  const productsCount = await productsStore.length();
  if (productsCount === 0) {
    // Add some starter data here if you want
  }
}