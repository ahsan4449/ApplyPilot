import { z } from "zod";
const date = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Use a real YYYY-MM-DD date",
  );
export const applicationInput = z
  .object({
    company: z.string().trim().min(1).max(100),
    role: z.string().trim().min(1).max(140),
    location: z.string().trim().max(150).default(""),
    url: z
      .string()
      .trim()
      .max(1000)
      .refine(
        (v) => !v || (/^https?:\/\//i.test(v) && URL.canParse(v)),
        "Use an http(s) URL",
      )
      .default(""),
    status: z
      .enum(["Saved", "Applied", "Interview", "Offer", "Rejected"])
      .default("Saved"),
    appliedOn: date.default(""),
    deadline: date.default(""),
    nextAction: z.string().trim().max(200).default(""),
    notes: z.string().trim().max(5000).default(""),
  })
  .strict();
export const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(10).max(72),
});
export const registerInput = credentials
  .extend({ name: z.string().trim().min(1).max(80) })
  .strict();
export const aiInput = z
  .object({
    kind: z.enum(["match", "followup"]),
    resume: z.string().trim().min(20).max(12000),
    jobDescription: z.string().trim().min(20).max(12000),
    company: z.string().trim().max(100).default("the company"),
    role: z.string().trim().max(140).default("the role"),
    consent: z.boolean().default(false),
  })
  .strict();

const skills = [
  "javascript",
  "typescript",
  "react",
  "node.js",
  "express",
  "mongodb",
  "sql",
  "postgresql",
  "python",
  "java",
  "c++",
  "docker",
  "kubernetes",
  "aws",
  "git",
  "rest",
  "graphql",
  "redis",
  "testing",
  "jest",
  "html",
  "css",
  "linux",
  "next.js",
  "ci/cd",
  "agile",
  "data structures",
  "algorithms",
];
function hasSkill(text, skill) {
  const aliases = {
    "node.js": ["node.js", "nodejs", "node js"],
    rest: ["rest", "restful"],
    "next.js": ["next.js", "nextjs"],
  };
  return (aliases[skill] || [skill]).some((term) =>
    new RegExp(
      "(^|[^a-z0-9])" +
        term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "($|[^a-z0-9])",
      "i",
    ).test(text),
  );
}
export function matchResume(resume, description) {
  const required = skills.filter((s) => hasSkill(description, s));
  const matched = required.filter((s) => hasSkill(resume, s));
  return {
    score: required.length
      ? Math.round((matched.length / required.length) * 100)
      : null,
    matched,
    missing: required.filter((s) => !matched.includes(s)),
    explanation: required.length
      ? "Keyword coverage, not a hiring prediction. Keywords can miss context and depth."
      : "No known skill keywords were found. Add a more detailed job description.",
    suggestions: [
      "Only add skills you can demonstrate.",
      "Support relevant skills with specific project evidence.",
    ],
  };
}
export function templateFollowup({ company, role }) {
  return `Subject: Following up on my ${role} application\n\nHi ${company} team,\n\nI am following up on my application for ${role}. I remain interested in the opportunity and would appreciate any update on the next steps. I can share more details about my experience if helpful.\n\nThank you,\n[Your name]`;
}
