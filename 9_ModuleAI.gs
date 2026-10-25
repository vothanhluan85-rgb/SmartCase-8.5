/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.5 - MASTER AI ENGINE & COPILOT CORE (PRODUCTION)
 * TỆP: 9_ModuleAI.gs - ĐỘNG CƠ BÓC TÁCH NGUYÊN LIỆU, COPILOT & OCR TỐ TỤNG KHẮT KHE
 * -------------------------------------------------------------------------
 * - BẢN HOÀN THIỆN 100%: NGUYÊN VẸN TOÀN BỘ HÀM, KHÔNG RÚT GỌN.
 * - BỘ QUY TẮC PHÁP LÝ KHẮT KHE:
 *   1. TUYỆT ĐỐI CẤM lấy Thẩm phán, Thư ký, Viện kiểm sát vào danh sách đương sự.
 *   2. BẮT BUỘC TÁCH ĐƯƠNG SỰ DÍNH CHÙM (Vợ chồng, đồng nguyên đơn/bị đơn phải tách thành từng người riêng biệt).
 *   3. BÓC TÁCH ĐẠI DIỆN PHÁP LUẬT (PL), ĐẠI DIỆN ỦY QUYỀN (UQ), LUẬT SƯ (LS) gắn vào đương sự.
 *   4. PHÂN BIỆT RÕ TỔ CHỨC (Không có năm sinh, có người đại diện) VÀ CÁ NHÂN (Có năm sinh 4 số).
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

      if (att.textContent && String(att.textContent).trim().length > 0) {
        parts.push({ "text": `\n[TỆP VĂN BẢN ${idx + 1}: ${fileName}]:\n${att.textContent}\n` });
      }
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
    var systemPrompt = `BẠN LÀ CHUYÊN GIA THẨM ĐỊNH HỒ SƠ TỐ TỤNG TÒA ÁN NHÂN DÂN.
NHIỆM VỤ: Trích xuất chính xác thông tin vụ án từ văn bản/ảnh chụp bìa hồ sơ/đơn khởi kiện.

QUY TẮC KHẮT KHE BẮT BUỘC:
1. ĐIỀU CẤM KỴ: TUYỆT ĐỐI KHÔNG lấy Thẩm phán, Thư ký Tòa án, Kiểm sát viên, Viện kiểm sát, Công an vào danh sách đương sự.
2. TÁCH RỜI ĐƯƠNG SỰ DÍNH CHÙM: Nếu có nhiều người (ví dụ vợ chồng, đồng khởi kiện/bị kiện) ➔ BẮT BUỘC tách thành từng người riêng biệt, không được gộp chung một chuỗi.
3. PHÂN BIỆT TỔ CHỨC VÀ CÁ NHÂN:
   - Nếu là Ngân hàng, Doanh nghiệp, UBND, Tổ chức: xungHo = "Tổ chức", namSinh = "". Tìm người đại diện (Giám đốc, người theo ủy quyền) đưa vào "daiDien".
   - Nếu là Cá nhân: xungHo = "Ông" hoặc "Bà", namSinh = 4 chữ số (VD: 1977).
4. SĐT & CCCD: CCCD có 12 số (CMND 9 số). SĐT có 10 số bắt đầu bằng 0.

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON:
{
  "soTL": "Số thụ lý hoặc số đơn (VD: bìa ghi 34/2025/TLST-DS thì lấy '34')",
  "ngayTL": "Ngày thụ lý thực tế trên con dấu (YYYY-MM-DD). Nếu không có con dấu thụ lý thì để trống rỗng '', TUYỆT ĐỐI KHÔNG tự điền ngày hiện tại",
  "quanHe": "Quan hệ pháp luật tranh chấp cụ thể (VD: Tranh chấp hợp đồng tín dụng)",
  "nd_Info": { 
    "hoTen": "Tên nguyên đơn/khởi kiện (Nếu là ngân hàng: ghi tên ngân hàng, không dính tên người đại diện)", 
    "xungHo": "Tổ chức hoặc Ông/Bà", 
    "namSinh": "Năm sinh nếu là cá nhân, để trống nếu là tổ chức", 
    "diaChi": "Địa chỉ trụ sở hoặc nơi cư trú", 
    "sdt": "Số điện thoại", 
    "cccd": "Số CCCD",
    "daiDien": "Thông tin đại diện theo pháp luật hoặc theo ủy quyền nếu có"
  },
  "bd_Info": { 
    "hoTen": "Tên bị đơn thứ nhất (TUYỆT ĐỐI KHÔNG GỘP 2 VỢ CHỒNG VÀO ĐÂY)", 
    "xungHo": "Ông/Bà/Tổ chức", 
    "namSinh": "Năm sinh (4 số)", 
    "diaChi": "Địa chỉ", 
    "sdt": "", 
    "cccd": "",
    "daiDien": ""
  },
  "tomTat": "Tóm tắt yêu cầu khởi kiện"
}`;

    var rawResult = callFastGeminiAI(systemPrompt, "TRÍCH XUẤT THÔNG TIN THỤ LÝ TỪ TÀI LIỆU SCAN:", att, 4096, false);
    var parsed = extractSafeJSON(rawResult);
    return { success: true, data: parsed };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// 5. CỔNG BÓC TÁCH NGUYÊN LIỆU VỤ ÁN & ĐỐI SOÁT ĐƯƠNG SỰ CHI TIẾT
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
  
  var partiesContext = existingParties.map(function(p) {
    var ns = (p.namSinh && p.namSinh !== "19xx" && p.namSinh !== "---") ? p.namSinh : "CHƯA CÓ";
    var dc = (p.diaChi && !p.diaChi.toLowerCase().includes("nhập địa chỉ") && p.diaChi !== "---") ? p.diaChi : "CHƯA CÓ";
    var dt = (p.sdt && !p.sdt.toLowerCase().includes("chưa có") && p.sdt !== "---") ? p.sdt : "CHƯA CÓ";
    var cd = (p.cccd && !p.cccd.toLowerCase().includes("chưa có") && p.cccd !== "---") ? p.cccd : "CHƯA CÓ";
    var rep = (p.daiDien && p.daiDien !== "[]" && p.daiDien !== "") ? p.daiDien : "CHƯA CÓ";
    
    return `- ${p.tuCach}: [${p.xungHo || 'Ông/Bà'}] ${p.hoTen} (Năm sinh: ${ns}, Địa chỉ: ${dc}, SĐT: ${dt}, CCCD: ${cd}, Đại diện: ${rep})`;
  }).join("\n");

  var systemPrompt = `BẠN LÀ CHUYÊN GIA THẨM ĐỊNH NGUYÊN LIỆU HỒ SƠ TÒA ÁN NHÂN DÂN.
NHIỆM VỤ: Đọc toàn văn tài liệu đính kèm, đối soát với danh sách đương sự hiện có, trích xuất chính xác 100% đương sự, người đại diện và các điều khoản pháp lý.

=======================================================
BỘ QUY TẮC PHÁP LÝ BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
=======================================================

1. ĐIỀU CẤM KỴ - LOẠI TRỪ NGƯỜI TIẾN HÀNH TỐ TỤNG & CÁN BỘ CÔNG QUYỀN:
   - TUYỆT ĐỐI KHÔNG ĐƯỢC lấy Thẩm phán, Thư ký Tòa án, Kiểm sát viên, Hội thẩm nhân dân, Viện kiểm sát, Công an, Giám định viên vào danh sách đương sự!
   - Kể cả tên Thẩm phán (như Võ Thành Luân) có ký tên đóng dấu ở cuối văn bản thì đó là Người tiến hành tố tụng, CẤM đưa vào đương sự!

2. BẮT BUỘC TÁCH ĐƯƠNG SỰ BỊ "DÍNH CHÙM":
   - Nếu trong tài liệu có đoạn ghi gộp 2 vợ chồng hoặc nhiều người (Ví dụ: "Ông Nguyễn Viết Thịnh, sinh năm 1977; bà Nguyễn Thị Tuyết Hạnh, sinh năm 1979... Là bị đơn") ➔ BẮT BUỘC TÁCH THÀNH 2 ĐỐI TƯỢNG ĐƯƠNG SỰ RIÊNG BIỆT:
     + Người 1: Ông Nguyễn Viết Thịnh, năm sinh 1977.
     + Người 2: Bà Nguyễn Thị Tuyết Hạnh, năm sinh 1979.
   - TUYỆT ĐỐI KHÔNG ĐƯỢC gộp thành chuỗi "Nguyễn Viết Thịnh Nguyễn Thị Tuyết Hạnh"!

3. TỔ CHỨC / PHÁP NHÂN VS CÁ NHÂN:
   - Nếu đương sự là Ngân hàng, Công ty, Doanh nghiệp (Ví dụ: "Ngân hàng Lộc Phát Việt Nam" hoặc "LPBank"):
     + xungHo: BẮT BUỘC là "Tổ chức".
     + namSinh: Để chuỗi rỗng "" (Tổ chức không có năm sinh).
     + diaChi: Ghi rõ địa chỉ trụ sở (VD: "Số 210, đường Trần Quang Khải, phường Tràng Tiền, quận Hoàn Kiếm, Thành phố Hà Nội").
     + Tìm Người đại diện theo pháp luật / theo ủy quyền (như Giám đốc chi nhánh theo Quyết định ủy quyền...) đưa vào mảng "daiDien" của Tổ chức đó.
   - Nếu đương sự là Cá nhân: xungHo là "Ông" hoặc "Bà", namSinh là 4 chữ số.

4. BÓC TÁCH NGƯỜI ĐẠI DIỆN (THEO PHÁP LUẬT, ỦY QUYỀN, LUẬT SƯ):
   - Người đại diện KHÔNG PHẢI là đương sự độc lập! Bắt buộc đưa vào mảng "daiDien" của đương sự mà họ đại diện.
   - Cấu trúc đại diện:
     + type: "pl" (đại diện pháp luật) / "uq" (đại diện ủy quyền) / "ls" (luật sư)
     + tuCach: "Người đại diện theo pháp luật" / "Người đại diện theo ủy quyền" / "Luật sư bảo vệ quyền và lợi ích hợp pháp"
     + hoTen, xungHo, namSinh, diaChi, sdt, chucVu, vanBan (số và ngày ký văn bản ủy quyền).

5. ĐỐI SOÁT VỚI DANH SÁCH ĐƯƠNG SỰ ĐÃ CÓ:
   - Dưới đây là danh sách đương sự hiện có trong hồ sơ vụ án:
${partiesContext || "Chưa có đương sự nào"}
   - Nếu danh sách trên đang có dòng bị dính chùm (VD: "Nguyễn Viết Thịnh Nguyễn Thị Tuyết Hạnh") hoặc đang thiếu Năm sinh, Địa chỉ, SĐT, CCCD ➔ BẮT BUỘC đưa từng người đã được làm sạch vào mảng "updatedExistingParties"!
   - Nếu có đương sự mới chưa từng xuất hiện trong danh sách trên ➔ Đưa vào mảng "newParties".

6. BẢO TOÀN NGUYÊN VĂN NỘI DUNG VỤ ÁN & SỐ LIỆU TÀI CHÍNH:
   - Trích xuất toàn văn danh mục tài liệu nộp kèm đơn vào "{Tài liệu kèm theo đơn khởi kiện}".
   - Trích xuất đầy đủ số tiền nợ gốc, tiền lãi tạm tính, số hợp đồng tín dụng, hợp đồng thế chấp, số GCNQSDĐ... vào các trường tương ứng.

BẮT BUỘC TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON THEO CẤU TRÚC SAU:
{
  "isMismatch": false,
  "mismatchReason": "",
  "updatedExistingParties": [
    {
      "hoTen": "Tên từng cá nhân/tổ chức (ĐÃ TÁCH RỜI RIÊNG BIỆT)",
      "xungHo": "Ông / Bà / Tổ chức",
      "namSinh": "1977 (đối với cá nhân) hoặc rỗng '' (đối với tổ chức)",
      "diaChi": "Địa chỉ đầy đủ tìm thấy",
      "sdt": "",
      "cccd": "",
      "tuCach": "Nguyên đơn / Bị đơn / Người liên quan",
      "daiDien": [
        {
          "type": "uq",
          "tuCach": "Người đại diện theo ủy quyền",
          "xungHo": "Ông",
          "hoTen": "Họ và tên người đại diện",
          "namSinh": "19xx",
          "diaChi": "Địa chỉ...",
          "sdt": "",
          "chucVu": "Giám đốc chi nhánh...",
          "vanBan": "Quyết định ủy quyền số... ngày..."
        }
      ]
    }
  ],
  "newParties": [
    {
      "hoTen": "Tên người mới nếu có",
      "xungHo": "Ông/Bà/Tổ chức",
      "namSinh": "19xx",
      "diaChi": "Địa chỉ...",
      "sdt": "",
      "cccd": "",
      "tuCach": "Người có quyền lợi, nghĩa vụ liên quan",
      "daiDien": []
    }
  ],
  "extracted": {
    "{Lời khai đương sự}": "Toàn văn yêu cầu khởi kiện và lời trình bày...",
    "{Nội dung vụ án}": "Toàn văn nội dung vụ án...",
    "{Hợp đồng tín dụng}": "Hợp đồng tín dụng số... ngày...",
    "{Dư nợ tín dụng}": "Số tiền nợ gốc, lãi...",
    "{Tài sản tranh chấp}": "Chi tiết tài sản thế chấp...",
    "{Tài liệu kèm theo đơn khởi kiện}": "Toàn văn danh mục các tài liệu chứng cứ kèm theo đơn..."
  }
}`;

  var rawResult = callFastGeminiAI(systemPrompt, "TIẾN HÀNH ĐỐI SOÁT ĐƯƠNG SỰ KHẮT KHE VÀ TRÍCH XUẤT NGUYÊN LIỆU:", attachments, 4096, false);
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
NHIỆM VỤ: Quét văn bản và trích xuất toàn bộ danh sách đương sự thành JSON:

