/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.5 - MASTER CONFIGURATION & ACCESS ENGINE
 * TỆP: 1_CauHinh.gs - CẤU HÌNH, XÁC THỰC GMAIL, PHÂN QUYỀN & NHÂN BẢN DỰ ÁN
 * -------------------------------------------------------------------------
 * - XÁC THỰC GOOGLE IDENTITY: Nhận diện chính xác Email Google của người dùng.
 * - PHÂN QUYỀN THẨM PHÁN - THƯ KÝ:
 *   + Thẩm phán: Chủ sở hữu dự án (Admin), toàn quyền cài đặt & quản lý dữ liệu.
 *   + Thư ký: Được Thẩm phán phân quyền qua Email, toàn quyền tác nghiệp hồ sơ,
 *             tự động được cấp quyền chỉnh sửa file Docs/Drive không bị chặn.
 * - CƠ CHẾ NHÂN BẢN TRẮNG (ONBOARDING WIZARD):
 *   + Tự động làm sạch dữ liệu cũ khi chuyển giao sang Thẩm phán mới.
 *   + Tự động khởi tạo cây 4 thư mục Drive trên tài khoản Thẩm phán mới.
 *   + Tự động sao chép toàn bộ biểu mẫu chuẩn từ kho gốc sang kho mẫu mới.
 *   + Khóa/Mở các tính năng AI theo trạng thái cấu hình GEMINI_API_KEY.
 * =========================================================================
 */

var APP_CONFIG = {
  TEN_UNG_DUNG: "TRỢ LÝ THẨM PHÁN V8.5",
  VERSION: "8.5.0",
  TIMEZONE: "Asia/Ho_Chi_Minh",
  FORMAT_VN: "dd/MM/yyyy",
  FORMAT_ISO: "yyyy-MM-dd",
  FORMAT_DATETIME: "dd/MM/yyyy HH:mm:ss",
  DIA_CHI_TOA_MAC_DINH: "Trụ sở Tòa án nhân dân tỉnh Lâm Đồng",

  // ID Thư mục mẫu gốc để tự động nhân bản sang Thẩm phán mới (Chế độ xem mẫu chuẩn)
  MASTER_VAULT_AN_ID: "",     // Điền ID Thư mục mẫu Án chuẩn gốc nếu có
  MASTER_VAULT_DON_ID: "",    // Điền ID Thư mục mẫu Đơn chuẩn gốc nếu có

  // Thời hạn chuẩn bị xét xử / chuẩn bị xét đơn ban đầu (Tháng)
  DEADLINES_INIT: {
    "1. Hình sự": 1,
    "2. Dân sự": 4,
    "3. Hôn nhân": 4,
    "4. Kinh doanh": 2,
    "5. Lao động": 2,
    "6. Hành chính": 4,
    "7. Việc dân sự": 1,
    "8. Hòa giải đối thoại": 1
  },

  // Thời hạn gia hạn chuẩn bị xét xử tối đa (Tháng)
  DEADLINES_EXT: {
    "1. Hình sự": 1,
    "2. Dân sự": 2,
    "3. Hôn nhân": 2,
    "4. Kinh doanh": 1,
    "5. Lao động": 1,
    "6. Hành chính": 2,
    "7. Việc dân sự": 1,
    "8. Hòa giải đối thoại": 1
  }
};

// =========================================================================
// 1. KHỞI TẠO MENU TRÊN GOOGLE SHEETS
// =========================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚖️ TRỢ LÝ 8.5")
    .addItem("🌐 Mở ứng dụng (Cửa sổ to)", "moGiaoDienChinh")
    .addSeparator()
    .addItem("🔄 Đồng bộ số liệu & Khởi tạo CSDL", "khoiTaoCoSoDuLieu")
    .addItem("👥 Đồng bộ quyền Drive cho Thư ký", "TOOL_DongBoQuyenThuKy")
    .addItem("📁 Tự động tạo cây thư mục & Nhân bản kho mẫu", "TOOL_TuDongTaoCayThuMucVaNhanBanMau")
    .addSeparator()
    .addItem("📋 Kiểm kê & Đánh số 64 Biểu mẫu", "TOOL_KiemKeVaDanhSoBieuMau")
    .addItem("🧹 Dọn dẹp đương sự mồ côi", "api_DonDepDuongSuMoCoi")
    .addSeparator()
    .addItem("⚠️ Tẩy trắng dữ liệu để chuyển giao (Reset)", "TOOL_TayTrangDuLieuChuyenGiao")
    .addToUi();
}

