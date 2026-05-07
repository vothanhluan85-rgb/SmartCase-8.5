/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.5.4 - GROQ AI EDITION
 * FILE 3: TRUNG TÂM XỬ LÝ NGHIỆP VỤ (ĐÃ TỐI ƯU HÓA TOÀN DIỆN TỐC ĐỘ)
 */

var DeadlineEngine = {
  calculate: function(startDate, loaiAn, isExtension) {
    if (!startDate) return new Date();
    var date = new Date(startDate);
    var months = isExtension ? (APP_CONFIG.DEADLINES_EXT[loaiAn] || 2) : (APP_CONFIG.DEADLINES_INIT[loaiAn] || 4);
    date.setMonth(date.getMonth() + months);
    return date;
  }
};

function normalizeLegalText(text) {
  if (!text) return "---";
  var str = text.toString().trim().toLowerCase();
  var prefixes = [/^yêu cầu\s+/i, /^về việc\s+/i, /^v\/v\s+/i, /^đơn yêu cầu\s+/i];
  prefixes.forEach(regex => { str = str.replace(regex, ""); });
  return str ? (str.charAt(0).toUpperCase() + str.slice(1)) : "---";
}

function mapLoaiAn(rawText) {
  if (!rawText) return "2. Dân sự";
  var txt = rawText.toString().trim().toLowerCase();
  if (txt.includes("hòa giải") || txt.includes("đối thoại")) return "7. Hòa giải đối thoại";
  if (txt.includes("hình sự")) return "1. Hình sự";
  if (txt.includes("hôn nhân")) return "3. Hôn nhân";
  if (txt.includes("kinh doanh") || txt.includes("thương mại")) return "4. Kinh doanh";
  if (txt.includes("lao động")) return "5. Lao động";
  if (txt.includes("hành chính")) return "6. Hành chính";
  return "2. Dân sự";
}

function mapKetQua(rawText) {
  if (!rawText) return "";
  var txt = rawText.toString().toLowerCase();
  if (txt.includes("xét xử") || txt.includes("bản án")) return "Bản án";
  if (txt.includes("thuận tình ly hôn")) return "QĐCN-TTLH";
  if (txt.includes("công nhận thỏa thuận") || txt.includes("sự thỏa thuận")) return "QĐCNTT";
  if (txt.includes("tạm đình chỉ")) return "Tạm đình chỉ";
  if (txt.includes("đình chỉ")) return "Đình chỉ";
  if (txt.includes("kết quả hòa giải đối thoại") || (txt.includes("hòa giải") && txt.includes("đối thoại"))) return "QĐCN-HGĐT";
  if (txt.includes("chuyển hồ sơ")) return "Quyết định chuyển hồ sơ";
  if (txt.includes("giải quyết việc")) return "QĐG-QVDS";
  return rawText.toString().trim();
}

function getShortNoOnly(fullTL) {
  return fullTL ? fullTL.toString().split('/')[0].replace(/\D/g, '').trim() : "";
}

