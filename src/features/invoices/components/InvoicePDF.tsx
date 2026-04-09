import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice } from '@/types';

// Register a font (optional, using default Helvetica for now)
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.ttf' });

const getPersonaColors = (type?: string) => {
    switch (type) {
        case 'subscription':
            return { primary: '#6366F1', secondary: '#EEF2FF', accent: '#4F46E5' }; // Indigo/Violet
        case 'services_firm':
            return { primary: '#0D9488', secondary: '#F0FDFA', accent: '#0F766E' }; // Teal
        case 'ecommerce':
            return { primary: '#F59E0B', secondary: '#FFFBEB', accent: '#D97706' }; // Amber/Orange
        case 'solopreneur':
        default:
            return { primary: '#10B981', secondary: '#ECFDF5', accent: '#059669' }; // Emerald
    }
};

const createStyles = (type?: string) => {
    const colors = getPersonaColors(type);

    return StyleSheet.create({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            fontFamily: 'Helvetica',
            color: '#1F2937',
            paddingBottom: 40,
        },
        headerBackground: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            backgroundColor: colors.secondary,
            zIndex: -1,
        },
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 40,
            marginBottom: 20,
        },
        logoContainer: {
            width: 80,
            height: 80,
        },
        logo: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: 4,
        },
        companyColumn: {
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
        },
        companyName: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        companyText: {
            fontSize: 9,
            color: '#6B7280',
            marginBottom: 2,
        },
        metaContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 40,
            marginBottom: 30,
        },
        invoiceTitleBlock: {
            flexDirection: 'column',
        },
        invoiceTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#111827',
            letterSpacing: -0.5,
            marginBottom: 5,
        },
        statusBadge: {
            fontSize: 10,
            color: '#fff',
            backgroundColor: colors.primary,
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 12,
            alignSelf: 'flex-start',
            textTransform: 'uppercase',
            fontWeight: 'bold',
        },
        metaDetails: {
            flexDirection: 'column',
            alignItems: 'flex-end',
        },
        metaRow: {
            flexDirection: 'row',
            marginBottom: 4,
        },
        metaLabel: {
            fontSize: 9,
            color: '#9CA3AF',
            width: 80,
            textAlign: 'right',
            marginRight: 10,
            textTransform: 'uppercase',
            fontWeight: 'bold',
        },
        metaValue: {
            fontSize: 9,
            color: '#374151',
            fontWeight: 'bold',
            width: 100,
            textAlign: 'right',
        },
        billToContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 40,
            marginBottom: 30,
        },
        billToSection: {
            flexDirection: 'column',
            width: '45%',
        },
        sectionLabel: {
            fontSize: 8,
            color: '#9CA3AF',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            marginBottom: 8,
            letterSpacing: 1,
        },
        clientName: {
            fontSize: 12,
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: 4,
        },
        clientText: {
            fontSize: 9,
            color: '#4B5563',
            marginBottom: 2,
            lineHeight: 1.4,
        },
        shippingSection: {
            flexDirection: 'column',
            width: '45%',
            alignItems: 'flex-end',
        },
        tableContainer: {
            flexDirection: 'column',
            marginHorizontal: 40,
            marginBottom: 30,
        },
        tableHeader: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            paddingBottom: 8,
            marginBottom: 8,
            backgroundColor: colors.secondary,
            paddingHorizontal: 8,
            borderRadius: 4,
            marginTop: 10,
        },
        tableRow: {
            flexDirection: 'row',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            paddingHorizontal: 8,
        },
        colDesc: { width: '40%' },
        colPeriod: { width: '20%' }, // For SaaS/Agency
        colQty: { width: '10%', textAlign: 'center' },
        colPrice: { width: '15%', textAlign: 'right' },
        colTotal: { width: '15%', textAlign: 'right' },
        headerText: {
            fontSize: 8,
            fontWeight: 'bold',
            color: colors.accent,
            textTransform: 'uppercase',
        },
        rowText: {
            fontSize: 9,
            color: '#374151',
        },
        rowTextSmall: {
            fontSize: 7,
            color: '#6B7280',
            marginTop: 2,
        },
        rowTextBold: {
            fontSize: 9,
            fontWeight: 'bold',
            color: '#111827',
        },
        itemCodeText: {
            fontSize: 7,
            color: '#9CA3AF',
            marginTop: 1,
        },
        summaryContainer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginHorizontal: 40,
            marginBottom: 40,
        },
        summaryBlock: {
            width: '40%',
            flexDirection: 'column',
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
        },
        summaryLabel: {
            fontSize: 9,
            color: '#6B7280',
        },
        summaryValue: {
            fontSize: 9,
            fontWeight: 'bold',
            color: '#111827',
        },
        totalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 2,
            borderTopColor: colors.primary,
        },
        totalLabelLarge: {
            fontSize: 12,
            fontWeight: 'bold',
            color: colors.primary,
        },
        totalValueLarge: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.primary,
        },
        footerContainer: {
            position: 'absolute',
            bottom: 40,
            left: 40,
            right: 40,
        },
        notesContainer: {
            backgroundColor: '#F9FAFB',
            padding: 15,
            borderRadius: 6,
            marginBottom: 20,
        },
        notesLabel: {
            fontSize: 9,
            fontWeight: 'bold',
            color: '#4B5563',
            marginBottom: 4,
        },
        notesText: {
            fontSize: 9,
            color: '#6B7280',
        },
        footerText: {
            fontSize: 8,
            color: '#9CA3AF',
            textAlign: 'center',
            marginTop: 20,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingTop: 20,
        },
    });
};

