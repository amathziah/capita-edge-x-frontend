import { useState, useEffect, useRef } from 'react';
import { CURRENCIES, Seller, Buyer, InvoiceMeta } from '../constants';
import { getPersonaConfig } from '../personaConfigs';
import { Invoice, InvoiceItem, Product, Customer } from '../../../types';
import { dataService } from '../../../services/dataService';
import { ToastType } from '../../Toast';
import { BusinessType } from '../../../contexts/PersonaContext';
import { SellerErrors } from '../sections/SellerSection';
import { BuyerErrors } from '../sections/BuyerSection';
import { HeaderErrors } from '../sections/InvoiceHeader';

// ─── Props that this hook accepts ──────────────────────────────────────
export interface UseInvoiceStateProps {
    businessType: BusinessType;
    editingInvoice?: Invoice;
    initialData?: {
        invoice?: Partial<InvoiceMeta>;
        buyer?: Partial<Buyer>;
        items?: InvoiceItem[];
        voiceDraft?: string;
    };
}

// ─── Return type ───────────────────────────────────────────────────────
export interface InvoiceState {
    // Config
    config: ReturnType<typeof getPersonaConfig>;
    businessType: BusinessType;

    // Global Settings
    currency: typeof CURRENCIES[0];
    setCurrency: (c: typeof CURRENCIES[0]) => void;
    taxLabel: string;
    setTaxLabel: (v: string) => void;
    logo: string | null;
    setLogo: (v: string | null) => void;

    // Invoice Core Data
    seller: Seller;
    setSeller: (s: Seller) => void;
    buyer: Buyer;
    setBuyer: (b: Buyer) => void;
    notes: string;
    setNotes: (v: string) => void;
    meta: InvoiceMeta;
    setMeta: (m: InvoiceMeta) => void;

    // Persona-Specific State
    projectName: string;
    setProjectName: (v: string) => void;
    shippingAddress: string;
    setShippingAddress: (v: string) => void;
    orderNumber: string;
    setOrderNumber: (v: string) => void;
    isGstRegistered: boolean;
    setIsGstRegistered: (v: boolean) => void;
    isInterState: boolean;
    setIsInterState: (v: boolean) => void;
    authorizedSignatory: string;
    setAuthorizedSignatory: (v: string) => void;
    placeOfSupply: string;
    setPlaceOfSupply: (v: string) => void;
    reverseCharge: boolean;
    setReverseCharge: (v: boolean) => void;
    deliveryState: string;
    setDeliveryState: (v: string) => void;
    dispatchDate: string;
    setDispatchDate: (v: string) => void;
    courierTracking: string;
    setCourierTracking: (v: string) => void;
    // TDS
    tdsEnabled: boolean;
    setTdsEnabled: (v: boolean) => void;
    tdsRate: number;
    setTdsRate: (v: number) => void;
    // CA
    frn: string;
    setFrn: (v: string) => void;
    lutNumber: string;
    setLutNumber: (v: string) => void;
    // Ecommerce
    courierName: string;
    setCourierName: (v: string) => void;
    orderRef: string;
    setOrderRef: (v: string) => void;
    // GST
    gstType: string | null;
    setGstType: (v: string | null) => void;
    sellerState: string;
    setSellerState: (v: string) => void;
    discountAmount: number;
    setDiscountAmount: (v: number) => void;

    // Items & Totals
    items: InvoiceItem[];
    setItems: (items: InvoiceItem[]) => void;
    taxRate: number;
    setTaxRate: (v: number) => void;
    shipping: number;
    setShipping: (v: number) => void;
    subtotal: number;
    taxAmount: number;
    total: number;
    caIsInterState: boolean;
    ecomIsInterState: boolean;

    // UI State
    activeAction: 'saving' | 'downloading' | 'emailing' | 'printing' | 'uploading' | null;
    setActiveAction: (v: 'saving' | 'downloading' | 'emailing' | 'printing' | 'uploading' | null) => void;
    loading: boolean;
    isEmailModalOpen: boolean;
    setIsEmailModalOpen: (v: boolean) => void;
    emailTo: string;
    setEmailTo: (v: string) => void;
    toast: { message: string; type: ToastType } | null;
    setToast: (v: { message: string; type: ToastType } | null) => void;
    showToast: (message: string, type?: ToastType) => void;

