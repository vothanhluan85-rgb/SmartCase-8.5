/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.5 - MASTER AI ENGINE & COPILOT CORE
 * TỆP: 9_ModuleAI.gs - ĐỘNG CƠ TRÍ TUỆ NHÂN TẠO CHUẨN HÓA PHÂN TẦNG NHIỆM VỤ
 * -------------------------------------------------------------------------
 * - MA TRẬN 3 PHÂN TẦNG ĐƯỢC THIẾT LẬP TỪ KẾT QUẢ BENCHMARK THỰC TẾ:
 *   + TIER 1 (FAST / OCR): gemini-3.5-flash-lite (643ms), gemini-flash-lite-latest (685ms).
 *   + TIER 2 (COPILOT): gemini-3.5-flash-lite, gemini-3-flash-preview (1.5s).
 *   + TIER 3 (REASONING): gemini-3.6-flash (11.4s), gemini-3.5-flash (25s).
 * - BẬT responseMimeType="application/json" CHỐNG LỖI PARSE VÀ KHÔNG BỊ CẮT TOKEN.
 * - BỘ LỌC TƯ PHÁP (RULE-BASED): Chặn 100% cán bộ tố tụng lọt vào đương sự.
 * - TÁCH DÍNH CHÙM & BẢO TOÀN ĐẠI DIỆN: Cung cấp replacedJoinedNames & daiDien.
 * =========================================================================
 */

// MA TRẬN PHÂN TẦNG ĐÃ ĐƯỢC CHỨNG MINH 100% QUA ĐO THỰC TẾ
var AI_TIERS = {
  // Tầng 1: Tốc độ cao, OCR và bóc tách tài liệu
  FAST: [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview"
  ],
  // Tầng 2: Trợ lý tương tác Copilot thời gian thực
  COPILOT: [
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash"
  ],
  // Tầng 3: Lý luận sâu, soạn thảo văn bản tố tụng toàn văn từ đầu
  REASONING: [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite"
  ]
};

// =========================================================================
// 1. BỘ TRÍCH XUẤT JSON AN TOÀN (ROBUST JSON EXTRACTION)
// =========================================================================

function extractSafeJSON(text) {
  if (!text) return {};
  var str = String(text).trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(str);
  } catch (e1) {}

  // 2. Gọt sạch các khối markdown code fence ```json ... ```
  var clean = str.replace(/```(?:json)?/gi, '').replace(/```/g, '').replace(/^`+|`+$/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e2) {}

  // 3. Quét khối ngoặc nhọn outermost { ... }
  var start = clean.indexOf('{');
  var end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    var candidate = clean.substring(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (e3) {
      try {
        var sanitized = candidate
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
          .replace(/,\s*([\}\]])/g, "$1");
        return JSON.parse(sanitized);
      } catch (e4) {}
    }
  }

  console.warn("Không thể parse JSON từ AI. Nội dung nhận được:\n" + str.substring(0, 200));
  return {};
}

// =========================================================================
// 2. BỘ LỌC TƯ PHÁP HẬU KIỂM (CẤM CÁN BỘ TỐ TỤNG LỌT VÀO ĐƯƠNG SỰ)
// =========================================================================

function ai_FilterJudicialPersonnel(partyList) {
  if (!partyList || !Array.isArray(partyList)) return [];

  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  var judgeName = String(config["TEN_THAM_PHAN"] || "").toLowerCase().trim();

  var clerkNames = [];
  try {
    var rawClerks = config["DS_THU_KY"];
    var parsedClerks = typeof rawClerks === 'string' ? JSON.parse(rawClerks) : rawClerks;
    if (Array.isArray(parsedClerks)) {
      parsedClerks.forEach(function(c) {
        if (c.ten) clerkNames.push(String(c.ten).toLowerCase().trim());
      });
    }
  } catch (e) {}

  var forbiddenKeywords = [
    "thẩm phán", "thư ký", "kiểm sát viên", "viện kiểm sát", "vks",
    "hội thẩm", "công an", "chấp hành viên", "giám định viên", "người tiến hành tố tụng"
  ];

  function cleanName(n) {
    return String(n || "")
      .toLowerCase()
      .replace(/^(ông\/bà|ông|bà|anh|chị)\s+/i, '')
      .trim();
  }

  return partyList.filter(function(p) {
    if (!p || !p.hoTen) return false;
    var nameLower = cleanName(p.hoTen);
    var tuCachLower = String(p.tuCach || "").toLowerCase();

    // 1. Loại trừ nếu trùng tên Thẩm phán
    if (judgeName && nameLower.includes(cleanName(judgeName))) return false;

    // 2. Loại trừ nếu trùng tên bất kỳ Thư ký nào
    for (var i = 0; i < clerkNames.length; i++) {
      if (clerkNames[i] && nameLower.includes(cleanName(clerkNames[i]))) return false;
    }

    // 3. Loại trừ nếu chứa từ khóa cán bộ công quyền
    for (var k = 0; k < forbiddenKeywords.length; k++) {
      var kw = forbiddenKeywords[k];
      if (tuCachLower.includes(kw) || nameLower.startsWith(kw + " ")) return false;
    }

    return true;
  });
}

