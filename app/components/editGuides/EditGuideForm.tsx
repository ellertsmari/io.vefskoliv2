"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GuideType } from "../../models/guide";
import { GUIDE_CATEGORIES } from "../../constants/guideCategories";
import { MODULE_TITLES } from "../../constants/moduleTitles";
import {
  FormContainer,
  BackLink,
  FormHeader,
  FormTitle,
  Form,
  Section,
  SectionTitle,
  InputGroup,
  Label,
  Input,
  TextArea,
  ButtonGroup,
  Button,
  ArraySection,
  ArrayItem,
  RemoveButton,
  AddButton,
  Select,
  MarkdownEditorWrapper,
  MultiFieldItem,
  MultiFieldRow,
  MultiFieldGroup,
  SmallLabel,
  RemoveButtonSmall
} from "./styles.EditGuideForm";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

interface EditGuideFormProps {
  guide: GuideType;
}

export const EditGuideForm = ({ guide }: EditGuideFormProps) => {
  const [formData, setFormData] = useState({
    title: guide.title || '',
    description: guide.description || '',
    category: guide.category || '',
    topicsList: guide.topicsList || '',
    order: guide.order || 0,
    themeIdea: {
      title: guide.themeIdea?.title || '',
      description: guide.themeIdea?.description || ''
    },
    module: {
      title: guide.module?.title || '',
      number: guide.module?.number || 0
    },
    knowledge: guide.knowledge?.map(k => k.knowledge) || [],
    skills: guide.skills?.map(s => s.skill) || [],
    resources: guide.resources?.map(r => ({ link: r.link || '', description: r.description || '' })) || [],
    references: guide.references?.map(r => ({ type: r.type || '', name: r.name || '', link: r.link || '' })) || [],
    classes: guide.classes?.map(c => ({ title: c.title || '', link: c.link || '' })) || []
  });

  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section as keyof typeof prev] as object), [field]: value }
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string | { [key: string]: string }) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as any[]).map((item: any, i: number) =>
        i === index ? (typeof value === 'string' ? value : value) : item
      )
    }));
  };

  const handleMultiFieldChange = (field: string, index: number, subField: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as any[]).map((item: any, i: number) =>
        i === index ? { ...item, [subField]: value } : item
      )
    }));
  };

  const addArrayItem = (field: string, defaultValue: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as any[]), defaultValue]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as any[]).filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`/api/guides/${guide._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          knowledge: formData.knowledge.map(k => ({ knowledge: k })),
          skills: formData.skills.map(s => ({ skill: s })),
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Guide updated successfully!');
        window.location.href = '/LMS/edit-guides';
      } else {
        alert('Error updating guide');
      }
    } catch (error) {
      console.error('Error saving guide:', error);
      alert('Error saving guide');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormContainer>
      <BackLink href="/LMS/edit-guides">← Back to Edit Guides</BackLink>
      
      <FormHeader>
        <FormTitle>Edit Guide: {guide.title}</FormTitle>
      </FormHeader>

      <Form onSubmit={handleSubmit}>
        <Section>
          <SectionTitle>Basic Information</SectionTitle>
          
          <InputGroup>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="description">Description (Markdown)</Label>
            <MarkdownEditorWrapper data-color-mode="light">
              <MDEditor
                value={formData.description}
                onChange={(value) => handleInputChange('description', value || '')}
                preview="edit"
                height={300}
              />
            </MarkdownEditorWrapper>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {GUIDE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="topicsList">Topics List</Label>
            <TextArea
              id="topicsList"
              value={formData.topicsList}
              onChange={(e) => handleInputChange('topicsList', e.target.value)}
              required
              rows={3}
            />
          </InputGroup>
        </Section>

        <Section>
          <SectionTitle>Theme Idea</SectionTitle>
          
          <InputGroup>
            <Label htmlFor="themeTitle">Theme Title</Label>
            <Input
              id="themeTitle"
              value={formData.themeIdea.title}
              onChange={(e) => handleNestedChange('themeIdea', 'title', e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="themeDescription">Theme Description (Markdown)</Label>
            <MarkdownEditorWrapper data-color-mode="light">
              <MDEditor
                value={formData.themeIdea.description}
                onChange={(value) => handleNestedChange('themeIdea', 'description', value || '')}
                preview="edit"
                height={250}
              />
            </MarkdownEditorWrapper>
          </InputGroup>
        </Section>

        <Section>
          <SectionTitle>Module Information</SectionTitle>
          
          <InputGroup>
            <Label htmlFor="moduleTitle">Module Title</Label>
            <Select
              id="moduleTitle"
              value={formData.module.title}
              onChange={(e) => handleNestedChange('module', 'title', e.target.value)}
              required
            >
              <option value="">Select a module</option>
              {MODULE_TITLES.map(moduleTitle => (
                <option key={moduleTitle} value={moduleTitle}>
                  {moduleTitle}
                </option>
              ))}
            </Select>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="moduleNumber">Module Number</Label>
            {/* ⚠️ WARNING: module.number is often undefined in database - handle with care */}
            <Input
              id="moduleNumber"
              type="number"
              value={formData.module.number || 0}
              onChange={(e) => handleNestedChange('module', 'number', parseInt(e.target.value) || 0)}
              required
            />
          </InputGroup>
        </Section>

        <ArraySection>
          <SectionTitle>Knowledge Items</SectionTitle>
          {formData.knowledge.map((item, index) => (
            <ArrayItem key={index}>
              <Input
                value={item}
                onChange={(e) => handleArrayChange('knowledge', index, e.target.value)}
                placeholder="Knowledge item"
                required
              />
              <RemoveButton
                type="button"
                onClick={() => removeArrayItem('knowledge', index)}
              >
                Remove
              </RemoveButton>
            </ArrayItem>
          ))}
          <AddButton
            type="button"
            onClick={() => addArrayItem('knowledge', '')}
          >
            Add Knowledge Item
          </AddButton>
        </ArraySection>

        <ArraySection>
          <SectionTitle>Skills</SectionTitle>
          {formData.skills.map((item, index) => (
            <ArrayItem key={index}>
              <Input
                value={item}
                onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                placeholder="Skill"
                required
              />
              <RemoveButton
                type="button"
                onClick={() => removeArrayItem('skills', index)}
              >
                Remove
              </RemoveButton>
            </ArrayItem>
          ))}
          <AddButton
            type="button"
            onClick={() => addArrayItem('skills', '')}
          >
            Add Skill
          </AddButton>
        </ArraySection>

        <ArraySection>
          <SectionTitle>Resources</SectionTitle>
          {formData.resources.map((resource, index) => (
            <MultiFieldItem key={index}>
              <MultiFieldRow>
                <MultiFieldGroup>
                  <SmallLabel>Description</SmallLabel>
                  <Input
                    value={resource.description}
                    onChange={(e) => handleMultiFieldChange('resources', index, 'description', e.target.value)}
                    placeholder="Resource description"
                  />
                </MultiFieldGroup>
                <RemoveButtonSmall
                  type="button"
                  onClick={() => removeArrayItem('resources', index)}
                >
                  Remove
                </RemoveButtonSmall>
              </MultiFieldRow>
              <MultiFieldRow>
                <MultiFieldGroup>
                  <SmallLabel>Link</SmallLabel>
                  <Input
                    value={resource.link}
                    onChange={(e) => handleMultiFieldChange('resources', index, 'link', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </MultiFieldGroup>
              </MultiFieldRow>
            </MultiFieldItem>
          ))}
          <AddButton
            type="button"
            onClick={() => addArrayItem('resources', { description: '', link: '' })}
          >
            Add Resource
          </AddButton>
        </ArraySection>

        <ArraySection>
          <SectionTitle>Classes / Materials</SectionTitle>
          {formData.classes.map((classItem, index) => (
            <MultiFieldItem key={index}>
              <MultiFieldRow>
                <MultiFieldGroup>
                  <SmallLabel>Title</SmallLabel>
                  <Input
                    value={classItem.title}
                    onChange={(e) => handleMultiFieldChange('classes', index, 'title', e.target.value)}
                    placeholder="Class/Material title"
                  />
                </MultiFieldGroup>
                <RemoveButtonSmall
                  type="button"
                  onClick={() => removeArrayItem('classes', index)}
                >
                  Remove
                </RemoveButtonSmall>
              </MultiFieldRow>
              <MultiFieldRow>
                <MultiFieldGroup>
                  <SmallLabel>Link</SmallLabel>
                  <Input
                    value={classItem.link}
                    onChange={(e) => handleMultiFieldChange('classes', index, 'link', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </MultiFieldGroup>
              </MultiFieldRow>
            </MultiFieldItem>
          ))}
          <AddButton
            type="button"
            onClick={() => addArrayItem('classes', { title: '', link: '' })}
          >
            Add Class/Material
          </AddButton>
        </ArraySection>

        <ArraySection>
          <SectionTitle>References</SectionTitle>
          {formData.references.map((reference, index) => (
            <MultiFieldItem key={index}>
              <MultiFieldRow>
                <MultiFieldGroup style={{ flex: '0 0 120px' }}>
                  <SmallLabel>Type</SmallLabel>
                  <Select
                    value={reference.type}
                    onChange={(e) => handleMultiFieldChange('references', index, 'type', e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option value="Class">Class</option>
                    <option value="Resource">Resource</option>
                    <option value="Article">Article</option>
                    <option value="Video">Video</option>
                    <option value="Documentation">Documentation</option>
                  </Select>
                </MultiFieldGroup>
                <MultiFieldGroup>
                  <SmallLabel>Name</SmallLabel>
                  <Input
                    value={reference.name}
                    onChange={(e) => handleMultiFieldChange('references', index, 'name', e.target.value)}
                    placeholder="Reference name"
                  />
                </MultiFieldGroup>
                <RemoveButtonSmall
                  type="button"
                  onClick={() => removeArrayItem('references', index)}
                >
                  Remove
                </RemoveButtonSmall>
              </MultiFieldRow>
              <MultiFieldRow>
                <MultiFieldGroup>
                  <SmallLabel>Link</SmallLabel>
                  <Input
                    value={reference.link}
                    onChange={(e) => handleMultiFieldChange('references', index, 'link', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </MultiFieldGroup>
              </MultiFieldRow>
            </MultiFieldItem>
          ))}
          <AddButton
            type="button"
            onClick={() => addArrayItem('references', { type: '', name: '', link: '' })}
          >
            Add Reference
          </AddButton>
        </ArraySection>

        <ButtonGroup>
          <Button type="submit" disabled={saving} $variant="primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" onClick={() => window.location.href = '/LMS/edit-guides'}>
            Cancel
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};