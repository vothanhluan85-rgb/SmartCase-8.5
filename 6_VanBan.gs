/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.6.0 - GROQ AI EDITION
 * FILE 6: CÔNG CỤ SOẠN THẢO VĂN BẢN (DRAFTING ENGINE V5 - SMART COMPOSITE)
 */

function api_LayDanhSachBieuMau_Logic() {
  try {
    var config = getConfigFromSheet();
    var folderId = extractFolderId(config["ID_THUMUC_MAU"]);
    if (!folderId) return [];
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
    var list = [];
    while (files.hasNext()) {
      var f = files.next();
      list.push({ id: f.getId(), name: f.getName() });
    }
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    return list;
  } catch (e) { return []; }
}

function generateRepresentativeText(repJson) {
  if (!repJson) return "";
  try {
    var reps = typeof repJson === 'string' ? JSON.parse(repJson) : repJson;
    if (!Array.isArray(reps) || reps.length === 0) return "";

    return reps.map(r => {
      var xungho = r.xungHo ? r.xungHo + " " : "";
      var name = r.hoTen || "---";
      var ns = r.namSinh ? `, sinh năm ${r.namSinh}` : "";
      var dc = r.diaChi ? `, địa chỉ: ${r.diaChi}` : "";
      var sdt = r.sdt ? `, SĐT: ${r.sdt}` : "";
      var type = r.tuCach || "Người đại diện";
     
      if (type.toLowerCase().includes("pháp luật")) {
        var cv = r.chucVu ? `, chức vụ: ${r.chucVu}` : "";
        return `\n${type}: ${xungho}${name}${ns}${dc}${cv}; là đại diện theo pháp luật`;
      } else {
        var vb = r.vanBan ? ` theo văn bản ủy quyền ngày ${r.vanBan}` : "";
        return `\n${type}: ${xungho}${name}${ns}${dc}${sdt}; là đại diện theo ủy quyền${vb}`;
      }
    }).join("\n");
  } catch (e) {
    return "\nNgười đại diện: " + repJson;
  }
}

function getPersonByRole(parties, roleType) {
  return parties.find(p => {
    var pRole = p.tuCach.toLowerCase();
    if (roleType === "ND") return pRole.includes("nguyên đơn") || pRole.includes("khởi kiện") || pRole.includes("người yêu cầu") || pRole.includes("bị hại");
    if (roleType === "BD") return pRole.includes("bị đơn") || pRole.includes("bị kiện") || pRole.includes("bị yêu cầu") || pRole.includes("bị cáo");
    return pRole.includes(roleType.toLowerCase());
  }) || null;
}

function boldNumbersInText(body, searchString) {
  var searchResult = body.findText(searchString);
  while (searchResult !== null) {
    var element = searchResult.getElement().asText();
    var text = element.getText();
    var regex = /\d+/g; 
    var match;
    while ((match = regex.exec(text)) !== null) {
      var start = match.index;
      var end = start + match[0].length - 1;
      if (start >= searchResult.getStartOffset() && end <= searchResult.getEndOffsetInclusive()) {
        element.setBold(start, end, true);
      }
    }
    searchResult = body.findText(searchString, searchResult);
  }
}

