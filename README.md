# 🤖 PASSARINHO - UFMG

Este projeto visa democratizar o acesso à informação da UFMG, centralizando dados e serviços dispersos em uma plataforma única. O bot para WhatsApp atua como um HUB de informações, oferecendo aos alunos acesso rápido e personalizado a conteúdos relevantes com base nos seus cursos e interesses. 🎓💡

Com este bot, buscamos facilitar a comunicação e o acesso a informações acadêmicas e institucionais, alinhando-as com os interesses individuais de cada usuário, proporcionando uma experiência mais personalizada e eficiente. 🚀

## 📋 Visão Geral

O bot é projetado para facilitar a interação com os alunos da **UFMG** através do WhatsApp, podendo ser configurado para fornecer informações sobre cursos 🎓, interesses 💡 e até realizar ações automatizadas, como enviar lembretes ⏰ e interagir com sistemas externos.

Com uma configuração simples e integração com várias APIs, este bot é ideal para organizações acadêmicas ou eventos que queiram manter uma comunicação eficiente com seus participantes. 🎉

## 🛠️ Funcionalidades

- **Cadastro de Usuários**: O bot armazena informações de cadastro de usuários, como nome, curso e interesses. 📝
- **Interação via WhatsApp**: Os usuários podem interagir com o bot diretamente no WhatsApp para obter informações personalizadas. 💬
- **Envio de QR Codes**: Geração e envio de QR codes para facilitar a interação com o bot. 📲
- **Automação de Tarefas**: O bot pode ser configurado para executar tarefas automatizadas, como lembretes e alertas. ⚙️
- **Gestão de Cursos e Interesses**: As informações sobre os cursos e interesses dos usuários podem ser facilmente manipuladas e consultadas. 🔍

## 📂 Estrutura do Projeto

A estrutura do projeto é organizada da seguinte maneira:

```
bot-whatsapp-ufmg/
│
├── discloud.config          # Configuração principal do bot
├── fontes_cursos.json       # Dados sobre cursos dos alunos
├── fontes_interesses.json   # Dados sobre interesses dos alunos
├── package.json             # Dependências e scripts do projeto
├── package-lock.json        # Controle de versões das dependências
├── backup/                  # Arquivos de backup
├── bot/                     # Lógica e configuração do bot
├── controllers/             # Controladores de lógica de negócios
├── scripts/                 # Scripts auxiliares
├── services/                # Serviços integrados ao projeto
└── utils/                   # Funções utilitárias
```

### 📄 Descrição dos Arquivos e Pastas
  
- **fontes_cursos.json** e **fontes_interesses.json**: Arquivos JSON que armazenam informações sobre os cursos e interesses dos usuários, podendo ser facilmente atualizados.

- **package.json** e **package-lock.json**: Arquivos de configuração para gerenciamento de dependências e scripts do Node.js.

- **backup/**: Contém backups de dados e configurações do bot.

- **bot/**: Implementação do bot, incluindo lógica de interação, configuração e integração com o WhatsApp.

- **controllers/**: Contém a lógica de controle do bot, como processamento de comandos e interações com o usuário.

- **scripts/**: Scripts auxiliares para automação de tarefas e reset do sistema.

- **services/**: Serviços responsáveis pela integração com APIs externas e outras funcionalidades necessárias para o funcionamento do bot.

- **utils/**: Funções utilitárias que podem ser usadas em diversas partes do código, como manipulação de dados e geração de QR codes.

## 📥 Instalação

### 🔧 Pré-requisitos

Certifique-se de ter o **Node.js** e o **npm** instalados no seu sistema. Você pode verificar se já os possui com os seguintes comandos:

```bash
node -v
npm -v
```

Se não os tiver, você pode instalá-los [aqui](https://nodejs.org/).

### 🛠️ Passos para Instalar

1. Clone este repositório:
   ```bash
   git clone https://github.com/joaogfc/passarinho.git
   ```

2. Navegue até o diretório do projeto:
   ```bash
   cd bot-whatsapp-ufmg
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```
   
## 🚀 Uso

Para iniciar o bot, execute o seguinte comando:

```bash
npm start
```

Esse comando inicia o bot e suas funcionalidades. O bot ficará aguardando interações via WhatsApp e responderá de acordo com a configuração definida.

Para resetar o sistema, use o comando:

```bash
npm run reset
```

Isso irá reiniciar o bot e limpar qualquer dado temporário armazenado.

## 🤝 Contribuição

Se você deseja contribuir para o projeto, siga os seguintes passos:

1. Faça um fork deste repositório.
2. Crie uma branch para a sua feature (`git checkout -b minha-feature`).
3. Realize as alterações e commit (`git commit -am 'Adicionando nova feature'`).
4. Envie para o repositório (`git push origin minha-feature`).
5. Crie um pull request.

## 📜 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

