/**
 * =========================================================================
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V8.0 - MASTER PLACEHOLDER CONFIGURATION
 * TỆP: Config_Placeholders.gs - BẢNG TỪ ĐIỂN PLACEHOLDER TOÀN DIỆN CHUẨN TANDTC
 * -------------------------------------------------------------------------
 * - BỔ SUNG ĐẦY ĐỦ BỘ 3 DẠNG: {Tên} (Tiêu đề), {tên} (Viết thường), {TÊN} (IN HOA)
 * - TÍCH HỢP {Tài liệu kèm theo đơn khởi kiện} VÀ CÁC TỪ ĐỒNG NGHĨA (SYNONYMS)
 * - PHÂN RÃ TOÀN BỘ ĐƯƠNG SỰ ĐỘC LẬP TỪNG NGƯỜI (1, 2, 3...) VÀ TỔ HỢP GỘP
 * - QUẢN LÝ TẬP TRUNG PHỤC VỤ SOẠN THẢO VĂN BẢN, AI VÀ ĐỒNG BỘ SHEET 6_PLACEHOLDER
 * =========================================================================
 */

const PLACEHOLDER_DEFINITIONS = [
  // =========================================================================
  // NHÓM 1: THÔNG TIN VỤ ÁN, VIỆC DÂN SỰ & CƠ QUAN TỐ TỤNG
  // =========================================================================
  { group: "1. THÔNG TIN CHUNG", name: "{Số thụ lý}", description: "Số thụ lý đầy đủ (VD: 172/2026/TLST-DS hoặc 45/2026/TLST-VHN)" },
  { group: "1. THÔNG TIN CHUNG", name: "{số thụ lý}", description: "Số thụ lý đầy đủ dạng viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{SỐ THỤ LÝ}", description: "Số thụ lý đầy đủ dạng IN HOA" },
  { group: "1. THÔNG TIN CHUNG", name: "{Số thụ lý rút gọn}", description: "Chỉ lấy phần số của số thụ lý (VD: 172 hoặc 45)" },
  { group: "1. THÔNG TIN CHUNG", name: "{số thụ lý rút gọn}", description: "Số thụ lý rút gọn dạng viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Số đơn}", description: "Số đơn tiếp nhận trong Sổ nhận đơn (VD: 45)" },
  { group: "1. THÔNG TIN CHUNG", name: "{số đơn}", description: "Số đơn tiếp nhận viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Loại án}", description: "Tên loại án/việc đầy đủ (VD: Dân sự, Hôn nhân và gia đình, Kinh doanh thương mại, Hành chính, Việc dân sự)" },
  { group: "1. THÔNG TIN CHUNG", name: "{loại án}", description: "Tên loại án/việc viết thường (VD: dân sự, hôn nhân và gia đình)" },
  { group: "1. THÔNG TIN CHUNG", name: "{LOẠI ÁN}", description: "Tên loại án/việc viết IN HOA (VD: DÂN SỰ, HÔN NHÂN VÀ GIA ĐÌNH)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Loại án rút gọn}", description: "Ký hiệu loại án dùng tạo số quyết định/bản án (VD: DS, HNGĐ, VHN, KDTM, LĐ, HC, VDS, HGĐT)" },
  { group: "1. THÔNG TIN CHUNG", name: "{loại án rút gọn}", description: "Ký hiệu loại án rút gọn viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Phân loại đơn}", description: "Tên phân loại đơn tiếp nhận (VD: Dân sự, Hôn nhân, Hành chính, Việc dân sự)" },
  { group: "1. THÔNG TIN CHUNG", name: "{phân loại đơn}", description: "Tên phân loại đơn tiếp nhận viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Quan hệ tranh chấp}", description: "Tên quan hệ pháp luật tranh chấp hoặc tội danh" },
  { group: "1. THÔNG TIN CHUNG", name: "{quan hệ tranh chấp}", description: "Tên quan hệ pháp luật tranh chấp hoặc tội danh viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{QUAN HỆ TRANH CHẤP}", description: "Tên quan hệ tranh chấp viết IN HOA" },
  { group: "1. THÔNG TIN CHUNG", name: "{Tòa án}", description: "Tên cơ quan Tòa án giải quyết (VD: Tòa án nhân dân tỉnh Lâm Đồng)" },
  { group: "1. THÔNG TIN CHUNG", name: "{tòa án}", description: "Tên cơ quan Tòa án viết thường (VD: Tòa án nhân dân tỉnh Lâm Đồng)" },
  { group: "1. THÔNG TIN CHUNG", name: "{TÒA ÁN}", description: "Tên cơ quan Tòa án viết IN HOA (VD: TÒA ÁN NHÂN DÂN TỈNH LÂM ĐỒNG)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Địa chỉ tòa án}", description: "Trụ sở làm việc của Tòa án (Cấu hình trong Cài đặt)" },
  { group: "1. THÔNG TIN CHUNG", name: "{địa chỉ tòa án}", description: "Địa chỉ trụ sở Tòa án viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Chức vụ}", description: "Chức danh tố tụng của Thẩm phán (Mặc định: Thẩm phán)" },
  { group: "1. THÔNG TIN CHUNG", name: "{chức vụ}", description: "Chức danh tố tụng viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Số văn bản}", description: "Số Quyết định / Bản án phát hành (VD: 12)" },
  { group: "1. THÔNG TIN CHUNG", name: "{số văn bản}", description: "Số Quyết định / Bản án phát hành viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Năm ban hành}", description: "Năm ban hành văn bản (VD: 2026)" },
  { group: "1. THÔNG TIN CHUNG", name: "{năm ban hành}", description: "Năm ban hành văn bản viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Mã QR}", description: "Vị trí chèn mã QR tra cứu văn bản" },

  // CÁN BỘ TIẾN HÀNH TỐ TỤNG
  { group: "1. THÔNG TIN CHUNG", name: "{Danh xưng Thẩm phán}", description: "Danh xưng Thẩm phán: Ông / Bà" },
  { group: "1. THÔNG TIN CHUNG", name: "{danh xưng thẩm phán}", description: "Danh xưng Thẩm phán viết thường: ông / bà" },
  { group: "1. THÔNG TIN CHUNG", name: "{Họ và tên Thẩm phán}", description: "Họ và tên Thẩm phán (Tên mộc: Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{họ và tên thẩm phán}", description: "Họ và tên Thẩm phán viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thẩm phán}", description: "Họ và tên Thẩm phán in tại phần Chân chữ ký (Tên mộc: Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{thẩm phán}", description: "Tên Thẩm phán viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{THẨM PHÁN}", description: "Họ và tên Thẩm phán in IN HOA chân chữ ký" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thẩm phán đầy đủ}", description: "Danh xưng + Họ và tên Thẩm phán trong thân văn bản (VD: Ông Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{thẩm phán đầy đủ}", description: "Danh xưng + Họ và tên Thẩm phán viết thường (VD: ông Võ Thành Luân)" },
  { group: "1. THÔNG TIN CHUNG", name: "{Danh xưng Thư ký}", description: "Danh xưng Thư ký Tòa án: Bà / Ông" },
  { group: "1. THÔNG TIN CHUNG", name: "{danh xưng thư ký}", description: "Danh xưng Thư ký Tòa án viết thường: bà / ông" },
  { group: "1. THÔNG TIN CHUNG", name: "{Họ và tên Thư ký}", description: "Họ và tên Thư ký Tòa án (Tên mộc: Lường Thị Phương)" },
  { group: "1. THÔNG TIN CHUNG", name: "{họ và tên thư ký}", description: "Họ và tên Thư ký Tòa án viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thư ký}", description: "Họ và tên Thư ký in tại phần Chân chữ ký (Tên mộc: Lường Thị Phương)" },
  { group: "1. THÔNG TIN CHUNG", name: "{thư ký}", description: "Tên Thư ký viết thường" },
  { group: "1. THÔNG TIN CHUNG", name: "{THƯ KÝ}", description: "Họ và tên Thư ký in IN HOA chân chữ ký" },
  { group: "1. THÔNG TIN CHUNG", name: "{Thư ký đầy đủ}", description: "Danh xưng + Họ và tên Thư ký trong thân văn bản (VD: Bà Lường Thị Phương)" },
  { group: "1. THÔNG TIN CHUNG", name: "{thư ký đầy đủ}", description: "Danh xưng + Họ và tên Thư ký viết thường (VD: bà Lường Thị Phương)" },

  // =========================================================================
  // NHÓM 2: NGÀY THÁNG & LỊCH TRÌNH TỐ TỤNG
  // =========================================================================
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày thụ lý}", description: "Ngày thụ lý viết hoa đầu câu (VD: Ngày 29 tháng 08 năm 2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày thụ lý}", description: "Ngày thụ lý viết thường giữa câu (VD: ngày 29 tháng 08 năm 2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY THỤ LÝ}", description: "Ngày thụ lý viết IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày nhận đơn}", description: "Ngày nhận đơn viết hoa đầu câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày nhận đơn}", description: "Ngày nhận đơn viết thường giữa câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY NHẬN ĐƠN}", description: "Ngày nhận đơn viết IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày ban hành}", description: "Ngày ký văn bản viết hoa đầu câu (VD: Ngày 11 tháng 09 năm 2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày ban hành}", description: "Ngày ký văn bản viết thường giữa câu (VD: ngày 11 tháng 09 năm 2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY BAN HÀNH}", description: "Ngày ký văn bản viết IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Thời gian triệu tập}", description: "Giờ và ngày làm việc đầu câu (VD: 08 giờ 30 phút, ngày 15/09/2026)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{thời gian triệu tập}", description: "Giờ và ngày làm việc viết thường giữa câu" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{THỜI GIAN TRIỆU TẬP}", description: "Giờ và ngày làm việc viết IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Địa điểm}", description: "Địa điểm làm việc / Trụ sở Tòa án" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{địa điểm}", description: "Địa điểm làm việc viết thường" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Địa điểm làm việc}", description: "Địa điểm làm việc (Mặc định: Trụ sở Tòa án)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{địa điểm làm việc}", description: "Địa điểm làm việc viết thường" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Nội dung làm việc}", description: "Nội dung làm việc cụ thể trên Giấy triệu tập" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{nội dung làm việc}", description: "Nội dung làm việc cụ thể viết thường" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Thời gian gia hạn}", description: "Thời gian gia hạn (01 tháng hoặc 02 tháng)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{thời gian gia hạn}", description: "Thời gian gia hạn viết thường" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày gia hạn}", description: "Ngày ban hành Quyết định gia hạn (Hạn chuẩn bị trừ 5 ngày lùi ngày nghỉ)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày gia hạn}", description: "Ngày ban hành Quyết định gia hạn viết thường" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY GIA HẠN}", description: "Ngày ban hành Quyết định gia hạn viết IN HOA" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{Ngày hết hạn}", description: "Ngày hết hạn chuẩn bị xét xử (Đầu câu)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{ngày hết hạn}", description: "Ngày hết hạn chuẩn bị xét xử (Giữa câu)" },
  { group: "2. THỜI GIAN & NGÀY THÁNG", name: "{NGÀY HẾT HẠN}", description: "Ngày hết hạn chuẩn bị xét xử viết IN HOA" },

  // =========================================================================
  // NHÓM 3: ÁN PHÍ, LỆ PHÍ & BIÊN LAI THU TIỀN (NQ 326/2016)
  // =========================================================================
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Tạm ứng án phí bằng số}", description: "Mức tạm ứng án phí bằng số (VD: 300.000 đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{tạm ứng án phí bằng số}", description: "Mức tạm ứng án phí bằng số viết thường" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Tạm ứng án phí bằng chữ}", description: "Mức tạm ứng án phí bằng chữ (VD: Ba trăm nghìn đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{tạm ứng án phí bằng chữ}", description: "Mức tạm ứng án phí bằng chữ viết thường" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Án phí bằng số}", description: "Mức án phí tính toán bằng số (VD: 300.000 đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{án phí bằng số}", description: "Mức án phí tính toán bằng số viết thường" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Án phí bằng chữ}", description: "Mức án phí tính toán bằng chữ (VD: Ba trăm nghìn đồng)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{án phí bằng chữ}", description: "Mức án phí tính toán bằng chữ viết thường" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Biên lai tạm ứng án phí}", description: "Đoạn trích dẫn biên lai hoàn chỉnh" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{biên lai tạm ứng án phí}", description: "Đoạn trích dẫn biên lai hoàn chỉnh viết thường" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Thông tin biên lai án phí}", description: "Từ đồng nghĩa của {Biên lai tạm ứng án phí}" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Số biên lai}", description: "Số biên lai thu tiền tạm ứng (VD: 0001515)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{số biên lai}", description: "Số biên lai thu tiền tạm ứng viết thường" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Ngày biên lai}", description: "Ngày xuất biên lai thu tiền (VD: 24/07/2026)" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{ngày biên lai}", description: "Ngày xuất biên lai thu tiền viết thường" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{Cơ quan thu tiền}", description: "Tên cơ quan THADS thu tạm ứng án phí" },
  { group: "3. ÁN PHÍ & BIÊN LAI", name: "{cơ quan thu tiền}", description: "Tên cơ quan THADS thu tiền viết thường" },

  // =========================================================================
  // NHÓM 4: IN TÁCH TRANG HÀNG LOẠT (TRIỆU TẬP, THÔNG BÁO)
  // =========================================================================
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Họ và tên}", description: "Họ và tên từng đương sự khi in tách trang (Tiêu đề)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{họ và tên}", description: "Họ và tên từng đương sự viết chữ thường" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{HỌ VÀ TÊN}", description: "Họ và tên từng đương sự viết IN HOA" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Xưng hô}", description: "Danh xưng viết hoa (Ông / Bà / Anh / Chị)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{xưng hô}", description: "Danh xưng viết thường (ông / bà / anh / chị)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Tư cách}", description: "Tư cách tố tụng viết hoa (Nguyên đơn, Bị đơn...)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{tư cách}", description: "Tư cách tố tụng viết thường (nguyên đơn, bị đơn...)" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{TƯ CÁCH}", description: "Tư cách tố tụng viết IN HOA" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Năm sinh}", description: "Cụm từ: sinh năm 19xx" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{năm sinh}", description: "Cụm từ: sinh năm 19xx viết thường" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Địa chỉ}", description: "Địa chỉ cư trú hoặc trụ sở của đương sự" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{địa chỉ}", description: "Địa chỉ cư trú hoặc trụ sở viết thường" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Số điện thoại}", description: "Số điện thoại liên lạc của đương sự" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{số điện thoại}", description: "Số điện thoại liên lạc viết thường" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{CCCD}", description: "Số Căn cước công dân / CMND" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{cccd}", description: "Số Căn cước công dân / CMND viết thường" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{Người đại diện}", description: "Khối thông tin Người đại diện / Luật sư của đương sự" },
  { group: "4. IN TÁCH TRANG HÀNG LOẠT", name: "{người đại diện}", description: "Khối thông tin Người đại diện viết thường" },

  // =========================================================================
  // NHÓM 5: TỔ HỢP GỘP ĐƯƠNG SỰ CHO VỤ ÁN TRANH CHẤP
  // =========================================================================
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn}", description: "Xưng hô + Tên nhóm Nguyên đơn đầu câu (VD: Ông Phan Văn Thắng)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{nguyên đơn}", description: "Xưng hô + Tên nhóm Nguyên đơn giữa câu (VD: ông Phan Văn Thắng)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGUYÊN ĐƠN}", description: "Nhóm Nguyên đơn viết IN HOA (VD: ÔNG PHAN VĂN THẮNG)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người khởi kiện}", description: "Xưng hô + Tên nhóm Người khởi kiện đầu câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người khởi kiện}", description: "Xưng hô + Tên nhóm Người khởi kiện giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI KHỞI KIỆN}", description: "Nhóm Người khởi kiện viết IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Nguyên đơn" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{nguyên đơn chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Nguyên đơn (chữ thường)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGUYÊN ĐƠN CHI TIẾT}", description: "Khối Nguyên đơn chi tiết viết IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Danh sách Nguyên đơn}", description: "Danh sách Nguyên đơn gộp thông minh" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{danh sách nguyên đơn}", description: "Danh sách Nguyên đơn gộp thông minh viết thường" },

  // PHÂN RÃ NGUYÊN ĐƠN 1, 2, 3...
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn 1}", description: "Danh xưng + Họ tên Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{nguyên đơn 1}", description: "Danh xưng + Họ tên Nguyên đơn 1 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Nguyên đơn 1}", description: "Họ và tên mộc của Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{họ và tên nguyên đơn 1}", description: "Họ và tên mộc của Nguyên đơn 1 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Nguyên đơn 1}", description: "Năm sinh Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Nguyên đơn 1}", description: "Địa chỉ Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Số điện thoại Nguyên đơn 1}", description: "Số điện thoại Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{CCCD Nguyên đơn 1}", description: "Số CCCD Nguyên đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Nguyên đơn 2}", description: "Danh xưng + Họ tên Nguyên đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{nguyên đơn 2}", description: "Danh xưng + Họ tên Nguyên đơn 2 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Nguyên đơn 2}", description: "Họ và tên mộc của Nguyên đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{họ và tên nguyên đơn 2}", description: "Họ và tên mộc của Nguyên đơn 2 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Nguyên đơn 2}", description: "Năm sinh Nguyên đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Nguyên đơn 2}", description: "Địa chỉ Nguyên đơn 2" },

  // BỊ ĐƠN
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn}", description: "Xưng hô + Tên nhóm Bị đơn đầu câu (VD: Bà Khum Thị Bích Thủy)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{bị đơn}", description: "Xưng hô + Tên nhóm Bị đơn giữa câu (VD: bà Khum Thị Bích Thủy)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{BỊ ĐƠN}", description: "Nhóm Bị đơn viết IN HOA (VD: BÀ KHUM THỊ BÍCH THỦY)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người bị kiện}", description: "Xưng hô + Tên nhóm Người bị kiện đầu câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người bị kiện}", description: "Xưng hô + Tên nhóm Người bị kiện giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI BỊ KIỆN}", description: "Nhóm Người bị kiện viết IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Bị đơn" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{bị đơn chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Bị đơn (chữ thường)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{BỊ ĐƠN CHI TIẾT}", description: "Khối Bị đơn chi tiết viết IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Danh sách Bị đơn}", description: "Danh sách Bị đơn gộp thông minh" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{danh sách bị đơn}", description: "Danh sách Bị đơn gộp thông minh viết thường" },

  // PHÂN RÃ BỊ ĐƠN 1, 2, 3...
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn 1}", description: "Danh xưng + Họ tên Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{bị đơn 1}", description: "Danh xưng + Họ tên Bị đơn 1 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Bị đơn 1}", description: "Họ và tên mộc của Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{họ và tên bị đơn 1}", description: "Họ và tên mộc của Bị đơn 1 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Bị đơn 1}", description: "Năm sinh Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Bị đơn 1}", description: "Địa chỉ Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Số điện thoại Bị đơn 1}", description: "Số điện thoại Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{CCCD Bị đơn 1}", description: "Số CCCD Bị đơn 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Bị đơn 2}", description: "Danh xưng + Họ tên Bị đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{bị đơn 2}", description: "Danh xưng + Họ tên Bị đơn 2 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Bị đơn 2}", description: "Họ và tên mộc của Bị đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{họ và tên bị đơn 2}", description: "Họ và tên mộc của Bị đơn 2 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Năm sinh Bị đơn 2}", description: "Năm sinh Bị đơn 2" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Địa chỉ Bị đơn 2}", description: "Địa chỉ Bị đơn 2" },

  // LIÊN QUAN & LÀM CHỨNG
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người có quyền lợi, nghĩa vụ liên quan}", description: "Xưng hô + Tên nhóm Người liên quan đầu câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người có quyền lợi, nghĩa vụ liên quan}", description: "Xưng hô + Tên nhóm Người liên quan giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI CÓ QUYỀN LỢI, NGHĨA VỤ LIÊN QUAN}", description: "Nhóm Người liên quan viết IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người có quyền lợi, nghĩa vụ liên quan chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Người liên quan" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người có quyền lợi, nghĩa vụ liên quan chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Người liên quan (chữ thường)" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người có quyền lợi, nghĩa vụ liên quan 1}", description: "Danh xưng + Họ tên Người liên quan 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người có quyền lợi, nghĩa vụ liên quan 1}", description: "Danh xưng + Họ tên Người liên quan 1 viết thường" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Họ và tên Người có quyền lợi, nghĩa vụ liên quan 1}", description: "Họ tên mộc của Người liên quan 1" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người làm chứng}", description: "Xưng hô + Tên nhóm Người làm chứng đầu câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người làm chứng}", description: "Xưng hô + Tên nhóm Người làm chứng giữa câu" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{NGƯỜI LÀM CHỨNG}", description: "Nhóm Người làm chứng viết IN HOA" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{Người làm chứng chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Người làm chứng" },
  { group: "5. VỤ ÁN TRANH CHẤP", name: "{người làm chứng chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Người làm chứng (chữ thường)" },

  // =========================================================================
  // NHÓM 6: ĐẶC THÙ VIỆC DÂN SỰ & VIỆC HNGĐ (THUẬN TÌNH LY HÔN)
  // =========================================================================
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu}", description: "Tên Người yêu cầu (Thuận tình LH tự gom cả 2 vợ chồng)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người yêu cầu}", description: "Tên Người yêu cầu chữ thường (VD: ông Phan Văn Thắng và bà Khum Thị Bích Thủy)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NGƯỜI YÊU CẦU}", description: "Tên Người yêu cầu viết IN HOA" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu chi tiết}", description: "Thuận tình LH tự gom 2 vợ chồng chi tiết" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người yêu cầu chi tiết}", description: "Thuận tình LH tự gom 2 vợ chồng chi tiết (chữ thường)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NGƯỜI YÊU CẦU CHI TIẾT}", description: "Khối Người yêu cầu chi tiết viết IN HOA" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Danh sách Người yêu cầu}", description: "Danh sách Người yêu cầu gộp thông minh" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{danh sách người yêu cầu}", description: "Danh sách Người yêu cầu viết thường" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Danh sách NYC}", description: "Từ đồng nghĩa của {Danh sách Người yêu cầu}" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu 1}", description: "Danh xưng + Họ tên Người yêu cầu 1 (VD: Ông Phan Văn Thắng)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người yêu cầu 1}", description: "Danh xưng + Họ tên Người yêu cầu 1 viết thường" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Họ và tên Người yêu cầu 1}", description: "Họ và tên mộc của Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{họ và tên người yêu cầu 1}", description: "Họ và tên mộc của Người yêu cầu 1 viết thường" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Năm sinh Người yêu cầu 1}", description: "Năm sinh Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Địa chỉ Người yêu cầu 1}", description: "Địa chỉ Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Số điện thoại Người yêu cầu 1}", description: "Số điện thoại Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{CCCD Người yêu cầu 1}", description: "Số CCCD Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NYC1}", description: "Viết tắt Danh xưng + Họ tên Người yêu cầu 1" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{nyc1}", description: "Viết tắt Người yêu cầu 1 chữ thường" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người yêu cầu 2}", description: "Danh xưng + Họ tên Người yêu cầu 2 (VD: Bà Khum Thị Bích Thủy)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người yêu cầu 2}", description: "Danh xưng + Họ tên Người yêu cầu 2 viết thường" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Họ và tên Người yêu cầu 2}", description: "Họ và tên mộc của Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{họ và tên người yêu cầu 2}", description: "Họ và tên mộc của Người yêu cầu 2 viết thường" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Năm sinh Người yêu cầu 2}", description: "Năm sinh Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Địa chỉ Người yêu cầu 2}", description: "Địa chỉ Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Số điện thoại Người yêu cầu 2}", description: "Số điện thoại Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{CCCD Người yêu cầu 2}", description: "Số CCCD Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NYC2}", description: "Viết tắt Danh xưng + Họ tên Người yêu cầu 2" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{nyc2}", description: "Viết tắt Người yêu cầu 2 chữ thường" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người bị yêu cầu}", description: "Tên Người bị yêu cầu trong Việc dân sự" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người bị yêu cầu}", description: "Tên Người bị yêu cầu trong Việc dân sự (chữ thường)" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{NGƯỜI BỊ YÊU CẦU}", description: "Tên Người bị yêu cầu viết IN HOA" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{Người bị yêu cầu chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Người bị yêu cầu" },
  { group: "6. VIỆC HNGĐ & VIỆC DÂN SỰ", name: "{người bị yêu cầu chi tiết}", description: "Tên + Năm sinh + Địa chỉ sạch của Người bị yêu cầu (chữ thường)" },

  // =========================================================================
  // NHÓM 7: TỔNG HỢP LỜI KHAI TRANH CHẤP (PHẦN I CỦA BIÊN BẢN & BẢN ÁN)
  // =========================================================================
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai đương sự}", description: "Khối tổng hợp tự động toàn bộ lời khai: Nguyên đơn -> Bị đơn -> Người liên quan (CHỈ CHỨA LỜI KHAI/MÂU THUẪN, KHÔNG CHỨA THỎA THUẬN)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai đương sự}", description: "Khối tổng hợp lời khai đương sự viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{LỜI KHAI ĐƯƠNG SỰ}", description: "Khối tổng hợp lời khai các đương sự (dạng tiêu đề HOA)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Nguyên đơn}", description: "Khối lời khai của tất cả Nguyên đơn" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai nguyên đơn}", description: "Khối lời khai của Nguyên đơn viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Bị đơn}", description: "Khối lời khai của tất cả Bị đơn" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai bị đơn}", description: "Khối lời khai của Bị đơn viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người yêu cầu}", description: "Khối lời khai của tất cả Người yêu cầu (Việc HNGĐ & Việc Dân sự)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai người yêu cầu}", description: "Khối lời khai của Người yêu cầu viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người bị yêu cầu}", description: "Khối lời khai của Người bị yêu cầu (Việc Dân sự)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai người bị yêu cầu}", description: "Khối lời khai của Người bị yêu cầu viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người khởi kiện}", description: "Khối lời khai của Người khởi kiện (Án Hành chính)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai người khởi kiện}", description: "Khối lời khai của Người khởi kiện viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người bị kiện}", description: "Khối lời khai của Người bị kiện (Án Hành chính)" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai người bị kiện}", description: "Khối lời khai của Người bị kiện viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai Người có quyền lợi, nghĩa vụ liên quan}", description: "Khối lời khai của tất cả Người liên quan" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai người có quyền lợi, nghĩa vụ liên quan}", description: "Khối lời khai của Người liên quan viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Lời khai người làm chứng}", description: "Khối lời khai của tất cả Người làm chứng" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{lời khai người làm chứng}", description: "Khối lời khai của Người làm chứng viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{Nội dung vụ án}", description: "Diễn biến vụ án lắp ráp tuần tự phục vụ Bản án sơ thẩm" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{nội dung vụ án}", description: "Diễn biến vụ án viết thường" },
  { group: "7. TỔNG HỢP LỜI KHAI", name: "{NỘI DUNG VỤ ÁN}", description: "Diễn biến vụ án viết IN HOA" },

  // =========================================================================
  // NHÓM 8: NỘI DUNG THỎA THUẬN CHUNG (PHẦN II CỦA BIÊN BẢN HÒA GIẢI & QUYẾT ĐỊNH)
  // =========================================================================
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Nội dung thỏa thuận}", description: "THẺ CHỦ LỰC: Chứa toàn bộ nội dung thỏa thuận hòa giải (HNGĐ hoặc Dân sự)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{nội dung thỏa thuận}", description: "Nội dung thỏa thuận hòa giải (dạng viết thường)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{NỘI DUNG THỎA THUẬN}", description: "Nội dung thỏa thuận hòa giải (dạng IN HOA)" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{Nội dung hòa giải thành}", description: "Toàn bộ các điều khoản thỏa thuận thành công (Alias của {Nội dung thỏa thuận})" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{nội dung hòa giải thành}", description: "Toàn bộ các điều khoản thỏa thuận thành công viết thường" },
  { group: "8. THỎA THUẬN HÒA GIẢI", name: "{NỘI DUNG HÒA GIẢI THÀNH}", description: "Nội dung hòa giải thành viết IN HOA" },

  // =========================================================================
  // NHÓM 9: CÁC THẺ CON HNGĐ & QUYẾT ĐỊNH CÔNG NHẬN
  // =========================================================================
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Quan hệ hôn nhân}", description: "Nội dung: Ông Thắng và bà Thủy thuận tình ly hôn" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{quan hệ hôn nhân}", description: "Quan hệ hôn nhân (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{QUAN HỆ HÔN NHÂN}", description: "Quan hệ hôn nhân viết IN HOA" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Thỏa thuận ly hôn}", description: "Từ đồng nghĩa của {Quan hệ hôn nhân}" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{thỏa thuận ly hôn}", description: "Từ đồng nghĩa của {Quan hệ hôn nhân} (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{THỎA THUẬN LY HÔN}", description: "Thỏa thuận ly hôn viết IN HOA" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Tình trạng hôn nhân}", description: "Tóm tắt: Thời gian kết hôn, nơi đăng ký, nguyên nhân mâu thuẫn và ly thân" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{tình trạng hôn nhân}", description: "Tình trạng hôn nhân viết thường" },

  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Số con chung}", description: "Số lượng con chung (VD: 02 con chung hoặc Không có con chung)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{số con chung}", description: "Số lượng con chung viết thường" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Con chung}", description: "Chỉ danh sách nhân thân các con chung (Họ tên, ngày tháng năm sinh)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{con chung}", description: "Danh sách con chung (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{CON CHUNG}", description: "Danh sách con chung viết IN HOA" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Thỏa thuận con chung}", description: "Trọn gói cả 3 vế: [Danh sách con] + [Giao cho ai trực tiếp nuôi dưỡng] + [Cấp dưỡng]" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{thỏa thuận con chung}", description: "Thỏa thuận con chung trọn gói (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{THỎA THUẬN CON CHUNG}", description: "Thỏa thuận con chung viết IN HOA" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Cấp dưỡng nuôi con}", description: "Thỏa thuận cấp dưỡng nuôi con (VD: Ông Thắng cấp dưỡng 3.000.000đ/tháng hoặc Không tranh chấp)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{cấp dưỡng nuôi con}", description: "Thỏa thuận cấp dưỡng nuôi con (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{CẤP DƯỠNG NUÔI CON}", description: "Cấp dưỡng nuôi con viết IN HOA" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Cấp dưỡng con chung}", description: "Từ đồng nghĩa của {Cấp dưỡng nuôi con}" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{cấp dưỡng con chung}", description: "Từ đồng nghĩa của {Cấp dưỡng nuôi con} (chữ thường)" },

  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Tài sản chung}", description: "Thỏa thuận tài sản: Các bên tự thỏa thuận, không yêu cầu Tòa án giải quyết" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{tài sản chung}", description: "Thỏa thuận tài sản (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{TÀI SẢN CHUNG}", description: "Thỏa thuận tài sản viết IN HOA" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Nợ chung}", description: "Thỏa thuận nợ: Các bên xác nhận không có nợ chung, không yêu cầu Tòa án giải quyết" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{nợ chung}", description: "Thỏa thuận nợ (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{NỢ CHUNG}", description: "Thỏa thuận nợ viết IN HOA" },

  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Thỏa thuận án phí}", description: "Thỏa thuận án phí trọn gói (Mức án phí + Đối trừ biên lai tạm ứng)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{thỏa thuận án phí}", description: "Thỏa thuận án phí (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{THỎA THUẬN ÁN PHÍ}", description: "Thỏa thuận án phí viết IN HOA" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Án phí}", description: "Từ đồng nghĩa của {Thỏa thuận án phí}" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{án phí}", description: "Từ đồng nghĩa của {Thỏa thuận án phí} (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{ÁN PHÍ}", description: "Án phí viết IN HOA" },

  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Ngày hòa giải thành}", description: "Ngày lập biên bản hòa giải thành (VD: 07/09/2026 hoặc ngày 07 tháng 09 năm 2026)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{ngày hòa giải thành}", description: "Ngày lập biên bản hòa giải thành viết thường" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{NGÀY HÒA GIẢI THÀNH}", description: "Ngày lập biên bản hòa giải thành viết IN HOA" },

  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Quyền thăm nom con}", description: "Điều khoản quyền thăm nom con (Điều 82, 83 Luật HNGĐ 2014) - Tự sinh khi có con chung" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{quyền thăm nom con}", description: "Điều khoản quyền thăm nom con viết thường" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Quyền thăm con}", description: "Từ đồng nghĩa của {Quyền thăm nom con}" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{quyền thăm con}", description: "Từ đồng nghĩa của {Quyền thăm nom con} (chữ thường)" },

  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Lãi suất chậm thi hành án}", description: "Điều khoản lãi suất chậm trả (Điều 357, Điều 468 BLDS 2015) - Tự sinh khi có nghĩa vụ trả tiền" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{lãi suất chậm thi hành án}", description: "Điều khoản lãi suất chậm trả viết thường" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Lãi chậm trả}", description: "Từ đồng nghĩa của {Lãi suất chậm thi hành án}" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{lãi chậm trả}", description: "Từ đồng nghĩa của {Lãi suất chậm thi hành án} (chữ thường)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Điều luật chậm trả}", description: "Chuỗi điều luật chậm trả (Điều 357, Điều 468 BLDS)" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{điều luật chậm trả}", description: "Chuỗi điều luật chậm trả viết thường" },

  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Điều luật HNGĐ}", description: "Các điều luật viện dẫn chuẩn mực: Điều 28, 35, 39, 147, 212, 213 BLTTDS; Điều 55, 81, 82, 83, 84 Luật HNGĐ và NQ 326" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{điều luật hngđ}", description: "Các điều luật viện dẫn HNGĐ viết thường" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Thỏa thuận nghĩa vụ chính}", description: "Nghĩa vụ trả tiền, bàn giao đất trong án Dân sự/KDTM..." },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{thỏa thuận nghĩa vụ chính}", description: "Nghĩa vụ trả tiền, bàn giao đất viết thường" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Thời hạn và phương thức thực hiện}", description: "Thời gian trả nợ, phương thức chuyển khoản/tiền mặt" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{thời hạn và phương thức thực hiện}", description: "Thời gian trả nợ, phương thức thực hiện viết thường" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{Thỏa thuận chi phí tố tụng}", description: "Thỏa thuận về chi phí xem xét thẩm định tại chỗ, định giá tài sản" },
  { group: "9. THẺ CON HNGĐ & QUYẾT ĐỊNH", name: "{thỏa thuận chi phí tố tụng}", description: "Thỏa thuận chi phí tố tụng viết thường" },

  // =========================================================================
  // NHÓM 10: TÀI LIỆU CHỨNG CỨ KÈM THEO ĐƠN & THÔNG BÁO THỤ LÝ
  // =========================================================================
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{Tài liệu kèm theo đơn khởi kiện}", description: "Danh mục tài liệu chứng cứ kèm theo đơn khởi kiện / yêu cầu (Dùng cho Mẫu 03, 41, 53, 01)" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{tài liệu kèm theo đơn khởi kiện}", description: "Danh mục tài liệu chứng cứ kèm theo đơn khởi kiện viết thường" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{TÀI LIỆU KÈM THEO ĐƠN KHỞI KIỆN}", description: "Danh mục tài liệu chứng cứ kèm theo đơn khởi kiện viết IN HOA" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{Tài liệu kèm đơn khởi kiện}", description: "Từ đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện}" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{tài liệu kèm đơn khởi kiện}", description: "Từ đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện} (chữ thường)" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{TÀI LIỆU KÈM ĐƠN KHỞI KIỆN}", description: "Từ đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện} viết IN HOA" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{Tài liệu chứng cứ kèm theo}", description: "Từ đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện}" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{tài liệu chứng cứ kèm theo}", description: "Từ đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện} (chữ thường)" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{Danh mục chứng cứ}", description: "Từ đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện}" },
  { group: "10. TÀI LIỆU CHỨNG CỨ", name: "{danh mục chứng cứ}", description: "Từ đồng nghĩa của {Tài liệu kèm theo đơn khởi kiện} (chữ thường)" },

  // =========================================================================
  // NHÓM 11: LIỆT KÊ KHỐI DANH SÁCH (THÔNG BÁO & BẢN ÁN)
  // =========================================================================
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{Đương sự thông báo}", description: "Liệt kê dọc theo STT 1, 2, 3 (Dành cho phần Kính gửi của Thông báo thụ lý)" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{đương sự thông báo}", description: "Liệt kê dọc theo STT 1, 2, 3 viết thường" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{ĐƯƠNG SỰ THÔNG BÁO}", description: "Liệt kê dọc theo STT 1, 2, 3 (Dạng tiêu đề HOA)" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{Đương sự}", description: "Liệt kê dọc phân nhóm Nguyên đơn:... Bị đơn:... (Dành cho phần Đầu Bản án, Quyết định)" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{đương sự}", description: "Liệt kê dọc phân nhóm viết thường" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{ĐƯƠNG SỰ}", description: "Liệt kê dọc phân nhóm Nguyên đơn:... Bị đơn:... (Dạng tiêu đề HOA)" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{Nội dung vụ việc}", description: "Tự động chuẩn hóa câu chữ: 'Tranh chấp...' giữa A và B HOẶC 'Yêu cầu...' của A và B" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{nội dung vụ việc}", description: "Nội dung vụ việc viết thường" },
  { group: "11. LIỆT KÊ KHỐI DANH SÁCH", name: "{NỘI DUNG VỤ VIỆC}", description: "Nội dung vụ việc viết IN HOA" },

  // =========================================================================
  // NHÓM 12: ĐẶC THÙ NGÀNH ÁN KHÁC (ĐẤT ĐAI, TÍN DỤNG, THỪA KẾ, LAO ĐỘNG...)
  // =========================================================================
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{Tài sản tranh chấp}", description: "Thông tin thửa đất, nhà ở hoặc tài sản tranh chấp trong án Dân sự / Đất đai" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{tài sản tranh chấp}", description: "Thông tin tài sản tranh chấp viết thường" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{Vị trí tài sản tranh chấp}", description: "Vị trí thực địa phục vụ Quyết định xem xét thẩm định tại chỗ, định giá tài sản" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{vị trí tài sản tranh chấp}", description: "Vị trí thực địa tài sản viết thường" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{Hợp đồng tín dụng}", description: "Số hợp đồng, ngày ký hợp đồng tín dụng và tài sản thế chấp trong án KDTM" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{hợp đồng tín dụng}", description: "Thông tin hợp đồng tín dụng viết thường" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{Dư nợ tín dụng}", description: "Tổng dư nợ gốc, nợ lãi trong hạn và lãi quá hạn ngân hàng" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{dư nợ tín dụng}", description: "Tổng dư nợ tín dụng viết thường" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{Di sản thừa kế}", description: "Danh mục di sản, người để lại di sản và thời điểm mở thừa kế" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{di sản thừa kế}", description: "Danh mục di sản thừa kế viết thường" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{Thiệt hại bồi thường}", description: "Hành vi gây thiệt hại và tổng số tiền yêu cầu bồi thường ngoài hợp đồng" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{thiệt hại bồi thường}", description: "Yêu cầu bồi thường thiệt hại viết thường" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{Tranh chấp lao động}", description: "Loại hợp đồng lao động, mức lương căn cứ và yêu cầu giải quyết" },
  { group: "12. ĐẶC THÙ NGÀNH ÁN KHÁC", name: "{tranh chấp lao động}", description: "Nội dung tranh chấp lao động viết thường" }
];

function backend_GetAllPlaceholders() {
  return PLACEHOLDER_DEFINITIONS;
}