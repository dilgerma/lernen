CREATE TABLE public.processor_dlq (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processor_id TEXT NOT NULL,
    stream_id    TEXT NOT NULL,
    event        JSONB NOT NULL,
    error        TEXT NOT NULL,
    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.player_score (
    minutes_total              INTEGER NOT NULL DEFAULT 0,
    minutes_in_current_doner   INTEGER NOT NULL DEFAULT 0,
    doners_earned              INTEGER NOT NULL DEFAULT 0,
    last_activity_date         TEXT    NOT NULL DEFAULT '',
    minutes_today              INTEGER NOT NULL DEFAULT 0
);
INSERT INTO public.player_score DEFAULT VALUES;

CREATE TABLE public.exercise_results (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id   TEXT        NOT NULL,
    subject       TEXT        NOT NULL,
    filename      TEXT        NOT NULL,
    score_percent INTEGER     NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
    completed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);