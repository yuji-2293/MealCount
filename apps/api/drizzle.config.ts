import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // schema の定義場所
  schema: './src/db/schema.ts',
  // 出力先のディレクトリ
  out: './drizzle',
  // 使用するSQLの種類
  dialect: 'sqlite',
});
