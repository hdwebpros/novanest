import { google } from "googleapis";

let _driveClient: ReturnType<typeof google.drive> | null = null;

function getAuth() {
  const config = useRuntimeConfig();
  return new google.auth.JWT({
    email: config.googleServiceAccountEmail,
    key: config.googleServiceAccountPrivateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export function getDriveClient() {
  if (!_driveClient) {
    _driveClient = google.drive({ version: "v3", auth: getAuth() });
  }
  return _driveClient;
}
