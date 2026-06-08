export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {
    const { busca } = req.body;

    const prompt = `
Encontre 5 fornecedores de:

${busca}

Retorne EXATAMENTE neste formato:

EMPRESA:
CIDADE:
TELEFONE:
SITE:
PRODUTOS:

Não escreva introduções.
Não escreva explicações.
Não escreva observações.
Apenas a lista.
`;

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    const texto =
      dados.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Nenhum resultado encontrado.";

    return res.status(200).json({
      resultado: texto
    });

  } catch (erro) {
    return res.status(500).json({
      erro: erro.message
    });
  }
}
