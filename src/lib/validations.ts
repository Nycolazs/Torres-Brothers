import { z } from "zod"

// ── Helpers ────────────────────────────────────────────────────────

const requiredString = z
  .string()
  .min(1, { message: "Campo obrigatório" })

const positiveNumber = z
  .number({ message: "Valor deve ser um número" })
  .positive({ message: "Valor deve ser positivo" })

const optionalString = z.string().optional()

// ── Transaction Schema ─────────────────────────────────────────────

export const transactionSchema = z.object({
  type: z.enum(["income", "cost", "expense"], {
    message: "Selecione o tipo de lançamento",
  }),
  description: requiredString.max(200, {
    message: "Descrição deve ter no máximo 200 caracteres",
  }),
  amount: positiveNumber,
  categoryId: requiredString.describe("Selecione uma categoria"),
  costCenterId: optionalString,
  bankAccountId: requiredString.describe("Selecione uma conta bancária"),
  competenceDate: z.date({ message: "Data de competência inválida" }),
  dueDate: z.date({ message: "Data de vencimento inválida" }),
  paymentDate: z.date({ message: "Data de pagamento inválida" }).optional(),
  status: z.enum(["paid", "pending", "overdue", "cancelled"], {
    message: "Selecione o status",
  }),
  paymentMethod: z
    .enum([
      "cash",
      "pix",
      "credit_card",
      "debit_card",
      "bank_transfer",
      "boleto",
      "check",
    ], { message: "Selecione a forma de pagamento" })
    .optional(),
  isInstallment: z.boolean(),
  installmentNumber: z
    .number()
    .int({ message: "Número da parcela deve ser inteiro" })
    .positive({ message: "Número da parcela deve ser positivo" })
    .optional(),
  totalInstallments: z
    .number()
    .int({ message: "Total de parcelas deve ser inteiro" })
    .min(2, { message: "Mínimo de 2 parcelas" })
    .max(120, { message: "Máximo de 120 parcelas" })
    .optional(),
  installmentGroupId: optionalString,
  isRecurring: z.boolean(),
  recurrenceType: z
    .enum(["daily", "weekly", "monthly", "yearly"], {
      message: "Selecione o tipo de recorrência",
    })
    .optional(),
  recurrenceEndDate: z
    .date({ message: "Data de fim da recorrência inválida" })
    .optional(),
  notes: z
    .string()
    .max(500, { message: "Observações devem ter no máximo 500 caracteres" })
    .optional(),
  attachmentUrl: z.string().url({ message: "URL inválida" }).optional().or(z.literal("")),
  tags: z.string().optional(),
  contactName: z
    .string()
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
    .optional(),
})

export type TransactionSchemaType = z.infer<typeof transactionSchema>

// ── Category Schema ────────────────────────────────────────────────

export const categorySchema = z.object({
  name: requiredString.max(50, {
    message: "Nome deve ter no máximo 50 caracteres",
  }),
  type: z.enum(["income", "cost", "expense"], {
    message: "Selecione o tipo",
  }),
  color: requiredString.regex(/^#([0-9a-fA-F]{6})$/, {
    message: "Cor inválida (use formato hexadecimal)",
  }),
  icon: requiredString,
})

export type CategorySchemaType = z.infer<typeof categorySchema>

// ── Cost Center Schema ─────────────────────────────────────────────

export const costCenterSchema = z.object({
  name: requiredString.max(50, {
    message: "Nome deve ter no máximo 50 caracteres",
  }),
  description: z
    .string()
    .max(200, { message: "Descrição deve ter no máximo 200 caracteres" })
    .optional(),
  isActive: z.boolean().optional(),
})

export type CostCenterSchemaType = z.infer<typeof costCenterSchema>

// ── Bank Account Schema ────────────────────────────────────────────

export const bankAccountSchema = z.object({
  name: requiredString.max(50, {
    message: "Nome deve ter no máximo 50 caracteres",
  }),
  type: z.enum(["checking", "savings", "cash", "investment"], {
    message: "Selecione o tipo de conta",
  }),
  bankName: z
    .string()
    .max(50, { message: "Nome do banco deve ter no máximo 50 caracteres" })
    .optional(),
  agency: z
    .string()
    .max(10, { message: "Agência deve ter no máximo 10 caracteres" })
    .optional(),
  accountNumber: z
    .string()
    .max(20, { message: "Número da conta deve ter no máximo 20 caracteres" })
    .optional(),
  initialBalance: z.number({ message: "Saldo inicial deve ser um número" }),
  color: requiredString.regex(/^#([0-9a-fA-F]{6})$/, {
    message: "Cor inválida (use formato hexadecimal)",
  }),
  isActive: z.boolean().optional(),
})

export type BankAccountSchemaType = z.infer<typeof bankAccountSchema>

// ── Budget Schema ──────────────────────────────────────────────────

export const budgetSchema = z.object({
  categoryId: requiredString.describe("Selecione uma categoria"),
  month: z
    .number()
    .int()
    .min(1, { message: "Mês deve ser entre 1 e 12" })
    .max(12, { message: "Mês deve ser entre 1 e 12" }),
  year: z
    .number()
    .int()
    .min(2020, { message: "Ano deve ser a partir de 2020" })
    .max(2100, { message: "Ano inválido" }),
  plannedAmount: positiveNumber,
})

export type BudgetSchemaType = z.infer<typeof budgetSchema>

// ── Auth Schemas ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: requiredString.email({ message: "E-mail inválido" }),
  password: requiredString.min(6, {
    message: "Senha deve ter no mínimo 6 caracteres",
  }),
})

export type LoginSchemaType = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: requiredString.max(100, {
      message: "Nome deve ter no máximo 100 caracteres",
    }),
    email: requiredString.email({ message: "E-mail inválido" }),
    password: requiredString.min(6, {
      message: "Senha deve ter no mínimo 6 caracteres",
    }),
    confirmPassword: requiredString,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export type RegisterSchemaType = z.infer<typeof registerSchema>

// ── Profile Schema ─────────────────────────────────────────────────

export const profileSchema = z.object({
  name: requiredString.max(100, {
    message: "Nome deve ter no máximo 100 caracteres",
  }),
  email: requiredString.email({ message: "E-mail inválido" }),
  phone: z
    .string()
    .regex(/^(\(\d{2}\)\s?\d{4,5}-\d{4})?$/, {
      message: "Telefone inválido. Use o formato (XX) XXXXX-XXXX",
    })
    .optional()
    .or(z.literal("")),
})

export type ProfileSchemaType = z.infer<typeof profileSchema>

// ── Company Settings Schema ────────────────────────────────────────

export const companySettingsSchema = z.object({
  companyName: requiredString.max(100, {
    message: "Nome da empresa deve ter no máximo 100 caracteres",
  }),
  companyDocument: z
    .string()
    .regex(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})?$/, {
      message: "CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX",
    })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^(\(\d{2}\)\s?\d{4,5}-\d{4})?$/, {
      message: "Telefone inválido. Use o formato (XX) XXXXX-XXXX",
    })
    .optional()
    .or(z.literal("")),
  currency: z.string().optional(),
  locale: z.string().optional(),
})

export type CompanySettingsSchemaType = z.infer<typeof companySettingsSchema>
