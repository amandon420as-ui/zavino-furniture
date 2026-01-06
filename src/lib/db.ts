import localforage from 'localforage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuid } from 'uuid';

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stockQty: number;
  imageUrl: string;
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
  invoiceNumber?: string;
  customerId: string;
  date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
};

export type InvoiceItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
};

localforage.config({
  name: 'zavino-furniture-shop',
  version: 1.0,
});

const productsStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'products',
});

const customersStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'customers',
});

const invoicesStore = localforage.createInstance({
  name: 'zavino-furniture-shop',
  storeName: 'invoices',
});

async function getAll<T>(store: LocalForage): Promise<T[]> {
  const items: T[] = [];
  await store.iterate<T, void>((value) => {
    items.push(value);
  });
  return items;
}

async function seedProductsIfEmpty() {
  const count = await productsStore.length();
  if (count > 0) return;

  const seed: Product[] = [
    {
      id: uuid(),
      name: 'Verona Leather Sofa',
      sku: 'SOFA-VERONA-3S',
      price: 89999,
      cost: 55000,
      stockQty: 4,
      imageUrl:
        'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg',
    },
    {
      id: uuid(),
      name: 'Oslo Fabric Sectional',
      sku: 'SOFA-OSLO-L',
      price: 109999,
      cost: 70000,
      stockQty: 2,
      imageUrl:
        'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg',
    },
    {
      id: uuid(),
      name: 'Milan Dining Table (6-Seater)',
      sku: 'TABLE-MILAN-6',
      price: 45999,
      cost: 28000,
      stockQty: 6,
      imageUrl:
        'https://images.pexels.com/photos/37347/office-freelancer-computer-business-37347.jpeg',
    },
    {
      id: uuid(),
      name: 'Zurich Coffee Table',
      sku: 'TABLE-ZURICH-CT',
      price: 18999,
      cost: 9000,
      stockQty: 10,
      imageUrl:
        'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
    },
    {
      id: uuid(),
      name: 'Vienna Accent Chair',
      sku: 'CHAIR-VIENNA-AC',
      price: 24999,
      cost: 12000,
      stockQty: 8,
      imageUrl:
        'https://images.pexels.com/photos/1866140/pexels-photo-1866140.jpeg',
    },
  ];

  await Promise.all(seed.map((p) => productsStore.setItem(p.id, p)));
}

async function seedCustomersIfEmpty() {
  const count = await customersStore.length();
  if (count > 0) return;

  const customers: Customer[] = [
    {
      id: uuid(),
      name: 'Arjun Mehta',
      phone: '+91 98765 43210',
      address: 'Bandra West, Mumbai, Maharashtra',
    },
    {
      id: uuid(),
      name: 'Priya Sharma',
      phone: '+91 91234 56789',
      address: 'HSR Layout, Bengaluru, Karnataka',
    },
    {
      id: uuid(),
      name: 'Kavita & Co Interiors',
      phone: '+91 99887 66554',
      address: 'Koregaon Park, Pune, Maharashtra',
    },
  ];

  await Promise.all(customers.map((c) => customersStore.setItem(c.id, c)));
}

// Products

export function useProducts() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      await seedProductsIfEmpty();
      return getAll<Product>(productsStore);
    },
  });

  const addProduct = useMutation({
    mutationFn: async (
      input: Omit<Product, 'id'> & { id?: string },
    ): Promise<Product> => {
      const id = input.id ?? uuid();
      const product: Product = { ...input, id };
      await productsStore.setItem(id, product);
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (product: Product): Promise<Product> => {
      await productsStore.setItem(product.id, product);
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await productsStore.removeItem(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    productsQuery,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}

// Customers

export function useCustomers() {
  const queryClient = useQueryClient();

  const customersQuery = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      await seedCustomersIfEmpty();
      return getAll<Customer>(customersStore);
    },
  });

  const upsertCustomer = useMutation({
    mutationFn: async (
      input: Partial<Customer> & { id?: string },
    ): Promise<Customer> => {
      const id = input.id ?? uuid();
      const existing = (await customersStore.getItem<Customer>(id)) ?? {
        id,
        name: '',
        phone: '',
        address: '',
      };
      const customer: Customer = { ...existing, ...input, id };
      await customersStore.setItem(id, customer);
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return {
    customersQuery,
    upsertCustomer,
  };
}

// Invoices

export function useInvoices() {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => getAll<Invoice>(invoicesStore),
  });

  const saveInvoice = useMutation({
    mutationFn: async (
      input: Omit<Invoice, 'id'> & { id?: string },
    ): Promise<Invoice> => {
      const id = input.id ?? uuid();
      const invoice: Invoice = { ...input, id };
      await invoicesStore.setItem(id, invoice);
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    invoicesQuery,
    saveInvoice,
  };
}


