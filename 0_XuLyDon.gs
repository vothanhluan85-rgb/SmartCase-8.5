/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MODULE XỬ LÝ ĐƠN (MASTER BACKEND)
 * TỆP: 0_XuLyDon.gs - CƠ SỞ DỮ LIỆU ĐƠN, BẢO VỆ CSDL & ĐỒNG BỘ AN TOÀN
 * -------------------------------------------------------------------------
 * - ĐÃ NÂNG CẤP HOÀN THIỆN:
 *   + NGUYÊN TẮC BẤT KHẢ XÂM PHẠM: Bảo toàn 100% dữ liệu đơn đã có trên hệ thống.
 *   + Cơ chế đồng bộ Excel INSERT-ONLY: Chỉ nạp thêm đơn mới, KHÔNG BAO GIỜ xóa trắng.
 *   + Tự động suy luận danh xưng (Ông/Bà) cho đương sự nếu dữ liệu gốc bị khuyết.
 *   + Chuẩn hóa rút trích đơn sang thụ lý và phân nhóm đương sự chính xác.
 * =========================================================================
 */

var DON_CONFIG = {
  START_DATE_TS: 0 // Thả nổi mốc thời gian mặc định
};

// =========================================================================
// 1. TIỆN ÍCH SUY LUẬN DANH XƯNG & CHUẨN HÓA DỮ LIỆU ĐƠN
// =========================================================================

function don_detectHonorific(name, currentXh) {
  var xh = String(currentXh || "").trim();
  if (xh === "Ông" || xh === "Bà" || xh === "Anh" || xh === "Chị") return xh;
  if (xh === "Tổ chức" || xh === "Pháp nhân") return "Tổ chức";

  var nLower = String(name || "").toLowerCase().trim();
  if (!nLower) return "Ông/Bà";

  // Dấu hiệu Nữ giới
  if (nLower.includes(" thị ") || nLower.startsWith("thị ") || nLower.includes("thị") ||
      nLower.includes("thúy") || nLower.includes("thuy") || nLower.includes("trang") ||
      nLower.includes("nhị") || nLower.includes("hằng") || nLower.includes("nga") ||
      nLower.includes("hoa") || nLower.includes("hương") || nLower.includes("lan") ||
      nLower.includes("mai") || nLower.includes("cúc") || nLower.includes("ngọc") ||
      nLower.includes("liên") || nLower.includes("loan") || nLower.includes("phượng")) {
    return "Bà";
  }

  // Dấu hiệu Nam giới
  if (nLower.includes(" văn ") || nLower.startsWith("văn ") || nLower.includes("văn") ||
      nLower.includes("hùng") || nLower.includes("thắng") || nLower.includes("thân") ||
      nLower.includes("dũng") || nLower.includes("tuấn") || nLower.includes("minh") ||
      nLower.includes("cường") || nLower.includes("hoàng") || nLower.includes("long") ||
      nLower.includes("trọng") || nLower.includes("đức") || nLower.includes("hải")) {
    return "Ông";
  }

  return "Ông/Bà";
}

function getJudgeByDay(dateObj) {
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return 'Chưa phân công';
  var day = dateObj.getDay(); // 0:CN, 1:T2, 2:T3, 3:T4, 4:T5, 5:T6, 6:T7
  if (day === 1) return 'Phạm Thị Kim Duyên';
  if (day === 2 || day === 3) return 'Võ Thành Luân';
  if (day === 4 || day === 5) return 'Đặng Thị Hạnh';
  return 'Chưa phân công';
}

// =========================================================================
// 2. TRUY VẤN TỔNG HỢP DỮ LIỆU ĐƠN SIÊU TỐC (THẢ NỔI THỜI GIAN)
// =========================================================================

