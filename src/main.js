// ====================================================================
// HỌC LIỆU MẦM NON - MAIN APPLICATION SCRIPT
// Integrated with Supabase RBAC & Education.com Interactive Ecosystem
// ====================================================================

import confetti from 'canvas-confetti';
import {
  CATEGORIES,
  GRADE_LEVELS,
  TOPIC_FILTERS,
  FEATURED_PACKS,
  WORKSHEETS,
  EDUCATION_COM_FEATURES,
  PRICING_PLANS
} from './data/learningData.js';

import {
  authService,
  cartService,
  supabaseSettings,
  ROLE_DEFINITIONS,
  PERMISSIONS
} from './services/supabase.js';

// Application State
const state = {
  activeCategory: 'all',
  activeGrade: 'all',
  selectedTopics: [],
  selectedFormat: 'all',
  searchQuery: '',
  sortBy: 'featured',
  activeModal: null, // 'detail', 'cart', 'auth', 'admin', 'supabase-settings', 'game', 'generator', 'checkout-qr'
  selectedWorksheet: WORKSHEETS[0], // 've-ban-gau-misa'
  activePreviewPageIndex: 0,
  voucherCode: '',
  voucherDiscountPercent: 0,
  adminTab: 'users', // 'users' or 'sql'
  gameScore: 0,
  gameTargetShape: 'circle',
  authMode: 'login' // 'login' or 'signup'
};

