/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.5.3 - GROQ AI EDITION
 * FILE 2: TIỆN ÍCH HỆ THỐNG (UTILITIES, FORMATTERS, HELPERS)
 * ------------------------------------------------------------
 * BẢN CẬP NHẬT THEO YÊU CẦU:
 * - Sửa lỗi ngày tháng: Bắt buộc chèn số "0" cho ngày/tháng < 10 (VD: ngày 02 tháng 05).
 * - Sửa lỗi số điện thoại: Tự động khôi phục số 0 ở đầu nếu bị mất.
 * - Bổ sung hàm tiện ích: getLoaiAnRutGon() (HS, DS, HNGĐ...) và getThoiGianGiaHanText().
 */

// ============================================================
// 1. THƯ VIỆN XỬ LÝ NGÀY THÁNG (LIBDATE)
// ============================================================
var LibDate = {
  toVNString: function(val) {
    var d = this.parse(val);
    if (!d) return "---";
    return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, APP_CONFIG.FORMAT_VN);
  },

  parse: function(val) {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val)) return val;
    var s = String(val).trim();
    try {
      if (s.includes("/")) {
        var dateTimeParts = s.split(" ");
        var datePart = dateTimeParts[0];
        var p = datePart.split("/");
        if (p.length === 3 && p[2] && p[2].length === 4) {
          var date = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
          if (dateTimeParts.length > 1 && dateTimeParts[1].includes(":")) {
            var timeParts = dateTimeParts[1].split(":");
            date.setHours(parseInt(timeParts[0]) || 0, parseInt(timeParts[1]) || 0, 0, 0);
          }
          return date;
        }
      }
      if (s.includes("-") && s.split("-")[0].length === 4) {
        var p2 = s.split("-");
        return new Date(parseInt(p2[0]), parseInt(p2[1]) - 1, parseInt(p2[2]));
      }
      if (!isNaN(s) && s.length >= 4 && s.length <= 6) {
        var dExcel = new Date(1899, 11, 30);
        dExcel.setDate(dExcel.getDate() + parseInt(s));
        return dExcel;
      }
      var dDefault = new Date(val);
      return isNaN(dDefault.getTime()) ? null : dDefault;
    } catch (e) {
      return null;
    }
  },

  fmt: function(val, type) {
    var d = this.parse(val);
    if (!d) return "";
    var format = (type === 'ISO') ? APP_CONFIG.FORMAT_ISO : APP_CONFIG.FORMAT_VN;
    return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, format);
  },

  /**
   * ĐÃ SỬA: Bắt buộc định dạng 2 chữ số (02 thay vì 2) cho ngày và tháng
   */
  toVNText: function(val, isCap) {
    var d = this.parse(val);
    if (!d) return isCap ? "Ngày... tháng... năm..." : "ngày... tháng... năm...";
    
    // Thêm "0" ở trước nếu < 10
    var ngay = ("0" + d.getDate()).slice(-2); 
    var thang = ("0" + (d.getMonth() + 1)).slice(-2);
    var nam = d.getFullYear();
    
    var prefix = isCap ? "Ngày " : "ngày ";
    return `${prefix}${ngay} tháng ${thang} năm ${nam}`;
  },

  fmtFullTime: function(dateStr, timeStr) {
    if (!dateStr || !timeStr) return ".......giờ.......phút, ngày.......tháng.......năm.......";
    var d = this.parse(dateStr);
    var t = String(timeStr).split(":");
    var hh = ("0" + (t[0] || "00")).slice(-2);
    var mm = ("0" + (t[1] || "00")).slice(-2);
    return `${hh} giờ ${mm} phút, ${this.toVNText(d, false)}`;
  }
};

// ============================================================
// 2. TIỆN ÍCH XỬ LÝ VĂN BẢN (TEXT UTILS)
// ============================================================

function toTitleCase(str) {
  if (!str) return "";
  var words = str.toString().trim().split(/\s+/);
  var keepUpper = ["TNHH", "MTV", "CP", "UBND", "TAND", "VKSND", "VN", "JSC", "BHTG", "HTX", "NHCSXH", "NH TMCP", "NHTMCP"];
  return words.map(w => {
    var upperW = w.toUpperCase();
    if (keepUpper.includes(upperW)) return upperW;
    return upperW.charAt(0) + w.slice(1).toLowerCase();
  }).join(" ");
}

function cleanTextForPlaceholder(text) {
  if (!text) return "";
  return text.toString().trim().replace(/\s+/g, ' ');
}

/**
 * ĐÃ SỬA: Tự động khôi phục số 0 nếu người dùng nhập bị mất (VD: 954588544 -> 0954588544)
 */
