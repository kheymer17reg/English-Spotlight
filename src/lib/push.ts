import "server-only";
import webpush from "web-push";
import { getDb, logError } from "@/lib/db";

export interface PushSubscriptionRow {
  endpoint: string;
  userId: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

let configured: boolean | null = null;

export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:teacher@spotlight.local";
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
    return true;
  } catch (err) {
    void logError("push:setVapidDetails", String(err));
    configured = false;
    return false;
  }
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export function saveSubscription(row: Omit<PushSubscriptionRow, "createdAt">): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO push_subscriptions (endpoint,userId,p256dh,auth,userAgent,createdAt)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(endpoint) DO UPDATE SET
       userId = excluded.userId,
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       userAgent = excluded.userAgent`,
  ).run(row.endpoint, row.userId, row.p256dh, row.auth, row.userAgent, now);
}

export function deleteSubscription(endpoint: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(endpoint);
}

export function listUserSubscriptions(userId: string): PushSubscriptionRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM push_subscriptions WHERE userId = ?`)
    .all(userId) as PushSubscriptionRow[];
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!isPushConfigured()) return 0;
  const subs = listUserSubscriptions(userId);
  if (subs.length === 0) return 0;
  const data = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
          { TTL: 60 * 60 * 24 },
        );
        sent += 1;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          deleteSubscription(s.endpoint);
        } else {
          await logError("push:send", String(err));
        }
      }
    }),
  );
  return sent;
}

export async function sendToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  if (!isPushConfigured() || userIds.length === 0) return 0;
  let total = 0;
  for (const id of userIds) {
    total += await sendToUser(id, payload);
  }
  return total;
}
