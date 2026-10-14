/**
 * Migration Script: Seed & Initialize About Us Page in Database
 * Run with: npx tsx backend/scripts/migrate_about_page.ts
 */
import fs from 'fs';
import path from 'path';
import { defaultAboutPageData } from '../models/aboutPageSchema';

async function migrate() {
  console.log('🔄 Starting About Us page database migration...');

  const dbPath = path.join(process.cwd(), 'maxora_db.json');
  let db: any = {};

  if (fs.existsSync(dbPath)) {
    try {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      console.warn('Could not parse maxora_db.json, creating new file.');
    }
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created public/uploads directory.');
  }

  // Populate about_page if missing or merge defaults
  if (!db.about_page || !db.about_page.brand_story) {
    db.about_page = {
      ...defaultAboutPageData,
      ...(db.about_page || {})
    };
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('✅ successfully seeded `about_page` collection into maxora_db.json');
  } else {
    console.log('ℹ️ `about_page` record already exists in database. Verifying schema structure...');
    if (!db.about_page.features || db.about_page.features.length < 3) {
      db.about_page.features = defaultAboutPageData.features;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      console.log('✅ Updated feature cards to ensure 3 cards are present.');
    }
  }

  console.log('🎉 About Us migration completed successfully.');
}

migrate().catch(console.error);
