import { garantirExtensoes } from '@/dados/extensoes';

await garantirExtensoes();
console.log('extensões ok (unaccent)');
process.exit(0);
