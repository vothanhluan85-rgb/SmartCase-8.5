/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN - TÒA ÁN NHÂN DÂN
 * TỆP: 6_VanBan.gs - ĐỘNG CƠ SOẠN THẢO VĂN BẢN & TRỘN THƯ TỐ TỤNG MASTER (V8.0)
 * -------------------------------------------------------------------------
 * - TRUNG TÂM ĐIỀU PHỐI ĐẦU RA CHO TOÀN BỘ 64 BIỂU MẪU CHUẨN TANDTC.
 * - KẾT NỐI 100% VỚI BẢNG TỪ ĐIỂN Config_Placeholders.gs & CƠ SỞ DỮ LIỆU.
 * - HOÀN THIỆN ĐẦY ĐỦ CẢ 3 DẠNG CHỮ: {Tên} (Tiêu đề), {tên} (Thường), {TÊN} (HOA).
 * - TỰ ĐỘNG GOM CẢ 2 VỢ CHỒNG VÀO {Người yêu cầu chi tiết} TRONG THUẬN TÌNH LY HÔN.
 * - TỰ ĐỘNG TÍNH ÁN PHÍ, ĐỌC TIỀN THÀNH CHỮ & ĐỊNH DẠNG NGÀY THÁNG TƯ PHÁP.
 * =========================================================================
 */

// =========================================================================
// MỤC 1: TRUY VẤN BIỂU MẪU & TỰ ĐỘNG RÚT TRÍCH TỪ DRIVE
// =========================================================================

function api_LayDanhSachBieuMau_Logic() {
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var folderId = extractFolderId(config["ID_THUMUC_MAU"]);
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

function api_ScanTemplateRequirements_Logic(templateIds) {
  try {
    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) return { success: true, placeholders: [], templates: [] };
    var allPlaceholders = [], templateDetails = [];
    templateIds.forEach(function(tplId) {
      if (!tplId) return;
      try {
        var doc = DocumentApp.openById(tplId);
        var docName = doc.getName();
        var body = doc.getBody();
        var text = body ? body.getText() : "";
        var header = doc.getHeader(); if (header) text += "\n" + header.getText();
        var footer = doc.getFooter(); if (footer) text += "\n" + footer.getText();
        var matches = text.match(/\{[^\{\}\n\r]+\}/g) || [];
        var uniqueForDoc = [];
        matches.forEach(function(ph) {
          var cleanPh = ph.trim();
          if (!uniqueForDoc.includes(cleanPh)) uniqueForDoc.push(cleanPh);
          if (!allPlaceholders.includes(cleanPh)) allPlaceholders.push(cleanPh);
        });
        templateDetails.push({ id: tplId, name: docName, placeholders: uniqueForDoc });
      } catch (errDoc) {
        templateDetails.push({ id: tplId, name: "Biểu mẫu", error: errDoc.message, placeholders: [] });
      }
    });
    return { success: true, placeholders: allPlaceholders, templates: templateDetails };
  } catch (e) { return { success: false, error: e.message }; }
}

function backend_AutoExtractMediationAgreement(idVuAn, folderUrl) {
  try {
    if (!folderUrl || !folderUrl.includes("http")) return null;
    var folderId = extractFolderId(folderUrl);
    if (!folderId) return null;
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var targetDoc = null;
    while (files.hasNext()) {
      var f = files.next(), fName = f.getName().toLowerCase(), mime = f.getMimeType();
      if ((mime === MimeType.GOOGLE_DOCS || fName.endsWith('.docx') || fName.endsWith('.doc')) && (fName.includes("hòa giải") || fName.includes("hoa giai") || fName.includes("ly hôn"))) { 
        targetDoc = f; 
        break; 
      }
    }
    if (!targetDoc) return null;

    var fullText = "";
    if (targetDoc.getMimeType() === MimeType.GOOGLE_DOCS) fullText = DocumentApp.openById(targetDoc.getId()).getBody().getText();
    else {
      try {
        var blob = targetDoc.getBlob();
        var tempFile = Drive.Files.create({ name: "TEMP_BBHG_" + Date.now(), mimeType: MimeType.GOOGLE_DOCS }, blob);
        fullText = DocumentApp.openById(tempFile.id).getBody().getText();
        Drive.Files.remove(tempFile.id);
      } catch(e) { return null; }
    }
    if (!fullText) return null;

    var patternStart = /(?:NHỮNG NỘI DUNG (?:ĐÃ ĐƯỢC CÁC ĐƯƠNG SỰ|CÁC ĐƯƠNG SỰ) (?:THỐNG NHẤT|THỎA THUẬN)[^\n]*|II\.\s*NHỮNG NỘI DUNG[^\n]*|NHỮNG NỘI DUNG ĐÃ ĐƯỢC CÁC ĐƯƠNG SỰ[^\n]*)/i;
    var matchStart = fullText.match(patternStart);
    if (!matchStart) return null;

    var startIndex = matchStart.index + matchStart[0].length;
    var textFromHeading = fullText.substring(startIndex);
    var patternEnd = /(?:NHỮNG SỬA ĐỔI|Biên bản kết thúc lúc|Phiên hoà giải kết thúc|Các bên đương sự|Thư ký Toà án|Thẩm phán\s*-\s*Chủ trì)/i;
    var matchEnd = textFromHeading.match(patternEnd);
    var agreementText = matchEnd ? textFromHeading.substring(0, matchEnd.index).trim() : textFromHeading.trim();

    if (agreementText && agreementText.length > 15) {
      if (typeof readCaseMemoryFromDrive === 'function' && typeof saveCaseMemoryToDrive === 'function') {
        var currentMemory = readCaseMemoryFromDrive(folderUrl);
        currentMemory.variables = currentMemory.variables || {};
        currentMemory.variables["{Nội dung thỏa thuận}"] = agreementText;
        currentMemory.variables["{Nội dung hòa giải thành}"] = agreementText;
        saveCaseMemoryToDrive(folderUrl, currentMemory);
      }
      return agreementText;
    }
  } catch(e) { console.warn("Lỗi tự động rút trích: " + e.message); }
  return null;
}

function api_ScanCaseDriveSmartMilestone(idVuAn) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(), sheetAn = ss.getSheetByName("1_SoThuLy");
    if (!sheetAn) return { success: false, error: "Không tìm thấy bảng 1_SoThuLy." };
    var finder = sheetAn.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
    if (!finder) return { success: false, error: "Không tìm thấy hồ sơ vụ án." };

    var folderUrl = sheetAn.getRange(finder.getRow(), 8).getValue();
    var agreementText = backend_AutoExtractMediationAgreement(idVuAn, folderUrl);

    if (agreementText) {
      var currentMemory = (typeof readCaseMemoryFromDrive === 'function') ? readCaseMemoryFromDrive(folderUrl) : {};
      return { success: true, variables: currentMemory.variables || { "{Nội dung thỏa thuận}": agreementText }, narratives: currentMemory.narratives || {} };
    }
    return { success: false, error: "Không tìm thấy văn bản Biên bản hòa giải nào trong thư mục Drive của vụ án." };
  } catch(e) { return { success: false, error: e.message }; }
}

// =========================================================================
// MỤC 2: TIỆN ÍCH NLP, CHUẨN HÓA DANH XƯNG & THỂ THỨC TỐ TỤNG
// =========================================================================

function isIndividualHonorific(xh) {
  if (!xh) return false;
  var x = String(xh).trim().toLowerCase();
  var legalEntities = ["tổ chức", "pháp nhân", "công ty", "doanh nghiệp", "ubnd", "ngân hàng", "chi nhánh", "hợp tác xã", "cơ quan"];
  if (legalEntities.includes(x)) return false;
  return ["ông", "bà", "anh", "chị", "cháu", "ông/bà"].includes(x);
}

function cleanHonorificFromName(name) {
  if (!name) return "";
  return String(name).replace(/^(Ông|Bà|Anh|Chị|Cháu|ông|bà|anh|chị|cháu)\s+/i, '').trim();
}

