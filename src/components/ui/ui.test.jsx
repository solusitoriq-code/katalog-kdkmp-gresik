import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Button,
  Badge,
  Input,
  Select,
  Sheet,
  Skeleton,
  EmptyState,
  Money,
  Num,
  DateText,
  SearchableSelect,
  Pagination,
} from './index';

describe('UI primitives', () => {
  it('renders Money with integer Rupiah and tabular-nums', () => {
    const html = renderToStaticMarkup(<Money value={72000} />);
    expect(html).toContain('tabular-nums');
    expect(html).toContain('Rp 72.000');
  });

  it('renders Num with locale formatting, suffix, and tabular-nums', () => {
    const html = renderToStaticMarkup(<Num value={1250} suffix="%" />);
    expect(html).toContain('tabular-nums');
    expect(html).toContain('1.250%');
  });

  it('renders DateText in Asia/Jakarta format (DD/MM/YYYY and HH.mm)', () => {
    const dateHtml = renderToStaticMarkup(
      <DateText value="2026-11-09T07:00:00+07:00" mode="date" />
    );
    expect(dateHtml).toContain('tabular-nums');
    expect(dateHtml).toContain('09/11/2026');

    const timeHtml = renderToStaticMarkup(
      <DateText value="07:00:00" mode="time" />
    );
    expect(timeHtml).toContain('07.00');

    const longHtml = renderToStaticMarkup(
      <DateText value="2026-11-09T07:05:00+07:00" mode="longDateTime" />
    );
    expect(longHtml).toContain('tabular-nums');
    expect(longHtml).toContain('09 November 2026 07:05');
  });

  it('renders Button variants with min-h-11 touch target', () => {
    const primary = renderToStaticMarkup(<Button variant="primary">Simpan</Button>);
    const secondary = renderToStaticMarkup(<Button variant="secondary">Batal</Button>);
    const ghost = renderToStaticMarkup(<Button variant="ghost">Tutup</Button>);
    expect(primary).toContain('bg-primary-700');
    expect(primary).toContain('min-h-11');
    expect(secondary).toContain('border-border');
    expect(ghost).toContain('bg-transparent');
  });

  it('renders Badge variants (ok, warn, mute, primary)', () => {
    expect(renderToStaticMarkup(<Badge variant="ok">Tersedia</Badge>)).toContain('bg-ok-50');
    expect(renderToStaticMarkup(<Badge variant="warn">Pre-Order</Badge>)).toContain('bg-warn-50');
    expect(renderToStaticMarkup(<Badge variant="mute">Habis</Badge>)).toContain('bg-mute-50');
    expect(renderToStaticMarkup(<Badge variant="primary">Unggulan</Badge>)).toContain('bg-primary-50');
  });

  it('renders Input and Select with validation error and supports Input prefix', () => {
    const inputHtml = renderToStaticMarkup(
      <Input label="Nama" error="Wajib diisi." />
    );
    expect(inputHtml).toContain('Wajib diisi.');
    expect(inputHtml).toContain('role="alert"');

    const prefixInputHtml = renderToStaticMarkup(
      <Input label="WhatsApp" prefix="+62" placeholder="81234567890" />
    );
    expect(prefixInputHtml).toContain('+62');
    expect(prefixInputHtml).toContain('placeholder="81234567890"');

    const selectHtml = renderToStaticMarkup(
      <Select
        label="Urutan"
        options={[{ value: 'ready', label: 'Tersedia Dahulu' }]}
        error="Pilih urutan."
      />
    );
    expect(selectHtml).toContain('Tersedia Dahulu');
    expect(selectHtml).toContain('Pilih urutan.');
  });

  it('renders Sheet as mobile bottom sheet and md+ right drawer when open', () => {
    const closedHtml = renderToStaticMarkup(
      <Sheet open={false} title="Keranjang">
        Isi
      </Sheet>
    );
    expect(closedHtml).toBe('');

    const openHtml = renderToStaticMarkup(
      <Sheet open={true} title="Keranjang" footer={<div>Footer</div>}>
        Isi
      </Sheet>
    );
    expect(openHtml).toContain('inset-x-0 bottom-0');
    expect(openHtml).toContain('md:inset-y-0 md:right-0');
    expect(openHtml).toContain('md:w-[420px]');
    expect(openHtml).toContain('Keranjang');
    expect(openHtml).toContain('Footer');
  });

  it('renders Skeleton and EmptyState (max 1 line + 1 action)', () => {
    const skelHtml = renderToStaticMarkup(<Skeleton className="h-6 w-24" />);
    expect(skelHtml).toContain('animate-pulse');

    const emptyHtml = renderToStaticMarkup(
      <EmptyState message="Koperasi tidak ditemukan." actionLabel="Reset" onAction={() => {}} />
    );
    expect(emptyHtml).toContain('Koperasi tidak ditemukan.');
    expect(emptyHtml).toContain('Reset');
  });

  it('renders SearchableSelect with label, placeholder, and error message', () => {
    const html = renderToStaticMarkup(
      <SearchableSelect
        label="Kecamatan"
        value=""
        options={[
          { value: 'sub-1', label: 'Sidayu (35.25.09)' },
          { value: 'sub-2', label: 'Bungah (35.25.12)' },
        ]}
        placeholder="Pilih kecamatan..."
        error="Wajib memilih kecamatan."
      />
    );
    expect(html).toContain('Kecamatan');
    expect(html).toContain('Pilih kecamatan...');
    expect(html).toContain('Wajib memilih kecamatan.');
    expect(html).toContain('role="combobox"');
  });

  it('renders Pagination with page numbers 1, 2, 3 ..., tabular-nums and prev/next buttons', () => {
    // Multi-page with dots
    const htmlMulti = renderToStaticMarkup(
      <Pagination
        currentPage={1}
        totalPages={20}
        totalItems={200}
        pageSize={10}
        onPageChange={() => {}}
      />
    );
    expect(htmlMulti).toContain('Navigasi Halaman');
    expect(htmlMulti).toContain('Menampilkan');
    expect(htmlMulti).toContain('1');
    expect(htmlMulti).toContain('10');
    expect(htmlMulti).toContain('200');
    expect(htmlMulti).toContain('...');
    expect(htmlMulti).toContain('Halaman 1');
    expect(htmlMulti).toContain('Halaman 2');
    expect(htmlMulti).toContain('Halaman 20');
    expect(htmlMulti).toContain('disabled=""'); // Previous button disabled on page 1

    // Page in middle
    const htmlMiddle = renderToStaticMarkup(
      <Pagination
        currentPage={10}
        totalPages={20}
        totalItems={200}
        pageSize={10}
        onPageChange={() => {}}
      />
    );
    expect(htmlMiddle).toContain('Halaman 10');
    expect(htmlMiddle).toContain('Halaman 9');
    expect(htmlMiddle).toContain('Halaman 11');

    // Single page returns null or minimal
    const htmlSingle = renderToStaticMarkup(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={5}
        pageSize={10}
        onPageChange={() => {}}
      />
    );
    expect(htmlSingle).toContain('Menampilkan');
    expect(htmlSingle).not.toContain('Halaman 2');
  });
});

