// js/backend.js
// KDU Study Group Finder (KDU StudyConnect) - Data & State Layer
// General Sir John Kotelawala Defence University
// Perspective: Faculty of Technology (FOT) - BTech (Hons) in ICT - Intake 43
//
// Dual-Mode Architecture:
// 1. Supabase Mode: If config.js has live keys, syncs with Supabase Postgres + Auth + Realtime.
// 2. Local Demo Mode: If unconfigured, activates a full in-memory/localStorage engine
//    pre-seeded with authentic KDU Technology Faculty ICT Intake 43 cadets & day scholars.

const DAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" }
];

const SLOTS = [
  { id: 1, label: "Morning (08:00 - 12:00)", hours: 4 },
  { id: 2, label: "Afternoon (12:00 - 17:00)", hours: 5 },
  { id: 3, label: "Evening (17:00 - 21:00)", hours: 4 }
];

const SLOT_NAMES = { 1: "Morning", 2: "Afternoon", 3: "Evening" };

const INTAKES = ["39", "40", "41", "42", "43", "44"];

// Institutional KDU Academic Catalog (All faculties, departments, and authentic course codes)
const KDU_CATALOG = [
  {
    id: 1,
    name: "Faculty of Technology",
    code: "FOT",
    departments: [
      {
        id: 1,
        name: "Department of Biosystems Technology",
        code: "BST",
        programme: "BTech (Hons) in ICT / BBST (Hons) Applied Biotech",
        courses: [
          { id: 101, code: "ITIC1282", title: "Skill Development Project II (SDP II)", year: 2 },
          { id: 102, code: "ITIC1242", title: "Data Structures & Algorithms", year: 2 },
          { id: 103, code: "ITIC1260", title: "Database Management Systems", year: 2 },
          { id: 104, code: "ITIC1212", title: "Object Oriented Programming (Java)", year: 2 },
          { id: 105, code: "ITIC1232", title: "Computer Networks & Data Comm", year: 2 },
          { id: 106, code: "ITIC1252", title: "Web Technologies & Applications", year: 2 },
          { id: 107, code: "ITIC1272", title: "Operating Systems & Linux Admin", year: 2 },
          { id: 108, code: "ITIC1222", title: "Discrete Mathematics & Probability", year: 2 },
          { id: 109, code: "ITIC2113", title: "Software Engineering Principles", year: 2 },
          { id: 110, code: "ITIC2123", title: "Mobile Application Development", year: 2 },
          { id: 111, code: "DL1012", title: "Military Studies & Leadership", year: 2 },
          { id: 112, code: "EN1022", title: "Professional English for Technology", year: 2 },
          { id: 113, code: "BST1113", title: "Cell Biology & Genetics", year: 1 },
          { id: 114, code: "BST1122", title: "Biochemistry & Biomolecules", year: 1 },
          { id: 115, code: "BST1223", title: "Bioinformatics & Computational Biology", year: 2 }
        ]
      },
      {
        id: 2,
        name: "Department of Engineering Technology",
        code: "ET",
        programme: "BET (Hons) Biomedical / Construction / Building Services",
        courses: [
          { id: 201, code: "BET1113", title: "Engineering Mathematics I", year: 1 },
          { id: 202, code: "BET1123", title: "Fundamentals of Electronics", year: 1 },
          { id: 203, code: "BET1213", title: "Biomedical Instrumentation I", year: 2 },
          { id: 204, code: "CET1113", title: "Civil Engineering Materials", year: 1 },
          { id: 205, code: "CET1123", title: "Surveying & Levelling", year: 1 },
          { id: 206, code: "CET1213", title: "Structural Mechanics", year: 2 },
          { id: 207, code: "BST1123", title: "HVAC Systems & Design", year: 2 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Faculty of Computing",
    code: "FOC",
    departments: [
      {
        id: 3,
        name: "Department of Computer Science",
        code: "CS",
        programme: "BSc (Hons) Computer Science / Computer Engineering",
        courses: [
          { id: 301, code: "CS1013", title: "Principles of Programming", year: 1 },
          { id: 302, code: "CS1023", title: "Computer Systems Architecture", year: 1 },
          { id: 303, code: "CS2013", title: "Advanced Object Oriented Programming", year: 2 },
          { id: 304, code: "CS2023", title: "Data Structures & Algorithms", year: 2 },
          { id: 305, code: "CS2033", title: "Relational Database Theory", year: 2 },
          { id: 306, code: "CS2043", title: "Computer Networks & Security", year: 2 },
          { id: 307, code: "CE1013", title: "Digital Logic Design", year: 1 },
          { id: 308, code: "CE1023", title: "Embedded Systems & Microcontrollers", year: 2 }
        ]
      },
      {
        id: 4,
        name: "Department of Software Engineering",
        code: "SE",
        programme: "BSc (Hons) Software Engineering",
        courses: [
          { id: 401, code: "SE1013", title: "Software Requirements Engineering", year: 1 },
          { id: 402, code: "SE1023", title: "Software Architecture & Design Patterns", year: 2 },
          { id: 403, code: "SE2013", title: "Software Quality Assurance & Testing", year: 2 },
          { id: 404, code: "SE2023", title: "Agile Development & DevOps", year: 2 }
        ]
      },
      {
        id: 5,
        name: "Department of Information Technology",
        code: "IT",
        programme: "BSc (Hons) IT / Data Science & Business Analytics",
        courses: [
          { id: 501, code: "IT1013", title: "Fundamentals of Information Systems", year: 1 },
          { id: 502, code: "IT1023", title: "Web Application Development", year: 1 },
          { id: 503, code: "DS1013", title: "Foundations of Data Science & Python", year: 1 },
          { id: 504, code: "DS2013", title: "Machine Learning Algorithms", year: 2 }
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Faculty of Engineering",
    code: "FOE",
    departments: [
      {
        id: 6,
        name: "Department of Electrical & Telecommunication",
        code: "EE",
        programme: "BSc (Hons) Electrical & Electronic / Telecommunication Eng",
        courses: [
          { id: 601, code: "EE1013", title: "Circuit Theory & Analysis", year: 1 },
          { id: 602, code: "EE1023", title: "Analog Electronic Circuits", year: 1 },
          { id: 603, code: "TE1013", title: "Electromagnetic Waves & Propagation", year: 2 },
          { id: 604, code: "TE2013", title: "Digital Communication Engineering", year: 2 }
        ]
      },
      {
        id: 7,
        name: "Department of Mechanical Engineering",
        code: "ME",
        programme: "BSc (Hons) Mechanical / Mechatronics / Aeronautical Eng",
        courses: [
          { id: 701, code: "ME1013", title: "Engineering Thermodynamics", year: 1 },
          { id: 702, code: "ME1023", title: "Fluid Mechanics", year: 1 },
          { id: 703, code: "MC1013", title: "Sensors & Actuators in Mechatronics", year: 2 },
          { id: 704, code: "AE1013", title: "Aircraft Aerodynamics & Flight Principles", year: 2 }
        ]
      },
      {
        id: 8,
        name: "Department of Civil Engineering",
        code: "CV",
        programme: "BSc (Hons) Civil Engineering",
        courses: [
          { id: 801, code: "CV1013", title: "Engineering Geology", year: 1 },
          { id: 802, code: "CV2013", title: "Mechanics of Fluids & Hydraulics", year: 2 },
          { id: 803, code: "CV2023", title: "Structural Analysis I", year: 2 }
        ]
      }
    ]
  },
  {
    id: 4,
    name: "Faculty of Management, Social Sciences & Humanities",
    code: "FMSH",
    departments: [
      {
        id: 9,
        name: "Department of Management & Finance",
        code: "MF",
        programme: "BSc Logistics Management / Management & Technical Sciences",
        courses: [
          { id: 901, code: "LM1013", title: "Principles of Supply Chain Management", year: 1 },
          { id: 902, code: "LM1023", title: "Freight Forwarding & Shipping Operations", year: 2 },
          { id: 903, code: "MS1013", title: "Operations Research & Optimization", year: 2 }
        ]
      }
    ]
  },
  {
    id: 5,
    name: "Faculty of Allied Health Sciences",
    code: "FAHS",
    departments: [
      {
        id: 10,
        name: "Department of Nursing & Midwifery",
        code: "NUR",
        programme: "BSc (Hons) Nursing",
        courses: [
          { id: 1001, code: "NR1013", title: "Principles of Nursing Practice", year: 1 },
          { id: 1002, code: "NR1023", title: "Human Anatomy & Physiology", year: 1 }
        ]
      },
      {
        id: 11,
        name: "Department of Medical Laboratory Sciences",
        code: "MLS",
        programme: "BSc (Hons) Medical Laboratory Sciences",
        courses: [
          { id: 1101, code: "ML1013", title: "Clinical Biochemistry", year: 1 },
          { id: 1102, code: "ML1023", title: "Medical Microbiology & Virology", year: 2 }
        ]
      }
    ]
  },
  {
    id: 6,
    name: "Faculty of Law",
    code: "FOL",
    departments: [
      {
        id: 12,
        name: "Department of Law",
        code: "LAW",
        programme: "Bachelor of Laws (LLB)",
        courses: [
          { id: 1201, code: "LW1013", title: "Legal System of Sri Lanka", year: 1 },
          { id: 1202, code: "LW1023", title: "Law of Contracts", year: 1 },
          { id: 1203, code: "LW2013", title: "Criminal Law & Procedure", year: 2 }
        ]
      }
    ]
  }
];

// Student Categorization Rule:
// Index starting with 'C' = Officer Cadet
// Index starting with 'D' = Day Scholar
function getStudentType(indexNo) {
  if (!indexNo) return { type: "Student", label: "Undergraduate", isCadet: false, badgeClass: "bg-surface-container text-on-surface-variant" };
  const raw = String(indexNo).trim().toUpperCase();
  if (raw.startsWith("STAFF") || raw.startsWith("ADMIN")) {
    return { type: "Staff", label: "Staff Officer / Dean", isCadet: false, badgeClass: "bg-secondary text-on-secondary" };
  }
  if (raw.startsWith("C")) {
    return { type: "Cadet", label: "Officer Cadet", isCadet: true, badgeClass: "bg-primary-container text-on-primary" };
  }
  return { type: "Day Scholar", label: "Day Scholar", isCadet: false, badgeClass: "bg-surface-container-high text-primary-container font-semibold" };
}

// Initial Seed Database (Authentic KDU Technology Faculty ICT Intake 43)
function getInitialSeedState() {
  return {
    faculties: KDU_CATALOG,
    users: [
      {
        id: "usr-perera",
        name: "M.A.C.L. Perera",
        email: "perera.macl@kdu.ac.lk",
        indexNo: "D/ICT/26/0010",
        role: "student",
        facultyId: 1, // Faculty of Technology
        departmentId: 1, // Department of Biosystems Technology
        intake: "43",
        year: 2,
        bio: "BT (Hons) in ICT, Intake 43 (Group 10). Lead system architecture & algorithm implementation.",
        courses: [101, 102, 103, 104, 106], // ITIC1282, ITIC1242, ITIC1260, ITIC1212, ITIC1252
        availability: ["Mon-3", "Wed-2", "Fri-3", "Sat-1"]
      },
      {
        id: "usr-nethmini",
        name: "W.A.S. Nethmini",
        email: "nethmini.was@kdu.ac.lk",
        indexNo: "D/ICT/26/0028",
        role: "student",
        facultyId: 1,
        departmentId: 1,
        intake: "43",
        year: 2,
        bio: "BT (Hons) in ICT, Intake 43 (Group 10). Focus on relational database schema and discrete mathematics.",
        courses: [101, 102, 103, 106, 108], // ITIC1282, ITIC1242, ITIC1260, ITIC1252, ITIC1222
        availability: ["Mon-3", "Wed-2", "Sat-1"]
      },
      {
        id: "usr-bandara",
        name: "N.R.H.D. Bandara",
        email: "bandara.nrhd@kdu.ac.lk",
        indexNo: "D/ICT/26/0042",
        role: "student",
        facultyId: 1,
        departmentId: 1,
        intake: "43",
        year: 2,
        bio: "BT (Hons) in ICT, Intake 43 (Group 10). Specializing in computer networking and system administration.",
        courses: [101, 102, 104, 105, 107], // ITIC1282, ITIC1242, ITIC1212, ITIC1232, ITIC1272
        availability: ["Mon-3", "Tue-2", "Wed-2"]
      },
      {
        id: "usr-dahanayaka",
        name: "D.G.K.N. Dahanayaka",
        email: "dahanayaka.dgkn@kdu.ac.lk",
        indexNo: "D/ICT/26/0059",
        role: "student",
        facultyId: 1,
        departmentId: 1,
        intake: "43",
        year: 2,
        bio: "BT (Hons) in ICT, Intake 43 (Group 10). Mobile application development and software engineering.",
        courses: [101, 103, 105, 106, 110], // ITIC1282, ITIC1260, ITIC1232, ITIC1252, ITIC2123
        availability: ["Wed-2", "Fri-3", "Sun-2"]
      },
      {
        id: "usr-nemanthi",
        name: "K.V.H. Nemanthi",
        email: "nemanthi.kvh@kdu.ac.lk",
        indexNo: "D/ICT/26/0062",
        role: "student",
        facultyId: 1,
        departmentId: 1,
        intake: "43",
        year: 2,
        bio: "BT (Hons) in ICT, Intake 43 (Group 10). UI/UX design, web architecture, and cloud platforms.",
        courses: [101, 102, 103, 109, 110], // ITIC1282, ITIC1242, ITIC1260, ITIC2113, ITIC2123
        availability: ["Tue-2", "Wed-2", "Fri-3"]
      },
      {
        id: "usr-kasun",
        name: "Cadet Kasun Mendis",
        email: "kasun@kdu.ac.lk",
        indexNo: "C/ICT/26/0045",
        role: "student",
        facultyId: 1,
        departmentId: 1,
        intake: "43",
        year: 2,
        bio: "Officer Cadet, Intake 43. Algorithms & data structures peer study tutor.",
        courses: [101, 102, 103, 104, 111], // ITIC1282, ITIC1242, ITIC1260, ITIC1212, DL1012
        availability: ["Mon-3", "Wed-2", "Thu-2"]
      },
      {
        id: "usr-admin",
        name: "Maj. S. Jayawardena",
        email: "admin@kdu.lk",
        indexNo: "STAFF/FOT/01",
        role: "admin",
        facultyId: 1,
        departmentId: 1,
        intake: "43",
        year: 4,
        bio: "Academic Coordinator & Moderation Officer, Faculty of Technology.",
        courses: [],
        availability: []
      }
    ],
    groups: [
      {
        id: "grp-sdp2-group-10",
        name: "SDP II Group 10: StudyConnect Syndicate",
        course: 101, // ITIC1282
        leader: "usr-bandara",
        max_members: 6,
        is_open: true,
        members: ["usr-bandara", "usr-perera", "usr-nethmini", "usr-dahanayaka", "usr-nemanthi"]
      },
      {
        id: "grp-algomasters-ds",
        name: "AlgoMasters: ITIC1242 Syndicate",
        course: 102, // ITIC1242
        leader: "usr-kasun",
        max_members: 5,
        is_open: true,
        members: ["usr-kasun", "usr-nethmini"]
      },
      {
        id: "grp-dbms-study",
        name: "DBMS Query Optimization Circle",
        course: 103, // ITIC1260
        leader: "usr-nethmini",
        max_members: 4,
        is_open: true,
        members: ["usr-nethmini", "usr-dahanayaka"]
      }
    ],
    messages: {
      "grp-sdp2-group-10": [
        {
          id: 1,
          sender: "usr-bandara",
          text: "Ayubowan team! As syndicate leader for Group 10, our SDP II repository and matching portal are configured.",
          at: Date.now() - 3600000 * 5
        },
        {
          id: 2,
          sender: "usr-perera",
          text: "Ayubowan Bandara! I tested the 60/40 algorithm and RLS security model. Everything is working smoothly.",
          at: Date.now() - 3600000 * 3
        },
        {
          id: 3,
          sender: "usr-nethmini",
          text: "Great work team. Let's run our scheduled mock evaluation this Wednesday.",
          at: Date.now() - 3600000 * 2
        }
      ],
      "grp-algomasters-ds": [
        {
          id: 4,
          sender: "usr-kasun",
          text: "Attention team: Whiteboard revision session on AVL Trees scheduled for Wednesday.",
          at: Date.now() - 3600000 * 2
        }
      ]
    },
    sessions: [
      {
        id: "ses-1",
        groupId: "grp-sdp2-group-10",
        title: "SDP II Architecture & Viva Mock",
        day: "Wed",
        time: "14:30"
      },
      {
        id: "ses-2",
        groupId: "grp-algomasters-ds",
        title: "AVL Trees & Balanced Trees Whiteboard",
        day: "Wed",
        time: "16:00"
      }
    ],
    requests: [
      {
        id: "req-1",
        type: "group",
        from: "usr-kasun",
        to: "usr-bandara",
        groupId: "grp-sdp2-group-10",
        status: "pending"
      }
    ],
    authUser: null
  };
}

const STORAGE_KEY = "kdu_studyconnect_state_v6";

let state = null;
let sbClient = null;

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        parsed.faculties = KDU_CATALOG; // ensure latest catalog is always active
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Storage load warning:", e);
  }
  const fresh = getInitialSeedState();
  saveStateToStorage(fresh);
  return fresh;
}

function saveStateToStorage(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s || state));
  } catch (e) {
    console.warn("Storage save warning:", e);
  }
}

// Initialize Supabase client if configured
if (typeof isSupabaseConfigured === "function" && isSupabaseConfigured() && typeof supabase !== "undefined") {
  try {
    sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn("Supabase client init error, defaulting to local demo:", err);
  }
}

async function initBackend() {
  state = loadStateFromStorage();

  if (sbClient) {
    try {
      const { data: { session } } = await sbClient.auth.getSession();
      if (session && session.user) {
        let user = userById(session.user.id) || userByEmail(session.user.email);
        if (!user) {
          user = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email.split("@")[0],
            email: session.user.email,
            indexNo: session.user.user_metadata?.index_no || "D/ICT/23/0001",
            role: "student",
            facultyId: 1,
            departmentId: 1,
            intake: "43",
            year: 2,
            courses: [101, 102, 103],
            availability: ["Wed-2", "Fri-3"]
          };
          state.users.push(user);
          saveStateToStorage();
        }
        state.authUser = user;
        return true;
      }
    } catch (e) {
      console.warn("Supabase session check failed, using local auth:", e);
    }
  }

  // Restore local active session
  const storedAuthId = sessionStorage.getItem("kdu_active_user_id");
  if (storedAuthId) {
    state.authUser = userById(storedAuthId) || null;
  }
  return !!state.authUser;
}

// ---------- Data Accessors ----------

function db() {
  if (!state) state = loadStateFromStorage();
  return state;
}

function allCourses() {
  const list = [];
  KDU_CATALOG.forEach(function (f) {
    f.departments.forEach(function (d) {
      d.courses.forEach(function (c) {
        list.push({ ...c, facultyId: f.id, facultyName: f.name, departmentId: d.id, departmentName: d.name });
      });
    });
  });
  return list;
}

function courseById(id) {
  const num = Number(id);
  return allCourses().find(function (c) { return c.id === num; }) || null;
}

function facultyById(id) {
  const num = Number(id);
  return KDU_CATALOG.find(function (f) { return f.id === num; }) || null;
}

function deptById(id) {
  const num = Number(id);
  for (let i = 0; i < KDU_CATALOG.length; i++) {
    const d = KDU_CATALOG[i].departments.find(function (dep) { return dep.id === num; });
    if (d) return { ...d, facultyId: KDU_CATALOG[i].id };
  }
  return null;
}

function userById(id) {
  return db().users.find(function (u) { return u.id === id; }) || null;
}

function userByEmail(email) {
  if (!email) return null;
  return db().users.find(function (u) { return String(u.email).toLowerCase() === String(email).trim().toLowerCase(); }) || null;
}

function groupById(id) {
  return db().groups.find(function (g) { return g.id === id; }) || null;
}

function currentUser() {
  if (!state) state = loadStateFromStorage();
  return state.authUser;
}

function profileComplete(user) {
  return !!(
    user &&
    user.facultyId &&
    user.departmentId &&
    Array.isArray(user.courses) &&
    user.courses.length > 0 &&
    Array.isArray(user.availability) &&
    user.availability.length > 0
  );
}

function requireLogin() {
  const user = currentUser();
  if (!user) {
    location.href = "index.html";
    return null;
  }
  return user;
}

function requireAdmin() {
  const user = requireLogin();
  if (!user) return null;
  if (user.role !== "admin") {
    location.href = "dashboard.html";
    return null;
  }
  return user;
}

// ---------- Authentication Operations ----------

async function signIn(email, password) {
  if (!email || !password) return "Please enter your email and password.";
  const cleanEmail = email.trim().toLowerCase();

  // 1. If Supabase configured, attempt live auth
  if (sbClient) {
    try {
      const { data, error } = await sbClient.auth.signInWithPassword({ email: cleanEmail, password: password });
      if (error) return error.message;
      let user = userByEmail(cleanEmail);
      if (!user) {
        user = {
          id: data.user.id,
          name: data.user.user_metadata?.name || cleanEmail.split("@")[0],
          email: cleanEmail,
          indexNo: data.user.user_metadata?.index_no || "D/ICT/23/0001",
          role: "student",
          facultyId: 1,
          departmentId: 1,
          intake: "43",
          year: 2,
          courses: [101, 102, 103],
          availability: ["Wed-2", "Fri-3"]
        };
        state.users.push(user);
      }
      state.authUser = user;
      sessionStorage.setItem("kdu_active_user_id", user.id);
      saveStateToStorage();
      return null;
    } catch (e) {
      console.warn("Supabase live signIn error, checking local store:", e);
    }
  }

  // 2. Demo / Local Auth
  const existing = userByEmail(cleanEmail);
  if (!existing) {
    return "Account not found with this email. Please register or use Quick Demo.";
  }
  state.authUser = existing;
  sessionStorage.setItem("kdu_active_user_id", existing.id);
  saveStateToStorage();
  return null;
}

async function signUp(name, indexNo, email, password, facultyId, departmentId, intake) {
  if (!name || !indexNo || !email || !password) {
    return "All fields are required for registration.";
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanIndex = indexNo.trim().toUpperCase();

  // Validate index prefix
  if (!cleanIndex.startsWith("D") && !cleanIndex.startsWith("C") && !cleanIndex.startsWith("STAFF")) {
    return "KDU Index Number must start with 'D' (Day Scholar) or 'C' (Officer Cadet).";
  }

  const existing = userByEmail(cleanEmail);
  if (existing) {
    return "An account with this email address already exists.";
  }

  const newId = "usr-" + Date.now();
  const newUser = {
    id: newId,
    name: name.trim(),
    email: cleanEmail,
    indexNo: cleanIndex,
    role: cleanEmail.includes("admin") || cleanIndex.startsWith("STAFF") ? "admin" : "student",
    facultyId: Number(facultyId) || 1,
    departmentId: Number(departmentId) || 1,
    intake: String(intake || "43"),
    year: 2,
    bio: "",
    courses: [101, 102], // Default enrollment in core FOT ICT
    availability: ["Wed-2", "Fri-3"]
  };

  if (sbClient) {
    try {
      await sbClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: { data: { name: newUser.name, index_no: newUser.indexNo } }
      });
    } catch (e) {
      console.warn("Supabase live signUp notice:", e);
    }
  }

  state.users.push(newUser);
  state.authUser = newUser;
  sessionStorage.setItem("kdu_active_user_id", newUser.id);
  saveStateToStorage();
  return null;
}

