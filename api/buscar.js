export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { busca } = req.body;

    if (!busca) {
      return res.status(400).json({ erro: "Informe uma busca." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        erro: "GEMINI_API_KEY não encontrada no Vercel."
      });
    }

    const prompt = `
Encontre 5 fornecedores reais relacionados a:

${busca}

Responda SOMENTE neste formato:

EMPRESA:
CIDADE:
TELEFONE:
SITE:
PRODUTOS:

Regras:
- Não escreva introdução.
- Não escreva conclusão.
- Não escreva dica.
- Não use markdown.
- Não use asteriscos.
- Se não encontrar telefone, escreva: não encontrado
- Se não encontrar site, escreva: não encontrado
- Separe cada fornecedor com uma linha em branco.
`;

    const modelos = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    let ultimoErro = "";

    for (const modelo of modelos) {
      const resposta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      const dados = await resposta.json();

      if (resposta.ok) {
        let texto =
          dados?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Nenhum resultado encontrado.";

        texto = limparResposta(texto);

        return res.status(200).json({
          resultado: texto
        });
      }

      ultimoErro = dados?.error?.message || "Erro desconhecido.";
    }

    return res.status(500).json({
      erro: ultimoErro
    });

  } catch (erro) {
    return res.status(500).json({
      erro: erro.message || "Erro interno."
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
