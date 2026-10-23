/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER CONFIGURATION ENGINE
 * TỆP: 1_CauHinh.gs - CẤU HÌNH HỆ THỐNG, MENU SHEET, KHỞI TẠO CSDL & WEB APP ENTRY
 * -------------------------------------------------------------------------
 * - KHÓA TỈ LỆ VIEWPORT & KHỬ NHÒE NÉT KHI DEPLOY WEB APP (WINDOWS SCALING 125% - 150%)
 * - CẤU HÌNH BỘ NHỚ ĐỆM CACHESERVICE (6 TIẾNG) CHO 12 THAM SỐ HỆ THỐNG
 * - TỰ ĐỘNG KHỞI TẠO VÀ ĐỊNH DẠNG CHUẨN 8 BẢNG CSDL TRÊN GOOGLE SHEETS
 * - QUẢN LÝ THỜI HẠN TỐ TỤNG CHUẨN BAN ĐẦU VÀ GIA HẠN CHO 8 NGÀNH ÁN
 * =========================================================================
 */

var APP_CONFIG = {
  TEN_UNG_DUNG: "TRỢ LÝ THẨM PHÁN V8.0",
  VERSION: "8.0.0",
  TIMEZONE: "Asia/Ho_Chi_Minh",
  FORMAT_VN: "dd/MM/yyyy",
  FORMAT_ISO: "yyyy-MM-dd",
  FORMAT_DATETIME: "dd/MM/yyyy HH:mm:ss",
  DIA_CHI_TOA_MAC_DINH: "Trụ sở Tòa án nhân dân tỉnh Lâm Đồng",

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
    .createMenu("⚖️ TRỢ LÝ 8.0")
    .addItem("🌐 Mở ứng dụng (Cửa sổ to)", "moGiaoDienChinh")
    .addSeparator()
    .addItem("🔄 Đồng bộ số liệu & Khởi tạo CSDL", "khoiTaoCoSoDuLieu")
    .addItem("📋 Kiểm kê & Đánh số 64 Biểu mẫu", "TOOL_KiemKeVaDanhSoBieuMau")
    .addItem("🧹 Dọn dẹp đương sự mồ côi", "api_DonDepDuongSuMoCoi")
    .addToUi();
}

/**
 * Mở cửa sổ ứng dụng Modal lớn trực tiếp từ Google Sheets (1650x950px)
 */
function moGiaoDienChinh() {
  var template = HtmlService.createTemplateFromFile('UI_Chinh');
  var output = template.evaluate();
  output.setTitle('TRỢ LÝ THẨM PHÁN V8.0 - HỆ THỐNG QUẢN LÝ ÁN & XỬ LÝ ĐƠN')
        .setWidth(1650)
        .setHeight(950)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
  SpreadsheetApp.getUi().showModalDialog(output, "TRỢ LÝ THẨM PHÁN V8.0");
}

/**
 * Endpoint chính khi triển khai Web App chạy toàn màn hình trên trình duyệt
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('UI_Chinh');
  var output = template.evaluate();
  output.setTitle('TRỢ LÝ THẨM PHÁN V8.0 - TÒA ÁN NHÂN DÂN')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
}

// =========================================================================
// 2. KHỞI TẠO CƠ SỞ DỮ LIỆU & QUẢN TRỊ 12 BIẾN HỆ THỐNG
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

    if (tenSheet === "7_BieuMau") {
      var checkVal = sheet.getRange("A2").getValue();
      if (checkVal === "") {
        var defaultBM = [
          ["Quyết định định giá tài sản", true, true],
          ["Quyết định xem xét thẩm định tại chỗ", true, true],
          ["Quyết định thành lập hội đồng định giá", true, true],
          ["Giấy triệu tập đo vẽ, định giá, xem xét thẩm định tại chỗ", true, true],
          ["Công văn yêu cầu đo vẽ", true, true],
          ["Công văn yêu cầu cử đại diện UBND", true, true],
          ["Giấy triệu tập đương sự", true, false],
          ["Thông báo mở phiên họp công khai chứng cứ và hòa giải", true, false],
          ["Quyết định đưa vụ án ra xét xử", true, false],
          ["Quyết định hoãn phiên tòa", true, false],
          ["Quyết định tạm ngừng phiên tòa", true, false],
          ["Thông báo hoãn phiên tòa", true, false],
          ["Thông báo mở lại phiên tòa", true, false],
          ["Thông báo thay đổi thời gian mở phiên tòa", true, false]
        ];
        sheet.getRange(2, 1, defaultBM.length, 3).setValues(defaultBM);
        sheet.getRange("B2:C" + (defaultBM.length + 1)).insertCheckboxes();
      }
    }
    sheet.autoResizeColumns(1, cauTruc[tenSheet].length);
  }

  var sheetConfig = ss.getSheetByName("5_CaiDat");
  var existing = sheetConfig.getRange("A:A").getValues().flat();

  var defaultSettings = {
    "TEN_THAM_PHAN": "",
    "TEN_TOA_AN": "Tòa án nhân dân",
    "DIA_CHI_TOA": APP_CONFIG.DIA_CHI_TOA_MAC_DINH,
    "CHUC_VU": "Thẩm phán",
    "DS_THU_KY": JSON.stringify([
      { xh: "Bà", ten: "Lường Thị Phương" },
      { xh: "Ông", ten: "Hoàng Rung K’Tuấn" }
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
  SpreadsheetApp.getUi().alert("✅ ĐÃ CHUẨN HÓA CƠ SỞ DỮ LIỆU TRỢ LÝ 8.0 THÀNH CÔNG!");
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