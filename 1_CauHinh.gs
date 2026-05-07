/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.6 - GROQ AI EDITION
 * FILE 1: CẤU HÌNH HỆ THỐNG & KHỞI TẠO CSDL
 * ------------------------------------------------------------
 * NÂNG CẤP LỚN:
 * - Tự động tạo và chuẩn hóa 2 Sheet mới cho Module Xử Lý Đơn:
 *   + 0_SoNhanDon
 *   + 0_DuongSuDon
 * - Tích hợp cấu trúc dữ liệu mới vào hàm `khoiTaoCoSoDuLieu`.
 */

var APP_CONFIG = {
  TEN_UNG_DUNG: "TRỢ LÝ THẨM PHÁN V7.6",
  VERSION: "7.6.0.RC1", // Release Candidate 1
  TIMEZONE: "Asia/Ho_Chi_Minh",
  FORMAT_VN: "dd/MM/yyyy",
  FORMAT_ISO: "yyyy-MM-dd",
  FORMAT_DATETIME: "dd/MM/yyyy HH:mm:ss",

  DEADLINES_INIT: { "1. Hình sự": 2, "2. Dân sự": 4, "3. Hôn nhân": 4, "4. Kinh doanh": 2, "5. Lao động": 4, "6. Hành chính": 4, "7. Hòa giải đối thoại": 1 },
  DEADLINES_EXT: { "1. Hình sự": 1, "2. Dân sự": 2, "3. Hôn nhân": 2, "4. Kinh doanh": 1, "5. Lao động": 2, "6. Hành chính": 2 }
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('⚖️ TRỢ LÝ V7.6')
    .addItem('🖥️ Mở Bàn Làm Việc', 'moGiaoDien')
    .addSeparator()
    .addItem('🛠️ Cài đặt & Chuẩn Hóa CSDL', 'khoiTaoCoSoDuLieu')
    .addToUi();
}

function moGiaoDien() {
  var html = HtmlService.createTemplateFromFile('UI_Chinh').evaluate()
    .setTitle(APP_CONFIG.TEN_UNG_DUNG).setWidth(1450).setHeight(900)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  SpreadsheetApp.getUi().showModalDialog(html, '🖥️ BÀN LÀM VIỆC - TRỢ LÝ THẨM PHÁN');
}

function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

/**
 * [ĐÃ NÂNG CẤP]
 * Hàm này sẽ tạo/cập nhật toàn bộ cấu trúc CSDL, bao gồm cả các sheet cho Module Xử lý Đơn.
 */
