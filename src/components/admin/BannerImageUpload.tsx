
import ImageUpload from "./ImageUpload";

interface BannerImageUploadProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
}

const BannerImageUpload = ({ 
  currentImage, 
  onImageChange, 
  label = "Banner Image" 
}: BannerImageUploadProps) => {
  return (
    <ImageUpload
      currentImage={currentImage}
      onImageChange={onImageChange}
      label={label}
      recommendedSize="Recommended size: 1920x600px for desktop banners"
      maxSizeText="Maximum file size: 10MB"
    />
  );
};

export default BannerImageUpload;
