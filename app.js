// js/app.js
// KDU Study Group Finder (KDU StudyConnect) - Application Logic & Controllers
// General Sir John Kotelawala Defence University
// Perspective: Faculty of Technology (FOT) - BTech (Hons) in ICT - Intake 43

// ---------- Helper Functions ----------

function $(selector, root) {
  return (root || document).querySelector(selector);
}

function $$(selector, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(selector));
}

function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function initials(name) {
  if (!name) return "KD";
  const clean = name.replace(/^Cadet\s+/i, "").replace(/^Cdt\.?\s+/i, "").replace(/^Maj\.?\s+/i, "");
  const parts = clean.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = ["#d8e3fb", "#fed56f", "#89f5e7", "#ffd8e4", "#e2e3e9", "#c3c6cf"];

function avatarHtml(name, size) {
  const s = size || 38;
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash += name.charCodeAt(i);
  const bg = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  return '<div class="rounded-full flex items-center justify-center font-bold text-primary shrink-0 select-none shadow-sm" ' +
    'style="width:' + s + 'px;height:' + s + 'px;background-color:' + bg + ';font-size:' + Math.round(s * 0.38) + 'px;">' +
    esc(initials(name)) + '</div>';
}

function slotLabel(key) {
  const parts = String(key).split("-");
  const day = DAYS.find(function (d) { return d.key === parts[0]; });
  const dayName = day ? day.label : parts[0];
  const slotName = SLOT_NAMES[Number(parts[1])] || "Slot " + parts[1];
  return dayName + " " + slotName;
}

function dayLabel(key) {
  const d = DAYS.find(function (x) { return x.key === key; });
  return d ? d.label : key;
}

function formatTime(ts) {
  if (!ts) return "";
  const dt = new Date(ts);
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    ", " + dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

let toastTimer = null;
function showToast(message, isError) {
  let toast = document.getElementById("kdu-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "kdu-toast";
    toast.className = "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-label-md text-label-md transition-all transform duration-300 flex items-center gap-3";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-label-md text-label-md transition-all transform duration-300 flex items-center gap-3 " +
    (isError ? "bg-error text-on-error" : "bg-primary text-on-primary");
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
  }, 3200);
}

// ---------- Canonical 60/40 Explainable Matching Algorithm ----------

function sharedCourses(a, b) {
  const ac = a.courses || [];
  const bc = b.courses || [];
  return ac.filter(function (id) { return bc.includes(id); });
}

function commonSlots(a, b) {
  const aa = a.availability || [];
  const ba = b.availability || [];
  return aa.filter(function (s) { return ba.includes(s); });
}

function computeMatches(me) {
  if (!me || !me.courses || !me.courses.length) return [];
  const candidates = db().users.filter(function (u) {
    return u.id !== me.id && u.role !== "admin" && profileComplete(u);
  });

  return candidates.map(function (other) {
    const shared = sharedCourses(me, other);
    const slots = commonSlots(me, other);

    // Normalizing by min() ensures fairness across students with varying module loads
    const courseDenom = Math.max(1, Math.min(me.courses.length, other.courses.length));
    const availDenom = Math.max(1, Math.min(me.availability.length, other.availability.length));

    const courseScore = shared.length / courseDenom;
    const availScore = slots.length / availDenom;

    // Strict 60% Module overlap + 40% Schedule compatibility
    const finalScore = (0.6 * courseScore) + (0.4 * availScore);

    return {
      user: other,
      shared: shared,
      slots: slots,
      score: finalScore,
      courseScore: courseScore,
      availScore: availScore
    };
  })
  .filter(function (m) { return m.score > 0.05; })
  .sort(function (a, b) { return b.score - a.score; });
}

// ---------- Standard Top Navigation Header ----------

function renderHeader(activePageKey) {
  const header = $("header");
  if (!header) return;

  const user = currentUser();
  const studentType = user ? getStudentType(user.indexNo) : null;

  let navItemsHtml = "";
  if (user) {
    const links = [
      { key: "dashboard", label: "Dashboard", href: "dashboard.html" },
      { key: "groups", label: "Study Syndicates", href: "groups.html" },
      { key: "profile", label: "Profile & Modules", href: "profile.html" }
    ];
    if (user.role === "admin") {
      links.push({ key: "admin", label: "Admin Moderation", href: "admin.html", isStaff: true });
    }

    navItemsHtml = links.map(function (item) {
      const isActive = item.key === activePageKey;
      return '<a href="' + item.href + '" class="h-full flex items-center gap-2 px-3 transition-colors ' +
        (isActive
          ? 'text-primary font-bold border-b-2 border-primary'
          : 'text-on-surface-variant hover:text-primary font-medium') + '">' +
        item.label +
        (item.isStaff ? '<span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-secondary text-on-secondary">Staff</span>' : '') +
        '</a>';
    }).join("");
  }

  header.className = "fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-outline-variant shadow-sm";
  header.innerHTML =
    '<div class="h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">' +
      '<div class="flex items-center gap-6">' +
        '<a href="' + (user ? "dashboard.html" : "index.html") + '" class="flex items-center gap-3 group">' +
          '<img src="img/kdu-logo.png" alt="KDU Crest" class="w-10 h-10 object-contain group-hover:scale-105 transition-transform">' +
          '<div class="flex flex-col">' +
            '<span class="font-headline-sm text-primary font-bold leading-tight">KDU StudyConnect</span>' +
            '<span class="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">Kotelawala Defence University</span>' +
          '</div>' +
        '</a>' +
        '<nav class="hidden md:flex items-center h-16 ml-4">' + navItemsHtml + '</nav>' +
      '</div>' +
      '<div class="flex items-center gap-4">' +
        (user
          ? '<div class="flex items-center gap-3">' +
              avatarHtml(user.name, 36) +
              '<div class="hidden sm:flex flex-col text-left">' +
                '<div class="flex items-center gap-2">' +
                  '<span class="font-label-md font-semibold text-on-surface leading-tight">' + esc(user.name) + '</span>' +
                  '<span class="text-[10px] px-1.5 py-0.5 rounded ' + studentType.badgeClass + '">' + studentType.type + '</span>' +
                '</div>' +
                '<span class="text-xs text-on-surface-variant font-mono">' + esc(user.indexNo || "") + ' · Intake ' + (user.intake || "43") + '</span>' +
              '</div>' +
              '<button id="btn-signout" type="button" class="ml-2 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors">' +
                'Sign out' +
              '</button>' +
            '</div>'
          : '<a href="index.html" class="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-xs font-semibold hover:bg-primary-container transition-colors">Portal Login</a>') +
      '</div>' +
    '</div>' +
    '<div class="h-[2px] w-full bg-secondary"></div>';

  const signoutBtn = $("#btn-signout");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", async function () {
      await signOut();
      location.href = "index.html";
    });
  }
}

// ---------- Page Controller: Authentication (index.html) ----------

