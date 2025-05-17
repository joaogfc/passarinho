# 🤖 PASSARINHO — Bot WhatsApp UFMG

O projeto **Passarinho** visa democratizar o acesso à informação da UFMG, centralizando dados e serviços dispersos em uma plataforma única. Utilizando o WhatsApp como canal de comunicação, o bot atua como um HUB de informações personalizadas para alunos da UFMG, com base em curso, interesses e preferências.

---

## 📋 Visão Geral

Este bot oferece:

- Acesso automatizado a informações institucionais.
- Consulta personalizada de cardápios do RU.
- Consulta de rotas dos ônibus internos da UFMG.
- Cadastro de usuários com segmentação por curso/interesse.
- Redirecionamento inteligente de mensagens de grupos.
- Experiência focada na praticidade, sem depender de portais web.

---

## 🧱 Arquitetura e Estrutura de Pastas

```bash
bot-whatsapp-ufmg/
│
├── bot/                # Lógica principal do bot e integração com WhatsApp
├── controllers/        # Controladores de fluxo e comandos
├── data/               # Dados (itinerários, siglas, fontes de cursos, fontes de interesses, etc)
├── repositories/       # Persistência e abstração de dados do usuário
├── services/           # Serviços de negócio (cadastro, onboarding, grupos, etc)
├── utils/              # Utilitários e mensagens centralizadas
├── package.json        # Dependências e scripts do projeto
├── README.md           # Documentação do projeto
└── LICENSE             # Licença GPLv3
```

---

## 🧠 Arquitetura de Execução

```text
[Usuário]
   ↓
[bot/index.js] → Baileys
   ↓
[controllers/] → [services/] → [repositories/ | data/]
   ↓
[utils/] → mensagens.js
```

---

## ⚙️ Funcionalidades

- **Cadastro e atualização de usuários.**
- **Consulta ao cardápio do RU.**
- **Redirecionamento de mensagens por curso/interesse.**
- **Consulta de itinerários internos da UFMG.**
- **Criação de figurinhas.**
- **Execução de tarefas automáticas com `node-cron`.**

---

## 🔄 Fluxos Principais

### 1. Cadastro de Usuário
- **Comando:** `/cadastrar`
- **Etapas:**
  - Pergunta nome, curso, interesses, preferências de refeição/RU.
  - Valida curso/interesse por similaridade.
  - Salva no repositório.

**Arquivo:** `cadastroService.js`

### 2. Atualização de Cadastro
- **Comando:** `/atualizar`
- **Etapas:**
  - Mostra dados atuais.
  - Permite alteração ou descadastro.

**Arquivo:** `cadastroService.js`

### 3. Consulta ao Cardápio do RU
- **Comando:** `/cardapio`
- **Etapas:**
  - Consulta preferências salvas.
  - Usa Puppeteer para scraping.
  - Retorna refeições dos RUs selecionados.

**Arquivos:** `onboardingService.js`, `mensagens.js`

### 4. Itinerários Internos
- **Comando exemplo:** `Como vou do ICEX ao CAD 2?`
- **Etapas:**
  - Normaliza origem/destino por siglas/similaridade.
  - Retorna linhas e horários disponíveis.

**Arquivos:** `internosService.js`, `siglasInternos.js`

### 5. Redirecionamento de Mensagens de Grupo
- **Entrada:** Mensagens em grupos temáticos.
- **Processo:** Encaminha para usuários com cursos/interesses relacionados.

**Arquivo:** `grupoService.js`

---

## 📦 Dependências Principais

- `@whiskeysockets/baileys`: Integração com WhatsApp.
- `string-similarity`: Validação por similaridade.
- `puppeteer`: Scraping de sites como o RU.
- `node-cron`: Agendamento de tarefas.
- `wa-sticker-formatter`: Criação de figurinhas.
- `qrcode-terminal`: Geração de QR code para login.

---

## 🌐 Stack Tecnológico

- **Linguagem:** Node.js (JavaScript)
- **Persistência:** Arquivos JSON (via repositórios)
- **Agendamento:** `node-cron`
- **Scraping:** `puppeteer`
- **Mensagens:** Centralizadas em `mensagens.js`

---

## 🛠️ Execução Local

### Requisitos:
- Node.js
- npm

### Passos:
```bash
git clone https://github.com/joaogfc/passarinho.git
cd bot-whatsapp-ufmg
npm install
npm start
```

> ⚠️ Após o primeiro login via QR Code, a pasta `auth_info/` será criada com as credenciais. Não compartilhe.


## 📊 Estrutura de Dados (Exemplo)

```json
{
  "nome": "João",
  "curso": "Ciência da Computação",
  "interesses": ["pesquisa", "tecnologia"],
  "preferencias": {
    "ru": ["RU Setorial I"],
    "refeicao": ["almoço"]
  }
}
```

---

## 🙋 Contribuição

1. Faça um fork.
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit: `git commit -am 'Minha melhoria'`
4. Push: `git push origin minha-feature`
5. Crie um pull request.

---

## 📫 Contato

Abra uma *issue* no GitHub ou envie um email para joaogfc4@ufmg.br

---

## 📜 Licença

Licença MIT. Veja o arquivo [LICENSE](./LICENSE).

---

## 🎉 Agradecimentos

Agradecimento à equipe Baileys e aos colaboradores do projeto.  
Colaborador principal: [@joaov-tst](https://github.com/joaov-tst)
