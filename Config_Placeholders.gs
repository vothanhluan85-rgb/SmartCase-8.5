/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.5 - MASTER PLACEHOLDER CONFIGURATION
 * TỆP: Config_Placeholders.gs - BẢNG TỪ ĐIỂN BẢN THỂ HỌC PLACEHOLDER TINH GỌN
 * -------------------------------------------------------------------------
 * - ĐÃ TINH GỌN THEO CHUYÊN ĐỀ 1 (GIẢM 66% DUNG LƯỢNG THỪA):
 *   + Loại bỏ hoàn toàn các mục nhân bản cơ học đối với nhóm Bất biến (Case-Invariant).
 *   + Giữ vững bộ biến thể ngữ pháp (Title Case / lowercase / UPPERCASE) cho nhóm
 *     Vai trò tố tụng, Danh xưng, Ngày tháng tư pháp bằng chữ và Tên cơ quan Tòa án.
 *   + Bổ sung thực thể mở cho Công văn ngoại tố: {Người nhận}, {Địa chỉ người nhận}.
 *   + Phân lập rạch ròi quan hệ Thực thể Mẹ vĩ mô và Thực thể Con thành phần.
 * =========================================================================
 */

const PLACEHOLDER_DEFINITIONS = [
  // =========================================================================
  // NHÓM 1: THÔNG TIN VỤ ÁN, CƠ QUAN TỐ TỤNG & VĂN BẢN MỞ
  // =========================================================================
  { group: "1. THÔNG TIN CHUNG", name: "{Số thụ lý}", description: "Số thụ lý đầy đủ (Bất biến, VD: 172/2026/TLST-DS hoặc 45/2026/TLST-VHN)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Số thụ lý rút gọn}", description: "Phần số của số thụ lý (Bất biến, VD: 172 hoặc 45)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Số đơn}", description: "Số đơn tiếp nhận trong Sổ nhận đơn (Bất biến, VD: 45)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Loại án}", description: "Tên loại án/việc đầu câu (VD: Dân sự, Hôn nhân và gia đình, Kinh doanh thương mại)" },
  { group: "1. THÔNG TIN CHUNG", name: "{loại án}", description: "Tên loại án/việc giữa câu (VD: dân sự, hôn nhân và gia đình)" },
  { group: "1. THÔNG TIN CHUNG", name: "{LOẠI ÁN}", description: "Tên loại án/việc in hoa tiêu đề (VD: DÂN SỰ, HÔN NHÂN VÀ GIA ĐÌNH)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Loại án rút gọn}", description: "Ký hiệu viết tắt loại án (Bất biến, VD: DS, HNGĐ, VHN, KDTM, LĐ, HC, VDS, HGĐT)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Phân loại đơn}", description: "Phân loại đơn tiếp nhận (Dân sự, Hôn nhân, Hành chính...)" },
  { group: "1. THÔNG TIN CHUNG", name: "{phân loại đơn}", description: "Phân loại đơn tiếp nhận dạng viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Quan hệ tranh chấp}", description: "Quan hệ pháp luật tranh chấp hoặc tội danh (Đầu câu)" },
  { group: "1. THÔNG TIN CHUNG", name: "{quan hệ tranh chấp}", description: "Quan hệ pháp luật tranh chấp hoặc tội danh (Giữa câu)" },
  { group: "1. THÔNG TIN CHUNG", name: "{QUAN HỆ TRANH CHẤP}", description: "Quan hệ tranh chấp viết IN HOA" },
  { group: "1. THÔNG TIN CHUNG", name: "{Tòa án}", description: "Tên Tòa án giải quyết (VD: Tòa án nhân dân tỉnh Lâm Đồng)" },
  { group: "1. THÔNG TIN CHUNG", name: "{tòa án}", description: "Tên Tòa án viết thường (VD: tòa án nhân dân tỉnh Lâm Đồng)" },
  { group: "1. THÔNG TIN CHUNG", name: "{TÒA ÁN}", description: "Tên Tòa án viết IN HOA (VD: TÒA ÁN NHÂN DÂN TỈNH LÂM ĐỒNG)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Địa chỉ tòa án}", description: "Trụ sở làm việc của Tòa án (Bất biến)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Chức vụ}", description: "Chức danh tố tụng đầu câu (Thẩm phán)" },
  { group: "1. THÔNG TIN CHUNG", name: "{chức vụ}", description: "Chức danh tố tụng viết thường (thẩm phán)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Số văn bản}", description: "Số Quyết định / Bản án ban hành (Bất biến, VD: 25 hoặc 25/2026/QĐST-DS)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Năm ban hành}", description: "Năm ban hành văn bản (Bất biến, VD: 2026)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Mã QR}", description: "Vị trí chèn ảnh mã QR tra cứu văn bản tố tụng" },

  // CƠ QUAN / ĐỐI TƯỢNG NGOẠI TỐ (CÔNG VĂN MỞ)
  { group: "1. THÔNG TIN CHUNG", name: "{Người nhận}", description: "Cơ quan/Người nhận công văn mở (Đầu câu, VD: Ủy ban nhân dân huyện Đơn Dương)" },
  { group: "1. THÔNG TIN CHUNG", name: "{người nhận}", description: "Cơ quan/Người nhận công văn mở dạng chữ thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{NGƯỜI NHẬN}", description: "Cơ quan/Người nhận công văn mở IN HOA (Dùng cho phần Kính gửi)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Địa chỉ người nhận}", description: "Địa chỉ trụ sở cơ quan nhận công văn (Bất biến)" },

  // CÁN BỘ TIẾN HÀNH TỐ TỤNG
  { group: "1. THÔNG TIN CHUNG", name: "{Danh xưng Thẩm phán}", description: "Danh xưng Thẩm phán đầu câu: Ông / Bà" },
  { group: "1. THÔNG TIN CHUNG", name: "{danh xưng thẩm phán}", description: "Danh xưng Thẩm phán giữa câu: ông / bà" },
  { group: "1. THÔNG TIN CHUNG", name: "{Họ và tên Thẩm phán}", description: "Họ và tên mộc Thẩm phán (VD: Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thẩm phán}", description: "Họ và tên Thẩm phán (Title Case: Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{THẨM PHÁN}", description: "Họ và tên Thẩm phán IN HOA chân chữ ký (VÕ THÀNH LUÂN)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thẩm phán đầy đủ}", description: "Danh xưng + Họ tên Thẩm phán đầu câu (VD: Ông Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{thẩm phán đầy đủ}", description: "Danh xưng + Họ tên Thẩm phán giữa câu (VD: ông Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Danh xưng Thư ký}", description: "Danh xưng Thư ký Tòa án: Bà / Ông" },
  { group: "1. THÔNG TIN CHUNG", name: "{danh xưng thư ký}", description: "Danh xưng Thư ký Tòa án viết thường: bà / ông" },
  { group: "1. THÔNG TIN CHUNG", name: "{Họ và tên Thư ký}", description: "Họ và tên mộc Thư ký (VD: Lường Thị Phương)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thư ký}", description: "Họ và tên Thư ký (Title Case: Lường Thị Phương)" },
  { group: "1. THÔNG TIN CHUNG", name: "{THƯ KÝ}", description: "Họ và tên Thư ký IN HOA chân chữ ký (LƯỜNG THỊ PHƯƠNG)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thư ký đầy đủ}", description: "Danh xưng + Họ tên Thư ký đầu câu (VD: Bà Lường Thị Phương)" },
  { group: "1. THÔNG TIN CHUNG", name: "{thư ký đầy đủ}", description: "Danh xưng + Họ tên Thư ký giữa câu (VD: bà Lường Thị Phương)" },

  // =========================================================================
  // NHÓM 2: THỜI GIAN, MỐC TỐ TỤNG & LỊCH LÀM VIỆC
  // =========================================================================
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày thụ lý}", description: "Ngày thụ lý bằng chữ đầu câu (VD: Ngày 29 tháng 08 năm 2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày thụ lý}", description: "Ngày thụ lý bằng chữ giữa câu (VD: ngày 29 tháng 08 năm 2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY THỤ LÝ}", description: "Ngày thụ lý bằng chữ IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày nhận đơn}", description: "Ngày nhận đơn bằng chữ đầu câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày nhận đơn}", description: "Ngày nhận đơn bằng chữ giữa câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY NHẬN ĐƠN}", description: "Ngày nhận đơn bằng chữ IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày ban hành}", description: "Ngày ký văn bản bằng chữ đầu câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày ban hành}", description: "Ngày ký văn bản bằng chữ giữa câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY BAN HÀNH}", description: "Ngày ký văn bản bằng chữ IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày gia hạn}", description: "Ngày ban hành QĐ gia hạn chuẩn bị xét xử đầu câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày gia hạn}", description: "Ngày ban hành QĐ gia hạn giữa câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày hết hạn}", description: "Ngày hết hạn chuẩn bị xét xử đầu câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày hết hạn}", description: "Ngày hết hạn chuẩn bị xét xử giữa câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Thời gian gia hạn}", description: "Khoảng thời gian gia hạn (Bất biến, VD: 01 tháng hoặc 02 tháng)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Thời gian triệu tập}", description: "Giờ phút ngày tháng triệu tập (Bất biến, tự in đậm số: 08 giờ 30 phút, ngày 15/09/2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Địa điểm}", description: "Địa điểm làm việc / Phòng xử án (Bất biến)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Địa điểm làm việc}", description: "Địa điểm làm việc (Đồng nghĩa của {Địa điểm})" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Nội dung làm việc}", description: "Nội dung công việc cụ thể ghi trên Giấy triệu tập / Giấy báo" },

  // =========================================================================
  // NHÓM 3: ÁN PHÍ, LỆ PHÍ & CHỨNG TỪ BIÊN LAI (NQ 326/2016)
  // =========================================================================
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Thỏa thuận án phí}", description: "THỰC THỂ TỔNG HỢP: Câu phán quyết án phí hoàn chỉnh theo toán tử cấn trừ Δ = T - A" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Án phí}", description: "Đồng nghĩa của thực thể {Thỏa thuận án phí}" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Tạm ứng án phí bằng số}", description: "Mức tạm ứng án phí bằng số (Bất biến, VD: 300.000 đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Tạm ứng án phí bằng chữ}", description: "Mức tạm ứng án phí bằng chữ (Bất biến, VD: Ba trăm nghìn đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Án phí bằng số}", description: "Mức án phí tính toán bằng số (Bất biến, VD: 300.000 đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Án phí bằng chữ}", description: "Mức án phí tính toán bằng chữ (Bất biến, VD: Ba trăm nghìn đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Biên lai tạm ứng án phí}", description: "Trích dẫn đầy đủ biên lai thu tiền (Bất biến: Số biên lai, ngày nộp, cơ quan thu)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Thông tin biên lai án phí}", description: "Đồng nghĩa của {Biên lai tạm ứng án phí}" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Số biên lai}", description: "Số chứng từ biên lai thu tạm ứng án phí (Bất biến, VD: 0001515)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Ngày biên lai}", description: "Ngày xuất biên lai thu tiền (Bất biến, VD: 24/07/2026)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Cơ quan thu tiền}", description: "Tên cơ quan THADS thu tạm ứng án phí (Bất biến)" },

  // =========================================================================
  // NHÓM 4: IN TÁCH TRANG HÀNG LOẠT (MẪU 04, 05, 06, 11)
  // =========================================================================
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Họ và tên}", description: "Họ và tên từng người nhận khi in tách trang (Title Case)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{HỌ VÀ TÊN}", description: "Họ và tên từng người nhận in tách trang IN HOA" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Xưng hô}", description: "Danh xưng người nhận đầu câu (Ông / Bà / Anh / Chị)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{xưng hô}", description: "Danh xưng người nhận giữa câu (ông / bà / anh / chị)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{XƯNG HÔ}", description: "Danh xưng người nhận IN HOA (ÔNG / BÀ)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Tư cách}", description: "Tư cách tố tụng đầu câu (Nguyên đơn / Bị đơn / Người liên quan)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{tư cách}", description: "Tư cách tố tụng giữa câu (nguyên đơn / bị đơn...)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{TƯ CÁCH}", description: "Tư cách tố tụng IN HOA (NGUYÊN ĐƠN / BỊ ĐƠN)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Năm sinh}", description: "Cụm năm sinh của người nhận (Bất biến, sinh năm 19xx)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Địa chỉ}", description: "Địa chỉ cư trú hoặc trụ sở của người nhận (Bất biến)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Số điện thoại}", description: "Số điện thoại liên lạc của người nhận (Bất biến)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{CCCD}", description: "Số Căn cước công dân / CMND của người nhận (Bất biến)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Người đại diện}", description: "Đoạn thông tin người đại diện theo ủy quyền / pháp luật / Luật sư (Bất biến)" },

  // =========================================================================
  // NHÓM 5: VỤ ÁN TRANH CHẤP & TIỀN TỐ TỤNG (DÂN SỰ, KDTM, LAO ĐỘNG, HÀNH CHÍNH)
  // =========================================================================
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn}", description: "Danh sách Nguyên đơn đầu câu (Nối dấu chấm phẩy ; Option B)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{nguyên đơn}", description: "Danh sách Nguyên đơn giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGUYÊN ĐƠN}", description: "Danh sách Nguyên đơn IN HOA tiêu đề" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người khởi kiện}", description: "Danh sách Người khởi kiện đầu câu (Án Hành chính & Đơn)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người khởi kiện}", description: "Danh sách Người khởi kiện giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI KHỞI KIỆN}", description: "Danh sách Người khởi kiện IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người nộp đơn}", description: "Danh sách Người nộp đơn đầu câu (Đồng nghĩa Người khởi kiện)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người nộp đơn}", description: "Danh sách Người nộp đơn giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI NỘP ĐƠN}", description: "Danh sách Người nộp đơn IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ sạch của Nguyên đơn (Bất biến)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người khởi kiện chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ sạch của Người khởi kiện (Bất biến)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người nộp đơn chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ sạch của Người nộp đơn (Bất biến)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Danh sách Nguyên đơn}", description: "Đồng nghĩa của {Nguyên đơn}" },

  // BỊ ĐƠN / BỊ KIỆN
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn}", description: "Danh sách Bị đơn đầu câu (Nối dấu chấm phẩy ; Option B)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{bị đơn}", description: "Danh sách Bị đơn giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{BỊ ĐƠN}", description: "Danh sách Bị đơn IN HOA tiêu đề" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người bị kiện}", description: "Danh sách Người bị kiện đầu câu (Án Hành chính & Đơn)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người bị kiện}", description: "Danh sách Người bị kiện giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI BỊ KIỆN}", description: "Danh sách Người bị kiện IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ sạch của Bị đơn (Bất biến)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người bị kiện chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ sạch của Người bị kiện (Bất biến)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Danh sách Bị đơn}", description: "Đồng nghĩa của {Bị đơn}" },

  // LIÊN QUAN & LÀM CHỨNG
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người có quyền lợi, nghĩa vụ liên quan}", description: "Danh sách Người liên quan đầu câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người có quyền lợi, nghĩa vụ liên quan}", description: "Danh sách Người liên quan giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI CÓ QUYỀN LỢI, NGHĨA VỤ LIÊN QUAN}", description: "Danh sách Người liên quan IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người có quyền lợi, nghĩa vụ liên quan chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ của Người liên quan (Bất biến)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người làm chứng}", description: "Danh sách Người làm chứng đầu câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người làm chứng}", description: "Danh sách Người làm chứng giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI LÀM CHỨNG}", description: "Danh sách Người làm chứng IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người làm chứng chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ của Người làm chứng (Bất biến)" },

  // PHÂN RÃ CÁ NHÂN THEO CHỈ SỐ (SLOTS)
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn 1}", description: "Danh xưng + Họ tên Nguyên đơn 1 (VD: Ông Phan Văn Thắng)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Nguyên đơn 1}", description: "Họ và tên mộc Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Nguyên đơn 1}", description: "Cụm năm sinh Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Nguyên đơn 1}", description: "Địa chỉ Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Số điện thoại Nguyên đơn 1}", description: "Số điện thoại Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{CCCD Nguyên đơn 1}", description: "Số CCCD Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn 2}", description: "Danh xưng + Họ tên Nguyên đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Nguyên đơn 2}", description: "Họ và tên mộc Nguyên đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Nguyên đơn 2}", description: "Năm sinh Nguyên đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Nguyên đơn 2}", description: "Địa chỉ Nguyên đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn 1}", description: "Danh xưng + Họ tên Bị đơn 1 (VD: Bà Khum Thị Bích Thủy)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Bị đơn 1}", description: "Họ và tên mộc Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Bị đơn 1}", description: "Năm sinh Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Bị đơn 1}", description: "Địa chỉ Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Số điện thoại Bị đơn 1}", description: "Số điện thoại Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{CCCD Bị đơn 1}", description: "Số CCCD Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn 2}", description: "Danh xưng + Họ tên Bị đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Bị đơn 2}", description: "Họ và tên mộc Bị đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Bị đơn 2}", description: "Năm sinh Bị đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Bị đơn 2}", description: "Địa chỉ Bị đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người khởi kiện 1}", description: "Danh xưng + Họ tên Người khởi kiện 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người bị kiện 1}", description: "Danh xưng + Họ tên Người bị kiện 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người nộp đơn 1}", description: "Danh xưng + Họ tên Người nộp đơn 1" },

  // =========================================================================
  // NHÓM 6: VIỆC HNGĐ (THUẬN TÌNH LY HÔN) & VIỆC DÂN SỰ
  // =========================================================================
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu}", description: "Danh sách Người yêu cầu đầu câu (Thuận tình LH tự gom cả 2 bên)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người yêu cầu}", description: "Danh sách Người yêu cầu giữa câu" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NGƯỜI YÊU CẦU}", description: "Danh sách Người yêu cầu IN HOA" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ của các Người yêu cầu (Bất biến)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Danh sách Người yêu cầu}", description: "Đồng nghĩa của {Người yêu cầu}" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Danh sách NYC}", description: "Đồng nghĩa của {Người yêu cầu}" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu 1}", description: "Danh xưng + Họ tên Người yêu cầu 1 (VD: Ông Phan Văn Thắng)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NYC1}", description: "Viết tắt Danh xưng + Họ tên Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Họ và tên Người yêu cầu 1}", description: "Họ và tên mộc Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Năm sinh Người yêu cầu 1}", description: "Năm sinh Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Địa chỉ Người yêu cầu 1}", description: "Địa chỉ Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Số điện thoại Người yêu cầu 1}", description: "Số điện thoại Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{CCCD Người yêu cầu 1}", description: "Số CCCD Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu 2}", description: "Danh xưng + Họ tên Người yêu cầu 2 (VD: Bà Khum Thị Bích Thủy)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NYC2}", description: "Viết tắt Danh xưng + Họ tên Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Họ và tên Người yêu cầu 2}", description: "Họ và tên mộc Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Năm sinh Người yêu cầu 2}", description: "Năm sinh Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Địa chỉ Người yêu cầu 2}", description: "Địa chỉ Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Số điện thoại Người yêu cầu 2}", description: "Số điện thoại Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{CCCD Người yêu cầu 2}", description: "Số CCCD Người yêu cầu 2" },

  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người bị yêu cầu}", description: "Danh sách Người bị yêu cầu đầu câu (Việc Dân sự)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người bị yêu cầu}", description: "Danh sách Người bị yêu cầu giữa câu" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NGƯỜI BỊ YÊU CẦU}", description: "Danh sách Người bị yêu cầu IN HOA" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người bị yêu cầu chi tiết}", description: "Họ tên + Năm sinh + Địa chỉ của Người bị yêu cầu (Bất biến)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người bị yêu cầu 1}", description: "Danh xưng + Họ tên Người bị yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Họ và tên Người bị yêu cầu 1}", description: "Họ và tên mộc Người bị yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Năm sinh Người bị yêu cầu 1}", description: "Năm sinh Người bị yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Địa chỉ Người bị yêu cầu 1}", description: "Địa chỉ Người bị yêu cầu 1" },

  // =========================================================================
  // NHÓM 7: PHẢ HỆ LỜI KHAI & DIỄN BIẾN TỐ TỤNG (MẸ - CON)
  // =========================================================================
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai đương sự}", description: "THỰC THỂ MẸ TỐI CAO: Khối tổng hợp tự động toàn văn lời khai NĐ -> BĐ -> NLQ" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{LỜI KHAI ĐƯƠNG SỰ}", description: "Thực thể Mẹ lời khai đương sự dạng tiêu đề IN HOA" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Nguyên đơn}", description: "Thực thể Con: Toàn văn lời khai của các Nguyên đơn" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Bị đơn}", description: "Thực thể Con: Toàn văn lời khai của các Bị đơn" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người yêu cầu}", description: "Thực thể Con: Lời khai của các Người yêu cầu (VHN & Việc Dân sự)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người bị yêu cầu}", description: "Thực thể Con: Lời khai của Người bị yêu cầu (Việc Dân sự)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người khởi kiện}", description: "Thực thể Con: Lời khai của Người khởi kiện (Án Hành chính & Đơn)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người bị kiện}", description: "Thực thể Con: Lời khai của Người bị kiện (Án Hành chính & Đơn)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người có quyền lợi, nghĩa vụ liên quan}", description: "Thực thể Con: Toàn văn lời khai của tất cả Người liên quan" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai người làm chứng}", description: "Thực thể Con: Toàn văn lời khai của tất cả Người làm chứng" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Nội dung vụ án}", description: "THỰC THỂ MẸ: Diễn biến vụ án lắp ráp tuần tự phục vụ Bản án sơ thẩm Mẫu 40, 60" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{NỘI DUNG VỤ ÁN}", description: "Diễn biến vụ án Bản án sơ thẩm tiêu đề IN HOA" },

  // =========================================================================
  // NHÓM 8: PHẢ HỆ THỎA THUẬN HÒA GIẢI & CÁC CHẾ ĐỊNH HNGĐ (MẸ - CON)
  // =========================================================================
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Nội dung thỏa thuận}", description: "THỰC THỂ MẸ TỐI CAO: Khối điều khoản hòa giải thành toàn bộ vụ án (Mẫu 22, 25, 44, 45...)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{NỘI DUNG THỎA THUẬN}", description: "Thực thể Mẹ nội dung thỏa thuận tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Nội dung hòa giải thành}", description: "Đồng nghĩa hoàn toàn của {Nội dung thỏa thuận}" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{NỘI DUNG HÒA GIẢI THÀNH}", description: "Nội dung hòa giải thành tiêu đề IN HOA" },

  // CÁC THỰC THỂ CON CHẾ ĐỊNH THÀNH PHẦN
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Quan hệ hôn nhân}", description: "Thực thể Con: Thỏa thuận thuận tình ly hôn (VD: Ông A và bà B thuận tình ly hôn)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{QUAN HỆ HÔN NHÂN}", description: "Thỏa thuận ly hôn tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Thỏa thuận ly hôn}", description: "Đồng nghĩa của {Quan hệ hôn nhân}" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{THỎA THUẬN LY HÔN}", description: "Đồng nghĩa của {Quan hệ hôn nhân} tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Tình trạng hôn nhân}", description: "Tóm tắt: Thời gian kết hôn, nơi đăng ký, nguyên nhân mâu thuẫn và ly thân" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Số con chung}", description: "Số lượng con chung (Bất biến, VD: 02 con chung hoặc Không có con chung)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Con chung}", description: "Danh sách nhân thân các con chung (Họ tên, ngày tháng năm sinh)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{CON CHUNG}", description: "Danh sách con chung tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Thỏa thuận con chung}", description: "Trọn gói cả 3 vế: [Danh sách con] + [Giao ai nuôi dưỡng] + [Cấp dưỡng]" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{THỎA THUẬN CON CHUNG}", description: "Thỏa thuận con chung tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Cấp dưỡng nuôi con}", description: "Thực thể Con: Thỏa thuận mức và phương thức cấp dưỡng nuôi con" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{CẤP DƯỠNG NUÔI CON}", description: "Cấp dưỡng nuôi con tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Cấp dưỡng con chung}", description: "Đồng nghĩa của {Cấp dưỡng nuôi con}" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Tài sản chung}", description: "Thực thể Con: Thỏa thuận phân chia tài sản chung" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{TÀI SẢN CHUNG}", description: "Thỏa thuận tài sản chung tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Nợ chung}", description: "Thực thể Con: Thỏa thuận về nghĩa vụ nợ chung" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{NỢ CHUNG}", description: "Thỏa thuận nợ chung tiêu đề IN HOA" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Ngày hòa giải thành}", description: "Ngày lập biên bản hòa giải thành bằng chữ đầu câu" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{ngày hòa giải thành}", description: "Ngày lập biên bản hòa giải thành bằng chữ giữa câu" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Quyền thăm nom con}", description: "Điều khoản quyền thăm nom, chăm sóc con theo Điều 82, 83 Luật HNGĐ (Bất biến)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Quyền thăm con}", description: "Đồng nghĩa của {Quyền thăm nom con}" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Lãi suất chậm thi hành án}", description: "Điều khoản nghĩa vụ trả lãi chậm thi hành án theo Điều 357, 468 BLDS (Bất biến)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Lãi chậm trả}", description: "Đồng nghĩa của {Lãi suất chậm thi hành án}" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Điều luật HNGĐ}", description: "Chuỗi điều luật viện dẫn chuẩn mực HNGĐ (Bất biến)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Thỏa thuận nghĩa vụ chính}", description: "Nghĩa vụ trả tiền, bàn giao đất trong án Dân sự / KDTM" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Thời hạn và phương thức thực hiện}", description: "Thời gian trả nợ, phương thức chuyển khoản hoặc tiền mặt" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Thỏa thuận chi phí tố tụng}", description: "Thỏa thuận chi phí xem xét thẩm định tại chỗ, định giá tài sản" },

  // =========================================================================
  // NHÓM 9: TÀI LIỆU CHỨNG CỨ KÈM THEO ĐƠN & THÔNG BÁO THỤ LÝ
  // =========================================================================
  { group: "9. TÀI LIỆU CHỨNG CỨ", name: "{Tài liệu kèm theo đơn khởi kiện}", description: "THỰC THỂ MẸ: Danh mục gạch đầu dòng tài liệu chứng cứ nộp kèm đơn (Mẫu 03, 41, 53)" },
  { group: "9. TÀI LIỆU CHỨNG CỨ", name: "{TÀI LIỆU KÈM THEO ĐƠN KHỞI KIỆN}", description: "Danh mục chứng cứ kèm đơn tiêu đề IN HOA" },
  { group: "9. TÀI LIỆU CHỨNG CỨ", name: "{Tài liệu kèm đơn khởi kiện}", description: "Đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện}" },
  { group: "9. TÀI LIỆU CHỨNG CỨ", name: "{Tài liệu chứng cứ kèm theo}", description: "Đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện}" },
  { group: "9. TÀI LIỆU CHỨNG CỨ", name: "{Danh mục chứng cứ}", description: "Đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện}" },

  // =========================================================================
  // NHÓM 10: LIỆT KÊ KHỐI CẤU TRÚC ĐA ĐOẠN (THÔNG BÁO & BẢN ÁN)
  // =========================================================================
  { group: "10. KHỐI CẤU TRÚC VĨ MÔ", name: "{Đương sự thông báo}", description: "THỰC THỂ MẸ: Liệt kê dọc theo STT 1., 2., 3. cho phần Kính gửi của Thông báo tố tụng" },
  { group: "10. KHỐI CẤU TRÚC VĨ MÔ", name: "{ĐƯƠNG SỰ THÔNG BÁO}", description: "Đương sự thông báo tiêu đề IN HOA" },
  { group: "10. KHỐI CẤU TRÚC VĨ MÔ", name: "{Đương sự}", description: "THỰC THỂ MẸ TỐI CAO: Khối phân nhóm 1. Nguyên đơn:... 2. Bị đơn:... đầu Bản án, Quyết định" },
  { group: "10. KHỐI CẤU TRÚC VĨ MÔ", name: "{ĐƯƠNG SỰ}", description: "Khối phân nhóm đương sự tiêu đề IN HOA" },
  { group: "10. KHỐI CẤU TRÚC VĨ MÔ", name: "{Nội dung vụ việc}", description: "Chuỗi hoàn chỉnh: Tranh chấp ... giữa ông A với bà B (hoặc Yêu cầu ... của ông A và bà B)" },
  { group: "10. KHỐI CẤU TRÚC VĨ MÔ", name: "{NỘI DUNG VỤ VIỆC}", description: "Nội dung vụ việc viết IN HOA" },

  // =========================================================================
  // NHÓM 11: TIỀN TỐ TỤNG & XỬ LÝ ĐƠN KHỞI KIỆN (MẪU 01, 10)
  // =========================================================================
  { group: "11. ĐẶC THÙ XỬ LÝ ĐƠN", name: "{Những vấn đề cần sửa chữa bổ sung}", description: "THỰC THỂ MẸ: Báo cáo hiện trạng 3 phần (Hình thức, Nội dung, Chứng cứ) Mẫu 01, 10" },
  { group: "11. ĐẶC THÙ XỬ LÝ ĐƠN", name: "{NHỮNG VẤN ĐỀ CẦN SỬA CHỮA BỔ SUNG}", description: "Những vấn đề cần sửa chữa bổ sung tiêu đề IN HOA" },
  { group: "11. ĐẶC THÙ XỬ LÝ ĐƠN", name: "{Yêu cầu sửa đổi bổ sung}", description: "THỰC THỂ MẸ: Mệnh lệnh chỉ thị 3 phần của Tòa án Mẫu 01, 10" },
  { group: "11. ĐẶC THÙ XỬ LÝ ĐƠN", name: "{YÊU CẦU SỬA ĐỔI BỔ SUNG}", description: "Yêu cầu sửa đổi bổ sung tiêu đề IN HOA" },

  // =========================================================================
  // NHÓM 12: ĐẶC THÙ NGÀNH ÁN KHÁC (ĐẤT ĐAI, TÍN DỤNG, THỪA KẾ, LAO ĐỘNG)
  // =========================================================================
  { group: "12. THAM SỐ CHUYÊN NGÀNH", name: "{Tài sản tranh chấp}", description: "Thông tin thửa đất, căn nhà hoặc tài sản tranh chấp trong án Dân sự / Đất đai (Bất biến)" },
  { group: "12. THAM SỐ CHUYÊN NGÀNH", name: "{Vị trí tài sản tranh chấp}", description: "Vị trí thực địa thửa đất phục vụ QĐ xem xét thẩm định tại chỗ, định giá tài sản" },
  { group: "12. THAM SỐ CHUYÊN NGÀNH", name: "{Hợp đồng tín dụng}", description: "Số hợp đồng, ngày ký hợp đồng tín dụng và tài sản thế chấp trong án KDTM" },
  { group: "12. THAM SỐ CHUYÊN NGÀNH", name: "{Dư nợ tín dụng}", description: "Tổng dư nợ gốc, nợ lãi trong hạn và lãi quá hạn ngân hàng" },
  { group: "12. THAM SỐ CHUYÊN NGÀNH", name: "{Di sản thừa kế}", description: "Danh mục di sản, người để lại di sản và thời điểm mở thừa kế" },
  { group: "12. THAM SỐ CHUYÊN NGÀNH", name: "{Thiệt hại bồi thường}", description: "Hành vi gây thiệt hại và tổng số tiền yêu cầu bồi thường ngoài hợp đồng" },
  { group: "12. THAM SỐ CHUYÊN NGÀNH", name: "{Tranh chấp lao động}", description: "Loại hợp đồng lao động, mức lương căn cứ và yêu cầu giải quyết" }
];

function backend_GetAllPlaceholders() {
  return PLACEHOLDER_DEFINITIONS;
}