// Formatting utilities
const formatVND = (num) => {
  if (num === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};

// ====================================================================
// DOM RENDERERS
// ====================================================================

function renderRBACBanner() {
  const user = authService.getUser();
  const roleInfo = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.guest;

  const html = `
    <div class="rbac-banner-inner">
      <div class="rbac-badge-current" style="border-color: ${roleInfo.badgeColor}">
        <span>${user.avatar || '👤'}</span>
        <span>${user.full_name} (${roleInfo.name})</span>
      </div>
      <span style="font-size: 11px; color: #CBD5E1; opacity: 0.9;">
        ⚡ Supabase RBAC: Phân quyền trực tiếp thời gian thực
      </span>
      <div class="role-switcher-pills">
        <span style="font-size: 11px; margin-right: 4px; color: #94A3B8;">Thử vai trò:</span>
        <button class="role-pill-btn ${user.role === 'admin' ? 'active' : ''}" data-switch-role="admin">👑 Admin</button>
        <button class="role-pill-btn ${user.role === 'teacher' ? 'active' : ''}" data-switch-role="teacher">👩‍🏫 Giáo Viên</button>
        <button class="role-pill-btn ${user.role === 'parent' ? 'active' : ''}" data-switch-role="parent">💖 Phụ Huynh Pro</button>
        <button class="role-pill-btn ${user.role === 'guest' ? 'active' : ''}" data-switch-role="guest">👶 Khách</button>
        
        <button class="supabase-btn-trigger" id="btn-open-supabase-config">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19h20L12 2zm0 3.5L18.5 17H5.5L12 5.5z"/></svg>
          Supabase SQL
        </button>
        ${authService.hasPermission('roles:manage') ? `
          <button class="role-pill-btn" style="background:#EF4444; border-color:#EF4444;" id="btn-open-admin-mgr">
            🛡️ Quản lý Quyền
          </button>
        ` : ''}
      </div>
    </div>
  `;
  document.getElementById('rbac-banner').innerHTML = html;
}

function renderHeader() {
  const user = authService.getUser();
  const cartCount = cartService.getItemCount();

  const html = `
    <div class="container header-container">
      <div class="brand-logo" id="logo-home-click">
        <img src="/assets/hero_girl.jpg" alt="Học liệu mầm non" class="logo-avatar" />
        <div class="brand-text-col">
          <span class="brand-name">
            Học liệu mầm non <span class="heart-icon">💖</span>
          </span>
          <span class="brand-tagline">Sáng tạo hôm nay | Nuôi dưỡng tương lai</span>
        </div>
      </div>

      <ul class="nav-menu">
        <li class="nav-link active" id="nav-home">Trang chủ</li>
        <li class="nav-dropdown-wrapper">
          <span class="nav-link">
            Học liệu <span>▾</span>
          </span>
          <div class="nav-dropdown-menu">
            ${CATEGORIES.map(c => `
              <div class="nav-dropdown-item" data-nav-category="${c.id}">
                <span>${c.name}</span>
                <span style="font-size: 11px; color: ${c.color}">${c.badge}</span>
              </div>
            `).join('')}
          </div>
        </li>
        <li class="nav-link" id="nav-featured-packs">Bộ sách</li>
        <li class="nav-link" id="nav-edu-games">Trò chơi (Game)</li>
        <li class="nav-link" id="nav-lesson-plans">Giáo án</li>
        <li class="nav-link" id="nav-generator">Tạo bài tập</li>
        <li class="nav-link" id="nav-pricing">Bảng giá</li>
      </ul>

      <div class="header-actions">
        <button class="search-toggle-btn" id="btn-open-search" title="Tìm kiếm">
          🔍
        </button>
        <div class="cart-btn-wrapper">
          <button class="cart-icon-btn" id="btn-open-cart" title="Giỏ hàng">
            🛒
            ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
          </button>
        </div>

        ${user.role === 'guest' ? `
          <button class="btn-login" id="btn-header-login">
            Đăng nhập
          </button>
        ` : `
          <div class="user-profile-badge" id="btn-user-profile">
            <span>${user.avatar}</span>
            <span>${user.full_name}</span>
          </div>
        `}
      </div>
    </div>
  `;
  document.getElementById('main-header').innerHTML = html;
}

function renderHero() {
  const html = `
    <div class="container">
      <div class="hero-layout">
        <div class="hero-text-col">
          <h1 class="hero-title-main">Kho học liệu mầm non</h1>
          <h2 class="hero-subtitle-highlight">Đa dạng – Sinh động – Dễ sử dụng</h2>
          <p class="hero-description">
            Các bộ sách, worksheet và học liệu được thiết kế dành riêng cho trẻ mầm non. 
            <strong>Giúp con học mà chơi - chơi mà phát triển!</strong> Đồng bộ chuẩn sư phạm GDMN và mô hình tương tác Education.com.
          </p>
          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            <button class="hero-cta-btn" id="btn-hero-explore">
              Khám phá học liệu →
            </button>
            <button class="hero-cta-btn" style="background: #FFFFFF; color: var(--secondary); border: 2px solid var(--secondary); box-shadow: none;" id="btn-hero-generator">
              ✨ Tự tạo bài tập ngay
            </button>
          </div>
        </div>

        <div class="hero-visual-card">
          <img src="/assets/hero_girl.jpg" alt="Bé mầm non sáng tạo" class="hero-mascot-img" />
          <div class="floating-badge badge-1">
            <span>🎨</span>
            <span>+35.000 Học liệu in ấn</span>
          </div>
          <div class="floating-badge badge-2">
            <span>⭐</span>
            <span>5.0/5 Đánh giá từ giáo viên</span>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('hero-section').innerHTML = html;
}

function renderValueProps() {
  const html = `
    <div class="container">
      <div class="values-grid">
        <div class="value-item">
          <div class="value-icon-box">🎨</div>
          <div class="value-text-box">
            <h4>Thiết kế bởi họa sĩ mầm non</h4>
            <p>Nét vẽ tròn trịa, màu sắc tươi vui</p>
          </div>
        </div>

        <div class="value-item">
          <div class="value-icon-box">🌱</div>
          <div class="value-text-box">
            <h4>Nội dung phù hợp theo độ tuổi</h4>
            <p>Từ nhà trẻ 2-3 đến tiền tiểu học</p>
          </div>
        </div>

        <div class="value-item">
          <div class="value-icon-box">🖨️</div>
          <div class="value-text-box">
            <h4>Dễ in - Dễ sử dụng tại nhà & lớp</h4>
            <p>Chuẩn kích thước A4 sắc nét</p>
          </div>
        </div>

        <div class="value-item">
          <div class="value-icon-box">📅</div>
          <div class="value-text-box">
            <h4>Đa dạng chủ đề, cập nhật liên tục</h4>
            <p>Bổ sung học liệu mới mỗi tuần</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('values-section').innerHTML = html;
}

function renderCategories() {
  const html = `
    <div class="container section-wrapper">
      <div class="section-header">
        <h3 class="section-title">Danh mục học liệu</h3>
        <span class="section-link-more" id="link-see-all-cats">Xem tất cả →</span>
      </div>

      <div class="categories-grid">
        ${CATEGORIES.map(cat => `
          <div class="category-card" data-category-id="${cat.id}" style="--cat-color: ${cat.color}">
            <div class="category-icon-circle" style="background-color: ${cat.bgColor}; color: ${cat.color}">
              ${cat.icon === 'palette' ? '🎨' : (cat.icon === '123' ? '🔢' : (cat.icon === 'ABC' ? '🔤' : (cat.icon === 'sprout' ? '🌱' : (cat.icon === 'heart' ? '💖' : '💡'))))}
            </div>
            <h4 class="category-name">${cat.name}</h4>
            <span class="category-sub">${cat.subtitle}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('categories-section').innerHTML = html;
}

function renderFeaturedPacks() {
  const html = `
    <div class="container section-wrapper" id="featured-packs-container">
      <div class="section-header">
        <h3 class="section-title">Bộ học liệu nổi bật</h3>
        <span class="section-link-more" id="link-see-all-packs">Xem tất cả →</span>
      </div>

      <div class="featured-packs-grid">
        ${FEATURED_PACKS.map(pack => `
          <div class="featured-pack-card" data-pack-id="${pack.id}">
            <div class="pack-preview-frame">
              <span class="pack-badge" style="color: ${pack.color}">${pack.badge}</span>
              <img src="${pack.coverImage}" alt="${pack.title}" />
            </div>
            <div class="pack-content-body">
              <h4 class="pack-title">${pack.title}</h4>
              <span class="pack-target-age">${pack.targetAge}</span>
              <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">${pack.description}</p>
              <div class="pack-footer">
                <span class="pack-price">${formatVND(pack.price)}</span>
                <button class="pack-btn-open" data-open-pack="${pack.id}">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('featured-packs-section').innerHTML = html;
}

function renderEducationSuite() {
  const html = `
    <div class="container">
      <div class="edu-suite-section">
        <div class="edu-suite-header">
          <span class="badge-tag">MÔ HÌNH EDUCATION.COM TƯƠNG TÁC</span>
          <h2>Hệ sinh thái Giáo dục Toàn diện cho Bé & Giáo viên</h2>
          <p style="font-size: 15px; color: var(--text-muted);">
            Kết hợp giữa học liệu in truyền thống và công nghệ học tập số hóa tương tác giúp trẻ phát triển não bộ toàn diện.
          </p>
        </div>

        <div class="edu-suite-grid">
          ${EDUCATION_COM_FEATURES.map((item, idx) => `
            <div class="edu-card">
              <div class="edu-card-icon">
                ${idx === 0 ? '🎮' : (idx === 1 ? '📄' : (idx === 2 ? '🪄' : '📚'))}
              </div>
              <h3>${item.title}</h3>
              <p>${item.desc}</p>
              <button class="edu-card-btn" data-action="${item.action}">
                ${item.cta} →
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  document.getElementById('edu-suite-section').innerHTML = html;
}

function renderCatalog() {
  const activeCatObj = CATEGORIES.find(c => c.id === state.activeCategory);
  const catalogTitle = activeCatObj ? activeCatObj.name : 'Tất cả học liệu mầm non';
  const catalogDesc = activeCatObj ? activeCatObj.description : 'Các hoạt động tô màu, vẽ, xé dán, tạo hình giúp trẻ phát triển óc sáng tạo, khả năng quan sát và vận động tinh.';

  // Lọc danh sách học liệu
  let filtered = WORKSHEETS.filter(item => {
    if (state.activeCategory !== 'all' && item.category !== state.activeCategory) return false;
    if (state.activeGrade !== 'all' && item.ageId !== state.activeGrade) return false;
    if (state.selectedTopics.length > 0 && !state.selectedTopics.includes(item.topic)) return false;
    if (state.selectedFormat === 'pdf' && !item.format.includes('PDF')) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTopic = item.topic.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTopic) return false;
    }
    return true;
  });

  // Sắp xếp
  if (state.sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (state.sortBy === 'newest') {
    filtered.sort((a, b) => b.downloads - a.downloads);
  }

  const html = `
    <div class="container catalog-section" id="catalog-anchor">
      <div class="catalog-header-bar">
        <h2 class="catalog-title-tag">
          <span style="font-size: 34px;">🎨</span>
          ${catalogTitle}
        </h2>
        <p class="catalog-desc">${catalogDesc}</p>
      </div>

      <div class="catalog-layout">
        <!-- FILTER SIDEBAR -->
        <aside class="filter-sidebar">
          <div class="filter-sidebar-title">
            <span>Lọc theo</span>
            <span class="filter-reset-link" id="btn-reset-filters">Đặt lại</span>
          </div>

          <!-- ĐỘ TUỔI -->
          <div class="filter-group">
            <h5 class="filter-group-label">Độ tuổi</h5>
            <div class="filter-options-list">
              ${GRADE_LEVELS.map(g => `
                <label class="filter-checkbox-item">
                  <input type="radio" name="grade_filter" value="${g.id}" ${state.activeGrade === g.id ? 'checked' : ''} />
                  <span>${g.label} ${g.group ? `(${g.group})` : ''}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- CHỦ ĐỀ -->
          <div class="filter-group">
            <h5 class="filter-group-label">Chủ đề</h5>
            <div class="filter-options-list">
              ${TOPIC_FILTERS.map(topic => `
                <label class="filter-checkbox-item">
                  <input type="checkbox" class="topic-checkbox" value="${topic}" ${state.selectedTopics.includes(topic) ? 'checked' : ''} />
                  <span>${topic}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- ĐỊNH DẠNG -->
          <div class="filter-group">
            <h5 class="filter-group-label">Định dạng</h5>
            <div class="filter-options-list">
              <label class="filter-checkbox-item">
                <input type="checkbox" id="chk-pdf-printable" ${state.selectedFormat === 'pdf' ? 'checked' : ''} />
                <span>PDF (in được)</span>
              </label>
            </div>
          </div>
        </aside>

        <!-- MAIN WORKSHEET GRID -->
        <main class="catalog-main-content">
          <div class="catalog-toolbar">
            <span class="results-count-text">Hiển thị 1–${filtered.length} của ${WORKSHEETS.length} học liệu</span>
            
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 13px; color: var(--text-muted); font-weight: 700;">Sắp xếp:</span>
              <select class="sort-dropdown" id="catalog-sort-select">
                <option value="featured" ${state.sortBy === 'featured' ? 'selected' : ''}>Nổi bật nhất</option>
                <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Mới nhất & Tải nhiều</option>
                <option value="price-asc" ${state.sortBy === 'price-asc' ? 'selected' : ''}>Giá tăng dần</option>
                <option value="price-desc" ${state.sortBy === 'price-desc' ? 'selected' : ''}>Giá giảm dần</option>
                <option value="rating" ${state.sortBy === 'rating' ? 'selected' : ''}>Đánh giá cao nhất</option>
              </select>
            </div>
          </div>

          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
              <span style="font-size: 48px;">🔍</span>
              <h3 style="margin-top: 12px; font-weight: 800;">Không tìm thấy học liệu phù hợp</h3>
              <p style="color: var(--text-muted); font-size: 14px; margin-top: 6px;">Hãy thử điều chỉnh bộ lọc độ tuổi hoặc chủ đề bên cạnh!</p>
              <button class="hero-cta-btn" style="margin-top: 18px; padding: 8px 20px; font-size: 14px;" id="btn-reset-filters-2">Xem tất cả học liệu</button>
            </div>
          ` : `
            <div class="worksheets-grid">
              ${filtered.map(ws => `
                <div class="worksheet-card" data-worksheet-id="${ws.id}">
                  <div class="worksheet-thumb-frame" data-open-detail="${ws.id}">
                    <img src="${ws.coverImage}" alt="${ws.title}" loading="lazy" />
                    <div class="card-quick-preview-overlay">
                      <span>👁️ Xem trước</span>
                    </div>
                  </div>
                  <h4 class="worksheet-card-title" data-open-detail="${ws.id}">${ws.title}</h4>
                  <div class="worksheet-card-meta">
                    <span>${ws.pages} trang</span>
                    <span>•</span>
                    <span>${ws.age}</span>
                  </div>
                  <div class="worksheet-card-bottom">
                    <span class="worksheet-card-price ${ws.price === 0 ? 'free' : ''}">
                      ${formatVND(ws.price)}
                    </span>
                    <button class="worksheet-add-cart-btn" data-add-cart="${ws.id}" title="Thêm vào giỏ hàng">
                      🛒
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </main>
      </div>
    </div>
  `;
  document.getElementById('catalog-section').innerHTML = html;
}

function renderPricing() {
  const html = `
    <div class="pricing-section" id="pricing-anchor">
      <div class="container">
        <div class="pricing-header">
          <span style="color: var(--primary); font-weight: 800; font-size: 13px; text-transform: uppercase;">GÓI TÀI KHOẢN & BẢN QUYỀN HỌC LIỆU</span>
          <h2>Lựa chọn gói phù hợp cho Bé và Lớp học</h2>
          <p style="font-size: 15px; color: var(--text-muted);">
            Tải không giới hạn hơn 35.000 file PDF chất lượng cao chuẩn in ấn A4 và truy cập hệ thống giáo án STEAM mầm non.
          </p>
        </div>

        <div class="pricing-grid">
          ${PRICING_PLANS.map(plan => `
            <div class="pricing-card ${plan.popular ? 'featured' : ''}">
              ${plan.popular ? `<span class="pricing-featured-badge">ĐƯỢC YÊU THÍCH NHẤT</span>` : ''}
              <h3 class="plan-name">${plan.name}</h3>
              <p class="plan-tagline">${plan.tagline}</p>

              <div class="plan-price-row">
                <span class="plan-price-val">${plan.price === 0 ? '0đ' : formatVND(plan.price)}</span>
                <span class="plan-price-period">/ ${plan.period}</span>
              </div>

              <ul class="plan-features-list">
                ${plan.features.map(f => `
                  <li class="plan-feature-item">
                    <span class="check">✓</span>
                    <span>${f}</span>
                  </li>
                `).join('')}
              </ul>

              <button class="plan-cta-btn" data-choose-plan="${plan.id}" data-role-target="${plan.roleTarget}">
                ${plan.buttonText}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  document.getElementById('pricing-section').innerHTML = html;
}

function renderFooter() {
  const html = `
    <footer class="main-footer">
      <div class="container">
        <div class="footer-top-grid">
          <div class="footer-col-about">
            <div class="brand-logo" style="margin-bottom: 12px;">
              <img src="/assets/hero_girl.jpg" alt="Logo" class="logo-avatar" />
              <span class="brand-name">Học liệu mầm non 💖</span>
            </div>
            <p>
              Nền tảng cung cấp học liệu mầm non, tranh vẽ, worksheet và giáo án chuẩn giáo dục số một Việt Nam, đồng hành cùng hàng triệu phụ huynh và giáo viên.
            </p>
          </div>

          <div class="footer-col">
            <h4>Danh mục nổi bật</h4>
            <ul class="footer-links-list">
              <li><a href="#catalog-anchor">Tạo hình & Tô màu</a></li>
              <li><a href="#catalog-anchor">Làm quen toán 123</a></li>
              <li><a href="#catalog-anchor">Làm quen chữ cái ABC</a></li>
              <li><a href="#catalog-anchor">Thế giới động vật</a></li>
              <li><a href="#catalog-anchor">Kỹ năng sống cho bé</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Dành cho Giáo viên</h4>
            <ul class="footer-links-list">
              <li><a href="#" id="ft-lesson-plans">Giáo án STEAM chuẩn 5E</a></li>
              <li><a href="#" id="ft-generator">Công cụ tạo đề bài tập</a></li>
              <li><a href="#" id="ft-packages">Gói bản quyền trường học</a></li>
              <li><a href="#" id="ft-rbac">Supabase Quản lý quyền</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Hỗ trợ & Liên hệ</h4>
            <ul class="footer-links-list">
              <li>📞 Hotline: 0988.xxx.xxx</li>
              <li>✉️ Email: cskh@hoclieumamnon.vn</li>
              <li>📍 Trụ sở: Hà Nội & TP. Hồ Chí Minh</li>
              <li>🛡️ Chính sách bảo mật & Bản quyền</li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <span>© 2026 Học Liệu Mầm Non. Bản quyền thuộc về hệ thống GDMN Việt Nam & Cảm hứng từ Education.com.</span>
          <div style="display: flex; gap: 16px;">
            <span>Điều khoản sử dụng</span>
            <span>Chính sách đổi trả</span>
            <span>Bảo mật dữ liệu</span>
          </div>
        </div>
      </div>
    </footer>
  `;
  document.getElementById('main-footer').innerHTML = html;
}

// ====================================================================
// MODAL RENDERERS (DETAIL, CART, AUTH, ADMIN RBAC, GENERATOR, GAME)
// ====================================================================

function renderModals() {
  const container = document.getElementById('modals-container');
  if (!state.activeModal) {
    container.innerHTML = '';
    return;
  }

  // 1. PRODUCT DETAIL MODAL (MATCHING TOP-RIGHT OF USER'S SCREENSHOT)
  if (state.activeModal === 'detail') {
    const ws = state.selectedWorksheet;
    const currentImg = ws.previewPages && ws.previewPages[state.activePreviewPageIndex] 
      ? ws.previewPages[state.activePreviewPageIndex].image 
      : ws.coverImage;

    const canDownloadUnlimited = authService.hasPermission('materials:download_unlimited');

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 900px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>
          
          <div class="detail-modal-body">
            <div class="detail-breadcrumbs">
              <span>Trang chủ</span> <span>›</span>
              <span>${CATEGORIES.find(c => c.id === ws.category)?.name || 'Học liệu'}</span> <span>›</span>
              <span style="color: var(--text-main); font-weight: 700;">${ws.title}</span>
            </div>

            <div class="detail-columns">
              <!-- LEFT COLUMN: PREVIEW STAGE & THUMBNAILS -->
              <div class="detail-preview-col">
                <div class="detail-main-stage">
                  <img src="${currentImg}" alt="${ws.title}" id="detail-active-preview-img" />
                </div>

                <div class="detail-thumbnails-row">
                  ${(ws.previewPages || [{ id: 1, image: ws.coverImage }]).map((p, idx) => `
                    <div class="detail-thumb-box ${state.activePreviewPageIndex === idx ? 'active' : ''}" data-thumb-idx="${idx}">
                      <img src="${p.image}" alt="Trang ${idx + 1}" />
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- RIGHT COLUMN: SPECS, RATING & ACTION BUTTONS -->
              <div class="detail-info-col">
                <div class="detail-title-row">
                  <h2 class="detail-title">${ws.title}</h2>
                  <span class="badge-pdf-tag">PDF</span>
                </div>

                <div class="detail-rating-row">
                  <span class="stars-gold">★★★★★</span>
                  <span style="font-weight: 800;">${ws.rating.toFixed(1)}</span>
                  <span style="color: var(--text-muted);">(${ws.reviewsCount} đánh giá)</span>
                </div>

                <div class="detail-specs-list">
                  <div class="detail-spec-line">
                    <strong>Độ tuổi:</strong>
                    <span>${ws.age}</span>
                  </div>
                  <div class="detail-spec-line">
                    <strong>Số trang:</strong>
                    <span>${ws.pages} trang</span>
                  </div>
                  <div class="detail-spec-line">
                    <strong>Chủ đề:</strong>
                    <span>${ws.topic}, Hình học</span>
                  </div>
                  <div class="detail-spec-line">
                    <strong>Định dạng:</strong>
                    <span>${ws.format}</span>
                  </div>
                </div>

                <div class="detail-desc-box">
                  <strong>Mô tả:</strong><br/>
                  ${ws.description}
                </div>

                <div class="detail-cta-row">
                  <button class="btn-detail-add-cart" id="modal-btn-add-cart" data-id="${ws.id}">
                    🛒 Thêm vào giỏ hàng (${formatVND(ws.price)})
                  </button>
                  <button class="btn-detail-buy-now" id="modal-btn-buy-now" data-id="${ws.id}">
                    ⚡ Mua ngay (${formatVND(ws.price)})
                  </button>
                  
                  ${canDownloadUnlimited ? `
                    <button class="btn-detail-free-download" id="modal-btn-instant-download" data-id="${ws.id}">
                      ⬇️ Tải file gốc PDF vector (Quyền: ${authService.getUser().role.toUpperCase()})
                    </button>
                  ` : `
                    <button class="btn-detail-free-download" style="background: #0284C7;" id="modal-btn-sample-download" data-id="${ws.id}">
                      📥 Tải bản mẫu miễn phí (Còn 2 lượt dùng thử)
                    </button>
                  `}
                </div>
              </div>
            </div>

            <!-- BOTTOM: XEM TRƯỚC MỘT SỐ TRANG KHÁC TRONG BỘ -->
            <div class="detail-carousel-bottom">
              <h4 class="detail-carousel-title">Xem trước một số trang khác trong bộ</h4>
              <div class="carousel-thumbnails-strip">
                <div class="strip-item" data-switch-ws="ve-ban-gau-misa">
                  <img src="/assets/misa_bear.jpg" alt="Vẽ bạn gấu Misa" />
                </div>
                <div class="strip-item" data-switch-ws="ve-con-meo">
                  <img src="/assets/animals_pack.jpg" alt="Vẽ con mèo" />
                </div>
                <div class="strip-item" data-switch-ws="ve-ngoi-nha">
                  <img src="/assets/hero_girl.jpg" alt="Vẽ ngôi nhà" />
                </div>
                <div class="strip-item" data-switch-ws="to-mau-cac-loai-qua">
                  <img src="/assets/misa_bear.jpg" alt="Tô màu các loại quả" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 2. SHOPPING CART DRAWER / MODAL (MATCHING BOTTOM-RIGHT OF USER'S SCREENSHOT)
  if (state.activeModal === 'cart') {
    const cartItems = cartService.getCart();
    const rawTotal = cartService.getTotal();
    const discount = (rawTotal * state.voucherDiscountPercent) / 100;
    const finalTotal = Math.max(0, rawTotal - discount);

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet cart-modal-sheet">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <h3 class="cart-header-title">
            🛒 Giỏ hàng của bạn
          </h3>

          ${cartItems.length === 0 ? `
            <div style="text-align: center; padding: 40px 0;">
              <span style="font-size: 54px;">🛍️</span>
              <p style="font-weight: 700; margin-top: 12px; color: var(--text-muted);">Giỏ hàng đang trống!</p>
              <button class="hero-cta-btn" style="margin-top: 18px; padding: 10px 24px; font-size: 14px;" id="cart-go-shopping">
                Khám phá kho học liệu ngay
              </button>
            </div>
          ` : `
            <div class="cart-items-list">
              ${cartItems.map(item => `
                <div class="cart-item-row" data-cart-row="${item.id}">
                  <img src="${item.coverImage}" alt="${item.title}" class="cart-item-thumb" />
                  <div>
                    <h5 class="cart-item-title">${item.title}</h5>
                    <span class="cart-item-sub">${item.pages} trang | ${item.format}</span>
                  </div>
                  <span class="cart-item-price">${formatVND(item.price)}</span>
                  <div class="qty-counter">
                    <button class="qty-btn" data-qty-delta="-1" data-item-id="${item.id}">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" data-qty-delta="1" data-item-id="${item.id}">+</button>
                  </div>
                  <button class="cart-item-delete" data-remove-item="${item.id}" title="Xóa khỏi giỏ">🗑️</button>
                </div>
              `).join('')}
            </div>

            <!-- VOUCHER PROMO CODE -->
            <div class="voucher-row">
              <input 
                type="text" 
                class="voucher-input" 
                id="voucher-input" 
                placeholder="Nhập mã giảm giá (VD: MAMNON2026, GIAOVIEN)" 
                value="${state.voucherCode}" 
              />
              <button class="voucher-btn" id="btn-apply-voucher">Áp dụng</button>
            </div>

            ${state.voucherDiscountPercent > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 14px; color: #10B981; font-weight: 700; margin-bottom: 12px;">
                <span>Mã giảm giá (${state.voucherDiscountPercent}%):</span>
                <span>-${formatVND(discount)}</span>
              </div>
            ` : ''}

            <!-- TOTAL SUMMARY -->
            <div class="cart-total-box">
              <span class="cart-total-label">Tổng cộng:</span>
              <span class="cart-total-amount">${formatVND(finalTotal)}</span>
            </div>

            <button class="btn-checkout-now" id="btn-cart-checkout">
              Thanh toán →
            </button>
          `}

          <!-- BẠN CÓ THỂ THÍCH THÊM -->
          <div class="cart-recommend-section">
            <h5 class="cart-recommend-title">Bạn có thể thích thêm</h5>
            <div class="cart-recommend-grid">
              ${WORKSHEETS.slice(2, 6).map(rec => `
                <div class="recommend-mini-card" data-open-detail="${rec.id}">
                  <img src="${rec.coverImage}" alt="${rec.title}" />
                  <span>${rec.title}</span>
                  <span style="color: var(--primary); font-size: 12px; font-weight: 800;">${formatVND(rec.price)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 3. CHECKOUT & VIETQR PAYMENT MODAL
  if (state.activeModal === 'checkout-qr') {
    const rawTotal = cartService.getTotal();
    const discount = (rawTotal * state.voucherDiscountPercent) / 100;
    const finalTotal = Math.max(0, rawTotal - discount);

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 520px; text-align: center; padding: 36px 28px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <span style="font-size: 40px;">💳</span>
          <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 800; margin: 8px 0;">Thanh toán VietQR Học Liệu</h3>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">
            Quét mã QR bằng ứng dụng ngân hàng hoặc ví MoMo để hoàn tất tải trọn bộ PDF bản quyền.
          </p>

          <div style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: var(--radius-lg); padding: 20px; display: inline-block; margin-bottom: 20px;">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HOCLIEU_ORDER_${Date.now()}_${finalTotal}" 
              alt="QR Code thanh toán" 
              style="width: 180px; height: 180px; margin: 0 auto;" 
            />
            <div style="margin-top: 12px; font-weight: 800; font-size: 18px; color: var(--primary);">
              ${formatVND(finalTotal)}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              Nội dung: <strong>HOCLIEU ${authService.getUser().email.split('@')[0]}</strong>
            </div>
          </div>

          <button class="btn-checkout-now" id="btn-confirm-payment-success">
            ✅ Giả lập thanh toán thành công (Test Mode)
          </button>
        </div>
      </div>
    `;
    return;
  }

  // 4. SUPABASE ADMIN & RBAC PERMISSION MANAGER MODAL
  if (state.activeModal === 'admin') {
    const users = authService.getAllUsers();

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet admin-modal-sheet">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h2 style="font-family: var(--font-heading); font-size: 24px; font-weight: 800;">
                🛡️ Supabase Quản lý Quyền & Vai trò (RBAC)
              </h2>
              <p style="font-size: 13px; color: var(--text-muted);">
                Kiểm soát quyền truy cập tài liệu, cấp quyền Giáo Viên/Admin và Row-Level Security
              </p>
            </div>
            <span class="rbac-badge-current" style="background: #EF4444;">
              Quản trị viên: ${authService.getUser().full_name}
            </span>
          </div>

          <div class="admin-header-tabs">
            <button class="admin-tab-btn ${state.adminTab === 'users' ? 'active' : ''}" data-admin-tab="users">
              👥 Danh sách Người dùng & Vai trò
            </button>
            <button class="admin-tab-btn ${state.adminTab === 'matrix' ? 'active' : ''}" data-admin-tab="matrix">
              🔑 Ma trận Phân quyền (Permissions)
            </button>
            <button class="admin-tab-btn ${state.adminTab === 'sql' ? 'active' : ''}" data-admin-tab="sql">
              📜 Supabase SQL Schema (RLS)
            </button>
          </div>

          ${state.adminTab === 'users' ? `
            <table class="users-rbac-table">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Họ và tên</th>
                  <th>Vai trò hiện tại</th>
                  <th>Hạn mức tải</th>
                  <th>Thao tác cấp quyền</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><strong>${u.email}</strong></td>
                    <td>${u.full_name}</td>
                    <td>
                      <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; background: ${ROLE_DEFINITIONS[u.role]?.bgColor || '#EEE'}; color: ${ROLE_DEFINITIONS[u.role]?.badgeColor || '#333'};">
                        ${ROLE_DEFINITIONS[u.role]?.name || u.role}
                      </span>
                    </td>
                    <td>${u.role === 'admin' || u.role === 'teacher' ? 'Không giới hạn' : '3 lượt/tháng'}</td>
                    <td>
                      <select class="role-select-box" data-change-user-role="${u.id}">
                        <option value="guest" ${u.role === 'guest' ? 'selected' : ''}>Khách</option>
                        <option value="parent" ${u.role === 'parent' ? 'selected' : ''}>Phụ huynh</option>
                        <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Giáo viên</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                      </select>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : (state.adminTab === 'matrix' ? `
            <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 18px; margin-bottom: 20px;">
              <h4 style="margin-bottom: 12px; font-weight: 800;">Ma trận quyền hệ thống (Permission Mapping):</h4>
              <ul style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                ${Object.entries(PERMISSIONS).map(([perm, roles]) => `
                  <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
                    <code>${perm}</code>
                    <div>
                      ${roles.map(r => `<span style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; margin-left: 4px; font-size: 11px;">${r}</span>`).join('')}
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : `
            <div class="sql-viewer-container">
              <button class="copy-sql-btn" id="btn-copy-sql">📋 Sao chép SQL</button>
              <pre>-- Supabase PostgreSQL Schema & RLS Policies
-- Chạy đoạn script này trong Supabase SQL Editor:
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'parent',
  full_name TEXT
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" 
ON materials FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Public read" 
ON materials FOR SELECT 
USING (true);</pre>
            </div>
          `)}
        </div>
      </div>
    `;
    return;
  }

  // 5. SUPABASE CONNECTION SETTINGS MODAL
  if (state.activeModal === 'supabase-settings') {
    const config = supabaseSettings.getConfig();

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 600px; padding: 32px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <span style="font-size: 32px;">⚡</span>
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 800;">
                Cấu hình Kết nối Supabase
              </h3>
              <p style="font-size: 13px; color: var(--text-muted);">
                Kết nối trực tiếp với dự án Supabase của bạn để đồng bộ Auth & Database thật.
              </p>
            </div>
          </div>

          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-md); padding: 14px; font-size: 13px; color: #1E40AF; margin-bottom: 20px;">
            ℹ️ Hệ thống hiện đang tích hợp <strong>Động cơ Mô phỏng Supabase RBAC</strong> sẵn sàng sử dụng ngay, hoặc bạn có thể điền thông tin dự án Supabase bên dưới.
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">
                SUPABASE PROJECT URL:
              </label>
              <input 
                type="text" 
                id="cfg-supabase-url" 
                class="voucher-input" 
                style="width: 100%;" 
                value="${config.url}" 
                placeholder="https://xyzcompany.supabase.co" 
              />
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">
                SUPABASE ANON KEY:
              </label>
              <input 
                type="text" 
                id="cfg-supabase-key" 
                class="voucher-input" 
                style="width: 100%; font-family: monospace; font-size: 12px;" 
                value="${config.anonKey}" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
              />
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button class="voucher-btn" id="modal-close-btn-2">Đóng</button>
            <button class="hero-cta-btn" style="padding: 10px 24px; font-size: 14px;" id="btn-save-supabase-config">
              Lưu cấu hình Supabase
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 6. AUTH LOGIN / SIGNUP MODAL
  if (state.activeModal === 'auth') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 440px; padding: 36px 30px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">💖</span>
            <h3 style="font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin-top: 8px;">
              ${state.authMode === 'login' ? 'Đăng nhập Học liệu mầm non' : 'Đăng ký Tài khoản mới'}
            </h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Quản lý bởi Supabase Authentication & Role RBAC
            </p>
          </div>

          <form id="auth-form" style="display: flex; flex-direction: column; gap: 14px;">
            ${state.authMode === 'signup' ? `
              <div>
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Họ và tên:</label>
                <input type="text" id="auth-fullname" required class="voucher-input" style="width: 100%;" placeholder="Cô Mai / Mẹ Bé Bông" />
              </div>
              <div>
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Bạn là:</label>
                <select id="auth-role" class="sort-dropdown" style="width: 100%; padding: 10px;">
                  <option value="parent">Phụ huynh học sinh</option>
                  <option value="teacher">Giáo viên mầm non</option>
                </select>
              </div>
            ` : ''}

            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Email:</label>
              <input type="email" id="auth-email" required class="voucher-input" style="width: 100%;" placeholder="email@gmail.com" />
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Mật khẩu:</label>
              <input type="password" id="auth-password" required class="voucher-input" style="width: 100%;" placeholder="••••••••" />
            </div>

            <button type="submit" class="btn-checkout-now" style="margin-top: 10px;">
              ${state.authMode === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <div style="text-align: center; margin-top: 18px; font-size: 13px;">
            ${state.authMode === 'login' ? `
              Chưa có tài khoản? <a href="#" id="toggle-auth-signup" style="color: var(--primary); font-weight: 800;">Đăng ký miễn phí</a>
            ` : `
              Đã có tài khoản? <a href="#" id="toggle-auth-login" style="color: var(--primary); font-weight: 800;">Đăng nhập</a>
            `}
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); text-align: center;">
            <span style="font-size: 12px; color: var(--text-muted);">Đăng nhập nhanh tài khoản mẫu:</span>
            <div style="display: flex; gap: 6px; justify-content: center; margin-top: 8px;">
              <button class="role-pill-btn" style="color: #333; background: #EEE;" data-quick-login="admin@hoclieumamnon.vn">👑 Admin</button>
              <button class="role-pill-btn" style="color: #333; background: #EEE;" data-quick-login="giao_vien_lan@truonghoa.edu.vn">👩‍🏫 Giáo Viên</button>
              <button class="role-pill-btn" style="color: #333; background: #EEE;" data-quick-login="me_be_bong@gmail.com">💖 Phụ Huynh</button>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 7. INTERACTIVE MINI-GAME MODAL (EDUCATION.COM MODEL)
  if (state.activeModal === 'game') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 640px; padding: 32px; text-align: center;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <span style="font-size: 40px;">🎮</span>
          <h3 style="font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin-top: 6px;">
            Trò chơi: Nhận biết Hình học cùng Bạn Gấu Misa
          </h3>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">
            Mô phỏng trò chơi giáo dục tương tác theo chuẩn Education.com
          </p>

          <div class="game-canvas-board">
            <h4 style="font-size: 20px; color: var(--secondary); font-weight: 800;" id="game-question">
              Bé hãy bấm vào <strong>HÌNH TRÒN ⚪</strong> để cho bạn gấu Misa nhé!
            </h4>

            <div class="game-shapes-row">
              <div class="game-shape-target" data-shape="square" title="Hình vuông">
                🟦
              </div>
              <div class="game-shape-target" data-shape="circle" title="Hình tròn">
                🟡
              </div>
              <div class="game-shape-target" data-shape="triangle" title="Hình tam giác">
                🔺
              </div>
            </div>

            <div style="font-size: 18px; font-weight: 800; color: #10B981;" id="game-feedback">
              Điểm của bé: <span id="game-score-display">${state.gameScore}</span> ⭐
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 8. WORKSHEET GENERATOR TOOL (EDUCATION.COM "BUILD A WORKSHEET")
  if (state.activeModal === 'generator') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 780px; padding: 32px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <span style="font-size: 36px;">🪄</span>
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 24px; font-weight: 800;">
                Công cụ Tự tạo Worksheet cho Bé (Worksheet Generator)
              </h3>
              <p style="font-size: 13px; color: var(--text-muted);">
                Tạo phiếu bài tập cá nhân hóa mang tên bé, in trực tiếp khổ A4 chỉ trong 30 giây.
              </p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">Tên của bé:</label>
              <input type="text" id="gen-child-name" class="voucher-input" style="width: 100%;" value="Bé Bống" />
            </div>
            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">Dạng bài tập:</label>
              <select id="gen-sheet-type" class="sort-dropdown" style="width: 100%; padding: 10px;">
                <option value="math">Làm quen toán: Đếm quả táo (1-5)</option>
                <option value="shapes">Tạo hình: Nối hình tròn, vuông, tam giác</option>
                <option value="trace">Tập tô nét: Luyện viết chữ O Ô Ơ</option>
              </select>
            </div>
          </div>

          <!-- PRINTABLE PREVIEW SHEET -->
          <div style="background: #FFFFFF; border: 2px solid #CBD5E1; border-radius: var(--radius-md); padding: 24px; min-height: 240px; box-shadow: var(--shadow-sm); text-align: center;" id="printable-sheet-preview">
            <div style="border-bottom: 2px dashed #CBD5E1; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between;">
              <span style="font-weight: 800; color: var(--primary);">PHIẾU BÀI TẬP MẦM NON SỐ 01</span>
              <span>Học sinh: <strong id="preview-child-name">Bé Bống</strong></span>
              <span>Lớp: Mẫu giáo</span>
            </div>

            <h4 style="font-family: var(--font-heading); font-size: 18px; margin-bottom: 14px;">
              Bé hãy đếm số lượng quả táo và nối với số thích hợp:
            </h4>

            <div style="display: flex; justify-content: space-around; align-items: center; margin: 24px 0; font-size: 32px;">
              <div>🍎 🍎 <div style="font-size: 14px; color: #64748B;">(2 quả)</div></div>
              <div>🍎 🍎 🍎 <div style="font-size: 14px; color: #64748B;">(3 quả)</div></div>
              <div>🍎 🍎 🍎 🍎 🍎 <div style="font-size: 14px; color: #64748B;">(5 quả)</div></div>
            </div>

            <div style="display: flex; justify-content: space-around; font-size: 28px; font-weight: 900; color: #0284C7;">
              <div style="border: 2px solid #0284C7; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">2</div>
              <div style="border: 2px solid #0284C7; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">3</div>
              <div style="border: 2px solid #0284C7; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">5</div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
            <button class="hero-cta-btn" id="btn-print-worksheet" style="background: #10B981;">
              🖨️ In ra giấy A4 ngay (Print)
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }
}

// ====================================================================
// EVENT HANDLERS & BINDINGS
// ====================================================================

function bindEvents() {
  // 1. Role switcher pills on RBAC banner
  document.addEventListener('click', (e) => {
    const switchRoleBtn = e.target.closest('[data-switch-role]');
    if (switchRoleBtn) {
      const role = switchRoleBtn.getAttribute('data-switch-role');
      authService.switchRole(role);
      showToast(`Đã chuyển vai trò sang: ${ROLE_DEFINITIONS[role].name}`);
      return;
    }

    // Supabase config modal trigger
    if (e.target.closest('#btn-open-supabase-config')) {
      state.activeModal = 'supabase-settings';
      renderModals();
      return;
    }

    // Admin manager trigger
    if (e.target.closest('#btn-open-admin-mgr') || e.target.closest('#ft-rbac')) {
      state.activeModal = 'admin';
      state.adminTab = 'users';
      renderModals();
      return;
    }

    // Header buttons
    if (e.target.closest('#btn-header-login')) {
      state.activeModal = 'auth';
      state.authMode = 'login';
      renderModals();
      return;
    }

    if (e.target.closest('#btn-user-profile')) {
      state.activeModal = 'admin';
      state.adminTab = 'users';
      renderModals();
      return;
    }

    if (e.target.closest('#btn-open-cart')) {
      state.activeModal = 'cart';
      renderModals();
      return;
    }

    // Close modals
    if (e.target.id === 'modal-backdrop-click' || e.target.closest('#modal-close-btn') || e.target.closest('#modal-close-btn-2')) {
      state.activeModal = null;
      renderModals();
      return;
    }

    // Open detail modal
    const openDetailTrigger = e.target.closest('[data-open-detail]');
    if (openDetailTrigger) {
      const wsId = openDetailTrigger.getAttribute('data-open-detail');
      const found = WORKSHEETS.find(w => w.id === wsId);
      if (found) {
        state.selectedWorksheet = found;
        state.activePreviewPageIndex = 0;
        state.activeModal = 'detail';
        renderModals();
      }
      return;
    }

    // Switch preview thumbnail inside detail modal
    const thumbTrigger = e.target.closest('[data-thumb-idx]');
    if (thumbTrigger) {
      const idx = parseInt(thumbTrigger.getAttribute('data-thumb-idx'), 10);
      state.activePreviewPageIndex = idx;
      renderModals();
      return;
    }

    // Switch worksheet from carousel inside detail modal
    const switchWsTrigger = e.target.closest('[data-switch-ws]');
    if (switchWsTrigger) {
      const nextId = switchWsTrigger.getAttribute('data-switch-ws');
      const found = WORKSHEETS.find(w => w.id === nextId);
      if (found) {
        state.selectedWorksheet = found;
        state.activePreviewPageIndex = 0;
        renderModals();
      }
      return;
    }

    // Add to cart from grid or modal
    const addCartBtn = e.target.closest('[data-add-cart]') || e.target.closest('#modal-btn-add-cart');
    if (addCartBtn) {
      const id = addCartBtn.getAttribute('data-add-cart') || addCartBtn.getAttribute('data-id');
      const ws = WORKSHEETS.find(w => w.id === id);
      if (ws) {
        cartService.addToCart(ws);
        triggerConfetti(e.clientX, e.clientY);
        showToast(`Đã thêm "${ws.title}" vào giỏ hàng!`);
      }
      return;
    }

    // Buy now
    const buyNowBtn = e.target.closest('#modal-btn-buy-now');
    if (buyNowBtn) {
      const id = buyNowBtn.getAttribute('data-id');
      const ws = WORKSHEETS.find(w => w.id === id);
      if (ws) {
        cartService.addToCart(ws);
        state.activeModal = 'cart';
        renderModals();
      }
      return;
    }

    // Free sample download
    const sampleDownloadBtn = e.target.closest('#modal-btn-sample-download');
    if (sampleDownloadBtn) {
      triggerConfetti();
      showToast('Đang tải bản mẫu PDF miễn phí chất lượng in ấn!');
      return;
    }

    // Instant download for Pro/Teacher/Admin
    const instantDownloadBtn = e.target.closest('#modal-btn-instant-download');
    if (instantDownloadBtn) {
      triggerConfetti();
      showToast('Tải thành công file PDF độ phân giải cao theo bản quyền!');
      return;
    }

    // Cart quantity adjust
    const qtyBtn = e.target.closest('[data-qty-delta]');
    if (qtyBtn) {
      const delta = parseInt(qtyBtn.getAttribute('data-qty-delta'), 10);
      const itemId = qtyBtn.getAttribute('data-item-id');
      cartService.updateQuantity(itemId, delta);
      renderModals();
      return;
    }

    // Remove from cart
    const removeBtn = e.target.closest('[data-remove-item]');
    if (removeBtn) {
      const itemId = removeBtn.getAttribute('data-remove-item');
      cartService.removeFromCart(itemId);
      renderModals();
      return;
    }

    // Apply voucher
    if (e.target.closest('#btn-apply-voucher')) {
      const input = document.getElementById('voucher-input');
      const code = input ? input.value.trim().toUpperCase() : '';
      if (code === 'MAMNON2026' || code === 'MAMNON') {
        state.voucherCode = code;
        state.voucherDiscountPercent = 20;
        showToast('Áp dụng thành công mã MAMNON2026 giảm 20%!');
        renderModals();
      } else if (code === 'GIAOVIEN' || code === 'GIAOVIEN50') {
        state.voucherCode = code;
        state.voucherDiscountPercent = 50;
        showToast('Áp dụng ưu đãi Giáo viên giảm 50%!');
        renderModals();
      } else {
        showToast('Mã giảm giá không hợp lệ. Hãy thử: MAMNON2026 hoặc GIAOVIEN');
      }
      return;
    }

    // Cart checkout
    if (e.target.closest('#btn-cart-checkout')) {
      state.activeModal = 'checkout-qr';
      renderModals();
      return;
    }

    // Confirm QR Payment Success
    if (e.target.closest('#btn-confirm-payment-success')) {
      cartService.clearCart();
      state.activeModal = null;
      renderModals();
      triggerConfetti();
      showToast('🎉 Thanh toán thành công! Bạn có thể tải ngay toàn bộ tài liệu.');
      return;
    }

    // Education suite buttons
    const eduActionBtn = e.target.closest('[data-action]');
    if (eduActionBtn) {
      const action = eduActionBtn.getAttribute('data-action');
      if (action === 'open-game') {
        state.activeModal = 'game';
        renderModals();
      } else if (action === 'open-generator') {
        state.activeModal = 'generator';
        renderModals();
      } else if (action === 'scroll-catalog') {
        document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
      } else if (action === 'filter-teacher') {
        state.activeCategory = 'tong-hop';
        renderCatalog();
        document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Categories filter click
    const catCard = e.target.closest('[data-category-id]');
    if (catCard) {
      state.activeCategory = catCard.getAttribute('data-category-id');
      renderCatalog();
      document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Category click from header nav dropdown
    const navCatItem = e.target.closest('[data-nav-category]');
    if (navCatItem) {
      state.activeCategory = navCatItem.getAttribute('data-nav-category');
      renderCatalog();
      document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Pack click
    const packTrigger = e.target.closest('[data-open-pack]');
    if (packTrigger) {
      const packId = packTrigger.getAttribute('data-open-pack');
      const ws = WORKSHEETS.find(w => w.id === 've-ban-gau-misa') || WORKSHEETS[0];
      state.selectedWorksheet = ws;
      state.activeModal = 'detail';
      renderModals();
      return;
    }

    // Nav shortcuts
    if (e.target.id === 'nav-featured-packs' || e.target.id === 'link-see-all-packs') {
      document.getElementById('featured-packs-container')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (e.target.id === 'nav-edu-games') {
      state.activeModal = 'game';
      renderModals();
      return;
    }

    if (e.target.id === 'nav-generator' || e.target.id === 'btn-hero-generator' || e.target.id === 'ft-generator') {
      state.activeModal = 'generator';
      renderModals();
      return;
    }

    if (e.target.id === 'nav-lesson-plans' || e.target.id === 'ft-lesson-plans') {
      state.activeCategory = 'tong-hop';
      renderCatalog();
      document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
      showToast('Hiển thị kho giáo án & kế hoạch bài dạy mầm non!');
      return;
    }

    if (e.target.id === 'nav-pricing' || e.target.id === 'ft-packages') {
      document.getElementById('pricing-anchor')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (e.target.id === 'btn-hero-explore' || e.target.id === 'link-see-all-cats') {
      state.activeCategory = 'all';
      renderCatalog();
      document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Reset filters
    if (e.target.id === 'btn-reset-filters' || e.target.id === 'btn-reset-filters-2') {
      state.activeCategory = 'all';
      state.activeGrade = 'all';
      state.selectedTopics = [];
      state.selectedFormat = 'all';
      state.searchQuery = '';
      renderCatalog();
      return;
    }

    // Admin tabs
    const adminTabBtn = e.target.closest('[data-admin-tab]');
    if (adminTabBtn) {
      state.adminTab = adminTabBtn.getAttribute('data-admin-tab');
      renderModals();
      return;
    }

    // Change user role from admin table
    const roleSelect = e.target.closest('[data-change-user-role]');
    if (roleSelect && e.type === 'change') {
      const uId = roleSelect.getAttribute('data-change-user-role');
      const newRole = roleSelect.value;
      authService.updateUserRole(uId, newRole);
      showToast('Đã cập nhật quyền thành công trên Supabase!');
      return;
    }

    // Copy SQL button
    if (e.target.id === 'btn-copy-sql') {
      navigator.clipboard.writeText(`-- SUPABASE SCHEMA HỌC LIỆU MẦM NON
CREATE TABLE profiles (id UUID PRIMARY KEY, role TEXT, full_name TEXT);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON materials FOR SELECT USING (true);`);
      showToast('Đã sao chép Supabase SQL schema vào Clipboard!');
      return;
    }

    // Game interaction
    const shapeTarget = e.target.closest('[data-shape]');
    if (shapeTarget) {
      const shape = shapeTarget.getAttribute('data-shape');
      if (shape === state.gameTargetShape) {
        state.gameScore += 1;
        triggerConfetti(e.clientX, e.clientY);
        const fb = document.getElementById('game-feedback');
        if (fb) fb.innerHTML = '🎉 Hoan hô bé giỏi quá! Điểm: ' + state.gameScore + ' ⭐';
        
        // Chuyển câu hỏi mới
        const shapes = ['square', 'triangle', 'circle'];
        state.gameTargetShape = shapes[Math.floor(Math.random() * shapes.length)];
        const qElem = document.getElementById('game-question');
        if (qElem) {
          const shapeNames = { square: 'HÌNH VUÔNG 🟦', triangle: 'HÌNH TAM GIÁC 🔺', circle: 'HÌNH TRÒN 🟡' };
          qElem.innerHTML = `Bé hãy bấm vào <strong>${shapeNames[state.gameTargetShape]}</strong> nhé!`;
        }
      } else {
        const fb = document.getElementById('game-feedback');
        if (fb) fb.innerHTML = 'Bé chọn gần đúng rồi, bé thử lại một lần nữa nhé! 💖';
      }
      return;
    }

    // Print worksheet generator
    if (e.target.id === 'btn-print-worksheet') {
      window.print();
      return;
    }

    // Pricing plan button click
    const planBtn = e.target.closest('[data-choose-plan]');
    if (planBtn) {
      const targetRole = planBtn.getAttribute('data-role-target');
      authService.switchRole(targetRole);
      triggerConfetti();
      showToast(`Đã kích hoạt gói thành công! Vai trò hiện tại: ${ROLE_DEFINITIONS[targetRole].name}`);
      return;
    }
  });

  // Change events (Filters, Selects, Inputs)
  document.addEventListener('change', (e) => {
    // Grade radio
    if (e.target.name === 'grade_filter') {
      state.activeGrade = e.target.value;
      renderCatalog();
      return;
    }

    // Topic checkboxes
    if (e.target.classList.contains('topic-checkbox')) {
      const val = e.target.value;
      if (e.target.checked) {
        if (!state.selectedTopics.includes(val)) state.selectedTopics.push(val);
      } else {
        state.selectedTopics = state.selectedTopics.filter(t => t !== val);
      }
      renderCatalog();
      return;
    }

    // PDF format filter
    if (e.target.id === 'chk-pdf-printable') {
      state.selectedFormat = e.target.checked ? 'pdf' : 'all';
      renderCatalog();
      return;
    }

    // Sort select
    if (e.target.id === 'catalog-sort-select') {
      state.sortBy = e.target.value;
      renderCatalog();
      return;
    }

    // Generator inputs
    if (e.target.id === 'gen-child-name') {
      const p = document.getElementById('preview-child-name');
      if (p) p.innerText = e.target.value || 'Bé yêu';
      return;
    }
  });

  // Form submit for Auth
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'auth-form') {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-password').value;
      const fullName = document.getElementById('auth-fullname')?.value;
      const role = document.getElementById('auth-role')?.value || 'parent';

      if (state.authMode === 'signup') {
        await authService.signUp(email, pass, fullName, role);
        showToast(`Đăng ký thành công tài khoản: ${email}`);
      } else {
        await authService.signIn(email, pass);
        showToast(`Đăng nhập thành công!`);
      }
      state.activeModal = null;
      renderModals();
    }
  });

  // Save Supabase settings
  document.addEventListener('click', (e) => {
    if (e.target.id === 'btn-save-supabase-config') {
      const url = document.getElementById('cfg-supabase-url').value;
      const key = document.getElementById('cfg-supabase-key').value;
      supabaseSettings.saveConfig(url, key);
      showToast('Đã lưu thông tin Supabase thành công!');
      state.activeModal = null;
      renderModals();
    }

    // Auth toggles
    if (e.target.id === 'toggle-auth-signup') {
      e.preventDefault();
      state.authMode = 'signup';
      renderModals();
    }
    if (e.target.id === 'toggle-auth-login') {
      e.preventDefault();
      state.authMode = 'login';
      renderModals();
    }

    // Quick login buttons
    const qLogin = e.target.closest('[data-quick-login]');
    if (qLogin) {
      const em = qLogin.getAttribute('data-quick-login');
      authService.signIn(em, 'password123');
      state.activeModal = null;
      renderModals();
      showToast(`Đã đăng nhập nhanh tài khoản: ${em}`);
    }
  });

  // Subscriptions to Auth and Cart
  authService.onAuthChange(() => {
    renderRBACBanner();
    renderHeader();
    renderCatalog();
  });

  cartService.onCartChange(() => {
    renderHeader();
  });
}

// ====================================================================
// TOAST NOTIFICATIONS & CONFETTI
// ====================================================================

function showToast(msg) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1E293B;
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 3000;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>✨</span> <span>${msg}</span>`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
  }, 3200);
}

function triggerConfetti(x, y) {
  try {
    const origin = x && y ? { x: x / window.innerWidth, y: y / window.innerHeight } : { x: 0.5, y: 0.6 };
    confetti({
      particleCount: 50,
      spread: 70,
      origin: origin,
      colors: ['#FF4D6D', '#0284C7', '#F59E0B', '#10B981']
    });
  } catch {
    // ignore
  }
}

// ====================================================================
// INITIALIZATION
// ====================================================================

export function initApp() {
  renderRBACBanner();
  renderHeader();
  renderHero();
  renderValueProps();
  renderCategories();
  renderFeaturedPacks();
  renderEducationSuite();
  renderCatalog();
  renderPricing();
  renderFooter();
  bindEvents();
}

// Start app on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
