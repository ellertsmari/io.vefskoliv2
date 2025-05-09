import { useState } from "react";

export const FilterComponent = ({
  onFilterChange,
}: {
  onFilterChange: (filters: {
    status?: string;
    category?: string;
    minGrade?: number;
    maxGrade?: number;
  }) => void;
}) => {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [minGrade, setMinGrade] = useState<number | undefined>(undefined);
  const [maxGrade, setMaxGrade] = useState<number | undefined>(undefined);

  const handleFilterChange = () => {
    onFilterChange({ status, category, minGrade, maxGrade });
  };

  return (
    <div className="filter-container">
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="Due">Due</option>
        <option value="Review">Review</option>
        <option value="Waiting">Waiting</option>
        <option value="Grade">Grade</option>
      </select>

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All Categories</option>
        <option value="code">Code</option>
        <option value="design">Design</option>
      </select>

      <input
        type="number"
        placeholder="Min Grade"
        value={minGrade || ""}
        onChange={(e) =>
          setMinGrade(e.target.value ? Number(e.target.value) : undefined)
        }
      />
      <input
        type="number"
        placeholder="Max Grade"
        value={maxGrade || ""}
        onChange={(e) =>
          setMaxGrade(e.target.value ? Number(e.target.value) : undefined)
        }
      />

      <button onClick={handleFilterChange}>Apply Filters</button>
    </div>
  );
};
