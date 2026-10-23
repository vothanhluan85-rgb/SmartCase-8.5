/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER BACKEND CORE
 * TỆP: 3_XuLyAn.gs - TRUNG TÂM XỬ LÝ NGHIỆP VỤ SỔ THỤ LÝ & TRẠM DỮ LIỆU DRIVE
 * -------------------------------------------------------------------------
 * - ĐÃ NÂNG CẤP THEO ĐẶC TẢ SPEC-V8.0-FIX-PROD:
 *   + Ghi dữ liệu không giới hạn dung lượng vào _case_memory.json trên Google Drive.
 *   + Khắc phục triệt để giới hạn ký tự trên Google Sheets.
 *   + Động cơ thời hạn tố tụng (Deadline Engine) chuẩn xác theo BLTTDS 2015.
 *   + Tự động sao chép tài liệu chứng cứ từ Sổ đơn sang Vụ án khi thụ lý.
 *   + Lưu trữ thông tin biên lai án phí NQ 326 ngay từ khâu thụ lý ban đầu.
 * =========================================================================
 */

var CASE_MEMORY_FILE_NAME = "_case_memory.json";

function cleanHonorificFromName(name) {
  if (!name) return "";
  return String(name).replace(/^(Ông|Bà|Anh|Chị|ông|bà|anh|chị)\s+/i, '').trim();
}

// =========================================================================
// 1. ĐỘNG CƠ TÍNH THỜI HẠN TỐ TỤNG CHUẨN TANDTC (DEADLINE ENGINE)
// =========================================================================

var DeadlineEngine = {
  calculate: function(startDate, loaiAn, isExtension, quanHe, daysUsedBefore) {
    var dObj = LibDate.parse(startDate);
    if (!dObj) return "";
    var d = new Date(dObj);
    var acronym = getLoaiAnRutGon(loaiAn, quanHe);

    var monthsToAdd = 4;
    var extMonths = 2;

    // 1. Việc HNGĐ (Thuận tình ly hôn) hoặc Việc Dân sự: 01 tháng (Điều 366 BLTTDS)
    if (acronym === "VHN" || acronym === "VDS" || String(loaiAn || "").includes("Việc") || String(quanHe || "").toLowerCase().includes("thuận tình")) {
      monthsToAdd = 1;
      extMonths = 1;
    } 
    // 2. Án Kinh doanh thương mại & Lao động: 02 tháng (Gia hạn +01 tháng)
    else if (acronym === "KDTM" || acronym === "LĐ") {
      monthsToAdd = 2;
      extMonths = 1;
    } 
    // 3. Án Hành chính: 04 tháng (Gia hạn +02 tháng)
    else if (acronym === "HC") {
      monthsToAdd = 4;
      extMonths = 2;
    } 
    // 4. Án Hình sự sơ thẩm: 01 tháng (Gia hạn +01 tháng)
    else if (acronym === "HS") {
      monthsToAdd = 1;
      extMonths = 1;
    } 
    // 5. Hòa giải đối thoại tại Tòa án: 20 ngày (Gia hạn +30 ngày)
    else if (acronym === "HGĐT" || String(loaiAn || "").includes("Hòa giải")) {
      var dHG = new Date(d);
      dHG.setDate(dHG.getDate() + (isExtension ? 30 : 20));
      return dHG;
    } 
    // 6. Án Tranh chấp Dân sự, Hôn nhân gia đình: 04 tháng (Gia hạn +02 tháng)
    else {
      monthsToAdd = 4;
      extMonths = 2;
    }

    if (isExtension) {
      monthsToAdd += extMonths;
    }

    d.setMonth(d.getMonth() + monthsToAdd);

    // Trừ số ngày đã chạy trước khi tạm đình chỉ (nếu có)
    if (daysUsedBefore && daysUsedBefore > 0) {
      d.setDate(d.getDate() - daysUsedBefore);
    }

    return d;
  },

  getDaysBetween: function(startDateVal, endDateVal) {
    var d1 = LibDate.parse(startDateVal);
    var d2 = LibDate.parse(endDateVal);
    if (!d1 || !d2) return 0;
    var timeDiff = d2.getTime() - d1.getTime();
    return Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
  }
};

function normalizeLegalText(text) {
  if (!text) return "";
  var t = text.toString().trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// =========================================================================
// 2. ĐỘNG CƠ TRẠM DỮ LIỆU DRIVE (READ / WRITE _case_memory.json)
// =========================================================================

function readCaseMemoryFromDrive(folderUrl) {
  if (!folderUrl || !folderUrl.includes("http")) return {};
  try {
    var folderId = extractFolderId(folderUrl);
    if (!folderId) return {};
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByName(CASE_MEMORY_FILE_NAME);
    
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString("UTF-8");
      if (content) {
        var parsed = JSON.parse(content);
        return parsed || {};
      }
    }
  } catch (e) {
    console.warn("Không thể đọc _case_memory.json từ Drive: " + e.message);
  }
  return {};
}

function saveCaseMemoryToDrive(folderUrl, memoryData) {
  if (!folderUrl || !folderUrl.includes("http")) return false;
  try {
    var folderId = extractFolderId(folderUrl);
    if (!folderId) return false;
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByName(CASE_MEMORY_FILE_NAME);
    
    var jsonString = JSON.stringify(memoryData || {}, null, 2);
    
    if (files.hasNext()) {
      var file = files.next();
      file.setContent(jsonString);
    } else {
      folder.createFile(CASE_MEMORY_FILE_NAME, jsonString, MimeType.PLAIN_TEXT);
    }
    return true;
  } catch (e) {
    console.error("Lỗi ghi _case_memory.json vào Drive: " + e.message);
    return false;
  }
}