function initAuthPage() {
  const signinTab = $("#tab-signin");
  const registerTab = $("#tab-register");
  const signinPanel = $("#panel-signin");
  const registerPanel = $("#panel-register");

  function switchTab(mode) {
    if (!signinTab || !registerTab || !signinPanel || !registerPanel) return;
    const isSignin = mode === "signin";
    signinTab.classList.toggle("bg-surface-container-lowest", isSignin);
    signinTab.classList.toggle("text-primary", isSignin);
    signinTab.classList.toggle("shadow-sm", isSignin);
    signinTab.classList.toggle("text-on-surface-variant", !isSignin);

    registerTab.classList.toggle("bg-surface-container-lowest", !isSignin);
    registerTab.classList.toggle("text-primary", !isSignin);
    registerTab.classList.toggle("shadow-sm", !isSignin);
    registerTab.classList.toggle("text-on-surface-variant", isSignin);

    signinPanel.classList.toggle("hidden", !isSignin);
    signinPanel.classList.toggle("flex", isSignin);
    registerPanel.classList.toggle("hidden", isSignin);
    registerPanel.classList.toggle("flex", !isSignin);
  }

  if (signinTab) signinTab.addEventListener("click", function () { switchTab("signin"); });
  if (registerTab) registerTab.addEventListener("click", function () { switchTab("register"); });

  // Sign In Action
  const signinBtn = $("#btn-do-signin");
  if (signinBtn) {
    signinBtn.addEventListener("click", async function () {
      const email = ($("#signin-email")?.value || "").trim();
      const password = ($("#signin-password")?.value || "").trim();
      if (!email || !password) {
        showToast("Please enter both university email and password.", true);
        return;
      }
      signinBtn.disabled = true;
      signinBtn.textContent = "Signing in...";
      const err = await signIn(email, password);
      signinBtn.disabled = false;
      signinBtn.textContent = "Sign in to Portal";
      if (err) {
        showToast(err, true);
      } else {
        const u = currentUser();
        location.href = (u && u.role === "admin") ? "admin.html" : "dashboard.html";
      }
    });
  }

  // Register Action
  const registerBtn = $("#btn-do-register");
  if (registerBtn) {
    registerBtn.addEventListener("click", async function () {
      const name = ($("#reg-fullname")?.value || "").trim();
      const indexNo = ($("#reg-index")?.value || "").trim();
      const intake = $("#reg-intake")?.value || "43";
      const facultyId = $("#reg-faculty")?.value || "1";
      const email = ($("#reg-email")?.value || "").trim();
      const password = ($("#reg-password")?.value || "").trim();

      if (!name || !indexNo || !email || !password) {
        showToast("All fields are required to register.", true);
        return;
      }

      registerBtn.disabled = true;
      registerBtn.textContent = "Verifying & Creating...";
      const err = await signUp(name, indexNo, email, password, facultyId, 1, intake);
      registerBtn.disabled = false;
      registerBtn.textContent = "Verify & Register Identity";
      if (err) {
        showToast(err, true);
      } else {
        showToast("Account registered! Directing to profile builder...");
        setTimeout(function () { location.href = "profile.html"; }, 500);
      }
    });
  }

  // Quick Demo Fill Handlers
  const quickCadet = $("#quick-login-cadet");
  if (quickCadet) {
    quickCadet.addEventListener("click", async function () {
      $("#signin-email").value = "bandara.nrhd@kdu.ac.lk";
      $("#signin-password").value = "demo123";
      await signIn("bandara.nrhd@kdu.ac.lk", "demo123");
      location.href = "dashboard.html";
    });
  }

  const quickOfficer = $("#quick-login-officer");
  if (quickOfficer) {
    quickOfficer.addEventListener("click", async function () {
      $("#signin-email").value = "nethmini.was@kdu.ac.lk";
      $("#signin-password").value = "demo123";
      await signIn("nethmini.was@kdu.ac.lk", "demo123");
      location.href = "dashboard.html";
    });
  }

  const quickAdmin = $("#quick-login-admin");
  if (quickAdmin) {
    quickAdmin.addEventListener("click", async function () {
      $("#signin-email").value = "admin@kdu.lk";
      $("#signin-password").value = "demo123";
      await signIn("admin@kdu.lk", "demo123");
      location.href = "admin.html";
    });
  }
}

// ---------- Page Controller: Profile Builder (profile.html) ----------

