# Portaria Inteligente - Delta Geração

Sistema de gestão de acesso para parceiros e colaboradores com integração a planilhas Google e relatórios de permanência automatizados.

## 🚀 Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd <nome-do-diretorio>
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Crie um arquivo `.env` na raiz do projeto.
   - Copie o conteúdo de `.env.example` para o `.env`.
   - Substitua os valores se necessário (o padrão já aponta para a planilha configurada).

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## 📊 Configuração do Google Sheets

O aplicativo depende de uma planilha do Google e um script (Google Apps Script) para funcionar.

1. **Planilha:** Deve conter abas com os nomes das empresas e uma aba chamada `Dados` para os registros.
2. **Apps Script:** O script deve estar publicado como "Aplicativo da Web" com acesso para "Qualquer pessoa".

## 🌐 Deploy no GitHub Pages

Para publicar no GitHub Pages:

1. Vá em **Settings > Pages** no seu repositório GitHub.
2. Em **Build and deployment**, selecione **GitHub Actions** como a fonte.
3. No seu repositório, vá em **Settings > Secrets and variables > Actions** e adicione os seguintes **Secrets**:
   - `VITE_SHEET_ID`: O ID da sua planilha Google.
   - `VITE_SCRIPT_URL`: A URL do seu Google Apps Script.
   - `GEMINI_API_KEY`: (Opcional) Sua chave da API Gemini.
4. O projeto já inclui um workflow para automatizar o deploy sempre que você fizer um push para a branch `main`.
5. **Importante:** Se o seu site não estiver na raiz (ex: `usuario.github.io/projeto/`), você deve configurar a variável `VITE_BASE_PATH` no arquivo `deploy.yml` ou como um Secret com o valor `/projeto/`.

---
Desenvolvido por **ULBACH**