/**
 * Mở cửa sổ ứng dụng Modal lớn trực tiếp từ Google Sheets (1650x950px)
 */
function moGiaoDienChinh() {
  var template = HtmlService.createTemplateFromFile('UI_Chinh');
  var output = template.evaluate();
  output.setTitle('TRỢ LÝ THẨM PHÁN V8.5 - HỆ THỐNG QUẢN LÝ ÁN & XỬ LÝ ĐƠN')
        .setWidth(1650)
        .setHeight(950)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
  SpreadsheetApp.getUi().showModalDialog(output, "TRỢ LÝ THẨM PHÁN V8.5");
}

/**
 * Endpoint chính khi triển khai Web App chạy toàn màn hình trên trình duyệt
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('UI_Chinh');
  var output = template.evaluate();
  output.setTitle('TRỢ LÝ THẨM PHÁN V8.5 - TÒA ÁN NHÂN DÂN')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
}

// =========================================================================
// 2. KHỞI TẠO CƠ SỞ DỮ LIỆU & THIẾT LẬP THAM SỐ HỆ THỐNG
// =========================================================================

function khoiTaoCoSoDuLieu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetLocale('vi');

  var cauTruc = {
    "0_SoNhanDon": ["ID_Don", "Số đơn", "Ngày nhận", "Phân loại án", "Quan hệ tranh chấp", "Giá trị tranh chấp", "Hướng xử lý", "Thẩm phán phân công", "Tạm ứng án phí", "Trạng thái", "Ghi chú / Phân tích AI"],
    "0_DuongSuDon": ["ID_Don", "Tư cách (Tiền tố tụng)", "Xưng hô", "Họ Tên", "Năm Sinh", "Địa Chỉ", "Điện Thoại", "CCCD", "Người đại diện"],
    "1_SoThuLy": ["ID_VuAn", "Số Thụ Lý", "Ngày Thụ Lý", "Loại Án", "Quan Hệ / Tội Danh", "Hạn Giải Quyết", "Trạng Thái", "Link Drive", "Ghi Chú", "QLTA_Status", "CONG_BO_Status", "Ngay_Tac_Dong_Cuoi", "Kết Quả Giải Quyết", "Nguồn dữ liệu"],
    "2_DuongSu": ["ID_VuAn", "Tư cách", "Xưng Hô", "Họ Tên", "Năm Sinh", "Địa Chỉ", "Điện Thoại", "CCCD", "Người đại diện", "Ngày ủy quyền"],
    "3_LichTrinh": ["ID_Lich", "ID_VuAn", "Ngày Giờ", "Nội Dung Công Việc", "Trạng Thái", "Ghi Chú", "Calendar_ID"],
    "4_NhatKy": ["ID_VuAn", "Thời Gian", "Sự Kiện", "Chi Tiết"],
    "5_CaiDat": ["Tên Biến", "Giá Trị"],
    "6_Placeholder": ["Số thứ tự", "Placeholder", "Định nghĩa", "Hướng dẫn sử dụng"],
    "7_BieuMau": ["Tên biểu mẫu", "Nhắc Thời gian", "Nhắc Địa điểm"]
  };

  var allSheetNames = Object.keys(cauTruc);
  for (var k = allSheetNames.length - 1; k >= 0; k--) {
    var tenSheet = allSheetNames[k];
    var sheet = ss.getSheetByName(tenSheet);
    if (!sheet) {
      sheet = ss.insertSheet(tenSheet, 0);
    }
    sheet.getRange(1, 1, 1, cauTruc[tenSheet].length).setValues([cauTruc[tenSheet]])
         .setFontWeight("bold").setBackground("#1a73e8").setFontColor("#ffffff").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, cauTruc[tenSheet].length);
  }

  var sheetConfig = ss.getSheetByName("5_CaiDat");
  var existing = sheetConfig.getRange("A:A").getValues().flat();

  var currentOwnerEmail = "";
  try {
    currentOwnerEmail = Session.getEffectiveUser().getEmail() || "";
  } catch(eMail) {}

  var defaultSettings = {
    "TEN_THAM_PHAN": "",
    "EMAIL_THAM_PHAN": currentOwnerEmail,
    "TEN_TOA_AN": "Tòa án nhân dân",
    "DIA_CHI_TOA": APP_CONFIG.DIA_CHI_TOA_MAC_DINH,
    "CHUC_VU": "Thẩm phán",
    "DS_THU_KY": JSON.stringify([
      { xh: "Bà", ten: "Lường Thị Phương", email: "" },
      { xh: "Ông", ten: "Hoàng Rung K’Tuấn", email: "" }
    ]),
    "ID_THUMUC_AN": "",
    "ID_THUMUC_MAU": "",
    "GEMINI_API_KEY": "",
    "ID_EXCEL_DON": "",
    "ID_THUMUC_DON": "",
    "ID_THUMUC_MAU_DON": "",
    "AUTO_SYNC": "TRUE"
  };
  
  for (var key in defaultSettings) {
    if (!existing.includes(key)) {
      sheetConfig.appendRow([key, defaultSettings[key]]);
    }
  }

  backend_SyncPlaceholdersToSheet();
  CacheService.getScriptCache().remove("APP_CONFIG_V80");
  SpreadsheetApp.getUi().alert("✅ ĐÃ CHUẨN HÓA CƠ SỞ DỮ LIỆU VÀ CẤU TRÚC HỆ THỐNG THÀNH CÔNG!");
}

function getConfigFromSheet() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("APP_CONFIG_V80");
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("5_CaiDat");
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) config[data[i][0].toString().trim()] = data[i][1] ? data[i][1].toString().trim() : "";
  }

  if (!config["DIA_CHI_TOA"] || config["DIA_CHI_TOA"].trim() === "" || config["DIA_CHI_TOA"] === "Trụ sở Tòa án") {
    config["DIA_CHI_TOA"] = APP_CONFIG.DIA_CHI_TOA_MAC_DINH;
  }

  // Tự động nhận diện Email Thẩm phán nếu bị khuyết
  if (!config["EMAIL_THAM_PHAN"] || config["EMAIL_THAM_PHAN"].trim() === "") {
    try {
      config["EMAIL_THAM_PHAN"] = Session.getEffectiveUser().getEmail() || "";
    } catch(e) {}
  }

  cache.put("APP_CONFIG_V80", JSON.stringify(config), 21600); // Lưu đệm 6 tiếng (< 5ms)
  return config;
}

function updateConfigInSheet(settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("5_CaiDat");
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();
  for (var key in settings) {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === key) {
        sheet.getRange(i + 1, 2).setValue(settings[key]);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([key, settings[key]]);
  }

  CacheService.getScriptCache().remove("APP_CONFIG_V80");
  return true;
}

// =========================================================================
// 3. XÁC THỰC GOOGLE IDENTITY & PHÂN QUYỀN THẨM PHÁN - THƯ KÝ
// =========================================================================

/**
 * Xác định danh tính và vai trò của tài khoản Google đang truy cập ứng dụng
 */
