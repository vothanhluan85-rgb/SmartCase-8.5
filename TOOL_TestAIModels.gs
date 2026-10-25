/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.5 - MASTER AI DIAGNOSTIC & BENCHMARK TOOL
 * TỆP: TOOL_TestAIModels.gs - ĐÃ FIX TRIỆT ĐỂ LỖI CẮT TOKEN & ÉP CHUẨN JSON
 * -------------------------------------------------------------------------
 * - BẬT responseMimeType: "application/json" KHÓA CHẶT ĐẦU RA JSON THUẦN TÚY.
 * - NÂNG maxOutputTokens LÊN 2048 TRÁNH ĐỨT GÃY DỮ LIỆU GIỮA CHỪNG.
 * - ĐỘNG CƠ extractSafeJSON SIÊU BỀN BỈ: Tự động nhặt đúng khối JSON.
 * =========================================================================
 */

function onOpenAddAITestMenu() {
  SpreadsheetApp.getUi()
    .createMenu("🧪 TEST MODEL AI")
    .addItem("🚀 Chạy kiểm tra & Phân tầng toàn bộ Model", "tool_KiemTraVaPhanTangModelAI")
    .addItem("📋 Xem cấu hình Model đang áp dụng", "tool_XemCauHinhModelHienTai")
    .addToUi();
}

/**
 * HÀM CHÍNH: Quét toàn bộ model từ tài khoản, đo tốc độ và tự động phân tầng
 */
function tool_KiemTraVaPhanTangModelAI() {
  var ui = SpreadsheetApp.getUi();
  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  var apiKey = config["GEMINI_API_KEY"];

  if (!apiKey) {
    ui.alert("CHƯA CÓ API KEY", "Vui lòng nhập GEMINI_API_KEY trong phần Cài đặt trước khi chạy test!", ui.ButtonSet.OK);
    return;
  }

  // 1. GỌI API LISTMODELS CHÍNH THỨC CỦA GOOGLE ĐỂ LẤY TOÀN BỘ MODEL ĐANG MỞ
  var listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
  var discoveredModels = [];

  try {
    var resp = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() === 200) {
      var data = JSON.parse(resp.getContentText());
      if (data && data.models && Array.isArray(data.models)) {
        data.models.forEach(function(m) {
          if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
            var rawName = m.name.replace(/^models\//, "");
            discoveredModels.push({
              id: rawName,
              displayName: m.displayName || rawName,
              inputTokenLimit: m.inputTokenLimit || 0,
              outputTokenLimit: m.outputTokenLimit || 0
            });
          }
        });
      }
    } else {
      ui.alert("LỖI KẾT NỐI API", "Mã lỗi HTTP: " + resp.getResponseCode() + "\n" + resp.getContentText(), ui.ButtonSet.OK);
      return;
    }
  } catch (e) {
    ui.alert("LỖI KẾT NỐI", "Không thể kết nối đến Google AI Studio: " + e.message, ui.ButtonSet.OK);
    return;
  }

  // Ưu tiên các model đã được kiểm nghiệm thực tế
  var priorityCandidates = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-3.1-pro-preview",
    "gemini-pro-latest"
  ];

  priorityCandidates.forEach(function(cid) {
    var exists = discoveredModels.some(function(m) { return m.id === cid; });
    if (!exists) {
      discoveredModels.push({ id: cid, displayName: cid, inputTokenLimit: 0, outputTokenLimit: 0, isCandidate: true });
    }
  });

  // 2. CHẠY BÀI TEST BENCHMARK TRÊN TỪNG MODEL VỚI CỜ JSON BẮT BUỘC
  var testResults = [];
  var probePrompt = "Trích xuất họ tên và tư cách đương sự: 'Nguyên đơn ông Nguyễn Văn An kiện bị đơn bà Lê Thị Bình'. Hãy trả về định dạng JSON: {\"nd\":\"Nguyễn Văn An\",\"bd\":\"Lê Thị Bình\"}";

  discoveredModels.forEach(function(m) {
    var testResult = benchmarkSingleModel(apiKey, m.id, probePrompt);
    testResults.push({
      id: m.id,
      displayName: m.displayName,
      status: testResult.status,
      httpCode: testResult.httpCode,
      latencyMs: testResult.latencyMs,
      jsonSuccess: testResult.jsonSuccess,
      parsedData: testResult.parsedData,
      errorMessage: testResult.errorMessage
    });
  });

  // 3. PHÂN TẦNG CÁC MODEL THÀNH CÔNG (HTTP 200 & Parse JSON chuẩn)
  var workingModels = testResults.filter(function(r) { return r.httpCode === 200 && r.jsonSuccess; });

  if (workingModels.length === 0) {
    var errorReport = testResults.map(function(r) {
      return "- " + r.id + " [" + r.httpCode + "]: " + (r.errorMessage || "Không parse được JSON");
    }).join("\n");
    ui.alert("TẤT CẢ MODEL ĐỀU THẤT BẠI", "Chi tiết lỗi:\n" + errorReport, ui.ButtonSet.OK);
    return;
  }

  // Sắp xếp theo tốc độ (Latency tăng dần)
  workingModels.sort(function(a, b) { return a.latencyMs - b.latencyMs; });

  // TIER 1 (FAST / OCR): Tốc độ cao nhất cho bóc tách tài liệu
  var tier1Models = workingModels.filter(function(m) {
    var id = m.id.toLowerCase();
    return id.includes("flash") || id.includes("lite");
  }).map(function(m) { return m.id; });

  if (tier1Models.length === 0) tier1Models = [workingModels[0].id];

  // TIER 2 (COPILOT): Trợ lý hội thoại
  var tier2Models = workingModels.map(function(m) { return m.id; });

  // TIER 3 (REASONING / PRO): Soạn thảo chuyên sâu
  var tier3Models = workingModels.filter(function(m) {
    var id = m.id.toLowerCase();
    return id.includes("pro") || id.includes("argon") || id.includes("3.8") || id.includes("2.5-pro");
  }).map(function(m) { return m.id; });

  if (tier3Models.length === 0) {
    tier3Models = [workingModels[workingModels.length - 1].id, workingModels[0].id];
  }

  // 4. LƯU CẤU HÌNH PHÂN TẦNG VÀO HỆ THỐNG
  var optimalTiering = {
    TIER_FAST: tier1Models,
    TIER_COPILOT: tier2Models,
    TIER_REASONING: tier3Models,
    TIMESTAMP: new Date().toISOString()
  };

  CacheService.getScriptCache().put("APP_AI_MODEL_TIERS", JSON.stringify(optimalTiering), 21600);

  if (typeof updateConfigInSheet === 'function') {
    updateConfigInSheet({
      "AI_TIER_FAST": JSON.stringify(tier1Models),
      "AI_TIER_COPILOT": JSON.stringify(tier2Models),
      "AI_TIER_REASONING": JSON.stringify(tier3Models)
    });
  }

  // 5. HIỂN THỊ BÁO CÁO KẾT QUẢ ĐẦY ĐỦ
  var reportHtml = buildDiagnosticReportHtml(testResults, optimalTiering);
  var htmlOutput = HtmlService.createHtmlOutput(reportHtml)
    .setWidth(880)
    .setHeight(650)
    .setTitle("KẾT QUẢ BENCHMARK & PHÂN TẦNG MODEL AI");
  ui.showModalDialog(htmlOutput, "KẾT QUẢ TEST TOÀN DIỆN MODEL AI");
}

