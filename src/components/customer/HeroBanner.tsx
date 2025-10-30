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
      <section className="relative bg-gradient-to-r from-primary to-primary/80 text-white overflow-hidden">
        <div className="w-full aspect-[16/9] md:aspect-[16/5] flex items-center justify-center">
          <div className="animate-pulse text-center relative z-10">
            <div className="inline-block bg-black/20 backdrop-blur-sm px-6 py-4 rounded-xl">
              <div className="h-8 bg-white/20 rounded mb-4 mx-auto max-w-md"></div>
              <div className="h-6 bg-white/20 rounded mb-6 mx-auto max-w-lg"></div>
            </div>
            <div className="h-10 bg-white/20 rounded mx-auto max-w-32 mt-4"></div>
          </div>
          
          {/* Decorative elements for visual interest */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white"></div>
            <div className="absolute top-1/3 right-20 w-16 h-16 rounded-full bg-white"></div>
          </div>
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="relative bg-gradient-to-r from-primary to-primary/80 text-white overflow-hidden">
        <div className="w-full aspect-[16/9] md:aspect-[16/5] flex items-center justify-center">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-block bg-black/30 backdrop-blur-sm px-6 py-4 rounded-xl">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4 text-white">
                Premium Organic Millets
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl mb-5 md:mb-6 opacity-90 text-white max-w-4xl mx-auto">
                Discover our exclusive collection of high-quality organic millets
              </p>
            </div>
            <Button size={isMobile ? "default" : "lg"} variant="secondary" asChild className="mt-2">
              <Link to="/products">Shop Now</Link>
            </Button>
          </div>
          
          {/* Decorative elements for visual interest */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white"></div>
            <div className="absolute top-1/3 right-20 w-16 h-16 rounded-full bg-white"></div>
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
        {/* Background Image with proper containment - No overlay by default */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentImageUrl})`,
          }}
        >
        </div>
        
        {/* Content Overlay - Only shown when there's content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="container mx-auto px-4 text-center">
            {/* Only show text container if there's content */}
            {(currentBanner.title || currentBanner.subtitle) && (
              <div className="inline-block bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
                {currentBanner.subtitle ? (
                  <p className="text-sm sm:text-base md:text-xl font-medium text-white max-w-3xl mx-auto">
                    {currentBanner.subtitle}
                  </p>
                ) : (
                  <h1 className="text-lg sm:text-2xl md:text-4xl font-medium text-white">
                    {currentBanner.title}
                  </h1>
                )}
              </div>
            )}
            
            {/* Show button if there's a link */}
            {currentBanner.link_url && (
              <div className="mt-4 md:mt-6">
                <Button size={isMobile ? "sm" : "default"} variant="secondary" asChild>
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
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-colors shadow-md"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-colors shadow-md"
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
      </div>
    </section>
  );
};

export default HeroBanner;
