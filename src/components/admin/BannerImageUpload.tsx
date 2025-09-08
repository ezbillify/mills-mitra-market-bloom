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
  // Determine if this is for mobile or desktop based on the label
  const isMobileUpload = label?.toLowerCase().includes('mobile');
  
  const getRecommendedSize = () => {
    if (isMobileUpload) {
      return "Recommended size: 1125 x 600px (mobile banners)";
    }
    return "Recommended size: 1920 x 600px (desktop banners)";
  };

  const getSizeGuideline = () => {
    if (isMobileUpload) {
      return "Optimal for mobile screens - 16:9 aspect ratio recommended";
    }
    return "Optimal for desktop screens - 16:5 aspect ratio recommended";
  };

  return (
    <div className="space-y-2">
      <ImageUpload
        currentImage={currentImage}
        onImageChange={onImageChange}
        label={label}
        recommendedSize={getRecommendedSize()}
        maxSizeText="Maximum file size: 10MB"
      />
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border">
        <p className="font-medium mb-1">{getSizeGuideline()}</p>
        <div className="space-y-1">
          {isMobileUpload ? (
            <>
              <p>• Primary: 1125 x 600px (high-DPI phones)</p>
              <p>• Alternative: 750 x 400px (standard phones)</p>
              <p>• Aspect ratio: 16:9 or 3:2</p>
            </>
          ) : (
            <>
              <p>• Primary: 1920 x 600px (desktop/laptop)</p>
              <p>• Alternative: 1440 x 450px (smaller screens)</p>
              <p>• Aspect ratio: 16:5 (3.2:1)</p>
            </>
          )}
          <p>• Format: JPG, PNG, or WebP</p>
          <p>• Keep text/logos centered for best mobile display</p>
        </div>
      </div>
    </div>
  );
};

export default BannerImageUpload;
