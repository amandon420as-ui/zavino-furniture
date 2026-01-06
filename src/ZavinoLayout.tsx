import React, { useMemo, useState } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  CreditCard,
  Users,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCustomers,
  useInvoices,
  useProducts,
} from './lib/db';
import type { Invoice, InvoiceItem } from './lib/db';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Inventory', to: '/inventory', icon: Boxes },
  { label: 'Billing', to: '/billing', icon: CreditCard },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
];

const ZavinoLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = (
    <div className="h-full w-64 bg-slate-900 text-white p-4 flex flex-col">
      <div className="mb-6 text-xl font-bold tracking-tight">
        Zavino Furniture
      </div>
      <nav className="space-y-1">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              ].join(' ')
            }
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 text-xs text-slate-500 border-t border-slate-800">
        © {new Date().getFullYear()} Zavino Furniture
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-800 text-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0">{Sidebar}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="relative flex w-64 flex-col bg-slate-900">
            {Sidebar}
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
          <span className="hidden md:inline text-sm font-medium text-slate-300">
            Zavino Admin
          </span>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 hidden sm:inline">
              Furniture Shop • India
            </div>
            <button
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-200 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {/* Routed content */}
        <main className="flex-1 p-4 md:p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route
              path="/reports"
              element={
                <Section title="Reports">
                  Reports & analytics coming soon.
                </Section>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="max-w-4xl">
    <h1 className="text-2xl font-semibold text-white mb-2">{title}</h1>
    <p className="text-sm text-slate-300">{children}</p>
  </div>
);

