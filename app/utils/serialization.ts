// Utility function to safely serialize MongoDB objects for client components
export function safeSerialize<T>(obj: T): T {
  try {
    // Create a Set to track visited objects and prevent circular references
    const visited = new WeakSet();
    
    // Use JSON.stringify with a custom replacer to handle MongoDB objects
    return JSON.parse(JSON.stringify(obj, function(key, value) {
      // Prevent circular references
      if (typeof value === 'object' && value !== null) {
        if (visited.has(value)) {
          return '[Circular Reference]';
        }
        visited.add(value);
      }
      
      // Handle MongoDB ObjectId - be more aggressive in detecting them
      if (value && typeof value === 'object') {
        // Check for ObjectId by various means
        if (value.constructor && value.constructor.name === 'ObjectId') {
          return value.toString();
        }
        // Check if it has a buffer property (common in ObjectIds)
        if (value.buffer && typeof value.toString === 'function') {
          return value.toString();
        }
        // Check if it's a mongoose document
        if (value._id && typeof value.toObject === 'function') {
          return safeSerialize(value.toObject());
        }
        // Handle arrays that might contain ObjectIds
        if (Array.isArray(value)) {
          return value.map(item => safeSerialize(item));
        }
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      // Handle other objects with toJSON method (but check for circular refs first)
      if (value && typeof value === 'object' && typeof value.toJSON === 'function' && !visited.has(value)) {
        try {
          return safeSerialize(value.toJSON());
        } catch (e) {
          return value.toString();
        }
      }
      
      return value;
    }));
  } catch (error) {
    console.error('Serialization error:', error);
    // If serialization fails, return a minimal representation
    return obj;
  }
}
