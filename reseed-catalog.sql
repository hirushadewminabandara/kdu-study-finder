-- ==============================================================================
-- KDU StudyConnect - Re-Seed Academic Catalog
-- 
-- PURPOSE: Re-populates faculties, departments, and courses after a data wipe.
--
-- HOW TO RUN:
--   1. Open your Supabase Dashboard: https://supabase.com
--   2. Go to "SQL Editor" in the left sidebar.
--   3. Click "New query", paste this entire script, and click "Run".
-- ==============================================================================

-- 1. Faculties (7 faculties)
INSERT INTO public.faculties (id, name, code) VALUES
  (1, 'Faculty of Technology', 'FOT'),
  (2, 'Faculty of Computing', 'FOC'),
  (3, 'Faculty of Engineering', 'FOE'),
  (4, 'Faculty of Management, Social Sciences & Humanities', 'FMSH'),
  (5, 'Faculty of Allied Health Sciences', 'FAHS'),
  (6, 'Faculty of Law', 'FOL'),
  (7, 'Faculty of Built Environment & Spatial Sciences', 'FBESS')
ON CONFLICT (id) DO UPDATE SET name = excluded.name, code = excluded.code;

-- 2. Departments (25 departments)
INSERT INTO public.departments (id, faculty_id, name, code, programme) VALUES
  (1, 1, 'Department of Information and Communication Technology', 'DICT', 'Bachelor of Technology Honours in Information and Communication Technology (BTech Hons in ICT)'),
  (2, 1, 'Department of Biosystems Technology', 'DBST', 'Bachelor of Biosystems Technology Honours in Applied Biotechnology (BBST Hons)'),
  (3, 1, 'Department of Engineering Technology', 'DET', 'Bachelor of Engineering Technology Honours (Construction / Building Services / Biomedical)'),
  (4, 2, 'Department of Computer Science', 'DCS', 'BSc (Hons) in Computer Science / BSc (Hons) in Software Engineering'),
  (5, 2, 'Department of Information Technology', 'DIT', 'BSc (Hons) in Information Technology / BSc (Hons) in Information Systems'),
  (6, 2, 'Department of Computer Engineering', 'DCE', 'BSc (Hons) in Computer Engineering'),
  (7, 2, 'Department of Computational Mathematics', 'DCM', 'Computational Mathematics & Statistical Computing'),
  (8, 3, 'Department of Civil Engineering', 'DCV', 'BSc (Hons) in Civil Engineering'),
  (9, 3, 'Department of Mechanical Engineering', 'DME', 'BSc (Hons) in Mechanical Engineering / Mechatronic Engineering'),
  (10, 3, 'Department of Electrical, Electronic and Telecommunication Engineering', 'DEET', 'BSc (Hons) in Electrical & Electronic / Telecommunication / Biomedical Eng'),
  (11, 3, 'Department of Aeronautical Engineering', 'DAE', 'BSc (Hons) in Aeronautical Engineering / Aircraft Maintenance Eng'),
  (12, 3, 'Department of Marine Engineering', 'DMR', 'BSc (Hons) in Marine Engineering / Naval Architecture'),
  (13, 3, 'Department of Mathematics', 'DMA', 'Engineering Mathematics & Analytical Methods'),
  (14, 4, 'Department of Management & Finance', 'DMF', 'BSc Logistics Management (Hons) / Management & Technical Sciences / Business Analytics'),
  (15, 4, 'Department of Social Sciences', 'DSS', 'BSc in Social Sciences'),
  (16, 4, 'Department of Languages', 'DLG', 'BA in Teaching English to Speakers of Other Languages (TESOL) / Applied Communication'),
  (17, 5, 'Department of Nursing & Midwifery', 'DNM', 'BSc (Hons) in Nursing'),
  (18, 5, 'Department of Medical Laboratory Sciences', 'DMLS', 'BSc (Hons) in Medical Laboratory Sciences'),
  (19, 5, 'Department of Pharmacy', 'DPH', 'Bachelor of Pharmacy Honours (BPharm)'),
  (20, 5, 'Department of Physiotherapy and Occupational Therapy', 'DPT', 'BSc (Hons) in Physiotherapy'),
  (21, 5, 'Department of Radiography and Radiotherapy', 'DRR', 'BSc (Hons) in Radiography / Radiotherapy'),
  (22, 6, 'Department of Law', 'DLAW', 'Bachelor of Laws Honours (LLB)'),
  (23, 7, 'Department of Architecture', 'DARC', 'Bachelor of Architecture Honours (BArch)'),
  (24, 7, 'Department of Spatial Sciences', 'DSPS', 'BSc (Hons) in Surveying Sciences / Cartography & GIS'),
  (25, 7, 'Department of Quantity Surveying', 'DQS', 'BSc (Hons) in Quantity Surveying')
