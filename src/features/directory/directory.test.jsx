import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router';
import { VillageCard } from './VillageCard';
import { SubdistrictFilter } from './SubdistrictFilter';
import { VillageGridSkeleton } from './VillageGridSkeleton';
import { DirectorySearchInput } from './DirectorySearchInput';
import { HomePage } from '../../pages/HomePage';
import { SubdistrictPage } from '../../pages/SubdistrictPage';

describe('Directory components (S04)', () => {
  it('renders VillageCard as a Link with initials, Desa/Kel location, store badge, and Num product count', () => {
    const desaVillage = {
      id: 'v-golokan',
      name: 'Golokan',
      slug: 'golokan',
      type: 'desa',
      business_name: 'KDKMP Desa Golokan',
      subdistrict_name: 'Sidayu',
      subdistrict_slug: 'sidayu',
      logo_url: null,
      opening_hour: '07:00',
      closing_hour: '20:00',
      product_count: 10,
    };

    const htmlDesa = renderToStaticMarkup(
      <MemoryRouter>
        <VillageCard village={desaVillage} now="10:00" />
      </MemoryRouter>
    );

    expect(htmlDesa).toContain('href="/sidayu/golokan"');
    expect(htmlDesa).toContain('bg-primary-50');
    expect(htmlDesa).toContain('text-primary-700');
    expect(htmlDesa).toContain('KDKMP Desa Golokan');
    expect(htmlDesa).toContain('Desa Golokan · Kec. Sidayu');
    expect(htmlDesa).toContain('Buka · 07.00–20.00');
    expect(htmlDesa).toContain('10');
    expect(htmlDesa).toContain('tabular-nums');

    const kelurahanVillage = {
      ...desaVillage,
      id: 'v-kel',
      name: 'Sidokumpul',
      slug: 'sidokumpul',
      type: 'kelurahan',
      business_name: 'KDKMP Kelurahan Sidokumpul',
      subdistrict_name: 'Gresik',
      subdistrict_slug: 'gresik',
      product_count: 25,
    };

    const htmlKel = renderToStaticMarkup(
      <MemoryRouter>
        <VillageCard village={kelurahanVillage} now="22:00" />
      </MemoryRouter>
    );

    expect(htmlKel).toContain('href="/gresik/sidokumpul"');
    expect(htmlKel).toContain('Kel. Sidokumpul · Kec. Gresik');
    expect(htmlKel).toContain('Tutup · Buka 07.00');
    expect(htmlKel).toContain('25');
  });

  it('hides SubdistrictFilter when only 1 subdistrict is active, and renders chips/sidebar with Num counts when > 1', () => {
    const singleSub = [
      { id: 's1', name: 'Sidayu', slug: 'sidayu', is_active: true },
    ];
    const hiddenHtml = renderToStaticMarkup(
      <SubdistrictFilter
        subdistricts={singleSub}
        countsBySlug={{ sidayu: 2 }}
        totalCount={2}
      />
    );
    expect(hiddenHtml).toBe('');

    const multiSub = [
      { id: 's1', name: 'Sidayu', slug: 'sidayu', is_active: true },
      { id: 's2', name: 'Bungah', slug: 'bungah', is_active: true },
    ];
    const visibleHtml = renderToStaticMarkup(
      <SubdistrictFilter
        subdistricts={multiSub}
        countsBySlug={{ sidayu: 2, bungah: 5 }}
        totalCount={7}
        selectedSlug="sidayu"
      />
    );

    expect(visibleHtml).toContain('Semua Kecamatan');
    expect(visibleHtml).toContain('Kec. Sidayu');
    expect(visibleHtml).toContain('Kec. Bungah');
    expect(visibleHtml).toContain('overflow-x-auto');
    expect(visibleHtml).toContain('md:flex-wrap');
    expect(visibleHtml).toContain('lg:flex-col');
    expect(visibleHtml).toContain('tabular-nums');
  });

  it('renders DirectorySearchInput and VillageGridSkeleton', () => {
    const searchHtml = renderToStaticMarkup(
      <DirectorySearchInput value="golokan" />
    );
    expect(searchHtml).toContain('value="golokan"');
    expect(searchHtml).toContain('aria-label="Hapus pencarian"');

    const skelHtml = renderToStaticMarkup(<VillageGridSkeleton count={3} />);
    expect(skelHtml).toContain('animate-pulse');
    expect(skelHtml).toContain('lg:grid-cols-3');
  });

  it('renders HomePage with title, synced ?q= query param, and initial skeleton', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/?q=golokan&kec=sidayu']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain('Katalog KDKMP Gresik');
    expect(html).toContain('value="golokan"');
    expect(html).toContain('aria-busy="true"');
  });

  it('renders SubdistrictPage 404 on reserved slug and initial skeleton on valid slug', () => {
    const reservedHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/:kecamatan" element={<SubdistrictPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(reservedHtml).toContain('Halaman tidak ditemukan.');

    const validHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/sidayu?q=beras']}>
        <Routes>
          <Route path="/:kecamatan" element={<SubdistrictPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(validHtml).toContain('aria-busy="true"');
  });
});

