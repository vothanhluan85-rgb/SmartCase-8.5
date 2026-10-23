/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER UTILITIES CORE
 * TỆP: 2_TienIch.gs - TIỆN ÍCH HỆ THỐNG, ĐỊNH DẠNG & THUẬT TOÁN TỐ TỤNG
 * -------------------------------------------------------------------------
 * - CHUẨN HÓA QUY TẮC TÍNH NGÀY TỐ TỤNG ĐỦ 24H (ĐIỀU 147, 148 BLDS & ĐIỀU 212 BLTTDS)
 * - TỰ ĐỘNG NHẬN DIỆN MÃ VIỆC HÔN NHÂN (VHN) CHO THUẬN TÌNH LY HÔN
 * - TÍNH ÁN PHÍ, TẠM ỨNG & ĐỌC TIỀN THÀNH CHỮ CHUẨN NGHỊ QUYẾT 326/2016/UBTVQH14
 * - CÔNG CỤ QUẢN TRỊ VÀ ĐÁNH SỐ TỰ ĐỘNG TỪ 01 ĐẾN 64 CHO BIỂU MẪU TÒA ÁN
 * =========================================================================
 */

// =========================================================================
// 1. THƯ VIỆN NGHIỆP VỤ NGÀY THÁNG TỐ TỤNG (LIBDATE)
// =========================================================================
var LibDate = {
  /**
   * Chuyển đổi Date sang chuỗi dd/MM/yyyy
   */
  toVNString: function(val) { 
    var d = this.parse(val); 
    if (!d) return "---"; 
    return Utilities.formatDate(d, (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.FORMAT_VN : "dd/MM/yyyy")); 
  },

  /**
   * Phân tích chuỗi ngày đa định dạng thành đối tượng Date an toàn
   */
  parse: function(val) { 
    if (!val) return null; 
    if (val instanceof Date && !isNaN(val.getTime())) return val; 
    var s = String(val).trim(); 
    try { 
      if (s.includes("/")) { 
        var dateTimeParts = s.split(" "); 
        var datePart = dateTimeParts[0]; 
        var p = datePart.split("/"); 
        if (p.length === 3 && p[2] && p[2].length === 4) { 
          var date = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)); 
          if (dateTimeParts.length > 1 && dateTimeParts[1].includes(":")) { 
            var timeParts = dateTimeParts[1].split(":"); 
            date.setHours(parseInt(timeParts[0], 10) || 0, parseInt(timeParts[1], 10) || 0, 0, 0); 
          } 
          return date; 
        } 
      } 
      if (s.includes("-") && s.split("-")[0].length === 4) { 
        var p2 = s.split(" ")[0].split("-"); 
        return new Date(parseInt(p2[0], 10), parseInt(p2[1], 10) - 1, parseInt(p2[2], 10)); 
      } 
      if (!isNaN(s) && s.length >= 4 && s.length <= 6) { 
        var dExcel = new Date(1899, 11, 30); 
        dExcel.setDate(dExcel.getDate() + parseInt(s, 10)); 
        return dExcel; 
      } 
      var dDefault = new Date(val); 
      return isNaN(dDefault.getTime()) ? null : dDefault; 
    } catch (e) { 
      return null; 
    } 
  },

  /**
   * Format định dạng ISO (yyyy-MM-dd) hoặc VN (dd/MM/yyyy)
   */
  fmt: function(val, type) { 
    var d = this.parse(val); 
    if (!d) return ""; 
    var format = (type === 'ISO') 
      ? (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.FORMAT_ISO : "yyyy-MM-dd") 
      : (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.FORMAT_VN : "dd/MM/yyyy"); 
    return Utilities.formatDate(d, (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), format); 
  },

  /**
   * Viết ngày tháng bằng chữ tiếng Việt (bắt buộc số 0 ở đầu nếu < 10)
   * Ví dụ: Ngày 02 tháng 09 năm 2026
   */
  toVNText: function(val, isCap) { 
    var d = this.parse(val); 
    if (!d) return isCap ? "Ngày... tháng... năm..." : "ngày... tháng... năm..."; 
    var ngay = ("0" + d.getDate()).slice(-2); 
    var thang = ("0" + (d.getMonth() + 1)).slice(-2); 
    var nam = d.getFullYear(); 
    return (isCap ? "Ngày " : "ngày ") + ngay + " tháng " + thang + " năm " + nam; 
  },

  /**
   * Định dạng đầy đủ giờ phút ngày tháng năm
   */
  fmtFullTime: function(dateStr, timeStr) { 
    if (!dateStr || !timeStr) return ".......giờ.......phút, ngày.......tháng.......năm......."; 
    var d = this.parse(dateStr); 
    var t = String(timeStr).split(":"); 
    var hh = ("0" + (t[0] || "00")).slice(-2); 
    var mm = ("0" + (t[1] || "00")).slice(-2); 
    return hh + " giờ " + mm + " phút, " + this.toVNText(d, false); 
  },

  /**
   * KIỂM TRA NGÀY NGHỈ CUỐI TUẦN HOẶC LỄ TẾT VIỆT NAM (ĐIỀU 148 BLDS 2015)
   */
  isWeekendOrHoliday: function(d) {
    if (!d || isNaN(d.getTime())) return false;
    var dayOfWeek = d.getDay(); // 0: Chủ nhật, 6: Thứ 7
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;

    var day = d.getDate();
    var month = d.getMonth() + 1; // 1 - 12

    // Các ngày nghỉ lễ dương lịch cố định tại Việt Nam
    if (day === 1 && month === 1) return true;  // Tết Dương lịch
    if (day === 30 && month === 4) return true; // Giải phóng miền Nam
    if (day === 1 && month === 5) return true;  // Quốc tế Lao động
    if (day === 2 && month === 9) return true;  // Quốc khánh
    if (day === 3 && month === 9) return true;  // Nghỉ liền kề Quốc khánh

    return false;
  },

  /**
   * THUẬT TOÁN TỐ TỤNG CỐT LÕI: TÍNH NGÀY HÀNH ĐỘNG RA QUYẾT ĐỊNH (24H TRỌN VẸN)
   * - Hòa giải thành / Thuận tình ly hôn (7 ngày): Ra quyết định vào NGÀY THỨ 8
   * - Hòa giải đối thoại (15 ngày có ý kiến): Ra quyết định vào NGÀY THỨ 16
   * - Tự động tịnh tiến sang ngày làm việc kế tiếp nếu rơi vào Thứ 7, Chủ nhật hoặc ngày nghỉ Lễ
   */
  calculateProceduralActionDate: function(startDateVal, daysPeriod) {
    var start = this.parse(startDateVal);
    if (!start || isNaN(start.getTime())) return null;

    var period = parseInt(daysPeriod, 10) || 7;
    // Ngày lập + 7 ngày = Đúng Ngày thứ 8 có quyền ban hành Quyết định
    var actionDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + period);

    // Tịnh tiến nếu ngày ra quyết định rơi vào ngày nghỉ
    while (this.isWeekendOrHoliday(actionDate)) {
      actionDate.setDate(actionDate.getDate() + 1);
    }

    return actionDate;
  }
};

