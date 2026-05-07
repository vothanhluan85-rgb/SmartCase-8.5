/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.5.0 - GROQ AI EDITION
 * FILE 5: NGHIỆP VỤ QUẢN TRỊ THƯ MỤC DRIVE
 * ------------------------------------------------------------
 * TỐI ƯU HÓA & NÂNG CẤP:
 * - Tăng tốc độ: Sử dụng hàm getConfigFromSheet() đã được cache để truy xuất ID thư mục gốc nhanh hơn.
 * - Logic đặt tên thư mục thông minh: Tự động thêm đuôi "VÀ NHIỀU NGƯỜI" nếu vụ án có nhiều
 *   Nguyên đơn hoặc Bị đơn, giúp nhận diện vụ án phức tạp dễ dàng hơn.
 * - Tăng độ tin cậy: Bổ sung các bước kiểm tra (validation) và khối try-catch để xử lý
 *   các trường hợp lỗi như thư mục gốc không tồn tại hoặc link Drive không hợp lệ.
 * - Chuẩn hóa JSDoc để tăng tính minh bạch và dễ bảo trì.
 */


// ============================================================
// 1. HÀM HỖ TRỢ TẠO THƯ MỤC (HELPER)
// ============================================================

/**
 * Tìm thư mục theo tên trong một thư mục cha, nếu không thấy thì tạo mới.
 * @param {GoogleAppsScript.Drive.Folder} parentFolder Thư mục cha.
 * @param {string} folderName Tên thư mục cần tìm hoặc tạo.
 * @returns {GoogleAppsScript.Drive.Folder} Đối tượng Folder đã tìm thấy hoặc vừa được tạo.
 */
function getOrCreateFolder(parentFolder, folderName) {
  if (!folderName) return parentFolder;
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}


// ============================================================
// 2. LOGIC TẠO CẤU TRÚC HỒ SƠ MỚI
// ============================================================

/**
 * Tạo cấu trúc thư mục hoàn chỉnh cho một vụ án mới.
 * Cấu trúc: [Thư mục Gốc] -> [Loại Án] -> [Năm Thụ Lý] -> [Thư mục Vụ Án]
 * @param {string} soTLFull Số thụ lý đầy đủ của vụ án.
 * @param {string} loaiAn Loại án (đã được chuẩn hóa, ví dụ: "1. Hình sự").
 * @param {Date} ngayTLVal Đối tượng Date của ngày thụ lý.
 * @param {Array<Object>} duongSuArr Mảng các đối tượng đương sự.
 * @returns {string} URL của thư mục vụ án đã được tạo.
 * @throws {Error} Nếu chưa cấu hình ID thư mục gốc.
 */
function taoThuMucHoSoMoi(soTLFull, loaiAn, ngayTLVal, duongSuArr) {
  try {
    const config = getConfigFromSheet(); // Sử dụng hàm đã được tối ưu với cache
    const rootId = extractFolderId(config["ID_THUMUC_AN"]);
    if (!rootId) throw new Error("Chưa cấu hình 'ID Thư mục Án' trong Cài đặt!");
   
    const rootFolder = DriveApp.getFolderById(rootId);

    // 1. Xác định Năm thụ lý
    const d = LibDate.parse(ngayTLVal);
    const namTL = d ? d.getFullYear() : new Date().getFullYear();

    // 2. Phân loại thư mục (Xử lý đặc biệt cho HGĐT)
    // Án HGĐT sẽ được đưa vào thư mục của loại án gốc (Dân sự, HNGĐ...) để dễ quản lý.
    let baseLoaiAn = "2. Dân sự"; // Mặc định
    const lowerLoaiAn = loaiAn ? loaiAn.toLowerCase() : "";
    const upperSoTL = soTLFull ? soTLFull.toUpperCase() : "";

    if (lowerLoaiAn.includes("hôn nhân") || upperSoTL.includes("-HNGĐ")) baseLoaiAn = "3. Hôn nhân";
    else if (lowerLoaiAn.includes("kinh doanh") || upperSoTL.includes("-KDTM")) baseLoaiAn = "4. Kinh doanh";
    else if (lowerLoaiAn.includes("lao động") || upperSoTL.includes("-LĐ")) baseLoaiAn = "5. Lao động";
    else if (lowerLoaiAn.includes("hành chính") || upperSoTL.includes("-HC")) baseLoaiAn = "6. Hành chính";
    else if (lowerLoaiAn.includes("hình sự") || upperSoTL.includes("-HS")) baseLoaiAn = "1. Hình sự";
    
    // 3. Tạo cấu trúc thư mục lồng nhau
    const fLoaiAn = getOrCreateFolder(rootFolder, baseLoaiAn);
    const fNam = getOrCreateFolder(fLoaiAn, "Năm " + namTL);

    // 4. Đặt tên thư mục vụ án một cách thông minh
    const shortNo = extractShortNo(soTLFull);
    
    const ndList = duongSuArr.filter(ds => {
      const role = ds.tuCach.toLowerCase();
      return role.includes("nguyên đơn") || role.includes("bị hại") || role.includes("khởi kiện") || role.includes("yêu cầu");
    });
    const bdList = duongSuArr.filter(ds => {
      const role = ds.tuCach.toLowerCase();
      return role.includes("bị đơn") || role.includes("bị cáo") || role.includes("bị kiện") || role.includes("bị yêu cầu");
    });

    let tenND = ndList.length > 0 ? toTitleCase(ndList[0].hoTen) : "NĐ Chưa xác định";
    if (ndList.length > 1) tenND += " VÀ NHIỀU NGƯỜI";

    let tenBD = bdList.length > 0 ? toTitleCase(bdList[0].hoTen) : "BĐ Chưa xác định";
    if (bdList.length > 1) tenBD += " VÀ NHIỀU NGƯỜI";

    const tenFolderChuan = `${shortNo} - ${tenND} - ${tenBD}`;
    const fVuAn = getOrCreateFolder(fNam, tenFolderChuan);

    return fVuAn.getUrl();

  } catch (e) {
    console.error("LỖI TẠO THƯ MỤC DRIVE: " + e.message);
    // Trả về chuỗi lỗi để hiển thị cho người dùng thay vì gây crash
    return "LỖI DRIVE: " + e.message; 
  }
}