interface InvoicePDFProps {
    invoice: Invoice;
    settings: any;
    logoUrl?: string | null;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, settings, logoUrl }) => {
    const currency = settings.currencySymbol || 'Rs.';
    const businessType = settings.businessType || 'solopreneur';
    const styles = createStyles(businessType);

    const isSaaS = businessType === 'subscription';
    const isAgency = businessType === 'services_firm';
    const isEcommerce = businessType === 'ecommerce';

    // Inline helper for summary rows
    const SummaryRow = ({ label, value, isDeduction, isHighlight, isBold, isText }: {
        label: string; value: any; isDeduction?: boolean;
        isHighlight?: boolean; isBold?: boolean; isText?: boolean;
    }) => (
        <View style={isBold ? styles.totalRow : styles.summaryRow}>
            <Text style={isBold ? styles.totalLabelLarge : styles.summaryLabel}>{label}</Text>
            {isText ? (
                <Text style={styles.summaryValue}>{value}</Text>
            ) : (
                <Text style={[
                    isBold ? styles.totalValueLarge : styles.summaryValue,
                    isDeduction ? { color: '#EF4444' } : {},
                    isHighlight ? { color: '#10B981' } : {},
                ]}>
                    {currency}{typeof value === 'number' ? Math.abs(value).toFixed(2) : value}
                </Text>
            )}
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerBackground} />

                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        {Boolean(logoUrl) ? (
                            <Image src={logoUrl!} style={styles.logo} />
                        ) : (
                            <View style={{ ...styles.logo, backgroundColor: '#E5E7EB' }} />
                        )}
                    </View>
                    <View style={styles.companyColumn}>
                        <Text style={styles.companyName}>{settings.businessName || 'Your Business'}</Text>
                        <Text style={styles.companyText}>{settings.email}</Text>
                        <Text style={styles.companyText}>{settings.phone}</Text>
                        {(settings.address || '').split('\n').map((line: string, i: number) => (
                            <Text key={i} style={styles.companyText}>{line}</Text>
                        ))}
                    </View>
                </View>

                <View style={styles.metaContainer}>
                    <View style={styles.invoiceTitleBlock}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        {!!invoice.status && (
                            <View style={styles.statusBadge}>
                                <Text style={{ color: '#fff', fontSize: 8 }}>{invoice.status}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.metaDetails}>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Invoice #</Text>
                            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
                        </View>
                        {invoice.projectName && (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Project</Text>
                                <Text style={styles.metaValue}>{invoice.projectName}</Text>
                            </View>
                        )}
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Date Issued</Text>
                            <Text style={styles.metaValue}>{new Date(invoice.date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Due Date</Text>
                            <Text style={styles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
                        </View>
                        {invoice.placeOfSupply && (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Place of Supply</Text>
                                <Text style={styles.metaValue}>{invoice.placeOfSupply}</Text>
                            </View>
                        )}
                        {invoice.reverseCharge && (
                            <View style={styles.metaRow}>
                                <Text style={[styles.metaLabel, { color: '#F59E0B' }]}>Reverse Charge</Text>
                                <Text style={[styles.metaValue, { color: '#F59E0B' }]}>Yes</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.billToContainer}>
                    <View style={styles.billToSection}>
                        <Text style={styles.sectionLabel}>Bill To</Text>
                        <Text style={styles.clientName}>{invoice.buyer?.name || 'Valued Customer'}</Text>
                        <Text style={styles.clientText}>{invoice.buyer?.email}</Text>
                        <Text style={styles.clientText}>{invoice.buyer?.phone}</Text>
                        {(invoice.buyer?.address || '').split('\n').map((line: string, i: number) => (
                            <Text key={i} style={styles.clientText}>{line}</Text>
                        ))}
                    </View>

                    {isEcommerce && invoice.shippingAddress && (
                        <View style={styles.shippingSection}>
                            <Text style={styles.sectionLabel}>Ship To</Text>
                            <Text style={styles.clientText}>{invoice.shippingAddress}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <View style={styles.colDesc}><Text style={styles.headerText}>Description</Text></View>
                        {(isSaaS || isAgency) && (
                            <View style={styles.colPeriod}><Text style={styles.headerText}>Period</Text></View>
                        )}
                        <View style={styles.colQty}><Text style={styles.headerText}>Qty</Text></View>
                        <View style={styles.colPrice}><Text style={styles.headerText}>Price</Text></View>
                        <View style={styles.colTotal}><Text style={styles.headerText}>Amount</Text></View>
                    </View>
                    {invoice.items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.colDesc}>
                                <Text style={styles.rowText}>{item.description}</Text>
                                {isEcommerce && item.sku && (
                                    <Text style={styles.rowTextSmall}>SKU: {item.sku}</Text>
                                )}
                                {(item.hsnCode || item.sacCode) && (
                                    <Text style={styles.itemCodeText}>
                                        {item.hsnCode ? `HSN: ${item.hsnCode}` : `SAC: ${item.sacCode}`}
                                    </Text>
                                )}
                            </View>
                            {(isSaaS || isAgency) && (
                                <View style={styles.colPeriod}>
                                    <Text style={styles.rowTextSmall}>
                                        {item.serviceStartDate ? `${new Date(item.serviceStartDate).toLocaleDateString()} - ${item.serviceEndDate ? new Date(item.serviceEndDate).toLocaleDateString() : ''}` : '-'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.colQty}><Text style={styles.rowText}>{item.quantity}</Text></View>
                            <View style={styles.colPrice}><Text style={styles.rowText}>{currency}{Number(item.price).toFixed(2)}</Text></View>
                            <View style={styles.colTotal}><Text style={styles.rowTextBold}>{currency}{(item.quantity * item.price).toFixed(2)}</Text></View>
                        </View>
                    ))}
                </View>

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBlock}>
                        {/* Subtotal */}
                        <SummaryRow label="Subtotal" value={Number(invoice.subtotal)} />

                        {/* GST split — show if GST registered */}
                        {invoice.isGstRegistered !== false && invoice.gstType !== 'not_applicable' && (
                            <>
                                {invoice.gstType === 'igst' || (invoice.igstAmount && invoice.igstAmount > 0) ? (
                                    <SummaryRow label={`IGST @ ${invoice.taxRate || 0}%`} value={invoice.igstAmount || Number(invoice.taxAmount)} />
                                ) : (
                                    <>
                                        <SummaryRow label={`CGST @ ${(invoice.taxRate || 0) / 2}%`} value={invoice.cgstAmount || Number(invoice.taxAmount) / 2} />
                                        <SummaryRow label={`SGST @ ${(invoice.taxRate || 0) / 2}%`} value={invoice.sgstAmount || Number(invoice.taxAmount) / 2} />
                                    </>
                                )}
                            </>
                        )}

                        {/* Not applicable badge */}
                        {invoice.isGstRegistered === false && (
                            <SummaryRow label="GST" value="Not Applicable" isText />
                        )}

                        {/* Shipping */}
                        {Boolean((invoice.shipping || 0) > 0) && (
                            <SummaryRow label="Shipping" value={Number(invoice.shipping || 0)} />
                        )}

                        {/* TDS */}
                        {invoice.tdsApplicable && invoice.tdsAmount && invoice.tdsAmount > 0 && (
                            <>
                                <SummaryRow label={`TDS @${invoice.tdsRate || 10}% (Sec. 194J)`} value={-(invoice.tdsAmount)} isDeduction />
                                <SummaryRow label="Net Receivable" value={invoice.netReceivable || Number(invoice.subtotal) - invoice.tdsAmount} isHighlight />
                            </>
                        )}

                        {/* Total */}
                        <SummaryRow label="Total" value={Number(invoice.total)} isBold />
                    </View>
                </View>

                <View style={styles.footerContainer}>
                    {Boolean(settings.paymentInstructions || settings.invoiceNotes) && (
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesLabel}>Notes & Payment Instructions</Text>
                            <Text style={styles.notesText}>{settings.paymentInstructions}</Text>
                            <Text style={{ ...styles.notesText, marginTop: 4 }}>{settings.invoiceNotes}</Text>
                        </View>
                    )}

                    <Text style={styles.footerText}>
                        {settings.footerText || "Thank you for your business!"}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePDF;
