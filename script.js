/**
 * ========================================================================
 * AAMS - Automated Admission Management System
 * Core SPA Script (script.js)
 * Manages SPA section visibility, role architecture, 4-step wizard,
 * AI photo verification, notices, eligibility calculator, and admit cards.
 * ========================================================================
 */

// Application State Store
const state = {
  currentSection: 'section-1',
  currentRole: 'applicant', // 'applicant' | 'admin' | 'guest'
  wizardStep: 1,
  
  applicant: {
    id: 'AAMS-2026-88412',
    name: 'Sarah Rahman',
    email: 'sarah.rahman@example.com',
    phone: '+880 1712-345678',
    dob: '2006-04-18',
    fatherName: 'Mustafizur Rahman',
    motherName: 'Nasrin Sultana',
    photoUrl: '/src/assets/images/university_crest_emblem_1791455258427.jpg',
    aiVerified: true,
    aiConfidence: 98.7,
    ssc: { roll: '214589', reg: '1812940251', board: 'Dhaka', year: '2024', gpa: 5.00, group: 'Science' },
    hsc: { roll: '518423', reg: '1812940251', board: 'Dhaka', year: '2026', gpa: 5.00, group: 'Science' },
    quota: 'general',
    selectedUnits: ['Unit A', 'Unit D'],
    preferredDepartments: [
      'Computer Science & Engineering (CSE)',
      'Software Engineering (SWE)',
      'Statistics & Data Science'
    ],
    languageMedium: 'English',
    status: 'accepted', // 'draft' | 'submitted' | 'under_review' | 'accepted'
    admitCardReady: true,
    examRoll: 'A-26-88412',
    examCenter: 'Faculty of Engineering, Academic Complex Building 3, Room 402',
    examDateTime: 'November 28, 2026 | 10:00 AM - 11:30 AM',
    paymentStatus: 'paid',
    transactionId: 'TXN-AAMS-9938217'
  },

  notices: [
    {
      id: 'not-1',
      title: 'Undergraduate Admission Circular for Academic Session 2026-2027',
      category: 'Admission',
      content: 'Online applications are hereby invited from eligible candidates for admission into first-year undergraduate programs across all faculties. The central portal will remain active from October 15 to November 15, 2026.',
      publishedDate: '2026-10-01',
      isPinned: true,
      author: 'Central Admission Committee',
      circularFile: 'AAMS_Circular_2026_27.pdf'
    },
    {
      id: 'not-2',
      title: 'Admit Card Generation & AI Photo Screening Rules for Unit A & B',
      category: 'Examination',
      content: 'All applicants who have successfully completed fee clearance and automated photo compliance verification can now download their digital Admit Card directly from the student dashboard.',
      publishedDate: '2026-10-05',
      isPinned: true,
      author: 'Office of the Controller of Examinations',
      circularFile: 'Admit_Card_Rules_2026.pdf'
    },
    {
      id: 'not-3',
      title: 'Special Guidelines for Freedom Fighter and Tribal Quota Verification',
      category: 'Quota',
      content: 'Candidates applying under Freedom Fighter (children/grandchildren) or Ethnic Tribal quotas must upload verifiable government certificates issued by the Ministry of Liberation War Affairs.',
      publishedDate: '2026-10-03',
      isPinned: false,
      author: 'Quota Scrutiny Directorate',
      circularFile: 'Quota_Verification_Schedule.pdf'
    }
  ],

  selectedNoticeCategory: 'All',
  noticeSearchTerm: ''
};

