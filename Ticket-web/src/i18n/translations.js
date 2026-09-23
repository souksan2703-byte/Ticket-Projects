// พจนานุกรมคำแปล — ค่า lo ใช้ข้อความลาวเดิมที่มีอยู่แล้วในโปรเจกต์นี้เป๊ะๆ
// เพิ่ม key ใหม่ตรงนี้เมื่อจะแปลข้อความเพิ่มในอนาคต
export const translations = {
  // Sidebar
  appTitle: { en: "Ticket Admin", lo: "ລະບົບຈັດການປີ້" },
  dashboard: { en: "Dashboard", lo: "ໜ້າຫຼັກ" },
  manageTickets: { en: "Manage tickets", lo: "ຈັດການປີ້" },
  ticketCodes: { en: "Ticket codes", lo: "ລະຫັດປີ້" },
  reports: { en: "Reports", lo: "ລາຍງານ" },
  adminUsers: { en: "Admin users", lo: "ຜູ້ໃຊ້ແອັດມິນ" },
  myProfile: { en: "My profile", lo: "ໂປຣໄຟລ໌ຂອງຂ້ອຍ" },
  logOut: { en: "Log out", lo: "ອອກຈາກລະບົບ" },
  roleAdmin: { en: "Admin", lo: "ແອັດມິນ" },
  roleUser: { en: "User", lo: "ຜູ້ໃຊ້" },

  // App.jsx
  redirectingToStore: { en: "Redirecting you to the ticket store...", lo: "ກຳລັງນຳທ່ານໄປທີ່ຮ້ານຂາຍປີ້..." },

  // Login page
  signInSubtitle: { en: "Sign in to manage events and tickets", lo: "ເຂົ້າສູ່ລະບົບເພື່ອຈັດການງານອີເວັນຕ໌ ແລະ ປີ້" },
  username: { en: "Username", lo: "ຊື່ຜູ້ໃຊ້" },
  usernamePlaceholder: { en: "Enter your username", lo: "ປ້ອນຊື່ຜູ້ໃຊ້" },
  password: { en: "Password", lo: "ລະຫັດຜ່ານ" },
  passwordPlaceholder: { en: "Enter your password", lo: "ປ້ອນລະຫັດຜ່ານ" },
  signIn: { en: "Sign in", lo: "ເຂົ້າສູ່ລະບົບ" },
  signingIn: { en: "Signing in...", lo: "ກຳລັງເຂົ້າສູ່ລະບົບ..." },
  loginFailed: { en: "Login failed", lo: "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ" },

  // Dashboard page
  transactionDate: { en: "Transaction date", lo: "ວັນທີທຸລະກຳ" },
  toDate: { en: "To date", lo: "ຮອດວັນທີ" },
  loadFailed: { en: "Failed to load data", lo: "ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ" },
  retry: { en: "Retry", lo: "ລອງໃໝ່" },
  todaysSales: { en: "Today's sales", lo: "ຍອດຂາຍມື້ນີ້" },
  ticketsSoldThisMonth: { en: "Tickets sold this month", lo: "ປີ້ທີ່ຂາຍໄດ້ໃນເດືອນນີ້" },
  active: { en: "Active", lo: "ເປີດໃຊ້ງານ" },
  off: { en: "OFF", lo: "ປິດ" },
  ticketsSoldByEvent: { en: "Tickets sold by event", lo: "ປີ້ທີ່ຂາຍໄດ້ຕາມງານອີເວັນຕ໌" },
  total: { en: "total", lo: "ລວມ" },
  noSalesDataInRange: { en: "No sales data in this range yet", lo: "ຍັງບໍ່ມີຂໍ້ມູນຍອດຂາຍໃນຊ່ວງເວລານີ້" },
  noDataYet: { en: "No data yet", lo: "ຍັງບໍ່ມີຂໍ້ມູນ" },
  ticketMixTop2: { en: "Ticket mix (top 2 events)", lo: "ສັດສ່ວນປີ້ (2 ງານອັນດັບຕົ້ນ)" },
  transactionDaily: { en: "Transaction (daily)", lo: "ທຸລະກຳ (ລາຍວັນ)" },

  // Manage tickets page
  addTicket: { en: "Add ticket", lo: "ເພີ່ມປີ້" },
  totalTickets: { en: "Total tickets", lo: "ປີ້ທັງໝົດ" },
  openForSale: { en: "Open for sale", lo: "ພ້ອມຂາຍ" },
  confirmDeleteTicket: { en: "Delete this ticket?", lo: "ຕ້ອງການລຶບປີ້ນີ້ແທ້ບໍ?" },
  colEvent: { en: "Event", lo: "ງານອີເວັນຕ໌" },
  colPrice: { en: "Price", lo: "ລາຄາ" },
  colStock: { en: "Stock", lo: "ຈຳນວນປີ້" },
  colDateTime: { en: "Date & time", lo: "ວັນທີ ແລະ ເວລາ" },
  colStatus: { en: "Status", lo: "ສະຖານະ" },
  colEdit: { en: "Edit", lo: "ແກ້ໄຂ" },
  colDelete: { en: "Delete", lo: "ລຶບ" },
  loadingEllipsis: { en: "Loading...", lo: "ກຳລັງໂຫຼດ..." },
  noTicketsYet: {
    en: 'No tickets yet. Click "Add ticket" to create your first one.',
    lo: 'ຍັງບໍ່ມີປີ້ ກົດ "ເພີ່ມປີ້" ເພື່ອເພີ່ມລາຍການທຳອິດ',
  },

  // Ticket codes page
  generateCodes: { en: "Generate codes", lo: "ສ້າງລະຫັດ" },
  filterAllEvents: { en: "Event: All", lo: "ງານອີເວັນຕ໌: ທັງໝົດ" },
  filterStatusAll: { en: "Status: All", lo: "ສະຖານະ: ທັງໝົດ" },
  searchOwnerTranId: { en: "Search ticket holder / transaction no.", lo: "ຄົ້ນຫາຜູ້ຖືປີ້ / ເລກທຸລະກຳ" },
  totalCodes: { en: "Total codes", lo: "ລະຫັດທັງໝົດ" },
  remaining: { en: "Remaining", lo: "ເຫຼືອ" },
  receivedPickedUp: { en: "Received", lo: "ຮັບແລ້ວ" },
  confirmMarkReceived: {
    en: 'Confirm that "{name}" has picked up the ticket?',
    lo: 'ຢືນຢັນວ່າ "{name}" ໄດ້ມາຮັບປີ້ແລ້ວແມ່ນບໍ?',
  },
  saveFailed: { en: "Save failed", lo: "ບັນທຶກບໍ່ສຳເລັດ" },
  colCode: { en: "Code", lo: "ລະຫັດ" },
  colOwner: { en: "Ticket holder", lo: "ຜູ້ຖືປີ້" },
  colTransactionId: { en: "Transaction no.", lo: "ເລກທຸລະກຳ" },
  colTicketReceived: { en: "Received", lo: "ຮັບປີ້ແລ້ວ" },
  colQr: { en: "QR", lo: "QR" },
  noCodesYet: {
    en: 'No ticket codes yet. Click "{generateCodes}" to create the first batch.',
    lo: 'ຍັງບໍ່ມີລະຫັດປີ້ ກົດ "{generateCodes}" ເພື່ອສ້າງຊຸດທຳອິດ',
  },
  viewDownloadQr: { en: "View/download QR", lo: "ເບິ່ງ/ດາວໂຫຼດ QR" },

  // Reports page
  exportCsv: { en: "Export CSV", lo: "ສົ່ງອອກ CSV" },
  totalRevenue: { en: "Total revenue", lo: "ລາຍຮັບລວມ" },
  totalBuyers: { en: "Total buyers", lo: "ຈຳນວນຜູ້ຊື້" },
  ticketsSold: { en: "Tickets sold", lo: "ປີ້ທີ່ຂາຍໄດ້" },
  bestSellingEvent: { en: "Best-selling event", lo: "ງານທີ່ຂາຍດີທີ່ສຸດ" },
  revenueByEvent: { en: "Revenue by event", lo: "ລາຍຮັບຕາມງານອີເວັນຕ໌" },
  noSalesInRange: { en: "No sales in this range", lo: "ຍັງບໍ່ມີລາຍການຂາຍໃນຊ່ວງເວລານີ້" },

  // Admin users page
  addAdminUser: { en: "Add admin user", lo: "ເພີ່ມຜູ້ໃຊ້ແອັດມິນ" },
  promptNewPassword: { en: 'Set a new password for "{name}"', lo: 'ຕັ້ງລະຫັດຜ່ານໃໝ່ສຳລັບ "{name}"' },
  resetPasswordSuccess: { en: "Password reset successfully", lo: "ຣີເຊັດລະຫັດຜ່ານສຳເລັດແລ້ວ" },
  resetPasswordFailed: { en: "Password reset failed", lo: "ຣີເຊັດລະຫັດຜ່ານບໍ່ສຳເລັດ" },
  changeStatusFailed: { en: "Status change failed", lo: "ປ່ຽນສະຖານະບໍ່ສຳເລັດ" },
  colName: { en: "Name", lo: "ຊື່" },
  colUsername: { en: "Username", lo: "ຊື່ຜູ້ໃຊ້" },
  colRole: { en: "Role", lo: "ບົດບາດ" },
  colLastLogin: { en: "Last login", lo: "ເຂົ້າໃຊ້ງານຫຼ້າສຸດ" },
  colResetPw: { en: "Reset password", lo: "ຕັ້ງລະຫັດຜ່ານ" },
  colEnableDisable: { en: "Enable/Disable", lo: "ເປີດ/ປິດໃຊ້ງານ" },
  noAdminUsersYet: {
    en: 'No admin users yet. Click "Add admin user" to create the first one.',
    lo: 'ຍັງບໍ່ມີຜູ້ໃຊ້ ກົດ "ເພີ່ມຜູ້ໃຊ້ແອັດມິນ" ເພື່ອເພີ່ມລາຍການທຳອິດ',
  },
  reset: { en: "Reset", lo: "ຣີເຊັດ" },
  enable: { en: "Enable", lo: "ເປີດໃຊ້ງານ" },
  disable: { en: "Disable", lo: "ປິດໃຊ້ງານ" },

  // My profile page
  fillAllFields: { en: "Please fill in all fields", lo: "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບທຸກຊ່ອງ" },
  passwordsDontMatch: { en: "New password and confirmation don't match", lo: "ລະຫັດຜ່ານໃໝ່ ແລະ ການຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ" },
  passwordTooShort: { en: "New password must be at least 6 characters", lo: "ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ" },
  passwordChangedSuccess: { en: "Password changed successfully", lo: "ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ" },
  passwordChangeFailed: { en: "Failed to change password", lo: "ປ່ຽນລະຫັດຜ່ານບໍ່ສຳເລັດ" },
  changePassword: { en: "Change password", lo: "ປ່ຽນລະຫັດຜ່ານ" },
  newPassword: { en: "New password", lo: "ລະຫັດຜ່ານໃໝ່" },
  confirmNewPassword: { en: "Confirm new password", lo: "ຢືນຢັນລະຫັດຜ່ານໃໝ່" },
  savingEllipsis: { en: "Saving...", lo: "ກຳລັງບັນທຶກ..." },
  updatePassword: { en: "Update password", lo: "ອັບເດດລະຫັດຜ່ານ" },

  // Add ticket modal
  editTicket: { en: "Edit ticket", lo: "ແກ້ໄຂປີ້" },
  uploadEventPhoto: { en: "Upload event photo", lo: "ອັບໂຫລດຮູບງານ" },
  dragDropHint: { en: "Drag and drop or click to browse. JPG or PNG, up to 5 MB.", lo: "ລາກວາງ ຫຼື ກົດເພື່ອເລືອກໄຟລ໌. JPG ຫຼື PNG, ບໍ່ເກີນ 5 MB." },
  fillEventPriceStock: { en: "Please fill in the event name, price, and stock", lo: "ກະລຸນາປ້ອນຊື່ງານ, ລາຄາ ແລະ ຈຳນວນປີ້ໃຫ້ຄົບ" },
  eventTitle: { en: "Event title", lo: "ຊື່ງານ" },
  priceLak: { en: "Price (LAK)", lo: "ລາຄາ (LAK)" },
  autoGenCodesHint: {
    en: "Ticket codes will be auto-generated based on this amount (up to 1000).",
    lo: "ລະບົບຈະສ້າງລະຫັດປີ້ອັດຕະໂນມັດຕາມຈຳນວນນີ້ (ສູງສຸດ 1000 ໃບ)",
  },
  location: { en: "Location", lo: "ສະຖານທີ່" },
  statusOpen: { en: "Open", lo: "ເປີດ" },
  statusOff: { en: "OFF", lo: "ປິດ" },
  cancel: { en: "Cancel", lo: "ຍົກເລີກ" },
  saveTicket: { en: "Save ticket", lo: "ບັນທຶກປີ້" },

  // Generate codes modal
  generateTicketCodes: { en: "Generate ticket codes", lo: "ສ້າງລະຫັດປີ້" },
  pleaseSelectEvent: { en: "Please select an event", lo: "ກະລຸນາເລືອກງານອີເວັນຕ໌" },
  pleaseSpecifyQuantity: { en: "Please specify how many codes to generate", lo: "ກະລຸນາລະບຸຈຳນວນລະຫັດທີ່ຕ້ອງການສ້າງ" },
  generateFailed: { en: "Failed to generate codes", lo: "ສ້າງລະຫັດບໍ່ສຳເລັດ" },
  quantity: { en: "Quantity", lo: "ຈຳນວນ" },
  codePrefixOptional: { en: "Code prefix (optional)", lo: "Prefix ລະຫັດ (ບໍ່ບັງຄັບ)" },
  codeFormatHint: { en: 'Codes will look like "{prefix}-8F2K91"', lo: 'ລະຫັດທີ່ໄດ້ຈະມີຮູບແບບ ເຊັ່ນ "{prefix}-8F2K91"' },
  generatingEllipsis: { en: "Generating...", lo: "ກຳລັງສ້າງ..." },
  generate: { en: "Generate", lo: "ສ້າງ" },

  // QR code modal
  qrCodeTitle: { en: "QR code", lo: "QR code" },
  qrCodeAltFor: { en: "QR code for {code}", lo: "QR code ສຳລັບ {code}" },
  downloadQr: { en: "Download QR", lo: "ດາວໂຫຼດ QR" },

  // Add admin user modal
  editAdminUser: { en: "Edit admin user", lo: "ແກ້ໄຂຜູ້ໃຊ້ແອັດມິນ" },
  fillNameUsername: { en: "Please fill in name and username", lo: "ກະລຸນາປ້ອນຊື່ ແລະ ຊື່ຜູ້ໃຊ້ໃຫ້ຄົບ" },
  setPasswordForNewUser: { en: "Please set a password for the new user", lo: "ກະລຸນາກຳນົດລະຫັດຜ່ານສຳລັບຜູ້ໃຊ້ໃໝ່" },
  setInitialPassword: { en: "Set an initial password", lo: "ກຳນົດລະຫັດຜ່ານເລີ່ມຕົ້ນ" },
  save: { en: "Save", lo: "ບັນທຶກ" },

  // StatusPill labels (backend status values, mapped to display text)
  statusSold: { en: "Sold", lo: "ຂາຍແລ້ວ" },
  statusAvailable: { en: "Available", lo: "ຍັງມີ" },
  statusUsed: { en: "Used", lo: "ໃຊ້ແລ້ວ" },
  statusActive: { en: "Active", lo: "ເປີດໃຊ້ງານ" },
  statusDisabled: { en: "Disabled", lo: "ປິດໃຊ້ງານ" },
  statusSuccess: { en: "Success", lo: "ສຳເລັດ" },
};
