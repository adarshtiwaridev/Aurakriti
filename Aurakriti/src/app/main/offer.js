import React, { useState, useEffect } from 'react';

const Offer = () => {
  // Dummy data for images
const slides = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1600&q=80",
    title: "Summer Collection 2026",
    subtitle: "Trendy. Comfortable. You."
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80",
    title: "Premium Electronics",
    subtitle: "Upgrade your lifestyle"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1503342217505-b0a15cf70489?auto=format&fit=crop&w=1600&q=80",
    title: "Men’s Essentials",
    subtitle: "Minimal. Powerful. Classic."
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
    title: "Women’s Fashion",
    subtitle: "Style that speaks"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=80",
    title: "Home & Living",
    subtitle: "Make your space yours"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1513708927688-890c14fa9a5d?auto=format&fit=crop&w=1600&q=80",
    title: "Accessories",
    subtitle: "Complete your look"
  }
];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    /* h-[60vh] makes it slightly more than half the screen height */
    <div className="relative w-full h-[60vh] overflow-hidden bg-gray-100">
      
      {/* Wrapper for the images - uses transform for smooth sliding */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full h-full flex-shrink-0">
            <img
              src={slide.url}
              alt="Promotion"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Fancy Glass-morphism Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex 
                ? "w-8 h-2 bg-white" 
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Subtle Overlay Shadow to make it pop against the Navbar */}
      <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/10 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Offer;