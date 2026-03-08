-- ─────────────────────────────────────────────────────────────────────────────
-- Jurilab — Supabase PostgreSQL Schema
-- HOW TO USE:
--   1. Go to your Supabase project → SQL Editor
--   2. Paste this entire file and click Run
--   That's it. All tables, security rules, and triggers are created automatically.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES (one row per user, linked to Supabase Auth)
-- This is the base table. Lawyers and Clients extend it.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL,
  name              TEXT        NOT NULL DEFAULT '',
  role              TEXT        NOT NULL DEFAULT 'CLIENT'
                                CHECK (role IN ('CLIENT', 'LAWYER', 'ADMIN')),
  avatar_url        TEXT,
  phone             TEXT,
  disabled          BOOLEAN     NOT NULL DEFAULT FALSE,
  profile_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- LAWYERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE lawyers (
  id                UUID        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialty         TEXT        NOT NULL DEFAULT 'General Practice',
  bio               TEXT        NOT NULL DEFAULT '',
  location          TEXT        NOT NULL DEFAULT '',
  coordinates       JSONB,                        -- { lat: number, lng: number }
  hourly_rate       NUMERIC     NOT NULL DEFAULT 0,
  languages         TEXT[]      NOT NULL DEFAULT '{}',
  available_slots   TEXT[]      NOT NULL DEFAULT '{}',
  firm_name         TEXT,
  years_experience  INTEGER     NOT NULL DEFAULT 0,
  profile_config    JSONB,                        -- ProfileBlock[]
  rating            NUMERIC,
  review_count      INTEGER     NOT NULL DEFAULT 0,
  postal_code       TEXT,
  bar_number        TEXT,
  education         JSONB,                        -- any[]
  certifications    JSONB,                        -- any[]
  cases             JSONB,                        -- { total, won, settled }
  verified          BOOLEAN     NOT NULL DEFAULT FALSE,
  response_time     TEXT,
  availability_hours JSONB,                       -- AvailabilityHours (weekly schedule)
  -- Google Calendar
  google_calendar_connected     BOOLEAN     NOT NULL DEFAULT FALSE,
  google_calendar_access_token  TEXT,             -- encrypted
  google_calendar_refresh_token TEXT,             -- encrypted
  google_calendar_last_sync_at  TIMESTAMPTZ,
  -- Outlook Calendar
  outlook_calendar_connected     BOOLEAN     NOT NULL DEFAULT FALSE,
  outlook_calendar_access_token  TEXT,            -- encrypted
  outlook_calendar_refresh_token TEXT,            -- encrypted
  outlook_calendar_last_sync_at  TIMESTAMPTZ
);


