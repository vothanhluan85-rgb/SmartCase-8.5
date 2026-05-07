/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.5.0 - GROQ AI EDITION
 * FILE 8: TRẠM ĐIỀU PHỐI GIAO TIẾP (API ROUTER)
 * ------------------------------------------------------------
 */

// QUẢN LÝ VỤ ÁN
function api_LayDanhSachAn() { return layDanhSachAn(); }
function api_LayDuLieuChiTietAn(idVuAn) { return layDuLieuChiTiet(idVuAn); }
function api_LuuVuAnMoi(data) { return backendLuuVuAnMoi(data); }
function api_DeleteCase(idAn) { return backend_DeleteCase(idAn); }
function api_DeleteMultipleCases(ids) { return backend_DeleteMultipleCases(ids); }
function api_CapNhatThongTinAn(data) { return backend_CapNhatThongTinAn(data); }
function api_UpdateCaseResolution(data) { return backend_UpdateCaseResolution(data); }
function api_UpdateQuickNote(idVuAn, note) { return backend_UpdateQuickNote(idVuAn, note); }

// QUẢN LÝ ĐƯƠNG SỰ
function api_SaveSingleParty(data) { return backendLuuDuongSuLe(data); }
function api_UpdatePartyDetails(data) { return backendUpdateDuongSu(data); }
function api_DeleteParty(idVuAn, hoTen, tuCach) { return backend_DeleteParty(idVuAn, hoTen, tuCach); }
function api_UpdateAllParties(idVuAn, parties) { return backend_UpdateAllParties(idVuAn, parties); }

// AI SCAN & TẠO MẪU
function api_ParseDocumentForCaseInfo(fileName, mimeType, base64Data) { return ai_ParseDocumentForCaseInfo(fileName, mimeType, base64Data); }
function api_UpdateCaseFromScan(idVuAn, base64Data, fileName, mimeType) { return backend_UpdateCaseFromScan(idVuAn, base64Data, fileName, mimeType); }
function api_CreateTemplateFromDoc(fileName, mimeType, base64Data) { return backend_CreateTemplateFromDoc(fileName, mimeType, base64Data); }

// LỊCH TRÌNH
function api_LayLichTrinhCongTac() { return api_LayLichTrinhCongTac_Logic(); }
function api_LuuLichMoi(data) { return api_LuuLichMoi_Logic(data); }
function api_DongBoLichCaNhan() { return api_DongBoLichCaNhan_Logic(); }
function api_XoaLichCongTac(idLich) { return api_XoaLich_Logic(idLich); }
function api_CapNhatNgayLich(idLich, newDateISO) { return api_CapNhatNgayLich_Logic(idLich, newDateISO); }
function api_LayChiTietLich(idLich) { return api_LayChiTietLich_Logic(idLich); }
function api_CapNhatLich(data) { return api_CapNhatLich_Logic(data); }

// SOẠN THẢO VĂN BẢN
function api_GetBieuMauTemplates() { return api_LayDanhSachBieuMau_Logic(); }
function api_ScanTemplateRequirements(templateIds) { return api_ScanTemplateRequirements(templateIds); } // V7.5 FORM ĐỘNG
function api_RunMailMergeV3(input) { return api_RunMailMergeV3_Logic(input); }

// TIỆN ÍCH & CẤU HÌNH
function api_GetAppIdentity() { return getConfigFromSheet(); }
function api_SaveAppSettings(settings) { return updateConfigInSheet(settings); }
function api_UploadFileToDrive(fileName, mimeType, base64Data, folderUrl) { return backend_UploadFileToDrive(fileName, mimeType, base64Data, folderUrl); }
function api_CalculateCourtFee(loaiAn, giaTriRaw) { return calculateCourtFee(loaiAn, giaTriRaw); }
function api_GetDriveFiles(folderUrl) { return api_LayDanhSachFileDrive(folderUrl); }

// HỆ THỐNG ĐỒNG BỘ
function api_ImportCasesChunked(chunk) { return backend_ImportCasesChunked(chunk); }
function api_UpdateSystemStatus(idVuAn, type) { return backend_UpdateSystemStatus(idVuAn, type); }
function api_SyncOneDrive() { return backend_SyncOneDrive(); } // V7.5 ONEDRIVE WAITER

// HTML Helper
function include(filename) {
  try { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }
  catch (e) { return "<!-- Lỗi nạp file: " + e.message + " -->"; }
}
// ===================================
// MODULE XỬ LÝ ĐƠN V7.6
// ===================================
function api_LayDanhSachDon() { return layDanhSachDon(); }
function api_LayChiTietDon(idDon) { return layChiTietDon(idDon); }
function api_LuuThongTinDon(payload) { return api_LuuThongTinDon(payload); }
function api_RutTrichThongTinDon(soDon) { return api_RutTrichThongTinDon(soDon); }