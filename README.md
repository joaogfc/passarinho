# 🤖 PASSARINHO - UFMG

Este projeto visa democratizar o acesso à informação da UFMG, centralizando dados e serviços dispersos em uma plataforma única. O bot para WhatsApp atua como um HUB de informações, oferecendo aos alunos acesso rápido e personalizado a conteúdos relevantes com base nos seus cursos e interesses. 🎓💡

Com este bot, buscamos facilitar a comunicação e o acesso a informações acadêmicas e institucionais, alinhando-as com os interesses individuais de cada usuário, proporcionando uma experiência mais personalizada e eficiente. 🚀

## 📋 Visão Geral

O bot é projetado para facilitar a interação com os alunos da **UFMG** através do WhatsApp, podendo ser configurado para fornecer informações sobre cursos 🎓, interesses 💡 e até realizar ações automatizadas, como enviar lembretes ⏰ e interagir com sistemas externos.

Com uma configuração simples e integração com várias APIs, este bot é ideal para organizações acadêmicas ou eventos que queiram manter uma comunicação eficiente com seus participantes. 🎉

## 🛠️ Funcionalidades

- **Cadastro de Usuários**: O bot armazena informações de cadastro de usuários, como nome, curso e interesses. 📝
- **Interação via WhatsApp**: Os usuários podem interagir com o bot diretamente no WhatsApp para obter informações personalizadas. 💬
- **Automação de Tarefas**: O bot pode ser configurado para executar tarefas automatizadas, como lembretes e alertas. ⚙️
- **Gestão de Cursos e Interesses**: As informações sobre os cursos e interesses dos usuários podem ser facilmente manipuladas e consultadas. 🔍
- **Consulta ao Cardápio do RU**: Permite ao usuário consultar o cardápio atualizado do Restaurante Universitário (RU) da UFMG diretamente pelo WhatsApp. 🍽️
- **Gerador de Figurinhas**: Permite ao usuários transformarem imagens em figurinhas rapidamente. 📷

## 📂 Estrutura do Projeto

A estrutura do projeto é organizada da seguinte maneira:

```
bot-whatsapp-ufmg/
│
├── package.json             # Dependências e scripts do projeto
├── package-lock.json        # Controle de versões das dependências
├── bot/                     # Lógica e configuração do bot
├── controllers/             # Controladores de lógica de negócios
├── data/                    # Armazenamento de dados
├── scripts/                 # Scripts auxiliares
├── services/                # Serviços integrados ao projeto
├── utils/                   # Funções utilitárias
├── repositories/            # Camada de acesso a dados, abstração para manipulação de dados persistentes
└── auth_info/               # Arquivos de autenticação e sessão do WhatsApp (NUNCA compartilhe publicamente)
```

### 📄 Descrição dos Arquivos e Pastas
  
- **package.json** e **package-lock.json**: Arquivos de configuração para gerenciamento de dependências e scripts do Node.js.

- **bot/**: Implementação do bot, incluindo lógica de interação, configuração e integração com o WhatsApp.

- **controllers/**: Contém a lógica de controle do bot, como processamento de comandos e interações com o usuário.

- **data/**: SArquivos JSON onde são armazenados dados importantes.

- **services/**: Serviços responsáveis pela integração com APIs externas e outras funcionalidades necessárias para o funcionamento do bot.

- **utils/**: Funções utilitárias que podem ser usadas em diversas partes do código, como manipulação de dados e geração de QR codes.

- **repositories/**: Camada de acesso a dados, responsável por abstrair operações de leitura e escrita em arquivos ou bancos de dados.

- **auth_info/**: Pasta que armazena arquivos de autenticação e sessão do WhatsApp. **Atenção:** nunca compartilhe esses arquivos publicamente, pois contêm informações sensíveis de acesso ao bot.

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

Isso irá reiniciar o bot e limpar qualquer dado temporário armazenado.

## 🔒 Segurança e Boas Práticas

- **Nunca compartilhe a pasta `auth_info/` ou arquivos de autenticação em repositórios públicos.**
- Utilize variáveis de ambiente para armazenar tokens, chaves de API e outras informações sensíveis.
- Não compartilhe os arquivos de armazenamento de dados do usuarios.

```

## 🛠️ Dicas de Troubleshooting

- Se o bot não conectar, verifique sua conexão com a internet e se os arquivos de autenticação estão corretos.
- Para resetar completamente o estado, apague a pasta `auth_info/` (isso exigirá novo pareamento com o WhatsApp).
- Consulte os logs do terminal para mensagens de erro detalhadas.

## 🤝 Contribuição

Se você deseja contribuir para o projeto, siga os seguintes passos:

1. Faça um fork deste repositório.
2. Crie uma branch para a sua feature (`git checkout -b minha-feature`).
3. Realize as alterações e commit (`git commit -am 'Adicionando nova feature'`).
4. Envie para o repositório (`git push origin minha-feature`).
5. Crie um pull request.

## 📫 Contato e Suporte

Para dúvidas, sugestões ou suporte, abra uma issue no repositório ou entre em contato com os mantenedores.

## 📜 Licença

Este projeto está licenciado sob a licença GPLv3 - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

🙏 Agradecimentos
Agradecemos à API Baileys pelo excelente suporte e recursos, que possibilitaram a criação desta integração de WhatsApp com o nosso bot de maneira eficiente e robusta. 👏

Agradecimentos especiais aos colaboradores desse projeto:

Confira o perfil de [@joaov-tst](https://github.com/joaov-tst)


