/**
 * Universal number formatting function for the MMM platform
 * Formats numbers with appropriate suffixes (B, M, K) and removes decimal points
 */

export function formatNumber(value: number): string {
    if (value === 0) return '€0';

    const absValue = Math.abs(value);

    // Billions
    if (absValue >= 1_000_000_000) {
        const billions = Math.round(value / 1_000_000_000);
        return `€${billions}B`;
    }

    // Millions
    if (absValue >= 1_000_000) {
        const millions = Math.round(value / 1_000_000);
        return `€${millions}M`;
    }

    // Thousands
    if (absValue >= 1_000) {
        const thousands = Math.round(value / 1_000);
        return `€${thousands}K`;
    }

    // Less than 1000
    return `€${Math.round(value)}`;
}

/**
 * Format number for tooltips and detailed displays (with decimals)
 */
export function formatNumberDetailed(value: number): string {
    if (value === 0) return '€0';

    const absValue = Math.abs(value);

    // Billions
    if (absValue >= 1_000_000_000) {
        const billions = value / 1_000_000_000;
        return `€${billions.toFixed(1)}B`;
    }

    // Millions
    if (absValue >= 1_000_000) {
        const millions = value / 1_000_000;
        return `€${millions.toFixed(1)}M`;
    }

    // Thousands
    if (absValue >= 1_000) {
        const thousands = value / 1_000;
        return `€${thousands.toFixed(1)}K`;
    }

    // Less than 1000
    return `€${value.toFixed(0)}`;
}

/**
 * Format number for Y-axis labels (compact format)
 */
export function formatNumberAxis(value: number): string {
    if (value === 0) return '0';

    const absValue = Math.abs(value);

    // Billions
    if (absValue >= 1_000_000_000) {
        const billions = Math.round(value / 1_000_000_000);
        return `${billions}B`;
    }

    // Millions
    if (absValue >= 1_000_000) {
        const millions = Math.round(value / 1_000_000);
        return `${millions}M`;
    }

    // Thousands
    if (absValue >= 1_000) {
        const thousands = Math.round(value / 1_000);
        return `${thousands}K`;
    }

    // Less than 1000
    return Math.round(value).toString();
}
