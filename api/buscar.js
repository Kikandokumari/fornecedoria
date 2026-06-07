export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {

    const { busca } = req.body;

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
                  text: `
Pesquise fornecedores relacionados a:

${busca}

Retorne:

- Nome da empresa
- Cidade
- Telefone (se encontrar)
- Site (se encontrar)
- O que fornece

Organize em tópicos.
`
                }
              ]
            }
          ]
        })
      }
    );

    const dados = await resposta.json();

    const texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text ||
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
