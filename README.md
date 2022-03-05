Still work in progress.

Most of the dataloader + pagination logic can be found here: https://github.com/KDKHD/GraphQL/blob/main/graphQL/modules/parent/provider.ts

## Update Prisma Schema
```
npx prisma db pull
npx prisma generate
npm uninstall @prisma/client
npm install @prisma/client
```

Restart vscode

## Update Postgres Schema
```
npx prisma migrate dev --create-only (Otherwise just create a folder and increment the number)
npx prisma migrate dev
```

Restart vscode
