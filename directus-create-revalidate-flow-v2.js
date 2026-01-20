/**
 * Creates a NEW Directus Flow (does not modify existing flows):
 * - Trigger: items.create + items.update on:
 *   - reboot_democracy_blog
 *   - reboot_democracy_weekly_news
 * - Branches by $trigger.collection:
 *   - blog: item-read slug -> sleep 500ms -> POST /api/revalidate { tag: "blog/<slug>" }
 *   - weekly: item-read edition -> sleep 500ms -> POST /api/revalidate { tag: "weekly-news/<edition>" }
 *
 * Requirements:
 * - Node 20+ (repo already specifies this)
 * - .env in repo root containing:
 *   - DIRECTUS_URL
 *   - DIRECTUS_BURNES_AUTH_TOKEN
 *
 * Run:
 *   npm run directus:create-revalidate-flow-v2
 *
 * Optional env overrides:
 * - DIRECTUS_FLOW_NAME
 * - REVALIDATE_URL
 * - BLOG_TAG_PREFIX
 * - WEEKLY_TAG_PREFIX (default "weekly-news")
 */
import dotenv from "dotenv";
import process from "node:process";
import { existsSync } from "node:fs";

// Load .env from CWD (repo root), fallback to script dir.
dotenv.config();
const fallbackEnvPath = new URL("./.env", import.meta.url);
if (!process.env.DIRECTUS_URL && existsSync(fallbackEnvPath)) {
  dotenv.config({ path: fallbackEnvPath });
}

const DIRECTUS_URL = (process.env.DIRECTUS_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_BURNES_AUTH_TOKEN || "";

const FLOW_NAME =
  process.env.DIRECTUS_FLOW_NAME ||
  "Reboot Cache Revalidate (Blog + Weekly News) v2";

const REVALIDATE_URL =
  process.env.REVALIDATE_URL ||
  "https://nuxt-isr--burnesblogtemplate.netlify.app/api/revalidate";

const BLOG_TAG_PREFIX = process.env.BLOG_TAG_PREFIX || "blog";
const WEEKLY_TAG_PREFIX = process.env.WEEKLY_TAG_PREFIX || "weekly-news";

function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env var ${name}`);
}

async function directus(path, { method = "GET", body } = {}) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      `Directus API error ${res.status} ${res.statusText} on ${method} ${path}\n${JSON.stringify(
        json,
        null,
        2
      )}`
    );
  }

  return json;
}

async function createFlow() {
  const created = await directus(`/flows`, {
    method: "POST",
    body: {
      name: FLOW_NAME,
      icon: "bolt",
      status: "active",
      trigger: "event",
      accountability: "all",
      options: {
        type: "action",
        scope: ["items.create", "items.update"],
        collections: ["reboot_democracy_blog", "reboot_democracy_weekly_news"],
      },
    },
  });

  return created.data.id;
}

async function createOperation(flow, op) {
  const created = await directus(`/operations`, {
    method: "POST",
    body: { flow, ...op },
  });
  return created.data.id;
}

async function patchOperation(id, body) {
  await directus(`/operations/${id}`, { method: "PATCH", body });
}

function jsonBodyTag(tagExpression) {
  // Keep as a string; Directus "request" operation will template {{...}} at runtime.
  return `{\n  "tag": "${tagExpression}"\n}`;
}

async function main() {
  mustEnv("DIRECTUS_URL", DIRECTUS_URL);
  mustEnv("DIRECTUS_BURNES_AUTH_TOKEN", DIRECTUS_TOKEN);

  const flowId = await createFlow();

  // get_id (exec)
  const getIdOp = await createOperation(flowId, {
    name: "get_id",
    key: "get_id",
    type: "exec",
    position_x: 35,
    position_y: 2,
    options: {
      code: `module.exports = async function (data) {
  const { event, key, keys, collection } = data.$trigger;
  const id = Array.isArray(keys) && keys.length > 0 ? keys : [key];
  return { key: id, action: event, collection };
};`,
    },
  });

  // Branch: blog vs weekly
  const condBlogOp = await createOperation(flowId, {
    name: "if_blog_collection",
    key: "if_blog_collection",
    type: "condition",
    position_x: 50,
    position_y: 2,
    options: {
      filter: {
        $trigger: {
          collection: { _eq: "reboot_democracy_blog" },
        },
      },
    },
  });

  // Blog chain
  const readBlogOp = await createOperation(flowId, {
    name: "Read Data (Blog)",
    key: "read_data_rebootblog",
    type: "item-read",
    position_x: 5,
    position_y: 21,
    options: {
      permissions: "$full",
      emitEvents: false,
      key: "{{get_id.key[0]}}",
      collection: "reboot_democracy_blog",
      query: { fields: "slug" },
    },
  });

  const sleepBlogOp = await createOperation(flowId, {
    name: "Sleep (Blog)",
    key: "sleep_blog",
    type: "sleep",
    position_x: 25,
    position_y: 20,
    options: { milliseconds: 500 },
  });

  const revalidateBlogOp = await createOperation(flowId, {
    name: "revalidate_blog",
    key: "revalidate_blog",
    type: "request",
    position_x: 46,
    position_y: 21,
    options: {
      method: "POST",
      url: REVALIDATE_URL,
      headers: [{ header: "Content-Type", value: "application/json" }],
      body: jsonBodyTag(`${BLOG_TAG_PREFIX}/{{read_data_rebootblog.slug}}`),
    },
  });

  // Weekly chain
  const readWeeklyOp = await createOperation(flowId, {
    name: "Read Data (Weekly News)",
    key: "read_data_weekly_news",
    type: "item-read",
    position_x: 5,
    position_y: 60,
    options: {
      permissions: "$full",
      emitEvents: false,
      key: "{{get_id.key[0]}}",
      collection: "reboot_democracy_weekly_news",
      query: { fields: "edition" },
    },
  });

  const sleepWeeklyOp = await createOperation(flowId, {
    name: "Sleep (Weekly News)",
    key: "sleep_weekly_news",
    type: "sleep",
    position_x: 25,
    position_y: 60,
    options: { milliseconds: 500 },
  });

  const revalidateWeeklyOp = await createOperation(flowId, {
    name: "revalidate_weekly_news",
    key: "revalidate_weekly_news",
    type: "request",
    position_x: 46,
    position_y: 60,
    options: {
      method: "POST",
      url: REVALIDATE_URL,
      headers: [{ header: "Content-Type", value: "application/json" }],
      body: jsonBodyTag(
        `${WEEKLY_TAG_PREFIX}/{{read_data_weekly_news.edition}}`
      ),
    },
  });

  // Wire up graph
  await patchOperation(getIdOp, { resolve: condBlogOp });
  await patchOperation(condBlogOp, { resolve: readBlogOp, reject: readWeeklyOp });

  await patchOperation(readBlogOp, { resolve: sleepBlogOp });
  await patchOperation(sleepBlogOp, { resolve: revalidateBlogOp });

  await patchOperation(readWeeklyOp, { resolve: sleepWeeklyOp });
  await patchOperation(sleepWeeklyOp, { resolve: revalidateWeeklyOp });

  const adminUrl = `${DIRECTUS_URL}/admin/settings/flows/${flowId}`;
  console.log("Created new Directus flow:", flowId);
  console.log("Open in Directus:", adminUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
