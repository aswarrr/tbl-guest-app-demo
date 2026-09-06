import { useState } from "react";
import type { RestaurantImageSlide } from "../../utils/restaurants";

type Props = {
  slides: RestaurantImageSlide[];
  placeholderLabel: string;
  variant?: "card" | "hero";
  showCaption?: boolean;
};

export default function RestaurantImageSlider({
  slides,
  placeholderLabel,
  variant = "card",
  showCaption = false,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleIndex = slides.length > 0 ? Math.min(activeIndex, slides.length - 1) : 0;
  const activeSlide = slides[visibleIndex] ?? null;
  const canSlide = slides.length > 1;

  return (
    <div className={`restaurant-slider restaurant-slider-${variant}`}>
      {activeSlide ? (
        <img
          src={activeSlide.url}
          alt={activeSlide.alt}
          className="restaurant-slider-image"
        />
      ) : (
        <div className="restaurant-slider-placeholder">
          <span>{placeholderLabel}</span>
        </div>
      )}

      {showCaption && activeSlide?.caption ? (
        <div className="restaurant-slider-caption">{activeSlide.caption}</div>
      ) : null}

      {canSlide ? (
        <>
          <button
            type="button"
            className="restaurant-slider-nav restaurant-slider-nav-prev"
            onClick={() =>
              setActiveIndex((visibleIndex - 1 + slides.length) % slides.length)
            }
            aria-label="Previous restaurant image"
          >
            ‹
          </button>

          <button
            type="button"
            className="restaurant-slider-nav restaurant-slider-nav-next"
            onClick={() => setActiveIndex((visibleIndex + 1) % slides.length)}
            aria-label="Next restaurant image"
          >
            ›
          </button>

          <div className="restaurant-slider-dots" aria-hidden="true">
            {slides.map((slide, index) => (
              <span
                key={slide.id}
                className={
                  index === visibleIndex
                    ? "restaurant-slider-dot restaurant-slider-dot-active"
                    : "restaurant-slider-dot"
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
