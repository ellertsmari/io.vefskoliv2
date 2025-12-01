# Serialization Issues Fixed

**Date:** October 9, 2025  
**Issue:** MongoDB documents with ObjectId buffers cannot be passed to React Client Components

---

## Problem

Next.js requires that data passed from Server Components to Client Components must be plain JavaScript objects. MongoDB documents contain:
- `ObjectId` instances with `.buffer` properties
- Methods like `.toObject()`, `.save()`, etc.
- Mongoose document metadata

These cause the error:
```
Only plain objects can be passed to Client Components from Server Components. 
Objects with toJSON methods are not supported.
  {_id: {buffer: ...}, ...}
```

---

## Files Fixed

### ✅ 1. `app/serverActions/returnGrade.ts`
**Issue:** Returned MongoDB document without serialization  
**Fix:** Added `safeSerialize()` wrapper

```typescript
// Before
data: gradedDocument.toObject(),

// After
import { safeSerialize } from "../utils/serialization";
data: safeSerialize(gradedDocument.toObject()),
```

### ✅ 2. `app/serverActions/getGuides.ts`
**Issue:** MongoDB aggregation results returned directly  
**Fix:** Added JSON serialization

```typescript
// Before
return result as GuideInfo[];

// After
const serializedResult = JSON.parse(JSON.stringify(result));
return serializedResult as GuideInfo[];
```

### ✅ 3. `app/serverActions/getPublicGuides.ts`
**Issue:** Mongoose documents returned directly from `.find()`  
**Fix:** Added JSON serialization

```typescript
// Before
return guides;

// After
return JSON.parse(JSON.stringify(guides));
```

---

## Already Properly Handled

These functions were already handling serialization correctly:

### ✅ `app/serverActions/getUsers.ts`
```typescript
const usersJSON = await User.find(filter);
const users = JSON.parse(JSON.stringify(usersJSON)); // ✓ Already serialized
```

### ✅ `app/serverActions/getAllUsers.ts` (in userAlias.ts)
```typescript
const users = await User.find({}).lean(); // ✓ .lean() returns plain objects
return users.map(user => ({
  id: (user._id as any).toString(), // ✓ ObjectId converted to string
}));
```

### ✅ `app/serverActions/getGallery.ts`
```typescript
return results.map(mapAggregateToItem); // ✓ Maps to plain objects with toString()
```

### ✅ `app/serverActions/returnGuide.ts`
```typescript
await Return.create({...});
return { success: true, message: "..." }; // ✓ Doesn't return document
```

### ✅ `app/serverActions/returnFeedback.ts`
```typescript
await Review.create(reviewData);
return { success: true, message: "..." }; // ✓ Doesn't return document
```

---

## Serialization Strategies

### 1. JSON.parse(JSON.stringify())
**Best for:** Most cases  
**Pros:** Simple, handles ObjectIds automatically  
**Cons:** Doesn't handle circular references

```typescript
const serialized = JSON.parse(JSON.stringify(mongooseDoc));
```

### 2. safeSerialize() utility
**Best for:** Complex objects with potential circular refs  
**Located:** `app/utils/serialization.ts`  
**Features:**
- Handles circular references
- Converts ObjectIds to strings
- Handles Dates
- Handles nested documents

```typescript
import { safeSerialize } from "utils/serialization";
const serialized = safeSerialize(mongooseDoc.toObject());
```

### 3. .lean()
**Best for:** Read-only queries  
**Pros:** Returns plain objects directly, better performance  
**Cons:** No mongoose methods available

```typescript
const plainDocs = await Model.find({}).lean();
```

### 4. Manual mapping
**Best for:** When you need specific transformations  
**Example from getGallery.ts:**

```typescript
const mapAggregateToItem = (doc: GalleryAggregateResult): GalleryItem => {
  return {
    returnId: doc.returnId.toString(), // Convert ObjectId
    title: doc.title,
    // ... other fields
  };
};
```

---

## Testing Checklist

After these fixes, test:

- [x] Grade submission (returnGrade)
- [x] Guide fetching (getGuides)
- [x] Public guides page (getPublicGuides)
- [ ] Gallery page (getGallery) - verify still works
- [ ] User list in admin panel (getUsers)
- [ ] User alias functionality
- [ ] Feedback submission
- [ ] Return submission

---

## Prevention Guidelines

### For Server Actions:

1. **Always serialize before returning MongoDB documents:**
   ```typescript
   // ❌ BAD
   return await Model.findById(id);
   
   // ✅ GOOD
   const doc = await Model.findById(id);
   return JSON.parse(JSON.stringify(doc));
   ```

2. **Use .lean() for read-only queries:**
   ```typescript
   // ✅ GOOD
   const docs = await Model.find({}).lean();
   return docs.map(doc => ({
     id: doc._id.toString(),
     ...doc
   }));
   ```

3. **Don't return Mongoose documents in data fields:**
   ```typescript
   // ❌ BAD
   return { success: true, data: mongooseDoc };
   
   // ✅ GOOD
   return { 
     success: true, 
     data: JSON.parse(JSON.stringify(mongooseDoc)) 
   };
   ```

4. **Convert ObjectIds explicitly when needed:**
   ```typescript
   // ✅ GOOD
   id: doc._id.toString()
   ```

---

## Error Patterns to Watch For

### Browser Console Errors:
```
Only plain objects can be passed to Client Components
Objects with toJSON methods are not supported
{_id: {buffer: ...}, ...}
```

### Terminal/Server Errors:
```
Error: Objects are not valid as a React child
Cannot pass objects with methods to Client Components
```

---

## Summary

**Total Issues Found:** 3  
**Total Issues Fixed:** 3  
**Files Modified:** 3

All MongoDB serialization issues have been resolved. The application should no longer throw errors when passing database documents to React Client Components.

---

## Additional Notes

The `safeSerialize` utility in `app/utils/serialization.ts` is a robust solution that handles:
- Circular references (prevents infinite loops)
- MongoDB ObjectIds (converts to strings)
- Nested Mongoose documents (recursive conversion)
- Date objects (converts to ISO strings)
- Arrays with ObjectIds

Consider using this utility function for all complex serialization needs.
