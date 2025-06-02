import { getDb } from "./config/database"
import { ObjectId } from "mongodb"

async function debugSupplies() {
  try {
    console.log("Connecting to database...")
    const db = await getDb()

    // Step 1: Find a raw document to examine
    console.log("\n=== RAW DOCUMENT CHECK ===")
    const rawDoc = await db.collection("supplies").findOne({})
    console.log("Raw document:", JSON.stringify(rawDoc, null, 2))

    // Step 2: Check what happens when we query with a string ID vs ObjectId
    console.log("\n=== QUERY COMPARISON ===")
    if (rawDoc && rawDoc.unit) {
      const unitId = rawDoc.unit
      console.log("Unit ID from document:", unitId)
      console.log("Unit ID type:", typeof unitId, unitId instanceof ObjectId)

      // Check string query
      const stringQuery = { unit: unitId.toString() }
      const stringResults = await db.collection("supplies").find(stringQuery).toArray()
      console.log("Query with string ID:", stringQuery)
      console.log("Results count:", stringResults.length)

      // Check ObjectId query
      const objectIdQuery = { unit: unitId }  // Original ObjectId
      const objectIdResults = await db.collection("supplies").find(objectIdQuery).toArray()
      console.log("Query with ObjectId:", objectIdQuery)
      console.log("Results count:", objectIdResults.length)

      // Check with new ObjectId from string
      const newObjectIdQuery = { unit: new ObjectId(unitId.toString()) }
      const newObjectIdResults = await db.collection("supplies").find(newObjectIdQuery).toArray()
      console.log("Query with new ObjectId from string:", newObjectIdQuery)
      console.log("Results count:", newObjectIdResults.length)
    }

    // Step 3: Check all documents in the collection
    console.log("\n=== ALL DOCUMENTS ===")
    const allDocs = await db.collection("supplies").find({}).toArray()
    console.log(`Found ${allDocs.length} documents in supplies collection`)
    allDocs.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`)
      console.log(`- _id: ${doc._id} (${typeof doc._id})`)
      console.log(`- unit: ${doc.unit} (${typeof doc.unit})`)
      console.log(`- status: ${doc.status}`)
      console.log(`- category: ${doc.category} (${typeof doc.category})`)
      console.log(`- product: ${doc.product} (${typeof doc.product})`)
    })

    console.log("\nDebug complete!")
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

debugSupplies() 