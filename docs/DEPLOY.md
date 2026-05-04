# Deploy

## Plataforma padrão

- Vercel

## Regras

- O projeto deve passar no build antes do deploy.
- Variáveis de ambiente devem ficar no painel da Vercel.
- Nunca commitar secrets.
- Firebase config pública pode ficar no client, mas secrets privados não.

## Variáveis comuns

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
BLOB_READ_WRITE_TOKEN=
```

## Firebase

- Ativar Firebase Auth com provedor e-mail/senha.
- Ativar Firebase Auth com provedor Google se o login por Gmail for usado.
- Criar Firestore em modo produção.
- Configurar regras de segurança por papel antes de uso real com estudantes.
- Preencher as variáveis `NEXT_PUBLIC_FIREBASE_*` na Vercel e no `.env.local`.

## Vercel Blob

- Criar um store do Vercel Blob no projeto Vercel: `Storage` > `Create Database` > `Blob`.
- Usar acesso `Private`, pois as provas PDF e planilhas podem conter dados educacionais.
- Selecionar os ambientes onde o token será usado. Quando o store é criado dentro do projeto, a Vercel adiciona `BLOB_READ_WRITE_TOKEN` automaticamente.
- Para rodar localmente, sincronizar as variáveis com `vercel env pull .env.local` ou copiar o valor do token para o `.env.local`.
- Reiniciar o `npm run dev` depois de preencher `BLOB_READ_WRITE_TOKEN`.
- Os uploads são enviados para `/api/uploads` e armazenados em `enade/uploads/*`.
- Provas PDF analisadas são enviadas para `/api/provas/analyze` e armazenadas em `enade/provas/*` quando `BLOB_READ_WRITE_TOKEN` existir.
- Sem `BLOB_READ_WRITE_TOKEN`, a análise do PDF continua funcionando, mas o arquivo não é persistido no Blob.
- As rotas atuais recebem o arquivo no servidor, adequado para PDFs/planilhas pequenos como os exemplos em `provas/`. Para arquivos maiores que o limite de payload das Vercel Functions, evoluir para client upload direto ao Blob e analisar o arquivo a partir do Blob.

## Checklist antes do deploy

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Testar login
- [ ] Testar fluxo principal
- [ ] Testar responsividade
