/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.5.3 - GROQ AI EDITION
 * FILE 5: XỬ LÝ LỊCH TRÌNH VÀ GOOGLE CALENDAR
 * ------------------------------------------------------------
 * BẢN CẬP NHẬT THEO YÊU CẦU:
 * - Hỗ trợ API tạo lịch nhắc nhở tự động, có cơ chế dời ngày nghỉ cuối tuần (T7, CN).
 */

// ============================================================
// HÀM HỖ TRỢ XỬ LÝ CHUỖI TÊN & TIÊU ĐỀ
// ============================================================

function extractShortName(fullName) {
  if (!fullName) return "";
  var name = fullName.toString().split(",")[0].trim();
  var nameLow = name.toLowerCase();
 
  if (nameLow.includes("công ty") || nameLow.includes("ngân hàng") || nameLow.includes("ubnd") || nameLow.includes("tnhh")) {
     return name.split(" ").slice(0, 4).join(" ") + "...";
  }
 
  var words = name.split(" ");
  var lastName = words.pop().toLowerCase();
  return lastName.charAt(0).toUpperCase() + lastName.slice(1);
}

function buildEventTitle(anInfo, noiDungStr) {
    if (!noiDungStr) noiDungStr = "Làm việc";
    var firstLine = noiDungStr.split("\n")[0].trim();
   
    if (anInfo && anInfo.id !== "GENERAL") {
        var actionWords = firstLine.split(" ");
        var action = actionWords.length > 1 ? actionWords[0] + " " + actionWords[1] : actionWords[0];
        if (action.length < 3) action = "Làm việc";
       
        var nDonShort = extractShortName(anInfo.nguyenDon);
        var bDonShort = extractShortName(anInfo.biDon);
        var quanHe = anInfo.quanHe || "Tranh chấp";
       
        return action + " vụ " + nDonShort + " - " + bDonShort + " - " + quanHe;
    }
   
    return firstLine;
}

// ============================================================
// 1. API LẤY LỊCH TRÌNH (SUPER FAST)
// ============================================================
function api_LayLichTrinhCongTac_Logic() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
    if (!sheetLich) return { allEvents: [] };
   
    var valuesLich = sheetLich.getDataRange().getValues();
    var allEvents = [];
    var todayTime = new Date().setHours(0,0,0,0);
    var limitPast = todayTime - (60 * 86400000);
    var limitFuture = todayTime + (180 * 86400000);
   
    for (var j = 1; j < valuesLich.length; j++) {
      var row = valuesLich[j];
      if (!row || !row[2]) continue;
     
      var d = LibDate.parse(row[2]);
      if (!d || isNaN(d.getTime())) continue;

      var ts = d.getTime();
      if (ts < limitPast || ts > limitFuture) continue;

      var idVuAn = row[1] ? row[1].toString().trim() : "GENERAL";
      var noiDungStr = row[3] ? row[3].toString() : "Làm việc";

      var eventSource = "APP";
      if (idVuAn === "GENERAL" && !noiDungStr.includes("⚖️")) eventSource = "SYSTEM";
      else if (noiDungStr.toLowerCase().includes("xét xử")) eventSource = "DRAFTING_RED";
      else if (noiDungStr.toLowerCase().includes("hòa giải") || noiDungStr.toLowerCase().includes("đối thoại")) eventSource = "DRAFTING_ORANGE";
      else if (noiDungStr.includes("Nhắc nhở")) eventSource = "AUTO_REMINDER";

      allEvents.push({
        idLich: row[0].toString(),
        idVuAn: idVuAn,
        ngayGioTS: ts,
        noiDung: noiDungStr,
        source: eventSource,
        eventId: row[6] ? row[6].toString() : ""
      });
    }
   
    allEvents.sort((a, b) => a.ngayGioTS - b.ngayGioTS);
    return { allEvents: allEvents };
   
  } catch (e) {
    return { error: "Lỗi đọc lịch: " + e.toString() };
  }
}

// ============================================================
// 2. API ĐỒNG BỘ GOOGLE CALENDAR
// ============================================================
function api_DongBoLichCaNhan_Logic() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
    if (!sheetLich) throw new Error("Không tìm thấy sheet 3_LichTrinh.");

    var dataLich = sheetLich.getDataRange().getValues();
    var mainCal = CalendarApp.getDefaultCalendar();
    var pushCount = 0, pullCount = 0;

    var danhSachAn = layDanhSachAn(); 
    var anMapBySoTL = {};
    danhSachAn.forEach(an => { anMapBySoTL[an.soTL] = an.id; });

    // A. PUSH
    for (var i = 1; i < dataLich.length; i++) {
      var rawNgayGio = dataLich[i][2];
      var calendarId = dataLich[i][6];
     
      if (rawNgayGio && !calendarId) {
        var ngayGio = new Date(rawNgayGio);
        if (!isNaN(ngayGio.getTime())) {
          var idVuAn = dataLich[i][1];
          var noiDungStr = dataLich[i][3] ? dataLich[i][3].toString() : "Việc chung";
          var titleGCal = noiDungStr.split("\n")[0];
         
          if (idVuAn && idVuAn !== "GENERAL") {
              var anInfo = danhSachAn.find(x => x.id === idVuAn);
              titleGCal = buildEventTitle(anInfo, noiDungStr);
          }

          try {
            var event = mainCal.createEvent(titleGCal, ngayGio, new Date(ngayGio.getTime() + 3600000), { description: noiDungStr });
            sheetLich.getRange(i + 1, 7).setValue(event.getId());
            pushCount++;
          } catch (e) {}
        }
      }
    }

    // B. PULL
    var now = new Date();
    var startTime = new Date(); startTime.setMonth(now.getMonth() - 1);
    var endTime = new Date(); endTime.setMonth(now.getMonth() + 3);

    var targetCalendars = [mainCal];
    try {
        var holCal = CalendarApp.getCalendarById('vi.vietnamese#holiday@group.v.calendar.google.com');
        if(holCal) targetCalendars.push(holCal);
    } catch(e) {}

    var existingEventIds = new Set(dataLich.map(r => r[6]));
    var rowsToAppend = [];

    targetCalendars.forEach(function(cal) {
      if (!cal) return;
      try {
        var events = cal.getEvents(startTime, endTime);
        events.forEach(function(evt) {
          var evtId = evt.getId();
          if (!existingEventIds.has(evtId)) {
            var title = evt.getTitle();
            var content = title + "\n" + (evt.getDescription() || "");
            var idVA = "GENERAL";

            for (var so in anMapBySoTL) {
                if(title.includes(so)) { idVA = anMapBySoTL[so]; break; }
            }

            rowsToAppend.push([generateId("LICH"), idVA, evt.getStartTime(), content, "Đã đồng bộ", "", evtId]);
            pullCount++;
            existingEventIds.add(evtId);
          }
        });
      } catch (e) {}
    });

    if (rowsToAppend.length > 0) {
        var lastRow = sheetLich.getLastRow();
        sheetLich.getRange(lastRow + 1, 1, rowsToAppend.length, 7).setValues(rowsToAppend);
        sheetLich.getRange(lastRow + 1, 3, rowsToAppend.length, 1).setNumberFormat(APP_CONFIG.FORMAT_DATETIME);
    }

    return { success: true, count: (pushCount + pullCount), details: `Đã đồng bộ thành công.` };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ============================================================