// =========================================================================
// 2. KÝ HIỆU LOẠI ÁN, SỐ THỤ LÝ & THỜI GIAN GIA HẠN
// =========================================================================

/**
 * Lấy ký hiệu viết tắt loại án phục vụ số thụ lý, quyết định, bản án
 * Tự động chuyển đổi Thuận tình ly hôn thành "VHN" (Việc Hôn nhân gia đình)
 */
function getLoaiAnRutGon(loaiAn, quanHe) {
  var la = String(loaiAn || "").toLowerCase();
  var qh = String(quanHe || "").toLowerCase();

  // Kiểm tra Việc HNGĐ (Thuận tình ly hôn)
  if (la.includes("hôn nhân") || la.includes("hngđ") || la.includes("3.")) {
    if (qh.includes("thuận tình") || qh.includes("thuan tinh") || qh.includes("công nhận thuận tình") || qh.includes("yêu cầu công nhận")) {
      return "VHN";
    }
    return "HNGĐ";
  }

  if (la.includes("hình sự") || la.includes("1.")) return "HS";
  if (la.includes("kinh doanh") || la.includes("thương mại") || la.includes("4.")) return "KDTM";
  if (la.includes("lao động") || la.includes("5.")) return "LĐ";
  if (la.includes("hành chính") || la.includes("6.")) return "HC";
  if (la.includes("việc dân sự") || la.includes("7.")) return "VDS";
  if (la.includes("hòa giải") || la.includes("đối thoại") || la.includes("8.")) return "HGĐT";

  return "DS";
}

