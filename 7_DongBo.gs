/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER AUTO-SYNC & INTEGRITY CORE
 * TỆP: 7_DongBo.gs - ĐỒNG BỘ TOÀN DIỆN, QUÉT HẠN TỐ TỤNG & TRIGGER TỰ ĐỘNG
 * -------------------------------------------------------------------------
 * - ĐÃ CHUYỂN ĐỔI 100% SANG CƠ CHẾ GHI MẢNG HÀNG LOẠT (BATCH WRITE SETVALUES)
 * - TÁC VỤ TỰ ĐỘNG 1H15 SÁNG: QUÉT HẠN TOÀN BỘ ÁN & ĐỒNG BỘ ĐƠN TỪ FILE EXCEL
 * - KIỂM SOÁT VÀ DỌN DẸP DỮ LIỆU ĐƯƠNG SỰ MỒ CÔI, BẢO TOÀN TÍNH TOÀN VẸN CSDL
 * =========================================================================
 */

// =========================================================================
// 1. TÁC VỤ ĐỒNG BỘ NỀN TỰ ĐỘNG (TRIGGER 1H15 SÁNG HÀNG NGÀY)
// =========================================================================

function autoDailySync() {
  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  
  // Chỉ chạy nếu Thẩm phán bật tính năng tự động trong Cài đặt
  if (config["AUTO_SYNC"] === true || config["AUTO_SYNC"] === "TRUE" || config["AUTO_SYNC"] === "true") {
    
    // Tác vụ 1: Đồng bộ số liệu thống kê & Quét kiểm tra hạn toàn bộ án
    try {
      logic_ThucHienDongBo();
    } catch(e) {
      console.error("Lỗi đồng bộ số liệu thống kê nền: " + e.toString());
    }

    // Tác vụ 2: Tự động quét và kéo đơn mới từ File Excel Sổ đơn gốc của Văn thư
    try {
      if (typeof logic_DongBoDonTuExcel === 'function') {
        logic_DongBoDonTuExcel();
      } else if (typeof api_DongBoDonTuExcel === 'function') {
        api_DongBoDonTuExcel();
      }
    } catch(eDon) {
      console.error("Lỗi tự động quét Sổ đơn Excel: " + eDon.toString());
    }
  }
}

// =========================================================================
// 2. ĐỒNG BỘ TOÀN DIỆN & GHI MẢNG HÀNG LOẠT (BATCH WRITE)
// =========================================================================

