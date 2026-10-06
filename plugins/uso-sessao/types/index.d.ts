export type Cor = 'success' | 'warning' | 'error' | 'subtle'
export type Parte = { texto: string; cor: Cor }
export type Linha = Parte[] | null

declare module 'claude-code' {
  interface PluginState {
    'uso-sessao': { linha: Linha }
  }
}
