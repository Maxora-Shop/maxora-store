const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

async function inspect() {
  try {
    const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
    const app = initializeApp(cfg);
    const db = getFirestore(app, cfg.firestoreDatabaseId);

    const snap = await getDocs(collection(db, 'products'));
    console.log('Total products in Firestore: ' + snap.size);
    let activeCount = 0;
    let inactiveCount = 0;
    const prods = [];
    snap.forEach(d => {
      const p = d.data();
      const isActive = p.active !== 0 && p.active !== false && String(p.active) !== '0';
      if (isActive) activeCount++;
      else inactiveCount++;
      prods.push({
        id: d.id,
        name: (p.name || '').substring(0, 40),
        active: p.active,
        status: p.status,
        isActive: isActive
      });
    });
    console.log('Products:', JSON.stringify(prods, null, 2));
    console.log('Summary: Total=' + snap.size + ', Active=' + activeCount + ', Inactive=' + inactiveCount);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
inspect();
