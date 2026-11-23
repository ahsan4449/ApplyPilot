import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { randomBytes } from "node:crypto";
import { createApp } from "../src/app.js";
import { applicationInput, matchResume } from "../src/domain.js";
let db, app, alice, bob, id;
const secret = randomBytes(48).toString("hex");
before(async () => {
  db = await MongoMemoryServer.create();
  await mongoose.connect(db.getUri());
  app = createApp({ secret });
  alice = request.agent(app);
  bob = request.agent(app);
});
after(async () => {
  await mongoose.disconnect();
  await db.stop();
});
test("validates actual dates, protocols and rejects unknown fields", () => {
  assert.equal(
    applicationInput.safeParse({
      company: "A",
      role: "B",
      deadline: "2026-02-30",
    }).success,
    false,
  );
  assert.equal(
    applicationInput.safeParse({
      company: "A",
      role: "B",
      url: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    applicationInput.safeParse({ company: "A", role: "B", owner: "forged" })
      .success,
    false,
  );
  assert.equal(
    applicationInput.safeParse({
      company: "A",
      role: "B",
      deadline: "2028-02-29",
    }).success,
    true,
  );
});
test("keyword matching uses boundaries and aliases; handles empty keyword set", () => {
  const result = matchResume(
    "I use JavaScript, React and NodeJS.",
    "Java and React, Node.js and SQL",
  );
  assert.deepEqual(result.matched, ["react", "node.js"]);
  assert.equal(result.score, 50);
  assert.equal(matchResume("JavaScript", "java").score, 0);
  assert.equal(matchResume("anything", "some unrelated words").score, null);
});
test("anonymous clients cannot read applications", async () => {
  await request(app).get("/api/applications").expect(401);
});
test("registers with secure cookie flags and no hash in response", async () => {
  const res = await alice
    .post("/api/auth/register")
    .send({
      name: "Alice",
      email: "alice@example.com",
      password: "passphrase-1234",
    })
    .expect(201);
  assert.equal(res.body.user.email, "alice@example.com");
  assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);
  assert.match(res.headers["set-cookie"][0], /HttpOnly/);
  assert.match(res.headers["set-cookie"][0], /SameSite=Strict/);
  await bob
    .post("/api/auth/register")
    .send({
      name: "Bob",
      email: "bob@example.com",
      password: "passphrase-5678",
    })
    .expect(201);
});
test("rejects duplicate accounts, short passwords and wrong logins", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Alice",
      email: "alice@example.com",
      password: "passphrase-1234",
    })
    .expect(409);
  await request(app)
    .post("/api/auth/register")
    .send({ name: "A", email: "a@example.com", password: "short" })
    .expect(400);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "alice@example.com", password: "wrongpassphrase" })
    .expect(401);
});
test("creates, lists, updates, records history and isolates owners", async () => {
  const res = await alice
    .post("/api/applications")
    .send({
      company: "Test Co",
      role: "Intern",
      status: "Applied",
      deadline: "2027-01-01",
    })
    .expect(201);
  id = res.body.application._id;
  assert.equal(res.body.application.history.length, 1);
  assert.equal(
    (await bob.get("/api/applications").expect(200)).body.applications.length,
    0,
  );
  await bob
    .patch("/api/applications/" + id)
    .send({ status: "Offer" })
    .expect(404);
  await bob.delete("/api/applications/" + id).expect(404);
  const update = await alice
    .patch("/api/applications/" + id)
    .send({ status: "Interview" })
    .expect(200);
  assert.equal(update.body.application.history.length, 2);
  const same = await alice
    .patch("/api/applications/" + id)
    .send({ notes: "A note" })
    .expect(200);
  assert.equal(same.body.application.history.length, 2);
  assert.equal(
    (await alice.get("/api/applications").expect(200)).body.applications.length,
    1,
  );
});
test("rejects forged owner updates and invalid ID", async () => {
  await alice
    .patch("/api/applications/" + id)
    .send({ owner: "forged" })
    .expect(400);
  await alice.delete("/api/applications/not-an-id").expect(400);
});
test("blocks cross-origin writes", async () => {
  await alice
    .post("/api/applications")
    .set("Origin", "https://evil.example")
    .send({ company: "A", role: "B" })
    .expect(403);
});
test("no-key helpers work locally and opt-in fails clearly without a key", async () => {
  const input = {
    kind: "match",
    resume: "I build React and JavaScript applications",
    jobDescription: "React and Node.js developer with SQL required",
  };
  const res = await alice.post("/api/assist").send(input).expect(200);
  assert.equal(res.body.source, "local");
  assert.equal(res.body.score, 33);
  await alice
    .post("/api/assist")
    .send({ ...input, consent: true })
    .expect(503);
  const draft = await alice
    .post("/api/assist")
    .send({ ...input, kind: "followup", company: "Test Co", role: "Engineer" })
    .expect(200);
  assert.match(draft.body.draft, /Test Co/);
});
test("Gemini adapter sends only on consent and handles successful response", async () => {
  let calls = 0;
  const mockApp = createApp({
    secret,
    geminiKey: "test-not-real",
    fetchImpl: async (_url, options) => {
      calls++;
      assert.equal(options.headers["x-goog-api-key"], "test-not-real");
      return {
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: "Focus on project evidence." }] } },
          ],
        }),
      };
    },
  });
  const agent = request.agent(mockApp);
  await agent
    .post("/api/auth/login")
    .send({ email: "alice@example.com", password: "passphrase-1234" })
    .expect(200);
  const input = {
    kind: "match",
    resume: "I build React and JavaScript applications",
    jobDescription: "React developer with SQL and Node.js",
  };
  await agent.post("/api/assist").send(input).expect(200);
  assert.equal(calls, 0);
  const res = await agent
    .post("/api/assist")
    .send({ ...input, consent: true })
    .expect(200);
  assert.equal(calls, 1);
  assert.equal(res.body.source, "gemini");
  assert.equal(res.body.advice, "Focus on project evidence.");
});
test("Gemini quota failure returns actionable error without provider details", async () => {
  const mockApp = createApp({
    secret,
    geminiKey: "test-not-real",
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  const agent = request.agent(mockApp);
  await agent
    .post("/api/auth/login")
    .send({ email: "alice@example.com", password: "passphrase-1234" })
    .expect(200);
  await agent
    .post("/api/assist")
    .send({
      kind: "followup",
      resume: "A real software developer resume",
      jobDescription: "A real software developer description",
      consent: true,
    })
    .expect(502);
});
test("provider timeout and empty output fail clearly", async () => {
  for (const fetchImpl of [
    async () => {
      throw new Error("timeout");
    },
    async () => ({ ok: true, json: async () => ({ candidates: [] }) }),
  ]) {
    const agent = request.agent(
      createApp({ secret, geminiKey: "test-not-real", fetchImpl }),
    );
    await agent
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "passphrase-1234" })
      .expect(200);
    const res = await agent
      .post("/api/assist")
      .send({
        kind: "match",
        resume: "A real software developer resume",
        jobDescription: "A real software developer description",
        consent: true,
      })
      .expect(502);
    assert.equal(res.body.source, undefined);
  }
});
test("rejects placeholder signing secrets", () => {
  assert.throws(
    () => createApp({ secret: "replace-with-at-least-32-random-characters" }),
    /replace the example/,
  );
});
test("deletes own record, logs out and rejects old session", async () => {
  await alice.delete("/api/applications/" + id).expect(200);
  await alice.delete("/api/applications/" + id).expect(404);
  await alice.post("/api/auth/logout").expect(200);
  await alice.get("/api/auth/me").expect(401);
});
