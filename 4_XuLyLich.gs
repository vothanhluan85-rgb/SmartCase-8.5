/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER CALENDAR & TIMELINE CORE
 * TỆP: 4_XuLyLich.gs - QUẢN LÝ LỊCH CÔNG TÁC, NHẮC VIỆC TỐ TỤNG & DÒNG THỜI GIAN
 * -------------------------------------------------------------------------
 * - BẢN TOÀN DIỆN 100%: NGUYÊN VẸN TẤT CẢ CÁC HÀM, KHÔNG RÚT GỌN MÃ NGUỒN
 * - ĐỒNG BỘ 2 CHIỀU TỨC THÌ VỚI GOOGLE CALENDAR ĐỂ XEM TRÊN ĐIỆN THOẠI DI ĐỘNG
 * - PHÂN LOẠI MÀU SẮC SỰ KIỆN: ĐỎ (XÉT XỬ), XANH LÁ (HÒA GIẢI), TÍM (THẨM ĐỊNH), VÀNG (MỐC 24H)
 * - TỰ ĐỘNG TÍNH MỐC 24H (ĐIỀU 147, 148 BLDS & 212 BLTTDS):
 *   + HÒA GIẢI THÀNH (07 NGÀY) -> ĐẶT LỊCH RA QĐ VÀO NGÀY THỨ 8
 *   + HGĐT THÀNH (15 NGÀY) -> ĐẶT LỊCH RA QĐ VÀO NGÀY THỨ 16
 *   (TỰ ĐỘNG TỊNH TIẾN SANG NGÀY LÀM VIỆC KẾ TIẾP NẾU TRÙNG THỨ 7, CN, NGHỈ LỄ)
 * - TÍCH HỢP SpreadsheetApp.flush() ĐỂ DỮ LIỆU ĐƯỢC GHI XUỐNG CSDL NGAY LẬP TỨC
 * =========================================================================
 */

// BẢNG MÃ MÀU SỰ KIỆN GOOGLE CALENDAR CHUẨN NGHIỆP VỤ TÒA ÁN
var GCAL_COLORS = {
  XET_XU: CalendarApp.EventColor.RED,          // Đỏ: Xét xử sơ thẩm / Tuyên án
  HOA_GIAI: CalendarApp.EventColor.PALE_GREEN, // Xanh lá: Hòa giải, đối thoại, công khai chứng cứ
  THAM_DINH: CalendarApp.EventColor.MAUVE,     // Tím: Xem xét thẩm định tại chỗ, định giá, đo vẽ
  NHAC_HAN: CalendarApp.EventColor.YELLOW,     // Vàng: Nhắc hạn 7 ngày / 15 ngày ra Quyết định
  CHUNG: CalendarApp.EventColor.PALE_BLUE      // Xanh dương: Lịch cơ quan, tiếp dân, việc chung
};

function getGCalColorByTitle(title) {
  var t = (title || "").toLowerCase();
  if (t.includes("xét xử") || t.includes("tuyên án") || t.includes("phiên tòa")) return GCAL_COLORS.XET_XU;
  if (t.includes("hòa giải") || t.includes("đối thoại") || t.includes("chứng cứ")) return GCAL_COLORS.HOA_GIAI;
  if (t.includes("thẩm định") || t.includes("định giá") || t.includes("đo vẽ") || t.includes("xem xét")) return GCAL_COLORS.THAM_DINH;
  if (t.includes("nhắc") || t.includes("hạn") || t.includes("ra qđ") || t.includes("quyết định") || t.includes("gia hạn") || t.includes("ngày thứ 8") || t.includes("ngày thứ 16") || t.includes("mốc 24h")) return GCAL_COLORS.NHAC_HAN;
  return GCAL_COLORS.CHUNG;
}

// =========================================================================
// 1. TRUY VẤN LỊCH TRÌNH VÀ TỰ ĐỘNG MAP ĐƯƠNG SỰ
// =========================================================================