function khoiTaoCoSoDuLieu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetLocale('vi');

  // ĐỊNH NGHĨA TOÀN BỘ CẤU TRÚC DATABASE
  var cauTruc = {
    // --- MODULE XỬ LÝ ĐƠN ---
    "0_SoNhanDon": ["ID_Don", "Số đơn", "Ngày nhận", "Phân loại án", "Quan hệ tranh chấp", "Giá trị tranh chấp", "Hướng xử lý", "Thẩm phán phân công", "Tạm ứng án phí", "Trạng thái", "Ghi chú / Phân tích AI"],
    "0_DuongSuDon": ["ID_Don", "Tư cách (Tiền tố tụng)", "Xưng hô", "Họ Tên", "Năm Sinh", "Địa Chỉ", "Điện Thoại", "CCCD", "Người đại diện"],
    
    // --- MODULE SỔ THỤ LÝ ---
    "1_SoThuLy": ["ID_VuAn", "Số Thụ Lý", "Ngày Thụ Lý", "Loại Án", "Quan Hệ / Tội Danh", "Hạn Giải Quyết", "Trạng Thái", "Link Drive", "Ghi Chú", "QLTA_Status", "CONG_BO_Status", "Ngay_Tac_Dong_Cuoi", "Kết Quả Giải Quyết", "Nguồn dữ liệu"],
    "2_DuongSu": ["ID_VuAn", "Tư cách", "Xưng Hô", "Họ Tên", "Năm Sinh", "Địa Chỉ", "Điện Thoại", "CCCD", "Người đại diện"],
    "3_LichTrinh": ["ID_Lich", "ID_VuAn", "Ngày Giờ", "Nội Dung Công Việc", "Trạng Thái", "Ghi Chú", "Calendar_ID"],
    "4_NhatKy": ["ID_VuAn", "Thời Gian", "Sự Kiện", "Chi Tiết"],
    
    // --- MODULE CẤU HÌNH & TIỆN ÍCH ---
    "5_CaiDat": ["Tên Biến", "Giá Trị"],
    "6_Placeholder": ["Số thứ tự", "Placeholder", "Định nghĩa", "Hướng dẫn sử dụng"],
    "7_BieuMau": ["Tên biểu mẫu", "Nhắc Thời gian", "Nhắc Địa điểm"]
  };

  var allSheetNames = Object.keys(cauTruc);
  
  // Duyệt ngược để insert sheet mới lên đầu cho đúng thứ tự 0, 1, 2...
  for (var i = allSheetNames.length - 1; i >= 0; i--) {
      var tenSheet = allSheetNames[i];
      var sheet = ss.getSheetByName(tenSheet);
      if (!sheet) {
          sheet = ss.insertSheet(tenSheet, 0); // Insert ở vị trí đầu tiên
      }
      
      // Định dạng Header
      sheet.getRange(1, 1, 1, cauTruc[tenSheet].length).setValues([cauTruc[tenSheet]])
           .setFontWeight("bold").setBackground("#1a73e8").setFontColor("#ffffff").setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      // Xử lý riêng cho Sheet 7_BieuMau (Giữ nguyên logic cũ)
      if (tenSheet === "7_BieuMau") {
        var checkVal = sheet.getRange("A2").getValue();
        if (checkVal === "") {
          var defaultBM = [
            ["Quyết định định giá tài sản", true, true], ["Quyết định xem xét thẩm định tại chỗ", true, true],
            ["Quyết định thành lập hội đồng định giá", true, true], ["Giấy triệu tập đo vẽ, định giá, xem xét thẩm định tại chỗ", true, true],
            ["Công văn yêu cầu đo vẽ", true, true], ["Công văn yêu cầu cử đại diện UBND", true, true],
            ["Giấy triệu tập đương sự", true, false], ["Thông báo mở phiên họp công khai chứng cứ và hòa giải", true, false],
            ["Quyết định đưa vụ án ra xét xử", true, false], ["Quyết định hoãn phiên tòa", true, false],
            ["Quyết định tạm ngừng phiên tòa", true, false], ["Thông báo hoãn phiên tòa", true, false],
            ["Thông báo mở lại phiên tòa", true, false], ["Thông báo thay đổi thời gian mở phiên tòa", true, false]
          ];
          sheet.getRange(2, 1, defaultBM.length, 3).setValues(defaultBM);
          sheet.getRange("B2:C" + (defaultBM.length + 1)).insertCheckboxes();
        }
      }
      sheet.autoResizeColumns(1, cauTruc[tenSheet].length);
  }

  // Khởi tạo Cài đặt mặc định (Giữ nguyên logic cũ)
  var sheetConfig = ss.getSheetByName("5_CaiDat");
  var existing = sheetConfig.getRange("A:A").getValues().flat();
  ["TEN_THAM_PHAN", "TEN_TOA_AN", "DIA_CHI_TOA", "CHUC_VU", "TEN_THU_KY", "ID_THUMUC_AN", "ID_THUMUC_MAU", "GROQ_API_KEY"].forEach(k => {
    if (!existing.includes(k)) sheetConfig.appendRow([k, ""]);
  });

  backend_SyncPlaceholdersToSheet(); // Đồng bộ ra Sheet 6
  CacheService.getScriptCache().remove("APP_CONFIG_V7");
  SpreadsheetApp.getUi().alert("✅ ĐÃ CHUẨN HÓA CƠ SỞ DỮ LIỆU V7.6 THÀNH CÔNG!\n\nĐã bao gồm các Sổ quản lý Đơn mới.");
}

function getConfigFromSheet() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("APP_CONFIG_V7");
  if (cached) return JSON.parse(cached);
  var data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("5_CaiDat").getDataRange().getValues();
  var config = {};
  data.forEach(r => { if(r[0]) config[r[0]] = r[1]; });
  cache.put("APP_CONFIG_V7", JSON.stringify(config), 21600);
  return config;
}

function updateConfigInSheet(settings) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("5_CaiDat");
  var data = sheet.getDataRange().getValues();
  for (var key in settings) {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(settings[key]); found = true; break; }
    }
    if (!found) sheet.appendRow([key, settings[key]]);
  }
  CacheService.getScriptCache().remove("APP_CONFIG_V7");
  return true;
}

function backend_SyncPlaceholdersToSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("6_Placeholder");
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).clearContent();
  var list = backend_GetAllPlaceholders(); 
  if(!list) return;
  var rows = list.map((item, i) => [i + 1, item.name, item.description, "Copy và dán vào file Word"]);
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}

function api_GetTemplateSettings() {
  var data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("7_BieuMau").getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => ({ name: r[0].toString().toLowerCase(), requireTime: r[1] === true, requireLocation: r[2] === true }));
}

// ============================================================
// HÀM KHỞI CHẠY KHI MỞ DƯỚI DẠNG WEB APP ĐỘC LẬP
// ============================================================
function doGet(e) {
  var html = HtmlService.createTemplateFromFile('UI_Chinh').evaluate();
  html.setTitle(APP_CONFIG.TEN_UNG_DUNG)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}