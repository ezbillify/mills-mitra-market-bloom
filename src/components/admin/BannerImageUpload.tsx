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
      <div className="text-xs text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
        <p className="font-medium mb-2 text-blue-800">Banner Design Guidelines:</p>
        <div className="space-y-2">
          {isMobileUpload ? (
            <div className="space-y-1">
              <p className="font-medium">Mobile Banners (16:9 aspect ratio):</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-blue-700">
                <li>Primary: 1125 x 600px (high-DPI phones)</li>
                <li>Alternative: 750 x 400px (standard phones)</li>
                <li><strong>Keep important content within the center 70%</strong></li>
                <li>Safe zone: 100px from each side for text placement</li>
                <li>Use high contrast for text readability if added</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Desktop Banners (16:5 aspect ratio):</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-blue-700">
                <li>Primary: 1920 x 600px (desktop/laptop)</li>
                <li>Alternative: 1440 x 450px (smaller screens)</li>
                <li><strong>Keep important content within the center 80%</strong></li>
                <li>Safe zone: 200px from each side for text placement</li>
                <li>Design should be visually appealing without text</li>
              </ul>
            </div>
          )}
          <div className="pt-2 border-t border-blue-100">
            <p className="font-medium text-blue-800">Universal Best Practices:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-blue-700">
              <li>Format: JPG, PNG, or WebP</li>
              <li>File size: Under 10MB for optimal loading</li>
              <li><strong>Design should communicate value even without text overlay</strong></li>
              <li>Use vibrant, high-quality images that represent your brand</li>
              <li>Avoid placing critical information near edges</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerImageUpload;
