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
      return res.status(500).json({ erro: "GEMINI_API_KEY não encontrada." });
    }

    const prompt = `
Encontre 5 fornecedores reais relacionados a:

${busca}

Responda SOMENTE neste formato:

EMPRESA:
CIDADE:
TELEFONE:
WHATSAPP:
SITE:
PRODUTOS:

Regras:
- Não escreva introdução.
- Não escreva conclusão.
- Não escreva dica.
- Não use markdown.
- Não use asteriscos.
- Não use numeração.
- Se não souber telefone, coloque: não encontrado
- Se não souber WhatsApp, coloque: não encontrado
- Se não souber site, coloque: não encontrado
- Em WHATSAPP, coloque apenas celular brasileiro se encontrar.
- Separe cada empresa com uma linha em branco.
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const dados = await resposta.json();

      if (resposta.ok) {
        let texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        texto = limparResposta(texto);

        const fornecedores = extrairFornecedores(texto);

        return res.status(200).json({ fornecedores });
      }

      ultimoErro = dados?.error?.message || "Erro desconhecido.";
    }

    return res.status(500).json({ erro: ultimoErro });

  } catch (erro) {
    return res.status(500).json({ erro: erro.message || "Erro interno." });
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
    .replace(/^\d+\.\s*/gm, "")
    .trim();
}

function extrairCampo(bloco, campo) {
  const regex = new RegExp(`${campo}:\\s*(.*)`, "i");
  const match = bloco.match(regex);
  return match ? match[1].trim() : "não encontrado";
}

function limparNumero(numero) {
  return String(numero || "").replace(/\D/g, "");
}

function formatarNumero(numero) {
  const limpo = limparNumero(numero);

  if (limpo.length === 13 && limpo.startsWith("55")) {
    return `(${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`;
  }

  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }

  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }

  return "não encontrado";
}

function pareceWhatsapp(numero) {
  const limpo = limparNumero(numero);

  if (limpo.length === 13 && limpo.startsWith("55")) {
    return limpo[4] === "9";
  }

  if (limpo.length === 11) {
    return limpo[2] === "9";
  }

  return false;
}

function numeroWhatsapp(numero) {
  let limpo = limparNumero(numero);

  if (limpo.length === 11) {
    limpo = "55" + limpo;
  }

  if (limpo.length === 13 && limpo.startsWith("55")) {
    return limpo;
  }

  return "";
}

function extrairFornecedores(texto) {
  const blocos = texto
    .split(/\n\s*\n/)
    .filter(bloco => bloco.toUpperCase().includes("EMPRESA:"));

  return blocos.map(bloco => {
    const empresa = extrairCampo(bloco, "EMPRESA");
    const cidade = extrairCampo(bloco, "CIDADE");
    const telefone = extrairCampo(bloco, "TELEFONE");
    const whatsapp = extrairCampo(bloco, "WHATSAPP");
    const site = extrairCampo(bloco, "SITE");
    const produtos = extrairCampo(bloco, "PRODUTOS");

    const whatsappValido = pareceWhatsapp(whatsapp);

    return {
      empresa,
      cidade,
      telefone: formatarNumero(telefone),
      whatsapp: whatsappValido ? formatarNumero(whatsapp) : "não encontrado",
      whatsappLink: whatsappValido ? numeroWhatsapp(whatsapp) : "",
      site,
      produtos
    };
  });
}
