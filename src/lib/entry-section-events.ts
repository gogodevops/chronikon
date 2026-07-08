/** Custom events to open detail sections from the action bar. */

export const OPEN_SECTION_KERN = "chronikon:open-section-kern";
export const OPEN_SECTION_OFFEN = "chronikon:open-section-offen";
export const OPEN_SECTION_MATERIAL = "chronikon:open-section-material";
export const OPEN_SECTION_QUELLEN = "chronikon:open-section-quellen";
export const OPEN_SECTION_BEHUAPTUNGEN = "chronikon:open-section-behauptungen";

/** @deprecated Use OPEN_SECTION_QUELLEN */
export const OPEN_SECTION_WEITERE_SOURCE = OPEN_SECTION_QUELLEN;
/** @deprecated Use OPEN_SECTION_BEHUAPTUNGEN */
export const OPEN_SECTION_WEITERE_CLAIM = OPEN_SECTION_BEHUAPTUNGEN;

export function dispatchOpenSection(eventName: string) {
  window.dispatchEvent(new Event(eventName));
}
