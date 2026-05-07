/**
 * HỆ THỐNG TRỢ LÝ GIẢI QUYẾT ÁN V7.6.0 - GROQ AI EDITION
 * FILE: Config_Placeholders.gs
 * CHỨC NĂNG: Quản lý tập trung toàn bộ nhãn (Placeholders) siêu chi tiết.
 */

const PLACEHOLDER_DEFINITIONS = [
  // --- NHÓM 1: THÔNG TIN VỤ ÁN CHUNG ---
  { name: "{Số thụ lý}", description: "Số thụ lý đầy đủ (VD: 172/2026/TLST-HNGĐ)", usage: "Copy dán vào Word" },
  { name: "{Số thụ lý rút gọn}", description: "Chỉ lấy phần số của số thụ lý (VD: 172)", usage: "Copy dán vào Word" },
  { name: "{Loại án}", description: "Tên loại án đầy đủ (VD: Hôn nhân và gia đình)", usage: "Copy dán vào Word" },
  { name: "{Loại án rút gọn}", description: "Ký hiệu loại án (VD: DS, HS, HNGĐ, KDTM)", usage: "Copy dán vào Word" },
  { name: "{Quan hệ tranh chấp}", description: "Tên quan hệ tranh chấp hoặc tội danh", usage: "Copy dán vào Word" },
  { name: "{Nội dung vụ việc}", description: "Tự động ghép: [Quan hệ] giữa [Nguyên đơn] và [Bị đơn]", usage: "Copy dán vào Word" },
  
  // --- NHÓM 2: NGÀY THÁNG & THỜI GIAN ---
  { name: "{Ngày thụ lý}", description: "Ngày thụ lý có viết hoa (VD: Ngày 05 tháng 02 năm 2026)", usage: "Đứng đầu câu" },
  { name: "{ngày thụ lý}", description: "Ngày thụ lý viết thường (VD: ngày 05 tháng 02 năm 2026)", usage: "Giữa câu" },
  { name: "{Ngày ban hành}", description: "Ngày ký văn bản (Có chữ Ngày)", usage: "Ký phát hành" },
  { name: "{ngày ban hành}", description: "Ngày ký văn bản (chữ ngày viết thường)", usage: "Giữa câu" },
  { name: "{Năm ban hành}", description: "Chỉ lấy năm hiện tại xuất văn bản (VD: 2026)", usage: "Dùng để tạo Số Quyết định" },
  { name: "{Thời gian triệu tập}", description: "Giờ và ngày làm việc (VD: 08 giờ 30 phút, ngày 10/05/2026)", usage: "Giấy triệu tập, Thông báo" },
  { name: "{Địa điểm làm việc}", description: "Nơi diễn ra buổi làm việc/xét xử", usage: "Mặc định: Trụ sở tòa án" },
  { name: "{Thời gian gia hạn}", description: "Tự động ra 01 tháng (KDTM, HS) hoặc 02 tháng", usage: "Dùng cho Quyết định gia hạn" },
  { name: "{Ngày gia hạn}", description: "Ngày trước 5 ngày của ngày hết hạn", usage: "Dành cho Thẩm phán" },
  { name: "{Ngày hết hạn}", description: "Ngày cuối cùng của thời hạn", usage: "Dành cho Thẩm phán" },
  { name: "{Số văn bản}", description: "Số QĐ/Bản án nhập ở khung Soạn thảo", usage: "Tự động điền số phát hành" },

  // --- NHÓM 3: CƠ QUAN & NGƯỜI TIẾN HÀNH TỐ TỤNG ---
  { name: "{Thẩm phán}", description: "Họ tên Thẩm phán (Từ phần Cài đặt)", usage: "Copy dán vào Word" },
  { name: "{Thư ký}", description: "Họ tên Thư ký (Từ phần Cài đặt)", usage: "Copy dán vào Word" },
  { name: "{Chức vụ}", description: "Chức danh (VD: Thẩm phán)", usage: "Copy dán vào Word" },
  { name: "{Tòa án}", description: "Tên cơ quan Tòa án", usage: "VD: Tòa án nhân dân huyện X" },
  { name: "{Nội dung làm việc}", description: "Nội dung ghi chú thêm nhập ở Form xuất văn bản", usage: "Copy dán vào Word" },

  // --- NHÓM 4: TRỘN TÁCH TRANG TỰ ĐỘNG (Dùng in Giấy triệu tập) ---
  { name: "{Họ và tên}", description: "Tên đương sự (Hệ thống tự tách trang cho từng người)", usage: "Dùng in hàng loạt" },
  { name: "{Xưng hô}", description: "Ông/Bà/Anh/Chị... (Viết hoa chữ đầu)", usage: "Dùng in hàng loạt" },
  { name: "{xưng hô}", description: "ông/bà/anh/chị... (Viết thường)", usage: "Dùng in hàng loạt" },
  { name: "{Địa chỉ}", description: "Địa chỉ cư trú/trụ sở", usage: "Dùng in hàng loạt" },
  { name: "{Tư cách}", description: "Tư cách tố tụng", usage: "Dùng in hàng loạt" },
  { name: "{Năm sinh}", description: "Cụm từ 'sinh năm 19xx'", usage: "Dùng in hàng loạt" },
  { name: "{CCCD}", description: "Số Căn cước / CMND", usage: "Dùng in hàng loạt" },

  // --- NHÓM 5: CHUỖI GỘP THÔNG MINH (Dùng cho Bản án, Quyết định) ---
  // *Lưu ý: Tùy loại án, chữ "Nguyên đơn" sẽ tự đổi thành "Bị hại", "Người khởi kiện", "Người yêu cầu"...
  { name: "{Nguyên đơn}", description: "Xưng hô + Họ tên (VD: Ông Nguyễn Văn A)", usage: "Soạn gộp" },
  { name: "{nguyên đơn}", description: "xưng hô + Họ tên (VD: ông Nguyễn Văn A)", usage: "Soạn gộp" },
  { name: "{Nguyên đơn chi tiết}", description: "Xưng hô + Tên + Năm sinh + Địa chỉ", usage: "Soạn gộp" },
  { name: "{nguyên đơn chi tiết}", description: "xưng hô + Tên + Năm sinh + Địa chỉ (Viết thường)", usage: "Soạn gộp" },
  
  { name: "{Bị đơn}", description: "Xưng hô + Họ tên (VD: Bà Trần Thị B)", usage: "Soạn gộp" },
  { name: "{bị đơn}", description: "xưng hô + Họ tên (VD: bà Trần Thị B)", usage: "Soạn gộp" },
  { name: "{Bị đơn chi tiết}", description: "Xưng hô + Tên + Năm sinh + Địa chỉ", usage: "Soạn gộp" },
  { name: "{bị đơn chi tiết}", description: "xưng hô + Tên + Năm sinh + Địa chỉ (Viết thường)", usage: "Soạn gộp" },

  // --- NHÓM 6: KHỐI DANH SÁCH LIỆT KÊ TỰ ĐỘNG ---
  { name: "{Đương sự thông báo}", description: "Liệt kê số thứ tự (1. Ông A...; 2. Bà B...)", usage: "Dành cho phần Kính gửi" },
  { name: "{Đương sự}", description: "Liệt kê phân nhóm (Nguyên đơn: ... Bị đơn: ...)", usage: "Dành cho phần Nội dung" }
];

function backend_GetAllPlaceholders() {
  return PLACEHOLDER_DEFINITIONS;
}