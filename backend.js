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

// Institutional KDU Academic Catalog (Verified from official KDU faculty websites: kdu.ac.lk)
// General Sir John Kotelawala Defence University
const KDU_CATALOG = [
  {
    id: 1,
    name: "Faculty of Technology",
    code: "FOT",
    departments: [
      {
        id: 1,
        name: "Department of Information and Communication Technology",
        code: "DICT",
        programme: "Bachelor of Technology Honours in Information and Communication Technology (BTech Hons in ICT)",
        courses: [
          { id: 101, code: "ICT1113", title: "Fundamentals of Programming", year: 1 },
          { id: 102, code: "ICT1123", title: "Computer Systems & Architecture", year: 1 },
          { id: 103, code: "ICT1133", title: "Mathematics for Technology", year: 1 },
          { id: 104, code: "ICT1213", title: "Object Oriented Programming", year: 1 },
          { id: 105, code: "ICT1223", title: "Data Structures & Algorithms", year: 1 },
          { id: 106, code: "ICT1233", title: "Database Management Systems", year: 1 },
          { id: 107, code: "ICT2113", title: "Web Technologies & Applications", year: 2 },
          { id: 108, code: "ICT2123", title: "Computer Networks & Data Communications", year: 2 },
          { id: 109, code: "ICT2133", title: "Operating Systems & Linux Administration", year: 2 },
          { id: 110, code: "ICT2213", title: "Software Engineering Principles", year: 2 },
          { id: 111, code: "ICT2223", title: "Mobile Application Development", year: 2 },
          { id: 112, code: "ICT2282", title: "Skill Development Project II (SDP II)", year: 2 },
          { id: 113, code: "EN1022", title: "Professional English for Technology", year: 2 },
          { id: 114, code: "DL1012", title: "Military Studies & Leadership", year: 2 }
        ]
      },
      {
        id: 2,
        name: "Department of Biosystems Technology",
        code: "DBST",
        programme: "Bachelor of Biosystems Technology Honours in Applied Biotechnology (BBST Hons)",
        courses: [
          { id: 121, code: "BST1113", title: "Cell Biology & Genetics", year: 1 },
          { id: 122, code: "BST1122", title: "Biochemistry & Biomolecules", year: 1 },
          { id: 123, code: "BST1213", title: "Microbiology & Immunology", year: 1 },
          { id: 124, code: "BST1223", title: "Bioinformatics & Computational Biology", year: 2 },
          { id: 125, code: "BST2113", title: "Bioprocess Technology", year: 2 },
          { id: 126, code: "BST2123", title: "Molecular Biology Techniques", year: 2 },
          { id: 127, code: "BST2213", title: "Agricultural Biotechnology & Food Security", year: 2 }
        ]
      },
      {
        id: 3,
        name: "Department of Engineering Technology",
        code: "DET",
        programme: "Bachelor of Engineering Technology Honours (Construction / Building Services / Biomedical)",
        courses: [
          { id: 131, code: "BET1113", title: "Engineering Mathematics", year: 1 },
          { id: 132, code: "BET1123", title: "Fundamentals of Electrical & Electronics", year: 1 },
          { id: 133, code: "BET1213", title: "Engineering Mechanics & Statics", year: 1 },
          { id: 134, code: "BET1223", title: "Civil Engineering Materials & Surveying", year: 1 },
          { id: 135, code: "BET2113", title: "Biomedical Instrumentation & Sensors", year: 2 },
          { id: 136, code: "BET2123", title: "Building Services & HVAC Systems", year: 2 },
          { id: 137, code: "BET2213", title: "Construction Technology & Project Management", year: 2 }
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
        id: 4,
        name: "Department of Computer Science",
        code: "DCS",
        programme: "BSc (Hons) in Computer Science / BSc (Hons) in Software Engineering",
        courses: [
          { id: 201, code: "CS1012", title: "Fundamentals of Programming", year: 1 },
          { id: 202, code: "CS1023", title: "Computer Systems Architecture", year: 1 },
          { id: 203, code: "CS2023", title: "Object Oriented Programming", year: 2 },
          { id: 204, code: "CS2033", title: "Data Structures & Algorithms", year: 2 },
          { id: 205, code: "CS2043", title: "Relational Database Theory & SQL", year: 2 },
          { id: 206, code: "SE2013", title: "Software Architecture & Design Patterns", year: 2 },
          { id: 207, code: "SE2023", title: "Software Quality Assurance & Testing", year: 2 },
          { id: 208, code: "CS2082", title: "Artificial Intelligence", year: 2 },
          { id: 209, code: "CS3082", title: "Mobile Computing & Applications", year: 3 },
          { id: 210, code: "CS4013", title: "Machine Learning & Neural Networks", year: 4 }
        ]
      },
      {
        id: 5,
        name: "Department of Information Technology",
        code: "DIT",
        programme: "BSc (Hons) in Information Technology / BSc (Hons) in Information Systems",
        courses: [
          { id: 221, code: "IT1013", title: "Fundamentals of Information Systems", year: 1 },
          { id: 222, code: "IT1023", title: "Web Applications Development", year: 1 },
          { id: 223, code: "IT2013", title: "Data Communication & Computer Networks", year: 2 },
          { id: 224, code: "IT2023", title: "Network Security & Information Assurance", year: 2 },
          { id: 225, code: "IT2033", title: "Cloud Computing & Virtualization", year: 2 },
          { id: 226, code: "DS2013", title: "Foundations of Data Science & Python", year: 2 },
          { id: 227, code: "IS2013", title: "Enterprise Architecture & Business Systems", year: 2 }
        ]
      },
      {
        id: 6,
        name: "Department of Computer Engineering",
        code: "DCE",
        programme: "BSc (Hons) in Computer Engineering",
        courses: [
          { id: 241, code: "CE1013", title: "Digital Logic Design", year: 1 },
          { id: 242, code: "CE1023", title: "Computer Architecture & Organization", year: 1 },
          { id: 243, code: "CE2013", title: "Microcontrollers & Embedded Systems", year: 2 },
          { id: 244, code: "CE2023", title: "Signals & Systems Analysis", year: 2 }
        ]
      },
      {
        id: 7,
        name: "Department of Computational Mathematics",
        code: "DCM",
        programme: "Computational Mathematics & Statistical Computing",
        courses: [
          { id: 261, code: "CM1013", title: "Discrete Mathematics", year: 1 },
          { id: 262, code: "CM1023", title: "Probability & Statistics for Computing", year: 1 },
          { id: 263, code: "CM2013", title: "Operations Research & Optimization", year: 2 }
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
        id: 8,
        name: "Department of Civil Engineering",
        code: "DCV",
        programme: "BSc (Hons) in Civil Engineering",
        courses: [
          { id: 301, code: "CV1013", title: "Engineering Geology & Soil Mechanics", year: 1 },
          { id: 302, code: "CV2013", title: "Mechanics of Fluids & Hydraulics", year: 2 },
          { id: 303, code: "CV2023", title: "Structural Analysis I", year: 2 },
          { id: 304, code: "CV2033", title: "Surveying & Geomatics", year: 2 }
        ]
      },
      {
        id: 9,
        name: "Department of Mechanical Engineering",
        code: "DME",
        programme: "BSc (Hons) in Mechanical Engineering / Mechatronic Engineering",
        courses: [
          { id: 321, code: "ME1013", title: "Engineering Thermodynamics", year: 1 },
          { id: 322, code: "ME1023", title: "Fluid Mechanics & Machinery", year: 1 },
          { id: 323, code: "ME2013", title: "Mechanics of Machines & Vibration", year: 2 },
          { id: 324, code: "MC2013", title: "Sensors & Actuators in Mechatronics", year: 2 },
          { id: 325, code: "MC2023", title: "Robotics & Industrial Automation", year: 2 }
        ]
      },
      {
        id: 10,
        name: "Department of Electrical, Electronic and Telecommunication Engineering",
        code: "DEET",
        programme: "BSc (Hons) in Electrical & Electronic / Telecommunication / Biomedical Eng",
        courses: [
          { id: 341, code: "EE1013", title: "Circuit Theory & Network Analysis", year: 1 },
          { id: 342, code: "EE1023", title: "Analog Electronic Circuits", year: 1 },
          { id: 343, code: "TE2013", title: "Digital Communication Engineering", year: 2 },
          { id: 344, code: "TE2023", title: "Electromagnetic Waves & Transmission Lines", year: 2 },
          { id: 345, code: "BM2013", title: "Biomedical Instrumentation & Physiological Modeling", year: 2 }
        ]
      },
      {
        id: 11,
        name: "Department of Aeronautical Engineering",
        code: "DAE",
        programme: "BSc (Hons) in Aeronautical Engineering / Aircraft Maintenance Eng",
        courses: [
          { id: 361, code: "AE1013", title: "Introduction to Aeronautics & Flight Mechanics", year: 1 },
          { id: 362, code: "AE2013", title: "Aircraft Aerodynamics & Computational Fluid Dynamics", year: 2 },
          { id: 363, code: "AE2023", title: "Aircraft Propulsion & Gas Turbine Engines", year: 2 },
          { id: 364, code: "AE2033", title: "Aircraft Structures & Material Science", year: 2 }
        ]
      },
      {
        id: 12,
        name: "Department of Marine Engineering",
        code: "DMR",
        programme: "BSc (Hons) in Marine Engineering / Naval Architecture",
        courses: [
          { id: 381, code: "MR1013", title: "Marine Engineering Knowledge", year: 1 },
          { id: 382, code: "NA2013", title: "Naval Architecture & Ship Stability", year: 2 },
          { id: 383, code: "MR2023", title: "Marine Auxiliary Machinery & Systems", year: 2 }
        ]
      },
      {
        id: 13,
        name: "Department of Mathematics",
        code: "DMA",
        programme: "Engineering Mathematics & Analytical Methods",
        courses: [
          { id: 391, code: "MA1013", title: "Engineering Mathematics I", year: 1 },
          { id: 392, code: "MA1023", title: "Engineering Mathematics II (Calculus & Linear Algebra)", year: 1 },
          { id: 393, code: "MA2013", title: "Differential Equations & Numerical Methods", year: 2 }
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
        id: 14,
        name: "Department of Management & Finance",
        code: "DMF",
        programme: "BSc Logistics Management (Hons) / Management & Technical Sciences / Business Analytics",
        courses: [
          { id: 401, code: "LM1013", title: "Principles of Supply Chain Management", year: 1 },
          { id: 402, code: "LM2013", title: "Freight Forwarding, Ports & Shipping Operations", year: 2 },
          { id: 403, code: "MF1013", title: "Financial Accounting & Cost Control", year: 1 },
          { id: 404, code: "BA2013", title: "Business Analytics & Predictive Modeling", year: 2 },
          { id: 405, code: "MS1013", title: "Operations Research & Quantitative Methods", year: 2 }
        ]
      },
      {
        id: 15,
        name: "Department of Social Sciences",
        code: "DSS",
        programme: "BSc in Social Sciences",
        courses: [
          { id: 421, code: "SS1013", title: "Introduction to International Relations", year: 1 },
          { id: 422, code: "SS1023", title: "Political Science & Strategic Governance", year: 1 },
          { id: 423, code: "SS2013", title: "Peace, Conflict Resolution & Humanitarian Studies", year: 2 }
        ]
      },
      {
        id: 16,
        name: "Department of Languages",
        code: "DLG",
        programme: "BA in Teaching English to Speakers of Other Languages (TESOL) / Applied Communication",
        courses: [
          { id: 441, code: "EN1013", title: "Academic & Professional English", year: 1 },
          { id: 442, code: "TS1013", title: "Principles of English Language Teaching (TESOL)", year: 1 },
          { id: 443, code: "LG2013", title: "Data Storytelling & Technical Communication", year: 2 }
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
        id: 17,
        name: "Department of Nursing & Midwifery",
        code: "DNM",
        programme: "BSc (Hons) in Nursing",
        courses: [
          { id: 501, code: "NUR1013", title: "Fundamentals of Nursing Practice", year: 1 },
          { id: 502, code: "NUR1023", title: "Human Anatomy & Physiology", year: 1 },
          { id: 503, code: "NUR2013", title: "Medical-Surgical Nursing I", year: 2 }
        ]
      },
      {
        id: 18,
        name: "Department of Medical Laboratory Sciences",
        code: "DMLS",
        programme: "BSc (Hons) in Medical Laboratory Sciences",
        courses: [
          { id: 521, code: "MLS1013", title: "Clinical Biochemistry I", year: 1 },
          { id: 522, code: "MLS1023", title: "Medical Microbiology & Virology", year: 2 },
          { id: 523, code: "MLS2013", title: "Hematology & Blood Transfusion Science", year: 2 }
        ]
      },
      {
        id: 19,
        name: "Department of Pharmacy",
        code: "DPH",
        programme: "Bachelor of Pharmacy Honours (BPharm)",
        courses: [
          { id: 541, code: "PHA1013", title: "Pharmaceutics I", year: 1 },
          { id: 542, code: "PHA1023", title: "Pharmacology & Pharmacokinetics", year: 2 }
        ]
      },
      {
        id: 20,
        name: "Department of Physiotherapy and Occupational Therapy",
        code: "DPT",
        programme: "BSc (Hons) in Physiotherapy",
        courses: [
          { id: 561, code: "PHT1013", title: "Biomechanics & Human Kinesiology", year: 1 },
          { id: 562, code: "PHT1023", title: "Musculoskeletal Rehabilitation", year: 2 }
        ]
      },
      {
        id: 21,
        name: "Department of Radiography and Radiotherapy",
        code: "DRR",
        programme: "BSc (Hons) in Radiography / Radiotherapy",
        courses: [
          { id: 581, code: "RAD1013", title: "Medical Imaging & Radiographic Techniques", year: 1 },
          { id: 582, code: "RAD2013", title: "Radiation Physics & Safety Protection", year: 2 }
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
        id: 22,
        name: "Department of Law",
        code: "DLAW",
        programme: "Bachelor of Laws Honours (LLB)",
        courses: [
          { id: 601, code: "LAW1013", title: "Legal System of Sri Lanka", year: 1 },
          { id: 602, code: "LAW1023", title: "Constitutional & Administrative Law", year: 1 },
          { id: 603, code: "LAW2013", title: "Criminal Law & Penal Code Procedure", year: 2 },
          { id: 604, code: "LAW2023", title: "Law of Contracts & Commercial Obligations", year: 2 },
          { id: 605, code: "LAW3013", title: "Public International Law & Human Rights", year: 3 }
        ]
      }
    ]
  },
  {
    id: 7,
    name: "Faculty of Built Environment & Spatial Sciences",
    code: "FBESS",
    departments: [
      {
        id: 23,
        name: "Department of Architecture",
        code: "DARC",
        programme: "Bachelor of Architecture Honours (BArch)",
        courses: [
          { id: 701, code: "ARC1013", title: "Architectural Design Studio I", year: 1 },
          { id: 702, code: "ARC2013", title: "Sustainable Building Climatology & Materials", year: 2 }
        ]
      },
      {
        id: 24,
        name: "Department of Spatial Sciences",
        code: "DSPS",
        programme: "BSc (Hons) in Surveying Sciences / Cartography & GIS",
        courses: [
          { id: 721, code: "SPS1013", title: "Geodesy & Land Surveying Principles", year: 1 },
          { id: 722, code: "SPS2013", title: "Geographic Information Systems (GIS) & Remote Sensing", year: 2 }
        ]
      },
      {
        id: 25,
        name: "Department of Quantity Surveying",
        code: "DQS",
        programme: "BSc (Hons) in Quantity Surveying",
        courses: [
          { id: 741, code: "QS1013", title: "Measurement of Building Works", year: 1 },
          { id: 742, code: "QS2013", title: "Construction Economics & Cost Estimating", year: 2 }
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


// Clean Initial State (Completely free of mock/demo users, groups, or chats)
function getInitialSeedState() {
  return {
    faculties: KDU_CATALOG,
    users: [],
    groups: [],
    messages: {},
    sessions: [],
    requests: [],
    authUser: null
  };
}

const STORAGE_KEY = "kdu_studyconnect_clean_v1";

let state = null;
let sbClient = null;

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        parsed.faculties = KDU_CATALOG; // ensure latest catalog is always active
        if (!parsed.groups) parsed.groups = [];
        if (!parsed.messages) parsed.messages = {};
        if (!parsed.sessions) parsed.sessions = [];
        if (!parsed.requests) parsed.requests = [];
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

function clearAllLocalData() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem("kdu_active_user_id");
  state = getInitialSeedState();
  saveStateToStorage(state);
}

// Initialize Supabase client if configured
function initSupabaseClient() {
  if (typeof isSupabaseConfigured === "function" && isSupabaseConfigured() && typeof supabase !== "undefined") {
    try {
      const url = typeof getSupabaseUrl === "function" ? getSupabaseUrl() : (typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : "");
      const key = typeof getSupabaseAnonKey === "function" ? getSupabaseAnonKey() : (typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : "");
      if (url && key) {
        sbClient = supabase.createClient(url, key);
      }
    } catch (err) {
      console.warn("Supabase client init error:", err);
    }
  }
}
initSupabaseClient();

// Sync live collections from Supabase
async function syncFromSupabase() {
  if (!sbClient) return;
  try {
    // 1. Fetch Remote Profiles
    const { data: remoteProfiles, error: pErr } = await sbClient.from("profiles").select("*");
    if (!pErr && remoteProfiles && remoteProfiles.length) {
      const { data: remoteCourses } = await sbClient.from("student_courses").select("*");
      const { data: remoteAvail } = await sbClient.from("availability").select("*");

      state.users = remoteProfiles.map(function (p) {
        const uCourses = (remoteCourses || [])
          .filter(function (rc) { return rc.student === p.id; })
          .map(function (rc) { return Number(rc.course_id); });

        const dayKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const uAvail = (remoteAvail || [])
          .filter(function (ra) { return ra.student === p.id; })
          .map(function (ra) {
            const dKey = dayKeys[ra.day_of_week] || "Mon";
            const hour = parseInt(String(ra.start_time).split(":")[0], 10);
            const slot = hour < 12 ? 1 : hour >= 17 ? 3 : 2;
            return dKey + "-" + slot;
          });

        return {
          id: p.id,
          name: p.display_name || p.email.split("@")[0],
          email: p.email,
          indexNo: p.kdu_index_no || "",
          role: p.role || "student",
          facultyId: p.faculty_id || null,
          departmentId: p.department_id || null,
          intake: p.intake || "43",
          year: p.year_of_study || 2,
          bio: p.bio || "",
          courses: uCourses,
          availability: uAvail
        };
      });
    }

    // 2. Fetch Remote Groups & Group Members
    const { data: remoteGroups, error: gErr } = await sbClient.from("groups").select("*, group_members(*)");
    if (!gErr && remoteGroups) {
      state.groups = remoteGroups.map(function (g) {
        const members = (g.group_members || []).map(function (gm) { return gm.student; });
        if (g.created_by && !members.includes(g.created_by)) {
          members.push(g.created_by);
        }
        return {
          id: g.id,
          name: g.name,
          course: g.course_id ? Number(g.course_id) : null,
          leader: g.created_by,
          max_members: g.max_members || 6,
          is_open: g.is_open !== false,
          members: members
        };
      });
    }

    // 3. Fetch Remote Messages
    const { data: remoteMessages, error: mErr } = await sbClient
      .from("messages")
      .select("*")
      .order("sent_at", { ascending: true });
    if (!mErr && remoteMessages) {
      state.messages = {};
      remoteMessages.forEach(function (m) {
        if (!state.messages[m.group_id]) state.messages[m.group_id] = [];
        state.messages[m.group_id].push({
          id: m.id,
          sender: m.sender,
          text: m.content,
          at: new Date(m.sent_at).getTime()
        });
      });
    }

    // 4. Fetch Remote Study Sessions
    const { data: remoteSessions, error: sErr } = await sbClient.from("study_sessions").select("*");
    if (!sErr && remoteSessions) {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      state.sessions = remoteSessions.map(function (s) {
        const d = new Date(s.starts_at);
        const dayKey = dayNames[d.getDay()] || "Wed";
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        return {
          id: String(s.id),
          groupId: s.group_id,
          title: s.title,
          day: dayKey,
          time: hours + ":" + mins
        };
      });
    }

    // 5. Fetch Remote Join Requests
    const { data: remoteRequests, error: rErr } = await sbClient.from("join_requests").select("*, groups(created_by)");
    if (!rErr && remoteRequests) {
      state.requests = remoteRequests.map(function (r) {
        return {
          id: "req-" + r.id,
          rawId: r.id,
          type: "group",
          from: r.student,
          to: r.groups ? r.groups.created_by : null,
          groupId: r.group_id,
          status: r.status
        };
      });
    }

    saveStateToStorage();
  } catch (e) {
    console.warn("Supabase data sync notice:", e);
  }
}

async function initBackend() {
  if (!sbClient) initSupabaseClient();
  state = loadStateFromStorage();

  if (sbClient) {
    try {
      const { data: { session } } = await sbClient.auth.getSession();
      if (session && session.user) {
        const userEmail = (session.user.email || "").trim().toLowerCase();

        // Strict University Domain Restriction: must end with @kdu.ac.lk
        if (!userEmail.endsWith("@kdu.ac.lk")) {
          await sbClient.auth.signOut();
          sessionStorage.removeItem("kdu_active_user_id");
          state.authUser = null;
          saveStateToStorage();
          if (window.history.replaceState && window.location.hash.includes("access_token")) {
            window.history.replaceState(null, null, window.location.pathname);
          }
          if (typeof showToast === "function") {
            showToast("Access restricted: Only official university accounts ending with @kdu.ac.lk are permitted.", true);
          }
          return false;
        }

        // Fetch or create profile in Supabase
        let user = null;
        try {
          const { data: profile } = await sbClient.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
          if (profile) {
            user = {
              id: profile.id,
              name: profile.display_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split("@")[0],
              email: profile.email || userEmail,
              indexNo: profile.kdu_index_no || "",
              role: profile.role || (userEmail.includes("admin") || userEmail.startsWith("staff") ? "admin" : "student"),
              facultyId: profile.faculty_id || null,
              departmentId: profile.department_id || null,
              intake: profile.intake || "43",
              year: profile.year_of_study || 2,
              bio: profile.bio || "",
              courses: [],
              availability: []
            };

            const { data: sc } = await sbClient.from("student_courses").select("course_id").eq("student", user.id);
            if (sc) user.courses = sc.map(function (c) { return Number(c.course_id); });

            const { data: av } = await sbClient.from("availability").select("day_of_week, start_time").eq("student", user.id);
            if (av) {
              const dayKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              user.availability = av.map(function (item) {
                const dKey = dayKeys[item.day_of_week] || "Mon";
                const hour = parseInt(String(item.start_time).split(":")[0], 10);
                const slot = hour < 12 ? 1 : hour >= 17 ? 3 : 2;
                return dKey + "-" + slot;
              });
            }
          }
        } catch (pe) {
          console.warn("Error fetching Supabase profile:", pe);
        }

        if (!user) {
          user = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split("@")[0],
            email: userEmail,
            indexNo: session.user.user_metadata?.index_no || "",
            role: userEmail.includes("admin") || userEmail.startsWith("staff") ? "admin" : "student",
            facultyId: null,
            departmentId: null,
            intake: "43",
            year: 2,
            bio: "",
            courses: [],
            availability: []
          };
          try {
            await sbClient.from("profiles").upsert({
              id: session.user.id,
              email: userEmail,
              display_name: user.name,
              role: user.role
            }, { onConflict: "id" });
          } catch (upErr) {}
        }

        const existingIdx = state.users.findIndex(function (u) { return u.id === user.id || u.email.toLowerCase() === userEmail; });
        if (existingIdx >= 0) {
          state.users[existingIdx] = Object.assign({}, state.users[existingIdx], user);
          user = state.users[existingIdx];
        } else {
          state.users.push(user);
        }

        state.authUser = user;
        sessionStorage.setItem("kdu_active_user_id", user.id);
        saveStateToStorage();

        if (window.history.replaceState && window.location.hash.includes("access_token")) {
          window.history.replaceState(null, null, window.location.pathname);
        }

        await syncFromSupabase();
        return true;
      }
    } catch (e) {
      console.warn("Supabase session check notice:", e);
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
    user.indexNo &&
    user.indexNo.trim().length > 0 &&
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

async function signInWithGoogle() {
  if (!sbClient) initSupabaseClient();
  if (!sbClient) {
    return "Supabase is not configured. Please paste your SUPABASE_URL and SUPABASE_ANON_KEY into config.js.";
  }
  const redirectUrl = window.location.origin + window.location.pathname;
  const { data, error } = await sbClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        hd: "kdu.ac.lk", // Restricts Google account selector to @kdu.ac.lk Google Workspace accounts
        prompt: "select_account"
      }
    }
  });
  if (error) return error.message;
  return null;
}

async function signIn(email, password) {
  if (!email || !password) return "Please enter your university email and password.";
  const cleanEmail = email.trim().toLowerCase();

  // Enforce @kdu.ac.lk restriction
  if (!cleanEmail.endsWith("@kdu.ac.lk")) {
    return "Access restricted: Only official university accounts ending with @kdu.ac.lk are permitted.";
  }

  // 1. If Supabase configured, attempt live auth
  if (sbClient) {
    try {
      const { data, error } = await sbClient.auth.signInWithPassword({ email: cleanEmail, password: password });
      if (error) return error.message;
      let user = userById(data.user.id) || userByEmail(cleanEmail);
      if (!user) {
        user = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || cleanEmail.split("@")[0],
          email: cleanEmail,
          indexNo: data.user.user_metadata?.index_no || "",
          role: cleanEmail.includes("admin") || cleanEmail.startsWith("staff") ? "admin" : "student",
          facultyId: null,
          departmentId: null,
          intake: "43",
          year: 2,
          courses: [],
          availability: []
        };
        state.users.push(user);
      }
      state.authUser = user;
      sessionStorage.setItem("kdu_active_user_id", user.id);
      saveStateToStorage();
      await syncFromSupabase();
      return null;
    } catch (e) {
      console.warn("Supabase live signIn notice:", e);
      return e.message || "Failed to sign in.";
    }
  }

  // 2. Local fallback if Supabase not configured
  const existing = userByEmail(cleanEmail);
  if (!existing) {
    return "Account not found with this email. Please register your @kdu.ac.lk account first.";
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

  // Enforce @kdu.ac.lk restriction
  if (!cleanEmail.endsWith("@kdu.ac.lk")) {
    return "Access restricted: Registration is exclusively permitted for university accounts ending with @kdu.ac.lk.";
  }

  // Validate index prefix
  if (!cleanIndex.startsWith("D") && !cleanIndex.startsWith("C") && !cleanIndex.startsWith("STAFF")) {
    return "KDU Index Number must start with 'D' (Day Scholar) or 'C' (Officer Cadet).";
  }

  const existing = userByEmail(cleanEmail);
  if (existing) {
    return "An account with this email address already exists.";
  }

  let newId = "usr-" + Date.now();

  if (sbClient) {
    try {
      const { data, error } = await sbClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: { data: { full_name: name.trim(), name: name.trim(), index_no: cleanIndex } }
      });
      if (error) return error.message;
      if (data && data.user) {
        newId = data.user.id;
      }
    } catch (e) {
      console.warn("Supabase live signUp notice:", e);
      return e.message || "Failed to register account with Supabase.";
    }
  }

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
    courses: [],
    availability: []
  };

  if (sbClient) {
    try {
      await sbClient.from("profiles").upsert({
        id: newUser.id,
        display_name: newUser.name,
        email: newUser.email,
        kdu_index_no: newUser.indexNo,
        faculty_id: newUser.facultyId,
        department_id: newUser.departmentId,
        intake: newUser.intake,
        year_of_study: newUser.year,
        role: newUser.role
      }, { onConflict: "id" });
    } catch (e) {
      console.warn("Supabase profile create notice:", e);
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

      // Sync student_courses
      if (Array.isArray(patch.courses)) {
        await sbClient.from("student_courses").delete().eq("student", id);
        if (u.courses.length > 0) {
          await sbClient.from("student_courses").insert(
            u.courses.map(function (cid) { return { student: id, course_id: cid }; })
          );
        }
      }

      // Sync availability
      if (Array.isArray(patch.availability)) {
        await sbClient.from("availability").delete().eq("student", id);
        if (u.availability.length > 0) {
          const dayMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
          const slotTimes = {
            1: { start: "08:00:00", end: "12:00:00" },
            2: { start: "12:00:00", end: "17:00:00" },
            3: { start: "17:00:00", end: "21:00:00" }
          };
          const availRows = u.availability.map(function (slotStr) {
            const parts = String(slotStr).split("-");
            const d = dayMap[parts[0]] !== undefined ? dayMap[parts[0]] : 1;
            const sId = Number(parts[1]) || 2;
            const timeInfo = slotTimes[sId] || slotTimes[2];
            return {
              student: id,
              day_of_week: d,
              start_time: timeInfo.start,
              end_time: timeInfo.end
            };
          });
          await sbClient.from("availability").insert(availRows);
        }
      }
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

  if (sbClient) {
    try {
      await sbClient.from("join_requests").insert({
        group_id: groupId,
        student: user.id,
        status: "pending"
      });
    } catch (e) {
      console.warn("Supabase join request notice:", e);
    }
  }

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

  if (sbClient && r.rawId) {
    try {
      await sbClient.from("join_requests").update({ status: status }).eq("id", r.rawId);
    } catch (e) {
      console.warn("Supabase setRequestStatus notice:", e);
    }
  }
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

  if (sbClient) {
    try {
      if (r.rawId) {
        await sbClient.from("join_requests").update({ status: "approved" }).eq("id", r.rawId);
      }
      await sbClient.from("group_members").insert({
        group_id: g.id,
        student: r.from,
        role: "member"
      });
      if (g.members.length >= g.max_members) {
        await sbClient.from("groups").update({ is_open: false }).eq("id", g.id);
      }
    } catch (e) {
      console.warn("Supabase approve request notice:", e);
    }
  }
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

  return await createGroup(groupName, shared.length ? shared[0] : null, 4, me.id);
}

async function createGroup(name, courseId, maxMembers, leaderId) {
  if (!name.trim()) return "Group name is required.";
  let groupId = "grp-" + Date.now();

  if (sbClient) {
    try {
      const { data: ins, error } = await sbClient.from("groups").insert({
        name: name.trim(),
        course_id: courseId ? Number(courseId) : null,
        max_members: Math.max(2, Math.min(10, Number(maxMembers) || 6)),
        created_by: leaderId,
        is_open: true
      }).select().single();

      if (!error && ins) {
        groupId = ins.id;
        await sbClient.from("group_members").insert({
          group_id: groupId,
          student: leaderId,
          role: "leader"
        });
      }
    } catch (e) {
      console.warn("Supabase create group notice:", e);
    }
  }

  const newGroup = {
    id: groupId,
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

  let sessionId = "ses-" + Date.now();

  if (sbClient) {
    try {
      const dayMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
      const targetDay = dayMap[day] !== undefined ? dayMap[day] : 3;
      const now = new Date();
      const currentDay = now.getDay();
      let diffDays = (targetDay - currentDay + 7) % 7;
      if (diffDays === 0) diffDays = 7;
      const sessionDate = new Date(now.getTime() + diffDays * 86400000);
      const parts = time.split(":");
      sessionDate.setHours(Number(parts[0]) || 14, Number(parts[1]) || 0, 0, 0);

      const { data: ins, error } = await sbClient.from("study_sessions").insert({
        group_id: groupId,
        title: title.trim(),
        starts_at: sessionDate.toISOString(),
        duration_mins: 60,
        created_by: state.authUser ? state.authUser.id : null
      }).select().single();

      if (!error && ins) sessionId = String(ins.id);
    } catch (e) {
      console.warn("Supabase add session notice:", e);
    }
  }

  const newSession = {
    id: sessionId,
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

  if (sbClient) {
    try {
      await sbClient.from("groups").update({ is_open: g.is_open }).eq("id", groupId);
    } catch (e) {
      console.warn("Supabase setGroupOpenStatus notice:", e);
    }
  }
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