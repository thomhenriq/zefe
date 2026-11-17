import { criarBaixar } from '@/dac/baixar';
import { sincronizarCaderno } from '@/dac/sync-caderno';
import { sincronizarCatalogo } from '@/dac/sync-catalogo';
import { db } from '@/db';

const [cmd, ano, a3, a4] = Bun.argv.slice(2);
let erros: string[];
if (cmd === 'caderno' && ano && (a3 === '1' || a3 === '2')) {
  ({ erros } = await sincronizarCaderno(db, criarBaixar(), Number(ano), Number(a3) as 1 | 2, { institutos: a4?.split(','), log: console.log }));
} else if (cmd === 'catalogo' && ano) {
  ({ erros } = await sincronizarCatalogo(db, criarBaixar(), Number(ano), { cursos: a3?.split(',').map(Number), log: console.log }));
} else {
  console.error('uso: bun run sync caderno <ano> <1|2> [FT,FCA,...] | catalogo <ano> [94,34,...]');
  process.exit(1);
}
process.exit(erros.length ? 2 : 0);