QUY TẮC BẮT BUỘC:
1. ĐIỀU CẤM KỴ: TUYỆT ĐỐI KHÔNG đưa Thẩm phán, Thư ký Tòa án, Kiểm sát viên, Cán bộ Công an vào danh sách đương sự.
2. TÁCH RỜI MỖI NGƯỜI: Tuyệt đối không gộp 2 vợ chồng hay nhiều người vào chung một tên.
3. TỔ CHỨC: Doanh nghiệp, Ngân hàng thì xungHo = "Tổ chức", namSinh = "". Người đại diện đưa vào "daiDien".
4. SĐT & CCCD: Dãy 12 số LUÔN LÀ CCCD. Dãy 10 số bắt đầu bằng 0 LUÔN LÀ SĐT.

BẮT BUỘC TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON THUẦN TÚY:
{
  "parties": [
    {
      "tuCach": "Nguyên đơn / Bị đơn / Người có quyền lợi, nghĩa vụ liên quan / Người làm chứng",
      "xungHo": "Ông / Bà / Tổ chức",
      "hoTen": "Họ và tên đầy đủ từng cá nhân hoặc tên tổ chức",
      "namSinh": "19xx (để trống nếu là tổ chức)",
      "diaChi": "Địa chỉ đầy đủ",
      "sdt": "",
      "cccd": "",
      "daiDien": []
    }
  ]
}`;

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
      systemPrompt = `BẠN LÀ TRỢ LÝ THẨM PHÁN 8.5 HỆ THỐNG TÒA ÁN NHÂN DÂN.
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
// 8. WIZARD AI TẠO PHÔI MẪU & CẤY PLACEHOLDER (TỪ FILE WORD UPLOAD)
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