function logic_LayDanhSachDon(clientStartTs, clientEndTs) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    var sheetDS = ss.getSheetByName("0_DuongSuDon");

    if (!sheetDon || sheetDon.getLastRow() < 2) return [];

    var startLimit = clientStartTs ? parseInt(clientStartTs, 10) : 0;
    var endLimit = clientEndTs ? parseInt(clientEndTs, 10) : Infinity;

    var dataDon = sheetDon.getDataRange().getValues();
    var dataDS = sheetDS && sheetDS.getLastRow() > 1 ? sheetDS.getDataRange().getValues() : [];

    var dsMap = {};
    for (var i = 1; i < dataDS.length; i++) {
      var idDon = String(dataDS[i][0] || "").trim();
      if (!idDon) continue;
      if (!dsMap[idDon]) dsMap[idDon] = { nkk: [], nbk: [], detail: [] };

      var tuCach = String(dataDS[i][1] || "").toLowerCase();
      var ten = String(dataDS[i][3] || "").trim();
      var rawXh = String(dataDS[i][2] || "").trim();
      var xhChuan = don_detectHonorific(ten, rawXh);

      if (tuCach.includes('khởi kiện') || tuCach.includes('yêu cầu') || tuCach.includes('bị hại') || tuCach.includes('nguyên đơn')) {
        if (!tuCach.includes('bị yêu cầu')) dsMap[idDon].nkk.push(ten);
        else dsMap[idDon].nbk.push(ten);
      } else if (tuCach.includes('bị kiện') || tuCach.includes('bị cáo') || tuCach.includes('bị yêu cầu') || tuCach.includes('bị đơn')) {
        dsMap[idDon].nbk.push(ten);
      }

      dsMap[idDon].detail.push({
        tuCach: String(dataDS[i][1] || "Người khởi kiện"),
        xungHo: xhChuan,
        hoTen: ten,
        namSinh: String(dataDS[i][4] || "").replace(/^'/, ""),
        diaChi: String(dataDS[i][5] || ""),
        sdt: String(dataDS[i][6] || "").replace(/^'/, ""),
        cccd: String(dataDS[i][7] || "").replace(/^'/, ""),
        daiDien: String(dataDS[i][8] || "")
      });
    }

    var result = [];
    for (var j = dataDon.length - 1; j >= 1; j--) {
      var id = String(dataDon[j][0] || "").trim();
      if (!id) continue;

      var pDate = dataDon[j][2];
      var rawTime = (pDate instanceof Date) ? pDate.getTime() : (LibDate.parse(pDate) ? LibDate.parse(pDate).getTime() : 0);
      
      if (startLimit > 0 && rawTime > 0 && rawTime < startLimit) continue;
      if (endLimit !== Infinity && rawTime > 0 && rawTime > endLimit) continue;

      var dsInfo = dsMap[id] || { nkk: [], nbk: [], detail: [] };
      var ngayVn = "";
      if (pDate instanceof Date) {
        ngayVn = ("0" + pDate.getDate()).slice(-2) + "/" + ("0" + (pDate.getMonth() + 1)).slice(-2) + "/" + pDate.getFullYear();
      } else if (pDate) {
        ngayVn = LibDate.fmt(pDate, 'VN');
      }

      result.push({
        id: id,
        soDon: String(dataDon[j][1] || ""),
        ngayNhan: ngayVn,
        rawDate: rawTime,
        loaiAn: String(dataDon[j][3] || "2. Dân sự"),
        quanHe: String(dataDon[j][4] || ""),
        giaTri: String(dataDon[j][5] || ""),
        huongXuLy: String(dataDon[j][6] || "Chưa xử lý"),
        thamPhan: String(dataDon[j][7] || "Chưa phân công"),
        tamUng: String(dataDon[j][8] || ""),
        trangThai: String(dataDon[j][9] || "Chưa xử lý"),
        ghiChu: String(dataDon[j][10] || ""),
        nguoiKhoiKien: dsInfo.nkk.join(', '),
        nguoiBiKien: dsInfo.nbk.join(', '),
        chiTietDuongSu: dsInfo.detail
      });
    }

    return result;
  } catch (e) { 
    return { error: e.toString() }; 
  }
}

function api_LayDanhSachDon(clientStartTs, clientEndTs) {
  return logic_LayDanhSachDon(clientStartTs, clientEndTs);
}

// =========================================================================
// 3. BỘ CHUYỂN ĐỔI (TRANSFORMER): RÚT TRÍCH ĐƠN SANG THỤ LÝ
// =========================================================================

function logic_RutTrichThongTinDon(soDon) {
  if (!soDon) return { error: "Vui lòng cung cấp số đơn cần rút trích." };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    var sheetDS = ss.getSheetByName("0_DuongSuDon");
    if (!sheetDon) return { error: "Không tìm thấy Sổ nhận đơn (0_SoNhanDon)." };

    var searchRaw = String(soDon).trim().toLowerCase();
    var cleanSearchNo = searchRaw.split('/')[0].trim();

    var dataDon = sheetDon.getDataRange().getValues();
    var foundRow = null;

    for (var i = 1; i < dataDon.length; i++) {
      var currentSoDon = String(dataDon[i][1] || "").trim().toLowerCase();
      var cleanCurrentNo = currentSoDon.split('/')[0].trim();
      
      if (cleanCurrentNo === cleanSearchNo || currentSoDon === searchRaw || currentSoDon.startsWith(cleanSearchNo + "/")) {
        foundRow = dataDon[i];
        break;
      }
    }

    if (!foundRow) return { error: `Không tìm thấy đơn có số "${soDon}" trong Sổ nhận đơn.` };

    var idDon = String(foundRow[0] || "").trim();
    var loaiAn = String(foundRow[3] || "2. Dân sự");
    var quanHe = String(foundRow[4] || "");
    var giaTri = String(foundRow[5] || "");
    var tamUng = String(foundRow[8] || "");
    var ghiChu = String(foundRow[10] || "");

    var isThuanTinhLyHon = loaiAn.includes("Hôn nhân") && (quanHe.toLowerCase().includes("thuận tình") || quanHe.toLowerCase().includes("thuan tinh"));

    var dataDS = sheetDS && sheetDS.getLastRow() > 1 ? sheetDS.getDataRange().getValues() : [];
    var transformedDS = [];

    for (var j = 1; j < dataDS.length; j++) {
      if (String(dataDS[j][0] || "").trim() === idDon) {
        var rawTuCach = String(dataDS[j][1] || "").trim();
        var tLower = rawTuCach.toLowerCase();
        var newTuCach = "Nguyên đơn";
        var rawName = String(dataDS[j][3] || "").trim();
        var rawXh = String(dataDS[j][2] || "").trim();

        // 1. Thuận tình ly hôn (VHN): Mặc định là Người yêu cầu
        if (isThuanTinhLyHon) {
          if (tLower.includes("liên quan")) {
            newTuCach = "Người có quyền lợi, nghĩa vụ liên quan";
          } else {
            newTuCach = "Người yêu cầu";
          }
        } 
        // 2. Án Hành chính
        else if (loaiAn.includes("Hành chính")) {
          if (tLower.includes("khởi kiện") || tLower.includes("nguyên đơn") || tLower.includes("yêu cầu")) newTuCach = "Người khởi kiện";
          else if (tLower.includes("bị kiện") || tLower.includes("bị đơn")) newTuCach = "Người bị kiện";
          else newTuCach = "Người có quyền lợi, nghĩa vụ liên quan";
        } 
        // 3. Án Hình sự
        else if (loaiAn.includes("Hình sự")) {
          if (tLower.includes("khởi kiện") || tLower.includes("bị hại") || tLower.includes("tố giác")) newTuCach = "Người bị hại";
          else if (tLower.includes("bị kiện") || tLower.includes("bị cáo")) newTuCach = "Bị cáo";
          else newTuCach = "Người có quyền lợi, nghĩa vụ liên quan";
        } 
        // 4. Hòa giải đối thoại hoặc Việc dân sự
        else if (loaiAn.includes("Hòa giải") || loaiAn.includes("Việc")) {
          if (tLower.includes("khởi kiện") || tLower.includes("yêu cầu") || tLower.includes("nguyên đơn")) newTuCach = "Người yêu cầu";
          else if (tLower.includes("bị kiện") || tLower.includes("bị yêu cầu") || tLower.includes("bị đơn")) newTuCach = "Người bị yêu cầu";
          else newTuCach = "Người có quyền lợi, nghĩa vụ liên quan";
        } 
        // 5. Tranh chấp Dân sự, KDTM, Lao động
        else {
          if (tLower.includes("khởi kiện") || tLower.includes("yêu cầu") || tLower.includes("nguyên đơn")) newTuCach = "Nguyên đơn";
          else if (tLower.includes("bị kiện") || tLower.includes("bị đơn")) newTuCach = "Bị đơn";
          else newTuCach = "Người có quyền lợi, nghĩa vụ liên quan";
        }

        transformedDS.push({
          tuCach: newTuCach,
          xungHo: don_detectHonorific(rawName, rawXh),
          hoTen: toTitleCase(cleanHonorificFromName(rawName)),
          namSinh: String(dataDS[j][4] || "").replace(/^'/, "").trim(),
          diaChi: String(dataDS[j][5] || "").trim(),
          sdt: String(dataDS[j][6] || "").replace(/^'/, "").trim(),
          cccd: String(dataDS[j][7] || "").replace(/^'/, "").trim(),
          daiDien: String(dataDS[j][8] || "").trim()
        });
      }
    }

    return {
      success: true,
      idDon: idDon,
      info: {
        soDon: String(foundRow[1] || ""),
        ngayNhan: LibDate.fmt(foundRow[2], 'VN'),
        loaiAn: loaiAn,
        quanHe: quanHe,
        giaTri: giaTri,
        tamUng: tamUng,
        ghiChu: ghiChu
      },
      ds: transformedDS
    };
  } catch (e) {
    return { error: "Lỗi rút trích đơn: " + e.toString() };
  }
}

function api_RutTrichThongTinDon(soDon) {
  return logic_RutTrichThongTinDon(soDon);
}

// =========================================================================
// 4. ĐỒNG BỘ EXCEL AN TOÀN (CƠ CHẾ INSERT-ONLY: BẢO TOÀN 100% CSDL HIỆN CÓ)
// =========================================================================

function logic_DongBoDonTuExcel() {
  var tempFileId = null;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var excelId = extractFolderId(config["ID_EXCEL_DON"]);
    if (!excelId) throw new Error("Chưa cấu hình ID File Excel Sổ đơn gốc trong Cài đặt.");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    var sheetDS = ss.getSheetByName("0_DuongSuDon");

    if (!sheetDon) throw new Error("Không tìm thấy bảng 0_SoNhanDon.");

    // 1. Quét toàn bộ SỐ ĐƠN hiện đã có trên hệ thống vào HashSet (BẢO VỆ DỮ LIỆU)
    var currentDonData = sheetDon.getDataRange().getValues();
    var existingSoDonSet = new Set();

    for (var i = 1; i < currentDonData.length; i++) {
      var rawSo = String(currentDonData[i][1] || "").trim().toLowerCase();
      if (rawSo) {
        var cleanNo = rawSo.split('/')[0].trim();
        existingSoDonSet.add(cleanNo);
        existingSoDonSet.add(rawSo);
      }
    }

    // 2. Chuyển đổi file Excel sang Google Sheets tạm thời trong bộ nhớ Drive
    var excelFile = DriveApp.getFileById(excelId);
    var newFile = Drive.Files.create({ name: "[TEMP] " + excelFile.getName(), mimeType: MimeType.GOOGLE_SHEETS }, excelFile.getBlob());
    tempFileId = newFile.id;
    var sourceSS = SpreadsheetApp.openById(tempFileId);
    var allSheets = sourceSS.getSheets();

    var today = new Date();
    today.setHours(23, 59, 59, 999);

    var newDonRows = [];
    var newDSRows = [];
    var addedCount = 0;

    // 3. Quét các sheet Excel chỉ để lấy ĐƠN MỚI CHƯA TỪNG CÓ TRÊN HỆ THỐNG
    allSheets.forEach(function (sSheet) {
      var sheetName = sSheet.getName().trim();
      if (sheetName !== "1.7.25" && !sheetName.startsWith("Năm ")) return;

      var sData = sSheet.getDataRange().getValues();
      if (sData.length < 2) return;

      var lastKnownSoDon = "";
      var lastKnownNgayNhan = null;

      for (var j = 1; j < sData.length; j++) {
        var row = sData[j];
        var checkHeader = String(row[0] || "").toLowerCase().trim();
        if (checkHeader.includes("stt") || checkHeader.includes("số")) continue;

        var rawSoDon = String(row[0] || "").trim();
        var rawNgay = row[1];
        var rawNguoiNop = String(row[3] || "").trim();
        var rawNoiDung = String(row[4] || "").trim();

        if (!rawSoDon && !rawNguoiNop) continue;

        if (!rawSoDon) rawSoDon = lastKnownSoDon; else lastKnownSoDon = rawSoDon;
        var ngayObj = LibDate.parse(rawNgay);
        if (!rawNgay || !ngayObj || isNaN(ngayObj.getTime())) ngayObj = lastKnownNgayNhan;
        else lastKnownNgayNhan = ngayObj;

        if (!rawSoDon || !ngayObj || isNaN(ngayObj.getTime())) continue;
        if (ngayObj > today) ngayObj = new Date();
        if (!rawNguoiNop) continue;

        // KIỂM TRA: NẾU ĐƠN NÀY ĐÃ TỒN TẠI TRÊN HỆ THỐNG -> BỎ QUA NGAY (BẢO TOÀN 100% DỮ LIỆU CŨ)
        var cleanCheckNo = rawSoDon.split('/')[0].trim().toLowerCase();
        if (existingSoDonSet.has(cleanCheckNo) || existingSoDonSet.has(rawSoDon.toLowerCase())) {
          continue;
        }

        // Đánh dấu để chống trùng lặp ngay trong các dòng của file Excel
        existingSoDonSet.add(cleanCheckNo);
        existingSoDonSet.add(rawSoDon.toLowerCase());

        // Phân loại ngành án từ file Excel
        var phanLoaiExcel = "2. Dân sự";
        if (String(row[5] || "").trim() !== "") phanLoaiExcel = "1. Hình sự";
        else if (String(row[6] || "").trim() !== "") phanLoaiExcel = "2. Dân sự";
        else if (String(row[7] || "").trim() !== "") phanLoaiExcel = "3. Hôn nhân";
        else if (String(row[8] || "").trim() !== "") phanLoaiExcel = "4. Kinh doanh";
        else if (String(row[9] || "").trim() !== "") phanLoaiExcel = "5. Lao động";
        else if (String(row[10] || "").trim() !== "") phanLoaiExcel = "6. Hành chính";
        else if (String(row[11] || "").trim() !== "") phanLoaiExcel = "7. Việc dân sự";
        else if (String(row[12] || "").trim() !== "") phanLoaiExcel = "8. Hòa giải đối thoại";

        var quanHe = rawNoiDung;
        var lines0 = rawNoiDung.split('\n').map(p => p.trim()).filter(p => p);
        if (lines0.length > 0) quanHe = lines0[0];
        if (quanHe.length > 200) quanHe = quanHe.substring(0, 197) + "...";

        var thamPhanAuto = getJudgeByDay(ngayObj);
        var idDonMoi = generateId("DON");

        newDonRows.push([
          idDonMoi, rawSoDon, ngayObj, phanLoaiExcel, quanHe, "", "Chưa xử lý", thamPhanAuto, "", "Chưa xử lý", "Đồng bộ từ Sổ gốc"
        ]);

        // Tách Người Khởi kiện mới
        var parts = rawNguoiNop.split(/,?\s*\n\s*,?|,\s*/).map(p => p.trim()).filter(p => p);
        var tenNKK = parts[0] || 'Chưa rõ';
        if (tenNKK && tenNKK !== 'Chưa rõ' && !tenNKK.includes("GMT")) {
          var cleanTenNKK = toTitleCase(cleanHonorificFromName(tenNKK));
          newDSRows.push([
            idDonMoi, "Người khởi kiện", don_detectHonorific(cleanTenNKK, "Ông/Bà"), cleanTenNKK, "", parts.slice(1).join(', '), "", "", ""
          ]);
        }

        // Tách Người Bị kiện mới
        var tenNBK = "";
        var lines = rawNoiDung.split('\n').map(p => p.trim()).filter(p => p);
        if (lines.length > 1) {
          var nbkLine = lines.find(l => l.toLowerCase().includes('bị kiện:') || l.toLowerCase().includes('bị cáo:') || l.toLowerCase().includes('yêu cầu:'));
          if (nbkLine) tenNBK = nbkLine.split(':')[1].trim();
          else tenNBK = lines[1];
        } else {
          var colonIdx = rawNoiDung.indexOf(':');
          if (colonIdx !== -1) tenNBK = rawNoiDung.substring(colonIdx + 1).trim();
        }

        if (tenNBK && !tenNBK.includes("GMT")) {
          var cleanTenNBK = toTitleCase(cleanHonorificFromName(tenNBK));
          newDSRows.push([
            idDonMoi, "Người bị kiện", don_detectHonorific(cleanTenNBK, "Ông/Bà"), cleanTenNBK, "", "", "", "", ""
          ]);
        }

        addedCount++;
      }
    });

    // 4. CHỈ GHI NỐI TIẾP VÀO CUỐI BẢNG (TUYỆT ĐỐI KHÔNG CLEAR CONTENT BẢNG CŨ)
    if (newDonRows.length > 0) {
      sheetDon.getRange(sheetDon.getLastRow() + 1, 1, newDonRows.length, 11).setValues(newDonRows);
    }
    if (sheetDS && newDSRows.length > 0) {
      sheetDS.getRange(sheetDS.getLastRow() + 1, 1, newDSRows.length, 9).setValues(newDSRows);
    }

    SpreadsheetApp.flush();
    return { success: true, count: addedCount, message: `Đã nạp thêm ${addedCount} đơn mới vào CSDL. Toàn bộ đơn cũ được bảo toàn 100%.` };

  } catch (e) { 
    return { success: false, error: e.toString() }; 
  } finally {
    lock.releaseLock();
    if (tempFileId) try { Drive.Files.remove(tempFileId); } catch (e) { }
  }
}

function api_DongBoDonTuExcel() {
  return logic_DongBoDonTuExcel();
}

// =========================================================================
// 5. LƯU & XÓA ĐƠN (CRUD OPERATIONS BẢO TOÀN ID)
// =========================================================================

function logic_LuuThongTinDon(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    var sheetDS = ss.getSheetByName("0_DuongSuDon");
    var idDon = payload.info.id;
    var huongXL = payload.info.huongXuLy || payload.info.trangThai || "Chưa xử lý";

    if (idDon && !idDon.includes("TEMP_")) {
      var finderDon = sheetDon.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findNext();
      if (finderDon) {
        sheetDon.getRange(finderDon.getRow(), 2, 1, 10).setValues([[
          payload.info.soDon, 
          LibDate.parse(payload.info.ngayNhan), 
          payload.info.loaiAn, 
          payload.info.quanHe, 
          payload.info.giaTri,
          huongXL, 
          payload.info.thamPhan, 
          payload.info.tamUng, 
          payload.info.trangThai, 
          payload.info.ghiChu
        ]]);
      } else {
        idDon = generateId("DON");
        sheetDon.appendRow([
          idDon, payload.info.soDon, LibDate.parse(payload.info.ngayNhan), payload.info.loaiAn, 
          payload.info.quanHe, payload.info.giaTri, huongXL, payload.info.thamPhan, 
          payload.info.tamUng, payload.info.trangThai, payload.info.ghiChu
        ]);
      }
    } else {
      idDon = generateId("DON");
      sheetDon.appendRow([
        idDon, payload.info.soDon, LibDate.parse(payload.info.ngayNhan), payload.info.loaiAn, 
        payload.info.quanHe, payload.info.giaTri, huongXL, payload.info.thamPhan, 
        payload.info.tamUng, payload.info.trangThai, payload.info.ghiChu
      ]);
    }

    if (sheetDS) {
      var dsRanges = sheetDS.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findAll();
      for (var i = dsRanges.length - 1; i >= 0; i--) {
        sheetDS.deleteRow(dsRanges[i].getRow());
      }

      if (payload.ds && payload.ds.length > 0) {
        var newDSRows = [];
        payload.ds.forEach(d => {
          var cleanName = toTitleCase(cleanHonorificFromName(d.hoTen));
          var xh = don_detectHonorific(cleanName, d.xungHo);
          newDSRows.push([
            idDon, 
            d.tuCach, 
            xh, 
            cleanName, 
            "'" + d.namSinh, 
            d.diaChi, 
            "'" + d.sdt, 
            "'" + d.cccd, 
            d.daiDien || ""
          ]);
        });
        sheetDS.getRange(sheetDS.getLastRow() + 1, 1, newDSRows.length, 9).setValues(newDSRows);
      }
    }

    SpreadsheetApp.flush();
    return { success: true, idDon: idDon };
  } catch (e) { 
    return { success: false, error: e.toString() }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function api_LuuThongTinDon(payload) {
  return logic_LuuThongTinDon(payload);
}

function logic_LuuNhieuDon_Bulk(payloads) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    var sheetDS = ss.getSheetByName("0_DuongSuDon");
    var newDSRows = [];

    payloads.forEach(payload => {
      var idDon = payload.info.id;
      var huongXL = payload.info.huongXuLy || payload.info.trangThai || "Chưa xử lý";

      if (idDon && !idDon.includes("TEMP_")) {
        var finder = sheetDon.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findNext();
        if (finder) {
          sheetDon.getRange(finder.getRow(), 2, 1, 10).setValues([[
            payload.info.soDon, LibDate.parse(payload.info.ngayNhan), payload.info.loaiAn, payload.info.quanHe, payload.info.giaTri,
            huongXL, payload.info.thamPhan, payload.info.tamUng, payload.info.trangThai, payload.info.ghiChu
          ]]);
        }
        if (sheetDS) {
          var dsRanges = sheetDS.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findAll();
          for (var i = dsRanges.length - 1; i >= 0; i--) {
            sheetDS.deleteRow(dsRanges[i].getRow());
          }
        }
      }
      if (payload.ds && payload.ds.length > 0) {
        payload.ds.forEach(d => {
          var cleanName = toTitleCase(cleanHonorificFromName(d.hoTen));
          var xh = don_detectHonorific(cleanName, d.xungHo);
          newDSRows.push([
            idDon, 
            d.tuCach, 
            xh, 
            cleanName, 
            "'" + d.namSinh, 
            d.diaChi, 
            "'" + d.sdt, 
            "'" + d.cccd, 
            d.daiDien || ""
          ]);
        });
      }
    });

    if (sheetDS && newDSRows.length > 0) sheetDS.getRange(sheetDS.getLastRow() + 1, 1, newDSRows.length, 9).setValues(newDSRows);
    SpreadsheetApp.flush();
    return { success: true };
  } catch (e) { 
    return { success: false, error: e.toString() }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function api_LuuNhieuDon_Bulk(payloads) {
  return logic_LuuNhieuDon_Bulk(payloads);
}

function logic_XoaDon(idDon) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    var sheetDS = ss.getSheetByName("0_DuongSuDon");

    var finder = sheetDon.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findNext();
    if (finder) {
      sheetDon.deleteRow(finder.getRow());
      if (sheetDS) {
        var dsRanges = sheetDS.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findAll();
        for (var i = dsRanges.length - 1; i >= 0; i--) sheetDS.deleteRow(dsRanges[i].getRow());
      }
      SpreadsheetApp.flush();
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy ID đơn." };
  } catch (e) { 
    return { success: false, error: e.toString() }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function api_XoaDon(idDon) {
  return logic_XoaDon(idDon);
}

function logic_XoaNhieuDon(ids) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (!ids || ids.length === 0) return { success: true };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");
    var sheetDS = ss.getSheetByName("0_DuongSuDon");

    var idSet = new Set(ids);
    var dataDon = sheetDon.getDataRange().getValues();
    var newDataDon = [dataDon[0]];
    for (var i = 1; i < dataDon.length; i++) {
      if (!idSet.has(String(dataDon[i][0]).trim())) newDataDon.push(dataDon[i]);
    }
    sheetDon.clearContents();
    if (newDataDon.length > 0) sheetDon.getRange(1, 1, newDataDon.length, newDataDon[0].length).setValues(newDataDon);

    if (sheetDS) {
      var dataDS = sheetDS.getDataRange().getValues();
      var newDataDS = [dataDS[0]];
      for (var j = 1; j < dataDS.length; j++) {
        if (!idSet.has(String(dataDS[j][0]).trim())) newDataDS.push(dataDS[j]);
      }
      sheetDS.clearContents();
      if (newDataDS.length > 0) sheetDS.getRange(1, 1, newDataDS.length, newDataDS[0].length).setValues(newDataDS);
    }

    SpreadsheetApp.flush();
    return { success: true };
  } catch (e) { 
    return { success: false, error: e.toString() }; 
  } finally { 
    lock.releaseLock(); 
  }
}

function api_XoaNhieuDon(ids) {
  return logic_XoaNhieuDon(ids);
}

// =========================================================================
// 6. TRỘN THƯ CHO ĐƠN & GỘP LUỒNG
// =========================================================================

function logic_TronThuChoDon_V2(payload) {
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var rootFolderId = extractFolderId(config["ID_THUMUC_DON"]);
    if (!rootFolderId) throw new Error("Chưa cấu hình ID Thư mục lưu Đơn.");

    var rootFolder = DriveApp.getFolderById(rootFolderId);
    var yearFolder;
    var currentYear = "Năm " + new Date().getFullYear();
    var yFolders = rootFolder.getFoldersByName(currentYear);
    if (yFolders.hasNext()) yearFolder = yFolders.next();
    else yearFolder = rootFolder.createFolder(currentYear);

    var cleanNo = payload.soDon ? payload.soDon.toString().split('/')[0].trim() : "";
    var folderName = `${cleanNo} - ${payload.firstNKKName}`;
    var subFolders = yearFolder.getFoldersByName(folderName);
    var caseFolder = subFolders.hasNext() ? subFolders.next() : yearFolder.createFolder(folderName);

    if (payload.trieuTapDate) {
      try { 
        api_LuuLichMoi_Logic({ 
          idVuAn: "GENERAL", 
          ngay: payload.trieuTapDate, 
          gio: payload.trieuTapTime || "08:00", 
          noiDung: `08h00 - Báo đơn ${cleanNo}\nMời: ${payload.firstNKKName}` 
        }); 
      } catch (e) {}
    }

    if (payload.newStatus) {
      var sheetDon = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("0_SoNhanDon");
      var finder = sheetDon.getRange("A:A").createTextFinder(payload.idDon).matchEntireCell(true).findNext();
      if (finder) {
        sheetDon.getRange(finder.getRow(), 7).setValue(payload.newStatus);
        sheetDon.getRange(finder.getRow(), 10).setValue(payload.newStatus);
      }
    }

    var createdFiles = [];
    var ph = payload.compiledPlaceholders || {};
    ph["{Thẩm phán}"] = config["TEN_THAM_PHAN"] || "..............................";
    ph["{Tòa án}"] = config["TEN_TOA_AN"] || "Tòa án nhân dân";
    ph["{Địa chỉ tòa án}"] = config["DIA_CHI_TOA"] || "Trụ sở Tòa án";

    payload.templateIds.forEach(templateId => {
      var templateFile = DriveApp.getFileById(templateId);
      var cleanDocName = templateFile.getName().replace(/\.(gdoc|docx|doc)$/i, "").trim();
      var expectedName = `${cleanDocName} - ${cleanNo}`;

      var existingFiles = caseFolder.getFilesByName(expectedName);
      while (existingFiles.hasNext()) existingFiles.next().setTrashed(true);

      var newFile = templateFile.makeCopy(expectedName, caseFolder);
      var doc = DocumentApp.openById(newFile.getId());
      var body = doc.getBody();

      var rawMatches = (body.getText().match(/\{[^\{\}\n\r]+\}/g) || []);
      var uniqueTokens = Array.from(new Set(rawMatches));

      uniqueTokens.forEach(function(tag) {
        var val = ph[tag];
        if (val === undefined) {
          var lowerTag = tag.toLowerCase();
          for (var k in ph) {
            if (k.toLowerCase() === lowerTag) {
              val = ph[k];
              break;
            }
          }
        }
        if (val !== undefined) {
          var safeStr = String(val).replace(/\$/g, '$$$$').trim();
          var innerKey = tag.replace(/[{}]/g, "").trim();
          try {
            body.replaceText("(?i)\\{\\s*" + escapeRegex(innerKey) + "\\s*\\}", safeStr);
          } catch(e) {
            body.replaceText(escapeRegex(tag), safeStr);
          }
        }
      });

      sanitizeMergedDocumentDon(body);
      doc.saveAndClose();

      createdFiles.push({ 
        name: newFile.getName(), 
        url: newFile.getUrl(),
        docxUrl: "https://docs.google.com/document/d/" + newFile.getId() + "/export?format=docx"
      });
    });

    return { success: true, files: createdFiles };
  } catch (e) { 
    return { success: false, error: e.toString() }; 
  }
}

function sanitizeMergedDocumentDon(body) {
  try {
    body.replaceText("ngày\\s+ngày\\s+", "ngày ");
    body.replaceText("ngày\\s+Ngày\\s+", "ngày ");
    body.replaceText("Ngày\\s+ngày\\s+", "Ngày ");

    body.replaceText(":\\s*[ \\t\\u00A0]{2,}", ": ");
    body.replaceText(":\\s*[ \\t\\u00A0]+", ": ");
    body.replaceText("[ \\t\\u00A0]{2,}", " ");
    body.replaceText("\\s+,", ",");
    body.replaceText("\\s+\\.", ".");
    body.replaceText("\\s+;", ";");

    body.replaceText(":\\s*ông\\s+", ": Ông ");
    body.replaceText(":\\s*bà\\s+", ": Bà ");
    body.replaceText(":\\s*anh\\s+", ": Anh ");
    body.replaceText(":\\s*chị\\s+", ": Chị ");

    body.replaceText("\\.\\s+ông\\s+", ". Ông ");
    body.replaceText("\\.\\s+bà\\s+", ". Bà ");
    body.replaceText("\\.\\s+anh\\s+", ". Anh ");
    body.replaceText("\\.\\s+ngày\\s+", ". Ngày ");

    body.replaceText("(?m)^-\\s*bà\\s+", "- Bà ");
    body.replaceText("(?m)^-\\s*ông\\s+", "- Ông ");

    body.replaceText(",\\s*sinh năm\\s*,", ",");
    body.replaceText(",\\s*sinh năm\\s*;", ";");
    body.replaceText(",\\s*sinh năm\\s*\\.", ".");
    body.replaceText(",\\s*địa chỉ:\\s*;", ";");
    body.replaceText("(?:;|,) và\\s*\\.", ".");
    body.replaceText("(?:;|,) và\\s*;", ";");
    body.replaceText("và\\s*\\.", ".");
    body.replaceText("\\(\\s*\\)", "");
    body.replaceText("(?i)\\{[^\\}]+\\}", "");

    var paragraphs = body.getParagraphs();
    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var text = p.getText();
      if (!text || text.length === 0) continue;

      if (text.startsWith(" ") || text.startsWith("\t")) {
        var numSpaces = 0;
        while (numSpaces < text.length && (text.charAt(numSpaces) === " " || text.charAt(numSpaces) === "\t")) {
          numSpaces++;
        }
        if (numSpaces > 0 && numSpaces < text.length) {
          p.editAsText().deleteText(0, numSpaces - 1);
          text = p.getText();
        }
      }

      if (text.startsWith("ông ")) p.editAsText().replaceText("^ông ", "Ông ");
      else if (text.startsWith("bà ")) p.editAsText().replaceText("^bà ", "Bà ");
      else if (text.startsWith("ngày ")) p.editAsText().replaceText("^ngày ", "Ngày ");
    }
  } catch (e) {}
}