function api_RunMailMergeV3_Logic(input) {
  var finalFiles = [];
  try {
    if (!input || !input.templateIds || input.templateIds.length === 0) return { success: false, error: "Vui lòng chọn mẫu." };
    if (!input.idVuAn) return { success: false, error: "Vui lòng chọn một vụ án."};

    var caseData = layDuLieuChiTiet(input.idVuAn);
    if (caseData.error) return { success: false, error: caseData.error };
   
    var config = getConfigFromSheet();
    var destFolderId = extractFolderId(caseData.info.folderUrl);
    if (!destFolderId) throw new Error("Vụ án chưa có thư mục Drive.");
    var destFolder = DriveApp.getFolderById(destFolderId);

    var parties = caseData.ds;
    var info = caseData.info;

    var dThuly = LibDate.parse(info.ngayTL) || new Date();
    var dHan = new Date(dThuly);
    var monthsToAdd = APP_CONFIG.DEADLINES_INIT[info.loaiAn] || 4;
    dHan.setMonth(dHan.getMonth() + monthsToAdd);
    var dGiaHan = new Date(dHan); dGiaHan.setDate(dGiaHan.getDate() - 5);

    var ndFirst = getPersonByRole(parties, "ND");
    var bdFirst = getPersonByRole(parties, "BD");
   
    var timeStringRaw = (input.trieuTapDate && input.trieuTapTime) ? LibDate.fmtFullTime(input.trieuTapDate, input.trieuTapTime) : "....... giờ ....... phút, ngày ....... tháng ....... năm .......";
    var diaDiemRaw = input.diaDiemLamViec || config["DIA_CHI_TOA"] || "Trụ sở Tòa án";
    if (input.isMissingLocation) diaDiemRaw = "......................................................................";

    var dBanHanhObj = LibDate.parse(input.ngayBanHanh) || new Date();
    var namBanHanh = dBanHanhObj.getFullYear();
    var loaiAnChuan = info.loaiAn.split('. ')[1] || info.loaiAn;
    if(loaiAnChuan.includes("Hôn nhân")) loaiAnChuan = "Hôn nhân và gia đình";

    var commonMap = {
      "{Số thụ lý}": String(info.soTL),
      "{Số thụ lý rút gọn}": String(extractShortNo(info.soTL)),
      "{Loại án}": loaiAnChuan, 
      "{Loại án rút gọn}": getLoaiAnRutGon(info.loaiAn),
      "{Năm ban hành}": String(namBanHanh),
      "{Quan hệ tranh chấp}": String(info.quanHe),
      "{Số văn bản}": input.soPhatHanh || "......",
      
      "{Ngày thụ lý}": String(LibDate.toVNText(info.ngayTL, true)),
      "{ngày thụ lý}": String(LibDate.toVNText(info.ngayTL, false)),
      "{Ngày ban hành}": LibDate.toVNText(dBanHanhObj, true),
      "{ngày ban hành}": LibDate.toVNText(dBanHanhObj, false),
      
      "{Thời gian triệu tập}": timeStringRaw,
      "{Địa điểm làm việc}": diaDiemRaw,
      "{Thời gian gia hạn}": getThoiGianGiaHanText(info.loaiAn),
      "{Ngày gia hạn}": String(LibDate.toVNText(dGiaHan, false)),
      "{Ngày hết hạn}": String(LibDate.toVNText(dHan, true)),
      
      "{Thẩm phán}": String(config["TEN_THAM_PHAN"]),
      "{Tòa án}": String(config["TEN_TOA_AN"]),
      "{Địa chỉ tòa án}": String(config["DIA_CHI_TOA"] || "Trụ sở Tòa án"),
      "{Thư ký}": String(config["TEN_THU_KY"] || "...................................."),
      "{Chức vụ}": String(config["CHUC_VU"] || "Thẩm phán"),
      "{Nội dung làm việc}": String(input.noiDungThem || "........................................................"),
      "{Nội dung vụ việc}": `${info.quanHe} giữa ${ndFirst ? toTitleCase(ndFirst.hoTen) : "..."} và ${bdFirst ? toTitleCase(bdFirst.hoTen) : "..."}`
    };

    input.templateIds.forEach(function(templateId) {
      var templateDoc = DocumentApp.openById(templateId);
      var templateName = templateDoc.getName();
      var templateBody = templateDoc.getBody();
     
      var tempFile = DriveApp.getFileById(templateId).makeCopy("TEMP_" + templateName, destFolder);
      var doc = DocumentApp.openById(tempFile.getId());
      var body = doc.getBody();

      // CHẾ ĐỘ 1: TÁCH TRANG (Có sinh thêm trang cho Người đại diện)
      if (templateBody.getText().indexOf("{Họ và tên}") > -1) {
        body.clear();
        var indices = (input.selectedIndices && input.selectedIndices.length > 0) ? input.selectedIndices : parties.map((_, i) => i);
        var filteredParties = parties.filter((_, idx) => indices.includes(idx));

        var mergeRecipients = [];
        filteredParties.forEach(p => {
           mergeRecipients.push(p); 
           if (p.daiDien) {
               try {
                  var reps = JSON.parse(p.daiDien);
                  reps.forEach(r => {
                      mergeRecipients.push({ hoTen: r.hoTen, xungHo: r.xungHo, tuCach: r.tuCach + " của " + p.tuCach + " " + p.hoTen, diaChi: r.diaChi || p.diaChi, namSinh: r.namSinh || "", sdt: r.sdt || "", cccd: r.cccd || "", daiDien: "" });
                  });
               } catch(e) {}
           }
        });

        mergeRecipients.forEach(function(ds, pIdx) {
          if (pIdx > 0) body.appendPageBreak();
          for (var j = 0; j < templateBody.getNumChildren(); j++) {
            var element = templateBody.getChild(j).copy();
            try {
              if (element.getType() == DocumentApp.ElementType.PARAGRAPH) body.appendParagraph(element);
              else if (element.getType() == DocumentApp.ElementType.TABLE) body.appendTable(element);
              else if (element.getType() == DocumentApp.ElementType.LIST_ITEM) body.appendListItem(element);
            } catch(e) {}
          }
         
          var pMap = {
            "{Xưng hô}": ds.xungHo ? toTitleCase(ds.xungHo) : "",
            "{xưng hô}": ds.xungHo ? ds.xungHo.toLowerCase() : "",
            "{Họ và tên}": toTitleCase(ds.hoTen),
            "{Địa chỉ}": ds.diaChi || "...",
            "{Tư cách}": ds.tuCach || "...",
            "{tư cách}": ds.tuCach ? ds.tuCach.toLowerCase() : "...",
            "{Số điện thoại}": ds.sdt || "...",
            "{Năm sinh}": (ds.namSinh && ds.xungHo !== "Công ty") ? ("sinh năm " + ds.namSinh) : "",
            "{CCCD}": ds.cccd || "...",
            "{Người đại diện}": generateRepresentativeText(ds.daiDien)
          };
          applyReplacementsAndBold(body, pMap, commonMap, mergeRecipients);
        });
      }
      // CHẾ ĐỘ 2: GỘP VĂN BẢN (THUẬT TOÁN TẠO CHUỖI COMPOSITE)
      else {
        var roleMap = {};
        
        // Nhận diện linh hoạt tư cách tố tụng dựa vào Loại án
        var tuCachND = "Nguyên đơn"; var tuCachBD = "Bị đơn";
        if (info.loaiAn.includes("Hình sự")) { tuCachND = "Người bị hại"; tuCachBD = "Bị cáo"; }
        else if (info.loaiAn.includes("Hành chính")) { tuCachND = "Người khởi kiện"; tuCachBD = "Người bị kiện"; }
        else if (info.loaiAn.includes("Hòa giải")) { tuCachND = "Người yêu cầu"; tuCachBD = "Người bị yêu cầu"; }
        
        var roleGroups = [
          { group: tuCachND, match: "ND" },
          { group: tuCachBD, match: "BD" },
          { group: "Người có quyền lợi, nghĩa vụ liên quan", match: "Người có quyền lợi, nghĩa vụ liên quan" },
          { group: "Người làm chứng", match: "Người làm chứng" }
        ];
       
        roleGroups.forEach(function(rg) {
          var p = getPersonByRole(parties, rg.match);
          var keySuffix = rg.group; // Ví dụ: "Nguyên đơn" hoặc "Người bị hại"
          
          if (p) {
            var xhHoa = p.xungHo ? toTitleCase(p.xungHo) : "";
            var xhThuong = p.xungHo ? p.xungHo.toLowerCase() : "";
            var name = toTitleCase(p.hoTen);
            var nsText = (p.namSinh && p.xungHo !== "Công ty") ? (", sinh năm " + p.namSinh) : "";
            var dcText = p.diaChi ? ("; địa chỉ: " + p.diaChi) : "";

            // Các biến lẻ cũ
            roleMap["{Họ và tên " + keySuffix + "}"] = name;
            roleMap["{Xưng hô " + keySuffix + "}"] = xhHoa;
            roleMap["{xưng hô " + keySuffix + "}"] = xhThuong;
            roleMap["{Địa chỉ " + keySuffix + "}"] = p.diaChi || "...";
            roleMap["{Năm sinh " + keySuffix + "}"] = nsText;
            roleMap["{Số điện thoại " + keySuffix + "}"] = p.sdt || "...";
            roleMap["{Người đại diện " + keySuffix + "}"] = generateRepresentativeText(p.daiDien);

            // BỘ PLACEHOLDER MỚI: TỔ HỢP GỘP (COMPOSITE)
            var strNganHoa = (xhHoa ? xhHoa + " " : "") + name;
            var strNganThuong = (xhThuong ? xhThuong + " " : "") + name;
            var strChiTietHoa = strNganHoa + nsText + dcText;
            var strChiTietThuong = strNganThuong + nsText + dcText;

            roleMap["{" + keySuffix + "}"] = strNganHoa;                           // {Nguyên đơn}
            roleMap["{" + keySuffix.toLowerCase() + "}"] = strNganThuong;          // {nguyên đơn}
            roleMap["{" + keySuffix + " chi tiết}"] = strChiTietHoa;               // {Nguyên đơn chi tiết}
            roleMap["{" + keySuffix.toLowerCase() + " chi tiết}"] = strChiTietThuong; // {nguyên đơn chi tiết}
            
            // Xử lý ánh xạ ngược nếu người dùng vẫn dùng chữ gốc trong biểu mẫu
            // (Ví dụ: án Hành chính nhưng form Word vẫn lỡ ghi {Nguyên đơn})
            if (rg.match === "ND") {
                roleMap["{Nguyên đơn}"] = strNganHoa;
                roleMap["{nguyên đơn}"] = strNganThuong;
                roleMap["{Nguyên đơn chi tiết}"] = strChiTietHoa;
                roleMap["{nguyên đơn chi tiết}"] = strChiTietThuong;
            }
            if (rg.match === "BD") {
                roleMap["{Bị đơn}"] = strNganHoa;
                roleMap["{bị đơn}"] = strNganThuong;
                roleMap["{Bị đơn chi tiết}"] = strChiTietHoa;
                roleMap["{bị đơn chi tiết}"] = strChiTietThuong;
            }

          } else {
            // Giá trị mặc định nếu vụ án vắng mặt vai trò này
            var emptyName = "...............................................";
            var emptyChiTiet = "....................................................................................";
            
            roleMap["{" + keySuffix + "}"] = emptyName;
            roleMap["{" + keySuffix.toLowerCase() + "}"] = emptyName;
            roleMap["{" + keySuffix + " chi tiết}"] = emptyChiTiet;
            roleMap["{" + keySuffix.toLowerCase() + " chi tiết}"] = emptyChiTiet;
            
            // Fallback map
            if (rg.match === "ND") {
                roleMap["{Nguyên đơn}"] = roleMap["{nguyên đơn}"] = emptyName;
                roleMap["{Nguyên đơn chi tiết}"] = roleMap["{nguyên đơn chi tiết}"] = emptyChiTiet;
            }
            if (rg.match === "BD") {
                roleMap["{Bị đơn}"] = roleMap["{bị đơn}"] = emptyName;
                roleMap["{Bị đơn chi tiết}"] = roleMap["{bị đơn chi tiết}"] = emptyChiTiet;
            }
            
            // Dọn dẹp biến lẻ cũ
            roleMap["{Họ và tên " + keySuffix + "}"] = emptyName; 
            roleMap["{Xưng hô " + keySuffix + "}"] = "...........";
            roleMap["{xưng hô " + keySuffix + "}"] = "..........."; 
            roleMap["{Địa chỉ " + keySuffix + "}"] = "...................................................";
            roleMap["{Năm sinh " + keySuffix + "}"] = ""; 
            roleMap["{Số điện thoại " + keySuffix + "}"] = "..................";
            roleMap["{Người đại diện " + keySuffix + "}"] = "";
          }
        });
       
        body.replaceText("{Đương sự thông báo}", formatBlockType1(parties));
        body.replaceText("{Đương sự}", formatBlockType2(parties));
        applyReplacementsAndBold(body, roleMap, commonMap, parties);
      }

      // Xử lý in đậm Thời gian triệu tập
      if (input.trieuTapDate && input.trieuTapTime) {
          boldNumbersInText(body, timeStringRaw);
      }

      doc.saveAndClose();
     
      var fileId = tempFile.getId();
      var fileName = templateName + " - " + extractShortNo(info.soTL) + ".docx";
      var url = "https://docs.google.com/feeds/download/documents/export/Export?id=" + fileId + "&exportFormat=docx";
      var response = UrlFetchApp.fetch(url, { headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()}, muteHttpExceptions: true });
      var docxFile = destFolder.createFile(response.getBlob().setName(fileName));
      finalFiles.push({ name: docxFile.getName(), url: docxFile.getUrl() });
     
      DriveApp.getFileById(fileId).setTrashed(true);
    });

    ghiNhatKy(input.idVuAn, "Văn bản", "Đã soạn " + finalFiles.length + " bản văn bản.");
    return { success: true, files: finalFiles };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function applyReplacementsAndBold(body, pMap, commonMap, parties) {
  for (var key in commonMap) body.replaceText(key, commonMap[key]);
  for (var key in pMap) body.replaceText(key, pMap[key]);
 
  parties.forEach(p => {
    var name = toTitleCase(p.hoTen);
    if (!name || name === "---") return;
    var search = body.findText(name);
    while (search) {
      search.getElement().asText().setBold(search.getStartOffset(), search.getEndOffsetInclusive(), true);
      search = body.findText(name, search);
    }
  });
}

function formatBlockType1(parties) {
  return parties.map(function(ds, i) {
    var repText = generateRepresentativeText(ds.daiDien);
    var ns = (ds.namSinh && ds.xungHo !== "Công ty") ? (", sinh năm " + ds.namSinh) : "";
    var xh = ds.xungHo ? toTitleCase(ds.xungHo) + " " : "";
    var line1 = (i + 1) + ". " + xh + toTitleCase(ds.hoTen) + ns + ", địa chỉ: " + ds.diaChi + "; là " + ds.tuCach + ";";
    var line2 = repText ? repText : "";
    return line1 + line2;
  }).join("\n");
}

function formatBlockType2(parties) {
  var groups = parties.reduce(function(acc, ds) { acc[ds.tuCach] = acc[ds.tuCach] || []; acc[ds.tuCach].push(ds); return acc; }, {});
  var result = []; var mIdx = 1;
  for (var role in groups) {
    result.push(mIdx + ". " + role + ":");
    groups[role].forEach(function(ds) {
      var repText = generateRepresentativeText(ds.daiDien);
      var ns = (ds.namSinh && ds.xungHo !== "Công ty") ? (", sinh năm " + ds.namSinh) : "";
      var xh = ds.xungHo ? ds.xungHo + " " : "";
      var line1 = "   - " + xh + toTitleCase(ds.hoTen) + ns + "; địa chỉ: " + ds.diaChi + ";";
      var line2 = repText ? "\n" + repText : "";
      result.push(line1 + line2);
    });
    mIdx++;
  }
  return result.join("\n");
}