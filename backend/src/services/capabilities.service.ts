import { isFirebaseReady } from "../config/firebase";
import { isEmailConfigured } from "./email.service";
import aiService from "./ai.service";
export function capabilities() {
  return {
    ai: aiService.isAvailable(),
    push: isFirebaseReady(),
    email: isEmailConfigured(),
  };
}
