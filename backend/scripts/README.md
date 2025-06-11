# Scripts Documentation

## Dish Management Scripts

### 1. Generate 1000 Dishes

Generate 1000 realistic Vietnamese dishes for testing purposes.

```bash
# Navigate to backend directory
cd backend

# Run the script
npm run generate-dishes
```

**Features:**
- ✅ Generates 1000 unique dish names
- ✅ Realistic Vietnamese ingredients and cooking methods
- ✅ Random ingredients (3-8 per dish) with proper quantities
- ✅ Various categories: Món chính, Món phụ, Canh, Súp, etc.
- ✅ Different difficulty levels: easy, medium, hard
- ✅ Proper mainLTTP assignment
- ✅ Batch insertion (100 dishes per batch) for performance
- ✅ Checks existing dishes count before adding

**Generated Data Examples:**
- `Canh cà chua thịt bò` with ingredients like thịt bò, cà chua, hành tây
- `Gà nướng gia đình` with ingredients like gà ta, tỏi, gừng
- `Thịt lợn kho truyền thống` with thịt lợn, đường, nước mắm

### 2. Clear All Dishes

Remove all dishes from the database (with safety confirmation).

```bash
# WARNING: This will delete ALL dishes!
npm run clear-dishes -- --force
```

**Safety Features:**
- ⚠️ Requires `--force` flag to prevent accidental deletion
- ⚠️ Shows current count before deletion
- ⚠️ Confirms deletion count after operation

### 3. Alternative Clear Method

```bash
# Using environment variable
FORCE_CLEAR=true npm run clear-dishes
```

## Usage Examples

### Complete Workflow

```bash
# 1. Clear existing dishes (if needed)
npm run clear-dishes -- --force

# 2. Generate 1000 new dishes
npm run generate-dishes

# 3. Verify in your application
# The dishes should now appear in the frontend MultiSelect dropdowns
```

### Development Testing

```bash
# Generate dishes for testing pagination
npm run generate-dishes

# Test your frontend with 1000+ dishes
# Verify MultiSelect performance
# Test API pagination with different limits
```

## Database Structure

Each generated dish follows this structure:

```javascript
{
  name: "Canh cà chua thịt bò",
  description: "Món Canh cà chua thịt bò có hương vị đậm đà, thích hợp cho bữa cơm gia đình.",
  mainLTTP: {
    lttpId: "lttp002",
    lttpName: "Thịt bò",
    category: "Thịt"
  },
  ingredients: [
    {
      lttpId: "lttp002",
      lttpName: "Thịt bò",
      quantity: 500,
      unit: "gram",
      notes: ""
    },
    {
      lttpId: "lttp009",
      lttpName: "Cà chua",
      quantity: 300,
      unit: "gram",
      notes: ""
    }
    // ... more ingredients
  ],
  servings: 6,
  preparationTime: 45,
  difficulty: "medium",
  category: "Canh",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## Performance Notes

- **Batch Processing**: Inserts 100 dishes at a time for optimal performance
- **Memory Efficient**: Clears array after each batch to prevent memory issues
- **Duplicate Prevention**: Uses Set to ensure unique dish names
- **Progress Tracking**: Shows progress every 100 dishes

## Troubleshooting

### MongoDB Connection Issues
```bash
# Make sure MongoDB is running
# Check your .env file for correct MONGODB_URI
```

### Permission Issues
```bash
# Make sure the scripts directory exists and is executable
chmod +x scripts/generate-dishes.js
chmod +x scripts/clear-dishes.js
```

### Memory Issues (Rare)
If you encounter memory issues with 1000 dishes:
- The script uses batch processing to minimize memory usage
- Consider generating fewer dishes by modifying the loop limit
- Monitor your MongoDB server resources

## Integration with Frontend

After running `generate-dishes`, your frontend should:
- ✅ Load 1000+ dishes in MultiSelect dropdowns
- ✅ Have working search functionality
- ✅ Display proper scrolling in dropdown lists
- ✅ Show pagination in dishes management pages

This is perfect for testing the fixes we made to the MultiSelect component and pagination issues! 