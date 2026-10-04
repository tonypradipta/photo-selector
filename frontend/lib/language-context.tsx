'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Language = 'id' | 'en'

export const translations = {
  id: {
    // Navigation & General
    projects: 'Proyek',
    selectedPhotos: 'Foto Terpilih',
    delivery: 'Kirim',
    clients: 'Klien',
    settings: 'Pengaturan',
    profile: 'Profil',
    logout: 'Keluar',
    workspace: 'Workspace',
    account: 'Akun',
    newProject: 'Proyek Baru',
    copyLastLink: 'Salin tautan terakhir',
    copied: 'Tersalin',
    photographer: 'Fotografer',
    language: 'Bahasa',
    langName: 'Bahasa Indonesia',
    selectLanguage: 'Pilih Bahasa',
    cancel: 'Batal',
    save: 'Simpan',
    delete: 'Hapus',
    edit: 'Edit',
    back: 'Kembali',
    search: 'Cari',
    refresh: 'Refresh',
    all: 'Semua',
    close: 'Tutup',
    yes: 'Ya',
    no: 'Tidak',

    // Greetings & Dashboard Home
    goodMorning: 'Selamat pagi',
    goodAfternoon: 'Selamat siang',
    goodEvening: 'Selamat malam',
    dashboardSubtitle: 'Berikut ringkasan aktivitas seleksi foto Anda.',
    awaitingClientActivity: 'proyek menunggu aktivitas klien',
    activeProjects: 'Proyek aktif',
    activeProjectsDetail: 'Menunggu aktivitas klien',
    photosSelectedStat: 'Foto terpilih',
    photosSelectedDetail: 'Dari seluruh proyek',
    photosSentStat: 'Foto terkirim',
    photosSentDetail: 'Hasil edit & delivery',
    clientActivityStat: 'Aktivitas klien',
    clientActivityDetail: 'Total proyek dibuat',
    yourProjects: 'Daftar Proyek',
    manageGalleriesDesc: 'Kelola galeri dan tinjau hasil seleksi klien.',
    searchProjects: 'Cari proyek...',
    noProjectsMatch: 'Tidak ada proyek yang sesuai dengan pencarian Anda.',
    noProjectsYet: 'Belum ada proyek.',
    createFirstProject: 'Buat proyek pertama Anda',
    clientLinkReady: 'Tautan galeri klien Anda siap dibagikan',
    ofPhotosSelected: 'dari {max} foto dipilih',
    copyLink: 'Salin tautan',

    // Clients View
    clientsTitle: 'Clients & Tahapan Proyek',
    clientsDesc: 'Pantau alur kerja setiap klien dari tahap Seleksi Klien → Sedang Diedit → Selesai (Delivery).',
    noClients: 'Belum ada klien. Buat proyek baru untuk menambahkan klien pertama Anda.',
    stepSelection: 'Seleksi',
    stepEditing: 'Sedang Diedit',
    stepDelivery: 'Selesai (Delivery)',
    totalSyncedRaw: 'Total Synced Raw',
    photosCount: 'foto',
    photosSelected: 'Foto Dipilih',
    quota: 'kuota',
    progressQuota: 'Progres Kuota Seleksi',
    btnDrivePhotos: 'Foto Drive',
    btnDelivery: 'Delivery',
    btnProjectDetail: 'Detail Proyek',
    tooltipDrivePhotos: 'Lihat semua foto mentah Google Drive',
    tooltipDelivery: 'Buka menu pengiriman hasil edit',
    tooltipProjectDetail: 'Detail Proyek',

    // Status Badges
    statusDraft: 'Draft',
    statusActive: 'Seleksi Aktif',
    statusEditing: 'Sedang Diedit',
    statusCompleted: 'Selesai',
    statusLocked: 'Terkunci',
    statusDelivered: 'Terkirim',

    // Project Cards & Menu
    photosSynced: 'foto tersinkron',
    fromQuotaSelected: 'dari {max} dipilih',
    noPhotosSelectedYet: 'Belum memilih',
    shareLink: 'Bagikan tautan',
    seeAllDrivePhotos: 'Lihat semua foto Drive dalam pop-up galeri',
    menuViewDrive: 'Lihat Semua Foto Drive',
    menuCopyLink: 'Salin Tautan Klien',
    menuEditProject: 'Edit Proyek',
    menuLockSelection: 'Kunci Seleksi',
    menuUnlockSelection: 'Buka Kunci Seleksi',
    menuViewSelections: 'Lihat Seleksi Klien',
    menuDeleteProject: 'Hapus Proyek',

    // Project Modal (Create/Edit)
    modalNewProjectTitle: 'Proyek Baru',
    modalEditProjectTitle: 'Edit Proyek',
    modalNewProjectDesc: 'Buat galeri dan undang klien Anda untuk memilih foto.',
    modalEditProjectDesc: 'Perbarui detail proyek di bawah ini.',
    fieldProjectName: 'Nama Proyek',
    fieldClientName: 'Nama Klien',
    fieldDriveLink: 'Tautan Folder Google Drive',
    fieldDriveLinkHelp: 'Bagikan folder ini ke email Google Service Account yang terpasang di server.',
    fieldWhatsapp: 'Nomor WhatsApp Fotografer',
    fieldWhatsappHelp: 'Gunakan kode negara tanpa simbol + (contoh: 628123456789).',
    fieldMaxPhotos: 'Batas Kuota Seleksi Foto',
    fieldMaxPhotosHelp: 'Jumlah maksimal foto yang dapat dipilih oleh klien.',
    protectWithPassword: 'Lindungi galeri dengan password',
    enterPasswordPlaceholder: 'Masukkan password galeri',
    btnCreateProject: 'Buat Proyek',
    btnSaveProject: 'Simpan Perubahan',
    creating: 'Membuat...',
    saving: 'Menyimpan...',
    updating: 'Memperbarui...',
    projectCreatedSyncing: 'Proyek dibuat! Menyinkronkan foto dari Google Drive…',
    projectUpdatedSuccess: 'Proyek berhasil diperbarui!',

    // Delete Modal
    deleteModalTitle: 'Hapus "{name}"?',
    deleteModalDesc: 'Tindakan ini akan menghapus proyek secara permanen, beserta seluruh foto yang tersinkron dan pilihan foto klien. Tindakan ini tidak dapat dibatalkan.',
    btnConfirmDelete: 'Ya, Hapus Proyek',
    deleting: 'Menghapus...',
    projectDeletedSuccess: 'Proyek berhasil dihapus.',

    // Drive Photos Modal
    drivePhotosTitle: 'Foto Google Drive',
    syncDrivePhotos: 'Sinkronkan Google Drive',
    syncingDrive: 'Menyinkronkan...',
    searchPhotosPlaceholder: 'Cari foto (kode atau nama file)...',
    tabAllPhotos: 'Semua Foto',
    tabSelectedPhotos: 'Foto Terpilih',
    noPhotosFound: 'Tidak ada foto ditemukan.',

    // Selected Photos View & Modal
    selectedPhotosTitle: 'Foto Terpilih',
    selectedPhotosDesc: 'Kelola foto yang telah dipilih oleh klien, baca catatan khusus, dan ekspor daftar file untuk diedit.',
    tabAll: 'Semua',
    tabInEditing: 'Sedang Diedit',
    tabCompleted: 'Selesai',
    searchSelectedPlaceholder: 'Cari berdasarkan nama proyek atau klien...',
    noSelectedProjects: 'Belum ada proyek dengan foto terpilih.',
    viewDetailPhotos: 'Lihat Detail & Catatan',
    clientNotes: 'Catatan Klien',
    downloadCodesList: 'Salin Kode Foto',
    openDeliveryWorkspace: 'Delivery Workspace',

    // Delivery View & Modal
    deliveryTitle: 'Delivery Workspace',
    deliveryDesc: 'Unggah hasil edit ke folder Google Drive dan kirimkan galeri pengiriman akhir kepada klien.',
    deliveryTabAll: 'Semua Proyek',
    deliveryTabReady: 'Siap Kirim',
    deliveryTabDelivered: 'Sudah Terkirim',
    btnSendToClient: 'Kirim Galeri ke Klien',
    copyDeliveryLink: 'Salin Tautan Delivery',
    syncEditedDrive: 'Sinkronkan Folder Hasil Edit',
    missingEditedAlert: 'Perhatian: Ada {count} foto terpilih yang belum ditemukan di folder edit Google Drive.',

    // Profile View
    profileTitle: 'Profil & Studio',
    profileDesc: 'Kelola identitas fotografer dan informasi kontak studio Anda.',
    fieldStudioName: 'Nama Studio / Fotografer',
    fieldFullName: 'Nama Lengkap',
    fieldLocation: 'Lokasi / Kota',
    fieldBio: 'Bio / Deskripsi Studio',
    fieldWebsite: 'Situs Web / Portofolio',
    changePasswordTitle: 'Ganti Password',
    fieldNewPassword: 'Password Baru',
    fieldConfirmPassword: 'Konfirmasi Password Baru',
    profileSavedSuccess: 'Profil berhasil disimpan!',
    passwordUpdatedSuccess: 'Password berhasil diubah!',

    // Settings View
    settingsTitle: 'Settings',
    settingsDesc: 'Kelola preferensi galeri, bahasa tampilan, dan pengaturan lainnya.',
    languageSettingsTitle: 'Pengaturan Bahasa / Language Preferences',
    languageSettingsDesc: 'Pilih bahasa antarmuka aplikasi antara Bahasa Indonesia dan English.',
    galleryPrefsTitle: 'Preferensi Galeri',
    galleryPrefsDesc: 'Atur preferensi default untuk galeri seleksi klien.',
    showBrandingTitle: 'Tampilkan branding fotografer',
    showBrandingDesc: 'Tampilkan nama studio Anda pada galeri klien.',
    allowNotesTitle: 'Izinkan catatan klien',
    allowNotesDesc: 'Izinkan klien menambahkan catatan pada foto yang mereka pilih.',
    sendRemindersTitle: 'Kirim pengingat seleksi',
    sendRemindersDesc: 'Kirim tautan pengingat secara ramah agar klien segera menyeleksi foto.',
    saveSettings: 'Simpan Pengaturan',
    settingsSaved: 'Pengaturan berhasil disimpan!',

    // Project Detail Page
    backToDashboard: 'Kembali ke Dashboard',
    projectOverview: 'Ringkasan Proyek',
    galleryLinkTitle: 'Tautan Galeri Klien',
    openClientGallery: 'Buka Galeri Klien',
    exportPhotoCodes: 'Salin Daftar Kode Foto',
    copyCommaCodes: 'Salin (Pemisah Koma)',
    copyNewlineCodes: 'Salin (Baris Baru)',
    syncGoogleDriveBtn: 'Sinkronkan Drive',
    lockGalleryBtn: 'Kunci Seleksi',
    unlockGalleryBtn: 'Buka Seleksi',

    // Client Selection Gallery
    clientGalleryWelcome: 'Selamat datang di Galeri Seleksi Foto Anda',
    selectInstruction: 'Pilih foto favorit Anda hingga batas kuota yang ditentukan.',
    selectedCountOfMax: '{selected} dari {max} foto dipilih',
    quotaReachedAlert: 'Kuota foto telah penuh ({max} foto). Batalkan pilihan foto lain jika ingin mengganti.',
    btnReviewSelection: 'Tinjau Pilihan ({count})',
    btnSubmitSelection: 'Konfirmasi & Kirim Seleksi',
    reviewModalTitle: 'Tinjau Foto Pilihan Anda',
    reviewModalDesc: 'Periksa kembali foto yang telah Anda pilih dan tambahkan catatan khusus jika diperlukan.',
    addNotePlaceholder: 'Tambahkan catatan khusus untuk foto ini (misal: tolong crop lebih dekat)...',
    confirmModalTitle: 'Kirimkan Pilihan Foto?',
    confirmModalDesc: 'Setelah dikonfirmasi, pilihan Anda akan dikunci dan dikirimkan ke fotografer untuk proses edit.',
    confirmSubmitBtn: 'Ya, Konfirmasi Pilihan',
    thankYouTitle: 'Terima Kasih! Pilihan Foto Anda Telah Terkirim',
    thankYouDesc: 'Fotografer kami akan segera memproses foto-foto pilihan Anda untuk tahap editing selanjutnya.',
    whatsappNotificationBtn: 'Beri Tahu Fotografer via WhatsApp',
    passwordScreenTitle: 'Galeri Terlindungi',
    passwordScreenDesc: 'Silakan masukkan password yang diberikan fotografer untuk mengakses galeri ini.',
    passwordInputPlaceholder: 'Masukkan password galeri',
    unlockBtn: 'Buka Galeri',

    // Client Delivery Gallery
    deliveryGalleryTitle: 'Galeri Hasil Foto Final',
    deliveryGalleryDesc: 'Foto-foto pilihan Anda telah selesai diedit dan siap diunduh.',
    downloadAllBtn: 'Unduh Semua Foto',
    downloadPhotoBtn: 'Unduh Foto Ini',
  },
  en: {
    // Navigation & General
    projects: 'Projects',
    selectedPhotos: 'Selected Photos',
    delivery: 'Delivery',
    clients: 'Clients',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    workspace: 'Workspace',
    account: 'Account',
    newProject: 'New project',
    copyLastLink: 'Copy last link',
    copied: 'Copied',
    photographer: 'Photographer',
    language: 'Language',
    langName: 'English',
    selectLanguage: 'Select Language',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    search: 'Search',
    refresh: 'Refresh',
    all: 'All',
    close: 'Close',
    yes: 'Yes',
    no: 'No',

    // Greetings & Dashboard Home
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    dashboardSubtitle: "Here's what's happening with your photo selections.",
    awaitingClientActivity: 'projects awaiting client activity',
    activeProjects: 'Active projects',
    activeProjectsDetail: 'Awaiting client activity',
    photosSelectedStat: 'Photos selected',
    photosSelectedDetail: 'Across all projects',
    photosSentStat: 'Photos sent',
    photosSentDetail: 'Edited & delivered photos',
    clientActivityStat: 'Client activity',
    clientActivityDetail: 'Projects created',
    yourProjects: 'Your projects',
    manageGalleriesDesc: 'Manage galleries and review client selections.',
    searchProjects: 'Search projects...',
    noProjectsMatch: 'No projects match your search.',
    noProjectsYet: 'No projects yet.',
    createFirstProject: 'Create your first project',
    clientLinkReady: 'Your client gallery link is ready to share',
    ofPhotosSelected: 'of {max} photos selected',
    copyLink: 'Copy link',

    // Clients View
    clientsTitle: 'Clients & Project Stages',
    clientsDesc: 'Monitor each client workflow from Client Selection → In Editing → Completed (Delivery).',
    noClients: 'No clients yet. Create a new project to add your first client.',
    stepSelection: 'Selection',
    stepEditing: 'In Editing',
    stepDelivery: 'Completed (Delivery)',
    totalSyncedRaw: 'Total Synced Raw',
    photosCount: 'photos',
    photosSelected: 'Selected Photos',
    quota: 'quota',
    progressQuota: 'Selection Quota Progress',
    btnDrivePhotos: 'Drive Photos',
    btnDelivery: 'Delivery',
    btnProjectDetail: 'Project Details',
    tooltipDrivePhotos: 'View all raw Google Drive photos',
    tooltipDelivery: 'Open edit delivery workspace',
    tooltipProjectDetail: 'Project Details',

    // Status Badges
    statusDraft: 'Draft',
    statusActive: 'Active Selection',
    statusEditing: 'In Editing',
    statusCompleted: 'Completed',
    statusLocked: 'Locked',
    statusDelivered: 'Delivered',

    // Project Cards & Menu
    photosSynced: 'photos synced',
    fromQuotaSelected: 'of {max} selected',
    noPhotosSelectedYet: 'None selected yet',
    shareLink: 'Share link',
    seeAllDrivePhotos: 'View all Drive photos in pop-up gallery',
    menuViewDrive: 'View All Drive Photos',
    menuCopyLink: 'Copy Client Link',
    menuEditProject: 'Edit Project',
    menuLockSelection: 'Lock Selection',
    menuUnlockSelection: 'Unlock Selection',
    menuViewSelections: 'View Selections',
    menuDeleteProject: 'Delete Project',

    // Project Modal (Create/Edit)
    modalNewProjectTitle: 'New Project',
    modalEditProjectTitle: 'Edit Project',
    modalNewProjectDesc: 'Create a gallery and invite your client to choose their photos.',
    modalEditProjectDesc: 'Update project details below.',
    fieldProjectName: 'Project Name',
    fieldClientName: 'Client Name',
    fieldDriveLink: 'Google Drive Folder Link',
    fieldDriveLinkHelp: 'Share this folder with the Google Service Account email configured on the server.',
    fieldWhatsapp: 'Photographer WhatsApp Number',
    fieldWhatsappHelp: 'Use country code without + symbol (example: 628123456789).',
    fieldMaxPhotos: 'Maximum Photo Selection Quota',
    fieldMaxPhotosHelp: 'Maximum photos the client can select.',
    protectWithPassword: 'Protect gallery with password',
    enterPasswordPlaceholder: 'Enter gallery password',
    btnCreateProject: 'Create Project',
    btnSaveProject: 'Save Changes',
    creating: 'Creating...',
    saving: 'Saving...',
    updating: 'Updating...',
    projectCreatedSyncing: 'Project created! Syncing photos from Google Drive…',
    projectUpdatedSuccess: 'Project updated successfully!',

    // Delete Modal
    deleteModalTitle: 'Delete "{name}"?',
    deleteModalDesc: 'This action will permanently delete the project, all synced photos, and client selections. This action cannot be undone.',
    btnConfirmDelete: 'Yes, Delete Project',
    deleting: 'Deleting...',
    projectDeletedSuccess: 'Project deleted successfully.',

    // Drive Photos Modal
    drivePhotosTitle: 'Google Drive Photos',
    syncDrivePhotos: 'Sync Google Drive',
    syncingDrive: 'Syncing...',
    searchPhotosPlaceholder: 'Search photos (code or file name)...',
    tabAllPhotos: 'All Photos',
    tabSelectedPhotos: 'Selected Photos',
    noPhotosFound: 'No photos found.',

    // Selected Photos View & Modal
    selectedPhotosTitle: 'Selected Photos',
    selectedPhotosDesc: 'Manage photos chosen by clients, view notes, and export file lists for editing.',
    tabAll: 'All',
    tabInEditing: 'In Editing',
    tabCompleted: 'Completed',
    searchSelectedPlaceholder: 'Search by project or client name...',
    noSelectedProjects: 'No projects with selected photos yet.',
    viewDetailPhotos: 'View Details & Notes',
    clientNotes: 'Client Notes',
    downloadCodesList: 'Copy Photo Codes',
    openDeliveryWorkspace: 'Delivery Workspace',

    // Delivery View & Modal
    deliveryTitle: 'Delivery Workspace',
    deliveryDesc: 'Upload edited photos to Google Drive and deliver the final gallery to clients.',
    deliveryTabAll: 'All Projects',
    deliveryTabReady: 'Ready for Delivery',
    deliveryTabDelivered: 'Delivered',
    btnSendToClient: 'Send Gallery to Client',
    copyDeliveryLink: 'Copy Delivery Link',
    syncEditedDrive: 'Sync Edited Photos Folder',
    missingEditedAlert: 'Notice: There are {count} selected photos not yet found in the Google Drive edit folder.',

    // Profile View
    profileTitle: 'Profile & Studio',
    profileDesc: 'Manage your photographer profile and studio contact details.',
    fieldStudioName: 'Studio / Photographer Name',
    fieldFullName: 'Full Name',
    fieldLocation: 'Location / City',
    fieldBio: 'Bio / Studio Description',
    fieldWebsite: 'Website / Portfolio',
    changePasswordTitle: 'Change Password',
    fieldNewPassword: 'New Password',
    fieldConfirmPassword: 'Confirm New Password',
    profileSavedSuccess: 'Profile saved successfully!',
    passwordUpdatedSuccess: 'Password changed successfully!',

    // Settings View
    settingsTitle: 'Settings',
    settingsDesc: 'Manage your gallery preferences, display language, and other options.',
    languageSettingsTitle: 'Language Preferences',
    languageSettingsDesc: 'Choose application interface language between Indonesian and English.',
    galleryPrefsTitle: 'Gallery Preferences',
    galleryPrefsDesc: 'Set defaults for new client selection galleries.',
    showBrandingTitle: 'Show photographer branding',
    showBrandingDesc: 'Display your studio name in the client gallery.',
    allowNotesTitle: 'Allow client notes',
    allowNotesDesc: 'Let clients add notes to their selected photos.',
    sendRemindersTitle: 'Send selection reminders',
    sendRemindersDesc: 'Keep clients moving with friendly reminder links.',
    saveSettings: 'Save settings',
    settingsSaved: 'Settings saved!',

    // Project Detail Page
    backToDashboard: 'Back to Dashboard',
    projectOverview: 'Project Overview',
    galleryLinkTitle: 'Client Gallery Link',
    openClientGallery: 'Open Client Gallery',
    exportPhotoCodes: 'Copy Photo Code List',
    copyCommaCodes: 'Copy (Comma-separated)',
    copyNewlineCodes: 'Copy (New lines)',
    syncGoogleDriveBtn: 'Sync Drive',
    lockGalleryBtn: 'Lock Selection',
    unlockGalleryBtn: 'Unlock Selection',

    // Client Selection Gallery
    clientGalleryWelcome: 'Welcome to Your Photo Selection Gallery',
    selectInstruction: 'Pick your favorite photos up to the allocated selection quota.',
    selectedCountOfMax: '{selected} of {max} photos selected',
    quotaReachedAlert: 'Quota reached ({max} photos). Unselect another photo if you want to replace it.',
    btnReviewSelection: 'Review Selection ({count})',
    btnSubmitSelection: 'Confirm & Submit Selection',
    reviewModalTitle: 'Review Your Selected Photos',
    reviewModalDesc: 'Double-check your selected photos and add custom notes if needed.',
    addNotePlaceholder: 'Add custom notes for this photo (e.g., please crop closer)...',
    confirmModalTitle: 'Submit Photo Selection?',
    confirmModalDesc: 'Once submitted, your selection will be locked and sent to the photographer for editing.',
    confirmSubmitBtn: 'Yes, Confirm Selection',
    thankYouTitle: 'Thank You! Your Selection Has Been Submitted',
    thankYouDesc: 'Our photographer will now process your selected photos for editing.',
    whatsappNotificationBtn: 'Notify Photographer via WhatsApp',
    passwordScreenTitle: 'Protected Gallery',
    passwordScreenDesc: 'Please enter the password provided by your photographer to access this gallery.',
    passwordInputPlaceholder: 'Enter gallery password',
    unlockBtn: 'Unlock Gallery',

    // Client Delivery Gallery
    deliveryGalleryTitle: 'Final Delivered Photos',
    deliveryGalleryDesc: 'Your selected photos have been edited and are ready for download.',
    downloadAllBtn: 'Download All Photos',
    downloadPhotoBtn: 'Download Photo',
  },
}

export type TranslationKey = keyof typeof translations['id']

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'photo_selection_lang'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      if (saved === 'id' || saved === 'en') {
        setLanguageState(saved)
      }
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations['id']
    let text = langDict[key] || translations['id'][key] || String(key)

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      })
    }

    return text
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Fallback if not wrapped
    return {
      language: 'id' as Language,
      setLanguage: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let text = translations['id'][key] || String(key)
        if (params) {
          Object.entries(params).forEach(([paramKey, value]) => {
            text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
          })
        }
        return text
      },
    }
  }
  return context
}
