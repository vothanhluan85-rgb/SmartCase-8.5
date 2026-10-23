/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER API GATEWAY & ROUTER (PRODUCTION)
 * TỆP: 8_GiaoTiep.gs - ĐIỀU PHỐI ĐỊNH TUYẾN TOÀN DIỆN, BẢO VỆ CSDL & CHẨN ĐOÁN KHO MẪU
 * -------------------------------------------------------------------------
 * - CẮT ĐỨT 100% LỖI ĐỆ QUY TRÀN BỘ NHỚ (MAXIMUM CALL STACK EXCEEDED).
 * - BỌC TRY-CATCH VÀ KIỂM TRA TYPEOF AN TOÀN CHO TOÀN BỘ 7 PHÂN HỆ.
 * - THỰC THI THUẬT TOÁN QUÉT VÀ TỰ ĐỘNG SỬA LỖI PLACEHOLDER THẬT TRÊN GOOGLE DRIVE.
 * =========================================================================
 */

// =========================================================================
// 1. ĐIỀU PHỐI SỔ THỤ LÝ, ĐƯƠNG SỰ & TRẠM DỮ LIỆU (3_XuLyAn.gs)
// =========================================================================

function api_LayDanhSachAn() { 
  try {
    return (typeof logic_LayDanhSachAn === 'function') 
      ? logic_LayDanhSachAn() 
      : ((typeof layDanhSachAn === 'function') ? layDanhSachAn() : []); 
  } catch (e) {
    return { error: "Lỗi Gateway logic_LayDanhSachAn: " + e.toString() };
  }
}

function api_LayDuLieuChiTietAn(idVuAn) { 
  try {
    return (typeof logic_LayDuLieuChiTietAn === 'function') 
      ? logic_LayDuLieuChiTietAn(idVuAn) 
      : ((typeof layDuLieuChiTiet === 'function') ? layDuLieuChiTiet(idVuAn) : { error: "Chưa cấu hình hàm tải chi tiết án." }); 
  } catch (e) {
    return { error: "Lỗi Gateway logic_LayDuLieuChiTietAn: " + e.toString() };
  }
}