/**
 * Benchmark model đơn lẻ: Bật cờ responseMimeType="application/json" và cấp đủ 2048 token
 */
function benchmarkSingleModel(apiKey, modelId, probePrompt) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelId + ":generateContent?key=" + apiKey;
  
  // KHÓA CỨNG ÉP JSON & NÂNG LÊN 2048 TOKEN CHỐNG CẮT CỤT
  var payload = {
    "system_instruction": {
      "parts": [{ "text": "Bạn là máy trích xuất dữ liệu. CHỈ trả về JSON hợp lệ theo schema. Tuyệt đối không giải thích, không dùng markdown." }]
    },
    "contents": [{ "role": "user", "parts": [{ "text": probePrompt }] }],
    "generationConfig": {
      "temperature": 0.0,
      "maxOutputTokens": 2048,
      "responseMimeType": "application/json"
    }
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  var startTime = new Date().getTime();
  try {
    var resp = UrlFetchApp.fetch(url, options);
    var latency = new Date().getTime() - startTime;
    var code = resp.getResponseCode();
    var respText = resp.getContentText();

    if (code === 200) {
      var json = JSON.parse(respText);
      var rawText = (json.candidates && json.candidates[0].content && json.candidates[0].content.parts)
        ? json.candidates[0].content.parts[0].text
        : "";

      var parsed = robustJsonExtractor(rawText);
      var hasValidJson = (parsed && (parsed.nd || parsed.bd));

      return {
        status: hasValidJson ? "HOÀN HẢO" : "LỖI NỘI DUNG",
        httpCode: 200,
        latencyMs: latency,
        jsonSuccess: hasValidJson,
        parsedData: parsed,
        errorMessage: hasValidJson ? "" : "Text trả về: " + rawText.substring(0, 100)
      };
    } else {
      var errJson = {};
      try { errJson = JSON.parse(respText); } catch(e) {}
      var msg = errJson.error ? errJson.error.message : respText.substring(0, 120);

      return {
        status: "THẤT BẠI (HTTP " + code + ")",
        httpCode: code,
        latencyMs: latency,
        jsonSuccess: false,
        parsedData: null,
        errorMessage: msg
      };
    }
  } catch (err) {
    return {
      status: "LỖI KẾT NỐI",
      httpCode: 0,
      latencyMs: new Date().getTime() - startTime,
      jsonSuccess: false,
      parsedData: null,
      errorMessage: err.message
    };
  }
}