function initProfilePage() {
  const user = requireLogin();
  if (!user) return;

  const nameInput = $("#fullName");
  const indexInput = $("#indexNumber");
  const emailInput = $("#universityEmail");
  const facultySelect = $("#p-faculty");
  const deptSelect = $("#p-department");
  const intakeSelect = $("#p-intake");
  const yearSelect = $("#p-year");
  const bioInput = $("#bioInput");
  const moduleContainer = $("#moduleSelector");
  const availGrid = $("#avail-grid");
  const saveBtn = $("#btn-save-profile");
  const statusBadgeSpan = $("#studentTypePreview");

  if (nameInput) nameInput.value = user.name || "";
  if (indexInput) indexInput.value = user.indexNo || "";
  if (emailInput) emailInput.value = user.email || "";
  if (bioInput) bioInput.value = user.bio || "";

  function updateBadgePreview() {
    if (!statusBadgeSpan || !indexInput) return;
    const typeInfo = getStudentType(indexInput.value);
    statusBadgeSpan.className = "px-2.5 py-1 rounded text-xs font-semibold " + typeInfo.badgeClass;
    statusBadgeSpan.textContent = typeInfo.label + " (" + typeInfo.type + ")";
  }
  if (indexInput) {
    indexInput.addEventListener("input", updateBadgePreview);
    updateBadgePreview();
  }

  // Populate Intakes (39 to 44)
  if (intakeSelect) {
    intakeSelect.innerHTML = INTAKES.map(function (itk) {
      return '<option value="' + itk + '"' + (String(user.intake) === itk ? ' selected' : '') + '>Intake ' + itk + '</option>';
    }).join("");
  }

  // Populate Years
  if (yearSelect) {
    yearSelect.innerHTML = [1, 2, 3, 4].map(function (y) {
      return '<option value="' + y + '"' + (Number(user.year) === y ? ' selected' : '') + '>Year ' + y + '</option>';
    }).join("");
  }

  // Populate Faculties
  if (facultySelect) {
    facultySelect.innerHTML = KDU_CATALOG.map(function (f) {
      return '<option value="' + f.id + '"' + (Number(user.facultyId) === f.id ? ' selected' : '') + '>' + esc(f.name) + ' (' + f.code + ')</option>';
    }).join("");
  }

  function renderDepartments(facultyId, selectedDeptId) {
    if (!deptSelect) return;
    const fac = facultyById(facultyId);
    if (!fac) {
      deptSelect.innerHTML = '<option value="">Select faculty first…</option>';
      renderCourseModules(null);
      return;
    }
    deptSelect.innerHTML = fac.departments.map(function (d) {
      return '<option value="' + d.id + '"' + (Number(selectedDeptId) === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>';
    }).join("");
    renderCourseModules(Number(deptSelect.value));
  }

  function renderCourseModules(deptId) {
    if (!moduleContainer) return;
    const dept = deptById(deptId);
    if (!dept || !dept.courses || !dept.courses.length) {
      moduleContainer.innerHTML = '<p class="text-on-surface-variant text-sm col-span-full py-4">No course modules listed for this department.</p>';
      return;
    }

    const currentCourses = user.courses || [];
    moduleContainer.innerHTML = dept.courses.map(function (c) {
      const isSelected = currentCourses.includes(c.id);
      return '<button type="button" class="module-chip flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ' +
        (isSelected
          ? 'bg-surface-container text-primary border-primary shadow-sm'
          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-outline') + '" ' +
        'data-id="' + c.id + '" data-selected="' + isSelected + '">' +
        '<div class="flex flex-col min-w-0 pr-3">' +
          '<span class="font-mono text-xs font-bold truncate text-primary">' + esc(c.code) + '</span>' +
          '<span class="text-sm font-semibold text-on-surface leading-snug line-clamp-1">' + esc(c.title) + '</span>' +
          '<span class="text-[11px] text-on-surface-variant mt-0.5">Year ' + (c.year || 2) + ' Unit</span>' +
        '</div>' +
        '<span class="material-symbols-outlined text-[20px] ' + (isSelected ? 'text-primary' : 'text-outline-variant') + '">' +
          (isSelected ? 'check_circle' : 'add_circle') +
        '</span>' +
      '</button>';
    }).join("");
  }

  if (facultySelect) {
    facultySelect.addEventListener("change", function () {
      renderDepartments(Number(facultySelect.value), null);
    });
  }
  if (deptSelect) {
    deptSelect.addEventListener("change", function () {
      renderCourseModules(Number(deptSelect.value));
    });
  }

  // Initialize cascade
  const initFacId = user.facultyId || 1;
  const initDeptId = user.departmentId || 1;
  if (facultySelect) facultySelect.value = String(initFacId);
  renderDepartments(initFacId, initDeptId);

  // Module Click Toggle
  if (moduleContainer) {
    moduleContainer.addEventListener("click", function (e) {
      const chip = e.target.closest(".module-chip");
      if (!chip) return;
      const isCurrentlySelected = chip.getAttribute("data-selected") === "true";
      const nextState = !isCurrentlySelected;
      chip.setAttribute("data-selected", String(nextState));

      chip.classList.toggle("bg-surface-container", nextState);
      chip.classList.toggle("text-primary", nextState);
      chip.classList.toggle("border-primary", nextState);
      chip.classList.toggle("shadow-sm", nextState);

      chip.classList.toggle("bg-surface-container-lowest", !nextState);
      chip.classList.toggle("text-on-surface-variant", !nextState);
      chip.classList.toggle("border-outline-variant", !nextState);

      const icon = chip.querySelector(".material-symbols-outlined");
      if (icon) {
        icon.textContent = nextState ? "check_circle" : "add_circle";
        icon.classList.toggle("text-primary", nextState);
        icon.classList.toggle("text-outline-variant", !nextState);
      }
    });
  }

  // Weekly Availability Matrix
  if (availGrid) {
    const userAvail = user.availability || [];
    availGrid.innerHTML =
      '<div class="grid grid-cols-4 gap-2 text-center font-label-md text-xs font-semibold text-on-surface-variant pb-2 border-b border-outline-variant">' +
        '<div class="text-left font-bold text-primary">Day of Week</div>' +
        '<div>Morning<br><span class="text-[10px] font-normal">08:00 - 12:00</span></div>' +
        '<div>Afternoon<br><span class="text-[10px] font-normal">12:00 - 17:00</span></div>' +
        '<div>Evening<br><span class="text-[10px] font-normal">17:00 - 21:00</span></div>' +
      '</div>' +
      DAYS.map(function (d) {
        return '<div class="grid grid-cols-4 gap-2 items-center py-2.5 border-b border-outline-variant/40 hover:bg-surface-container-low/50 transition-colors">' +
          '<div class="font-label-md text-xs font-bold text-on-surface text-left pl-1">' + d.label + '</div>' +
          SLOTS.map(function (s) {
            const key = d.key + "-" + s.id;
            const checked = userAvail.includes(key);
            return '<div class="flex items-center justify-center">' +
              '<label class="cursor-pointer inline-flex items-center justify-center p-2 rounded-lg hover:bg-surface-container transition-colors">' +
                '<input type="checkbox" value="' + key + '" ' + (checked ? 'checked' : '') + ' class="avail-check w-5 h-5 accent-primary rounded cursor-pointer">' +
              '</label>' +
            '</div>';
          }).join("") +
        '</div>';
      }).join("");
  }

  // Save Profile Handler
  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      const selectedCourses = $$(".module-chip[data-selected='true']", moduleContainer)
        .map(function (el) { return Number(el.getAttribute("data-id")); });
      const selectedAvail = $$(".avail-check:checked", availGrid)
        .map(function (el) { return el.value; });

      const nameVal = nameInput ? nameInput.value.trim() : "";
      const indexVal = indexInput ? indexInput.value.trim().toUpperCase() : "";

      if (!nameVal || !indexVal) {
        showToast("Name and KDU Index Number are required.", true);
        return;
      }
      if (!indexVal.startsWith("D") && !indexVal.startsWith("C") && !indexVal.startsWith("STAFF")) {
        showToast("KDU Index must start with 'D' (Day Scholar) or 'C' (Officer Cadet).", true);
        return;
      }
      if (selectedCourses.length === 0) {
        showToast("Please select at least one course module.", true);
        return;
      }
      if (selectedAvail.length === 0) {
        showToast("Please mark at least one weekly free-time availability slot.", true);
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const err = await updateUserProfile(user.id, {
        name: nameVal,
        indexNo: indexVal,
        facultyId: Number(facultySelect?.value) || 1,
        departmentId: Number(deptSelect?.value) || 1,
        intake: intakeSelect?.value || "43",
        year: Number(yearSelect?.value) || 2,
        bio: bioInput?.value || "",
        courses: selectedCourses,
        availability: selectedAvail
      });

      saveBtn.disabled = false;
      saveBtn.textContent = "Save Academic Preferences";

      if (err) {
        showToast(err, true);
      } else {
        showToast("Profile & Study Preferences saved successfully!");
        setTimeout(function () { location.href = "dashboard.html"; }, 500);
      }
    });
  }
}

// ---------- Page Controller: Dashboard (dashboard.html) ----------

