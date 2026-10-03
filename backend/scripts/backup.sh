#!/usr/bin/env bash
# Backs up the production database and the uploaded files.
#
#   backend/scripts/backup.sh
#
# Writes two files into $BACKUP_DIR (default /var/backups/supplybase):
#   db-YYYYMMDD-HHMMSS.sql.gz       every table, as one consistent snapshot
#   uploads-YYYYMMDD-HHMMSS.tar.gz  customers' photos and project documents
# and removes this script's own backups older than $KEEP_DAYS (default 14).
#
# Run it every night from cron (DEPLOYMENT.md, "Backups"), and copy the folder
# somewhere off this server as well: a backup on the same disk does not
# survive that disk, or the server, being lost. How to restore is in the same
# section of DEPLOYMENT.md.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/supplybase}"
KEEP_DAYS="${KEEP_DAYS:-14}"
DB_CONTAINER="${DB_CONTAINER:-supplybase-mysql}"
API_CONTAINER="${API_CONTAINER:-supplybase-api}"
STAMP="$(date +%Y%m%d-%H%M%S)"

umask 077
mkdir -p "$BACKUP_DIR"

# 1. The database. The password and database name are read from the MySQL
#    container's own environment, so nothing secret is written in this file.
#    A half-written file keeps the .partial name, so it is never mistaken for
#    a good backup.
docker exec "$DB_CONTAINER" sh -c \
  'exec mysqldump --single-transaction --routines --no-tablespaces -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz.partial"
gzip -t "$BACKUP_DIR/db-$STAMP.sql.gz.partial"
mv "$BACKUP_DIR/db-$STAMP.sql.gz.partial" "$BACKUP_DIR/db-$STAMP.sql.gz"

# 2. The uploaded files. The volume's real name depends on the compose project
#    name, so ask Docker which volume the API has mounted for uploads.
UPLOADS_VOLUME="$(docker inspect "$API_CONTAINER" \
  --format '{{range .Mounts}}{{if eq .Destination "/data/uploads"}}{{.Name}}{{end}}{{end}}')"
if [ -z "$UPLOADS_VOLUME" ]; then
  echo "backup: could not find the uploads volume of $API_CONTAINER" >&2
  exit 1
fi
docker run --rm -v "$UPLOADS_VOLUME":/data:ro -v "$BACKUP_DIR":/backup alpine \
  tar czf "/backup/uploads-$STAMP.tar.gz.partial" -C /data .
mv "$BACKUP_DIR/uploads-$STAMP.tar.gz.partial" "$BACKUP_DIR/uploads-$STAMP.tar.gz"

# 3. Tidy up: only this script's own files, only older than KEEP_DAYS.
find "$BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' -o -name '*.partial' \) \
  -mtime +"$KEEP_DAYS" -delete

echo "backup: ok - $BACKUP_DIR/db-$STAMP.sql.gz and $BACKUP_DIR/uploads-$STAMP.tar.gz"
