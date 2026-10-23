/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER DRIVE & STORAGE CORE
 * TỆP: 5_ThuMuc.gs - QUẢN TRỊ THƯ MỤC DRIVE, TẢI LÊN, XÓA FILE & TẢI ZIP HỒ SƠ
 * -------------------------------------------------------------------------
 * - ĐÃ FIX LỖI CRASH KHI TẠO THƯ MỤC "LOẠI ÁN" (Lỗi ReferenceError ngầm).
 * - TỰ ĐỘNG KHỞI TẠO CÂY THƯ MỤC: NĂM / LOẠI ÁN / [SỐ THỤ LÝ - ĐƯƠNG SỰ].
 * =========================================================================
 */

/**
 * Khởi tạo cây thư mục lưu trữ hồ sơ vụ án chuẩn hóa trên Google Drive
 */
function taoThuMucHoSoMoi(soTL, loaiAn, ngayTL, duongSu) {
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var rootFolderId = extractFolderId(config["ID_THUMUC_AN"]);
    if (!rootFolderId) throw new Error("Chưa cấu hình ID Thư mục gốc trong Cài đặt.");

    var rootFolder = DriveApp.getFolderById(rootFolderId);
    
    // 1. Thư mục Loại án (Ví dụ: "3. Hôn nhân") -> NẰM NGOÀI CÙNG TRONG ROOT
    var loaiAnClean = String(loaiAn || "2. Dân sự").trim();
    var loaiAnFolderIt = rootFolder.getFoldersByName(loaiAnClean);
    var loaiAnFolder = loaiAnFolderIt.hasNext() ? loaiAnFolderIt.next() : rootFolder.createFolder(loaiAnClean);

    // 2. Thư mục Năm (Ví dụ: "Năm 2026") -> NẰM BÊN TRONG THƯ MỤC LOẠI ÁN
    var year = (ngayTL instanceof Date) ? ngayTL.getFullYear() : (LibDate.parse(ngayTL) ? LibDate.parse(ngayTL).getFullYear() : new Date().getFullYear());
    var yearFolderName = "Năm " + year;
    var yearFolderIt = loaiAnFolder.getFoldersByName(yearFolderName);
    var yearFolder = yearFolderIt.hasNext() ? yearFolderIt.next() : loaiAnFolder.createFolder(yearFolderName);

    // 3. Tạo tên thư mục vụ án: [Số thụ lý rút gọn] - [Nguyên đơn] v [Bị đơn]
    var cleanNo = soTL ? String(soTL).split('/')[0].replace(/\D/g, '').trim() : "HS";
    var partySummary = "Hồ sơ";

    if (duongSu && Array.isArray(duongSu) && duongSu.length > 0) {
      var ndList = duongSu.filter(function(d) {
        var tc = String(d.tuCach || "").toLowerCase();
        return tc.includes("nguyên đơn") || tc.includes("khởi kiện") || tc.includes("yêu cầu") || tc.includes("bị hại");
      }).map(function(d) { return cleanHonorificFromName(d.hoTen); });

      var bdList = duongSu.filter(function(d) {
        var tc = String(d.tuCach || "").toLowerCase();
        return tc.includes("bị đơn") || tc.includes("bị kiện") || tc.includes("bị cáo");
      }).map(function(d) { return cleanHonorificFromName(d.hoTen); });

      if (ndList.length > 0 && bdList.length > 0) {
        partySummary = ndList[0] + " v. " + bdList[0];
      } else if (ndList.length > 0) {
        partySummary = ndList[0];
      } else if (duongSu[0] && duongSu[0].hoTen) {
        partySummary = cleanHonorificFromName(duongSu[0].hoTen);
      }
    }

    var safeFolderName = `${cleanNo} - ${partySummary}`.replace(/[\\/:*?"<>|]/g, '-');
     
    // 4. Tạo thư mục Hồ sơ -> NẰM BÊN TRONG THƯ MỤC NĂM
    var caseFolderIt = yearFolder.getFoldersByName(safeFolderName);
    var caseFolder = caseFolderIt.hasNext() ? caseFolderIt.next() : yearFolder.createFolder(safeFolderName);

    return caseFolder.getUrl();

  } catch (e) {
    console.error("Lỗi tạo thư mục hồ sơ: " + e.message);
    return "";
  }
}

/**
 * Đọc toàn bộ danh sách tệp tin trong thư mục Drive của vụ án
 */
function api_LayDanhSachFileDrive(folderUrl) {
  if (!folderUrl || !folderUrl.includes("http")) return [];
  try {
    var folderId = extractFolderId(folderUrl);
    if (!folderId) return [];

    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var fileList = [];

    while (files.hasNext()) {
      var f = files.next();
      var fName = f.getName();
      var fNameLow = fName.toLowerCase();
      var mime = f.getMimeType();

      // Bỏ qua file tạm / hệ thống
      if (fName.startsWith("~$") || fName.startsWith("[TEMP]")) continue;

      var icon = "far fa-file text-secondary";
      if (mime === MimeType.GOOGLE_DOCS || fNameLow.endsWith('.docx') || fNameLow.endsWith('.doc')) {
        icon = "far fa-file-word text-primary";
      } else if (mime === MimeType.PDF || fNameLow.endsWith('.pdf')) {
        icon = "far fa-file-pdf text-danger";
      } else if (mime.startsWith("image/") || fNameLow.endsWith('.jpg') || fNameLow.endsWith('.jpeg') || fNameLow.endsWith('.png')) {
        icon = "far fa-file-image text-success";
      } else if (mime === MimeType.GOOGLE_SHEETS || fNameLow.endsWith('.xlsx') || fNameLow.endsWith('.xls')) {
        icon = "far fa-file-excel text-success";
      } else if (fName === "_case_memory.json") {
        icon = "fas fa-database text-warning";
      }

      var sizeInKb = Math.round(f.getSize() / 1024);
      var sizeText = sizeInKb > 1024 ? (sizeInKb / 1024).toFixed(1) + " MB" : sizeInKb + " KB";
      if (f.getSize() === 0 && mime.includes("google-apps")) sizeText = "Docs";

      fileList.push({
        id: f.getId(),
        name: fName,
        size: sizeText,
        date: Utilities.formatDate(f.getLastUpdated(), ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TIMEZONE) ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "dd/MM/yyyy HH:mm"),
        icon: icon,
        url: f.getUrl(),
        mime: mime
      });
    }

    // Sắp xếp: Tệp mới cập nhật lên đầu
    fileList.sort(function(a, b) {
      return b.name.localeCompare(a.name, undefined, { numeric: true });
    });

    return fileList;

  } catch (e) {
    console.warn("Lỗi đọc tệp từ Drive: " + e.message);
    return [];
  }
}

