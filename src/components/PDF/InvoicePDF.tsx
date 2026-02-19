import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice } from '../../types';

// Register a font (optional, using default Helvetica for now)
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.ttf' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        color: '#1F2937', // Gray-800
        paddingBottom: 40,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        backgroundColor: '#F3F4F6', // Light Gray-100
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
        color: '#111827', // Gray-900
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    companyText: {
        fontSize: 9,
        color: '#6B7280', // Gray-500
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
        backgroundColor: '#10B981', // Emerald-500
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
        color: '#9CA3AF', // Gray-400
        width: 80,
        textAlign: 'right',
        marginRight: 10,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    metaValue: {
        fontSize: 9,
        color: '#374151', // Gray-700
        fontWeight: 'bold',
        width: 80,
        textAlign: 'right',
    },
    billToContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        marginBottom: 40,
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
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    colDesc: { width: '50%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '20%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },
    headerText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    rowText: {
        fontSize: 9,
        color: '#374151',
    },
    rowTextBold: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
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
        borderTopColor: '#1F2937', // Gray-800
    },
    totalLabelLarge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
    },
    totalValueLarge: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
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

interface InvoicePDFProps {
    invoice: Invoice;
    settings: any;
    logoUrl?: string | null;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, settings, logoUrl }) => {
    const currency = settings.currencySymbol || '₹';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Decorative Header Background */}
                <View style={styles.headerBackground} />

                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        {logoUrl ? (
                            <Image src={logoUrl} style={styles.logo} />
                        ) : (
                            // Placeholder if no logo
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

                {/* Meta Information (Title & Dates) */}
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
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Date Issued</Text>
                            <Text style={styles.metaValue}>{new Date(invoice.date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Due Date</Text>
                            <Text style={styles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Bill To */}
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
                </View>

                {/* Items Table */}
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <View style={styles.colDesc}><Text style={styles.headerText}>Description</Text></View>
                        <View style={styles.colQty}><Text style={styles.headerText}>Qty</Text></View>
                        <View style={styles.colPrice}><Text style={styles.headerText}>Price</Text></View>
                        <View style={styles.colTotal}><Text style={styles.headerText}>Amount</Text></View>
                    </View>
                    {invoice.items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.colDesc}><Text style={styles.rowText}>{item.description}</Text></View>
                            <View style={styles.colQty}><Text style={styles.rowText}>{item.quantity}</Text></View>
                            <View style={styles.colPrice}><Text style={styles.rowText}>{currency}{Number(item.price).toFixed(2)}</Text></View>
                            <View style={styles.colTotal}><Text style={styles.rowTextBold}>{currency}{(item.quantity * item.price).toFixed(2)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Summary & Totals */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBlock}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>{currency}{Number(invoice.subtotal).toFixed(2)}</Text>
                        </View>
                        {Boolean(invoice.taxAmount && invoice.taxAmount > 0) && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{invoice.taxType} ({invoice.taxRate}%)</Text>
                                <Text style={styles.summaryValue}>{currency}{Number(invoice.taxAmount).toFixed(2)}</Text>
                            </View>
                        )}
                        {Boolean((invoice.shipping || 0) > 0) && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping</Text>
                                <Text style={styles.summaryValue}>{currency}{Number(invoice.shipping || 0).toFixed(2)}</Text>
                            </View>
                        )}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabelLarge}>Total</Text>
                            <Text style={styles.totalValueLarge}>{currency}{Number(invoice.total).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer / Notes */}
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
