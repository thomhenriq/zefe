# Zefe

Planejador de grade e integralização para alunos da Unicamp, com um assistente que responde com base nos dados públicos da DAC. Mostra horários, salas, vagas previstas, pré-requisitos e a árvore do curso. Projeto independente: **não é oficial** da Unicamp nem da DAC.

## Requisitos

- [Bun](https://bun.sh) 1.4 ou mais novo
- Docker (para o Postgres local)
- Credenciais AWS com acesso ao Bedrock (só para o assistente)

## Configuração

```bash
cp .env.example .env.local
```

Variáveis de `.env.local`:

- `DATABASE_URL`: conexão com o Postgres local, por exemplo `postgres://zefe:zefe@127.0.0.1:5435/zefe`.
- `BETTER_AUTH_SECRET`: segredo de sessão. Gere com `openssl rand -base64 32`.
- `BETTER_AUTH_URL`: endereço do app, `http://127.0.0.1:4100`.
- `AWS_PROFILE` e `AWS_REGION`: perfil da AWS e região. O assistente usa `us-east-1`.
- `ZEFE_MODELO`: modelo do Bedrock. Padrão `us.amazon.nova-2-lite-v1:0`.
- `ZEFE_LIBERADOS`: e-mails com acesso ao assistente, separados por vírgula. Exemplo: `voce@exemplo.com,outra@exemplo.com`.

## Subir

```bash
bun install
bun run db:up          # sobe o Postgres em 127.0.0.1:5435
bun run db:push        # cria as tabelas (cada push reaplica um ALTER ... SET DEFAULT '{}' idempotente, sem efeito)
bun run db:extensoes   # extensões do banco
```

### Dados

A coleta lê páginas públicas da DAC: no máximo 2 requisições simultâneas, com User-Agent `zefe/0.1`. Um semestre de caderno leva cerca de 15 minutos.

```bash
bun run sync catalogo <ano>                 # catálogo de disciplinas do ano
bun run sync caderno <ano> <1|2> [INST,…]   # oferecimentos de um semestre, opcionalmente só alguns institutos
```

Para ter um usuário de demonstração com histórico e uma grade de exemplo:

```bash
bun run demo
```

### Rodar

```bash
bun run dev   # http://127.0.0.1:4100
```

## Entrar

Em `/entrar`, digite o e-mail. O código de 6 dígitos aparece no terminal onde o `bun run dev` está rodando (ainda não há envio de e-mail). Para o usuário de demonstração, use `demo@zefe.local`.

## Liberar um e-mail para o assistente

Adicione o e-mail em `ZEFE_LIBERADOS` no `.env.local` e reinicie o `bun run dev`. Quem não está na lista entra e usa o planejador normalmente, mas o assistente responde que ainda não está liberado.

## Comandos

```bash
bun test              # testes
bun run build         # build de produção
bun run shots         # capturas de todas as telas em .shots/ (1440 e 390 px, claro e escuro); precisa do app rodando
bun run zefe:avaliar  # roda os cenários do assistente no Bedrock real: custa dinheiro. Resultado em docs/zefe-avaliacao.md
```

`bun run shots` usa `ZEFE_URL` (padrão `http://127.0.0.1:4100`) e entra como `demo@zefe.local` lendo o código direto do banco. Se o demo não existir, rode `bun run demo` antes.

## Tema

Claro é o padrão. O escuro só vale com `data-theme="dark"` no `<html>`; o app não segue o tema do sistema.
