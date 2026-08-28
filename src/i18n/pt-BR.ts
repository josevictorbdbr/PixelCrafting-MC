import type { Dictionary } from "./en";

// Helpers locais (nao fazem parte do Dictionary) para compor as frases de
// erro que mencionam projeto/textura/template, preservando a concordancia
// do portugues ("do projeto"/"da textura"/"do template", "um projeto"/"uma
// textura"/"um template").
const ownerPhrase: Record<string, string> = { project: "do projeto", texture: "da textura", template: "do template" };
const articlePhrase: Record<string, string> = { project: "um projeto", texture: "uma textura", template: "um template" };

/**
 * A anotacao `: Dictionary` (em vez de `as const`) e o que garante a
 * seguranca: com um tipo explicito, o TypeScript reporta erro tanto se
 * faltar uma chave do en.ts quanto se sobrar uma chave que nao existe la.
 */
export const ptBR: Dictionary = {
  common: {
    cancel: "Cancelar",
    save: "Salvar",
    saving: "Salvando...",
    saved: "Salvo",
    create: "Criar",
    creating: "Criando...",
    loading: "Carregando...",
  },
  settings: {
    buttonLabel: "Configurações",
    title: "Configurações",
    languageLabel: "Idioma",
    manageTemplatesButton: "Gerenciar Templates",
    manageTemplatesDialogTitle: "Gerenciar Templates",
    importTemplateButton: "Importar Template",
    deleteSelectedTemplateButton: "Excluir",
    templateAddedNotice: "Template Adicionado",
    customTemplatesHeading: "Templates Personalizados",
    deleteTemplateAriaLabel: (name: string) => `Excluir template ${name}`,
  },
  categories: {
    blocks: "Blocos",
    items: "Itens",
    armor: "Armadura",
    gui: "GUI",
    entities: "Entidades",
    particles: "Partículas",
    misc: "Misc",
  },
  templates: {},
  home: {
    newProjectButton: "Novo Projeto",
    subtitle: "Crie texturas de Minecraft facilmente",
    projectsHeading: "PROJETOS",
    loadingProjects: "Carregando projetos...",
    openProjectButton: "Abrir Projeto",
    deleteProjectButton: "Excluir Projeto",
  },
  main: {
    backToProjects: "Voltar para Projetos",
    newTextureButton: "Nova Textura",
    importButton: "Importar",
    searchPlaceholder: "Buscar...",
    loadingTextures: "Carregando texturas...",
    noResultsFor: (query: string) => `Nenhuma textura encontrada para "${query}".`,
    texturesFor: (label: string) => `Texturas de ${label}`,
  },
  project: {
    newProjectDialogTitle: "Novo Projeto",
    namePlaceholder: "Nome do projeto",
    emptyList: (newProjectButtonLabel: string) =>
      `Nenhum projeto ainda. Clique em "${newProjectButtonLabel}" para começar.`,
    modifiedOn: (date: string) => `Modificado em ${date}`,
  },
  texture: {
    newTextureDialogTitle: "Nova Textura",
    namePlaceholder: "Nome da textura",
    initialResolutionNote: (resolution: string) =>
      `Resolução inicial: ${resolution} (transparente) - mudável depois em Redimensionar.`,
    importDialogTitle: "Importar Textura",
    pngFilterName: "Imagem PNG",
    chooseFileLabel: "Escolher arquivo PNG...",
    oversizeWarning: (mb: string) =>
      `Esse arquivo tem ${mb}MB — bem mais pesado que o comum para pixel art. Tem certeza que quer importar assim mesmo?`,
    oversizeAcknowledge: "Sim, importar mesmo assim",
    importing: "Importando...",
    emptyGrid: "Nenhuma textura ainda",
    deleteAriaLabel: (name: string) => `Excluir ${name}`,
    deleteTooltip: "Excluir textura",
    exportAriaLabel: (name: string) => `Exportar ${name}`,
    exportTooltip: "Exportar textura",
    openAriaLabel: (name: string) => `Abrir ${name}`,
    openTooltip: "Abrir textura",
    editTextureButton: "Editar Textura",
    exportTextureButton: "Exportar",
    deleteTextureButton: "Excluir",
  },
  editor: {
    backToTextures: "Voltar para Texturas",
    saveAsButton: "Salvar como",
    saveAsDialogTitle: "Salvar Textura Como",
    saveAsResolutionNote: (width: number, height: number) => `Isso será salvo em ${width}x${height}.`,
    loadingTexture: "Carregando textura...",
    activeSelectionHint: "Seleção ativa — pressione Delete para apagar o conteúdo",
    colorHeading: "COR",
    selectColorAriaLabel: "Selecionar cor",
    colorPickerTooltip: (hex: string) => `${hex} — clique para escolher outra cor`,
    colorPickerTitle: "Selecionar Cor",
    opacityLabel: "Opacidade %",
    selectButton: "Selecionar",
    templatesButton: "Templates",
    templatesDialogTitle: "Templates de Textura",
    templatesEmpty: "Nenhum template disponível ainda.",
    layersHeading: "CAMADAS",
    baseLayerName: "Base",
    addLayerButton: "Adicionar Camada",
    toggleLayerVisibilityAriaLabel: (name: string) => `Alternar visibilidade da camada ${name}`,
    moveLayerUpAriaLabel: "Mover camada para cima",
    moveLayerDownAriaLabel: "Mover camada para baixo",
    deleteLayerAriaLabel: (name: string) => `Excluir camada ${name}`,
    propertiesHeading: "PROPRIEDADES",
    nameLabel: "Nome:",
    categoryLabel: "Categoria:",
    resolutionLabel: "Resolução:",
    resizeDialogTitle: "Redimensionar Textura",
    widthLabel: "Largura",
    heightLabel: "Altura",
    resizeNote: (min: number, max: number) =>
      `Entre ${min} e ${max} em cada eixo. Os pixels existentes ficam na mesma posição; área nova fica transparente, e área removida (se encolher) é recortada - não estica o desenho.`,
    resizing: "Redimensionando...",
    resizeButton: "Redimensionar",
    zoomOutAriaLabel: "Diminuir zoom",
    zoomInAriaLabel: "Aumentar zoom",
    zoomLabel: (zoom: number) => `Zoom: ${zoom}%`,
    gridOn: "ativado",
    gridOff: "desativado",
    toolbarCategories: {
      general: "Geral",
      drawing: "Desenho",
      shapes: "Formas",
      transform: "Transformar",
      selection: "Seleção",
    },
    tools: {
      undo: "Desfazer",
      redo: "Refazer",
      pencil: "Lápis",
      eraser: "Borracha",
      bucket: "Balde",
      bucketAffectAll: "Afetar todos",
      eyedropper: "Conta-gotas",
      line: "Linha",
      rectangle: "Retângulo",
      mirrorHorizontal: "Espelho Horizontal",
      mirrorVertical: "Espelho Vertical",
      rotate: "Rotacionar",
      resize: "Redimensionar",
      selection: "Seleção",
    },
  },
  errors: {
    name_empty: (p: Record<string, string>) =>
      `O nome ${ownerPhrase[p.entity] ?? p.entity} não pode ser vazio.`,
    name_has_spaces: (p: Record<string, string>) =>
      `O nome ${ownerPhrase[p.entity] ?? p.entity} não pode começar ou terminar com espaços.`,
    name_invalid_chars: (p: Record<string, string>) =>
      `O nome ${ownerPhrase[p.entity] ?? p.entity} contém caracteres inválidos (${p.chars}).`,
    name_reserved: (p: Record<string, string>) =>
      `"${p.name}" é um nome reservado pelo sistema e não pode ser usado.`,
    already_exists: (p: Record<string, string>) =>
      `Já existe ${articlePhrase[p.entity] ?? p.entity} com esse nome: "${p.name}".`,
    invalid_uuid: () => "Identificador inválido.",
    project_not_found: () => "Projeto não encontrado.",
    documents_dir_not_found: () => "Não foi possível localizar a pasta de Documentos do sistema.",
    project_json_missing: () => "project.json não encontrado.",
    project_json_corrupted: () => "project.json corrompido.",
    invalid_category: (p: Record<string, string>) => `Categoria inválida: "${p.category}".`,
    invalid_resolution: (p: Record<string, string>) =>
      `Resolução deve estar entre ${p.min} e ${p.max} em cada eixo (recebido ${p.width}x${p.height}).`,
    texture_not_found: (p: Record<string, string>) =>
      `Textura "${p.name}" não encontrada em "${p.category}".`,
    invalid_file_name: () => "Nome de arquivo inválido.",
    pixel_data_size_mismatch: (p: Record<string, string>) =>
      `Dados de pixel com tamanho inesperado (esperado ${p.expected}, recebido ${p.received}).`,
    image_build_failed: () => "Não foi possível montar a imagem a partir dos pixels.",
    image_decode_error: (p: Record<string, string>) => `Arquivo de imagem inválido ou corrompido: ${p.detail}`,
    io_error: (p: Record<string, string>) => `Erro de arquivo: ${p.detail}`,
    serialization_error: (p: Record<string, string>) => `Erro ao ler ou gravar dados: ${p.detail}`,
    layer_limit_reached: (p: Record<string, string>) =>
      `Você pode ter no máximo ${p.max} camadas por textura.`,
    empty_layer_list: () => "Uma textura precisa ter pelo menos uma camada.",
    template_not_found: () => "Template não encontrado.",
    template_resource_dir_not_found: () => "Não foi possível localizar a pasta de templates do aplicativo.",
  },
};