function auth_GetCurrentUserIdentity() {
  try {
    var activeEmail = "";
    var effectiveEmail = "";
    try { activeEmail = Session.getActiveUser().getEmail() || ""; } catch(e1) {}
    try { effectiveEmail = Session.getEffectiveUser().getEmail() || ""; } catch(e2) {}

    var config = getConfigFromSheet();
    var judgeEmail = (config["EMAIL_THAM_PHAN"] || effectiveEmail || "").trim().toLowerCase();
    var judgeName = config["TEN_THAM_PHAN"] || "Thẩm phán";
    var courtName = config["TEN_TOA_AN"] || "Tòa án nhân dân";
    var hasGeminiKey = Boolean(config["GEMINI_API_KEY"] && config["GEMINI_API_KEY"].trim().length > 10);

    var rawClerks = config["DS_THU_KY"];
    var clerks = [];
    try {
      clerks = typeof rawClerks === 'string' ? JSON.parse(rawClerks) : rawClerks;
    } catch(e3) { clerks = []; }

    var userEmail = activeEmail ? activeEmail.trim().toLowerCase() : "";

    // 1. Trường hợp là Thẩm phán (Owner / Admin cao nhất)
    if (userEmail === judgeEmail || userEmail === effectiveEmail.toLowerCase() || (userEmail === "" && activeEmail === effectiveEmail)) {
      return {
        success: true,
        email: judgeEmail || effectiveEmail,
        role: "JUDGE",
        roleTitle: "Thẩm phán (Quản trị)",
        displayName: judgeName,
        courtName: courtName,
        hasAI: hasGeminiKey,
        canManageSettings: true,
        canDeleteCase: true,
        canManageClerks: true
      };
    }

    // 2. Trường hợp là Thư ký được phân công trong DS_THU_KY
    var matchedClerk = null;
    if (Array.isArray(clerks) && userEmail) {
      matchedClerk = clerks.find(function(c) {
        return c.email && c.email.trim().toLowerCase() === userEmail;
      });
    }

    if (matchedClerk) {
      return {
        success: true,
        email: userEmail,
        role: "CLERK",
        roleTitle: "Thư ký Tòa án",
        displayName: (matchedClerk.xh ? matchedClerk.xh + " " : "") + matchedClerk.ten,
        judgeName: judgeName,
        courtName: courtName,
        hasAI: hasGeminiKey,
        canManageSettings: false, // Thư ký không sửa cấu hình nhạy cảm/API Key
        canDeleteCase: false,      // Thư ký không tự ý xóa vụ án vĩnh viễn
        canManageClerks: false
      };
    }

    // 3. Chạy kiểm thử từ tài khoản tạo script khi Google giấu email
    if (!userEmail && effectiveEmail) {
      return {
        success: true,
        email: effectiveEmail,
        role: "JUDGE",
        roleTitle: "Thẩm phán (Chủ tài khoản)",
        displayName: judgeName,
        courtName: courtName,
        hasAI: hasGeminiKey,
        canManageSettings: true,
        canDeleteCase: true,
        canManageClerks: true
      };
    }

    // 4. Tài khoản ngoài - Từ chối truy cập (Access Denied)
    return {
      success: false,
      email: userEmail || "Chưa xác định",
      role: "UNAUTHORIZED",
      message: "Tài khoản Google (" + (userEmail || "ẩn danh") + ") chưa được Thẩm phán " + judgeName + " phân quyền trong hệ thống."
    };

  } catch(e) {
    return { success: false, error: "Lỗi xác thực người dùng: " + e.message };
  }
}

