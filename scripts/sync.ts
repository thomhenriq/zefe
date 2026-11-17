import { criarBaixar } from '@/dac/baixar';
import { sincronizarCaderno } from '@/dac/sync-caderno';
import { db } from '@/db';

const [cmd, ano, periodo, insts] = Bun.argv.slice(2);
if (cmd !== 'caderno' || !ano || (periodo !== '1' && periodo !== '2')) {
  console.error('uso: bun run sync caderno <ano> <1|2> [FT,FCA,...]');
  process.exit(1);
}
const { erros } = await sincronizarCaderno(db, criarBaixar(), Number(ano), Number(periodo) as 1 | 2, { institutos: insts?.split(','), log: console.log });
process.exit(erros.length ? 2 : 0);