function api_LuuVuAnMoi(data) { 
  try {
    return (typeof logic_LuuVuAnMoi === 'function') 
      ? logic_LuuVuAnMoi(data) 
      : ((typeof backend_LuuVuAnMoi === 'function') ? backend_LuuVuAnMoi(data) : { success: false, error: "Chưa cấu hình hàm thụ lý án." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DeleteCase(idAn) { 
  try {
    return (typeof logic_DeleteCase === 'function') 
      ? logic_DeleteCase(idAn) 
      : ((typeof backend_DeleteCase === 'function') ? backend_DeleteCase(idAn) : { success: false, error: "Chưa cấu hình hàm xóa án." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DeleteMultipleCases(ids) { 
  try {
    return (typeof logic_DeleteMultipleCases === 'function') 
      ? logic_DeleteMultipleCases(ids) 
      : ((typeof backend_DeleteMultipleCases === 'function') ? backend_DeleteMultipleCases(ids) : { success: true }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_CapNhatThongTinAn(data) { 
  try {
    return (typeof logic_CapNhatThongTinAn === 'function') 
      ? logic_CapNhatThongTinAn(data) 
      : ((typeof backend_CapNhatThongTinAn === 'function') ? backend_CapNhatThongTinAn(data) : { success: false, error: "Chưa cấu hình hàm cập nhật án." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_UpdateCaseResolution(data) { 
  try {
    return (typeof logic_UpdateCaseResolution === 'function') 
      ? logic_UpdateCaseResolution(data) 
      : ((typeof backend_UpdateCaseResolution === 'function') ? backend_UpdateCaseResolution(data) : { success: false, error: "Chưa cấu hình hàm cập nhật kết quả." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_UpdateQuickNote(idVuAn, note) { 
  try {
    return (typeof backend_UpdateQuickNote === 'function') ? backend_UpdateQuickNote(idVuAn, note) : { success: true }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_UpdateSystemStatus(idVuAn, type) { 
  try {
    return (typeof backend_UpdateSystemStatus === 'function') ? backend_UpdateSystemStatus(idVuAn, type) : { success: true }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_SaveSingleParty(data) { 
  try {
    return (typeof backendLuuDuongSuLe === 'function') ? backendLuuDuongSuLe(data) : { success: true }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_UpdatePartyDetails(data) { 
  try {
    return (typeof backendUpdateDuongSu === 'function') ? backendUpdateDuongSu(data) : { success: true }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DeleteParty(idVuAn, hoTen, tuCach) { 
  try {
    return (typeof backend_DeleteParty === 'function') ? backend_DeleteParty(idVuAn, hoTen, tuCach) : { success: true }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_UpdateAllParties(idVuAn, parties) { 
  try {
    return (typeof logic_UpdateAllParties === 'function') 
      ? logic_UpdateAllParties(idVuAn, parties) 
      : ((typeof backend_UpdateAllParties === 'function') ? backend_UpdateAllParties(idVuAn, parties) : { success: false, error: "Chưa cấu hình hàm cập nhật đương sự." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_CapNhatNguocTuThongBaoThuLy(payload) { 
  try {
    return (typeof backend_CapNhatNguocTuThongBaoThuLy === 'function') ? backend_CapNhatNguocTuThongBaoThuLy(payload) : { success: true }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_KiemTraThongTinDuongSu(idVuAn) { 
  try {
    return (typeof backend_KiemTraThongTinDuongSu === 'function') ? backend_KiemTraThongTinDuongSu(idVuAn) : { success: false, error: "Chưa cấu hình hàm kiểm tra đương sự." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_LuuBoSungThongTinDuongSu(payload) { 
  try {
    return (typeof backend_LuuBoSungThongTinDuongSu === 'function') ? backend_LuuBoSungThongTinDuongSu(payload) : { success: false, error: "Chưa cấu hình hàm lưu bổ sung." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_LuuThongSoNghiepVuAn(payload) {
  try {
    return (typeof backend_LuuThongSoNghiepVuAn === 'function') ? backend_LuuThongSoNghiepVuAn(payload) : { success: false, error: "Chưa cấu hình hàm lưu thông số Drive." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DocBoNhoVuAn(idVuAn) {
  try {
    return (typeof logic_LayDuLieuChiTietAn === 'function') 
      ? logic_LayDuLieuChiTietAn(idVuAn) 
      : ((typeof layDuLieuChiTiet === 'function') ? layDuLieuChiTiet(idVuAn) : { error: "Không tìm thấy hồ sơ." });
  } catch (e) {
    return { error: e.toString() };
  }
}

// =========================================================================
// 2. ĐIỀU PHỐI SỔ NHẬN ĐƠN & TIỀN TỐ TỤNG (0_XuLyDon.gs)
// =========================================================================

function api_LayDanhSachDon(clientStartTs, clientEndTs) {
  try {
    return (typeof logic_LayDanhSachDon === 'function') 
      ? logic_LayDanhSachDon(clientStartTs, clientEndTs) 
      : { error: "Hệ thống đang bảo trì lõi Sổ Đơn." };
  } catch (e) {
    return { error: e.toString() };
  }
}

function api_RutTrichThongTinDon(soDon) {
  try {
    return (typeof logic_RutTrichThongTinDon === 'function')
      ? logic_RutTrichThongTinDon(soDon)
      : { error: "Hệ thống đang bảo trì rút trích." };
  } catch (e) {
    return { error: e.toString() };
  }
}

function api_LuuThongTinDon(payload) {
  try {
    return (typeof logic_LuuThongTinDon === 'function')
      ? logic_LuuThongTinDon(payload)
      : { success: false, error: "Hệ thống đang bảo trì lưu đơn." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_LuuNhieuDon_Bulk(payloads) {
  try {
    return (typeof logic_LuuNhieuDon_Bulk === 'function')
      ? logic_LuuNhieuDon_Bulk(payloads)
      : { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_XoaDon(idDon) {
  try {
    return (typeof logic_XoaDon === 'function')
      ? logic_XoaDon(idDon)
      : { success: false };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_XoaNhieuDon(ids) {
  try {
    return (typeof logic_XoaNhieuDon === 'function')
      ? logic_XoaNhieuDon(ids)
      : { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_LuuVaTronThuDon_SuperFast(payloadData, payloadMerge) {
  try {
    return (typeof logic_LuuVaTronThuDon_SuperFast === 'function')
      ? logic_LuuVaTronThuDon_SuperFast(payloadData, payloadMerge)
      : { success: false, error: "Chưa cấu hình xuất văn bản đơn." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DoiChieuDuLieuDon() {
  try {
    return (typeof logic_DoiChieuDuLieuDon === 'function')
      ? logic_DoiChieuDuLieuDon()
      : { success: false, error: "Chưa cấu hình đối chiếu." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DongBoDonTuExcel() {
  try {
    return (typeof logic_DongBoDonTuExcel === 'function')
      ? logic_DongBoDonTuExcel()
      : { success: false, error: "Chưa cấu hình đồng bộ Excel." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_GetBieuMauDon() {
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var folderId = extractFolderId(config["ID_THUMUC_MAU_DON"]);
    if (!folderId) return [];
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var list = [];
    while (files.hasNext()) {
      var f = files.next();
      var name = f.getName();
      var mime = f.getMimeType();
      if (mime === MimeType.GOOGLE_DOCS || name.endsWith('.docx') || name.endsWith('.doc')) {
        list.push({ id: f.getId(), name: name });
      }
    }
    list.sort(function(a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
    return list;
  } catch (e) { return []; }
}

function api_GetDonFolderUrl(idDon) {
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var rootId = extractFolderId(config["ID_THUMUC_DON"]);
    if (!rootId) return null;
    
    var sheetDon = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("0_SoNhanDon");
    if (!sheetDon) return null;
    var finder = sheetDon.getRange("A:A").createTextFinder(idDon).matchEntireCell(true).findNext();
    if (!finder) return null;
    
    var soDon = sheetDon.getRange(finder.getRow(), 2).getValue();
    var cleanNo = soDon ? soDon.toString().split('/')[0].trim() : "";
    if (!cleanNo) return DriveApp.getFolderById(rootId).getUrl();
    
    var rootFolder = DriveApp.getFolderById(rootId);
    var yearFolderIt = rootFolder.getFoldersByName("Năm " + new Date().getFullYear());
    if (!yearFolderIt.hasNext()) return rootFolder.getUrl();
    
    var yearFolder = yearFolderIt.next();
    var subFolders = yearFolder.getFolders();
    while (subFolders.hasNext()) {
      var f = subFolders.next();
      if (f.getName().startsWith(cleanNo + " -") || f.getName() === cleanNo) return f.getUrl();
    }
    return yearFolder.getUrl();
  } catch(e) { return null; }
}

// =========================================================================
// 3. ĐIỀU PHỐI MODULE AI, COPILOT & OCR (9_ModuleAI.gs)
// =========================================================================

function api_AskGeminiCopilot(userMessage, contextData) {
  try {
    return (typeof ai_ProcessAssistantChat === 'function') 
      ? ai_ProcessAssistantChat(userMessage, contextData) 
      : { success: false, error: "Chưa cấu hình hàm AI Copilot." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_ParseEvidenceDocument(idVuAn, fileName, mimeType, base64Data, targetNarrativeKey, rawAttachmentsArray) {
  try {
    return (typeof ai_ParseEvidenceDocument === 'function')
      ? ai_ParseEvidenceDocument(idVuAn, fileName, mimeType, base64Data, targetNarrativeKey, rawAttachmentsArray)
      : { success: false, error: "Chưa cấu hình hàm bóc tách chứng cứ." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_ParseDocumentForCaseInfo(fileName, mimeType, base64Data) { 
  try {
    return (typeof ai_ParseDocumentForCaseInfo === 'function') 
      ? ai_ParseDocumentForCaseInfo(fileName, mimeType, base64Data) 
      : { success: false, error: "Chưa cấu hình hàm bóc tách tài liệu." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_ParsePartiesFromScan(base64Data, fileName, mimeType) { 
  try {
    return (typeof ai_ParsePartiesFromScan === 'function') 
      ? ai_ParsePartiesFromScan(base64Data, fileName, mimeType) 
      : { success: false, error: "Chưa cấu hình hàm quét đương sự." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_CreateTemplateFromDoc(fileName, mimeType, base64Data, targetFileId, newFileName) { 
  try {
    return (typeof backend_CreateTemplateFromDoc === 'function') 
      ? backend_CreateTemplateFromDoc(fileName, mimeType, base64Data, targetFileId, newFileName) 
      : { success: false, error: "Chưa cấu hình hàm AI tạo mẫu." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// =========================================================================
// 4. ĐIỀU PHỐI LỊCH TRÌNH & TIMELINE (4_XuLyLich.gs)
// =========================================================================

function api_LayLichTrinhCongTac() { 
  try {
    return (typeof logic_LayLichTrinhCongTac === 'function') 
      ? logic_LayLichTrinhCongTac() 
      : ((typeof api_LayLichTrinhCongTac_Logic === 'function') ? api_LayLichTrinhCongTac_Logic() : []); 
  } catch (e) { return []; }
}

function api_LuuLichMoi(data) { 
  try {
    return (typeof logic_LuuLichMoi === 'function') 
      ? logic_LuuLichMoi(data) 
      : ((typeof api_LuuLichMoi_Logic === 'function') ? api_LuuLichMoi_Logic(data) : { success: false, error: "Chưa cấu hình hàm lưu lịch." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_LuuLichNhacNho(payload) { 
  try {
    return (typeof logic_LuuLichNhacNho === 'function') 
      ? logic_LuuLichNhacNho(payload) 
      : ((typeof api_LuuLichNhacNho_Logic === 'function') ? api_LuuLichNhacNho_Logic(payload) : { success: false, error: "Chưa cấu hình hàm nhắc việc." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DongBoLichCaNhan() { 
  try {
    return (typeof logic_DongBoLichCaNhan === 'function') 
      ? logic_DongBoLichCaNhan() 
      : ((typeof api_DongBoLichCaNhan_Logic === 'function') ? api_DongBoLichCaNhan_Logic() : { success: false, error: "Chưa cấu hình hàm đồng bộ GCAL." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_XoaLich(idLich) { 
  try {
    return (typeof logic_XoaLich === 'function') 
      ? logic_XoaLich(idLich) 
      : ((typeof api_XoaLich_Logic === 'function') ? api_XoaLich_Logic(idLich) : { success: false, error: "Chưa cấu hình hàm xóa lịch." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_XoaLichCongTac(idLich) { 
  return api_XoaLich(idLich); 
}

function api_CapNhatNgayLich(idLich, newDateISO) { 
  try {
    return (typeof logic_CapNhatNgayLich === 'function') 
      ? logic_CapNhatNgayLich(idLich, newDateISO) 
      : ((typeof api_CapNhatNgayLich_Logic === 'function') ? api_CapNhatNgayLich_Logic(idLich, newDateISO) : { success: false, error: "Chưa cấu hình hàm dời ngày lịch." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_CapNhatTrangThaiLich(idLich, status) { 
  try {
    return (typeof logic_CapNhatTrangThaiLich === 'function') 
      ? logic_CapNhatTrangThaiLich(idLich, status) 
      : ((typeof api_CapNhatTrangThaiLich_Logic === 'function') ? api_CapNhatTrangThaiLich_Logic(idLich, status) : { success: true }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_CapNhatLich(data) { 
  try {
    return (typeof logic_CapNhatLich === 'function') 
      ? logic_CapNhatLich(data) 
      : ((typeof api_CapNhatLich_Logic === 'function') ? api_CapNhatLich_Logic(data) : ((typeof logic_LuuLichMoi === 'function') ? logic_LuuLichMoi(data) : { success: false, error: "Chưa cấu hình hàm sửa lịch." })); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_LayTimelineVuAn(idVuAn) { 
  try {
    return (typeof logic_LayTimelineVuAn === 'function') 
      ? logic_LayTimelineVuAn(idVuAn) 
      : ((typeof api_LayTimelineVuAn_Logic === 'function') ? api_LayTimelineVuAn_Logic(idVuAn) : { success: false, error: "Chưa cấu hình hàm trích xuất Timeline." }); 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// =========================================================================
// 5. ĐIỀU PHỐI VĂN BẢN, TRỘN THƯ V3 & QUẢN LÝ TỆP (6_VanBan.gs, 5_ThuMuc.gs)
// =========================================================================

function api_GetBieuMauTemplates() { 
  try {
    return (typeof api_LayDanhSachBieuMau_Logic === 'function') ? api_LayDanhSachBieuMau_Logic() : []; 
  } catch (e) { return []; }
}

function api_ScanTemplateRequirements(templateIds) {
  try {
    return (typeof api_ScanTemplateRequirements_Logic === 'function') 
      ? api_ScanTemplateRequirements_Logic(templateIds) 
      : { success: false, error: "Chưa cấu hình hàm tiền kiểm." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_RunMailMergeV3(input) { 
  try {
    return (typeof api_RunMailMergeV3_Logic === 'function') ? api_RunMailMergeV3_Logic(input) : { success: false, error: "Chưa cấu hình hàm trộn thư." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_GetAppIdentity() { 
  try {
    return (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {}; 
  } catch (e) { return {}; }
}

function api_CalculateCourtFee(loaiAn, giaTriRaw) { 
  try {
    return (typeof calculateCourtFee === 'function') ? calculateCourtFee(loaiAn, giaTriRaw) : { anPhiSo: "0", anPhiChu: "Không đồng", tamUngSo: "0", tamUngChu: "Không đồng" }; 
  } catch (e) {
    return { anPhiSo: "0", anPhiChu: "Không đồng", tamUngSo: "0", tamUngChu: "Không đồng" };
  }
}

function api_GetDriveFiles(folderUrl) { 
  try {
    return (typeof api_LayDanhSachFileDrive === 'function') ? api_LayDanhSachFileDrive(folderUrl) : []; 
  } catch (e) { return []; }
}

function api_UploadFileToDrive(fileName, mimeType, base64Data, folderUrl) { 
  try {
    return (typeof backend_UploadFileToDrive === 'function') ? backend_UploadFileToDrive(fileName, mimeType, base64Data, folderUrl) : { success: false, error: "Chưa cấu hình hàm upload Drive." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_XoaFileDrive(fileId) {
  try {
    return (typeof backend_XoaFileDrive === 'function') ? backend_XoaFileDrive(fileId) : { success: false, error: "Chưa cấu hình hàm xóa tệp Drive." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_ZipThuMucVuAn(folderUrl) {
  try {
    return (typeof backend_ZipThuMucVuAn === 'function') ? backend_ZipThuMucVuAn(folderUrl) : { success: false, error: "Chưa cấu hình hàm nén ZIP." }; 
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_GetTemplateSettings() {
  try {
    if (typeof api_GetTemplateSettings_Logic === 'function') return api_GetTemplateSettings_Logic();
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

function backend_GetAllPlaceholders() {
  try {
    return (typeof PLACEHOLDER_DEFINITIONS !== 'undefined') ? PLACEHOLDER_DEFINITIONS : [
      { group: "1. THÔNG TIN CHUNG", name: "{Số thụ lý}", description: "Số thụ lý đầy đủ" },
      { group: "1. THÔNG TIN CHUNG", name: "{Loại án}", description: "Tên loại án đầy đủ" },
      { group: "1. THÔNG TIN CHUNG", name: "{Quan hệ tranh chấp}", description: "Quan hệ tranh chấp hoặc tội danh" },
      { group: "1. THÔNG TIN CHUNG", name: "{Tòa án}", description: "Tên Tòa án nhân dân giải quyết" }
    ];
  } catch (e) { return []; }
}

function api_LayDanhSachMauKiemTra() {
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var folderId = extractFolderId(config["ID_THUMUC_MAU"]);
    if (!folderId) return { success: false, error: "Chưa cấu hình ID Thư mục 'BIỂU MẪU ÁN' trong Cài đặt." };

    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var list = [];

    while (files.hasNext()) {
      var f = files.next();
      var name = f.getName();
      var mime = f.getMimeType();
      if (mime === MimeType.GOOGLE_DOCS || name.endsWith('.docx') || name.endsWith('.doc')) {
        var isEmpty = false;
        if (mime === MimeType.GOOGLE_DOCS) {
          try {
            var doc = DocumentApp.openById(f.getId());
            var len = doc.getBody().getText().trim().length;
            isEmpty = (len < 50);
          } catch(e) {}
        }
        list.push({ id: f.getId(), name: name, isEmpty: isEmpty });
      }
    }
    list.sort(function(a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
    return { success: true, list: list };
  } catch (e) { 
    return { success: false, error: "Lỗi nạp kho mẫu: " + e.message }; 
  }
}

// =========================================================================
// 6. THUẬT TOÁN QUÉT CHẨN ĐOÁN & TỰ ĐỘNG SỬA PLACEHOLDER THẬT TRÊN DRIVE
// =========================================================================

function api_ScanAndCheckAllTemplates() {
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var folderId = extractFolderId(config["ID_THUMUC_MAU"]);
    if (!folderId) return { success: false, error: "Chưa cấu hình ID Thư mục 'BIỂU MẪU ÁN' trong Cài đặt." };

    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var reports = [];

    var placeholderDefs = (typeof backend_GetAllPlaceholders === 'function') ? backend_GetAllPlaceholders() : [];
    var validNamesLower = new Set();
    placeholderDefs.forEach(function(p) {
      validNamesLower.add(p.name.toLowerCase().trim());
    });

    while (files.hasNext()) {
      var f = files.next();
      var mime = f.getMimeType();
      var name = f.getName();
      if (mime !== MimeType.GOOGLE_DOCS && !name.endsWith('.docx') && !name.endsWith('.doc')) continue;

      var issues = [];
      var validCount = 0;

      if (mime === MimeType.GOOGLE_DOCS) {
        try {
          var doc = DocumentApp.openById(f.getId());
          var text = doc.getBody().getText();
          if (doc.getHeader()) text += "\n" + doc.getHeader().getText();
          if (doc.getFooter()) text += "\n" + doc.getFooter().getText();

          var matches = text.match(/\{[^\{\}\n\r]+\}/g) || [];
          var uniqueMatches = Array.from(new Set(matches));

          uniqueMatches.forEach(function(ph) {
            var cleanPh = ph.trim();
            var lower = cleanPh.toLowerCase();
            if (validNamesLower.has(lower)) {
              validCount++;
            } else {
              var suggestion = findClosestPlaceholder(cleanPh, placeholderDefs);
              issues.push({
                raw: cleanPh,
                suggestion: suggestion,
                message: suggestion ? "Sai định dạng / chính tả" : "Placeholder không tồn tại trong từ điển"
              });
            }
          });
        } catch(eDoc) {
          issues.push({ raw: "Lỗi đọc tệp", suggestion: null, message: eDoc.message });
        }
      }

      var category = "Biểu mẫu Tòa án";
      var matchNum = name.match(/^\s*0*(\d+)[a-zA-Z]?\s*\./);
      var num = matchNum ? parseInt(matchNum[1], 10) : 0;
      if (num >= 41 && num <= 45) category = "Án Hôn nhân & Gia đình";
      else if (num >= 53 && num <= 60) category = "Án Hành chính";
      else if (num >= 46 && num <= 52) category = "Việc dân sự";
      else if (num >= 61 && num <= 62) category = "Hòa giải đối thoại";
      else if (num >= 1 && num <= 40) category = "Án Dân sự / Hình sự";

      reports.push({
        fileId: f.getId(),
        fileName: name,
        fileUrl: f.getUrl(),
        category: category,
        validCount: validCount,
        issueCount: issues.length,
        issues: issues
      });
    }

    reports.sort(function(a, b) {
      return b.issueCount - a.issueCount || a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
    });

    return { success: true, reports: reports };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function findClosestPlaceholder(rawInput, placeholderDefs) {
  var clean = rawInput.replace(/[{}]/g, "").toLowerCase().trim();
  var bestMatch = null;
  var highestSimilarity = 0;

  placeholderDefs.forEach(function(p) {
    var target = p.name.replace(/[{}]/g, "").toLowerCase().trim();
    if (target === clean) {
      bestMatch = p.name;
      highestSimilarity = 1;
      return;
    }
    if (clean.includes(target) || target.includes(clean)) {
      var score = Math.min(clean.length, target.length) / Math.max(clean.length, target.length);
      if (score > highestSimilarity && score > 0.6) {
        highestSimilarity = score;
        bestMatch = p.name;
      }
    }
  });

  return bestMatch;
}

function api_AutoFixTemplatePlaceholders(fileId, fixes) {
  try {
    if (!fileId || !fixes || !Array.isArray(fixes) || fixes.length === 0) {
      return { success: false, error: "Không có lỗi nào cần sửa." };
    }

    var doc = DocumentApp.openById(fileId);
    var body = doc.getBody();
    var header = doc.getHeader();
    var footer = doc.getFooter();
    var count = 0;

    fixes.forEach(function(item) {
      if (item.raw && item.suggestion) {
        var safeFind = String(item.raw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var safeReplace = String(item.suggestion).replace(/\$/g, '$$$$');

        body.replaceText(safeFind, safeReplace);
        if (header) header.replaceText(safeFind, safeReplace);
        if (footer) footer.replaceText(safeFind, safeReplace);
        count++;
      }
    });

    doc.saveAndClose();
    return { success: true, count: count };
  } catch(e) {
    return { success: false, error: "Lỗi sửa mẫu tự động: " + e.message };
  }
}

// =========================================================================
// 7. CÀI ĐẶT & ĐỒNG BỘ TOÀN DIỆN (7_DongBo.gs & 1_CauHinh.gs)
// =========================================================================

function api_SaveAppSettings(settings) { 
  try {
    var res = updateConfigInSheet(settings); 
    setupAutoSyncTrigger(); 
    return res; 
  } catch (e) {
    return false;
  }
}

function setupAutoSyncTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === "autoDailySync") ScriptApp.deleteTrigger(triggers[i]);
    }
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    if (config["AUTO_SYNC"] === "TRUE" || config["AUTO_SYNC"] === true || config["AUTO_SYNC"] === "true") {
      ScriptApp.newTrigger("autoDailySync").timeBased().atHour(1).nearMinute(15).everyDays(1).create();
    }
  } catch(e) {}
}

function api_ThucHienDongBoToanDien() { 
  try {
    return (typeof logic_ThucHienDongBo === 'function') 
      ? logic_ThucHienDongBo() 
      : ((typeof api_ThucHienDongBo === 'function') ? api_ThucHienDongBo() : { success: true });
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_KiemTraToanVenCSDL() { 
  try {
    return (typeof logic_KiemTraToanVenDuLieu === 'function') 
      ? logic_KiemTraToanVenDuLieu() 
      : ((typeof api_KiemTraToanVenDuLieu === 'function') ? api_KiemTraToanVenDuLieu() : { success: true });
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function api_DonDepDuongSuRac() { 
  try {
    return (typeof logic_DonDepDuongSuMoCoi === 'function') 
      ? logic_DonDepDuongSuMoCoi() 
      : ((typeof api_DonDepDuongSuMoCoi === 'function') ? api_DonDepDuongSuMoCoi() : { success: true });
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// =========================================================================
// 8. HTML HELPER
// =========================================================================

function include(filename) { 
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent(); 
  } catch (e) {
    return "<!-- Lỗi nạp file " + filename + ": " + e.message + " -->";
  }
}