// =========================================================================
// 4. ĐỒNG BỘ QUYỀN TRUY CẬP GOOGLE DRIVE CHO THƯ KÝ (AUTO-PERMISSION)
// =========================================================================

/**
 * Tự động chia sẻ quyền Editor cho toàn bộ Thư ký được cấu hình
 */
function syncClerkPermissionsToDrive() {
  try {
    var config = getConfigFromSheet();
    var rawClerks = config["DS_THU_KY"];
    var clerks = [];
    try {
      clerks = typeof rawClerks === 'string' ? JSON.parse(rawClerks) : rawClerks;
    } catch(e) { clerks = []; }

    var validEmails = [];
    if (Array.isArray(clerks)) {
      clerks.forEach(function(c) {
        if (c.email && c.email.includes("@")) {
          validEmails.push(c.email.trim().toLowerCase());
        }
      });
    }

    if (validEmails.length === 0) {
      return { success: true, count: 0, message: "Không có email Thư ký nào trong danh sách cần cấp quyền." };
    }

    // Cấp quyền trên cả 4 thư mục tác nghiệp chính
    var folderKeys = ["ID_THUMUC_AN", "ID_THUMUC_DON", "ID_THUMUC_MAU", "ID_THUMUC_MAU_DON"];
    var sharedFolderCount = 0;

    folderKeys.forEach(function(fKey) {
      var folderId = extractFolderIdSafe(config[fKey]);
      if (folderId) {
        try {
          var folder = DriveApp.getFolderById(folderId);
          validEmails.forEach(function(email) {
            try {
              folder.addEditor(email);
              sharedFolderCount++;
            } catch(eShare) {
              console.warn("Lỗi share thư mục " + folderId + " cho " + email + ": " + eShare.message);
            }
          });
        } catch(eF) {}
      }
    });

    // Cấp quyền trên Spreadsheet hiện tại để Thư ký có quyền đọc/ghi dữ liệu
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    validEmails.forEach(function(email) {
      try {
        ss.addEditor(email);
      } catch(eSS) {}
    });

    return { 
      success: true, 
      count: validEmails.length, 
      sharedFolders: sharedFolderCount,
      message: "Đã chia sẻ quyền chỉnh sửa Drive & Cơ sở dữ liệu cho " + validEmails.length + " Thư ký thành công!" 
    };

  } catch(e) {
    return { success: false, error: "Lỗi đồng bộ quyền Thư ký: " + e.message };
  }
}