// ========================================================================
// 1. SPA VISIBILITY CONTROLLER
// Only ONE main section is active/visible at a time, hiding all others.
// ========================================================================
function navigateToSection(sectionId) {
  state.currentSection = sectionId;

  // Query all SPA sections and hide them
  const sections = document.querySelectorAll('.spa-section');
  sections.forEach((sec) => {
    sec.classList.remove('active');
  });

  // Activate the requested section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update navigation button active styles
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach((btn) => {
    if (btn.getAttribute('data-target') === sectionId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Close mobile drawer if open
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) drawer.classList.remove('open');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
}

// ========================================================================
// 2. ROLE ARCHITECTURE (Applicant, Admin, Guest)
// ========================================================================
function switchRole(role) {
  state.currentRole = role;

  const roleText = document.getElementById('activeRoleText');
  const roleDot = document.getElementById('activeRoleDot');
  const applicantView = document.getElementById('applicantDashboardView');
  const adminView = document.getElementById('adminDashboardView');

  if (roleText) {
    roleText.textContent = role === 'admin' ? 'Admin View' : role === 'applicant' ? 'Applicant View' : 'Guest View';
  }

  if (roleDot) {
    roleDot.className = 'role-dot' + (role === 'admin' ? ' admin' : '');
  }

  // Segmented control active states in Section 2
  const segApplicant = document.getElementById('segRoleApplicant');
  const segAdmin = document.getElementById('segRoleAdmin');
  if (segApplicant && segAdmin) {
    if (role === 'applicant') {
      segApplicant.classList.add('active');
      segAdmin.classList.remove('active');
    } else if (role === 'admin') {
      segAdmin.classList.add('active');
      segApplicant.classList.remove('active');
    }
  }

  // Toggle Section 2 Views
  if (applicantView && adminView) {
    if (role === 'admin') {
      applicantView.style.display = 'none';
      adminView.style.display = 'block';
    } else {
      applicantView.style.display = 'block';
      adminView.style.display = 'none';
    }
  }
}

// ========================================================================
// 3. APPLICATION STEPPER SIMULATION
// ========================================================================
function setApplicationStatus(newStatus) {
  state.applicant.status = newStatus;
  state.applicant.admitCardReady = (newStatus === 'accepted' || newStatus === 'under_review');
  renderDashboardApplicantDetails();
}

function renderDashboardApplicantDetails() {
  const nameEl = document.getElementById('dashApplicantName');
  const idEl = document.getElementById('dashApplicantId');
  const statusBadge = document.getElementById('dashStatusBadge');
  const admitBtn = document.getElementById('btnDownloadAdmitCard');

  if (nameEl) nameEl.textContent = state.applicant.name;
  if (idEl) idEl.textContent = state.applicant.id;

  if (statusBadge) {
    statusBadge.textContent = state.applicant.status.replace('_', ' ').toUpperCase();
    statusBadge.className = 'role-badge';
  }

  // Update Stepper Nodes
  const stepNodes = ['step-draft', 'step-submitted', 'step-review', 'step-accepted'];
  const statusOrder = ['draft', 'submitted', 'under_review', 'accepted'];
  const currentIndex = statusOrder.indexOf(state.applicant.status);

  stepNodes.forEach((nodeId, idx) => {
    const elm = document.getElementById(nodeId);
    if (elm) {
      elm.classList.remove('completed', 'active-step');
      if (idx < currentIndex) {
        elm.classList.add('completed');
      } else if (idx === currentIndex) {
        elm.classList.add('active-step');
      }
    }
  });

  if (admitBtn) {
    admitBtn.style.display = state.applicant.admitCardReady ? 'inline-flex' : 'none';
  }
}

// ========================================================================
// 4. AI PHOTO & SELFIE VERIFICATION CHECK
// ========================================================================
function runAiPhotoCheck() {
  const scanBtn = document.getElementById('btnRunAiScan');
  const aiStatusBadge = document.getElementById('aiVerificationBadge');
  const aiScoreText = document.getElementById('aiConfidenceScore');

  if (scanBtn) {
    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning facial features...';
  }

  setTimeout(() => {
    state.applicant.aiVerified = true;
    state.applicant.aiConfidence = 98.9;

    if (scanBtn) {
      scanBtn.disabled = false;
      scanBtn.textContent = 'Re-Run AI Face Check';
    }

    if (aiStatusBadge) {
      aiStatusBadge.textContent = 'Human Face Detected & Validated';
      aiStatusBadge.style.color = '#059669';
    }

    if (aiScoreText) {
      aiScoreText.textContent = `${state.applicant.aiConfidence}% Match Confidence`;
    }
    alert('AI Face Verification complete: Single human face detected with 98.9% confidence and neutral background.');
  }, 1000);
}

// ========================================================================
// 5. INTERACTIVE ACADEMIC ELIGIBILITY CALCULATOR (Section 4)
// ========================================================================
function calculateEligibility() {
  const sscVal = parseFloat(document.getElementById('calcSscGpa').value) || 0;
  const hscVal = parseFloat(document.getElementById('calcHscGpa').value) || 0;
  const group = document.getElementById('calcHscGroup').value;
  const total = sscVal + hscVal;

  const totalEl = document.getElementById('calcTotalGpaDisplay');
  if (totalEl) totalEl.textContent = `${total.toFixed(2)} / 10.00`;

  // Unit Criteria
  const units = [
    { id: 'unit-a-badge', minSsc: 4.0, minHsc: 4.0, minTotal: 8.5, groups: ['Science'] },
    { id: 'unit-b-badge', minSsc: 3.5, minHsc: 3.5, minTotal: 7.5, groups: ['Science', 'Humanities', 'Business'] },
    { id: 'unit-c-badge', minSsc: 3.75, minHsc: 3.75, minTotal: 8.0, groups: ['Business', 'Science', 'Humanities'] },
    { id: 'unit-d-badge', minSsc: 3.75, minHsc: 3.75, minTotal: 8.0, groups: ['Science', 'Humanities', 'Business'] },
  ];

  units.forEach((u) => {
    const badge = document.getElementById(u.id);
    if (!badge) return;

    const meetsGpa = sscVal >= u.minSsc && hscVal >= u.minHsc && total >= u.minTotal;
    const meetsGroup = u.groups.includes(group);

    if (meetsGpa && meetsGroup) {
      badge.textContent = 'Eligible';
      badge.style.color = '#059669';
      badge.style.backgroundColor = '#ecfdf5';
    } else {
      badge.textContent = 'Not Eligible';
      badge.style.color = '#dc2626';
      badge.style.backgroundColor = '#fef2f2';
    }
  });
}

// ========================================================================
// 6. 4-STEP APPLICATION WIZARD (Section 5)
// ========================================================================
function setWizardStep(stepNum) {
  state.wizardStep = stepNum;

  // Update tabs
  for (let i = 1; i <= 4; i++) {
    const tabBtn = document.getElementById(`wiz-tab-${i}`);
    const content = document.getElementById(`wiz-step-${i}`);

    if (tabBtn) {
      tabBtn.classList.remove('active', 'done');
      if (i === stepNum) tabBtn.classList.add('active');
      else if (i < stepNum) tabBtn.classList.add('done');
    }

    if (content) {
      content.classList.remove('active');
      if (i === stepNum) content.classList.add('active');
    }
  }
}

function handleWizardSubmit(e) {
  e.preventDefault();
  const agree = document.getElementById('wizDeclarationAgree');
  if (!agree || !agree.checked) {
    alert('Please agree to the statutory declaration to submit your application.');
    return;
  }

  const generatedId = `AAMS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  state.applicant.id = generatedId;
  state.applicant.name = document.getElementById('wizApplicantName').value || state.applicant.name;
  state.applicant.status = 'submitted';
  state.applicant.admitCardReady = true;

  alert(`Congratulations! Application ${generatedId} submitted successfully. Redirecting to your Dashboard...`);
  renderDashboardApplicantDetails();
  navigateToSection('section-2');
}

// ========================================================================
// 7. NOTICE MANAGER & GRID (Section 2 & Section 3)
// ========================================================================
function renderNotices() {
  const grid = document.getElementById('noticeGridContainer');
  const adminList = document.getElementById('adminNoticeList');

  // Filter notices for Section 3 Grid
  const filtered = state.notices.filter((n) => {
    const matchesCat = state.selectedNoticeCategory === 'All' || n.category === state.selectedNoticeCategory;
    const matchesSearch = n.title.toLowerCase().includes(state.noticeSearchTerm.toLowerCase()) ||
                          n.content.toLowerCase().includes(state.noticeSearchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">No circulars match current filter.</div>';
    } else {
      grid.innerHTML = filtered.map((n) => `
        <div class="notice-card ${n.isPinned ? 'pinned' : ''}" onclick="openNoticeModal('${n.id}')">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.6875rem; font-weight: 700; color: #1e3a8a; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">${n.category}</span>
              <span style="font-size: 0.6875rem; color: #94a3b8; font-family: monospace;">${n.publishedDate}</span>
            </div>
            <h4 style="font-size: 0.9375rem; font-weight: 700; color: #1e293b; line-height: 1.3; margin-bottom: 0.5rem;">${n.title}</h4>
            <p style="font-size: 0.75rem; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${n.content}</p>
          </div>
          <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 0.6875rem; color: #1e3a8a; font-weight: 600;">
            <span>${n.author}</span>
            <span>Read Notice →</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Admin Notice List in Section 2
  if (adminList) {
    adminList.innerHTML = state.notices.map((n) => `
      <div style="padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
        <div>
          <span style="font-size: 0.6875rem; font-weight: 700; color: #1e3a8a; background: #eff6ff; padding: 1px 5px; border-radius: 3px;">${n.category}</span>
          <span style="font-size: 0.8125rem; font-weight: 600; color: #1e293b; margin-left: 0.5rem;">${n.title}</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="togglePinNotice('${n.id}')" style="background: none; border: none; cursor: pointer; color: ${n.isPinned ? '#d97706' : '#94a3b8'}; font-size: 0.75rem;">${n.isPinned ? '★ Pinned' : '☆ Pin'}</button>
          <button onclick="deleteNotice('${n.id}')" style="background: none; border: none; cursor: pointer; color: #dc2626; font-size: 0.75rem;">Delete</button>
        </div>
      </div>
    `).join('');
  }
}

function handleAdminNoticePublish(e) {
  e.preventDefault();
  const title = document.getElementById('adminNoticeTitle').value;
  const category = document.getElementById('adminNoticeCategory').value;
  const content = document.getElementById('adminNoticeContent').value;
  const date = document.getElementById('adminNoticeDate').value || '2026-10-08';

  if (!title || !content) return;

  const newNotice = {
    id: `not-${Date.now()}`,
    title,
    category,
    content,
    publishedDate: date,
    isPinned: false,
    author: 'Admission Convenor Desk',
    circularFile: 'Gazetted_Circular.pdf'
  };

  state.notices.unshift(newNotice);
  document.getElementById('adminNoticeTitle').value = '';
  document.getElementById('adminNoticeContent').value = '';
  renderNotices();
  alert('Notice published successfully and live on Section 3 (Notice Grid)!');
}

function deleteNotice(id) {
  state.notices = state.notices.filter((n) => n.id !== id);
  renderNotices();
}

function togglePinNotice(id) {
  state.notices = state.notices.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  renderNotices();
}

function filterNotices(category) {
  state.selectedNoticeCategory = category;
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach((p) => {
    if (p.textContent === category) p.classList.add('active');
    else p.classList.remove('active');
  });
  renderNotices();
}

function searchNotices(term) {
  state.noticeSearchTerm = term;
  renderNotices();
}

// ========================================================================
// 8. MODAL HANDLERS (Admit Card, Notice, Support)
// ========================================================================
function openAdmitCardModal() {
  const modal = document.getElementById('admitCardModal');
  if (modal) modal.classList.add('open');
}

function closeAdmitCardModal() {
  const modal = document.getElementById('admitCardModal');
  if (modal) modal.classList.remove('open');
}

function printAdmitCard() {
  window.print();
}

function openNoticeModal(id) {
  const notice = state.notices.find((n) => n.id === id);
  if (!notice) return;

  const titleEl = document.getElementById('modalNoticeTitle');
  const catEl = document.getElementById('modalNoticeCategory');
  const dateEl = document.getElementById('modalNoticeDate');
  const bodyEl = document.getElementById('modalNoticeBody');
  const modal = document.getElementById('noticeReaderModal');

  if (titleEl) titleEl.textContent = notice.title;
  if (catEl) catEl.textContent = `${notice.category} Notice`;
  if (dateEl) dateEl.textContent = `Published: ${notice.publishedDate} · Issued by: ${notice.author}`;
  if (bodyEl) bodyEl.textContent = notice.content;

  if (modal) modal.classList.add('open');
}

function closeNoticeModal() {
  const modal = document.getElementById('noticeReaderModal');
  if (modal) modal.classList.remove('open');
}

function openSupportModal() {
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.add('open');
}

function closeSupportModal() {
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.remove('open');
}

function handleSupportSubmit(e) {
  e.preventDefault();
  const tktId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  alert(`Your support query has been lodged with Reference ID: ${tktId}. Helpdesk officers will reply within 2 hours.`);
  closeSupportModal();
}

// ========================================================================
// 9. ACCORDION FAQ CONTROLLER (Section 6)
// ========================================================================
function toggleFaqAccordion(headerEl) {
  const item = headerEl.parentElement;
  if (item) {
    item.classList.toggle('open');
  }
}

// ========================================================================
// 10. AUTH & DEMO LOGIN CONTROLLER (Section 7)
// ========================================================================
function switchAuthTab(tab) {
  const loginForm = document.getElementById('authLoginForm');
  const regForm = document.getElementById('authRegisterForm');
  const tabLogin = document.getElementById('authTabLogin');
  const tabReg = document.getElementById('authTabReg');

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (regForm) regForm.style.display = 'none';
    if (tabLogin) tabLogin.classList.add('active');
    if (tabReg) tabReg.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'block';
    if (tabReg) tabReg.classList.add('active');
    if (tabLogin) tabLogin.classList.remove('active');
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  switchRole('applicant');
  navigateToSection('section-2');
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  if (name) state.applicant.name = name;
  state.applicant.id = `AAMS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  state.applicant.status = 'draft';
  switchRole('applicant');
  renderDashboardApplicantDetails();
  navigateToSection('section-2');
}

function quickDemoLogin(role) {
  switchRole(role);
  navigateToSection('section-2');
}

// ========================================================================
// INITIALIZATION ON DOM CONTENT LOADED
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Render notices in Section 2 and Section 3
  renderNotices();
  // Render Dashboard details
  renderDashboardApplicantDetails();
  // Compute initial calculator
  calculateEligibility();
});
