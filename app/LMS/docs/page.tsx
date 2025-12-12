import {
  DocsContainer,
  PageTitle,
  PageSubtitle,
  Section,
  SectionTitle,
  SectionContent,
  FormulaBox,
  ExampleBox,
  ExampleTitle,
  ExampleContent,
  StatusBadge,
  GradeScale,
  GradeNumber,
  GradeDescription,
} from "./style";

const DocsPage = () => {
  return (
    <DocsContainer>
      <PageTitle>How Grading Works</PageTitle>
      <PageSubtitle>
        Understanding the peer review system and how your grades are calculated
      </PageSubtitle>

      <Section>
        <SectionTitle>Overview</SectionTitle>
        <SectionContent>
          <p>
            At Vefskolinn, we use a <strong>peer review system</strong> where students
            learn from each other by reviewing projects and providing constructive feedback.
            Your final grade for each guide is based on two components:
          </p>
          <ul>
            <li><strong>Returning the guide</strong> - Submitting your project</li>
            <li><strong>Quality of reviews received</strong> - How helpful the feedback on your project was</li>
          </ul>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Grade Calculation</SectionTitle>
        <SectionContent>
          <p>Your grade for each guide is calculated using this formula:</p>
          <FormulaBox>
            Final Grade = 5 (for returning) + (Review Grade Average / 10) x 5
          </FormulaBox>
          <p>This means:</p>
          <ul>
            <li>You get <strong>5 points</strong> automatically for returning a guide (as long as it passes)</li>
            <li>You can earn up to <strong>5 additional points</strong> based on the quality of reviews your project receives</li>
            <li>The maximum possible grade is <strong>10</strong></li>
          </ul>

          <ExampleBox>
            <ExampleTitle>Example Calculations</ExampleTitle>
            <ExampleContent>
              <p><strong>If your reviews average 5/10:</strong></p>
              <p>5 + (5/10 x 5) = 5 + 2.5 = <strong>7.5</strong></p>
              <br />
              <p><strong>If your reviews average 8/10:</strong></p>
              <p>5 + (8/10 x 5) = 5 + 4 = <strong>9.0</strong></p>
              <br />
              <p><strong>If your reviews average 10/10:</strong></p>
              <p>5 + (10/10 x 5) = 5 + 5 = <strong>10.0</strong></p>
            </ExampleContent>
          </ExampleBox>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Guide Statuses</SectionTitle>
        <SectionContent>
          <p>Each guide can have one of the following statuses:</p>
          <ul>
            <li>
              <StatusBadge $color="#6c757d">Not Returned</StatusBadge>
              You haven&apos;t submitted your project yet
            </li>
            <li>
              <StatusBadge $color="#28a745">Awaiting Reviews</StatusBadge>
              Your project is submitted and waiting for peer reviews
            </li>
            <li>
              <StatusBadge $color="#28a745">Passed</StatusBadge>
              Your project has received enough reviews and passed
            </li>
            <li>
              <StatusBadge $color="#6f42c1">Hall of Fame</StatusBadge>
              Your project was recommended to the gallery by reviewers
            </li>
            <li>
              <StatusBadge $color="#dc3545">Failed</StatusBadge>
              Your project received 2 or more &quot;no pass&quot; votes and needs to be resubmitted
            </li>
          </ul>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Peer Review Process</SectionTitle>
        <SectionContent>
          <p>Here&apos;s how the peer review process works:</p>
          <ol>
            <li><strong>Submit your project</strong> - Return the guide with your project URL and live version</li>
            <li><strong>Wait for reviews</strong> - Your project needs at least 2 peer reviews</li>
            <li><strong>Review others</strong> - You must review 2 projects from other students for each guide</li>
            <li><strong>Receive your grade</strong> - Once reviews are graded by teachers, your final grade is calculated</li>
          </ol>
          <p>
            When reviewing, you can vote <strong>Pass</strong>, <strong>No Pass</strong>, or
            <strong> Recommend to Gallery</strong> if the project is exceptional.
          </p>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Review Quality Scale</SectionTitle>
        <SectionContent>
          <p>
            Teachers grade the quality of reviews on a scale of 1-10. Here&apos;s what each level means:
          </p>
          <GradeScale>
            <GradeNumber>1-2</GradeNumber>
            <GradeDescription>Not helpful - just &quot;good&quot; or &quot;bad&quot; with no explanation</GradeDescription>

            <GradeNumber>3-4</GradeNumber>
            <GradeDescription>Barely helpful - very short, less than a paragraph</GradeDescription>

            <GradeNumber>5-6</GradeNumber>
            <GradeDescription>Helpful - points out specific things that could be improved or were done well</GradeDescription>

            <GradeNumber>7-8</GradeNumber>
            <GradeDescription>Very helpful - thoughtful review with specific advice and suggestions</GradeDescription>

            <GradeNumber>9-10</GradeNumber>
            <GradeDescription>Exceptional - thorough review with specific advice, suggestions for improvement, AND praise for good parts</GradeDescription>
          </GradeScale>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Specialty Guides</SectionTitle>
        <SectionContent>
          <p>
            Some guides are marked as <strong>specialty guides</strong>. These are optional
            and work differently:
          </p>
          <ul>
            <li>Specialty guides are <strong>not counted</strong> in your module progress percentage</li>
            <li>If you complete a specialty guide, it can <strong>replace</strong> a lower grade in the same category</li>
            <li>They&apos;re a great way to boost your grades while exploring topics you&apos;re interested in</li>
          </ul>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Tips for Success</SectionTitle>
        <SectionContent>
          <ul>
            <li><strong>Submit quality work</strong> - Take time to polish your projects before submitting</li>
            <li><strong>Write thoughtful reviews</strong> - Help others improve and you&apos;ll learn more yourself</li>
            <li><strong>Be specific</strong> - Point out exactly what works and what could be better</li>
            <li><strong>Be constructive</strong> - Frame feedback in a way that helps, not discourages</li>
            <li><strong>Check your progress</strong> - Use the dashboard to track your module completion</li>
          </ul>
        </SectionContent>
      </Section>
    </DocsContainer>
  );
};

export default DocsPage;
