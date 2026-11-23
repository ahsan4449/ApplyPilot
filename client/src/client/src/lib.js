export const statuses = ["Saved", "Applied", "Interview", "Offer", "Rejected"];
export const blank = {
  company: "",
  role: "",
  location: "",
  url: "",
  status: "Saved",
  appliedOn: "",
  deadline: "",
  nextAction: "",
  notes: "",
};
export async function api(url, options = {}) {
  const res = await fetch("/api" + url, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}
export function formatDate(date) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