function logic_LayLichTrinhCongTac() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    
    if (!sheetLich || sheetLich.getLastRow() < 2) return [];

    var dataLich = sheetLich.getDataRange().getValues();
    var dataAn = sheetAn && sheetAn.getLastRow() > 1 ? sheetAn.getDataRange().getValues() : [];
    var dataDS = sheetDS && sheetDS.getLastRow() > 1 ? sheetDS.getDataRange().getValues() : [];
    
    // 1. Khởi tạo bản đồ thông tin Vụ án
    var anMap = {};
    for (var i = 1; i < dataAn.length; i++) {
      var idA = String(dataAn[i][0] || "").trim();
      if (idA) {
        anMap[idA] = {
          soTL: String(dataAn[i][1] || ""),
          loaiAn: String(dataAn[i][3] || ""),
          quanHe: String(dataAn[i][4] || ""),
          hanGQ: String(dataAn[i][5] || ""),
          trangThai: String(dataAn[i][6] || ""),
          nd: [],
          bd: []
        };
      }
    }

    // 2. Map thông tin Đương sự
    for (var k = 1; k < dataDS.length; k++) {
      var idVuAnDS = String(dataDS[k][0] || "").trim();
      var tuCach = String(dataDS[k][1] || "").trim().toLowerCase();
      var hoTen = String(dataDS[k][3] || "").trim();
      
      if (anMap[idVuAnDS] && hoTen) {
        if (tuCach.includes("nguyên đơn") || tuCach.includes("khởi kiện") || tuCach.includes("yêu cầu") || tuCach.includes("bị hại")) {
          anMap[idVuAnDS].nd.push(hoTen);
        } else if (tuCach.includes("bị đơn") || tuCach.includes("bị kiện") || tuCach.includes("bị cáo") || tuCach.includes("bị yêu cầu")) {
          anMap[idVuAnDS].bd.push(hoTen);
        }
      }
    }

    // 3. Ghép danh sách sự kiện đầy đủ
    var list = [];
    for (var j = 1; j < dataLich.length; j++) {
      var row = dataLich[j];
      var idLich = String(row[0] || "").trim();
      if (!idLich) continue;

      var idVuAn = String(row[1] || "GENERAL").trim();
      var dObj = LibDate.parse(row[2]);
      if (!dObj || isNaN(dObj.getTime())) continue;

      var infoAn = anMap[idVuAn] || { soTL: "", loaiAn: "", quanHe: "", hanGQ: "", trangThai: "", nd: [], bd: [] };
      
      var dsSummary = "";
      if (infoAn.nd.length > 0 || infoAn.bd.length > 0) {
        var ndStr = infoAn.nd.slice(0, 2).join(", ") + (infoAn.nd.length > 2 ? "..." : "");
        var bdStr = infoAn.bd.slice(0, 2).join(", ") + (infoAn.bd.length > 2 ? "..." : "");
        dsSummary = (ndStr ? ndStr : "Khuyết NĐ") + (bdStr ? " - " + bdStr : "");
      }

      list.push({
        id: idLich,
        idLich: idLich,
        idVuAn: idVuAn,
        soTL: infoAn.soTL,
        loaiAn: infoAn.loaiAn,
        quanHe: infoAn.quanHe,
        hanGQ: infoAn.hanGQ,
        trangThaiAn: infoAn.trangThai,
        duongSuText: dsSummary,
        start: Utilities.formatDate(dObj, ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "yyyy-MM-dd'T'HH:mm:ss"),
        title: String(row[3] || "Lịch công tác"),
        trangThai: String(row[4] || "Chưa thực hiện"),
        ghiChu: String(row[5] || ""),
        calendarId: String(row[6] || "")
      });
    }

    list.sort(function(a, b) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

    return list;
  } catch (e) {
    return [];
  }
}

// Alias tương thích
function api_LayLichTrinhCongTac_Logic() {
  return logic_LayLichTrinhCongTac();
}

