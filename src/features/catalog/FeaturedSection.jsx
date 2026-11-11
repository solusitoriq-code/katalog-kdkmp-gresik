import { ProductCard } from './ProductCard';

export function FeaturedSection({ products = [], onAddProduct }) {
  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <section aria-label="Produk Unggulan" className="space-y-3">
      <h2 className="text-base font-bold text-text">Unggulan</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0 xl:grid-cols-4">
        {products.map((product) => (
          <div
            key={`featured-${product.id}`}
            className="w-44 shrink-0 snap-start md:w-56 lg:w-auto"
          >
            <ProductCard product={product} onAdd={onAddProduct} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturedSection;

