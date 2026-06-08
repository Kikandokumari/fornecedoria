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
        erro: "GEMINI_API_KEY não configurada no Vercel."
      });
    }

    const prompt = `
Você é uma IA para ajudar empreendedores a encontrar fornecedores.

Pesquisa do usuário:
"${busca}"

Responda em português do Brasil.

Regras:
- Não invente telefone.
- Não invente site.
- Se não tiver certeza, escreva "não encontrado".
- Dê sugestões úteis de onde procurar.
- Seja direto.

Formato:

FORNECEDORES RECOMENDADOS

1. Tipo/Nome:
Cidade:
Telefone:
Site:
O que fornece:
Observação:

2. Tipo/Nome:
Cidade:
Telefone:
Site:
O que fornece:
Observação:

3. Tipo/Nome:
Cidade:
Telefone:
Site:
O que fornece:
Observação:

DICA FINAL:
Confirme preços, pedido mínimo e entrega direto com o fornecedor.
`;

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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