-- ─────────────────────────────────────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id                    UUID   PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  favorites             TEXT[] NOT NULL DEFAULT '{}',   -- lawyer UUIDs (as text)
  location              TEXT,
  preferred_specialties TEXT[] NOT NULL DEFAULT '{}'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- APPOINTMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE appointments (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id                UUID        NOT NULL REFERENCES profiles(id),
  client_id                UUID        NOT NULL REFERENCES profiles(id),
  lawyer_name              TEXT,
  client_name              TEXT,
  date                     TIMESTAMPTZ NOT NULL,
  status                   TEXT        NOT NULL DEFAULT 'PENDING'
                                       CHECK (status IN ('CONFIRMED','PENDING','CANCELLED','COMPLETED')),
  notes                    TEXT,
  type                     TEXT        NOT NULL DEFAULT 'VIDEO'
                                       CHECK (type IN ('VIDEO','IN_PERSON','PHONE')),
  daily_room_url           TEXT,
  daily_room_id            TEXT,
  duration                 INTEGER,    -- minutes
  transcript               TEXT,
  summary                  TEXT,
  summary_shared           BOOLEAN     NOT NULL DEFAULT FALSE,
  meeting_ended_at         TIMESTAMPTZ,
  channel_id               TEXT,       -- GetStream channel ID
  google_calendar_event_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- DILIGENCES (lawyer time tracking)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE diligences (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id   UUID        NOT NULL REFERENCES profiles(id),
  client_id   UUID        NOT NULL REFERENCES profiles(id),
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ,
  duration    INTEGER,    -- seconds
  description TEXT        NOT NULL,
  category    TEXT,
  billable    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE documents (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT        NOT NULL,
  file_name              TEXT        NOT NULL,
  file_url               TEXT        NOT NULL,    -- Supabase Storage URL
  file_type              TEXT        NOT NULL
                                     CHECK (file_type IN ('PDF','DOC','DOCX','TXT','IMAGE')),
  file_size              BIGINT      NOT NULL,    -- bytes
  uploaded_by            UUID        NOT NULL REFERENCES profiles(id),
  uploaded_by_role       TEXT        NOT NULL
                                     CHECK (uploaded_by_role IN ('CLIENT','LAWYER','ADMIN')),
  lawyer_id              UUID        NOT NULL REFERENCES profiles(id),
  client_id              UUID        NOT NULL REFERENCES profiles(id),
  appointment_id         UUID        REFERENCES appointments(id) ON DELETE SET NULL,
  description            TEXT,
  ai_summary             TEXT,
  shared_with_client     BOOLEAN     NOT NULL DEFAULT FALSE,
  lawyer_note            TEXT,
  lawyer_note_updated_at TIMESTAMPTZ,
  uploaded_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PERSONAL EVENTS (user's own calendar events)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE personal_events (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES profiles(id),
  title                    TEXT        NOT NULL,
  start_time               TIMESTAMPTZ NOT NULL,
  end_time                 TIMESTAMPTZ NOT NULL,
  all_day                  BOOLEAN     NOT NULL DEFAULT FALSE,
  description              TEXT,
  location                 TEXT,
  color                    TEXT,
  type                     TEXT        CHECK (type IN ('EVENT','AVAILABILITY')),
  google_calendar_event_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATIONS (RAG chatbot history per user)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id),
  title      TEXT,
  messages   JSONB       NOT NULL DEFAULT '[]',   -- ChatMessage[]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id),
  title      TEXT        NOT NULL,
  completed  BOOLEAN     NOT NULL DEFAULT FALSE,
  due_date   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO updated_at on every UPDATE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_diligences_updated_at
  BEFORE UPDATE ON diligences      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_personal_events_updated_at
  BEFORE UPDATE ON personal_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks           FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (who can read/write what)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE diligences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read (needed for search), only self can write
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- Lawyers: everyone can read (search page), only self can write
CREATE POLICY "lawyers_read"  ON lawyers FOR SELECT USING (TRUE);
CREATE POLICY "lawyers_write" ON lawyers FOR ALL    USING (auth.uid() = id);

-- Clients: only self
CREATE POLICY "clients_all" ON clients FOR ALL USING (auth.uid() = id);

-- Appointments: the lawyer or the client of that appointment
CREATE POLICY "appointments_all" ON appointments FOR ALL
  USING (auth.uid() = lawyer_id OR auth.uid() = client_id);

-- Diligences: lawyer or client
CREATE POLICY "diligences_all" ON diligences FOR ALL
  USING (auth.uid() = lawyer_id OR auth.uid() = client_id);

-- Documents: lawyer or client
CREATE POLICY "documents_all" ON documents FOR ALL
  USING (auth.uid() = lawyer_id OR auth.uid() = client_id);

-- Personal events: only owner
CREATE POLICY "personal_events_all" ON personal_events FOR ALL
  USING (auth.uid() = user_id);

-- Conversations: only owner
CREATE POLICY "conversations_all" ON conversations FOR ALL
  USING (auth.uid() = user_id);

-- Tasks: only owner
CREATE POLICY "tasks_all" ON tasks FOR ALL
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE when a new user signs up via Supabase Auth
-- This runs automatically on every signup (email, Google, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- CHAT PERMISSIONS
-- Stores per-channel permission: can the client send messages?
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE chat_permissions (
  channel_id        TEXT        PRIMARY KEY,
  lawyer_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  client_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  client_can_message BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_chat_permissions
  BEFORE UPDATE ON chat_permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE chat_permissions ENABLE ROW LEVEL SECURITY;

-- Lawyer can read and write their own channels
CREATE POLICY "Lawyer manages their chat permissions"
  ON chat_permissions FOR ALL
  USING (auth.uid() = lawyer_id)
  WITH CHECK (auth.uid() = lawyer_id);

-- Client can only read permissions for their channels
CREATE POLICY "Client reads their chat permissions"
  ON chat_permissions FOR SELECT
  USING (auth.uid() = client_id);