function TOOL_DongBoQuyenThuKy() {
  var res = syncClerkPermissionsToDrive();
  var ui = SpreadsheetApp.getUi();
  if (res.success) {
    ui.alert("HOÀN TẤT PHÂN QUYỀN", res.message, ui.ButtonSet.OK);
  } else {
    ui.alert("LỖI PHÂN QUYỀN", res.error, ui.ButtonSet.OK);
  }
}

// =========================================================================
// 5. CƠ CHẾ NHÂN BẢN TRẮNG (ONBOARDING & CLONE WIZARD CHO THẨM PHÁN MỚI)
// =========================================================================

/**
 * Tự động tạo cây 4 thư mục Drive mới và sao chép kho biểu mẫu gốc sang tài khoản Thẩm phán mới
 */
function setup_AutoCreateFoldersAndCloneTemplates() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var config = getConfigFromSheet();
    var currentEmail = Session.getEffectiveUser().getEmail() || "";
    var judgeName = config["TEN_THAM_PHAN"] || "Thẩm phán";
    var courtName = config["TEN_TOA_AN"] || "Tòa án nhân dân";

    // 1. Tạo Thư mục gốc trên Drive của Thẩm phán mới
    var rootFolderName = `[TRỢ LÝ 8.5] - ${courtName.toUpperCase()} - ${judgeName.toUpperCase()}`;
    var rootFolder = DriveApp.createFolder(rootFolderName);

    // 2. Tạo cây 4 thư mục con chuyên biệt
    var folderAn = rootFolder.createFolder("01_HỒ SƠ VỤ ÁN");
    var folderDon = rootFolder.createFolder("02_HỒ SƠ ĐƠN KHỞI KIỆN");
    var folderMauAn = rootFolder.createFolder("03_KHO BIỂU MẪU ÁN");
    var folderMauDon = rootFolder.createFolder("04_KHO BIỂU MẪU ĐƠN");

    var copiedAnCount = 0;
    var copiedDonCount = 0;

    // 3. Sao chép mẫu Án từ kho nguồn (Ưu tiên ID cấu hình cũ hoặc Vault gốc)
    var srcMauAnId = extractFolderIdSafe(config["ID_THUMUC_MAU"]) || extractFolderIdSafe(APP_CONFIG.MASTER_VAULT_AN_ID);
    if (srcMauAnId) {
      try {
        var srcFolderAn = DriveApp.getFolderById(srcMauAnId);
        var filesAn = srcFolderAn.getFiles();
        while (filesAn.hasNext()) {
          var fA = filesAn.next();
          var fNameA = fA.getName();
          if (fNameA.startsWith("~$") || fNameA.startsWith("[TEMP]")) continue;
          fA.makeCopy(fNameA, folderMauAn);
          copiedAnCount++;
        }
      } catch(eCopyAn) {
        console.warn("Lỗi sao chép mẫu Án: " + eCopyAn.message);
      }
    }

    // 4. Sao chép mẫu Đơn từ kho nguồn
    var srcMauDonId = extractFolderIdSafe(config["ID_THUMUC_MAU_DON"]) || extractFolderIdSafe(APP_CONFIG.MASTER_VAULT_DON_ID);
    if (srcMauDonId) {
      try {
        var srcFolderDon = DriveApp.getFolderById(srcMauDonId);
        var filesDon = srcFolderDon.getFiles();
        while (filesDon.hasNext()) {
          var fD = filesDon.next();
          var fNameD = fD.getName();
          if (fNameD.startsWith("~$") || fNameD.startsWith("[TEMP]")) continue;
          fD.makeCopy(fNameD, folderMauDon);
          copiedDonCount++;
        }
      } catch(eCopyDon) {
        console.warn("Lỗi sao chép mẫu Đơn: " + eCopyDon.message);
      }
    }

    // 5. Cập nhật 4 ID thư mục mới và Email Thẩm phán vào Sheet 5_CaiDat
    var newSettings = {
      "EMAIL_THAM_PHAN": currentEmail,
      "ID_THUMUC_AN": folderAn.getId(),
      "ID_THUMUC_DON": folderDon.getId(),
      "ID_THUMUC_MAU": folderMauAn.getId(),
      "ID_THUMUC_MAU_DON": folderMauDon.getId()
    };
    updateConfigInSheet(newSettings);

    // 6. Đồng bộ phân quyền ngay nếu đã có email Thư ký
    syncClerkPermissionsToDrive();

    return {
      success: true,
      rootUrl: rootFolder.getUrl(),
      copiedAn: copiedAnCount,
      copiedDon: copiedDonCount,
      message: `Đã khởi tạo thành công Cây thư mục trên Drive:\n` +
               `- 01_HỒ SƠ VỤ ÁN\n` +
               `- 02_HỒ SƠ ĐƠN KHỞI KIỆN\n` +
               `- 03_KHO BIỂU MẪU ÁN (Đã sao chép ${copiedAnCount} mẫu)\n` +
               `- 04_KHO BIỂU MẪU ĐƠN (Đã sao chép ${copiedDonCount} mẫu)`
    };

  } catch(e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

function TOOL_TuDongTaoCayThuMucVaNhanBanMau() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    "KHỞI TẠO CÂY THƯ MỤC DRIVE",
    "Hệ thống sẽ tự động tạo thư mục gốc mới trên Google Drive của Thẩm phán và sao chép toàn bộ biểu mẫu từ kho mẫu chuẩn sang.\n\nBạn có muốn tiếp tục không?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  var res = setup_AutoCreateFoldersAndCloneTemplates();
  if (res.success) {
    ui.alert("THIẾT LẬP HOÀN TẤT", res.message, ui.ButtonSet.OK);
  } else {
    ui.alert("LỖI KHỞI TẠO", res.error, ui.ButtonSet.OK);
  }
}

