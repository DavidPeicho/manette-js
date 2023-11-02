/**
 * List of enumeration keys.
 *
 * @param enumeration The enumeration to retrieve the keys from.
 * @returns The list of keys.
 */
export function enumKeys<T extends {[key: string | number]: number | string}>(
    enumeration: T
): (keyof T)[] {
    return Object.values(enumeration).filter((v) => typeof v === 'string');
}
