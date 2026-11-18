// Guarda do harness: pergunta sobre o ESTADO da grade (conflito, créditos, o que tem nela) sempre começa com ver_grade.
// O modelo pequeno reaproveita o resultado de um turno anterior (já velho) em vez de chamar a ferramenta.
// shortcut: vocabulário fixo em português; pergunta com outras palavras cai no modelo, que pode errar. Ampliar com dados reais.
const ESTADO_DA_GRADE = /conflit|choque|sobreposi|colis|colid|\bbat(e|em)\b|cr[eé]ditos|carga hor|horas de aula|quantas (mat[eé]rias|disciplinas|aulas)|o que (eu )?(tenho|tem) na (minha )?grade|(est[aá]|ficou|fica) (a )?(minha )?grade|quais bloqueios/i;

export const perguntaDeGrade = (texto: string): boolean => ESTADO_DA_GRADE.test(texto);