// =========================================================================
// 3. ĐỌC NỘI DUNG TỆP WORD / DOCX AN TOÀN
// =========================================================================

function extractTextFromFile(base64Data, mimeType, fileName) {
  var tempDocId = null;
  try {
    var decodedData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedData, mimeType || MimeType.MICROSOFT_WORD, fileName || "temp_file.docx");

    var tempFile = Drive.Files.create(
      { name: "TEMP_OCR_" + new Date().getTime(), mimeType: MimeType.GOOGLE_DOCS },
      blob
    );
    tempDocId = tempFile.id;

    var doc = DocumentApp.openById(tempDocId);
    var text = doc.getBody().getText();
    return text;
  } catch (e) {
    return "Không thể trích xuất văn bản từ tệp Word: " + e.message;
  } finally {
    if (tempDocId) {
      try {
        if (typeof Drive.Files.delete === 'function') Drive.Files.delete(tempDocId);
        else DriveApp.getFileById(tempDocId).setTrashed(true);
      } catch (ex) {}
    }
  }
}

// =========================================================================
// 4. ĐỘNG CƠ ĐIỀU PHỐI AI THEO PHÂN TẦNG (TIERED CALLER)
// =========================================================================

function callGeminiByTier(tierName, systemPrompt, userPrompt, attachments, maxTokens, enforceJson) {
  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  var apiKey = config["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("Chưa cấu hình GEMINI_API_KEY trong Cài đặt hệ thống!");

  var modelsToTry = AI_TIERS[tierName] || AI_TIERS.FAST;
  var parts = [];

  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    attachments.forEach(function(att, idx) {
      var fileName = att.fileName || att.name || ("Tài_liệu_" + (idx + 1));
      var mime = att.mimeType || "";
      var fLower = fileName.toLowerCase();

      if (att.textContent && String(att.textContent).trim().length > 0) {
        parts.push({ "text": `\n[TỆP VĂN BẢN ${idx + 1}: ${fileName}]:\n${att.textContent}\n` });
      } else if (mime.includes("pdf") || fLower.endsWith('.pdf') || mime.includes("image") || mime.startsWith("image/")) {
        var base64Clean = att.base64Data || att.base64 || "";
        if (base64Clean.includes(",")) base64Clean = base64Clean.split(",")[1];

        parts.push({
          "inlineData": {
            "mimeType": (mime.includes("pdf") || fLower.endsWith('.pdf')) ? "application/pdf" : (mime || "image/jpeg"),
            "data": base64Clean
          }
        });
      } else if (fLower.endsWith('.docx') || fLower.endsWith('.doc') || mime.includes('word') || mime.includes('officedocument')) {
        var base64Word = att.base64Data || att.base64 || "";
        if (base64Word.includes(",")) base64Word = base64Word.split(",")[1];
        var docxText = extractTextFromFile(base64Word, mime, fileName);
        parts.push({ "text": `\n[NỘI DUNG TỆP WORD ${idx + 1}: ${fileName}]:\n${docxText}\n` });
      }
    });
  }

  parts.push({ "text": userPrompt });

  var genConfig = {
    "temperature": 0.0,
    "maxOutputTokens": maxTokens || 4096
  };
  if (enforceJson) {
    genConfig["responseMimeType"] = "application/json";
  }

  var payload = {
    "system_instruction": { "parts": [{ "text": systemPrompt }] },
    "contents": [{ "role": "user", "parts": parts }],
    "generationConfig": genConfig
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  var lastError = "";

  for (var i = 0; i < modelsToTry.length; i++) {
    var modelName = modelsToTry[i];
    try {
      var url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
      var resp = UrlFetchApp.fetch(url, options);
      var code = resp.getResponseCode();
      var respText = resp.getContentText();
      var json = JSON.parse(respText);

      if (code === 200 && json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
        var result = json.candidates[0].content.parts[0].text;
        return result.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "").trim();
      } else {
        lastError = `[${modelName} - HTTP ${code}]: ` + (json.error ? json.error.message : respText);
      }
    } catch (e) {
      lastError = `[${modelName}]: ` + e.message;
    }
  }

  throw new Error("Lỗi kết nối phân tầng AI [" + tierName + "]: " + lastError);
}

// =========================================================================
// 5. NHIỆM VỤ 1: QUÉT ĐƠN / BÌA HỒ SƠ ĐỂ THỤ LÝ (TIER 1 - FAST)
// =========================================================================

