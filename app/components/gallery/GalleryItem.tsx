import { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import { GalleryItemContainer, GalleryItemImage, GalleryItemContent, GalleryItemTitle, GalleryItemStudent, GalleryItemDescription, GalleryItemMeta } from "./styles";

interface GalleryItemProps {
  item: GalleryItemType;
}

const GalleryItem = ({ item }: GalleryItemProps) => {
  return (
    <GalleryItemContainer>
      {(item.returnImage || item.returnGif) && (
        <GalleryItemImage>
          {item.returnGif ? (
            <img 
              src={item.returnGif || '../assets/placeholder.png'} 
              alt={`${item.studentName}'s project`}
              loading="lazy"
            />
          ) : (
            <img 
              src={item.returnImage || '../assets/placeholder.png'} 
              alt={`${item.studentName}'s project`}
              loading="lazy"
            />
          )}
        </GalleryItemImage>
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

