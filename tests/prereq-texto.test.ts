import { expect, test } from "bun:test";
import { situacaoPrereq } from "@/dominio/prereq-texto";

test("situacaoPrereq", () => {
  expect(situacaoPrereq("SI100+SI120", 1)).toBe("lidos");
  expect(situacaoPrereq("Não há pré-requisitos para essa disciplina", 0)).toBe("nenhum");
  expect(situacaoPrereq("", 0)).toBe("nenhum");
  expect(situacaoPrereq("Ter cursado 100 créditos", 0)).toBe("naoverificado");
});
