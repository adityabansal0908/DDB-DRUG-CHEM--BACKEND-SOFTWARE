import { Product } from '../types';

/**
 * Normalizes a pharmaceutical dosage form or search term to canonical aliases and variations.
 * Handles singular/plural (e.g. tablet <-> tablets, syrup <-> syrups), common pharma abbreviations
 * (tab, cap, inj, susp, oint), and compound forms.
 */
export function getDosageFormAliases(term: string): string[] {
  const clean = term.toLowerCase().trim();
  if (!clean) return [];

  // Remove plural 's' or 'es' if present for base comparison
  const singular = clean.endsWith('es') && clean.length > 4
    ? clean.slice(0, -2)
    : clean.endsWith('s') && clean.length > 3
    ? clean.slice(0, -1)
    : clean;

  const aliases = new Set<string>([clean, singular, `${singular}s`]);

  // Tablets & variations
  if (singular === 'tablet' || clean === 'tab' || clean === 'tabs') {
    aliases.add('tablet');
    aliases.add('tablets');
    aliases.add('tab');
    aliases.add('tabs');
  }

  // Syrups & variations (e.g. syrup, syrups, dry syrup, oral syrup)
  if (singular === 'syrup' || clean === 'syp') {
    aliases.add('syrup');
    aliases.add('syrups');
    aliases.add('syp');
  }

  // Capsules & variations
  if (singular === 'capsule' || clean === 'cap' || clean === 'caps') {
    aliases.add('capsule');
    aliases.add('capsules');
    aliases.add('cap');
    aliases.add('caps');
    aliases.add('softgel');
  }

  // Injections & variations
  if (singular === 'injection' || clean === 'inj' || clean === 'injections') {
    aliases.add('injection');
    aliases.add('injections');
    aliases.add('inj');
    aliases.add('infusion');
  }

  // Suspensions & variations
  if (singular === 'suspension' || clean === 'susp' || clean === 'suspensions') {
    aliases.add('suspension');
    aliases.add('suspensions');
    aliases.add('susp');
  }

  // Ointments, creams, gels
  if (singular === 'ointment' || clean === 'oint' || clean === 'cream' || clean === 'gel') {
    aliases.add('ointment');
    aliases.add('ointments');
    aliases.add('cream');
    aliases.add('gel');
    aliases.add('emulgel');
  }

  // Drops
  if (singular === 'drop' || clean === 'drops') {
    aliases.add('drop');
    aliases.add('drops');
  }

  return Array.from(aliases);
}

/**
 * Checks whether a single search word matches the dosage form or packaging of the product.
 */
export function matchesDosageForm(product: Product, searchWord: string): boolean {
  const formLower = (product.form || '').toLowerCase().trim();
  const packagingLower = (product.packaging || '').toLowerCase().trim();

  const word = searchWord.toLowerCase().trim();
  if (!word) return true;

  // Direct substring check in product form
  if (formLower && formLower.includes(word)) return true;

  // Singular / plural check
  if (word.endsWith('s') && word.length > 3) {
    const singular = word.slice(0, -1);
    if (formLower && formLower.includes(singular)) return true;
  }
  const plural = word + 's';
  if (formLower && formLower.includes(plural)) return true;

  // Check aliases: see if any alias of the search word is contained in the product's form or packaging
  const aliases = getDosageFormAliases(word);
  for (const alias of aliases) {
    if (formLower && formLower.includes(alias)) {
      return true;
    }
    if (packagingLower && packagingLower.includes(alias)) {
      return true;
    }
  }

  return false;
}

/**
 * Complete product matching logic for catalog search bar.
 * Supports:
 * - Product Name (e.g. "OncoTaxel", "Amoxi")
 * - Salt / Generic Composition (e.g. "Paclitaxel", "Paracetamol")
 * - Dosage Form (e.g. "tablet" -> "Tablet", "Tablets", "syrup" -> "Syrup", "Dry Syrup", etc.)
 * - Packaging (e.g. "10x10 Tablets", "100ml Bottle")
 * - Company (e.g. "Apex", "DDB")
 * - Category / Speciality (e.g. "Oncology", "Antibiotics")
 * - Clinical Speciality (e.g. "Paediatric", "Dermatology")
 * - Batch No (e.g. "BATCH-001")
 */
export function matchesProductSearch(p: Product, rawSearchTerm: string): boolean {
  if (!p) return false;
  const term = rawSearchTerm.trim().toLowerCase();
  if (!term) return true;

  // Tokenize search into words (e.g. "amoxicillin syrup" -> matches both amoxicillin and syrup)
  const searchWords = term.split(/\s+/).filter(Boolean);

  const searchableFields = [
    p.name,
    p.genericName,
    p.company,
    p.packaging,
    p.category,
    p.clinicalSpeciality,
    p.form,
    p.batchNo
  ]
    .filter(Boolean)
    .map((s) => s!.toLowerCase());

  const fullSearchableText = searchableFields.join(' ');

  // Every word in the query must match at least one field (or dosage form alias)
  return searchWords.every((word) => {
    // 1. Direct text inclusion
    if (fullSearchableText.includes(word)) return true;

    // 2. Singular/Plural tolerance
    if (word.endsWith('s') && word.length > 3) {
      const singular = word.slice(0, -1);
      if (fullSearchableText.includes(singular)) return true;
    }
    const plural = word + 's';
    if (fullSearchableText.includes(plural)) return true;

    // 3. Dosage form alias match
    if (matchesDosageForm(p, word)) return true;

    return false;
  });
}