/**
 * Tải tệp lên Google Drive vụ án
 */
function backend_UploadFileToDrive(fileName, mimeType, base64Data, folderUrl) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (!folderUrl || !folderUrl.includes("http")) {
      throw new Error("Vụ án chưa được liên kết với thư mục Drive.");
    }
    var folderId = extractFolderId(folderUrl);
    if (!folderId) throw new Error("ID thư mục Drive không hợp lệ.");

    var folder = DriveApp.getFolderById(folderId);
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType || "application/octet-stream", fileName);

    // Xóa file cũ cùng tên nếu có để chống đẻ file trùng
    var existingFiles = folder.getFilesByName(fileName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    var newFile = folder.createFile(blob);
    return { 
      success: true, 
      fileId: newFile.getId(), 
      name: newFile.getName(),
      url: newFile.getUrl() 
    };

  } catch (e) {
    return { success: false, error: "Lỗi tải tệp lên Drive: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Xóa một tệp tin trực tiếp khỏi Drive của vụ án
 */
function backend_XoaFileDrive(fileId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!fileId) throw new Error("Thiếu mã định danh tệp Drive.");
    var file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Lỗi xóa tệp: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Nén toàn bộ thư mục vụ án thành file ZIP để tải về lưu trữ
 */
function backend_ZipThuMucVuAn(folderUrl) {
  try {
    if (!folderUrl || !folderUrl.includes("http")) {
      throw new Error("Vụ án chưa có thư mục Google Drive.");
    }
    var folderId = extractFolderId(folderUrl);
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var blobs = [];

    while (files.hasNext()) {
      var f = files.next();
      var fName = f.getName();
      var mime = f.getMimeType();

      if (fName.startsWith("~$") || fName === "_case_memory.json") continue;

      if (mime === MimeType.GOOGLE_DOCS) {
        var exportUrl = "https://docs.google.com/feeds/download/documents/export/Export?id=" + f.getId() + "&exportFormat=docx";
        var resp = UrlFetchApp.fetch(exportUrl, {
          headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
          muteHttpExceptions: true
        });
        blobs.push(resp.getBlob().setName(fName + ".docx"));
      } else {
        blobs.push(f.getBlob());
      }
    }

    if (blobs.length === 0) {
      throw new Error("Thư mục hồ sơ vụ án đang trống.");
    }

    var zipBlob = Utilities.zip(blobs, folder.getName() + ".zip");
    var zipFile = folder.createFile(zipBlob);

    return {
      success: true,
      zipUrl: "https://drive.google.com/uc?export=download&id=" + zipFile.getId(),
      fileName: zipFile.getName()
    };

  } catch (e) {
    return { success: false, error: "Lỗi tạo file ZIP: " + e.message };
  }
}