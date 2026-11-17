'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { datasPadrao, erroPeriodo } from '@/dominio/ics';

const CAMPO = 'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

/** Baixa a grade como .ics. O aluno informa início e fim das aulas, porque o Zefe não conhece o calendário oficial. */
export function ExportarIcs({ gradeId, ano, periodo }: { gradeId: string; ano: number; periodo: 1 | 2 }) {
  const padrao = datasPadrao(ano, periodo);
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const id = useId();
  const motivo = erroPeriodo(inicio, fim);
  const href = `/planejador/${encodeURIComponent(gradeId)}/calendario.ics?${new URLSearchParams({ inicio, fim })}`;

  return (
    <section aria-labelledby={`${id}-titulo`} className="space-y-3 rounded-xl border bg-card p-4">
      <h2 id={`${id}-titulo`} className="font-heading text-lg font-semibold">Exportar para o calendário</h2>
      <p className="max-w-[68ch] text-sm text-muted-foreground">
        Baixa um arquivo .ics com as aulas desta grade, repetidas toda semana até o último dia. O Zefe não conhece o calendário oficial da Unicamp: confira as datas.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-inicio`} className="text-sm font-medium">Primeiro dia de aula</label>
          <input id={`${id}-inicio`} type="date" className={CAMPO} value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-fim`} className="text-sm font-medium">Último dia de aula</label>
          <input id={`${id}-fim`} type="date" className={CAMPO} value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
      </div>
      {motivo ? <p role="alert" className="text-sm text-destructive">{motivo}.</p> : null}
      {motivo ? (
        <Button disabled>Baixar .ics</Button>
      ) : (
        <Button render={<a href={href} />} nativeButton={false}>Baixar .ics</Button>
      )}
    </section>
  );
}