function initDashboardPage() {
  const user = requireLogin();
  if (!user) return;

  const typeInfo = getStudentType(user.indexNo);
  const fac = facultyById(user.facultyId);
  const dept = deptById(user.departmentId);

  // Top Greeting Area
  const greetingEl = $("#dash-greeting-name");
  if (greetingEl) {
    greetingEl.textContent = "Ayubowan, " + user.name;
  }
  const badgeEl = $("#dash-user-badge");
  if (badgeEl) {
    badgeEl.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold " + typeInfo.badgeClass;
    badgeEl.textContent = typeInfo.label;
  }
  const metaEl = $("#dash-user-meta");
  if (metaEl) {
    metaEl.innerHTML =
      '<span>Intake ' + (user.intake || "43") + '</span>' +
      '<span class="text-outline">•</span>' +
      '<span>' + esc(fac ? fac.name : "Faculty of Technology") + '</span>' +
      '<span class="text-outline">•</span>' +
      '<span class="font-mono text-primary font-semibold">Index: ' + esc(user.indexNo || "") + '</span>';
  }

  // Render KPIs
  function refreshKPIs() {
    const matches = computeMatches(user);
    const myGroups = db().groups.filter(function (g) { return g.members.includes(user.id); });
    const pendingReqs = db().requests.filter(function (r) {
      return (r.type === "partner" && r.to === user.id && r.status === "pending") ||
             (r.type === "group" && r.to === user.id && r.status === "pending");
    });

    const statPartners = $("#kpi-partners-count");
    if (statPartners) statPartners.textContent = String(matches.length);

    const statGroups = $("#kpi-groups-count");
    if (statGroups) statGroups.textContent = String(myGroups.length);

    const statModules = $("#kpi-modules-count");
    if (statModules) statModules.textContent = String((user.courses || []).length);

    const statRequests = $("#kpi-requests-count");
    if (statRequests) statRequests.textContent = String(pendingReqs.length);
  }

  // Render Peer Recommendations
  function renderPeerMatches(filterCourseCode) {
    const container = $("#match-cards-container");
    if (!container) return;

    let matches = computeMatches(user);
    if (filterCourseCode && filterCourseCode !== "all") {
      const targetCourse = allCourses().find(function (c) {
        return c.code.toLowerCase() === filterCourseCode.toLowerCase();
      });
      if (targetCourse) {
        matches = matches.filter(function (m) {
          return m.shared.includes(targetCourse.id);
        });
      }
    }

    if (!matches.length) {
      container.innerHTML =
        '<div class="col-span-full p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant">' +
          '<span class="material-symbols-outlined text-4xl text-outline-variant mb-2">person_search</span>' +
          '<h3 class="font-headline-sm text-primary font-bold">No Peer Matches Found</h3>' +
          '<p class="text-on-surface-variant text-sm mt-1 max-w-md mx-auto">No students currently match this filter. Complete more modules or adjust your free hours to increase compatibility.</p>' +
        '</div>';
      return;
    }

    container.innerHTML = matches.map(function (m) {
      const other = m.user;
      const oType = getStudentType(other.indexNo);
      const oDept = deptById(other.departmentId);
      const scorePct = Math.round(m.score * 100);

      const isPending = db().requests.some(function (r) {
        return r.type === "partner" && r.from === user.id && r.to === other.id && r.status === "pending";
      });

      // Modules shared chips
      const sharedChips = m.shared.map(function (cid) {
        const c = courseById(cid);
        return c ? '<span class="px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[11px] font-bold">' + esc(c.code) + '</span>' : '';
      }).join(" ");

      // Slot text
      const slotText = m.slots.length > 0
        ? m.slots.slice(0, 3).map(slotLabel).join(", ") + (m.slots.length > 3 ? " +" + (m.slots.length - 3) + " more" : "")
        : "No overlapping study blocks";

      return '<div class="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-md">' +
        '<div>' +
          '<div class="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/60">' +
            '<div class="flex items-center gap-3">' +
              avatarHtml(other.name, 44) +
              '<div class="flex flex-col">' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                  '<h3 class="font-headline-sm text-primary font-bold leading-tight">' + esc(other.name) + '</h3>' +
                  '<span class="text-[10px] px-1.5 py-0.5 rounded ' + oType.badgeClass + '">' + oType.type + '</span>' +
                '</div>' +
                '<span class="text-xs text-on-surface-variant mt-0.5">' + esc(oDept ? oDept.name : "Faculty of Technology") + ' · Intake ' + (other.intake || "43") + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="flex flex-col items-end shrink-0">' +
              '<span class="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary font-bold text-sm leading-none">' + scorePct + '%</span>' +
              '<span class="text-[10px] text-on-surface-variant uppercase font-medium mt-1">Match</span>' +
            '</div>' +
          '</div>' +

          '<div class="py-3.5 flex flex-col gap-2.5">' +
            '<div>' +
              '<span class="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">' +
                '<span class="material-symbols-outlined text-[15px] text-primary">auto_stories</span>' +
                'Shared Course Units (' + m.shared.length + '):' +
              '</span>' +
              '<div class="flex items-center gap-1.5 flex-wrap mt-1.5">' + sharedChips + '</div>' +
            '</div>' +
            '<div class="text-xs text-on-surface-variant flex items-start gap-1.5">' +
              '<span class="material-symbols-outlined text-[15px] text-secondary shrink-0 mt-0.5">schedule</span>' +
              '<span><strong>Overlapping Hours:</strong> ' + esc(slotText) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="flex items-center gap-2 pt-3 border-t border-outline-variant/60">' +
          '<button type="button" class="btn-inspect-cadet flex-1 h-9 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors" data-id="' + other.id + '">' +
            'View Profile' +
          '</button>' +
          (isPending
            ? '<button type="button" disabled class="flex-1 h-9 rounded-xl bg-surface-container text-on-surface-variant text-xs font-semibold cursor-not-allowed">Request Sent</button>'
            : '<button type="button" class="btn-send-study-req flex-1 h-9 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-colors flex items-center justify-center gap-1" data-id="' + other.id + '">' +
                '<span class="material-symbols-outlined text-[14px]">send</span> Connect' +
              '</button>') +
        '</div>' +
      '</div>';
    }).join("");
  }

  // Render Pending Requests
  function renderPendingRequests() {
    const incomingWrap = $("#incoming-requests-list");
    const outgoingWrap = $("#outgoing-requests-list");
    const allReqs = db().requests;

    const incoming = allReqs.filter(function (r) {
      return (r.type === "partner" && r.to === user.id && r.status === "pending") ||
             (r.type === "group" && r.to === user.id && r.status === "pending");
    });
    const outgoing = allReqs.filter(function (r) {
      return r.from === user.id && r.status === "pending";
    });

    if (incomingWrap) {
      incomingWrap.innerHTML = incoming.length
        ? incoming.map(function (r) {
            const sender = userById(r.from);
            const targetGroup = r.groupId ? groupById(r.groupId) : null;
            return '<div class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-between gap-3">' +
              '<div class="flex items-center gap-3">' +
                avatarHtml(sender ? sender.name : "Peer", 36) +
                '<div class="flex flex-col">' +
                  '<span class="text-sm font-bold text-primary">' + esc(sender ? sender.name : "Student") + '</span>' +
                  '<span class="text-xs text-on-surface-variant">' +
                    (r.type === "group" ? 'Requested to join ' + esc(targetGroup?.name || "group") : 'Invited you to pair for studies') +
                  '</span>' +
                '</div>' +
              '</div>' +
              '<div class="flex items-center gap-2">' +
                '<button type="button" class="btn-req-accept px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container" data-id="' + r.id + '">Accept</button>' +
                '<button type="button" class="btn-req-decline px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-xs font-semibold" data-id="' + r.id + '">Decline</button>' +
              '</div>' +
            '</div>';
          }).join("")
        : '<p class="text-sm text-on-surface-variant py-2">No pending incoming study requests.</p>';
    }

    if (outgoingWrap) {
      outgoingWrap.innerHTML = outgoing.length
        ? outgoing.map(function (r) {
            const receiver = userById(r.to);
            const targetGroup = r.groupId ? groupById(r.groupId) : null;
            return '<div class="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">' +
              '<div class="flex items-center gap-2">' +
                '<span class="material-symbols-outlined text-[16px] text-secondary">hourglass_top</span>' +
                '<span>Request to <strong>' + esc(r.type === "group" ? (targetGroup?.name || "Syndicate") : (receiver?.name || "Peer")) + '</strong></span>' +
              '</div>' +
              '<span class="px-2 py-0.5 rounded bg-surface-container font-mono text-[10px] uppercase font-bold text-on-surface-variant">Pending</span>' +
            '</div>';
          }).join("")
        : '<p class="text-sm text-on-surface-variant py-1">No pending invitations sent.</p>';
    }
  }

  // Render My Groups Preview
  function renderMyGroupsPreview() {
    const wrap = $("#my-groups-preview-list");
    if (!wrap) return;
    const myGroups = db().groups.filter(function (g) { return g.members.includes(user.id); });

    wrap.innerHTML = myGroups.length
      ? myGroups.map(function (g) {
          const course = courseById(g.course);
          return '<a href="group.html?id=' + g.id + '" class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant hover:border-primary/60 transition-colors flex items-center justify-between group">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center font-bold text-sm">' +
                '<span class="material-symbols-outlined text-[20px]">groups</span>' +
              '</div>' +
              '<div class="flex flex-col">' +
                '<span class="text-sm font-bold text-primary group-hover:text-primary-container leading-tight">' + esc(g.name) + '</span>' +
                '<span class="text-xs text-on-surface-variant">' + (course ? esc(course.code + ' · ' + course.title) : "General Study Syndicate") + '</span>' +
              '</div>' +
            '</div>' +
            '<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-transform group-hover:translate-x-0.5">chevron_right</span>' +
          '</a>';
        }).join("")
      : '<p class="text-sm text-on-surface-variant py-3">You have not joined any study syndicates yet. <a href="groups.html" class="text-primary font-semibold hover:underline">Explore groups</a>.</p>';
  }

  // Interactive Delegate Handlers
  document.addEventListener("click", async function (e) {
    // Send Study Request
    const btnSendReq = e.target.closest(".btn-send-study-req");
    if (btnSendReq) {
      const targetId = btnSendReq.getAttribute("data-id");
      const err = await sendPartnerRequest(user.id, targetId);
      if (err) {
        showToast(err, true);
      } else {
        showToast("Study invitation sent successfully!");
        refreshKPIs();
        renderPeerMatches();
        renderPendingRequests();
      }
      return;
    }

    // Inspect Cadet Profile Modal
    const btnInspect = e.target.closest(".btn-inspect-cadet");
    if (btnInspect) {
      const targetId = btnInspect.getAttribute("data-id");
      openCadetModal(targetId);
      return;
    }

    // Accept Request
    const btnAccept = e.target.closest(".btn-req-accept");
    if (btnAccept) {
      const reqId = btnAccept.getAttribute("data-id");
      const r = db().requests.find(function (x) { return x.id === reqId; });
      if (r) {
        const err = r.type === "partner" ? await acceptPartnerRequest(reqId) : await approveJoinRequest(reqId);
        if (err) showToast(err, true);
        else showToast("Request accepted!");
        refreshKPIs();
        renderPeerMatches();
        renderPendingRequests();
        renderMyGroupsPreview();
      }
      return;
    }

    // Decline Request
    const btnDecline = e.target.closest(".btn-req-decline");
    if (btnDecline) {
      const reqId = btnDecline.getAttribute("data-id");
      await setRequestStatus(reqId, "declined");
      showToast("Request declined.");
      refreshKPIs();
      renderPendingRequests();
      return;
    }
  });

  // Filter Chips on Dashboard
  const filterChips = $$(".dash-filter-chip");
  filterChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      filterChips.forEach(function (c) { c.classList.remove("bg-primary", "text-on-primary"); c.classList.add("bg-surface-container-low", "text-on-surface"); });
      chip.classList.add("bg-primary", "text-on-primary");
      chip.classList.remove("bg-surface-container-low", "text-on-surface");
      renderPeerMatches(chip.getAttribute("data-filter"));
    });
  });

  refreshKPIs();
  renderPeerMatches();
  renderPendingRequests();
  renderMyGroupsPreview();
}

