"use client";

import { useState } from "react";
import { GuideType } from "../../models/guide";
import { GUIDE_CATEGORIES } from "../../constants/guideCategories";
import { MODULE_TITLES } from "../../constants/moduleTitles";
import { 
  PageContainer, 
  Header, 
  Title, 
  GuidesList, 
  GuideCard, 
  GuideTitle, 
  GuideDescription, 
  GuideActions, 
  ActionButton,
  SearchContainer,
  SearchInput,
  FilterContainer,
  FilterSelect
} from "./styles.EditGuidesPage";

interface EditGuidesPageProps {
  guides: GuideType[];
}

export const EditGuidesPage = ({ guides }: EditGuidesPageProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");

  // Get unique modules from guides - use title as primary identifier since number is often undefined
  const modules = [...new Set(guides.map(guide => {
    const title = guide.module?.title || 'Untitled Module';
    return title;
  }))]
    .sort((a, b) => {
      // Use the predefined MODULE_TITLES order since numbers are unreliable
      const moduleOrder = [...MODULE_TITLES, 'Untitled Module'];
      
      const indexA = moduleOrder.indexOf(a as any);
      const indexB = moduleOrder.indexOf(b as any);
      
      // If both are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one is in the order array, put it first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is in the order array, sort alphabetically
      return a.localeCompare(b);
    });

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || guide.category === selectedCategory;
    const title = guide.module?.title || 'Untitled Module';
    const matchesModule = selectedModule === "all" || title === selectedModule;
    return matchesSearch && matchesCategory && matchesModule;
  });

  const handleEditGuide = (guideId: string) => {
    window.location.href = `/LMS/edit-guides/${guideId}`;
  };

  const handleDeleteGuide = async (guideId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const response = await fetch(`/api/guides/${guideId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Guide deleted successfully!');
          window.location.reload();
        } else {
          alert('Error deleting guide');
        }
      } catch (error) {
        console.error('Error deleting guide:', error);
        alert('Error deleting guide');
      }
    }
  };

  return (
    <PageContainer>
      <Header>
        <Title>Edit Guides</Title>
      </Header>

      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search guides..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      <FilterContainer>
        <FilterSelect
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {GUIDE_CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </FilterSelect>
        
        <FilterSelect
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="all">All Modules</option>
          {modules.map(module => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </FilterSelect>
      </FilterContainer>

      <GuidesList>
        {filteredGuides.map(guide => (
          <GuideCard key={guide._id.toString()}>
            <GuideTitle>{guide.title}</GuideTitle>
            <GuideDescription>{guide.description}</GuideDescription>
            <div>
              <strong>Category:</strong> {guide.category}
            </div>
            <div>
              <strong>Module:</strong> {guide.module?.title || 'Untitled Module'}
            </div>
            <div>
              <strong>Order:</strong> {guide.order}
            </div>
            <GuideActions>
              <ActionButton 
                onClick={() => handleEditGuide(guide._id.toString())}
                $variant="primary"
              >
                Edit
              </ActionButton>
              <ActionButton 
                onClick={() => handleDeleteGuide(guide._id.toString(), guide.title)}
                $variant="danger"
              >
                Delete
              </ActionButton>
            </GuideActions>
          </GuideCard>
        ))}
      </GuidesList>

      {filteredGuides.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No guides found matching your search criteria.
        </div>
      )}
    </PageContainer>
  );
};