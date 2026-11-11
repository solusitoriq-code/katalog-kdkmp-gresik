import { useState } from 'react';
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
} from '../components/ui';

const SORT_OPTIONS = [
  { value: 'ready', label: 'Tersedia Dahulu' },
  { value: 'cheapest', label: 'Harga Termurah' },
  { value: 'expensive', label: 'Harga Termahal' },
  { value: 'name', label: 'Nama A-Z' },
];

const SAMPLE_ITEMS = [
  { id: 1, name: 'Beras Pandan Wangi 5 kg', qty: 1, price: 72000, discount: 10 },
  { id: 2, name: 'Minyak Goreng Sawit 2 liter', qty: 2, price: 34000, discount: 0 },
  { id: 3, name: 'Gula Pasir Kristal 1 kg', qty: 1, price: 17500, discount: 5 },
];

export default function DevUiPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ready');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="text-xl font-bold text-text md:text-2xl">
          Komponen UI KDKMP
        </h1>
        <Badge variant="primary">DEV</Badge>
      </div>

      {/* 1. Button */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-text">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Nonaktif
          </Button>
          <Button variant="secondary" size="sm">
            Ukuran Kecil
          </Button>
        </div>
      </section>

      {/* 2. Badge */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-text">Badge</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="ok">Tersedia</Badge>
          <Badge variant="ok">
            Buka · <DateText value="07:00" mode="time" />–
            <DateText value="20:00" mode="time" />
          </Badge>
          <Badge variant="warn">Pre-Order</Badge>
          <Badge variant="mute">Habis</Badge>
          <Badge variant="mute">
            Tutup · Buka <DateText value="07:00" mode="time" />
          </Badge>
          <Badge variant="primary">Unggulan</Badge>
        </div>
      </section>

      {/* 3. Input & 4. Select */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-text">Input & Select</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Cari Produk"
            placeholder="Ketik nama produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            label="Nomor WhatsApp"
            defaultValue="08123"
            error="Nomor WhatsApp wajib diawali 62 (8–13 digit)."
          />
          <Select
            label="Urutan Katalog"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          />
          <Select
            label="Kecamatan"
            defaultValue=""
            error="Pilih kecamatan terlebih dahulu."
            options={[
              { value: '', label: 'Pilih kecamatan' },
              { value: 'sidayu', label: 'Kec. Sidayu' },
            ]}
          />
        </div>
      </section>

      {/* 5. Money, Num, DateText */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-text">
          Money, Num & DateText
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-3.5">
            <span className="block text-xs text-text-2">Harga Satuan</span>
            <Money
              value={72000}
              className="mt-1 block text-lg font-bold text-primary-700"
            />
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5">
            <span className="block text-xs text-text-2">Wilayah Gresik</span>
            <Num
              value={356}
              className="mt-1 block text-lg font-bold text-text"
            />
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5">
            <span className="block text-xs text-text-2">Diskon</span>
            <Num
              value={15}
              suffix="%"
              className="mt-1 block text-lg font-bold text-ok-700"
            />
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5">
            <span className="block text-xs text-text-2">Waktu WIB</span>
            <DateText
              value="2026-11-09T07:00:00+07:00"
              mode="datetime"
              className="mt-1 block text-base font-bold text-text"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-3 text-xs text-text-2">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold">Produk</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">
                  Diskon
                </th>
                <th className="px-3.5 py-2.5 text-right font-semibold">
                  Harga
                </th>
                <th className="px-3.5 py-2.5 text-right font-semibold">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SAMPLE_ITEMS.map((item) => (
                <tr key={item.id}>
                  <td className="px-3.5 py-2.5 font-medium text-text">
                    {item.name}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <Num value={item.qty} />
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <Num value={item.discount} suffix="%" />
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <Money value={item.price} />
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-semibold text-primary-700">
                    <Money value={item.qty * item.price} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Sheet */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-text">Sheet</h2>
        <div>
          <Button variant="primary" onClick={() => setSheetOpen(true)}>
            Buka Sheet Keranjang
          </Button>
        </div>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Keranjang KDKMP Desa Golokan"
          footer={
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="block text-xs text-text-2">Total</span>
                <Money
                  value={157500}
                  className="text-base font-bold text-primary-700"
                />
              </div>
              <Button variant="primary" onClick={() => setSheetOpen(false)}>
                Lanjut Checkout
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {SAMPLE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <span className="block text-sm font-medium text-text">
                    {item.name}
                  </span>
                  <span className="text-xs text-text-2">
                    <Num value={item.qty} /> x <Money value={item.price} />
                  </span>
                </div>
                <Money
                  value={item.qty * item.price}
                  className="text-sm font-semibold text-text"
                />
              </div>
            ))}
          </div>
        </Sheet>
      </section>

      {/* 7. Skeleton */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-text">Skeleton</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="overflow-hidden rounded-xl border border-border bg-surface p-3 space-y-2.5"
            >
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* 8. EmptyState */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-text">EmptyState</h2>
        <EmptyState
          message="Koperasi tidak ditemukan."
          actionLabel="Reset Pencarian"
          onAction={() => setSearch('')}
        />
      </section>
    </div>
  );
}

