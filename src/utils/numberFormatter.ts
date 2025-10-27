/**
 * Universal number formatting function for the MMM platform
 * Formats numbers with appropriate suffixes (B, M, K) and removes decimal points
 */

export function formatNumber(value: number): string {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formatted: string;

    // Billions
    if (absValue >= 1_000_000_000) {
        const billions = Math.round(absValue / 1_000_000_000);
        formatted = `€${billions}B`;
    }
    // Millions
    else if (absValue >= 1_000_000) {
        const millions = Math.round(absValue / 1_000_000);
        formatted = `€${millions}M`;
    }
    // Thousands
    else if (absValue >= 1_000) {
        const thousands = Math.round(absValue / 1_000);
        formatted = `€${thousands}K`;
    }
    // Less than 1000
    else {
        formatted = `€${Math.round(absValue)}`;
    }

    return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format number for tooltips and detailed displays (with decimals)
 */
export function formatNumberDetailed(value: number): string {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formatted: string;

    // Billions
    if (absValue >= 1_000_000_000) {
        const billions = absValue / 1_000_000_000;
        formatted = `€${billions.toFixed(1)}B`;
    }
    // Millions
    else if (absValue >= 1_000_000) {
        const millions = absValue / 1_000_000;
        formatted = `€${millions.toFixed(1)}M`;
    }
    // Thousands
    else if (absValue >= 1_000) {
        const thousands = absValue / 1_000;
        formatted = `€${thousands.toFixed(1)}K`;
    }
    // Less than 1000
    else {
        formatted = `€${absValue.toFixed(0)}`;
    }

    return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format number for Y-axis labels (compact format)
 */
export function formatNumberAxis(value: number): string {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formatted: string;

    // Billions
    if (absValue >= 1_000_000_000) {
        const billions = Math.round(absValue / 1_000_000_000);
        formatted = `${billions}B`;
    }
    // Millions
    else if (absValue >= 1_000_000) {
        const millions = Math.round(absValue / 1_000_000);
        formatted = `${millions}M`;
    }
    // Thousands
    else if (absValue >= 1_000) {
        const thousands = Math.round(absValue / 1_000);
        formatted = `${thousands}K`;
    }
    // Less than 1000
    else {
        formatted = Math.round(absValue).toString();
    }

    return isNegative ? `-${formatted}` : formatted;
}