// 3. API CRUD LỊCH CÔNG TÁC (THÊM, SỬA, XÓA)
// ============================================================

/**
 * ĐÃ SỬA: Hàm được Frontend gọi khi soạn thảo các loại Biên bản hòa giải (Req 6.5)
 */
function api_LuuLichNhacNho(data) {
  try {
     var d = LibDate.parse(data.ngayBatDau) || new Date();
     d.setDate(d.getDate() + data.days); // Cộng thêm số ngày (7 hoặc 15)
     
     // Tránh ngày nghỉ cuối tuần
     if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Nếu Thứ Bảy -> Thứ Hai
     else if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Nếu Chủ Nhật -> Thứ Hai
     
     var dStr = Utilities.formatDate(d, APP_CONFIG.TIMEZONE, "yyyy-MM-dd");
     return api_LuuLichMoi_Logic({
         idVuAn: data.idVuAn,
         ngay: dStr,
         gio: "08:00",
         noiDung: data.noiDung
     });
  } catch(e) {
     return { success: false, error: e.message };
  }
}

function api_LuuLichMoi_Logic(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetLich = ss.getSheetByName("3_LichTrinh");
   
    var ngayGio = LibDate.parse(data.ngay);
    var timeParts = data.gio.split(":");
    ngayGio.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
   
    var titleGCal = data.noiDung.split("\n")[0] || "Làm việc";
    var eventId = "";
   
    try {
      if (data.idVuAn && data.idVuAn !== "GENERAL") {
         var danhSachAn = layDanhSachAn(); 
         var an = danhSachAn.find(x => x.id === data.idVuAn);
         titleGCal = buildEventTitle(an, data.noiDung);
      }
      var event = CalendarApp.getDefaultCalendar().createEvent(titleGCal, ngayGio, new Date(ngayGio.getTime() + 3600000), { description: data.noiDung });
      eventId = event.getId();
    } catch (e) {}
   
    sheetLich.appendRow([generateId("LICH"), data.idVuAn || "GENERAL", ngayGio, data.noiDung, "Chưa thực hiện", "", eventId]);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_CapNhatLich_Logic(eventData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("3_LichTrinh");
    var data = sheet.getDataRange().getValues();
   
    var ngayGio = LibDate.parse(eventData.ngay);
    var timeParts = eventData.gio.split(":");
    ngayGio.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
   
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === eventData.idLich) {
        sheet.getRange(i + 1, 2, 1, 3).setValues([[eventData.idVuAn, ngayGio, eventData.noiDung]]);
        return { success: true };
      }
    }
    return { success: false, error: "Không tìm thấy ID lịch." };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function api_CapNhatNgayLich_Logic(idLich, newDateISO) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("3_LichTrinh");
    var data = sheet.getDataRange().getValues();
   
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idLich) {
        sheet.getRange(i + 1, 3).setValue(new Date(newDateISO));
        return { success: true };
      }
    }
    return { success: false, error: "Không tìm thấy ID lịch." };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function api_XoaLich_Logic(idLich) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("3_LichTrinh");
    var data = sheet.getDataRange().getValues();
   
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idLich) {
        if (data[i][6]) {
            try { CalendarApp.getDefaultCalendar().getEventById(data[i][6]).deleteEvent(); } catch(e){}
        }
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, error: "Không tìm thấy ID lịch." };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function api_LayChiTietLich_Logic(idLich) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("3_LichTrinh");
    var data = sheet.getDataRange().getValues();
   
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idLich) {
        var ngayGio = new Date(data[i][2]);
        return {
          success: true,
          idLich: data[i][0],
          idVuAn: data[i][1],
          ngay: Utilities.formatDate(ngayGio, APP_CONFIG.TIMEZONE, "yyyy-MM-dd"),
          gio: Utilities.formatDate(ngayGio, APP_CONFIG.TIMEZONE, "HH:mm"),
          noiDung: data[i][3]
        };
      }
    }
    return { success: false, error: "Không tìm thấy ID lịch." };
  } catch(e) { return { success: false, error: e.toString() }; }
}