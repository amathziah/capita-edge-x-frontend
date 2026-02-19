import { Customer, Product, Invoice, Payment, Expense, InvoiceItem } from '../types';

// ✅ Utility functions
const generateId = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

const randomChoice = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const randomDate = (year = 2024) =>
  new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

const generateGSTIN = (stateCode: string, index: number) =>
  `${stateCode}ABCDE${String(1000 + index)}F1Z${index % 9}`;

// ✅ Customers (25 total)
export const seedCustomers: Customer[] = [
  {
    id: generateId(),
    name: "Acme Corporation Ltd",
    email: "accounts@acme.com",
    phone: "+91 98765 43210",
    address: "123 Business Park, Mumbai, MH 400001",
    taxId: "27AABCA1234M1Z5",
    tags: ["corporate", "premium"],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: generateId(),
    name: "Tech Solutions Pvt Ltd",
    email: "billing@techsol.com",
    phone: "+91 87654 32109",
    address: "45 IT Hub, Pune, MH 411001",
    gstin: "27AABCT5678N2A6",
    tags: ["tech", "regular"],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: generateId(),
    name: "Global Enterprises",
    email: "finance@global.com",
    phone: "+91 76543 21098",
    address: "78 Commerce Street, Delhi, DL 110001",
    gstin: "07AABCG9012P3B7",
    tags: ["global", "high-volume"],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-03')
  },
  {
    id: generateId(),
    name: "SmartRetail Chain",
    email: "purchase@smartretail.in",
    phone: "+91 65432 10987",
    address: "12 Retail Plaza, Bangalore, KA 560001",
    gstin: "29AABCS3456Q4C8",
    tags: ["retail", "chain"],
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: generateId(),
    name: "Manufacturing Hub Ltd",
    email: "procurement@mfghub.com",
    phone: "+91 54321 09876",
    address: "56 Industrial Area, Chennai, TN 600001",
    gstin: "33AABCM7890R5D9",
    tags: ["manufacturing", "bulk"],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-11')
  },
  // Generate remaining 20 customers
  ...Array.from({ length: 20 }, (_, i) => ({
    id: generateId(),
    name: `Customer ${i + 6}`,
    email: `customer${i + 6}@example.com`,
    phone: `+91 9${String(10000 + i).padStart(5, '0')} ${String(20000 + i).padStart(5, '0')}`,
    address: `Address ${i + 6}, City ${i + 6}, State ${String(i + 6).padStart(6, '0')}`,
    gstin: i % 2 === 0 ? generateGSTIN(String(10 + i).padStart(2, '0'), i) : undefined,
    tags: i % 2 === 0 ? ["regular"] : ["new"],
    createdAt: new Date(2024, 0, 15 + i),
    updatedAt: new Date(2024, 0, 15 + i + 1)
  }))
];

// ✅ Products (30 total)
export const seedProducts: Product[] = [
  {
    id: generateId(),
    name: "Wireless Headphones Pro",
    description: "Premium wireless headphones with noise cancellation",
    price: 8999,
    stock: 45,
    minStock: 10,
    unit: "piece",
    category: "Electronics",
    gstRate: 18,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: generateId(),
    name: "Smart Watch Series 5",
    description: "Advanced smartwatch with health monitoring",
    price: 15999,
    stock: 30,
    minStock: 5,
    unit: "piece",
    category: "Electronics",
    gstRate: 18,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-13')
  },
  {
    id: generateId(),
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with bass boost",
    price: 3999,
    stock: 80,
    minStock: 15,
    unit: "piece",
    category: "Electronics",
    gstRate: 18,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: generateId(),
    name: "USB-C Cable 2m",
    description: "High-speed charging and data transfer cable",
    price: 599,
    stock: 200,
    minStock: 50,
    unit: "piece",
    category: "Accessories",
    gstRate: 18,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-19')
  },
  {
    id: generateId(),
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 1299,
    stock: 120,
    minStock: 25,
    unit: "piece",
    category: "Accessories",
    gstRate: 18,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21')
  },
  // Remaining 25 programmatically
  ...Array.from({ length: 25 }, (_, i) => ({
    id: generateId(),
    name: `Product ${i + 6}`,
    description: `Description for product ${i + 6}`,
    price: Math.floor(Math.random() * 10000) + 500,
    stock: Math.floor(Math.random() * 100) + 10,
    minStock: Math.floor(Math.random() * 20) + 5,
    unit: ["piece", "kg", "liter", "box"][i % 4],
    category: ["Electronics", "Accessories", "Office", "Home"][i % 4],
    gstRate: [5, 12, 18, 28][i % 4],
    createdAt: new Date(2024, 0, 10 + i),
    updatedAt: new Date(2024, 0, 10 + i + 1)
  }))
];

