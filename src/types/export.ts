/**
 * Ids estaveis das faixas de versao do Minecraft aceitas no export.
 * Espelham exatamente `McVersionBucket::from_id` em core/export.rs -
 * mudar aqui exige mudar la tambem (e vice-versa).
 */
export type McVersionBucketId = "1.20.2-1.21.1" | "1.21.2-1.21.8" | "1.21.9+";
