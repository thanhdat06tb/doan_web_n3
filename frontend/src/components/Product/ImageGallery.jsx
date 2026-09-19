import React, { useEffect, useState } from 'react';
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
        imageClassName: image.imageClassName || '',
      };
    })
    .filter((image) => image.src);

  let badgeStatus = '';
  let badgeClass = '';
  if (availableQty <= 0) {
    badgeStatus = 'Hết hàng';
    badgeClass = 'bg-rose-600 text-white';
  } else if (availableQty <= 3) {
    badgeStatus = 'Sắp hết';
    badgeClass = 'bg-[#f97316] text-white';
  } else {
    badgeStatus = 'Còn hàng';
    badgeClass = 'bg-[#0f766e] text-white';
  }

  useEffect(() => {
    if (!isAutoPlay || normalizedImages.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
    }, 2000);

    return () => clearInterval(timer);
  }, [isAutoPlay, normalizedImages.length, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  };

  if (normalizedImages.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="group relative aspect-[4/3] min-h-[300px] w-full overflow-hidden rounded-2xl border border-[#f3c17a] bg-[#fff1d6] shadow-[0_24px_54px_rgba(126,50,13,0.18)] md:aspect-video"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_25%),radial-gradient(circle_at_85%_70%,rgba(15,118,110,0.14),transparent_30%)]" />
        <img
          key={currentIndex}
          src={normalizedImages[currentIndex]?.src || fallbackImage}
          alt={normalizedImages[currentIndex]?.label || `Product ${currentIndex}`}
          onError={(event) => { event.currentTarget.src = fallbackImage; }}
          className={`relative z-10 h-full w-full object-contain p-4 transition duration-700 ease-out ${normalizedImages[currentIndex]?.imageClassName || ''}`}
        />

        <div className={`absolute left-4 top-4 z-20 rounded-full px-4 py-1.5 text-sm font-bold shadow-lg backdrop-blur-sm ${badgeClass}`}>
          {badgeStatus}
        </div>

        <div className="absolute bottom-4 left-4 z-20 rounded-full bg-[#083344]/90 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
          {normalizedImages[currentIndex]?.label}
        </div>

        {normalizedImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/85 text-[#083344] opacity-0 shadow-md transition-all hover:bg-[#083344] hover:text-white group-hover:opacity-100"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/85 text-[#083344] opacity-0 shadow-md transition-all hover:bg-[#083344] hover:text-white group-hover:opacity-100"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {normalizedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {normalizedImages.map((img, idx) => (
            <button
              key={img.src}
              onClick={() => setCurrentIndex(idx)}
              className={`h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-[#fff1d6] transition-all duration-200 ${
                currentIndex === idx
                  ? 'opacity-100 ring-2 ring-[#f97316] ring-offset-2 ring-offset-[#fff6e7]'
                  : 'opacity-70 hover:opacity-100 hover:ring-2 hover:ring-[#f3c17a] hover:ring-offset-2 hover:ring-offset-[#fff6e7]'
              }`}
            >
              <img
                src={img.src}
                alt={img.label}
                onError={(event) => { event.currentTarget.src = fallbackImage; }}
                className={`h-full w-full object-contain p-2 ${img.imageClassName || ''}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