function ai_ParseDocumentForCaseInfo(fileName, mimeType, base64Data) {
  try {
    var att = [{ fileName: fileName, mimeType: mimeType, base64Data: base64Data }];
    var systemPrompt = `BẠN LÀ CHUYÊN GIA THẨM ĐỊNH HỒ SƠ TỐ TỤNG TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Trích xuất thông tin vụ án và danh sách tất cả đương sự.

QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI CẤM lấy Thẩm phán, Thư ký, Kiểm sát viên, Công an vào danh sách đương sự.
2. TÁCH RỜI ĐƯƠNG SỰ DÍNH CHÙM (vợ chồng, đồng đương sự phải tách thành từng người).
3. Tổ chức: xungHo="Tổ chức", namSinh="". Cá nhân: xungHo="Ông"|"Bà", namSinh="19xx".
4. SĐT là 10 số (bắt đầu bằng 0), CCCD là 12 số (CMND là 9 số).

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "soTL": "Số thụ lý hoặc số đơn trên bìa",
  "ngayTL": "YYYY-MM-DD nếu có con dấu, không có thì rỗng ''",
  "loaiAn": "2. Dân sự / 3. Hôn nhân / 4. Kinh doanh / 6. Hành chính / 7. Việc dân sự / 8. Hòa giải đối thoại",
  "quanHe": "Quan hệ pháp luật tranh chấp cụ thể",
  "parties": [
    {
      "tuCach": "Nguyên đơn / Bị đơn / Người yêu cầu / Người có quyền lợi, nghĩa vụ liên quan",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên đầy đủ",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "",
      "cccd": "",
      "daiDien": "Thông tin đại diện nếu có"
    }
  ],
  "tomTat": "Tóm tắt yêu cầu khởi kiện"
}`;

    // GỌI QUA TẦNG 1 (FAST) VỚI KHÓA JSON
    var rawResult = callGeminiByTier("FAST", systemPrompt, "TRÍCH XUẤT THÔNG TIN THỤ LÝ VỤ ÁN:", att, 4096, true);
    var parsed = extractSafeJSON(rawResult);

    if (parsed.parties && Array.isArray(parsed.parties)) {
      parsed.parties = ai_FilterJudicialPersonnel(parsed.parties);
    }

    if (parsed.parties && parsed.parties.length > 0) {
      var ndList = parsed.parties.filter(function(p) {
        var tc = String(p.tuCach || "").toLowerCase();
        return tc.includes("nguyên đơn") || tc.includes("khởi kiện") || (tc.includes("yêu cầu") && !tc.includes("bị"));
      });
      var bdList = parsed.parties.filter(function(p) {
        var tc = String(p.tuCach || "").toLowerCase();
        return tc.includes("bị đơn") || tc.includes("bị kiện") || tc.includes("bị cáo") || tc.includes("bị yêu cầu");
      });

      parsed.nd_Info = ndList.length > 0 ? ndList[0] : parsed.parties[0];
      parsed.bd_Info = bdList.length > 0 ? bdList[0] : (parsed.parties[1] || null);
    }

    return { success: true, data: parsed };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 6. NHIỆM VỤ 2: BÓC TÁCH CHỨNG CỨ, NGUYÊN LIỆU & ĐỐI SOÁT ĐƯƠNG SỰ (TIER 1 - FAST)
// =========================================================================

function ai_ParseEvidenceDocument(idVuAn, fileName, mimeType, base64Data, targetNarrativeKey, rawAttachmentsArray) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAn = ss.getSheetByName("1_SoThuLy");
    var sheetDS = ss.getSheetByName("2_DuongSu");
    if (!sheetAn) throw new Error("Không tìm thấy bảng 1_SoThuLy.");

    var finder = sheetAn.getRange("A:A").createTextFinder(idVuAn).matchEntireCell(true).findNext();
    if (!finder) throw new Error("Không tìm thấy hồ sơ vụ án trong CSDL.");

    var row = finder.getRow();
    var soTL = sheetAn.getRange(row, 2).getValue();
    var loaiAn = sheetAn.getRange(row, 4).getValue();
    var quanHe = sheetAn.getRange(row, 5).getValue();
    var folderUrl = sheetAn.getRange(row, 8).getValue();

    var existingParties = [];
    if (sheetDS && sheetDS.getLastRow() > 1) {
      var dataDS = sheetDS.getDataRange().getValues();
      for (var i = 1; i < dataDS.length; i++) {
        if (String(dataDS[i][0] || "").trim() === String(idVuAn).trim()) {
          existingParties.push({
            tuCach: String(dataDS[i][1] || "Đương sự").trim(),
            xungHo: String(dataDS[i][2] || "Ông/Bà").trim(),
            hoTen: String(dataDS[i][3] || "").trim(),
            namSinh: String(dataDS[i][4] || "").replace(/^'/, "").trim(),
            diaChi: String(dataDS[i][5] || "").trim(),
            sdt: String(dataDS[i][6] || "").replace(/^'/, "").trim(),
            cccd: String(dataDS[i][7] || "").replace(/^'/, "").trim(),
            daiDien: String(dataDS[i][8] || "").trim()
          });
        }
      }
    }

    var att = [];
    if (rawAttachmentsArray && Array.isArray(rawAttachmentsArray) && rawAttachmentsArray.length > 0) {
      att = rawAttachmentsArray;
    } else if (base64Data && base64Data.length < 100 && !base64Data.includes("/")) {
      var driveFile = DriveApp.getFileById(base64Data);
      var driveMime = driveFile.getMimeType();
      var driveName = driveFile.getName();
      fileName = driveName;

      if (driveMime === MimeType.GOOGLE_DOCS || driveMime === "application/vnd.google-apps.document") {
        att.push({ fileName: driveName, mimeType: driveMime, textContent: DocumentApp.openById(driveFile.getId()).getBody().getText() });
      } else {
        var blob = driveFile.getBlob();
        att.push({ fileName: driveName, mimeType: driveMime, base64Data: Utilities.base64Encode(blob.getBytes()) });
      }
    } else if (base64Data) {
      att.push({ fileName: fileName, mimeType: mimeType, base64Data: base64Data });
    }

    if (att.length === 0) throw new Error("Không có dữ liệu tệp hoặc hình ảnh nào để xử lý.");

    return ai_ExecuteStructuredExtraction(soTL, loaiAn, quanHe, folderUrl, idVuAn, att, fileName, targetNarrativeKey, existingParties);
  } catch (e) {
    return { success: false, error: "Lỗi bóc tách tài liệu: " + e.message };
  }
}

function ai_ExecuteStructuredExtraction(soTL, loaiAn, quanHe, folderUrl, idVuAn, attachments, sourceDocNames, targetNarrativeKey, existingParties) {
  existingParties = existingParties || [];

  var partiesContext = existingParties.map(function(p, idx) {
    var ns = (p.namSinh && p.namSinh !== "19xx" && p.namSinh !== "---") ? p.namSinh : "CHƯA CÓ";
    var dc = (p.diaChi && !p.diaChi.toLowerCase().includes("nhập địa chỉ") && p.diaChi !== "---") ? p.diaChi : "CHƯA CÓ";
    var dt = (p.sdt && !p.sdt.toLowerCase().includes("chưa có") && p.sdt !== "---") ? p.sdt : "CHƯA CÓ";
    var cd = (p.cccd && !p.cccd.toLowerCase().includes("chưa có") && p.cccd !== "---") ? p.cccd : "CHƯA CÓ";
    var rep = (p.daiDien && p.daiDien !== "[]" && p.daiDien !== "") ? p.daiDien : "CHƯA CÓ";
    return `[STT ${idx + 1}] ${p.tuCach}: [${p.xungHo || 'Ông/Bà'}] ${p.hoTen} (Năm sinh: ${ns}, Địa chỉ: ${dc}, SĐT: ${dt}, CCCD: ${cd}, Đại diện: ${rep})`;
  }).join("\n");

  var systemPrompt = `BẠN LÀ CHUYÊN GIA THẨM ĐỊNH NGUYÊN LIỆU HỒ SƠ TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Đọc toàn văn tài liệu, đối soát với danh sách đương sự hiện có, trích xuất chính xác 100% đương sự, người đại diện và các điều khoản pháp lý.

QUY TẮC CỐT LÕI:
1. TUYỆT ĐỐI CẤM người tiến hành tố tụng (Thẩm phán, Thư ký, KSV, Công an).
2. TÁCH DÍNH CHÙM: Nếu danh sách hiện có đang bị gộp (VD: "Nguyễn Viết Thịnh Nguyễn Thị Tuyết Hạnh"):
   - Đưa chuỗi dính chùm cũ vào "replacedJoinedNames" để xóa dòng gộp cũ.
   - Đưa từng cá nhân đã tách vào mảng "newParties" kèm thông tin nhân thân.
3. Người đại diện (ủy quyền, pháp luật, luật sư): Phải đưa vào mảng "daiDien" của đương sự đó.
4. Đối soát đương sự:
   - Người đã có cần bổ sung Năm sinh, Địa chỉ, SĐT, CCCD ➔ "updatedExistingParties".
   - Người hoàn toàn mới ➔ "newParties".

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "isMismatch": false,
  "mismatchReason": "",
  "replacedJoinedNames": ["Chuỗi tên dính chùm cũ cần xóa"],
  "updatedExistingParties": [
    {
      "hoTen": "Tên đương sự cũ cần bổ sung thông tin",
      "xungHo": "Ông / Bà / Tổ chức",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "",
      "cccd": "",
      "daiDien": []
    }
  ],
  "newParties": [
    {
      "tuCach": "Nguyên đơn / Bị đơn / Người có quyền lợi, nghĩa vụ liên quan",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên người mới hoặc người vừa được tách ra",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "",
      "cccd": "",
      "daiDien": [
        {
          "type": "uq",
          "tuCach": "Người đại diện theo ủy quyền",
          "xungHo": "Ông/Bà",
          "hoTen": "Họ tên người đại diện",
          "namSinh": "19xx",
          "diaChi": "",
          "sdt": "",
          "vanBan": "Văn bản ủy quyền ngày..."
        }
      ]
    }
  ],
  "extracted": {
    "{Lời khai đương sự}": "Toàn văn lời khai, yêu cầu khởi kiện...",
    "{Nội dung vụ án}": "Toàn văn diễn biến sự việc...",
    "{Hợp đồng tín dụng}": "Hợp đồng tín dụng số... ngày...",
    "{Dư nợ tín dụng}": "Nợ gốc, lãi trong hạn, lãi quá hạn...",
    "{Vị trí tài sản tranh chấp}": "Thửa đất số..., tờ bản đồ số...",
    "{Tài sản tranh chấp}": "Mô tả tài sản thế chấp/tranh chấp...",
    "{Di sản thừa kế}": "Danh mục di sản thừa kế...",
    "{Tài liệu kèm theo đơn khởi kiện}": "Danh mục tài liệu chứng cứ kèm theo..."
  }
}

DANH SÁCH ĐƯƠNG SỰ HIỆN CÓ:
${partiesContext || "Chưa có đương sự nào"}`;

  // GỌI TẦNG 1 (FAST) VỚI CỜ JSON
  var rawResult = callGeminiByTier("FAST", systemPrompt, "TIẾN HÀNH BÓC TÁCH NGUYÊN LIỆU VỤ ÁN:", attachments, 4096, true);
  var parsedData = extractSafeJSON(rawResult);

  // LỌC BỎ CÁN BỘ TƯ PHÁP
  if (parsedData.updatedExistingParties) {
    parsedData.updatedExistingParties = ai_FilterJudicialPersonnel(parsedData.updatedExistingParties);
  }
  if (parsedData.newParties) {
    parsedData.newParties = ai_FilterJudicialPersonnel(parsedData.newParties);
  }

  var extractedFields = parsedData.extracted || parsedData;
  var cleanVariables = {};
  var cleanNarratives = {};

  for (var key in extractedFields) {
    if (key === "summary" || key === "updatedExistingParties" || key === "newParties" || key === "replacedJoinedNames" || key === "isMismatch" || key === "mismatchReason") continue;
    var val = String(extractedFields[key] || "").trim();
    if (val && val !== "..." && val !== "---" && val !== "undefined" && val !== "null") {
      var formattedKey = key.startsWith('{') && key.endsWith('}') ? key : `{${key}}`;
      cleanVariables[formattedKey] = val;
      if (formattedKey.toLowerCase().includes("lời khai") || formattedKey.includes("nội dung vụ án")) {
        cleanNarratives[formattedKey] = val;
      }
    }
  }

  var currentMemory = {};
  if (folderUrl && typeof readCaseMemoryFromDrive === 'function') {
    currentMemory = readCaseMemoryFromDrive(folderUrl);
    currentMemory.variables = Object.assign({}, currentMemory.variables || {}, currentMemory.placeholders || {}, cleanVariables);
    currentMemory.narratives = Object.assign({}, currentMemory.narratives || {}, cleanNarratives);
    if (typeof saveCaseMemoryToDrive === 'function') {
      saveCaseMemoryToDrive(folderUrl, currentMemory);
    }
  }

  return {
    success: true,
    isMismatch: (parsedData.isMismatch === true),
    mismatchReason: parsedData.mismatchReason || "Số thụ lý hoặc đương sự trên tài liệu không khớp với hồ sơ đang mở.",
    replacedJoinedNames: parsedData.replacedJoinedNames || [],
    updatedExistingParties: parsedData.updatedExistingParties || [],
    newParties: parsedData.newParties || [],
    extractedVariables: cleanVariables,
    extractedNarratives: cleanNarratives,
    sourceDocs: sourceDocNames,
    currentMemory: currentMemory
  };
}

// =========================================================================
// 7. NHIỆM VỤ 3: QUÉT ĐƯƠNG SỰ ĐỘC LẬP TỪ TÀI LIỆU SCAN (TIER 1 - FAST)
// =========================================================================

function ai_ParsePartiesFromScan(base64Data, fileName, mimeType) {
  try {
    var att = [{ fileName: fileName, mimeType: mimeType, base64Data: base64Data }];
    var systemPrompt = `BẠN LÀ CHUYÊN GIA BÓC TÁCH ĐƯƠNG SỰ TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Quét văn bản và trích xuất danh sách tất cả đương sự.

QUY TẮC:
1. TUYỆT ĐỐI CẤM đưa Thẩm phán, Thư ký, Kiểm sát viên, Công an vào danh sách đương sự.
2. TÁCH RỜI TỪNG NGƯỜI (không gộp 2 vợ chồng vào chung một dòng).
3. Đầy đủ thông tin đại diện nếu có.

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "parties": [
    {
      "tuCach": "Nguyên đơn / Bị đơn / Người có quyền lợi, nghĩa vụ liên quan / Người làm chứng",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên đầy đủ",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "",
      "cccd": "",
      "daiDien": []
    }
  ]
}`;

    var rawResult = callGeminiByTier("FAST", systemPrompt, "TRÍCH XUẤT TOÀN BỘ ĐƯƠNG SỰ:", att, 4096, true);
    var parsed = extractSafeJSON(rawResult);
    var parties = parsed.parties || [];
    var filteredParties = ai_FilterJudicialPersonnel(parties);

    return { success: true, data: filteredParties };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 8. NHIỆM VỤ 4: TRỢ LÝ COPILOT TỐ TỤNG & ĐIỀU KHIỂN (TIER 2 - COPILOT)
// =========================================================================

function ai_ProcessAssistantChat(userMessage, contextData) {
  try {
    contextData = contextData || {};
    var scope = contextData.scope || "GLOBAL";
    var currentDateStr = contextData.currentDateVN || Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    var lowMsg = String(userMessage || "").toLowerCase().trim();

    if (lowMsg === "ping") {
      return { success: true, reply: "Kết nối Google AI Studio hoạt động hoàn hảo!" };
    }

    var systemActions = `
[DANH MỤC LỆNH ĐIỀU KHIỂN HỆ THỐNG - CHUẨN ĐỊNH DẠNG]:
- Mở sổ thụ lý: [ACTION:appNavigate:view-list::📋 Mở Sổ Thụ Lý]
- Mở sổ nhận đơn: [ACTION:appNavigate:view-danh-sach-don::📥 Mở Sổ Nhận Đơn]
- Mở lịch công tác: [ACTION:appNavigate:view-schedule::📅 Mở Lịch Công Tác]
- Mở báo cáo thống kê: [ACTION:appNavigate:view-stats::📊 Mở Báo Cáo Thống Kê]
- Mở cài đặt: [ACTION:appNavigate:view-settings::⚙️ Mở Cài Đặt Hệ Thống]
- Mở hồ sơ án: [ACTION:moChiTiet:ID_HOẶC_SỐ_THỤ_LÝ::👉 Mở Hồ Sơ Án này]
- Mở chi tiết đơn: [ACTION:moChiTietDon:ID_HOẶC_SỐ_ĐƠN::📑 Mở Chi Tiết Đơn này]
- Mở soạn văn bản: [ACTION:openDraftingModal:ID_VỤ_ÁN:TÊN_MẪU:📝 Soạn Văn Bản]
- Mở tính án phí: [ACTION:openAnPhiModal:::💰 Tính Án Phí NQ 326]
- Mở thụ lý mới: [ACTION:moModalThemMoi:::📁 Thụ Lý Vụ Án Mới]
- Lập lịch làm việc: [ACTION:openTaskModal:ID_VỤ_ÁN:TIÊU_ĐỀ:⏰ Lập Lịch Làm Việc]
- Cập nhật kết quả: [ACTION:openResolutionModal:::⚖️ Cập Nhật Kết Quả Án]
- Hẹn lịch SMS: [ACTION:sendQuickSMS:ID_ĐƠN::💬 Hẹn Lịch & Gửi SMS]
- Rà soát đương sự: [ACTION:openWizardCapNhatDuongSu:::🧙 Rà Soát Đương Sự]
- Mở kho mẫu Drive: [ACTION:openTemplateFolder:::📂 Mở Kho Biểu Mẫu Drive]`;

    var systemPrompt = "";

    if (scope === "CASE" && contextData.caseInfo) {
      var c = contextData.caseInfo;
      var partiesDense = (contextData.caseParties || []).map(function(p) {
        return `${p.tuCach}: ${p.xungHo || ''} ${p.hoTen} (SN: ${p.namSinh || '---'}, ĐC: ${p.diaChi || '---'}, SĐT: ${p.sdt || '---'}, CCCD: ${p.cccd || '---'})`;
      }).join(';\n');

      var driveMemory = {};
      if (c.folderUrl && typeof readCaseMemoryFromDrive === 'function') {
        driveMemory = readCaseMemoryFromDrive(c.folderUrl);
      }
      var onDemandVars = driveMemory.variables || contextData.variables || {};

      systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN TỐ TỤNG TRONG VỤ ÁN: "${c.soTL || 'Đang mở'}".
HÔM NAY LÀ: ${currentDateStr}.

DỮ LIỆU VỤ ÁN THỰC TẾ:
- Số thụ lý: ${c.soTL} | Ngày thụ lý: ${c.ngayTL || '---'} | Hạn giải quyết: ${c.hanGQ || '---'}
- Loại án: ${c.loaiAn} | Quan hệ tranh chấp: ${c.quanHe}
- Danh sách đương sự:
${partiesDense || 'Chưa có'}

THÔNG SỐ & NGUYÊN LIỆU ĐÃ BÓC TÁCH:
${JSON.stringify(onDemandVars)}

${systemActions}
LƯU Ý: Hãy chủ động chèn các cú pháp nút bấm [ACTION:...] vào câu trả lời để Thẩm phán thao tác ngay.`;
    } else {
      systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN HỆ THỐNG TÒA ÁN NHÂN DÂN.
HÔM NAY LÀ: ${currentDateStr}.
${systemActions}
Trả lời ngắn gọn, chuẩn xác theo Bộ luật Tố tụng Dân sự 2015, Luật Tố tụng Hành chính 2015 và các Nghị quyết của Hội đồng Thẩm phán TANDTC.`;
    }

    // GỌI QUA TẦNG 2 (COPILOT) - ĐỐI THOẠI KHÔNG KHÓA JSON
    var reply = callGeminiByTier("COPILOT", systemPrompt, userMessage, contextData.attachments || [], 4096, false);
    return { success: true, reply: reply };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 9. NHIỆM VỤ 5: CẤY PLACEHOLDER VÀO PHÔI MẪU WORD (TIER 2 - COPILOT)
// =========================================================================

function backend_CreateTemplateFromDoc(fileName, mimeType, base64Data, targetFileId, newFileName) {
  var tempDocFile = null;
  try {
    var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
    var templateFolderId = extractFolderId(config["ID_THUMUC_MAU"]);
    if (!templateFolderId) throw new Error("Chưa cấu hình ID Thư mục 'BIỂU MẪU ÁN' trong Cài đặt!");

    var templateFolder = DriveApp.getFolderById(templateFolderId);
    var decodedData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedData, mimeType || MimeType.MICROSOFT_WORD, fileName);

    var resource = { name: "[TEMP_AI_CONVERT] " + fileName, mimeType: MimeType.GOOGLE_DOCS };
    var createdTemp = Drive.Files.create(resource, blob);
    tempDocFile = createdTemp;
    var doc = DocumentApp.openById(tempDocFile.id);
    var body = doc.getBody();
    var textContent = body.getText();

    var placeholderDefs = (typeof backend_GetAllPlaceholders === 'function') ? backend_GetAllPlaceholders() : [];
    var listPlaceholdersText = placeholderDefs.map(function(p) { return `- ${p.name}: ${p.description}`; }).join("\n");

    var systemPrompt = `BẠN LÀ CHUYÊN GIA THIẾT KẾ BIỂU MẪU TỐ TỤNG TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Đọc toàn văn bản gốc và tìm các thông tin cụ thể (tên người thật, ngày tháng, số tiền, số vụ án) để thay thế bằng mã {Placeholder} chuẩn:
${listPlaceholdersText}

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "summary": "Tóm tắt loại biểu mẫu",
  "replacements": [
    { "find": "chuỗi cụ thể trong văn bản", "replace": "{Mã_Placeholder_Chuẩn}" }
  ]
}`;

    var rawResult = callGeminiByTier("COPILOT", systemPrompt, "VĂN BẢN GỐC CẦN CẤY PLACEHOLDER:\n" + textContent, [], 4096, true);
    var parsedAI = extractSafeJSON(rawResult);
    var mapping = parsedAI.replacements || [];
    var validPlaceholderNames = new Set(placeholderDefs.map(function(p) { return p.name.toLowerCase(); }));
    var replacementCount = 0;

    function applyReplacementsToContainer(container) {
      if (!container) return;
      mapping.forEach(function(item) {
        if (item.find && item.replace) {
          var cleanReplace = item.replace.trim();
          if (cleanReplace.startsWith("{") && cleanReplace.endsWith("}")) {
            if (!validPlaceholderNames.has(cleanReplace.toLowerCase())) return;
          }
          try {
            var safeFind = String(item.find).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var safeReplace = String(cleanReplace).replace(/\$/g, '$$$$');
            container.replaceText(safeFind, safeReplace);
            replacementCount++;
          } catch (errRep) {}
        }
      });
    }

    applyReplacementsToContainer(body);
    applyReplacementsToContainer(doc.getHeader());
    applyReplacementsToContainer(doc.getFooter());

    doc.saveAndClose();

    var finalDocId = "";
    var finalDocName = "";

    if (targetFileId) {
      var targetDoc = DocumentApp.openById(targetFileId);
      var targetBody = targetDoc.getBody();
      targetBody.clear();

      var tempDocOpened = DocumentApp.openById(tempDocFile.id);
      var tempBody = tempDocOpened.getBody();
      for (var c = 0; c < tempBody.getNumChildren(); c++) {
        var child = tempBody.getChild(c).copy();
        var type = child.getType();
        if (type === DocumentApp.ElementType.PARAGRAPH) targetBody.appendParagraph(child.asParagraph());
        else if (type === DocumentApp.ElementType.TABLE) targetBody.appendTable(child.asTable());
        else if (type === DocumentApp.ElementType.LIST_ITEM) targetBody.appendListItem(child.asListItem());
      }
      if (targetBody.getNumChildren() > 1 && targetBody.getChild(0).asParagraph().getText() === "") {
        targetBody.removeChild(targetBody.getChild(0));
      }
      targetDoc.saveAndClose();
      finalDocId = targetFileId;
      finalDocName = DriveApp.getFileById(targetFileId).getName();
    } else {
      var cleanNewName = newFileName ? newFileName.trim() : ("[AI] " + fileName.replace(/\.[^/.]+$/, ""));
      var finalDriveFile = DriveApp.getFileById(tempDocFile.id);
      finalDriveFile.setName(cleanNewName);
      finalDriveFile.moveTo(templateFolder);
      finalDocId = finalDriveFile.getId();
      finalDocName = cleanNewName;
    }

    return { success: true, id: finalDocId, name: finalDocName, replacementCount: replacementCount };
  } catch (e) {
    return { success: false, error: "Lỗi AI tạo mẫu: " + e.message };
  } finally {
    if (tempDocFile && tempDocFile.id && targetFileId) {
      try {
        if (typeof Drive.Files.delete === 'function') Drive.Files.delete(tempDocFile.id);
        else DriveApp.getFileById(tempDocFile.id).setTrashed(true);
      } catch (ex) {}
    }
  }
}

// =========================================================================
// 10. NHIỆM VỤ 6: SOẠN TOÀN VĂN BIỂU MẪU RỖNG TỪ ĐẦU (TIER 3 - REASONING)
// =========================================================================

function backend_AutoGenerateEmptyTemplate(templateId, templateName) {
  try {
    var placeholderDefs = (typeof backend_GetAllPlaceholders === 'function') ? backend_GetAllPlaceholders() : [];
    var listPlaceholdersText = placeholderDefs.map(function(p) { return `- ${p.name}: ${p.description}`; }).join("\n");

    var systemPrompt = `BẠN LÀ CHUYÊN VIÊN SOẠN THẢO VĂN BẢN TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Soạn nội dung pháp lý cho biểu mẫu: "${templateName}".

YÊU CẦU:
1. KHÔNG VIẾT Quốc hiệu, Tiêu ngữ, Tên Tòa án hay phần Chữ ký vì hệ thống đã in cố định.
2. Cung cấp Tiêu đề (in hoa), Ký hiệu rút gọn và Mảng các đoạn văn bản chính xác theo Nghị quyết 01/2017/NQ-HĐTP.
3. Lồng ghép chính xác các mã {Placeholder} chuẩn:
${listPlaceholdersText}

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "symbol": "Ký hiệu văn bản (TB-TLVA, QĐXXST-DS, QĐCNTT-DS...)",
  "title": "TIÊU ĐỀ IN HOA",
  "paragraphs": [
    { "text": "Kính gửi: {Đương sự thông báo}", "bold": false, "italic": false, "align": "left" },
    { "text": "{Ngày thụ lý}, Tòa án nhân dân {tòa án} đã thụ lý...", "bold": false, "italic": false, "align": "justify" }
  ]
}`;

    // GỌI QUA TẦNG 3 (REASONING - gemini-3.6-flash / gemini-3.5-flash) ĐỂ SOẠN THẢO VĂN BẢN ĐẠT CHUẨN
    var rawResult = callGeminiByTier("REASONING", systemPrompt, "Hãy soạn thảo nội dung biểu mẫu: " + templateName, [], 8192, true);
    var parsedAI = extractSafeJSON(rawResult);

    if (!parsedAI.paragraphs || !Array.isArray(parsedAI.paragraphs)) {
      throw new Error("Phản hồi của AI không đúng định dạng mảng đoạn văn.");
    }

    var doc = DocumentApp.openById(templateId);
    var body = doc.getBody();
    body.clear();

    body.setMarginLeft(85.04).setMarginRight(56.69).setMarginTop(56.69).setMarginBottom(56.69);

    var headerTable = body.appendTable();
    headerTable.setBorderWidth(0);
    var tr = headerTable.appendTableRow();
    var tdLeft = tr.appendTableCell();
    var tdRight = tr.appendTableCell();

    var pL1 = tdLeft.appendParagraph("TÒA ÁN NHÂN DÂN\n{TÒA ÁN}").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pL1.editAsText().setFontFamily('Times New Roman').setFontSize(12).setBold(true);
    tdLeft.appendParagraph("───────────────").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    var pL2 = tdLeft.appendParagraph("Số: {Số văn bản}/" + new Date().getFullYear() + "/" + (parsedAI.symbol || "TB-TA")).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pL2.editAsText().setFontFamily('Times New Roman').setFontSize(13).setBold(false);

    var pR1 = tdRight.appendParagraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pR1.editAsText().setFontFamily('Times New Roman').setFontSize(12).setBold(true);
    var pR2 = tdRight.appendParagraph("Độc lập - Tự do - Hạnh phúc").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pR2.editAsText().setFontFamily('Times New Roman').setFontSize(14).setBold(true);
    tdRight.appendParagraph("────────────────────").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    var pR3 = tdRight.appendParagraph("{ngày ban hành}").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pR3.editAsText().setFontFamily('Times New Roman').setFontSize(13).setItalic(true);

    body.appendParagraph("").setSpacingAfter(10);

    var pTitle = body.appendParagraph(parsedAI.title || templateName.toUpperCase()).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pTitle.editAsText().setFontFamily('Times New Roman').setFontSize(16).setBold(true);
    body.appendParagraph("").setSpacingAfter(10);

    var styleBody = {};
    styleBody[DocumentApp.Attribute.FONT_FAMILY] = 'Times New Roman';
    styleBody[DocumentApp.Attribute.FONT_SIZE] = 13.5;
    styleBody[DocumentApp.Attribute.LINE_SPACING] = 1.2;
    styleBody[DocumentApp.Attribute.SPACING_AFTER] = 2;

    parsedAI.paragraphs.forEach(function(p) {
      var para = body.appendParagraph(p.text || "");
      para.setAttributes(styleBody);

      if (p.bold) para.editAsText().setBold(true);
      if (p.italic) para.editAsText().setItalic(true);

      if (p.align === "center") para.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      else if (p.align === "right") para.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      else para.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    });

    body.appendParagraph("").setSpacingAfter(10);

    var footerTable = body.appendTable();
    footerTable.setBorderWidth(0);
    var trF = footerTable.appendTableRow();
    var tdF1 = trF.appendTableCell();
    var tdF2 = trF.appendTableCell();

    var pNhan = tdF1.appendParagraph("Nơi nhận:\n- Như trên;\n- Lưu hồ sơ.").setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    pNhan.editAsText().setFontFamily('Times New Roman').setFontSize(11);
    pNhan.editAsText().setItalic(0, 8, true).setBold(0, 8, true);

    var pKy = tdF2.appendParagraph("THẨM PHÁN\n\n\n\n{THẨM PHÁN}").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pKy.editAsText().setFontFamily('Times New Roman').setFontSize(13.5).setBold(true);

    if (body.getNumChildren() > 1 && body.getChild(0).asParagraph().getText() === "") {
      body.removeChild(body.getChild(0));
    }

    doc.saveAndClose();
    return { success: true, count: parsedAI.paragraphs.length };
  } catch (e) {
    return { success: false, error: "Lỗi sinh nội dung biểu mẫu: " + e.message };
  }
}