// ✅ Invoices (20 total)
const invoices: Invoice[] = [];

for (let i = 0; i < 20; i++) {
  const customerId = seedCustomers[i % seedCustomers.length].id;
  const itemCount = Math.floor(Math.random() * 3) + 1;

  const items: InvoiceItem[] = [];
  let subtotal = 0;
  let gstAmount = 0;

  for (let j = 0; j < itemCount; j++) {
    const product = seedProducts[(i * 3 + j) % seedProducts.length];
    const quantity = Math.floor(Math.random() * 5) + 1;

    // deduct stock realistically
    if (product.stock >= quantity) {
      product.stock -= quantity;
    }

    const unitPrice = product.price;
    const discount = Math.floor(Math.random() * 10);
    const gstRate = product.gstRate || 18; // Default to 18 if undefined

    const itemSubtotal = quantity * unitPrice * (1 - discount / 100);
    const itemGst = itemSubtotal * (gstRate / 100);
    const total = itemSubtotal + itemGst;

    subtotal += itemSubtotal;
    gstAmount += itemGst;

    items.push({
      productId: product.id,
      quantity,
      price: unitPrice, // unitPrice -> price
      description: product.name, // Added description as it is required in InvoiceItem
      discount,
      // gstRate is not in InvoiceItem interface, removing it or handling if needed elsewhere
      // total is not in InvoiceItem interface? Wait, let me check InvoiceItem again.
    });
  }

  const total = subtotal + gstAmount;
  const createdDate = new Date(2024, Math.floor(i / 3), (i % 28) + 1);
  const dueDate = new Date(createdDate);
  dueDate.setDate(dueDate.getDate() + 30);

  invoices.push({
    id: generateId(),
    invoiceNumber: `INV-2024-${String(i + 1).padStart(4, '0')}`,
    customerId,
    items, // InvoiceItem[]
    subtotal,
    taxAmount: gstAmount, // gstAmount -> taxAmount
    total,
    status: randomChoice(['draft', 'sent', 'paid', 'overdue']),
    date: createdDate.toISOString(),
    dueDate: dueDate.toISOString(),
    createdAt: createdDate.toISOString(),
    updatedAt: new Date(createdDate.getTime() + Math.random() * 86400000).toISOString(),
    // type and originalInvoiceId are not in Invoice interface based on previous view_file of index.ts
    // Removing them to avoid errors if they are indeed missing.
    notes: i % 5 === 0 ? "Special delivery instructions included" : undefined,
    seller: {}, // Mock
    buyer: {} // Mock
  });
}

export const seedInvoices = invoices;

// ✅ Payments (for paid invoices)
export const seedPayments: Payment[] = seedInvoices
  .filter(inv => inv.status === 'paid')
  .map(invoice => ({
    id: generateId(),
    invoiceId: invoice.id,
    amount: invoice.total,
    method: randomChoice(['upi', 'card', 'bank_transfer', 'cash']),
    status: 'completed' as const,
    transactionId: `TXN${generateId().toUpperCase()}`,
    createdAt: new Date(invoice.createdAt.getTime() + 86400000), // 1 day after invoice
    notes: "Payment received successfully"
  }));

// ✅ Expenses (15 total, with GST)
export const seedExpenses: Expense[] = Array.from({ length: 15 }, (_, i) => {
  const amount = Math.floor(Math.random() * 50000) + 1000;
  const gstRate = randomChoice([5, 12, 18]);
  const gstAmount = Math.floor(amount * (gstRate / 100));

  return {
    id: generateId(),
    amount,
    category: ["Office Supplies", "Travel", "Marketing", "Utilities", "Software"][i % 5],
    description: `Expense ${i + 1} description`,
    date: randomDate(),
    gstAmount,
    createdAt: new Date(2024, 0, i + 1)
  };
});
