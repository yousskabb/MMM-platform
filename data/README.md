# Excel Data Structure

This folder contains the Excel file that the MMM platform reads to display data.

## File Location
- File: `data.xlsx`
- Location: `public/data/data.xlsx`

## Required Sheet Structure

### Sheet 1: "Investments"
- **Column A**: Date (format: MM/DD/YYYY HH:MM:SS, e.g., "05/01/2020 00:00:00")
- **Columns B+**: Variable names (e.g., "TV", "Digital", "Radio", etc.)
- **Data**: Weekly investment/spend amounts for each variable

### Sheet 2: "Contributions" 
- **Column A**: Date (format: MM/DD/YYYY HH:MM:SS, e.g., "05/01/2020 00:00:00")
- **Column B**: "Base1" - Base sales contribution
- **Column C**: "Sales" - Total sales
- **Columns D+**: Variable names (same as Investments sheet)
- **Data**: Weekly contribution amounts for each variable

## Important Notes
1. Variable names must match between both sheets
2. Dates must be in weekly intervals
3. The platform will automatically detect variable names (excludes "Base1" and "Sales")
4. ROI is calculated as: Contribution / Investment
5. Data is filtered by the date range selected in the UI

## Example Structure
```
Investments Sheet:
Date                | TV      | Digital | Radio | Print | CRM   | Promo
05/01/2020 00:00:00 | 1000000 | 800000  | 300000| 200000| 400000| 350000
05/08/2020 00:00:00 | 1100000 | 850000  | 320000| 180000| 420000| 380000

Contributions Sheet:
Date                | Base1   | Sales   | TV      | Digital | Radio | Print | CRM   | Promo
05/01/2020 00:00:00 | 5000000 | 8500000 | 1200000 | 900000  | 280000| 150000| 380000| 320000
05/08/2020 00:00:00 | 5200000 | 8800000 | 1300000 | 950000  | 300000| 160000| 400000| 350000
```