function logic_ThucHienDongBo() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    
    if (!sheetAn || sheetAn.getLastRow() < 2) {
      invalidateCache();
      return { success: true, message: "Hệ thống chưa có dữ liệu án để đồng bộ." };
    }

    var dataAn = sheetAn.getDataRange().getValues();
    var updatedDeadlines = 0;
    var deadlineColValues = []; // Mảng 2D gom dữ liệu hạn giải quyết

    // 1. Tính toán chuẩn hóa toàn bộ thời hạn trên RAM
    for (var i = 1; i < dataAn.length; i++) {
      var row = dataAn[i];
      var idVuAn = row[0] ? String(row[0]).trim() : "";
      var ngayTLRaw = LibDate.parse(row[2]);
      var loaiAn = String(row[3] || "2. Dân sự");
      var quanHe = String(row[4] || "");
      var currentHanGQ = row[5];
      var trangThai = String(row[6] || "Đang giải quyết");
      var ketQua = String(row[12] || "");

      var finalHan = currentHanGQ;

      // Kiểm tra và tính hạn đối với các vụ án đang giải quyết
      if (idVuAn && ngayTLRaw && trangThai === "Đang giải quyết") {
        var isExtended = ketQua.includes("Gia hạn");
        var correctHan = DeadlineEngine.calculate(ngayTLRaw, loaiAn, isExtended, quanHe);
        var currentHanDate = LibDate.parse(currentHanGQ);

        if (correctHan instanceof Date && (!currentHanDate || correctHan.getTime() !== currentHanDate.getTime())) {
          finalHan = correctHan;
          updatedDeadlines++;
        }
      }

      deadlineColValues.push([finalHan]);
    }

    // 2. Ghi 1 lần duy nhất toàn bộ cột Hạn giải quyết (Cột F / Cột số 6)
    if (deadlineColValues.length > 0 && updatedDeadlines > 0) {
      sheetAn.getRange(2, 6, deadlineColValues.length, 1).setValues(deadlineColValues);
    }

    // 3. Làm mới Cache và ghi nhật ký hệ thống
    invalidateCache();
    ghiNhatKy("SYSTEM", "Đồng bộ toàn diện", `Đã quét ${dataAn.length - 1} vụ án. Chuẩn hóa ${updatedDeadlines} mốc thời hạn.`);

    return { 
      success: true, 
      message: `Đã đồng bộ thành công toàn bộ ${dataAn.length - 1} vụ án! Cập nhật chuẩn hóa ${updatedDeadlines} mốc thời hạn.` 
    };

  } catch (e) {
    return { success: false, error: "Lỗi đồng bộ toàn diện: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_ThucHienDongBo() {
  return logic_ThucHienDongBo();
}

// =========================================================================
// 3. KIỂM TRA TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU (DATA INTEGRITY CHECK)
// =========================================================================

function logic_KiemTraToanVenDuLieu() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    
    if (!sheetAn || !sheetDS) return { success: false, error: "Thiếu bảng tính CSDL." };

    var dataAn = sheetAn.getDataRange().getValues();
    var dataDS = sheetDS.getDataRange().getValues();

    var anIdSet = new Set();
    for (var i = 1; i < dataAn.length; i++) {
      if (dataAn[i][0]) anIdSet.add(String(dataAn[i][0]).trim());
    }

    var dsCountMap = {};
    var orphanDsCount = 0;

    for (var j = 1; j < dataDS.length; j++) {
      var dsId = dataDS[j][0] ? String(dataDS[j][0]).trim() : "";
      if (dsId) {
        if (anIdSet.has(dsId)) {
          dsCountMap[dsId] = (dsCountMap[dsId] || 0) + 1;
        } else {
          orphanDsCount++;
        }
      }
    }

    var casesWithoutParties = 0;
    anIdSet.forEach(function(id) {
      if (!dsCountMap[id]) casesWithoutParties++;
    });

    var report = {
      totalCases: anIdSet.size,
      totalParties: Math.max(0, dataDS.length - 1),
      casesWithoutParties: casesWithoutParties,
      orphanParties: orphanDsCount
    };

    return { success: true, report: report };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Alias
function api_KiemTraToanVenDuLieu() {
  return logic_KiemTraToanVenDuLieu();
}

// =========================================================================
// 4. DỌN DẸP ĐƯƠNG SỰ MỒ CÔI (ORPHAN PARTIES CLEANUP)
// =========================================================================

function logic_DonDepDuongSuMoCoi() {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");

    var dataAn = sheetAn.getDataRange().getValues();
    var dataDS = sheetDS.getDataRange().getValues();

    var anIdSet = new Set();
    for (var i = 1; i < dataAn.length; i++) {
      if (dataAn[i][0]) anIdSet.add(String(dataAn[i][0]).trim());
    }

    var newDS = [dataDS[0]];
    var removedCount = 0;

    for (var j = 1; j < dataDS.length; j++) {
      var dsId = dataDS[j][0] ? String(dataDS[j][0]).trim() : "";
      if (dsId && anIdSet.has(dsId)) {
        newDS.push(dataDS[j]);
      } else {
        removedCount++;
      }
    }

    // Ghi lại bảng đương sự sạch bằng mảng 2D
    if (removedCount > 0) {
      sheetDS.clearContents();
      sheetDS.getRange(1, 1, newDS.length, newDS[0].length).setValues(newDS);
    }

    return { success: true, removedCount: removedCount };

  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function api_DonDepDuongSuMoCoi() {
  return logic_DonDepDuongSuMoCoi();
}