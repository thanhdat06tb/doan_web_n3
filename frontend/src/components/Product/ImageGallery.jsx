import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import fallbackImage from '../../assets/hero.png';

const ImageGallery = ({ images, availableQty }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const normalizedImages = (images || [])
    .map((image, index) => {
      if (typeof image === 'string') {
        return { src: image, label: `Góc ${index + 1}`, imageClassName: '' };
      }

      return {
        src: image.image_url,
        label: image.label || `Góc ${index + 1}`,
        imageClassName: '',
      };
    })
    .filter((image) => image.src);

  // Determine badge status
  let badgeStatus = '';
  let badgeClass = '';
  if (availableQty <= 0) {
    badgeStatus = 'Hết hàng';
    badgeClass = 'bg-red-500 text-white';
  } else if (availableQty <= 3) {
    badgeStatus = 'Sắp hết';
    badgeClass = 'bg-amber-500 text-white';
  } else {
    badgeStatus = 'Còn hàng';
    badgeClass = 'bg-emerald-500 text-white';
  }

  // Auto slider logic
  useEffect(() => {
    if (!isAutoPlay || normalizedImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
    }, 2000);
    
    return () => clearInterval(timer);
  }, [isAutoPlay, normalizedImages.length, currentIndex]); // depend on currentIndex to reset timer on manual click

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  };

  if (normalizedImages.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div 
        className="relative w-full aspect-[4/3] md:aspect-video bg-slate-100 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/25 group min-h-[300px]"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        <div className="absolute inset-0 transition-all duration-500 ease-in-out">
          <img 
            key={currentIndex} 
            src={normalizedImages[currentIndex]?.src || fallbackImage} 
            alt={normalizedImages[currentIndex]?.label || `Product ${currentIndex}`} 
            onError={(event) => { event.currentTarget.src = fallbackImage; }}
            className={`w-full h-full object-cover fade-enter fade-enter-active transition duration-700 ease-out ${normalizedImages[currentIndex]?.imageClassName || ''}`}
          />
        </div>
        
        {/* Badge */}
        <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm ${badgeClass}`}>
          {badgeStatus}
        </div>

        <div className="absolute bottom-4 left-4 rounded-full bg-slate-950/70 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
          {normalizedImages[currentIndex]?.label}
        </div>

        {/* Navigation Arrows (Visible on hover) */}
        {normalizedImages.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/75 hover:bg-white text-slate-800 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/75 hover:bg-white text-slate-800 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {normalizedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {normalizedImages.map((img, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden transition-all duration-200 snap-start
                ${currentIndex === idx ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 opacity-100' : 'opacity-60 hover:opacity-100 hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 hover:ring-offset-slate-950'}`}
            >
              <img
                src={img.src}
                alt={img.label}
                onError={(event) => { event.currentTarget.src = fallbackImage; }}
                className={`w-full h-full object-cover ${img.imageClassName || ''}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
