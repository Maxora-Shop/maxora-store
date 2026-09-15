import { Product } from '../types';

export interface SpecificationItem {
  label: string;
  value: string;
}

export interface ParsedProductDescription {
  overviewParagraphs: string[];
  features: string[];
  specifications: SpecificationItem[];
  packageContents: string[];
  warrantyInfo?: string;
  deliveryInfo?: string;
  additionalInfo?: {
    title: string;
    paragraphs: string[];
  };
}

// Patterns for section headers in both English and Bengali
const SECTION_PATTERNS = {
  overview: /^(?:product\s+overview|overview|about\s+(?:the\s+)?product|পণ্য\s*পরিচিতি|বিবরণ|এক\s*নজরে|ওভারভিউ)[:\s]*$/i,
  features: /^(?:key\s+features|features|highlights|special\s+features|main\s+features|features\s*&?\s*benefits|বৈশিষ্ট্যসমূহ|বৈশিষ্ট্য|ফিচারসমূহ|ফিচার|প্রধান\s*বৈশিষ্ট্য|বিশেষ\s*ফিচার)[:\s]*$/i,
  specifications: /^(?:specifications|technical\s+specifications|technical\s+details|specs|specification|টেকনিক্যাল\s*স্পেসিফিকেশন|স্পেসিফিকেশন|পণ্যের\s*স্পেসিফিকেশন|প্রযুক্তিগত\s*বিবরণ)[:\s]*$/i,
  packageContents: /^(?:what['’]?s\s+in\s+the\s+box|package\s+contents|package\s+includes|in\s+the\s+box|box\s+contains|box\s+includes|included\s+items|বক্সের\s*ভেতর\s*যা\s*থাকছে|বক্সে\s*যা\s*থাকছে|প্যাকেজে\s*যা\s*থাকছে|প্যাকেজে\s*রয়েছে|বক্সে\s*থাকছে|প্যাকেজ\s*কনটেন্ট|সাথে\s*থাকছে)[:\s]*$/i,
  warranty: /^(?:warranty|warranty\s+(?:&|and)\s+(?:service|guarantee|policy|return)|guarantee|warranty\s+info|ওয়ারেন্টি|গ্যারান্টি|ওয়ারেন্টি|রিপ্লেসমেন্ট\s*ওয়ারেন্টি|ওয়ারেন্টি\s*তথ্য)[:\s]*$/i,
  delivery: /^(?:delivery|shipping|delivery\s+(?:&|and)\s+shipping|delivery\s+info|ডেলিভারি\s*তথ্য|ডেলিভারি|শিপিং|ক্যাশ\s*অন\s*ডেলিভারি)[:\s]*$/i,
  usage: /^(?:how\s+to\s+use|usage\s+instructions|directions|instructions|application|ব্যবহারের\s*নিয়ম|ব্যবহারের\s*পদ্ধতি|ব্যবহার\s*বিধি)[:\s]*$/i,
  additionalInfo: /^(?:additional\s+info(?:rmation)?|notes?|important\s+note|caution|warning|care\s+instructions|অতিরিক্ত\s*তথ্য|বিশেষ\s*দ্রষ্টব্য|সতর্কতা|টিপস|গুরুত্বপূর্ণ\s*তথ্য)[:\s]*$/i,
};

// Common technical spec keywords for dynamic attribute recognition
const SPEC_KEYWORD_MAP: Array<{ regex: RegExp; label: string }> = [
  { regex: /(?:model|মডেল)/i, label: 'Model' },
  { regex: /(?:display|screen|amoled|ips|ডিসপ্লে|স্ক্রিন)/i, label: 'Display' },
  { regex: /(?:bluetooth|connectivity|wireless|কানেক্টিভিটি|ব্লুটুথ)/i, label: 'Connectivity' },
  { regex: /(?:battery\s*(?:life|backup|capacity)?|ব্যাটারি\s*(?:ব্যাকআপ|ক্ষমতা)?)/i, label: 'Battery Backup' },
  { regex: /(?:water\s*resist(?:ance|ant)?|waterproof|আইপি\d+|ip\d+|ওয়াটারপ্রুফ)/i, label: 'Water Resistance' },
  { regex: /(?:noise\s*cancelling|anc|enc|নয়েজ\s*ক্যান্সেলেশন)/i, label: 'Noise Cancellation' },
  { regex: /(?:charging\s*(?:time|port|speed)|চার্জিং\s*(?:সময়|পোর্ট)?)/i, label: 'Charging' },
  { regex: /(?:playtime|playback|working\s*time|প্লে-টাইম)/i, label: 'Playtime' },
  { regex: /(?:material|উপাদান|মেটেরিয়াল)/i, label: 'Material' },
  { regex: /(?:capacity|volume|ধারণক্ষমতা|ক্যাপাসিটি|ভলিউম)/i, label: 'Capacity' },
  { regex: /(?:weight|ওজন)/i, label: 'Weight' },
  { regex: /(?:dimensions?|size|মাপ|আকার|সাইজ)/i, label: 'Dimensions / Size' },
  { regex: /(?:power|wattage|পাওয়ার|ওয়াট)/i, label: 'Power' },
  { regex: /(?:voltage|ভোল্টেজ)/i, label: 'Voltage' },
  { regex: /(?:switch\s*type|keys?|সুইচ)/i, label: 'Switch / Keys' },
  { regex: /(?:origin|made\s*in|country\s*of\s*origin|উৎপাদনকারী\s*দেশ)/i, label: 'Country of Origin' },
  { regex: /(?:compatibility|compatible\s*with|কম্প্যাটিবিলিটি)/i, label: 'Compatibility' },
  { regex: /(?:sensor|sensors|সেন্সর)/i, label: 'Sensors' },
  { regex: /(?:audio|driver|সাউন্ড|ড্রাইভার)/i, label: 'Audio Driver' },
  { regex: /(?:color|colours?|রং|কালার)/i, label: 'Color' },
  { regex: /(?:grade|tea\s*grade|কোয়ালিটি)/i, label: 'Grade' },
  { regex: /(?:skin\s*type|ত্বকের\s*ধরন)/i, label: 'Skin Type' },
  { regex: /(?:ingredients?|উপাদানসমূহ)/i, label: 'Key Ingredients' },
];

/**
 * Patterns for SEO keyword lines that must be stripped from customer-facing view
 */
const SEO_KEYWORD_LINE_PATTERN = /^(?:seo\s*keywords?|meta\s*keywords?|keywords?|search\s*tags?|tags?|product\s*tags?|সার্চ\s*কি-ওয়ার্ড|কি-ওয়ার্ড|ট্যাগ)[:\s]/i;

/**
 * Checks if a text line is purely a comma-delimited keyword dump
 */
function isKeywordDumpLine(line: string): boolean {
  if (SEO_KEYWORD_LINE_PATTERN.test(line)) return true;
  const lower = line.toLowerCase();
  if (lower.startsWith('keywords:') || lower.startsWith('tags:') || lower.startsWith('seo:')) return true;
  // If line has many commas and short fragments without proper sentences or verbs
  const commaParts = line.split(',');
  if (commaParts.length >= 4 && !line.includes('.') && commaParts.every(p => p.trim().split(/\s+/).length <= 4)) {
    return true;
  }
  return false;
}

/**
 * Strips raw HTML, Markdown syntax, JSON blocks, leading bullets, asterisks, checkmarks, dashes, numbers, etc.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  let s = text;
  // 1. Strip script or style blocks
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // 2. Strip HTML tags
  s = s.replace(/<[^>]+>/g, ' ');
  // 3. Decode HTML entities
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // 4. Strip markdown headings
  s = s.replace(/^#{1,6}\s+/, '');
  // 5. Strip markdown bold / italic / strikethrough / code
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');
  s = s.replace(/~~([^~]+)~~/g, '$1');
  s = s.replace(/`{1,3}([^`]+)`{1,3}/g, '$1');
  // 6. Strip leading bullets and numbering
  s = s
    .replace(/^[\s•\-\*\✓\✔\▪\▫\+►\–\—\>]+/, '')
    .replace(/^\d+[\.\)\-]\s*/, '')
    .trim();
  // 7. Normalize multiple spaces
  s = s.replace(/\s{2,}/g, ' ');
  return s.trim();
}

