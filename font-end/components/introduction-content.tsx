export function IntroductionContent() {
  return (
    <div className="container">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#b45f06]">GIỚI THIỆU</h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">LỊCH SỬ HÌNH THÀNH</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="mb-4">
                Lữ đoàn 279 được thành lập vào ngày 15 tháng 7 năm 1975, tiền thân là Trung đoàn 79 thuộc Sư đoàn 309.
                Trải qua nhiều giai đoạn phát triển, đến nay Lữ đoàn đã trở thành một đơn vị mạnh với đầy đủ các phân
                đội và hệ thống hậu cần hiện đại.
              </p>
              <p>
                Với phương châm "Đoàn kết - Kỷ cương - Sáng tạo - Hiệu quả", Lữ đoàn 279 luôn hoàn thành xuất sắc mọi
                nhiệm vụ được giao, góp phần bảo vệ vững chắc chủ quyền lãnh thổ và an ninh quốc gia.
              </p>
            </div>
            <div className="bg-gray-200 h-64 flex items-center justify-center">
              <p className="text-gray-500">Hình ảnh lịch sử Lữ đoàn</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">THÀNH TÍCH ĐẠT ĐƯỢC</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Huân chương Chiến công hạng Nhất (2010)</li>
            <li>Đơn vị Quyết thắng (2015-2020)</li>
            <li>Đơn vị nuôi quân giỏi, quản lý quân nhu tốt (2018-2022)</li>
            <li>Bằng khen của Bộ Quốc phòng về thành tích xuất sắc trong huấn luyện (2021)</li>
            <li>Cờ thi đua của Quân khu 7 (2022)</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">CƠ CẤU TỔ CHỨC</h3>
          <div className="border border-gray-300 p-4 rounded-md">
            <h4 className="font-semibold mb-2 text-center">SƠ ĐỒ TỔ CHỨC LỮ ĐOÀN 279</h4>
            <div className="bg-gray-200 h-80 flex items-center justify-center">
              <p className="text-gray-500">Sơ đồ tổ chức Lữ đoàn 279</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
