-- ====================================================================
-- SUPABASE SCHEMA CHUYÊN DÙNG ĐỂ CHIA SẺ VỚI DỰ ÁN CŨ (SHARED MODE)
-- Toàn bộ bảng dùng tiền tố 'hl_' (Học Liệu) để KHÔNG TRÙNG với web cũ
-- An toàn 100%, không ghi đè hay làm mất dữ liệu của web cũ RIVA!
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG DANH MỤC HỌC LIỆU
CREATE TABLE IF NOT EXISTS public.hl_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    color_accent TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG KHO HỌC LIỆU & WORKSHEETS
CREATE TABLE IF NOT EXISTS public.hl_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id TEXT REFERENCES public.hl_categories(id) ON DELETE SET NULL,
    grade_level TEXT NOT NULL DEFAULT '3-4',
    age_range_label TEXT NOT NULL DEFAULT '3 - 5 tuổi',
    description TEXT,
    preview_image_url TEXT NOT NULL DEFAULT './assets/misa_bear.jpg',
    preview_pages JSONB DEFAULT '[]'::jsonb,
    file_pdf_url TEXT,
    page_count INT NOT NULL DEFAULT 1,
    format_type TEXT NOT NULL DEFAULT 'PDF (Chất lượng in)',
    price INT NOT NULL DEFAULT 0,
    is_free_sample BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
    rating_count INT NOT NULL DEFAULT 1,
    download_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG PROFILES HỌC LIỆU (KHÔNG XUNG ĐỘT VỚI PROFILES CŨ)
CREATE TABLE IF NOT EXISTS public.hl_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'parent', -- 'admin', 'teacher', 'parent', 'guest'
    school_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG ĐƠN HÀNG HỌC LIỆU (KHÔNG TRÙNG VỚI ORDERS CŨ)
CREATE TABLE IF NOT EXISTS public.hl_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_amount INT NOT NULL DEFAULT 0,
    discount_code TEXT,
    payment_method TEXT NOT NULL DEFAULT 'vietqr',
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.hl_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.hl_orders(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.hl_materials(id) ON DELETE SET NULL,
    price INT NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1
);

-- 5. BẢNG LỊCH SỬ TẢI
CREATE TABLE IF NOT EXISTS public.hl_download_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.hl_materials(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- BẬT ROW LEVEL SECURITY
ALTER TABLE public.hl_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl_download_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES CHO PHÉP XEM HỌC LIỆU CÔNG KHAI
CREATE POLICY "Public read hl_materials" ON public.hl_materials FOR SELECT USING (true);
CREATE POLICY "Public read hl_categories" ON public.hl_categories FOR SELECT USING (true);
CREATE POLICY "Public read hl_profiles" ON public.hl_profiles FOR SELECT USING (true);
CREATE POLICY "Public insert hl_orders" ON public.hl_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert hl_order_items" ON public.hl_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert hl_download_logs" ON public.hl_download_logs FOR INSERT WITH CHECK (true);

-- SEED DANH MỤC BAN ĐẦU
INSERT INTO public.hl_categories (id, name, description, color_accent, display_order) VALUES
('tao-hinh', 'Tạo hình', 'Tô màu, vẽ tranh, xé dán sáng tạo', '#FF637D', 1),
('toan-hoc', 'Làm quen toán', 'Nhận biết số, hình học, quy luật', '#3B82F6', 2),
('chu-cai', 'Làm quen chữ cái', 'Bảng chữ cái tiếng Việt, tập tô nét', '#10B981', 3),
('the-gioi', 'Thế giới xung quanh', 'Khám phá động thực vật, tự nhiên', '#F59E0B', 4)
ON CONFLICT (id) DO NOTHING;
