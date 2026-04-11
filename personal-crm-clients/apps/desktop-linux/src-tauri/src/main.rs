#[tauri::command]
fn store_secret(key: String, value: String) -> Result<(), String> {
  keyring::Entry::new("personal-crm", &key)
    .map_err(|error| error.to_string())?
    .set_password(&value)
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_secret(key: String) -> Result<Option<String>, String> {
  match keyring::Entry::new("personal-crm", &key).map_err(|error| error.to_string())?.get_password() {
    Ok(value) => Ok(Some(value)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
fn clear_secret(key: String) -> Result<(), String> {
  match keyring::Entry::new("personal-crm", &key).map_err(|error| error.to_string())?.delete_credential() {
    Ok(()) => Ok(()),
    Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(error.to_string()),
  }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![store_secret, get_secret, clear_secret])
    .run(tauri::generate_context!())
    .expect("error while running Personal CRM desktop app");
}