// ============================================================
// [TỐI ƯU 1] TĂNG TỐC LOAD DANH SÁCH ÁN
// ============================================================
function layDanhSachAn() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var valuesAn = ss.getSheetByName("1_SoThuLy").getDataRange().getValues();
    var valuesDS = ss.getSheetByName("2_DuongSu").getDataRange().getValues();
   
    var dsMap = {};
    // Lặp mảng trong RAM cực nhanh
    for (var j = 1; j < valuesDS.length; j++) {
      var idAn = valuesDS[j][0] ? valuesDS[j][0].toString().trim() : "";
      if (!idAn) continue;
      if (!dsMap[idAn]) dsMap[idAn] = { nd: [], bd: [] };
      
      var tuCach = valuesDS[j][1] ? valuesDS[j][1].toString().toLowerCase() : "";
      var tenDS = valuesDS[j][3] ? valuesDS[j][3].toString().trim() : "";
     
      var isBD = tuCach.includes("bị đơn") || tuCach.includes("bị cáo") || tuCach.includes("bị kiện") || tuCach.includes("bị yêu cầu");
      var isND = tuCach.includes("nguyên đơn") || tuCach.includes("khởi kiện") || tuCach.includes("người yêu cầu") || tuCach.includes("bị hại") || (tuCach.includes("khởi kiện") && !tuCach.includes("bị"));
     
      if (isND) dsMap[idAn].nd.push(tenDS.toUpperCase());
      else if (isBD) dsMap[idAn].bd.push(tenDS.toUpperCase());
    }

    var ketQua = [];
    for (var i = 1; i < valuesAn.length; i++) {
      var row = valuesAn[i];
      if (!row[1] || row[1].toString().trim() === "") continue;
      
      var idVuAn = row[0] ? row[0].toString().trim() : "";
      var dsInfo = dsMap[idVuAn] || { nd: [], bd: [] };
      var ngayTLRaw = LibDate.parse(row[2]);
      var hanGQRaw = LibDate.parse(row[5]);

      ketQua.push({
        id: idVuAn,
        soTL: row[1].toString(),            
        ngayTL: LibDate.fmt(row[2], 'VN'),
        rawDate: ngayTLRaw ? ngayTLRaw.getTime() : 0,
        loaiAn: row[3] || "2. Dân sự",
        quanHe: row[4] || "---",          
        hanGQ: LibDate.fmt(row[5], 'VN'),
        rawHanDate: hanGQRaw ? hanGQRaw.getTime() : 0,
        trangThai: row[6] || "Đang giải quyết",
        ketQuaGiaiQuyet: row[12] ? row[12].toString() : "",
        folderUrl: row[7] || "",
        qltaStatus: row[9] || "Chưa xong",
        congBoStatus: row[10] || "Chưa đăng",
        isHGDT: (row[3] && (row[3].toString().includes("Hòa giải") || row[3].toString().includes("HGĐT"))),
        nguyenDon: dsInfo.nd.join(", "),
        biDon: dsInfo.bd.join(", "),
        ghiChu: row[8] || ""
      });
    }
    return ketQua.sort(function(a, b) { return b.rawDate - a.rawDate; });
  } catch (e) { return { error: "Lỗi Backend: " + e.toString() }; }
}

function layDuLieuChiTiet(idVuAn) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var idTarget = idVuAn.toString().trim();
    var dataAn = ss.getSheetByName("1_SoThuLy").getDataRange().getValues();
    var info = null;
    
    for (var i = 1; i < dataAn.length; i++) {
      if (dataAn[i][0] && dataAn[i][0].toString().trim() === idTarget) {
        var row = dataAn[i];
        info = {
          id: row[0].toString(), soTL: row[1].toString(),
          ngayTL: LibDate.fmt(row[2], 'ISO'), ngayTL_Display: LibDate.fmt(row[2], 'VN'),
          loaiAn: row[3], quanHe: row[4], hanGQ: LibDate.fmt(row[5], 'VN'),
          trangThai: row[6] ? row[6].toString().trim() : "Đang giải quyết",
          folderUrl: row[7] || "", ghiChu: row[8] || "",
          qltaStatus: row[9] || "Chưa xong", congBoStatus: row[10] || "Chưa đăng",
          ketQuaGiaiQuyet: row[12] ? row[12].toString().trim() : ""
        };
        break;
      }
    }
    if (!info) return { error: "Không tìm thấy hồ sơ." };
    
    var ds = ss.getSheetByName("2_DuongSu").getDataRange().getValues()
              .filter(function(r){ return r[0] && r[0].toString().trim() === idTarget; })
              .map(function(r){ return { 
                  tuCach: r[1], xungHo: r[2], hoTen: toTitleCase(r[3]), 
                  namSinh: r[4], diaChi: r[5], sdt: formatPhoneNumber(r[6]), 
                  cccd: r[7] || "", daiDien: r[8] || "" 
              }; });
    return { info: info, ds: ds };
  } catch (err) { return { error: err.toString() }; }
}

