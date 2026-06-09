"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GuideType } from "../../models/guide";
import { MODULE_TITLES } from "../../constants/moduleTitles";
import {
  getDiscipline,
  getIsSpecialty,
  axesToCategory,
  type Discipline,
} from "../../utils/guideTaxonomy";
import {
  ExerciseEditor,
  emptyTask,
  type ExerciseForm,
} from "./ExerciseEditor";
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
  const [gradingMode, setGradingMode] = useState<"peerReview" | "auto">(
    (guide.gradingMode as "peerReview" | "auto") || "peerReview"
  );

  // Authoring copy of the exercise (includes the answer key — teacher-only view).
  const [exercise, setExercise] = useState<ExerciseForm>(() => {
    const ex = guide.exercise;
    if (ex && Array.isArray(ex.tasks) && ex.tasks.length > 0) {
      return {
        passThreshold: ex.passThreshold ?? 0.7,
        tasks: ex.tasks.map((t: any) => ({
          prompt: t.prompt || "",
          options: Array.isArray(t.options) ? t.options : ["", ""],
          correctAnswers: Array.isArray(t.correctAnswers) ? t.correctAnswers : [],
          allowMultiple: !!t.allowMultiple,
          points: t.points ?? 1,
          explanation: t.explanation || "",
          hint: t.hint || "",
          goal: t.goal || "",
        })),
        poolSize: ex.poolSize ?? 0,
      };
    }
    return { passThreshold: 0.7, poolSize: 0, tasks: [emptyTask()] };
  });

  // Canonical taxonomy axes (category is derived from these on save).
  const [discipline, setDiscipline] = useState<Discipline>(getDiscipline(guide));
  const [isSpecialty, setIsSpecialty] = useState<boolean>(getIsSpecialty(guide));

  const [formData, setFormData] = useState({
    title: guide.title || '',
    description: guide.description || '',
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

  // Validate the authored exercise before saving an auto-graded guide.
  // Returns an error string, or null when the exercise is valid.
  const validateExercise = (): string | null => {
    if (exercise.tasks.length === 0) {
      return "Add at least one question to the exercise.";
    }
    for (let i = 0; i < exercise.tasks.length; i++) {
      const task = exercise.tasks[i];
      const n = i + 1;
      if (!task.prompt.trim()) return `Question ${n}: add a prompt.`;
      const filledOptions = task.options.filter((o) => o.trim());
      if (filledOptions.length < 2)
        return `Question ${n}: add at least two options.`;
      if (task.correctAnswers.length === 0)
        return `Question ${n}: mark at least one correct answer.`;
    }
    if (exercise.poolSize >= exercise.tasks.length && exercise.poolSize > 0)
      return "The question pool must be smaller than the total number of questions (leave it empty to serve all).";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build the grading-specific part of the payload.
    let gradingPayload: Record<string, unknown>;
    if (gradingMode === "auto") {
      const exerciseError = validateExercise();
      if (exerciseError) {
        alert(exerciseError);
        return;
      }
      gradingPayload = {
        gradingMode: "auto",
        exercise: {
          passThreshold: exercise.passThreshold,
          tasks: exercise.tasks.map((t) => ({
            type: "quiz",
            prompt: t.prompt.trim(),
            options: t.options.map((o) => o.trim()),
            allowMultiple: t.allowMultiple,
            points: t.points,
            correctAnswers: t.correctAnswers,
            ...(t.explanation.trim()
              ? { explanation: t.explanation.trim() }
              : {}),
            ...(t.hint.trim() ? { hint: t.hint.trim() } : {}),
            ...(t.goal.trim() ? { goal: t.goal.trim() } : {}),
          })),
          ...(exercise.poolSize > 0 ? { poolSize: exercise.poolSize } : {}),
        },
      };
    } else {
      // Peer-reviewed guide: clear any previously authored exercise.
      gradingPayload = { gradingMode: "peerReview", exercise: null };
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/guides/${guide._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ...gradingPayload,
          // Canonical taxonomy axes + derived legacy `category` mirror.
          discipline,
          isSpecialty,
          category: axesToCategory(discipline, isSpecialty),
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
            <Label htmlFor="discipline">Discipline</Label>
            <Select
              id="discipline"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value as Discipline)}
              required
            >
              <option value="code">Code</option>
              <option value="design">Design</option>
            </Select>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="isSpecialty">
              <input
                id="isSpecialty"
                type="checkbox"
                checked={isSpecialty}
                onChange={(e) => setIsSpecialty(e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              Specialty guide (optional — can replace a lower grade in the same
              discipline, and does not count toward progress)
            </Label>
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
          <SectionTitle>Grading</SectionTitle>
          <InputGroup>
            <Label htmlFor="gradingMode">How is this guide completed?</Label>
            <Select
              id="gradingMode"
              value={gradingMode}
              onChange={(e) =>
                setGradingMode(e.target.value as "peerReview" | "auto")
              }
            >
              <option value="peerReview">
                Peer review (submit a project, get reviewed)
              </option>
              <option value="auto">
                Auto-graded exercise (graded instantly, no peer review)
              </option>
            </Select>
          </InputGroup>
        </Section>

        {gradingMode === "auto" && (
          <ExerciseEditor
            value={exercise}
            onChange={setExercise}
            knowledgeGoals={formData.knowledge.filter((k) => k.trim())}
          />
        )}

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