import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const hoje = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT = `Você é um assistente especializado em interpretar mensagens financeiras enviadas via WhatsApp para um sistema chamado "Minhas Vendas".

Sua função é transformar mensagens em linguagem natural (português do Brasil) em um JSON estruturado.

REGRAS:
1. Identifique o tipo da transação: "venda", "despesa", "entrada", "saida"
2. Extraia os campos:
   - tipo: string
   - descricao: string clara e amigável
   - produto: string ou null
   - categoria: string ou null (ex: "roupa", "alimentação", "fornecedor", "transporte")
   - quantidade: número ou null
   - valor_unitario: número ou null
   - valor_total: número obrigatório
   - forma_pagamento: "pix", "dinheiro", "cartao", "boleto", "transferencia" ou null
   - data: ISO 8601 (usar data atual se não informada: ${hoje})

3. Interpretação:
   - "vendi", "venda" → tipo = venda
   - "gastei", "paguei", "comprei" → tipo = despesa
   - "recebi" → tipo = entrada

4. Categorias automáticas:
   - roupas → "roupa"
   - comida, almoço → "alimentação"
   - fornecedor → "fornecedor"
   - uber, gasolina → "transporte"

5. Normalização: "50,90" → 50.90 | "1.000" → 1000
6. Tolerante com erros de digitação
7. Se não tiver certeza → null
8. Retorne APENAS JSON válido, sem markdown ou explicações.`;

export interface ParsedTransaction {
  tipo: "venda" | "despesa" | "entrada" | "saida";
  descricao: string;
  produto: string | null;
  categoria: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  valor_total: number;
  forma_pagamento: "pix" | "dinheiro" | "cartao" | "boleto" | "transferencia" | null;
  data: string;
}

export async function parseMessage(mensagem: string): Promise<ParsedTransaction> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: mensagem }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Resposta inesperada da API");

  const json = JSON.parse(content.text.trim());
  return json as ParsedTransaction;
}