ON CONFLICT (id) DO UPDATE SET name = excluded.name, code = excluded.code, programme = excluded.programme;

-- 3. Courses (~100 courses)
INSERT INTO public.courses (id, department_id, code, title, year_of_study) VALUES
  -- Faculty of Technology: DICT
  (101, 1, 'ICT1113', 'Fundamentals of Programming', 1),
  (102, 1, 'ICT1123', 'Computer Systems & Architecture', 1),
  (103, 1, 'ICT1133', 'Mathematics for Technology', 1),
  (104, 1, 'ICT1213', 'Object Oriented Programming', 1),
  (105, 1, 'ICT1223', 'Data Structures & Algorithms', 1),
  (106, 1, 'ICT1233', 'Database Management Systems', 1),
  (107, 1, 'ICT2113', 'Web Technologies & Applications', 2),
  (108, 1, 'ICT2123', 'Computer Networks & Data Communications', 2),
  (109, 1, 'ICT2133', 'Operating Systems & Linux Administration', 2),
  (110, 1, 'ICT2213', 'Software Engineering Principles', 2),
  (111, 1, 'ICT2223', 'Mobile Application Development', 2),
  (112, 1, 'ICT2282', 'Skill Development Project II (SDP II)', 2),
  (113, 1, 'EN1022', 'Professional English for Technology', 2),
  (114, 1, 'DL1012', 'Military Studies & Leadership', 2),
  -- Faculty of Technology: DBST
  (121, 2, 'BST1113', 'Cell Biology & Genetics', 1),
  (122, 2, 'BST1122', 'Biochemistry & Biomolecules', 1),
  (123, 2, 'BST1213', 'Microbiology & Immunology', 1),
  (124, 2, 'BST1223', 'Bioinformatics & Computational Biology', 2),
  (125, 2, 'BST2113', 'Bioprocess Technology', 2),
  (126, 2, 'BST2123', 'Molecular Biology Techniques', 2),
  (127, 2, 'BST2213', 'Agricultural Biotechnology & Food Security', 2),
  -- Faculty of Technology: DET
  (131, 3, 'BET1113', 'Engineering Mathematics', 1),
  (132, 3, 'BET1123', 'Fundamentals of Electrical & Electronics', 1),
  (133, 3, 'BET1213', 'Engineering Mechanics & Statics', 1),
  (134, 3, 'BET1223', 'Civil Engineering Materials & Surveying', 1),
  (135, 3, 'BET2113', 'Biomedical Instrumentation & Sensors', 2),
  (136, 3, 'BET2123', 'Building Services & HVAC Systems', 2),
  (137, 3, 'BET2213', 'Construction Technology & Project Management', 2),
  -- Faculty of Computing: DCS
  (201, 4, 'CS1012', 'Fundamentals of Programming', 1),
  (202, 4, 'CS1023', 'Computer Systems Architecture', 1),
  (203, 4, 'CS2023', 'Object Oriented Programming', 2),
  (204, 4, 'CS2033', 'Data Structures & Algorithms', 2),
  (205, 4, 'CS2043', 'Relational Database Theory & SQL', 2),
  (206, 4, 'SE2013', 'Software Architecture & Design Patterns', 2),
  (207, 4, 'SE2023', 'Software Quality Assurance & Testing', 2),
  (208, 4, 'CS2082', 'Artificial Intelligence', 2),
  (209, 4, 'CS3082', 'Mobile Computing & Applications', 3),
  (210, 4, 'CS4013', 'Machine Learning & Neural Networks', 4),
  -- Faculty of Computing: DIT
  (221, 5, 'IT1013', 'Fundamentals of Information Systems', 1),
  (222, 5, 'IT1023', 'Web Applications Development', 1),
  (223, 5, 'IT2013', 'Data Communication & Computer Networks', 2),
  (224, 5, 'IT2023', 'Network Security & Information Assurance', 2),
  (225, 5, 'IT2033', 'Cloud Computing & Virtualization', 2),
  (226, 5, 'DS2013', 'Foundations of Data Science & Python', 2),
  (227, 5, 'IS2013', 'Enterprise Architecture & Business Systems', 2),
  -- Faculty of Computing: DCE
  (241, 6, 'CE1013', 'Digital Logic Design', 1),
  (242, 6, 'CE1023', 'Computer Architecture & Organization', 1),
  (243, 6, 'CE2013', 'Microcontrollers & Embedded Systems', 2),
  (244, 6, 'CE2023', 'Signals & Systems Analysis', 2),
  -- Faculty of Computing: DCM
  (261, 7, 'CM1013', 'Discrete Mathematics', 1),
  (262, 7, 'CM1023', 'Probability & Statistics for Computing', 1),
  (263, 7, 'CM2013', 'Operations Research & Optimization', 2),
  -- Faculty of Engineering: DCV
  (301, 8, 'CV1013', 'Engineering Geology & Soil Mechanics', 1),
  (302, 8, 'CV2013', 'Mechanics of Fluids & Hydraulics', 2),
  (303, 8, 'CV2023', 'Structural Analysis I', 2),
  (304, 8, 'CV2033', 'Surveying & Geomatics', 2),
  -- Faculty of Engineering: DME
  (321, 9, 'ME1013', 'Engineering Thermodynamics', 1),
  (322, 9, 'ME1023', 'Fluid Mechanics & Machinery', 1),
  (323, 9, 'ME2013', 'Mechanics of Machines & Vibration', 2),
  (324, 9, 'MC2013', 'Sensors & Actuators in Mechatronics', 2),
  (325, 9, 'MC2023', 'Robotics & Industrial Automation', 2),
  -- Faculty of Engineering: DEET
  (341, 10, 'EE1013', 'Circuit Theory & Network Analysis', 1),
  (342, 10, 'EE1023', 'Analog Electronic Circuits', 1),
  (343, 10, 'TE2013', 'Digital Communication Engineering', 2),
  (344, 10, 'TE2023', 'Electromagnetic Waves & Transmission Lines', 2),
  (345, 10, 'BM2013', 'Biomedical Instrumentation & Physiological Modeling', 2),
  -- Faculty of Engineering: DAE
  (361, 11, 'AE1013', 'Introduction to Aeronautics & Flight Mechanics', 1),
  (362, 11, 'AE2013', 'Aircraft Aerodynamics & Computational Fluid Dynamics', 2),
  (363, 11, 'AE2023', 'Aircraft Propulsion & Gas Turbine Engines', 2),
  (364, 11, 'AE2033', 'Aircraft Structures & Material Science', 2),
  -- Faculty of Engineering: DMR
  (381, 12, 'MR1013', 'Marine Engineering Knowledge', 1),
  (382, 12, 'NA2013', 'Naval Architecture & Ship Stability', 2),
  (383, 12, 'MR2023', 'Marine Auxiliary Machinery & Systems', 2),
  -- Faculty of Engineering: DMA
  (391, 13, 'MA1013', 'Engineering Mathematics I', 1),
  (392, 13, 'MA1023', 'Engineering Mathematics II (Calculus & Linear Algebra)', 1),
  (393, 13, 'MA2013', 'Differential Equations & Numerical Methods', 2),
  -- Faculty of Management, Social Sciences & Humanities: DMF
  (401, 14, 'LM1013', 'Principles of Supply Chain Management', 1),
  (402, 14, 'LM2013', 'Freight Forwarding, Ports & Shipping Operations', 2),
  (403, 14, 'MF1013', 'Financial Accounting & Cost Control', 1),
  (404, 14, 'BA2013', 'Business Analytics & Predictive Modeling', 2),
  (405, 14, 'MS1013', 'Operations Research & Quantitative Methods', 2),
  -- Faculty of Management, Social Sciences & Humanities: DSS
  (421, 15, 'SS1013', 'Introduction to International Relations', 1),
  (422, 15, 'SS1023', 'Political Science & Strategic Governance', 1),
  (423, 15, 'SS2013', 'Peace, Conflict Resolution & Humanitarian Studies', 2),
  -- Faculty of Management, Social Sciences & Humanities: DLG
  (441, 16, 'EN1013', 'Academic & Professional English', 1),
  (442, 16, 'TS1013', 'Principles of English Language Teaching (TESOL)', 1),
  (443, 16, 'LG2013', 'Data Storytelling & Technical Communication', 2),
  -- Faculty of Allied Health Sciences: DNM
  (501, 17, 'NUR1013', 'Fundamentals of Nursing Practice', 1),
  (502, 17, 'NUR1023', 'Human Anatomy & Physiology', 1),
  (503, 17, 'NUR2013', 'Medical-Surgical Nursing I', 2),
  -- Faculty of Allied Health Sciences: DMLS
  (521, 18, 'MLS1013', 'Clinical Biochemistry I', 1),
  (522, 18, 'MLS1023', 'Medical Microbiology & Virology', 2),
  (523, 18, 'MLS2013', 'Hematology & Blood Transfusion Science', 2),
  -- Faculty of Allied Health Sciences: DPH
  (541, 19, 'PHA1013', 'Pharmaceutics I', 1),
  (542, 19, 'PHA1023', 'Pharmacology & Pharmacokinetics', 2),
  -- Faculty of Allied Health Sciences: DPT
  (561, 20, 'PHT1013', 'Biomechanics & Human Kinesiology', 1),
  (562, 20, 'PHT1023', 'Musculoskeletal Rehabilitation', 2),
  -- Faculty of Allied Health Sciences: DRR
  (581, 21, 'RAD1013', 'Medical Imaging & Radiographic Techniques', 1),
  (582, 21, 'RAD2013', 'Radiation Physics & Safety Protection', 2),
  -- Faculty of Law: DLAW
  (601, 22, 'LAW1013', 'Legal System of Sri Lanka', 1),
  (602, 22, 'LAW1023', 'Constitutional & Administrative Law', 1),
  (603, 22, 'LAW2013', 'Criminal Law & Penal Code Procedure', 2),
  (604, 22, 'LAW2023', 'Law of Contracts & Commercial Obligations', 2),
  (605, 22, 'LAW3013', 'Public International Law & Human Rights', 3),
  -- Faculty of Built Environment & Spatial Sciences: DARC
  (701, 23, 'ARC1013', 'Architectural Design Studio I', 1),
  (702, 23, 'ARC2013', 'Sustainable Building Climatology & Materials', 2),
  -- Faculty of Built Environment & Spatial Sciences: DSPS
  (721, 24, 'SPS1013', 'Geodesy & Land Surveying Principles', 1),
  (722, 24, 'SPS2013', 'Geographic Information Systems (GIS) & Remote Sensing', 2),
  -- Faculty of Built Environment & Spatial Sciences: DQS
  (741, 25, 'QS1013', 'Measurement of Building Works', 1),
  (742, 25, 'QS2013', 'Construction Economics & Cost Estimating', 2)
ON CONFLICT (id) DO UPDATE SET code = excluded.code, title = excluded.title;

-- Reset sequence IDs so new inserts get correct auto-increment values
SELECT setval('faculties_id_seq', (SELECT max(id) FROM faculties));
SELECT setval('departments_id_seq', (SELECT max(id) FROM departments));
SELECT setval('courses_id_seq', (SELECT max(id) FROM courses));

-- Verify: catalog should now have data
SELECT 'faculties' AS table_name, COUNT(*) AS row_count FROM public.faculties
UNION ALL SELECT 'departments', COUNT(*) FROM public.departments
UNION ALL SELECT 'courses', COUNT(*) FROM public.courses;
