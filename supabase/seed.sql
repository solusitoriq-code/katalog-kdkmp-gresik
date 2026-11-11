-- Master Wilayah Kabupaten Gresik (Kode Kemendagri 35.25)
-- Sumber: master-regencies.json, master-districts.json, villages/35.25.json
-- Total: 18 Kecamatan, 356 Desa/Kelurahan (330 Desa + 26 Kelurahan)

-- 1. KECAMATAN (18)
INSERT INTO subdistricts (code, name, slug, sort_order, is_active) VALUES
  ('35.25.01', 'Dukun', 'dukun', 1, false),
  ('35.25.02', 'Balongpanggang', 'balongpanggang', 2, false),
  ('35.25.03', 'Panceng', 'panceng', 3, false),
  ('35.25.04', 'Benjeng', 'benjeng', 4, false),
  ('35.25.05', 'Duduksampeyan', 'duduksampeyan', 5, false),
  ('35.25.06', 'Wringinanom', 'wringinanom', 6, false),
  ('35.25.07', 'Ujungpangkah', 'ujungpangkah', 7, false),
  ('35.25.08', 'Kedamean', 'kedamean', 8, false),
  ('35.25.09', 'Sidayu', 'sidayu', 9, true),
  ('35.25.10', 'Manyar', 'manyar', 10, false),
  ('35.25.11', 'Cerme', 'cerme', 11, false),
  ('35.25.12', 'Bungah', 'bungah', 12, false),
  ('35.25.13', 'Menganti', 'menganti', 13, false),
  ('35.25.14', 'Kebomas', 'kebomas', 14, false),
  ('35.25.15', 'Driyorejo', 'driyorejo', 15, false),
  ('35.25.16', 'Gresik', 'gresik', 16, false),
  ('35.25.17', 'Sangkapura', 'sangkapura', 17, false),
  ('35.25.18', 'Tambak', 'tambak', 18, false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  sort_order = EXCLUDED.sort_order;

-- 2. DESA & KELURAHAN (356)
WITH raw_villages (code, subdistrict_code, name, slug, type, business_name) AS (
  VALUES
    ('35.25.01.2001', '35.25.01', 'Sawo', 'sawo', 'desa', 'KDKMP Desa Sawo'),
    ('35.25.01.2002', '35.25.01', 'Karangcangkring', 'karangcangkring', 'desa', 'KDKMP Desa Karangcangkring'),
    ('35.25.01.2003', '35.25.01', 'Gedongkedo''an', 'gedongkedoan', 'desa', 'KDKMP Desa Gedongkedo''an'),
    ('35.25.01.2004', '35.25.01', 'Bulangan', 'bulangan', 'desa', 'KDKMP Desa Bulangan'),
    ('35.25.01.2005', '35.25.01', 'Wonokerto', 'wonokerto', 'desa', 'KDKMP Desa Wonokerto'),
    ('35.25.01.2006', '35.25.01', 'Bangeran', 'bangeran', 'desa', 'KDKMP Desa Bangeran'),
    ('35.25.01.2007', '35.25.01', 'Lowayu', 'lowayu', 'desa', 'KDKMP Desa Lowayu'),
    ('35.25.01.2008', '35.25.01', 'Petiyin Tunggal', 'petiyin-tunggal', 'desa', 'KDKMP Desa Petiyin Tunggal'),
    ('35.25.01.2009', '35.25.01', 'Tirem Enggal', 'tirem-enggal', 'desa', 'KDKMP Desa Tirem Enggal'),
    ('35.25.01.2010', '35.25.01', 'Tebuwung', 'tebuwung', 'desa', 'KDKMP Desa Tebuwung'),
    ('35.25.01.2011', '35.25.01', 'Dukuh Kembar', 'dukuh-kembar', 'desa', 'KDKMP Desa Dukuh Kembar'),
    ('35.25.01.2012', '35.25.01', 'Madumulyorejo', 'madumulyorejo', 'desa', 'KDKMP Desa Madumulyorejo'),
    ('35.25.01.2013', '35.25.01', 'Mentaras', 'mentaras', 'desa', 'KDKMP Desa Mentaras'),
    ('35.25.01.2014', '35.25.01', 'Baron', 'baron', 'desa', 'KDKMP Desa Baron'),
    ('35.25.01.2015', '35.25.01', 'Jrebeng', 'jrebeng', 'desa', 'KDKMP Desa Jrebeng'),
    ('35.25.01.2016', '35.25.01', 'Mojopetung', 'mojopetung', 'desa', 'KDKMP Desa Mojopetung'),
    ('35.25.01.2017', '35.25.01', 'Sekargadung', 'sekargadung', 'desa', 'KDKMP Desa Sekargadung'),
    ('35.25.01.2018', '35.25.01', 'Ima''an', 'imaan', 'desa', 'KDKMP Desa Ima''an'),
    ('35.25.01.2019', '35.25.01', 'Babakbawo', 'babakbawo', 'desa', 'KDKMP Desa Babakbawo'),
    ('35.25.01.2020', '35.25.01', 'Babaksari', 'babaksari', 'desa', 'KDKMP Desa Babaksari'),
    ('35.25.01.2021', '35.25.01', 'Sambogunung', 'sambogunung', 'desa', 'KDKMP Desa Sambogunung'),
    ('35.25.01.2022', '35.25.01', 'Sembungan Kidul', 'sembungan-kidul', 'desa', 'KDKMP Desa Sembungan Kidul'),
    ('35.25.01.2023', '35.25.01', 'Sembunganyar', 'sembunganyar', 'desa', 'KDKMP Desa Sembunganyar'),
    ('35.25.01.2024', '35.25.01', 'Kalirejo', 'kalirejo', 'desa', 'KDKMP Desa Kalirejo'),
    ('35.25.01.2025', '35.25.01', 'Padang Bandung', 'padang-bandung', 'desa', 'KDKMP Desa Padang Bandung'),
    ('35.25.01.2026', '35.25.01', 'Dukunanyar', 'dukunanyar', 'desa', 'KDKMP Desa Dukunanyar'),
    ('35.25.02.2001', '35.25.02', 'Jombangdelik', 'jombangdelik', 'desa', 'KDKMP Desa Jombangdelik'),
    ('35.25.02.2002', '35.25.02', 'Brangkal', 'brangkal', 'desa', 'KDKMP Desa Brangkal'),
    ('35.25.02.2003', '35.25.02', 'Ngampel', 'ngampel', 'desa', 'KDKMP Desa Ngampel'),
    ('35.25.02.2004', '35.25.02', 'Bandungsekaran', 'bandungsekaran', 'desa', 'KDKMP Desa Bandungsekaran'),
    ('35.25.02.2005', '35.25.02', 'Babatan', 'babatan', 'desa', 'KDKMP Desa Babatan'),
    ('35.25.02.2006', '35.25.02', 'Tanahlandean', 'tanahlandean', 'desa', 'KDKMP Desa Tanahlandean'),
    ('35.25.02.2007', '35.25.02', 'Kedungsumber', 'kedungsumber', 'desa', 'KDKMP Desa Kedungsumber'),
    ('35.25.02.2008', '35.25.02', 'Wonorejo', 'wonorejo', 'desa', 'KDKMP Desa Wonorejo'),
    ('35.25.02.2009', '35.25.02', 'Dapet', 'dapet', 'desa', 'KDKMP Desa Dapet'),
    ('35.25.02.2010', '35.25.02', 'Dohoagung', 'dohoagung', 'desa', 'KDKMP Desa Dohoagung'),
    ('35.25.02.2011', '35.25.02', 'Mojogede', 'mojogede', 'desa', 'KDKMP Desa Mojogede'),
    ('35.25.02.2012', '35.25.02', 'Tenggor', 'tenggor', 'desa', 'KDKMP Desa Tenggor'),
    ('35.25.02.2013', '35.25.02', 'Wahas', 'wahas', 'desa', 'KDKMP Desa Wahas'),
    ('35.25.02.2014', '35.25.02', 'Kedungpring', 'kedungpring', 'desa', 'KDKMP Desa Kedungpring'),
    ('35.25.02.2015', '35.25.02', 'Sekarputih', 'sekarputih', 'desa', 'KDKMP Desa Sekarputih'),
    ('35.25.02.2016', '35.25.02', 'Pinggir', 'pinggir', 'desa', 'KDKMP Desa Pinggir'),
    ('35.25.02.2017', '35.25.02', 'Karangsemanding', 'karangsemanding', 'desa', 'KDKMP Desa Karangsemanding'),
    ('35.25.02.2018', '35.25.02', 'Pacuh', 'pacuh', 'desa', 'KDKMP Desa Pacuh'),
    ('35.25.02.2019', '35.25.02', 'Balongpanggang', 'balongpanggang', 'desa', 'KDKMP Desa Balongpanggang'),
    ('35.25.02.2020', '35.25.02', 'Wotansari', 'wotansari', 'desa', 'KDKMP Desa Wotansari'),
    ('35.25.02.2021', '35.25.02', 'Pucung', 'pucung', 'desa', 'KDKMP Desa Pucung'),
    ('35.25.02.2022', '35.25.02', 'Klotok', 'klotok', 'desa', 'KDKMP Desa Klotok'),
    ('35.25.02.2023', '35.25.02', 'Ngasin', 'ngasin', 'desa', 'KDKMP Desa Ngasin'),
    ('35.25.02.2024', '35.25.02', 'Banjaragung', 'banjaragung', 'desa', 'KDKMP Desa Banjaragung'),
    ('35.25.02.2025', '35.25.02', 'Ganggang', 'ganggang', 'desa', 'KDKMP Desa Ganggang'),
    ('35.25.03.2001', '35.25.03', 'Pantenan', 'pantenan', 'desa', 'KDKMP Desa Pantenan'),
    ('35.25.03.2002', '35.25.03', 'Sumurber', 'sumurber', 'desa', 'KDKMP Desa Sumurber'),
    ('35.25.03.2003', '35.25.03', 'Siwalan', 'siwalan', 'desa', 'KDKMP Desa Siwalan'),
    ('35.25.03.2004', '35.25.03', 'Ketanen', 'ketanen', 'desa', 'KDKMP Desa Ketanen'),
    ('35.25.03.2005', '35.25.03', 'Banyutengah', 'banyutengah', 'desa', 'KDKMP Desa Banyutengah'),
    ('35.25.03.2006', '35.25.03', 'Serah', 'serah', 'desa', 'KDKMP Desa Serah'),
    ('35.25.03.2007', '35.25.03', 'Surowiti', 'surowiti', 'desa', 'KDKMP Desa Surowiti'),
    ('35.25.03.2008', '35.25.03', 'Prupuh', 'prupuh', 'desa', 'KDKMP Desa Prupuh'),
    ('35.25.03.2009', '35.25.03', 'Campurejo', 'campurejo', 'desa', 'KDKMP Desa Campurejo'),
    ('35.25.03.2010', '35.25.03', 'Sukodono', 'sukodono', 'desa', 'KDKMP Desa Sukodono'),
    ('35.25.03.2011', '35.25.03', 'Dalegan', 'dalegan', 'desa', 'KDKMP Desa Dalegan'),
    ('35.25.03.2012', '35.25.03', 'Petung', 'petung', 'desa', 'KDKMP Desa Petung'),
    ('35.25.03.2013', '35.25.03', 'Wotan', 'wotan', 'desa', 'KDKMP Desa Wotan'),
    ('35.25.03.2014', '35.25.03', 'Doudo', 'doudo', 'desa', 'KDKMP Desa Doudo'),
    ('35.25.04.2001', '35.25.04', 'Karangankidul', 'karangankidul', 'desa', 'KDKMP Desa Karangankidul'),
    ('35.25.04.2002', '35.25.04', 'Sedapur Klagen', 'sedapur-klagen', 'desa', 'KDKMP Desa Sedapur Klagen'),
    ('35.25.04.2003', '35.25.04', 'Deliksumber', 'deliksumber', 'desa', 'KDKMP Desa Deliksumber'),
    ('35.25.04.2004', '35.25.04', 'Lundo', 'lundo', 'desa', 'KDKMP Desa Lundo'),
    ('35.25.04.2005', '35.25.04', 'Kalipadang', 'kalipadang', 'desa', 'KDKMP Desa Kalipadang'),
    ('35.25.04.2006', '35.25.04', 'Kedungrukem', 'kedungrukem', 'desa', 'KDKMP Desa Kedungrukem'),
    ('35.25.04.2007', '35.25.04', 'Balungtunjung', 'balungtunjung', 'desa', 'KDKMP Desa Balungtunjung'),
    ('35.25.04.2008', '35.25.04', 'Munggugebang', 'munggugebang', 'desa', 'KDKMP Desa Munggugebang'),
    ('35.25.04.2009', '35.25.04', 'Balongmojo', 'balongmojo', 'desa', 'KDKMP Desa Balongmojo'),
    ('35.25.04.2010', '35.25.04', 'Bulangkulon', 'bulangkulon', 'desa', 'KDKMP Desa Bulangkulon'),
    ('35.25.04.2011', '35.25.04', 'Banter', 'banter', 'desa', 'KDKMP Desa Banter'),
    ('35.25.04.2012', '35.25.04', 'Sirnoboyo', 'sirnoboyo', 'desa', 'KDKMP Desa Sirnoboyo'),
    ('35.25.04.2013', '35.25.04', 'Munggugianti', 'munggugianti', 'desa', 'KDKMP Desa Munggugianti'),
    ('35.25.04.2014', '35.25.04', 'Klampok', 'klampok', 'desa', 'KDKMP Desa Klampok'),
    ('35.25.04.2015', '35.25.04', 'Metatu', 'metatu', 'desa', 'KDKMP Desa Metatu'),
    ('35.25.04.2016', '35.25.04', 'Bengkelolor', 'bengkelolor', 'desa', 'KDKMP Desa Bengkelolor'),
    ('35.25.04.2017', '35.25.04', 'Gurangploso', 'gurangploso', 'desa', 'KDKMP Desa Gurangploso'),
    ('35.25.04.2018', '35.25.04', 'Kedungsekar', 'kedungsekar', 'desa', 'KDKMP Desa Kedungsekar'),
    ('35.25.04.2019', '35.25.04', 'Dermo', 'dermo', 'desa', 'KDKMP Desa Dermo'),
    ('35.25.04.2020', '35.25.04', 'Jogodalu', 'jogodalu', 'desa', 'KDKMP Desa Jogodalu'),
    ('35.25.04.2021', '35.25.04', 'Jatirembe', 'jatirembe', 'desa', 'KDKMP Desa Jatirembe'),
    ('35.25.04.2022', '35.25.04', 'Bulurejo', 'bulurejo', 'desa', 'KDKMP Desa Bulurejo'),
    ('35.25.04.2023', '35.25.04', 'Punduttrate', 'punduttrate', 'desa', 'KDKMP Desa Punduttrate'),
    ('35.25.05.2001', '35.25.05', 'Panjunan', 'panjunan', 'desa', 'KDKMP Desa Panjunan'),
    ('35.25.05.2002', '35.25.05', 'Kandangan', 'kandangan', 'desa', 'KDKMP Desa Kandangan'),
    ('35.25.05.2003', '35.25.05', 'Pandanan', 'pandanan', 'desa', 'KDKMP Desa Pandanan'),
    ('35.25.05.2004', '35.25.05', 'Tumapel', 'tumapel', 'desa', 'KDKMP Desa Tumapel'),
    ('35.25.05.2005', '35.25.05', 'Tambakrejo', 'tambakrejo', 'desa', 'KDKMP Desa Tambakrejo'),
    ('35.25.05.2006', '35.25.05', 'Glanggang', 'glanggang', 'desa', 'KDKMP Desa Glanggang'),
    ('35.25.05.2007', '35.25.05', 'Palebon', 'palebon', 'desa', 'KDKMP Desa Palebon'),
    ('35.25.05.2008', '35.25.05', 'Setrohadi', 'setrohadi', 'desa', 'KDKMP Desa Setrohadi'),
    ('35.25.05.2009', '35.25.05', 'Bendungan', 'bendungan', 'desa', 'KDKMP Desa Bendungan'),
    ('35.25.05.2010', '35.25.05', 'Sumengko', 'sumengko', 'desa', 'KDKMP Desa Sumengko'),
    ('35.25.05.2011', '35.25.05', 'Wadak Lor', 'wadak-lor', 'desa', 'KDKMP Desa Wadak Lor'),
    ('35.25.05.2012', '35.25.05', 'Wadak Kidul', 'wadak-kidul', 'desa', 'KDKMP Desa Wadak Kidul'),
    ('35.25.05.2013', '35.25.05', 'Petisbenem', 'petisbenem', 'desa', 'KDKMP Desa Petisbenem'),
    ('35.25.05.2014', '35.25.05', 'Duduksampeyan', 'duduksampeyan', 'desa', 'KDKMP Desa Duduksampeyan'),
    ('35.25.05.2015', '35.25.05', 'Gredek', 'gredek', 'desa', 'KDKMP Desa Gredek'),
    ('35.25.05.2016', '35.25.05', 'Kramat', 'kramat', 'desa', 'KDKMP Desa Kramat'),
    ('35.25.05.2017', '35.25.05', 'Sumari', 'sumari', 'desa', 'KDKMP Desa Sumari'),
    ('35.25.05.2018', '35.25.05', 'Samirplapan', 'samirplapan', 'desa', 'KDKMP Desa Samirplapan'),
    ('35.25.05.2019', '35.25.05', 'Kawistowindu', 'kawistowindu', 'desa', 'KDKMP Desa Kawistowindu'),
    ('35.25.05.2020', '35.25.05', 'Kemudi', 'kemudi', 'desa', 'KDKMP Desa Kemudi'),
    ('35.25.05.2021', '35.25.05', 'Tebaloan', 'tebaloan', 'desa', 'KDKMP Desa Tebaloan'),
    ('35.25.05.2022', '35.25.05', 'Tirem', 'tirem', 'desa', 'KDKMP Desa Tirem'),
    ('35.25.05.2023', '35.25.05', 'Ambeng-ambeng Watangrejo', 'ambeng-ambeng-watangrejo', 'desa', 'KDKMP Desa Ambeng-ambeng Watangrejo'),
    ('35.25.06.2001', '35.25.06', 'Kepuhklagen', 'kepuhklagen', 'desa', 'KDKMP Desa Kepuhklagen'),
    ('35.25.06.2002', '35.25.06', 'Sumbergede', 'sumbergede', 'desa', 'KDKMP Desa Sumbergede'),
    ('35.25.06.2003', '35.25.06', 'Mondoluku', 'mondoluku', 'desa', 'KDKMP Desa Mondoluku'),
    ('35.25.06.2004', '35.25.06', 'Kedunganyar', 'kedunganyar', 'desa', 'KDKMP Desa Kedunganyar'),
    ('35.25.06.2005', '35.25.06', 'Sumberwaru', 'sumberwaru', 'desa', 'KDKMP Desa Sumberwaru'),
    ('35.25.06.2006', '35.25.06', 'Kesambenkulon', 'kesambenkulon', 'desa', 'KDKMP Desa Kesambenkulon'),
    ('35.25.06.2007', '35.25.06', 'Sumberame', 'sumberame', 'desa', 'KDKMP Desa Sumberame'),
    ('35.25.06.2008', '35.25.06', 'Sembung', 'sembung', 'desa', 'KDKMP Desa Sembung'),
    ('35.25.06.2009', '35.25.06', 'Sooko', 'sooko', 'desa', 'KDKMP Desa Sooko'),
    ('35.25.06.2010', '35.25.06', 'Wringinanom', 'wringinanom', 'desa', 'KDKMP Desa Wringinanom'),
    ('35.25.06.2011', '35.25.06', 'Pedagangan', 'pedagangan', 'desa', 'KDKMP Desa Pedagangan'),
    ('35.25.06.2012', '35.25.06', 'Lebanisuko', 'lebanisuko', 'desa', 'KDKMP Desa Lebanisuko'),
    ('35.25.06.2013', '35.25.06', 'Lebaniwaras', 'lebaniwaras', 'desa', 'KDKMP Desa Lebaniwaras'),
    ('35.25.06.2014', '35.25.06', 'Watestanjung', 'watestanjung', 'desa', 'KDKMP Desa Watestanjung'),
    ('35.25.06.2015', '35.25.06', 'Sumengko', 'sumengko', 'desa', 'KDKMP Desa Sumengko'),
    ('35.25.06.2016', '35.25.06', 'Pasinanlemahputih', 'pasinanlemahputih', 'desa', 'KDKMP Desa Pasinanlemahputih'),
    ('35.25.07.2001', '35.25.07', 'Pangkahkulon', 'pangkahkulon', 'desa', 'KDKMP Desa Pangkahkulon'),
    ('35.25.07.2002', '35.25.07', 'Cangaan', 'cangaan', 'desa', 'KDKMP Desa Cangaan'),
    ('35.25.07.2003', '35.25.07', 'Ngemboh', 'ngemboh', 'desa', 'KDKMP Desa Ngemboh'),
    ('35.25.07.2004', '35.25.07', 'Sekapuk', 'sekapuk', 'desa', 'KDKMP Desa Sekapuk'),
    ('35.25.07.2005', '35.25.07', 'Gosari', 'gosari', 'desa', 'KDKMP Desa Gosari'),
    ('35.25.07.2006', '35.25.07', 'Banyuurip', 'banyuurip', 'desa', 'KDKMP Desa Banyuurip'),
    ('35.25.07.2007', '35.25.07', 'Kebonagung', 'kebonagung', 'desa', 'KDKMP Desa Kebonagung'),
    ('35.25.07.2008', '35.25.07', 'Pangkahwetan', 'pangkahwetan', 'desa', 'KDKMP Desa Pangkahwetan'),
    ('35.25.07.2009', '35.25.07', 'Bolo', 'bolo', 'desa', 'KDKMP Desa Bolo'),
    ('35.25.07.2010', '35.25.07', 'Glatik', 'glatik', 'desa', 'KDKMP Desa Glatik'),
    ('35.25.07.2011', '35.25.07', 'Karangrejo', 'karangrejo', 'desa', 'KDKMP Desa Karangrejo'),
    ('35.25.07.2012', '35.25.07', 'Ketapanglor', 'ketapanglor', 'desa', 'KDKMP Desa Ketapanglor'),
    ('35.25.07.2013', '35.25.07', 'Tanjangawan', 'tanjangawan', 'desa', 'KDKMP Desa Tanjangawan'),
    ('35.25.08.2001', '35.25.08', 'Mojowuku', 'mojowuku', 'desa', 'KDKMP Desa Mojowuku'),
    ('35.25.08.2002', '35.25.08', 'Glindah', 'glindah', 'desa', 'KDKMP Desa Glindah'),
    ('35.25.08.2003', '35.25.08', 'Sidoraharjo', 'sidoraharjo', 'desa', 'KDKMP Desa Sidoraharjo'),
    ('35.25.08.2004', '35.25.08', 'Tulung', 'tulung', 'desa', 'KDKMP Desa Tulung'),
    ('35.25.08.2005', '35.25.08', 'Cermen', 'cermen', 'desa', 'KDKMP Desa Cermen'),
    ('35.25.08.2006', '35.25.08', 'Lampah', 'lampah', 'desa', 'KDKMP Desa Lampah'),
    ('35.25.08.2007', '35.25.08', 'Slempit', 'slempit', 'desa', 'KDKMP Desa Slempit'),
    ('35.25.08.2008', '35.25.08', 'Turirejo', 'turirejo', 'desa', 'KDKMP Desa Turirejo'),
    ('35.25.08.2009', '35.25.08', 'Belahanrejo', 'belahanrejo', 'desa', 'KDKMP Desa Belahanrejo'),
    ('35.25.08.2010', '35.25.08', 'Menunggal', 'menunggal', 'desa', 'KDKMP Desa Menunggal'),
    ('35.25.08.2011', '35.25.08', 'Tanjung', 'tanjung', 'desa', 'KDKMP Desa Tanjung'),
    ('35.25.08.2012', '35.25.08', 'Katimoho', 'katimoho', 'desa', 'KDKMP Desa Katimoho'),
    ('35.25.08.2013', '35.25.08', 'Banyuurip', 'banyuurip', 'desa', 'KDKMP Desa Banyuurip'),
    ('35.25.08.2014', '35.25.08', 'Kedamean', 'kedamean', 'desa', 'KDKMP Desa Kedamean'),
    ('35.25.08.2015', '35.25.08', 'Ngepung', 'ngepung', 'desa', 'KDKMP Desa Ngepung'),
    ('35.25.09.2001', '35.25.09', 'Sukorejo', 'sukorejo', 'desa', 'KDKMP Desa Sukorejo'),
    ('35.25.09.2002', '35.25.09', 'Gedangan', 'gedangan', 'desa', 'KDKMP Desa Gedangan'),
    ('35.25.09.2003', '35.25.09', 'Wadeng', 'wadeng', 'desa', 'KDKMP Desa Wadeng'),
    ('35.25.09.2004', '35.25.09', 'Lasem', 'lasem', 'desa', 'KDKMP Desa Lasem'),
    ('35.25.09.2005', '35.25.09', 'Kertosono', 'kertosono', 'desa', 'KDKMP Desa Kertosono'),
    ('35.25.09.2006', '35.25.09', 'Sambipondok', 'sambipondok', 'desa', 'KDKMP Desa Sambipondok'),
    ('35.25.09.2007', '35.25.09', 'Raci Kulon', 'raci-kulon', 'desa', 'KDKMP Desa Raci Kulon'),
    ('35.25.09.2008', '35.25.09', 'Golokan', 'golokan', 'desa', 'KDKMP Desa Golokan'),
    ('35.25.09.2009', '35.25.09', 'Raci Tengah', 'raci-tengah', 'desa', 'KDKMP Desa Raci Tengah'),
    ('35.25.09.2010', '35.25.09', 'Purwodadi', 'purwodadi', 'desa', 'KDKMP Desa Purwodadi'),
    ('35.25.09.2011', '35.25.09', 'Sidomulyo', 'sidomulyo', 'desa', 'KDKMP Desa Sidomulyo'),
    ('35.25.09.2012', '35.25.09', 'Srowo', 'srowo', 'desa', 'KDKMP Desa Srowo'),
    ('35.25.09.2013', '35.25.09', 'Kauman', 'kauman', 'desa', 'KDKMP Desa Kauman'),
    ('35.25.09.2014', '35.25.09', 'Bunderan', 'bunderan', 'desa', 'KDKMP Desa Bunderan'),
    ('35.25.09.2015', '35.25.09', 'Asempapak', 'asempapak', 'desa', 'KDKMP Desa Asempapak'),
    ('35.25.09.2016', '35.25.09', 'Mriyunan', 'mriyunan', 'desa', 'KDKMP Desa Mriyunan'),
    ('35.25.09.2017', '35.25.09', 'Mojoasem', 'mojoasem', 'desa', 'KDKMP Desa Mojoasem'),
    ('35.25.09.2018', '35.25.09', 'Sedagaran', 'sedagaran', 'desa', 'KDKMP Desa Sedagaran'),
    ('35.25.09.2019', '35.25.09', 'Ngawen', 'ngawen', 'desa', 'KDKMP Desa Ngawen'),
    ('35.25.09.2020', '35.25.09', 'Pengulu', 'pengulu', 'desa', 'KDKMP Desa Pengulu'),
    ('35.25.09.2021', '35.25.09', 'Randuboto', 'randuboto', 'desa', 'KDKMP Desa Randuboto'),
    ('35.25.10.2001', '35.25.10', 'Tanggulrejo', 'tanggulrejo', 'desa', 'KDKMP Desa Tanggulrejo'),
    ('35.25.10.2002', '35.25.10', 'Morobakung', 'morobakung', 'desa', 'KDKMP Desa Morobakung'),
    ('35.25.10.2003', '35.25.10', 'Pejangganan', 'pejangganan', 'desa', 'KDKMP Desa Pejangganan'),
    ('35.25.10.2004', '35.25.10', 'Gumeno', 'gumeno', 'desa', 'KDKMP Desa Gumeno'),
    ('35.25.10.2005', '35.25.10', 'Sumberejo', 'sumberejo', 'desa', 'KDKMP Desa Sumberejo'),
    ('35.25.10.2006', '35.25.10', 'Ngampel', 'ngampel', 'desa', 'KDKMP Desa Ngampel'),
    ('35.25.10.2007', '35.25.10', 'Betoyokauman', 'betoyokauman', 'desa', 'KDKMP Desa Betoyokauman'),
    ('35.25.10.2008', '35.25.10', 'Sembayat', 'sembayat', 'desa', 'KDKMP Desa Sembayat'),
    ('35.25.10.2009', '35.25.10', 'Betoyoguci', 'betoyoguci', 'desa', 'KDKMP Desa Betoyoguci'),
    ('35.25.10.2010', '35.25.10', 'Leran', 'leran', 'desa', 'KDKMP Desa Leran'),
    ('35.25.10.2011', '35.25.10', 'Tebalo', 'tebalo', 'desa', 'KDKMP Desa Tebalo'),
    ('35.25.10.2012', '35.25.10', 'Karangrejo', 'karangrejo', 'desa', 'KDKMP Desa Karangrejo'),
    ('35.25.10.2013', '35.25.10', 'Banyuwangi', 'banyuwangi', 'desa', 'KDKMP Desa Banyuwangi'),
    ('35.25.10.2014', '35.25.10', 'Manyarejo', 'manyarejo', 'desa', 'KDKMP Desa Manyarejo'),
    ('35.25.10.2015', '35.25.10', 'Manyar Sidomukti', 'manyar-sidomukti', 'desa', 'KDKMP Desa Manyar Sidomukti'),
    ('35.25.10.2016', '35.25.10', 'Manyar Sidorukun', 'manyar-sidorukun', 'desa', 'KDKMP Desa Manyar Sidorukun'),
    ('35.25.10.2017', '35.25.10', 'Banjarsari', 'banjarsari', 'desa', 'KDKMP Desa Banjarsari'),
    ('35.25.10.2018', '35.25.10', 'Suci', 'suci', 'desa', 'KDKMP Desa Suci'),
    ('35.25.10.2019', '35.25.10', 'Paganden', 'paganden', 'desa', 'KDKMP Desa Paganden'),
    ('35.25.10.2020', '35.25.10', 'Pongangan', 'pongangan', 'desa', 'KDKMP Desa Pongangan'),
    ('35.25.10.2021', '35.25.10', 'Sukomulyo', 'sukomulyo', 'desa', 'KDKMP Desa Sukomulyo'),
    ('35.25.10.2022', '35.25.10', 'Yosowilangun', 'yosowilangun', 'desa', 'KDKMP Desa Yosowilangun'),
    ('35.25.10.2023', '35.25.10', 'Roomo', 'roomo', 'desa', 'KDKMP Desa Roomo'),
    ('35.25.11.2001', '35.25.11', 'Dadapkuning', 'dadapkuning', 'desa', 'KDKMP Desa Dadapkuning'),
    ('35.25.11.2002', '35.25.11', 'Lengkong', 'lengkong', 'desa', 'KDKMP Desa Lengkong'),
    ('35.25.11.2003', '35.25.11', 'Kandangan', 'kandangan', 'desa', 'KDKMP Desa Kandangan'),
    ('35.25.11.2004', '35.25.11', 'Dooro', 'dooro', 'desa', 'KDKMP Desa Dooro'),
    ('35.25.11.2005', '35.25.11', 'Dampaan', 'dampaan', 'desa', 'KDKMP Desa Dampaan'),
    ('35.25.11.2006', '35.25.11', 'Ngembung', 'ngembung', 'desa', 'KDKMP Desa Ngembung'),
    ('35.25.11.2007', '35.25.11', 'Sukoanyar', 'sukoanyar', 'desa', 'KDKMP Desa Sukoanyar'),
    ('35.25.11.2008', '35.25.11', 'Gedangkulud', 'gedangkulud', 'desa', 'KDKMP Desa Gedangkulud'),
    ('35.25.11.2009', '35.25.11', 'Wedani', 'wedani', 'desa', 'KDKMP Desa Wedani'),
    ('35.25.11.2010', '35.25.11', 'Dungus', 'dungus', 'desa', 'KDKMP Desa Dungus'),
    ('35.25.11.2011', '35.25.11', 'Guranganyar', 'guranganyar', 'desa', 'KDKMP Desa Guranganyar'),
    ('35.25.11.2012', '35.25.11', 'Kambingan', 'kambingan', 'desa', 'KDKMP Desa Kambingan'),
    ('35.25.11.2013', '35.25.11', 'Morowudi', 'morowudi', 'desa', 'KDKMP Desa Morowudi'),
    ('35.25.11.2014', '35.25.11', 'Betiting', 'betiting', 'desa', 'KDKMP Desa Betiting'),
    ('35.25.11.2015', '35.25.11', 'Ngabetan', 'ngabetan', 'desa', 'KDKMP Desa Ngabetan'),
    ('35.25.11.2016', '35.25.11', 'Padeg', 'padeg', 'desa', 'KDKMP Desa Padeg'),
    ('35.25.11.2017', '35.25.11', 'Iker-iker Geger', 'iker-iker-geger', 'desa', 'KDKMP Desa Iker-iker Geger'),
    ('35.25.11.2018', '35.25.11', 'Semampir', 'semampir', 'desa', 'KDKMP Desa Semampir'),
    ('35.25.11.2019', '35.25.11', 'Cagakagung', 'cagakagung', 'desa', 'KDKMP Desa Cagakagung'),
    ('35.25.11.2020', '35.25.11', 'Cerme Kidul', 'cerme-kidul', 'desa', 'KDKMP Desa Cerme Kidul'),
    ('35.25.11.2021', '35.25.11', 'Cerme Lor', 'cerme-lor', 'desa', 'KDKMP Desa Cerme Lor'),
    ('35.25.11.2022', '35.25.11', 'Pandu', 'pandu', 'desa', 'KDKMP Desa Pandu'),
    ('35.25.11.2023', '35.25.11', 'Banjarsari', 'banjarsari', 'desa', 'KDKMP Desa Banjarsari'),
    ('35.25.11.2024', '35.25.11', 'Tambakberas', 'tambakberas', 'desa', 'KDKMP Desa Tambakberas'),
    ('35.25.11.2025', '35.25.11', 'Jono', 'jono', 'desa', 'KDKMP Desa Jono'),
    ('35.25.12.2001', '35.25.12', 'Sidomukti', 'sidomukti', 'desa', 'KDKMP Desa Sidomukti'),
    ('35.25.12.2002', '35.25.12', 'Mojopurogede', 'mojopurogede', 'desa', 'KDKMP Desa Mojopurogede'),
    ('35.25.12.2003', '35.25.12', 'Mojopurowetan', 'mojopurowetan', 'desa', 'KDKMP Desa Mojopurowetan'),
    ('35.25.12.2004', '35.25.12', 'Melirang', 'melirang', 'desa', 'KDKMP Desa Melirang'),
    ('35.25.12.2005', '35.25.12', 'Sidorejo', 'sidorejo', 'desa', 'KDKMP Desa Sidorejo'),
    ('35.25.12.2006', '35.25.12', 'Raciwetan', 'raciwetan', 'desa', 'KDKMP Desa Raciwetan'),
    ('35.25.12.2007', '35.25.12', 'Masangan', 'masangan', 'desa', 'KDKMP Desa Masangan'),
    ('35.25.12.2008', '35.25.12', 'Sidokumpul', 'sidokumpul', 'desa', 'KDKMP Desa Sidokumpul'),
    ('35.25.12.2009', '35.25.12', 'Pegundan', 'pegundan', 'desa', 'KDKMP Desa Pegundan'),
    ('35.25.12.2010', '35.25.12', 'Sukowati', 'sukowati', 'desa', 'KDKMP Desa Sukowati'),
    ('35.25.12.2011', '35.25.12', 'Abar-abir', 'abar-abir', 'desa', 'KDKMP Desa Abar-abir'),
    ('35.25.12.2012', '35.25.12', 'Bungah', 'bungah', 'desa', 'KDKMP Desa Bungah'),
    ('35.25.12.2013', '35.25.12', 'Kemangi', 'kemangi', 'desa', 'KDKMP Desa Kemangi'),
    ('35.25.12.2014', '35.25.12', 'Kisik', 'kisik', 'desa', 'KDKMP Desa Kisik'),
    ('35.25.12.2015', '35.25.12', 'Gumeng', 'gumeng', 'desa', 'KDKMP Desa Gumeng'),
    ('35.25.12.2016', '35.25.12', 'Sukorejo', 'sukorejo', 'desa', 'KDKMP Desa Sukorejo'),
    ('35.25.12.2017', '35.25.12', 'Indrodelik', 'indrodelik', 'desa', 'KDKMP Desa Indrodelik'),
    ('35.25.12.2018', '35.25.12', 'Bedanten', 'bedanten', 'desa', 'KDKMP Desa Bedanten'),
    ('35.25.12.2019', '35.25.12', 'Sungonlegowo', 'sungonlegowo', 'desa', 'KDKMP Desa Sungonlegowo'),
    ('35.25.12.2020', '35.25.12', 'Tanjung Widoro', 'tanjung-widoro', 'desa', 'KDKMP Desa Tanjung Widoro'),
    ('35.25.12.2021', '35.25.12', 'Watuagung', 'watuagung', 'desa', 'KDKMP Desa Watuagung'),
    ('35.25.12.2022', '35.25.12', 'Kramat', 'kramat', 'desa', 'KDKMP Desa Kramat'),
    ('35.25.13.2001', '35.25.13', 'Beton', 'beton', 'desa', 'KDKMP Desa Beton'),
    ('35.25.13.2002', '35.25.13', 'Pranti', 'pranti', 'desa', 'KDKMP Desa Pranti'),
    ('35.25.13.2003', '35.25.13', 'Gadingwatu', 'gadingwatu', 'desa', 'KDKMP Desa Gadingwatu'),
    ('35.25.13.2004', '35.25.13', 'Bringkang', 'bringkang', 'desa', 'KDKMP Desa Bringkang'),
    ('35.25.13.2005', '35.25.13', 'Boteng', 'boteng', 'desa', 'KDKMP Desa Boteng'),
    ('35.25.13.2006', '35.25.13', 'Putatlor', 'putatlor', 'desa', 'KDKMP Desa Putatlor'),
    ('35.25.13.2007', '35.25.13', 'Domas', 'domas', 'desa', 'KDKMP Desa Domas'),
    ('35.25.13.2008', '35.25.13', 'Mojotengah', 'mojotengah', 'desa', 'KDKMP Desa Mojotengah'),
    ('35.25.13.2009', '35.25.13', 'Boboh', 'boboh', 'desa', 'KDKMP Desa Boboh'),
    ('35.25.13.2010', '35.25.13', 'Sidojangkung', 'sidojangkung', 'desa', 'KDKMP Desa Sidojangkung'),
    ('35.25.13.2011', '35.25.13', 'Hendrosari', 'hendrosari', 'desa', 'KDKMP Desa Hendrosari'),
    ('35.25.13.2012', '35.25.13', 'Pelemwatu', 'pelemwatu', 'desa', 'KDKMP Desa Pelemwatu'),
    ('35.25.13.2013', '35.25.13', 'Menganti', 'menganti', 'desa', 'KDKMP Desa Menganti'),
    ('35.25.13.2014', '35.25.13', 'Hulaan', 'hulaan', 'desa', 'KDKMP Desa Hulaan'),
    ('35.25.13.2015', '35.25.13', 'Kepatihan', 'kepatihan', 'desa', 'KDKMP Desa Kepatihan'),
    ('35.25.13.2016', '35.25.13', 'Gempolkurung', 'gempolkurung', 'desa', 'KDKMP Desa Gempolkurung'),
    ('35.25.13.2017', '35.25.13', 'Drancang', 'drancang', 'desa', 'KDKMP Desa Drancang'),
    ('35.25.13.2018', '35.25.13', 'Sidowungu', 'sidowungu', 'desa', 'KDKMP Desa Sidowungu'),
    ('35.25.13.2019', '35.25.13', 'Randupadangan', 'randupadangan', 'desa', 'KDKMP Desa Randupadangan'),
    ('35.25.13.2020', '35.25.13', 'Setro', 'setro', 'desa', 'KDKMP Desa Setro'),
    ('35.25.13.2021', '35.25.13', 'Pengalangan', 'pengalangan', 'desa', 'KDKMP Desa Pengalangan'),
    ('35.25.13.2022', '35.25.13', 'Laban', 'laban', 'desa', 'KDKMP Desa Laban'),
    ('35.25.14.1006', '35.25.14', 'Gulomantung', 'gulomantung', 'kelurahan', 'KDKMP Kelurahan Gulomantung'),
    ('35.25.14.1008', '35.25.14', 'Sidomukti', 'sidomukti', 'kelurahan', 'KDKMP Kelurahan Sidomukti'),
    ('35.25.14.1010', '35.25.14', 'Kebomas', 'kebomas', 'kelurahan', 'KDKMP Kelurahan Kebomas'),
    ('35.25.14.1011', '35.25.14', 'Kawis Anyar', 'kawis-anyar', 'kelurahan', 'KDKMP Kelurahan Kawis Anyar'),
    ('35.25.14.1012', '35.25.14', 'Ngargosari', 'ngargosari', 'kelurahan', 'KDKMP Kelurahan Ngargosari'),
    ('35.25.14.1014', '35.25.14', 'Gending', 'gending', 'kelurahan', 'KDKMP Kelurahan Gending'),
    ('35.25.14.1015', '35.25.14', 'Sidomoro', 'sidomoro', 'kelurahan', 'KDKMP Kelurahan Sidomoro'),
    ('35.25.14.1016', '35.25.14', 'Tenggulunan', 'tenggulunan', 'kelurahan', 'KDKMP Kelurahan Tenggulunan'),
    ('35.25.14.1017', '35.25.14', 'Singosari', 'singosari', 'kelurahan', 'KDKMP Kelurahan Singosari'),
    ('35.25.14.1019', '35.25.14', 'Indro', 'indro', 'kelurahan', 'KDKMP Kelurahan Indro'),
    ('35.25.14.2001', '35.25.14', 'Dahanrejo', 'dahanrejo', 'desa', 'KDKMP Desa Dahanrejo'),
    ('35.25.14.2002', '35.25.14', 'Kembangan', 'kembangan', 'desa', 'KDKMP Desa Kembangan'),
    ('35.25.14.2003', '35.25.14', 'Kedayang', 'kedayang', 'desa', 'KDKMP Desa Kedayang'),
    ('35.25.14.2004', '35.25.14', 'Randuagung', 'randuagung', 'desa', 'KDKMP Desa Randuagung'),
    ('35.25.14.2005', '35.25.14', 'Klangonan', 'klangonan', 'desa', 'KDKMP Desa Klangonan'),
    ('35.25.14.2007', '35.25.14', 'Sukorejo', 'sukorejo', 'desa', 'KDKMP Desa Sukorejo'),
    ('35.25.14.2009', '35.25.14', 'Giri', 'giri', 'desa', 'KDKMP Desa Giri'),
    ('35.25.14.2013', '35.25.14', 'Segoromadu', 'segoromadu', 'desa', 'KDKMP Desa Segoromadu'),
    ('35.25.14.2018', '35.25.14', 'Karangkiring', 'karangkiring', 'desa', 'KDKMP Desa Karangkiring'),
    ('35.25.14.2020', '35.25.14', 'Prambangan', 'prambangan', 'desa', 'KDKMP Desa Prambangan'),
    ('35.25.14.2021', '35.25.14', 'Sekarkurung', 'sekarkurung', 'desa', 'KDKMP Desa Sekarkurung'),
    ('35.25.15.2001', '35.25.15', 'Karangandong', 'karangandong', 'desa', 'KDKMP Desa Karangandong'),
    ('35.25.15.2002', '35.25.15', 'Banjaran', 'banjaran', 'desa', 'KDKMP Desa Banjaran'),
    ('35.25.15.2003', '35.25.15', 'Krikilan', 'krikilan', 'desa', 'KDKMP Desa Krikilan'),
    ('35.25.15.2004', '35.25.15', 'Mojosari Rejo', 'mojosari-rejo', 'desa', 'KDKMP Desa Mojosari Rejo'),
    ('35.25.15.2005', '35.25.15', 'Tanjungan', 'tanjungan', 'desa', 'KDKMP Desa Tanjungan'),
    ('35.25.15.2006', '35.25.15', 'Anom', 'anom', 'desa', 'KDKMP Desa Anom'),
    ('35.25.15.2007', '35.25.15', 'Sumput', 'sumput', 'desa', 'KDKMP Desa Sumput'),
    ('35.25.15.2008', '35.25.15', 'Kesamben Wetan', 'kesamben-wetan', 'desa', 'KDKMP Desa Kesamben Wetan'),
    ('35.25.15.2009', '35.25.15', 'Randegansari', 'randegansari', 'desa', 'KDKMP Desa Randegansari'),
    ('35.25.15.2010', '35.25.15', 'Tenaru', 'tenaru', 'desa', 'KDKMP Desa Tenaru'),
    ('35.25.15.2011', '35.25.15', 'Driyorejo', 'driyorejo', 'desa', 'KDKMP Desa Driyorejo'),
    ('35.25.15.2012', '35.25.15', 'Petiken', 'petiken', 'desa', 'KDKMP Desa Petiken'),
    ('35.25.15.2013', '35.25.15', 'Cangkir', 'cangkir', 'desa', 'KDKMP Desa Cangkir'),
    ('35.25.15.2014', '35.25.15', 'Gadung', 'gadung', 'desa', 'KDKMP Desa Gadung'),
    ('35.25.15.2015', '35.25.15', 'Mulung', 'mulung', 'desa', 'KDKMP Desa Mulung'),
    ('35.25.15.2016', '35.25.15', 'Bambe', 'bambe', 'desa', 'KDKMP Desa Bambe'),
    ('35.25.16.1001', '35.25.16', 'Ngipik', 'ngipik', 'kelurahan', 'KDKMP Kelurahan Ngipik'),
    ('35.25.16.1002', '35.25.16', 'Tlogo Pojok', 'tlogo-pojok', 'kelurahan', 'KDKMP Kelurahan Tlogo Pojok'),
    ('35.25.16.1003', '35.25.16', 'Karang Turi', 'karang-turi', 'kelurahan', 'KDKMP Kelurahan Karang Turi'),
    ('35.25.16.1004', '35.25.16', 'Tlogo Patut', 'tlogo-patut', 'kelurahan', 'KDKMP Kelurahan Tlogo Patut'),
    ('35.25.16.1005', '35.25.16', 'Sukorame', 'sukorame', 'kelurahan', 'KDKMP Kelurahan Sukorame'),
    ('35.25.16.1006', '35.25.16', 'Lumpur', 'lumpur', 'kelurahan', 'KDKMP Kelurahan Lumpur'),
    ('35.25.16.1007', '35.25.16', 'Karang Poh', 'karang-poh', 'kelurahan', 'KDKMP Kelurahan Karang Poh'),
    ('35.25.16.1008', '35.25.16', 'Trate', 'trate', 'kelurahan', 'KDKMP Kelurahan Trate'),
    ('35.25.16.1010', '35.25.16', 'Sido Kumpul', 'sido-kumpul', 'kelurahan', 'KDKMP Kelurahan Sido Kumpul'),
    ('35.25.16.1011', '35.25.16', 'Bedilan', 'bedilan', 'kelurahan', 'KDKMP Kelurahan Bedilan'),
    ('35.25.16.1012', '35.25.16', 'Sukodono', 'sukodono', 'kelurahan', 'KDKMP Kelurahan Sukodono'),
    ('35.25.16.1013', '35.25.16', 'Kemuteran', 'kemuteran', 'kelurahan', 'KDKMP Kelurahan Kemuteran'),
    ('35.25.16.1014', '35.25.16', 'Pekelingan', 'pekelingan', 'kelurahan', 'KDKMP Kelurahan Pekelingan'),
    ('35.25.16.1015', '35.25.16', 'Kroman', 'kroman', 'kelurahan', 'KDKMP Kelurahan Kroman'),
    ('35.25.16.1016', '35.25.16', 'Kebungson', 'kebungson', 'kelurahan', 'KDKMP Kelurahan Kebungson'),
    ('35.25.16.1017', '35.25.16', 'Pekauman', 'pekauman', 'kelurahan', 'KDKMP Kelurahan Pekauman'),
    ('35.25.16.2009', '35.25.16', 'Tlogobendung', 'tlogobendung', 'desa', 'KDKMP Desa Tlogobendung'),
    ('35.25.16.2018', '35.25.16', 'Gapuro Sukolilo', 'gapuro-sukolilo', 'desa', 'KDKMP Desa Gapuro Sukolilo'),
    ('35.25.16.2019', '35.25.16', 'Pulopancikan', 'pulopancikan', 'desa', 'KDKMP Desa Pulopancikan'),
    ('35.25.16.2020', '35.25.16', 'Kramatinggil', 'kramatinggil', 'desa', 'KDKMP Desa Kramatinggil'),
    ('35.25.16.2021', '35.25.16', 'Sidorukun', 'sidorukun', 'desa', 'KDKMP Desa Sidorukun'),
    ('35.25.17.2001', '35.25.17', 'Dekatagung', 'dekatagung', 'desa', 'KDKMP Desa Dekatagung'),
    ('35.25.17.2002', '35.25.17', 'Kumalasa', 'kumalasa', 'desa', 'KDKMP Desa Kumalasa'),
    ('35.25.17.2003', '35.25.17', 'Suwari', 'suwari', 'desa', 'KDKMP Desa Suwari'),
    ('35.25.17.2004', '35.25.17', 'Pudakitbarat', 'pudakitbarat', 'desa', 'KDKMP Desa Pudakitbarat'),
    ('35.25.17.2005', '35.25.17', 'Pudakittimur', 'pudakittimur', 'desa', 'KDKMP Desa Pudakittimur'),
    ('35.25.17.2006', '35.25.17', 'Lebak', 'lebak', 'desa', 'KDKMP Desa Lebak'),
    ('35.25.17.2007', '35.25.17', 'Bululanjang', 'bululanjang', 'desa', 'KDKMP Desa Bululanjang'),
    ('35.25.17.2008', '35.25.17', 'Patarselamat', 'patarselamat', 'desa', 'KDKMP Desa Patarselamat'),
    ('35.25.17.2009', '35.25.17', 'Kotakusuma', 'kotakusuma', 'desa', 'KDKMP Desa Kotakusuma'),
    ('35.25.17.2010', '35.25.17', 'Sungaiteluk', 'sungaiteluk', 'desa', 'KDKMP Desa Sungaiteluk'),
    ('35.25.17.2011', '35.25.17', 'Gunungteguh', 'gunungteguh', 'desa', 'KDKMP Desa Gunungteguh'),
    ('35.25.17.2012', '35.25.17', 'Sawahmulya', 'sawahmulya', 'desa', 'KDKMP Desa Sawahmulya'),
    ('35.25.17.2013', '35.25.17', 'Sungairujing', 'sungairujing', 'desa', 'KDKMP Desa Sungairujing'),
    ('35.25.17.2014', '35.25.17', 'Balikterus', 'balikterus', 'desa', 'KDKMP Desa Balikterus'),
    ('35.25.17.2015', '35.25.17', 'Kebontelukdalam', 'kebontelukdalam', 'desa', 'KDKMP Desa Kebontelukdalam'),
    ('35.25.17.2016', '35.25.17', 'Sidogedungbatu', 'sidogedungbatu', 'desa', 'KDKMP Desa Sidogedungbatu'),
    ('35.25.17.2017', '35.25.17', 'Daun', 'daun', 'desa', 'KDKMP Desa Daun'),
    ('35.25.18.2001', '35.25.18', 'Gelam', 'gelam', 'desa', 'KDKMP Desa Gelam'),
    ('35.25.18.2002', '35.25.18', 'Sukaoneng', 'sukaoneng', 'desa', 'KDKMP Desa Sukaoneng'),
    ('35.25.18.2003', '35.25.18', 'Sukalela', 'sukalela', 'desa', 'KDKMP Desa Sukalela'),
    ('35.25.18.2004', '35.25.18', 'Pekalongan', 'pekalongan', 'desa', 'KDKMP Desa Pekalongan'),
    ('35.25.18.2005', '35.25.18', 'Tambak', 'tambak', 'desa', 'KDKMP Desa Tambak'),
    ('35.25.18.2006', '35.25.18', 'Telukjatidawang', 'telukjatidawang', 'desa', 'KDKMP Desa Telukjatidawang'),
    ('35.25.18.2007', '35.25.18', 'Klumpanggubug', 'klumpanggubug', 'desa', 'KDKMP Desa Klumpanggubug'),
    ('35.25.18.2008', '35.25.18', 'Grejeg', 'grejeg', 'desa', 'KDKMP Desa Grejeg'),
    ('35.25.18.2009', '35.25.18', 'Tanjungori', 'tanjungori', 'desa', 'KDKMP Desa Tanjungori'),
    ('35.25.18.2010', '35.25.18', 'Peromaan', 'peromaan', 'desa', 'KDKMP Desa Peromaan'),
    ('35.25.18.2011', '35.25.18', 'Diponggo', 'diponggo', 'desa', 'KDKMP Desa Diponggo'),
    ('35.25.18.2012', '35.25.18', 'Kepuhteluk', 'kepuhteluk', 'desa', 'KDKMP Desa Kepuhteluk'),
    ('35.25.18.2013', '35.25.18', 'Kepuhlegundi', 'kepuhlegundi', 'desa', 'KDKMP Desa Kepuhlegundi')
)
INSERT INTO villages (code, subdistrict_id, name, slug, type, business_name, is_active)
SELECT
  rv.code,
  s.id,
  rv.name,
  rv.slug,
  rv.type,
  rv.business_name,
  false
FROM raw_villages rv
JOIN subdistricts s ON s.code = rv.subdistrict_code
ON CONFLICT (code) DO UPDATE SET
  subdistrict_id = EXCLUDED.subdistrict_id,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  type = EXCLUDED.type;


-- 3. AKTIVASI KDKMP PILOT (KEC. SIDAYU) & DESA UJI ISOLASI RLS (KEC. BUNGAH)

-- Pastikan hanya Kec. Sidayu (35.25.09) yang aktif untuk fase pilot awal
UPDATE public.subdistricts
SET is_active = (code = '35.25.09');

-- Reset status aktif desa sebelum mengaktifkan 3 koperasi target seed
UPDATE public.villages
SET is_active = false
WHERE code NOT IN ('35.25.09.2008', '35.25.09.2001', '35.25.12.2016');

-- 3a. Koperasi utama pilot: KDKMP Desa Golokan (35.25.09.2008, /sidayu/golokan)
UPDATE public.villages
SET
  business_name = 'KDKMP Desa Golokan',
  whatsapp_number = '6281234567801',
  address = 'Jl. Raya Golokan No. 12, Desa Golokan, Kec. Sidayu, Kab. Gresik',
  gmaps_url = 'https://maps.google.com/?q=-6.9925,112.5644',
  opening_hour = '07:00',
  closing_hour = '20:00',
  free_delivery_min = 50000,
  delivery_note = 'Gratis ongkir area Desa Golokan min. belanja Rp 50.000',
  is_active = true
WHERE code = '35.25.09.2008';

-- 3b. Koperasi pendamping pilot: KDKMP Desa Sukorejo Sidayu (35.25.09.2001, /sidayu/sukorejo)
-- Jam tutup lewat tengah malam (16:00 - 01:00) untuk uji storeHours
UPDATE public.villages
SET
  business_name = 'KDKMP Desa Sukorejo',
  whatsapp_number = '6281234567802',
  address = 'Jl. Poros Desa Sukorejo RT 02 RW 01, Kec. Sidayu, Kab. Gresik',
  gmaps_url = 'https://maps.google.com/?q=-6.9880,112.5580',
  opening_hour = '16:00',
  closing_hour = '01:00',
  free_delivery_min = 40000,
  delivery_note = 'Gratis ongkir area Desa Sukorejo min. belanja Rp 40.000',
  is_active = true
WHERE code = '35.25.09.2001';

-- 3c. Koperasi uji isolasi RLS & slug kembar: KDKMP Desa Sukorejo Bungah (35.25.12.2016)
-- Koperasi aktif (is_active = true), namun berada di Kec. Bungah yang nonaktif (is_active = false)
UPDATE public.villages
SET
  business_name = 'KDKMP Desa Sukorejo',
  whatsapp_number = '6281234567899',
  address = 'Jl. Desa Sukorejo No. 5, Kec. Bungah, Kab. Gresik',
  gmaps_url = 'https://maps.google.com/?q=-7.0450,112.5750',
  opening_hour = '07:00',
  closing_hour = '19:00',
  free_delivery_min = 50000,
  delivery_note = 'Gratis ongkir area Desa Sukorejo Kec. Bungah',
  is_active = true
WHERE code = '35.25.12.2016';

-- 4. KATEGORI PRODUK (4 KATEGORI PER KOPERASI)
WITH target_villages AS (
  SELECT id, code
  FROM public.villages
  WHERE code IN ('35.25.09.2008', '35.25.09.2001', '35.25.12.2016')
),
raw_categories (name, sort_order) AS (
  VALUES
    ('Beras & Pangan Pokok', 1),
    ('Minyak & Gula', 2),
    ('Bumbu & Dapur', 3),
    ('Minuman & Harian', 4)
)
INSERT INTO public.categories (village_id, name, sort_order)
SELECT
  tv.id,
  rc.name,
  rc.sort_order
FROM target_villages tv
CROSS JOIN raw_categories rc
ON CONFLICT (village_id, name) DO UPDATE SET
  sort_order = EXCLUDED.sort_order;

-- 5. PRODUK SEMBAKO DEMO (10 PRODUK PER KOPERASI AKTIF + PRODUK UJI RLS)

DELETE FROM public.products
WHERE village_id IN (
  SELECT id FROM public.villages
  WHERE code IN ('35.25.09.2008', '35.25.09.2001', '35.25.12.2016')
);

-- 5a. 10 Produk KDKMP Desa Golokan (35.25.09.2008)
WITH v AS (
  SELECT id FROM public.villages WHERE code = '35.25.09.2008'
),
items (category_name, name, description, price, original_price, unit, stock_status, is_featured, sort_order) AS (
  VALUES
    ('Beras & Pangan Pokok', 'Beras Pandan Wangi 5kg', 'Beras pulen wangi kualitas super hasil panen lokal.', 72000, 78000, 'karung', 'ready', true, 1),
    ('Beras & Pangan Pokok', 'Beras IR64 Medium 5kg', 'Beras harian bersih tanpa pemutih.', 62000, NULL, 'karung', 'ready', false, 2),
    ('Beras & Pangan Pokok', 'Telur Ayam Negeri 1kg', 'Telur ayam segar langsung dari peternak lokal.', 28000, 31000, 'kg', 'ready', true, 3),
    ('Minyak & Gula', 'Minyak Goreng Kemasan 2L', 'Minyak goreng kelapa sawit jernih kemasan pouch 2 liter.', 35000, 38000, 'pouch', 'ready', true, 4),
    ('Minyak & Gula', 'Gula Pasir Kristal 1kg', 'Gula pasir putih bersih manis alami.', 17500, NULL, 'kg', 'ready', false, 5),
    ('Bumbu & Dapur', 'Tepung Terigu Serbaguna 1kg', 'Tepung terigu protein sedang untuk aneka olahan.', 12500, NULL, 'bungkus', 'ready', false, 6),
    ('Bumbu & Dapur', 'Kecap Manis Botol 600ml', 'Kecap manis kedelai hitam pilihan.', 21500, 24000, 'botol', 'ready', false, 7),
    ('Bumbu & Dapur', 'Bawang Merah Pilihan 500g', 'Bawang merah kering ukuran sedang siap olah.', 19500, NULL, 'pack', 'pre-order', false, 8),
    ('Minuman & Harian', 'Kopi Bubuk Spesial 165g', 'Kopi hitam bubuk aroma mantap.', 16500, NULL, 'bungkus', 'ready', false, 9),
    ('Minuman & Harian', 'Mi Instan Goreng Paket 5 pcs', 'Paket hemat 5 bungkus mi instan goreng.', 14500, 16000, 'pack', 'habis', false, 10)
)
INSERT INTO public.products (
  village_id, category_id, name, description, price, original_price, unit, stock_status, is_featured, sort_order
)
SELECT
  v.id,
  c.id,
  i.name,
  i.description,
  i.price,
  i.original_price,
  i.unit,
  i.stock_status,
  i.is_featured,
  i.sort_order
FROM v
CROSS JOIN items i
JOIN public.categories c ON c.village_id = v.id AND c.name = i.category_name;

-- 5b. 10 Produk KDKMP Desa Sukorejo Sidayu (35.25.09.2001)
WITH v AS (
  SELECT id FROM public.villages WHERE code = '35.25.09.2001'
),
items (category_name, name, description, price, original_price, unit, stock_status, is_featured, sort_order) AS (
  VALUES
    ('Beras & Pangan Pokok', 'Beras Rojolele Super 5kg', 'Beras pilihan pulen dan bersih kemasan 5 kg.', 71000, 75000, 'karung', 'ready', true, 1),
    ('Beras & Pangan Pokok', 'Beras SPHP Bulog 5kg', 'Beras stabilisasi pasokan dan harga pangan.', 57500, NULL, 'karung', 'ready', true, 2),
    ('Beras & Pangan Pokok', 'Telur Ayam Kampung 10 Butir', 'Telur ayam kampung asli segar.', 25000, NULL, 'pack', 'pre-order', false, 3),
    ('Minyak & Gula', 'Minyak Goreng Kita 1L', 'Minyak goreng kemasan bantal 1 liter.', 16000, 17500, 'liter', 'ready', true, 4),
    ('Minyak & Gula', 'Gula Pasir Lokal 1kg', 'Gula tebu murni produksi Jawa Timur.', 17000, NULL, 'kg', 'ready', false, 5),
    ('Bumbu & Dapur', 'Garam Dapur Beryodium 500g', 'Garam halus beryodium untuk masakan harian.', 6000, NULL, 'pack', 'ready', false, 6),
    ('Bumbu & Dapur', 'Saus Sambal Botol 335ml', 'Saus sambal pedas segar dari cabai pilihan.', 12500, 14000, 'botol', 'ready', false, 7),
    ('Bumbu & Dapur', 'Bawang Putih Kating 250g', 'Bawang putih kating siung besar.', 11000, NULL, 'pack', 'habis', false, 8),
    ('Minuman & Harian', 'Teh Celup Isi 25 Kantong', 'Teh hitam celup harum dan pekat.', 7500, NULL, 'kotak', 'ready', false, 9),
    ('Minuman & Harian', 'Sabun Cuci Piring Jeruk Nipis 750ml', 'Pembersih lemak membandel peralatan dapur.', 13500, 15500, 'pouch', 'ready', false, 10)
)
INSERT INTO public.products (
  village_id, category_id, name, description, price, original_price, unit, stock_status, is_featured, sort_order
)
SELECT
  v.id,
  c.id,
  i.name,
  i.description,
  i.price,
  i.original_price,
  i.unit,
  i.stock_status,
  i.is_featured,
  i.sort_order
FROM v
CROSS JOIN items i
JOIN public.categories c ON c.village_id = v.id AND c.name = i.category_name;

-- 5c. Produk KDKMP Desa Sukorejo Kec. Bungah (35.25.12.2016) untuk uji isolasi RLS kecamatan nonaktif
WITH v AS (
  SELECT id FROM public.villages WHERE code = '35.25.12.2016'
),
items (category_name, name, description, price, original_price, unit, stock_status, is_featured, sort_order) AS (
  VALUES
    ('Beras & Pangan Pokok', 'Beras Bungah Spesial 5kg', 'Produk uji isolasi RLS di kecamatan nonaktif.', 70000, 74000, 'karung', 'ready', true, 1),
    ('Minyak & Gula', 'Minyak Goreng Bungah 2L', 'Produk uji isolasi RLS di kecamatan nonaktif.', 34000, NULL, 'pouch', 'ready', false, 2)
)
INSERT INTO public.products (
  village_id, category_id, name, description, price, original_price, unit, stock_status, is_featured, sort_order
)
SELECT
  v.id,
  c.id,
  i.name,
  i.description,
  i.price,
  i.original_price,
  i.unit,
  i.stock_status,
  i.is_featured,
  i.sort_order
FROM v
CROSS JOIN items i
JOIN public.categories c ON c.village_id = v.id AND c.name = i.category_name;
