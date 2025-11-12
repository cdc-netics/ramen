export type EmbedType = 'iframe' | 'moduleFederation' | 'proxy' | 'link';
export interface ModuleEntry {
  id?: string;
  name: string;
  description?: string;
  baseUrl: string;
  embedType: EmbedType;
  allowedRoles: string[];
  status?: string;
  icon?: string;
  useProxy?: boolean;
  proxyTarget?: string;
}
