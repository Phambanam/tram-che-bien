# Database Seeding Guide

## Overview
This guide explains how to populate the military logistics database with comprehensive test data.

## Quick Start

### Option 1: Run All Seeds (Recommended)
```bash
cd backend
node scripts/seed-all.js
```

This will run all seeding scripts in the correct order and create a complete dataset.

### Option 2: Run Individual Scripts
If you need to run specific parts:

1. **Core Database** (Users, Units, LTTP)
   ```bash
   npm run seed:comprehensive
   ```

2. **Data Library** (Categories, Products, Basic Dishes)
   ```bash
   node scripts/seed-data-library.js
   ```

3. **Generate Additional Dishes** (1000+ dishes)
   ```bash
   node scripts/generate-dishes.js
   ```

4. **Add Tofu Dishes**
   ```bash
   node scripts/add-tofu-dishes.js
   ```

5. **Create Menu Data**
   ```bash
   node scripts/seed-menu-data.js
   ```

6. **Create Supply Records**
   ```bash
   node scripts/seed-supplies.js
   ```

## What Gets Created

### Users & Authentication
- **Admin**: admin@military.gov.vn / admin123
- **Manager**: manager@military.gov.vn / admin123  
- **User**: user@military.gov.vn / admin123

### Units
- Tiểu đoàn 1 (150 personnel)
- Tiểu đoàn 2 (120 personnel)
- Tiểu đoàn 3 (100 personnel)
- Lữ đoàn bộ (80 personnel)

### Products & Categories
- 6 categories (Thịt, Thủy sản, Rau củ, etc.)
- 10+ products including Đậu phụ
- Proper pricing and units

### Dishes
- 1000+ dishes across all categories
- 10 specific tofu dishes
- 20+ dishes updated to include tofu
- Proper nutritional data and quantities

### Menu Data
- 8 weeks of menus (weeks 27-34 of 2025)
- 56 daily menus (7 days × 8 weeks)
- First 2 weeks marked as approved
- Each day has breakfast, lunch, and dinner
- ~70% of days include tofu dishes

### Supply Records
- 122 supply records over 30 days
- 37 tofu supply records (~30%)
- Mix of approved and pending status
- Proper invoicing and supplier data

### Processing Station Data
- 60 days of data for each station:
  - Tofu processing
  - Salt processing
  - Bean sprouts
  - Sausage processing
  - Livestock processing
  - Poultry processing

### LTTP Inventory
- 40 LTTP items
- 1200 inventory records
- Proper tracking and distribution

## Clearing Database

To start fresh:
```bash
npm run clear-db
```

## Troubleshooting

### MongoDB Connection Issues
Ensure MongoDB is running and connection string is correct:
```
mongodb://admin:password@localhost:27017/military-logistics?authSource=admin
```

### Script Failures
If a script fails:
1. Check MongoDB is running
2. Clear the database and start over
3. Run scripts in the correct order

### Missing Dependencies
```bash
npm install
```

## Development Tips

1. **Test Data Consistency**: The seed scripts create interconnected data. Menu dishes reference actual dishes, supplies match products, etc.

2. **Date Ranges**: 
   - Menus: Current week + 7 future weeks
   - Supplies: Past 30 days
   - Processing: Past 60 days

3. **Tofu Focus**: ~30% of supplies and menu items include tofu for testing the tofu calculation features.

4. **Status Variations**: Data includes both approved and pending items for testing workflows.

## Custom Seeding

To create custom data, modify the scripts in `/scripts` folder:
- Adjust quantities in `seed-menu-data.js`
- Add more dishes in `add-tofu-dishes.js`
- Change date ranges in `seed-supplies.js`
- Modify personnel counts in `run-seed.js` 