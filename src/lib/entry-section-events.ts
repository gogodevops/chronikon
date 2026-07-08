/** Custom events to open detail sections from the action bar. */

export const OPEN_SECTION_OFFEN = "chronikon:open-section-offen";
export const OPEN_SECTION_MATERIAL = "chronikon:open-section-material";
export const OPEN_SECTION_WEITERE_CLAIM = "chronikon:open-section-weitere-claim";
export const OPEN_SECTION_WEITERE_SOURCE = "chronikon:open-section-weitere-source";

export function dispatchOpenSection(eventName: string) {
  window.dispatchEvent(new Event(eventName));
}
