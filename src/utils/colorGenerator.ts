// Predefined color palette for specific variables
const VARIABLE_COLORS: { [key: string]: string } = {
    'TV': '#1F77B4',              // medium blue
    'Radio': '#4FA3DB',           // light-medium blue
    'Press': '#A7CBEF',           // light blue
    'OOH': '#2B6CB0',             // deep blue
    'DOOH': '#2B6CB0',            // deep blue (same as OOH)
    'Display': '#1B4F72',         // dark blue
    'Video': '#2F80ED',           // bright blue
    'Social Media': '#0B63B6',    // digital blue
    'Affiliation': '#118AB2',     // blue-teal accent
    'SEO': '#2F9E44',             // organic green
    'Direct Discount': '#C62828', // strong promo red
    'BOGOF': '#E53935',           // bright promo red
    'Card': '#B71C1C',            // deep promo red
    'Gifts': '#F0625D',           // soft coral-red
    'EDM': '#FB8C00',             // amber/orange
    'Email': '#FB8C00',           // amber/orange (same as EDM)
    'DM': '#EF6C00',              // burnt orange
    'Direct Mail': '#EF6C00',     // burnt orange (same as DM)
    'Baseline': '#9E9E9E',        // neutral gray
    'Controls': '#9E9E9E',        // neutral gray
    'Seasonality': '#9E9E9E',     // neutral gray
    'Base': '#9E9E9E',            // neutral gray
    'Sales': '#9E9E9E',           // neutral gray
};

// Fallback color palette for variables not in the predefined list
const FALLBACK_PALETTE = [
    '#8884d8', // Purple
    '#55B78D', // Green
    '#82ca9d', // Light Green
    '#ffc658', // Orange
    '#ff8042', // Red Orange
    '#00C49F', // Teal
    '#FFBB28', // Yellow
    '#FF7300', // Dark Orange
];

// Cache for variable colors to maintain consistency
const colorCache = new Map<string, string>();

/**
 * Generate a consistent color for a variable based on its name
 * @param variableName The name of the variable
 * @returns A hex color string
 */
export function getVariableColor(variableName: string): string {
    if (colorCache.has(variableName)) {
        return colorCache.get(variableName)!;
    }

    let color: string;

    // Check if variable has a predefined color
    if (VARIABLE_COLORS[variableName]) {
        color = VARIABLE_COLORS[variableName];
    } else {
        // Use hash function for fallback colors
        let hash = 0;
        for (let i = 0; i < variableName.length; i++) {
            const char = variableName.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Use absolute value and modulo to get index
        const colorIndex = Math.abs(hash) % FALLBACK_PALETTE.length;
        color = FALLBACK_PALETTE[colorIndex];
    }

    // Cache the color for this variable
    colorCache.set(variableName, color);

    return color;
}

/**
 * Generate colors for multiple variables
 * @param variables Array of variable names
 * @returns Object mapping variable names to colors
 */
export function getVariableColors(variables: string[]): { [variable: string]: string } {
    const colors: { [variable: string]: string } = {};

    variables.forEach(variable => {
        colors[variable] = getVariableColor(variable);
    });

    return colors;
}

/**
 * Clear the color cache (useful for testing or when variables change)
 */
export function clearColorCache(): void {
    colorCache.clear();
}

/**
 * Get light version of a color (for backgrounds, etc.)
 * @param hexColor Hex color string
 * @returns Light version of the color
 */
export function getLightColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Create light version with 20% opacity
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
}