async function signOut() {
  if (sbClient) {
    try { await sbClient.auth.signOut(); } catch (e) {}
  }
  sessionStorage.removeItem("kdu_active_user_id");
  if (state) state.authUser = null;
}

// ---------- Mutations ----------

async function updateUserProfile(id, patch) {
  const u = userById(id);
  if (!u) return "User profile not found.";

  Object.assign(u, {
    name: patch.name !== undefined ? patch.name : u.name,
    indexNo: patch.indexNo !== undefined ? patch.indexNo.trim().toUpperCase() : u.indexNo,
    facultyId: patch.facultyId !== undefined ? Number(patch.facultyId) : u.facultyId,
    departmentId: patch.departmentId !== undefined ? Number(patch.departmentId) : u.departmentId,
    intake: patch.intake !== undefined ? String(patch.intake) : u.intake,
    year: patch.year !== undefined ? Number(patch.year) : u.year,
    bio: patch.bio !== undefined ? patch.bio : u.bio,
    courses: Array.isArray(patch.courses) ? patch.courses.map(Number) : u.courses,
    availability: Array.isArray(patch.availability) ? patch.availability : u.availability
  });

  saveStateToStorage();

  if (sbClient) {
    try {
      await sbClient.from("profiles").update({
        display_name: u.name,
        kdu_index_no: u.indexNo,
        faculty_id: u.facultyId,
        department_id: u.departmentId,
        intake: u.intake,
        year_of_study: u.year,
        bio: u.bio
      }).eq("id", id);
    } catch (e) {
      console.warn("Supabase profile sync notice:", e);
    }
  }
  return null;
}

