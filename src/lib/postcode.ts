// UK postcodes. The backend checks the same format (and that the postcode exists),
// this gives the user the message before they submit.

const FULL_POSTCODE = /^([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})$/;

/** "e16an" / "E1  6AN" → "E1 6AN"; anything else is returned trimmed and upper-cased. */
export const formatPostcode = (value: string): string => {
  const cleaned = value.replace(/\s+/g, ' ').trim().toUpperCase();
  const m = FULL_POSTCODE.exec(cleaned);
  return m ? `${m[1]} ${m[2]}` : cleaned;
};

export const isFullUkPostcode = (value: string): boolean => FULL_POSTCODE.test(value.replace(/\s+/g, ' ').trim().toUpperCase());

/** The message for a postcode field, or '' when it is a full UK postcode. */
export const postcodeError = (value: string): string => {
  if (!value.trim()) return 'Postcode is required.';
  if (!isFullUkPostcode(value)) {
    // "E1" / "NW1" (from the City / Area picker): only the first half.
    return /^[A-Z]{1,2}[0-9][A-Z0-9]?$/i.test(value.trim())
      ? 'Add the rest of the postcode, e.g. E1 6AN.'
      : 'Enter a full UK postcode, e.g. SW1A 1AA.';
  }
  return '';
};
