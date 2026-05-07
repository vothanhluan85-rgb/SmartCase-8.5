/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V3.0 - MASTER VERSION
 * FILE 7: NGHIỆP VỤ ĐỒNG BỘ SỐ LIỆU THỐNG KÊ (DATA SYNC & HUB)
 */

/**
 * API CHÍNH: Thực hiện gom số liệu và đẩy về Trung tâm
 * Dùng cho: Nút bấm "Đồng bộ" trên giao diện hoặc Chạy tự động
 */
function api_ThucHienDongBo() {
  try {
    // 1. Lấy thông tin cấu hình và định danh
    var config = getConfigFromSheet();
    var apiUrl = config["API_TRUNG_TAM"];
    
    if (!apiUrl || apiUrl.trim() === "") {
      return { success: false, error: "Chưa cấu hình địa chỉ API Trung tâm trong tab Cài đặt." };
    }

    // 2. TỔNG HỢP SỐ LIỆU (AGGREGATION)
    // Lưu ý: Chỉ lấy con số, không lấy bất kỳ thông tin cá nhân nào của đương sự
    var stats = aggregateJudgeStats();

    // 3. Đóng gói dữ liệu (Payload)
    var payload = {
      judgeName: config["TEN_THAM_PHAN"] || "Ẩn danh",
      courtName: config["TEN_TOA_AN"] || "Cơ quan chưa định danh",
      timestamp: new Date().toISOString(),
      data: stats,
      version: APP_CONFIG.VERSION
    };

    // 4. GỬI DỮ LIỆU ĐI (HTTP POST)
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(apiUrl, options);
    var resCode = response.getResponseCode();

    if (resCode === 200) {
      // Ghi lại nhật ký đồng bộ thành công
      return { success: true, message: "Đã gửi báo cáo số liệu thành công!" };
    } else {
      return { success: false, error: "Lỗi kết nối máy chủ (Code: " + resCode + ")" };
    }

  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Hàm bổ trợ: Quét sổ thụ lý để đếm số liệu
 */
function aggregateJudgeStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAn = ss.getSheetByName("1_SoThuLy");
  var data = sheetAn.getDataRange().getValues();
  
  var today = new Date();
  var stats = {
    tongAn: 0,
    dangGiaiQuyet: 0,
    daHoanThanh: 0,
    quaHan: 0,
    loaiAn: {} // Đếm theo từng loại (Hình sự, Dân sự...)
  };

  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    
    stats.tongAn++;
    
    // Đếm theo trạng thái
    var trangThai = data[i][6];
    if (trangThai === "Đã giải quyết" || trangThai === "Xong") {
      stats.daHoanThanh++;
    } else {
      stats.dangGiaiQuyet++;
      // Kiểm tra quá hạn
      if (data[i][5] instanceof Date && data[i][5] < today) {
        stats.quaHan++;
      }
    }

    // Đếm theo loại án
    var loai = data[i][3] || "Chưa phân loại";
    stats.loaiAn[loai] = (stats.loaiAn[loai] || 0) + 1;
  }

  return stats;
}

/**
 * TỰ ĐỘNG HÓA: Hàm này được gọi bởi Trigger thời gian (ví dụ: 12h đêm hàng ngày)
 */
function autoDailySync() {
  var config = getConfigFromSheet();
  // Chỉ chạy nếu Thẩm phán bật tính năng tự động trong Cài đặt
  if (config["AUTO_SYNC"] === true || config["AUTO_SYNC"] === "TRUE") {
    api_ThucHienDongBo();
  }
}

/**
 * Tiện ích: Tạo Trigger tự động cho Thẩm phán (Nếu họ muốn)
 */
function setupAutoSyncTrigger() {
  // Xóa các trigger cũ để tránh trùng lặp
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "autoDailySync") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Tạo mới: Chạy mỗi ngày một lần vào khoảng 1h - 2h sáng
  ScriptApp.newTrigger("autoDailySync")
           .timeBased()
           .everyDays(1)
           .atHour(1)
           .create();
}