/**
 * Tẩy trắng toàn bộ dữ liệu án, đơn, lịch cũ để chuẩn bị chuyển giao ứng dụng
 */
function setup_ResetToFactorySettings() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Dọn sạch dữ liệu các bảng nghiệp vụ (Chỉ giữ lại dòng tiêu đề)
    var sheetsToClear = [
      "0_SoNhanDon",
      "0_DuongSuDon",
      "1_SoThuLy",
      "2_DuongSu",
      "3_LichTrinh",
      "4_NhatKy"
    ];

    sheetsToClear.forEach(function(sName) {
      var sheet = ss.getSheetByName(sName);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
    });

    // 2. Dọn sạch cấu hình cá nhân và API Key trong 5_CaiDat
    var sheetConfig = ss.getSheetByName("5_CaiDat");
    if (sheetConfig && sheetConfig.getLastRow() > 1) {
      var resetSettings = {
        "TEN_THAM_PHAN": "",
        "EMAIL_THAM_PHAN": "",
        "CHUC_VU": "Thẩm phán",
        "GEMINI_API_KEY": "",
        "ID_EXCEL_DON": "",
        "ID_THUMUC_AN": "",
        "ID_THUMUC_DON": "",
        "ID_THUMUC_MAU": "",
        "ID_THUMUC_MAU_DON": "",
        "DS_THU_KY": JSON.stringify([])
      };
      updateConfigInSheet(resetSettings);
    }

    CacheService.getScriptCache().remove("APP_CONFIG_V80");
    CacheService.getScriptCache().remove("APP_AI_MODEL_TIERS");

    return {
      success: true,
      message: "Đã tẩy trắng hoàn toàn CSDL Án, Đơn, Lịch trình và Cấu hình cá nhân. Ứng dụng đã sẵn sàng chuyển giao cho Thẩm phán mới!"
    };

  } catch(e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

function TOOL_TayTrangDuLieuChuyenGiao() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    "⚠️ CẢNH BÁO TẨY TRẮNG DỮ LIỆU ĐỂ CHUYỂN GIAO",
    "Toàn bộ hồ sơ Án, Đơn, Đương sự, Lịch công tác và API Key cá nhân trong bản tính này sẽ bị XÓA SẠCH HOÀN TOÀN.\n\nThao tác này chỉ thực hiện khi bạn muốn đóng gói ứng dụng để chuyển giao cho Thẩm phán khác.\n\nBạn có CHẮC CHẮN muốn thực hiện không?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  var res = setup_ResetToFactorySettings();
  if (res.success) {
    ui.alert("ĐÃ RESET THÀNH CÔNG", res.message, ui.ButtonSet.OK);
  } else {
    ui.alert("LỖI RESET", res.error, ui.ButtonSet.OK);
  }
}

