import Image from "next/image"

export function IntroductionContent() {
  return (
    <div className="w-full p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-[#b45f06]">
          LỮ ĐOÀN 279 - ĐƠN VỊ TINH NHUỆ, TRUYỀN THỐNG VẺ VANG
        </h2>

        {/* Tin tức nổi bật */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-50 to-yellow-50 p-6 rounded-lg border-l-4 border-red-600 mb-6">
            <h3 className="text-2xl font-bold mb-4 text-red-700">
              🎖️ LỄ TUYÊN THỆ CHIẾN SĨ MỚI NĂM 2025
            </h3>
            <p className="text-gray-600 mb-4 italic">
              <strong>Sáng 04/6/2025</strong> - Trong không khí trang nghiêm, xúc động và đầy tự hào
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg mb-4">
                <Image
                  src="/le-tuyen-the-1.jpg"
                  alt="Lễ tuyên thệ chiến sĩ mới - Nghi lễ chào cờ"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-gray-600 text-center italic">
                Nghi lễ chào cờ trang nghiêm trong lễ tuyên thệ
              </p>
            </div>
            
            <div>
              <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg mb-4">
                <Image
                  src="/le-tuyen-the-2.jpg"
                  alt="Lễ tuyên thệ chiến sĩ mới - Trao bằng khen"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-gray-600 text-center italic">
                Lễ trao bằng khen cho các chiến sĩ mới xuất sắc
              </p>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-lg leading-8 mb-6 text-justify">
              Lữ đoàn 279 long trọng tổ chức <strong>Lễ tuyên thệ chiến sĩ mới năm 2025</strong> – một dấu mốc thiêng liêng, 
              ghi nhận sự trưởng thành vượt bậc về bản lĩnh, ý chí và tinh thần của chiến sĩ mới sau ba tháng rèn luyện trong quân ngũ.
            </p>

            <div className="bg-purple-50 p-6 rounded-lg mb-6">
              <h4 className="font-bold text-purple-800 mb-3">👥 Thành phần dự lễ:</h4>
              <ul className="list-disc pl-6 space-y-2 text-purple-700">
                <li><strong>Đồng chí Đại tá Nguyễn Hồng Giang</strong> - Phó Tư lệnh kiêm Tham mưu trưởng Binh chủng</li>
                <li>Các đồng chí đại biểu đại diện cơ quan chức năng của Binh chủng</li>
                <li>Lãnh đạo chính quyền các địa phương</li>
                <li>Ban chỉ huy quân sự huyện</li>
                <li>Đại diện gia đình các chiến sĩ mới (đầy xúc động)</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h4 className="font-bold text-blue-800 mb-3">🎯 Thành tích nổi bật:</h4>
              <ul className="list-disc pl-6 space-y-2 text-blue-700">
                <li>Sau 3 tháng huấn luyện, các chiến sĩ mới đã hoàn thành tốt nội dung chương trình với kết quả cao</li>
                <li>Thể hiện tinh thần quyết tâm, đoàn kết, vượt khó và khát vọng cống hiến cho Tổ quốc</li>
                <li>Có bước tiến vượt bậc so với năm 2024</li>
              </ul>
            </div>

            <div className="bg-red-50 p-6 rounded-lg mb-6">
              <h4 className="font-bold text-red-800 mb-3">⚡ Giây phút thiêng liêng:</h4>
              <p className="text-red-700 mb-3">
                Trong giây phút thiêng liêng, trước <strong>Quân kỳ quyết thắng</strong>, các chiến sĩ mới đồng thanh hô vang lời tuyên thệ. 
                Tiếng thề vang vọng, lay động lòng người – là minh chứng sống động cho ý chí, bản lĩnh và tinh thần của lớp chiến sĩ mới.
              </p>
            </div>

            <blockquote className="border-l-4 border-green-500 pl-6 my-6 bg-green-50 p-4 rounded-r-lg">
              <p className="italic text-green-800 text-lg font-semibold">
                "Tuyệt đối trung thành với Đảng, với Tổ quốc và Nhân dân; sẵn sàng chiến đấu, hy sinh vì độc lập, 
                tự do của dân tộc; quyết tâm hoàn thành mọi nhiệm vụ được giao…"
              </p>
              <footer className="text-green-600 mt-2">
                - Lời tuyên thệ của các chiến sĩ mới
              </footer>
            </blockquote>

            <div className="bg-yellow-50 p-6 rounded-lg mb-6">
              <h4 className="font-bold text-yellow-800 mb-3">🎖️ Phát biểu của lãnh đạo:</h4>
              <p className="text-yellow-700 mb-3">
                <strong>Đại tá Nguyễn Hồng Giang</strong> biểu dương kết quả huấn luyện và rèn luyện của chiến sĩ mới, 
                đã có bước tiến vượt bậc so với năm 2024. Đó là kết quả của công tác lãnh đạo, chỉ đạo sâu sát, toàn diện, 
                đồng bộ của Đảng uỷ, chỉ huy Lữ đoàn, sự đồng sức, đồng lòng của tập thể cán bộ, chiến sĩ Lữ đoàn 279.
              </p>
            </div>

            <p className="text-lg leading-8 mb-6 text-justify">
              <strong>Đại tá Nguyễn Hồng Giang</strong> dặn dò các chiến sĩ mới: <em>"Từ hôm nay, các đồng chí chính thức trở thành người quân nhân trong 
              Quân đội nhân dân Việt Nam. Chặng đường phía trước còn nhiều thử thách, song tôi tin tưởng với tinh thần 
              rèn luyện nghiêm túc, ý chí kiên cường, các đồng chí sẽ tiếp tục phát huy truyền thống vẻ vang của Lữ đoàn, 
              hoàn thành xuất sắc mọi nhiệm vụ được giao."</em>
            </p>

            <div className="bg-indigo-50 p-6 rounded-lg mb-6">
              <h4 className="font-bold text-indigo-800 mb-3">🎭 Phần văn nghệ đặc sắc:</h4>
              <p className="text-indigo-700 mb-3">
                Kết thúc buổi lễ, các đại biểu đã được thưởng thức phần <strong>đồng diễn các vũ điệu trong sinh hoạt tập thể</strong> 
                và <strong>màn múa cờ ấn tượng</strong> của chiến sĩ mới.
              </p>
              <p className="text-indigo-700">
                Những bước nhảy khỏe khoắn, đồng đều, những lá cờ tung bay rợp trời là hình ảnh biểu tượng cho 
                <strong>sức trẻ, sự sáng tạo và tinh thần đoàn kết, gắn bó</strong> của chiến sĩ mới.
              </p>
            </div>

            <div className="bg-pink-50 p-6 rounded-lg mb-6">
              <h4 className="font-bold text-pink-800 mb-3">👨‍👩‍👧‍👦 Buổi gặp mặt gia đình:</h4>
              <p className="text-pink-700 mb-3">
                Ngay sau buổi lễ, lãnh đạo các địa phương, Ban chỉ huy quân sự huyện cùng đại diện gia đình đã có 
                <strong>buổi gặp mặt, thăm hỏi và động viên</strong> các chiến sĩ mới.
              </p>
              <p className="text-pink-700">
                Những lời chúc mừng, những cái bắt tay ấm áp, những giọt nước mắt tự hào, xúc động là 
                <strong>nguồn động lực to lớn</strong>, tiếp thêm niềm tin và sức mạnh để các chiến sĩ tiếp tục 
                vững bước trên con đường binh nghiệp phía trước.
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-bold text-orange-800 mb-3">🚀 Hành trình mới bắt đầu:</h4>
              <p className="text-orange-700 mb-3">
                Lễ tuyên thệ khép lại, nhưng <strong>cánh cửa của hành trình quân ngũ mới chỉ bắt đầu</strong>. 
                Tin tưởng rằng, các đồng chí chiến sĩ mới sẽ từng bước trưởng thành, ra sức cống hiến.
              </p>
              <p className="text-orange-700 font-semibold">
                <strong>Sẵn đi bất cứ nơi đâu, làm bất cứ việc gì khi được phân công</strong>, tiếp tục viết nên những trang sử vẻ vang, 
                góp phần tô thắm truyền thống của Quân đội nhân dân Việt Nam anh hùng.
              </p>
            </div>
          </div>
        </div>

        {/* Giới thiệu chung về Lữ đoàn */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6 text-[#b45f06]">🏛️ GIỚI THIỆU LỮ ĐOÀN 279</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="mb-4 text-lg leading-7 text-justify">
                Lữ đoàn 279 là một đơn vị quân đội tinh nhuệ thuộc Quân khu 7, được thành lập vào năm 1975. 
                Với truyền thống vẻ vang và nhiều thành tích xuất sắc trong công tác huấn luyện, sẵn sàng chiến đấu 
                và xây dựng đơn vị vững mạnh toàn diện.
              </p>
              <p className="mb-4 text-lg leading-7 text-justify">
                Với phương châm <strong>"Đoàn kết - Kỷ cương - Sáng tạo - Hiệu quả"</strong>, Lữ đoàn 279 luôn hoàn thành 
                xuất sắc mọi nhiệm vụ được giao, góp phần bảo vệ vững chắc chủ quyền lãnh thổ và an ninh quốc gia.
              </p>
              <p className="text-lg leading-7 text-justify">
                Hệ thống quản lý trạm chế biến là một phần quan trọng trong công tác hậu cần của Lữ đoàn, 
                đảm bảo chất lượng bữa ăn và sức khỏe cho cán bộ, chiến sĩ trong đơn vị.
              </p>
            </div>
            <div className="bg-gray-100 h-80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">🎖️</div>
                <p className="text-gray-600 font-semibold">Huy hiệu Lữ đoàn 279</p>
                <p className="text-sm text-gray-500 mt-2">Biểu tượng của truyền thống và danh dự</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thành tích */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6 text-[#b45f06]">🏆 THÀNH TÍCH ĐẠT ĐƯỢC</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-3">Các huân chương và danh hiệu:</h4>
              <ul className="list-disc pl-6 space-y-2 text-yellow-700">
                <li>Huân chương Chiến công hạng Nhất (2010)</li>
                <li>Đơn vị Quyết thắng (2015-2020)</li>
                <li>Đơn vị nuôi quân giỏi, quản lý quân nhu tốt (2018-2022)</li>
              </ul>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-800 mb-3">Bằng khen và cờ thi đua:</h4>
              <ul className="list-disc pl-6 space-y-2 text-green-700">
                <li>Bằng khen của Bộ Quốc phòng về thành tích xuất sắc trong huấn luyện (2021)</li>
                <li>Cờ thi đua của Quân khu 7 (2022)</li>
                <li>Nhiều thành tích xuất sắc trong công tác đào tạo chiến sĩ mới</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cơ cấu tổ chức */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-[#b45f06]">📋 CƠ CẤU TỔ CHỨC</h3>
          <div className="border border-gray-300 p-6 rounded-lg bg-gray-50">
            <h4 className="font-bold mb-4 text-center text-xl">SƠ ĐỒ TỔ CHỨC LỮ ĐOÀN 279</h4>
            <div className="bg-white h-60 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-4xl mb-4">🏢</div>
                <p className="text-gray-600 font-semibold">Sơ đồ tổ chức Lữ đoàn 279</p>
                <p className="text-sm text-gray-500 mt-2">Cơ cấu tổ chức hiện đại, hiệu quả</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Tin bài, ảnh:</strong> Việt Anh, Minh Quang
          </p>
          <p className="text-xs text-gray-500 mt-2">TP</p>
        </div>
      </div>
    </div>
  )
}
