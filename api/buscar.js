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
        erro: "Informe uma busca."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        erro: "GEMINI_API_KEY não encontrada."
      });
    }

    const prompt = `
Encontre fornecedores para:

${busca}

Retorne:

- Nome da empresa
- Cidade
- Telefone (se existir)
- Site (se existir)
- O que fornece

Responda em português.
`;

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        erro: dados.error?.message || "Erro ao consultar Gemini"
      });
    }

    const resultado =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Nenhum resultado encontrado.";

    return res.status(200).json({
      resultado
    });

  } catch (erro) {
    return res.status(500).json({
      erro: erro.message
    });
  }
}