    // Validation
    sellerErrors: SellerErrors;
    buyerErrors: BuyerErrors;
    headerErrors: HeaderErrors;
    itemErrors: Record<number, string>;
    validateForm: () => boolean;
    clearErrors: () => void;

    // Inventory + Customer
    products: Product[];
    focusedItemIndex: number | null;
    setFocusedItemIndex: (v: number | null) => void;
    customers: Customer[];
    isBuyerFocused: boolean;
    setIsBuyerFocused: (v: boolean) => void;

    // Refs
    bottomRef: React.RefObject<HTMLDivElement | null>;
}

// ═══════════════════════════════════════════════════════════════════════
//  useInvoiceState — All state, effects, computed values, and validation
// ═══════════════════════════════════════════════════════════════════════
export function useInvoiceState({ businessType, editingInvoice, initialData }: UseInvoiceStateProps): InvoiceState {
    const config = getPersonaConfig(businessType);

    // ─── Global Settings ───────────────────────────────────────────────
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [taxLabel, setTaxLabel] = useState('GST');
    const [logo, setLogo] = useState<string | null>(null);

    // ─── Invoice Data ──────────────────────────────────────────────────
    const [seller, setSeller] = useState<Seller>({ name: "", phone: "", email: "", address: "", taxId: "", upiId: "" });
    const [buyer, setBuyer] = useState<Buyer>({ name: "", phone: "", email: "", address: "", taxId: "" });
    const [notes, setNotes] = useState<string>("");
    const [meta, setMeta] = useState<InvoiceMeta>({
        number: `INV-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
    });

    // ─── Persona-Specific State ────────────────────────────────────────
    const [projectName, setProjectName] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [isGstRegistered, setIsGstRegistered] = useState(false);
    const [isInterState, setIsInterState] = useState(false);
    const [authorizedSignatory, setAuthorizedSignatory] = useState("");
    const [placeOfSupply, setPlaceOfSupply] = useState('27 - Maharashtra');
    const [reverseCharge, setReverseCharge] = useState(false);
    const [deliveryState, setDeliveryState] = useState('');
    const [dispatchDate, setDispatchDate] = useState('');
    const [courierTracking, setCourierTracking] = useState('');
    // TDS
    const [tdsEnabled, setTdsEnabled] = useState(false);
    const [tdsRate, setTdsRate] = useState(10);
    // CA
    const [frn, setFrn] = useState('');
    const [lutNumber, setLutNumber] = useState('');
    // Ecommerce
    const [courierName, setCourierName] = useState('');
    const [orderRef, setOrderRef] = useState('');
    // GST
    const [gstType, setGstType] = useState<string | null>(null);
    const [sellerState, setSellerState] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);

    // ─── Computed Inter-State ──────────────────────────────────────────
    const caIsInterState = config.interStateMode === 'auto-place-of-supply' && placeOfSupply && seller.taxId
        ? placeOfSupply.substring(0, 2) !== (seller.taxId.substring(0, 2) || '')
        : false;

    const ecomIsInterState = config.interStateMode === 'auto-delivery-state' && deliveryState && seller.taxId
        ? deliveryState.substring(0, 2) !== (seller.taxId.substring(0, 2) || '')
        : false;

    // ─── Items & Totals ────────────────────────────────────────────────
    const [items, setItems] = useState<InvoiceItem[]>([
        { description: "", quantity: 1, unit: config.defaultUnit, price: 0, discount: 0 },
    ]);
    const [taxRate, setTaxRate] = useState<number>(config.defaultTaxRate);
    const [shipping, setShipping] = useState<number>(0);

    const subtotal = items.reduce((acc, i) => {
        const lineTotal = i.quantity * i.price;
        const discountAmt = (lineTotal * (i.discount || 0)) / 100;
        return acc + (lineTotal - discountAmt);
    }, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount + shipping;

    // ─── UI State ──────────────────────────────────────────────────────
    const [activeAction, setActiveAction] = useState<'saving' | 'downloading' | 'emailing' | 'printing' | 'uploading' | null>(null);
    const loading = activeAction !== null;
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTo, setEmailTo] = useState("");
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    // ─── Validation Errors ─────────────────────────────────────────────
    const [sellerErrors, setSellerErrors] = useState<SellerErrors>({});
    const [buyerErrors, setBuyerErrors] = useState<BuyerErrors>({});
    const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});
    const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

    // Inventory + Customer
    const [products, setProducts] = useState<Product[]>([]);
    const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isBuyerFocused, setIsBuyerFocused] = useState(false);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    // ─── Effects ───────────────────────────────────────────────────────
    useEffect(() => {
        if (editingInvoice) {
            setMeta({
                number: editingInvoice.invoiceNumber,
                date: editingInvoice.date || new Date().toISOString().split("T")[0],
                dueDate: editingInvoice.dueDate || new Date().toISOString().split("T")[0],
            });
            setSeller(editingInvoice.seller || { name: "", phone: "", email: "", address: "", taxId: "", upiId: "" });
            setBuyer(editingInvoice.buyer || { name: "", phone: "", email: "", address: "", taxId: "" });
            if (editingInvoice.notes) setNotes(editingInvoice.notes);
            setItems(editingInvoice.items?.length ? (editingInvoice.items as InvoiceItem[]).map((i: InvoiceItem) => ({ ...i, unit: i.unit || 'Qty' })) : [{ description: "", quantity: 1, unit: config.defaultUnit, price: 0, discount: 0 }]);
            setTaxRate(editingInvoice.taxRate || 18);
            setShipping(editingInvoice.shipping || 0);
            setTaxLabel(editingInvoice.taxType || 'GST');
            if (editingInvoice.projectName) setProjectName(editingInvoice.projectName);
            if (editingInvoice.shippingAddress) setShippingAddress(editingInvoice.shippingAddress);
            if (editingInvoice.orderNumber) setOrderNumber(editingInvoice.orderNumber);
            // New field hydration
            if (editingInvoice.gstType) setGstType(editingInvoice.gstType);
            if (editingInvoice.frn) setFrn(editingInvoice.frn);
            if (editingInvoice.lutNumber) setLutNumber(editingInvoice.lutNumber);
            if (editingInvoice.tdsApplicable) setTdsEnabled(editingInvoice.tdsApplicable);
            if (editingInvoice.tdsRate) setTdsRate(editingInvoice.tdsRate);
            if (editingInvoice.courierName) setCourierName(editingInvoice.courierName);
            if (editingInvoice.orderRef) setOrderRef(editingInvoice.orderRef);
            if (editingInvoice.reverseCharge) setReverseCharge(editingInvoice.reverseCharge);
            if (editingInvoice.placeOfSupply) setPlaceOfSupply(editingInvoice.placeOfSupply);
            if (editingInvoice.isGstRegistered !== undefined) setIsGstRegistered(editingInvoice.isGstRegistered !== false);
            if (editingInvoice.discountAmount) setDiscountAmount(editingInvoice.discountAmount);
            if (editingInvoice.dispatchDate) setDispatchDate(editingInvoice.dispatchDate);
            if (editingInvoice.courierTracking) setCourierTracking(editingInvoice.courierTracking);
        } else {
            dataService.generateInvoiceNumber().then(num => {
                setMeta(prev => ({ ...prev, number: num }));
            }).catch(err => console.error("Failed to fetch next invoice number", err));
        }

        dataService.getSettings().then(settings => {
            if (settings.logoFilename) setLogo(dataService.getLogoUrl(settings.logoFilename));
            if (!editingInvoice) {
                setSeller({
                    name: settings.businessName || "",
                    phone: settings.phone || "",
                    email: settings.email || "",
                    address: settings.address || "",
                    taxId: settings.companyTaxId || "",
                    upiId: settings.upiId || ""
                });
            }
        }).catch(e => console.error("Failed to load settings", e));

        dataService.getProducts().then(setProducts).catch(err => console.error("Failed to fetch products", err));
        dataService.getCustomers().then(setCustomers).catch(err => console.error("Failed to fetch customers", err));
    }, [editingInvoice]);

    useEffect(() => {
        if (initialData) {
            if (initialData.buyer) setBuyer(prev => ({ ...prev, ...initialData.buyer }));
            if (initialData.items && initialData.items.length > 0) {
                setItems(initialData.items.map(i => ({ ...i, unit: i.unit || 'Qty' })));
            }
        }
    }, [initialData]);

    // useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [items]);

    // ─── Validation ────────────────────────────────────────────────────
    const validateForm = (): boolean => {
        const sErr: SellerErrors = {};
        const bErr: BuyerErrors = {};
        const hErr: HeaderErrors = {};
        const iErr: Record<number, string> = {};
        let errorCount = 0;

        // Seller
        if (!seller.name.trim()) { sErr.name = 'Business name is required'; errorCount++; }
        if (config.taxIdRequired && !seller.taxId.trim()) {
            sErr.taxId = `${taxLabel} ID is required for ${businessType === 'ca' ? 'CA' : 'services_firm'} invoices`;
            errorCount++;
        }

        // Buyer
        if (!buyer.name.trim()) { bErr.name = 'Client name is required'; errorCount++; }

        // Meta
        if (!meta.date) { hErr.date = 'Invoice date is required'; errorCount++; }

        // Items
        items.forEach((item, idx) => {
            if (!item.description.trim()) { iErr[idx] = 'Description is required'; errorCount++; }
            else if (item.price <= 0) { iErr[idx] = 'Price must be greater than 0'; errorCount++; }
            else if (item.quantity <= 0) { iErr[idx] = 'Quantity must be at least 1'; errorCount++; }
        });

        setSellerErrors(sErr);
        setBuyerErrors(bErr);
        setHeaderErrors(hErr);
        setItemErrors(iErr);

        if (errorCount > 0) {
            showToast(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting.`, 'error');
            return false;
        }
        return true;
    };

    const clearErrors = () => {
        if (Object.keys(sellerErrors).length || Object.keys(buyerErrors).length || Object.keys(headerErrors).length || Object.keys(itemErrors).length) {
            setSellerErrors({});
            setBuyerErrors({});
            setHeaderErrors({});
            setItemErrors({});
        }
    };

    // ─── Return ────────────────────────────────────────────────────────
    return {
        config,
        currency, setCurrency,
        taxLabel, setTaxLabel,
        logo, setLogo,
        seller, setSeller,
        buyer, setBuyer,
        notes, setNotes,
        meta, setMeta,
        projectName, setProjectName,
        shippingAddress, setShippingAddress,
        orderNumber, setOrderNumber,
        isGstRegistered, setIsGstRegistered,
        isInterState, setIsInterState,
        authorizedSignatory, setAuthorizedSignatory,
        placeOfSupply, setPlaceOfSupply,
        reverseCharge, setReverseCharge,
        deliveryState, setDeliveryState,
        dispatchDate, setDispatchDate,
        courierTracking, setCourierTracking,
        tdsEnabled, setTdsEnabled,
        tdsRate, setTdsRate,
        frn, setFrn,
        lutNumber, setLutNumber,
        courierName, setCourierName,
        orderRef, setOrderRef,
        gstType, setGstType,
        sellerState, setSellerState,
        discountAmount, setDiscountAmount,
        businessType,
        items, setItems,
        taxRate, setTaxRate,
        shipping, setShipping,
        subtotal, taxAmount, total,
        caIsInterState, ecomIsInterState,
        activeAction, setActiveAction,
        loading,
        isEmailModalOpen, setIsEmailModalOpen,
        emailTo, setEmailTo,
        toast, setToast,
        showToast,
        sellerErrors, buyerErrors, headerErrors, itemErrors,
        validateForm, clearErrors,
        products,
        focusedItemIndex, setFocusedItemIndex,
        customers,
        isBuyerFocused, setIsBuyerFocused,
        bottomRef,
    };
}
