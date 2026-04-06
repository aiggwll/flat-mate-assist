/**
 * Returns the correct string based on the user's salutation preference.
 * Usage: sal(salutation, "Formal Sie text", "Informal Du text")
 */
export const sal = (salutation: "sie" | "du", sieText: string, duText: string): string =>
  salutation === "du" ? duText : sieText;