// =========================================================================
// 6. TIỆN ÍCH QUẢN TRỊ BIỂU MẪU & PLACEHOLDER
// =========================================================================

function backend_SyncPlaceholdersToSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("6_Placeholder");
  if (!sheet) return;
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).clearContent();
  
  var list = (typeof backend_GetAllPlaceholders === 'function') ? backend_GetAllPlaceholders() : []; 
  if (!list || list.length === 0) return;
  var rows = list.map(function(item, i) {
    return [i + 1, item.name, item.description, "Copy và dán vào file Word / Google Docs"];
  });
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}

function api_GetTemplateSettings() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("7_BieuMau");
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        list.push({
          name: data[i][0].toString().toLowerCase().trim(),
          requireTime: data[i][1] === true,
          requireLocation: data[i][2] === true
        });
      }
    }
    return list;
  } catch(e) { return []; }
}

function extractFolderIdSafe(input) {
  if (!input) return "";
  var str = input.toString().trim();
  if (str.includes("id=")) return str.split("id=")[1].split("&")[0];
  if (str.includes("folders/")) return str.split("folders/")[1].split("?")[0].split("/")[0];
  return str;
}

/**
 * XUẤT CHÍNH XÁC TOÀN BỘ BIỂU MẪU ÁN RA FILE ZIP LƯU TRỮ
 */
function TOOL_XuatChuanToanBo64MauAnRaText() {
  var config = getConfigFromSheet();
  var folderId = extractFolderIdSafe(config["ID_THUMUC_MAU"]);
  if (!folderId) {
    Logger.log("❌ CHƯA CẤU HÌNH ID_THUMUC_MAU TRONG CÀI ĐẶT!");
    return;
  }

  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFiles();
  var blobs = [];
  var fileCount = 0;
  var report = [];

  while (files.hasNext()) {
    var f = files.next();
    var fName = f.getName();
    var mime = f.getMimeType();

    if (fName.startsWith("~$") || fName.toLowerCase().includes("placeholder") || fName.startsWith("[TEMP]")) continue;

    var text = "";
    if (mime === MimeType.GOOGLE_DOCS) {
      try {
        var doc = DocumentApp.openById(f.getId());
        text = doc.getBody().getText();
        if (doc.getHeader()) text = doc.getHeader().getText() + "\n" + text;
        if (doc.getFooter()) text = text + "\n" + doc.getFooter().getText();
      } catch(e) { text = "Lỗi đọc Docs: " + e.message; }
    } else if (fName.endsWith('.docx') || fName.endsWith('.doc')) {
      try {
        var tempFile = Drive.Files.create({ name: "[TEMP] " + fName, mimeType: MimeType.GOOGLE_DOCS }, f.getBlob());
        var tempDoc = DocumentApp.openById(tempFile.id);
        text = tempDoc.getBody().getText();
        Drive.Files.remove(tempFile.id);
      } catch(e) { text = "Lỗi convert Word: " + e.message; }
    } else {
      continue;
    }

    var cleanName = fName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\.\-\s]/g, "");
    var isBlank = (!text || text.trim().length < 50);

    report.push((isBlank ? "⚠️ [TRỐNG] " : "✅ [CÓ CHỮ] ") + cleanName + " (" + text.trim().length + " ký tự)");
    blobs.push(Utilities.newBlob(text, "text/plain", cleanName + ".md"));
    fileCount++;
  }

  var zip = Utilities.zip(blobs, "Kho_Bieu_Mau_Thuc_Te.zip");
  var zipFile = folder.createFile(zip);

  Logger.log("==========================================");
  Logger.log("ĐÃ XUẤT XONG " + fileCount + " BIỂU MẪU ÁN!");
  Logger.log("LINK TẢI FILE ZIP: " + zipFile.getUrl());
  Logger.log("==========================================");
}