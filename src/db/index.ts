import Dexie, { Table } from 'dexie';
import { Invoice, Customer, Product } from '../types';

export class AntigravityDB extends Dexie {
    invoices!: Table<Invoice>;
    customers!: Table<Customer>;
    products!: Table<Product>;

    constructor() {
        super('AntigravityDB');
        this.version(1).stores({
            invoices: 'id, invoiceNumber, customerId, date, status, createdAt', // Indexed fields
            customers: 'id, name, email',
            products: 'id, name, category'
        });
    }
}

export const db = new AntigravityDB();

// Helper to save invoice (Create or Update)
export async function saveInvoice(invoice: Invoice): Promise<string> {
    await db.invoices.put(invoice);
    return invoice.id;
}
