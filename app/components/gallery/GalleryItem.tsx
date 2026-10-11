"use client";

import { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import {
  GalleryItemContainer,
  GalleryItemImage,
  GalleryItemContent,
  GalleryItemTitle,
  GalleryItemStudent,
  GalleryItemDescription,
  GalleryTopicTags,
  GalleryTopicTag,
  GalleryItemMeta,
  GalleryActions,
  GalleryActionLink,
  IframePreviewContainer,
  FigmaPreviewContainer,
  PreviewOverlay,
  PreviewBadge,
} from "./styles";

interface GalleryItemProps {
  item: GalleryItemType;
}

// Extract Figma file key from URL
const getFigmaFileKey = (url: string): string | null => {
  // Matches URLs like:
  // https://www.figma.com/file/ABC123/...
  // https://www.figma.com/design/ABC123/...
  // https://www.figma.com/proto/ABC123/...
  // https://figma.com/file/ABC123/...
  const match = url.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

const getLinkLabel = (
  url: string,
  field: "projectUrl" | "liveVersion"
): string => {
  const hostname = getHostname(url);
  const isFigma = hostname === "figma.com" || hostname?.endsWith(".figma.com");
  const isGitHub = hostname === "github.com" || hostname?.endsWith(".github.com");
  if (isGitHub) return "GITHUB";
  if (isFigma) return "FIGMA";
  if (field === "liveVersion") return "View Project";
  return "Project source";
};

// Check if URL is a website (not GitHub, not Figma)
const isWebsiteUrl = (url: string): boolean => {
  if (!url) return false;
  // Exclude common non-previewable URLs
  const excludePatterns = [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'figma.com',
    'docs.google.com',
    'drive.google.com',
  ];
  return !excludePatterns.some(pattern => url.includes(pattern));
};

// Get Figma thumbnail URL using Figma's image API
const getFigmaThumbnailUrl = (fileKey: string): string => {
  // Figma provides a public thumbnail endpoint
  return `https://www.figma.com/file/${fileKey}/thumbnail`;
};

const GalleryLinks = ({ item }: GalleryItemProps) => {
  if (!item.liveVersion && !item.projectUrl) return null;

  return (
    <GalleryActions>
      {item.liveVersion && (
        <GalleryActionLink
          href={item.liveVersion}
          target="_blank"
          rel="noopener noreferrer"
          $primary={false}
        >
          {getLinkLabel(item.liveVersion, "liveVersion")}
        </GalleryActionLink>
      )}
      {item.projectUrl && (
        <GalleryActionLink
          href={item.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          $primary={false}
        >
          {getLinkLabel(item.projectUrl, "projectUrl")}
        </GalleryActionLink>
      )}
    </GalleryActions>
  );
};

const GalleryItem = ({ item }: GalleryItemProps) => {
  const hasCustomImage = item.returnImage || item.returnGif;
  const figmaFileKey = item.returnUrl ? getFigmaFileKey(item.returnUrl) : null;
  const showFigmaPreview = !hasCustomImage && figmaFileKey;
  const showIframePreview = !hasCustomImage && !figmaFileKey && item.returnUrl && isWebsiteUrl(item.returnUrl);

  return (
    <GalleryItemContainer>
      {hasCustomImage && (
        <GalleryItemImage>
          <img
            src={item.returnGif || item.returnImage || ""}
            alt={`${item.studentName}'s project`}
            loading="lazy"
          />
        </GalleryItemImage>
      )}

      {showFigmaPreview && (
        <FigmaPreviewContainer>
          <img
            src={getFigmaThumbnailUrl(figmaFileKey)}
            alt={`${item.studentName}'s Figma design`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <PreviewOverlay>
            <PreviewBadge $type="figma">Figma</PreviewBadge>
          </PreviewOverlay>
        </FigmaPreviewContainer>
      )}

      {showIframePreview && (
        <IframePreviewContainer>
          <iframe
            src={item.returnUrl!}
            title={`${item.studentName}'s project preview`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
          <PreviewOverlay>
            <PreviewBadge $type="website">Live Site</PreviewBadge>
          </PreviewOverlay>
        </IframePreviewContainer>
      )}

      <GalleryItemContent>
        <GalleryItemTitle>{item.title}</GalleryItemTitle>
        <GalleryItemStudent>by {item.studentName}</GalleryItemStudent>
        <GalleryItemDescription>
          {item.description.length > 150
            ? `${item.description.substring(0, 150)}...`
            : item.description
          }
        </GalleryItemDescription>
        {item.topics.length > 0 && (
          <GalleryTopicTags aria-label="Guide topics">
            {item.topics.map((topic) => (
              <GalleryTopicTag key={topic}>{topic}</GalleryTopicTag>
            ))}
          </GalleryTopicTags>
        )}
        <GalleryItemMeta>
          <span>Module {item.module.number}: {item.module.title}</span>
          <span>{item.recommendationCount} recommendation{item.recommendationCount !== 1 ? 's' : ''}</span>
        </GalleryItemMeta>
        <GalleryLinks item={item} />
      </GalleryItemContent>
    </GalleryItemContainer>
  );
};

export default GalleryItem;
