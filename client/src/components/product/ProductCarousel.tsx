import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { ProductSummary } from '@/types';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  items: ProductSummary[];
  viewAllHref?: string;
}

export default function ProductCarousel({ title, subtitle, items, viewAllHref }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium text-ink-900">{title}</h2>
          {subtitle && <p className="text-sm text-ink-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-full border border-ink-200 hover:bg-ink-50">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full border border-ink-200 hover:bg-ink-50">
            <ChevronRight size={18} />
          </button>
          {viewAllHref && (
            <Link to={viewAllHref} className="text-sm text-brand-600 hover:text-brand-700 font-medium ml-2">
              View all
            </Link>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-1 px-1"
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-[240px] max-w-[240px] snap-start shrink-0">
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
