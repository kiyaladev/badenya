#!/usr/bin/env bash
set -euo pipefail
# Builds a reviewable artifact. Does not publish files or restart services.
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
release_id="${1:-$(date -u +%Y%m%dT%H%M%SZ)}"
[[ "$release_id" =~ ^[a-zA-Z0-9._-]+$ ]] || { echo 'Invalid release identifier' >&2; exit 1; }
artifact_root="${BADENYA_ARTIFACT_DIR:-/tmp/badenya-releases}"
mkdir -p "$artifact_root"
artifact_root="$(cd "$artifact_root" && pwd)"
release_dir="$artifact_root/$release_id"
[[ ! -e "$release_dir" ]] || { echo 'Release already exists' >&2; exit 1; }
cd "$project_dir"
mkdir -p "$release_dir/backend" "$release_dir/admin" "$release_dir/landing-page"
(cd backend && npx tsc --outDir "$release_dir/backend/dist")
npm run build --workspace=admin -- --outDir "$release_dir/admin/dist"
npm run build --workspace=landing-page -- --outDir "$release_dir/landing-page/dist"
(cd mobile && npx expo export --platform web --clear --max-workers 1 --output-dir "$release_dir/mobile/dist")
node scripts/verify-web-export.cjs "$release_dir/mobile/dist"
mkdir -p "$release_dir/backend" "$release_dir/admin" "$release_dir/landing-page"
cp package.json package-lock.json "$release_dir/"
cp backend/package.json "$release_dir/backend/"
cp mobile/package.json mobile/package-lock.json "$release_dir/mobile/"
cp scripts/prepare-release.sh scripts/verify-web-export.cjs "$release_dir/"
mkdir -p "$release_dir/scripts"
cp scripts/verify-migration-backup.cjs "$release_dir/scripts/"
cp -R ops "$release_dir/"
mkdir -p "$release_dir/DOCS"
cp DOCS/AUDIT_APPLICATION_2026-10-06.md DOCS/REMEDIATION_2026-10-06.md DOCS/DEPLOYMENT_GUIDE.md DOCS/MONGODB_REPLICA_SET_RUNBOOK.md DOCS/API_CONTRACTS.md "$release_dir/DOCS/"
cp -R DOCS/audit-2026-10-06 DOCS/remediation-2026-10-06 DOCS/remediation-landing-2026-10-06 "$release_dir/DOCS/"
cp mobile/AUDIT_CORRECTIONS_2026-10-06.md "$release_dir/mobile/"
cp -R mobile/audit-evidence-2026-10-06 "$release_dir/mobile/"
cp admin/package.json "$release_dir/admin/"
cp landing-page/package.json "$release_dir/landing-page/"
printf '%s\n' "$release_id" > "$release_dir/RELEASE"
git rev-parse HEAD > "$release_dir/SOURCE_COMMIT"
git status --porcelain > "$release_dir/SOURCE_WORKTREE"
(cd "$release_dir" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
echo "Prepared $release_dir; no production files were changed."
