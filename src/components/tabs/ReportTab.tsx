import React from 'react';
import { FileText } from 'lucide-react';
import { FilterState } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReportTabProps {
    filters: FilterState;
    reportContent: string | null;
}

const ReportTab: React.FC<ReportTabProps> = ({ filters, reportContent }) => {
    const currentYear = filters.selectedYear;

    if (!reportContent) {
        return (
            <div className="card text-center py-12">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-700 mb-2">No Report Generated</h2>
                <p className="text-slate-500">Generate a business report from the Recap tab to view it here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FileText size={28} className="text-blue-600" />
                        Business Report - {currentYear}
                    </h1>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                    Comprehensive Marketing Mix Modeling analysis for {currentYear}
                </p>
            </div>

            {/* Report Content with ReactMarkdown */}
            <div className="card bg-white">
                <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-900 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-code:text-blue-600 prose-blockquote:text-slate-600 prose-table:text-sm prose-th:text-slate-800 prose-td:text-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default ReportTab;
