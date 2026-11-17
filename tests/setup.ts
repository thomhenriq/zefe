// bun test não carrega .env.local (NODE_ENV=test); usa o Postgres local do docker-compose.
process.env.DATABASE_URL ??= "postgres://zefe:zefe@127.0.0.1:5435/zefe";
