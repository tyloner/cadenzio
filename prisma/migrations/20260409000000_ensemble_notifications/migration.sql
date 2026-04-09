-- Add ensemble notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ENSEMBLE_INVITE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ENSEMBLE_SESSION';

-- Add ensembleId to Notification
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "ensembleId" TEXT;

-- Drop old unique constraint and add new one including ensembleId
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_actorId_type_activityId_key";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_type_activityId_ensembleId_key"
  UNIQUE ("actorId", "type", "activityId", "ensembleId");
