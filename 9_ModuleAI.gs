/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.5 - MASTER AI ENGINE & TRỢ LÝ THẨM PHÁN
 * TỆP: 9_ModuleAI.gs - ĐỘNG CƠ TRÍ TUỆ NHÂN TẠO PHÂN TẦNG VÀ ĐIỀU HÀNH TỐ TỤNG
 * -------------------------------------------------------------------------
 * - MA TRẬN 3 PHÂN TẦNG ĐÃ ĐƯỢC KIỂM NGHIỆM VÀ ĐO ĐẠC THỰC TẾ:
 *   + TẦNG 1 (FAST / OCR)   : gemini-3.5-flash-lite, gemini-flash-lite-latest,
 *                             gemini-3-flash-preview, gemini-3.1-flash-lite-preview.
 *   + TẦNG 2 (COPILOT)      : gemini-3.5-flash-lite, gemini-3-flash-preview,
 *                             gemini-flash-lite-latest, gemini-3.6-flash.
 *   + TẦNG 3 (REASONING)    : gemini-3.6-flash, gemini-3.5-flash,
 *                             gemini-3.1-flash-lite, gemini-3.5-flash-lite.
 * - CHUẨN HÓA DANH XƯNG DUY NHẤT: "Trợ lý thẩm phán" (không dùng Copilot/Bot/AI Copilot).
 * - TÍCH HỢP HỆ THỐNG TOÀN DIỆN:
 *   + Tự động nhận thức 8 bảng CSDL Sheets, cấu trúc lưu trữ Drive, Calendar tố tụng.
 *   + Nắm vững quy tắc thời hạn tố tụng (BLTTDS, Luật TTHC, Luật HGĐT, BLDS Điều 147-148).
 *   + Áp dụng Nghị quyết 326/2016/UBTVQH14 về án phí, lệ phí Tòa án.
 *   + Mở rộng 15 lệnh điều khiển hệ thống qua cú pháp [ACTION:...].
 * - BÓC TÁCH DỮ LIỆU CHUYÊN SÂU THEO 3 CHẾ ĐỘ: 'PARTIES_ONLY' | 'EVIDENCE_ONLY' | 'FULL'.
 * =========================================================================
 */

// BẢNG CẤU HÌNH MODEL DỰ PHÒNG CHUẨN GOOGLE AI STUDIO (ĐÃ KIỂM NGHIỆM THỰC TẾ)
var AI_TIERS = {
  // Tầng 1: Tốc độ cao, OCR và bóc tách tài liệu
  FAST: [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview"
  ],
  // Tầng 2: Trợ lý tương tác Trợ lý thẩm phán thời gian thực
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
// 1. CÔNG CỤ XỬ LÝ DỮ LIỆU & BỘ LỌC TƯ PHÁP CHẶT CHẼ
// =========================================================================

/**
 * Trích xuất JSON siêu bền bỉ: xử lý markdown code fence, cân bằng ngoặc nhọn,
 * khử trailing commas và ký tự điều khiển ẩn.
 */
function extractSafeJSON(text) {
  if (!text) return {};
  var str = String(text).trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(str);
  } catch (e1) {}

  // 2. Gọt sạch các khối markdown code block ```json ... ```
  var clean = str.replace(/```(?:json)?/gi, '').replace(/```/g, '').replace(/^`+|`+$/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e2) {}

  // 3. Quét khối ngoặc nhọn ngoài cùng { ... }
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

  console.warn("Không thể trích xuất JSON từ AI. Chuỗi nhận được:\n" + str.substring(0, 250));
  return {};
}

/**
 * Lấy danh sách model theo phân tầng: ưu tiên cấu hình động trong Cache/Sheet,
 * fallback về bảng chuẩn AI_TIERS.
 */
