# FinTrack — Gerenciador de Despesas Pessoais com IA

Aplicação web serverless para gerenciamento de despesas pessoais com integração de Inteligência Artificial. Desenvolvido como projeto acadêmico de desenvolvimento Full Stack.

## Funcionalidades

- Registro de despesas manual ou via upload de comprovantes (OCR)
- Classificação automática de categorias por IA (Amazon Bedrock)
- Dashboard interativo com gráficos de gastos
- Insights gerados por IA sobre hábitos de consumo
- Filtros por categoria e período

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React.js + Tailwind CSS |
| Backend | Python + AWS Lambda + API Gateway |
| Banco de Dados | Amazon DynamoDB |
| Armazenamento | Amazon S3 |
| IA / OCR | Amazon Bedrock (Claude 3 Haiku) |
| Deploy | AWS SAM (Serverless Application Model) |

## Estrutura do Projeto

```
fintrack/
├── frontend/          # Aplicação React.js
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── services/    # Comunicação com API
│   │   └── utils/       # Utilitários (formatação, validação)
│   └── .env.example
├── backend/           # Lambda monolítica (Python)
│   ├── src/
│   │   ├── handlers/    # Handlers por domínio
│   │   ├── services/    # Lógica de negócio
│   │   └── utils/       # Utilitários
│   ├── template.yaml    # AWS SAM template
│   └── .env.example
├── .gitignore
└── README.md
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.12+)
- [AWS CLI](https://aws.amazon.com/cli/) configurado com credenciais válidas
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Conta AWS com acesso ao Amazon Bedrock (modelo Claude 3 Haiku habilitado na região sa-east-1)

## Setup — Backend

1. Acesse o diretório do backend:

```bash
cd backend
```

2. Copie o arquivo de variáveis de ambiente e preencha com seus valores:

```bash
cp .env.example .env
```

3. Instale as dependências Python:

```bash
pip install -r requirements.txt
```

4. Copie e configure o arquivo de deploy SAM:

```bash
cp samconfig.toml.example samconfig.toml
# Edite samconfig.toml com os valores da sua conta AWS
```

5. Build e deploy:

```bash
sam build
sam deploy --guided --region sa-east-1
```

> Na primeira execução, use `--guided` para configurar interativamente. Nas próximas, basta `sam deploy --region sa-east-1`.

## Setup — Frontend

1. Acesse o diretório do frontend:

```bash
cd frontend
```

2. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

3. Instale as dependências:

```bash
npm install
```

4. Inicie o servidor de desenvolvimento:

```bash
npm start
```

> Por padrão, o frontend inicia em modo mock (`REACT_APP_USE_MOCK=true`), permitindo desenvolvimento sem conexão com a AWS. Para conectar ao backend real, altere `REACT_APP_USE_MOCK=false` e configure `REACT_APP_API_URL` com a URL do API Gateway.

## Modo Mock (Desenvolvimento sem AWS)

O frontend suporta um modo de dados simulados para desenvolvimento independente:

- Defina `REACT_APP_USE_MOCK=true` no arquivo `.env` do frontend
- Todas as operações CRUD funcionam com dados fictícios em memória
- Classificação, OCR e insights retornam dados simulados
- Nenhuma chamada HTTP é feita ao backend

## Deploy

### Provisionar recursos AWS

```bash
cd backend
sam build
sam deploy --region sa-east-1
```

### Destruir recursos AWS

```bash
# Esvaziar o bucket S3 antes de deletar a stack
aws s3 rm s3://fintrack-receipts-{account-id} --recursive --region sa-east-1

# Remover todos os recursos
sam delete --stack-name fintrack-stack --region sa-east-1
```

## Repositório

- GitHub: [https://github.com/franciscoaero/fintrack](https://github.com/franciscoaero/fintrack)

## Licença

Projeto acadêmico — uso educacional.
