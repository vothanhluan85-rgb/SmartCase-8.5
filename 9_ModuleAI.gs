/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.5.9 - GROQ AI EDITION
 * FILE 9: MODULE TRÍ TUỆ NHÂN TẠO (AI ENGINE - OPTIMIZED)
 */

function callGroqAI(systemPrompt, userPrompt) {
  const config = getConfigFromSheet();
  const apiKey = config["GROQ_API_KEY"];
  if (!apiKey) throw new Error("⚠️ Chưa cấu hình GROQ API KEY trong phần Cài đặt!");

  // LƯU Ý QUAN TRỌNG: Groq bắt buộc phải có từ "JSON" trong system message 
  // khi sử dụng response_format: { type: "json_object" }
  const finalSystemPrompt = systemPrompt + "\nYou must output ONLY valid JSON format. Do not include any explanation or markdown formatting.";

  const payload = {
    "model": "llama-3.3-70b-versatile",
    "messages":[
      { "role": "system", "content": finalSystemPrompt },
      { "role": "user", "content": userPrompt }
    ],
    "temperature": 0.0, // Để 0.0 để đảm bảo tính chính xác tuyệt đối (ít bịa data)
    "max_tokens": 4000, 
    "response_format": { "type": "json_object" }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "headers": { "Authorization": "Bearer " + apiKey },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const response = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", options);
    const resCode = response.getResponseCode();
    const resText = response.getContentText();

    if (resCode !== 200) {
      throw new Error(`Groq API Error (${resCode}): ${resText}`);
    }
    
    const jsonResponse = JSON.parse(resText);
    const aiContent = jsonResponse.choices[0].message.content;
    
    // Đảm bảo parse được chuỗi JSON do AI trả về
    return JSON.parse(aiContent);
  } catch (e) {
    throw new Error("AI xử lý thất bại: " + e.message);
  }
}

// Hàm hỗ trợ OCR (đọc chữ từ file Document/PDF thông qua Google Drive API)
function extractTextFromFile(base64Data, mimeType, fileName) {
  const decodedData = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(decodedData, mimeType, fileName);
  const resource = { name: "TEMP_OCR_" + new Date().getTime(), mimeType: MimeType.GOOGLE_DOCS };
  const optionalArgs = { ocr: true };
  let gDocFile = null;
  
  try {
    gDocFile = Drive.Files.create(resource, blob, optionalArgs);
    const text = DocumentApp.openById(gDocFile.id).getBody().getText();
    Drive.Files.remove(gDocFile.id);
    return text;
  } catch (e) {
    if (gDocFile && gDocFile.id) Drive.Files.remove(gDocFile.id);
    throw new Error("Lỗi đọc chữ từ file: " + e.message);
  }
}

