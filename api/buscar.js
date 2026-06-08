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
Encontre 5 fornecedores reais relacionados a:

${busca}

Responda SOMENTE neste formato, sem introdução, sem conclusão, sem dicas e sem explicações:

EMPRESA:
CIDADE:
TELEFONE:
SITE:
PRODUTOS:

Regras obrigatórias:
- Não escreva frases como "Com certeza", "Aqui estão", "Dica", "Observação" ou similares.
- Não coloque markdown.
- Não use asteriscos.
- Não use listas com numeração.
- Não invente telefone.
- Se não encontrar telefone, escreva: não encontrado
- Se não encontrar site, escreva: não encontrado
- O telefone deve ser preferencialmente WhatsApp.
- Retorne apenas números de WhatsApp/telefone comercial quando encontrar.
- Formato do telefone: (DDD) 99999-9999 ou (DDD) 9999-9999.
- Separe cada fornecedor com uma linha em branco.
- Em PRODUTOS, use palavras separadas por vírgula.
`;

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    let texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Nenhum resultado encontrado.";

    texto = limparResposta(texto);

    return res.status(200).json({
      resultado: texto
    });

  } catch (erro) {
    return res.status(500).json({
      erro: erro.message
    });
  }
}

function limparResposta(texto) {
  return texto
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/Com certeza!?.*?(?=EMPRESA:)/gis, "")
    .replace(/Aqui estão.*?(?=EMPRESA:)/gis, "")
    .replace(/Abaixo estão.*?(?=EMPRESA:)/gis, "")
    .replace(/Dica:.*$/gis, "")
    .replace(/Observação:.*$/gis, "")
    .replace(/É sempre recomendável.*$/gis, "")
    .replace(/Além dessas.*$/gis, "")
    .replace(/^\d+\.\s*/gm, "")
    .trim();
}