// Modal Inspection Handler
function openCadetModal(userId) {
  const u = userById(userId);
  if (!u) return;
  const modal = $("#cadet-modal");
  if (!modal) return;

  const typeInfo = getStudentType(u.indexNo);
  const fac = facultyById(u.facultyId);
  const dept = deptById(u.departmentId);

  const titleEl = $("#modal-cadet-name");
  if (titleEl) titleEl.textContent = u.name;

  const badgeEl = $("#modal-cadet-badge");
  if (badgeEl) {
    badgeEl.className = "px-2.5 py-0.5 rounded text-xs font-bold " + typeInfo.badgeClass;
    badgeEl.textContent = typeInfo.label;
  }

  const metaEl = $("#modal-cadet-meta");
  if (metaEl) {
    metaEl.textContent = (fac ? fac.name : "") + " · " + (dept ? dept.name : "") + " · Intake " + (u.intake || "43");
  }

  const modulesEl = $("#modal-cadet-modules");
  if (modulesEl) {
    modulesEl.innerHTML = (u.courses || []).map(function (cid) {
      const c = courseById(cid);
      return c ? '<span class="px-2.5 py-1 rounded-lg bg-surface-container font-mono text-xs font-bold text-primary">' + esc(c.code + " " + c.title) + '</span>' : '';
    }).join("") || '<span class="text-sm text-on-surface-variant">No modules registered.</span>';
  }

  const availEl = $("#modal-cadet-avail");
  if (availEl) {
    availEl.innerHTML = (u.availability || []).map(function (s) {
      return '<span class="px-2.5 py-1 rounded-lg bg-surface-container-low text-xs text-on-surface-variant font-medium">' + esc(slotLabel(s)) + '</span>';
    }).join("") || '<span class="text-sm text-on-surface-variant">No free timeslots listed.</span>';
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeCadetModal() {
  const modal = $("#cadet-modal");
  if (modal) {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }
}

// ---------- Page Controller: Groups Directory (groups.html) ----------

let activeGroupTab = "all";

function initGroupsPage() {
  const user = requireLogin();
  if (!user) return;

  const container = $("#groups-list-container");
  const tabButtons = $$(".group-tab-btn");

  function renderGroupCards() {
    if (!container) return;
    const allGroups = db().groups;
    let filtered = allGroups;

    if (activeGroupTab === "my") {
      filtered = allGroups.filter(function (g) { return g.members.includes(user.id); });
    } else if (activeGroupTab === "suggested") {
      filtered = allGroups.filter(function (g) {
        return !g.members.includes(user.id) && g.course && (user.courses || []).includes(g.course);
      });
    }

    if (!filtered.length) {
      container.innerHTML =
        '<div class="col-span-full p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant">' +
          '<span class="material-symbols-outlined text-4xl text-outline-variant mb-2">groups</span>' +
          '<h3 class="font-headline-sm text-primary font-bold">No Study Syndicates Listed</h3>' +
          '<p class="text-on-surface-variant text-sm mt-1 max-w-md mx-auto">No study groups matched this tab. Create a new syndicate or explore other faculties.</p>' +
        '</div>';
      return;
    }

    container.innerHTML = filtered.map(function (g) {
      const course = courseById(g.course);
      const leader = userById(g.leader);
      const isMember = g.members.includes(user.id);
      const isLeader = g.leader === user.id;
      const isFull = g.members.length >= g.max_members;

      const isPending = db().requests.some(function (r) {
        return r.type === "group" && r.groupId === g.id && r.from === user.id && r.status === "pending";
      });

      return '<div class="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-md">' +
        '<div>' +
          '<div class="flex items-start justify-between gap-3 mb-2">' +
            '<div>' +
              '<span class="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ' + (course ? 'bg-surface-container text-primary' : 'bg-surface-container-low text-on-surface-variant') + '">' +
                (course ? esc(course.code) : "General Syndicate") +
              '</span>' +
              '<h3 class="font-headline-sm text-primary font-bold mt-1.5 leading-snug">' + esc(g.name) + '</h3>' +
            '</div>' +
            '<span class="px-2 py-0.5 rounded text-xs font-semibold shrink-0 ' + (isFull ? 'bg-error/15 text-error' : 'bg-tertiary/15 text-tertiary') + '">' +
              (isFull ? "Full" : "Open") +
            '</span>' +
          '</div>' +

          '<p class="text-xs text-on-surface-variant mb-4">' + (course ? esc(course.title) : "Interdisciplinary study group") + '</p>' +

          '<div class="p-3 rounded-xl bg-surface-container-low/70 mb-4 flex items-center justify-between text-xs">' +
            '<div class="flex items-center gap-2">' +
              avatarHtml(leader ? leader.name : "Cadet", 24) +
              '<span class="text-on-surface font-medium">' + esc(leader ? leader.name : "Group Leader") + '</span>' +
            '</div>' +
            '<span class="font-semibold text-primary">' + g.members.length + ' / ' + g.max_members + ' seats</span>' +
          '</div>' +
        '</div>' +

        '<div class="flex items-center gap-2 pt-3 border-t border-outline-variant/60">' +
          '<a href="group.html?id=' + g.id + '" class="flex-1 h-9 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors flex items-center justify-center gap-1">' +
            'View Group' +
          '</a>' +
          (isMember
            ? '<span class="px-3 py-1.5 rounded-xl bg-surface-container text-primary text-xs font-bold">' + (isLeader ? "Leader" : "Member") + '</span>'
            : (isPending
                ? '<button disabled class="flex-1 h-9 rounded-xl bg-surface-container text-on-surface-variant text-xs font-semibold cursor-not-allowed">Pending</button>'
                : (isFull
                    ? '<button disabled class="flex-1 h-9 rounded-xl bg-surface-container text-outline text-xs font-semibold cursor-not-allowed">Seats Full</button>'
                    : '<button type="button" class="btn-request-join flex-1 h-9 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-colors" data-id="' + g.id + '">Request to Join</button>'))) +
        '</div>' +
      '</div>';
    }).join("");
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabButtons.forEach(function (b) { b.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm"); b.classList.add("text-on-surface-variant"); });
      btn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm");
      btn.classList.remove("text-on-surface-variant");
      activeGroupTab = btn.getAttribute("data-tab");
      renderGroupCards();
    });
  });

  document.addEventListener("click", async function (e) {
    const btnJoin = e.target.closest(".btn-request-join");
    if (btnJoin) {
      const gId = btnJoin.getAttribute("data-id");
      const err = await requestToJoinGroup(user, gId);
      if (err) showToast(err, true);
      else {
        showToast("Join request sent to syndicate leader!");
        renderGroupCards();
      }
    }
  });

  // Create Group Modal Handlers
  const openModalBtn = $("#btn-open-create-group");
  const modal = $("#create-group-modal");
  const courseSelect = $("#new-group-course");
  const createSubmitBtn = $("#btn-submit-create-group");

  if (courseSelect) {
    courseSelect.innerHTML = '<option value="">General Study Syndicate (No Course Focus)</option>' +
      (user.courses || []).map(function (cid) {
        const c = courseById(cid);
        return c ? '<option value="' + c.id + '">' + esc(c.code + ' - ' + c.title) + '</option>' : '';
      }).join("");
  }

  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", function () {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });
  }

  if (createSubmitBtn) {
    createSubmitBtn.addEventListener("click", async function () {
      const name = ($("#new-group-name")?.value || "").trim();
      const courseId = $("#new-group-course")?.value || null;
      const maxMembers = $("#new-group-capacity")?.value || "6";

      if (!name) {
        showToast("Syndicate name is required.", true);
        return;
      }

      createSubmitBtn.disabled = true;
      const result = await createGroup(name, courseId, maxMembers, user.id);
      createSubmitBtn.disabled = false;

      if (typeof result === "string") {
        showToast(result, true);
      } else {
        showToast("Study syndicate created successfully!");
        if (modal) {
          modal.classList.remove("flex");
          modal.classList.add("hidden");
        }
        location.href = "group.html?id=" + result.id;
      }
    });
  }

  renderGroupCards();
}

