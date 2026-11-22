import type { PortfolioContent } from "types/portfolioTypes";
import { formatMonth } from "./formatMonth";
import {
    AboutHeading,
    AboutSection,
    AboutText,
    Fact,
    FactLabel,
    Facts,
    SkillCard,
    SkillCardList,
    SkillCardTitle,
    SkillGroups,
    FactValue,
    SkillsHeading,
} from "./Style";

const SKILL_GROUPS = [
    { title: "Core Frontend", skills: ["html", "css", "javascript", "typescript", "sass", "scss", "tailwind"] },
    { title: "Frameworks", skills: ["react", "next.js", "nextjs", "vue", "angular", "svelte", "node.js", "nodejs", "express"] },
    { title: "Tools & Design", skills: ["git", "github", "figma", "ui/ux", "adobe photoshop", "photoshop", "illustrator", "vs code", "jest"] },
]

const groupSkills = (skills: string[]) => {
    const groups = SKILL_GROUPS.map((group) => ({
        title: group.title,
        items: skills.filter((skill) => group.skills.includes(skill.trim().toLowerCase())),
    }));
    const known = groups.flatMap((group) => group.items);
    const other = skills.filter((skill) => !known.includes(skill));
    return [...groups, { title: "Other", items: other }].filter((group) => group.items.length > 0);
};

type Props = {
    profile: PortfolioContent["profile"];
    availability: PortfolioContent["availability"];
};

export const About = ({ profile, availability }: Props) => {
    // An empty line in the builder starts a new paragraph.
    const paragraphs = profile.about
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

    // Only filled-in facts are shown. "Looking for" and "Available" belong to
    // the internship badge, so they hide together with it.
    const facts = [
        availability.openToInternships && {
            label: "Looking for",
            value: availability.lookingFor.trim(),
        },
        availability.openToInternships && {
            label: "Available",
            value: `From ${formatMonth(availability.availableFrom)}`,
        },
        { label: "Based in", value: profile.location.trim() },
        { label: "Languages", value: profile.languages.join(" · ") },
    ].filter((fact): fact is { label: string; value: string } => Boolean(fact && fact.value));

    return (
        <>
            {paragraphs.length > 0 && (
                <AboutSection aria-labelledby="about-heading">
                    <AboutHeading id="about-heading">About me</AboutHeading>
                    <AboutText>
                        {paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </AboutText>
                </AboutSection>
            )}

            {facts.length > 0 && (
                <Facts>
                    {facts.map((fact) => (
                        <Fact key={fact.label}>
                            <FactLabel>{fact.label}</FactLabel>
                            <FactValue>{fact.value}</FactValue>
                        </Fact>
                    ))}
                </Facts>
            )}

            {profile.skills.length > 0 && (
                <AboutSection aria-labelledby="skills-heading">
                    <SkillsHeading id="skills-heading">Skills &amp; Technologies</SkillsHeading>
                    <SkillGroups>
                        {groupSkills(profile.skills).map((group) => (
                            <SkillCard key={group.title}>
                                <SkillCardTitle>{group.title}</SkillCardTitle>
                                <SkillCardList>{group.items.join(", ")}</SkillCardList>
                            </SkillCard>
                        ))}
                    </SkillGroups>
                </AboutSection>
            )}
        </>
    );
};