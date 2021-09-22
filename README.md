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