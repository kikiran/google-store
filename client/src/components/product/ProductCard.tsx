import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/Price';
import { RatingStars } from '@/components/ui/Rating';
import type { ProductSummary } from '@/types';
import clsx from 'clsx';

interface ProductCardProps {
  product: ProductSummary;
}

export default function ProductCard({ product }: ProductCardProps) {
  const outOfStock = !product.stock?.inStock && product.stock?.quantity === 0;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden bg-ink-50 aspect-[4/5] mb-3 transition-transform duration-200 group-hover:scale-[1.02]">
        <img
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.alt || product.name}
          className="w-full h-full object-contain p-4"
          loading="lazy"
        />
        {product.badge && (
          <span className="absolute top-3 left-3">
            <Badge color={product.badge === 'New' ? 'brand' : 'success'}>{product.badge}</Badge>
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-medium text-ink-600 bg-white px-4 py-1.5 rounded-full">Out of stock</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-ink-900 mb-0.5">{product.name}</h3>
      <p className="text-sm text-ink-500 line-clamp-2 mb-2">{product.tagline}</p>
      <PriceDisplay price={product.basePrice} compareAt={product.compareAtPrice} size="sm" />
      <div className="mt-1.5">
        <RatingStars value={product.rating} count={product.reviewCount} size={12} />
      </div>
    </Link>
  );
}