const DashboardPage: React.FC = () => {
  const { productsQuery } = useProducts();
  const { invoicesQuery } = useInvoices();

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const {
    todaySales,
    pendingAmount,
    lowStockCount,
    recentInvoices,
    monthlySales,
  } = useMemo(() => {
    const products = productsQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];

    const lowStock = products.filter((p) => p.stockQty < 5).length;

    let todaySalesSum = 0;
    let pendingSum = 0;

    const recent = [...invoices]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);

    const monthlyMap = new Map<string, number>();

    invoices.forEach((inv) => {
      const invDate = new Date(inv.date);
      const key = invDate.toISOString().slice(0, 10);
      if (key === todayKey && inv.status === 'paid') {
        todaySalesSum += inv.total;
      }
      if (inv.status === 'unpaid' || inv.status === 'overdue') {
        pendingSum += inv.total;
      }

      const monthKey = `${invDate.getFullYear()}-${String(
        invDate.getMonth() + 1,
      ).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + inv.total);
    });

    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([key, total]) => {
        const [year, month] = key.split('-');
        return {
          month: `${month}/${year.slice(2)}`,
          total: total / 100,
        };
      });

    return {
      todaySales: todaySalesSum / 100,
      pendingAmount: pendingSum / 100,
      lowStockCount: lowStock,
      recentInvoices: recent,
      monthlySales: monthlyData,
    };
  }, [productsQuery.data, invoicesQuery.data, todayKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-slate-300">
          Snapshot of Zavino Furniture performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Today's sales"
          value={`₹${todaySales.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          helper="Paid invoices for today"
        />
        <KpiCard
          label="Pending receivables"
          value={`₹${pendingAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          helper="Unpaid & overdue invoices"
        />
        <KpiCard
          label="Low stock items"
          value={lowStockCount.toString()}
          helper="< 5 units in inventory"
          tone="alert"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Recent invoices
            </h2>
            <span className="text-xs text-slate-400">
              Last {recentInvoices.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-900/80">
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Invoice
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Date
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-300">
                    Total
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentInvoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      No invoices yet.
                    </td>
                  </tr>
                )}
                {recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-3 py-2 text-slate-100">
                      {inv.invoiceNumber ?? inv.id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {new Date(inv.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100">
                      ₹{(inv.total / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize text-slate-100 bg-slate-800">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Monthly sales (₹)
            </h2>
            <span className="text-xs text-slate-400">Last 6 months</span>
          </div>
          <div className="h-56">
            {monthlySales.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No invoice data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#cbd5f5" />
                  <YAxis
                    stroke="#cbd5f5"
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: 8,
                    }}
                    formatter={(value?: number) =>
                      value == null
                        ? ['₹0', 'Sales']
                        : [`₹${value.toLocaleString('en-IN')}`, 'Sales']
                    }
                  />
                  <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Values shown in thousands (₹k) for readability.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>
            Tip: Install Zavino as an app from your browser menu for a faster
            billing experience, even on spotty connections.
          </p>
          <button
            type="button"
            className="rounded-md border border-slate-600 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-slate-800"
            onClick={async () => {
              // Export simple CSV backups for products, customers, invoices
              const [products, customers, invoices] = await Promise.all([
                useProducts().productsQuery.refetch().then((r) => r.data ?? []),
                useCustomers().customersQuery
                  .refetch()
                  .then((r) => r.data ?? []),
                useInvoices().invoicesQuery
                  .refetch()
                  .then((r) => r.data ?? []),
              ]);

              const exportCsv = (filename: string, header: string, rows: string[]) => {
                const blob = new Blob([header + rows.join('\n')], {
                  type: 'text/csv;charset=utf-8;',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
              };

              exportCsv(
                'zavino-products.csv',
                'id,name,sku,price_paise,cost_paise,stockQty,imageUrl\n',
                products.map(
                  (p) =>
                    `${p.id},"${p.name.replace(/"/g, '""')}",${p.sku},${p.price},${p.cost},${p.stockQty},${p.imageUrl}`,
                ),
              );

              exportCsv(
                'zavino-customers.csv',
                'id,name,phone,address\n',
                customers.map(
                  (c) =>
                    `${c.id},"${c.name.replace(/"/g, '""')}","${c.phone.replace(
                      /"/g,
                      '""',
                    )}","${c.address.replace(/"/g, '""')}"`,
                ),
              );

              exportCsv(
                'zavino-invoices.csv',
                'id,invoiceNumber,customerId,date,status,subtotal_paise,tax_paise,total_paise\n',
                invoices.map(
                  (i) =>
                    `${i.id},${i.invoiceNumber ?? ''},${i.customerId},${
                      i.date
                    },${i.status},${i.subtotal},${i.tax},${i.total}`,
                ),
              );
            }}
          >
            Export data CSV
          </button>
        </div>
      </div>
    </div>
  );
};

type KpiCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'alert';
};

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  helper,
  tone = 'default',
}) => (
  <div
    className={`rounded-lg border p-4 shadow-sm ${
      tone === 'alert'
        ? 'border-red-500/60 bg-red-950/30'
        : 'border-emerald-500/40 bg-slate-900/70'
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    {helper && (
      <p className="mt-1 text-xs text-slate-400">
        {helper}
      </p>
    )}
  </div>
);

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  cost: z.coerce.number().min(0, 'Cost must be positive'),
  stockQty: z.coerce.number().int().min(0, 'Stock must be positive'),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productSchema>;

const InventoryPage: React.FC = () => {
  const { productsQuery, addProduct, updateProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      cost: 0,
      stockQty: 0,
      imageUrl: '',
    },
  });

  const filteredProducts = useMemo(() => {
    if (!productsQuery.data) return [];
    return productsQuery.data.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesLowStock = !showLowStockOnly || p.stockQty <= 3;
      return matchesSearch && matchesLowStock;
    });
  }, [productsQuery.data, search, showLowStockOnly]);

  const onSubmit = async (values: ProductFormValues) => {
    await addProduct.mutateAsync({
      ...values,
      imageUrl: values.imageUrl || '',
    });
    reset();
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Inventory</h1>
          <p className="text-sm text-slate-300">
            Manage your furniture products, stock levels, and pricing.
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
          onClick={() => setShowModal(true)}
        >
          Add Product
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
          Show low stock (≤ 3)
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <button
          type="button"
          onClick={() => {
            if (!productsQuery.data) return;
            const header = 'Name,SKU,Price (₹),Cost (₹),Stock Qty\n';
            const rows = productsQuery.data
              .map(
                (p) =>
                  `"${p.name.replace(/"/g, '""')}",${p.sku},${(p.price / 100).toFixed(
                    2,
                  )},${(p.cost / 100).toFixed(2)},${p.stockQty}`,
              )
              .join('\n');
            const blob = new Blob([header + rows], {
              type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'zavino-inventory.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
        >
          Export CSV
        </button>
        <span className="text-xs text-slate-400">
          Click stock cells to bulk edit quantities.
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-300">
                Name
              </th>
              <th className="px-4 py-2 text-left font-medium text-slate-300">
                SKU
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">
                Price
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">
                Cost
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {productsQuery.isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-slate-400"
                >
                  Loading products...
                </td>
              </tr>
            )}
            {!productsQuery.isLoading && filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-slate-400"
                >
                  No products found.
                </td>
              </tr>
            )}
            {filteredProducts.map((p) => (
              <tr
                key={p.id}
                className={p.stockQty <= 3 ? 'bg-red-950/20' : undefined}
              >
                <td className="px-4 py-2 text-slate-100">{p.name}</td>
                <td className="px-4 py-2 text-slate-300">{p.sku}</td>
                <td className="px-4 py-2 text-right text-slate-100">
                  ₹{(p.price / 100).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right text-slate-300">
                  ₹{(p.cost / 100).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right text-slate-100">
                  <button
                    type="button"
                    className={`inline-flex items-center justify-end gap-1 rounded px-2 py-1 text-xs ${
                      p.stockQty < 5
                        ? 'bg-red-900/60 text-red-50'
                        : 'bg-slate-800 text-slate-100'
                    }`}
                    onClick={() => {
                      const next = window.prompt(
                        `Update stock for "${p.name}"`,
                        String(p.stockQty),
                      );
                      if (next == null) return;
                      const qty = Number(next);
                      if (Number.isNaN(qty) || qty < 0) return;
                      void updateProduct.mutateAsync({ ...p, stockQty: qty });
                    }}
                  >
                    {p.stockQty}
                    {p.stockQty < 5 && (
                      <span className="rounded bg-red-600 px-1 text-[10px] font-semibold uppercase">
                        Low
                      </span>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Add Product
              </h2>
              <button
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                onClick={() => setShowModal(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Name
                  </label>
                  <input
                    {...register('name')}
                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    SKU
                  </label>
                  <input
                    {...register('sku')}
                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.sku.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price')}
                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.price && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('cost')}
                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.cost && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.cost.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    {...register('stockQty')}
                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.stockQty && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.stockQty.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Image URL
                </label>
                <input
                  {...register('imageUrl')}
                  className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.imageUrl && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.imageUrl.message}
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || addProduct.isPending}
                  className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting || addProduct.isPending
                    ? 'Saving...'
                    : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

type BillingLine = InvoiceItem;

const BillingPage: React.FC = () => {
  const { productsQuery } = useProducts();
  const { customersQuery } = useCustomers();
  const { invoicesQuery, saveInvoice } = useInvoices();

  const [customerId, setCustomerId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [lines, setLines] = useState<BillingLine[]>([]);
  const [applyGst, setApplyGst] = useState(true);

  const gstRate = 0.18;

  const invoiceNumber = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}${m}${d}`;
    const count = invoicesQuery.data?.length ?? 0;
    const seq = String(count + 1).padStart(3, '0');
    return `ZAVINO-${today}-${seq}`;
  }, [invoicesQuery.data]);

  const filteredProducts = useMemo(() => {
    if (!productsQuery.data) return [];
    if (!productSearch) return productsQuery.data.slice(0, 10);
    return productsQuery.data
      .filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase()),
      )
      .slice(0, 10);
  }, [productsQuery.data, productSearch]);

  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  const tax = applyGst ? Math.round(subtotal * gstRate) : 0;
  const total = subtotal + tax;

  const addProductToInvoice = (productId: string) => {
    if (!productsQuery.data) return;
    const product = productsQuery.data.find((p) => p.id === productId);
    if (!product) return;

    const existing = lines.find((l) => l.productId === productId);
    if (existing) {
      updateLineQty(existing.id, existing.quantity + 1);
      return;
    }

    const line: BillingLine = {
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      quantity: 1,
      price: product.price,
      total: product.price,
    };
    setLines((prev) => [...prev, line]);
  };

  const updateLineQty = (lineId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              quantity: qty,
              total: Math.max(0, Math.round(qty * l.price)),
            }
          : l,
      ),
    );
  };

  const updateLinePrice = (lineId: string, price: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              price,
              total: Math.max(0, Math.round(l.quantity * price)),
            }
          : l,
      ),
    );
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const handleSaveInvoice = async () => {
    if (!customerId || lines.length === 0) return;

    const invoice: Omit<Invoice, 'id'> = {
      invoiceNumber,
      customerId,
      date: new Date().toISOString(),
      status: 'unpaid',
      subtotal,
      tax,
      total,
      items: lines,
    };

    await saveInvoice.mutateAsync(invoice);
    setLines([]);
    setCustomerId('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Billing</h1>
        <p className="text-sm text-slate-300">
          Create GST-compliant invoices with automatic tax calculation.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Invoice No: <span className="font-mono">{invoiceNumber}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,3fr]" id="invoice-layout">
        <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select customer...</option>
              {customersQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-300">
            <input
              type="checkbox"
              checked={applyGst}
              onChange={(e) => setApplyGst(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            Apply GST 18% automatically
          </label>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Add product
            </label>
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-2 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-700 bg-slate-950/70 p-2 text-sm">
              {filteredProducts.length === 0 && (
                <div className="px-2 py-1 text-slate-500">No products.</div>
              )}
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-slate-100 hover:bg-slate-800"
                  onClick={() => addProductToInvoice(p.id)}
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-slate-300">
                    ₹{(p.price / 100).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900/70 p-4 print:bg-white print:text-black print:border-none">
          <div className="space-y-3 border-b border-slate-700 pb-3 print:border-slate-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-white print:text-black">
                  Zavino Furniture
                </p>
                <p className="text-xs text-slate-400 print:text-slate-700">
                  GSTIN: 27AAACZ1234A1Z5 • Mumbai, Maharashtra
                </p>
              </div>
              <div className="text-xs text-slate-300 print:text-slate-700">
                <div>Invoice: {invoiceNumber}</div>
                <div>
                  Date:{' '}
                  {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <div className="grid gap-2 text-xs text-slate-300 print:text-slate-700 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-200 print:text-black">
                  Bill To
                </p>
                {customersQuery.data
                  ?.filter((c) => c.id === customerId)
                  .map((c) => (
                    <div key={c.id}>
                      <p>{c.name}</p>
                      <p>{c.phone}</p>
                      <p>{c.address}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm print:divide-slate-300">
              <thead>
                <tr className="bg-slate-900/80 print:bg-slate-100">
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-300 print:text-slate-800">
                    Item Description
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-300 print:text-slate-800">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-300 print:text-slate-800">
                    Rate (₹)
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-300 print:text-slate-800">
                    Amount (₹)
                  </th>
                  <th className="print:hidden" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                {lines.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      No items. Add products from the left.
                    </td>
                  </tr>
                )}
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2 text-slate-100 print:text-black">
                      {line.name}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLineQty(line.id, Number(e.target.value) || 0)
                        }
                        className="w-16 rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-right text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 print:border-none print:bg-transparent print:text-black"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={line.price}
                        onChange={(e) =>
                          updateLinePrice(line.id, Number(e.target.value) || 0)
                        }
                        className="w-24 rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-right text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 print:border-none print:bg-transparent print:text-black"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-slate-100 print:text-black">
                      ₹{(line.total / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="text-xs text-slate-400 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 text-sm text-slate-100 print:text-black">
            <div className="flex justify-between">
              <span className="text-slate-300">Subtotal</span>
              <span>₹{(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">GST (18%)</span>
              <span>₹{(tax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>₹{(total / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:mt-6">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.print();
                }
              }}
              className="inline-flex items-center rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 print:hidden"
            >
              Print / PDF
            </button>
            <button
              type="button"
              onClick={handleSaveInvoice}
              disabled={!customerId || lines.length === 0 || saveInvoice.isPending}
              className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveInvoice.isPending ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z
    .string()
    .regex(
      /^(\+91[\s-]?)?[6-9]\d{9}$/,
      'Enter a valid Indian phone number (+91 XXXXX XXXXX)',
    ),
  address: z.string().min(1, 'Address is required'),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CustomersPage: React.FC = () => {
  const { customersQuery, upsertCustomer } = useCustomers();
  const { invoicesQuery } = useInvoices();
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
  });

  const customerStats = useMemo(() => {
    const customers = customersQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];

    return customers.map((c) => {
      const forCustomer = invoices.filter((i) => i.customerId === c.id);
      const total = forCustomer.reduce((sum, i) => sum + i.total, 0);
      const pending = forCustomer
        .filter((i) => i.status === 'unpaid' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.total, 0);
      return {
        ...c,
        totalSpent: total / 100,
        pendingBalance: pending / 100,
      };
    });
  }, [customersQuery.data, invoicesQuery.data]);

  const openForCustomer = (id?: string) => {
    if (id) {
      const c = customersQuery.data?.find((x) => x.id === id);
      if (c) {
        reset({
          name: c.name,
          phone: c.phone,
          address: c.address,
        });
        setEditingCustomer(id);
      }
    } else {
      reset({ name: '', phone: '', address: '' });
      setEditingCustomer(null);
    }
    setShowModal(true);
  };

  const onSubmitCustomer = async (values: CustomerFormValues) => {
    await upsertCustomer.mutateAsync({
      id: editingCustomer ?? undefined,
      ...values,
    });
    setShowModal(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customers</h1>
          <p className="text-sm text-slate-300">
            Track repeat buyers, total spend, and pending balances.
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
          onClick={() => openForCustomer()}
        >
          Add Customer
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
          <thead>
            <tr className="bg-slate-900/80">
              <th className="px-4 py-2 text-left font-medium text-slate-300">
                Name
              </th>
              <th className="px-4 py-2 text-left font-medium text-slate-300">
                Phone
              </th>
              <th className="px-4 py-2 text-left font-medium text-slate-300">
                Address
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">
                Total spent
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">
                Pending
              </th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {customerStats.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-xs text-slate-500"
                >
                  No customers yet. Start by adding your first customer.
                </td>
              </tr>
            )}
            {customerStats.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 text-slate-100">{c.name}</td>
                <td className="px-4 py-2 text-slate-300">{c.phone}</td>
                <td className="px-4 py-2 text-slate-400">{c.address}</td>
                <td className="px-4 py-2 text-right text-slate-100">
                  ₹
                  {c.totalSpent.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-2 text-right">
                  <span
                    className={`inline-flex items-center justify-end rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.pendingBalance > 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    ₹
                    {c.pendingBalance.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-emerald-400"
                    onClick={() => openForCustomer(c.id)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                onClick={() => setShowModal(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit(onSubmitCustomer)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Name
                </label>
                <input
                  {...register('name')}
                  className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Phone (+91)
                </label>
                <input
                  {...register('phone')}
                  className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Address
                </label>
                <textarea
                  {...register('address')}
                  className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || upsertCustomer.isPending}
                  className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting || upsertCustomer.isPending
                    ? 'Saving...'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZavinoLayout;