function logic_LuuVaTronThuDon_SuperFast(payloadData, payloadMerge) {
  try {
    var saveResult = logic_LuuThongTinDon(payloadData);
    if (!saveResult.success) return { success: false, error: "Lỗi Lưu Data: " + saveResult.error };

    if (payloadMerge.idDon.includes("TEMP_")) payloadMerge.idDon = saveResult.idDon;

    var mergeResult = logic_TronThuChoDon_V2(payloadMerge);
    if (!mergeResult.success) return { success: false, error: "Lỗi Trộn thư: " + mergeResult.error };

    return { success: true, idDon: saveResult.idDon, files: mergeResult.files };
  } catch (e) {
    return { success: false, error: "Lỗi Gộp luồng: " + e.toString() };
  }
}

function api_LuuVaTronThuDon_SuperFast(payloadData, payloadMerge) {
  return logic_LuuVaTronThuDon_SuperFast(payloadData, payloadMerge);
}

function logic_DoiChieuDuLieuDon() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDon = ss.getSheetByName("0_SoNhanDon");

    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var excelId = extractFolderId(config["ID_EXCEL_DON"]);
    if (!excelId) return { error: "Chưa cấu hình ID Sổ Đơn Gốc (Excel) trong Cài đặt." };

    var donCount = (sheetDon.getLastRow() > 1) ? sheetDon.getLastRow() - 1 : 0;
    var fileInfo = DriveApp.getFileById(excelId);
    var fileName = fileInfo.getName();
    var lastUpdate = LibDate.fmt(fileInfo.getLastUpdated(), 'VN');

    var report = `<div class='alert alert-info border-0 shadow-sm'>
                    <i class='fas fa-database me-2'></i> <b>TÌNH TRẠNG KẾT NỐI SỔ ĐƠN:</b><br>
                    - Nguồn Excel: <b>${fileName}</b><br>
                    - Lần cập nhật cuối (Bởi văn thư): ${lastUpdate}<br>
                    - Số đơn đã lưu trữ an toàn trên phần mềm: <b>${donCount}</b> hồ sơ.
                  </div>
                  <p class='small text-muted'>* Cơ chế đồng bộ bảo toàn 100% CSDL: Chỉ nạp thêm đơn mới, tuyệt đối không ghi đè dữ liệu bạn đã nhập tay.</p>`;

    return { success: true, html: report };
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
}

function api_DoiChieuDuLieuDon() {
  return logic_DoiChieuDuLieuDon();
}