// Sao chép tài liệu từ thư mục Đơn sang thư mục Án khi Thụ lý
function copyFilesFromDonToAn(idDon, targetFolder) {
  if (!idDon || !targetFolder) return;
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var rootDonId = extractFolderId(config["ID_THUMUC_DON"]);
    if (!rootDonId) return;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    if (!sheetDon) return;

    var finder = sheetDon.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findNext();
    if (!finder) return;

    var soDon = sheetDon.getRange(finder.getRow(), 2).getValue();
    var cleanNo = soDon ? String(soDon).split('/')[0].trim() : "";
    if (!cleanNo) return;

    var rootDonFolder = DriveApp.getFolderById(rootDonId);
    var yearFolderIt = rootDonFolder.getFoldersByName("Năm " + new Date().getFullYear());
    if (!yearFolderIt.hasNext()) return;

    var yearFolder = yearFolderIt.next();
    var subFolders = yearFolder.getFolders();
    var donFolder = null;
    while (subFolders.hasNext()) {
      var f = subFolders.next();
      if (f.getName().startsWith(cleanNo + " -") || f.getName() === cleanNo) {
        donFolder = f;
        break;
      }
    }

    if (donFolder) {
      var files = donFolder.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        file.makeCopy(file.getName(), targetFolder);
      }
    }
  } catch (e) {
    console.warn("Lỗi sao chép tệp từ Đơn sang Án: " + e.message);
  }
}

// =========================================================================
// 3. TRUY VẤN DỮ LIỆU SỔ THỤ LÝ & CHI TIẾT VỤ ÁN
// =========================================================================

