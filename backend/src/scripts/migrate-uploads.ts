import "dotenv/config";
import logger from "../utils/logger";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { migrateLegacyUploads } from "../services/upload-migration.service";

async function main() {
  await connectDatabase();
  try {
    logger.info(
      "Upload migration",
      await migrateLegacyUploads({
        apply: process.argv.includes("--apply"),
        backupDirectory: process.env.UPLOAD_MIGRATION_BACKUP,
      }),
    );
  } finally {
    await mongoose.disconnect();
  }
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration échouée");
  process.exitCode = 1;
});
