# Sistema de Barbearia

Um sistema completo para gerenciamento de barbearia com funcionalidades de agendamento, controle de clientes e serviços.

## Características

- **Autenticação**: Sistema de login e registro para barbeiros
- **Gestão de Clientes**: Cadastro, edição e busca de clientes
- **Gestão de Serviços**: Cadastro de serviços com valores e duração
- **Agendamentos**: Sistema completo de agendamento com controle de status
- **Dashboard**: Visão geral com estatísticas e próximos agendamentos
- **Interface Responsiva**: Funciona em desktop e mobile

## Tecnologias Utilizadas

- **Backend**: Flask (Python)
- **Banco de Dados**: SQLite (compatível com Replit)
- **Frontend**: HTML5, CSS3, JavaScript
- **Autenticação**: Flask Sessions com hash de senhas
- **Estilo**: CSS moderno com gradientes e animações

## Estrutura do Projeto

```
sistema-barbearia/
├── src/
│   ├── models/
│   │   └── user.py          # Modelos do banco de dados
│   ├── routes/
│   │   ├── auth.py          # Rotas de autenticação
│   │   ├── clientes.py      # Rotas de clientes
│   │   ├── servicos.py      # Rotas de serviços
│   │   └── agendamentos.py  # Rotas de agendamentos
│   ├── static/
│   │   ├── index.html       # Interface principal
│   │   ├── styles.css       # Estilos CSS
│   │   └── script.js        # JavaScript
│   ├── database/
│   │   └── app.db          # Banco de dados SQLite
│   └── main.py             # Arquivo principal
├── venv/                   # Ambiente virtual
├── requirements.txt        # Dependências
└── README.md              # Este arquivo
```

## Configuração no Replit

### 1. Criar novo Repl
- Acesse [Replit.com](https://replit.com)
- Clique em "Create Repl"
- Escolha "Python" como linguagem
- Nomeie o projeto (ex: "sistema-barbearia")

### 2. Upload dos arquivos
- Faça upload de todos os arquivos do projeto para o Replit
- Mantenha a estrutura de pastas

### 3. Configurar dependências
Crie ou edite o arquivo `requirements.txt`:
```
Flask==3.1.1
Flask-SQLAlchemy==3.1.1
Flask-CORS==6.0.0
Werkzeug==3.1.3
```

### 4. Configurar arquivo principal
O Replit deve detectar automaticamente o `src/main.py` como arquivo principal.

### 5. Executar o projeto
- Clique em "Run" no Replit
- O sistema estará disponível na URL fornecida pelo Replit

## Uso do Sistema

### Primeiro Acesso
1. Acesse o sistema
2. Clique em "Criar conta"
3. Preencha os dados do barbeiro
4. Faça login com as credenciais criadas

### Serviços Padrão
O sistema já vem com serviços pré-cadastrados:
- Corte Simples - R$ 25,00 (30 min)
- Corte + Barba - R$ 35,00 (45 min)
- Barba - R$ 15,00 (20 min)
- Corte Degradê - R$ 30,00 (40 min)
- Corte + Barba + Sobrancelha - R$ 45,00 (60 min)
- Corte Infantil - R$ 20,00 (25 min)

### Funcionalidades Principais

#### Dashboard
- Visualização de agendamentos do dia
- Total de clientes cadastrados
- Receita do dia
- Próximos agendamentos

#### Clientes
- Cadastrar novos clientes
- Buscar clientes por nome ou telefone
- Editar informações dos clientes
- Excluir clientes

#### Serviços
- Cadastrar novos serviços
- Definir preços e duração
- Ativar/desativar serviços
- Editar informações dos serviços

#### Agendamentos
- Criar novos agendamentos
- Filtrar por data e status
- Alterar status (agendado, confirmado, concluído, cancelado)
- Visualizar detalhes completos

## API Endpoints

### Autenticação
- `POST /api/register` - Registrar novo usuário
- `POST /api/login` - Fazer login
- `POST /api/logout` - Fazer logout
- `GET /api/me` - Obter usuário atual

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes/{id}` - Obter cliente
- `PUT /api/clientes/{id}` - Atualizar cliente
- `DELETE /api/clientes/{id}` - Excluir cliente
- `GET /api/clientes/search?q={query}` - Buscar clientes

### Serviços
- `GET /api/servicos` - Listar serviços ativos
- `GET /api/servicos/all` - Listar todos os serviços
- `POST /api/servicos` - Criar serviço
- `GET /api/servicos/{id}` - Obter serviço
- `PUT /api/servicos/{id}` - Atualizar serviço

### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `POST /api/agendamentos` - Criar agendamento
- `GET /api/agendamentos/{id}` - Obter agendamento
- `PUT /api/agendamentos/{id}` - Atualizar agendamento
- `DELETE /api/agendamentos/{id}` - Cancelar agendamento
- `GET /api/agendamentos/hoje` - Agendamentos de hoje
- `GET /api/agendamentos/proximos` - Próximos agendamentos

## Personalização

### Cores e Estilo
Edite o arquivo `src/static/styles.css` para personalizar:
- Cores do tema (variável CSS `--primary-color`)
- Gradientes de fundo
- Espaçamentos e bordas

### Serviços Padrão
Edite o arquivo `src/main.py` na seção de criação de serviços padrão.

### Validações
Edite os arquivos de rotas em `src/routes/` para adicionar validações específicas.

## Solução de Problemas

### Erro de Banco de Dados
Se houver erros relacionados ao banco de dados:
1. Delete o arquivo `src/database/app.db`
2. Reinicie o servidor
3. O banco será recriado automaticamente

### Problemas de CORS
O sistema já está configurado para aceitar requisições de qualquer origem.

### Performance
Para melhor performance em produção:
- Configure `debug=False` no arquivo `main.py`
- Use um servidor WSGI como Gunicorn

## Suporte

Este sistema foi desenvolvido para ser simples e funcional. Para dúvidas ou melhorias, consulte a documentação do Flask e SQLAlchemy.

## Licença

Sistema desenvolvido para fins educacionais e comerciais.

