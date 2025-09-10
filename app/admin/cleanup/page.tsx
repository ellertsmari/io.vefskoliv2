"use client";

import { useState } from "react";
import { analyzeModuleData, cleanupModules } from "../../serverActions/cleanupModules";

export default function CleanupPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeModuleData();
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing data: " + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const result = await cleanupModules();
      setCleanupResult(result);
      alert(`Cleanup completed! Updated ${result.updatedCount} guides.`);
    } catch (error) {
      console.error("Cleanup error:", error);
      alert("Error cleaning up data: " + (error as Error).message);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Module Data Cleanup</h1>
      
      <div style={{ marginBottom: "2rem" }}>
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          style={{
            padding: "0.75rem 1.5rem",
            marginRight: "1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer"
          }}
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Current Data"}
        </button>
        
        <button 
          onClick={handleCleanup}
          disabled={isCleaning}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer"
          }}
        >
          {isCleaning ? "Cleaning..." : "Run Cleanup"}
        </button>
      </div>

      {analysisResult && (
        <div style={{ marginBottom: "2rem" }}>
          <h2>Analysis Results</h2>
          <p>Total guides: {analysisResult.totalGuides}</p>
          <h3>Current module distribution:</h3>
          <ul>
            {analysisResult.distribution.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {cleanupResult && (
        <div>
          <h2>Cleanup Results</h2>
          <p>Updated {cleanupResult.updatedCount} guides</p>
          
          {cleanupResult.updates.length > 0 && (
            <>
              <h3>Updates made:</h3>
              <ul>
                {cleanupResult.updates.map((update: string, index: number) => (
                  <li key={index}>{update}</li>
                ))}
              </ul>
            </>
          )}
          
          <h3>Final distribution:</h3>
          <ul>
            {cleanupResult.afterDistribution.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}