// ====================================================================
// SUPABASE CLIENT & PRODUCTION AUTH / PERMISSIONS SERVICE
// Vận hành thực tế (Production Mode) cho website Học Liệu Mầm Non
// ====================================================================

import { createClient } from '@supabase/supabase-js';
import { CATEGORIES as SEED_CATEGORIES, WORKSHEETS as SEED_WORKSHEETS } from '../data/learningData.js';

// 1. CẤU HÌNH SUPABASE (Ưu tiên tệp .env, sau đó đến LocalStorage)
const STORAGE_CONFIG_KEY = 'hoclieu_supabase_real_config';
const STORAGE_CART_KEY = 'hoclieu_cart';

const savedConfig = JSON.parse(localStorage.getItem(STORAGE_CONFIG_KEY) || '{}');

export const supabaseConfig = {
  url: import.meta.env?.VITE_SUPABASE_URL || savedConfig.url || '',
  anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || savedConfig.anonKey || ''
};

// Khởi tạo Supabase client chính thức
export let supabase = null;
export function initSupabaseClient(url, anonKey) {
  if (url && anonKey && url.startsWith('https://')) {
    try {
      supabase = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return true;
    } catch (e) {
      console.error('Lỗi khởi tạo Supabase:', e);
      return false;
    }
  }
  return false;
}

initSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);

// ====================================================================
// MA TRẬN PHÂN QUYỀN VAI TRÒ (RBAC MATRIX)
// ====================================================================
export const ROLE_DEFINITIONS = {
  admin: {
    name: 'Quản trị viên (Admin)',
    badgeColor: '#EF4444',
    bgColor: '#FEE2E2',
    description: 'Toàn quyền thêm/sửa/xóa học liệu, cấp quyền người dùng, xem đơn hàng và quản lý toàn bộ hệ thống.'
  },
  teacher: {
    name: 'Giáo viên mầm non',
    badgeColor: '#3B82F6',
    bgColor: '#DBEAFE',
    description: 'Tải không giới hạn tài liệu PDF chuẩn in, truy cập trọn bộ Giáo án STEAM 5E, cấp quyền in cho lớp.'
  },
  parent: {
    name: 'Phụ huynh thành viên',
    badgeColor: '#10B981',
    bgColor: '#D1FAE5',
    description: 'Tải học liệu theo đơn hàng / gói thành viên, sử dụng công cụ tạo bài tập mang tên bé.'
  },
  guest: {
    name: 'Khách tham quan',
    badgeColor: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'Xem trước bài học mờ, cần đăng ký để tải tài liệu và mua học liệu.'
  }
};

export const PERMISSIONS = {
  'materials:read': ['guest', 'parent', 'teacher', 'admin'],
  'materials:download_free': ['guest', 'parent', 'teacher', 'admin'],
  'materials:download_unlimited': ['teacher', 'admin'],
  'materials:crud': ['admin'],
  'lesson_plans:access': ['teacher', 'admin'],
  'worksheet_generator:access': ['parent', 'teacher', 'admin'],
  'roles:manage': ['admin'],
  'analytics:view': ['admin']
};

// State người dùng hiện tại
let currentUser = {
  id: null,
  email: null,
  full_name: 'Khách tham quan',
  role: 'guest',
  avatar: '👶',
  is_vip: false
};

let authListeners = [];
let cartListeners = [];

// Tự động khôi phục phiên đăng nhập Supabase khi tải trang
if (supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      fetchUserProfile(session.user);
    }
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      await fetchUserProfile(session.user);
    } else {
      currentUser = {
        id: null,
        email: null,
        full_name: 'Khách tham quan',
        role: 'guest',
        avatar: '👶',
        is_vip: false
      };
      notifyAuthChange();
    }
  });
}

// Lấy thông tin profile từ bảng `public.profiles` trong Supabase
async function fetchUserProfile(authUser) {
  try {
    if (!supabase) return;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profile && !error) {
      currentUser = {
        id: authUser.id,
        email: authUser.email,
        full_name: profile.full_name || authUser.email.split('@')[0],
        role: profile.role || 'parent',
        avatar: profile.avatar_url || (profile.role === 'admin' ? '👑' : (profile.role === 'teacher' ? '👩‍🏫' : '💖')),
        is_vip: profile.is_vip || false,
        school_name: profile.school_name || ''
      };
    } else {
      currentUser = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: authUser.user_metadata?.role || 'parent',
        avatar: '💖',
        is_vip: false
      };
    }
  } catch (err) {
    console.warn('Lỗi đọc profile từ Supabase:', err);
  } finally {
    notifyAuthChange();
  }
}

function notifyAuthChange() {
  authListeners.forEach(fn => fn(currentUser));
}

