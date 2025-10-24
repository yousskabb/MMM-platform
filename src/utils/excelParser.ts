import * as XLSX from 'xlsx';

export interface WeeklyData {
    date: Date;
    [variable: string]: number | Date;
}

export interface ParsedExcelData {
    investments: WeeklyData[];
    contributions: WeeklyData[];
    variables: string[];
    dateRange: { min: Date; max: Date };
}

export interface ExcelSheetData {
    [key: string]: any;
}

/**
 * Parse Excel file and extract investment and contribution data
 * @param filePath Path to the Excel file
 * @returns Parsed data with investments, contributions, variables, and date range
 */
export function parseExcelFile(filePath: string): Promise<ParsedExcelData> {
    return new Promise((resolve, reject) => {
        console.log(`Fetching Excel file from: ${filePath}`);

        fetch(filePath)
            .then(response => {
                console.log('Fetch response status:', response.status);
                if (!response.ok) {
                    throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(data => {
                console.log('Excel file fetched, size:', data.byteLength);
                try {
                    const workbook = XLSX.read(data, { type: 'array' });
                    console.log('Excel workbook parsed, sheet names:', workbook.SheetNames);

                    // Get the Investments and Contributions sheets
                    const investmentsSheet = workbook.Sheets['Investments'];
                    const contributionsSheet = workbook.Sheets['Contributions'];

                    if (!investmentsSheet || !contributionsSheet) {
                        throw new Error(`Required sheets "Investments" and "Contributions" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
                    }

                    // Convert sheets to JSON
                    const investmentsData = XLSX.utils.sheet_to_json<ExcelSheetData>(investmentsSheet);
                    const contributionsData = XLSX.utils.sheet_to_json<ExcelSheetData>(contributionsSheet);

                    console.log('Investments data rows:', investmentsData.length);
                    console.log('Contributions data rows:', contributionsData.length);
                    console.log('Sample investments data:', investmentsData[0]);
                    console.log('Sample contributions data:', contributionsData[0]);

                    // Parse the data
                    const result = parseExcelData(investmentsData, contributionsData);
                    console.log('Parsed result:', result);
                    resolve(result);
                } catch (error) {
                    console.error('Error parsing Excel data:', error);
                    reject(error);
                }
            })
            .catch(error => {
                console.error('Error fetching Excel file:', error);
                reject(error);
            });
    });
}

/**
 * Parse the raw Excel data into structured format
 */
function parseExcelData(
    investmentsData: ExcelSheetData[],
    contributionsData: ExcelSheetData[]
): ParsedExcelData {
    // Detect variable columns (exclude date, base, sales columns)
    const excludeColumns = ['Date', 'date', 'Dates', 'Base1', 'Sales', 'base', 'sales'];
    const investmentColumns = Object.keys(investmentsData[0] || {});
    const contributionColumns = Object.keys(contributionsData[0] || {});

    // Get variable columns from both sheets (should be the same)
    const variables = investmentColumns.filter(col =>
        !excludeColumns.includes(col) &&
        contributionColumns.includes(col)
    );

    // Parse investment data (filter out empty rows)
    console.log('Filtering investment data, total rows:', investmentsData.length);
    const investments = investmentsData
        .filter(row => {
            const hasDate = row.Date || row.date || row.Dates;
            if (!hasDate) console.log('Skipping row without date:', row);
            return hasDate;
        }) // Only process rows with dates
        .map(row => {
            const parsedRow: WeeklyData = {
                date: parseDate(row.Date || row.date || row.Dates)
            };

            variables.forEach(variable => {
                parsedRow[variable] = parseFloat(row[variable]) || 0;
            });

            return parsedRow;
        });

    console.log('Parsed investments:', investments.length, 'rows');

    // Parse contribution data (filter out empty rows)
    const contributions = contributionsData
        .filter(row => row.Date || row.date || row.Dates) // Only process rows with dates
        .map(row => {
            const parsedRow: WeeklyData = {
                date: parseDate(row.Date || row.date || row.Dates),
                base: parseFloat(row.Base1 || row.base) || 0,
                sales: parseFloat(row.Sales || row.sales) || 0
            };

            variables.forEach(variable => {
                parsedRow[variable] = parseFloat(row[variable]) || 0;
            });

            return parsedRow;
        });

    // Calculate date range
    const allDates = [...investments, ...contributions].map(item => item.date);
    const dateRange = {
        min: new Date(Math.min(...allDates.map(d => d.getTime()))),
        max: new Date(Math.max(...allDates.map(d => d.getTime())))
    };

    // Debug: Log the date range and years
    console.log('Date range from Excel data:', {
        min: dateRange.min.toISOString().split('T')[0],
        max: dateRange.max.toISOString().split('T')[0],
        minYear: dateRange.min.getFullYear(),
        maxYear: dateRange.max.getFullYear()
    });

    return {
        investments,
        contributions,
        variables,
        dateRange
    };
}

/**
 * Parse date from Excel serial number or date string to Date object
 */
function parseDate(dateValue: any): Date {
    if (!dateValue) {
        console.warn('Empty date value found, skipping row');
        return new Date(); // Return current date as fallback
    }

    // Handle Excel serial number format (e.g., 43835)
    if (typeof dateValue === 'number') {
        // Excel serial number: days since January 1, 1900
        // Note: Excel incorrectly treats 1900 as a leap year, so we need to adjust
        const excelEpoch = new Date(1900, 0, 1);
        const daysSinceEpoch = dateValue - 2; // Subtract 2 to correct for Excel's leap year bug
        const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);

        if (isNaN(date.getTime())) {
            console.warn(`Invalid Excel serial number: ${dateValue}, using current date`);
            return new Date();
        }

        console.log(`Converted Excel serial ${dateValue} to date: ${date.toISOString().split('T')[0]} (Year: ${date.getFullYear()})`);
        return date;
    }

    // Handle string date formats
    const str = String(dateValue);

    // If it contains time, split and take only the date part
    if (str.includes(' ')) {
        const datePart = str.split(' ')[0];
        const date = new Date(datePart);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date format: ${str}, using current date`);
            return new Date();
        }
        return date;
    }

    // If it's already a valid date
    const date = new Date(str);
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${str}, using current date`);
        return new Date();
    }

    return date;
}

/**
 * Filter data by date range
 */
export function filterDataByDateRange(
    data: WeeklyData[],
    startDate: Date,
    endDate: Date
): WeeklyData[] {
    // Normalize dates to compare only date part (without time)
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    console.log('Filtering data by date range:', {
        startDate: startDateOnly.toISOString().split('T')[0],
        endDate: endDateOnly.toISOString().split('T')[0],
        startDateTimestamp: startDateOnly.getTime(),
        endDateTimestamp: endDateOnly.getTime(),
        totalDataPoints: data.length,
        firstDataPoint: data[0]?.date.toISOString().split('T')[0],
        lastDataPoint: data[data.length - 1]?.date.toISOString().split('T')[0],
        firstDataPointTimestamp: data[0]?.date.getTime(),
        lastDataPointTimestamp: data[data.length - 1]?.date.getTime()
    });

    const filtered = data.filter(item => {
        const itemDateOnly = new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate());
        const isInRange = itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;

        // Debug logging for edge cases
        if (itemDateOnly.getTime() === endDateOnly.getTime()) {
            console.log('End date match found:', {
                itemDate: itemDateOnly.toISOString().split('T')[0],
                endDate: endDateOnly.toISOString().split('T')[0],
                isInRange: isInRange
            });
        }

        if (!isInRange && itemDateOnly.getTime() === endDateOnly.getTime()) {
            console.log('End date match found but filtered out:', itemDateOnly.toISOString().split('T')[0]);
        }

        return isInRange;
    });

    console.log('Filtered data points:', filtered.length);
    if (filtered.length > 0) {
        console.log('First filtered point:', filtered[0].date.toISOString().split('T')[0]);
        console.log('Last filtered point:', filtered[filtered.length - 1].date.toISOString().split('T')[0]);
    }

    return filtered;
}

/**
 * Aggregate weekly data by variable
 */
export function aggregateDataByVariable(
    data: WeeklyData[],
    variables: string[]
): { [variable: string]: number } {
    const aggregated: { [variable: string]: number } = {};

    variables.forEach(variable => {
        aggregated[variable] = data.reduce((sum, row) =>
            sum + (row[variable] as number), 0
        );
    });

    return aggregated;
}
