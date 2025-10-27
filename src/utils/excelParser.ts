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
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(data => {
                try {
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the Investments and Contributions sheets
                    const investmentsSheet = workbook.Sheets['Investments'];
                    const contributionsSheet = workbook.Sheets['Contributions'];

                    if (!investmentsSheet || !contributionsSheet) {
                        throw new Error(`Required sheets "Investments" and "Contributions" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
                    }

                    // Convert sheets to JSON
                    const investmentsData = XLSX.utils.sheet_to_json<ExcelSheetData>(investmentsSheet);
                    const contributionsData = XLSX.utils.sheet_to_json<ExcelSheetData>(contributionsSheet);

                    // Parse the data
                    const result = parseExcelData(investmentsData, contributionsData);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            })
            .catch(error => {
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
    const investments = investmentsData
        .filter(row => {
            const hasDate = row.Date || row.date || row.Dates;
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
            return new Date();
        }

        return date;
    }

    // Handle string date formats
    const str = String(dateValue);

    // If it contains time, split and take only the date part
    if (str.includes(' ')) {
        const datePart = str.split(' ')[0];
        const date = new Date(datePart);
        if (isNaN(date.getTime())) {
            return new Date();
        }
        return date;
    }

    // If it's already a valid date
    const date = new Date(str);
    if (isNaN(date.getTime())) {
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

    const filtered = data.filter(item => {
        const itemDateOnly = new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate());
        const isInRange = itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
        return isInRange;
    });

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
