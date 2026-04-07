import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// LOG ACTIONS — barcha sahifalarda shu konstantalardan foydalaning
// ═══════════════════════════════════════════════════════════════
export const LOG_ACTIONS = {
  // Auth
  LOGIN:            "login",
  LOGOUT:           "logout",

  // Tasks
  TASK_CREATED:     "task_created",
  TASK_UPDATED:     "task_updated",
  TASK_DELETED:     "task_deleted",
  TASK_COMPLETED:   "task_completed",

  // Teams
  TEAM_CREATED:     "team_created",
  TEAM_UPDATED:     "team_updated",
  TEAM_DELETED:     "team_deleted",
  TEAM_JOINED:      "team_joined",
  TEAM_LEFT:        "team_left",
  MEMBER_ADDED:     "member_added",
  MEMBER_REMOVED:   "member_removed",

  // Company
  COMPANY_CREATED:  "company_created",
  COMPANY_UPDATED:  "company_updated",
  PROJECT_CREATED:  "project_created",
  PROJECT_UPDATED:  "project_updated",
  PROJECT_DELETED:  "project_deleted",

  // Profile
  PROFILE_UPDATED:  "profile_updated",
  PASSWORD_CHANGED: "password_changed",

  // Games
  GAME_PLAYED:      "game_played",
};

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION
// Ishlatish: logActivity({ action: LOG_ACTIONS.TASK_CREATED, detail: "Vazifa nomi", page: "tasks" })
// ═══════════════════════════════════════════════════════════════
export async function logActivity({ action, detail = "", page = "" }) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "activity_logs"), {
      action,
      detail,
      page,
      userId:      user.uid,
      userEmail:   user.email,
      displayName: user.displayName || null,
      avatar:      user.photoURL    || null,
      createdAt:   serverTimestamp(),
    });
  } catch (err) {
    console.error("logActivity xatosi:", err);
  }
}
