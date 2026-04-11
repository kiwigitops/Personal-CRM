import { invoke } from "@tauri-apps/api/core";

const fallbackPrefix = "personal-crm.desktop.";

function isTauri() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function storeSecret(key: string, value: string) {
  if (isTauri()) {
    await invoke("store_secret", { key, value });
    return;
  }
  window.localStorage.setItem(`${fallbackPrefix}${key}`, value);
}

export async function getSecret(key: string) {
  if (isTauri()) {
    return invoke<string | null>("get_secret", { key });
  }
  return window.localStorage.getItem(`${fallbackPrefix}${key}`);
}

export async function clearSecret(key: string) {
  if (isTauri()) {
    await invoke("clear_secret", { key });
    return;
  }
  window.localStorage.removeItem(`${fallbackPrefix}${key}`);
}

export async function notify(title: string, body: string) {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }
}

