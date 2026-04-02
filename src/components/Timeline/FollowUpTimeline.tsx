import React from 'react';
import { Invoice } from '../../types';
import {
    CheckCircle2,
    Clock,
    Send,
    Eye,
    AlertTriangle,
    FileText
} from 'lucide-react';

interface FollowUpTimelineProps {
    invoice: Invoice;
    onAction: (action: string) => void;
}

export const FollowUpTimeline: React.FC<FollowUpTimelineProps> = ({ invoice, onAction }) => {
    // Mock events based on invoice data
    // In a real app, this would come from an events table
    const events = [
        {
            id: '1',
            type: 'created',
            title: 'Invoice Created',
            date: invoice.date,
            icon: FileText,
            color: 'text-gray-500',
            bg: 'bg-gray-100',
        },
        // Mocking a "Sent" event if status is not draft
        ...(invoice.status !== 'draft' ? [{
            id: '2',
            type: 'sent',
            title: 'Sent via WhatsApp',
            date: invoice.date, // detailed timestamp in real app
            icon: Send,
            color: 'text-blue-500',
            bg: 'bg-blue-100',
        }] : []),
        // Mocking a "Viewed" event
        ...(invoice.status === 'viewed' || invoice.status === 'paid' || invoice.status === 'overdue' ? [{
            id: '3',
            type: 'viewed',
            title: 'Viewed by Customer',
            date: invoice.date, // + 2 hours
            icon: Eye,
            color: 'text-indigo-500',
            bg: 'bg-indigo-100',
        }] : []),
        // Mocking "Overdue" event
        ...(invoice.status === 'overdue' ? [{
            id: '4',
            type: 'overdue',
            title: 'Payment Overdue',
            date: invoice.dueDate,
            icon: AlertTriangle,
            color: 'text-red-500',
            bg: 'bg-red-100',
        }] : []),
        // Mocking "Paid" event
        ...(invoice.status === 'paid' ? [{
            id: '5',
            type: 'paid',
            title: 'Payment Received',
            date: new Date().toISOString(), // Mock
            icon: CheckCircle2,
            color: 'text-green-500',
            bg: 'bg-green-100',
        }] : [])
    ];

    return (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Activity Timeline</h3>
            <div className="space-y-6 relative ml-2">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100" />

                {events.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-4">
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${event.bg} ${event.color}`}>
                            <event.icon size={18} />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                                {new Date(event.date || new Date()).toLocaleDateString()} • {new Date(event.date || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {invoice.status === 'overdue' && (
                    <div className="relative flex items-start gap-4 animate-pulse">
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-violet-100 text-violet-600`}>
                            <Clock size={18} />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="font-bold text-violet-700 text-sm">Action Required: Send Reminder</h4>
                            <button
                                onClick={() => onAction('reminder')}
                                className="mt-2 text-xs bg-violet-600 text-white px-3 py-1.5 rounded-md hover:bg-violet-700 transition"
                            >
                                Send WhatsApp Reminder
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
