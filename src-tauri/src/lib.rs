mod commands;
mod core;

use commands::export_commands::export_project_as_resource_pack;
use commands::project_commands::{
    create_project, delete_project, list_projects, open_project, read_project_icon,
    remove_project_icon, set_project_icon, update_project_description,
};
use commands::settings_commands::{load_settings, save_settings};
use commands::template_commands::{
    delete_custom_template, get_template_pixels, hide_builtin_template, import_custom_template, list_templates,
};
use commands::texture_commands::{
    create_texture, delete_texture, export_texture, file_size_bytes, import_texture, list_textures,
    load_texture_layers, resize_texture, save_texture_layers, save_texture_layers_as,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      list_projects,
      create_project,
      delete_project,
      open_project,
      update_project_description,
      set_project_icon,
      remove_project_icon,
      read_project_icon,
      export_project_as_resource_pack,
      list_textures,
      create_texture,
      delete_texture,
      import_texture,
      export_texture,
      file_size_bytes,
      load_texture_layers,
      resize_texture,
      save_texture_layers,
      save_texture_layers_as,
      load_settings,
      save_settings,
      list_templates,
      get_template_pixels,
      import_custom_template,
      delete_custom_template,
      hide_builtin_template,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
