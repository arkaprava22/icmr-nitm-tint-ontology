import "server-only";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
let database;
function dbPath() {
    return path.join(process.cwd(), ".runtime", "tint-dev.sqlite");
}
function openDatabase() {
    if (database)
        return database;
    mkdirSync(path.dirname(dbPath()), { recursive: true });
    database = new DatabaseSync(dbPath());
    database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, role TEXT NOT NULL,
      system_iri TEXT NOT NULL, verification_status TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS auth_attempts (
      email TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, locked_until TEXT
    );
    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL,
      system_iri TEXT NOT NULL, remedy_name TEXT NOT NULL, target_label TEXT NOT NULL,
      proposed_use TEXT NOT NULL, preparation TEXT NOT NULL, population TEXT NOT NULL,
      safety TEXT NOT NULL, evidence_type TEXT NOT NULL, citation TEXT NOT NULL,
      conflict_disclosure TEXT NOT NULL, status TEXT NOT NULL, graph_iri TEXT NOT NULL UNIQUE,
      entity_iri TEXT NOT NULL, sync_status TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, entity_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL, detail TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, contribution_id TEXT NOT NULL, reviewer_id TEXT NOT NULL,
      outcome TEXT NOT NULL, rationale TEXT NOT NULL, safety_checked INTEGER NOT NULL,
      evidence_checked INTEGER NOT NULL, decided_at TEXT NOT NULL,
      FOREIGN KEY(contribution_id) REFERENCES contributions(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS validation_runs (
      id TEXT PRIMARY KEY, contribution_id TEXT NOT NULL, status TEXT NOT NULL,
      issues_json TEXT NOT NULL, checked_at TEXT NOT NULL,
      FOREIGN KEY(contribution_id) REFERENCES contributions(id)
    );
    CREATE TABLE IF NOT EXISTS contribution_revisions (
      id TEXT PRIMARY KEY, contribution_id TEXT NOT NULL, revision_number INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL, graph_iri TEXT NOT NULL, created_at TEXT NOT NULL,
      created_by TEXT NOT NULL, FOREIGN KEY(contribution_id) REFERENCES contributions(id),
      FOREIGN KEY(created_by) REFERENCES users(id), UNIQUE(contribution_id, revision_number)
    );
    CREATE TABLE IF NOT EXISTS citizen_feedback (
      id TEXT PRIMARY KEY, category TEXT NOT NULL, urgency TEXT NOT NULL,
      related_term TEXT NOT NULL, message TEXT NOT NULL, location TEXT NOT NULL,
      contact TEXT NOT NULL, status TEXT NOT NULL, submitted_at TEXT NOT NULL,
      triaged_at TEXT, triaged_by TEXT, triage_note TEXT,
      FOREIGN KEY(triaged_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS evidence_curation (
      id TEXT PRIMARY KEY, contribution_id TEXT NOT NULL, status TEXT NOT NULL,
      source_type TEXT NOT NULL, source_citation TEXT NOT NULL, curator_note TEXT NOT NULL,
      updated_at TEXT NOT NULL, updated_by TEXT NOT NULL,
      FOREIGN KEY(contribution_id) REFERENCES contributions(id),
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS pilot_validations (
      id TEXT PRIMARY KEY, validator_name TEXT NOT NULL, validator_role TEXT NOT NULL,
      journey TEXT NOT NULL, outcome TEXT NOT NULL, tested_term TEXT NOT NULL,
      notes TEXT NOT NULL, recorded_at TEXT NOT NULL, recorded_by TEXT NOT NULL,
      FOREIGN KEY(recorded_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS pilot_actions (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, owner TEXT NOT NULL, priority TEXT NOT NULL,
      status TEXT NOT NULL, due_date TEXT NOT NULL, source TEXT NOT NULL, note TEXT NOT NULL,
      created_at TEXT NOT NULL, created_by TEXT NOT NULL, updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL, FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS pilot_signoffs (
      id TEXT PRIMARY KEY, decision TEXT NOT NULL, signoff_by TEXT NOT NULL,
      meeting_reference TEXT NOT NULL, conditions TEXT NOT NULL, recommendation TEXT NOT NULL,
      signed_at TEXT NOT NULL, signed_by TEXT NOT NULL, FOREIGN KEY(signed_by) REFERENCES users(id)
    );
  `);
    ensureColumn(database, "contributions", "submitted_at", "TEXT");
    ensureColumn(database, "contributions", "risk_tier", "TEXT NOT NULL DEFAULT 'MODERATE'");
    ensureColumn(database, "contributions", "published_at", "TEXT");
    ensureColumn(database, "contributions", "title_hi", "TEXT");
    ensureColumn(database, "contributions", "validation_status", "TEXT NOT NULL DEFAULT 'NOT_RUN'");
    ensureColumn(database, "contributions", "validated_at", "TEXT");
    ensureColumn(database, "contributions", "current_revision", "INTEGER NOT NULL DEFAULT 1");
    ensureColumn(database, "contributions", "updated_at", "TEXT");
    ensureColumn(database, "validation_runs", "contribution_revision", "INTEGER NOT NULL DEFAULT 1");
    ensureColumn(database, "audit_events", "previous_hash", "TEXT");
    ensureColumn(database, "audit_events", "event_hash", "TEXT");
    backfillAuditChain(database);
    seedPilotPractitioner(database);
    seedPilotReviewer(database);
    seedPilotAdministrator(database);
    return database;
}
function ensureColumn(db, table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((item) => item.name === column))
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
function eventHash(event, previousHash) {
    return createHash("sha256").update(JSON.stringify({ previousHash, id: event.id, userId: event.userId, action: event.action, entityId: event.entityId, occurredAt: event.occurredAt, detail: event.detail })).digest("hex");
}
function verifyAuditChain(db) {
    const events = db.prepare("SELECT id, user_id, action, entity_id, occurred_at, detail, previous_hash, event_hash FROM audit_events ORDER BY rowid").all();
    let previousHash = null;
    for (const row of events) {
        const input = { id: String(row.id), userId: row.user_id, action: String(row.action), entityId: String(row.entity_id), occurredAt: String(row.occurred_at), detail: String(row.detail) };
        const expected = eventHash(input, previousHash);
        if (row.previous_hash !== previousHash || row.event_hash !== expected)
            return { valid: false, count: events.length, brokenAt: input.id };
        previousHash = expected;
    }
    return { valid: true, count: events.length, brokenAt: null };
}
function backfillAuditChain(db) {
    const unhashed = db.prepare("SELECT COUNT(*) AS count FROM audit_events WHERE event_hash IS NULL").get();
    const total = db.prepare("SELECT COUNT(*) AS count FROM audit_events").get();
    if (total.count === 0 || unhashed.count === 0)
        return;
    if (unhashed.count !== total.count)
        return;
    const events = db.prepare("SELECT id, user_id, action, entity_id, occurred_at, detail FROM audit_events ORDER BY rowid").all();
    let previousHash = null;
    for (const row of events) {
        const input = { id: String(row.id), userId: row.user_id, action: String(row.action), entityId: String(row.entity_id), occurredAt: String(row.occurred_at), detail: String(row.detail) };
        const hash = eventHash(input, previousHash);
        db.prepare("UPDATE audit_events SET previous_hash = ?, event_hash = ? WHERE id = ?").run(previousHash, hash, input.id);
        previousHash = hash;
    }
}
function appendAuditEvent(db, input) {
    const integrity = verifyAuditChain(db);
    if (!integrity.valid)
        throw new Error(`Audit chain integrity failure at ${integrity.brokenAt}.`);
    const latest = db.prepare("SELECT event_hash FROM audit_events ORDER BY rowid DESC LIMIT 1").get();
    const event = { id: randomUUID(), ...input };
    const previousHash = latest?.event_hash ?? null;
    const hash = eventHash(event, previousHash);
    db.prepare("INSERT INTO audit_events (id, user_id, action, entity_id, occurred_at, detail, previous_hash, event_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(event.id, event.userId, event.action, event.entityId, event.occurredAt, event.detail, previousHash, hash);
}
function passwordDigest(password, salt) {
    return scryptSync(password, salt, 64).toString("hex");
}
function seedPilotPractitioner(db) {
    const email = (process.env.DEV_PRACTITIONER_EMAIL ?? "pilot-practitioner@tint.local").toLowerCase();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing)
        return;
    const salt = randomBytes(16).toString("hex");
    db.prepare(`INSERT INTO users
    (id, email, display_name, password_hash, password_salt, role, system_iri, verification_status, created_at)
    VALUES (?, ?, ?, ?, ?, 'PRACTITIONER', ?, 'VERIFIED', ?)`)
        .run("pilot-practitioner-01", email, "Pilot Practitioner", passwordDigest(process.env.DEV_PRACTITIONER_PASSWORD ?? "TintPilot!2026", salt), salt, "https://w3id.org/tint/ontology/ayurveda", new Date().toISOString());
}
function seedPilotReviewer(db) {
    const email = (process.env.DEV_REVIEWER_EMAIL ?? "pilot-reviewer@tint.local").toLowerCase();
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
        return;
    const salt = randomBytes(16).toString("hex");
    db.prepare(`INSERT INTO users
    (id, email, display_name, password_hash, password_salt, role, system_iri, verification_status, created_at)
    VALUES (?, ?, ?, ?, ?, 'REVIEWER', ?, 'VERIFIED', ?)`)
        .run("pilot-reviewer-01", email, "Pilot Clinical Reviewer", passwordDigest(process.env.DEV_REVIEWER_PASSWORD ?? "TintReview!2026", salt), salt, "https://w3id.org/tint/ontology/ayurveda", new Date().toISOString());
}
function seedPilotAdministrator(db) {
    const email = (process.env.DEV_ADMIN_EMAIL ?? "pilot-admin@tint.local").toLowerCase();
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
        return;
    const salt = randomBytes(16).toString("hex");
    db.prepare(`INSERT INTO users
    (id, email, display_name, password_hash, password_salt, role, system_iri, verification_status, created_at)
    VALUES (?, ?, ?, ?, ?, 'ADMINISTRATOR', ?, 'VERIFIED', ?)`)
        .run("pilot-admin-01", email, "Pilot Publication Administrator", passwordDigest(process.env.DEV_ADMIN_PASSWORD ?? "TintPublish!2026", salt), salt, "https://w3id.org/tint/ontology/editorialAdministration", new Date().toISOString());
}
function mapUser(row) {
    return {
        id: String(row.id), email: String(row.email), displayName: String(row.display_name),
        role: String(row.role), systemIri: String(row.system_iri), verificationStatus: String(row.verification_status),
    };
}
export function authenticatePortalUser(emailInput, password, role) {
    const db = openDatabase();
    const email = emailInput.trim().toLowerCase();
    const attempt = db.prepare("SELECT failures, locked_until FROM auth_attempts WHERE email = ?").get(email);
    if (attempt?.locked_until && new Date(String(attempt.locked_until)) > new Date())
        return null;
    const row = db.prepare("SELECT * FROM users WHERE email = ? AND role = ?").get(email, role);
    const valid = row ? timingSafeEqual(Buffer.from(passwordDigest(password, String(row.password_salt)), "hex"), Buffer.from(String(row.password_hash), "hex")) : false;
    if (!valid) {
        const failures = Number(attempt?.failures ?? 0) + 1;
        const lockedUntil = failures >= 5 ? new Date(Date.now() + 5 * 60_000).toISOString() : null;
        db.prepare(`INSERT INTO auth_attempts (email, failures, locked_until) VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET failures = excluded.failures, locked_until = excluded.locked_until`).run(email, failures, lockedUntil);
        return null;
    }
    db.prepare("DELETE FROM auth_attempts WHERE email = ?").run(email);
    return mapUser(row);
}
export const authenticatePractitioner = (email, password) => authenticatePortalUser(email, password, "PRACTITIONER");
const tokenHash = (token) => createHash("sha256").update(token).digest("hex");
export function createPractitionerSession(userId) {
    const db = openDatabase();
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 8 * 60 * 60_000);
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
        .run(tokenHash(token), userId, expiresAt.toISOString(), new Date().toISOString());
    return { token, expiresAt };
}
export function findPractitionerBySession(token) {
    const db = openDatabase();
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
    const row = db.prepare(`SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?`).get(tokenHash(token), new Date().toISOString());
    return row ? mapUser(row) : null;
}
export function deletePractitionerSession(token) {
    openDatabase().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
}
export function createDraftContribution(userId, input, submissionPrefix) {
    const db = openDatabase();
    const id = `contribution-${randomUUID()}`;
    const graphIri = `${submissionPrefix}${id}`;
    const entityIri = `https://w3id.org/tint/data/submissions/${id}/claim`;
    const createdAt = new Date().toISOString();
    db.prepare(`INSERT INTO contributions
    (id, user_id, kind, title, title_hi, system_iri, remedy_name, target_label, proposed_use, preparation,
     population, safety, evidence_type, citation, conflict_disclosure, status, graph_iri, entity_iri, sync_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, 'pending', ?)`)
        .run(id, userId, input.kind, input.title, input.titleHi, input.systemIri, input.remedyName, input.targetLabel, input.proposedUse, input.preparation, input.population, input.safety, input.evidenceType, input.citation, input.conflictDisclosure, graphIri, entityIri, createdAt);
    appendAuditEvent(db, { userId, action: "CREATE_DRAFT", entityId: id, occurredAt: createdAt, detail: JSON.stringify({ graphIri }) });
    return { id, userId, ...input, status: "DRAFT", graphIri, entityIri, syncStatus: "pending", createdAt };
}
export function updateContributionSync(id, status) {
    openDatabase().prepare("UPDATE contributions SET sync_status = ? WHERE id = ?").run(status, id);
}
export function listPractitionerContributions(userId) {
    return openDatabase().prepare(`SELECT contributions.id, title, kind, contributions.status, sync_status, graph_iri, created_at, submitted_at, risk_tier, validation_status, validated_at, current_revision,
      (SELECT issues_json FROM validation_runs WHERE contribution_id = contributions.id ORDER BY checked_at DESC LIMIT 1) AS validation_issues
    FROM contributions WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
}
export function submitContribution(userId, contributionId) {
    const db = openDatabase();
    const contribution = db.prepare("SELECT id, status, sync_status, validation_status FROM contributions WHERE id = ? AND user_id = ?").get(contributionId, userId);
    if (!contribution || contribution.status !== "DRAFT" || contribution.sync_status !== "synced" || contribution.validation_status !== "PASSED")
        return false;
    const submittedAt = new Date().toISOString();
    db.prepare("UPDATE contributions SET status = 'SUBMITTED', submitted_at = ? WHERE id = ?").run(submittedAt, contributionId);
    appendAuditEvent(db, { userId, action: "SUBMIT_FOR_REVIEW", entityId: contributionId, occurredAt: submittedAt, detail: JSON.stringify({ previousStatus: "DRAFT", status: "SUBMITTED" }) });
    return true;
}
export function listReviewQueue() {
    return openDatabase().prepare(`SELECT contributions.*, users.display_name AS contributor_name
    FROM contributions JOIN users ON users.id = contributions.user_id
    WHERE contributions.status IN ('SUBMITTED', 'UNDER_REVIEW') ORDER BY contributions.submitted_at ASC`).all();
}
export function getContributionForReview(contributionId) {
    return openDatabase().prepare(`SELECT contributions.*, users.display_name AS contributor_name
    FROM contributions JOIN users ON users.id = contributions.user_id WHERE contributions.id = ?`).get(contributionId);
}
export function recordReviewDecision(input) {
    const db = openDatabase();
    const contribution = db.prepare("SELECT id, user_id, status, validation_status FROM contributions WHERE id = ?").get(input.contributionId);
    if (!contribution || contribution.validation_status !== "PASSED" || !["SUBMITTED", "UNDER_REVIEW"].includes(String(contribution.status)) || contribution.user_id === input.reviewerId)
        return false;
    const status = input.outcome === "APPROVE" ? "APPROVED" : input.outcome === "REQUEST_CHANGES" ? "CHANGES_REQUESTED" : "REJECTED";
    const decidedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
        db.prepare(`INSERT INTO reviews (id, contribution_id, reviewer_id, outcome, rationale, safety_checked, evidence_checked, decided_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), input.contributionId, input.reviewerId, input.outcome, input.rationale, input.safetyChecked ? 1 : 0, input.evidenceChecked ? 1 : 0, decidedAt);
        db.prepare("UPDATE contributions SET status = ? WHERE id = ?").run(status, input.contributionId);
        appendAuditEvent(db, { userId: input.reviewerId, action: "REVIEW_DECISION", entityId: input.contributionId, occurredAt: decidedAt, detail: JSON.stringify({ outcome: input.outcome, status }) });
        db.exec("COMMIT");
        return true;
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function listPublicationQueue() {
    return openDatabase().prepare(`SELECT contributions.*, users.display_name AS contributor_name,
      reviews.rationale AS review_rationale, reviewers.display_name AS reviewer_name, reviews.decided_at
    FROM contributions
    JOIN users ON users.id = contributions.user_id
    JOIN reviews ON reviews.contribution_id = contributions.id AND reviews.outcome = 'APPROVE'
    JOIN users reviewers ON reviewers.id = reviews.reviewer_id
    WHERE contributions.status = 'APPROVED' ORDER BY reviews.decided_at ASC`).all();
}
export function getApprovedContribution(contributionId) {
    return openDatabase().prepare("SELECT * FROM contributions WHERE id = ? AND status = 'APPROVED' AND sync_status = 'synced' AND validation_status = 'PASSED'").get(contributionId);
}
export function recordValidationResult(contributionId, issues) {
    const db = openDatabase();
    const checkedAt = new Date().toISOString();
    const status = issues.length === 0 ? "PASSED" : "FAILED";
    db.exec("BEGIN IMMEDIATE");
    try {
        const contribution = db.prepare("SELECT current_revision FROM contributions WHERE id = ?").get(contributionId);
        if (!contribution)
            throw new Error("Contribution not found for validation.");
        db.prepare("INSERT INTO validation_runs (id, contribution_id, status, issues_json, checked_at, contribution_revision) VALUES (?, ?, ?, ?, ?, ?)")
            .run(randomUUID(), contributionId, status, JSON.stringify(issues), checkedAt, contribution.current_revision);
        db.prepare("UPDATE contributions SET validation_status = ?, validated_at = ? WHERE id = ?").run(status, checkedAt, contributionId);
        appendAuditEvent(db, { userId: null, action: "AUTOMATED_VALIDATION", entityId: contributionId, occurredAt: checkedAt, detail: JSON.stringify({ status, issueCount: issues.length }) });
        db.exec("COMMIT");
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
    return { status, checkedAt };
}
export function getLatestValidation(contributionId) {
    const row = openDatabase().prepare("SELECT status, issues_json, checked_at FROM validation_runs WHERE contribution_id = ? ORDER BY checked_at DESC LIMIT 1").get(contributionId);
    return row ? { status: row.status, issues: JSON.parse(row.issues_json), checkedAt: row.checked_at } : null;
}
export function getEditableContribution(userId, contributionId) {
    return openDatabase().prepare(`SELECT contributions.*,
      (SELECT rationale FROM reviews WHERE contribution_id = contributions.id AND outcome = 'REQUEST_CHANGES' ORDER BY decided_at DESC LIMIT 1) AS change_request
    FROM contributions WHERE id = ? AND user_id = ? AND status IN ('DRAFT', 'CHANGES_REQUESTED')`).get(contributionId, userId);
}
export function reviseContribution(userId, contributionId, input, submissionPrefix) {
    const db = openDatabase();
    const current = db.prepare("SELECT * FROM contributions WHERE id = ? AND user_id = ? AND status IN ('DRAFT', 'CHANGES_REQUESTED')").get(contributionId, userId);
    if (!current)
        return null;
    const currentRevision = Number(current.current_revision ?? 1);
    const nextRevision = currentRevision + 1;
    const nextGraphIri = `${submissionPrefix}${contributionId}/revision-${nextRevision}`;
    const updatedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
        db.prepare(`INSERT INTO contribution_revisions
      (id, contribution_id, revision_number, snapshot_json, graph_iri, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), contributionId, currentRevision, JSON.stringify(current), String(current.graph_iri), updatedAt, userId);
        db.prepare(`UPDATE contributions SET kind = ?, title = ?, title_hi = ?, system_iri = ?, remedy_name = ?, target_label = ?, proposed_use = ?,
      preparation = ?, population = ?, safety = ?, evidence_type = ?, citation = ?, conflict_disclosure = ?, status = 'DRAFT',
      graph_iri = ?, sync_status = 'pending', validation_status = 'NOT_RUN', validated_at = NULL, submitted_at = NULL,
      current_revision = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
            .run(input.kind, input.title, input.titleHi, input.systemIri, input.remedyName, input.targetLabel, input.proposedUse, input.preparation, input.population, input.safety, input.evidenceType, input.citation, input.conflictDisclosure, nextGraphIri, nextRevision, updatedAt, contributionId, userId);
        appendAuditEvent(db, { userId, action: "REVISE_CONTRIBUTION", entityId: contributionId, occurredAt: updatedAt, detail: JSON.stringify({ previousRevision: currentRevision, revision: nextRevision, previousGraphIri: current.graph_iri, graphIri: nextGraphIri }) });
        db.exec("COMMIT");
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
    return { id: contributionId, userId, ...input, status: "DRAFT", graphIri: nextGraphIri, entityIri: String(current.entity_iri), syncStatus: "pending", createdAt: String(current.created_at), currentRevision: nextRevision };
}
export function contributionRevisionHistory(userId, contributionId) {
    const owned = openDatabase().prepare("SELECT id, current_revision, graph_iri, updated_at, created_at FROM contributions WHERE id = ? AND user_id = ?").get(contributionId, userId);
    if (!owned)
        return null;
    const previous = openDatabase().prepare("SELECT revision_number, graph_iri, created_at FROM contribution_revisions WHERE contribution_id = ? ORDER BY revision_number DESC").all(contributionId);
    return { current: owned, previous };
}
export function getPublicationCandidate(contributionId) {
    return openDatabase().prepare(`SELECT contributions.*, users.display_name AS contributor_name,
      reviews.rationale AS review_rationale, reviewers.display_name AS reviewer_name, reviews.decided_at
    FROM contributions
    JOIN users ON users.id = contributions.user_id
    JOIN reviews ON reviews.contribution_id = contributions.id AND reviews.outcome = 'APPROVE'
    JOIN users reviewers ON reviewers.id = reviews.reviewer_id
    WHERE contributions.id = ? AND contributions.status = 'APPROVED'`).get(contributionId);
}
export function finalizeContributionPublication(contributionId, administratorId, publicationNote) {
    const db = openDatabase();
    const publishedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
        const result = db.prepare("UPDATE contributions SET status = 'PUBLISHED', published_at = ? WHERE id = ? AND status = 'APPROVED'").run(publishedAt, contributionId);
        if (result.changes !== 1) {
            db.exec("ROLLBACK");
            return false;
        }
        appendAuditEvent(db, { userId: administratorId, action: "PUBLISH_CONTRIBUTION", entityId: contributionId, occurredAt: publishedAt, detail: JSON.stringify({ status: "PUBLISHED", publicationNote }) });
        db.exec("COMMIT");
        return true;
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function publicationSummary() {
    const db = openDatabase();
    const row = db.prepare(`SELECT
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
    SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) AS published
    FROM contributions`).get();
    return { approved: Number(row.approved ?? 0), published: Number(row.published ?? 0) };
}
export function workflowStoreStatus() {
    try {
        const db = openDatabase();
        const contributions = db.prepare("SELECT COUNT(*) AS count FROM contributions").get();
        const revisions = db.prepare("SELECT COUNT(*) AS count FROM contribution_revisions").get();
        return { status: "available", adapter: "sqlite-development", contributions: Number(contributions.count), preservedRevisions: Number(revisions.count) };
    }
    catch {
        return { status: "unavailable", adapter: "sqlite-development", contributions: 0, preservedRevisions: 0 };
    }
}
export function auditIntegrityStatus() {
    const result = verifyAuditChain(openDatabase());
    return { ...result, checkedAt: new Date().toISOString() };
}
export function listAuditEvents(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
    return openDatabase().prepare(`SELECT audit_events.id, audit_events.user_id, audit_events.action, audit_events.entity_id,
      audit_events.occurred_at, audit_events.detail, audit_events.previous_hash, audit_events.event_hash,
      users.display_name AS actor_name, contributions.title AS entity_title
    FROM audit_events
    LEFT JOIN users ON users.id = audit_events.user_id
    LEFT JOIN contributions ON contributions.id = audit_events.entity_id
    ORDER BY audit_events.rowid DESC LIMIT ?`).all(safeLimit);
}
export function contributionTimeline(userId, contributionId) {
    const owned = openDatabase().prepare("SELECT id FROM contributions WHERE id = ? AND user_id = ?").get(contributionId, userId);
    if (!owned)
        return null;
    return openDatabase().prepare(`SELECT audit_events.action, audit_events.occurred_at, audit_events.detail,
      audit_events.event_hash, users.display_name AS actor_name
    FROM audit_events LEFT JOIN users ON users.id = audit_events.user_id
    WHERE audit_events.entity_id = ? ORDER BY audit_events.rowid DESC`).all(contributionId);
}
export function createCitizenFeedback(input) {
    const db = openDatabase();
    const submittedAt = new Date().toISOString();
    const id = `feedback-${randomUUID()}`;
    db.prepare(`INSERT INTO citizen_feedback
    (id, category, urgency, related_term, message, location, contact, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?)`)
        .run(id, input.category, input.urgency, input.relatedTerm, input.message, input.location, input.contact, submittedAt);
    appendAuditEvent(db, { userId: null, action: "CITIZEN_FEEDBACK_SUBMITTED", entityId: id, occurredAt: submittedAt, detail: JSON.stringify({ category: input.category, urgency: input.urgency, relatedTerm: input.relatedTerm }) });
    return { id, submittedAt };
}
export function listCitizenFeedback(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
    return openDatabase().prepare(`SELECT citizen_feedback.*, users.display_name AS triaged_by_name
    FROM citizen_feedback LEFT JOIN users ON users.id = citizen_feedback.triaged_by
    ORDER BY CASE status WHEN 'NEW' THEN 0 WHEN 'IN_TRIAGE' THEN 1 ELSE 2 END,
      CASE urgency WHEN 'SAFETY_REVIEW' THEN 0 ELSE 1 END, submitted_at DESC
    LIMIT ?`).all(safeLimit);
}
export function feedbackSummary() {
    const row = openDatabase().prepare(`SELECT
    SUM(CASE WHEN status IN ('NEW', 'IN_TRIAGE') THEN 1 ELSE 0 END) AS open,
    SUM(CASE WHEN urgency = 'SAFETY_REVIEW' AND status IN ('NEW', 'IN_TRIAGE') THEN 1 ELSE 0 END) AS safetyReview,
    SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved
    FROM citizen_feedback`).get();
    return { open: Number(row.open ?? 0), safetyReview: Number(row.safetyReview ?? 0), resolved: Number(row.resolved ?? 0) };
}
export function triageCitizenFeedback(input) {
    const db = openDatabase();
    const triagedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
        const result = db.prepare(`UPDATE citizen_feedback
      SET status = ?, triaged_at = ?, triaged_by = ?, triage_note = ?
      WHERE id = ? AND status IN ('NEW', 'IN_TRIAGE')`)
            .run(input.status, triagedAt, input.administratorId, input.note, input.id);
        if (result.changes !== 1) {
            db.exec("ROLLBACK");
            return false;
        }
        appendAuditEvent(db, { userId: input.administratorId, action: "CITIZEN_FEEDBACK_TRIAGED", entityId: input.id, occurredAt: triagedAt, detail: JSON.stringify({ status: input.status }) });
        db.exec("COMMIT");
        return true;
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
function countRows(query) {
    const row = openDatabase().prepare(query).get();
    return Number(row.count ?? 0);
}
function ontologyLocalName(iri) {
    return iri.split(/[\/#]/).filter(Boolean).at(-1)?.replaceAll(/([a-z])([A-Z])/g, "$1 $2") ?? iri;
}
export function governanceAnalytics() {
    const db = openDatabase();
    const workflow = db.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) AS draft,
    SUM(CASE WHEN status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) AS submitted,
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
    SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) AS published,
    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
    SUM(CASE WHEN status = 'CHANGES_REQUESTED' THEN 1 ELSE 0 END) AS changesRequested
    FROM contributions`).get();
    const validation = db.prepare(`SELECT
    SUM(CASE WHEN validation_status = 'PASSED' THEN 1 ELSE 0 END) AS passed,
    SUM(CASE WHEN validation_status = 'FAILED' THEN 1 ELSE 0 END) AS failed,
    SUM(CASE WHEN validation_status = 'NOT_RUN' THEN 1 ELSE 0 END) AS notRun
    FROM contributions`).get();
    const feedback = db.prepare(`SELECT
    SUM(CASE WHEN status IN ('NEW', 'IN_TRIAGE') THEN 1 ELSE 0 END) AS open,
    SUM(CASE WHEN urgency = 'SAFETY_REVIEW' AND status IN ('NEW', 'IN_TRIAGE') THEN 1 ELSE 0 END) AS safetyReview,
    SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN status = 'DISMISSED' THEN 1 ELSE 0 END) AS dismissed
    FROM citizen_feedback`).get();
    const review = db.prepare(`SELECT
    COUNT(*) AS decisions,
    SUM(CASE WHEN outcome = 'APPROVE' THEN 1 ELSE 0 END) AS approvals,
    SUM(CASE WHEN outcome = 'REQUEST_CHANGES' THEN 1 ELSE 0 END) AS changeRequests,
    SUM(CASE WHEN outcome = 'REJECT' THEN 1 ELSE 0 END) AS rejections
    FROM reviews`).get();
    const systemCoverage = db.prepare(`SELECT system_iri AS systemIri, COUNT(*) AS count
    FROM contributions GROUP BY system_iri ORDER BY count DESC, system_iri ASC LIMIT 8`).all();
    const safetySignals = db.prepare(`SELECT urgency AS label, COUNT(*) AS count
    FROM citizen_feedback GROUP BY urgency ORDER BY count DESC, urgency ASC`).all();
    const evidenceCoverage = db.prepare(`SELECT evidence_type AS label, COUNT(*) AS count
    FROM contributions GROUP BY evidence_type ORDER BY count DESC, evidence_type ASC LIMIT 8`).all();
    const integrity = verifyAuditChain(db);
    const latest = db.prepare("SELECT event_hash FROM audit_events ORDER BY rowid DESC LIMIT 1").get();
    return {
        workflow: {
            total: Number(workflow.total ?? 0),
            draft: Number(workflow.draft ?? 0),
            submitted: Number(workflow.submitted ?? 0),
            approved: Number(workflow.approved ?? 0),
            published: Number(workflow.published ?? 0),
            rejected: Number(workflow.rejected ?? 0),
            changesRequested: Number(workflow.changesRequested ?? 0),
        },
        validation: {
            passed: Number(validation.passed ?? 0),
            failed: Number(validation.failed ?? 0),
            notRun: Number(validation.notRun ?? 0),
        },
        feedback: {
            open: Number(feedback.open ?? 0),
            safetyReview: Number(feedback.safetyReview ?? 0),
            resolved: Number(feedback.resolved ?? 0),
            dismissed: Number(feedback.dismissed ?? 0),
        },
        review: {
            pending: countRows("SELECT COUNT(*) AS count FROM contributions WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')"),
            decisions: Number(review.decisions ?? 0),
            approvals: Number(review.approvals ?? 0),
            changeRequests: Number(review.changeRequests ?? 0),
            rejections: Number(review.rejections ?? 0),
        },
        audit: { valid: integrity.valid, events: integrity.count, latestHash: latest?.event_hash ?? null },
        systemCoverage: systemCoverage.map((item) => ({ ...item, label: ontologyLocalName(item.systemIri) })),
        safetySignals,
        evidenceCoverage,
    };
}
function evidencePriority(row) {
    const evidenceType = String(row.evidence_type ?? "");
    const citation = String(row.citation ?? "").trim();
    const safety = String(row.safety ?? "");
    if (evidenceType === "PRACTITIONER_KNOWLEDGE")
        return "High";
    if (citation.length < 40)
        return "High";
    if (/\b(pregnan|child|allergy|interaction|contraindication|severe|toxicity|poison)\b/i.test(safety))
        return "Medium";
    if (evidenceType === "OTHER")
        return "Medium";
    return "Routine";
}
export function listEvidenceCurationQueue(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
    const rows = openDatabase().prepare(`SELECT contributions.*, users.display_name AS contributor_name,
      latest.status AS curation_status, latest.source_type AS curation_source_type,
      latest.source_citation AS curation_source_citation, latest.curator_note AS curation_note,
      latest.updated_at AS curation_updated_at, curators.display_name AS curator_name
    FROM contributions
    JOIN users ON users.id = contributions.user_id
    LEFT JOIN evidence_curation latest ON latest.id = (
      SELECT id FROM evidence_curation WHERE contribution_id = contributions.id ORDER BY updated_at DESC LIMIT 1
    )
    LEFT JOIN users curators ON curators.id = latest.updated_by
    WHERE contributions.status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED')
    ORDER BY CASE COALESCE(latest.status, 'NEEDS_SOURCE')
      WHEN 'NEEDS_SOURCE' THEN 0 WHEN 'SOURCE_IDENTIFIED' THEN 1 WHEN 'READY_FOR_REVIEW' THEN 2 ELSE 3 END,
      contributions.created_at DESC
    LIMIT ?`).all(safeLimit);
    return rows.map((row) => ({ ...row, evidence_priority: evidencePriority(row) }));
}
export function evidenceCurationSummary() {
    const db = openDatabase();
    const total = db.prepare("SELECT COUNT(*) AS count FROM contributions").get();
    const practitionerOnly = db.prepare("SELECT COUNT(*) AS count FROM contributions WHERE evidence_type = 'PRACTITIONER_KNOWLEDGE'").get();
    const weakCitation = db.prepare("SELECT COUNT(*) AS count FROM contributions WHERE LENGTH(TRIM(citation)) < 40").get();
    const ready = db.prepare(`SELECT COUNT(DISTINCT contribution_id) AS count
    FROM evidence_curation WHERE status = 'READY_FOR_REVIEW'`).get();
    return {
        total: Number(total.count ?? 0),
        practitionerOnly: Number(practitionerOnly.count ?? 0),
        weakCitation: Number(weakCitation.count ?? 0),
        readyForReview: Number(ready.count ?? 0),
    };
}
export function pilotReadinessSnapshot() {
    const analytics = governanceAnalytics();
    const publication = publicationSummary();
    const feedback = feedbackSummary();
    const evidence = evidenceCurationSummary();
    const audit = auditIntegrityStatus();
    const gates = [
        {
            id: "audit-integrity",
            label: "Audit integrity",
            status: audit.valid ? "READY" : "BLOCKED",
            summary: audit.valid ? `${audit.count} workflow events verified` : "Audit chain needs administrator review",
            detail: audit.valid ? "Pilot validators can trace contribution, review, publication, feedback, and evidence events." : `The chain breaks at ${audit.brokenAt ?? "an unknown event"}. Resolve before formal validation.`,
            href: "/admin/audit",
        },
        {
            id: "validation-readiness",
            label: "Validation readiness",
            status: analytics.validation.failed > 0 ? "BLOCKED" : analytics.validation.notRun > 0 ? "ATTENTION" : "READY",
            summary: `${analytics.validation.passed} passed, ${analytics.validation.failed} failed, ${analytics.validation.notRun} not run`,
            detail: analytics.validation.failed > 0 ? "Failed ontology checks must be corrected before pilot publication." : "Automated gates protect review and publication from incomplete records.",
            href: "/admin/analytics",
        },
        {
            id: "publication-baseline",
            label: "Publication baseline",
            status: publication.published > 0 ? "READY" : "ATTENTION",
            summary: `${publication.published} published, ${publication.approved} approved`,
            detail: publication.published > 0 ? "A published sample is available for public search and stakeholder walkthroughs." : "Publish at least one approved sample so validators can test the end-to-end public experience.",
            href: "/admin",
        },
        {
            id: "safety-triage",
            label: "Safety triage",
            status: feedback.safetyReview > 0 ? "BLOCKED" : feedback.open > 0 ? "ATTENTION" : "READY",
            summary: `${feedback.safetyReview} safety review, ${feedback.open} open feedback`,
            detail: feedback.safetyReview > 0 ? "Open safety items should be reviewed before inviting wider pilot use." : "Citizen feedback has a visible triage route for safety and quality signals.",
            href: "/admin/feedback",
        },
        {
            id: "evidence-strengthening",
            label: "Evidence strengthening",
            status: evidence.total === 0 || evidence.weakCitation > 0 || evidence.practitionerOnly > 0 ? "ATTENTION" : "READY",
            summary: `${evidence.readyForReview} ready, ${evidence.weakCitation} weak citations`,
            detail: evidence.total === 0 ? "Seed or approve a small sample before external validation." : "Prioritize practitioner-only records and weak citations for curation before scale-up.",
            href: "/admin/evidence",
        },
        {
            id: "review-capacity",
            label: "Review capacity",
            status: analytics.review.pending > 0 ? "ATTENTION" : analytics.review.decisions > 0 ? "READY" : "ATTENTION",
            summary: `${analytics.review.pending} pending, ${analytics.review.decisions} decisions`,
            detail: analytics.review.decisions > 0 ? "Reviewer decisions are being captured for pilot governance." : "Record at least one reviewer decision to prove the moderation flow.",
            href: "/admin/analytics",
        },
    ];
    const ready = gates.filter((gate) => gate.status === "READY").length;
    const attention = gates.filter((gate) => gate.status === "ATTENTION").length;
    const blocked = gates.filter((gate) => gate.status === "BLOCKED").length;
    return { status: blocked > 0 ? "BLOCKED" : attention > 0 ? "ATTENTION" : "READY", ready, attention, blocked, generatedAt: new Date().toISOString(), gates };
}
export function recordEvidenceCuration(input) {
    const db = openDatabase();
    const contribution = db.prepare("SELECT id FROM contributions WHERE id = ?").get(input.contributionId);
    if (!contribution)
        return false;
    const updatedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
        db.prepare(`INSERT INTO evidence_curation
      (id, contribution_id, status, source_type, source_citation, curator_note, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(randomUUID(), input.contributionId, input.status, input.sourceType, input.sourceCitation, input.curatorNote, updatedAt, input.administratorId);
        appendAuditEvent(db, { userId: input.administratorId, action: "EVIDENCE_CURATION_UPDATED", entityId: input.contributionId, occurredAt: updatedAt, detail: JSON.stringify({ status: input.status, sourceType: input.sourceType }) });
        db.exec("COMMIT");
        return true;
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function recordPilotValidation(input) {
    const db = openDatabase();
    const recordedAt = new Date().toISOString();
    const id = `pilot-${randomUUID()}`;
    db.exec("BEGIN IMMEDIATE");
    try {
        db.prepare(`INSERT INTO pilot_validations
      (id, validator_name, validator_role, journey, outcome, tested_term, notes, recorded_at, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(id, input.validatorName, input.validatorRole, input.journey, input.outcome, input.testedTerm, input.notes, recordedAt, input.administratorId);
        appendAuditEvent(db, { userId: input.administratorId, action: "PILOT_VALIDATION_RECORDED", entityId: id, occurredAt: recordedAt, detail: JSON.stringify({ validatorRole: input.validatorRole, journey: input.journey, outcome: input.outcome, testedTerm: input.testedTerm }) });
        db.exec("COMMIT");
        return { id, recordedAt };
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function listPilotValidations(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
    return openDatabase().prepare(`SELECT pilot_validations.*, users.display_name AS recorded_by_name
    FROM pilot_validations JOIN users ON users.id = pilot_validations.recorded_by
    ORDER BY recorded_at DESC LIMIT ?`).all(safeLimit);
}
export function pilotValidationSummary() {
    const row = openDatabase().prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN outcome = 'PASS' THEN 1 ELSE 0 END) AS passed,
    SUM(CASE WHEN outcome = 'PASS_WITH_CHANGES' THEN 1 ELSE 0 END) AS changes,
    SUM(CASE WHEN outcome = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked
    FROM pilot_validations`).get();
    return {
        total: Number(row.total ?? 0),
        passed: Number(row.passed ?? 0),
        changes: Number(row.changes ?? 0),
        blocked: Number(row.blocked ?? 0),
    };
}
export function recordPilotAction(input) {
    const db = openDatabase();
    const createdAt = new Date().toISOString();
    const id = `pilot-action-${randomUUID()}`;
    db.exec("BEGIN IMMEDIATE");
    try {
        db.prepare(`INSERT INTO pilot_actions
      (id, title, owner, priority, status, due_date, source, note, created_at, created_by, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(id, input.title, input.owner, input.priority, input.status, input.dueDate, input.source, input.note, createdAt, input.administratorId, createdAt, input.administratorId);
        appendAuditEvent(db, { userId: input.administratorId, action: "PILOT_ACTION_RECORDED", entityId: id, occurredAt: createdAt, detail: JSON.stringify({ priority: input.priority, status: input.status, source: input.source }) });
        db.exec("COMMIT");
        return { id, createdAt };
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function updatePilotAction(input) {
    const db = openDatabase();
    const updatedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
        const result = db.prepare("UPDATE pilot_actions SET status = ?, note = ?, updated_at = ?, updated_by = ? WHERE id = ?")
            .run(input.status, input.note, updatedAt, input.administratorId, input.id);
        if (result.changes !== 1) {
            db.exec("ROLLBACK");
            return false;
        }
        appendAuditEvent(db, { userId: input.administratorId, action: "PILOT_ACTION_UPDATED", entityId: input.id, occurredAt: updatedAt, detail: JSON.stringify({ status: input.status }) });
        db.exec("COMMIT");
        return true;
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function listPilotActions(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
    return openDatabase().prepare(`SELECT pilot_actions.*, creators.display_name AS created_by_name, updaters.display_name AS updated_by_name
    FROM pilot_actions
    JOIN users creators ON creators.id = pilot_actions.created_by
    JOIN users updaters ON updaters.id = pilot_actions.updated_by
    ORDER BY CASE status WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 WHEN 'RESOLVED' THEN 2 ELSE 3 END,
      CASE priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
      due_date ASC, updated_at DESC LIMIT ?`).all(safeLimit);
}
export function pilotActionSummary() {
    const row = openDatabase().prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS open,
    SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN priority IN ('HIGH', 'CRITICAL') AND status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS urgent
    FROM pilot_actions`).get();
    return {
        total: Number(row.total ?? 0),
        open: Number(row.open ?? 0),
        resolved: Number(row.resolved ?? 0),
        urgent: Number(row.urgent ?? 0),
    };
}
export function pilotOutcomeReport() {
    const readiness = pilotReadinessSnapshot();
    const validations = pilotValidationSummary();
    const actions = pilotActionSummary();
    const hasBlockers = readiness.blocked > 0 || validations.blocked > 0 || actions.urgent > 0;
    const hasAttention = readiness.attention > 0 || validations.changes > 0 || actions.open > 0;
    const recommendation = hasBlockers ? "NO_GO" : hasAttention ? "CONDITIONAL_GO" : "GO";
    const indicators = [
        { label: "Readiness gates", value: `${readiness.ready} ready, ${readiness.blocked} blocked`, status: readiness.blocked > 0 ? "BLOCKED" : readiness.attention > 0 ? "ATTENTION" : "READY" },
        { label: "Validation outcomes", value: `${validations.passed} pass, ${validations.changes} with changes, ${validations.blocked} blocked`, status: validations.blocked > 0 ? "BLOCKED" : validations.changes > 0 ? "ATTENTION" : validations.total > 0 ? "READY" : "ATTENTION" },
        { label: "Pilot actions", value: `${actions.open} open, ${actions.urgent} high priority`, status: actions.urgent > 0 ? "BLOCKED" : actions.open > 0 ? "ATTENTION" : "READY" },
    ];
    const nextSteps = [
        readiness.blocked > 0 ? "Resolve blocked readiness gates before formal pilot sign-off." : "Keep readiness gates reviewed before each validation session.",
        validations.total === 0 ? "Record stakeholder validation sessions for all core journeys." : "Review validation notes and convert repeated findings into action items.",
        actions.open > 0 ? "Close or defer open pilot actions with administrator notes." : "Maintain the action tracker as new findings arrive.",
    ];
    const summary = recommendation === "GO"
        ? "The pilot can proceed to a wider validation group."
        : recommendation === "CONDITIONAL_GO"
            ? "The pilot can continue with controlled validation while listed attention items are handled."
            : "The pilot should not expand until blockers are resolved.";
    return { recommendation, summary, generatedAt: new Date().toISOString(), indicators, nextSteps };
}
export function recordPilotSignoff(input) {
    const db = openDatabase();
    const signedAt = new Date().toISOString();
    const id = `pilot-signoff-${randomUUID()}`;
    const outcome = pilotOutcomeReport();
    db.exec("BEGIN IMMEDIATE");
    try {
        db.prepare(`INSERT INTO pilot_signoffs
      (id, decision, signoff_by, meeting_reference, conditions, recommendation, signed_at, signed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(id, input.decision, input.signoffBy, input.meetingReference, input.conditions, outcome.recommendation, signedAt, input.administratorId);
        appendAuditEvent(db, { userId: input.administratorId, action: "PILOT_SIGNOFF_RECORDED", entityId: id, occurredAt: signedAt, detail: JSON.stringify({ decision: input.decision, recommendation: outcome.recommendation, meetingReference: input.meetingReference }) });
        db.exec("COMMIT");
        return { id, signedAt };
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function listPilotSignoffs(limit = 25) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    return openDatabase().prepare(`SELECT pilot_signoffs.*, users.display_name AS signed_by_name
    FROM pilot_signoffs JOIN users ON users.id = pilot_signoffs.signed_by
    ORDER BY signed_at DESC LIMIT ?`).all(safeLimit);
}
export function latestPilotSignoff() {
    return listPilotSignoffs(1)[0] ?? null;
}
export function scaleUpPlan() {
    const outcome = pilotOutcomeReport();
    const signoff = latestPilotSignoff();
    const readiness = pilotReadinessSnapshot();
    const validations = pilotValidationSummary();
    const actions = pilotActionSummary();
    const canExpand = signoff?.decision === "APPROVE_EXPANSION" && outcome.recommendation !== "NO_GO";
    const workstreams = [
        {
            label: "Knowledge expansion",
            status: readiness.blocked > 0 ? "BLOCKED" : readiness.attention > 0 ? "ATTENTION" : "READY",
            owner: "Ontology and evidence team",
            objective: "Increase validated remedies, conditions, systems, and multilingual labels without weakening review controls.",
            readinessSignal: `${readiness.ready} readiness gates ready`,
            nextMilestone: "Select the next validated remedy batch and evidence curation targets.",
        },
        {
            label: "Practitioner onboarding",
            status: validations.total > 0 ? "READY" : "ATTENTION",
            owner: "Practitioner coordination team",
            objective: "Bring verified traditional medicine practitioners into structured contribution workflows.",
            readinessSignal: `${validations.total} stakeholder validation records`,
            nextMilestone: "Prepare onboarding guidance and a practitioner validation cohort.",
        },
        {
            label: "Safety monitoring",
            status: outcome.recommendation === "NO_GO" ? "BLOCKED" : actions.urgent > 0 ? "ATTENTION" : "READY",
            owner: "Safety and governance team",
            objective: "Keep citizen feedback, safety concerns, and audit review active during rollout.",
            readinessSignal: `${actions.urgent} urgent open pilot actions`,
            nextMilestone: "Review safety triage coverage before inviting a larger audience.",
        },
        {
            label: "Operational scale",
            status: canExpand ? "READY" : signoff ? "ATTENTION" : "BLOCKED",
            owner: "Product and infrastructure team",
            objective: "Prepare deployment, monitoring, training, and support routines for wider use.",
            readinessSignal: signoff ? signoff.decision.replaceAll("_", " ").toLowerCase() : "No pilot sign-off recorded",
            nextMilestone: canExpand ? "Plan staged rollout dates and support coverage." : "Complete pilot sign-off before rollout planning.",
        },
    ];
    return {
        status: canExpand ? "READY" : outcome.recommendation === "NO_GO" ? "BLOCKED" : "ATTENTION",
        generatedAt: new Date().toISOString(),
        canExpand,
        signoffDecision: signoff?.decision ?? null,
        recommendation: outcome.recommendation,
        workstreams,
    };
}
export function rolloutMonitoringDashboard() {
    const plan = scaleUpPlan();
    const analytics = governanceAnalytics();
    const feedback = feedbackSummary();
    const validations = pilotValidationSummary();
    const actions = pilotActionSummary();
    const audit = auditIntegrityStatus();
    const signoff = latestPilotSignoff();
    const signals = [
        {
            label: "Sign-off status",
            status: signoff?.decision === "APPROVE_EXPANSION" ? "READY" : signoff ? "ATTENTION" : "BLOCKED",
            value: signoff ? signoff.decision.replaceAll("_", " ").toLowerCase() : "not recorded",
            detail: signoff ? `Latest sign-off reference: ${signoff.meeting_reference}` : "Record pilot sign-off before rollout monitoring begins.",
        },
        {
            label: "Safety feedback",
            status: feedback.safetyReview > 0 ? "BLOCKED" : feedback.open > 0 ? "ATTENTION" : "READY",
            value: `${feedback.safetyReview} safety, ${feedback.open} open`,
            detail: "Safety concerns should remain visible throughout staged expansion.",
        },
        {
            label: "Validation blockers",
            status: validations.blocked > 0 ? "BLOCKED" : validations.changes > 0 ? "ATTENTION" : validations.total > 0 ? "READY" : "ATTENTION",
            value: `${validations.blocked} blocked findings`,
            detail: "Repeated stakeholder findings should become tracked pilot actions.",
        },
        {
            label: "Action closure",
            status: actions.urgent > 0 ? "BLOCKED" : actions.open > 0 ? "ATTENTION" : "READY",
            value: `${actions.open} open actions`,
            detail: "Open actions need owner updates before each scale-up checkpoint.",
        },
        {
            label: "Audit posture",
            status: audit.valid ? "READY" : "BLOCKED",
            value: `${audit.count} events`,
            detail: audit.valid ? "Audit chain is intact for governance review." : "Audit chain requires administrator review.",
        },
        {
            label: "Publication throughput",
            status: analytics.workflow.published > 0 ? "READY" : analytics.workflow.approved > 0 ? "ATTENTION" : "ATTENTION",
            value: `${analytics.workflow.published} published`,
            detail: "A wider rollout should have a growing set of published, reviewed records.",
        },
    ];
    const blocked = signals.filter((signal) => signal.status === "BLOCKED").length;
    const attention = signals.filter((signal) => signal.status === "ATTENTION").length;
    return {
        status: blocked > 0 ? "BLOCKED" : attention > 0 ? "ATTENTION" : "READY",
        generatedAt: new Date().toISOString(),
        planStatus: plan.status,
        signals,
        cadence: [
            "Review safety feedback and urgent actions every week.",
            "Confirm audit integrity before each staged release.",
            "Refresh validation findings after every stakeholder session.",
            "Revisit scale-up workstreams before adding a new practitioner cohort.",
        ],
    };
}
export function deploymentReadinessChecklist() {
    const monitoring = rolloutMonitoringDashboard();
    const plan = scaleUpPlan();
    const outcome = pilotOutcomeReport();
    const analytics = governanceAnalytics();
    const audit = auditIntegrityStatus();
    const feedback = feedbackSummary();
    const signoff = latestPilotSignoff();
    const items = [
        {
            label: "Governance approval",
            status: signoff?.decision === "APPROVE_EXPANSION" ? "READY" : signoff ? "ATTENTION" : "BLOCKED",
            area: "Governance",
            requirement: "Pilot sign-off is recorded before public deployment.",
            evidence: signoff ? signoff.decision.replaceAll("_", " ").toLowerCase() : "No sign-off recorded",
        },
        {
            label: "Audit verification",
            status: audit.valid ? "READY" : "BLOCKED",
            area: "Trust",
            requirement: "Privileged workflow events have a verified audit chain.",
            evidence: `${audit.count} audit events checked`,
        },
        {
            label: "Safety response",
            status: feedback.safetyReview > 0 ? "BLOCKED" : feedback.open > 0 ? "ATTENTION" : "READY",
            area: "Safety",
            requirement: "Safety feedback has no unresolved urgent review items.",
            evidence: `${feedback.safetyReview} safety review items, ${feedback.open} open feedback items`,
        },
        {
            label: "Validated content baseline",
            status: analytics.workflow.published > 0 ? "READY" : analytics.workflow.approved > 0 ? "ATTENTION" : "BLOCKED",
            area: "Knowledge",
            requirement: "At least one reviewed record is published for public search.",
            evidence: `${analytics.workflow.published} published, ${analytics.workflow.approved} approved`,
        },
        {
            label: "Rollout monitoring",
            status: monitoring.status,
            area: "Operations",
            requirement: "Scale-up monitoring has no blocked signals before launch.",
            evidence: `${monitoring.signals.filter((signal) => signal.status === "BLOCKED").length} blocked monitoring signals`,
        },
        {
            label: "Scale-up workstreams",
            status: plan.status,
            area: "Operations",
            requirement: "Rollout workstreams have owners and next milestones.",
            evidence: `${plan.workstreams.length} workstreams prepared`,
        },
    ];
    const blocked = items.filter((item) => item.status === "BLOCKED").length;
    const attention = items.filter((item) => item.status === "ATTENTION").length;
    return {
        status: blocked > 0 ? "BLOCKED" : attention > 0 ? "ATTENTION" : "READY",
        generatedAt: new Date().toISOString(),
        recommendation: outcome.recommendation,
        items,
        releaseNotes: [
            "Move secrets, session storage, and database configuration out of local development settings.",
            "Enable production monitoring for search, ontology store health, feedback, and audit integrity.",
            "Publish only reviewed and validated knowledge records into the public graph.",
            "Keep the public safety disclaimer visible on search and remedy detail pages.",
        ],
    };
}
export function phaseFourHandoverSummary() {
    const deployment = deploymentReadinessChecklist();
    const monitoring = rolloutMonitoringDashboard();
    const scale = scaleUpPlan();
    const outcome = pilotOutcomeReport();
    const signoff = latestPilotSignoff();
    const handover = [
        {
            label: "Pilot governance",
            status: signoff?.decision === "APPROVE_EXPANSION" ? "READY" : signoff ? "ATTENTION" : "BLOCKED",
            summary: signoff ? `Latest decision: ${signoff.decision.replaceAll("_", " ").toLowerCase()}` : "Pilot sign-off is still required.",
            nextOwner: "Governance committee",
        },
        {
            label: "Deployment preparation",
            status: deployment.status,
            summary: `${deployment.items.filter((item) => item.status === "BLOCKED").length} blocked deployment item(s) remain.`,
            nextOwner: "Product and infrastructure team",
        },
        {
            label: "Rollout monitoring",
            status: monitoring.status,
            summary: `${monitoring.signals.length} monitoring signals are configured for scale-up review.`,
            nextOwner: "Safety and operations team",
        },
        {
            label: "Scale-up workstreams",
            status: scale.status,
            summary: `${scale.workstreams.length} rollout workstreams are defined with owners and milestones.`,
            nextOwner: "Programme delivery team",
        },
    ];
    return {
        status: deployment.status === "BLOCKED" || monitoring.status === "BLOCKED" || scale.status === "BLOCKED" ? "BLOCKED" : deployment.status === "ATTENTION" || monitoring.status === "ATTENTION" || scale.status === "ATTENTION" ? "ATTENTION" : "READY",
        generatedAt: new Date().toISOString(),
        recommendation: outcome.recommendation,
        handover,
        phaseFivePriorities: [
            "Replace development SQLite and local session handling with production-grade infrastructure.",
            "Expand ontology content through validated practitioner and evidence curation pipelines.",
            "Add production observability for search quality, ontology health, feedback safety, and audit integrity.",
            "Prepare public launch operations, training, support, and governance review cadence.",
        ],
    };
}
export function productionReadinessDashboard() {
    const handover = phaseFourHandoverSummary();
    const deployment = deploymentReadinessChecklist();
    const analytics = governanceAnalytics();
    const feedback = feedbackSummary();
    const audit = auditIntegrityStatus();
    const items = [
        {
            label: "Production data store",
            status: "BLOCKED",
            area: "Infrastructure",
            requirement: "Replace local development SQLite with managed production database, backups, and recovery procedures.",
            nextStep: "Select production database architecture and prepare migration scripts for users, sessions, submissions, reviews, feedback, and audit events.",
        },
        {
            label: "Identity and access",
            status: "ATTENTION",
            area: "Security",
            requirement: "Move demo seeded accounts to administrator-managed onboarding with stronger credential and session controls.",
            nextStep: "Define production user provisioning, password reset, practitioner verification, reviewer approval, and administrator access policies.",
        },
        {
            label: "Validated ontology baseline",
            status: analytics.workflow.published > 0 ? "READY" : "BLOCKED",
            area: "Knowledge",
            requirement: "Public search must expose only reviewed, validated, and traceable ontology records.",
            nextStep: analytics.workflow.published > 0 ? "Freeze a launch baseline and keep a rollback copy of the public graph." : "Publish at least one approved contribution before launch readiness can pass.",
        },
        {
            label: "Safety operations",
            status: feedback.safetyReview > 0 ? "BLOCKED" : feedback.open > 0 ? "ATTENTION" : "READY",
            area: "Safety",
            requirement: "Citizen safety concerns must have a clear triage owner, response cadence, and escalation path.",
            nextStep: "Assign safety triage coverage and define response service levels for public launch.",
        },
        {
            label: "Observability",
            status: "ATTENTION",
            area: "Monitoring",
            requirement: "Production teams need visibility into search quality, ontology health, feedback safety, validation failures, and audit integrity.",
            nextStep: "Connect runtime monitoring, alerting, and weekly governance metrics before scaling public use.",
        },
        {
            label: "Audit integrity",
            status: audit.valid ? "READY" : "BLOCKED",
            area: "Trust",
            requirement: "Privileged actions must remain tamper-evident for governance review.",
            nextStep: audit.valid ? "Schedule recurring audit integrity review after launch." : "Repair audit integrity before any public release.",
        },
        {
            label: "Launch support",
            status: "ATTENTION",
            area: "Operations",
            requirement: "Countrywide use requires help content, administrator runbooks, practitioner onboarding, and support routing.",
            nextStep: "Prepare launch runbooks, support ownership, content moderation guidance, and public help material.",
        },
        {
            label: "Pilot handover",
            status: handover.status,
            area: "Governance",
            requirement: "Phase 4 handover must be reviewed before Phase 5 production work is treated as launch-ready.",
            nextStep: "Review handover items and carry unresolved owners into the production launch plan.",
        },
    ];
    const blocked = items.filter((item) => item.status === "BLOCKED").length;
    const attention = items.filter((item) => item.status === "ATTENTION").length;
    return {
        status: blocked > 0 ? "BLOCKED" : attention > 0 ? "ATTENTION" : "READY",
        generatedAt: new Date().toISOString(),
        blocked,
        attention,
        ready: items.length - blocked - attention,
        deploymentStatus: deployment.status,
        handoverStatus: handover.status,
        items,
        launchSequence: [
            "Confirm production infrastructure and data migration design.",
            "Replace demo account flows with controlled onboarding and access recovery.",
            "Freeze the first validated ontology release baseline.",
            "Activate monitoring, safety triage, audit review, and support runbooks.",
            "Run one final governance review before public launch.",
        ],
    };
}