async function sendMessage(groupId, senderId, text) {
  if (!groupId || !senderId || !text.trim()) return "Message cannot be empty.";
  const clean = text.trim();

  const msgObj = {
    id: Date.now(),
    sender: senderId,
    text: clean,
    at: Date.now()
  };

  const list = state.messages[groupId] || (state.messages[groupId] = []);
  list.push(msgObj);
  saveStateToStorage();

  if (sbClient) {
    try {
      await sbClient.from("messages").insert({
        group_id: groupId,
        sender: senderId,
        content: clean
      });
    } catch (e) {
      console.warn("Supabase message insert notice:", e);
    }
  }
  return null;
}

async function sendPartnerRequest(fromId, toId) {
  if (fromId === toId) return "You cannot send a request to yourself.";
  const dup = state.requests.some(function (r) {
    return r.type === "partner" && r.from === fromId && r.to === toId && r.status === "pending";
  });
  if (dup) return "Study request is already pending.";

  const newReq = {
    id: "req-" + Date.now(),
    type: "partner",
    from: fromId,
    to: toId,
    status: "pending"
  };
  state.requests.push(newReq);
  saveStateToStorage();
  return null;
}

async function requestToJoinGroup(user, groupId) {
  const g = groupById(groupId);
  if (!g) return "Study group not found.";
  if (g.members.includes(user.id)) return "You are already a member of this group.";
  if (g.members.length >= g.max_members) return "This group has reached maximum member capacity.";

  const dup = state.requests.some(function (r) {
    return r.type === "group" && r.groupId === groupId && r.from === user.id && r.status === "pending";
  });
  if (dup) return "Your join request is already pending approval.";

  const newReq = {
    id: "req-" + Date.now(),
    type: "group",
    from: user.id,
    to: g.leader,
    groupId: groupId,
    status: "pending"
  };
  state.requests.push(newReq);
  saveStateToStorage();
  return null;
}

