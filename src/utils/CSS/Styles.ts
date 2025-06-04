/**
 * Applies the given styles to an HTML element
 * 
 * @param element - The HTML element to apply styles to
 * @param styles - An object containing CSS properties and values
 * @returns Boolean indicating if styles were successfully applied
 */
export function applyStyles(element: HTMLElement | null | undefined, styles: Record<string, string | number>): boolean {
    if (!element) {
        console.warn("Element not found for applying styles");
        return false;
    }

    try {
        // Using for...in is more efficient than Object.entries().forEach for this case
        for (const key in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, key)) {
                // Type assertion since we've already verified styles has string keys
                element.style[key as any] = styles[key] as string;
            }
        }
        return true;
    } catch (error) {
        console.error("Error applying styles:", error);
        return false;
    }
}

/**
 * Removes all inline styles from an HTML element
 * 
 * @param element - The HTML element to remove styles from
 * @returns Boolean indicating if styles were successfully removed
 */
export function removeAllStyles(element: HTMLElement | null | undefined): boolean {
    if (!element) {
        console.warn("Element not found for removing styles");
        return false;
    }

    try {
        element.removeAttribute('style');
        return true;
    } catch (error) {
        console.error("Error removing styles:", error);
        return false;
    }
}