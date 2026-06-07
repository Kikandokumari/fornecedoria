export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {
    const { busca } = req.body;

    if (!busca) {
      return res.status(400).json({
        erro: "Busca não enviada."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        erro: "Chave GEMINI_API_KEY não configurada no Vercel."
      });
    }

    const prompt = `
Você é uma IA que ajuda pessoas a encontrar fornecedores.

O usuário pesquisou:
"${busca}"

Responda em português do Brasil.

IMPORTANTE:
- Não invente telefone.
- Se não souber telefone ou site, escreva "não encontrado".
- Dê sugestões de tipos de fornecedores e formas de procurar.
- Organize a resposta de forma limpa.

Formato:

FORNECEDORES E CAMINHOS RECOMENDADOS

1. Nome ou tipo de fornecedor:
Cidade:
Telefone:
Site:
O que fornece:
Observação:

2. Nome ou tipo de fornecedor:
Cidade:
Telefone:
Site:
O que fornece:
Observação:

No final, adicione:
"Dica: confirme preços, entrega mínima e disponibilidade direto com o fornecedor."
`;

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      return res.status(500).json({
        erro: dados.error?.message || "Erro ao chamar Gemini API."
      });
    }

    const texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Nenhum resultado encontrado.";

    return res.status(200).json({
      resultado: texto
    });

  } catch (erro) {
    return res.status(500).json({
      erro: erro.message || "Erro interno."
    });
  }
}
