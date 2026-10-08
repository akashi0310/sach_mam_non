// Quản lý Supabase Client & Hệ thống Phân quyền (RBAC - Role-Based Access Control)
import { createClient } from '@supabase/supabase-js';

// Khóa cấu hình mặc định (người dùng có thể cập nhật qua giao diện cài đặt)
const STORAGE_CONFIG_KEY = 'hoclieu_supabase_config';
const STORAGE_USER_KEY = 'hoclieu_current_user';
const STORAGE_CART_KEY = 'hoclieu_cart';
const STORAGE_USERS_LIST_KEY = 'hoclieu_all_users_mock';

// Đọc cấu hình từ LocalStorage hoặc biến môi trường Vite
const savedConfig = JSON.parse(localStorage.getItem(STORAGE_CONFIG_KEY) || '{}');
export const supabaseConfig = {
  url: savedConfig.url || import.meta.env?.VITE_SUPABASE_URL || 'https://mock-hoclieu-supabase.supabase.co',
  anonKey: savedConfig.anonKey || import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-anon-key'
};

// Khởi tạo Supabase client chính thức
let client = null;
try {
  if (supabaseConfig.url.startsWith('https://') && !supabaseConfig.url.includes('mock-hoclieu')) {
    client = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }
} catch (e) {
  console.warn('Không thể khởi tạo live Supabase, kích hoạt chế độ mô phỏng thông minh:', e);
}

// Bảng ma trận quyền hệ thống (Permission Matrix)
export const PERMISSIONS = {
  'materials:read': ['guest', 'parent', 'teacher', 'admin'],
  'materials:download_free': ['guest', 'parent', 'teacher', 'admin'],
  'materials:download_unlimited': ['parent', 'teacher', 'admin'],
  'materials:crud': ['admin'],
  'lesson_plans:access': ['teacher', 'admin'],
  'worksheet_generator:access': ['parent', 'teacher', 'admin'],
  'roles:manage': ['admin'],
  'analytics:view': ['admin']
};

export const ROLE_DEFINITIONS = {
  admin: {
    name: 'Quản trị viên (Admin)',
    badgeColor: '#EF4444',
    bgColor: '#FEE2E2',
    description: 'Toàn quyền quản trị kho học liệu, duyệt bài, phân quyền người dùng và xem thống kê doanh thu.'
  },
  teacher: {
    name: 'Giáo viên mầm non',
    badgeColor: '#3B82F6',
    bgColor: '#DBEAFE',
    description: 'Tải không giới hạn, truy cập toàn bộ Giáo án chuẩn BGD, tải file in ấn kích thước lớn và tạo worksheet.'
  },
  parent: {
    name: 'Phụ huynh Pro',
    badgeColor: '#10B981',
    bgColor: '#D1FAE5',
    description: 'Tải không giới hạn học liệu mầm non cho con, sử dụng công cụ tạo bài tập và lưu học liệu yêu thích.'
  },
  guest: {
    name: 'Khách (Chưa đăng ký)',
    badgeColor: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'Chỉ xem trước tài liệu có hình mờ, tải tối đa 3 tài liệu miễn phí mỗi tháng.'
  }
};

// Danh sách tài khoản mẫu ban đầu để kiểm thử ngay lập tức
const INITIAL_DEMO_USERS = [
  {
    id: 'usr-admin-01',
    email: 'admin@hoclieumamnon.vn',
    full_name: 'Cô Mai Quản Trị',
    role: 'admin',
    avatar: '👩‍🏫',
    school_name: 'Trường Mầm Non Ban Mai',
    downloads_today: 0
  },
  {
    id: 'usr-teacher-02',
    email: 'giao_vien_lan@truonghoa.edu.vn',
    full_name: 'Cô Lan Phương (GV Mẫu Giáo Lớn)',
    role: 'teacher',
    avatar: '🌸',
    school_name: 'Mầm Non Họa Mi Cầu Giấy',
    downloads_today: 12
  },
  {
    id: 'usr-parent-03',
    email: 'me_be_bong@gmail.com',
    full_name: 'Mẹ Bé Bống (Hà Nội)',
    role: 'parent',
    avatar: '💖',
    school_name: 'Lớp Chồi 1',
    downloads_today: 4
  }
];

// Khởi tạo danh sách người dùng mock nếu chưa có
if (!localStorage.getItem(STORAGE_USERS_LIST_KEY)) {
  localStorage.setItem(STORAGE_USERS_LIST_KEY, JSON.stringify(INITIAL_DEMO_USERS));
}

// Lấy người dùng hiện tại
function getInitialUser() {
  const saved = localStorage.getItem(STORAGE_USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    id: 'guest-session',
    email: 'khach@hoclieumamnon.vn',
    full_name: 'Khách tham quan',
    role: 'guest',
    avatar: '👶',
    downloads_today: 0
  };
}

let currentUser = getInitialUser();
let authListeners = [];
let cartListeners = [];

// Khởi tạo giỏ hàng
let cart = JSON.parse(localStorage.getItem(STORAGE_CART_KEY) || '[]');

