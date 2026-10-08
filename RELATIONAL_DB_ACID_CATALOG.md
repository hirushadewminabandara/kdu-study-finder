# KDU StudyConnect: Relational Database Architecture & ACID Catalog Guide

This document provides a comprehensive technical overview of the relational database design, institutional catalog structure, and ACID transaction guarantees implemented in **KDU StudyConnect** using Supabase PostgreSQL.

---

## 1. Relational Database Architecture

The core of the database schema models the academic hierarchy of General Sir John Kotelawala Defence University (KDU). It is organized in a normalized, hierarchical structure separating institutional entities, user identities, enrollment mappings, and collaboration groups.

```
       [ faculties ] (1)
             │
             ▼ (1:N)
      [ departments ] (N)
             │
             ▼ (1:N)
        [ courses ] (N)
             │
             ▼ (M:N via student_courses)
    [ profiles / students ]
        │             │
        ▼ (1:N)       ▼ (M:N via group_members)
  [ availability ]  [ groups ] ── (1:N) ── [ messages / study_sessions ]
```

### 1.1 Academic Catalog Tables

1. **`public.faculties`**
   * Primary table representing the university faculties (e.g., FOC, FOE, FOM, FOT).
   * Key columns: `id serial primary key`, `name text not null unique`, `code text not null unique`.
2. **`public.departments`**
   * Child table of faculties representing degree departments.
   * Key columns: `id serial primary key`, `faculty_id int references public.faculties(id) on delete cascade`, `name text not null`, `code text not null`, `programme text`.
3. **`public.courses`**
   * Child table of departments representing individual subjects/modules.
   * Key columns: `id serial primary key`, `department_id int references public.departments(id) on delete cascade`, `code text not null`, `title text not null`, `year_of_study int default 1`.

### 1.2 Core Operational Tables

* **`public.profiles`**: Extends `auth.users`, storing student/admin records, KDU index numbers, intake, and roles.
* **`public.student_courses`**: Junction table for Many-to-Many ($M:N$) mapping between students and enrolled modules with composite primary key `(student, course_id)`.
* **`public.availability`**: Stores students' weekly free schedule intervals across the 21 standard slots (7 days × 3 time blocks).
* **`public.groups` & `public.group_members`**: Syndicate formation with member caps and leader/member permissions.
* **`public.join_requests`**: Approval workflow for syndicates.
* **`public.messages` & `public.study_sessions`**: Syndicate chat and calendar planning.

---

## 2. ACID Guarantees in the Catalog & Database

KDU StudyConnect utilizes PostgreSQL's relational engine to maintain strict ACID compliance:

### 2.1 Atomicity (All or Nothing)
* **Transaction Blocks:** Multi-row inserts (such as seeding the 12 faculties, 45 departments, and accredited modules in `reseed-catalog.sql` and `supabase-schema.sql`) execute within a single transaction context. If any row constraint fails, the entire batch is rolled back.
* **Cascading Cleanup:** Operations such as account removal (`delete-user-data.sql`) execute profile, enrollment, and group deletion atomically.

### 2.2 Consistency (Integrity Invariants & Constraints)
* **Referential Integrity via Foreign Keys:**
  Foreign keys with `ON DELETE CASCADE` ensure that child entities cannot exist without a parent:
  ```sql
  faculty_id int references public.faculties(id) on delete cascade
  department_id int references public.departments(id) on delete cascade
  ```
* **Uniqueness:**
  `unique` constraints on faculty codes and names prevent duplicate registry entries.
* **Check Constraints & Triggers:**
  * Domain restriction: `enforce_kdu_email_domain()` trigger verifies all signups end with `@kdu.ac.lk`.
  * Syndicate size caps: `check (max_members between 2 and 5)` in `groups`.
  * Status validation: `check (status in ('pending', 'approved', 'rejected'))` in `join_requests`.
* **Idempotent Upserts:**
  Catalog seed scripts use `ON CONFLICT (id) DO UPDATE SET ...` to prevent key collisions while updating catalog descriptions.

### 2.3 Isolation (Concurrency Control)
* **Multi-Version Concurrency Control (MVCC):** PostgreSQL uses MVCC with `READ COMMITTED` transaction isolation by default.
* **Non-Blocking Reads/Writes:** Reads on the academic catalog never lock concurrent write operations, and writes do not lock concurrent readers.
* **Replication Safety:** Real-time subscriptions rely on PostgreSQL's Write-Ahead Log (`supabase_realtime` publication), ensuring clients only observe committed state changes.

### 2.4 Durability (Persistence & Crash Recovery)
* All successful data modifications (course registrations, group creations, profile updates) are committed to the PostgreSQL **Write-Ahead Log (WAL)** on disk before success is signaled.
* In the event of network disruption or server restart, transactions that have been committed remain durable and completely recoverable.

---

## 3. Related Schema & Implementation Files

* [supabase-schema.sql](supabase-schema.sql): Complete production DDL script with table definitions, RLS policies, and triggers.
* [reseed-catalog.sql](reseed-catalog.sql): Idempotent seed script to initialize or restore the 12 faculties, 45 departments, and courses.
* [delete-user-data.sql](delete-user-data.sql): Cascading cleanup utility for resetting user profiles and memberships.
* [backend.js](backend.js): Client-side data interface consuming catalog and profile queries.