function ai_GetModelsForTier(tierName) {
  tierName = tierName || "FAST";
  try {
    var cache = CacheService.getScriptCache().get("APP_AI_MODEL_TIERS");
    if (cache) {
      var parsed = JSON.parse(cache);
      var key = "TIER_" + tierName;
      if (parsed[key] && Array.isArray(parsed[key]) && parsed[key].length > 0) {
        return parsed[key];
      }
    }
  } catch (e) {}

  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  var configKey = "AI_TIER_" + tierName;
  if (config[configKey]) {
    try {
      var list = JSON.parse(config[configKey]);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (e2) {}
  }

  return AI_TIERS[tierName] || AI_TIERS.FAST;
}

/**
 * BỘ LỌC TƯ PHÁP: Ngăn chặn 100% người tiến hành tố tụng và lực lượng chức năng
 * bị AI nhận diện nhầm thành đương sự trong vụ án.
 */
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
    "thẩm phán", "thư ký", "kiểm sát viên", "viện kiểm sát", "vks", "vksnd",
    "hội thẩm", "công an", "chấp hành viên", "giám định viên", "người tiến hành tố tụng",
    "hòa giải viên", "cán bộ điều tra", "điều tra viên"
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

    // 2. Loại trừ nếu trùng tên Thư ký trong đơn vị
    for (var i = 0; i < clerkNames.length; i++) {
      if (clerkNames[i] && nameLower.includes(cleanName(clerkNames[i]))) return false;
    }

    // 3. Loại trừ nếu tư cách hoặc tên có chức danh tư pháp/công quyền
    for (var k = 0; k < forbiddenKeywords.length; k++) {
      var kw = forbiddenKeywords[k];
      if (tuCachLower.includes(kw) || nameLower.startsWith(kw + " ") || nameLower === kw) return false;
    }

    return true;
  });
}

/**
 * Trích xuất nội dung văn bản từ file Word (.docx) sang text thuần
 */
function extractTextFromFile(base64Data, mimeType, fileName) {
  var tempDocId = null;
  try {
    var decodedData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedData, mimeType || MimeType.MICROSOFT_WORD, fileName || "temp_ocr.docx");

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
      try { DriveApp.getFileById(tempDocId).setTrashed(true); } catch (ex) {}
    }
  }
}

// =========================================================================
// 2. ĐỘNG CƠ GỌI GEMINI ĐA PHÂN TẦNG VÀ TỰ ĐỘNG CHUYỂN TIẾP (FAILOVER)
// =========================================================================