function backend_ImportCasesChunked(chunk) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    var dataAn = sheetAn.getDataRange().getValues();
   
    var dbMap = {};
    for (var i = 1; i < dataAn.length; i++) {
      var sSo = getShortNoOnly(dataAn[i][1]);
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
      var exSo = getShortNoOnly(item.soTL);
      var exNgayObj = LibDate.parse(item.ngayTL) || new Date();
      var exNgayStr = LibDate.fmt(exNgayObj, 'ISO');
      var uniqueKey = exSo + "_" + exNgayStr;
      var existingRow = dbMap[uniqueKey];

      if (existingRow) {
        if (item.kqLoai) {
          var mappedKq = mapKetQua(item.kqLoai);
          var newRes = mappedKq + "\n" + (item.kqSo || '---') + "\n" + (item.kqNgay || LibDate.toVNString(new Date()));
          if (newRes !== existingRow.currentRes) {
            sheetAn.getRange(existingRow.index, 13).setValue(newRes);
            sheetAn.getRange(existingRow.index, 7).setValue("Đã giải quyết");
            updated++;
          } else { skipped++; }
        } else { skipped++; }
      } else {
        var finalLoaiAn = mapLoaiAn(item.loaiAn);
        var fullSoTL = buildFullCaseNumber(item.soTL, finalLoaiAn, exNgayObj);
        var hanGQ = DeadlineEngine.calculate(exNgayObj, finalLoaiAn, false);
        var ketQua = "";
        if (item.kqLoai) { ketQua = mapKetQua(item.kqLoai) + "\n" + (item.kqSo || '---') + "\n" + (item.kqNgay || LibDate.toVNString(new Date())); }
        
        var trangThai = ketQua ? "Đã giải quyết" : "Đang giải quyết";
        var idAn = generateId("AN");

        rowsToAppend.push([
          idAn, fullSoTL, exNgayObj, finalLoaiAn, normalizeLegalText(item.quanHe),
          hanGQ, trangThai, "", "", "Chưa xong", ketQua ? "Chưa đăng" : "", new Date(), ketQua, "TAKV2"
        ]);

        var tuCachND = "Nguyên đơn"; var tuCachBD = "Bị đơn";
        if (finalLoaiAn.includes("Hình sự")) { tuCachND = "Người bị hại"; tuCachBD = "Bị cáo"; }
        else if (finalLoaiAn.includes("Hành chính")) { tuCachND = "Người khởi kiện"; tuCachBD = "Người bị kiện"; }
        else if (finalLoaiAn.includes("Hòa giải")) { tuCachND = "Người yêu cầu"; tuCachBD = "Người bị yêu cầu"; }

        if (item.nd) dsToAppend.push([idAn, tuCachND, "Ông/Bà", item.nd.toUpperCase(), "", "", "", "", ""]);
        if (item.bd) dsToAppend.push([idAn, tuCachBD, "Ông/Bà", item.bd.toUpperCase(), "", "", "", "", ""]);

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
    if (dsToAppend.length > 0) sheetDS.getRange(sheetDS.getLastRow() + 1, 1, dsToAppend.length, 9).setValues(dsToAppend);
   
    return { success: true, imported: imported, skipped: skipped, updated: updated };
  } catch (e) { return { success: false, error: "Lỗi đồng bộ: " + e.toString() }; }
}

function backend_DeleteCase(idVuAn) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var idTarget = idVuAn.toString().trim();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    
    // Tối ưu tìm index bằng mảng 1D
    var ids = sheetAn.getRange("A:A").getValues().flat();
    var rowIndex = ids.indexOf(idTarget);
    
    if (rowIndex === -1) return { success: false, error: "Không tìm thấy vụ án để xóa." };
    rowIndex += 1; // Mảng bắt đầu từ 0, sheet bắt đầu từ 1

    var folderUrl = sheetAn.getRange(rowIndex, 8).getValue();
    if (folderUrl && folderUrl.includes("http")) {
      try { DriveApp.getFolderById(extractFolderId(folderUrl)).setTrashed(true); } catch (e) {}
    }

    sheetAn.deleteRow(rowIndex);
    
    // Xóa dữ liệu liên quan ở các sheet khác
    ["2_DuongSu", "3_LichTrinh", "4_NhatKy"].forEach(sName => {
      var sheet = ss.getSheetByName(sName);
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        var colID = (sName === "3_LichTrinh") ? 1 : 0;
        for (var k = data.length - 1; k >= 1; k--) {
          if (data[k][colID] && data[k][colID].toString().trim() === idTarget) sheet.deleteRow(k + 1);
        }
      }
    });
    return { success: true };
  } catch (e) { return { success: false, error: "Lỗi xóa sạch: " + e.toString() }; }
}

