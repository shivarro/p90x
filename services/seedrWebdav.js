import { createClient } from "webdav";

const SEEDR_WEBDAV_URL = "https://dav.seedr.cc/";  // Secure WebDAV URL:contentReference[oaicite:5]{index=5}

export function getSeedrClient() {
  return createClient(SEEDR_WEBDAV_URL, {
    username: process.env.REACT_APP_SEEDR_EMAIL,      // store in .env:contentReference[oaicite:6]{index=6}
    password: process.env.REACT_APP_SEEDR_PASSWORD,   // use an app-specific password
  });
}
