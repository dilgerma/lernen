import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ScoreRow } from './Score';

const TABLE = 'player_score';
let tableReady = false;

// Fallback file path when DB is unavailable
const DATA_DIR = join(process.cwd(), 'data');
const SCORE_FILE = join(DATA_DIR, 'score.json');

const DEFAULT_ROW: ScoreRow = {
  minutes_total: 0,
  minutes_in_current_doner: 0,
  doners_earned: 0,
  last_activity_date: '',
  minutes_today: 0,
};

async function isDbAvailable(): Promise<boolean> {
  const url = process.env.SUPABASE_DB_URL;
  return !!(url && url !== 'missing-url');
}

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  const { getKnexInstance } = await import('../../common/db');
  const knex = getKnexInstance();
  const exists = await knex.schema.hasTable(TABLE);
  if (!exists) {
    await knex.schema.createTable(TABLE, t => {
      t.integer('minutes_total').notNullable().defaultTo(0);
      t.integer('minutes_in_current_doner').notNullable().defaultTo(0);
      t.integer('doners_earned').notNullable().defaultTo(0);
      t.string('last_activity_date').notNullable().defaultTo('');
      t.integer('minutes_today').notNullable().defaultTo(0);
    });
    await knex(TABLE).insert(DEFAULT_ROW);
  }
  tableReady = true;
}

async function readFileScore(): Promise<ScoreRow> {
  try {
    const content = await readFile(SCORE_FILE, 'utf-8');
    return JSON.parse(content) as ScoreRow;
  } catch {
    return { ...DEFAULT_ROW };
  }
}

async function writeFileScore(row: ScoreRow): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SCORE_FILE, JSON.stringify(row, null, 2), 'utf-8');
}

function resetDailyIfNeeded(row: ScoreRow): ScoreRow {
  const today = new Date().toISOString().split('T')[0];
  if (row.last_activity_date !== today) {
    return { ...row, minutes_today: 0, last_activity_date: today };
  }
  return row;
}

export async function getScore(): Promise<ScoreRow> {
  const today = new Date().toISOString().split('T')[0];

  if (await isDbAvailable()) {
    try {
      await ensureTable();
      const { getKnexInstance } = await import('../../common/db');
      const knex = getKnexInstance();
      let row = await knex(TABLE).first() as ScoreRow | undefined;
      if (!row) {
        await knex(TABLE).insert(DEFAULT_ROW);
        row = { ...DEFAULT_ROW };
      }
      if (row.last_activity_date !== today) {
        await knex(TABLE).update({ minutes_today: 0, last_activity_date: today });
        row.minutes_today = 0;
        row.last_activity_date = today;
      }
      return row;
    } catch (err) {
      console.error('DB error, falling back to file:', err);
    }
  }

  return resetDailyIfNeeded(await readFileScore());
}

export async function addMinutes(minutes: number): Promise<ScoreRow> {
  const today = new Date().toISOString().split('T')[0];

  if (await isDbAvailable()) {
    try {
      await ensureTable();
      const { getKnexInstance } = await import('../../common/db');
      const knex = getKnexInstance();
      const current = await getScore();
      const todayMin = current.last_activity_date === today
        ? current.minutes_today + minutes
        : minutes;
      await knex(TABLE).update({
        minutes_total: current.minutes_total + minutes,
        minutes_in_current_doner: current.minutes_in_current_doner + minutes,
        minutes_today: todayMin,
        last_activity_date: today,
      });
      return getScore();
    } catch (err) {
      console.error('DB error, falling back to file:', err);
    }
  }

  const row = resetDailyIfNeeded(await readFileScore());
  const updated: ScoreRow = {
    ...row,
    minutes_total: row.minutes_total + minutes,
    minutes_in_current_doner: row.minutes_in_current_doner + minutes,
    minutes_today: row.minutes_today + minutes,
    last_activity_date: today,
  };
  await writeFileScore(updated);
  return updated;
}

export async function resetDoner(): Promise<ScoreRow> {
  if (await isDbAvailable()) {
    try {
      await ensureTable();
      const { getKnexInstance } = await import('../../common/db');
      const knex = getKnexInstance();
      const current = await getScore();
      await knex(TABLE).update({
        minutes_in_current_doner: 0,
        doners_earned: current.doners_earned + 1,
      });
      return getScore();
    } catch (err) {
      console.error('DB error, falling back to file:', err);
    }
  }

  const row = resetDailyIfNeeded(await readFileScore());
  const updated: ScoreRow = {
    ...row,
    minutes_in_current_doner: 0,
    doners_earned: row.doners_earned + 1,
  };
  await writeFileScore(updated);
  return updated;
}
