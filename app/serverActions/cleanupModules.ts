"use server";

import { connectToDatabase } from "./mongoose-connector";
import { Guide } from "../models/guide";

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

export async function analyzeModuleData() {
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
  const distribution: string[] = [];
  Object.entries(moduleGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([module, count]) => {
      const line = `${module}: ${count} guides`;
      console.log(`  ${line}`);
      distribution.push(line);
    });
  
  return {
    totalGuides: guides.length,
    distribution,
    guides
  };
}

export async function cleanupModules() {
  console.log("🧹 Starting module cleanup...");
  
  const analysis = await analyzeModuleData();
  const guides = analysis.guides;
  
  let updatedCount = 0;
  const updates: string[] = [];
  
  for (const guide of guides) {
    const currentTitle = guide.module?.title || '';
    const currentNumber = guide.module?.number || 0;
    
    // Find proper module number for this title
    const properNumber = MODULE_MAPPING[currentTitle];
    
    if (properNumber && currentNumber !== properNumber) {
      const updateMsg = `${guide.title}: ${currentNumber} - ${currentTitle} → ${properNumber} - ${currentTitle}`;
      console.log(`Updating ${updateMsg}`);
      updates.push(updateMsg);
      
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
  const finalAnalysis = await analyzeModuleData();
  
  return {
    updatedCount,
    updates,
    beforeDistribution: analysis.distribution,
    afterDistribution: finalAnalysis.distribution
  };
}