"use client";

import { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import {
  GalleryItemContainer,
  GalleryItemImage,
  GalleryItemContent,
  GalleryItemTitle,
  GalleryItemStudent,
  GalleryItemDescription,
  GalleryItemMeta,
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

// Check if URL is a Figma URL
const isFigmaUrl = (url: string): boolean => {
  return url.includes('figma.com/file') || url.includes('figma.com/design') || url.includes('figma.com/proto');
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

const GalleryItem = ({ item }: GalleryItemProps) => {
  const hasCustomImage = item.returnImage || item.returnGif;
  const figmaFileKey = item.returnUrl ? getFigmaFileKey(item.returnUrl) : null;
  const showFigmaPreview = !hasCustomImage && figmaFileKey;
  const showIframePreview = !hasCustomImage && !figmaFileKey && item.returnUrl && isWebsiteUrl(item.returnUrl);

  return (
    <GalleryItemContainer>
      {/* Priority 1: Custom uploaded image/gif */}
      {hasCustomImage && (
        <GalleryItemImage>
          {item.returnGif ? (
            <img
              src={item.returnGif}
              alt={`${item.studentName}'s project`}
              loading="lazy"
            />
          ) : (
            <img
              src={item.returnImage!}
              alt={`${item.studentName}'s project`}
              loading="lazy"
            />
          )}
        </GalleryItemImage>
      )}

      {/* Priority 2: Figma thumbnail */}
      {showFigmaPreview && (
        <FigmaPreviewContainer>
          <img
            src={getFigmaThumbnailUrl(figmaFileKey)}
            alt={`${item.studentName}'s Figma design`}
            loading="lazy"
            onError={(e) => {
              // Hide the image container if thumbnail fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <PreviewOverlay>
            <PreviewBadge $type="figma">Figma</PreviewBadge>
          </PreviewOverlay>
        </FigmaPreviewContainer>
      )}

      {/* Priority 3: Website iframe preview */}
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
        <GalleryItemMeta>
          <span>Module {item.module.number}: {item.module.title}</span>
          <span>{item.recommendationCount} recommendation{item.recommendationCount !== 1 ? 's' : ''}</span>
        </GalleryItemMeta>
        {item.returnUrl && (
          <a
            href={item.returnUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '12px',
              color: 'var(--primary-blue-100)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            View Project →
          </a>
        )}
      </GalleryItemContent>
    </GalleryItemContainer>
  );
};

export default GalleryItem;