function formatPhoneNumber(phone) {
  if (!phone) return "";
  let str = String(phone).trim().replace(/[^0-9+]/g, '');
  // Nếu số dài 9 ký tự và không bắt đầu bằng số 0 (Do Excel ép kiểu)
  if (str.length === 9 && str.charAt(0) !== '0' && str.charAt(0) !== '+') {
    str = '0' + str;
  }
  return str;
}

function extractShortNo(fullSoTL) {
  if (!fullSoTL) return "";
  return fullSoTL.toString().split('/')[0].trim();
}

/**
 * Lấy Loại án rút gọn phục vụ tạo số văn bản (Req 1)
 */
function getLoaiAnRutGon(loaiAn) {
  if (!loaiAn) return "DS";
  if (loaiAn.includes("1. Hình sự")) return "HS";
  else if (loaiAn.includes("3. Hôn nhân")) return "HNGĐ";
  else if (loaiAn.includes("4. Kinh doanh")) return "KDTM";
  else if (loaiAn.includes("5. Lao động")) return "LĐ";
  else if (loaiAn.includes("6. Hành chính")) return "HC";
  else if (loaiAn.includes("7. Hòa giải")) return "HGĐT";
  return "DS";
}

/**
 * Lấy text thời gian gia hạn tùy theo loại án (Req 1)
 */
function getThoiGianGiaHanText(loaiAn) {
  var ext = APP_CONFIG.DEADLINES_EXT[loaiAn] || 2;
  return ("0" + ext).slice(-2) + " tháng";
}

function buildFullCaseNumber(shortNo, loaiAn, dateVal) {
  if (!shortNo) return "";
  var prefix = shortNo.toString().split('/')[0];
  var cleanNumber = prefix.replace(/\D/g, '');
  var d = LibDate.parse(dateVal);
  var year = d ? d.getFullYear() : new Date().getFullYear();
  var acronym = getLoaiAnRutGon(loaiAn);
  return `${cleanNumber}/${year}/TLST-${acronym}`;
}

// ============================================================
// 3. TIỆN ÍCH HỆ THỐNG & DRIVE
// ============================================================

function extractFolderId(input) {
  if (!input) return "";
  var str = input.toString().trim();
  if (str.includes("id=")) return str.split("id=")[1].split("&")[0];
  if (str.includes("folders/")) return str.split("folders/")[1].split("?")[0].split("/")[0];
  return str;
}

function generateId(prefix) {
  return `${prefix}_${new Date().getTime()}_${Math.floor(Math.random() * 100)}`;
}

// ============================================================
// 4. THUẬT TOÁN TÍNH ÁN PHÍ
// ============================================================

function numberToWordsVi(number) {
  if (number === 0) return "Không đồng";
  var units = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
  var digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
 
  function readGroup(n) {
    if (n === 0) return "";
    var text = "";
    var h = Math.floor(n / 100);
    var t = Math.floor((n % 100) / 10);
    var u = n % 10;
    if (h > 0) text += digits[h] + " trăm ";
    if (t > 1) { 
      text += digits[t] + " mươi ";
      if (u === 1) text += "mốt"; 
    } else if (t === 1) {
      text += "mười ";
      if (u === 5) text += "lăm";
    } else if (h > 0 && u > 0) {
      text += "linh ";
    }
    if (u > 0 && t !== 1) {
      if (u === 5 && t > 0) text += "lăm";
      else if (u !== 1 || t === 0) text += digits[u];
    }
    return text.trim();
  }
 
  var result = "";
  if (number < 0) { result = "Âm "; number = -number; }
  if (number === 0) return "Không đồng";
 
  var i = 0;
  while (number > 0) {
    var group = number % 1000;
    if (group > 0) {
      result = readGroup(group) + units[i] + " " + result;
    }
    number = Math.floor(number / 1000);
    i++;
  }
 
  result = result.trim() + " đồng";
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function calculateCourtFee(loaiAn, giaTriRaw) {
  var fee = 0;
  var tamUng = 0;
 
  if (loaiAn === 'hinhSu') {
     fee = 200000; tamUng = 0;
  } else if (loaiAn === 'hanhChinh') {
     fee = 300000; tamUng = 300000;
  } else {
      var giaTri = parseInt(String(giaTriRaw).replace(/[^\d]/g, '')) || 0;
      var isKDTM = (loaiAn === 'kinhDoanh');
      var noPriceFee = isKDTM ? 3000000 : 300000;

      if (giaTri <= 0) { fee = noPriceFee; }
      else {
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

function invalidateCache(key) {
  try {
    if (key) {
      CacheService.getScriptCache().remove(key);
    } else {
      CacheService.getScriptCache().removeAllEntries();
    }
  } catch (e) {
    console.error("Lỗi khi xóa Cache: " + e.message);
  }
}