// =========================================================================
// 9. AI TỰ ĐỘNG SOẠN THẢO BIỂU MẪU RỖNG TỪ TÊN GỌI (NO-UPLOAD MODE)
// =========================================================================

function backend_AutoGenerateEmptyTemplate(templateId, templateName) {
  try {
    var placeholderDefs = (typeof backend_GetAllPlaceholders === 'function') ? backend_GetAllPlaceholders() : [];
    var listPlaceholdersText = placeholderDefs.map(p => `- ${p.name}: ${p.description}`).join("\n");

    var systemPrompt = `BẠN LÀ CHUYÊN VIÊN SOẠN THẢO VĂN BẢN TÒA ÁN NHÂN DÂN.
Nhiệm vụ: Soạn nội dung pháp lý cho biểu mẫu mang tên: "${templateName}".

YÊU CẦU NGHIỆP VỤ BẮT BUỘC:
1. KHÔNG VIẾT Quốc hiệu, Tên Tòa án, Số ký hiệu, hay phần Chữ ký Thẩm phán vì hệ thống sẽ tự động in cứng bằng cấu trúc bảng chuẩn mực.
2. Bạn CHỈ cung cấp Tiêu đề văn bản (in hoa), Ký hiệu rút gọn và Mảng các đoạn văn bản nội dung chính (từ đoạn "Kính gửi..." hoặc phần mở đầu căn cứ pháp luật).
3. Tuyệt đối tuân thủ thể thức văn bản tố tụng theo các Nghị quyết của Hội đồng Thẩm phán TANDTC (Nghị quyết số 01/2017/NQ-HĐTP, 02/2017/NQ-HĐTP...).
4. Lời văn trang trọng, chuẩn mực pháp lý, đúng ngữ pháp tiếng Việt.
5. Tự động lồng ghép chính xác các mã {Placeholder} chuẩn sau đây vào văn bản:
${listPlaceholdersText}

TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU:
{
  "symbol": "Ký hiệu văn bản (Ví dụ: TB-TLVA, QĐXXST-DS, GTT-DS, QĐCNTT-DS...)",
  "title": "TIÊU ĐỀ VĂN BẢN IN HOA (Ví dụ: THÔNG BÁO\\nVỀ VIỆC THỤ LÝ VỤ ÁN)",
  "paragraphs": [
    { "text": "Kính gửi: {Đương sự thông báo}", "bold": false, "italic": false, "align": "left" },
    { "text": "{Ngày thụ lý}, Tòa án nhân dân {tòa án} đã thụ lý vụ án {loại án} sơ thẩm...", "bold": false, "italic": false, "align": "justify" }
  ]
}`;

    var rawResult = callFastGeminiAI(systemPrompt, "Hãy soạn thảo nội dung biểu mẫu: " + templateName, [], 8192, true);
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

    var pL1 = tdLeft.appendParagraph("TÒA ÁN NHÂN DÂN\nKHU VỰC 2 - LÂM ĐỒNG").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pL1.editAsText().setFontFamily('Times New Roman').setFontSize(12).setBold(true);
    tdLeft.appendParagraph("───────────────").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    var pL2 = tdLeft.appendParagraph("Số: {Số văn bản}/" + new Date().getFullYear() + "/" + (parsedAI.symbol || "TB-TA")).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pL2.editAsText().setFontFamily('Times New Roman').setFontSize(13).setBold(false);

    var pR1 = tdRight.appendParagraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pR1.editAsText().setFontFamily('Times New Roman').setFontSize(12).setBold(true);
    var pR2 = tdRight.appendParagraph("Độc lập - Tự do - Hạnh phúc").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pR2.editAsText().setFontFamily('Times New Roman').setFontSize(14).setBold(true);
    tdRight.appendParagraph("────────────────────").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    var pR3 = tdRight.appendParagraph("Lâm Đồng, {ngày ban hành}").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
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

  } catch(e) {
    return { success: false, error: "Lỗi sinh nội dung biểu mẫu: " + e.message };
  }
}