function cleanBulletText(text: string): string {
  return sanitizeText(text);
}

/**
 * Checks if a line matches a key-value format (e.g., "Model: X73" or "মডেল: X73")
 */
function parseKeyValue(line: string): { key: string; value: string } | null {
  const match = line.match(/^([\w\s\u0980-\u09FF\.\-\/()]{2,35})\s*[:=–—]\s*(.+)$/);
  if (!match) return null;

  const key = match[1].trim();
  const value = match[2].trim();

  // Make sure key isn't a known section header
  for (const pattern of Object.values(SECTION_PATTERNS)) {
    if (pattern.test(key)) {
      return null;
    }
  }

  // Value shouldn't be empty
  if (!value || value.length === 0) return null;

  return { key, value };
}

/**
 * Infers technical specifications dynamically from feature text phrases
 */
function inferSpecsFromPhrases(phrases: string[], existingSpecs: SpecificationItem[], product?: Product): SpecificationItem[] {
  const specs: SpecificationItem[] = [...existingSpecs];
  const existingLabels = new Set(specs.map((s) => s.label.toLowerCase()));

  for (const phrase of phrases) {
    const trimmed = cleanBulletText(phrase);
    if (!trimmed || trimmed.length < 3) continue;

    // Check if phrase has key: value
    const kv = parseKeyValue(trimmed);
    if (kv) {
      const normKey = kv.key.toLowerCase();
      if (!existingLabels.has(normKey)) {
        specs.push({ label: kv.key, value: kv.value });
        existingLabels.add(normKey);
      }
      continue;
    }

    // Infer from mapped spec patterns
    for (const mapping of SPEC_KEYWORD_MAP) {
      if (mapping.regex.test(trimmed)) {
        const normLabel = mapping.label.toLowerCase();
        if (!existingLabels.has(normLabel)) {
          specs.push({ label: mapping.label, value: trimmed });
          existingLabels.add(normLabel);
          break;
        }
      }
    }
  }

  // Supplement with non-redundant product-level metadata if available
  if (product) {
    if (product.product_type && !existingLabels.has('product type') && !existingLabels.has('type')) {
      specs.unshift({ label: 'Product Type', value: product.product_type });
      existingLabels.add('product type');
    }
    if (product.child_category && !existingLabels.has('variant / edition') && !existingLabels.has('edition')) {
      specs.push({ label: 'Edition / Variant', value: product.child_category });
      existingLabels.add('variant / edition');
    }
    if (product.sku && !existingLabels.has('sku') && !existingLabels.has('model') && !existingLabels.has('model code')) {
      specs.push({ label: 'Item Code (SKU)', value: product.sku });
      existingLabels.add('item code (sku)');
    }
  }

  return specs;
}

