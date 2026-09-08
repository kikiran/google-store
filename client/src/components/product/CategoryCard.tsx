import { Link } from 'react-router-dom';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/products/${category.slug}`}
      className="group relative rounded-3xl overflow-hidden bg-ink-50 aspect-[4/3] flex items-end transition-transform duration-200 hover:scale-[1.02]"
    >
      {category.imageUrl && (
        <img src={category.imageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
      <div className="relative p-6 text-white">
        <h3 className="text-lg font-medium mb-1">{category.name}</h3>
        <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
          Shop &rarr;
        </span>
      </div>
    </Link>
  );
}
