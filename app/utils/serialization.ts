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
      
      // Handle MongoDB ObjectId
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ObjectId') {
        return value.toString();
      }
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      // Handle other objects with toJSON method (but check for circular refs first)
      if (value && typeof value === 'object' && typeof value.toJSON === 'function' && !visited.has(value)) {
        return value.toJSON();
      }
      return value;
    }));
  } catch (error) {
    console.error('Serialization error:', error);
    // If serialization fails, return a minimal representation
    return obj;
  }
}
