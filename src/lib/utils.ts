/**
 * Truncates a string to a specified length, adding '...' at the end if truncated.
 * If the string is an email, it uses the part before the '@' symbol.
 * @param str The string to truncate.
 * @param maxLength The maximum length of the string before truncation. Defaults to 15.
 * @returns The truncated string.
 */
export function truncateName(str: string | undefined | null, maxLength: number = 15): string {
  if (!str) {
    return 'Player';
  }
  
  // If the name is an email, take the part before the @ sign.
  let cleanStr = str;
  if (str.includes('@')) {
    cleanStr = str.split('@')[0];
  }

  if (cleanStr.length <= maxLength) {
    return cleanStr;
  }
  
  return `${cleanStr.substring(0, maxLength)}...`;
} 