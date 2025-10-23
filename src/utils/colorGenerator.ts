// Predefined color palette for consistent variable coloring
const COLOR_PALETTE = [
    '#8884d8', // Purple
    '#55B78D', // Green
    '#82ca9d', // Light Green
    '#ffc658', // Orange
    '#ff8042', // Red Orange
    '#0088fe', // Blue
    '#00C49F', // Teal
    '#FFBB28', // Yellow
    '#FF7300', // Dark Orange
    '#8884d8', // Purple (duplicate for cycling)
    '#55B78D', // Green (duplicate for cycling)
    '#82ca9d', // Light Green (duplicate for cycling)
    '#ffc658', // Orange (duplicate for cycling)
    '#ff8042', // Red Orange (duplicate for cycling)
    '#0088fe', // Blue (duplicate for cycling)
    '#00C49F', // Teal (duplicate for cycling)
    '#FFBB28', // Yellow (duplicate for cycling)
    '#FF7300', // Dark Orange (duplicate for cycling)
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

    // Simple hash function to generate consistent color index
    let hash = 0;
    for (let i = 0; i < variableName.length; i++) {
        const char = variableName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get index
    const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
    const color = COLOR_PALETTE[colorIndex];

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
