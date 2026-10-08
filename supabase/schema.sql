-- ====================================================================
-- SUPABASE SCHEMA: HỌC LIỆU MẦM NON (PRESCHOOL LEARNING PLATFORM)
-- Phân quyền & Quản lý vai trò (Role-Based Access Control - RBAC)
-- Tương thích 100% với Supabase Auth, Row Level Security (RLS) & Policies
-- ====================================================================

-- 1. ENUMS VÀ EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo enum cho vai trò người dùng (Roles)
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('guest', 'parent', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tạo enum cho cấp độ học liệu
DO $$ BEGIN
    CREATE TYPE grade_level_type AS ENUM ('age_2_3', 'age_3_4', 'age_4_5', 'age_5_6', 'pre_k');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. BẢNG PROFILES (HỒ SƠ NGƯỜI DÙNG LIÊN KẾT VỚI SUPABASE AUTH)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    phone TEXT,
    school_name TEXT,
    role user_role_type NOT NULL DEFAULT 'parent',
    is_vip BOOLEAN NOT NULL DEFAULT false,
    vip_expires_at TIMESTAMPTZ,
    daily_download_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG PERMISSIONS (DANH SÁCH QUYỀN HỆ THỐNG)
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, -- e.g. 'materials:download_unlimited', 'materials:crud', 'lesson_plans:access'
    name TEXT NOT NULL,
    description TEXT
);

-- 4. BẢNG ROLE_PERMISSIONS (GÁN QUYỀN CHO TỪNG VAI TRÒ)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role user_role_type NOT NULL,
    permission_code TEXT REFERENCES public.permissions(code) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_code)
);

-- 5. BẢNG CATEGORIES (DANH MỤC HỌC LIỆU)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY, -- e.g. 'tao-hinh', 'toan-hoc', 'chu-cai'
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    color_accent TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. BẢNG MATERIALS (KHO HỌC LIỆU & WORKSHEETS)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    grade_level grade_level_type NOT NULL DEFAULT 'age_3_4',
    age_range_label TEXT NOT NULL DEFAULT '3 - 5 tuổi',
    description TEXT,
    preview_image_url TEXT NOT NULL,
    preview_pages JSONB DEFAULT '[]'::jsonb, -- Danh sách ảnh trang xem trước
    file_pdf_url TEXT,
    page_count INT NOT NULL DEFAULT 1,
    format_type TEXT NOT NULL DEFAULT 'PDF (Chất lượng in)',
    price INT NOT NULL DEFAULT 0, -- 0 nếu miễn phí, hoặc tính theo VNĐ (e.g. 10000, 25000)
    is_free_sample BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
    rating_count INT NOT NULL DEFAULT 1,
    download_count INT NOT NULL DEFAULT 0,
    teacher_guide_url TEXT, -- Giáo án đính kèm cho giáo viên
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. BẢNG ORDERS & TRANSACTIONS (ĐƠN HÀNG MUA HỌC LIỆU HOẶC GÓI VIP)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_amount INT NOT NULL DEFAULT 0,
    discount_amount INT NOT NULL DEFAULT 0,
    final_amount INT NOT NULL DEFAULT 0,
    discount_code TEXT,
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    payment_method TEXT NOT NULL DEFAULT 'vietqr',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    price INT NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1
);

-- 8. BẢNG DOWNLOAD_LOGS (LỊCH SỬ TẢI & KIỂM TRA HẠN MỨC)
CREATE TABLE IF NOT EXISTS public.download_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
    ip_address TEXT,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- SEED DỮ LIỆU BAN ĐẦU: QUYỀN HỆ THỐNG & PHÂN QUYỀN VAI TRÒ
-- ====================================================================

INSERT INTO public.permissions (code, name, description) VALUES
('materials:read', 'Xem danh mục học liệu', 'Xem danh sách và chi tiết học liệu'),
('materials:download_free', 'Tải tài liệu mẫu miễn phí', 'Tải các tài liệu dùng thử (giới hạn 3 lượt/tháng)'),
('materials:download_unlimited', 'Tải không giới hạn', 'Tải toàn bộ tài liệu PDF độ phân giải cao không giới hạn'),
('materials:crud', 'Quản trị học liệu', 'Thêm mới, chỉnh sửa, xóa và tải lên học liệu'),
('lesson_plans:access', 'Truy cập giáo án', 'Xem và tải giáo án sư phạm mầm non chuẩn BGD&ĐT'),
('worksheet_generator:access', 'Công cụ tạo bài tập', 'Sử dụng công cụ sinh worksheet tùy chỉnh theo ý muốn'),
('roles:manage', 'Quản lý vai trò & quyền', 'Cấp quyền giáo viên, phụ huynh VIP hoặc admin cho tài khoản khác'),
('analytics:view', 'Xem báo cáo thống kê', 'Xem số lượt tải, doanh thu và báo cáo hệ thống')
ON CONFLICT (code) DO NOTHING;