// ---------- Page Controller: Group Detail & Realtime Chat (group.html) ----------

function initGroupDetailPage() {
  const user = requireLogin();
  if (!user) return;

  const params = new URLSearchParams(location.search);
  const groupId = params.get("id") || "grp-sdp2-syndicate-10";
  const group = groupById(groupId);

  if (!group) {
    showToast("Syndicate not found. Redirecting to directory...", true);
    setTimeout(function () { location.href = "groups.html"; }, 800);
    return;
  }

  const course = courseById(group.course);
  const isMember = group.members.includes(user.id);
  const isLeader = group.leader === user.id;

  // Header Details
  const titleEl = $("#group-title");
  if (titleEl) titleEl.textContent = group.name;

  const courseBadgeEl = $("#group-course-badge");
  if (courseBadgeEl) {
    courseBadgeEl.textContent = course ? course.code + " " + course.title : "General Study Syndicate";
  }

  const seatsEl = $("#group-seats-badge");
  if (seatsEl) {
    seatsEl.textContent = group.members.length + " / " + group.max_members + " Members";
  }

  // Render Member Roster
  function renderMembers() {
    const rosterEl = $("#group-members-list");
    if (!rosterEl) return;

    rosterEl.innerHTML = group.members.map(function (mid) {
      const mUser = userById(mid);
      if (!mUser) return "";
      const mType = getStudentType(mUser.indexNo);
      const isThisLeader = mid === group.leader;

      return '<div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant">' +
        '<div class="flex items-center gap-3">' +
          avatarHtml(mUser.name, 36) +
          '<div class="flex flex-col">' +
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-sm font-bold text-primary">' + esc(mUser.name) + '</span>' +
              (isThisLeader ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-on-secondary uppercase">Leader</span>' : '') +
            '</div>' +
            '<span class="text-xs text-on-surface-variant font-mono">' + esc(mUser.indexNo || "") + ' · Intake ' + (mUser.intake || "43") + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="text-[10px] px-2 py-0.5 rounded ' + mType.badgeClass + '">' + mType.type + '</span>' +
      '</div>';
    }).join("");
  }

  // Render Realtime Messages
  function renderChat() {
    const container = $("#chat-messages-container");
    if (!container) return;

    const msgs = db().messages[groupId] || [];
    if (!msgs.length) {
      container.innerHTML = '<p class="text-center text-on-surface-variant text-sm py-8">No messages yet. Send a message to start collaboration.</p>';
      return;
    }

    container.innerHTML = msgs.map(function (m) {
      const isMine = m.sender === user.id;
      const sender = userById(m.sender);
      const sType = getStudentType(sender?.indexNo);

      return '<div class="flex flex-col ' + (isMine ? 'items-end' : 'items-start') + ' mb-3">' +
        '<div class="flex items-center gap-2 mb-1 px-1">' +
          '<span class="text-xs font-bold ' + (isMine ? 'text-primary' : 'text-on-surface') + '">' +
            (isMine ? 'You' : esc(sender ? sender.name : "Cadet")) +
          '</span>' +
          '<span class="text-[10px] px-1.5 py-0.2 rounded ' + sType.badgeClass + '">' + sType.type + '</span>' +
          '<span class="text-[10px] text-on-surface-variant">' + formatTime(m.at) + '</span>' +
        '</div>' +
        '<div class="px-4 py-2.5 rounded-2xl max-w-lg text-sm ' +
          (isMine
            ? 'bg-primary text-on-primary rounded-tr-none shadow-sm'
            : 'bg-surface-container text-on-surface rounded-tl-none border border-outline-variant') + '">' +
          esc(m.text) +
        '</div>' +
      '</div>';
    }).join("");

    container.scrollTop = container.scrollHeight;
  }

  // Send Message Action
  const chatForm = $("#chat-form");
  const chatInput = $("#chat-input");
  if (chatForm && chatInput) {
    if (!isMember) {
      chatInput.disabled = true;
      chatInput.placeholder = "Join this syndicate to send messages.";
      const submitBtn = chatForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;
    }

    chatForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text || !isMember) return;

      chatInput.value = "";
      await sendMessage(groupId, user.id, text);
      renderChat();
    });
  }

  // Render Scheduled Sessions
  function renderSessions() {
    const sessionsList = $("#group-sessions-list");
    if (!sessionsList) return;

    const groupSessions = db().sessions.filter(function (s) { return s.groupId === groupId; });
    sessionsList.innerHTML = groupSessions.length
      ? groupSessions.map(function (s) {
          return '<div class="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-between">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center font-bold text-xs">' +
                '<span class="material-symbols-outlined text-[18px]">calendar_today</span>' +
              '</div>' +
              '<div class="flex flex-col">' +
                '<span class="text-sm font-bold text-primary">' + esc(s.title) + '</span>' +
                '<span class="text-xs text-on-surface-variant font-medium">' + esc(dayLabel(s.day)) + ' at ' + esc(s.time) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join("")
      : '<p class="text-xs text-on-surface-variant py-2">No study sessions currently scheduled.</p>';
  }

  // Schedule Session Action
  const scheduleForm = $("#schedule-session-form");
  if (scheduleForm) {
    if (!isMember) scheduleForm.style.display = "none";
    scheduleForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const title = ($("#new-session-title")?.value || "").trim();
      const day = $("#new-session-day")?.value || "Wed";
      const time = $("#new-session-time")?.value || "14:00";

      if (!title) {
        showToast("Please provide a session topic.", true);
        return;
      }

      await addStudySession(groupId, title, day, time);
      showToast("Study session scheduled successfully!");
      if ($("#new-session-title")) $("#new-session-title").value = "";
      renderSessions();
    });
  }

  // Join Requests for Leader / Admin
  const leaderReqsCard = $("#leader-requests-card");
  const leaderReqsList = $("#leader-requests-list");
  if (leaderReqsCard && leaderReqsList) {
    if (isLeader || user.role === "admin") {
      leaderReqsCard.classList.remove("hidden");
      const pendingJoinReqs = db().requests.filter(function (r) {
        return r.type === "group" && r.groupId === groupId && r.status === "pending";
      });

      leaderReqsList.innerHTML = pendingJoinReqs.length
        ? pendingJoinReqs.map(function (r) {
            const sender = userById(r.from);
            return '<div class="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-between gap-3">' +
              '<div class="flex items-center gap-2">' +
                avatarHtml(sender ? sender.name : "Cadet", 32) +
                '<div class="flex flex-col">' +
                  '<span class="text-xs font-bold text-primary">' + esc(sender ? sender.name : "Applicant") + '</span>' +
                  '<span class="text-[11px] text-on-surface-variant font-mono">' + esc(sender ? sender.indexNo : "") + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="flex items-center gap-1.5">' +
                '<button type="button" class="btn-group-approve px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold" data-id="' + r.id + '">Approve</button>' +
                '<button type="button" class="btn-group-reject px-2.5 py-1 rounded-lg border border-outline-variant text-xs font-semibold" data-id="' + r.id + '">Reject</button>' +
              '</div>' +
            '</div>';
          }).join("")
        : '<p class="text-xs text-on-surface-variant py-1">No pending join requests.</p>';
    } else {
      leaderReqsCard.classList.add("hidden");
    }
  }

  document.addEventListener("click", async function (e) {
    const btnApprove = e.target.closest(".btn-group-approve");
    if (btnApprove) {
      const rId = btnApprove.getAttribute("data-id");
      const err = await approveJoinRequest(rId);
      if (err) showToast(err, true);
      else {
        showToast("Cadet approved into syndicate!");
        renderMembers();
        initGroupDetailPage();
      }
      return;
    }
    const btnReject = e.target.closest(".btn-group-reject");
    if (btnReject) {
      const rId = btnReject.getAttribute("data-id");
      await setRequestStatus(rId, "rejected");
      showToast("Join request rejected.");
      initGroupDetailPage();
      return;
    }
  });

  // Realtime subscription
  subscribeToMessages(groupId, function () {
    renderChat();
  });

  renderMembers();
  renderChat();
  renderSessions();
}