function backend_DeleteMultipleCases(ids) {
  try {
    if (!ids || ids.length === 0) return { success: true };
    var idSet = new Set(ids); // Dùng Set để tìm kiếm cực nhanh
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var dataAn = sheetAn.getDataRange().getValues();
   
    var foldersToTrash = [];
    var rowsToDelete = [];

    for (var i = 1; i < dataAn.length; i++) {
      var id = dataAn[i][0] ? dataAn[i][0].toString().trim() : "";
      if (idSet.has(id)) {
        if (dataAn[i][7]) foldersToTrash.push(dataAn[i][7]);
        rowsToDelete.push(i + 1);
      }
    }

    // Xóa Drive song song lỗi không làm crash
    foldersToTrash.forEach(url => { try { if (url && url.includes("http")) DriveApp.getFolderById(extractFolderId(url)).setTrashed(true); } catch (e) {} });

    // Xóa từ dưới lên trên để không bị lệch index
    rowsToDelete.sort((a, b) => b - a).forEach(rowIdx => { sheetAn.deleteRow(rowIdx); });
    
    ["2_DuongSu", "3_LichTrinh", "4_NhatKy"].forEach(sName => {
      var sheet = ss.getSheetByName(sName);
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        var colID = (sName === "3_LichTrinh") ? 1 : 0;
        for (var k = data.length - 1; k >= 1; k--) {
          var idVal = data[k][colID] ? data[k][colID].toString().trim() : "";
          if (idSet.has(idVal)) sheet.deleteRow(k + 1);
        }
      }
    });
    return { success: true };
  } catch (e) { return { success: false, error: "Lỗi xóa hàng loạt: " + e.toString() }; }
}

function backend_UpdateCaseResolution(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var ids = sheet.getRange("A:A").getValues().flat();
    var rowIndex = ids.indexOf(data.idVuAn);
    
    if (rowIndex === -1) return { success: false, error: "Không tìm thấy hồ sơ." };
    rowIndex += 1;
    
    var resString = data.resultType === "CLEAR" ? "" : (data.resultType + "\n" + (data.resultNo || "---") + "\n" + LibDate.toVNString(data.resultDate));
    var loaiAn = sheet.getRange(rowIndex, 4).getValue(); // Cột 4 là Loại Án
    var tThai = "Đang giải quyết";
    var newHanGQ = null;

    if (data.resultType !== "CLEAR") {
       if (data.resultType === "Tạm đình chỉ") {
         tThai = "Tạm đình chỉ";
       } else if (data.resultType === "Gia hạn") {
         tThai = "Đang giải quyết";
         resString = ""; 
         var currentHan = new Date(sheet.getRange(rowIndex, 6).getValue());
         newHanGQ = DeadlineEngine.calculate(currentHan, loaiAn, true);
       } else if (data.resultType === "Tiếp tục giải quyết") {
         tThai = "Đang giải quyết";
         resString = ""; 
         var qdDate = LibDate.parse(data.resultDate) || new Date();
         newHanGQ = DeadlineEngine.calculate(qdDate, loaiAn, false);
       } else {
         tThai = "Đã giải quyết";
       }
    }

    if (newHanGQ) sheet.getRange(rowIndex, 6).setValue(newHanGQ);
    sheet.getRange(rowIndex, 7).setValue(tThai);
    sheet.getRange(rowIndex, 13).setValue(resString);
    capNhatNgayTacDong(data.idVuAn);
    
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

// ============================================================
// [TỐI ƯU 2] BATCH UPDATE ĐƯƠNG SỰ (XÓA CHẬM BẰNG GHI NHANH)
// ============================================================
function backend_UpdateAllParties(idVuAn, parties) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    var data = sheet.getDataRange().getValues();
    var idTarget = idVuAn.toString().trim();
    
    var newData = [data[0]]; // Giữ lại tiêu đề
    // Lọc bỏ đương sự của vụ án này (giữ lại án khác)
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() !== idTarget) {
        newData.push(data[i]);
      }
    }
    
    // Nối đương sự mới vào
    parties.forEach(p => {
      newData.push([
        idTarget, p.tuCach, p.xungHo || "Ông/Bà", toTitleCase(p.hoTen), p.namSinh || "", 
        p.diaChi || "", formatPhoneNumber(p.sdt), p.cccd || "", p.daiDien || ""
      ]);
    });
    
    // Xóa nội dung và ghi lại 1 lần (Siêu nhanh)
    sheet.clearContents();
    sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    
    capNhatNgayTacDong(idTarget);
    return { success: true };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function backend_CapNhatThongTinAn(d) {
  try {
    var sheetAn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var ids = sheetAn.getRange("A:A").getValues().flat();
    var rowIndex = ids.indexOf(d.idAn);
    
    if (rowIndex > -1) {
      rowIndex += 1;
      var n = LibDate.parse(d.ngayTL);
      var f = buildFullCaseNumber(d.soTL, d.loaiAn, n);
      var h = DeadlineEngine.calculate(n, d.loaiAn, false);
      sheetAn.getRange(rowIndex, 2, 1, 5).setValues([[f, n, d.loaiAn, normalizeLegalText(d.quanHe), h]]);
      capNhatNgayTacDong(d.idAn);
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy ID" };
  } catch (e) { return { success: false, error: e.message }; }
}

function backend_UpdateSystemStatus(idVuAn, type) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var ids = sheet.getRange("A:A").getValues().flat();
    var rowIndex = ids.indexOf(idVuAn);
    if (rowIndex > -1) {
      if (type === 'QLTA') sheet.getRange(rowIndex + 1, 10).setValue('Xong');
      if (type === 'CONGBO') sheet.getRange(rowIndex + 1, 11).setValue('Đã đăng');
      return { success: true };
    }
    return { success: false, error: "Lỗi ID" };
  } catch(e) { return { success: false, error: "Lỗi" }; }
}

