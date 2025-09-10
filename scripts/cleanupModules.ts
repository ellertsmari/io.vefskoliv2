// Data cleanup script for guide modules
// Run this script to standardize module numbering and titles

import { connectToDatabase } from "../app/serverActions/mongoose-connector";
import { Guide } from "../app/models/guide";

interface ModuleMap {
  [key: string]: number;
}

// Define the proper module mapping based on titles
const MODULE_MAPPING: ModuleMap = {
  "Preparation": 1,
  "Introductory Course": 2, 
  "The fundamentals": 3,
  "Connecting to the World": 4,
  "Back-end & Infrastructure": 5,
  "Growing complexity": 6,
  "Exploration": 7,
  "Community & Networking": 8,
};

async function analyzeModuleData() {
  console.log("🔍 Analyzing current module data...");
  
  await connectToDatabase();
  
  const guides = await Guide.find({}).select('title module').exec();
  
  console.log(`Found ${guides.length} guides`);
  
  // Group by module info
  const moduleGroups: { [key: string]: number } = {};
  
  guides.forEach(guide => {
    const key = `${guide.module?.number || 'undefined'} - ${guide.module?.title || 'undefined'}`;
    moduleGroups[key] = (moduleGroups[key] || 0) + 1;
  });
  
  console.log("\nCurrent module distribution:");
  Object.entries(moduleGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([module, count]) => {
      console.log(`  ${module}: ${count} guides`);
    });
  
  return guides;
}

async function cleanupModules() {
  console.log("🧹 Starting module cleanup...");
  
  const guides = await analyzeModuleData();
  
  let updatedCount = 0;
  
  for (const guide of guides) {
    const currentTitle = guide.module?.title || '';
    const currentNumber = guide.module?.number || 0;
    
    // Find proper module number for this title
    const properNumber = MODULE_MAPPING[currentTitle];
    
    if (properNumber && currentNumber !== properNumber) {
      console.log(`Updating ${guide.title}: ${currentNumber} - ${currentTitle} → ${properNumber} - ${currentTitle}`);
      
      await Guide.findByIdAndUpdate(
        guide._id,
        {
          'module.number': properNumber,
          'module.title': currentTitle,
          updatedAt: new Date()
        }
      );
      
      updatedCount++;
    }
  }
  
  console.log(`\n✅ Updated ${updatedCount} guides`);
  
  // Re-analyze to show final state
  console.log("\n📊 Final module distribution:");
  await analyzeModuleData();
}

// Export functions for use
export { analyzeModuleData, cleanupModules };

// If run directly
if (require.main === module) {
  cleanupModules()
    .then(() => {
      console.log("✅ Module cleanup completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Error during cleanup:", error);
      process.exit(1);
    });
}