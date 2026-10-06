import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { Cor, Parte } from '../types'

const NOMES: Record<string, string> = { five_hour: '5h', seven_day: '7d' }

const DURACAO_MS: Record<string, number> = { five_hour: 5 * 3600_000, seven_day: 7 * 86400_000 }

export function corDoUso(percentUsado: number): Cor {
  if (percentUsado >= 80) return 'error'
  if (percentUsado >= 50) return 'warning'
  return 'success'
}

// Projeta o uso no fim da janela pelo ritmo atual. O decorrido tem piso de 10%
// para o começo da janela não projetar estouro com 1% usado.
export function corDoRitmo(r: SessionRateLimit, agora: number): Cor {
  const duracao = DURACAO_MS[r.kind]
  const reset = r.resetsAt ? Date.parse(r.resetsAt) : Number.NaN
  if (r.percentUsed >= 95) return 'error'
  if (!duracao || Number.isNaN(reset)) return corDoUso(r.percentUsed)
  const decorrido = Math.min(1, Math.max(0.1, 1 - (reset - agora) / duracao))
  const projetado = r.percentUsed / decorrido
  if (projetado >= 100) return 'error'
  if (projetado >= 85) return 'warning'
  return 'success'
}

export function faltaPara(resetsAt: string | undefined, agora: number): string {
  const ms = resetsAt ? Date.parse(resetsAt) - agora : Number.NaN
  if (Number.isNaN(ms) || ms <= 0) return ''
  const min = Math.round(ms / 60_000)
  if (min < 60) return ` (reset ${min}min)`
  const h = Math.floor(min / 60)
  if (h < 24) return ` (reset ${h}h${String(min % 60).padStart(2, '0')})`
  return ` (reset ${Math.floor(h / 24)}d${h % 24}h)`
}

export function formatar(
  context: { tokens?: number; window: number; percent?: number },
  rateLimits: SessionRateLimit[],
  usd: number | undefined,
  agora: number,
): Parte[] {
  const k = (n: number) => `${Math.round(n / 1000)}k`
  const partes: Parte[] = [
    {
      texto:
        `ctx ${context.tokens === undefined ? '-' : k(context.tokens)}/${k(context.window)}` +
        (context.percent === undefined ? '' : ` (${Math.round(context.percent)}%)`),
      cor: context.percent === undefined ? 'subtle' : corDoUso(context.percent),
    },
  ]
  if (usd !== undefined) partes.push({ texto: `$${usd.toFixed(2)}`, cor: 'subtle' })
  for (const r of rateLimits) {
    const resta = Math.max(0, 100 - Math.round(r.percentUsed))
    partes.push({
      texto: `${NOMES[r.kind] ?? r.kind}: ${resta}% livre${faltaPara(r.resetsAt, agora)}`,
      cor: corDoRitmo(r, agora),
    })
  }
  return partes
}

const linha = atom({ plugin: 'uso-sessao', key: 'linha' } as const, null)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const u = await $.session.usage()
    const agora = await $.clock.now()
    await update($, linha, () => formatar(u.context, u.rateLimits, u.cost?.usd, agora))
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const u = await $.session.usage()
    const agora = await $.clock.now()
    await update($, linha, () => formatar(e.context, e.rateLimits, u.cost?.usd, agora))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const partes = await read($, linha)
    if (partes === null || e.props.hasSurvey) return next(e)
    const { Text } = $.ui.resolve(e)
    return (
      <Text>
        {partes.map((p, i) => (
          <Text key={String(i)} color={p.cor}>
            {i > 0 ? ' · ' : ''}
            {p.texto}
          </Text>
        ))}
      </Text>
    )
  })
}
