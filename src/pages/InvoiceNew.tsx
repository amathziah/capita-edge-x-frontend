import React from 'react';
import { InvoiceEditor } from '../components/Invoice/InvoiceEditor';

export const InvoiceNew = () => {
    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* 
               The Layout component in App.tsx already provides the Sidebar and Header wrapper.
               So we just need to render the content here.
            */}
            <InvoiceEditor />
        </div>
    );
};
