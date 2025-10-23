import React, { useState } from 'react';
import { parseExcelFile } from '../utils/excelParser';

const DebugExcel: React.FC = () => {
    const [debugInfo, setDebugInfo] = useState<string>('Click to test Excel loading...');
    const [loading, setLoading] = useState(false);

    const testExcelLoad = async () => {
        setLoading(true);
        setDebugInfo('Testing Excel file loading...');

        try {
            console.log('Starting Excel test...');
            const result = await parseExcelFile('/data/data.xlsx');
            setDebugInfo(`✅ Excel loaded successfully! Variables: ${result.variables.join(', ')}`);
            console.log('Excel test successful:', result);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setDebugInfo(`❌ Error: ${errorMsg}`);
            console.error('Excel test failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white border rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Excel Loading Debug</h3>
            <button
                onClick={testExcelLoad}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {loading ? 'Testing...' : 'Test Excel Loading'}
            </button>
            <div className="mt-4 p-3 bg-gray-100 rounded">
                <pre className="text-sm">{debugInfo}</pre>
            </div>
            <div className="mt-4 text-sm text-gray-600">
                <p>Check browser console for detailed logs.</p>
                <p>File should be at: <code>/data/data.xlsx</code></p>
            </div>
        </div>
    );
};

export default DebugExcel;