/**
 * Trình bóc tách JSON siêu bền bỉ: Chống rác, chống markdown, tự vá ngoặc nhọn
 */
function robustJsonExtractor(text) {
  if (!text) return null;
  var str = String(text).trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(str);
  } catch (e1) {}

  // 2. Gọt sạch Markdown fence ```json ... ``` và backtick
  var clean = str.replace(/```(?:json)?/gi, '').replace(/```/g, '').replace(/^`+|`+$/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e2) {}

  // 3. Tìm khối ngoặc nhọn outermost
  var start = clean.indexOf('{');
  var end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    var candidate = clean.substring(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (e3) {
      try {
        var sanitized = candidate
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
          .replace(/,\s*([\}\]])/g, '$1');
        return JSON.parse(sanitized);
      } catch (e4) {}
    }
  }

  return null;
}

/**
 * Xây dựng giao diện HTML báo cáo kết quả kiểm định Model
 */
function buildDiagnosticReportHtml(testResults, tiering) {
  var rows = testResults.map(function(r) {
    var badgeClass = r.httpCode === 200 ? (r.jsonSuccess ? "badge-success" : "badge-warning") : "badge-danger";
    var latencyClass = r.latencyMs < 2000 ? "text-success" : (r.latencyMs < 4000 ? "text-warning" : "text-danger");

    return "<tr>" +
      "<td><b>" + r.id + "</b></td>" +
      "<td><span class='badge " + badgeClass + "'>" + (r.httpCode === 200 ? "HTTP 200" : "HTTP " + r.httpCode) + "</span></td>" +
      "<td class='" + latencyClass + "'><b>" + r.latencyMs + " ms</b></td>" +
      "<td>" + (r.jsonSuccess ? "<span class='text-success fw-bold'>✓ Chuẩn JSON</span>" : "<span class='text-danger'>✗ Lỗi</span>") + "</td>" +
      "<td class='small-text text-muted'>" + (r.errorMessage ? r.errorMessage : "Khả dụng hoàn toàn") + "</td>" +
    "</tr>";
  }).join("");

  return "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
    "<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'>" +
    "<style>" +
      "body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; padding: 15px; color: #1e293b; background: #f8fafc; }" +
      ".badge-success { background-color: #10b981; color: white; }" +
      ".badge-warning { background-color: #f59e0b; color: white; }" +
      ".badge-danger { background-color: #ef4444; color: white; }" +
      ".card { border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }" +
      ".card-header { background: #ffffff; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding: 10px 15px; }" +
      ".small-text { font-size: 11px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }" +
      ".tier-box { padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; font-size: 12px; }" +
      ".tier-1 { background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }" +
      ".tier-2 { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }" +
      ".tier-3 { background-color: #faf5ff; border: 1px solid #e9d5ff; color: #7c3aed; }" +
    "</style></head><body>" +
    "<h6 class='fw-bold text-primary mb-2'>📊 KẾT QUẢ BENCHMARK & PHÂN TẦNG MODEL THỜI GIAN THỰC</h6>" +
    "<p class='text-muted small mb-3'>Toàn bộ model đã được test độ trễ và khả năng bóc tách JSON chuẩn xác.</p>" +

    "<div class='card'>" +
      "<div class='card-header text-success'>🎯 MA TRẬN PHÂN TẦNG NHIỆM VỤ ĐÃ ĐƯỢC TỰ ĐỘNG THIẾT LẬP</div>" +
      "<div class='card-body p-3'>" +
        "<div class='tier-box tier-1'>" +
          "<b>🚀 PHÂN TẦNG 1 (FAST / OCR - Bóc tách nguyên liệu nhanh):</b><br>" +
          "• Model áp dụng: <code>" + tiering.TIER_FAST.join(", ") + "</code><br>" +
          "• Đảm nhiệm: Bóc tách đơn, quét danh sách đương sự, OCR chứng cứ, đọc file Word/PDF." +
        "</div>" +
        "<div class='tier-box tier-2'>" +
          "<b>💬 PHÂN TẦNG 2 (COPILOT / INTERACTIVE - Phản xạ tức thì):</b><br>" +
          "• Model áp dụng: <code>" + tiering.TIER_COPILOT.join(", ") + "</code><br>" +
          "• Đảm nhiệm: Trợ lý đàm thoại Copilot, sinh lệnh Action điều khiển hệ thống, cấy mã Placeholder." +
        "</div>" +
        "<div class='tier-box tier-3'>" +
          "<b>⚖️ PHÂN TẦNG 3 (DEEP REASONING - Lý luận sâu & Soạn thảo chuyên sâu):</b><br>" +
          "• Model áp dụng: <code>" + tiering.TIER_REASONING.join(", ") + "</code><br>" +
          "• Đảm nhiệm: Soạn thảo toàn văn biểu mẫu rỗng (No-upload), phân tích tranh chấp phức tạp theo NQ Hội đồng Thẩm phán." +
        "</div>" +
      "</div>" +
    "</div>" +

    "<div class='card'>" +
      "<div class='card-header text-dark'>📋 BẢNG ĐO THỰC TẾ CHI TIẾT TỪNG MODEL</div>" +
      "<div class='table-responsive'>" +
        "<table class='table table-hover table-bordered m-0' style='font-size: 12px;'>" +
          "<thead class='table-light'><tr><th>TÊN MODEL</th><th>MÃ HTTP</th><th>ĐỘ TRỄ</th><th>JSON COMPLIANCE</th><th>GHI CHÚ / LỖI</th></tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table>" +
      "</div>" +
    "</div>" +
    "<div class='text-end'><button class='btn btn-sm btn-secondary px-4' onclick='google.script.host.close()'>Đóng</button></div>" +
    "</body></html>";
}

