# my-claude-code

Meus mods para o Claude Code.

## uso-sessao

Uma linha acima do prompt com o contexto da sessão, o custo e quanto sobra dos limites da assinatura:

```
ctx 50k/200k (25%) · $1.23 · 5h: 40% livre (reset 1h20) · 7d: 82% livre (reset 3d4h)
```

- **Contexto**: verde abaixo de 50%, amarelo até 80%, vermelho acima.
- **Limites 5h e 7d**: a cor vem do ritmo. O mod projeta quanto você terá usado no reset, no ritmo atual: verde abaixo de 85%, amarelo até 100%, vermelho se for estourar antes do reset (ou acima de 95% já usado).
- **Custo**: o mesmo valor do `/cost`. Numa assinatura é o equivalente em API, não o que você paga.

### Instalar

```
/plugin install uso-sessao --marketplace diogosarti/my-claude-code
```

Responda `y` para adicionar o marketplace e escolha o escopo de usuário.
