import Image from "next/image"

export function IntroductionContent() {
  return (
    <div className="w-full p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-[#b45f06]">
          LỮ ĐOÀN CÔNG BINH HỖN HỢP 279 - ANH HÙNG TRONG XÂY DỰNG VÀ CHIẾN ĐẤU
        </h2>

        {/* Featured Content Section */}
        <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-8 rounded-lg mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              
              <Image
                  src="/images/logo-ludoan.png"
                  alt="Lữ đoàn Công binh hỗn hợp 279"
                  width={40}
                  height={40}
                  style={{ width: '40', height: '40' }}
                />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Lữ đoàn Công binh hỗn hợp 279</h2>
              <p className="text-green-100">Truyền thống vẻ vang - Anh hùng trong xây dựng và chiến đấu</p>
            </div>
          </div>
          
          {/* Layout 2 cột: Ảnh bên trái, nội dung bên phải */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Cột ảnh bên trái */}
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/anh.jpg"
                  alt="Lữ đoàn Công binh hỗn hợp 279"
                  width={500}
                  height={350}
                  className="w-full h-64 object-cover"
                  style={{ width: 'auto', height: 'auto' }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium">Lữ đoàn Công binh hỗn hợp 279</p>
                </div>
              </div>
              
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <div className="w-full h-64 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Image
                      src="/images/logo-binchung.png"
                      alt="Lữ đoàn Công binh hỗn hợp 279"
                      width={40}
                      height={40}
                      style={{ width: '40', height: '40' }}
                    />
                    <p className="text-lg font-bold">MỞ ĐƯỜNG THẮNG LỢI</p>
                    <p className="text-sm">Truyền thống vẻ vang</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium">Tinh thần "Mở đường thắng lợi"</p>
                </div>
              </div>
            </div>

            {/* Cột nội dung bên phải */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-3 text-yellow-300">
                  🏛️ Lữ đoàn Công binh hỗn hợp 279
                </h3>
                <p className="text-white/90 mb-4 leading-relaxed">
                  Lữ đoàn Công binh hỗn hợp 279 trực thuộc Binh chủng Công binh là một trong 
                  những đơn vị có cống hiến to lớn, có truyền thống anh hùng, được hình thành và 
                  phát triển vững mạnh trong thời kỳ xây dựng chủ nghĩa xã hội và Tổ quốc Việt Nam.
                </p>
                
                <div className="bg-white/20 rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-yellow-200 mb-2">📅 Thông tin cơ bản:</h4>
                  <ul className="text-white/90 text-sm space-y-1">
                    <li><strong>Thành lập:</strong> 12/8/1972</li>
                    <li><strong>Tuổi đời:</strong> Hơn 53 năm xây dựng và phát triển</li>
                    <li><strong>Thuộc:</strong> Binh chủng Công binh</li>
                    <li><strong>Truyền thống:</strong> "Mở đường thắng lợi"</li>
                  </ul>
                </div>

                <blockquote className="border-l-4 border-yellow-300 pl-4 bg-white/10 p-3 rounded-r-lg">
                  <p className="italic text-yellow-100 font-medium">
                    "Mở đường, xây dựng những trình chiến đấu, rà phá bom mìn, đảm bảo giao thông vận tải 
                    và bảo vệ các tuyến đường huyết mạch..."
                  </p>
                  <footer className="text-yellow-200 text-sm mt-2">
                    - Nhiệm vụ của Lữ đoàn 279
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Nội dung chi tiết với layout 2 cột */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột nội dung chính (2/3 chiều rộng) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Quá trình hình thành và phát triển</h2>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border-l-4 border-amber-500 mb-6">
                <h4 className="font-bold text-amber-800 mb-3">🏛️ Lễ thành lập trang nghiêm:</h4>
                <p className="text-amber-700 mb-3 leading-relaxed">
                  <strong>Ngày 12 tháng 8 năm 1972</strong>, tại làng Hoàng Mai, huyện Việt Yên, tỉnh Hà Bắc (nay là tỉnh Bắc Giang), 
                  Lễ thành lập Trung đoàn được tổ chức trang nghiêm, với khí thế sẵn sàng chiến đấu cao. 
                  Thành lập vào những ngày tháng 8 lịch sử nên Trung đoàn vinh dự được đặt tên gọi là 
                  <strong>"Đoàn Công binh Tháng Tám"</strong>.
                </p>
                <div className="bg-amber-100 p-4 rounded-lg">
                  <h5 className="font-bold text-amber-800 mb-2">👥 Lãnh đạo ban đầu:</h5>
                  <ul className="text-amber-700 space-y-1">
                    <li><strong>Đồng chí Hà Đức Tân</strong> - Trung đoàn trưởng</li>
                    <li><strong>Đồng chí Đỗ Đình Nha</strong> - Chính ủy</li>
                  </ul>
                </div>
              </div>
              
              <p className="text-lg leading-8 mb-6 text-justify">
                <strong>Lữ đoàn 279 được thành lập ngày 12 tháng 8 năm 1972</strong>, trong bối cảnh cuộc kháng chiến chống Mỹ của nhân dân Việt Nam đang diễn ra quyết liệt. Ngay từ những ngày đầu tiên, lữ đoàn đã đảm nhiệm nhiệm vụ đặc biệt quan trọng: <strong>mở đường, xây dựng những trình chiến đấu, rà phá bom mìn, đảm bảo giao thông vận tải và bảo vệ các tuyến đường huyết mạch</strong>, phục vụ trực tiếp cho các chiến dịch lớn ở chiến trường miền Nam và miền Bắc.
              </p>

              <div className="bg-red-50 p-6 rounded-lg mb-6 border-l-4 border-red-500">
                <h4 className="font-bold text-red-800 mb-3">⚔️ Nhiệm vụ thời kỳ kháng chiến:</h4>
                <p className="text-red-700 mb-3">
                  Trong suốt cuộc kháng chiến chống Mỹ, đơn vị đã vượt qua muôn vàn khó khăn, gian khổ, không quản hy sinh, bám trụ trên các địa bàn chiến lược quan trọng:
                </p>
                <div className="space-y-4">
                  <div className="bg-red-100 p-4 rounded-lg">
                    <h5 className="font-bold text-red-800 mb-2">🛣️ Khôi phục và xây dựng tuyến đường:</h5>
                    <ul className="list-disc pl-6 space-y-1 text-red-700">
                      <li>Khôi phục tuyến đường từ <strong>Hòa Bình đến Thanh Hóa</strong></li>
                      <li>Khôi phục tuyến đường từ <strong>Nghệ An đến Hà Tĩnh</strong></li>
                      <li>Bảo đảm đường cơ động vận chuyển trên tuyến <strong>Tây Trường Sơn nối Đông Trường Sơn</strong></li>
                      <li>Bảo đảm cho Quân đoàn 1 vượt ngầm <strong>Bến Bào (qua Sông Bé)</strong> sang Đồng Xoài, Phước Vĩnh</li>
                      <li>Nối liền với <strong>Đường 14</strong> cho đại quân tiến vào Sài Gòn, giải phóng hoàn toàn miền Nam</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-100 p-4 rounded-lg">
                    <h5 className="font-bold text-red-800 mb-2">✈️ Xây dựng công trình hàng không:</h5>
                    <ul className="list-disc pl-6 space-y-1 text-red-700">
                      <li>Giúp bạn Lào xây dựng <strong>sân bay dã chiến Na Cay</strong></li>
                      <li>Cùng với các Trung đoàn Công binh Công trình 229, 259, 289 tổ chức thi công <strong>sân bay Nội Bài</strong></li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-100 p-4 rounded-lg">
                    <h5 className="font-bold text-red-800 mb-2">🏰 Xây dựng công trình phòng thủ:</h5>
                    <ul className="list-disc pl-6 space-y-1 text-red-700">
                      <li>Khu vực biên giới phía Bắc: xây dựng <strong>công trình chiến đấu, hầm trú ẩn</strong></li>
                      <li>Làm đường, bố trí vật cản trên các địa bàn <strong>Hoàng Liên Sơn, Lạng Sơn</strong></li>
                      <li>Trên đảo tiền tiêu thuộc <strong>Đặc khu Quảng Ninh</strong></li>
                      <li>Nhiệm vụ <strong>quai đê lấn biển Cồn Thoi</strong> nay là xã Kim Trung, huyện Kim Sơn, tỉnh Ninh Bình</li>
                    </ul>
                  </div>
                </div>
                <p className="text-red-700 mt-3 font-medium">
                  ✅ <strong>Hoàn thành xuất sắc mọi nhiệm vụ được giao, góp phần quan trọng vào thắng lợi của dân tộc.</strong>
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h4 className="font-bold text-blue-800 mb-3">🏗️ Thời kỳ xây dựng và bảo vệ Tổ quốc:</h4>
                <p className="text-blue-700 mb-3">
                  Sau ngày đất nước thống nhất, bước vào thời kỳ xây dựng và bảo vệ Tổ quốc, Lữ đoàn 279 tiếp tục phát huy truyền thống <strong>"Mở đường thắng lợi"</strong>, tham gia nhiều nhiệm vụ quan trọng:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-blue-700">
                  <li>Thi công các <strong>công trình quan trọng</strong> phục vụ phát triển kinh tế</li>
                  <li>Làm nhiệm vụ <strong>rà phá bom mìn sau chiến tranh</strong></li>
                  <li><strong>Khắc phục hậu quả thiên tai</strong> và cứu hộ cứu nạn</li>
                  <li>Tham gia <strong>xây dựng nông thôn mới</strong></li>
                </ul>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Truyền thống và phẩm chất tiêu biểu</h3>
              
              <p className="text-lg leading-8 mb-6 text-justify">
                Trải qua <strong>hơn 53 năm xây dựng, chiến đấu và trưởng thành</strong>, các thế hệ cán bộ, chiến sĩ Lữ đoàn luôn giữ vững bản lĩnh chính trị vững vàng, tinh thần hy sinh nghiêm khoan, không sợ gian khổ, hy sinh vì lý tưởng cao đẹp.
              </p>

              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <h4 className="font-bold text-yellow-800 mb-3">🏆 Danh hiệu và huân chương cao quý:</h4>
                <p className="text-yellow-700 mb-4">
                  Với những thành tích xuất sắc và cống hiến to lớn trong các thời kỳ lịch sử, <strong>Lữ đoàn Công binh hỗn hợp 279</strong> đã được Đảng, Nhà nước tặng thưởng:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <h5 className="font-bold text-yellow-800 mb-2">🥇 Danh hiệu cao quý:</h5>
                    <ul className="space-y-1 text-yellow-700">
                      <li className="flex items-center gap-2">
                        <span className="text-red-600">⭐</span>
                        <span><strong>Danh hiệu Anh hùng Lực lượng vũ trang nhân dân</strong></span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <h5 className="font-bold text-yellow-800 mb-2">🎖️ Huân chương Quân công:</h5>
                    <ul className="space-y-1 text-yellow-700">
                      <li className="flex items-center gap-2">
                        <span className="text-bronze-600">🏅</span>
                        <span>01 Huân chương Quân công hạng Ba</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <h5 className="font-bold text-yellow-800 mb-2">🏅 Huân chương Chiến công:</h5>
                    <ul className="space-y-1 text-yellow-700">
                      <li>05 Huân chương Chiến công hạng Nhất</li>
                      <li>01 Huân chương Chiến công hạng Nhì</li>
                      <li>17 Huân chương Chiến công hạng Ba</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <h5 className="font-bold text-yellow-800 mb-2">🛡️ Huân chương Bảo vệ Tổ quốc:</h5>
                    <ul className="space-y-1 text-yellow-700">
                      <li>01 Huân chương Bảo vệ Tổ quốc hạng Nhất</li>
                      <li>02 Huân chương Bảo vệ Tổ quốc hạng Ba</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-100 p-4 rounded-lg mt-4">
                  <p className="text-yellow-800 font-semibold text-center">
                    🎖️ <strong>"MỞ ĐƯỜNG THẮNG LỢI"</strong> 🎖️<br/>
                    <span className="text-sm">Truyền thống vẻ vang được lưu truyền qua các thế hệ</span>
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h4 className="font-bold text-green-800 mb-3">💪 Phẩm chất nổi bật:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-green-700 font-medium">Bản lĩnh chính trị vững vàng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-green-700 font-medium">Tinh thần hy sinh nghiêm khoan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-green-700 font-medium">Không sợ gian khổ</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-green-700 font-medium">Ý chí kiên cường bất khuất</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-green-700 font-medium">Tinh thần đoàn kết cao</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-green-700 font-medium">Sẵn sàng hy sinh vì Tổ quốc</span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Hướng tới tương lai</h3>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-bold text-purple-800 mb-3">🚀 Nhiệm vụ trong thời kỳ mới:</h4>
                <p className="text-purple-700 mb-4 text-lg leading-relaxed">
                  Bước vào thời kỳ mới với nhiều thời cơ và thách thức đan xen, <strong>Lữ đoàn 279</strong> tiếp tục phát huy truyền thống anh hùng, không ngừng đổi mới, xây dựng đơn vị vững mạnh toàn diện:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-purple-700">
                  <li><strong>Xây dựng đơn vị chính quy, tinh nhuệ, hiện đại</strong></li>
                  <li><strong>Rèn luyện bộ đội tinh nhuệ</strong>, sẵn sàng chiến đấu</li>
                  <li><strong>Đổi mới phương pháp huấn luyện</strong> phù hợp với yêu cầu mới</li>
                  <li><strong>Sẵn sàng hoàn thành mọi nhiệm vụ</strong> được Đảng và Nhà nước giao</li>
                </ul>
              </div>

              <blockquote className="border-l-4 border-blue-500 pl-6 my-6 bg-blue-50 p-4 rounded-r-lg">
                <p className="italic text-blue-800 text-lg font-semibold leading-relaxed">
                  "Với truyền thống vẻ vang 'Mở đường thắng lợi', Lữ đoàn 279 sẽ tiếp tục là lực lượng nòng cốt, 
                  sẵn sàng thực hiện mọi nhiệm vụ trong xây dựng và bảo vệ Tổ quốc, góp phần xây dựng đất nước 
                  Việt Nam ngày càng giàu mạnh, văn minh."
                </p>
                <footer className="text-blue-600 mt-3 font-medium">
                  - Phương hướng phát triển của Lữ đoàn 279
                </footer>
              </blockquote>

              <div className="bg-gradient-to-r from-red-50 to-yellow-50 p-6 rounded-lg border border-red-200">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-red-800 mb-2">🇻🇳 VINH QUANG LỮĐOÀN 279 🇻🇳</h4>
                  <p className="text-red-700 font-semibold text-lg">
                    ANH HÙNG TRONG XÂY DỰNG VÀ CHIẾN ĐẤU
                  </p>
                  <p className="text-red-600 mt-2">
                    "Mở đường thắng lợi - Truyền thống bất diệt"
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar bên phải (1/3 chiều rộng) */}
            <div className="space-y-6">
              {/* Thông tin nhanh */}
              <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-blue-600">ℹ️</span>
                  Thông tin cơ bản
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thành lập:</span>
                    <span className="font-medium">12/8/1972</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuổi đời:</span>
                    <span className="font-medium">53+ năm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trực thuộc:</span>
                    <span className="font-medium">Binh chủng Công binh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Truyền thống:</span>
                    <span className="font-medium">"Mở đường thắng lợi"</span>
                  </div>
                </div>
              </div>

              {/* Ảnh bổ sung */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-green-600">🛡️</span>
                  Biểu tượng và Truyền thống
                </h3>
                
                <div className="relative rounded-lg overflow-hidden shadow-md">
                  <div className="w-full h-48 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <span className="text-4xl mb-2 block">⚔️</span>
                      <p className="text-lg font-bold">KHÁNG CHIẾN</p>
                      <p className="text-sm">1972 - 1975</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-xs">Thời kỳ kháng chiến chống Mỹ</p>
                  </div>
                </div>
                
                <div className="relative rounded-lg overflow-hidden shadow-md">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <span className="text-4xl mb-2 block">🏗️</span>
                      <p className="text-lg font-bold">XÂY DỰNG</p>
                      <p className="text-sm">1975 - nay</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-xs">Xây dựng và bảo vệ Tổ quốc</p>
                  </div>
                </div>
              </div>

              {/* Thống kê */}
              <div className="bg-amber-50 p-6 rounded-lg">
                <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <span>🏆</span>
                  Thành tích nổi bật
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Tuổi đời:</span>
                    <span className="bg-amber-200 px-2 py-1 rounded text-amber-800 font-bold">53+ năm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Danh hiệu:</span>
                    <span className="bg-red-200 px-2 py-1 rounded text-red-800 font-bold">Anh hùng</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Truyền thống:</span>
                    <span className="bg-green-200 px-2 py-1 rounded text-green-800 font-bold">Mở đường thắng lợi</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Nhiệm vụ:</span>
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800 font-bold">Xây dựng & Bảo vệ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