// ====================================================================
// AUTH & QUẢN LÝ VAI TRÒ
// ====================================================================

export const authService = {
  getUser() {
    return currentUser;
  },

  isLiveSupabase() {
    return !!client && !supabaseConfig.url.includes('mock-hoclieu');
  },

  hasPermission(permissionCode) {
    if (!currentUser || !currentUser.role) return false;
    const allowedRoles = PERMISSIONS[permissionCode] || [];
    return allowedRoles.includes(currentUser.role);
  },

  async signIn(email, password) {
    // Nếu có live Supabase, thử auth thật
    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          // Lấy profile từ Supabase database
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          currentUser = {
            id: data.user.id,
            email: data.user.email,
            full_name: profile?.full_name || data.user.email.split('@')[0],
            role: profile?.role || 'parent',
            avatar: profile?.avatar_url || '👤'
          };
          this._saveAndNotify();
          return { success: true, user: currentUser };
        }
      } catch (err) {
        console.warn('Lỗi live Supabase auth, chuyển sang mock:', err);
      }
    }

    // Mock Login
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_LIST_KEY) || '[]');
    let found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      found = {
        id: 'usr-' + Date.now(),
        email: email,
        full_name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : (email.includes('gv') || email.includes('teacher') ? 'teacher' : 'parent'),
        avatar: '👤',
        downloads_today: 0
      };
      users.push(found);
      localStorage.setItem(STORAGE_USERS_LIST_KEY, JSON.stringify(users));
    }

    currentUser = found;
    this._saveAndNotify();
    return { success: true, user: currentUser };
  },

  async signUp(email, password, fullName, requestedRole = 'parent') {
    if (client) {
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: requestedRole }
          }
        });
        if (!error && data.user) {
          currentUser = {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            role: requestedRole,
            avatar: requestedRole === 'teacher' ? '👩‍🏫' : '💖'
          };
          this._saveAndNotify();
          return { success: true, user: currentUser };
        }
      } catch (e) {
        console.warn('Supabase signup error:', e);
      }
    }

    // Mock Signup
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_LIST_KEY) || '[]');
    const newUser = {
      id: 'usr-' + Date.now(),
      email,
      full_name: fullName || email.split('@')[0],
      role: requestedRole,
      avatar: requestedRole === 'teacher' ? '👩‍🏫' : '💖',
      downloads_today: 0
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_USERS_LIST_KEY, JSON.stringify(users));
    currentUser = newUser;
    this._saveAndNotify();
    return { success: true, user: currentUser };
  },

  signOut() {
    if (client) {
      client.auth.signOut().catch(() => {});
    }
    currentUser = {
      id: 'guest-session',
      email: 'khach@hoclieumamnon.vn',
      full_name: 'Khách tham quan',
      role: 'guest',
      avatar: '👶',
      downloads_today: 0
    };
    this._saveAndNotify();
  },

  // Chức năng chuyển đổi nhanh vai trò để phục vụ người dùng test phân quyền
  switchRole(newRole) {
    if (!ROLE_DEFINITIONS[newRole]) return;
    currentUser = {
      ...currentUser,
      role: newRole,
      full_name: newRole === 'admin' ? 'Cô Mai Quản Trị (Admin)' : (newRole === 'teacher' ? 'Cô Lan Phương (Giáo Viên)' : (newRole === 'parent' ? 'Mẹ Bé Bống (Phụ Huynh Pro)' : 'Khách vãng lai')),
      avatar: newRole === 'admin' ? '👩‍🏫' : (newRole === 'teacher' ? '🌸' : (newRole === 'parent' ? '💖' : '👶'))
    };
    this._saveAndNotify();
  },

  // Quản trị viên cập nhật vai trò cho người dùng khác
  getAllUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_LIST_KEY) || '[]');
  },

  updateUserRole(userId, newRole) {
    if (!this.hasPermission('roles:manage')) {
      throw new Error('Bạn không có quyền quản lý vai trò (Yêu cầu quyền admin)!');
    }
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_LIST_KEY) || '[]');
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    localStorage.setItem(STORAGE_USERS_LIST_KEY, JSON.stringify(updated));

    if (currentUser.id === userId) {
      currentUser.role = newRole;
      this._saveAndNotify();
    }
    return updated;
  },

  _saveAndNotify() {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
    authListeners.forEach(fn => fn(currentUser));
  },

  onAuthChange(callback) {
    authListeners.push(callback);
    return () => {
      authListeners = authListeners.filter(fn => fn !== callback);
    };
  }
};

// ====================================================================
// GIỎ HÀNG VÀ THANH TOÁN (SHOPPING CART & CHECKOUT)
// ====================================================================

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
        coverImage: material.coverImage,
        pages: material.pages,
        format: material.format,
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
// CẤU HÌNH SUPABASE SETTINGS PANEL
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
    
    // Thử kết nối lại
    try {
      if (trimmedUrl.startsWith('https://')) {
        client = createClient(trimmedUrl, trimmedKey);
      }
    } catch (e) {
      console.warn('Lỗi cấu hình Supabase:', e);
    }
  }
};