function toTitleCase(str) {
  if (!str) return "";
  var acronyms = [
    "TMCP", "TNHH", "CP", "MTV", "UBND", "TAND", "VKSND", "VN", "JSC", "BHTG", 
    "HTX", "NHCSXH", "NHTMCP", "NH", "BIDV", "ACB", "MB", "VPBANK", "VIETINBANK", 
    "VIETCOMBANK", "AGRIBANK", "SHB", "TPBANK", "HDBANK", "VIB", "MSB", "OCB", 
    "SEABANK", "LPBANK", "SCB", "SACOMBANK", "ABBANK", "BAB", "NCB", "QLTA"
  ];
  var words = String(str).trim().split(/\s+/);
  return words.map(function(w) {
    var upperW = w.toUpperCase();
    if (acronyms.includes(upperW)) return upperW;
    if (w.includes("'") || w.includes("’")) {
      return w.split(/['’]/).map(function(p) { return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : ""; }).join("'");
    }
    return upperW.charAt(0) + w.slice(1).toLowerCase();
  }).join(" ");
}

function formatPhoneNumber(phone) {
  if (!phone) return "";
  var str = String(phone).trim().replace(/[^0-9+]/g, '');
  if (str.length > 0 && str.charAt(0) !== '0' && str.charAt(0) !== '+') str = '0' + str;
  return str;
}

function escapeRegex(str) { return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function cleanChildSlotPrefix(str) { return String(str || "").replace(/^(\d+(\.\d+)*\.?\s*(Về\s*)?[^:\n]*:\s*)+/i, '').trim(); }

function extractFlatMembers(groupsOrMembers) {
  var flatList = [];
  if (!groupsOrMembers || !Array.isArray(groupsOrMembers)) return flatList;
  groupsOrMembers.forEach(function(item) {
    if (item.members && Array.isArray(item.members)) {
      item.members.forEach(function(m) { m._diaChiGoc = item.diaChi || m.diaChi || ""; flatList.push(m); });
    } else if (item.hoTen) { 
      item._diaChiGoc = item.diaChi || ""; 
      flatList.push(item); 
    }
  });
  return flatList;
}

function inferProceduralHonorific(m) {
  if (!m) return "ông";
  var rawXh = String(m.xungHo || m.title || "").trim();
  var rawXhLower = rawXh.toLowerCase();
  var rawName = String(m.hoTen || m.name || "").trim();

  if (rawXh && !isIndividualHonorific(rawXhLower)) return "";
  if (rawXh && isIndividualHonorific(rawXhLower) && rawXhLower !== "ông/bà") {
    return rawXhLower;
  }

  var prefixMatch = rawName.match(/^(Ông|Bà|Anh|Chị|Cháu|ông|bà|anh|chị|cháu)\b/i);
  if (prefixMatch) return prefixMatch[1].toLowerCase();

  var normalizedName = " " + rawName.toLowerCase() + " ";
  var femaleIdentifiers = [
    " thị ", " thúy ", " thuy ", " trang ", " nhị ", " hằng ", " nga ", " hoa ", 
    " hương ", " lan ", " mai ", " cúc ", " ngọc ", " liên ", " loan ", " phượng ", 
    " duyên ", " thảo ", " phương ", " diệp ", " quỳnh ", " oanh ", " yến ", " vân "
  ];

  for (var i = 0; i < femaleIdentifiers.length; i++) {
    if (normalizedName.includes(femaleIdentifiers[i])) return "bà";
  }

  return "ông";
}

function getOfficerHonorific(rawName, defaultTitle) {
  if (!rawName || rawName.trim() === "") return defaultTitle || "Ông";
  var rawLower = rawName.toLowerCase().trim();
  if (rawLower.startsWith("bà ") || rawLower.startsWith("chị ")) return "Bà";
  if (rawLower.startsWith("ông ") || rawLower.startsWith("anh ")) return "Ông";
  return defaultTitle || "Ông";
}

// =========================================================================
// MỤC 3: GHÉP NỐI ĐƯƠNG SỰ & XÂY DỰNG TỪ ĐIỂN PLACEHOLDER CHUẨN
// =========================================================================

function formatRepsBlock(repJson) {
  if (!repJson) return "";
  try {
    var reps = typeof repJson === 'string' ? JSON.parse(repJson) : repJson;
    if (!Array.isArray(reps) || reps.length === 0) return "";
    return reps.map(function(r) {
      var xh = isIndividualHonorific(r.xungHo) ? (toTitleCase(r.xungHo) + " ") : "";
      var name = toTitleCase(cleanHonorificFromName(r.hoTen || r.name || ""));
      return `\n${r.tuCach || "Người đại diện"}: ${xh}${name}${(r.namSinh||r.year) ? ", sinh năm "+(r.namSinh||r.year) : ""}${(r.diaChi||r.address) ? ", địa chỉ: "+(r.diaChi||r.address) : ""}${(r.sdt||r.phone) ? ", SĐT: "+formatPhoneNumber(r.sdt||r.phone) : ""}${(r.vanBan||r.date) ? " (Theo VB ủy quyền ngày "+String(r.vanBan||r.date).trim()+")" : ""};`;
    }).join("");
  } catch(e) { return "\nNgười đại diện: " + repJson; }
}

function getRepresentativeParagraphItems(repJson, isLastPartyOfDocument) {
  try {
    if (!repJson) return [];
    var validReps = (typeof repJson === 'string' ? JSON.parse(repJson) : repJson).filter(function(r) { return r && (r.hoTen || r.name); });
    if (validReps.length === 0) return [];
    var repItems = [], repGroups = validReps.reduce(function(acc, r) {
      var type = r.tuCach ? r.tuCach.trim() : (r.type === 'pl' ? 'Người đại diện theo pháp luật' : (r.type === 'ls' ? 'Luật sư bảo vệ quyền và lợi ích hợp pháp' : 'Người đại diện theo ủy quyền'));
      acc[type] = acc[type] || []; acc[type].push(r); return acc;
    }, {});

    for (var typeKey in repGroups) {
      var list = repGroups[typeKey], isUQ = typeKey.toLowerCase().includes("ủy quyền");
      if (list.length === 1) {
        var r = list[0], xh = isIndividualHonorific(r.xungHo || r.title) ? (toTitleCase(r.xungHo || r.title) + " ") : "", name = toTitleCase(cleanHonorificFromName(r.hoTen || r.name || ""));
        var vbStr = (isUQ && (r.vanBan || r.date)) ? ` (Theo văn bản ủy quyền ngày ${(r.vanBan || r.date).trim()})` : "";
        repItems.push({ text: `${typeKey}: ${xh}${name}${(r.namSinh||r.year) ? ", sinh năm "+(r.namSinh||r.year) : ""}${(r.diaChi||r.address) ? ", địa chỉ: "+(r.diaChi||r.address) : ""}${(r.sdt||r.phone) ? ", SĐT: "+formatPhoneNumber(r.sdt||r.phone) : ""}${vbStr}${isLastPartyOfDocument ? "." : ";"}`, boldWords: [name] });
      } else {
        repItems.push({ text: `${typeKey}:`, boldWords: [] });
        var commonDate = ""; list.forEach(function(r) { if (r.vanBan || r.date) commonDate = String(r.vanBan || r.date).trim(); });
        list.forEach(function(r, idx) {
          var isLastRep = (idx === list.length - 1), xh = isIndividualHonorific(r.xungHo || r.title) ? (toTitleCase(r.xungHo || r.title) + " ") : "", name = toTitleCase(cleanHonorificFromName(r.hoTen || r.name || ""));
          var vbStr = ""; if (isUQ) { if (r.vanBan || r.date) vbStr = ` (Theo văn bản ủy quyền ngày ${String(r.vanBan || r.date).trim()})`; else if (isLastRep && commonDate) vbStr = ` (Theo văn bản ủy quyền ngày ${commonDate})`; }
          repItems.push({ text: `- ${xh}${name}${(r.namSinh||r.year) ? ", sinh năm "+(r.namSinh||r.year) : ""}${(r.diaChi||r.address) ? ", địa chỉ: "+(r.diaChi||r.address) : ""}${(r.sdt||r.phone) ? ", SĐT: "+formatPhoneNumber(r.sdt||r.phone) : ""}${vbStr}${(isLastPartyOfDocument && isLastRep) ? "." : ";"}`, boldWords: [name] });
        });
      }
    }
    return repItems;
  } catch (e) { return []; }
}

function getBlockType1Items(parties) {
  if (!parties || parties.length === 0) return [{ text: ".......................................................", boldWords: [] }];
  var items = [];
  parties.forEach(function(ds, i) {
    var isLast = (i === parties.length - 1), isInd = isIndividualHonorific(ds.xungHo), xh = isInd ? ((ds.xungHo && ds.xungHo !== "Ông/Bà") ? toTitleCase(ds.xungHo) + " " : "Ông/bà ") : "";
    var name = toTitleCase(cleanHonorificFromName(ds.hoTen)), repItems = getRepresentativeParagraphItems(ds.daiDien, isLast);
    items.push({ text: `${i + 1}. ${xh}${name}${ds.namSinh ? ", sinh năm "+ds.namSinh : ""}${ds.diaChi ? ", địa chỉ: "+ds.diaChi : ""}${ds.tuCach ? "; là "+ds.tuCach.toLowerCase() : ""}${(repItems.length > 0 || !isLast) ? ";" : "."}`, boldWords: [name] });
    repItems.forEach(function(rp) { items.push(rp); });
  });
  return items;
}

function getBlockType2Items(parties) {
  if (!parties || parties.length === 0) return [{ text: ".......................................................", boldWords: [] }];
  var groups = parties.reduce(function(acc, ds) { acc[ds.tuCach] = acc[ds.tuCach] || []; acc[ds.tuCach].push(ds); return acc; }, {});
  var items = [], mIdx = 1, roleKeys = Object.keys(groups);
  for (var r = 0; r < roleKeys.length; r++) {
    var role = roleKeys[r], memberList = groups[role], isLastGroup = (r === roleKeys.length - 1);
    if (memberList.length === 1) {
      var ds = memberList[0], isInd = isIndividualHonorific(ds.xungHo), xh = isInd ? ((ds.xungHo && ds.xungHo !== "Ông/Bà") ? toTitleCase(ds.xungHo) + " " : "Ông/bà ") : "";
      var name = toTitleCase(cleanHonorificFromName(ds.hoTen)), repItems = getRepresentativeParagraphItems(ds.daiDien, isLastGroup);
      items.push({ text: `${mIdx}. ${role}: ${xh}${name}${ds.namSinh ? ", sinh năm "+ds.namSinh : ""}${ds.diaChi ? "; địa chỉ: "+ds.diaChi : ""}${(repItems.length > 0 || !isLastGroup) ? ";" : "."}`, boldWords: [name] });
      repItems.forEach(function(rp) { items.push(rp); });
    } else {
      items.push({ text: `${mIdx}. ${role}:`, boldWords: [] });
      memberList.forEach(function(ds, subIdx) {
        var isLastMember = isLastGroup && (subIdx === memberList.length - 1), isInd = isIndividualHonorific(ds.xungHo), xh = isInd ? ((ds.xungHo && ds.xungHo !== "Ông/Bà") ? toTitleCase(ds.xungHo) + " " : "Ông/bà ") : "";
        var name = toTitleCase(cleanHonorificFromName(ds.hoTen)), repItems = getRepresentativeParagraphItems(ds.daiDien, isLastMember);
        items.push({ text: `${mIdx}.${subIdx + 1}. ${xh}${name}${ds.namSinh ? ", sinh năm "+ds.namSinh : ""}${ds.diaChi ? "; địa chỉ: "+ds.diaChi : ""}${(repItems.length > 0 || !isLastMember) ? ";" : "."}`, boldWords: [name] });
        repItems.forEach(function(rp) { items.push(rp); });
      });
    }
    mIdx++;
  }
  return items;
}

function getPartyDetailItems(groups) {
  if (!groups || groups.length === 0) return [{ text: ".......................................................", boldWords: [] }];
  var allNames = [], text = buildSmartPartyStringBackend(groups, false);
  groups.forEach(function(g) { g.members.forEach(function(m) { var n = toTitleCase(cleanHonorificFromName(m.hoTen)); if (n) allNames.push(n); }); });
  return [{ text: text, boldWords: allNames }];
}

function buildShortPartyStringBackend(groups, isLowerXungHo) {
  if (!groups || groups.length === 0) return "..........................................";
  var allMembers = extractFlatMembers(groups);
  var names = allMembers.map(function(m, index) {
    var isInd = isIndividualHonorific(m.xungHo), xh = "";
    if (isInd) {
      var rawXh = String(m.xungHo || "Ông/bà").trim();
      if (isLowerXungHo || index > 0) xh = rawXh.toLowerCase() + " ";
      else { 
        if (rawXh.toLowerCase() === "ông/bà") rawXh = "Ông/bà"; 
        xh = rawXh.charAt(0).toUpperCase() + rawXh.slice(1).toLowerCase() + " "; 
      }
    }
    return (xh + toTitleCase(cleanHonorificFromName(m.hoTen))).trim();
  });
  return names.join(", ");
}

function buildSmartPartyStringBackend(groups, isLowerXungHo) {
  if (!groups || groups.length === 0) return ".......................................................";
  var groupStrings = groups.map(function(g) {
    var memStrs = g.members.map(function(m, mIndex) {
      var isInd = isIndividualHonorific(m.xungHo), xh = "";
      if (isInd) {
        var rawXh = String(m.xungHo || "Ông/bà").trim();
        if (isLowerXungHo || mIndex > 0) xh = rawXh.toLowerCase() + " ";
        else { 
          if (rawXh.toLowerCase() === "ông/bà") rawXh = "Ông/bà"; 
          xh = rawXh.charAt(0).toUpperCase() + rawXh.slice(1).toLowerCase() + " "; 
        }
      }
      return xh + toTitleCase(cleanHonorificFromName(m.hoTen)) + (m.namSinh && isInd ? `, sinh năm ${m.namSinh}` : "");
    });
    var groupStr = "";
    if (memStrs.length === 1) { 
      groupStr = memStrs[0]; 
      if (g.diaChi) groupStr += `, địa chỉ: ${g.diaChi}`; 
    } else { 
      groupStr = memStrs.join(", "); 
      if (g.diaChi) groupStr += ` (cùng địa chỉ: ${g.diaChi})`; 
    }
    return groupStr;
  });
  return groupStrings.join("; ");
}

function backend_buildExactPlaceholders(phMap, roleKey, groups) {
  var allMembers = extractFlatMembers(groups);
  for (var idx = 0; idx < Math.max(allMembers.length, 3); idx++) {
    var num = idx + 1, m = allMembers[idx];
    var pNameHoa = `{Họ và tên ${roleKey} ${num}}`, pNameThuong = `{họ và tên ${roleKey.toLowerCase()} ${num}}`, pNameUpper = `{HỌ VÀ TÊN ${roleKey.toUpperCase()} ${num}}`;
    var pRoleHoa = `{${roleKey} ${num}}`, pRoleThuong = `{${roleKey.toLowerCase()} ${num}}`, pRoleUpper = `{${roleKey.toUpperCase()} ${num}}`;
    var pXhHoa = `{Xưng hô ${roleKey} ${num}}`, pXhThuong = `{xưng hô ${roleKey.toLowerCase()} ${num}}`;
    var pNsHoa = `{Năm sinh ${roleKey} ${num}}`, pNsThuong = `{năm sinh ${roleKey.toLowerCase()} ${num}}`;
    var pDcHoa = `{Địa chỉ ${roleKey} ${num}}`, pDcThuong = `{địa chỉ ${roleKey.toLowerCase()} ${num}}`;
    var pSdtHoa = `{Số điện thoại ${roleKey} ${num}}`, pSdtThuong = `{số điện thoại ${roleKey.toLowerCase()} ${num}}`;
    var pCccdHoa = `{CCCD ${roleKey} ${num}}`, pCccdThuong = `{cccd ${roleKey.toLowerCase()} ${num}}`;

    if (m) {
      var isInd = isIndividualHonorific(m.xungHo), titleCaseName = toTitleCase(cleanHonorificFromName(m.hoTen));
      var xhRaw = (m.xungHo && m.xungHo !== "Ông/Bà") ? m.xungHo.trim() : "Ông/bà";
      var xhHoa = isInd ? (xhRaw.charAt(0).toUpperCase() + xhRaw.slice(1).toLowerCase()) : "", xhThuong = isInd ? xhRaw.toLowerCase() : "";
      
      phMap[pNameHoa] = phMap[pNameThuong] = titleCaseName; 
      phMap[pNameUpper] = titleCaseName.toUpperCase();
      phMap[pRoleHoa] = (xhHoa ? xhHoa + " " : "") + titleCaseName; 
      phMap[pRoleThuong] = (xhThuong ? xhThuong + " " : "") + titleCaseName; 
      phMap[pRoleUpper] = phMap[pRoleHoa].toUpperCase();
      phMap[pXhHoa] = xhHoa; 
      phMap[pXhThuong] = xhThuong;
      phMap[pNsHoa] = phMap[pNsThuong] = m.namSinh ? ("sinh năm " + m.namSinh) : "";
      phMap[pDcHoa] = phMap[pDcThuong] = m._diaChiGoc || "";
      phMap[pSdtHoa] = phMap[pSdtThuong] = m.sdt ? formatPhoneNumber(m.sdt) : "";
      phMap[pCccdHoa] = phMap[pCccdThuong] = m.cccd || "";

      // Hỗ trợ từ viết tắt NYC1, nyc1, NYC2, nyc2
      if (roleKey === "Người yêu cầu") {
        phMap["{NYC" + num + "}"] = phMap[pRoleHoa];
        phMap["{nyc" + num + "}"] = phMap[pRoleThuong];
      }
    } else {
      phMap[pNameHoa] = phMap[pNameThuong] = phMap[pNameUpper] = phMap[pRoleHoa] = phMap[pRoleThuong] = phMap[pRoleUpper] = phMap[pXhHoa] = phMap[pXhThuong] = phMap[pNsHoa] = phMap[pNsThuong] = phMap[pDcHoa] = phMap[pDcThuong] = phMap[pSdtHoa] = phMap[pSdtThuong] = phMap[pCccdHoa] = phMap[pCccdThuong] = "";
      if (roleKey === "Người yêu cầu") {
        phMap["{NYC" + num + "}"] = "";
        phMap["{nyc" + num + "}"] = "";
      }
    }
  }

  var nameKeyHoa = `{Họ và tên ${roleKey}}`, nameKeyThuong = `{họ và tên ${roleKey.toLowerCase()}}`, nameKeyUpper = `{HỌ VÀ TÊN ${roleKey.toUpperCase()}}`;
  var xhKeyHoa = `{Xưng hô ${roleKey}}`, xhKeyThuong = `{xưng hô ${roleKey.toLowerCase()}}`;
  var nsKeyHoa = `{Năm sinh ${roleKey}}`, nsKeyThuong = `{năm sinh ${roleKey.toLowerCase()}}`;
  var dcKeyHoa = `{Địa chỉ ${roleKey}}`, dcKeyThuong = `{địa chỉ ${roleKey.toLowerCase()}}`;

  if (allMembers.length === 0) {
    phMap[nameKeyHoa] = phMap[nameKeyThuong] = phMap[nameKeyUpper] = phMap[xhKeyHoa] = phMap[xhKeyThuong] = phMap[nsKeyHoa] = phMap[nsKeyThuong] = phMap[dcKeyHoa] = phMap[dcKeyThuong] = "";
    return;
  }

  var namesCompound = [];
  var firstXhHoa = "", firstXhThuong = "";
  for (var i = 0; i < allMembers.length; i++) {
    var mem = allMembers[i];
    var isIndM = isIndividualHonorific(mem.xungHo);
    var cleanN = toTitleCase(cleanHonorificFromName(mem.hoTen));
    var xhM = (mem.xungHo && mem.xungHo !== "Ông/Bà") ? mem.xungHo.trim() : "Ông/bà";
    if (i === 0) {
      firstXhHoa = isIndM ? (xhM.charAt(0).toUpperCase() + xhM.slice(1).toLowerCase()) : "";
      firstXhThuong = isIndM ? xhM.toLowerCase() : "";
      namesCompound.push(cleanN);
    } else {
      namesCompound.push((isIndM ? (xhM.toLowerCase() + " ") : "") + cleanN);
    }
  }

  phMap[xhKeyHoa] = firstXhHoa;
  phMap[xhKeyThuong] = firstXhThuong;

  var compoundFullName = namesCompound.join(", ");
  phMap[nameKeyHoa] = phMap[nameKeyThuong] = compoundFullName;
  phMap[nameKeyUpper] = compoundFullName.toUpperCase();

  var nsList = [];
  allMembers.forEach(function(m) {
    if (m.namSinh && isIndividualHonorific(m.xungHo)) {
      var cleanYear = String(m.namSinh).replace(/\D/g, '').trim();
      if (cleanYear) nsList.push(cleanYear);
    }
  });

  var compoundNs = "";
  if (nsList.length === 1) {
    compoundNs = "sinh năm " + nsList[0];
  } else if (nsList.length > 1) {
    var allSame = nsList.every(function(y) { return y === nsList[0]; });
    compoundNs = allSame ? ("cùng sinh năm " + nsList[0]) : ("sinh năm " + nsList.join(", "));
  }
  phMap[nsKeyHoa] = phMap[nsKeyThuong] = compoundNs;

  var dcList = [];
  allMembers.forEach(function(m) {
    var dc = (m._diaChiGoc || m.diaChi || "").trim();
    if (dc && !dcList.includes(dc)) dcList.push(dc);
  });
  phMap[dcKeyHoa] = phMap[dcKeyThuong] = dcList.length > 0 ? dcList.join("; ") : "";
}

// =========================================================================
// MỤC 4: THAO TÁC DOM DOCS, TỰ ĐỘNG IN ĐẬM & CẶP THẺ SONG HÀNH
// =========================================================================

function resolvePairedNameAndYearTags(container, roleGroupsMap, containerText) {
  if (!containerText) try { containerText = container.getText(); } catch(e) { containerText = ""; }
  if (!containerText.includes("{")) return;

  Object.keys(roleGroupsMap).forEach(function(roleName) {
    if (!containerText.toLowerCase().includes(roleName.toLowerCase())) return;
    var members = extractFlatMembers(roleGroupsMap[roleName] || []);
    if (!members || members.length <= 1) return; 

    var segments = [];
    for (var i = 0; i < members.length; i++) {
      var m = members[i], isInd = isIndividualHonorific(m.xungHo);
      var rawXh = (m.xungHo && m.xungHo !== "Ông/Bà") ? m.xungHo.trim() : "Ông/bà";
      var xhPrefix = (i > 0 && isInd) ? (rawXh.toLowerCase() + " ") : "";
      var name = toTitleCase(cleanHonorificFromName(m.hoTen));
      var ns = (m.namSinh && isInd) ? (", sinh năm " + m.namSinh) : "";
      segments.push(xhPrefix + name + ns);
    }
    var pairedPattern = "(?i)\\{\\s*Họ và tên\\s+" + escapeRegex(roleName) + "\\s*\\}\\s*,?\\s*\\{\\s*Năm sinh\\s+" + escapeRegex(roleName) + "\\s*\\}";
    try { container.replaceText(pairedPattern, segments.join(", ")); } catch(e) {}
  });
}

function applyPrecisionBold(paragraph, wordsToBold) {
  if (!paragraph || !wordsToBold || !Array.isArray(wordsToBold) || wordsToBold.length === 0) return;
  var paraText = paragraph.getText();
  if (!paraText) return;

  var lowText = paraText.toLowerCase();
  if (lowText.includes("trong vụ án:") || lowText.includes("trong vụ việc:") || lowText.includes("nội dung vụ việc:") || lowText.includes("nội dung vụ án:")) return;

  var textElem = paragraph.editAsText();
  wordsToBold.forEach(function(w) {
    var cleanWord = cleanHonorificFromName(String(w).trim());
    if (!cleanWord || cleanWord.length < 2) return;
    var idx = paraText.indexOf(cleanWord);
    while (idx !== -1) {
      textElem.setBold(idx, idx + cleanWord.length - 1, true);
      idx = paraText.indexOf(cleanWord, idx + cleanWord.length);
    }
  });
}

function replaceBlockParties(body, searchKey, itemsList) {
  if (!itemsList || itemsList.length === 0) return;
  var safeKeyRegex = escapeRegex(searchKey.replace(/[{}]/g, "").trim());
  var found = body.findText("(?i)\\{\\s*" + safeKeyRegex + "\\s*\\}"), loopGuard = 0;
  while (found !== null && loopGuard < 50) {
    loopGuard++;
    var p = found.getElement().asText().getParent();
    if (p.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var para = p.asParagraph(), fullText = para.getText();
      var beforeText = fullText.substring(0, found.getStartOffset()), afterText = fullText.substring(found.getEndOffsetInclusive() + 1);
      var parentElement = para.getParent(), paraIndex = parentElement.getChildIndex(para);
      
      var item0 = itemsList[0] || { text: "", boldWords: [] };
      para.setText(beforeText + item0.text + (itemsList.length === 1 ? afterText : ""));
      para.editAsText().setBold(false);
      applyPrecisionBold(para, item0.boldWords);

      if (itemsList.length > 1) {
        for (var i = 1; i < itemsList.length; i++) {
          var itemI = itemsList[i], newPara = para.copy();
          newPara.setText(itemI.text + (i === itemsList.length - 1 ? afterText : ""));
          newPara.editAsText().setBold(false);
          applyPrecisionBold(newPara, itemI.boldWords);
          parentElement.insertParagraph(paraIndex + i, newPara);
        }
      }
    }
    found = body.findText("(?i)\\{\\s*" + safeKeyRegex + "\\s*\\}", found);
  }
}

function replaceBlockMultiline(body, searchKey, multilineText, wordsToBold) {
  if (!body) return;
  var safeKeyRegex = escapeRegex(searchKey.replace(/[{}]/g, "").trim());
  var found = body.findText("(?i)\\{\\s*" + safeKeyRegex + "\\s*\\}");
  var loopGuard = 0;
  
  while (found !== null && loopGuard < 20) {
    loopGuard++;
    if (!multilineText || String(multilineText).trim() === "") {
      body.replaceText("(?i)\\{\\s*" + safeKeyRegex + "\\s*\\}", "");
      break;
    }

    var p = found.getElement().asText().getParent();
    if (p.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var para = p.asParagraph(), fullText = para.getText();
      var beforeText = fullText.substring(0, found.getStartOffset()), afterText = fullText.substring(found.getEndOffsetInclusive() + 1);
      var parentElement = para.getParent(), paraIndex = parentElement.getChildIndex(para);
      var lines = String(multilineText).split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
      if (lines.length === 0) lines = [""];

      para.setText(beforeText + lines[0] + (lines.length === 1 ? afterText : ""));
      para.editAsText().setBold(false);
      if (wordsToBold && wordsToBold.length > 0) applyPrecisionBold(para, wordsToBold);

      if (lines.length > 1) {
        for (var i = 1; i < lines.length; i++) {
          var newPara = para.copy();
          newPara.setText(lines[i] + (i === lines.length - 1 ? afterText : ""));
          newPara.editAsText().setBold(false);
          if (wordsToBold && wordsToBold.length > 0) applyPrecisionBold(newPara, wordsToBold);
          parentElement.insertParagraph(paraIndex + i, newPara);
        }
      }
    }
    found = body.findText("(?i)\\{\\s*" + safeKeyRegex + "\\s*\\}", found);
  }
}

function replaceTimeString(body, searchKey, timeStr) {
  if (!timeStr) return;
  var regexPattern = "(?i)\\{\\s*" + escapeRegex(searchKey.replace(/[{}]/g, "").trim()) + "\\s*\\}";
  var found = body.findText(regexPattern);
  while (found !== null) {
    var textEl = found.getElement().asText();
    var start = found.getStartOffset(), end = found.getEndOffsetInclusive();
    
    textEl.deleteText(start, end);
    textEl.insertText(start, timeStr);
    
    var newEnd = start + timeStr.length - 1;
    textEl.setBold(start, newEnd, false);

    if (!timeStr.includes(".......")) {
      var regexNum = /\b\d+\b/g, m;
      while ((m = regexNum.exec(timeStr)) !== null) {
        textEl.setBold(start + m.index, start + m.index + m[0].length - 1, true);
      }
    }
    found = body.findText(regexPattern, found);
  }
}

// =========================================================================
// MỤC 5: FAST-FAIL REPLACEMENT, SANITIZE & NHÂN BẢN TRANG
// =========================================================================

function replaceTextSafe(container, searchKey, replaceStr) {
  if (!container) return;
  var safeStr = String(replaceStr === null || replaceStr === undefined ? "" : replaceStr).replace(/\$/g, '$$$$');
  var regexPattern = "\\{\\s*" + escapeRegex(searchKey.replace(/[{}]/g, "").trim()) + "\\s*\\}";
  try { container.replaceText(regexPattern, safeStr); } catch(e) { container.replaceText(escapeRegex(searchKey), safeStr); }
}

function applyAtomicReplacements(container, dictionaryMap, containerText) {
  if (!containerText) try { containerText = container.getText(); } catch(e) { containerText = ""; }
  var textLower = containerText.toLowerCase();

  Object.keys(dictionaryMap).sort(function(a, b) { return b.length - a.length; }).forEach(function(key) {
    var val = dictionaryMap[key];
    if (val !== undefined && val !== null) {
      var innerKey = key.replace(/[{}]/g, "").trim().toLowerCase();
      if (textLower.includes(innerKey)) {
        var safeStr = String(val).replace(/\$/g, '$$$$');
        var regexPattern = "\\{\\s*" + escapeRegex(key.replace(/[{}]/g, "").trim()) + "\\s*\\}";
        try { container.replaceText(regexPattern, safeStr); } catch(e) { container.replaceText(escapeRegex(key), safeStr); }
      }
    }
  });
}

function sanitizeMergedDocument(body) {
  try {
    body.replaceText("(?i)Căn cứ các\\s+Căn cứ vào", "Căn cứ vào");
    body.replaceText("(?i)Căn cứ vào\\s+Căn cứ vào", "Căn cứ vào");
    body.replaceText("(?i)thụ lý số:\\s*thụ lý số:", "thụ lý số:");

    body.replaceText("(?i)ngày:\\s*Ngày\\s+", "ngày ");
    body.replaceText("(?i)ngày\\s+Ngày\\s+", "ngày ");
    body.replaceText("(?i)vào lúc:\\s*\\.\\.\\.giờ", "Vào lúc: ....... giờ");

    var prepositions = ["đối với", "giữa", "của", "với", "cho"];
    prepositions.forEach(function(prep) {
      body.replaceText("(?i)\\b" + prep + "\\s+Ông\\b", prep + " ông");
      body.replaceText("(?i)\\b" + prep + "\\s+Bà\\b", prep + " bà");
      body.replaceText("(?i)\\b" + prep + "\\s+Anh\\b", prep + " anh");
      body.replaceText("(?i)\\b" + prep + "\\s+Chị\\b", prep + " chị");
    });

    body.replaceText("\\.{3,}", "...");
    body.replaceText("\\s+,", ","); body.replaceText("\\s+\\.", "."); body.replaceText("\\s+;", ";");
    body.replaceText("\\s+:", ":");
    body.replaceText(",\\s*;", ";"); body.replaceText(";\\s*,", ";");
    body.replaceText(",\\s*,", ","); body.replaceText(";\\s*;", ";");
    body.replaceText(",\\s*\\.", "."); body.replaceText(";\\s*\\.", ".");
    body.replaceText(":\\s*[;\\.,]", ":");
    body.replaceText("và\\s*\\.", "."); body.replaceText("và\\s*;", ";");
    body.replaceText("\\(\\s*\\)", ""); body.replaceText(" {2,}", " ");
    
    // Xóa triệt để các thẻ placeholder mồ côi chưa được điền
    body.replaceText("\\{[^\\}]+\\}", ""); 
  } catch (e) {}
}

function appendPageCloneDeep(targetBody, sourceElements) {
  targetBody.appendPageBreak();
  var newElements = [];
  for (var i = 0; i < sourceElements.length; i++) {
    var elem = sourceElements[i], elemType = elem.getType();
    if (elemType === DocumentApp.ElementType.PARAGRAPH) newElements.push(targetBody.appendParagraph(elem.asParagraph().copy()));
    else if (elemType === DocumentApp.ElementType.TABLE) {
      var srcTable = elem.asTable(), newTable = targetBody.appendTable();
      newTable.setBorderWidth(srcTable.getBorderWidth()); newTable.setBorderColor(srcTable.getBorderColor());
      for (var r = 0; r < srcTable.getNumRows(); r++) {
        var srcRow = srcTable.getRow(r), newRow = newTable.appendTableRow();
        for (var c = 0; c < srcRow.getNumCells(); c++) {
          var srcCell = srcRow.getCell(c), newCell = newRow.appendTableCell();
          newCell.setWidth(srcCell.getWidth()); newCell.setPaddingTop(srcCell.getPaddingTop()); newCell.setPaddingBottom(srcCell.getPaddingBottom()); newCell.setPaddingLeft(srcCell.getPaddingLeft()); newCell.setPaddingRight(srcCell.getPaddingRight()); newCell.setVerticalAlignment(srcCell.getVerticalAlignment());
          newCell.clear();
          for (var cp = 0; cp < srcCell.getNumChildren(); cp++) {
            var cellChild = srcCell.getChild(cp);
            if (cellChild.getType() === DocumentApp.ElementType.PARAGRAPH) newCell.appendParagraph(cellChild.asParagraph().copy());
          }
          if (newCell.getNumChildren() > 1 && newCell.getChild(0).asParagraph().getText() === "") newCell.removeChild(newCell.getChild(0));
        }
      }
      newElements.push(newTable);
    } else if (elemType === DocumentApp.ElementType.LIST_ITEM) newElements.push(targetBody.appendListItem(elem.asListItem().copy()));
  }
  return newElements;
}

// =========================================================================
// MỤC 6: ĐIỀU PHỐI TIẾN TRÌNH TRỘN THƯ (MASTER DRAFTING ENGINE V8.0)
// =========================================================================

function api_RunMailMergeV3_Logic(input) {
  var finalFiles = [];
  try {
    if (!input || !input.templateIds || input.templateIds.length === 0) return { success: false, error: "Vui lòng chọn ít nhất một biểu mẫu." };
    if (!input.idVuAn) return { success: false, error: "Vui lòng chọn một hồ sơ vụ án." };

    var caseData = layDuLieuChiTiet(input.idVuAn);
    if (caseData.error) return { success: false, error: caseData.error };

    var parties = (input.partiesOverride && input.partiesOverride.length > 0) ? input.partiesOverride : (caseData.ds || []);
    var info = caseData.info;
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};

    var allCasePartyNames = parties.map(function(p) { return toTitleCase(cleanHonorificFromName(p.hoTen)); }).filter(Boolean);

    var destFolderId = extractFolderId(info.folderUrl);
    if (!destFolderId || destFolderId.length < 15) {
      var newUrl = taoThuMucHoSoMoi(info.soTL, info.loaiAn, LibDate.parse(info.ngayTL) || new Date(), parties);
      destFolderId = extractFolderId(newUrl);
    }
    var destFolder = DriveApp.getFolderById(destFolderId);

    var dThuly = LibDate.parse(info.ngayTL) || new Date();
    var acronymCase = getLoaiAnRutGon(info.loaiAn, info.quanHe);
    var isViecDS = (acronymCase === "VHN" || acronymCase === "VDS");
    var initMonths = isViecDS ? 1 : ((typeof APP_CONFIG !== 'undefined' && APP_CONFIG.DEADLINES_INIT) ? (APP_CONFIG.DEADLINES_INIT[info.loaiAn] || 4) : 4);
    
    var dHan = new Date(dThuly); dHan.setMonth(dHan.getMonth() + initMonths);
    var dGiaHan = new Date(dHan); dGiaHan.setDate(dGiaHan.getDate() - 5);
    while (typeof LibDate !== 'undefined' && typeof LibDate.isWeekendOrHoliday === 'function' && LibDate.isWeekendOrHoliday(dGiaHan)) {
      dGiaHan.setDate(dGiaHan.getDate() - 1);
    }
    var dowGiaHan = dGiaHan.getDay();
    if (dowGiaHan === 0) dGiaHan.setDate(dGiaHan.getDate() - 2);
    else if (dowGiaHan === 6) dGiaHan.setDate(dGiaHan.getDate() - 1);

    var dBanHanhObj = input.ngayBanHanh ? (LibDate.parse(input.ngayBanHanh) || new Date()) : new Date();
    var exportDateStr = Utilities.formatDate(dBanHanhObj, (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.TIMEZONE : "Asia/Ho_Chi_Minh"), "dd.MM.yyyy");

    var soPhatHanhFinal = input.soPhatHanh ? String(input.soPhatHanh).trim() : "";
    if (!soPhatHanhFinal && input.isFormalPromulgation) {
      var kqRaw = String(info.ketQuaGiaiQuyet || "").trim();
      if (kqRaw && kqRaw !== "---") {
        var linesKQ = kqRaw.split('\n');
        var resSo = linesKQ[1] || "";
        if (resSo && resSo !== "---" && resSo !== "Chưa có số") soPhatHanhFinal = resSo;
      }
    }
    if (!soPhatHanhFinal) soPhatHanhFinal = "......";

    var namBanHanh = dBanHanhObj.getFullYear();
    var loaiAnChuan = info.loaiAn ? (info.loaiAn.split('. ')[1] || info.loaiAn) : "Dân sự";
    if (loaiAnChuan.includes("Hôn nhân")) loaiAnChuan = "Hôn nhân và gia đình";

    var diaDiemRaw = input.diaDiemLamViec || config["DIA_CHI_TOA"] || "Trụ sở Tòa án";
    var timeString = (input.trieuTapDate && input.trieuTapTime) ? LibDate.fmtFullTime(input.trieuTapDate, input.trieuTapTime) : "....... giờ ....... phút, ngày ....... tháng ....... năm .......";
    var noiDungLamViec = (input.noiDungThem && String(input.noiDungThem).trim() !== "") ? String(input.noiDungThem).trim() : "Làm rõ một số vấn đề liên quan đến vụ án";
    var qhRaw = String(info.quanHe || "---").trim();
    var isThuanTinhLyHon = (acronymCase === "VHN") || qhRaw.toLowerCase().includes("thuận tình") || qhRaw.toLowerCase().includes("thuan tinh");
    var isHNGD = info.loaiAn.includes("Hôn nhân") || info.loaiAn.includes("3.") || isThuanTinhLyHon;

    // Phân nhóm đương sự theo tư cách
    var groupsNKK = [], groupsNBK = [], groupsNYCau = [], groupsNLQ = [], groupsNLC = [];
    parties.forEach(function(d, idx) {
      var roleLower = String(d.tuCach || "").toLowerCase(), type = 'BD';
      if (isThuanTinhLyHon) {
        if (roleLower.includes('liên quan')) type = 'LQ'; 
        else if (roleLower.includes('làm chứng')) type = 'LC'; 
        else type = (idx === 0) ? 'ND' : 'BD'; // Người 1 vào ND, Người 2 vào BD
      } else {
        if (roleLower.includes('nguyên đơn') || roleLower.includes('khởi kiện') || roleLower.includes('bị hại')) type = 'ND';
        else if (roleLower.includes('yêu cầu') && !roleLower.includes('bị yêu cầu')) type = 'YC';
        else if (roleLower.includes('liên quan')) type = 'LQ'; 
        else if (roleLower.includes('làm chứng')) type = 'LC';
      }
      var targetGroup = (type === 'ND') ? groupsNKK : (type === 'YC' ? groupsNYCau : (type === 'LQ' ? groupsNLQ : (type === 'LC' ? groupsNLC : groupsNBK)));
      var addrKey = d.diaChi ? d.diaChi.trim().toLowerCase() : "";
      var found = addrKey ? targetGroup.find(function(g) { return (g.diaChi ? g.diaChi.trim().toLowerCase() : "") === addrKey; }) : null;
      if (found) found.members.push(d); else targetGroup.push({ diaChi: d.diaChi, members: [d] });
    });

    // TRỌNG TÂM: Trong Thuận tình ly hôn, danh sách Người yêu cầu là gộp của CẢ 2 VỢ CHỒNG
    var nkkToUse = isThuanTinhLyHon ? groupsNKK.concat(groupsNBK) : ((groupsNYCau.length > 0) ? groupsNYCau : groupsNKK);

    var ndFullStr = buildShortPartyStringBackend(groupsNKK, true);
    var bdFullStr = buildShortPartyStringBackend(groupsNBK, true);
    var yCauFullStr = buildShortPartyStringBackend(nkkToUse, true);

    var qhInQuotes = qhRaw.startsWith("“") || qhRaw.startsWith('"') ? qhRaw : `“${qhRaw}”`;
    var noiDungVuViec = (isThuanTinhLyHon || (groupsNYCau.length > 0 && groupsNBK.length === 0)) ? `${qhInQuotes} của ${yCauFullStr || ndFullStr || "..."}` : `${qhInQuotes} giữa ${ndFullStr || "..."} đối với ${bdFullStr || "..."}`;

    var customVars = Object.assign({}, input.customVariables || {});
    if (info.folderUrl && typeof readCaseMemoryFromDrive === 'function') {
      var driveMemory = readCaseMemoryFromDrive(info.folderUrl);
      if (driveMemory && driveMemory.variables) customVars = Object.assign({}, driveMemory.variables, customVars);
    }

    // Nhận diện tự động con chung, cấp dưỡng tiền và tài sản
    var rawThoaThuanCon = customVars["{Thỏa thuận con chung}"] || customVars["{Con chung}"] || "";
    var rawNoiDungFull = customVars["{Nội dung thỏa thuận}"] || customVars["{Nội dung vụ án}"] || "";
    var checkConText = (rawThoaThuanCon + " " + rawNoiDungFull).toLowerCase();
    var hasConChung = checkConText.includes("con chung") && !checkConText.includes("không có con chung");
    var hasCapDuongTien = false;
    var mConSection = rawNoiDungFull.match(/(?:(?:2\.\s*)?(?:Về\s*)?con chung:?|- Con chung:)([\s\S]*?)(?=(?:(?:3\.\s*)?(?:Về\s*)?tài sản|- Tài sản:|4\.\s*Về|5\.\s*Về|\[|$))/i);
    var conSectionText = mConSection ? mConSection[1].toLowerCase() : rawThoaThuanCon.toLowerCase();
    if (conSectionText.includes("cấp dưỡng") && !conSectionText.includes("không tranh chấp") && !conSectionText.includes("không yêu cầu")) {
      if (conSectionText.includes("đồng") || conSectionText.includes("đ/") || /\d+[\.,]?\d*\s*(?:đồng|đ)/i.test(conSectionText)) hasCapDuongTien = true;
    }
    var hasChiaTaiSan = checkConText.includes("tài sản") && !checkConText.includes("tự thỏa thuận, không yêu cầu") && !checkConText.includes("không có tài sản");

    var dieuLuatList = ["Điều 51", "Điều 55"];
    if (hasConChung) dieuLuatList.push("Điều 57", "Điều 58", "Điều 81", "Điều 82", "Điều 83");
    if (hasCapDuongTien) dieuLuatList.push("Điều 84");
    if (hasChiaTaiSan) dieuLuatList.push("Điều 59", "Điều 60");
    var dieuLuatHNGD_Str = "các " + dieuLuatList.join(", ") + " Luật hôn nhân và gia đình năm 2014";
    if (hasCapDuongTien) dieuLuatHNGD_Str += "; Điều 357, Điều 468 của Bộ luật dân sự năm 2015";

    var doanLaiChamTra = hasCapDuongTien ? "Kể từ ngày có đơn yêu cầu thi hành án của người được thi hành án (đối với các khoản tiền phải trả cho người được thi hành án) cho đến khi thi hành án xong, bên phải thi hành án còn phải chịu khoản tiền lãi của số tiền còn phải thi hành án theo mức lãi suất quy định tại Điều 357, Điều 468 của Bộ luật dân sự năm 2015." : "";
    var doanQuyenThamNom = hasConChung ? "Quyền thăm nom, chăm sóc, nuôi dưỡng, giáo dục con; quyền thay đổi người trực tiếp nuôi con; thay đổi mức cấp dưỡng được thực hiện theo quy định của Luật hôn nhân và gia đình." : "";

    var valHN = cleanChildSlotPrefix(customVars["{Quan hệ hôn nhân}"] || customVars["{Thỏa thuận ly hôn}"] || `${buildShortPartyStringBackend(groupsNKK, false)}, ${buildShortPartyStringBackend(groupsNBK, false)} thuận tình ly hôn.`);
    var valCon = cleanChildSlotPrefix(customVars["{Thỏa thuận con chung}"] || (hasConChung ? "Các bên tự thỏa thuận giao con chung cho một bên trực tiếp nuôi dưỡng." : "Các bên xác nhận không có con chung, không yêu cầu Tòa án giải quyết."));
    var valCapDuong = cleanChildSlotPrefix(customVars["{Cấp dưỡng nuôi con}"] || customVars["{Cấp dưỡng con chung}"] || (hasCapDuongTien ? "" : "Các bên không tranh chấp về cấp dưỡng nuôi con chung."));
    var valTS = cleanChildSlotPrefix(customVars["{Tài sản chung}"] || "Các bên tự thỏa thuận, không yêu cầu Tòa án giải quyết.");
    var valNo = cleanChildSlotPrefix(customVars["{Nợ chung}"] || "Các bên xác nhận không có nợ chung.");
    var valAP = cleanChildSlotPrefix(customVars["{Thỏa thuận án phí}"] || customVars["{Án phí}"] || `Thỏa thuận chịu án phí hôn nhân và gia đình sơ thẩm theo quy định; được trừ vào số tiền tạm ứng án phí đã nộp theo biên lai.`);

    var valTaiLieuKiemTheo = customVars["{Tài liệu kèm theo đơn khởi kiện}"] || customVars["{Tài liệu kèm đơn khởi kiện}"] || customVars["{Tài liệu chứng cứ kèm theo}"] || customVars["{Danh mục chứng cứ}"] || "";
    if (!valTaiLieuKiemTheo || valTaiLieuKiemTheo.trim() === "") {
      if (isHNGD) valTaiLieuKiemTheo = "- Đơn khởi kiện (hoặc Đơn yêu cầu);\n- Bản sao Căn cước công dân của các đương sự;\n- Bản chính Giấy chứng nhận kết hôn;\n- Bản sao Giấy khai sinh của các con chung;\n- Các tài liệu, chứng cứ khác có liên quan.";
      else if (info.loaiAn.includes("Hành chính") || info.loaiAn.includes("6.")) valTaiLieuKiemTheo = "- Đơn khởi kiện;\n- Bản sao Quyết định hành chính / Tài liệu chứng minh hành vi hành chính bị khiếu kiện;\n- Bản sao Căn cước công dân và các tài liệu, chứng cứ có liên quan.";
      else if (info.loaiAn.includes("Kinh doanh") || info.loaiAn.includes("4.")) valTaiLieuKiemTheo = "- Đơn khởi kiện;\n- Bản sao Giấy chứng nhận đăng ký kinh doanh / CCCD;\n- Hợp đồng tín dụng / Hợp đồng thương mại và các tài liệu giao nhận;\n- Bảng kê tính lãi và các tài liệu, chứng cứ kèm theo.";
      else valTaiLieuKiemTheo = "- Đơn khởi kiện;\n- Bản sao Căn cước công dân của các đương sự;\n- Các tài liệu, chứng cứ chứng minh cho yêu cầu khởi kiện.";
    }

    // XÂY DỰNG TỪ ĐIỂN ROLE MAP TOÀN DIỆN
    var roleMap = {};
    roleMap["{Nguyên đơn}"] = buildShortPartyStringBackend(groupsNKK, false);
    roleMap["{nguyên đơn}"] = buildShortPartyStringBackend(groupsNKK, true);
    roleMap["{NGUYÊN ĐƠN}"] = roleMap["{Nguyên đơn}"].toUpperCase();

    roleMap["{Người khởi kiện}"] = roleMap["{Nguyên đơn}"];
    roleMap["{người khởi kiện}"] = roleMap["{nguyên đơn}"];
    roleMap["{NGƯỜI KHỞI KIỆN}"] = roleMap["{NGUYÊN ĐƠN}"];

    roleMap["{Bị đơn}"] = buildShortPartyStringBackend(groupsNBK, false);
    roleMap["{bị đơn}"] = buildShortPartyStringBackend(groupsNBK, true);
    roleMap["{BỊ ĐƠN}"] = roleMap["{Bị đơn}"].toUpperCase();

    roleMap["{Người bị kiện}"] = roleMap["{Bị đơn}"];
    roleMap["{người bị kiện}"] = roleMap["{bị đơn}"];
    roleMap["{NGƯỜI BỊ KIỆN}"] = roleMap["{BỊ ĐƠN}"];

    roleMap["{Người yêu cầu}"] = isThuanTinhLyHon ? `${buildShortPartyStringBackend(groupsNKK, false)}, ${buildShortPartyStringBackend(groupsNBK, false)}` : buildShortPartyStringBackend(nkkToUse, false);
    roleMap["{người yêu cầu}"] = isThuanTinhLyHon ? `${buildShortPartyStringBackend(groupsNKK, true)}, ${buildShortPartyStringBackend(groupsNBK, true)}` : buildShortPartyStringBackend(nkkToUse, true);
    roleMap["{NGƯỜI YÊU CẦU}"] = roleMap["{Người yêu cầu}"].toUpperCase();

    roleMap["{Người bị yêu cầu}"] = buildShortPartyStringBackend(groupsNBK, false);
    roleMap["{người bị yêu cầu}"] = buildShortPartyStringBackend(groupsNBK, true);
    roleMap["{NGƯỜI BỊ YÊU CẦU}"] = roleMap["{Người bị yêu cầu}"].toUpperCase();

    roleMap["{Người có quyền lợi, nghĩa vụ liên quan}"] = buildShortPartyStringBackend(groupsNLQ, false);
    roleMap["{người có quyền lợi, nghĩa vụ liên quan}"] = buildShortPartyStringBackend(groupsNLQ, true);
    roleMap["{NGƯỜI CÓ QUYỀN LỢI, NGHĨA VỤ LIÊN QUAN}"] = roleMap["{Người có quyền lợi, nghĩa vụ liên quan}"].toUpperCase();

    roleMap["{Người làm chứng}"] = buildShortPartyStringBackend(groupsNLC, false);
    roleMap["{người làm chứng}"] = buildShortPartyStringBackend(groupsNLC, true);
    roleMap["{NGƯỜI LÀM CHỨNG}"] = roleMap["{Người làm chứng}"].toUpperCase();

    // Các từ đồng nghĩa của Danh sách
    roleMap["{Danh sách Nguyên đơn}"] = roleMap["{Nguyên đơn}"];
    roleMap["{danh sách nguyên đơn}"] = roleMap["{nguyên đơn}"];
    roleMap["{Danh sách Bị đơn}"] = roleMap["{Bị đơn}"];
    roleMap["{danh sách bị đơn}"] = roleMap["{bị đơn}"];
    roleMap["{Danh sách Người yêu cầu}"] = roleMap["{Người yêu cầu}"];
    roleMap["{danh sách người yêu cầu}"] = roleMap["{người yêu cầu}"];
    roleMap["{Danh sách NYC}"] = roleMap["{Người yêu cầu}"];

    // Phân rã từng người 1, 2, 3
    backend_buildExactPlaceholders(roleMap, "Người yêu cầu", nkkToUse);
    backend_buildExactPlaceholders(roleMap, "Nguyên đơn", groupsNKK);
    backend_buildExactPlaceholders(roleMap, "Bị đơn", groupsNBK);
    backend_buildExactPlaceholders(roleMap, "Người có quyền lợi, nghĩa vụ liên quan", groupsNLQ);

    // CÁN BỘ TIẾN HÀNH TỐ TỤNG
    var tenTP_Clean = toTitleCase(cleanHonorificFromName(config["TEN_THAM_PHAN"] || ""));
    var chucVuTP = config["CHUC_VU"] || "Thẩm phán";
    var danhXungTP = getOfficerHonorific(config["TEN_THAM_PHAN"], "Ông");
    var thamPhanFull = danhXungTP + " " + tenTP_Clean;

    var tenTK_Clean = toTitleCase(cleanHonorificFromName(input.tenThuKy || config["TEN_THU_KY"] || "Lường Thị Phương"));
    var danhXungTK = input.xhThuKy || getOfficerHonorific(tenTK_Clean, "Bà");
    var thuKyFull = danhXungTK + " " + tenTK_Clean;

    // NGÀY HÒA GIẢI THÀNH
    var rawNgayHGThanh = customVars["{Ngày hòa giải thành}"] || customVars["{ngày hòa giải thành}"] || "";
    var valNgayHGThanhHoa = "Ngày ... tháng ... năm ...";
    var valNgayHGThanhThuong = "ngày ... tháng ... năm ...";
    if (rawNgayHGThanh && String(rawNgayHGThanh).trim() !== "" && String(rawNgayHGThanh).trim() !== "---" && !String(rawNgayHGThanh).includes("...")) {
      var dHGObj = LibDate.parse(rawNgayHGThanh);
      if (dHGObj) {
        valNgayHGThanhHoa = LibDate.toVNText(dHGObj, true);
        valNgayHGThanhThuong = LibDate.toVNText(dHGObj, false);
      }
    }

    // THỂ THỨC CHỮ HOA / THƯỜNG CHO TOÀN BỘ MỐC THỜI GIAN
    var valNgayThulyHoa = (typeof LibDate !== 'undefined') ? LibDate.toVNText(info.ngayTL, true) : "";
    var valNgayThulyThuong = valNgayThulyHoa ? (valNgayThulyHoa.charAt(0).toLowerCase() + valNgayThulyHoa.slice(1)) : "";

    var valNgayBanHanhHoa = (typeof LibDate !== 'undefined') ? LibDate.toVNText(dBanHanhObj, true) : "";
    var valNgayBanHanhThuong = valNgayBanHanhHoa ? (valNgayBanHanhHoa.charAt(0).toLowerCase() + valNgayBanHanhHoa.slice(1)) : "";

    var valNgayGiaHanHoa = (typeof LibDate !== 'undefined') ? LibDate.toVNText(dGiaHan, true) : "";
    var valNgayGiaHanThuong = valNgayGiaHanHoa ? (valNgayGiaHanHoa.charAt(0).toLowerCase() + valNgayGiaHanHoa.slice(1)) : "";

    var valNgayHetHanHoa = (typeof LibDate !== 'undefined') ? LibDate.toVNText(dHan, true) : "";
    var valNgayHetHanThuong = valNgayHetHanHoa ? (valNgayHetHanHoa.charAt(0).toLowerCase() + valNgayHetHanHoa.slice(1)) : "";

    // TÍNH TOÁN ÁN PHÍ VÀ ĐỌC SỐ TIỀN THÀNH CHỮ CHUẨN NQ 326
    var giaTriTranhChapRaw = customVars["{Giá trị tranh chấp}"] || customVars["{Giá trị}"] || info.giaTri || "0";
    var feeCalc = calculateCourtFee(info.loaiAn, giaTriTranhChapRaw);

    var valTamUngSo = customVars["{Tạm ứng án phí bằng số}"] || (feeCalc.tamUngSo + " đồng");
    var valTamUngChu = customVars["{Tạm ứng án phí bằng chữ}"] || feeCalc.tamUngChu;
    var valAnPhiSo = customVars["{Án phí bằng số}"] || (feeCalc.anPhiSo + " đồng");
    var valAnPhiChu = customVars["{Án phí bằng chữ}"] || feeCalc.anPhiChu;

    var commonMap = {
      // NHÓM 1: THÔNG TIN CHUNG
      "{Số thụ lý}": String(info.soTL), "{số thụ lý}": String(info.soTL).toLowerCase(), "{SỐ THỤ LÝ}": String(info.soTL).toUpperCase(),
      "{Số thụ lý rút gọn}": extractShortNo(info.soTL), "{số thụ lý rút gọn}": extractShortNo(info.soTL),
      "{Số đơn}": extractShortNo(info.soTL), "{số đơn}": extractShortNo(info.soTL),
      "{Loại án}": loaiAnChuan, "{loại án}": loaiAnChuan.toLowerCase(), "{LOẠI ÁN}": loaiAnChuan.toUpperCase(),
      "{Loại án rút gọn}": acronymCase, "{loại án rút gọn}": acronymCase.toLowerCase(),
      "{Phân loại đơn}": loaiAnChuan, "{phân loại đơn}": loaiAnChuan.toLowerCase(),
      "{Năm ban hành}": String(namBanHanh), "{năm ban hành}": String(namBanHanh),
      "{Quan hệ tranh chấp}": qhRaw, "{quan hệ tranh chấp}": qhRaw.toLowerCase(), "{QUAN HỆ TRANH CHẤP}": qhRaw.toUpperCase(),
      "{Số văn bản}": soPhatHanhFinal, "{số văn bản}": soPhatHanhFinal,
      "{Tòa án}": String(config["TEN_TOA_AN"] || "Tòa án nhân dân"), "{tòa án}": String(config["TEN_TOA_AN"] || "Tòa án nhân dân"), "{TÒA ÁN}": String(config["TEN_TOA_AN"] || "Tòa án nhân dân").toUpperCase(),
      "{Địa chỉ tòa án}": String(config["DIA_CHI_TOA"] || "Trụ sở Tòa án"), "{địa chỉ tòa án}": String(config["DIA_CHI_TOA"] || "Trụ sở Tòa án"),
      "{Chức vụ}": chucVuTP, "{chức vụ}": chucVuTP.toLowerCase(),

      // CÁN BỘ TỐ TỤNG
      "{Danh xưng Thẩm phán}": danhXungTP, "{danh xưng thẩm phán}": danhXungTP.toLowerCase(),
      "{Họ và tên Thẩm phán}": tenTP_Clean, "{họ và tên thẩm phán}": tenTP_Clean,
      "{Thẩm phán}": tenTP_Clean, "{thẩm phán}": tenTP_Clean, "{THẨM PHÁN}": tenTP_Clean.toUpperCase(),
      "{Thẩm phán đầy đủ}": thamPhanFull, "{thẩm phán đầy đủ}": thamPhanFull,
      "{Danh xưng Thư ký}": danhXungTK, "{danh xưng thư ký}": danhXungTK.toLowerCase(),
      "{Họ và tên Thư ký}": tenTK_Clean, "{họ và tên thư ký}": tenTK_Clean,
      "{Thư ký}": tenTK_Clean, "{thư ký}": tenTK_Clean, "{THƯ KÝ}": tenTK_Clean.toUpperCase(),
      "{Thư ký đầy đủ}": thuKyFull, "{thư ký đầy đủ}": thuKyFull,

      // NHÓM 2: THỜI GIAN & NGÀY THÁNG
      "{Ngày thụ lý}": valNgayThulyHoa, "{ngày thụ lý}": valNgayThulyThuong, "{NGÀY THỤ LÝ}": valNgayThulyHoa.toUpperCase(),
      "{Ngày nhận đơn}": valNgayThulyHoa, "{ngày nhận đơn}": valNgayThulyThuong, "{NGÀY NHẬN ĐƠN}": valNgayThulyHoa.toUpperCase(),
      "{Ngày ban hành}": valNgayBanHanhHoa, "{ngày ban hành}": valNgayBanHanhThuong, "{NGÀY BAN HÀNH}": valNgayBanHanhHoa.toUpperCase(),
      "{Ngày gia hạn}": valNgayGiaHanHoa, "{ngày gia hạn}": valNgayGiaHanThuong, "{NGÀY GIA HẠN}": valNgayGiaHanHoa.toUpperCase(),
      "{Ngày hết hạn}": valNgayHetHanHoa, "{ngày hết hạn}": valNgayHetHanThuong, "{NGÀY HẾT HẠN}": valNgayHetHanHoa.toUpperCase(),
      "{Thời gian gia hạn}": getThoiGianGiaHanText(info.loaiAn, info.quanHe), "{thời gian gia hạn}": getThoiGianGiaHanText(info.loaiAn, info.quanHe).toLowerCase(),
      "{Địa điểm}": diaDiemRaw, "{địa điểm}": diaDiemRaw,
      "{Địa điểm làm việc}": diaDiemRaw, "{địa điểm làm việc}": diaDiemRaw,
      "{Nội dung làm việc}": noiDungLamViec, "{nội dung làm việc}": noiDungLamViec,
      "{Nội dung vụ việc}": noiDungVuViec, "{nội dung vụ việc}": noiDungVuViec, "{NỘI DUNG VỤ VIỆC}": noiDungVuViec.toUpperCase(),

      // NHÓM 3: ÁN PHÍ, LỆ PHÍ & BIÊN LAI
      "{Tạm ứng án phí bằng số}": valTamUngSo, "{tạm ứng án phí bằng số}": valTamUngSo,
      "{Tạm ứng án phí bằng chữ}": valTamUngChu, "{tạm ứng án phí bằng chữ}": valTamUngChu,
      "{Án phí bằng số}": valAnPhiSo, "{án phí bằng số}": valAnPhiSo,
      "{Án phí bằng chữ}": valAnPhiChu, "{án phí bằng chữ}": valAnPhiChu,
      "{Biên lai tạm ứng án phí}": customVars["{Biên lai tạm ứng án phí}"] || "", "{biên lai tạm ứng án phí}": customVars["{Biên lai tạm ứng án phí}"] || "",
      "{Thông tin biên lai án phí}": customVars["{Biên lai tạm ứng án phí}"] || "",
      "{Số biên lai}": customVars["{Số biên lai}"] || "", "{số biên lai}": customVars["{Số biên lai}"] || "",
      "{Ngày biên lai}": customVars["{Ngày biên lai}"] || "", "{ngày biên lai}": customVars["{Ngày biên lai}"] || "",
      "{Cơ quan thu tiền}": customVars["{Cơ quan thu tiền}"] || "", "{cơ quan thu tiền}": customVars["{Cơ quan thu tiền}"] || "",

      // NHÓM 8 & 9: NỘI DUNG THỎA THUẬN HÒA GIẢI & CÁC THẺ CON HNGĐ
      "{Nội dung thỏa thuận}": customVars["{Nội dung thỏa thuận}"] || "", "{nội dung thỏa thuận}": customVars["{Nội dung thỏa thuận}"] || "", "{NỘI DUNG THỎA THUẬN}": (customVars["{Nội dung thỏa thuận}"] || "").toUpperCase(),
      "{Nội dung hòa giải thành}": customVars["{Nội dung thỏa thuận}"] || "", "{nội dung hòa giải thành}": customVars["{Nội dung thỏa thuận}"] || "", "{NỘI DUNG HÒA GIẢI THÀNH}": (customVars["{Nội dung thỏa thuận}"] || "").toUpperCase(),
      "{Quan hệ hôn nhân}": valHN, "{quan hệ hôn nhân}": valHN, "{QUAN HỆ HÔN NHÂN}": valHN.toUpperCase(),
      "{Thỏa thuận ly hôn}": valHN, "{thỏa thuận ly hôn}": valHN, "{THỎA THUẬN LY HÔN}": valHN.toUpperCase(),
      "{Tình trạng hôn nhân}": customVars["{Tình trạng hôn nhân}"] || "", "{tình trạng hôn nhân}": customVars["{Tình trạng hôn nhân}"] || "",
      "{Số con chung}": customVars["{Số con chung}"] || (hasConChung ? "01 con chung" : "Không có con chung"), "{số con chung}": (customVars["{Số con chung}"] || (hasConChung ? "01 con chung" : "Không có con chung")).toLowerCase(),
      "{Con chung}": customVars["{Con chung}"] || "", "{con chung}": customVars["{Con chung}"] || "", "{CON CHUNG}": (customVars["{Con chung}"] || "").toUpperCase(),
      "{Thỏa thuận con chung}": valCon, "{thỏa thuận con chung}": valCon, "{THỎA THUẬN CON CHUNG}": valCon.toUpperCase(),
      "{Cấp dưỡng nuôi con}": valCapDuong, "{cấp dưỡng nuôi con}": valCapDuong, "{CẤP DƯỠNG NUÔI CON}": valCapDuong.toUpperCase(),
      "{Cấp dưỡng con chung}": valCapDuong, "{cấp dưỡng con chung}": valCapDuong,
      "{Tài sản chung}": valTS, "{tài sản chung}": valTS, "{TÀI SẢN CHUNG}": valTS.toUpperCase(),
      "{Nợ chung}": valNo, "{nợ chung}": valNo, "{NỢ CHUNG}": valNo.toUpperCase(),
      "{Thỏa thuận án phí}": valAP, "{thỏa thuận án phí}": valAP, "{THỎA THUẬN ÁN PHÍ}": valAP.toUpperCase(),
      "{Án phí}": valAP, "{án phí}": valAP, "{ÁN PHÍ}": valAP.toUpperCase(),
      "{Ngày hòa giải thành}": valNgayHGThanhHoa, "{ngày hòa giải thành}": valNgayHGThanhThuong, "{NGÀY HÒA GIẢI THÀNH}": valNgayHGThanhHoa.toUpperCase(),
      "{Quyền thăm nom con}": doanQuyenThamNom, "{quyền thăm nom con}": doanQuyenThamNom, "{Quyền thăm con}": doanQuyenThamNom, "{quyền thăm con}": doanQuyenThamNom,
      "{Lãi suất chậm thi hành án}": doanLaiChamTra, "{lãi suất chậm thi hành án}": doanLaiChamTra, "{Lãi chậm trả}": doanLaiChamTra, "{lãi chậm trả}": doanLaiChamTra,
      "{Điều luật HNGĐ}": dieuLuatHNGD_Str, "{điều luật hngđ}": dieuLuatHNGD_Str,
      "{Thỏa thuận nghĩa vụ chính}": customVars["{Thỏa thuận nghĩa vụ chính}"] || "", "{thỏa thuận nghĩa vụ chính}": customVars["{Thỏa thuận nghĩa vụ chính}"] || "",
      "{Thời hạn và phương thức thực hiện}": customVars["{Thời hạn và phương thức thực hiện}"] || "", "{thời hạn và phương thức thực hiện}": customVars["{Thời hạn và phương thức thực hiện}"] || "",
      "{Thỏa thuận chi phí tố tụng}": customVars["{Thỏa thuận chi phí tố tụng}"] || "", "{thỏa thuận chi phí tố tụng}": customVars["{Thỏa thuận chi phí tố tụng}"] || "",

      // NHÓM 10: TÀI LIỆU CHỨNG CỨ
      "{Tài liệu kèm theo đơn khởi kiện}": valTaiLieuKiemTheo, "{tài liệu kèm theo đơn khởi kiện}": valTaiLieuKiemTheo, "{TÀI LIỆU KÈM THEO ĐƠN KHỞI KIỆN}": valTaiLieuKiemTheo.toUpperCase(),
      "{Tài liệu kèm đơn khởi kiện}": valTaiLieuKiemTheo, "{tài liệu kèm đơn khởi kiện}": valTaiLieuKiemTheo, "{TÀI LIỆU KÈM ĐƠN KHỞI KIỆN}": valTaiLieuKiemTheo.toUpperCase(),
      "{Tài liệu chứng cứ kèm theo}": valTaiLieuKiemTheo, "{tài liệu chứng cứ kèm theo}": valTaiLieuKiemTheo,
      "{Danh mục chứng cứ}": valTaiLieuKiemTheo, "{danh mục chứng cứ}": valTaiLieuKiemTheo,

      // NHÓM 12: ĐẶC THÙ NGÀNH ÁN KHÁC (ĐẤT ĐAI, TÍN DỤNG, THỪA KẾ...)
      "{Tài sản tranh chấp}": customVars["{Tài sản tranh chấp}"] || "", "{tài sản tranh chấp}": customVars["{Tài sản tranh chấp}"] || "",
      "{Vị trí tài sản tranh chấp}": customVars["{Vị trí tài sản tranh chấp}"] || "", "{vị trí tài sản tranh chấp}": customVars["{Vị trí tài sản tranh chấp}"] || "",
      "{Hợp đồng tín dụng}": customVars["{Hợp đồng tín dụng}"] || "", "{hợp đồng tín dụng}": customVars["{Hợp đồng tín dụng}"] || "",
      "{Dư nợ tín dụng}": customVars["{Dư nợ tín dụng}"] || "", "{dư nợ tín dụng}": customVars["{Dư nợ tín dụng}"] || "",
      "{Di sản thừa kế}": customVars["{Di sản thừa kế}"] || "", "{di sản thừa kế}": customVars["{Di sản thừa kế}"] || "",
      "{Thiệt hại bồi thường}": customVars["{Thiệt hại bồi thường}"] || "", "{thiệt hại bồi thường}": customVars["{Thiệt hại bồi thường}"] || "",
      "{Tranh chấp lao động}": customVars["{Tranh chấp lao động}"] || "", "{tranh chấp lao động}": customVars["{Tranh chấp lao động}"] || ""
    };

    var fullMap = Object.assign({}, commonMap, roleMap, customVars);
    
    // Tự động mở rộng bộ biến chữ thường và IN HOA cho các biến tùy chỉnh
    var expandedMap = Object.assign({}, fullMap);
    for (var k in fullMap) {
      if (fullMap[k] !== undefined && fullMap[k] !== null) {
        var vStr = String(fullMap[k]);
        var lowK = k.toLowerCase();
        var upK = k.toUpperCase();
        if (!expandedMap.hasOwnProperty(lowK)) expandedMap[lowK] = vStr;
        if (!expandedMap.hasOwnProperty(upK)) expandedMap[upK] = vStr.toUpperCase();
      }
    }
    fullMap = expandedMap;

    // GHI LỊCH ĐỒNG BỘ NỀN VÀO GOOGLE CALENDAR
    if (input.trieuTapDate && input.trieuTapTime && typeof api_LuuLichMoi_Logic === 'function') {
      try {
        var allTasksDesc = [];
        input.templateIds.forEach(function(tId) { try { allTasksDesc.push(DriveApp.getFileById(tId).getName().replace(/\.(gdoc|docx|doc)$/i, "")); } catch(e) {} });
        api_LuuLichMoi_Logic({ 
          idVuAn: input.idVuAn, 
          soTL: info.soTL, 
          ngay: input.trieuTapDate, 
          gio: input.trieuTapTime, 
          noiDung: `[${extractShortNo(info.soTL)}] ${noiDungLamViec} (${allTasksDesc.join(" + ")})`, 
          ghiChu: diaDiemRaw 
        });
      } catch(eLich) { console.warn("Lỗi ghi lịch tự động:", eLich.message); }
    }

    var roleClusterMap = {
      "Nguyên đơn": groupsNKK, 
      "Người khởi kiện": groupsNKK, 
      "Người yêu cầu": nkkToUse,
      "Bị đơn": groupsNBK, 
      "Người bị kiện": groupsNBK, 
      "Người bị yêu cầu": groupsNBK,
      "Người có quyền lợi, nghĩa vụ liên quan": groupsNLQ, 
      "Người làm chứng": groupsNLC
    };

    // TIẾN HÀNH TRỘN TỪNG BIỂU MẪU ĐƯỢC CHỌN
    input.templateIds.forEach(function (templateId) {
      var templateFile = DriveApp.getFileById(templateId);
      var baseExportName = templateFile.getName().replace(/\.(gdoc|docx|doc)$/i, "").trim() + (extractShortNo(info.soTL) ? (" - " + extractShortNo(info.soTL)) : "") + " - " + exportDateStr;
      var newDocFile = templateFile.makeCopy(baseExportName, destFolder);
      var doc = DocumentApp.openById(newDocFile.getId()), body = doc.getBody(), docTextContent = body.getText();

      var header = doc.getHeader(); 
      if (header) { 
        resolvePairedNameAndYearTags(header, roleClusterMap, header.getText()); 
        applyAtomicReplacements(header, fullMap, header.getText()); 
        sanitizeMergedDocument(header); 
      }
      var footer = doc.getFooter(); 
      if (footer) { 
        resolvePairedNameAndYearTags(footer, roleClusterMap, footer.getText()); 
        applyAtomicReplacements(footer, fullMap, footer.getText()); 
        sanitizeMergedDocument(footer); 
      }

      // CHẾ ĐỘ 1: IN TÁCH TRANG HÀNG LOẠT (DÀNH CHO GIẤY TRIỆU TẬP, GIẤY BÁO)
      var isTachTrang = docTextContent.includes("{Họ và tên}") || 
                        docTextContent.includes("{họ và tên}") || 
                        docTextContent.includes("{HỌ VÀ TÊN}") || 
                        docTextContent.includes("{Tư cách}") || 
                        docTextContent.includes("{tư cách}");

      if (isTachTrang) {
        var indices = (input.selectedIndices && input.selectedIndices.length > 0) ? input.selectedIndices : parties.map((_, i) => i);
        var mergeRecipients = [];
        parties.filter((_, idx) => indices.includes(idx)).forEach(function(p) {
          mergeRecipients.push(p);
          if (p.daiDien) {
            try { 
              JSON.parse(p.daiDien).forEach(r => mergeRecipients.push({ 
                hoTen: r.hoTen, 
                xungHo: r.xungHo || "Ông/Bà", 
                tuCach: (r.tuCach || "Người đại diện") + " của " + p.tuCach + " " + p.hoTen, 
                diaChi: r.diaChi || p.diaChi, 
                namSinh: r.namSinh || "", 
                sdt: r.sdt || "", 
                cccd: r.cccd || "", 
                daiDien: "" 
              })); 
            } catch(e) {}
          }
        });

        var originalElements = []; 
        for (var i = 0; i < body.getNumChildren(); i++) originalElements.push(body.getChild(i).copy());
        var pagesElementArrays = [[]]; 
        for (var p1 = 0; p1 < body.getNumChildren(); p1++) pagesElementArrays[0].push(body.getChild(p1));
        for (var idx = 1; idx < mergeRecipients.length; idx++) pagesElementArrays.push(appendPageCloneDeep(body, originalElements));

        mergeRecipients.forEach(function(ds, rIdx) {
          var pageElements = pagesElementArrays[rIdx];
          if (!ds || !pageElements) return;
          var cleanName = toTitleCase(cleanHonorificFromName(ds.hoTen)), isInd = isIndividualHonorific(ds.xungHo);
          var xhHoa = isInd ? toTitleCase(ds.xungHo || "Ông/bà") : "";
          var xhThuong = isInd ? (ds.xungHo ? ds.xungHo.toLowerCase() : "ông/bà") : "";

          var localPartyMap = {
            "{Xưng hô}": xhHoa, "{xưng hô}": xhThuong, "{XƯNG HÔ}": xhHoa.toUpperCase(),
            "{Họ và tên}": cleanName, "{họ và tên}": cleanName, "{HỌ VÀ TÊN}": cleanName.toUpperCase(),
            "{Địa chỉ}": ds.diaChi || "....................", "{địa chỉ}": ds.diaChi || "....................",
            "{Tư cách}": ds.tuCach || ".........", "{tư cách}": ds.tuCach ? ds.tuCach.toLowerCase() : ".........", "{TƯ CÁCH}": ds.tuCach ? ds.tuCach.toUpperCase() : ".........",
            "{Năm sinh}": (ds.namSinh && isInd) ? ("sinh năm " + ds.namSinh) : "", "{năm sinh}": (ds.namSinh && isInd) ? ("sinh năm " + ds.namSinh) : "",
            "{Người đại diện}": formatRepsBlock(ds.daiDien), "{người đại diện}": formatRepsBlock(ds.daiDien),
            "{CCCD}": ds.cccd || "", "{cccd}": ds.cccd || "",
            "{Số điện thoại}": ds.sdt ? formatPhoneNumber(ds.sdt) : "", "{số điện thoại}": ds.sdt ? formatPhoneNumber(ds.sdt) : ""
          };

          var finalMapPage = Object.assign({}, fullMap, localPartyMap);
          var pageTextCache = pageElements.map(e => (typeof e.getText === 'function') ? e.getText() : "").join("\n");

          pageElements.forEach(function(el) {
            applyAtomicReplacements(el, finalMapPage, pageTextCache);
            if (el.getType() === DocumentApp.ElementType.PARAGRAPH) applyPrecisionBold(el.asParagraph(), [cleanName]);
          });
        });
      } 
      // CHẾ ĐỘ 2: TRỘN GỘP VĂN BẢN ÁN (BẢN ÁN, QUYẾT ĐỊNH, BIÊN BẢN HÒA GIẢI...)
      else {
        resolvePairedNameAndYearTags(body, roleClusterMap, docTextContent);

        // Thay thế các khối danh sách đương sự dạng bảng / dạng lặp
        replaceBlockParties(body, "{Đương sự}", getBlockType2Items(parties));
        replaceBlockParties(body, "{Đương sự thông báo}", getBlockType1Items(parties));
        replaceBlockParties(body, "{Nguyên đơn chi tiết}", getPartyDetailItems(groupsNKK));
        replaceBlockParties(body, "{Người khởi kiện chi tiết}", getPartyDetailItems(groupsNKK));
        replaceBlockParties(body, "{Bị đơn chi tiết}", getPartyDetailItems(groupsNBK));
        replaceBlockParties(body, "{Người bị kiện chi tiết}", getPartyDetailItems(groupsNBK));
        replaceBlockParties(body, "{Người yêu cầu chi tiết}", getPartyDetailItems(nkkToUse));
        replaceBlockParties(body, "{Người bị yêu cầu chi tiết}", getPartyDetailItems(groupsNBK));
        replaceBlockParties(body, "{Người có quyền lợi, nghĩa vụ liên quan chi tiết}", getPartyDetailItems(groupsNLQ));
        replaceBlockParties(body, "{Người làm chứng chi tiết}", getPartyDetailItems(groupsNLC));

        // Thay thế khối nhiều dòng cho Nội dung thỏa thuận (kèm các từ đồng nghĩa)
        [
          "{Nội dung thỏa thuận}", 
          "{Nội dung hòa giải thành}"
        ].forEach(function(synTag) {
          replaceBlockMultiline(body, synTag, fullMap["{Nội dung thỏa thuận}"], allCasePartyNames);
        });

        // Thay thế khối nhiều dòng cho Danh mục chứng cứ kèm theo (kèm các từ đồng nghĩa)
        [
          "{Tài liệu kèm theo đơn khởi kiện}",
          "{Tài liệu kèm đơn khởi kiện}",
          "{Tài liệu chứng cứ kèm theo}",
          "{Danh mục chứng cứ}"
        ].forEach(function(synTag) {
          replaceBlockMultiline(body, synTag, fullMap["{Tài liệu kèm theo đơn khởi kiện}"]);
        });

        // Áp dụng thay thế nguyên tử cho toàn bộ các Placeholder đơn lẻ
        applyAtomicReplacements(body, fullMap, body.getText());
      }

      // Xử lý chuỗi thời gian triệu tập in đậm số học
      replaceTimeString(body, "{Thời gian triệu tập}", timeString);
      replaceTimeString(body, "{thời gian triệu tập}", timeString);
      
      // Dọn dẹp ngữ pháp và xóa thẻ thừa sau trộn
      sanitizeMergedDocument(body);
      doc.saveAndClose();

      finalFiles.push({ 
        name: newDocFile.getName(), 
        url: newDocFile.getUrl(), 
        docxUrl: "https://docs.google.com/document/d/" + newDocFile.getId() + "/export?format=docx" 
      });
    });

    if (typeof ghiNhatKy === 'function') ghiNhatKy(input.idVuAn, "Soạn thảo văn bản", "Đã xuất " + finalFiles.length + " tệp văn bản thành công.");
    return { success: true, files: finalFiles };
  } catch (e) { 
    return { success: false, error: e.toString() }; 
  }
}