// ====================================================================
// AUTH SERVICE (ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT THẬT VỚI SUPABASE)
// ====================================================================
export const authService = {
  getUser() {
    return currentUser;
  },

  isConnected() {
    return !!supabase && !!supabaseConfig.url;
  },

  hasPermission(permissionCode) {
    if (!currentUser || !currentUser.role) return false;
    const allowed = PERMISSIONS[permissionCode] || [];
    return allowed.includes(currentUser.role);
  },

  async signUp(email, password, fullName, requestedRole = 'parent') {
    if (!supabase) {
      throw new Error('Chưa cấu hình Supabase! Vui lòng nhấn nút "Cài đặt Supabase" ở góc trên bên phải để điền URL và Anon Key.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: requestedRole
        }
      }
    });

    if (error) throw error;

    // Cập nhật profile nếu trigger chưa tạo
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          role: requestedRole
        });
      } catch (e) {
        console.warn('Profile upsert note:', e);
      }
      await fetchUserProfile(data.user);
    }

    return data;
  },

  async signIn(email, password) {
    if (!supabase) {
      throw new Error('Chưa cấu hình Supabase! Vui lòng nhấn nút "Cài đặt Supabase" để kết nối dự án của bạn.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user);
    }
    return data;
  },

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    currentUser = {
      id: null,
      email: null,
      full_name: 'Khách tham quan',
      role: 'guest',
      avatar: '👶',
      is_vip: false
    };
    notifyAuthChange();
  },

  // Quản trị viên cập nhật vai trò người dùng trong Supabase
  async updateUserRole(userId, newRole) {
    if (!this.hasPermission('roles:manage')) {
      throw new Error('Bạn không có quyền thực hiện thao tác này (Chỉ Admin mới có quyền)!');
    }
    if (!supabase) return;

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data;
  },

  // Lấy toàn bộ người dùng từ bảng `profiles` (Dành cho Admin Dashboard)
  async getAllUsers() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Lỗi lấy danh sách người dùng:', error);
      return [];
    }
    return data || [];
  },

  onAuthChange(callback) {
    authListeners.push(callback);
    return () => {
      authListeners = authListeners.filter(fn => fn !== callback);
    };
  }
};

// ====================================================================
// DATA SERVICE: KHO HỌC LIỆU & DANH MỤC TRỰC TIẾP TỪ SUPABASE
// ====================================================================
export const dataService = {
  async getCategories() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Lấy danh mục từ Supabase thất bại, sử dụng danh mục mẫu:', e);
      }
    }
    return SEED_CATEGORIES;
  },

  async getMaterials(filters = {}) {
    if (supabase) {
      try {
        let query = supabase.from('materials').select('*');

        if (filters.category && filters.category !== 'all') {
          query = query.eq('category_id', filters.category);
        }
        if (filters.age && filters.age !== 'all') {
          query = query.eq('grade_level', filters.age);
        }

        const { data, error } = await query.order('download_count', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Lấy học liệu từ Supabase lỗi, chuyển sang dữ liệu nội bộ:', e);
      }
    }
    return SEED_WORKSHEETS;
  },

  // Admin thêm học liệu mới vào Supabase
  async createMaterial(materialData) {
    if (!supabase) throw new Error('Chưa kết nối Supabase');
    const { data, error } = await supabase
      .from('materials')
      .insert(materialData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin xóa học liệu khỏi Supabase
  async deleteMaterial(materialId) {
    if (!supabase) throw new Error('Chưa kết nối Supabase');
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (error) throw error;
    return true;
  },

  // Ghi nhận lượt tải học liệu vào Supabase
  async logDownload(materialId) {
    if (supabase) {
      try {
        const user = authService.getUser();
        await supabase.from('download_logs').insert({
          user_id: user.id || null,
          material_id: materialId
        });
        // Tăng count trong bảng materials
        await supabase.rpc('increment_download_count', { mat_id: materialId });
      } catch (e) {
        // ignore
      }
    }
  },

  // Tạo đơn hàng mua học liệu thật trên Supabase
  async createOrder(orderPayload, items) {
    if (!supabase) return { success: true, orderId: 'ORD-' + Date.now() };

    const user = authService.getUser();
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: orderPayload.total,
        discount_amount: orderPayload.discount,
        final_amount: orderPayload.finalTotal,
        discount_code: orderPayload.code || null,
        payment_method: 'vietqr',
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;

    // Lưu từng món trong order_items
    if (items && items.length > 0) {
      const orderItems = items.map(i => ({
        order_id: order.id,
        material_id: i.id,
        price: i.price,
        quantity: i.quantity
      }));
      await supabase.from('order_items').insert(orderItems);
    }

    return { success: true, orderId: order.id };
  }
};

// ====================================================================
// GIỎ HÀNG (SHOPPING CART)
// ====================================================================
let cart = JSON.parse(localStorage.getItem(STORAGE_CART_KEY) || '[]');

export const cartService = {
  getCart() {
    return cart;
  },

  addToCart(material) {
    const existing = cart.find(item => item.id === material.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: material.id,
        title: material.title,
        price: material.price,
        coverImage: material.coverImage || material.preview_image_url || '/assets/misa_bear.jpg',
        pages: material.pages || material.page_count || 1,
        format: material.format || material.format_type || 'PDF',
        quantity: 1
      });
    }
    this._saveAndNotify();
  },

  updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.removeFromCart(id);
        return;
      }
      this._saveAndNotify();
    }
  },

  removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    this._saveAndNotify();
  },

  clearCart() {
    cart = [];
    this._saveAndNotify();
  },

  getTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  _saveAndNotify() {
    localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
    cartListeners.forEach(fn => fn(cart));
  },

  onCartChange(callback) {
    cartListeners.push(callback);
    return () => {
      cartListeners = cartListeners.filter(fn => fn !== callback);
    };
  }
};

// ====================================================================
// CÀI ĐẶT THÔNG SỐ SUPABASE
// ====================================================================
export const supabaseSettings = {
  getConfig() {
    return { ...supabaseConfig };
  },

  saveConfig(url, anonKey) {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey }));
    supabaseConfig.url = trimmedUrl;
    supabaseConfig.anonKey = trimmedKey;
    initSupabaseClient(trimmedUrl, trimmedKey);
  }
};