// =========================================================================
// 2. LẬP LỊCH MỚI & ĐỒNG BỘ GOOGLE CALENDAR (CHỐNG NHÂN ĐÔI SỰ KIỆN)
// =========================================================================

function logic_LuuLichMoi(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
    if (!sheetLich) return { success: false, error: "Không tìm thấy Sheet 3_LichTrinh" };

    var dObj = LibDate.parse(data.ngay);
    if (!dObj) return { success: false, error: "Ngày lên lịch không hợp lệ" };

    var timeParts = String(data.gio || "08:00").split(":");
    dObj.setHours(parseInt(timeParts[0], 10) || 8, parseInt(timeParts[1], 10) || 0, 0, 0);

    var idVuAn = data.idVuAn || "GENERAL";
    var noiDung = data.noiDung || "Lịch làm việc";
    var trangThai = data.trangThai || "Chưa thực hiện";
    var ghiChu = data.ghiChu || "";
    var idLich = (data.idLich && data.idLich !== "") ? data.idLich : ((data.id && data.id !== "") ? data.id : "");

    var dataLich = sheetLich.getDataRange().getValues();
    var existingRowIdx = -1;
    var calId = "";

    // 1. Kiểm tra chống tạo sự kiện trùng lặp cùng Vụ án, Ngày và Giờ
    if (!idLich) {
      for (var i = 1; i < dataLich.length; i++) {
        var rowIdVA = String(dataLich[i][1] || "").trim();
        var rowDateObj = LibDate.parse(dataLich[i][2]);
        if (rowIdVA === idVuAn && rowDateObj && rowDateObj.getTime() === dObj.getTime()) {
          existingRowIdx = i + 1;
          idLich = String(dataLich[i][0] || "").trim();
          calId = String(dataLich[i][6] || "").trim();
          break;
        }
      }
    } else {
      for (var k = 1; k < dataLich.length; k++) {
        if (String(dataLich[k][0] || "").trim() === idLich) {
          existingRowIdx = k + 1;
          calId = String(dataLich[k][6] || "").trim();
          break;
        }
      }
    }

    if (!idLich) {
      idLich = "LICH_" + Utilities.getUuid().substring(0, 8);
    }

    // 2. ĐỒNG BỘ LÊN GOOGLE CALENDAR
    try {
      var cal = CalendarApp.getDefaultCalendar();
      if (cal) {
        var endTime = new Date(dObj.getTime() + (60 * 60 * 1000));
        
        if (calId) {
          try {
            var existingEv = cal.getEventById(calId);
            if (existingEv) {
              existingEv.setTime(dObj, endTime);
              existingEv.setTitle(noiDung);
              existingEv.setDescription("Vụ án: " + (data.soTL || idVuAn) + "\nNội dung: " + noiDung + "\nTrạng thái: " + trangThai);
              existingEv.setLocation(ghiChu || "Trụ sở Tòa án");
              existingEv.setColor(getGCalColorByTitle(noiDung));
            }
          } catch(eEv) { calId = ""; }
        }

        if (!calId) {
          var ev = cal.createEvent(noiDung, dObj, endTime, {
            description: "Vụ án: " + (data.soTL || idVuAn) + "\nNội dung: " + noiDung + "\nTrạng thái: " + trangThai,
            location: ghiChu || "Trụ sở Tòa án"
          });
          ev.setColor(getGCalColorByTitle(noiDung));
          calId = ev.getId();
        }
      }
    } catch (eCal) {
      console.warn("Lỗi đẩy Google Calendar:", eCal.message);
    }

    // 3. Ghi vào Sheet 3_LichTrinh
    if (existingRowIdx > 0) {
      sheetLich.getRange(existingRowIdx, 2, 1, 6).setValues([[idVuAn, dObj, noiDung, trangThai, ghiChu, calId]]);
    } else {
      sheetLich.appendRow([idLich, idVuAn, dObj, noiDung, trangThai, ghiChu, calId]);
    }
    
    SpreadsheetApp.flush();

    if (idVuAn !== "GENERAL" && typeof capNhatNgayTacDong === "function") {
      capNhatNgayTacDong(idVuAn);
    }

    return { 
      success: true, 
      idLich: idLich,
      eventObj: {
        id: idLich,
        idLich: idLich,
        idVuAn: idVuAn,
        start: Utilities.formatDate(dObj, ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "yyyy-MM-dd'T'HH:mm:ss"),
        title: noiDung,
        trangThai: trangThai,
        ghiChu: ghiChu,
        calendarId: calId
      }
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_LuuLichMoi_Logic(data) {
  return logic_LuuLichMoi(data);
}

// =========================================================================
// 3. TỰ ĐỘNG TÍNH MỐC 24H NHẮC RA QUYẾT ĐỊNH (NGÀY THỨ 8 / THỨ 16)
// =========================================================================

function logic_LuuLichNhacNho(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    if (!sheetLich) return { success: false, error: "Không tìm thấy Sheet 3_LichTrinh" };

    var idVuAn = payload.idVuAn;
    var ngayBatDau = payload.ngayBatDau || new Date();
    var daysCount = parseInt(payload.days, 10) || 7;

    // Thuật toán chuẩn tố tụng 24h trọn vẹn (Điều 147, 148 BLDS 2015)
    var targetDate = LibDate.calculateProceduralActionDate(ngayBatDau, daysCount);
    if (!targetDate) return { success: false, error: "Không thể tính toán ngày hết hạn tố tụng." };
    targetDate.setHours(8, 0, 0, 0);

    var soTL = "";
    if (idVuAn && sheetAn) {
      var finder = sheetAn.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
      if (finder) {
        soTL = sheetAn.getRange(finder.getRow(), 2).getValue();
      }
    }

    var defaultTitle = (daysCount === 15)
      ? "🔔 Hết 15 ngày có ý kiến (Ngày thứ 16) - Ra QĐ công nhận kết quả hòa giải thành (HGĐT)"
      : "🔔 Đã đủ 07 ngày hòa giải thành (Ngày thứ 8) - Ra QĐ công nhận sự thỏa thuận của đương sự";

    var fullNoiDung = (soTL ? "[" + soTL + "] " : "") + (payload.noiDung || defaultTitle);
    var idLich = "LICH_" + Utilities.getUuid().substring(0, 8);
    var calId = "";

    try {
      var cal = CalendarApp.getDefaultCalendar();
      if (cal) {
        var endTarget = new Date(targetDate.getTime() + (60 * 60 * 1000));
        var ev = cal.createEvent(fullNoiDung, targetDate, endTarget, {
          description: "Mốc nhắc việc tự động sinh sau khi lập Biên bản hòa giải/đối thoại thành.\nVụ án: " + soTL,
          location: "Trụ sở Tòa án"
        });
        ev.setColor(GCAL_COLORS.NHAC_HAN);
        calId = ev.getId();
      }
    } catch (eCal) {}

    sheetLich.appendRow([
      idLich,
      idVuAn || "GENERAL",
      targetDate,
      fullNoiDung,
      "Chưa thực hiện",
      "Tự động sinh từ Biên bản hòa giải/đối thoại",
      calId
    ]);
    SpreadsheetApp.flush();

    if (idVuAn && idVuAn !== "GENERAL" && typeof capNhatNgayTacDong === "function") {
      capNhatNgayTacDong(idVuAn);
    }

    return { success: true, idLich: idLich, targetDateVN: LibDate.fmt(targetDate, 'VN') };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_LuuLichNhacNho_Logic(payload) {
  return logic_LuuLichNhacNho(payload);
}

// =========================================================================
// 4. SỬA, DỜI NGÀY & XÓA LỊCH CÔNG TÁC (ĐỒNG BỘ LÊN GOOGLE CALENDAR)
// =========================================================================

function logic_CapNhatLich(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
    if (!sheetLich) return { success: false, error: "Không tìm thấy Sheet 3_LichTrinh" };

    var idLich = data.idLich || data.id;
    if (!idLich) return { success: false, error: "Thiếu mã lịch cần cập nhật." };

    var finder = sheetLich.getRange("A:A").createTextFinder(idLich).matchEntireCell(true).findNext();
    if (!finder) return { success: false, error: "Không tìm thấy mốc lịch trên bảng tính." };

    var r = finder.getRow();
    var dObj = LibDate.parse(data.ngay);
    if (!dObj) return { success: false, error: "Ngày không hợp lệ." };

    var timeParts = String(data.gio || "08:00").split(":");
    dObj.setHours(parseInt(timeParts[0], 10) || 8, parseInt(timeParts[1], 10) || 0, 0, 0);

    var idVuAn = data.idVuAn || "GENERAL";
    var noiDung = data.noiDung || "Lịch làm việc";
    var ghiChu = data.ghiChu || "";

    sheetLich.getRange(r, 2, 1, 5).setValues([[idVuAn, dObj, noiDung, "Chưa thực hiện", ghiChu]]);

    // Cập nhật sự kiện trên Google Calendar
    var calId = sheetLich.getRange(r, 7).getValue();
    if (calId) {
      try {
        var ev = CalendarApp.getDefaultCalendar().getEventById(calId);
        if (ev) {
          var endD = new Date(dObj.getTime() + (60 * 60 * 1000));
          ev.setTime(dObj, endD);
          ev.setTitle(noiDung);
          ev.setDescription("Vụ án: " + idVuAn + "\nGhi chú: " + ghiChu);
          ev.setLocation(ghiChu || "Trụ sở Tòa án");
          ev.setColor(getGCalColorByTitle(noiDung));
        }
      } catch (eCal) {}
    }

    SpreadsheetApp.flush();

    if (idVuAn !== "GENERAL" && typeof capNhatNgayTacDong === "function") {
      capNhatNgayTacDong(idVuAn);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_CapNhatLich_Logic(data) {
  return logic_CapNhatLich(data);
}

function logic_CapNhatTrangThaiLich(idLich, newStatus) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
    if (!sheetLich) return { success: false, error: "Không tìm thấy Sheet 3_LichTrinh" };

    var finder = sheetLich.getRange("A:A").createTextFinder(idLich).matchEntireCell(true).findNext();
    if (finder) {
      var r = finder.getRow();
      sheetLich.getRange(r, 5).setValue(newStatus);
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy lịch." };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_CapNhatTrangThaiLich_Logic(idLich, newStatus) {
  return logic_CapNhatTrangThaiLich(idLich, newStatus);
}

function logic_CapNhatNgayLich(idLich, newDateISO) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheetLich = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("3_LichTrinh");
    var finder = sheetLich.getRange("A:A").createTextFinder(idLich).matchEntireCell(true).findNext();
    
    if (finder) {
      var r = finder.getRow();
      var currentD = sheetLich.getRange(r, 3).getValue();
      var oldHours = (currentD instanceof Date) ? currentD.getHours() : 8;
      var oldMinutes = (currentD instanceof Date) ? currentD.getMinutes() : 0;

      var newD = LibDate.parse(newDateISO);
      if (newD) {
        newD.setHours(oldHours, oldMinutes, 0, 0);
        sheetLich.getRange(r, 3).setValue(newD);

        var calId = sheetLich.getRange(r, 7).getValue();
        if (calId) {
          try {
            var ev = CalendarApp.getDefaultCalendar().getEventById(calId);
            if (ev) {
              var endD = new Date(newD.getTime() + (60 * 60 * 1000));
              ev.setTime(newD, endD);
            }
          } catch (eCal) {}
        }

        SpreadsheetApp.flush();
        return { success: true };
      }
    }
    return { success: false, error: "Không tìm thấy ID lịch." };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_CapNhatNgayLich_Logic(idLich, newDateISO) {
  return logic_CapNhatNgayLich(idLich, newDateISO);
}

function logic_XoaLich(idLich) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheetLich = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("3_LichTrinh");
    var finder = sheetLich.getRange("A:A").createTextFinder(idLich).matchEntireCell(true).findNext();
    
    if (finder) {
      var r = finder.getRow();
      var calId = sheetLich.getRange(r, 7).getValue();
      if (calId) {
        try {
          var ev = CalendarApp.getDefaultCalendar().getEventById(calId);
          if (ev) ev.deleteEvent();
        } catch (eCal) {}
      }
      sheetLich.deleteRow(r);
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy lịch cần xóa." };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_XoaLich_Logic(idLich) {
  return logic_XoaLich(idLich);
}

function logic_DongBoLichCaNhan() {
  try {
    var sheetLich = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("3_LichTrinh");
    if (!sheetLich || sheetLich.getLastRow() < 2) return { success: true, synced: 0 };

    var cal = CalendarApp.getDefaultCalendar();
    var data = sheetLich.getDataRange().getValues();
    var count = 0;

    for (var i = 1; i < data.length; i++) {
      var idLich = data[i][0];
      var calId = data[i][6];
      var dObj = LibDate.parse(data[i][2]);
      var title = data[i][3] ? String(data[i][3]) : "Lịch công tác Tòa án";
      var status = data[i][4] ? String(data[i][4]) : "";
      var ghiChu = data[i][5] ? String(data[i][5]) : "";

      if (idLich && !calId && dObj && !isNaN(dObj.getTime())) {
        var endTime = new Date(dObj.getTime() + (60 * 60 * 1000));
        var event = cal.createEvent(title, dObj, endTime, {
          description: "Nội dung: " + title + "\nTrạng thái: " + status,
          location: ghiChu || "Trụ sở Tòa án"
        });
        event.setColor(getGCalColorByTitle(title));
        sheetLich.getRange(i + 1, 7).setValue(event.getId());
        count++;
      }
    }
    SpreadsheetApp.flush();
    return { success: true, synced: count };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Alias
function api_DongBoLichCaNhan_Logic() {
  return logic_DongBoLichCaNhan();
}

// =========================================================================
// 5. TRÍCH XUẤT DÒNG THỜI GIAN TỐ TỤNG 3 LỚP (TIMELINE ENGINE)
// =========================================================================

function logic_LayTimelineVuAn(idVuAn) {
  try {
    if (!idVuAn) return { success: false, error: "Chưa chọn vụ án." };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetLich = ss.getSheetByName("3_LichTrinh");

    var timelineEvents = [];
    var caseInfoRow = null;

    // Lớp 1: Mốc thụ lý gốc
    if (sheetAn) {
      var finderAn = sheetAn.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
      if (finderAn) {
        var r = finderAn.getRow();
        caseInfoRow = sheetAn.getRange(r, 1, 1, 14).getValues()[0];

        var dTL = LibDate.parse(caseInfoRow[2]);
        if (dTL && !isNaN(dTL.getTime())) {
          timelineEvents.push({
            idLich: "ROOT_THU_LY",
            isRoot: true,
            isResult: false,
            ngayISO: Utilities.formatDate(dTL, ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "yyyy-MM-dd"),
            gio: "08:00",
            ngayVN: LibDate.fmt(dTL, 'VN'),
            noiDung: "Thụ lý sơ thẩm vụ việc",
            trangThai: "Hoàn thành",
            rawTime: dTL.getTime(),
            suggestedKeywords: ["03. thông báo thụ lý vụ án", "41. thông báo thụ lý", "53. thông báo thụ lý"]
          });
        }
      }
    }

    // Lớp 2: Các mốc làm việc trung gian
    if (sheetLich && sheetLich.getLastRow() > 1) {
      var dataLich = sheetLich.getDataRange().getValues();
      var nowTs = new Date().getTime();

      for (var i = 1; i < dataLich.length; i++) {
        if (String(dataLich[i][1]).trim() === idVuAn.toString().trim()) {
          var idL = String(dataLich[i][0]).trim();
          var dObj = LibDate.parse(dataLich[i][2]);
          if (!dObj || isNaN(dObj.getTime())) continue;

          var nd = String(dataLich[i][3] || "").trim();
          var tt = String(dataLich[i][4] || "Chưa thực hiện").trim();

          var kwList = ["04. giấy triệu tập"];
          var ndLow = nd.toLowerCase();
          if (ndLow.includes("hòa giải") || ndLow.includes("chứng cứ")) kwList.push("18. thông báo mở phiên họp", "19. biên bản kiểm tra", "21. biên bản hòa giải");
          else if (ndLow.includes("đối thoại")) kwList.push("54. thông báo mở phiên họp", "55. biên bản đối thoại");
          else if (ndLow.includes("thẩm định") || ndLow.includes("định giá")) kwList.push("13. quyết định xem xét", "14. quyết định định giá");
          else if (ndLow.includes("xét xử")) kwList.push("31. quyết định đưa vụ án ra xét xử");

          timelineEvents.push({
            idLich: idL,
            isRoot: false,
            isResult: false,
            ngayISO: Utilities.formatDate(dObj, ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "yyyy-MM-dd"),
            gio: Utilities.formatDate(dObj, ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "HH:mm"),
            ngayVN: LibDate.fmt(dObj, 'VN'),
            noiDung: nd,
            trangThai: tt,
            rawTime: dObj.getTime(),
            isPast: (dObj.getTime() < nowTs),
            suggestedKeywords: kwList
          });
        }
      }
    }

    // Lớp 3: Mốc kết quả giải quyết / Tạm đình chỉ
    if (caseInfoRow) {
      var trangThaiAn = String(caseInfoRow[6] || "").trim();
      var ketQuaRaw = String(caseInfoRow[12] || "").trim();

      if (ketQuaRaw && ketQuaRaw !== "---" && ketQuaRaw !== "") {
        var lines = ketQuaRaw.split('\n');
        var loaiKq = lines[0] || "Đã giải quyết";
        var soKq = lines[1] && lines[1] !== "---" ? lines[1] : "";
        var ngayKqStr = lines[2] || "";
        
        var dKq = LibDate.parse(ngayKqStr);
        if (!dKq || isNaN(dKq.getTime())) {
          var dTacDong = caseInfoRow[11];
          dKq = (dTacDong instanceof Date) ? dTacDong : new Date();
        }

        var isTDC = (trangThaiAn === "Tạm đình chỉ" || loaiKq.includes("Tạm đình chỉ"));
        var tieuDeKq = isTDC ? "Tạm đình chỉ giải quyết" : "Hoàn thành giải quyết vụ việc";
        var noiDungHienThi = loaiKq + (soKq ? " - Số: " + soKq : "") + (ngayKqStr ? " (" + ngayKqStr + ")" : "");

        timelineEvents.push({
          idLich: "RESULT_FINISHED",
          isRoot: false,
          isResult: true,
          isTDC: isTDC,
          ngayISO: Utilities.formatDate(dKq, ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "yyyy-MM-dd"),
          gio: "08:00",
          ngayVN: LibDate.fmt(dKq, 'VN'),
          noiDung: "⚖️ " + tieuDeKq + ": " + noiDungHienThi,
          trangThai: isTDC ? "Tạm đình chỉ" : "Đã giải quyết",
          rawTime: dKq.getTime() + 1000,
          isPast: true,
          suggestedKeywords: []
        });
      }
    }

    timelineEvents.sort(function(a, b) { return a.rawTime - b.rawTime; });

    return { success: true, events: timelineEvents };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Alias
function api_LayTimelineVuAn_Logic(idVuAn) {
  return logic_LayTimelineVuAn(idVuAn);
}