// ====================================================================
// HỌC LIỆU MẦM NON - PRODUCTION CONTROLLER
// Vận hành thực tế với Supabase Backend & Chuẩn Education.com
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
  dataService,
  cartService,
  supabaseSettings,
  ROLE_DEFINITIONS
} from './services/supabase.js';

// Application State
const state = {
  activeCategory: 'all',
  activeGrade: 'all',
  selectedTopics: [],
  selectedFormat: 'all',
  searchQuery: '',
  sortBy: 'featured',
  activeModal: null, // 'detail', 'cart', 'auth', 'admin', 'material-editor', 'supabase-settings', 'game', 'generator', 'checkout-qr'
  selectedWorksheet: WORKSHEETS[0],
  activePreviewPageIndex: 0,
  voucherCode: '',
  voucherDiscountPercent: 0,
  adminTab: 'materials', // 'materials', 'users', 'sql'
  gameScore: 0,
  gameTargetShape: 'circle',
  authMode: 'login', // 'login' or 'signup'
  liveWorksheets: [...WORKSHEETS],
  adminUsersList: [],
  editingMaterial: null,
  adminEditorMode: 'create' // 'create' or 'edit'
};

// Utilities
const formatVND = (num) => {
  if (num === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};

// Tải dữ liệu thực tế từ Supabase khi mở web
async function loadProductionData() {
  try {
    const materials = await dataService.getMaterials();
    if (materials && materials.length > 0) {
      state.liveWorksheets = materials.map(m => ({
        id: m.id || m.slug,
        title: m.title,
        price: m.price !== undefined ? m.price : 0,
        age: m.age_range_label || m.age || (m.grade_level ? `${m.grade_level} tuổi` : '3 - 5 tuổi'),
        ageId: m.grade_level || m.ageId || '3-4',
        category: m.category_id || m.category || 'tao-hinh',
        pages: m.page_count || m.pages || 1,
        format: m.format_type || m.format || 'PDF (Chất lượng in cao)',
        coverImage: m.preview_image_url || m.coverImage || './assets/misa_bear.jpg',
        description: m.description || '',
        pdfUrl: m.file_pdf_url || m.pdfUrl || '',
        rating: Number(m.rating) || 5.0,
        downloads: m.download_count || m.downloads || 0,
        isFreeSample: m.is_free_sample || m.price === 0,
        previewPages: m.preview_pages && m.preview_pages.length > 0 
          ? m.preview_pages 
          : [{ id: 1, image: m.preview_image_url || m.coverImage || './assets/misa_bear.jpg' }]
      }));
      renderCatalog();
    }
  } catch (e) {
    console.warn('Sử dụng kho học liệu tích hợp:', e);
  }
}

// ====================================================================
// HEADER RENDERER (CHUYÊN NGHIỆP - PRODUCTION MODE)
// ====================================================================
function renderHeader() {
  const user = authService.getUser();
  const cartCount = cartService.getItemCount();
  const isConnected = authService.isConnected();
  const roleInfo = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.guest;

  const html = `
    <div class="container header-container">
      <div class="brand-logo" id="logo-home-click">
        <img src="./assets/hero_girl.jpg" alt="Học liệu mầm non" class="logo-avatar" />
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
        <li class="nav-link" id="nav-lesson-plans">Giáo án STEAM</li>
        <li class="nav-link" id="nav-generator">Tạo bài tập</li>
        <li class="nav-link" id="nav-pricing">Bảng giá</li>
      </ul>

      <div class="header-actions">
        <button class="search-toggle-btn" id="btn-open-search" title="Tìm kiếm">🔍</button>

        <div class="cart-btn-wrapper">
          <button class="cart-icon-btn" id="btn-open-cart" title="Giỏ hàng">
            🛒
            ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
          </button>
        </div>

        ${user.role === 'admin' ? `
          <button class="btn-admin-header-pill" id="btn-quick-new-material" title="Đăng bán học liệu mới lên website">
            ✨ + Đăng Học Liệu
          </button>
        ` : ''}

        ${user.role === 'guest' ? `
          <div style="display: flex; gap: 8px;">
            <button class="btn-login" style="background: #FFFFFF; color: var(--primary); border: 2px solid var(--primary); box-shadow: none;" id="btn-header-login">
              Đăng nhập
            </button>
            <button class="btn-login" id="btn-header-signup">
              Đăng ký
            </button>
          </div>
        ` : `
          <div class="nav-dropdown-wrapper">
            <div class="user-profile-badge" id="btn-user-profile-dropdown" style="border-color: ${roleInfo.badgeColor}">
              <span>${user.avatar}</span>
              <span>${user.full_name}</span>
              <span style="font-size: 10px; background: ${roleInfo.badgeColor}; color: #fff; padding: 2px 6px; border-radius: 9999px;">
                ${user.role.toUpperCase()}
              </span>
            </div>
            <div class="nav-dropdown-menu" style="right: 0; left: auto; min-width: 220px;">
              ${user.role === 'admin' ? `
                <div class="nav-dropdown-item" id="menu-open-admin-panel" style="color: #EF4444; font-weight: 800;">
                  🛡️ Bảng điều khiển Quản trị
                </div>
                <div class="nav-dropdown-item" id="menu-quick-add-material" style="color: #F59E0B; font-weight: 800;">
                  ➕ Đăng học liệu mới
                </div>
              ` : ''}
              <div class="nav-dropdown-item" id="menu-my-downloads">
                📥 Học liệu đã mua
              </div>
              <div class="nav-dropdown-item" id="menu-user-signout" style="color: #64748B; border-top: 1px solid #E2E8F0; margin-top: 4px; padding-top: 8px;">
                🚪 Đăng xuất
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
  document.getElementById('main-header').innerHTML = html;
}

// ====================================================================
// HERO SECTION & VALUE PROPOSITIONS
// ====================================================================
function renderHero() {
  const html = `
    <div class="container">
      <div class="hero-layout">
        <div class="hero-text-col">
          <h1 class="hero-title-main">Kho học liệu mầm non</h1>
          <h2 class="hero-subtitle-highlight">Đa dạng – Sinh động – Dễ sử dụng</h2>
          <p class="hero-description">
            Các bộ sách, worksheet và học liệu được thiết kế dành riêng cho trẻ mầm non. 
            <strong>Giúp con học mà chơi - chơi mà phát triển!</strong> Đồng bộ chuẩn sư phạm GDMN và mô hình học tập tương tác Education.com.
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
          <img src="./assets/hero_girl.jpg" alt="Bé mầm non sáng tạo" class="hero-mascot-img" />
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

// ====================================================================
// CATEGORIES & FEATURED PACKS
// ====================================================================
function renderCategories() {
  const html = `
    <div class="container section-wrapper">
      <div class="section-header">
        <h3 class="section-title">Danh mục học liệu</h3>
        <span class="section-link-more" id="link-see-all-cats">Xem tất cả →</span>
      </div>

      <div class="categories-grid">
        ${CATEGORIES.map(cat => `
          <div class="category-card" data-category-id="${cat.id}">
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

// ====================================================================
// EDUCATION.COM INTERACTIVE LEARNING SUITE
// ====================================================================
function renderEducationSuite() {
  const html = `
    <div class="container">
      <div class="edu-suite-section">
        <div class="edu-suite-header">
          <span class="badge-tag">MÔ HÌNH EDUCATION.COM TƯƠNG TÁC</span>
          <h2>Hệ sinh thái Giáo dục Toàn diện cho Bé & Giáo viên</h2>
          <p style="font-size: 15px; color: var(--text-muted);">
            Kết hợp giữa học liệu in truyền thống và công nghệ học tập số hóa tương tác giúp trẻ phát triển tư duy sáng tạo.
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

// ====================================================================
// CATALOG & SIDEBAR FILTER
// ====================================================================
function renderCatalog() {
  const user = authService.getUser();
  const isAdmin = user && user.role === 'admin';

  const activeCatObj = CATEGORIES.find(c => c.id === state.activeCategory);
  const catalogTitle = activeCatObj ? activeCatObj.name : 'Tất cả học liệu mầm non';
  const catalogDesc = activeCatObj ? activeCatObj.description : 'Các hoạt động tô màu, vẽ, xé dán, tạo hình giúp trẻ phát triển óc sáng tạo, khả năng quan sát và vận động tinh.';

  let filtered = state.liveWorksheets.filter(item => {
    if (state.activeCategory !== 'all' && item.category !== state.activeCategory && item.category_id !== state.activeCategory) return false;
    if (state.activeGrade !== 'all' && item.ageId !== state.activeGrade && item.grade_level !== state.activeGrade) return false;
    if (state.selectedTopics.length > 0 && !state.selectedTopics.includes(item.topic)) return false;
    if (state.selectedFormat === 'pdf' && !item.format?.includes('PDF') && !item.format_type?.includes('PDF')) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  if (state.sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'rating') {
    filtered.sort((a, b) => (b.rating || 5) - (a.rating || 5));
  } else if (state.sortBy === 'newest') {
    filtered.sort((a, b) => (b.download_count || b.downloads || 0) - (a.download_count || a.downloads || 0));
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
          ${isAdmin ? `
            <div class="admin-catalog-banner">
              <div class="admin-banner-info">
                <span class="admin-banner-badge">👑 QUẢN TRỊ VIÊN</span>
                <span class="admin-banner-text">
                  Bạn có toàn quyền <strong>Đăng bán mới</strong>, <strong>Chỉnh sửa thông tin/giá</strong>, hoặc <strong>Gỡ bỏ</strong> học liệu trực tiếp.
                </span>
              </div>
              <button class="hero-cta-btn btn-admin-banner-btn" id="btn-banner-add-material">
                ➕ Đăng Bán Học Liệu Mới
              </button>
            </div>
          ` : ''}

          <div class="catalog-toolbar">
            <span class="results-count-text">Hiển thị 1–${filtered.length} học liệu chất lượng cao</span>
            
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
              <button class="hero-cta-btn" style="margin-top: 18px; padding: 8px 20px; font-size: 14px;" id="btn-reset-filters-2">Xem tất cả học liệu</button>
            </div>
          ` : `
            <div class="worksheets-grid">
              ${filtered.map(ws => `
                <div class="worksheet-card" data-worksheet-id="${ws.id}">
                  ${isAdmin ? `
                    <div class="admin-card-badge-row">
                      <span class="admin-manage-tag">👑 Admin</span>
                      <div class="admin-card-btn-group">
                        <button class="btn-card-edit" data-admin-edit-mat="${ws.id}" title="Chỉnh sửa thông tin & giá">✏️ Sửa</button>
                        <button class="btn-card-del" data-admin-del-mat="${ws.id}" title="Gỡ học liệu khỏi website">🗑️ Gỡ bán</button>
                      </div>
                    </div>
                  ` : ''}
                  <div class="worksheet-thumb-frame" data-open-detail="${ws.id}">
                    <img src="${ws.coverImage || ws.preview_image_url || './assets/misa_bear.jpg'}" alt="${ws.title}" loading="lazy" />
                    <div class="card-quick-preview-overlay">
                      <span>👁️ Xem trước</span>
                    </div>
                  </div>
                  <h4 class="worksheet-card-title" data-open-detail="${ws.id}">${ws.title}</h4>
                  <div class="worksheet-card-meta">
                    <span>${ws.pages || ws.page_count || 1} trang</span>
                    <span>•</span>
                    <span>${ws.age || ws.age_range_label || '3-5 tuổi'}</span>
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

// ====================================================================
// PRICING & FOOTER
// ====================================================================
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

              <button class="plan-cta-btn" data-choose-plan="${plan.id}">
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
              <img src="./assets/hero_girl.jpg" alt="Logo" class="logo-avatar" />
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
            </ul>
          </div>

          <div class="footer-col">
            <h4>Hỗ trợ & Liên hệ</h4>
            <ul class="footer-links-list">
              <li>📞 Hotline: 0988.66.88.66</li>
              <li>✉️ Email: cskh@hoclieumamnon.vn</li>
              <li>📍 Trụ sở: Hà Nội & TP. Hồ Chí Minh</li>
              <li>🛡️ Chính sách bảo mật & Bản quyền</li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <span>© 2026 Học Liệu Mầm Non. Vận hành chính thức với Supabase & Chuẩn Education.com.</span>
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
// MODALS SYSTEM (PRODUCTION DETAIL, CART, REAL AUTH, ADMIN DASHBOARD)
// ====================================================================
function attachMaterialEditorListeners() {
  const titleInp = document.getElementById('ed-title');
  const priceInp = document.getElementById('ed-price');
  const ageInp = document.getElementById('ed-age');
  const pagesInp = document.getElementById('ed-pages');
  const coverInp = document.getElementById('ed-cover-url');
  const fileUpload = document.getElementById('ed-file-upload');

  const prevTitle = document.getElementById('prev-card-title');
  const prevPrice = document.getElementById('prev-card-price');
  const prevAge = document.getElementById('prev-card-age');
  const prevPages = document.getElementById('prev-card-pages');
  const prevImg = document.getElementById('prev-card-img');

  const updatePreview = () => {
    if (prevTitle && titleInp) prevTitle.innerText = titleInp.value || 'Tiêu đề học liệu mới';
    if (prevPrice && priceInp) {
      const p = parseInt(priceInp.value, 10) || 0;
      prevPrice.innerText = formatVND(p);
      if (p === 0) prevPrice.classList.add('free');
      else prevPrice.classList.remove('free');
    }
    if (prevAge && ageInp) {
      const opt = ageInp.options[ageInp.selectedIndex];
      prevAge.innerText = opt ? opt.text.split('(')[0].trim() : '3 - 5 tuổi';
    }
    if (prevPages && pagesInp) prevPages.innerText = (pagesInp.value || 1) + ' trang';
    if (prevImg && coverInp) prevImg.src = coverInp.value || './assets/misa_bear.jpg';
  };

  titleInp?.addEventListener('input', updatePreview);
  priceInp?.addEventListener('input', updatePreview);
  ageInp?.addEventListener('change', updatePreview);
  pagesInp?.addEventListener('input', updatePreview);
  coverInp?.addEventListener('input', updatePreview);

  fileUpload?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target.result;
        if (coverInp) coverInp.value = dataUrl;
        if (prevImg) prevImg.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  });

  document.querySelectorAll('.preset-cover-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-cover-src');
      if (coverInp) coverInp.value = src;
      if (prevImg) prevImg.src = src;
      document.querySelectorAll('.preset-cover-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('[data-set-price]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-set-price');
      if (priceInp) {
        priceInp.value = val;
        updatePreview();
      }
    });
  });
}

function renderModals() {
  const container = document.getElementById('modals-container');
  if (!state.activeModal) {
    container.innerHTML = '';
    return;
  }

  const user = authService.getUser();

  // 0. ADMIN MATERIAL EDITOR MODAL (THÊM MỚI & CHỈNH SỬA HỌC LIỆU TRỰC TIẾP)
  if (state.activeModal === 'material-editor') {
    const isEdit = state.adminEditorMode === 'edit';
    const mat = state.editingMaterial || {
      id: '',
      title: '',
      price: 15000,
      age: '3 - 5 tuổi',
      ageId: '3-4',
      category: 'tao-hinh',
      pages: 1,
      format: 'PDF (Chất lượng in cao)',
      coverImage: './assets/misa_bear.jpg',
      description: '',
      pdfUrl: ''
    };

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 940px; padding: 26px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #F1F5F9; padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 32px;">${isEdit ? '✏️' : '✨'}</span>
              <div>
                <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0;">
                  ${isEdit ? 'Chỉnh Sửa Học Liệu Đang Bán' : 'Đăng Bán Học Liệu Mới Lên Website'}
                </h3>
                <p style="font-size: 13px; color: var(--text-muted); margin: 3px 0 0 0;">
                  ${isEdit ? 'Cập nhật nhanh giá bán, tiêu đề, ảnh bìa hoặc file học liệu' : 'Đăng sản phẩm mới cực kỳ đơn giản, tự động hiển thị lung linh chuẩn Education.com'}
                </p>
              </div>
            </div>
            <span class="admin-banner-badge">👑 ADMIN</span>
          </div>

          <form id="form-material-editor" style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px;">
            <!-- CỘT TRÁI: FORM NHẬP LIỆU -->
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 5px;">
                  1. Tiêu đề học liệu: <span style="color:#EF4444">*</span>
                </label>
                <input type="text" id="ed-title" required class="voucher-input" style="width: 100%; font-size: 14px; font-weight: 700;" 
                  value="${mat.title || ''}" placeholder="VD: Bé tập đếm số 1-10 & Tô màu chiếc thuyền" />
              </div>

              <!-- GIÁ BÁN & CHIP CHỌN NHANH -->
              <div>
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 5px;">
                  2. Giá bán (VNĐ): <span style="color:#EF4444">*</span>
                </label>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                  <input type="number" id="ed-price" min="0" step="1000" required class="voucher-input" style="width: 150px; font-size: 16px; font-weight: 800; color: var(--secondary);" 
                    value="${mat.price !== undefined ? mat.price : 15000}" />
                  <span style="font-size: 12px; color: var(--text-muted);">(Điền 0 nếu tặng miễn phí)</span>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button type="button" class="chip-btn" data-set-price="0">0đ Miễn phí</button>
                  <button type="button" class="chip-btn" data-set-price="10000">10.000đ</button>
                  <button type="button" class="chip-btn" data-set-price="15000">15.000đ</button>
                  <button type="button" class="chip-btn" data-set-price="25000">25.000đ</button>
                  <button type="button" class="chip-btn" data-set-price="50000">50.000đ</button>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 5px;">3. Độ tuổi bé:</label>
                  <select id="ed-age" class="sort-dropdown" style="width: 100%; padding: 9px;">
                    <option value="3-4" ${mat.ageId === '3-4' || mat.grade_level === '3-4' ? 'selected' : ''}>3 - 4 tuổi (Mầm)</option>
                    <option value="4-5" ${mat.ageId === '4-5' || mat.grade_level === '4-5' ? 'selected' : ''}>4 - 5 tuổi (Chồi)</option>
                    <option value="5-6" ${mat.ageId === '5-6' || mat.grade_level === '5-6' ? 'selected' : ''}>5 - 6 tuổi (Lá)</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 5px;">4. Danh mục:</label>
                  <select id="ed-category" class="sort-dropdown" style="width: 100%; padding: 9px;">
                    <option value="tao-hinh" ${mat.category === 'tao-hinh' || mat.category_id === 'tao-hinh' ? 'selected' : ''}>Tạo hình (Tô màu - Vẽ)</option>
                    <option value="toan-hoc" ${mat.category === 'toan-hoc' || mat.category_id === 'toan-hoc' ? 'selected' : ''}>Làm quen toán</option>
                    <option value="chu-cai" ${mat.category === 'chu-cai' || mat.category_id === 'chu-cai' ? 'selected' : ''}>Làm quen chữ cái</option>
                    <option value="the-gioi" ${mat.category === 'the-gioi' || mat.category_id === 'the-gioi' ? 'selected' : ''}>Thế giới xung quanh</option>
                    <option value="ky-nang" ${mat.category === 'ky-nang' || mat.category_id === 'ky-nang' ? 'selected' : ''}>Kỹ năng sống</option>
                    <option value="tong-hop" ${mat.category === 'tong-hop' || mat.category_id === 'tong-hop' ? 'selected' : ''}>Bộ chủ đề tổng hợp</option>
                  </select>
                </div>
              </div>

              <!-- CHỌN ẢNH BÌA SẢN PHẨM -->
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: var(--radius-md); padding: 12px;">
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">
                  5. Chọn ảnh bìa học liệu:
                </label>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
                  Chọn nhanh 1 trong các ảnh mẫu tuyệt đẹp có sẵn:
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                  <button type="button" class="preset-cover-chip" data-cover-src="./assets/misa_bear.jpg">
                    <img src="./assets/misa_bear.jpg" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;" />
                    <span>🐻 Gấu Misa</span>
                  </button>
                  <button type="button" class="preset-cover-chip" data-cover-src="./assets/animals_pack.jpg">
                    <img src="./assets/animals_pack.jpg" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;" />
                    <span>🦁 Động vật</span>
                  </button>
                  <button type="button" class="preset-cover-chip" data-cover-src="./assets/hero_girl.jpg">
                    <img src="./assets/hero_girl.jpg" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;" />
                    <span>👧 Bé khám phá</span>
                  </button>
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" id="ed-cover-url" class="voucher-input" style="flex: 1; font-size: 12px;" 
                    value="${mat.coverImage || mat.preview_image_url || './assets/misa_bear.jpg'}" 
                    placeholder="Link ảnh hoặc chọn từ máy..." />
                  
                  <label class="voucher-btn" style="cursor: pointer; padding: 9px 12px; font-size: 12px; white-space: nowrap; background: #fff; font-weight: 700;">
                    📁 Tải ảnh từ máy
                    <input type="file" id="ed-file-upload" accept="image/*" style="display: none;" />
                  </label>
                </div>
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 5px;">
                  6. Mô tả học liệu & Mục tiêu rèn luyện cho bé:
                </label>
                <textarea id="ed-desc" class="voucher-input" style="width: 100%; height: 60px; font-size: 13px;" 
                  placeholder="Giúp bé rèn luyện quan sát, nhận biết hình khối và rèn luyện kỹ năng cầm bút...">${mat.description || ''}</textarea>
              </div>

              <div style="display: grid; grid-template-columns: 110px 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 12px; font-weight: 700; display: block; margin-bottom: 4px;">Số trang:</label>
                  <input type="number" id="ed-pages" min="1" max="100" class="voucher-input" style="width: 100%;" 
                    value="${mat.pages || mat.page_count || 1}" />
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700; display: block; margin-bottom: 4px;">Link tệp PDF tải về:</label>
                  <input type="text" id="ed-pdf-url" class="voucher-input" style="width: 100%; font-size: 12px;" 
                    value="${mat.file_pdf_url || mat.pdfUrl || ''}" placeholder="Link Drive/PDF (để trống sẽ dùng tài liệu mặc định)" />
                </div>
              </div>
            </div>

            <!-- CỘT PHẢI: KHUNG XEM TRƯỚC SỐNG ĐỘNG (LIVE PREVIEW) -->
            <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
              <div style="width: 100%;">
                <div style="font-size: 12px; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 12px; text-align: center; letter-spacing: 0.5px;">
                  👁️ Xem trước hiển thị trên website
                </div>

                <div class="worksheet-card" style="box-shadow: var(--shadow-md); margin: 0 auto; max-width: 260px; background: #fff; pointer-events: none;">
                  <div class="worksheet-thumb-frame" style="height: 185px;">
                    <img id="prev-card-img" src="${mat.coverImage || mat.preview_image_url || './assets/misa_bear.jpg'}" style="width:100%; height:100%; object-fit:cover;" />
                  </div>
                  <h4 class="worksheet-card-title" id="prev-card-title" style="padding: 10px 12px 4px 12px; font-size: 14px; min-height: 42px;">
                    ${mat.title || 'Tiêu đề học liệu mới'}
                  </h4>
                  <div class="worksheet-card-meta" style="padding: 0 12px; font-size: 12px;">
                    <span id="prev-card-pages">${mat.pages || mat.page_count || 1} trang</span>
                    <span>•</span>
                    <span id="prev-card-age">${mat.age || mat.age_range_label || '3 - 5 tuổi'}</span>
                  </div>
                  <div class="worksheet-card-bottom" style="padding: 10px 12px 14px 12px;">
                    <span class="worksheet-card-price" id="prev-card-price" style="font-size: 16px;">
                      ${formatVND(mat.price !== undefined ? mat.price : 15000)}
                    </span>
                    <span style="font-size: 11px; background: #ECFDF5; color: #10B981; padding: 2px 8px; border-radius: 9999px; font-weight: 800;">
                      ⭐ 5.0
                    </span>
                  </div>
                </div>
              </div>

              <div style="width: 100%; margin-top: 18px; display: flex; flex-direction: column; gap: 8px;">
                <button type="submit" class="hero-cta-btn" id="btn-save-mat" style="width: 100%; padding: 12px; font-size: 14px; text-align: center; justify-content: center;">
                  ${isEdit ? '💾 Cập Nhật Sản Phẩm' : '✨ Đăng Bán Lên Website Ngay'}
                </button>
                <button type="button" class="voucher-btn" id="btn-cancel-mat" style="width: 100%; padding: 9px; text-align: center;">
                  Hủy bỏ
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
    setTimeout(attachMaterialEditorListeners, 50);
    return;
  }

  // 1. PRODUCT DETAIL MODAL
  if (state.activeModal === 'detail') {
    const ws = state.selectedWorksheet;
    const currentImg = ws.previewPages && ws.previewPages[state.activePreviewPageIndex] 
      ? ws.previewPages[state.activePreviewPageIndex].image 
      : (ws.coverImage || ws.preview_image_url || './assets/misa_bear.jpg');

    const canDownloadUnlimited = authService.hasPermission('materials:download_unlimited');

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 900px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>
          
          <div class="detail-modal-body">
            <div class="detail-breadcrumbs">
              <span>Trang chủ</span> <span>›</span>
              <span>Học liệu</span> <span>›</span>
              <span style="color: var(--text-main); font-weight: 700;">${ws.title}</span>
            </div>

            <div class="detail-columns">
              <!-- LEFT COLUMN: PREVIEW STAGE & THUMBNAILS -->
              <div class="detail-preview-col">
                <div class="detail-main-stage">
                  <img src="${currentImg}" alt="${ws.title}" id="detail-active-preview-img" />
                </div>

                <div class="detail-thumbnails-row">
                  ${(ws.previewPages || [{ id: 1, image: ws.coverImage || ws.preview_image_url }]).map((p, idx) => `
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
                  <span style="font-weight: 800;">${(ws.rating || 5).toFixed(1)}</span>
                  <span style="color: var(--text-muted);">(${ws.reviewsCount || ws.rating_count || 12} đánh giá)</span>
                </div>

                <div class="detail-specs-list">
                  <div class="detail-spec-line">
                    <strong>Độ tuổi:</strong>
                    <span>${ws.age || ws.age_range_label || '3-5 tuổi'}</span>
                  </div>
                  <div class="detail-spec-line">
                    <strong>Số trang:</strong>
                    <span>${ws.pages || ws.page_count || 1} trang</span>
                  </div>
                  <div class="detail-spec-line">
                    <strong>Chủ đề:</strong>
                    <span>${ws.topic || 'Tạo hình'}, Hình học</span>
                  </div>
                  <div class="detail-spec-line">
                    <strong>Định dạng:</strong>
                    <span>${ws.format || ws.format_type || 'PDF (Chất lượng in)'}</span>
                  </div>
                </div>

                <div class="detail-desc-box">
                  <strong>Mô tả:</strong><br/>
                  ${ws.description || 'Học liệu chuẩn sư phạm mầm non phát triển tư duy hình học và thẩm mỹ.'}
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
                      ⬇️ Tải file gốc PDF vector (${user.role.toUpperCase()})
                    </button>
                  ` : `
                    <button class="btn-detail-free-download" style="background: #0284C7;" id="modal-btn-sample-download" data-id="${ws.id}">
                      📥 Tải bản mẫu dùng thử
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
                  <img src="./assets/misa_bear.jpg" alt="Vẽ bạn gấu Misa" />
                </div>
                <div class="strip-item" data-switch-ws="ve-con-meo">
                  <img src="./assets/animals_pack.jpg" alt="Vẽ con mèo" />
                </div>
                <div class="strip-item" data-switch-ws="ve-ngoi-nha">
                  <img src="./assets/hero_girl.jpg" alt="Vẽ ngôi nhà" />
                </div>
                <div class="strip-item" data-switch-ws="to-mau-cac-loai-qua">
                  <img src="./assets/misa_bear.jpg" alt="Tô màu các loại quả" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 2. SHOPPING CART DRAWER / MODAL
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
                placeholder="Nhập mã ưu đãi (VD: MAMNON2026, GIAOVIEN)" 
                value="${state.voucherCode}" 
              />
              <button class="voucher-btn" id="btn-apply-voucher">Áp dụng</button>
            </div>

            ${state.voucherDiscountPercent > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 14px; color: #10B981; font-weight: 700; margin-bottom: 12px;">
                <span>Ưu đãi áp dụng (${state.voucherDiscountPercent}%):</span>
                <span>-${formatVND(discount)}</span>
              </div>
            ` : ''}

            <!-- TOTAL SUMMARY -->
            <div class="cart-total-box">
              <span class="cart-total-label">Tổng thanh toán:</span>
              <span class="cart-total-amount">${formatVND(finalTotal)}</span>
            </div>

            <button class="btn-checkout-now" id="btn-cart-checkout">
              Tiến hành thanh toán VietQR →
            </button>
          `}

          <!-- BẠN CÓ THỂ THÍCH THÊM -->
          <div class="cart-recommend-section">
            <h5 class="cart-recommend-title">Bạn có thể thích thêm</h5>
            <div class="cart-recommend-grid">
              ${state.liveWorksheets.slice(1, 5).map(rec => `
                <div class="recommend-mini-card" data-open-detail="${rec.id}">
                  <img src="${rec.coverImage || rec.preview_image_url || './assets/misa_bear.jpg'}" alt="${rec.title}" />
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

  // 3. CHECKOUT & CHUẨN VIETQR PAYMENT
  if (state.activeModal === 'checkout-qr') {
    const rawTotal = cartService.getTotal();
    const discount = (rawTotal * state.voucherDiscountPercent) / 100;
    const finalTotal = Math.max(0, rawTotal - discount);
    const orderId = 'HL' + Math.floor(100000 + Math.random() * 900000);
    const bankAccount = '0988668866';
    const bankName = 'MBBank';
    const accountName = 'HOANG THI MAI';

    const qrUrl = `https://img.vietqr.io/image/MB-${bankAccount}-compact2.png?amount=${finalTotal}&addInfo=${orderId}&accountName=${encodeURIComponent(accountName)}`;

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 520px; text-align: center; padding: 36px 28px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <span style="font-size: 40px;">💳</span>
          <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 800; margin: 8px 0;">Thanh toán VietQR Học Liệu</h3>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">
            Quét mã QR bằng ứng dụng ngân hàng hoặc MoMo để hoàn tất và lưu đơn hàng vào hệ thống.
          </p>

          <div style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: var(--radius-lg); padding: 20px; display: inline-block; margin-bottom: 20px;">
            <img 
              src="${qrUrl}" 
              alt="QR Code thanh toán" 
              style="width: 220px; height: 220px; margin: 0 auto; object-fit: contain;" 
            />
            <div style="margin-top: 12px; font-weight: 800; font-size: 20px; color: var(--primary);">
              ${formatVND(finalTotal)}
            </div>
            <div style="font-size: 13px; color: var(--text-main); margin-top: 6px; text-align: left; background: #fff; padding: 10px; border-radius: 8px;">
              <div>Ngân hàng: <strong>${bankName}</strong></div>
              <div>Số TK: <strong>${bankAccount}</strong></div>
              <div>Chủ TK: <strong>${accountName}</strong></div>
              <div>Nội dung: <strong>${orderId}</strong></div>
            </div>
          </div>

          <button class="btn-checkout-now" id="btn-confirm-payment-success" data-order-total="${finalTotal}" data-order-id="${orderId}">
            ✅ Xác nhận Đã Chuyển Khoản & Lưu Đơn Hàng
          </button>
        </div>
      </div>
    `;
    return;
  }

  // 4. REAL SUPABASE AUTH MODAL (LOGIN / SIGNUP)
  if (state.activeModal === 'auth') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 440px; padding: 36px 30px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">💖</span>
            <h3 style="font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin-top: 8px;">
              ${state.authMode === 'login' ? 'Đăng nhập Tài khoản' : 'Đăng ký Thành viên mới'}
            </h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Hệ thống xác thực & phân quyền trực tiếp Supabase
            </p>
          </div>

          <form id="auth-form" style="display: flex; flex-direction: column; gap: 14px;">
            ${state.authMode === 'signup' ? `
              <div>
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Họ và tên:</label>
                <input type="text" id="auth-fullname" required class="voucher-input" style="width: 100%;" placeholder="Cô Mai / Mẹ Bé Bông" />
              </div>
              <div>
                <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Vai trò:</label>
                <select id="auth-role" class="sort-dropdown" style="width: 100%; padding: 10px;">
                  <option value="parent">Phụ huynh học sinh (Parent)</option>
                  <option value="teacher">Giáo viên mầm non (Teacher)</option>
                </select>
              </div>
            ` : ''}

            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Email:</label>
              <input type="email" id="auth-email" required class="voucher-input" style="width: 100%;" placeholder="email@gmail.com" />
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px;">Mật khẩu:</label>
              <input type="password" id="auth-password" required minlength="6" class="voucher-input" style="width: 100%;" placeholder="Tối thiểu 6 ký tự" />
            </div>

            <div id="auth-error-msg" style="color: #EF4444; font-size: 13px; display: none;"></div>

            <button type="submit" class="btn-checkout-now" id="btn-submit-auth" style="margin-top: 6px;">
              ${state.authMode === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
            </button>
          </form>

          <div style="text-align: center; margin-top: 18px; font-size: 13px;">
            ${state.authMode === 'login' ? `
              Chưa có tài khoản? <a href="#" id="toggle-auth-signup" style="color: var(--primary); font-weight: 800;">Đăng ký miễn phí</a>
            ` : `
              Đã có tài khoản? <a href="#" id="toggle-auth-login" style="color: var(--primary); font-weight: 800;">Đăng nhập</a>
            `}
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 5. PRODUCTION ADMIN DASHBOARD (QUẢN LÝ THẬT SỰ TRÊN SUPABASE)
  if (state.activeModal === 'admin') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet admin-modal-sheet" style="max-width: 960px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h2 style="font-family: var(--font-heading); font-size: 24px; font-weight: 800;">
                🛡️ Bảng Điều Khiển Quản Trị Hệ Thống (Admin Portal)
              </h2>
              <p style="font-size: 13px; color: var(--text-muted);">
                Quản lý kho học liệu, phân quyền tài khoản và cấu hình cơ sở dữ liệu Supabase
              </p>
            </div>
            <span class="rbac-badge-current" style="background: #EF4444; color: #fff;">
              ${user.full_name} (Admin)
            </span>
          </div>

          <div class="admin-header-tabs">
            <button class="admin-tab-btn ${state.adminTab === 'materials' ? 'active' : ''}" data-admin-tab="materials">
              📚 Quản lý Kho Học Liệu (${state.liveWorksheets.length})
            </button>
            <button class="admin-tab-btn ${state.adminTab === 'users' ? 'active' : ''}" data-admin-tab="users">
              👥 Quản lý Người dùng & Phân quyền
            </button>
            <button class="admin-tab-btn ${state.adminTab === 'sql' ? 'active' : ''}" data-admin-tab="sql">
              📜 Supabase Migration Script
            </button>
          </div>

          ${state.adminTab === 'materials' ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h4 style="font-weight: 800;">Danh sách học liệu trong hệ thống:</h4>
              <button class="hero-cta-btn" style="padding: 8px 18px; font-size: 13px;" id="btn-show-add-material-form">
                ➕ Thêm học liệu mới
              </button>
            </div>

            <!-- Form Thêm Học Liệu Mới (Ẩn mặc định) -->
            <div id="add-material-form-box" style="display: none; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: var(--radius-md); padding: 18px; margin-bottom: 20px;">
              <h4 style="margin-bottom: 12px; font-weight: 800; color: var(--primary);">Thêm Học Liệu Mới Vào Supabase:</h4>
              <form id="form-create-material" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                  <label style="font-size: 12px; font-weight: 700;">Tiêu đề học liệu:</label>
                  <input type="text" id="new-mat-title" required class="voucher-input" style="width: 100%;" placeholder="VD: Bé tập tô màu chiếc thuyền" />
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700;">Giá bán (VNĐ, 0 nếu miễn phí):</label>
                  <input type="number" id="new-mat-price" required class="voucher-input" style="width: 100%;" value="15000" />
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700;">Độ tuổi:</label>
                  <select id="new-mat-age" class="sort-dropdown" style="width: 100%; padding: 8px;">
                    <option value="3-4">3 - 4 tuổi (Mầm)</option>
                    <option value="4-5">4 - 5 tuổi (Chồi)</option>
                    <option value="5-6">5 - 6 tuổi (Lá)</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700;">Danh mục:</label>
                  <select id="new-mat-category" class="sort-dropdown" style="width: 100%; padding: 8px;">
                    <option value="tao-hinh">Tạo hình</option>
                    <option value="toan-hoc">Làm quen toán</option>
                    <option value="chu-cai">Làm quen chữ cái</option>
                    <option value="the-gioi">Thế giới xung quanh</option>
                  </select>
                </div>
                <div style="grid-column: span 2;">
                  <label style="font-size: 12px; font-weight: 700;">Mô tả học liệu:</label>
                  <textarea id="new-mat-desc" class="voucher-input" style="width: 100%; height: 60px;" placeholder="Mô tả mục tiêu sư phạm..."></textarea>
                </div>
                <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 8px;">
                  <button type="button" class="voucher-btn" id="btn-cancel-add-material">Hủy</button>
                  <button type="submit" class="hero-cta-btn" style="padding: 8px 20px; font-size: 13px;">Lưu lên Supabase</button>
                </div>
              </form>
            </div>

            <div style="max-height: 400px; overflow-y: auto;">
              <table class="users-rbac-table">
                <thead>
                  <tr>
                    <th>Tên học liệu</th>
                    <th>Độ tuổi</th>
                    <th>Giá</th>
                    <th>Định dạng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.liveWorksheets.map(m => `
                    <tr>
                      <td><strong>${m.title}</strong></td>
                      <td>${m.age || m.age_range_label || '3-5 tuổi'}</td>
                      <td>${formatVND(m.price)}</td>
                      <td>${m.format || m.format_type || 'PDF'}</td>
                      <td>
                        <button class="cart-item-delete" data-delete-material="${m.id}" title="Xóa học liệu">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : (state.adminTab === 'users' ? `
            <div style="margin-bottom: 16px;">
              <h4 style="font-weight: 800; margin-bottom: 12px;">Phân quyền người dùng trong bảng <code>profiles</code>:</h4>
              <table class="users-rbac-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Họ và tên</th>
                    <th>Vai trò hiện tại</th>
                    <th>Cấp quyền</th>
                  </tr>
                </thead>
                <tbody id="admin-users-table-body">
                  ${(state.adminUsersList && state.adminUsersList.length > 0 ? state.adminUsersList : [
                    { id: '1', email: 'cogaomamnon@truonghoa.edu.vn', full_name: 'Cô Mai Quản Trị', role: 'admin' },
                    { id: '2', email: 'giaovien_lan@gmail.com', full_name: 'Cô Lan Phương', role: 'teacher' },
                    { id: '3', email: 'phuhuynh_bong@gmail.com', full_name: 'Mẹ Bé Bống', role: 'parent' }
                  ]).map(u => `
                    <tr>
                      <td><strong>${u.email}</strong></td>
                      <td>${u.full_name}</td>
                      <td>
                        <span style="padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 800; background: ${ROLE_DEFINITIONS[u.role]?.bgColor || '#EEE'}; color: ${ROLE_DEFINITIONS[u.role]?.badgeColor || '#333'};">
                          ${ROLE_DEFINITIONS[u.role]?.name || u.role}
                        </span>
                      </td>
                      <td>
                        <select class="role-select-box" data-change-real-user-role="${u.id}">
                          <option value="parent" ${u.role === 'parent' ? 'selected' : ''}>Phụ huynh</option>
                          <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Giáo viên</option>
                          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="sql-viewer-container">
              <button class="copy-sql-btn" id="btn-copy-sql">📋 Sao chép schema.sql</button>
              <pre>-- BẢNG PROFILES VÀ TỰ ĐỘNG GÁN ROLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'parent'
);

-- BẢNG HỌC LIỆU
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  price INT NOT NULL DEFAULT 0,
  preview_image_url TEXT,
  file_pdf_url TEXT
);

-- RLS BẢO MẬT
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Admin CRUD" ON public.materials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);</pre>
            </div>
          `)}
        </div>
      </div>
    `;
    return;
  }

  // 6. CẤU HÌNH SUPABASE SETTINGS PANEL
  if (state.activeModal === 'supabase-settings') {
    const config = supabaseSettings.getConfig();

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop-click">
        <div class="modal-sheet" style="max-width: 580px; padding: 32px;">
          <button class="modal-close-x" id="modal-close-btn">✕</button>

          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <span style="font-size: 32px;">⚡</span>
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 800;">
                Cấu hình Dự Án Supabase
              </h3>
              <p style="font-size: 13px; color: var(--text-muted);">
                Điền thông tin Project URL và Anon Key từ Supabase Dashboard của bạn.
              </p>
            </div>
          </div>

          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: var(--radius-md); padding: 14px; font-size: 13px; color: #065F46; margin-bottom: 20px;">
            💡 <strong>Mẹo:</strong> Bạn có thể lấy 2 khóa này trong Supabase Dashboard tại mục <strong>Project Settings -> API</strong>.
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">
                Project URL (VITE_SUPABASE_URL):
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
                Anon Key (VITE_SUPABASE_ANON_KEY):
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
              Lưu & Kết nối Supabase
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 7. INTERACTIVE GAME MODAL
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
              Bé hãy bấm vào <strong>HÌNH TRÒN 🟡</strong> nhé!
            </h4>

            <div class="game-shapes-row">
              <div class="game-shape-target" data-shape="square" title="Hình vuông">🟦</div>
              <div class="game-shape-target" data-shape="circle" title="Hình tròn">🟡</div>
              <div class="game-shape-target" data-shape="triangle" title="Hình tam giác">🔺</div>
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

  // 8. WORKSHEET GENERATOR TOOL
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
// EVENT BINDINGS
// ====================================================================
function bindEvents() {
  document.addEventListener('click', async (e) => {
    // Open Supabase Settings
    if (e.target.closest('#btn-open-supabase-config')) {
      state.activeModal = 'supabase-settings';
      renderModals();
      return;
    }

    // Open Admin Portal
    if (e.target.closest('#menu-open-admin-panel')) {
      state.activeModal = 'admin';
      state.adminTab = 'materials';
      renderModals();
      return;
    }

    // User sign out
    if (e.target.closest('#menu-user-signout')) {
      await authService.signOut();
      showToast('Đã đăng xuất tài khoản thành công!');
      renderHeader();
      return;
    }

    // Auth triggers
    if (e.target.closest('#btn-header-login')) {
      state.activeModal = 'auth';
      state.authMode = 'login';
      renderModals();
      return;
    }

    if (e.target.closest('#btn-header-signup')) {
      state.activeModal = 'auth';
      state.authMode = 'signup';
      renderModals();
      return;
    }

    // Cart
    if (e.target.closest('#btn-open-cart')) {
      state.activeModal = 'cart';
      renderModals();
      return;
    }

    // Close modal
    if (e.target.id === 'modal-backdrop-click' || e.target.closest('#modal-close-btn') || e.target.closest('#modal-close-btn-2') || e.target.id === 'btn-cancel-mat') {
      state.activeModal = null;
      renderModals();
      return;
    }

    // Admin Open Create Material Modal
    if (e.target.closest('#btn-quick-new-material') || e.target.closest('#btn-banner-add-material') || e.target.closest('#btn-show-add-material-form') || e.target.closest('#menu-quick-add-material')) {
      state.editingMaterial = null;
      state.adminEditorMode = 'create';
      state.activeModal = 'material-editor';
      renderModals();
      return;
    }

    // Admin Edit Material
    const editMat = e.target.closest('[data-admin-edit-mat]');
    if (editMat) {
      const id = editMat.getAttribute('data-admin-edit-mat');
      const found = state.liveWorksheets.find(w => w.id === id);
      if (found) {
        state.editingMaterial = found;
        state.adminEditorMode = 'edit';
        state.activeModal = 'material-editor';
        renderModals();
      }
      return;
    }

    // Admin Delete / Gỡ bán Material
    const delMat = e.target.closest('[data-admin-del-mat]') || e.target.closest('[data-delete-material]');
    if (delMat) {
      const id = delMat.getAttribute('data-admin-del-mat') || delMat.getAttribute('data-delete-material');
      const found = state.liveWorksheets.find(w => w.id === id);
      const title = found ? found.title : 'học liệu này';
      if (confirm(`Bạn có chắc chắn muốn gỡ bán "${title}" khỏi website?`)) {
        dataService.deleteMaterial(id).catch(e => console.warn(e));
        state.liveWorksheets = state.liveWorksheets.filter(w => w.id !== id);
        showToast(`Đã gỡ bán "${title}" thành công!`);
        renderCatalog();
        renderModals();
      }
      return;
    }

    // Open detail modal
    const openDetail = e.target.closest('[data-open-detail]');
    if (openDetail) {
      const id = openDetail.getAttribute('data-open-detail');
      const found = state.liveWorksheets.find(w => w.id === id);
      if (found) {
        state.selectedWorksheet = found;
        state.activePreviewPageIndex = 0;
        state.activeModal = 'detail';
        renderModals();
      }
      return;
    }

    // Thumbnails in detail
    const thumbTrigger = e.target.closest('[data-thumb-idx]');
    if (thumbTrigger) {
      const idx = parseInt(thumbTrigger.getAttribute('data-thumb-idx'), 10);
      state.activePreviewPageIndex = idx;
      renderModals();
      return;
    }

    // Switch worksheet from detail bottom carousel
    const switchWs = e.target.closest('[data-switch-ws]');
    if (switchWs) {
      const nextId = switchWs.getAttribute('data-switch-ws');
      const found = state.liveWorksheets.find(w => w.id === nextId);
      if (found) {
        state.selectedWorksheet = found;
        state.activePreviewPageIndex = 0;
        renderModals();
      }
      return;
    }

    // Add to cart
    const addCart = e.target.closest('[data-add-cart]') || e.target.closest('#modal-btn-add-cart');
    if (addCart) {
      const id = addCart.getAttribute('data-add-cart') || addCart.getAttribute('data-id');
      const ws = state.liveWorksheets.find(w => w.id === id);
      if (ws) {
        cartService.addToCart(ws);
        triggerConfetti(e.clientX, e.clientY);
        showToast(`Đã thêm "${ws.title}" vào giỏ hàng!`);
      }
      return;
    }

    // Buy now
    const buyNow = e.target.closest('#modal-btn-buy-now');
    if (buyNow) {
      const id = buyNow.getAttribute('data-id');
      const ws = state.liveWorksheets.find(w => w.id === id);
      if (ws) {
        cartService.addToCart(ws);
        state.activeModal = 'cart';
        renderModals();
      }
      return;
    }

    // Free sample download
    if (e.target.closest('#modal-btn-sample-download')) {
      const id = e.target.closest('#modal-btn-sample-download').getAttribute('data-id');
      await dataService.logDownload(id);
      triggerConfetti();
      showToast('Đang tải bản mẫu PDF chất lượng in ấn!');
      return;
    }

    // Instant download for Pro/Teacher/Admin
    if (e.target.closest('#modal-btn-instant-download')) {
      const id = e.target.closest('#modal-btn-instant-download').getAttribute('data-id');
      await dataService.logDownload(id);
      triggerConfetti();
      showToast('Tải thành công file PDF vector độ nét cao!');
      return;
    }

    // Cart +/-
    const qtyBtn = e.target.closest('[data-qty-delta]');
    if (qtyBtn) {
      const delta = parseInt(qtyBtn.getAttribute('data-qty-delta'), 10);
      const itemId = qtyBtn.getAttribute('data-item-id');
      cartService.updateQuantity(itemId, delta);
      renderModals();
      return;
    }

    // Cart delete
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
        showToast('Áp dụng ưu đãi MAMNON2026 giảm 20%!');
        renderModals();
      } else if (code === 'GIAOVIEN' || code === 'GIAOVIEN50') {
        state.voucherCode = code;
        state.voucherDiscountPercent = 50;
        showToast('Áp dụng ưu đãi Giáo Viên giảm 50%!');
        renderModals();
      } else {
        showToast('Mã giảm giá không đúng. Thử: MAMNON2026 hoặc GIAOVIEN');
      }
      return;
    }

    // Checkout button
    if (e.target.closest('#btn-cart-checkout')) {
      state.activeModal = 'checkout-qr';
      renderModals();
      return;
    }

    // Confirm Payment & save order into Supabase
    const confirmPayment = e.target.closest('#btn-confirm-payment-success');
    if (confirmPayment) {
      const total = parseInt(confirmPayment.getAttribute('data-order-total'), 10);
      const code = state.voucherCode;
      const items = cartService.getCart();

      try {
        await dataService.createOrder({ total, discount: 0, finalTotal: total, code }, items);
      } catch (err) {
        console.warn('Lưu đơn hàng vào Supabase:', err);
      }

      cartService.clearCart();
      state.activeModal = null;
      renderModals();
      triggerConfetti();
      showToast('🎉 Đơn hàng đã ghi nhận thành công! Bạn có thể tải ngay học liệu.');
      return;
    }

    // Education suite actions
    const eduAction = e.target.closest('[data-action]');
    if (eduAction) {
      const action = eduAction.getAttribute('data-action');
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

    // Category click
    const catCard = e.target.closest('[data-category-id]');
    if (catCard) {
      state.activeCategory = catCard.getAttribute('data-category-id');
      renderCatalog();
      document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Navigation links
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

    // Admin Tabs
    const adminTab = e.target.closest('[data-admin-tab]');
    if (adminTab) {
      state.adminTab = adminTab.getAttribute('data-admin-tab');
      if (state.adminTab === 'users') {
        state.adminUsersList = await authService.getAllUsers();
      }
      renderModals();
      return;
    }

    // Show add material form
    if (e.target.id === 'btn-show-add-material-form') {
      const box = document.getElementById('add-material-form-box');
      if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
      return;
    }

    if (e.target.id === 'btn-cancel-add-material') {
      const box = document.getElementById('add-material-form-box');
      if (box) box.style.display = 'none';
      return;
    }

    // Copy SQL
    if (e.target.id === 'btn-copy-sql') {
      navigator.clipboard.writeText(`-- SCHEMA SUPABASE HỌC LIỆU MẦM NON
CREATE TABLE profiles (id UUID PRIMARY KEY, email TEXT, role TEXT, full_name TEXT);
CREATE TABLE materials (id UUID PRIMARY KEY, title TEXT, price INT);`);
      showToast('Đã sao chép SQL vào Clipboard!');
      return;
    }

    // Save Supabase Config
    if (e.target.id === 'btn-save-supabase-config') {
      const url = document.getElementById('cfg-supabase-url').value;
      const key = document.getElementById('cfg-supabase-key').value;
      supabaseSettings.saveConfig(url, key);
      showToast('Đã lưu cấu hình Supabase! Đang kết nối lại...');
      state.activeModal = null;
      renderModals();
      renderHeader();
      loadProductionData();
      return;
    }

    // Game shape click
    const shapeTarget = e.target.closest('[data-shape]');
    if (shapeTarget) {
      const shape = shapeTarget.getAttribute('data-shape');
      if (shape === state.gameTargetShape) {
        state.gameScore += 1;
        triggerConfetti(e.clientX, e.clientY);
        const fb = document.getElementById('game-feedback');
        if (fb) fb.innerHTML = '🎉 Hoan hô bé giỏi quá! Điểm: ' + state.gameScore + ' ⭐';
        
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

    // Print
    if (e.target.id === 'btn-print-worksheet') {
      window.print();
      return;
    }

    // Choose plan
    const planBtn = e.target.closest('[data-choose-plan]');
    if (planBtn) {
      const planId = planBtn.getAttribute('data-choose-plan');
      if (user.role === 'guest') {
        state.activeModal = 'auth';
        state.authMode = 'signup';
        renderModals();
        showToast('Vui lòng đăng ký tài khoản để kích hoạt gói dịch vụ!');
      } else {
        showToast('Chuyển sang trang thanh toán gói: ' + planId);
      }
      return;
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
  });

  // Filter changes
  document.addEventListener('change', (e) => {
    if (e.target.name === 'grade_filter') {
      state.activeGrade = e.target.value;
      renderCatalog();
    }
    if (e.target.classList.contains('topic-checkbox')) {
      const val = e.target.value;
      if (e.target.checked) {
        if (!state.selectedTopics.includes(val)) state.selectedTopics.push(val);
      } else {
        state.selectedTopics = state.selectedTopics.filter(t => t !== val);
      }
      renderCatalog();
    }
    if (e.target.id === 'chk-pdf-printable') {
      state.selectedFormat = e.target.checked ? 'pdf' : 'all';
      renderCatalog();
    }
    if (e.target.id === 'catalog-sort-select') {
      state.sortBy = e.target.value;
      renderCatalog();
    }
    if (e.target.id === 'gen-child-name') {
      const p = document.getElementById('preview-child-name');
      if (p) p.innerText = e.target.value || 'Bé yêu';
    }

    // Admin change real user role
    const roleSelect = e.target.closest('[data-change-real-user-role]');
    if (roleSelect) {
      const uId = roleSelect.getAttribute('data-change-real-user-role');
      const newRole = roleSelect.value;
      authService.updateUserRole(uId, newRole).then(() => {
        showToast('Đã cập nhật vai trò người dùng trong Supabase!');
      }).catch(err => {
        showToast('Lỗi cập nhật: ' + err.message);
      });
    }
  });

  // Form submit: Auth
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'auth-form') {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-password').value;
      const fullName = document.getElementById('auth-fullname')?.value;
      const role = document.getElementById('auth-role')?.value || 'parent';
      const errBox = document.getElementById('auth-error-msg');

      try {
        if (state.authMode === 'signup') {
          await authService.signUp(email, pass, fullName, role);
          showToast(`Đăng ký thành công! Chào mừng ${fullName || email}`);
        } else {
          await authService.signIn(email, pass);
          showToast(`Đăng nhập thành công!`);
        }
        state.activeModal = null;
        renderModals();
        renderHeader();
      } catch (err) {
        if (errBox) {
          errBox.innerText = err.message || 'Lỗi xác thực!';
          errBox.style.display = 'block';
        } else {
          showToast('Lỗi: ' + err.message);
        }
      }
    }

    // Form submit: Admin Material Editor (Đăng bán mới & Chỉnh sửa học liệu)
    if (e.target.id === 'form-material-editor' || e.target.id === 'form-create-material') {
      e.preventDefault();
      const title = (document.getElementById('ed-title') || document.getElementById('new-mat-title'))?.value?.trim();
      const price = parseInt((document.getElementById('ed-price') || document.getElementById('new-mat-price'))?.value, 10) || 0;
      const ageId = (document.getElementById('ed-age') || document.getElementById('new-mat-age'))?.value || '3-4';
      const catId = (document.getElementById('ed-category') || document.getElementById('new-mat-category'))?.value || 'tao-hinh';
      const coverUrl = document.getElementById('ed-cover-url')?.value?.trim() || './assets/misa_bear.jpg';
      const desc = (document.getElementById('ed-desc') || document.getElementById('new-mat-desc'))?.value?.trim() || '';
      const pages = parseInt(document.getElementById('ed-pages')?.value, 10) || 1;
      const pdfUrl = document.getElementById('ed-pdf-url')?.value?.trim() || '';

      const ageLabelMap = {
        '3-4': '3 - 4 tuổi (Mầm)',
        '4-5': '4 - 5 tuổi (Chồi)',
        '5-6': '5 - 6 tuổi (Lá)'
      };

      if (state.adminEditorMode === 'create' || e.target.id === 'form-create-material') {
        const newMat = {
          title,
          price,
          grade_level: ageId,
          age_range_label: ageLabelMap[ageId] || '3 - 5 tuổi',
          category_id: catId,
          page_count: pages,
          format_type: 'PDF (Chất lượng in cao)',
          preview_image_url: coverUrl,
          file_pdf_url: pdfUrl,
          description: desc,
          is_free_sample: price === 0,
          rating: 5.0,
          rating_count: 1,
          download_count: 0
        };

        try {
          dataService.createMaterial(newMat).catch(e => console.warn('Lưu Supabase:', e));

          const fullMat = {
            id: 'hl-mat-' + Date.now(),
            title: newMat.title,
            price: newMat.price,
            age: newMat.age_range_label,
            ageId: newMat.grade_level,
            category: newMat.category_id,
            pages: newMat.page_count,
            format: newMat.format_type,
            coverImage: newMat.preview_image_url,
            description: newMat.description,
            pdfUrl: newMat.file_pdf_url,
            rating: 5.0,
            reviewsCount: 1,
            downloads: 0,
            isFreeSample: newMat.is_free_sample,
            previewPages: [{ id: 1, image: newMat.preview_image_url }]
          };

          state.liveWorksheets.unshift(fullMat);
          state.activeModal = null;
          renderCatalog();
          renderModals();
          triggerConfetti();
          showToast('🎉 Đã đăng bán học liệu mới thành công lên website!');
        } catch (err) {
          showToast('Lỗi khi đăng học liệu: ' + err.message);
        }
      } else if (state.adminEditorMode === 'edit') {
        const editId = state.editingMaterial?.id;
        const updatedPayload = {
          title,
          price,
          grade_level: ageId,
          age_range_label: ageLabelMap[ageId] || '3 - 5 tuổi',
          category_id: catId,
          page_count: pages,
          preview_image_url: coverUrl,
          file_pdf_url: pdfUrl,
          description: desc,
          is_free_sample: price === 0
        };

        try {
          dataService.updateMaterial(editId, updatedPayload).catch(e => console.warn('Cập nhật Supabase:', e));

          const idx = state.liveWorksheets.findIndex(w => w.id === editId);
          if (idx !== -1) {
            state.liveWorksheets[idx] = {
              ...state.liveWorksheets[idx],
              title,
              price,
              age: ageLabelMap[ageId] || '3 - 5 tuổi',
              ageId,
              category: catId,
              pages,
              coverImage: coverUrl,
              description: desc,
              pdfUrl,
              isFreeSample: price === 0
            };
          }

          state.activeModal = null;
          renderCatalog();
          renderModals();
          triggerConfetti();
          showToast('✅ Đã cập nhật thông tin học liệu thành công!');
        } catch (err) {
          showToast('Lỗi khi cập nhật học liệu: ' + err.message);
        }
      }
    }
  });

  // State changes
  authService.onAuthChange(() => {
    renderHeader();
    renderCatalog();
  });

  cartService.onCartChange(() => {
    renderHeader();
  });
}

// Toast & Confetti
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

// Initialization
export function initApp() {
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
  loadProductionData();

  // Tự động đồng bộ và cập nhật dữ liệu từ Supabase mỗi 15 giây
  setInterval(async () => {
    try {
      await loadProductionData();
    } catch (e) {
      // background sync
    }
  }, 15000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