-- Gán quyền cho GUEST
INSERT INTO public.role_permissions (role, permission_code) VALUES
('guest', 'materials:read'),
('guest', 'materials:download_free')
ON CONFLICT DO NOTHING;

-- Gán quyền cho PARENT (Phụ huynh)
INSERT INTO public.role_permissions (role, permission_code) VALUES
('parent', 'materials:read'),
('parent', 'materials:download_free'),
('parent', 'materials:download_unlimited'),
('parent', 'worksheet_generator:access')
ON CONFLICT DO NOTHING;

-- Gán quyền cho TEACHER (Giáo viên mầm non)
INSERT INTO public.role_permissions (role, permission_code) VALUES
('teacher', 'materials:read'),
('teacher', 'materials:download_free'),
('teacher', 'materials:download_unlimited'),
('teacher', 'lesson_plans:access'),
('teacher', 'worksheet_generator:access')
ON CONFLICT DO NOTHING;

-- Gán quyền cho ADMIN (Quản trị viên)
INSERT INTO public.role_permissions (role, permission_code) VALUES
('admin', 'materials:read'),
('admin', 'materials:download_free'),
('admin', 'materials:download_unlimited'),
('admin', 'materials:crud'),
('admin', 'lesson_plans:access'),
('admin', 'worksheet_generator:access'),
('admin', 'roles:manage'),
('admin', 'analytics:view')
ON CONFLICT DO NOTHING;

-- Seed danh mục
INSERT INTO public.categories (id, name, description, icon_name, color_accent, display_order) VALUES
('tao-hinh', 'Tạo hình', 'Tô màu, vẽ tranh, xé dán phát triển tư duy sáng tạo', 'palette', '#FF637D', 1),
('toan-hoc', 'Làm quen toán', 'Nhận biết số, hình học, quy luật, so sánh', 'calculator', '#3B82F6', 2),
('chu-cai', 'Làm quen chữ cái', 'Bảng chữ cái tiếng Việt, tập tô nét cơ bản', 'book-open', '#10B981', 3),
('the-gioi', 'Thế giới xung quanh', 'Khám phá động thực vật, thiên nhiên, giao thông', 'globe', '#F59E0B', 4),
('ky-nang', 'Kỹ năng sống', 'Giao tiếp, cảm xúc, tự lập, an toàn cho bé', 'heart', '#EC4899', 5),
('tong-hop', 'Bộ chủ đề tổng hợp', 'Gói học liệu theo tuần & tháng cho lớp mầm non', 'sparkles', '#8B5CF6', 6)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES BẢO MẬT TOÀN DIỆN
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Hàm trợ giúp lấy vai trò của người dùng hiện tại
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_type AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Hàm kiểm tra quyền của người dùng hiện tại
CREATE OR REPLACE FUNCTION public.has_permission(required_perm TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.role_permissions rp
        JOIN public.profiles p ON p.role = rp.role
        WHERE p.id = auth.uid() AND rp.permission_code = required_perm
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- POLICIES CHO PROFILES
CREATE POLICY "Mọi người có thể đọc profile công khai" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Người dùng tự cập nhật thông tin cá nhân của mình" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin có quyền cập nhật vai trò người dùng" 
ON public.profiles FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- POLICIES CHO MATERIALS (HỌC LIỆU)
CREATE POLICY "Mọi người (kể cả khách) đều xem được học liệu" 
ON public.materials FOR SELECT USING (true);

CREATE POLICY "Chỉ Admin mới có quyền thêm học liệu" 
ON public.materials FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Chỉ Admin mới có quyền sửa học liệu" 
ON public.materials FOR UPDATE USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Chỉ Admin mới có quyền xóa học liệu" 
ON public.materials FOR DELETE USING (public.get_current_user_role() = 'admin');

-- POLICIES CHO CATEGORIES
CREATE POLICY "Mọi người đều xem được danh mục" 
ON public.categories FOR SELECT USING (true);

-- POLICIES CHO ORDERS
CREATE POLICY "Người dùng chỉ xem đơn hàng của chính mình (Admin xem tất cả)" 
ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.get_current_user_role() = 'admin');

CREATE POLICY "Người dùng có thể tạo đơn hàng" 
ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES CHO DOWNLOAD_LOGS
CREATE POLICY "Người dùng xem lịch sử tải của mình (Admin xem tất cả)" 
ON public.download_logs FOR SELECT USING (auth.uid() = user_id OR public.get_current_user_role() = 'admin');

CREATE POLICY "Người dùng ghi nhận lượt tải" 
ON public.download_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ====================================================================
-- TRIGGER TỰ ĐỘNG TẠO PROFILE KHI ĐĂNG KÝ QUA SUPABASE AUTH
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE((new.raw_user_meta_data->>'role')::user_role_type, 'parent')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
