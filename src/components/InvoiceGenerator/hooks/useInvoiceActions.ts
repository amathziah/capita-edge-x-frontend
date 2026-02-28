import React from 'react';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '../../PDF/InvoicePDF';
import { dataService } from '../../../services/dataService';
import { InvoiceState } from './useInvoiceState';

// ═══════════════════════════════════════════════════════════════════════
//  useInvoiceActions — All action handlers for the InvoiceGenerator
// ═══════════════════════════════════════════════════════════════════════
export function useInvoiceActions(state: InvoiceState, onClose?: () => void) {

    const {
        seller, buyer, meta, items, notes,
        subtotal, taxAmount, taxLabel, taxRate, shipping, total,
        projectName, shippingAddress, orderNumber,
        logo, setLogo,
        setActiveAction,
        setIsEmailModalOpen, emailTo, setEmailTo,
        showToast, validateForm,
    } = state;

    // ─── Build Invoice Data ────────────────────────────────────────────
    const buildInvoiceData = () => ({
        id: undefined as string | undefined,
        invoiceNumber: meta.number,
        date: meta.date,
        dueDate: meta.dueDate,
        seller, buyer, items,
        subtotal, taxAmount,
        taxType: taxLabel,
        taxRate, discount: 0, shipping, total,
        status: 'draft' as const,
        notes: notes || '',
        projectName, shippingAddress, orderNumber,
    });

    // ─── Logo Upload ───────────────────────────────────────────────────
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setActiveAction('uploading');
            try {
                const result = await dataService.uploadLogo(file);
                setLogo(result.url);
            } catch (error) {
                console.error("Logo upload failed", error);
                const reader = new FileReader();
                reader.onloadend = () => setLogo(reader.result as string);
                reader.readAsDataURL(file);
            } finally {
                setActiveAction(null);
            }
        }
    };

    // ─── Save & Download ───────────────────────────────────────────────
    const handleSaveAndDownload = async () => {
        if (!validateForm()) return;
        setActiveAction('downloading');
        try {
            const invoiceData = buildInvoiceData();
            await dataService.saveInvoice(invoiceData as unknown as Parameters<typeof dataService.saveInvoice>[0]);
            const latestSettings = await dataService.getSettings();
            const blob = await pdf(
                React.createElement(InvoicePDF, {
                    invoice: invoiceData as unknown as Parameters<typeof dataService.saveInvoice>[0],
                    settings: latestSettings,
                    logoUrl: logo,
                })
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${meta.number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Invoice saved & PDF downloaded!", 'success');
            setTimeout(() => { if (onClose) onClose(); }, 1500);
        } catch (error) {
            console.error("Failed to save/download", error);
            showToast("Failed to generate PDF", 'error');
            setActiveAction(null);
        }
    };

    // ─── Save Only ─────────────────────────────────────────────────────
    const handleSaveOnly = async () => {
        if (!validateForm()) return;
        setActiveAction('saving');
        try {
            await dataService.saveInvoice(buildInvoiceData() as unknown as Parameters<typeof dataService.saveInvoice>[0]);
            showToast("Invoice saved successfully!", 'success');
            setTimeout(() => { if (onClose) onClose(); }, 1000);
        } catch (error) {
            console.error("Failed to save", error);
            showToast("Failed to save invoice", 'error');
            setActiveAction(null);
        }
    };

    // ─── Print ─────────────────────────────────────────────────────────
    const handlePrint = async () => {
        setActiveAction('printing');
        setTimeout(() => { window.print(); setActiveAction(null); }, 800);
    };

    // ─── Email ─────────────────────────────────────────────────────────
    const handleEmailClick = () => {
        setEmailTo(buyer.email || "");
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!emailTo) return;
        if (!validateForm()) return;
        setActiveAction('emailing');
        try {
            const invoiceData = buildInvoiceData();
            const { id } = await dataService.saveInvoice(invoiceData as unknown as Parameters<typeof dataService.saveInvoice>[0]);
            const latestSettings = await dataService.getSettings();
            const blob = await pdf(
                React.createElement(InvoicePDF, {
                    invoice: invoiceData as unknown as Parameters<typeof dataService.saveInvoice>[0],
                    settings: latestSettings,
                    logoUrl: logo,
                })
            ).toBlob();
            if (!latestSettings.smtp_user || !latestSettings.smtp_pass) {
                showToast("Email service not configured. Please go to Settings to connect your Gmail.", 'error');
                setActiveAction(null);
                return;
            }
            await dataService.sendInvoiceEmail(id, emailTo, blob);
            showToast("Invoice sent successfully!", 'success');
            setIsEmailModalOpen(false);
            setEmailTo('');
        } catch (error) {
            console.error("Failed to send email", error);
            showToast("Failed to send email", 'error');
        } finally {
            setActiveAction(null);
        }
    };

    return {
        handleLogoUpload,
        handleSaveAndDownload,
        handleSaveOnly,
        handlePrint,
        handleEmailClick,
        handleSendEmail,
    };
}
