export function createSlug(text: string): string {
    return text
        .normalize('NFD')
        // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/gi, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase()
}