// ---------- Page Controller: Admin Moderation (admin.html) ----------

function initAdminPage() {
  const user = requireAdmin();
  if (!user) return;

  function refreshAdmin() {
    const d = db();
    const students = d.users.filter(function (u) { return u.role !== "admin"; });
    const messageCount = Object.keys(d.messages).reduce(function (sum, k) {
      return sum + d.messages[k].length;
    }, 0);
    const pendingReqs = d.requests.filter(function (r) { return r.status === "pending"; });

    // KPIs
    if ($("#admin-stat-students")) $("#admin-stat-students").textContent = String(students.length);
    if ($("#admin-stat-groups")) $("#admin-stat-groups").textContent = String(d.groups.length);
    if ($("#admin-stat-messages")) $("#admin-stat-messages").textContent = String(messageCount);
    if ($("#admin-stat-pending")) $("#admin-stat-pending").textContent = String(pendingReqs.length);

    // Requests Moderation Table
    const reqBody = $("#admin-requests-table-body");
    if (reqBody) {
      reqBody.innerHTML = pendingReqs.length
        ? pendingReqs.map(function (r) {
            const sender = userById(r.from);
            const targetGroup = r.groupId ? groupById(r.groupId) : null;
            const targetUser = r.to ? userById(r.to) : null;
            const targetDesc = r.type === "group" ? ("Syndicate: " + (targetGroup?.name || "Deleted")) : ("Peer: " + (targetUser?.name || "Peer"));

            return '<tr class="border-b border-outline-variant/50 hover:bg-surface-container-low/50">' +
              '<td class="py-3 px-4 text-xs font-bold text-primary">' + esc(sender ? sender.name : "Cadet") + '<br><span class="font-mono text-[10px] text-on-surface-variant">' + esc(sender ? sender.indexNo : "") + '</span></td>' +
              '<td class="py-3 px-4 text-xs font-medium">' + esc(targetDesc) + '</td>' +
              '<td class="py-3 px-4 text-xs"><span class="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-bold uppercase text-[10px]">Pending</span></td>' +
              '<td class="py-3 px-4 text-xs">' +
                '<div class="flex items-center gap-1.5">' +
                  '<button type="button" class="btn-admin-approve px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold" data-id="' + r.id + '">Approve</button>' +
                  '<button type="button" class="btn-admin-reject px-2.5 py-1 rounded-lg border border-outline-variant text-xs font-semibold" data-id="' + r.id + '">Reject</button>' +
                '</div>' +
              '</td>' +
            '</tr>';
          }).join("")
        : '<tr><td colspan="4" class="py-6 text-center text-xs text-on-surface-variant">No pending moderation requests in queue.</td></tr>';
    }

    // Registered Students Table
    const usersBody = $("#admin-users-table-body");
    if (usersBody) {
      usersBody.innerHTML = students.map(function (u) {
        const type = getStudentType(u.indexNo);
        const fac = facultyById(u.facultyId);
        const dept = deptById(u.departmentId);
        const isComplete = profileComplete(u);

        return '<tr class="border-b border-outline-variant/50 hover:bg-surface-container-low/50">' +
          '<td class="py-3 px-4 text-xs font-bold text-on-surface">' + esc(u.name) + '</td>' +
          '<td class="py-3 px-4 text-xs font-mono font-semibold">' + esc(u.indexNo || "—") + '</td>' +
          '<td class="py-3 px-4 text-xs"><span class="px-2 py-0.5 rounded text-[10px] ' + type.badgeClass + '">' + type.type + '</span></td>' +
          '<td class="py-3 px-4 text-xs text-on-surface-variant">' + esc(fac ? fac.code : "FOT") + ' · ' + esc(dept ? dept.code : "BST") + '</td>' +
          '<td class="py-3 px-4 text-xs font-mono">' + (u.intake || "43") + '</td>' +
          '<td class="py-3 px-4 text-xs"><span class="px-2 py-0.5 rounded text-[10px] font-bold ' + (isComplete ? 'bg-tertiary/15 text-tertiary' : 'bg-secondary/15 text-secondary') + '">' + (isComplete ? "Complete" : "Incomplete") + '</span></td>' +
        '</tr>';
      }).join("");
    }

    // Groups Management Table
    const groupsBody = $("#admin-groups-table-body");
    if (groupsBody) {
      groupsBody.innerHTML = d.groups.map(function (g) {
        const course = courseById(g.course);
        return '<tr class="border-b border-outline-variant/50 hover:bg-surface-container-low/50">' +
          '<td class="py-3 px-4 text-xs font-bold text-primary">' + esc(g.name) + '</td>' +
          '<td class="py-3 px-4 text-xs font-mono">' + (course ? esc(course.code) : "General") + '</td>' +
          '<td class="py-3 px-4 text-xs">' + g.members.length + ' / ' + g.max_members + '</td>' +
          '<td class="py-3 px-4 text-xs"><span class="px-2 py-0.5 rounded text-[10px] font-bold ' + (g.is_open ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error') + '">' + (g.is_open ? "Open" : "Closed") + '</span></td>' +
          '<td class="py-3 px-4 text-xs">' +
            '<button type="button" class="btn-admin-toggle-group px-2.5 py-1 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container" data-id="' + g.id + '">' +
              (g.is_open ? "Close Syndicate" : "Reopen") +
            '</button>' +
          '</td>' +
        '</tr>';
      }).join("");
    }
  }

  document.addEventListener("click", async function (e) {
    const btnApp = e.target.closest(".btn-admin-approve");
    if (btnApp) {
      const rId = btnApp.getAttribute("data-id");
      const r = db().requests.find(function (x) { return x.id === rId; });
      if (r) {
        const err = r.type === "partner" ? await acceptPartnerRequest(rId) : await approveJoinRequest(rId);
        if (err) showToast(err, true);
        else showToast("Request approved by academic moderator.");
        refreshAdmin();
      }
      return;
    }

    const btnRej = e.target.closest(".btn-admin-reject");
    if (btnRej) {
      const rId = btnRej.getAttribute("data-id");
      await setRequestStatus(rId, "rejected");
      showToast("Request rejected.");
      refreshAdmin();
      return;
    }

    const btnToggle = e.target.closest(".btn-admin-toggle-group");
    if (btnToggle) {
      const gId = btnToggle.getAttribute("data-id");
      const g = groupById(gId);
      if (g) {
        await setGroupOpenStatus(gId, !g.is_open);
        showToast("Syndicate status updated.");
        refreshAdmin();
      }
      return;
    }
  });

  refreshAdmin();
}

// ---------- DOM Content Loaded Router ----------

document.addEventListener("DOMContentLoaded", async function () {
  await initBackend();

  // Determine active page
  const page = document.body.getAttribute("data-page") ||
    (location.pathname.includes("profile") ? "profile" :
    location.pathname.includes("dashboard") ? "dashboard" :
    location.pathname.includes("groups") ? "groups" :
    location.pathname.includes("group") ? "group" :
    location.pathname.includes("admin") ? "admin" : "auth");

  // Render unified header on all pages except index/auth
  if (page !== "auth") {
    renderHeader(page);
  }

  if (page === "auth") initAuthPage();
  else if (page === "profile") initProfilePage();
  else if (page === "dashboard") initDashboardPage();
  else if (page === "groups") initGroupsPage();
  else if (page === "group") initGroupDetailPage();
  else if (page === "admin") initAdminPage();
});