/**
 * Xây dựng số thụ lý đầy đủ chuẩn hóa TANDTC
 * Ví dụ: 45/2026/TLST-VHN hoặc 172/2026/TLST-DS
 */
function buildFullCaseNumber(shortNo, loaiAn, dateVal, quanHe) {
  if (!shortNo) return ""; 
  var prefix = shortNo.toString().split('/')[0]; 
  var cleanNumber = prefix.replace(/\D/g, '').trim(); 
  var d = LibDate.parse(dateVal); 
  var year = d ? d.getFullYear() : new Date().getFullYear(); 
  var acronym = getLoaiAnRutGon(loaiAn, quanHe); 
  return `${cleanNumber}/${year}/TLST-${acronym}`; 
}

/**
 * Lấy văn bản thời gian gia hạn theo đúng loại án/việc
 * Việc dân sự, việc HNGĐ, án KDTM, LĐ gia hạn 01 tháng; Án DS, HNGĐ gia hạn 02 tháng
 */
function getThoiGianGiaHanText(loaiAn, quanHe) { 
  var acronym = getLoaiAnRutGon(loaiAn, quanHe);
  if (acronym === "VHN" || acronym === "VDS" || acronym === "KDTM" || acronym === "LĐ") {
    return "01 tháng";
  }
  var ext = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.DEADLINES_EXT) ? (APP_CONFIG.DEADLINES_EXT[loaiAn] || 2) : 2; 
  return ("0" + ext).slice(-2) + " tháng"; 
}

// =========================================================================
// 3. TIỆN ÍCH XỬ LÝ CHUỖI VĂN BẢN & ĐỊNH DẠNG (TEXT UTILS)
// =========================================================================