// ============================================================
// [TỐI ƯU 3] CHỈ ĐỌC 1 CỘT BẰNG FLAT()
// ============================================================
function capNhatNgayTacDong(idVuAn) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var ids = sheet.getRange("A:A").getValues().flat(); 
    var rowIndex = ids.indexOf(idVuAn);
    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 12).setValue(new Date()); 
    }
  } catch (e) {}
}

function backendLuuDuongSuLe(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    sheet.appendRow([data.idVuAn, data.tuCach, data.xungHo, toTitleCase(data.hoTen), data.namSinh, data.diaChi, formatPhoneNumber(data.sdt), data.cccd, data.daiDien || ""]);
    capNhatNgayTacDong(data.idVuAn);
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function backendUpdateDuongSu(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    var values = sheet.getDataRange().getValues();
    var targetName = data.oldName.toString().trim().toLowerCase();
    for(var i = 1; i < values.length; i++) {
      if(values[i][0] == data.idVuAn && values[i][3].toString().trim().toLowerCase() == targetName) {
         sheet.getRange(i+1, 2, 1, 8).setValues([[data.tuCach, data.xungHo, toTitleCase(data.hoTen), data.namSinh, data.diaChi, formatPhoneNumber(data.sdt), data.cccd, data.daiDien || ""]]);
        capNhatNgayTacDong(data.idVuAn);
        return { success: true };
      }
    }
    return { success: false, error: "Lỗi không tìm thấy đương sự" };
  } catch (e) { return { success: false, error: e.message }; }
}

function backend_DeleteParty(idVuAn, hoTen, tuCach) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2_DuongSu");
    var data = sheet.getDataRange().getValues();
   
    var idTarget = idVuAn.toString().trim();
    var nameTarget = hoTen.toString().trim(); 
    var roleTarget = tuCach.toString().trim();

    for (var i = data.length - 1; i >= 1; i--) {
      var rowId = data[i][0] ? data[i][0].toString().trim() : "";
      var rowName = data[i][3] ? data[i][3].toString().trim() : "";
      var rowRole = data[i][1] ? data[i][1].toString().trim() : "";

      if (rowId === idTarget && rowName === nameTarget && rowRole === roleTarget) {
        sheet.deleteRow(i + 1);
        capNhatNgayTacDong(idTarget);
        return { success: true };
      }
    }
    return { success: false, error: `Không tìm thấy đương sự để xóa.` };
  } catch (e) { return { success: false, error: e.message }; }
}

function backend_UpdateQuickNote(idVuAn, note) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("1_SoThuLy");
    var ids = sheet.getRange("A:A").getValues().flat();
    var rowIndex = ids.indexOf(idVuAn);
    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 9).setValue(note);
      capNhatNgayTacDong(idVuAn);
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy hồ sơ." };
  } catch (e) { return { success: false, error: e.message }; }
}

function ghiNhatKy(idVuAn, suKien, chiTiet) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("4_NhatKy");
    if (sheet) sheet.appendRow([idVuAn, new Date(), suKien, chiTiet]);
  } catch(e) {}
}