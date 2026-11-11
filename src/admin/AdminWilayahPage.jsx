import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import {
  MapPin,
  Building2,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  AlertCircle,
  KeyRound,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Badge,
  Input,
  Select,
  SearchableSelect,
  Sheet,
  Skeleton,
  EmptyState,
  Num,
  DateText,
  Pagination,
} from '../components/ui';
import {
  getAdminSubdistricts,
  createAdminSubdistrict,
  updateAdminSubdistrict,
  toggleAdminSubdistrictActive,
  getAdminVillages,
  validateVillagePayload,
  createAdminVillage,
  updateAdminVillage,
  getAdminVillageAdmins,
  assignVillageAdmin,
  revokeVillageAdmin,
  superAdminResetUserPassword,
  slugify,
} from '../lib/api';
import { generateRandomPassword } from '../lib/password';
import { isReservedSlug } from '../config/reservedSlugs';

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
  id,
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 ${
        checked ? 'bg-primary-700' : 'bg-surface-3 border-border'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function buildCredentialsWhatsAppUrl(phone, { email, password, villageName, type = 'reset' }) {
  const normPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const targetPhone = normPhone.startsWith('0')
    ? `62${normPhone.slice(1)}`
    : normPhone.startsWith('62')
    ? normPhone
    : normPhone
    ? `62${normPhone}`
    : '';

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://katalog-kdkmp-gresik.pages.dev';

  const intro =
    type === 'created'
      ? `Halo Pengurus ${villageName || 'KDKMP'},\n\nAkun Manager KDKMP Anda telah dibuat:`
      : `Halo Pengurus ${villageName || 'KDKMP'},\n\nKata sandi akun Manager KDKMP Anda telah direset:`;

  const msg = `${intro}\n- Email: ${email}\n- Kata Sandi Sementara: ${password}\n- Tautan Masuk: ${origin}/admin/login\n\nSilakan masuk dan segera perbarui kata sandi Anda. Terima kasih.`;

  if (!targetPhone) {
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
}

const SUBDISTRICT_PAGE_SIZE = 10;
const VILLAGE_PAGE_SIZE = 10;
const ADMIN_PAGE_SIZE = 10;

export function AdminWilayahPage({
  initialSubdistricts = null,
  initialVillages = null,
  initialVillageAdmins = null,
  initialTab = 'kecamatan',
  initialVillagePage = 1,
  initialSubdistrictPage = 1,
  initialAdminPage = 1,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || initialTab;

  const setTab = (newTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', newTab);
        return next;
      },
      { replace: true }
    );
  };

  // -----------------------------------------------------------
  // DATA STATE & PAGINATION STATE
  // -----------------------------------------------------------
  const [subdistrictPage, setSubdistrictPage] = useState(
    initialSubdistrictPage
  );
  const [villagePage, setVillagePage] = useState(initialVillagePage);
  const [adminPage, setAdminPage] = useState(initialAdminPage);

  const [subdistricts, setSubdistricts] = useState(
    () => initialSubdistricts ?? []
  );
  const [villages, setVillages] = useState(() => initialVillages ?? []);
  const [villageAdmins, setVillageAdmins] = useState(
    () => initialVillageAdmins ?? []
  );

  const [loadingSubdistricts, setLoadingSubdistricts] = useState(
    () => initialSubdistricts === null
  );
  const [loadingVillages, setLoadingVillages] = useState(
    () => initialVillages === null
  );
  const [loadingAdmins, setLoadingAdmins] = useState(
    () => initialVillageAdmins === null
  );

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? '' : cur));
    }, 3500);
  };

  const loadAllSubdistricts = useCallback(async (force = false) => {
    try {
      const data = await getAdminSubdistricts({ force });
      setSubdistricts(data);
    } catch {
      // ignore
    } finally {
      setLoadingSubdistricts(false);
    }
  }, []);

  const loadAllVillages = useCallback(async (force = false) => {
    try {
      const data = await getAdminVillages({ force });
      setVillages(data);
    } catch {
      // ignore
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  const loadAllAdmins = useCallback(async (force = false) => {
    try {
      const data = await getAdminVillageAdmins({ force });
      setVillageAdmins(data);
    } catch {
      // ignore
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      if (!active) return;
      if (initialSubdistricts === null) {
        await loadAllSubdistricts();
      }
      if (initialVillages === null) {
        await loadAllVillages();
      }
      if (initialVillageAdmins === null) {
        await loadAllAdmins();
      }
    });

    return () => {
      active = false;
    };
  }, [
    initialSubdistricts,
    initialVillages,
    initialVillageAdmins,
    loadAllSubdistricts,
    loadAllVillages,
    loadAllAdmins,
  ]);

  // -----------------------------------------------------------
  // TAB 1: KECAMATAN STATE & HANDLERS
  // -----------------------------------------------------------
  const [subdistrictSheetOpen, setSubdistrictSheetOpen] = useState(false);
  const [editingSubdistrict, setEditingSubdistrict] = useState(null);
  const [subdistrictForm, setSubdistrictForm] = useState({
    name: '',
    code: '',
    slug: '',
    sort_order: 1,
    is_active: false,
  });
  const [subdistrictError, setSubdistrictError] = useState('');
  const [savingSubdistrict, setSavingSubdistrict] = useState(false);

  const totalSubdistrictPages =
    Math.ceil(subdistricts.length / SUBDISTRICT_PAGE_SIZE) || 1;
  const paginatedSubdistricts = useMemo(() => {
    const page = Math.min(subdistrictPage, totalSubdistrictPages);
    const start = (page - 1) * SUBDISTRICT_PAGE_SIZE;
    return subdistricts.slice(start, start + SUBDISTRICT_PAGE_SIZE);
  }, [subdistricts, subdistrictPage, totalSubdistrictPages]);

  const openAddSubdistrict = () => {
    setEditingSubdistrict(null);
    setSubdistrictForm({
      name: '',
      code: '',
      slug: '',
      sort_order: subdistricts.length + 1,
      is_active: false,
    });
    setSubdistrictError('');
    setSubdistrictSheetOpen(true);
  };

  const openEditSubdistrict = (sub) => {
    setEditingSubdistrict(sub);
    setSubdistrictForm({
      name: sub.name,
      code: sub.code,
      slug: sub.slug,
      sort_order: sub.sort_order ?? 0,
      is_active: Boolean(sub.is_active),
    });
    setSubdistrictError('');
    setSubdistrictSheetOpen(true);
  };

  const handleSubdistrictNameChange = (e) => {
    const val = e.target.value;
    setSubdistrictForm((prev) => {
      const isAutoSlug =
        !editingSubdistrict && (!prev.slug || prev.slug === slugify(prev.name));
      return {
        ...prev,
        name: val,
        slug: isAutoSlug ? slugify(val) : prev.slug,
      };
    });
  };

  const handleSaveSubdistrict = async (e) => {
    e.preventDefault();
    setSubdistrictError('');

    const name = subdistrictForm.name.trim();
    const code = subdistrictForm.code.trim();
    const slug = subdistrictForm.slug.trim().toLowerCase();

    if (!name) {
      setSubdistrictError('Nama kecamatan wajib diisi.');
      return;
    }
    if (!code) {
      setSubdistrictError('Kode Kemendagri wajib diisi.');
      return;
    }
    if (!slug) {
      setSubdistrictError('Slug wajib diisi.');
      return;
    }
    if (isReservedSlug(slug)) {
      setSubdistrictError(
        'Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).'
      );
      return;
    }

    setSavingSubdistrict(true);
    try {
      if (editingSubdistrict) {
        await updateAdminSubdistrict(editingSubdistrict.id, {
          name,
          code,
          slug,
          sort_order: Number(subdistrictForm.sort_order) || 0,
          is_active: Boolean(subdistrictForm.is_active),
        });
        showToast('Kecamatan berhasil diperbarui.');
      } else {
        await createAdminSubdistrict({
          name,
          code,
          slug,
          sort_order: Number(subdistrictForm.sort_order) || 0,
          is_active: Boolean(subdistrictForm.is_active),
        });
        showToast('Kecamatan berhasil ditambahkan.');
      }
      setSubdistrictSheetOpen(false);
      await loadAllSubdistricts(true);
    } catch (err) {
      setSubdistrictError(err.message || 'Gagal menyimpan kecamatan.');
    } finally {
      setSavingSubdistrict(false);
    }
  };

  const handleToggleSubdistrictActive = async (sub, nextActive) => {
    const prev = [...subdistricts];
    setSubdistricts((cur) =>
      cur.map((s) => (s.id === sub.id ? { ...s, is_active: nextActive } : s))
    );

    try {
      await toggleAdminSubdistrictActive(sub.id, nextActive);
      showToast(
        `Kecamatan ${sub.name} ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      await loadAllSubdistricts(true);
    } catch (err) {
      setSubdistricts(prev);
      showToast(err.message || 'Gagal mengubah status kecamatan.');
    }
  };

  // -----------------------------------------------------------
  // TAB 2: KOPERASI STATE & HANDLERS
  // -----------------------------------------------------------
  const [villageFilterSubdistrict, setVillageFilterSubdistrict] =
    useState('all');
  const [villageSearch, setVillageSearch] = useState('');
  const [villageSheetOpen, setVillageSheetOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState(null);
  const [villageForm, setVillageForm] = useState({
    subdistrict_id: '',
    type: 'desa',
    name: '',
    slug: '',
    business_name: '',
    code: '',
    whatsapp_number: '',
    is_active: false,
  });
  const [villageError, setVillageError] = useState('');
  const [savingVillage, setSavingVillage] = useState(false);

  const subdistrictOptions = useMemo(() => {
    return subdistricts.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.code})`,
      sublabel: s.code,
    }));
  }, [subdistricts]);

  const filterSubdistrictOptions = useMemo(() => {
    return [
      { value: 'all', label: `Semua Kecamatan (${villages.length})` },
      ...subdistricts.map((s) => {
        const count = villages.filter((v) => v.subdistrict_id === s.id).length;
        return {
          value: s.id,
          label: `Kec. ${s.name} (${count})`,
        };
      }),
    ];
  }, [subdistricts, villages]);

  const filteredVillages = useMemo(() => {
    let result = villages;
    if (villageFilterSubdistrict !== 'all') {
      result = result.filter(
        (v) => v.subdistrict_id === villageFilterSubdistrict
      );
    }
    const q = villageSearch.trim().toLowerCase();
    if (q) {
      result = result.filter((v) => {
        const bName = (v.business_name || '').toLowerCase();
        const vName = (v.name || '').toLowerCase();
        const sName = (v.subdistrict_name || '').toLowerCase();
        const slug = (v.slug || '').toLowerCase();
        return (
          bName.includes(q) ||
          vName.includes(q) ||
          sName.includes(q) ||
          slug.includes(q)
        );
      });
    }
    return result;
  }, [villages, villageFilterSubdistrict, villageSearch]);

  const totalVillagePages =
    Math.ceil(filteredVillages.length / VILLAGE_PAGE_SIZE) || 1;
  const paginatedVillages = useMemo(() => {
    const page = Math.min(villagePage, totalVillagePages);
    const start = (page - 1) * VILLAGE_PAGE_SIZE;
    return filteredVillages.slice(start, start + VILLAGE_PAGE_SIZE);
  }, [filteredVillages, villagePage, totalVillagePages]);

  const openAddVillage = () => {
    const defaultSubId =
      villageFilterSubdistrict !== 'all'
        ? villageFilterSubdistrict
        : subdistricts[0]?.id || '';

    setEditingVillage(null);
    setVillageForm({
      subdistrict_id: defaultSubId,
      type: 'desa',
      name: '',
      slug: '',
      business_name: '',
      code: '',
      whatsapp_number: '',
      is_active: false,
    });
    setVillageError('');
    setVillageSheetOpen(true);
  };

  const openEditVillage = (village) => {
    setEditingVillage(village);
    setVillageForm({
      subdistrict_id: village.subdistrict_id,
      type: village.type || 'desa',
      name: village.name || '',
      slug: village.slug || '',
      business_name: village.business_name || '',
      code: village.code || '',
      whatsapp_number: village.whatsapp_number || '',
      is_active: Boolean(village.is_active),
    });
    setVillageError('');
    setVillageSheetOpen(true);
  };

  const handleVillageNameChange = (e) => {
    const val = e.target.value;
    setVillageForm((prev) => {
      const typeLabel = prev.type === 'kelurahan' ? 'Kelurahan' : 'Desa';
      const autoSlug = !editingVillage && (!prev.slug || prev.slug === slugify(prev.name));
      const autoBiz =
        !editingVillage &&
        (!prev.business_name ||
          prev.business_name === `KDKMP ${typeLabel} ${prev.name}`);

      return {
        ...prev,
        name: val,
        slug: autoSlug ? slugify(val) : prev.slug,
        business_name: autoBiz ? `KDKMP ${typeLabel} ${val}` : prev.business_name,
      };
    });
  };

  const handleVillageTypeChange = (e) => {
    const nextType = e.target.value;
    setVillageForm((prev) => {
      const oldTypeLabel = prev.type === 'kelurahan' ? 'Kelurahan' : 'Desa';
      const newTypeLabel = nextType === 'kelurahan' ? 'Kelurahan' : 'Desa';
      const isDefaultBizName =
        prev.business_name === `KDKMP ${oldTypeLabel} ${prev.name}` ||
        !prev.business_name;

      return {
        ...prev,
        type: nextType,
        business_name: isDefaultBizName
          ? `KDKMP ${newTypeLabel} ${prev.name}`
          : prev.business_name,
      };
    });
  };

  const handleSaveVillage = async (e) => {
    e.preventDefault();
    setVillageError('');

    const validation = validateVillagePayload(
      villageForm,
      villages,
      editingVillage?.id || null
    );

    if (!validation.isValid) {
      setVillageError(validation.error);
      return;
    }

    setSavingVillage(true);
    try {
      if (editingVillage) {
        await updateAdminVillage(editingVillage.id, validation.sanitized);
        showToast('Data koperasi berhasil diperbarui.');
      } else {
        await createAdminVillage(validation.sanitized);
        showToast('Koperasi baru berhasil ditambahkan.');
      }
      setVillageSheetOpen(false);
      await loadAllVillages(true);
      await loadAllSubdistricts(true);
    } catch (err) {
      setVillageError(err.message || 'Gagal menyimpan koperasi.');
    } finally {
      setSavingVillage(false);
    }
  };

  // -----------------------------------------------------------
  // TAB 3: ADMIN KOPERASI STATE & HANDLERS
  // -----------------------------------------------------------
  const [assignEmail, setAssignEmail] = useState('');
  const [assignVillageId, setAssignVillageId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  // Fitur A & B: Reset Sandi & Kredensial Manager Baru
  const [resetAdminTarget, setResetAdminTarget] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [newAdminCredentials, setNewAdminCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyText = async (text) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenResetModal = (adm) => {
    setResetAdminTarget(adm);
    setResetTempPassword(generateRandomPassword());
    setResetResult(null);
    setCopied(false);
  };

  const handleExecuteResetPassword = async () => {
    if (!resetAdminTarget) return;
    setResetSubmitting(true);
    try {
      await superAdminResetUserPassword({
        userId: resetAdminTarget.user_id,
        newPassword: resetTempPassword,
      });
      setResetResult({
        email: resetAdminTarget.email,
        password: resetTempPassword,
        villageName: resetAdminTarget.business_name || resetAdminTarget.village_name,
        whatsappNumber: resetAdminTarget.whatsapp_number,
      });
      showToast('Kata sandi berhasil direset.');
    } catch (err) {
      showToast(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const villageSelectOptions = useMemo(() => {
    return villages.map((v) => ({
      value: v.id,
      label: v.business_name || v.name,
      sublabel: `${v.type === 'kelurahan' ? 'Kel.' : 'Desa'} ${v.name} · Kec. ${v.subdistrict_name || '-'}`,
    }));
  }, [villages]);

  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');

    const email = assignEmail.trim().toLowerCase();
    const vid = assignVillageId.trim();

    if (!email) {
      setAssignError('Email wajib diisi.');
      return;
    }
    if (!vid) {
      setAssignError('Pilih koperasi tujuan.');
      return;
    }

    const initialPwd = generateRandomPassword();
    setAssigning(true);
    try {
      const res = await assignVillageAdmin({
        email,
        villageId: vid,
        autoCreate: true,
        initialPassword: initialPwd,
      });

      const selectedVillage = villages.find((v) => v.id === vid);
      const villageName =
        selectedVillage?.business_name || selectedVillage?.name || 'KDKMP';
      const whatsappNumber = selectedVillage?.whatsapp_number || '';

      if (res?.is_new) {
        setNewAdminCredentials({
          email,
          password: res.initial_password || initialPwd,
          villageName,
          whatsappNumber,
        });
        setAssignSuccess('Manager baru berhasil dibuat dan ditetapkan.');
      } else {
        setAssignSuccess('Manager berhasil ditetapkan.');
      }

      setAssignEmail('');
      setAssignVillageId('');
      await loadAllAdmins(true);
    } catch (err) {
      setAssignError(
        err.message || 'Gagal menetapkan manager KDKMP.'
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeVillageAdmin(revokeTarget.user_id);
      showToast(
        `Akses manager untuk ${revokeTarget.email} berhasil dicabut.`
      );
      setRevokeTarget(null);
      await loadAllAdmins(true);
    } catch (err) {
      showToast(err.message || 'Gagal mencabut manager.');
    } finally {
      setRevoking(false);
    }
  };

  const totalAdminPages =
    Math.ceil(villageAdmins.length / ADMIN_PAGE_SIZE) || 1;
  const paginatedAdmins = useMemo(() => {
    const page = Math.min(adminPage, totalAdminPages);
    const start = (page - 1) * ADMIN_PAGE_SIZE;
    return villageAdmins.slice(start, start + ADMIN_PAGE_SIZE);
  }, [villageAdmins, adminPage, totalAdminPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-bold text-text md:text-2xl">
          Wilayah
        </h1>
        {toastMessage && (
          <div
            role="status"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-700 shadow-sm"
          >
            <Check className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Pilihan Manajemen Wilayah"
        className="flex border-b border-border"
      >
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'kecamatan'}
          onClick={() => setTab('kecamatan')}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            currentTab === 'kecamatan'
              ? 'border-primary-700 text-primary-700'
              : 'border-transparent text-text-3 hover:text-text'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Kecamatan</span>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-text-2">
            <Num value={subdistricts.length} />
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'koperasi'}
          onClick={() => setTab('koperasi')}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            currentTab === 'koperasi'
              ? 'border-primary-700 text-primary-700'
              : 'border-transparent text-text-3 hover:text-text'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Koperasi</span>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-text-2">
            <Num value={villages.length} />
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'admin'}
          onClick={() => setTab('admin')}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            currentTab === 'admin'
              ? 'border-primary-700 text-primary-700'
              : 'border-transparent text-text-3 hover:text-text'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Admin Koperasi</span>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-text-2">
            <Num value={villageAdmins.length} />
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: KECAMATAN */}
      {/* ========================================================= */}
      {currentTab === 'kecamatan' && (
        <section aria-label="Daftar Kecamatan" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-text-2">
              <Num value={subdistricts.length} /> kecamatan terdaftar
            </span>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openAddSubdistrict}
              className="min-h-[44px]"
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah Kecamatan
            </Button>
          </div>

          {loadingSubdistricts ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : subdistricts.length === 0 ? (
            <EmptyState
              message="Belum ada kecamatan."
              actionLabel="Tambah Kecamatan"
              onAction={openAddSubdistrict}
            />
          ) : (
            <>
              {/* Mobile cards (<lg) */}
              <div className="space-y-3 lg:hidden">
                {paginatedSubdistricts.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-text">
                          Kec. {sub.name}
                        </h2>
                        <span className="font-mono text-xs text-text-3">
                          {sub.code} · /{sub.slug}
                        </span>
                      </div>
                      <Badge variant={sub.is_active ? 'ok' : 'mute'}>
                        {sub.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="text-xs text-text-2">
                        <span className="font-semibold text-text">
                          <Num value={sub.village_count ?? 0} />
                        </span>{' '}
                        koperasi
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-3">Saklar</span>
                          <ToggleSwitch
                            checked={Boolean(sub.is_active)}
                            onChange={(next) =>
                              handleToggleSubdistrictActive(sub, next)
                            }
                            aria-label={`Saklar aktif Kecamatan ${sub.name}`}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditSubdistrict(sub)}
                          className="min-h-[44px]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only md:not-sr-only md:ml-1">
                            Ubah
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table (>=lg) */}
              <div className="hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-3 text-xs font-bold text-text-2 uppercase">
                    <tr>
                      <th className="px-4 py-3">Kecamatan</th>
                      <th className="px-4 py-3">Kode Kemendagri</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3 text-right">Koperasi</th>
                      <th className="px-4 py-3 text-center">Status Pilot</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedSubdistricts.map((sub) => (
                      <tr
                        key={sub.id}
                        className="transition-colors hover:bg-surface-3/50"
                      >
                        <td className="px-4 py-3 font-semibold text-text">
                          Kec. {sub.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-2">
                          {sub.code}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-2">
                          /{sub.slug}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-text tabular-nums">
                          <Num value={sub.village_count ?? 0} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <ToggleSwitch
                              checked={Boolean(sub.is_active)}
                              onChange={(next) =>
                                handleToggleSubdistrictActive(sub, next)
                              }
                              aria-label={`Saklar aktif Kecamatan ${sub.name}`}
                            />
                            <span className="text-xs text-text-2">
                              {sub.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditSubdistrict(sub)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Ubah
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={subdistrictPage}
                totalPages={totalSubdistrictPages}
                totalItems={subdistricts.length}
                pageSize={SUBDISTRICT_PAGE_SIZE}
                onPageChange={setSubdistrictPage}
              />
            </>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: KOPERASI */}
      {/* ========================================================= */}
      {currentTab === 'koperasi' && (
        <section aria-label="Daftar Koperasi" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="w-full sm:w-64">
                <Select
                  aria-label="Filter Kecamatan"
                  value={villageFilterSubdistrict}
                  onChange={(e) => {
                    setVillageFilterSubdistrict(e.target.value);
                    setVillagePage(1);
                  }}
                  options={filterSubdistrictOptions}
                />
              </div>

              <div className="relative w-full sm:w-64">
                <Input
                  type="text"
                  placeholder="Cari desa, koperasi, slug..."
                  value={villageSearch}
                  onChange={(e) => {
                    setVillageSearch(e.target.value);
                    setVillagePage(1);
                  }}
                />
                <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-3" />
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openAddVillage}
              className="min-h-[44px] shrink-0"
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah Koperasi
            </Button>
          </div>

          {loadingVillages ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : filteredVillages.length === 0 ? (
            <EmptyState
              message="Koperasi tidak ditemukan."
              actionLabel="Tambah Koperasi"
              onAction={openAddVillage}
            />
          ) : (
            <>
              {/* Mobile cards (<lg) */}
              <div className="space-y-3 lg:hidden">
                {paginatedVillages.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-text">
                          {v.business_name}
                        </h2>
                        <span className="text-xs text-text-2">
                          {v.type === 'kelurahan' ? 'Kel.' : 'Desa'} {v.name} ·
                          Kec. {v.subdistrict_name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="warn">
                          {v.type === 'kelurahan' ? 'Kelurahan' : 'Desa'}
                        </Badge>
                        <Badge variant={v.is_active ? 'ok' : 'mute'}>
                          {v.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-text-3">
                      <div>
                        Rute:{' '}
                        <span className="font-mono text-text">
                          /{v.subdistrict_slug}/{v.slug}
                        </span>
                      </div>
                      <div>
                        WhatsApp:{' '}
                        <span className="font-mono text-text">
                          {v.whatsapp_number ? `+${v.whatsapp_number}` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="text-xs text-text-2">
                        <span className="font-semibold text-text">
                          <Num value={v.product_count ?? 0} />
                        </span>{' '}
                        produk ·{' '}
                        <span className="text-text-3">
                          <DateText value={v.created_at} />
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditVillage(v)}
                        className="min-h-[44px]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="ml-1">Ubah</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table (>=lg) */}
              <div className="hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-3 text-xs font-bold text-text-2 uppercase">
                    <tr>
                      <th className="px-4 py-3">Nama Koperasi</th>
                      <th className="px-4 py-3">Wilayah</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Rute Publik</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3 text-right">Produk</th>
                      <th className="px-4 py-3">Dibuat</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedVillages.map((v) => (
                      <tr
                        key={v.id}
                        className="transition-colors hover:bg-surface-3/50"
                      >
                        <td className="px-4 py-3 font-semibold text-text">
                          {v.business_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-2">
                          {v.type === 'kelurahan' ? 'Kel.' : 'Desa'} {v.name} ·
                          Kec. {v.subdistrict_name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="warn">
                            {v.type === 'kelurahan' ? 'Kelurahan' : 'Desa'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-2">
                          /{v.subdistrict_slug}/{v.slug}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-2">
                          {v.whatsapp_number ? `+${v.whatsapp_number}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-text tabular-nums">
                          <Num value={v.product_count ?? 0} />
                        </td>
                        <td className="px-4 py-3 text-xs text-text-3 tabular-nums">
                          <DateText value={v.created_at} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={v.is_active ? 'ok' : 'mute'}>
                            {v.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditVillage(v)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Ubah
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={villagePage}
                totalPages={totalVillagePages}
                totalItems={filteredVillages.length}
                pageSize={VILLAGE_PAGE_SIZE}
                onPageChange={setVillagePage}
              />
            </>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ADMIN KOPERASI (MANAGERS) */}
      {/* ========================================================= */}
      {currentTab === 'admin' && (
        <section aria-label="Admin Koperasi" className="space-y-6">
          {/* Card Form Assign Admin */}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
            <h2 className="mb-4 text-base font-bold text-text">
              Tetapkan Manager KDKMP
            </h2>

            <form onSubmit={handleAssignAdmin} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="assign-email-input"
                    className="mb-1 block text-xs font-semibold text-text-2"
                  >
                    Email Pengguna (Auth Supabase)
                  </label>
                  <Input
                    id="assign-email-input"
                    type="email"
                    placeholder="manager@kdkmp-gresik.id"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <SearchableSelect
                    id="assign-village-select"
                    label="Pilih Koperasi Tujuan"
                    value={assignVillageId}
                    onChange={(e) => setAssignVillageId(e.target.value)}
                    options={villageSelectOptions}
                    placeholder="Pilih Koperasi..."
                    searchPlaceholder="Cari koperasi, desa, atau kecamatan..."
                    required
                  />
                </div>
              </div>

              {assignError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 text-xs font-medium text-primary-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              {assignSuccess && (
                <div
                  role="status"
                  className="flex items-center gap-2 text-xs font-medium text-ok-700"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={assigning}
                  className="min-h-[44px] w-full md:w-auto"
                >
                  {assigning ? 'Menetapkan...' : 'Tetapkan Manager'}
                </Button>
              </div>
            </form>
          </div>

          {/* List of Active Village Admins */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-text">
              Daftar Manager KDKMP Aktif
            </h2>

            {loadingAdmins ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : villageAdmins.length === 0 ? (
              <EmptyState message="Belum ada manager yang ditetapkan." />
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 lg:hidden">
                  {paginatedAdmins.map((adm) => (
                    <div
                      key={adm.user_id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-bold text-text">
                            {adm.email}
                          </span>
                          <p className="truncate text-xs font-medium text-text-2">
                            {adm.business_name || adm.village_name}
                          </p>
                          <p className="text-xs text-text-3">
                            Kec. {adm.subdistrict_name || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-text-3">
                          Ditugaskan: <DateText value={adm.created_at} />
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenResetModal(adm)}
                            className="min-h-[44px]"
                          >
                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                            Reset Sandi
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setRevokeTarget(adm)}
                            className="min-h-[44px] text-primary-700 hover:text-primary-800"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Cabut
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-3 text-xs font-bold text-text-2 uppercase">
                      <tr>
                        <th className="px-4 py-3">Email Manager</th>
                        <th className="px-4 py-3">Koperasi</th>
                        <th className="px-4 py-3">Kecamatan</th>
                        <th className="px-4 py-3">Ditugaskan</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedAdmins.map((adm) => (
                        <tr
                          key={adm.user_id}
                          className="transition-colors hover:bg-surface-3/50"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-text">
                            {adm.email}
                          </td>
                          <td className="px-4 py-3 font-semibold text-text">
                            {adm.business_name || adm.village_name}
                          </td>
                          <td className="px-4 py-3 text-text-2">
                            Kec. {adm.subdistrict_name || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-text-3 tabular-nums">
                            <DateText value={adm.created_at} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenResetModal(adm)}
                              >
                                <KeyRound className="mr-1 h-3.5 w-3.5" />
                                Reset Sandi
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setRevokeTarget(adm)}
                                className="text-primary-700 hover:text-primary-800"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Cabut
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={adminPage}
                  totalPages={totalAdminPages}
                  totalItems={villageAdmins.length}
                  pageSize={ADMIN_PAGE_SIZE}
                  onPageChange={setAdminPage}
                />
              </>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SHEET MODAL: TAMBAH / UBAH KECAMATAN */}
      {/* ========================================================= */}
      <Sheet
        open={subdistrictSheetOpen}
        onClose={() => setSubdistrictSheetOpen(false)}
        title={editingSubdistrict ? 'Ubah Kecamatan' : 'Tambah Kecamatan'}
        dialogOnLg
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSubdistrictSheetOpen(false)}
              className="min-h-[44px]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="subdistrict-form"
              variant="primary"
              disabled={savingSubdistrict}
              className="min-h-[44px]"
            >
              {savingSubdistrict ? 'Menyimpan...' : 'Simpan Kecamatan'}
            </Button>
          </div>
        }
      >
        <form
          id="subdistrict-form"
          onSubmit={handleSaveSubdistrict}
          className="space-y-4 p-4 md:p-5"
        >
          <div>
            <label
              htmlFor="subdistrict-name"
              className="mb-1 block text-xs font-semibold text-text-2"
            >
              Nama Kecamatan
            </label>
            <Input
              id="subdistrict-name"
              type="text"
              placeholder="Contoh: Dukun"
              value={subdistrictForm.name}
              onChange={handleSubdistrictNameChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="subdistrict-code"
              className="mb-1 block text-xs font-semibold text-text-2"
            >
              Kode Kemendagri
            </label>
            <Input
              id="subdistrict-code"
              type="text"
              placeholder="Contoh: 35.25.01"
              value={subdistrictForm.code}
              onChange={(e) =>
                setSubdistrictForm((prev) => ({
                  ...prev,
                  code: e.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="subdistrict-slug"
              className="mb-1 block text-xs font-semibold text-text-2"
            >
              Slug Rute
            </label>
            <Input
              id="subdistrict-slug"
              type="text"
              placeholder="dukun"
              value={subdistrictForm.slug}
              onChange={(e) =>
                setSubdistrictForm((prev) => ({
                  ...prev,
                  slug: e.target.value.toLowerCase(),
                }))
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="subdistrict-sort"
              className="mb-1 block text-xs font-semibold text-text-2"
            >
              Urutan Tampil
            </label>
            <Input
              id="subdistrict-sort"
              type="number"
              value={subdistrictForm.sort_order}
              onChange={(e) =>
                setSubdistrictForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-3">
            <ToggleSwitch
              id="subdistrict-active-switch"
              checked={Boolean(subdistrictForm.is_active)}
              onChange={(val) =>
                setSubdistrictForm((prev) => ({ ...prev, is_active: val }))
              }
              aria-label="Status aktif kecamatan"
            />
            <label
              htmlFor="subdistrict-active-switch"
              className="cursor-pointer text-sm font-medium text-text"
            >
              Aktifkan Kecamatan (Wilayah Pilot / Ekspansi)
            </label>
          </div>

          {subdistrictError && (
            <p
              role="alert"
              className="text-xs font-medium text-primary-700"
            >
              {subdistrictError}
            </p>
          )}
        </form>
      </Sheet>

      {/* ========================================================= */}
      {/* SHEET MODAL: TAMBAH / UBAH KOPERASI */}
      {/* ========================================================= */}
      <Sheet
        open={villageSheetOpen}
        onClose={() => setVillageSheetOpen(false)}
        title={editingVillage ? 'Ubah Koperasi' : 'Tambah Koperasi'}
        dialogOnLg
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setVillageSheetOpen(false)}
              className="min-h-[44px]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="village-form"
              variant="primary"
              disabled={savingVillage}
              className="min-h-[44px]"
            >
              {savingVillage ? 'Menyimpan...' : 'Simpan Koperasi'}
            </Button>
          </div>
        }
      >
        <form
          id="village-form"
          onSubmit={handleSaveVillage}
          className="space-y-4 p-4 md:p-5"
        >
          <div>
            <SearchableSelect
              id="village-subdistrict"
              label="Kecamatan"
              value={villageForm.subdistrict_id}
              onChange={(e) =>
                setVillageForm((prev) => ({
                  ...prev,
                  subdistrict_id: e.target.value,
                }))
              }
              options={subdistrictOptions}
              placeholder="Pilih Kecamatan..."
              searchPlaceholder="Cari kecamatan..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="village-type"
                className="mb-1 block text-xs font-semibold text-text-2"
              >
                Tipe Wilayah
              </label>
              <Select
                id="village-type"
                value={villageForm.type}
                onChange={handleVillageTypeChange}
                options={[
                  { value: 'desa', label: 'Desa' },
                  { value: 'kelurahan', label: 'Kelurahan' },
                ]}
              />
            </div>

            <div>
              <label
                htmlFor="village-name"
                className="mb-1 block text-xs font-semibold text-text-2"
              >
                Nama Wilayah
              </label>
              <Input
                id="village-name"
                type="text"
                placeholder="Contoh: Golokan"
                value={villageForm.name}
                onChange={handleVillageNameChange}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="village-biz-name"
              className="mb-1 block text-xs font-semibold text-text-2"
            >
              Nama Koperasi
            </label>
            <Input
              id="village-biz-name"
              type="text"
              placeholder="Contoh: KDKMP Desa Golokan"
              value={villageForm.business_name}
              onChange={(e) =>
                setVillageForm((prev) => ({
                  ...prev,
                  business_name: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="village-slug"
                className="mb-1 block text-xs font-semibold text-text-2"
              >
                Slug (Unik per Kecamatan)
              </label>
              <Input
                id="village-slug"
                type="text"
                placeholder="golokan"
                value={villageForm.slug}
                onChange={(e) =>
                  setVillageForm((prev) => ({
                    ...prev,
                    slug: e.target.value.toLowerCase(),
                  }))
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="village-code"
                className="mb-1 block text-xs font-semibold text-text-2"
              >
                Kode Kemendagri
              </label>
              <Input
                id="village-code"
                type="text"
                placeholder="35.25.09.2008"
                value={villageForm.code}
                onChange={(e) =>
                  setVillageForm((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="village-wa"
              className="mb-1 block text-xs font-semibold text-text-2"
            >
              Nomor WhatsApp (Wajib jika Aktif)
            </label>
            <Input
              id="village-wa"
              type="tel"
              inputMode="tel"
              placeholder="Contoh: 081234567890"
              value={villageForm.whatsapp_number}
              onChange={(e) =>
                setVillageForm((prev) => ({
                  ...prev,
                  whatsapp_number: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-3">
            <ToggleSwitch
              id="village-active-switch"
              checked={Boolean(villageForm.is_active)}
              onChange={(val) =>
                setVillageForm((prev) => ({ ...prev, is_active: val }))
              }
              aria-label="Status aktif koperasi"
            />
            <label
              htmlFor="village-active-switch"
              className="cursor-pointer text-sm font-medium text-text"
            >
              Koperasi Aktif di Katalog Publik
            </label>
          </div>

          {villageError && (
            <p
              role="alert"
              className="text-xs font-medium text-primary-700"
            >
              {villageError}
            </p>
          )}
        </form>
      </Sheet>

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG: CABUT AKSES ADMIN */}
      {/* ========================================================= */}
      <Sheet
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Cabut Akses Manager"
        dialogOnLg
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRevokeTarget(null)}
              className="min-h-[44px]"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={revoking}
              onClick={handleRevokeAdmin}
              className="min-h-[44px]"
            >
              {revoking ? 'Mencabut...' : 'Ya, Cabut Akses'}
            </Button>
          </div>
        }
      >
        <div className="p-4 md:p-5">
          <p className="text-sm text-text">
            Cabut akses manager{' '}
            <strong className="font-mono text-text">
              {revokeTarget?.email}
            </strong>{' '}
            untuk{' '}
            <strong className="text-text">
              {revokeTarget?.business_name || revokeTarget?.village_name}
            </strong>
            ?
          </p>
        </div>
      </Sheet>

      {/* ========================================================= */}
      {/* MODAL RESET KATA SANDI MANAGER (FITUR A) */}
      {/* ========================================================= */}
      <Sheet
        open={Boolean(resetAdminTarget)}
        onClose={() => {
          setResetAdminTarget(null);
          setResetResult(null);
        }}
        title="Reset Kata Sandi Manager"
        dialogOnLg
        footer={
          resetResult ? (
            <div className="flex w-full justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setResetAdminTarget(null);
                  setResetResult(null);
                }}
                className="min-h-[44px]"
              >
                Selesai
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResetAdminTarget(null)}
                disabled={resetSubmitting}
                className="min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={resetSubmitting}
                onClick={handleExecuteResetPassword}
                className="min-h-[44px]"
              >
                {resetSubmitting ? 'Menyimpan...' : 'Terapkan Sandi Baru'}
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-4 md:p-5">
          <div className="rounded-lg border border-border bg-surface-3 p-3">
            <span className="text-xs font-semibold text-text-3">Email Manager:</span>
            <p className="font-mono text-sm font-bold text-text">{resetAdminTarget?.email}</p>
            <p className="text-xs text-text-2">
              {resetAdminTarget?.business_name || resetAdminTarget?.village_name}
            </p>
          </div>

          {resetResult ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-ok-50 p-3 text-sm font-medium text-ok-700">
                Kata sandi berhasil direset. Berikan kata sandi sementara berikut kepada manager:
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-3 p-3">
                <div>
                  <span className="text-xs text-text-3">Kata Sandi Sementara:</span>
                  <p className="font-mono text-base font-bold tabular-nums text-text">
                    {resetResult.password}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyText(resetResult.password)}
                  className="min-h-[44px]"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-4 w-4 text-ok-700" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-4 w-4" />
                      Salin
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-2">
                <a
                  href={buildCredentialsWhatsAppUrl(resetResult.whatsappNumber, {
                    email: resetResult.email,
                    password: resetResult.password,
                    villageName: resetResult.villageName,
                    type: 'reset',
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-3"
                >
                  <ExternalLink className="h-4 w-4" />
                  Kirim via WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <Input
                  label="Kata Sandi Sementara"
                  type="text"
                  value={resetTempPassword}
                  onChange={(e) => setResetTempPassword(e.target.value)}
                  className="font-mono"
                  containerClassName="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setResetTempPassword(generateRandomPassword())}
                  title="Generate Sandi Acak Lain"
                  className="min-h-11 shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-text-3">
                Kata sandi sementara ini akan aktif seketika dan dapat digunakan oleh manager untuk masuk.
              </p>
            </div>
          )}
        </div>
      </Sheet>

      {/* ========================================================= */}
      {/* MODAL KREDENSIAL MANAGER BARU (FITUR B) */}
      {/* ========================================================= */}
      <Sheet
        open={Boolean(newAdminCredentials)}
        onClose={() => setNewAdminCredentials(null)}
        title="Manager Baru Didaftarkan"
        dialogOnLg
        footer={
          <div className="flex w-full justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={() => setNewAdminCredentials(null)}
              className="min-h-[44px]"
            >
              Selesai
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4 md:p-5">
          <div className="rounded-lg bg-ok-50 p-3 text-sm font-medium text-ok-700">
            Akun manager baru berhasil dibuat dan ditetapkan. Berikan data akses berikut kepada manager:
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-surface-3 p-3">
            <div>
              <span className="text-xs text-text-3">Email:</span>
              <p className="font-mono text-sm font-bold text-text">
                {newAdminCredentials?.email}
              </p>
            </div>
            <div>
              <span className="text-xs text-text-3">Kata Sandi Awal:</span>
              <div className="flex items-center justify-between">
                <p className="font-mono text-base font-bold tabular-nums text-text">
                  {newAdminCredentials?.password}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyText(newAdminCredentials.password)}
                  className="min-h-[44px]"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-4 w-4 text-ok-700" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-4 w-4" />
                      Salin
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={buildCredentialsWhatsAppUrl(newAdminCredentials?.whatsappNumber, {
                email: newAdminCredentials?.email,
                password: newAdminCredentials?.password,
                villageName: newAdminCredentials?.villageName,
                type: 'created',
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-3"
            >
              <ExternalLink className="h-4 w-4" />
              Kirim via WhatsApp
            </a>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

export default AdminWilayahPage;
