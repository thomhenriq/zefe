import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  serial,
} from "drizzle-orm/pg-core";

// Tabelas do better-auth (user, session, account, verification), geradas por `@better-auth/cli generate` (v1.7.25).
// user_id nas tabelas do Zefe é text sem FK de propósito: o id do better-auth é texto.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const semestre = pgTable(
  "semestre",
  {
    ano: integer("ano").notNull(),
    periodo: integer("periodo").notNull(), // 1 ou 2
    publicado: boolean("publicado").notNull().default(false),
    coletado_em: timestamp("coletado_em", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.ano, t.periodo] })],
);

export const oferecimento = pgTable(
  "oferecimento",
  {
    id: serial("id").primaryKey(),
    ano: integer("ano").notNull(),
    periodo: integer("periodo").notNull(),
    codigo: text("codigo").notNull(),
    nome: text("nome").notNull(),
    creditos: integer("creditos"),
    instituto: text("instituto"),
    campus: text("campus"),
    url: text("url"),
    coletado_em: timestamp("coletado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.ano, t.periodo, t.codigo)],
);

export const turma = pgTable("turma", {
  id: serial("id").primaryKey(),
  oferecimento_id: integer("oferecimento_id")
    .notNull()
    .references(() => oferecimento.id, { onDelete: "cascade" }),
  turma: text("turma").notNull(),
  vagas: integer("vagas"),
  matriculados: integer("matriculados"),
  horario_incompleto: boolean("horario_incompleto").notNull().default(false),
  reservas: text("reservas").array().notNull().default([]),
});

export const horario = pgTable("horario", {
  id: serial("id").primaryKey(),
  turma_id: integer("turma_id")
    .notNull()
    .references(() => turma.id, { onDelete: "cascade" }),
  dia: text("dia").notNull(), // seg | ter | qua | qui | sex | sab
  inicio: text("inicio").notNull(), // "HH:MM"
  fim: text("fim").notNull(), // "HH:MM"
  sala: text("sala"),
});

export const professor = pgTable("professor", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
});

export const turmaProfessor = pgTable(
  "turma_professor",
  {
    turma_id: integer("turma_id")
      .notNull()
      .references(() => turma.id, { onDelete: "cascade" }),
    professor_id: integer("professor_id")
      .notNull()
      .references(() => professor.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.turma_id, t.professor_id] })],
);

export const catalogoDisciplina = pgTable(
  "catalogo_disciplina",
  {
    ano: integer("ano").notNull(),
    codigo: text("codigo").notNull(),
    nome: text("nome").notNull(),
    creditos: integer("creditos"),
    ementa: text("ementa"),
    prereq_texto: text("prereq_texto"),
    alternativas: jsonb("alternativas"), // Requisito[][]
  },
  (t) => [primaryKey({ columns: [t.ano, t.codigo] })],
);

export const curso = pgTable("curso", {
  numero: integer("numero").primaryKey(),
  nome: text("nome").notNull(),
  turno: text("turno"),
});

export const curriculo = pgTable(
  "curriculo",
  {
    id: serial("id").primaryKey(),
    ano: integer("ano").notNull(),
    curso: integer("curso")
      .notNull()
      .references(() => curso.numero),
    modalidade: text("modalidade"), // nulo = sem modalidade
    modalidade_nome: text("modalidade_nome"),
    url: text("url"),
  },
  // Um currículo por (ano, curso, modalidade), nulo = sem modalidade. Dois índices parciais fazem o papel de
  // NULLS NOT DISTINCT, que o drizzle-kit 0.31 não lê de volta (push repropunha a constraint e pedia para truncar).
  (t) => [
    uniqueIndex("curriculo_com_modalidade_uq").on(t.ano, t.curso, t.modalidade).where(sql`${t.modalidade} is not null`),
    uniqueIndex("curriculo_sem_modalidade_uq").on(t.ano, t.curso).where(sql`${t.modalidade} is null`),
  ],
);

export const curriculoObrigatoria = pgTable(
  "curriculo_obrigatoria",
  {
    curriculo_id: integer("curriculo_id")
      .notNull()
      .references(() => curriculo.id, { onDelete: "cascade" }),
    codigo: text("codigo").notNull(),
    semestre_sugerido: integer("semestre_sugerido"), // nulo se não está na proposta
  },
  (t) => [primaryKey({ columns: [t.curriculo_id, t.codigo] })],
);

export const curriculoEletiva = pgTable("curriculo_eletiva", {
  id: serial("id").primaryKey(),
  curriculo_id: integer("curriculo_id")
    .notNull()
    .references(() => curriculo.id, { onDelete: "cascade" }),
  creditos: integer("creditos"),
  texto: text("texto").notNull(),
  codigos: text("codigos").array(),
  verificado: boolean("verificado").notNull().default(false),
});

export const curriculoPropostaEletiva = pgTable(
  "curriculo_proposta_eletiva",
  {
    curriculo_id: integer("curriculo_id")
      .notNull()
      .references(() => curriculo.id, { onDelete: "cascade" }),
    semestre: integer("semestre").notNull(),
    creditos: integer("creditos").notNull(),
  },
  (t) => [primaryKey({ columns: [t.curriculo_id, t.semestre] })],
);

export const perfil = pgTable("perfil", {
  user_id: text("user_id").primaryKey(),
  curso: integer("curso"),
  catalogo: integer("catalogo"),
  modalidade: text("modalidade"),
  ingresso: integer("ingresso"),
  semestre_atual: integer("semestre_atual"),
});

export const historico = pgTable(
  "historico",
  {
    user_id: text("user_id").notNull(),
    codigo: text("codigo").notNull(),
    estado: text("estado").notNull(), // cursada | cursando
    origem: text("origem").notNull(), // premarcada | aluno
  },
  (t) => [primaryKey({ columns: [t.user_id, t.codigo] })],
);

export const grade = pgTable("grade", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  ano: integer("ano").notNull(),
  periodo: integer("periodo").notNull(),
  nome: text("nome").notNull(),
  principal: boolean("principal").notNull().default(false),
});

export const gradeItem = pgTable(
  "grade_item",
  {
    grade_id: integer("grade_id")
      .notNull()
      .references(() => grade.id, { onDelete: "cascade" }),
    codigo: text("codigo").notNull(),
    turma: text("turma").notNull(),
  },
  (t) => [primaryKey({ columns: [t.grade_id, t.codigo] })],
);

export const bloqueio = pgTable("bloqueio", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  grade_id: integer("grade_id").notNull().references(() => grade.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  dia: text("dia").notNull(),
  inicio: text("inicio").notNull(),
  fim: text("fim").notNull(),
});

export const conversa = pgTable("conversa", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  titulo: text("titulo").notNull(),
  criada_em: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
});

export const mensagem = pgTable("mensagem", {
  id: serial("id").primaryKey(),
  conversa_id: integer("conversa_id")
    .notNull()
    .references(() => conversa.id, { onDelete: "cascade" }),
  papel: text("papel").notNull(),
  partes: jsonb("partes").notNull(),
  criada_em: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
});

export const acao = pgTable("acao", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  conversa_id: integer("conversa_id").references(() => conversa.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  descricao: text("descricao").notNull(),
  desfazer: jsonb("desfazer"),
  desfeita: boolean("desfeita").notNull().default(false),
  criada_em: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
});
