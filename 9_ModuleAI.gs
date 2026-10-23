/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER AI ENGINE & COPILOT CORE (PRODUCTION)
 * TỆP: 9_ModuleAI.gs - ĐỘNG CƠ BÓC TÁCH NGUYÊN LIỆU, COPILOT & AI TẠO MẪU TOÀN NĂNG
 * -------------------------------------------------------------------------
 * - ĐÃ NÂNG CẤP TOÀN DIỆN:
 *   + Nâng cấp trích xuất ngày thụ lý thực tế trên bìa hồ sơ/đơn (ngayTL), không lấy ngày hiện tại.
 *   + Thiết lập quy chuẩn nhận diện bất biến: CCCD (12 chữ số) vs SĐT (10 chữ số, bắt đầu bằng 0).
 *   + Bảo toàn nguyên vẹn 100% dữ liệu số liệu: tiền nợ, diện tích, thửa đất, ngày sinh con chung.
 *   + Phân định chuẩn xác 2 luồng đương sự: Lấp đầy đương sự cũ & Phát hiện đương sự mới.
 *   + Giữ nguyên danh sách model Google AI Studio và cơ chế gọi fallback chống gián đoạn.
 * =========================================================================
 */

var FAST_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.7-flash"
];

var PRO_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3.1-pro",
  "gemini-pro-latest"
];

// =========================================================================
// 1. BỘ TRÍCH XUẤT JSON AN TOÀN (JSON RECOVERY ENGINE)
// =========================================================================

function extractSafeJSON(text) {
  if (!text) return {};
  var str = String(text).trim();

  // Loại bỏ Markdown code block ```json ... ```
  str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  var start = str.indexOf('{');
  var end = str.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end >= start) {
    var jsonStr = str.substring(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      try {
        var sanitized = jsonStr.replace(/[\u0000-\u001F]+/g, " ");
        return JSON.parse(sanitized);
      } catch (ex) {}
    }
  }

  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("Lỗi parse JSON từ phản hồi AI: " + e.message + "\nNội dung thô: " + str);
    return {};
  }
}

// =========================================================================
// 2. HỖ TRỢ ĐỌC VĂN BẢN TỪ FILE NHỊ PHÂN / DRIVE
// =========================================================================

function extractTextFromFile(base64Data, mimeType, fileName) {
  var tempDocId = null;
  try {
    var decodedData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedData, mimeType || MimeType.MICROSOFT_WORD, fileName || "temp_file.docx");
    
    // Tạo tệp Google Docs tạm thời để đọc Body text
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
      try { Drive.Files.remove(tempDocId); } catch(ex) {}
    }
  }
}

// =========================================================================
// 3. ĐỘNG CƠ GỌI GEMINI (GIỮ NGUYÊN DANH SÁCH MODEL ĐÃ KIỂM NGHIỆM)
// =========================================================================

