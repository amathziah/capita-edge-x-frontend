import { BusinessType } from '../../contexts/PersonaContext';

// ─── Local Types ───────────────────────────────────────────────────────
export type Seller = {
    name: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
    upiId: string;
    panNumber?: string;
    bankDetails?: string;
    tagline?: string;
    frnNumber?: string;
};

export type Buyer = {
    name: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
};

export type InvoiceMeta = {
    number: string;
    date: string;
    dueDate: string;
};

export type CurrencyOption = {
    code: string;
    symbol: string;
    label: string;
};

// ─── Constants ─────────────────────────────────────────────────────────
export const CURRENCIES: CurrencyOption[] = [
    { code: 'INR', symbol: 'Rs.', label: 'Indian Rupee' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

export const TAX_LABELS = ['GST', 'VAT', 'Tax', 'Sales Tax'];

export const UNITS = ['Qty', 'Hours', 'Days', 'Service', 'Flat'];

// Indian States/UTs with GST codes
export const INDIAN_STATES = [
    '01 - Jammu & Kashmir', '02 - Himachal Pradesh', '03 - Punjab', '04 - Chandigarh',
    '05 - Uttarakhand', '06 - Haryana', '07 - Delhi', '08 - Rajasthan',
    '09 - Uttar Pradesh', '10 - Bihar', '11 - Sikkim', '12 - Arunachal Pradesh',
    '13 - Nagaland', '14 - Manipur', '15 - Mizoram', '16 - Tripura',
    '17 - Meghalaya', '18 - Assam', '19 - West Bengal', '20 - Jharkhand',
    '21 - Odisha', '22 - Chhattisgarh', '23 - Madhya Pradesh', '24 - Gujarat',
    '25 - Daman & Diu', '26 - Dadra & Nagar Haveli', '27 - Maharashtra',
    '28 - Andhra Pradesh (Old)', '29 - Karnataka', '30 - Goa',
    '31 - Lakshadweep', '32 - Kerala', '33 - Tamil Nadu', '34 - Puducherry',
    '35 - Andaman & Nicobar', '36 - Telangana', '37 - Andhra Pradesh', '38 - Ladakh'
];
