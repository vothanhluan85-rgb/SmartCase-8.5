/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.6 - GROQ AI EDITION
 * FILE 0: MODULE XỬ LÝ ĐƠN (TIỀN TỐ TỤNG)
 * ----------------------------------------------------
 * Chứa logic CRUD và hàm Rút trích (Transformer) để đồng bộ sang Sổ Thụ Lý.
 */

// ==========================================================
// 1. LẤY DANH SÁCH & CHI TIẾT ĐƠN
// ==========================================================

function api_LayDanhSachDon() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("0_SoNhanDon");
    if (!sheet || sheet.getLastRow() < 2) return [];
    
    // Tối ưu hóa: Chỉ đọc các cột cần thiết cho danh sách
    const data = sheet.getRange("A2:K" + sheet.getLastRow()).getValues();
    const dsDon = sheet.getSheetByName("0_DuongSuDon").getDataRange().getValues();
    
    const dsMap = {};
    for(let i = 1; i < dsDon.length; i++) {
        const idDon = dsDon[i][0];
        if(!dsMap[idDon]) dsMap[idDon] = { nkk: [], nbk: [] };
        const tuCach = String(dsDon[i][1]).toLowerCase();
        const ten = dsDon[i][3];
        if(tuCach.includes('khởi kiện') || tuCach.includes('yêu cầu')) dsMap[idDon].nkk.push(ten);
        else if(tuCach.includes('bị kiện') || tuCach.includes('bị yêu cầu')) dsMap[idDon].nbk.push(ten);
    }

    return data.map(row => {
      const id = row[0];
      const dsInfo = dsMap[id] || { nkk: [], nbk: [] };
      return {
        id: id,
        soDon: row[1],
        ngayNhan: LibDate.fmt(row[2], 'VN'),
        rawDate: row[2] instanceof Date ? row[2].getTime() : 0,
        loaiAn: row[3],
        quanHe: row[4],
        trangThai: row[9],
        nguoiKhoiKien: dsInfo.nkk.join(', '),
        nguoiBiKien: dsInfo.nbk.join(', ')
      };
    }).sort((a,b) => b.rawDate - a.rawDate);
    
  } catch (e) { return { error: e.toString() }; }
}

function api_LayChiTietDon(idDon) {
  try {
    const sheetDon = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("0_SoNhanDon");
    const ids = sheetDon.getRange("A:A").getValues().flat();
    const rowIndex = ids.indexOf(idDon);
    
    if (rowIndex === -1) return { error: "Không tìm thấy đơn." };
    const row = sheetDon.getRange(rowIndex + 1, 1, 1, 11).getValues()[0];
    
    const duongSu = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("0_DuongSuDon")
      .getDataRange().getValues()
      .slice(1)
      .filter(r => r[0] === idDon)
      .map(r => ({
        tuCach: r[1], xungHo: r[2], hoTen: r[3], namSinh: r[4], 
        diaChi: r[5], sdt: r[6], cccd: r[7], daiDien: r[8]
      }));

    return {
      info: {
        id: row[0], soDon: row[1], ngayNhan: LibDate.fmt(row[2], 'ISO'), loaiAn: row[3],
        quanHe: row[4], giaTri: row[5], huongXuLy: row[6], thamPhan: row[7],
        tamUng: row[8], trangThai: row[9], ghiChu: row[10]
      },
      ds: duongSu
    };
  } catch (e) { return { error: e.toString() }; }
}

// ==========================================================
// 2. LƯU & CẬP NHẬT (THỦ CÔNG, OCR)
// ==========================================================

function api_LuuThongTinDon(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheetDon = ss.getSheetByName("0_SoNhanDon");
    const sheetDS = ss.getSheetByName("0_DuongSuDon");

    let idDon = payload.info.id;
    if (idDon) { // -- CHẾ ĐỘ CẬP NHẬT --
      const ids = sheetDon.getRange("A:A").getValues().flat();
      const rowIndex = ids.indexOf(idDon);
      if (rowIndex > -1) {
        sheetDon.getRange(rowIndex + 1, 2, 1, 10).setValues([[
          payload.info.soDon, LibDate.parse(payload.info.ngayNhan), payload.info.loaiAn, payload.info.quanHe, payload.info.giaTri, 
          payload.info.huongXuLy, payload.info.thamPhan, payload.info.tamUng, payload.info.trangThai, payload.info.ghiChu
        ]]);
      }
      // Xóa đương sự cũ
      const dataDS = sheetDS.getDataRange().getValues();
      for(let i = dataDS.length - 1; i >= 1; i--) {
        if (dataDS[i][0] === idDon) sheetDS.deleteRow(i + 1);
      }
    } else { // -- CHẾ ĐỘ THÊM MỚI --
      idDon = generateId("DON");
      sheetDon.appendRow([
        idDon, payload.info.soDon, LibDate.parse(payload.info.ngayNhan), payload.info.loaiAn, payload.info.quanHe, payload.info.giaTri,
        payload.info.huongXuLy, payload.info.thamPhan, payload.info.tamUng, payload.info.trangThai, payload.info.ghiChu
      ]);
    }

    // Thêm đương sự mới (cả 2 chế độ)
    if (payload.ds && payload.ds.length > 0) {
      const dsRows = payload.ds.map(d => [idDon, d.tuCach, d.xungHo, d.hoTen, d.namSinh, d.diaChi, d.sdt, d.cccd, d.daiDien]);
      sheetDS.getRange(sheetDS.getLastRow() + 1, 1, dsRows.length, 9).setValues(dsRows);
    }

    return { success: true, idDon: idDon };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ==========================================================
// 3. CẦU NỐI: RÚT TRÍCH & CHUYỂN HÓA SANG SỔ THỤ LÝ
// ==========================================================

function api_RutTrichThongTinDon(soDon) {
  if (!soDon) return { error: "Vui lòng nhập số đơn." };
  try {
    const sheetDon = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("0_SoNhanDon");
    const soDonCol = sheetDon.getRange("B:B").getValues().flat();
    const rowIndex = soDonCol.indexOf(String(soDon).trim());
    
    if (rowIndex === -1) return { error: `Không tìm thấy đơn có số "${soDon}"` };
    
    const idDon = sheetDon.getRange(rowIndex + 1, 1).getValue();
    const donData = api_LayChiTietDon(idDon);
    if(donData.error) return donData;

    // --- BỘ CHUYỂN ĐỔI (TRANSFORMER) ---
    const loaiAn = donData.info.loaiAn || "2. Dân sự";
    const transformedDS = donData.ds.map(d => {
      let newTuCach = d.tuCach;
      const t = d.tuCach.toLowerCase();
      if (t.includes("khởi kiện")) {
        newTuCach = loaiAn.includes("Hành chính") ? "Người khởi kiện" : "Nguyên đơn";
      } else if (t.includes("bị kiện")) {
        newTuCach = loaiAn.includes("Hành chính") ? "Người bị kiện" : "Bị đơn";
      } else if (t.includes("yêu cầu")) {
        newTuCach = "Người yêu cầu";
      } else if (t.includes("bị yêu cầu")) {
         newTuCach = "Người có QLV, NVLQ"; // Hoặc Bị đơn tuỳ nghiệp vụ
      }
      return { ...d, tuCach: newTuCach };
    });

    return {
      success: true,
      info: {
        quanHe: donData.info.quanHe,
        ghiChu: donData.info.ghiChu,
      },
      ds: transformedDS
    };

  } catch (e) { return { error: e.toString() }; }
}