function logic_LayDanhSachAn() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    if (!sheetAn || sheetAn.getLastRow() < 2) return [];

    var valuesAn = sheetAn.getDataRange().getValues();
    var valuesDS = sheetDS ? sheetDS.getDataRange().getValues() : [];
    
    var dsMap = {};
    for (var j = 1; j < valuesDS.length; j++) {
      var idAn = valuesDS[j][0] ? valuesDS[j][0].toString().trim() : "";
      if (!idAn) continue;
      if (!dsMap[idAn]) dsMap[idAn] = { nd: [], bd: [], detail: [] };
      
      var tuCach = String(valuesDS[j][1] || "").trim();
      var tuCachLower = tuCach.toLowerCase();
      var xungHo = String(valuesDS[j][2] || "Ông/Bà").trim();
      var tenDS = toTitleCase(cleanHonorificFromName(String(valuesDS[j][3] || "").trim()));
      var namSinh = String(valuesDS[j][4] || "").replace(/^'/, "").trim();
      var diaChi = String(valuesDS[j][5] || "").trim();
      var sdt = String(valuesDS[j][6] || "").replace(/^'/, "").trim();
      var cccd = String(valuesDS[j][7] || "").replace(/^'/, "").trim();
      var daiDien = String(valuesDS[j][8] || "").trim();

      if (tuCachLower.includes("nguyên đơn") || tuCachLower.includes("bị hại") || tuCachLower.includes("khởi kiện") || tuCachLower.includes("yêu cầu")) {
        if (!tuCachLower.includes("bị yêu cầu")) dsMap[idAn].nd.push(tenDS);
        else dsMap[idAn].bd.push(tenDS);
      } else if (tuCachLower.includes("bị đơn") || tuCachLower.includes("bị cáo") || tuCachLower.includes("bị kiện") || tuCachLower.includes("bị yêu cầu")) {
        dsMap[idAn].bd.push(tenDS);
      }

      dsMap[idAn].detail.push({
        tuCach: tuCach,
        xungHo: xungHo || "Ông/Bà",
        hoTen: tenDS,
        namSinh: namSinh,
        diaChi: diaChi,
        sdt: sdt,
        cccd: cccd,
        daiDien: daiDien
      });
    }

    var ketQua = [];
    for (var i = 1; i < valuesAn.length; i++) {
      var row = valuesAn[i];
      if (!row[1] || row[1].toString().trim() === "") continue;
      
      var idVuAn = row[0] ? row[0].toString().trim() : "";
      var dsInfo = dsMap[idVuAn] || { nd: [], bd: [], detail: [] };
      var ngayTLRaw = LibDate.parse(row[2]);
      var hanGQRaw = LibDate.parse(row[5]);

      var loaiAnVal = row[3] || "2. Dân sự";
      var quanHeVal = row[4] || "---";

      var ndList = [...dsInfo.nd];
      var bdList = [...dsInfo.bd];

      // Phân tách 2 dòng đỏ/đen cho Thuận tình ly hôn / Việc dân sự
      var isVhn = String(quanHeVal).toLowerCase().includes('thuận tình') || String(loaiAnVal).toLowerCase().includes('việc');
      if (isVhn && ndList.length >= 2 && bdList.length === 0) {
        bdList.push(ndList[1]);
        ndList = [ndList[0]];
      }

      ketQua.push({
        id: idVuAn, 
        soTL: row[1].toString(), 
        ngayTL: LibDate.fmt(row[2], 'VN'), 
        rawDate: ngayTLRaw ? ngayTLRaw.getTime() : 0,
        loaiAn: loaiAnVal, 
        quanHe: quanHeVal, 
        hanGQ: LibDate.fmt(row[5], 'VN'), 
        rawHanDate: hanGQRaw ? hanGQRaw.getTime() : 0,
        trangThai: row[6] || "Đang giải quyết", 
        ketQuaGiaiQuyet: row[12] ? row[12].toString() : "",
        folderUrl: row[7] || "", 
        qltaStatus: row[9] || "Chưa xong", 
        congBoStatus: row[10] || "Chưa đăng",
        isHGDT: (loaiAnVal && (loaiAnVal.toString().includes("Hòa giải") || loaiAnVal.toString().includes("HGĐT"))),
        nguyenDon: ndList.join(", "), 
        biDon: bdList.join(", "), 
        ghiChu: row[8] || "",
        chiTietDuongSu: dsInfo.detail
      });
    }
    return ketQua.sort((a, b) => b.rawDate - a.rawDate);
  } catch (e) { 
    return { error: "Lỗi Backend logic_LayDanhSachAn: " + e.toString() }; 
  }
}

// Alias để tương thích ngược
function layDanhSachAn() {
  return logic_LayDanhSachAn();
}

function logic_LayDuLieuChiTietAn(idVuAn) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    if (!sheetAn) return { error: "Không tìm thấy Sheet 1_SoThuLy" };

    var ids = sheetAn.getRange("A:A").getValues().flat();
    var rowIndex = ids.indexOf(idVuAn);
    
    if (rowIndex === -1) return { error: "Không tìm thấy hồ sơ gốc." };
    rowIndex += 1; 

    var row = sheetAn.getRange(rowIndex, 1, 1, 14).getValues()[0];
    
    var info = {
      id: row[0], soTL: row[1], ngayTL: LibDate.fmt(row[2], 'ISO'),
      loaiAn: row[3], quanHe: row[4], hanGQ: LibDate.fmt(row[5], 'ISO'),
      trangThai: row[6], folderUrl: row[7], ghiChu: row[8],
      qltaStatus: row[9], congBoStatus: row[10],
      ngayTacDong: LibDate.fmt(row[11], 'VN'), ketQuaGiaiQuyet: row[12] || ""
    };

    // ĐỌC VÀ HỢP NHẤT TOÀN DIỆN CẢ 3 NHÁNH (VARIABLES, PLACEHOLDERS, NARRATIVES)
    var caseMemory = {};
    if (info.folderUrl && info.folderUrl.includes("http")) {
      caseMemory = readCaseMemoryFromDrive(info.folderUrl);
    }

    var mergedVariables = Object.assign(
      {},
      caseMemory.placeholders || {},
      caseMemory.variables || {},
      caseMemory || {}
    );
    // Xóa các thuộc tính cấu trúc nội bộ không phải biến
    delete mergedVariables.placeholders;
    delete mergedVariables.variables;
    delete mergedVariables.narratives;
    delete mergedVariables.lastUpdated;

    var sheetDS = ss.getSheetByName("2_DuongSu");
    var dsData = sheetDS ? sheetDS.getDataRange().getValues() : [];
    var dsList = [];
    for (var i = 1; i < dsData.length; i++) {
      if (dsData[i][0] && dsData[i][0].toString() === idVuAn) {
        var rawXh = String(dsData[i][2] || "Ông/Bà").trim();
        var cleanHoTen = toTitleCase(cleanHonorificFromName(String(dsData[i][3] || "").trim()));
        var cleanSdt = String(dsData[i][6] || "").replace(/^'/, "");
        var cleanCccd = String(dsData[i][7] || "").replace(/^'/, "");
        var cleanNamSinh = String(dsData[i][4] || "").replace(/^'/, "");

        dsList.push({
          tuCach: String(dsData[i][1] || "").trim(), 
          xungHo: rawXh, 
          hoTen: cleanHoTen,
          namSinh: cleanNamSinh, 
          diaChi: String(dsData[i][5] || "").trim(), 
          sdt: cleanSdt,
          cccd: cleanCccd, 
          daiDien: String(dsData[i][8] || "").trim()
        });
      }
    }

    var sheetLich = ss.getSheetByName("3_LichTrinh");
    var lichData = sheetLich ? sheetLich.getDataRange().getValues() : [];
    var lichList = [];
    for (var j = 1; j < lichData.length; j++) {
      if (lichData[j][1] && lichData[j][1].toString() === idVuAn) {
        lichList.push({
          idLich: lichData[j][0],
          ngayGio: LibDate.fmtFullTime(lichData[j][2], Utilities.formatDate(new Date(lichData[j][2]), ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "HH:mm")),
          noiDung: lichData[j][3],
          trangThai: lichData[j][4]
        });
      }
    }

    return { 
      info: info, 
      ds: dsList, 
      lich: lichList, 
      variables: mergedVariables,
      narratives: caseMemory.narratives || {}
    };
  } catch (e) { 
    return { error: "Lỗi tải chi tiết: " + e.message }; 
  }
}

// Alias để tương thích ngược
function layDuLieuChiTiet(idVuAn) {
  return logic_LayDuLieuChiTietAn(idVuAn);
}

// =========================================================================
// 4. LƯU THÔNG SỐ VÀO TRẠM DỮ LIỆU DRIVE (_case_memory.json) - CHUẨN SPEC
// =========================================================================

function backend_LuuThongSoNghiepVuAn(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var idVuAn = payload.idVuAn;
    var vars = payload.variables || {};
    var narratives = payload.narratives || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    if (!sheetAn) return { success: false, error: "Không tìm thấy bảng 1_SoThuLy." };

    var finder = sheetAn.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
    if (!finder) return { success: false, error: "Không tìm thấy hồ sơ vụ án." };

    var row = finder.getRow();
    var folderUrl = sheetAn.getRange(row, 8).getValue();

    if (!folderUrl || !folderUrl.includes("http")) {
      var soTL = sheetAn.getRange(row, 2).getValue();
      var ngayTL = sheetAn.getRange(row, 3).getValue();
      var loaiAn = sheetAn.getRange(row, 4).getValue();
      
      var sheetDS = ss.getSheetByName("2_DuongSu");
      var dsData = sheetDS ? sheetDS.getDataRange().getValues() : [];
      var parties = [];
      for (var i = 1; i < dsData.length; i++) {
        if (dsData[i][0] && dsData[i][0].toString() === idVuAn) {
          parties.push({ tuCach: dsData[i][1], hoTen: dsData[i][3] });
        }
      }
      folderUrl = taoThuMucHoSoMoi(soTL, loaiAn, LibDate.parse(ngayTL) || new Date(), parties);
      sheetAn.getRange(row, 8).setValue(folderUrl);
    }

    var currentMemory = readCaseMemoryFromDrive(folderUrl);
    
    // Hợp nhất phẳng để bảo tồn 100% dữ liệu cũ không giới hạn dung lượng
    currentMemory.variables = Object.assign({}, currentMemory.placeholders || {}, currentMemory.variables || {}, vars);
    currentMemory.narratives = Object.assign({}, currentMemory.narratives || {}, narratives);
    currentMemory.lastUpdated = new Date().toISOString();

    saveCaseMemoryToDrive(folderUrl, currentMemory);
    capNhatNgayTacDong(idVuAn);

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// =========================================================================
// 5. THỤ LÝ VỤ ÁN MỚI & SAO CHÉP CHỨNG CỨ TỪ ĐƠN
// =========================================================================

function logic_LuuVuAnMoi(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    
    var n = LibDate.parse(data.ngayTL) || new Date();
    var fullSoTL = buildFullCaseNumber(data.soTL, data.loaiAn, n, data.quanHe);
    var hanGQ = DeadlineEngine.calculate(n, data.loaiAn, false, data.quanHe);
    var idAn = generateId("AN");
    
    sheetAn.appendRow([
      idAn, fullSoTL, n, data.loaiAn, normalizeLegalText(data.quanHe),
      hanGQ, "Đang giải quyết", "", "", "Chưa xong", "Chưa đăng", new Date(), "", "Thủ công"
    ]);
    var rowIdx = sheetAn.getLastRow();
    
    if (data.duongSu && data.duongSu.length > 0) {
      var dsRows = data.duongSu.map(function(d) {
        var cleanSdt = d.sdt ? ("'" + String(d.sdt).replace(/^'/, '').trim()) : "";
        var cleanCccd = d.cccd ? ("'" + String(d.cccd).replace(/^'/, '').trim()) : "";
        var cleanNamSinh = d.namSinh ? ("'" + String(d.namSinh).replace(/^'/, '').trim()) : "";
        var cleanHoTen = toTitleCase(cleanHonorificFromName(d.hoTen));
        var cleanXh = (d.xungHo && d.xungHo.trim()) ? d.xungHo.trim() : "Ông/Bà";

        return [
          idAn, 
          d.tuCach, 
          cleanXh, 
          cleanHoTen, 
          cleanNamSinh, 
          d.diaChi || "", 
          cleanSdt, 
          cleanCccd, 
          d.daiDien || "", 
          ""
        ];
      });
      sheetDS.getRange(sheetDS.getLastRow() + 1, 1, dsRows.length, 10).setValues(dsRows);
    }
    
    var folderUrl = "";
    try {
      folderUrl = taoThuMucHoSoMoi(fullSoTL, data.loaiAn, n, data.duongSu);
      sheetAn.getRange(rowIdx, 8).setValue(folderUrl);

      // Nếu thụ lý từ Đơn -> Sao chép toàn bộ tệp từ thư mục Đơn sang thư mục Án
      if (data.idDon && folderUrl && folderUrl.includes("http")) {
        var targetFolderId = extractFolderId(folderUrl);
        if (targetFolderId) {
          copyFilesFromDonToAn(data.idDon, DriveApp.getFolderById(targetFolderId));
        }
      }

      // Khởi tạo thông tin Án phí / Tạm ứng ban đầu vào Trạm dữ liệu nếu có
      if (data.anPhiInfo && folderUrl && folderUrl.includes("http")) {
        var initialMemory = {
          variables: {
            "TO_TUNG_AN_PHI_DATA": JSON.stringify({ receipts: [data.anPhiInfo] }),
            "{Biên lai tạm ứng án phí}": data.anPhiInfo.text || "",
            "{Số biên lai}": data.anPhiInfo.soBL || "",
            "{Ngày biên lai}": data.anPhiInfo.ngay || "",
            "{Cơ quan thu tiền}": data.anPhiInfo.coQuan || ""
          },
          narratives: {},
          lastUpdated: new Date().toISOString()
        };
        saveCaseMemoryToDrive(folderUrl, initialMemory);
      }
    } catch(e) {
      sheetAn.getRange(rowIdx, 9).setValue("Lỗi tạo Drive: " + e.message);
    }
    
    return { success: true, id: idAn };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias để tương thích
function backend_LuuVuAnMoi(data) {
  return logic_LuuVuAnMoi(data);
}

// =========================================================================
// 6. CẬP NHẬT KẾT QUẢ GIẢI QUYẾT & SỔ ÁN
// =========================================================================

function capNhatNgayTacDong(idVuAn) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var finder = sheet.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
    if (finder) {
      sheet.getRange(finder.getRow(), 12).setValue(new Date()); 
    }
  } catch (e) {}
}

function logic_UpdateCaseResolution(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var finder = sheet.getRange("A:A").createTextFinder(data.idVuAn).matchEntireCell(true).findNext();
    if (!finder) return { success: false, error: "Không tìm thấy hồ sơ." };
    
    var rowIndex = finder.getRow();
    var cD = sheet.getRange(rowIndex, 3).getValue();
    var loaiAn = sheet.getRange(rowIndex, 4).getValue();
    var quanHe = sheet.getRange(rowIndex, 5).getValue();
    
    var tThai = "Đang giải quyết";
    var newHanGQ = null;
    var resString = "";

    if (data.resultType !== "CLEAR") {
      var resTypeLower = String(data.resultType).toLowerCase();
      var isProceduralOnly = resTypeLower.includes("tạm đình chỉ") || resTypeLower.includes("gia hạn") || resTypeLower.includes("tiếp tục");

      if (resTypeLower.includes("tạm đình chỉ")) {
        tThai = "Tạm đình chỉ";
      } else if (resTypeLower.includes("gia hạn")) {
        tThai = "Đang giải quyết";
        newHanGQ = DeadlineEngine.calculate(cD, loaiAn, true, quanHe);
      } else if (resTypeLower.includes("tiếp tục")) {
        tThai = "Đang giải quyết";
        var qdDate = LibDate.parse(data.resultDate) || new Date();
        newHanGQ = DeadlineEngine.calculate(qdDate, loaiAn, false, quanHe, 0); 
      } else {
        tThai = "Đã giải quyết";
        resString = data.resultType + "\n" + (data.resultNo || "---") + "\n" + LibDate.fmt(data.resultDate, 'VN');
      }

      if (isProceduralOnly) {
        resString = ""; 
      }

    } else {
      if (cD) newHanGQ = DeadlineEngine.calculate(cD, loaiAn, false, quanHe);
    }

    sheet.getRange(rowIndex, 7).setValue(tThai);
    if (newHanGQ) sheet.getRange(rowIndex, 6).setValue(newHanGQ);
    sheet.getRange(rowIndex, 13).setValue(resString);
    
    capNhatNgayTacDong(data.idVuAn);
    
    return { 
      success: true, 
      hanGQ: newHanGQ ? LibDate.fmt(newHanGQ, 'VN') : (cD ? LibDate.fmt(cD, 'VN') : "") 
    };
  } catch (e) { 
    return { success: false, error: e.message }; 
  } finally {
    lock.releaseLock();
  }
}

// Alias
function backend_UpdateCaseResolution(data) {
  return logic_UpdateCaseResolution(data);
}

function logic_UpdateAllParties(idVuAn, parties) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    var idTarget = idVuAn.toString().trim();
    
    var data = sheet.getDataRange().getValues();
    var newData = [data[0]];

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() !== idTarget) {
        newData.push(data[i]);
      }
    }

    if (parties && parties.length > 0) {
      parties.forEach(p => {
        var finalXh = (p.xungHo !== undefined && p.xungHo !== null && String(p.xungHo).trim() !== "") ? String(p.xungHo).trim() : "Ông/Bà";
        var cleanHoTen = toTitleCase(cleanHonorificFromName(p.hoTen));
        var cleanSdt = p.sdt ? ("'" + String(p.sdt).replace(/^'/, '').trim()) : "";
        var cleanCccd = p.cccd ? ("'" + String(p.cccd).replace(/^'/, '').trim()) : "";
        var cleanNamSinh = p.namSinh ? ("'" + String(p.namSinh).replace(/^'/, '').trim()) : "";

        newData.push([
          idTarget, 
          String(p.tuCach || "Đương sự").trim(), 
          finalXh, 
          cleanHoTen, 
          cleanNamSinh, 
          String(p.diaChi || "").trim(), 
          cleanSdt, 
          cleanCccd, 
          String(p.daiDien || "").trim(), 
          ""
        ]);
      });
    }

    sheet.clearContents();
    if (newData.length > 0) {
      sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    }
    
    capNhatNgayTacDong(idTarget);
    return { success: true };
  } catch (e) { 
    return { success: false, error: e.toString() }; 
  } finally { 
    lock.releaseLock(); 
  }
}

// Alias
function backend_UpdateAllParties(idVuAn, parties) {
  return logic_UpdateAllParties(idVuAn, parties);
}

function logic_CapNhatThongTinAn(d) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheetAn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var finder = sheetAn.getRange("A:A").createTextFinder(d.idAn).matchEntireCell(true).findNext();
    
    if (finder) {
      var rowIndex = finder.getRow();
      var n = LibDate.parse(d.ngayTL);
      var f = buildFullCaseNumber(d.soTL, d.loaiAn, n, d.quanHe);
      
      var currentKq = String(sheetAn.getRange(rowIndex, 13).getValue() || "");
      var isExtended = currentKq.includes("Gia hạn");
      var h = DeadlineEngine.calculate(n, d.loaiAn, isExtended, d.quanHe);

      sheetAn.getRange(rowIndex, 2, 1, 5).setValues([[f, n, d.loaiAn, normalizeLegalText(d.quanHe), h]]);
      capNhatNgayTacDong(d.idAn);
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy ID vụ án" };
  } catch (e) { 
    return { success: false, error: e.message }; 
  } finally {
    lock.releaseLock();
  }
}

// Alias
function backend_CapNhatThongTinAn(d) {
  return logic_CapNhatThongTinAn(d);
}

function logic_DeleteCase(idVuAn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var idTarget = idVuAn.toString().trim();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var finderAn = sheetAn.getRange("A:A").createTextFinder(idTarget).matchEntireCell(true).findNext();
    
    if (!finderAn) return { success: false, error: "Không tìm thấy vụ án để xóa." };
    
    var row = finderAn.getRow();
    var folderUrl = sheetAn.getRange(row, 8).getValue();
    if (folderUrl && folderUrl.includes("http")) {
      try { DriveApp.getFolderById(extractFolderId(folderUrl)).setTrashed(true); } catch (e) {}
    }
    sheetAn.deleteRow(row);

    ["2_DuongSu", "3_LichTrinh", "4_NhatKy"].forEach(sName => {
      var sheet = ss.getSheetByName(sName);
      if (sheet) {
        var colID = (sName === "3_LichTrinh") ? "B:B" : "A:A"; 
        var ranges = sheet.getRange(colID).createTextFinder(idTarget).matchEntireCell(true).findAll();
        for (var i = ranges.length - 1; i >= 0; i--) {
          sheet.deleteRow(ranges[i].getRow());
        }
      }
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: "Lỗi xóa hồ sơ: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function backend_DeleteCase(idVuAn) {
  return logic_DeleteCase(idVuAn);
}

function logic_DeleteMultipleCases(ids) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (!ids || ids.length === 0) return { success: true };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var foldersToTrash = [];
    
    ids.forEach(id => {
      var finder = sheetAn.getRange("A:A").createTextFinder(id).matchEntireCell(true).findNext();
      if (finder) {
        var row = finder.getRow();
        var url = sheetAn.getRange(row, 8).getValue();
        if (url) foldersToTrash.push(url);
        sheetAn.deleteRow(row); 
      }
    });

    foldersToTrash.forEach(url => { 
      try { 
        if (url && url.includes("http")) DriveApp.getFolderById(extractFolderId(url)).setTrashed(true); 
      } catch (e) {} 
    });

    ["2_DuongSu", "3_LichTrinh", "4_NhatKy"].forEach(sName => {
      var sheet = ss.getSheetByName(sName);
      if (sheet) {
        var colID = (sName === "3_LichTrinh") ? "B:B" : "A:A";
        ids.forEach(id => {
          var ranges = sheet.getRange(colID).createTextFinder(id).matchEntireCell(true).findAll();
          for (var i = ranges.length - 1; i >= 0; i--) {
            sheet.deleteRow(ranges[i].getRow());
          }
        });
      }
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: "Lỗi xóa hàng loạt: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Alias
function backend_DeleteMultipleCases(ids) {
  return logic_DeleteMultipleCases(ids);
}

function backend_UpdateSystemStatus(idVuAn, type) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var finder = sheet.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
    if (finder) {
      if (type === 'QLTA') sheet.getRange(finder.getRow(), 10).setValue('Xong');
      if (type === 'CONGBO') sheet.getRange(finder.getRow(), 11).setValue('Đã đăng');
      return { success: true };
    }
    return { success: false, error: "Lỗi ID" };
  } catch(e) { 
    return { success: false, error: "Lỗi" }; 
  } finally {
    lock.releaseLock();
  }
}

function backendLuuDuongSuLe(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    var cleanSdt = data.sdt ? ("'" + String(data.sdt).replace(/^'/, '').trim()) : "";
    var cleanCccd = data.cccd ? ("'" + String(data.cccd).replace(/^'/, '').trim()) : "";
    var cleanNamSinh = data.namSinh ? ("'" + String(data.namSinh).replace(/^'/, '').trim()) : "";
    var cleanHoTen = toTitleCase(cleanHonorificFromName(data.hoTen));
    var cleanXh = (data.xungHo && data.xungHo.trim()) ? data.xungHo.trim() : "Ông/Bà";

    sheet.appendRow([
      data.idVuAn, 
      data.tuCach, 
      cleanXh, 
      cleanHoTen, 
      cleanNamSinh, 
      data.diaChi || "", 
      cleanSdt, 
      cleanCccd, 
      data.daiDien || "", 
      ""
    ]);
    capNhatNgayTacDong(data.idVuAn);
    return { success: true };
  } catch(e) { 
    return { success: false, error: e.toString() }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function backendUpdateDuongSu(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    var targetName = cleanHonorificFromName(data.oldName).toString().trim().toLowerCase();
    
    var ranges = sheet.getRange("A:A").createTextFinder(data.idVuAn).matchEntireCell(true).findAll();
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i].getRow();
      var nameInSheet = cleanHonorificFromName(sheet.getRange(r, 4).getValue()).toString().trim().toLowerCase();
      if (nameInSheet === targetName) {
        var cleanSdt = data.sdt ? ("'" + String(data.sdt).replace(/^'/, '').trim()) : "";
        var cleanCccd = data.cccd ? ("'" + String(data.cccd).replace(/^'/, '').trim()) : "";
        var cleanNamSinh = data.namSinh ? ("'" + String(data.namSinh).replace(/^'/, '').trim()) : "";
        var cleanHoTen = toTitleCase(cleanHonorificFromName(data.hoTen));
        var cleanXh = (data.xungHo && data.xungHo.trim()) ? data.xungHo.trim() : "Ông/Bà";

        sheet.getRange(r, 2, 1, 9).setValues([[
          data.tuCach, 
          cleanXh, 
          cleanHoTen, 
          cleanNamSinh, 
          data.diaChi || "", 
          cleanSdt, 
          cleanCccd, 
          data.daiDien || "", 
          ""
        ]]);
        capNhatNgayTacDong(data.idVuAn);
        return { success: true };
      }
    }
    return { success: false, error: "Không tìm thấy đương sự" };
  } catch (e) { 
    return { success: false, error: e.message }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function backend_DeleteParty(idVuAn, hoTen, tuCach) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    var ranges = sheet.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findAll();

    for (var i = ranges.length - 1; i >= 0; i--) {
      var row = ranges[i].getRow();
      var rRole = sheet.getRange(row, 2).getValue().toString().trim();
      var rName = cleanHonorificFromName(sheet.getRange(row, 4).getValue()).toString().trim().toLowerCase();
      var targetClean = cleanHonorificFromName(hoTen).toString().trim().toLowerCase();
      
      if (rRole === tuCach.toString().trim() && rName === targetClean) {
        sheet.deleteRow(row);
        capNhatNgayTacDong(idVuAn);
        return { success: true };
      }
    }
    return { success: false, error: "Không tìm thấy đương sự để xóa." };
  } catch (e) { 
    return { success: false, error: e.message }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function backend_UpdateQuickNote(idVuAn, note) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var finder = sheet.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
    if (finder) {
      sheet.getRange(finder.getRow(), 9).setValue(note);
      capNhatNgayTacDong(idVuAn);
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy hồ sơ." };
  } catch (e) { 
    return { success: false, error: e.message }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function ghiNhatKy(idVuAn, suKien, chiTiet) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("4_NhatKy");
    if (sheet) sheet.appendRow([idVuAn, new Date(), suKien, chiTiet]);
  } catch(e) {}
}

function backend_CapNhatNguocTuThongBaoThuLy(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var idVuAn = payload.idVuAn;
    if (!idVuAn) throw new Error("Mã vụ án không hợp lệ.");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var finder = sheetAn.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
    if (!finder) throw new Error("Không tìm thấy vụ án trong Sổ Thụ Lý.");

    var rowIndex = finder.getRow();

    if (payload.quanHe) {
      var qhClean = payload.quanHe.trim().replace(/^["“](.*)["”]$/, '$1');
      sheetAn.getRange(rowIndex, 5).setValue(normalizeLegalText(qhClean));
    }

    if (payload.loaiAn) {
      sheetAn.getRange(rowIndex, 4).setValue(payload.loaiAn);
    }

    if (payload.parties && payload.parties.length > 0) {
      backend_UpdateAllParties(idVuAn, payload.parties);
    }

    capNhatNgayTacDong(idVuAn);
    ghiNhatKy(idVuAn, "Chuẩn hóa thụ lý", "Đã cập nhật ngược dữ liệu từ Thông báo thụ lý.");

    return { success: true };
  } catch (e) {
    return { success: false, error: "Lỗi cập nhật ngược: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function backend_KiemTraThongTinDuongSu(idVuAn) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDS = ss.getSheetByName("2_DuongSu");
    if (!sheetDS) return { success: false, error: "Không tìm thấy Sheet 2_DuongSu" };

    var dsData = sheetDS.getDataRange().getValues();
    var missingReport = [];
    var totalFields = 0;
    var completedFields = 0;

    for (var i = 1; i < dsData.length; i++) {
      if (dsData[i][0] && dsData[i][0].toString().trim() === idVuAn.toString().trim()) {
        var tuCach = String(dsData[i][1] || "").trim();
        var xungHo = String(dsData[i][2] || "").trim();
        var hoTen = toTitleCase(cleanHonorificFromName(String(dsData[i][3] || "").trim()));
        var namSinh = String(dsData[i][4] || "").replace(/^'/, "").trim();
        var diaChi = String(dsData[i][5] || "").trim();
        var sdt = String(dsData[i][6] || "").replace(/^'/, "").trim();
        var cccd = String(dsData[i][7] || "").replace(/^'/, "").trim();
        var daiDien = String(dsData[i][8] || "").trim();

        var missingList = [];
        var isPhapNhan = (xungHo.toLowerCase() === "tổ chức" || xungHo.toLowerCase() === "pháp nhân" || xungHo.toLowerCase() === "công ty");

        totalFields += isPhapNhan ? 3 : 5;

        if (!isPhapNhan && !namSinh) missingList.push("Năm sinh"); else if (!isPhapNhan) completedFields++;
        if (!diaChi) missingList.push("Địa chỉ"); else completedFields++;
        if (!sdt) missingList.push("Số điện thoại"); else completedFields++;
        if (!isPhapNhan && !cccd) missingList.push("CCCD/CMND"); else if (!isPhapNhan) completedFields++;
        if (isPhapNhan && !daiDien) missingList.push("Người đại diện pháp luật"); else if (isPhapNhan) completedFields++;

        missingReport.push({
          rowIndex: i + 1,
          tuCach: tuCach,
          xungHo: xungHo || "Ông/Bà",
          hoTen: hoTen,
          namSinh: namSinh,
          diaChi: diaChi,
          sdt: sdt,
          cccd: cccd,
          daiDien: daiDien,
          isPhapNhan: isPhapNhan,
          missingFields: missingList,
          isComplete: (missingList.length === 0)
        });
      }
    }

    var completionRate = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100;

    return {
      success: true,
      parties: missingReport,
      completionRate: completionRate,
      hasMissing: missingReport.some(p => !p.isComplete)
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function backend_LuuBoSungThongTinDuongSu(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var idVuAn = payload.idVuAn;
    var updates = payload.updates;
    if (!idVuAn || !updates || !Array.isArray(updates)) throw new Error("Dữ liệu cập nhật không hợp lệ.");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDS = ss.getSheetByName("2_DuongSu");
    var dsData = sheetDS.getDataRange().getValues();

    updates.forEach(u => {
      var targetName = cleanHonorificFromName(u.hoTen).toString().trim().toLowerCase();
      var targetTuCach = String(u.tuCach || "").trim().toLowerCase();

      for (var i = 1; i < dsData.length; i++) {
        if (dsData[i][0] && dsData[i][0].toString().trim() === idVuAn.toString().trim()) {
          var rTuCach = String(dsData[i][1] || "").trim().toLowerCase();
          var rName = cleanHonorificFromName(dsData[i][3]).toString().trim().toLowerCase();

          if (rTuCach === targetTuCach && rName === targetName) {
            var row = i + 1;
            if (u.namSinh !== undefined && u.namSinh !== "") sheetDS.getRange(row, 5).setValue("'" + u.namSinh);
            if (u.diaChi !== undefined && u.diaChi !== "") sheetDS.getRange(row, 6).setValue(u.diaChi);
            if (u.sdt !== undefined && u.sdt !== "") sheetDS.getRange(row, 7).setValue("'" + formatPhoneNumber(u.sdt));
            if (u.cccd !== undefined && u.cccd !== "") sheetDS.getRange(row, 8).setValue("'" + u.cccd);
            if (u.daiDien !== undefined && u.daiDien !== "") sheetDS.getRange(row, 9).setValue(u.daiDien);
            if (u.xungHo !== undefined && u.xungHo !== "") sheetDS.getRange(row, 3).setValue(u.xungHo);
            break;
          }
        }
      }
    });

    capNhatNgayTacDong(idVuAn);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

function backend_ImportCasesChunked(chunk) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    var dataAn = sheetAn.getDataRange().getValues();
    
    var dbMap = {};
    for (var i = 1; i < dataAn.length; i++) {
      var sSo = extractShortNo(dataAn[i][1]);
      var sNgay = LibDate.fmt(dataAn[i][2], 'ISO');
      if (sSo && sNgay) {
        var uniqueKey = sSo + "_" + sNgay;
        dbMap[uniqueKey] = { index: i + 1, currentRes: (dataAn[i][12] ? dataAn[i][12].toString().trim() : "") };
      }
    }

    var imported = 0, updated = 0, skipped = 0;
    var rowsToAppend = [];
    var dsToAppend = [];

    chunk.forEach(function(item) {
      if (!item.soTL) return;
      var exSo = extractShortNo(item.soTL);
      var exNgayObj = LibDate.parse(item.ngayTL) || new Date();
      var exNgayStr = LibDate.fmt(exNgayObj, 'ISO');
      var uniqueKey = exSo + "_" + exNgayStr;
      var existingRow = dbMap[uniqueKey];

      if (existingRow) {
        if (item.kqLoai) {
          var mappedKq = item.kqLoai.trim();
          var newRes = mappedKq + "\n" + (item.kqSo || '---') + "\n" + (item.kqNgay || LibDate.toVNString(new Date()));
          if (newRes !== existingRow.currentRes) {
            sheetAn.getRange(existingRow.index, 13).setValue(newRes);
            sheetAn.getRange(existingRow.index, 7).setValue("Đã giải quyết");
            updated++;
          } else { skipped++; }
        } else { skipped++; }
      } else {
        var finalLoaiAn = item.loaiAn || "2. Dân sự";
        var fullSoTL = buildFullCaseNumber(item.soTL, finalLoaiAn, exNgayObj, item.quanHe);
        var hanGQ = DeadlineEngine.calculate(exNgayObj, finalLoaiAn, false, item.quanHe);
        var ketQua = "";
        if (item.kqLoai) { 
          ketQua = item.kqLoai.trim() + "\n" + (item.kqSo || '---') + "\n" + (item.kqNgay || LibDate.toVNString(new Date())); 
        }
        
        var trangThai = ketQua ? "Đã giải quyết" : "Đang giải quyết";
        var idAn = generateId("AN");

        rowsToAppend.push([
          idAn, fullSoTL, exNgayObj, finalLoaiAn, normalizeLegalText(item.quanHe),
          hanGQ, trangThai, "", "", "Chưa xong", ketQua ? "Chưa đăng" : "", new Date(), ketQua, "TAKV2"
        ]);

        var tuCachND = "Nguyên đơn"; 
        var tuCachBD = "Bị đơn";
        if (finalLoaiAn.includes("Hình sự")) { tuCachND = "Người bị hại"; tuCachBD = "Bị cáo"; }
        else if (finalLoaiAn.includes("Hành chính")) { tuCachND = "Người khởi kiện"; tuCachBD = "Người bị kiện"; }
        else if (finalLoaiAn.includes("Hòa giải") || finalLoaiAn.includes("Việc")) { tuCachND = "Người yêu cầu"; tuCachBD = "Người bị yêu cầu"; }

        if (item.nd) dsToAppend.push([idAn, tuCachND, "Ông/Bà", item.nd.toUpperCase(), "", "", "", "", "", ""]);
        if (item.bd) dsToAppend.push([idAn, tuCachBD, "Ông/Bà", item.bd.toUpperCase(), "", "", "", "", "", ""]);

        try {
          var duongSuArr = [];
          if(item.nd) duongSuArr.push({tuCach: tuCachND, hoTen: item.nd});
          if(item.bd) duongSuArr.push({tuCach: tuCachBD, hoTen: item.bd});
          var folderUrl = taoThuMucHoSoMoi(fullSoTL, finalLoaiAn, exNgayObj, duongSuArr);
          rowsToAppend[rowsToAppend.length - 1][7] = folderUrl;
        } catch(e) {}
        imported++;
      }
    });

    if (rowsToAppend.length > 0) sheetAn.getRange(sheetAn.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    if (dsToAppend.length > 0) sheetDS.getRange(sheetDS.getLastRow() + 1, 1, dsToAppend.length, 10).setValues(dsToAppend);
    
    return { success: true, imported: imported, skipped: skipped, updated: updated };
  } catch (e) { 
    return { success: false, error: "Lỗi đồng bộ: " + e.toString() }; 
  }
}

function TOOL_DonDepAnTrung() {
  var ui = SpreadsheetApp.getUi();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    
    var dataAn = sheetAn.getDataRange().getValues();
    var dataDS = sheetDS.getDataRange().getValues();
    
    var caseMap = new Map();
    
    for (var i = 1; i < dataAn.length; i++) {
      var row = dataAn[i];
      var id = String(row[0] || "").trim();
      var soTL = String(row[1] || "").trim();
      var cleanSo = extractShortNo(soTL);
      var d = LibDate.parse(row[2]);
      var year = d ? d.getFullYear() : 0;
      
      if (!cleanSo || !year) continue;
      var key = cleanSo + "_" + year;
      
      var partiesCount = 0;
      for (var j = 1; j < dataDS.length; j++) {
        if (String(dataDS[j][0] || "").trim() === id) partiesCount++;
      }
      
      var record = {
        rowIdx: i + 1,
        id: id,
        soTL: soTL,
        rowVal: row,
        partiesCount: partiesCount
      };
      
      if (!caseMap.has(key)) {
        caseMap.set(key, [record]);
      } else {
        caseMap.get(key).push(record);
      }
    }
    
    var idsToDelete = [];
    var mergedCount = 0;
    
    caseMap.forEach(function(records, key) {
      if (records.length > 1) {
        records.sort((a, b) => b.partiesCount - a.partiesCount);
        var survivor = records[0];
        
        for (var k = 1; k < records.length; k++) {
          idsToDelete.push(records[k].id);
          mergedCount++;
        }
      }
    });
    
    if (idsToDelete.length > 0) {
      backend_DeleteMultipleCases(idsToDelete);
    }
    
    ui.alert("DỌN DẸP HOÀN TẤT!", `✅ Đã quét và loại bỏ ${mergedCount} bản ghi vụ án trùng lặp, bảo toàn nguyên vẹn CSDL.`, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert("Lỗi", "Có lỗi xảy ra: " + e.message, ui.ButtonSet.OK);
  } finally {
    lock.releaseLock();
  }
}