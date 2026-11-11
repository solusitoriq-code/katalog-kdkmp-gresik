import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router';
import {
  StoreHeader,
  ProductCard,
  CatalogToolbar,
  CategorySidebar,
  FeaturedSection,
  CatalogSkeleton,
  calculateDiscountPercent,
  resolveStockStatus,
} from './index';
import { VillageCatalogPage } from '../../pages/VillageCatalogPage';

describe('Catalog components (S05)', () => {
  it('renders StoreHeader with Desa/Kelurahan location, store hours (including overnight), free delivery Money, truncated delivery_note, and WA + Maps links', () => {
    const golokan = {
      id: 'v-golokan',
      name: 'Golokan',
      slug: 'golokan',
      type: 'desa',
      business_name: 'KDKMP Desa Golokan',
      subdistrict_name: 'Sidayu',
      subdistrict_slug: 'sidayu',
      whatsapp_number: '6281234567801',
      gmaps_url: 'https://maps.google.com/?q=-6.9925,112.5644',
      logo_url: null,
      opening_hour: '07:00',
      closing_hour: '20:00',
      free_delivery_min: 50000,
      delivery_note: 'Gratis ongkir area Desa Golokan min. belanja Rp 50.000',
    };

    const htmlOpen = renderToStaticMarkup(
      <StoreHeader village={golokan} now="10:00" />
    );

    expect(htmlOpen).toContain('KDKMP Desa Golokan');
    expect(htmlOpen).toContain('Desa Golokan · Kec. Sidayu');
    expect(htmlOpen).toContain('Buka · 07.00–20.00');
    expect(htmlOpen).toContain('Gratis ongkir min.');
    expect(htmlOpen).toContain('Rp 50.000');
    expect(htmlOpen).toContain(
      'Gratis ongkir area Desa Golokan min. belanja Rp 50.000'
    );
    expect(htmlOpen).toContain('truncate');
    expect(htmlOpen).toContain('https://wa.me/6281234567801');
    expect(htmlOpen).toContain('https://maps.google.com/?q=-6.9925,112.5644');

    const sukorejoOvernight = {
      ...golokan,
      id: 'v-sukorejo',
      name: 'Sukorejo',
      slug: 'sukorejo',
      business_name: 'KDKMP Desa Sukorejo',
      opening_hour: '16:00',
      closing_hour: '01:00',
    };

    const htmlAfterMidnight = renderToStaticMarkup(
      <StoreHeader village={sukorejoOvernight} now="00:30" />
    );
    expect(htmlAfterMidnight).toContain('Buka · 16.00–01.00');
    expect(htmlAfterMidnight).toContain('bg-ok-50');

    const htmlMiddayClosed = renderToStaticMarkup(
      <StoreHeader village={sukorejoOvernight} now="14:00" />
    );
    expect(htmlMiddayClosed).toContain('Tutup · Buka 16.00');
    expect(htmlMiddayClosed).toContain('bg-mute-50');
  });

  it('renders ProductCard with aspect-[4/3] bg-white object-contain, stock badges (ok/warn/mute), opacity-60 when habis, Money price, strikethrough Money + discount Num%, and Tambah button', () => {
    expect(calculateDiscountPercent(72000, 78000)).toBe(8);
    expect(calculateDiscountPercent(62000, null)).toBe(0);
    expect(resolveStockStatus('ready')).toBe('ready');
    expect(resolveStockStatus('pre-order')).toBe('pre-order');
    expect(resolveStockStatus('habis')).toBe('habis');

    const discountedProduct = {
      id: 'p1',
      name: 'Beras Pandan Wangi 5kg',
      category_name: 'Beras & Pangan Pokok',
      price: 72000,
      original_price: 78000,
      unit: 'karung',
      stock_status: 'ready',
      image_url: 'https://example.com/beras.webp',
    };

    const htmlReady = renderToStaticMarkup(
      <ProductCard product={discountedProduct} />
    );

    expect(htmlReady).toContain('aspect-[4/3]');
    expect(htmlReady).toContain('bg-white');
    expect(htmlReady).toContain('object-contain');
    expect(htmlReady).toContain('loading="lazy"');
    expect(htmlReady).toContain('width="400"');
    expect(htmlReady).toContain('height="300"');
    expect(htmlReady).toContain('Tersedia');
    expect(htmlReady).toContain('bg-ok-50');
    expect(htmlReady).toContain('line-clamp-2');
    expect(htmlReady).toContain('Rp 72.000');
    expect(htmlReady).toContain('/ karung');
    expect(htmlReady).toContain('Rp 78.000');
    expect(htmlReady).toContain('line-through');
    expect(htmlReady).toContain('-');
    expect(htmlReady).toContain('8%');
    expect(htmlReady).toContain('Tambah');
    expect(htmlReady).not.toContain('opacity-60');

    const preOrderProduct = {
      ...discountedProduct,
      id: 'p2',
      stock_status: 'pre-order',
      original_price: null,
    };
    const htmlWarn = renderToStaticMarkup(
      <ProductCard product={preOrderProduct} />
    );
    expect(htmlWarn).toContain('Pre-Order');
    expect(htmlWarn).toContain('bg-warn-50');

    const soldOutProduct = {
      ...discountedProduct,
      id: 'p3',
      stock_status: 'habis',
    };
    const htmlHabis = renderToStaticMarkup(
      <ProductCard product={soldOutProduct} />
    );
    expect(htmlHabis).toContain('Habis');
    expect(htmlHabis).toContain('bg-mute-50');
    expect(htmlHabis).toContain('opacity-60');
    expect(htmlHabis).toContain('disabled=""');
  });

  it('hides FeaturedSection when empty and renders horizontal scroll + lg grid when populated', () => {
    expect(renderToStaticMarkup(<FeaturedSection products={[]} />)).toBe('');

    const htmlFeatured = renderToStaticMarkup(
      <FeaturedSection
        products={[
          {
            id: 'f1',
            name: 'Minyak Goreng Kemasan 2L',
            price: 35000,
            original_price: 38000,
            unit: 'pouch',
            stock_status: 'ready',
            is_featured: true,
          },
        ]}
      />
    );
    expect(htmlFeatured).toContain('Unggulan');
    expect(htmlFeatured).toContain('overflow-x-auto');
    expect(htmlFeatured).toContain('lg:grid-cols-3');
    expect(htmlFeatured).toContain('xl:grid-cols-4');
  });

  it('renders CatalogToolbar with sticky mobile search, category chips, 4 sort options, and CategorySidebar with Num counts', () => {
    const categories = [
      { id: 'c1', name: 'Beras & Pangan Pokok' },
      { id: 'c2', name: 'Minyak & Gula' },
    ];

    const toolbarHtml = renderToStaticMarkup(
      <CatalogToolbar
        searchValue="beras"
        categories={categories}
        selectedCategory="Beras & Pangan Pokok"
        sortBy="termurah"
      />
    );
    expect(toolbarHtml).toContain('sticky');
    expect(toolbarHtml).toContain('value="beras"');
    expect(toolbarHtml).toContain('Tersedia Dahulu');
    expect(toolbarHtml).toContain('Harga Termurah');
    expect(toolbarHtml).toContain('Harga Termahal');
    expect(toolbarHtml).toContain('Nama (A-Z)');
    expect(toolbarHtml).toContain('Beras &amp; Pangan Pokok');

    const sidebarHtml = renderToStaticMarkup(
      <CategorySidebar
        categories={categories}
        countsByCategory={{ 'Beras & Pangan Pokok': 3, 'Minyak & Gula': 2 }}
        totalCount={5}
        selectedCategory="Beras & Pangan Pokok"
      />
    );
    expect(sidebarHtml).toContain('Semua Kategori');
    expect(sidebarHtml).toContain('tabular-nums');
    expect(sidebarHtml).toContain('5');
    expect(sidebarHtml).toContain('3');
  });

  it('renders VillageCatalogPage 404 on reserved slug and initial CatalogSkeleton on valid slug', () => {
    const reservedHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/sidayu/admin']}>
        <Routes>
          <Route path="/:kecamatan/:desa" element={<VillageCatalogPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(reservedHtml).toContain('Halaman tidak ditemukan.');

    const validHtml = renderToStaticMarkup(
      <MemoryRouter
        initialEntries={['/sidayu/golokan?q=beras&kat=Minyak&sort=termurah']}
      >
        <Routes>
          <Route path="/:kecamatan/:desa" element={<VillageCatalogPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(validHtml).toContain('aria-busy="true"');

    const skelHtml = renderToStaticMarkup(<CatalogSkeleton count={4} />);
    expect(skelHtml).toContain('xl:grid-cols-4');
  });
});