function callFastGeminiAI(systemPrompt, userPrompt, attachments, maxTokens, preferProModel) {
  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  var apiKey = config["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("Chưa cấu hình GEMINI_API_KEY trong phần Cài đặt!");

  var parts = [];

  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    attachments.forEach(function(att, idx) {
      var fileName = att.fileName || att.name || ("Tài_liệu_" + (idx + 1));
      var mime = att.mimeType || "";
      var fLower = fileName.toLowerCase();

      // 1. Text thô (Google Docs)
      if (att.textContent && String(att.textContent).trim().length > 0) {
        parts.push({ "text": `\n[TỆP VĂN BẢN ${idx + 1}: ${fileName}]:\n${att.textContent}\n` });
      }
      // 2. Ảnh chụp hoặc PDF (Multimodal inlineData)
      else if (mime.includes("pdf") || fLower.endsWith('.pdf') || mime.includes("image") || mime.startsWith("image/")) {
        var base64Clean = att.base64Data || att.base64 || "";
        if (base64Clean.includes(",")) base64Clean = base64Clean.split(",")[1];
        
        parts.push({
          "inlineData": {
            "mimeType": (mime.includes("pdf") || fLower.endsWith('.pdf')) ? "application/pdf" : (mime || "image/jpeg"),
            "data": base64Clean
          }
        });
      }
      // 3. File Word (.docx / .doc)
      else if (fLower.endsWith('.docx') || fLower.endsWith('.doc') || mime.includes('word') || mime.includes('officedocument')) {
        var base64Word = att.base64Data || att.base64 || "";
        if (base64Word.includes(",")) base64Word = base64Word.split(",")[1];
        var docxText = extractTextFromFile(base64Word, mime, fileName);
        parts.push({ "text": `\n[NỘI DUNG TỆP WORD ${idx + 1}: ${fileName}]:\n${docxText}\n` });
      }
    });
  }

  parts.push({ "text": userPrompt });

  var payload = {
    "system_instruction": { "parts": [{ "text": systemPrompt }] },
    "contents": [{ "role": "user", "parts": parts }],
    "generationConfig": {
      "temperature": 0.0,
      "maxOutputTokens": maxTokens || 4096
    }
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  var modelsToTry = preferProModel ? PRO_MODELS.concat(FAST_MODELS) : FAST_MODELS.concat(PRO_MODELS);
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

  throw new Error("Lỗi kết nối AI Studio: " + lastError);
}

// =========================================================================
// 4. QUÉT ĐƠN KHỞI KIỆN / BÌA HỒ SƠ ĐỂ LẤY THÔNG TIN THỤ LÝ MỚI
// =========================================================================

function ai_ParseDocumentForCaseInfo(fileName, mimeType, base64Data) {
  try {
    var att = [{ fileName: fileName, mimeType: mimeType, base64Data: base64Data }];
    var systemPrompt = `BẠN LÀ CHUYÊN GIA BÓC TÁCH HỒ SƠ VỤ ÁN / ĐƠN KHỞI KIỆN TÒA ÁN NHÂN DÂN.
NHIỆM VỤ: Đọc toàn văn tài liệu/ảnh chụp bìa hồ sơ/đơn khởi kiện và trích xuất chính xác các thông tin tố tụng sau:

{
  "soTL": "Chỉ lấy phần số của Số thụ lý hoặc Số đơn (Ví dụ: bìa ghi 45/2026/TLST-DS thì chỉ lấy '45')",
  "ngayTL": "Ngày tháng năm thụ lý hoặc ngày nhận đơn ghi trên bìa hồ sơ/văn bản (Định dạng bắt buộc: YYYY-MM-DD. Ví dụ: 2026-08-29. Tìm con dấu thụ lý hoặc dòng chữ ghi ngày tháng năm thụ lý thực tế trên bìa hồ sơ; TUYỆT ĐỐI không lấy ngày hiện tại)",
  "quanHe": "Quan hệ pháp luật tranh chấp hoặc tội danh cụ thể (Ví dụ: Tranh chấp hợp đồng chuyển nhượng quyền sử dụng đất)",
  "nd_Info": { 
    "hoTen": "Họ và tên nguyên đơn/người khởi kiện/người yêu cầu 1", 
    "xungHo": "Ông/Bà/Tổ chức", 
    "namSinh": "Năm sinh (4 chữ số)", 
    "diaChi": "Địa chỉ đầy đủ", 
    "sdt": "Số điện thoại liên lạc", 
    "cccd": "Số Căn cước công dân / CMND" 
  },
  "bd_Info": { 
    "hoTen": "Họ và tên bị đơn/người bị kiện/người yêu cầu 2", 
    "xungHo": "Ông/Bà/Tổ chức", 
    "namSinh": "Năm sinh (4 chữ số)", 
    "diaChi": "Địa chỉ đầy đủ", 
    "sdt": "Số điện thoại liên lạc", 
    "cccd": "Số Căn cước công dân / CMND" 
  },
  "tomTat": "Tóm tắt ngắn gọn nội dung yêu cầu khởi kiện"
}

QUY TẮC BẮT BUỘC ĐỂ TRÁNH NHẦM LẪN SỐ ĐIỆN THOẠI VÀ CĂN CƯỚC (CCCD):
1. Căn cước công dân (CCCD) của Việt Nam CÓ ĐÚNG 12 CHỮ SỐ (hoặc CMND cũ có 9 chữ số). Dãy số nào có 12 số BẮT BUỘC đưa vào trường "cccd".
2. Số điện thoại (SĐT) của Việt Nam CÓ 10 CHỮ SỐ BẮT ĐẦU BẰNG SỐ 0 (hoặc +84). TUYỆT ĐỐI KHÔNG ĐƯỢC đưa số 12 chữ số vào trường "sdt".
3. TÌM KỸ NGÀY THỤ LÝ: Tìm các con dấu 'ĐÃ THỤ LÝ NGÀY... THÁNG... NĂM...' hoặc dòng chữ 'Thụ lý ngày...' trên bìa hồ sơ để trích xuất chính xác vào 'ngayTL'.

BẮT BUỘC TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON THUẦN TÚY, KHÔNG KÈM LỜI DẪN.`;

    var rawResult = callFastGeminiAI(systemPrompt, "TRÍCH XUẤT THÔNG TIN THỤ LÝ TỪ TÀI LIỆU SCAN/ẢNH CHỤP:", att, 4096, false);
    var parsed = extractSafeJSON(rawResult);
    return { success: true, data: parsed };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 5. CỔNG BÓC TÁCH NGUYÊN LIỆU TỐ TỤNG & TÀI LIỆU CHỨNG CỨ CHI TIẾT
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
            cccd: String(dataDS[i][7] || "").replace(/^'/, "").trim()
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
  var partiesContext = existingParties.map(function(p) {
    return `- ${p.tuCach}: ${p.xungHo} ${p.hoTen} (Năm sinh: ${p.namSinh || 'CHƯA CÓ'}, Địa chỉ: ${p.diaChi || 'CHƯA CÓ'}, SĐT: ${p.sdt || 'CHƯA CÓ'}, CCCD: ${p.cccd || 'CHƯA CÓ'})`;
  }).join("\n");

  var systemPrompt = `BẠN LÀ CHUYÊN GIA TRÍCH XUẤT VÀ BÓC TÁCH NGUYÊN LIỆU HỒ SƠ TÒA ÁN NHÂN DÂN.
NHIỆM VỤ: Đọc toàn văn tài liệu đính kèm, trích xuất chính xác, ĐẦY ĐỦ CHI TIẾT TỪNG CON SỐ, MỐC THỜI GIAN, SỐ TIỀN, TÀI SẢN, NGUYÊN VĂN LỜI KHAI THEO NGÔI THỨ BA.

NGUYÊN TẮC BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. CẤM TỰ Ý TÓM TẮT, KHÔNG RÚT GỌN, KHÔNG DÙNG CÂU CHUNG CHUNG như "các bên tự thỏa thuận", "có tranh chấp".
2. BẢO TOÀN 100% CÁC SỐ LIỆU: Số tiền nợ gốc, tiền lãi, số thửa đất, tờ bản đồ, diện tích m2, số GCNQSDĐ, ngày tháng năm sinh của con chung đến từng ngày/tháng/năm.
3. PHÂN BIỆT RẠCH RÒI CCCD VÀ SĐT: CCCD luôn có đúng 12 chữ số (hoặc CMND 9 số). Số điện thoại luôn có 10 chữ số bắt đầu bằng số 0. TUYỆT ĐỐI không nhầm lẫn giữa hai trường này.
4. ĐỐI VỚI LỜI KHAI: Trích lục chi tiết toàn bộ lời khai theo diễn biến thời gian và nội dung yêu cầu cụ thể (dùng danh xưng ông/bà).
5. ĐỐI CHIẾU ĐƯƠNG SỰ CSDL:
   - Nếu đương sự ĐÃ CÓ trong CSDL mà tài liệu có Năm sinh, Địa chỉ, SĐT, CCCD ➔ BẮT BUỘC đưa vào mảng "updatedExistingParties" để lấp đầy thông tin thiếu.
   - Nếu phát hiện người MỚI (Người liên quan, Người làm chứng...) chưa có trong CSDL ➔ Đưa vào mảng "newParties".

HỒ SƠ VỤ ÁN ĐANG MỞ:
- Số thụ lý: "${soTL}" | Loại án: ${loaiAn} | Tranh chấp/Yêu cầu: ${quanHe}
- Danh sách đương sự hiện có trong CSDL:
${partiesContext || "Chưa có"}

BẮT BUỘC TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON THEO CẤU TRÚC:
{
  "isMismatch": false,
  "mismatchReason": "",
  "updatedExistingParties": [
    {
      "hoTen": "Tên đúng như trong CSDL",
      "xungHo": "Ông/Bà",
      "namSinh": "1980",
      "diaChi": "Địa chỉ đầy đủ tìm thấy",
      "sdt": "Số điện thoại (10 số)",
      "cccd": "Số CCCD (12 số)",
      "tuCach": "Tư cách hiện có"
    }
  ],
  "newParties": [
    {
      "hoTen": "Tên người mới xuất hiện",
      "xungHo": "Ông/Bà",
      "namSinh": "1985",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "Số điện thoại (10 số)",
      "cccd": "Số CCCD (12 số)",
      "tuCach": "Người có quyền lợi, nghĩa vụ liên quan hoặc Người làm chứng"
    }
  ],
  "extracted": {
    "{Lời khai đương sự}": "Toàn văn chi tiết lời khai tất cả các bên theo ngôi thứ ba...",
    "{Lời khai Nguyên đơn}": "Toàn văn chi tiết lời khai của Nguyên đơn/Người khởi kiện/Người yêu cầu 1...",
    "{Lời khai Bị đơn}": "Toàn văn chi tiết lời khai của Bị đơn/Người bị kiện/Người yêu cầu 2...",
    "{Lời khai Người có quyền lợi, nghĩa vụ liên quan}": "Chi tiết lời khai người liên quan...",
    "{Lời khai người làm chứng}": "Chi tiết lời khai người làm chứng...",
    "{Nội dung vụ án}": "Toàn văn diễn biến sự việc chi tiết phục vụ Bản án...",
    "{Nội dung thỏa thuận}": "Toàn văn toàn bộ các điều khoản thỏa thuận hòa giải...",
    "{Quan hệ hôn nhân}": "Nội dung thỏa thuận về quan hệ hôn nhân/thuận tình ly hôn...",
    "{Con chung}": "Danh sách con chung (họ tên đầy đủ, ngày tháng năm sinh chính xác từng người)...",
    "{Cấp dưỡng nuôi con}": "Thỏa thuận mức cấp dưỡng bằng tiền cụ thể và phương thức thực hiện...",
    "{Thỏa thuận con chung}": "Trọn gói 3 vế: [Danh sách con] + [Ai trực tiếp nuôi dưỡng] + [Cấp dưỡng]...",
    "{Tài sản chung}": "Chi tiết thỏa thuận tài sản (số thửa, tờ bản đồ, diện tích, giá trị, phân chia cụ thể)...",
    "{Nợ chung}": "Chi tiết thỏa thuận về các khoản nợ (chủ nợ, số tiền gốc, tiền lãi, ai có nghĩa vụ trả)...",
    "{Tài sản tranh chấp}": "Chi tiết tài sản đang tranh chấp...",
    "{Dư nợ tín dụng}": "Chi tiết hợp đồng tín dụng, nợ gốc, nợ lãi trong hạn, quá hạn...",
    "{Tài liệu kèm theo đơn khởi kiện}": "Liệt kê chi tiết từng tài liệu, chứng cứ nộp kèm...",
    "{Biên lai tạm ứng án phí}": "Đoạn trích biên lai thu tiền tạm ứng án phí...",
    "{Thỏa thuận án phí}": "Thỏa thuận chịu án phí và đối trừ biên lai..."
  }
}`;

  var rawResult = callFastGeminiAI(systemPrompt, "TIẾN HÀNH TRÍCH XUẤT NGUYÊN LIỆU TOÀN VĂN CHI TIẾT:", attachments, 4096, false);
  var parsedData = extractSafeJSON(rawResult);

  var extractedFields = parsedData.extracted || parsedData;
  var cleanVariables = {};
  var cleanNarratives = {};

  for (var key in extractedFields) {
    if (key === "summary" || key === "updatedExistingParties" || key === "newParties" || key === "detectedNewParties" || key === "isMismatch" || key === "mismatchReason") continue;
    var val = String(extractedFields[key] || "").trim();
    if (val && val !== "..." && val !== "---" && val !== "undefined" && val !== "null") {
      var formattedKey = key.startsWith('{') && key.endsWith('}') ? key : `{${key}}`;
      cleanVariables[formattedKey] = val;
      if (formattedKey.toLowerCase().includes("lời khai") || formattedKey.startsWith("testimony") || formattedKey.includes("nội dung vụ án")) {
        cleanNarratives[formattedKey] = val;
      }
    }
  }

  // Tự động đồng bộ vào _case_memory.json trên Google Drive
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
    mismatchReason: parsedData.mismatchReason || "Số thụ lý hoặc đương sự không khớp với vụ án đang mở.",
    updatedExistingParties: parsedData.updatedExistingParties || [],
    newParties: parsedData.newParties || parsedData.detectedNewParties || [],
    extractedVariables: cleanVariables,
    extractedNarratives: cleanNarratives,
    sourceDocs: sourceDocNames,
    currentMemory: currentMemory
  };
}

// =========================================================================
// 6. QUÉT BÓC TÁCH DANH SÁCH ĐƯƠNG SỰ HÀNG LOẠT
// =========================================================================

function ai_ParsePartiesFromScan(base64Data, fileName, mimeType) {
  try {
    var att = [{ fileName: fileName, mimeType: mimeType, base64Data: base64Data }];
    var systemPrompt = `BẠN LÀ CHUYÊN GIA BÓC TÁCH DANH SÁCH ĐƯƠNG SỰ TÒA ÁN NHÂN DÂN.
NHIỆM VỤ: Quét văn bản và trích xuất toàn bộ danh sách đương sự thành JSON theo cấu trúc:
{
  "parties": [
    {
      "tuCach": "Nguyên đơn / Bị đơn / Người có quyền lợi, nghĩa vụ liên quan / Người làm chứng",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên đầy đủ",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "Số điện thoại (đúng 10 chữ số, bắt đầu bằng số 0)",
      "cccd": "Số Căn cước công dân (đúng 12 chữ số) hoặc CMND (9 chữ số)",
      "daiDien": "Thông tin đại diện / Luật sư nếu có"
    }
  ]
}

QUY TẮC BẮT BUỘC:
- Dãy 12 chữ số LUÔN LÀ CCCD, không được đưa vào trường sdt.
- Dãy 10 chữ số bắt đầu bằng 0 LUÔN LÀ SĐT.
BẮT BUỘC TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON THUẦN TÚY.`;

    var rawResult = callFastGeminiAI(systemPrompt, "TRÍCH XUẤT TOÀN BỘ ĐƯƠNG SỰ TỪ TÀI LIỆU:", att, 4096, false);
    var parsed = extractSafeJSON(rawResult);
    return { success: true, data: parsed.parties || [] };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 7. TRỢ LÝ COPILOT TỐ TỤNG & ĐIỀU KHIỂN HỆ THỐNG
// =========================================================================

function ai_ProcessAssistantChat(userMessage, contextData) {
  try {
    contextData = contextData || {};
    var scope = contextData.scope || "GLOBAL";
    var currentDateStr = contextData.currentDateVN || Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    var lowMsg = String(userMessage || "").toLowerCase().trim();

    if (lowMsg === "ping") return { success: true, reply: "Kết nối Google AI Studio hoạt động hoàn hảo!" };

    var systemActions = `
[DANH MỤC LỆNH ĐIỀU KHIỂN HỆ THỐNG]:
- [ACTION:appNavigate:view-list:::📋 Mở Sổ Thụ Lý]
- [ACTION:appNavigate:view-danh-sach-don:::📥 Mở Sổ Nhận Đơn]
- [ACTION:appNavigate:view-schedule:::📅 Mở Lịch Công Tác]
- [ACTION:appNavigate:view-stats:::📊 Mở Báo Cáo Thống Kê]
- [ACTION:appNavigate:view-settings:::⚙️ Mở Cài Đặt Hệ Thống]
- [ACTION:moChiTiet:ID_HOẶC_SỐ_THỤ_LÝ:::👉 Mở Hồ Sơ Án này]
- [ACTION:moChiTietDon:ID_HOẶC_SỐ_ĐƠN:::📑 Mở Chi Tiết Đơn này]
- [ACTION:openDraftingModal:ID_VỤ_ÁN:TÊN_MẪU:::📝 Soạn Văn Bản]
- [ACTION:openAnPhiModal::::💰 Mở Bảng Tính Án Phí NQ 326]
- [ACTION:moModalThemMoi::::📁 Thụ Lý Vụ Án Mới]
- [ACTION:openTaskModal:ID_VỤ_ÁN:TIÊU_ĐỀ:::⏰ Lập Lịch Làm Việc]
- [ACTION:openResolutionModal::::⚖️ Cập Nhật Kết Quả Án]
- [ACTION:sendQuickSMS:ID_ĐƠN:::💬 Hẹn Lịch & Nhắn Tin SMS]
- [ACTION:openWizardCapNhatDuongSu::::🧙 Rà Soát Đương Sự]
- [ACTION:openTemplateFolder::::📂 Mở Kho Biểu Mẫu Drive]`;

    var systemPrompt = "";

    if (scope === "CASE" && contextData.caseInfo) {
      var c = contextData.caseInfo;
      var partiesDense = (contextData.caseParties || []).map(p => {
        return `${p.tuCach}: ${p.xungHo || ''} ${p.hoTen} (SN: ${p.namSinh || '---'}, ĐC: ${p.diaChi || '---'}, SĐT: ${p.sdt || '---'}, CCCD: ${p.cccd || '---'})`;
      }).join(';\n');

      var driveMemory = {};
      if (c.folderUrl && typeof readCaseMemoryFromDrive === 'function') {
        driveMemory = readCaseMemoryFromDrive(c.folderUrl);
      }
      var onDemandVars = driveMemory.variables || contextData.variables || {};

      systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN TRONG VỤ ÁN: "${c.soTL || 'Đang mở'}".
HÔM NAY LÀ: ${currentDateStr}.

DỮ LIỆU HỒ SƠ THỰC TẾ TRONG CSDL:
- Số thụ lý: ${c.soTL} | Ngày thụ lý: ${c.ngayTL || '---'} | Hạn giải quyết: ${c.hanGQ || '---'}
- Loại án: ${c.loaiAn} | Quan hệ tranh chấp: ${c.quanHe}
- Đương sự:
${partiesDense || 'Chưa có'}

THÔNG SỐ & NGUYÊN LIỆU ĐÃ BÓC TÁCH:
${JSON.stringify(onDemandVars)}

${systemActions}`;
    } else {
      systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN 8.0 HỆ THỐNG TÒA ÁN NHÂN DÂN.
HÔM NAY LÀ: ${currentDateStr}.
${systemActions}`;
    }

    var reply = callFastGeminiAI(systemPrompt, userMessage, contextData.attachments || [], 4096, false);
    return { success: true, reply: reply };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 8. WIZARD AI TẠO PHÔI MẪU & CẤY PLACEHOLDER (BODY + HEADER + FOOTER)
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
    var listPlaceholdersText = placeholderDefs.map(p => `- ${p.name}: ${p.description}`).join("\n");

    var systemPrompt = `BẠN LÀ CHUYÊN GIA THIẾT KẾ BIỂU MẪU TỐ TỤNG TÒA ÁN NHÂN DÂN.
NHIỆM VỤ: Đọc toàn văn bản gốc và tìm các thông tin cụ thể (tên người thật, ngày tháng, số tiền, số vụ án, quan hệ tranh chấp) để thay thế bằng mã {Placeholder} chuẩn:
${listPlaceholdersText}

BẮT BUỘC TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON:
{
  "summary": "Tóm tắt loại biểu mẫu",
  "replacements": [
    { "find": "chuỗi ký tự cụ thể trong văn bản gốc", "replace": "{Mã_Placeholder_Chuẩn}" }
  ]
}`;

    var rawResult = callFastGeminiAI(systemPrompt, "VĂN BẢN GỐC CẦN CẤY PLACEHOLDER:\n" + textContent, [], 4096, false);
    var parsedAI = extractSafeJSON(rawResult);
    var mapping = parsedAI.replacements || [];
    var validPlaceholderNames = new Set(placeholderDefs.map(p => p.name.toLowerCase()));
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
          } catch(errRep) {}
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
      try { Drive.Files.remove(tempDocFile.id); } catch(eTrash) {}
    } else {
      var cleanNewName = newFileName ? newFileName.trim() : ("[AI] " + fileName.replace(/\.[^/.]+$/, ""));
      var finalDriveFile = DriveApp.getFileById(tempDocFile.id);
      finalDriveFile.setName(cleanNewName);
      finalDriveFile.moveTo(templateFolder);
      finalDocId = finalDriveFile.getId();
      finalDocName = cleanNewName;
    }

    return { success: true, id: finalDocId, name: finalDocName, replacementCount: replacementCount };
  } catch(e) {
    if (tempDocFile && tempDocFile.id) try { Drive.Files.remove(tempDocFile.id); } catch(ex) {}
    return { success: false, error: "Lỗi AI tạo mẫu: " + e.message };
  }
}