/**
 * Main parser function to structure raw product descriptions into clean modern sections
 */
export function parseProductDescription(
  rawDescription?: string,
  product?: Product
): ParsedProductDescription {
  const text = (rawDescription || '').trim();

  // If completely empty description, provide standard high-grade fallback overview
  if (!text) {
    const fallbackOverview = [
      product?.name
        ? `${product.name} - 100% genuine product with guaranteed quality, high durability and authentic performance.`
        : '100% genuine product with guaranteed quality, high durability and authentic performance.'
    ];

    const fallbackSpecs: SpecificationItem[] = [];
    if (product?.product_type) {
      fallbackSpecs.push({ label: 'Product Type', value: product.product_type });
    }
    if (product?.sku) {
      fallbackSpecs.push({ label: 'SKU / Model', value: product.sku });
    }
    if (product?.category) {
      fallbackSpecs.push({ label: 'Category', value: product.category });
    }

    return {
      overviewParagraphs: fallbackOverview,
      features: [],
      specifications: fallbackSpecs,
      packageContents: [],
    };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  // Section collectors
  const overviewList: string[] = [];
  const featuresList: string[] = [];
  const specsList: SpecificationItem[] = [];
  const packageContentsList: string[] = [];
  const warrantyList: string[] = [];
  const deliveryList: string[] = [];
  const additionalList: string[] = [];

  let currentSection:
    | 'overview'
    | 'features'
    | 'specifications'
    | 'packageContents'
    | 'warranty'
    | 'delivery'
    | 'usage'
    | 'additional'
    | null = null;

  let hasExplicitHeaders = false;

  // Pass 1: Scan for explicit section headings and categorize lines
  for (const rawLine of lines) {
    // 1. Completely ignore keyword dumps and SEO tags on customer-facing view
    if (isKeywordDumpLine(rawLine)) {
      continue;
    }

    // 2. Ignore raw JSON code or object representations
    const trimmed = rawLine.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      continue;
    }

    const line = sanitizeText(rawLine);
    if (!line) continue;

    // Check for section headings
    if (SECTION_PATTERNS.overview.test(line)) {
      currentSection = 'overview';
      hasExplicitHeaders = true;
      continue;
    }
    if (SECTION_PATTERNS.features.test(line)) {
      currentSection = 'features';
      hasExplicitHeaders = true;
      continue;
    }
    if (SECTION_PATTERNS.specifications.test(line)) {
      currentSection = 'specifications';
      hasExplicitHeaders = true;
      continue;
    }
    if (SECTION_PATTERNS.packageContents.test(line)) {
      currentSection = 'packageContents';
      hasExplicitHeaders = true;
      continue;
    }
    if (SECTION_PATTERNS.warranty.test(line)) {
      currentSection = 'warranty';
      hasExplicitHeaders = true;
      continue;
    }
    if (SECTION_PATTERNS.delivery.test(line)) {
      currentSection = 'delivery';
      hasExplicitHeaders = true;
      continue;
    }
    if (SECTION_PATTERNS.usage.test(line)) {
      currentSection = 'usage';
      hasExplicitHeaders = true;
      continue;
    }
    if (SECTION_PATTERNS.additionalInfo.test(line)) {
      currentSection = 'additional';
      hasExplicitHeaders = true;
      continue;
    }

    // Assign content to current section if within an active section
    if (currentSection === 'overview') {
      overviewList.push(cleanBulletText(line));
    } else if (currentSection === 'features') {
      featuresList.push(cleanBulletText(line));
    } else if (currentSection === 'specifications') {
      const kv = parseKeyValue(line);
      if (kv) {
        specsList.push({ label: kv.key, value: kv.value });
      } else {
        const cleaned = cleanBulletText(line);
        if (cleaned) {
          specsList.push({ label: 'Spec', value: cleaned });
        }
      }
    } else if (currentSection === 'packageContents') {
      packageContentsList.push(cleanBulletText(line));
    } else if (currentSection === 'warranty') {
      warrantyList.push(cleanBulletText(line));
    } else if (currentSection === 'delivery') {
      deliveryList.push(cleanBulletText(line));
    } else if (currentSection === 'usage' || currentSection === 'additional') {
      additionalList.push(cleanBulletText(line));
    } else {
      // Line is before any section header
      // Check if it's a key-value
      const kv = parseKeyValue(line);
      const isBullet = /^[\s•\-\*\✓\✔\▪\▫\+►\–\—]/.test(line) || /^\d+[\.\)]\s/.test(line);

      // Check for warranty keywords in inline sentence
      if (/(?:warranty|ওয়ারেন্টি|গ্যারান্টি|রিপ্লেসমেন্ট)/i.test(line) && line.length < 150) {
        warrantyList.push(cleanBulletText(line));
      } else if (/(?:in\s+the\s+box|package\s+includes|বক্সের\s*ভেতর)/i.test(line)) {
        packageContentsList.push(cleanBulletText(line.replace(/.*(?:in\s+the\s+box|package\s+includes|বক্সের\s*ভেতর)[:\s]*/i, '')));
      } else if (kv) {
        specsList.push({ label: kv.key, value: kv.value });
      } else if (isBullet) {
        featuresList.push(cleanBulletText(line));
      } else {
        overviewList.push(line);
      }
    }
  }

  // Pass 2: If there were NO explicit headers and description is a single paragraph or comma-separated
  // (e.g. "1.96-inch Always-on AMOLED display, Bluetooth calling, IP68 water resistance...")
  if (!hasExplicitHeaders && featuresList.length === 0 && specsList.length === 0) {
    const fullText = overviewList.join(' ');
    
    // Split by commas or semicolons or bullet characters
    const parts = fullText
      .split(/[,;]|\band\s+(?=[A-Z0-9\u0980-\u09FF])/)
      .map((p) => p.trim())
      .filter((p) => p.length > 2);

    if (parts.length >= 2) {
      // If we have distinct feature phrases, show them as Key Features!
      for (const part of parts) {
        const cleaned = cleanBulletText(part);
        // Check if warranty phrase
        if (/(?:warranty|ওয়ারেন্টি|গ্যারান্টি|রিপ্লেসমেন্ট)/i.test(cleaned)) {
          warrantyList.push(cleaned);
        } else if (/(?:delivery|ক্যাশ অন ডেলিভারি|ডেলিভারি)/i.test(cleaned)) {
          deliveryList.push(cleaned);
        } else {
          featuresList.push(cleaned);
        }
      }

      // Infer technical specs from these phrases
      const inferred = inferSpecsFromPhrases(featuresList, specsList, product);
      specsList.length = 0;
      specsList.push(...inferred);
    } else {
      // Single continuous sentence/paragraph
      const inferred = inferSpecsFromPhrases([fullText], specsList, product);
      specsList.length = 0;
      specsList.push(...inferred);
    }
  } else if (specsList.length === 0 && featuresList.length > 0) {
    // Has features list but no explicit specs table: infer from features & product info
    const inferred = inferSpecsFromPhrases(featuresList, specsList, product);
    specsList.push(...inferred);
  } else if (specsList.length > 0 && product) {
    // Enrich existing specs with product type or SKU if missing
    const existingLabels = new Set(specsList.map((s) => s.label.toLowerCase()));
    if (product.product_type && !existingLabels.has('product type') && !existingLabels.has('type')) {
      specsList.unshift({ label: 'Product Type', value: product.product_type });
    }
    if (product.sku && !existingLabels.has('sku') && !existingLabels.has('model') && !existingLabels.has('model code')) {
      specsList.push({ label: 'Model / SKU', value: product.sku });
    }
  }

  // Clean overview paragraphs
  // If overview is empty but we have full text, use the first 1-2 sentences of the full text
  let finalOverview = overviewList.filter((p) => p.length > 0);
  if (finalOverview.length === 0 && text.length > 0) {
    finalOverview = [text];
  }

  // Deduplicate features
  const uniqueFeatures = Array.from(new Set(featuresList.filter((f) => f.length > 0)));

  // Deduplicate specs
  const seenSpecLabels = new Set<string>();
  const uniqueSpecs: SpecificationItem[] = [];
  for (const s of specsList) {
    const key = `${s.label.trim().toLowerCase()}`;
    if (!seenSpecLabels.has(key) && s.value.trim().length > 0) {
      seenSpecLabels.add(key);
      uniqueSpecs.push({
        label: s.label.trim(),
        value: s.value.trim(),
      });
    }
  }

  // Deduplicate package contents
  const uniquePackageContents = Array.from(
    new Set(packageContentsList.filter((item) => item.length > 0))
  );

  return {
    overviewParagraphs: finalOverview,
    features: uniqueFeatures,
    specifications: uniqueSpecs,
    packageContents: uniquePackageContents,
    warrantyInfo: warrantyList.length > 0 ? warrantyList.join('. ') : undefined,
    deliveryInfo: deliveryList.length > 0 ? deliveryList.join('. ') : undefined,
    additionalInfo:
      additionalList.length > 0
        ? {
            title: 'Additional Information',
            paragraphs: additionalList,
          }
        : undefined,
  };
}
