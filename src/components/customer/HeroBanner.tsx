import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
}

const HeroBanner = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchBanners();
    checkMobileView();
    
    // Add resize listener for responsive behavior
    const handleResize = () => {
      checkMobileView();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const checkMobileView = () => {
    setIsMobile(window.innerWidth < 768); // md breakpoint
  };

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching banners:', error);
        return;
      }

      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const getCurrentImageUrl = (banner: Banner) => {
    // Use mobile image if available and we're on mobile, otherwise use desktop image
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url;
    }
    return banner.image_url;
  };

  if (loading) {
    return (
      <section className="relative bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="w-full aspect-[16/9] md:aspect-[16/5] flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-12 bg-white/20 rounded mb-6 mx-auto max-w-md"></div>
            <div className="h-6 bg-white/20 rounded mb-8 mx-auto max-w-lg"></div>
            <div className="h-10 bg-white/20 rounded mx-auto max-w-32"></div>
          </div>
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="relative bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="w-full aspect-[16/9] md:aspect-[16/5] flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6">
              Premium Fabrics & Materials
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 opacity-90 max-w-4xl mx-auto">
              Discover our exclusive collection of high-quality fabrics
            </p>
            <Button size={isMobile ? "default" : "lg"} variant="secondary" asChild>
              <Link to="/products">Shop Now</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentSlide];
  const currentImageUrl = getCurrentImageUrl(currentBanner);

  return (
    <section className="relative overflow-hidden bg-gray-100 -mb-1">
      {/* Fixed aspect ratio container */}
      <div className="w-full aspect-[16/9] md:aspect-[16/5] relative">
        {/* Background Image with proper containment */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentImageUrl})`,
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        {/* Content Overlay - Made Optional/Subtle */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="container mx-auto px-4 text-center text-white">
            {/* Only show title OR subtitle, not both to avoid overlap */}
            {currentBanner.subtitle ? (
              <p className="text-sm sm:text-base md:text-xl font-medium opacity-90 max-w-3xl mx-auto">
                {currentBanner.subtitle}
              </p>
            ) : (
              <h1 className="text-lg sm:text-2xl md:text-4xl font-medium opacity-90">
                {currentBanner.title}
              </h1>
            )}
            
            {/* Only show button if there's a link and we have space */}
            {currentBanner.link_url && !isMobile && (
              <div className="mt-4">
                <Button size="sm" variant="secondary" asChild className="opacity-90">
                  <Link to={currentBanner.link_url}>Shop Now</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls - Only show if multiple banners */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
              aria-label="Next banner"
            >
              <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* View type indicator */}
        <div className="absolute bottom-2 right-2 z-20">
          <div className="text-xs text-white/70 bg-black/30 px-2 py-1 rounded">
            {isMobile ? 'Mobile' : 'Desktop'} View
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