async function setRequestStatus(id, status) {
  const r = state.requests.find(function (x) { return x.id === id; });
  if (!r) return "Request not found.";
  r.status = status;
  saveStateToStorage();
  return null;
}

async function approveJoinRequest(requestId) {
  const r = state.requests.find(function (x) { return x.id === requestId; });
  if (!r || r.status !== "pending") return "Request not found or already handled.";
  const g = groupById(r.groupId);
  if (!g) return "Group no longer exists.";
  if (g.members.length >= g.max_members) return "Group is already at maximum capacity.";

  if (!g.members.includes(r.from)) {
    g.members.push(r.from);
  }
  if (g.members.length >= g.max_members) {
    g.is_open = false;
  }
  r.status = "approved";
  saveStateToStorage();
  return null;
}

async function acceptPartnerRequest(requestId) {
  const r = state.requests.find(function (x) { return x.id === requestId; });
  if (!r || r.status !== "pending") return "Request not found.";
  const me = state.authUser;
  const other = userById(r.from);
  if (!me || !other) return "User account not found.";

  const shared = (me.courses || []).filter(function (id) {
    return (other.courses || []).includes(id);
  });

  const courseTitle = shared.length ? courseById(shared[0])?.code + " " : "";
  const groupName = courseTitle + me.name.split(" ")[0] + " & " + other.name.split(" ")[0] + " Syndicate";

  const newGroup = {
    id: "grp-" + Date.now(),
    name: groupName,
    course: shared.length ? shared[0] : null,
    leader: me.id,
    max_members: 4,
    is_open: true,
    members: [me.id, other.id]
  };

  state.groups.push(newGroup);
  r.status = "approved";
  saveStateToStorage();
  return null;
}

