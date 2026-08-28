import type { CategoryId } from "../types/texture";

// Helper local (nao faz parte do Dictionary) para as mensagens de erro que
// mencionam "project" ou "texture" - o backend so manda o id em ingles
// (EntityKind::as_str() em core/error.rs), a palavra certa no idioma vem daqui.
const entityNoun: Record<string, string> = { project: "project", texture: "texture", template: "template" };

/**
 * Fonte da verdade das chaves de traducao. pt-BR e es sao tipados contra o
 * `Dictionary` derivado deste arquivo - se uma chave faltar ou tiver o tipo
 * errado nos outros idiomas, o build quebra (ver comentario em pt-BR.ts).
 */
export const en = {
  common: {
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    saved: "Saved",
    create: "Create",
    creating: "Creating...",
    loading: "Loading...",
  },
  settings: {
    buttonLabel: "Settings",
    title: "Settings",
    languageLabel: "Language",
    manageTemplatesButton: "Manage Templates",
    manageTemplatesDialogTitle: "Manage Templates",
    importTemplateButton: "Import Template",
    deleteSelectedTemplateButton: "Delete",
    templateAddedNotice: "Template Added",
    customTemplatesHeading: "Custom Templates",
    deleteTemplateAriaLabel: (name: string) => `Delete template ${name}`,
  },
  // "gui" e "misc" ficam sempre em ingles nos 3 idiomas (decisao do usuario:
  // termos curtos/universais, nao vale a pena traduzir).
  categories: {
    blocks: "Blocks",
    items: "Items",
    armor: "Armor",
    gui: "GUI",
    entities: "Entities",
    particles: "Particles",
    misc: "Misc",
  } satisfies Record<CategoryId, string>,
  // Nomes de exibicao dos templates EMBUTIDOS, por id (ver manifest.json
  // em src-tauri/resources/templates/). Chave ausente cai no fallback (a
  // propria id crua) - templates custom nao entram aqui, usam nome literal.
  templates: {} as Record<string, string>,
  home: {
    newProjectButton: "New Project",
    subtitle: "Easily create Minecraft textures",
    projectsHeading: "PROJECTS",
    loadingProjects: "Loading projects...",
    openProjectButton: "Open Project",
    deleteProjectButton: "Delete Project",
  },
  main: {
    backToProjects: "Back to Projects",
    newTextureButton: "New Texture",
    importButton: "Import",
    searchPlaceholder: "Search...",
    loadingTextures: "Loading textures...",
    noResultsFor: (query: string) => `No textures found for "${query}".`,
    texturesFor: (label: string) => `Textures for ${label}`,
  },
  project: {
    newProjectDialogTitle: "New Project",
    namePlaceholder: "Project name",
    emptyList: (newProjectButtonLabel: string) =>
      `No projects yet. Click "${newProjectButtonLabel}" to get started.`,
    modifiedOn: (date: string) => `Modified on ${date}`,
  },
  texture: {
    newTextureDialogTitle: "New Texture",
    namePlaceholder: "Texture name",
    initialResolutionNote: (resolution: string) =>
      `Initial resolution: ${resolution} (transparent) - changeable later in Resize.`,
    importDialogTitle: "Import Texture",
    pngFilterName: "PNG Image",
    chooseFileLabel: "Choose PNG file...",
    oversizeWarning: (mb: string) =>
      `This file is ${mb}MB — much heavier than usual for pixel art. Are you sure you want to import it anyway?`,
    oversizeAcknowledge: "Yes, import anyway",
    importing: "Importing...",
    emptyGrid: "No textures yet",
    deleteAriaLabel: (name: string) => `Delete ${name}`,
    deleteTooltip: "Delete texture",
    exportAriaLabel: (name: string) => `Export ${name}`,
    exportTooltip: "Export texture",
    openAriaLabel: (name: string) => `Open ${name}`,
    openTooltip: "Open texture",
    editTextureButton: "Edit Texture",
    exportTextureButton: "Export",
    deleteTextureButton: "Delete",
  },
  editor: {
    backToTextures: "Back to Textures",
    saveAsButton: "Save as",
    saveAsDialogTitle: "Save Texture As",
    saveAsResolutionNote: (width: number, height: number) => `This will be saved at ${width}x${height}.`,
    loadingTexture: "Loading texture...",
    activeSelectionHint: "Active selection — press Delete to clear the content",
    colorHeading: "COLOR",
    selectColorAriaLabel: "Select color",
    colorPickerTooltip: (hex: string) => `${hex} — click to choose another color`,
    colorPickerTitle: "Select Color",
    opacityLabel: "Opacity %",
    selectButton: "Select",
    templatesButton: "Templates",
    templatesDialogTitle: "Texture Templates",
    templatesEmpty: "No templates available yet.",
    layersHeading: "LAYERS",
    baseLayerName: "Base",
    addLayerButton: "Add Layer",
    toggleLayerVisibilityAriaLabel: (name: string) => `Toggle visibility of layer ${name}`,
    moveLayerUpAriaLabel: "Move layer up",
    moveLayerDownAriaLabel: "Move layer down",
    deleteLayerAriaLabel: (name: string) => `Delete layer ${name}`,
    propertiesHeading: "PROPERTIES",
    nameLabel: "Name:",
    categoryLabel: "Category:",
    resolutionLabel: "Resolution:",
    resizeDialogTitle: "Resize Texture",
    widthLabel: "Width",
    heightLabel: "Height",
    resizeNote: (min: number, max: number) =>
      `Between ${min} and ${max} on each axis. Existing pixels stay in the same position; new area becomes transparent, and removed area (if shrinking) is cropped - the artwork is not stretched.`,
    resizing: "Resizing...",
    resizeButton: "Resize",
    zoomOutAriaLabel: "Zoom out",
    zoomInAriaLabel: "Zoom in",
    zoomLabel: (zoom: number) => `Zoom: ${zoom}%`,
    gridOn: "on",
    gridOff: "off",
    toolbarCategories: {
      general: "General",
      drawing: "Drawing",
      shapes: "Shapes",
      transform: "Transform",
      selection: "Selection",
    },
    tools: {
      undo: "Undo",
      redo: "Redo",
      pencil: "Pencil",
      eraser: "Eraser",
      bucket: "Bucket",
      bucketAffectAll: "Affect all",
      eyedropper: "Eyedropper",
      line: "Line",
      rectangle: "Rectangle",
      mirrorHorizontal: "Horizontal Mirror",
      mirrorVertical: "Vertical Mirror",
      rotate: "Rotate",
      resize: "Resize",
      selection: "Selection",
    },
  },
  // Cada chave e uma funcao (params) => mensagem final. `params` vem direto
  // do backend (ver AppErrorPayload em types/error.ts) - sempre string a
  // string, entao numeros (ex. largura/altura) chegam como texto mesmo.
  errors: {
    name_empty: (p: Record<string, string>) =>
      `The ${entityNoun[p.entity] ?? p.entity} name cannot be empty.`,
    name_has_spaces: (p: Record<string, string>) =>
      `The ${entityNoun[p.entity] ?? p.entity} name cannot start or end with spaces.`,
    name_invalid_chars: (p: Record<string, string>) =>
      `The ${entityNoun[p.entity] ?? p.entity} name contains invalid characters (${p.chars}).`,
    name_reserved: (p: Record<string, string>) =>
      `"${p.name}" is a name reserved by the system and cannot be used.`,
    already_exists: (p: Record<string, string>) =>
      `A ${entityNoun[p.entity] ?? p.entity} with this name already exists: "${p.name}".`,
    invalid_uuid: () => "Invalid identifier.",
    project_not_found: () => "Project not found.",
    documents_dir_not_found: () => "Could not locate the system's Documents folder.",
    project_json_missing: () => "project.json not found.",
    project_json_corrupted: () => "project.json is corrupted.",
    invalid_category: (p: Record<string, string>) => `Invalid category: "${p.category}".`,
    invalid_resolution: (p: Record<string, string>) =>
      `Resolution must be between ${p.min} and ${p.max} on each axis (received ${p.width}x${p.height}).`,
    texture_not_found: (p: Record<string, string>) =>
      `Texture "${p.name}" not found in "${p.category}".`,
    invalid_file_name: () => "Invalid file name.",
    pixel_data_size_mismatch: (p: Record<string, string>) =>
      `Unexpected pixel data size (expected ${p.expected}, received ${p.received}).`,
    image_build_failed: () => "Could not build the image from the pixel data.",
    image_decode_error: (p: Record<string, string>) => `Invalid or corrupted image file: ${p.detail}`,
    io_error: (p: Record<string, string>) => `File error: ${p.detail}`,
    serialization_error: (p: Record<string, string>) => `Error reading or writing data: ${p.detail}`,
    layer_limit_reached: (p: Record<string, string>) =>
      `You can have at most ${p.max} layers per texture.`,
    empty_layer_list: () => "A texture must have at least one layer.",
    template_not_found: () => "Template not found.",
    template_resource_dir_not_found: () => "Could not locate the templates folder bundled with the app.",
  },
};

export type Dictionary = typeof en;