function callGeminiByTier(tierName, systemPrompt, userPrompt, attachments, maxTokens, enforceJson) {
  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  var apiKey = config["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("Chưa cấu hình GEMINI_API_KEY trong Cài đặt hệ thống!");

  var modelsToTry = ai_GetModelsForTier(tierName);
  var parts = [];

  // Nạp tài liệu đính kèm (Text, PDF, Ảnh, Word)
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    attachments.forEach(function(att, idx) {
      var fileName = att.fileName || att.name || ("Tai_lieu_" + (idx + 1));
      var mime = att.mimeType || "";
      var fLower = fileName.toLowerCase();

      if (att.textContent && String(att.textContent).trim().length > 0) {
        parts.push({ "text": `\n[TÀI LIỆU VĂN BẢN ${idx + 1}: ${fileName}]:\n${att.textContent}\n` });
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
// 3. NHIỆM VỤ 1: QUÉT BÌA HỒ SƠ / ĐƠN KHỞI KIỆN THỤ LÝ (TẦNG 1 - FAST)
// =========================================================================

function ai_ParseDocumentForCaseInfo(fileName, mimeType, base64Data) {
  try {
    var att = [{ fileName: fileName, mimeType: mimeType, base64Data: base64Data }];
    var systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Trích xuất thông tin hành chính tư pháp và toàn bộ đương sự từ tài liệu thụ lý ban đầu (đơn khởi kiện, biên nhận đơn, bìa hồ sơ, thông báo thụ lý).

QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI CẤM đưa Thẩm phán, Thư ký, Kiểm sát viên, Cán bộ Công an vào danh sách đương sự.
2. TÁCH ĐỘC LẬP TỪNG ĐƯƠNG SỰ: Vợ chồng hoặc đồng đương sự phải tách riêng từng người (không gộp chung tên).
3. Pháp nhân/Tổ chức/Doanh nghiệp/Ngân hàng: xungHo="Tổ chức", namSinh="". Cá nhân: xungHo="Ông"|"Bà", namSinh="19xx" (hoặc rỗng nếu không có).
4. Phân loại án chính xác: "1. Hình sự", "2. Dân sự", "3. Hôn nhân", "4. Kinh doanh", "5. Lao động", "6. Hành chính", "7. Việc dân sự", "8. Hòa giải đối thoại".
5. Số thụ lý: Chỉ lấy phần số gốc (ví dụ: "45" hoặc "172").
6. Ngày thụ lý: định dạng YYYY-MM-DD.

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "soTL": "Phần số của số thụ lý hoặc số đơn",
  "ngayTL": "YYYY-MM-DD",
  "loaiAn": "2. Dân sự / 3. Hôn nhân / ...",
  "quanHe": "Tên quan hệ tranh chấp hoặc tội danh",
  "parties": [
    {
      "tuCach": "Nguyên đơn / Bị đơn / Người yêu cầu / Người có quyền lợi, nghĩa vụ liên quan",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên đầy đủ viết hoa chữ cái đầu",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "",
      "cccd": "",
      "daiDien": "Thông tin người đại diện ủy quyền/pháp luật (nếu có)"
    }
  ],
  "tomTat": "Tóm tắt yêu cầu khởi kiện chính"
}`;

    var rawResult = callGeminiByTier("FAST", systemPrompt, "TRÍCH XUẤT THÔNG TIN THỤ LÝ HỒ SƠ:", att, 4096, true);
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
// 4. NHIỆM VỤ 2: BÓC TÁCH NGUYÊN LIỆU & ĐƯƠNG SỰ THEO CHẾ ĐỘ (TẦNG 1 - FAST)
// =========================================================================

/**
 * Cổng bóc tách dữ liệu nghiệp vụ:
 * - mode = 'PARTIES_ONLY'  : Chỉ chuyên trách đương sự, đại diện, CCCD/năm sinh, tách dính chùm.
 * - mode = 'EVIDENCE_ONLY' : Chỉ chuyên trách lời khai, hợp đồng, tài sản, thỏa thuận.
 * - mode = 'FULL'          : Bóc tách toàn diện cả hai luồng.
 */
function ai_ParseEvidenceDocument(idVuAn, fileName, mimeType, base64Data, modeOrTargetKey, rawAttachmentsArray) {
  try {
    var mode = 'FULL';
    if (modeOrTargetKey === 'PARTIES_ONLY' || modeOrTargetKey === 'EVIDENCE_ONLY') {
      mode = modeOrTargetKey;
    }

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

    if (att.length === 0) throw new Error("Không có tệp tin hoặc hình ảnh nào để xử lý.");

    return ai_ExecuteStructuredExtraction(soTL, loaiAn, quanHe, folderUrl, idVuAn, att, fileName, mode, existingParties);
  } catch (e) {
    return { success: false, error: "Lỗi bóc tách tài liệu: " + e.message };
  }
}

function ai_ExecuteStructuredExtraction(soTL, loaiAn, quanHe, folderUrl, idVuAn, attachments, sourceDocNames, mode, existingParties) {
  existingParties = existingParties || [];
  mode = mode || 'FULL';

  var partiesContext = existingParties.map(function(p, idx) {
    return `[STT ${idx + 1}] ${p.tuCach}: [${p.xungHo || 'Ông/Bà'}] ${p.hoTen} (Năm sinh: ${p.namSinh || 'CHƯA CÓ'}, Địa chỉ: ${p.diaChi || 'CHƯA CÓ'}, SĐT: ${p.sdt || 'CHƯA CÓ'}, CCCD: ${p.cccd || 'CHƯA CÓ'})`;
  }).join("\n");

  var systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN TÒA ÁN NHÂN DÂN CHUYÊN TRÁCH THẨM ĐỊNH HỒ SƠ.
Nhiệm vụ: Phân tích toàn văn tài liệu tố tụng tố tụng theo chế độ: "${mode}".

QUY ĐỊNH CHẾ ĐỘ XỬ LÝ:
1. CHẾ ĐỘ "PARTIES_ONLY":
   - Tập trung 100% vào việc tìm kiếm đương sự, người đại diện theo ủy quyền/pháp luật, luật sư.
   - Đối soát bổ sung Năm sinh, Địa chỉ, SĐT, CCCD cho đương sự đã có trong danh sách.
   - Phát hiện và TÁCH TÊN DÍNH CHÙM (Ví dụ: "Nguyễn Văn A Trần Thị B" -> đưa chuỗi cũ vào "replacedJoinedNames", tách thành 2 người vào "newParties").
   - Đặt "extracted": {} (rỗng).
2. CHẾ ĐỘ "EVIDENCE_ONLY":
   - Tập trung 100% vào việc trích xuất nguyên liệu: lời khai, thỏa thuận hòa giải, hợp đồng tín dụng, tài sản tranh chấp, danh mục chứng cứ.
   - Đặt "updatedExistingParties": [], "newParties": [], "replacedJoinedNames": [].
3. CHẾ ĐỘ "FULL":
   - Thực hiện đầy đủ cả 2 nội dung trên.

QUY TẮC PHÁP LÝ BẮT BUỘC:
- TUYỆT ĐỐI KHÔNG đưa Thẩm phán, Thư ký, Kiểm sát viên, Cán bộ Công an vào danh sách đương sự.
- Người đại diện (ủy quyền, pháp luật, luật sư): Đưa vào mảng "daiDien" của đương sự đó gồm: type ("uq"|"pl"|"ls"), tuCach, xungHo, hoTen, namSinh, diaChi, sdt, vanBan (văn bản ủy quyền ngày/số).
- Đối với thỏa thuận hòa giải / đối thoại: Bóc tách thành các điều khoản chuẩn hóa (quan hệ hôn nhân, con chung, cấp dưỡng, tài sản, nợ, án phí, nghĩa vụ trả tiền, phương thức thi hành).

TRẢ VỀ ĐỊNH DẠNG JSON CHUẨN:
{
  "mode": "${mode}",
  "isMismatch": false,
  "mismatchReason": "",
  "replacedJoinedNames": [],
  "updatedExistingParties": [
    {
      "hoTen": "Họ tên đương sự đã có cần bổ sung",
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
      "tuCach": "Nguyên đơn / Bị đơn / Người có quyền lợi, nghĩa vụ liên quan / Người làm chứng",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên người mới",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "",
      "cccd": "",
      "daiDien": [
        {
          "type": "uq",
          "tuCach": "Người đại diện theo ủy quyền",
          "xungHo": "Ông / Bà",
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
    "{Lời khai đương sự}": "Toàn văn lời khai của các bên...",
    "{Nội dung vụ án}": "Tóm tắt diễn biến vụ án...",
    "{Nội dung thỏa thuận}": "Nội dung thỏa thuận hòa giải...",
    "{Quan hệ hôn nhân}": "Thỏa thuận quan hệ hôn nhân...",
    "{Thỏa thuận con chung}": "Thỏa thuận nuôi con chung...",
    "{Cấp dưỡng nuôi con}": "Thỏa thuận cấp dưỡng...",
    "{Tài sản chung}": "Thỏa thuận tài sản...",
    "{Nợ chung}": "Thỏa thuận nợ...",
    "{Thỏa thuận án phí}": "Thỏa thuận án phí...",
    "{Hợp đồng tín dụng}": "Số hợp đồng, ngày ký...",
    "{Dư nợ tín dụng}": "Nợ gốc, nợ lãi...",
    "{Vị trí tài sản tranh chấp}": "Thửa đất, tờ bản đồ, địa chỉ...",
    "{Tài sản tranh chấp}": "Mô tả tài sản...",
    "{Di sản thừa kế}": "Danh mục di sản...",
    "{Tài liệu kèm theo đơn khởi kiện}": "Danh mục tài liệu chứng cứ kèm đơn..."
  }
}

DANH SÁCH ĐƯƠNG SỰ ĐÃ CÓ TRONG HỒ SƠ:
${partiesContext || "Chưa có đương sự nào"}`;

  var rawResult = callGeminiByTier("FAST", systemPrompt, "TIẾN HÀNH BÓC TÁCH TÀI LIỆU VỤ ÁN:", attachments, 4096, true);
  var parsedData = extractSafeJSON(rawResult);

  if (parsedData.updatedExistingParties) {
    parsedData.updatedExistingParties = ai_FilterJudicialPersonnel(parsedData.updatedExistingParties);
  }
  if (parsedData.newParties) {
    parsedData.newParties = ai_FilterJudicialPersonnel(parsedData.newParties);
  }

  var extractedFields = {};
  if (parsedData.extracted && typeof parsedData.extracted === 'object') {
    extractedFields = parsedData.extracted;
  } else {
    // Nếu AI trả về phẳng ở root, lọc bỏ các trường kỹ thuật
    extractedFields = Object.assign({}, parsedData);
    delete extractedFields.mode;
    delete extractedFields.isMismatch;
    delete extractedFields.mismatchReason;
    delete extractedFields.replacedJoinedNames;
    delete extractedFields.updatedExistingParties;
    delete extractedFields.newParties;
  }

  var cleanVariables = {};
  var cleanNarratives = {};

  for (var key in extractedFields) {
    var val = String(extractedFields[key] || "").trim();
    if (val && val !== "..." && val !== "---" && val !== "undefined" && val !== "null") {
      var formattedKey = (key.startsWith('{') && key.endsWith('}')) ? key : `{${key}}`;
      cleanVariables[formattedKey] = val;
      if (formattedKey.includes("Lời khai") || formattedKey.includes("Nội dung")) {
        cleanNarratives[formattedKey] = val;
      }
    }
  }

  // Tự động bảo lưu dữ liệu vào _case_memory.json trên Google Drive mà không xóa các biến cũ
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
    mode: mode,
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
// 5. NHIỆM VỤ 3: QUÉT ĐƯƠNG SỰ ĐỘC LẬP TỪ TÀI LIỆU SCAN (TẦNG 1 - FAST)
// =========================================================================

function ai_ParsePartiesFromScan(base64Data, fileName, mimeType) {
  try {
    var att = [{ fileName: fileName, mimeType: mimeType, base64Data: base64Data }];
    var systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Quét văn bản và trích xuất danh sách tất cả đương sự, người đại diện theo ủy quyền, luật sư.

QUY TẮC:
1. TUYỆT ĐỐI CẤM đưa Thẩm phán, Thư ký, Kiểm sát viên, Cán bộ Công an vào danh sách đương sự.
2. TÁCH RỜI TỪNG CÁ NHÂN: Không gộp hai vợ chồng hoặc nhiều đương sự chung một dòng.
3. Người đại diện: Điền đầy đủ vào mảng "daiDien" gồm tư cách, họ tên, năm sinh, địa chỉ, số/ngày văn bản ủy quyền.

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "parties": [
    {
      "tuCach": "Nguyên đơn / Bị đơn / Người có quyền lợi, nghĩa vụ liên quan / Người làm chứng",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên đầy đủ viết hoa",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ cư trú hoặc trụ sở",
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
// 6. NHIỆM VỤ 4: ĐIỀU HÀNH TƯƠNG TÁC THỜI GIAN THỰC (TẦNG 2 - COPILOT)
// =========================================================================

/**
 * Trợ lý thẩm phán tương tác: nắm rõ toàn bộ hệ sinh thái phần mềm,
 * pháp luật tố tụng và chủ động điều khiển hệ thống qua cú pháp [ACTION:...].
 */
function ai_ProcessAssistantChat(userMessage, contextData) {
  try {
    contextData = contextData || {};
    var scope = contextData.scope || "GLOBAL";
    var currentDateStr = contextData.currentDateVN || Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    var lowMsg = String(userMessage || "").toLowerCase().trim();

    if (lowMsg === "ping") {
      return { success: true, reply: "Kết nối Trợ lý thẩm phán hoạt động hoàn hảo!" };
    }

    var systemActions = `
[HỆ THỐNG LỆNH ĐIỀU KHIỂN HỆ THỐNG - BẮT BUỘC ĐÍNH KÈM KHI PHÙ HỢP]:
- Mở sổ thụ lý: [ACTION:appNavigate:view-list::📋 Mở Sổ Thụ Lý]
- Mở sổ nhận đơn: [ACTION:appNavigate:view-danh-sach-don::📥 Mở Sổ Nhận Đơn]
- Mở lịch công tác: [ACTION:appNavigate:view-schedule::📅 Mở Lịch Công Tác]
- Mở báo cáo thống kê: [ACTION:appNavigate:view-stats::📊 Mở Báo Cáo Thống Kê]
- Mở cài đặt hệ thống: [ACTION:appNavigate:view-settings::⚙️ Mở Cài Đặt Hệ Thống]
- Mở hồ sơ án: [ACTION:moChiTiet:ID_HOẶC_SỐ_TL::👉 Mở Hồ Sơ Án này]
- Mở chi tiết đơn: [ACTION:moChiTietDon:ID_HOẶC_SỐ_ĐƠN::📑 Mở Chi Tiết Đơn này]
- Mở soạn văn bản: [ACTION:openDraftingModal:ID_VỤ_ÁN:TÊN_MẪU::📝 Soạn Văn Bản]
- Lên lịch làm việc: [ACTION:openTaskModal:ID_VỤ_ÁN:NỘI_DUNG::⏰ Lên Lịch Làm Việc]
- Cập nhật kết quả: [ACTION:openResolutionModal:::⚖️ Cập Nhật Kết Quả Án]
- Tính án phí NQ 326: [ACTION:openAnPhiModal:::💰 Tính Án Phí NQ 326]
- Thụ lý vụ án mới: [ACTION:moModalThemMoi:::📁 Thụ Lý Vụ Án Mới]
- Rà soát đương sự: [ACTION:openWizardCapNhatDuongSu:::🧙 Rà Soát Đương Sự]
- Mở kho biểu mẫu Drive: [ACTION:openTemplateFolder:::📂 Mở Kho Biểu Mẫu]
- Mở thư mục Drive vụ án: [ACTION:openDetailDrive:::📁 Mở Drive Vụ Án]
- Hẹn lịch & gửi SMS: [ACTION:sendQuickSMS:ID_ĐƠN::💬 Hẹn Lịch & Gửi SMS]
- Sao chép dữ liệu QLTA: [ACTION:copyDataForQLTA:::📋 Sao Chép QLTA]`;

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

      systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN TÒA ÁN NHÂN DÂN TRONG HỒ SƠ VỤ ÁN: "${c.soTL || 'Đang mở'}".
HÔM NAY LÀ: ${currentDateStr}.

BẠN ĐƯỢC TÍCH HỢP TRỰC TIẾP VỚI:
1. Cơ sở dữ liệu vụ án và đương sự trên Google Sheets (Bảng 1_SoThuLy, 2_DuongSu).
2. Trạm dữ liệu bộ nhớ hồ sơ trên Google Drive (_case_memory.json).
3. Động cơ trộn văn bản Mail Merge V3 với 64 biểu mẫu tố tụng chuẩn Tòa án.
4. Lịch công tác và đồng bộ Google Calendar hai chiều.
5. Động cơ tính án phí, lệ phí Tòa án theo Nghị quyết 326/2016/UBTVQH14.
6. Quy định thời hạn tố tụng: Điều 203 BLTTDS 2015, Luật TTHC 2015, Luật HGĐT 2020, quy tắc 24h trọn vẹn (Điều 147, 148 BLDS).

THÔNG TIN VỤ ÁN HIỆN TẠI:
- Số thụ lý: ${c.soTL} | Ngày thụ lý: ${c.ngayTL || '---'} | Hạn giải quyết: ${c.hanGQ || '---'}
- Loại án: ${c.loaiAn} | Quan hệ tranh chấp: ${c.quanHe}
- Thành phần đương sự:
${partiesDense || 'Chưa có thông tin đương sự'}

THÔNG SỐ & NGUYÊN LIỆU ĐÃ BÓC TÁCH:
${JSON.stringify(onDemandVars)}

${systemActions}

QUY TẮC PHẢN HỒI:
- Tự xưng là "Trợ lý thẩm phán". Tuyệt đối không dùng tên gọi Copilot, Bot, AI Copilot hay Trợ lý ảo.
- Trả lời chuẩn xác căn cứ pháp lý theo điều, khoản, luật/nghị quyết liên quan.
- Luôn chủ động đề xuất và chèn các nút lệnh [ACTION:...] phù hợp để Thẩm phán có thể nhấn thao tác ngay trên hệ thống.`;
    } else {
      systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN TÒA ÁN NHÂN DÂN.
HÔM NAY LÀ: ${currentDateStr}.

BẠN ĐƯỢC TÍCH HỢP TOÀN DIỆN VÀO HỆ THỐNG QUẢN TRỊ ÁN VÀ XỬ LÝ ĐƠN:
1. Quản trị 8 bảng CSDL Google Sheets (Sổ nhận đơn, Sổ thụ lý, Đương sự, Lịch trình, Nhật ký, Cài đặt, Biểu mẫu, Placeholder).
2. Quản lý cây thư mục Google Drive tự động cho từng vụ việc (Năm / Loại án / [Số TL - Đương sự]).
3. Quản lý Lịch công tác Tòa án và đồng bộ Google Calendar di động.
4. Điều hành quy trình tiền tố tụng (tiếp nhận đơn, hòa giải đối thoại, sửa đổi bổ sung, trả lại đơn, chuyển thụ lý).
5. Điều hành quy trình tố tụng (chuẩn bị xét xử, hòa giải, đối chất, thẩm định định giá, ra bản án/quyết định).
6. Tính án phí, tạm ứng án phí NQ 326/2016/UBTVQH14 và thời hạn tố tụng 24h trọn vẹn.

${systemActions}

QUY TẮC PHẢN HỒI:
- Tự xưng là "Trợ lý thẩm phán". Tuyệt đối không dùng các danh xưng khác.
- Ngôn phong trang trọng, chuẩn mực tư pháp, ngắn gọn, súc tích.
- Khi Thẩm phán hỏi về công việc, tiến độ hoặc tra cứu, luôn viện dẫn điều luật chuẩn xác và chèn ngay nút bấm [ACTION:...] để Thẩm phán thực hiện ngay.`;
    }

    var reply = callGeminiByTier("COPILOT", systemPrompt, userMessage, contextData.attachments || [], 4096, false);
    return { success: true, reply: reply };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 7. NHIỆM VỤ 5: CẤY MÃ PLACEHOLDER VÀO PHÔI MẪU WORD (TẦNG 2 - COPILOT)
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

    var systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN CHUYÊN VIÊN THIẾT KẾ BIỂU MẪU TỐ TỤNG TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Đọc toàn văn bản gốc và tìm các thông tin nhân thân cụ thể (tên người, năm sinh, địa chỉ, số CCCD, số tiền, ngày tháng, số thụ lý) để thay thế bằng mã {Placeholder} chuẩn:
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
    return { success: false, error: "Lỗi tạo phôi mẫu: " + e.message };
  } finally {
    if (tempDocFile && tempDocFile.id && targetFileId) {
      try { DriveApp.getFileById(tempDocFile.id).setTrashed(true); } catch (ex) {}
    }
  }
}

// =========================================================================
// 8. NHIỆM VỤ 6: SOẠN TOÀN VĂN BIỂU MẪU RỖNG TỪ ĐẦU (TẦNG 3 - REASONING)
// =========================================================================

function backend_AutoGenerateEmptyTemplate(templateId, templateName) {
  try {
    var placeholderDefs = (typeof backend_GetAllPlaceholders === 'function') ? backend_GetAllPlaceholders() : [];
    var listPlaceholdersText = placeholderDefs.map(function(p) { return `- ${p.name}: ${p.description}`; }).join("\n");

    var systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN SOẠN THẢO VĂN BẢN TỐ TỤNG TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Soạn thảo toàn văn nội dung pháp lý cho biểu mẫu tố tụng: "${templateName}".

YÊU CẦU BẮT BUỘC:
1. KHÔNG VIẾT Quốc hiệu, Tiêu ngữ, Tên Tòa án và phần Chữ ký vì hệ thống đã in cố định.
2. Cung cấp Tiêu đề (in hoa), Ký hiệu văn bản rút gọn và mảng các đoạn văn bản chuẩn mực theo Nghị quyết 01/2017/NQ-HĐTP.
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

    // Gọi Tầng 3 (REASONING - gemini-3.6-flash, gemini-3.5-flash) cho soạn thảo văn bản
    var rawResult = callGeminiByTier("REASONING", systemPrompt, "Hãy soạn thảo nội dung biểu mẫu tố tụng: " + templateName, [], 8192, true);
    var parsedAI = extractSafeJSON(rawResult);

    if (!parsedAI.paragraphs || !Array.isArray(parsedAI.paragraphs)) {
      throw new Error("Phản hồi của AI không đúng định dạng mảng đoạn văn bản.");
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