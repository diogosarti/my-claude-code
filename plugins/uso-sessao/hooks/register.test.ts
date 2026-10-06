import { expect, test } from 'claude-code/testing'
import { corDoRitmo, faltaPara } from './register'

const H = 3600_000
const agora = Date.parse('2026-10-06T12:00:00Z')
const resetEm = (ms: number) => new Date(agora + ms).toISOString()

test('60% usado faltando 20 min para o reset de 5h: no ritmo', () => {
  expect(corDoRitmo({ kind: 'five_hour', percentUsed: 60, resetsAt: resetEm(H / 3) }, agora)).toBe('success')
})

test('60% usado com 1h de 5h decorrida: vai estourar', () => {
  expect(corDoRitmo({ kind: 'five_hour', percentUsed: 60, resetsAt: resetEm(4 * H) }, agora)).toBe('error')
})

test('45% usado na metade da janela de 7d: perto do limite', () => {
  expect(corDoRitmo({ kind: 'seven_day', percentUsed: 45, resetsAt: resetEm(84 * H) }, agora)).toBe('warning')
})

test('começo da janela não projeta estouro com uso baixo', () => {
  expect(corDoRitmo({ kind: 'five_hour', percentUsed: 2, resetsAt: resetEm(5 * H - 60_000) }, agora)).toBe('success')
})

test('acima de 95% é vermelho mesmo perto do reset', () => {
  expect(corDoRitmo({ kind: 'five_hour', percentUsed: 96, resetsAt: resetEm(60_000) }, agora)).toBe('error')
})

test('tempo até o reset', () => {
  expect(faltaPara(resetEm(20 * 60_000), agora)).toBe(' (reset 20min)')
  expect(faltaPara(resetEm(2 * H + 5 * 60_000), agora)).toBe(' (reset 2h05)')
  expect(faltaPara(resetEm(50 * H), agora)).toBe(' (reset 2d2h)')
})
