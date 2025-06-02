# Migrating from MongoDB to Mongoose

This guide explains the steps for migrating the Military Logistics backend from direct MongoDB driver usage to Mongoose.

## Why Mongoose?

Mongoose offers several advantages over the direct MongoDB driver:

1. **Schema Validation** - Define data structures and validation rules
2. **Type Safety** - Better TypeScript integration
3. **Middleware** - Add hooks for operations (pre/post save, etc.)
4. **Query Building** - Simpler, more intuitive query API
5. **Population** - Easier handling of relationships between collections
6. **Error Handling** - Better error messages and stack traces
7. **Debugging** - Better tools for debugging database operations

## Migration Steps

### 1. Install Mongoose

```bash
npm install mongoose
```

### 2. Create Models

Models have been created in the `src/models` directory:

- `unit.model.ts` - Unit model
- `user.model.ts` - User model
- `supply.model.ts` - Supply model
- `category.model.ts` - Category model
- `product.model.ts` - Product model

All models are exported from `src/models/index.ts`.

### 3. Update Database Connection

The database connection has been updated in `src/config/database.ts` to use Mongoose.

### 4. Refactor Controllers

Controllers need to be updated to use Mongoose models instead of direct MongoDB collections.

Example pattern for refactoring:

**Before (MongoDB):**
```typescript
const db = await getDb();
const supplies = await db
  .collection("supplies")
  .aggregate([...])
  .toArray();
```

**After (Mongoose):**
```typescript
await connectToDatabase();
const supplies = await Supply.find(query)
  .populate('unit')
  .lean()
  .exec();
```

### 5. Validate Existing Data

Use the migration script to validate existing data against the new Mongoose schemas:

```bash
npx ts-node scripts/migrate-to-mongoose.ts --validate-only
```

This will show any validation errors without making changes.

### 6. Refactoring Strategy

For a smooth transition, follow these steps:

1. Start with one controller at a time (e.g., supply.controller.ts)
2. Refactor one endpoint at a time within that controller
3. Test thoroughly after each refactoring
4. Keep both approaches working in parallel until migration is complete

### 7. Common Refactoring Patterns

#### ObjectId Handling
- MongoDB: `new ObjectId(id)`
- Mongoose: `new mongoose.Types.ObjectId(id)`

#### Data Querying
- MongoDB: `db.collection('supplies').find({}).toArray()`
- Mongoose: `Supply.find({}).exec()`

#### Document Creation
- MongoDB: `db.collection('supplies').insertOne(data)`
- Mongoose: `const newSupply = new Supply(data); await newSupply.save()`

#### Document Updates
- MongoDB: `db.collection('supplies').updateOne({ _id: id }, { $set: data })`
- Mongoose: `await Supply.findByIdAndUpdate(id, data, { new: true })`

#### Aggregations
- MongoDB: Complex aggregation pipelines
- Mongoose: Use `.populate()` for simple joins, or `.aggregate()` for complex ones

### 8. Testing

After refactoring each endpoint:

1. Test the endpoint manually
2. Verify the response format matches the original
3. Check for any validation errors
4. Update any tests to use the new Mongoose models

## Troubleshooting

### Schema Validation Errors

If you encounter schema validation errors:

1. Check the error message for which field is causing the issue
2. Update the schema or transform the data to match the expected format
3. Run the validation script again

### Connection Issues

If you encounter connection issues:

1. Make sure MongoDB is running
2. Check the `MONGODB_URI` environment variable
3. Verify connection settings in `src/config/database.ts`

### Type Errors

If you encounter TypeScript errors:

1. Make sure to import the correct types from Mongoose
2. Use proper type casting when necessary
3. Update interfaces to match Mongoose document types

## Additional Resources

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB to Mongoose Migration Guide](https://mongoosejs.com/docs/migrating_to_5.html)
- [TypeScript with Mongoose](https://mongoosejs.com/docs/typescript.html) 