// ==========================================
// 1. QUÉT ĐƠN KHỞI KIỆN ĐỂ LẤY THÔNG TIN
// ==========================================
function ai_ParseDocumentForCaseInfo(fileName, mimeType, base64Data) {
  try {
    const text = extractTextFromFile(base64Data, mimeType, fileName);
    
    // Đã tối ưu Prompt: Bổ sung rõ từ khóa JSON
    const systemPrompt = `Bạn là Thẩm phán trích xuất dữ liệu từ Đơn khởi kiện / Đơn yêu cầu.
TUYỆT ĐỐI GIỮ NGUYÊN TIẾNG VIỆT CÓ DẤU CHO TÊN, ĐỊA CHỈ.
TRẢ VỀ ĐỊNH DẠNG JSON THEO CẤU TRÚC SAU:
{
  "soTL": "123/2026/TLST-DS",
  "quanHe": "Tranh chấp...",
  "nd_Info": {"hoTen": "Nguyễn Văn A", "namSinh": "1990", "diaChi": "...", "cccd": "..."},
  "bd_Info": {"hoTen": "Công ty TNHH B", "namSinh": "1985", "diaChi": "...", "cccd": "..."}
}
Nếu không tìm thấy thông tin, hãy để chuỗi rỗng "". Yêu cầu phải trả về đúng cấu trúc JSON trên.`;

    const userPrompt = "VĂN BẢN CẦN TRÍCH XUẤT:\n" + text;
    const aiData = callGroqAI(systemPrompt, userPrompt);
    
    return { success: true, data: aiData };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// 2. BÓC TÁCH DANH SÁCH ĐƯƠNG SỰ NHIỀU NGƯỜI
// ==========================================
function backend_UpdateCaseFromScan(idVuAn, base64Data, fileName, mimeType) {
  try {
    const text = extractTextFromFile(base64Data, mimeType, fileName);
    
    const systemPrompt = `Bạn là trợ lý Tòa án bóc tách danh sách đương sự từ văn bản.
QUAN TRỌNG: TUYỆT ĐỐI GIỮ NGUYÊN TIẾNG VIỆT CÓ DẤU CHO TÊN VÀ ĐỊA CHỈ.

QUY TẮC XƯNG HÔ:
- Nếu là cá nhân: Dùng Ông, Bà, Anh, Chị.
- Nếu là Tổ chức/Pháp nhân: Để trống trường "xung_ho" ("").

QUY TẮC ĐẠI DIỆN:
- Nếu thấy "Người đại diện... của Ông A là Ông B", đưa Ông B vào mảng 'representatives' của Ông A.
- Tên người đại diện viết chuẩn chữ cái đầu (VD: Nguyễn Văn B), KHÔNG viết in hoa toàn bộ.

TRẢ VỀ ĐỊNH DẠNG JSON SAU (Các mảng không có dữ liệu thì để rỗng []):
{
  "nguyen_don": [
    {
      "ho_ten": "...", "xung_ho": "...", "nam_sinh": "...", "dia_chi": "...", "sdt": "...", "cccd": "...",
      "representatives": [{"tu_cach": "Người đại diện", "xung_ho": "Ông", "ho_ten": "Nguyễn Văn B", "dia_chi": "...", "van_ban": "..."}]
    }
  ],
  "bi_don": [],
  "nguoi_lien_quan": [],
  "nguoi_lam_chung": []
}`;

    const userPrompt = "VĂN BẢN CẦN TRÍCH XUẤT:\n" + text;
    const aiData = callGroqAI(systemPrompt, userPrompt);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetDS = ss.getSheetByName("2_DuongSu");
    const dsValues = sheetDS.getDataRange().getValues();
    let updated = 0, added = 0;
   
    const normalize = (n) => n ? n.toString().toLowerCase().replace(/\s+/g, '') : '';

    const sync = (list, role) => {
      if (!list || !Array.isArray(list)) return;
      list.forEach(p => {
        let match = false;
       
        const repsToSave = p.representatives ? p.representatives.map(r => ({
          tuCach: r.tu_cach || "Người đại diện",
          xungHo: r.xung_ho || "",
          hoTen: r.ho_ten || "",
          namSinh: r.nam_sinh || "",
          diaChi: r.dia_chi || "",
          sdt: r.sdt || "",
          chucVu: r.chuc_vu || "",
          vanBan: r.van_ban || ""
        })) : [];
        const repString = repsToSave.length > 0 ? JSON.stringify(repsToSave) : "";

        let finalHoTen = p.ho_ten ? p.ho_ten.toUpperCase() : "";

        // Tìm đương sự đã có để cập nhật
        for (let i = 1; i < dsValues.length; i++) {
          if (dsValues[i][0] == idVuAn && normalize(dsValues[i][3]) == normalize(p.ho_ten)) {
            // Giữ lại tư cách cũ, chỉ cập nhật các thông tin cá nhân
            sheetDS.getRange(i+1, 3).setValue(p.xung_ho || ""); 
            if(p.nam_sinh) sheetDS.getRange(i+1, 5).setValue(p.nam_sinh);
            if(p.dia_chi) sheetDS.getRange(i+1, 6).setValue(p.dia_chi);
            if(p.sdt) sheetDS.getRange(i+1, 7).setValue(p.sdt);
            if(p.cccd) sheetDS.getRange(i+1, 8).setValue(p.cccd);
            if(repString) sheetDS.getRange(i+1, 9).setValue(repString);
            updated++; match = true; break;
          }
        }
        
        // Thêm mới nếu chưa có
        if (!match && p.ho_ten) {
          sheetDS.appendRow([idVuAn, role, p.xung_ho || "", finalHoTen, p.nam_sinh || "", p.dia_chi || "", p.sdt || "", p.cccd || "", repString]);
          added++;
        }
      });
    };

    sync(aiData.nguyen_don, "Nguyên đơn");
    sync(aiData.bi_don, "Bị đơn");
    sync(aiData.nguoi_lien_quan, "Người có quyền lợi, nghĩa vụ liên quan");
    sync(aiData.nguoi_lam_chung, "Người làm chứng");
   
    // Đánh dấu đã cập nhật cho vụ án này
    try { capNhatNgayTacDong(idVuAn); } catch(e) {}
    
    return { success: true, updated: updated, added: added };
  } catch (e) { return { success: false, error: e.message }; }
}

// ==========================================
// 3. AI TỰ TẠO BIỂU MẪU MỚI TỪ FILE CŨ (BẢN ÉP KHUÔN PLACEHOLDER)
// ==========================================
function backend_CreateTemplateFromDoc(fileName, mimeType, base64Data) {
  try {
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedData, mimeType, fileName);
    const gDocFile = Drive.Files.create({ name: "TEMP_AI_TPL", mimeType: MimeType.GOOGLE_DOCS }, blob, { convert: true });
    const doc = DocumentApp.openById(gDocFile.id);
    const body = doc.getBody();
    const textContent = body.getText();

    // 1. Lấy danh sách Placeholder CHUẨN từ hệ thống
    const placeholderDefs = backend_GetAllPlaceholders();
    const listPlaceholdersText = placeholderDefs.map(p => `- ${p.name}: ${p.description}`).join("\n");

    // 2. Tối ưu Prompt: Cấm sáng tạo Placeholder
    const systemPrompt = `Bạn là chuyên gia thiết kế biểu mẫu pháp lý Tòa án.
Nhiệm vụ: Tìm các thông tin thực tế trong văn bản (VD: tên người, ngày tháng, số hiệu tòa án) và đề xuất thay thế chúng bằng các Placeholder.

QUY TẮC CỐT LÕI (TUYỆT ĐỐI TUÂN THỦ):
1. BẠN CHỈ ĐƯỢC PHÉP SỬ DỤNG CÁC PLACEHOLDER TRONG DANH SÁCH DƯỚI ĐÂY. KHÔNG ĐƯỢC TỰ BỊA RA PLACEHOLDER KHÁC.
2. Nếu trong văn bản có thông tin không khớp với bất kỳ Placeholder nào, HÃY GIỮ NGUYÊN BẢN GỐC (Hoặc thay bằng dấu ......), tuyệt đối không tự chế biến.

DANH SÁCH PLACEHOLDER ĐƯỢC PHÉP DÙNG:
${listPlaceholdersText}

CHỈ TRẢ VỀ ĐỊNH DẠNG JSON SAU:
{
  "replacements": [
    {"find": "123/2026/TLST-DS", "replace": "{Số thụ lý}"},
    {"find": "Ông Nguyễn Văn A", "replace": "{Họ và tên Nguyên đơn}"},
    {"find": "Tòa án nhân dân huyện Đức Trọng", "replace": "{Tòa án}"}
  ]
}`;

    const userPrompt = "VĂN BẢN GỐC CẦN XỬ LÝ:\n" + textContent;
    
    // Gọi AI
    const mappingResult = callGroqAI(systemPrompt, userPrompt);
    const mapping = mappingResult.replacements || [];

    // 3. Thực hiện đính Placeholder vào File Word
    mapping.forEach(item => {
      if (item.find && item.replace) {
        // Double check: Đảm bảo AI không lén nhét Placeholder rác
        if (item.replace.includes("{") && item.replace.includes("}")) {
             let isValid = placeholderDefs.some(p => p.name === item.replace);
             if (!isValid) return; // Nếu AI bịa ra từ khóa sai -> Bỏ qua không replace
        }
        body.replaceText(item.find, item.replace);
      }
    });

    // 4. In đậm các Placeholder {Họ và tên...} để người dùng dễ nhìn
    let searchResult = body.findText("{Họ và tên");
    while (searchResult !== null) {
      searchResult.getElement().asText().setBold(searchResult.getStartOffset(), searchResult.getEndOffsetInclusive(), true);
      searchResult = body.findText("{Họ và tên", searchResult);
    }
    
    doc.saveAndClose();
   
    // 5. Lưu vào thư mục Biểu mẫu
    const config = getConfigFromSheet();
    const templateFolderId = extractFolderId(config["ID_THUMUC_MAU"]);
    const finalFile = DriveApp.getFileById(gDocFile.id);
    finalFile.setName("[AI_MAPPED] " + fileName.replace(/\.[^/.]+$/, ""));
    
    if (templateFolderId) {
        finalFile.moveTo(DriveApp.getFolderById(templateFolderId));
    }

    return { success: true, name: finalFile.getName() };
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
}