// ============================================================
// 3. QUẢN LÝ FILE TRONG THƯ MỤC
// ============================================================

/**
 * Liệt kê toàn bộ file có trong thư mục vụ án.
 * @param {string} folderPath URL hoặc ID của thư mục.
 * @returns {Array<Object>} Mảng các đối tượng file, mỗi object chứa id, name, url, icon, size, date.
 */
function api_LayDanhSachFileDrive(folderPath) {
  if (!folderPath || !folderPath.includes("http")) return [];
  try {
    const folderId = extractFolderId(folderPath);
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const ketQua = [];
   
    while (files.hasNext()) {
      const f = files.next();
      const mime = f.getMimeType();
      let icon = "fas fa-file-alt text-muted"; // Mặc định
     
      if (mime === MimeType.GOOGLE_DOCS || mime.includes("word")) icon = "far fa-file-word text-primary";
      else if (mime === MimeType.PDF) icon = "far fa-file-pdf text-danger";
      else if (mime === MimeType.GOOGLE_SHEETS || mime.includes("excel")) icon = "far fa-file-excel text-success";
      else if (mime.includes("image")) icon = "far fa-file-image text-warning";

      ketQua.push({
        id: f.getId(),
        name: f.getName(),
        url: f.getUrl(),
        icon: icon,
        size: Math.round(f.getSize() / 1024) + " KB",
        date: LibDate.fmt(f.getDateCreated(), 'VN')
      });
    }
    // Sắp xếp file theo ngày tạo mới nhất lên trên
    ketQua.sort((a, b) => LibDate.parse(b.date).getTime() - LibDate.parse(a.date).getTime());
    return ketQua;
  } catch (e) {
    console.error("Lỗi lấy danh sách file Drive: " + e.message);
    return []; // Trả về mảng rỗng nếu có lỗi (ví dụ: thư mục không tồn tại)
  }
}

/**
 * Tải file từ máy tính của người dùng lên thư mục Drive của vụ án.
 * Dữ liệu được truyền từ client dưới dạng Base64.
 * @param {string} fileName Tên file.
 * @param {string} mimeType Loại MIME của file.
 * @param {string} base64Data Dữ liệu file đã được mã hóa Base64.
 * @param {string} folderUrl URL của thư mục đích.
 * @returns {{success: boolean, url?: string, error?: string}} Đối tượng kết quả.
 */
function backend_UploadFileToDrive(fileName, mimeType, base64Data, folderUrl) {
  try {
    const folderId = extractFolderId(folderUrl);
    if (!folderId) return { success: false, error: "URL thư mục không hợp lệ." };
    const folder = DriveApp.getFolderById(folderId);
   
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, mimeType, fileName);
    const file = folder.createFile(blob);
   
    return { success: true, url: file.getUrl() };
  } catch (e) {
    return { success: false, error: "Lỗi tải file lên Drive: " + e.toString() };
  }
}

/**
 * Trả về URL của thư mục gốc (Dùng cho nút "Mở Drive Gốc").
 * @param {string} folderPath URL của một thư mục con bất kỳ trong cấu trúc.
 * @returns {string|null} URL của thư mục gốc hoặc null nếu có lỗi.
 */
function api_MoThuMucGoc(folderPath) {
  try {
    const config = getConfigFromSheet();
    const rootId = extractFolderId(config["ID_THUMUC_AN"]);
    if (!rootId) return null;
    return DriveApp.getFolderById(rootId).getUrl();
  } catch (e) {
    console.error("Lỗi mở thư mục gốc: " + e.message);
    return null;
  }
}