function tool_XemCauHinhModelHienTai() {
  var ui = SpreadsheetApp.getUi();
  var cache = CacheService.getScriptCache().get("APP_AI_MODEL_TIERS");
  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};

  var fast = config["AI_TIER_FAST"] || (cache ? JSON.parse(cache).TIER_FAST : "Mặc định");
  var copilot = config["AI_TIER_COPILOT"] || (cache ? JSON.parse(cache).TIER_COPILOT : "Mặc định");
  var reasoning = config["AI_TIER_REASONING"] || (cache ? JSON.parse(cache).TIER_REASONING : "Mặc định");

  ui.alert("CẤU HÌNH PHÂN TẦNG MODEL HIỆN TẠI",
    "1. Phân tầng 1 (Fast/OCR):\n" + fast + "\n\n" +
    "2. Phân tầng 2 (Copilot Chat):\n" + copilot + "\n\n" +
    "3. Phân tầng 3 (Deep Reasoning/Drafting):\n" + reasoning,
    ui.ButtonSet.OK
  );
}

function getTieredGeminiModels(tierName) {
  var cache = CacheService.getScriptCache().get("APP_AI_MODEL_TIERS");
  if (cache) {
    try {
      var tiers = JSON.parse(cache);
      if (tierName === 'FAST' && tiers.TIER_FAST && tiers.TIER_FAST.length > 0) return tiers.TIER_FAST;
      if (tierName === 'COPILOT' && tiers.TIER_COPILOT && tiers.TIER_COPILOT.length > 0) return tiers.TIER_COPILOT;
      if (tierName === 'REASONING' && tiers.TIER_REASONING && tiers.TIER_REASONING.length > 0) return tiers.TIER_REASONING;
    } catch(e) {}
  }

  var config = (typeof getConfigFromSheet === 'function') ? getConfigFromSheet() : {};
  if (tierName === 'FAST' && config["AI_TIER_FAST"]) {
    try { return JSON.parse(config["AI_TIER_FAST"]); } catch(e) {}
  }
  if (tierName === 'COPILOT' && config["AI_TIER_COPILOT"]) {
    try { return JSON.parse(config["AI_TIER_COPILOT"]); } catch(e) {}
  }
  if (tierName === 'REASONING' && config["AI_TIER_REASONING"]) {
    try { return JSON.parse(config["AI_TIER_REASONING"]); } catch(e) {}
  }

  if (tierName === 'REASONING') {
    return ["gemini-3.1-pro-preview", "gemini-3.1-pro", "gemini-4-argon", "gemini-2.5-pro", "gemini-3.6-flash"];
  }
  return ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"];
}