async function createGroup(name, courseId, maxMembers, leaderId) {
  if (!name.trim()) return "Group name is required.";
  const newGroup = {
    id: "grp-" + Date.now(),
    name: name.trim(),
    course: courseId ? Number(courseId) : null,
    leader: leaderId,
    max_members: Math.max(2, Math.min(10, Number(maxMembers) || 6)),
    is_open: true,
    members: [leaderId]
  };
  state.groups.push(newGroup);
  saveStateToStorage();
  return newGroup;
}

async function addStudySession(groupId, title, day, time) {
  if (!title.trim() || !day || !time) return "Session title, day, and time are required.";
  const newSession = {
    id: "ses-" + Date.now(),
    groupId: groupId,
    title: title.trim(),
    day: day,
    time: time
  };
  state.sessions.push(newSession);
  saveStateToStorage();
  return null;
}

async function setGroupOpenStatus(groupId, isOpen) {
  const g = groupById(groupId);
  if (!g) return "Group not found.";
  g.is_open = !!isOpen;
  saveStateToStorage();
  return null;
}

// ---------- Realtime Subscription ----------

function subscribeToMessages(groupId, onMessageReceived) {
  if (sbClient) {
    try {
      return sbClient.channel("group-" + groupId)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "group_id=eq." + groupId
        }, function (payload) {
          const list = state.messages[groupId] || (state.messages[groupId] = []);
          if (!list.some(function (m) { return m.id === payload.new.id; })) {
            list.push({
              id: payload.new.id,
              sender: payload.new.sender,
              text: payload.new.content,
              at: new Date(payload.new.sent_at).getTime()
            });
            onMessageReceived();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn("Realtime channel failed, falling back to local:", e);
    }
  }

  // Local storage broadcast listener for multi-tab testing
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) {
      state = loadStateFromStorage();
      onMessageReceived();
    }
  });
  return { unsubscribe: function () {} };
}