function toTitleCase(str) { 
  if (!str) return ""; 
  var keepUpper = [
    "TMCP", "TNHH", "CP", "MTV", "UBND", "TAND", "VKSND", "VN", "JSC", "BHTG", 
    "HTX", "NHCSXH", "NHTMCP", "NH", "BIDV", "ACB", "MB", "VPBANK", "VIETINBANK", 
    "VIETCOMBANK", "AGRIBANK", "SHB", "TPBANK", "HDBANK", "VIB", "MSB", "OCB", 
    "SEABANK", "LPBANK", "SCB", "SACOMBANK", "ABBANK", "BAB", "NCB", "QLTA"
  ]; 
  var words = str.toString().trim().split(/\s+/); 
  return words.map(function(w) { 
    var upperW = w.toUpperCase(); 
    if (keepUpper.includes(upperW)) return upperW; 

    // Bảo toàn tên có dấu nháy đơn (ví dụ: Ka Să K'bi, K'Thương...)
    if (w.includes("'") || w.includes("’")) {
      var parts = w.split(/['’]/);
      return parts.map(function(p) {
        if (!p) return "";
        return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      }).join("'");
    }

    if (w.length > 1 && w === upperW) return w; 
    return upperW.charAt(0) + w.slice(1).toLowerCase(); 
  }).join(" "); 
}

function cleanHonorificFromName(name) {
  if (!name) return "";
  return String(name).replace(/^(Ông|Bà|Anh|Chị|ông|bà|anh|chị)\s+/i, '').trim();
}

function cleanTextForPlaceholder(text) { 
  return text ? text.toString().trim().replace(/\s+/g, ' ') : ""; 
}

function formatPhoneNumber(phone) { 
  if (!phone) return ""; 
  var str = String(phone).trim().replace(/[^0-9+]/g, ''); 
  if (str.length > 0 && str.charAt(0) !== '0' && str.charAt(0) !== '+') str = '0' + str; 
  return str; 
}

function extractShortNo(fullSoTL) { 
  return fullSoTL ? fullSoTL.toString().split('/')[0].replace(/\D/g, '').trim() : ""; 
}

function extractFolderId(input) { 
  if (!input) return ""; 
  var str = input.toString().trim(); 
  if (str.includes("id=")) return str.split("id=")[1].split("&")[0]; 
  if (str.includes("folders/")) return str.split("folders/")[1].split("?")[0].split("/")[0]; 
  return str; 
}

function generateId(prefix) { 
  return `${prefix}_${Utilities.getUuid().replace(/-/g, "")}`; 
}

function invalidateCache(key) { 
  try { 
    if (key) CacheService.getScriptCache().remove(key); 
    else {
      CacheService.getScriptCache().remove("APP_CONFIG_V80");
      CacheService.getScriptCache().removeAllEntries();
    }
  } catch (e) {} 
}

// =========================================================================
// 4. THUẬT TOÁN TÍNH ÁN PHÍ VÀ ĐỌC TIỀN RA CHỮ PHÁP LÝ (NQ 326/2016)
// =========================================================================

function numberToWordsVi(so) { 
  if (so === 0 || so === "0" || so === "") return "Không đồng"; 
  so = parseInt(String(so).replace(/[^\d]/g, ''), 10); 
  if (isNaN(so) || so === 0) return "Không đồng"; 

  var chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]; 
  var donVi = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"]; 
  var numStr = String(so); 
  var blocks = []; 
  
  while (numStr.length > 0) { 
    blocks.push(numStr.slice(-3)); 
    numStr = numStr.slice(0, -3); 
  } 

  var str = ""; 
  for (var i = 0; i < blocks.length; i++) { 
    var blockStr = blocks[i]; 
    var val = parseInt(blockStr, 10); 
    
    if (val > 0) { 
      var isHighest = (i === blocks.length - 1); 
      if (!isHighest) { 
        while (blockStr.length < 3) blockStr = "0" + blockStr; 
      } 

      var tram = blockStr.length === 3 ? parseInt(blockStr[0], 10) : -1; 
      var chuc = blockStr.length >= 2 ? parseInt(blockStr[blockStr.length - 2], 10) : 0; 
      if (blockStr.length === 1) chuc = -1; 
      var donvi = parseInt(blockStr[blockStr.length - 1], 10); 
      
      var kq = ""; 
      if (tram !== -1) kq += chuSo[tram] + " trăm "; 

      if (chuc > 1) { 
        kq += chuSo[chuc] + " mươi "; 
        if (donvi === 1) kq += "mốt"; 
        else if (donvi === 5) kq += "lăm"; 
        else if (donvi > 0) kq += chuSo[donvi]; 
      } else if (chuc === 1) { 
        kq += "mười "; 
        if (donvi === 5) kq += "lăm"; 
        else if (donvi > 0) kq += chuSo[donvi]; 
      } else if (chuc === 0) { 
        if (donvi > 0) { 
          if (tram !== -1) kq += "lẻ "; 
          kq += chuSo[donvi]; 
        } 
      } else { 
        kq += chuSo[donvi]; 
      } 
      str = kq.trim() + " " + donVi[i] + " " + str; 
    } 
  } 

  str = str.replace(/\s+/g, " ").trim(); 
  str = str.charAt(0).toUpperCase() + str.slice(1) + " đồng"; 
  return str; 
}

function calculateCourtFee(loaiAn, giaTriRaw) { 
  var fee = 0; 
  var tamUng = 0; 
  if (loaiAn === 'hinhSu') { 
    fee = 200000; 
    tamUng = 0; 
  } else if (loaiAn === 'hanhChinh') { 
    fee = 300000; 
    tamUng = 300000; 
  } else { 
    var giaTri = parseInt(String(giaTriRaw).replace(/[^\d]/g, ''), 10) || 0; 
    var isKDTM = (loaiAn === 'kinhDoanh'); 
    var noPriceFee = isKDTM ? 3000000 : 300000; 

    if (giaTri <= 0) { 
      fee = noPriceFee; 
    } else { 
      if (giaTri <= 6000000) fee = 300000; 
      else if (giaTri <= 400000000) fee = isKDTM ? (3000000 + (giaTri - 6000000) * 0.05) : (giaTri * 0.05); 
      else if (giaTri <= 800000000) fee = (isKDTM ? 22700000 : 20000000) + (giaTri - 400000000) * 0.04; 
      else if (giaTri <= 2000000000) fee = (isKDTM ? 38700000 : 36000000) + (giaTri - 800000000) * 0.03; 
      else if (giaTri <= 4000000000) fee = (isKDTM ? 74700000 : 72000000) + (giaTri - 2000000000) * 0.02; 
      else fee = (isKDTM ? 114700000 : 112000000) + (giaTri - 4000000000) * 0.001; 
    } 
    fee = Math.round(fee); 
    tamUng = fee * 0.5; 
    if (tamUng < noPriceFee) tamUng = noPriceFee; 
    if (giaTri === 0) tamUng = fee; 
  } 

  return { 
    anPhiSo: fee.toLocaleString('vi-VN'), 
    anPhiChu: numberToWordsVi(fee), 
    tamUngSo: Math.round(tamUng).toLocaleString('vi-VN'), 
    tamUngChu: numberToWordsVi(Math.round(tamUng)) 
  }; 
}

// =========================================================================
// 5. CÔNG CỤ QUẢN TRỊ TỰ ĐỘNG CHUẨN HÓA & ĐÁNH SỐ 64 BIỂU MẪU CHUẨN
// =========================================================================

function TOOL_KiemKeVaDanhSoBieuMau() {
  var ui = SpreadsheetApp.getUi();
  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  var folderId = extractFolderId(config["ID_THUMUC_MAU"]);
  
  if (!folderId) {
    ui.alert("Lỗi", "Chưa cấu hình ID Thư mục mẫu trong sheet 5_CaiDat.", ui.ButtonSet.OK);
    return;
  }
  
  var folder = DriveApp.getFolderById(folderId);

  var archiveFolderName = "[LƯU TRỮ] Mẫu cũ & Không sử dụng";
  var archiveFolderIt = folder.getFoldersByName(archiveFolderName);
  var archiveFolder = archiveFolderIt.hasNext() ? archiveFolderIt.next() : folder.createFolder(archiveFolderName);

  var MASTER_LIST = [
    "01. Thông báo sửa đổi, bổ sung đơn khởi kiện",
    "02. Thông báo trả lại đơn khởi kiện",
    "03. Thông báo thụ lý vụ án",
    "04. Giấy triệu tập đương sự",
    "05. Bản tự khai",
    "06. Biên bản lấy lời khai",
    "07. Biên bản đối chất",
    "08. Thông báo yêu cầu giao nộp tài liệu chứng cứ",
    "09. Biên bản giao nhận tài liệu chứng cứ",
    "10. Biên bản xác minh",
    "11. Quyết định áp dụng biện pháp khẩn cấp tạm thời",
    "12. Quyết định thay đổi, hủy bỏ biện pháp khẩn cấp tạm thời",
    "13. Quyết định xem xét thẩm định tại chỗ",
    "14. Quyết định định giá tài sản",
    "15. Quyết định trưng cầu giám định",
    "16. Giấy triệu tập đo vẽ, thẩm định, định giá",
    "17. Biên bản xem xét thẩm định tại chỗ, đo vẽ, định giá tài sản",
    "18. Thông báo mở phiên họp kiểm tra việc giao nộp, tiếp cận công khai chứng cứ",
    "19. Biên bản kiểm tra việc giao nộp, tiếp cận, công khai chứng cứ",
    "20. Thông báo kết quả phiên họp công khai chứng cứ",
    "21. Biên bản hòa giải",
    "22. Biên bản hòa giải thành",
    "23. Biên bản tống đạt hòa giải thành",
    "24. Biên bản không tiến hành hòa giải được",
    "25. Quyết định công nhận sự thỏa thuận của đương sự",
    "26. Quyết định gia hạn thời hạn chuẩn bị xét xử",
    "27. Quyết định tạm đình chỉ giải quyết vụ án",
    "28. Quyết định tiếp tục giải quyết vụ án",
    "29. Quyết định đình chỉ giải quyết vụ án",
    "30. Báo cáo án",
    "31. Quyết định đưa vụ án ra xét xử",
    "32. Thông báo thay đổi thời gian xét xử",
    "33. Quyết định hoãn phiên tòa",
    "34. Thông báo hoãn phiên tòa",
    "35. Biên bản thảo luận về việc hoãn phiên tòa",
    "36. Thông báo mở lại phiên tòa",
    "37. Quyết định tạm ngừng phiên tòa",
    "38. Biên bản phiên tòa sơ thẩm",
    "39. Biên bản nghị án",
    "40. Bản án sơ thẩm",
    "41. Thông báo thụ lý việc HNGĐ",
    "42. Biên bản lấy lời khai con chung",
    "43. Biên bản hòa giải (HNGĐ)",
    "44. Biên bản ghi nhận sự tự nguyện ly hôn và hòa giải thành",
    "45. Quyết định công nhận thuận tình ly hôn",
    "46. Thông báo thụ lý việc dân sự",
    "47. Quyết định thông báo tìm kiếm người vắng mặt tại nơi cư trú",
    "48. Quyết định mở phiên họp giải quyết việc dân sự",
    "49. Quyết định hoãn phiên họp giải quyết việc dân sự",
    "50. Biên bản phiên họp giải quyết việc dân sự",
    "51. Biên bản thảo luận giải quyết việc dân sự",
    "52. Quyết định giải quyết việc dân sự",
    "53. Thông báo thụ lý vụ án hành chính",
    "54. Thông báo mở phiên họp kiểm tra CKCC và đối thoại",
    "55. Biên bản kiểm tra việc giao nộp CKCC (Hành chính)",
    "56. Biên bản đối thoại",
    "57. Biên bản đối thoại thành",
    "58. Quyết định công nhận kết quả đối thoại thành",
    "59. Quyết định đưa vụ án ra xét xử hành chính",
    "60. Bản án hành chính sơ thẩm",
    "61. Biên bản ghi nhận kết quả hòa giải thành (HGĐT)",
    "62. Quyết định công nhận kết quả hòa giải thành (HGĐT)",
    "63. Biên bản tống đạt văn bản tố tụng",
    "64. Bì thư gửi bưu điện"
  ];

  function getCleanKeyword(str) {
    if (!str) return "";
    return str.replace(/^\s*\d+[a-zA-Z]*[\.\-\s]+/i, '')
              .toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
              .replace(/[^a-z0-9]/g, '');
  }

  var keywordMapping = MASTER_LIST.map(function(name, index) {
    return { 
      index: index, 
      masterName: name, 
      matchKey: getCleanKeyword(name) 
    };
  });

  keywordMapping.sort(function(a, b) { return b.matchKey.length - a.matchKey.length; });

  var bins = [];
  for (var i = 0; i < 64; i++) bins.push([]);
  var orphans = [];

  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var fName = f.getName();
    var mime = f.getMimeType();
    
    if (fName.toLowerCase().includes("placeholder") || fName.toLowerCase().includes("từ điển")) continue;
    if (mime !== MimeType.GOOGLE_DOCS && !fName.endsWith('.docx') && !fName.endsWith('.doc')) continue;

    var cleanDriveName = getCleanKeyword(fName);
    var matchedIndex = -1;

    for (var m = 0; m < keywordMapping.length; m++) {
      if (cleanDriveName.includes(keywordMapping[m].matchKey)) {
        matchedIndex = keywordMapping[m].index;
        break;
      }
    }

    if (matchedIndex !== -1) {
      var len = 0;
      try {
        if (mime === MimeType.GOOGLE_DOCS) {
          len = DocumentApp.openById(f.getId()).getBody().getText().trim().length;
        } else {
          len = 500;
        }
      } catch(e) {}
      
      bins[matchedIndex].push({ file: f, length: len, originalName: fName });
    } else {
      var hasNumAtStart = /^\s*\d+/.test(fName);
      if (hasNumAtStart) orphans.push(f);
    }
  }

  var deletedCount = 0;
  var renamedCount = 0;
  var createdCount = 0;
  var archivedCount = 0;

  for (var j = 0; j < MASTER_LIST.length; j++) {
    var filesInBin = bins[j];
    var targetName = MASTER_LIST[j];

    if (filesInBin.length === 0) {
      var newDoc = DocumentApp.create(targetName);
      var docFile = DriveApp.getFileById(newDoc.getId());
      docFile.moveTo(folder);
      createdCount++;
    } 
    else if (filesInBin.length === 1) {
      if (filesInBin[0].file.getName() !== targetName) {
        filesInBin[0].file.setName(targetName);
        renamedCount++;
      }
    } 
    else {
      filesInBin.sort(function(a, b) { return b.length - a.length; });

      var masterFile = filesInBin[0].file;
      if (masterFile.getName() !== targetName) {
        masterFile.setName(targetName);
        renamedCount++;
      }

      for (var k = 1; k < filesInBin.length; k++) {
        var dupFileObj = filesInBin[k];
        if (dupFileObj.length < 50) {
          dupFileObj.file.setTrashed(true);
          deletedCount++;
        } else {
          var safeSuffix = Math.floor(Math.random() * 1000);
          dupFileObj.file.setName("[BẢN TRÙNG] " + targetName + " - " + safeSuffix);
          dupFileObj.file.moveTo(archiveFolder);
          archivedCount++;
        }
      }
    }
  }

  for (var z = 0; z < orphans.length; z++) {
    orphans[z].moveTo(archiveFolder);
    archivedCount++;
  }

  ui.alert("TỔ CHỨC & CHUẨN HÓA KHO MẪU HOÀN TẤT!", 
    "✅ Đã chuẩn hóa tên và đánh số tuyệt đối từ 01 đến 64 cho: " + renamedCount + " biểu mẫu.\n" +
    "✨ Đã bổ sung: " + createdCount + " biểu mẫu còn thiếu.\n" +
    "🗑️ Đã xóa vĩnh viễn: " + deletedCount + " tệp trắng bị trùng lặp.\n" +
    "📦 Đã cất gọn " + archivedCount + " tệp rác/tệp trùng lặp vào thư mục LƯU TRỮ.\n\n" +
    "Kho biểu mẫu Google Drive đã được sắp xếp ngăn nắp và sạch sẽ!", 
    ui.ButtonSet.OK);
}