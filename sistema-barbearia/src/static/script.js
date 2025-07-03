// Estado global da aplicação
let currentUser = null;
let currentEditingId = null;
let currentEditingType = null;

// Elementos DOM
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Configuração inicial da aplicação
function initializeApp() {
    checkAuthStatus();
}

// Configurar event listeners
function setupEventListeners() {
    // Autenticação
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    showRegisterLink.addEventListener('click', showRegisterForm);
    showLoginLink.addEventListener('click', showLoginForm);
    logoutBtn.addEventListener('click', handleLogout);

    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            showSection(section);
        });
    });

    // Modais
    setupModalListeners();

    // Botões de ação
    document.getElementById('novoAgendamentoBtn').addEventListener('click', () => openModal('agendamento'));
    document.getElementById('novoClienteBtn').addEventListener('click', () => openModal('cliente'));
    document.getElementById('novoServicoBtn').addEventListener('click', () => openModal('servico'));

    // Filtros e busca
    document.getElementById('filtroData').addEventListener('change', loadAgendamentos);
    document.getElementById('filtroStatus').addEventListener('change', loadAgendamentos);
    document.getElementById('searchClientes').addEventListener('input', debounce(searchClientes, 300));
}

// Verificar status de autenticação
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        showLogin();
    }
}

// Mostrar tela de login
function showLogin() {
    loginScreen.classList.add('active');
    dashboardScreen.classList.remove('active');
}

// Mostrar dashboard
function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    userName.textContent = currentUser.username;
    loadDashboardData();
}

// Alternar entre formulários de login e registro
function showRegisterForm(e) {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
}

function showLoginForm(e) {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
}

// Manipular login
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            currentUser = result.user;
            showToast('Login realizado com sucesso!', 'success');
            showDashboard();
        } else {
            showToast(result.error || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro de conexão', 'error');
    }
}

// Manipular registro
async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Conta criada com sucesso! Faça login.', 'success');
            showLoginForm({ preventDefault: () => {} });
            registerForm.reset();
        } else {
            showToast(result.error || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        showToast('Erro de conexão', 'error');
    }
}

// Manipular logout
async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        showToast('Logout realizado com sucesso!', 'success');
        showLogin();
    } catch (error) {
        console.error('Erro no logout:', error);
        showToast('Erro ao fazer logout', 'error');
    }
}

// Mostrar seção específica
function showSection(sectionName) {
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Mostrar seção
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}Section`).classList.add('active');

    // Carregar dados da seção
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'agendamentos':
            loadAgendamentos();
            break;
        case 'clientes':
            loadClientes();
            break;
        case 'servicos':
            loadServicos();
            break;
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        // Carregar estatísticas
        const [agendamentosResponse, clientesResponse] = await Promise.all([
            fetch('/api/agendamentos/hoje'),
            fetch('/api/clientes')
        ]);

        if (agendamentosResponse.ok && clientesResponse.ok) {
            const agendamentosHoje = await agendamentosResponse.json();
            const clientes = await clientesResponse.json();

            // Atualizar estatísticas
            document.getElementById('agendamentosHoje').textContent = agendamentosHoje.length;
            document.getElementById('totalClientes').textContent = clientes.length;

            // Calcular receita do dia
            const receitaHoje = agendamentosHoje
                .filter(ag => ag.status === 'concluido')
                .reduce((total, ag) => total + (ag.servico?.valor || 0), 0);
            document.getElementById('receitaHoje').textContent = `R$ ${receitaHoje.toFixed(2)}`;
        }

        // Carregar próximos agendamentos
        const proximosResponse = await fetch('/api/agendamentos/proximos');
        if (proximosResponse.ok) {
            const proximos = await proximosResponse.json();
            renderProximosAgendamentos(proximos);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Renderizar próximos agendamentos
function renderProximosAgendamentos(agendamentos) {
    const container = document.getElementById('proximosAgendamentos');
    
    if (agendamentos.length === 0) {
        container.innerHTML = '<p>Nenhum agendamento próximo.</p>';
        return;
    }

    container.innerHTML = agendamentos.map(ag => `
        <div class="agendamento-item">
            <h4>${ag.cliente?.nome || 'Cliente não encontrado'}</h4>
            <p><strong>Serviço:</strong> ${ag.servico?.nome || 'Serviço não encontrado'}</p>
            <p><strong>Valor:</strong> R$ ${ag.servico?.valor?.toFixed(2) || '0.00'}</p>
            <p class="agendamento-time">${formatDateTime(ag.data_hora)}</p>
            <span class="status-badge status-${ag.status}">${ag.status}</span>
        </div>
    `).join('');
}

// Carregar agendamentos
async function loadAgendamentos() {
    try {
        const filtroData = document.getElementById('filtroData').value;
        const filtroStatus = document.getElementById('filtroStatus').value;
        
        let url = '/api/agendamentos?';
        if (filtroData) {
            url += `data_inicio=${filtroData}T00:00:00&data_fim=${filtroData}T23:59:59&`;
        }
        if (filtroStatus) {
            url += `status=${filtroStatus}&`;
        }

        const response = await fetch(url);
        if (response.ok) {
            const agendamentos = await response.json();
            renderAgendamentos(agendamentos);
        }
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    }
}

// Renderizar tabela de agendamentos
function renderAgendamentos(agendamentos) {
    const container = document.getElementById('agendamentosList');
    
    if (agendamentos.length === 0) {
        container.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
        return;
    }

    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Data/Hora</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${agendamentos.map(ag => `
                    <tr>
                        <td>${ag.cliente?.nome || 'N/A'}</td>
                        <td>${ag.servico?.nome || 'N/A'}</td>
                        <td>${formatDateTime(ag.data_hora)}</td>
                        <td><span class="status-badge status-${ag.status}">${ag.status}</span></td>
                        <td>R$ ${ag.servico?.valor?.toFixed(2) || '0.00'}</td>
                        <td>
                            <button onclick="editAgendamento(${ag.id})" class="btn btn-secondary" style="padding: 5px 10px; margin-right: 5px;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteAgendamento(${ag.id})" class="btn btn-outline" style="padding: 5px 10px; color: #dc3545; border-color: #dc3545;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Carregar clientes
async function loadClientes() {
    try {
        const response = await fetch('/api/clientes');
        if (response.ok) {
            const clientes = await response.json();
            renderClientes(clientes);
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Renderizar tabela de clientes
function renderClientes(clientes) {
    const container = document.getElementById('clientesList');
    
    if (clientes.length === 0) {
        container.innerHTML = '<p>Nenhum cliente encontrado.</p>';
        return;
    }

    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Email</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(cliente => `
                    <tr>
                        <td>${cliente.nome}</td>
                        <td>${cliente.telefone}</td>
                        <td>${cliente.email || 'N/A'}</td>
                        <td>
                            <button onclick="editCliente(${cliente.id})" class="btn btn-secondary" style="padding: 5px 10px; margin-right: 5px;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteCliente(${cliente.id})" class="btn btn-outline" style="padding: 5px 10px; color: #dc3545; border-color: #dc3545;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Buscar clientes
async function searchClientes() {
    const query = document.getElementById('searchClientes').value;
    if (query.length < 2) {
        loadClientes();
        return;
    }

    try {
        const response = await fetch(`/api/clientes/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const clientes = await response.json();
            renderClientes(clientes);
        }
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
    }
}

// Carregar serviços
async function loadServicos() {
    try {
        const response = await fetch('/api/servicos/all');
        if (response.ok) {
            const servicos = await response.json();
            renderServicos(servicos);
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

// Renderizar grid de serviços
function renderServicos(servicos) {
    const container = document.getElementById('servicosList');
    
    if (servicos.length === 0) {
        container.innerHTML = '<p>Nenhum serviço encontrado.</p>';
        return;
    }

    container.innerHTML = servicos.map(servico => `
        <div class="service-card">
            <h4>${servico.nome}</h4>
            <div class="price">R$ ${servico.valor.toFixed(2)}</div>
            <div class="duration">${servico.duracao_estimada} minutos</div>
            <div class="description">${servico.descricao || 'Sem descrição'}</div>
            <div style="margin-bottom: 15px;">
                <span class="status-badge ${servico.ativo ? 'status-confirmado' : 'status-cancelado'}">
                    ${servico.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="service-actions">
                <button onclick="editServico(${servico.id})" class="btn btn-secondary">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="toggleServico(${servico.id}, ${!servico.ativo})" class="btn btn-outline">
                    <i class="fas fa-${servico.ativo ? 'eye-slash' : 'eye'}"></i>
                    ${servico.ativo ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    `).join('');
}

// Configurar listeners dos modais
function setupModalListeners() {
    // Fechar modais
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Fechar modal clicando fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });

    // Formulários dos modais
    document.getElementById('agendamentoForm').addEventListener('submit', handleAgendamentoSubmit);
    document.getElementById('clienteForm').addEventListener('submit', handleClienteSubmit);
    document.getElementById('servicoForm').addEventListener('submit', handleServicoSubmit);
}

// Abrir modal
async function openModal(type, id = null) {
    currentEditingType = type;
    currentEditingId = id;

    const modal = document.getElementById(`${type}Modal`);
    const form = document.getElementById(`${type}Form`);
    const title = document.getElementById(`${type}ModalTitle`);

    // Resetar formulário
    form.reset();

    if (id) {
        title.textContent = `Editar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        await loadDataForEdit(type, id);
    } else {
        title.textContent = `Novo ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }

    // Carregar dados necessários para selects
    if (type === 'agendamento') {
        await loadSelectOptions();
    }

    modal.classList.add('active');
}

// Carregar dados para edição
async function loadDataForEdit(type, id) {
    try {
        const response = await fetch(`/api/${type}s/${id}`);
        if (response.ok) {
            const data = await response.json();
            populateForm(type, data);
        }
    } catch (error) {
        console.error(`Erro ao carregar ${type}:`, error);
    }
}

// Preencher formulário com dados
function populateForm(type, data) {
    const form = document.getElementById(`${type}Form`);
    
    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[key];
            } else if (key === 'data_hora') {
                const date = new Date(data[key]);
                const dateInput = form.querySelector('[name="data"]');
                const timeInput = form.querySelector('[name="hora"]');
                if (dateInput) dateInput.value = date.toISOString().split('T')[0];
                if (timeInput) timeInput.value = date.toTimeString().slice(0, 5);
            } else {
                input.value = data[key] || '';
            }
        }
    });
}

// Carregar opções para selects
async function loadSelectOptions() {
    try {
        const [clientesResponse, servicosResponse] = await Promise.all([
            fetch('/api/clientes'),
            fetch('/api/servicos')
        ]);

        if (clientesResponse.ok) {
            const clientes = await clientesResponse.json();
            const clienteSelect = document.getElementById('agendamentoCliente');
            clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>' +
                clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        }

        if (servicosResponse.ok) {
            const servicos = await servicosResponse.json();
            const servicoSelect = document.getElementById('agendamentoServico');
            servicoSelect.innerHTML = '<option value="">Selecione um serviço</option>' +
                servicos.map(s => `<option value="${s.id}">${s.nome} - R$ ${s.valor.toFixed(2)}</option>`).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar opções:', error);
    }
}

// Fechar modais
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    currentEditingId = null;
    currentEditingType = null;
}

// Manipular submit do agendamento
async function handleAgendamentoSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Combinar data e hora
    data.data_hora = `${data.data}T${data.hora}:00`;
    delete data.data;
    delete data.hora;

    try {
        const url = currentEditingId ? `/api/agendamentos/${currentEditingId}` : '/api/agendamentos';
        const method = currentEditingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            closeModals();
            loadAgendamentos();
            if (document.querySelector('.nav-item.active').dataset.section === 'dashboard') {
                loadDashboardData();
            }
        } else {
            showToast(result.error || 'Erro ao salvar agendamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        showToast('Erro de conexão', 'error');
    }
}

// Manipular submit do cliente
async function handleClienteSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const url = currentEditingId ? `/api/clientes/${currentEditingId}` : '/api/clientes';
        const method = currentEditingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            closeModals();
            loadClientes();
        } else {
            showToast(result.error || 'Erro ao salvar cliente', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showToast('Erro de conexão', 'error');
    }
}

// Manipular submit do serviço
async function handleServicoSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Converter checkbox para boolean
    data.ativo = data.ativo === 'on';

    try {
        const url = currentEditingId ? `/api/servicos/${currentEditingId}` : '/api/servicos';
        const method = currentEditingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            closeModals();
            loadServicos();
        } else {
            showToast(result.error || 'Erro ao salvar serviço', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        showToast('Erro de conexão', 'error');
    }
}

// Funções de edição
function editAgendamento(id) {
    openModal('agendamento', id);
}

function editCliente(id) {
    openModal('cliente', id);
}

function editServico(id) {
    openModal('servico', id);
}

// Funções de exclusão
async function deleteAgendamento(id) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        try {
            const response = await fetch(`/api/agendamentos/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, 'success');
                loadAgendamentos();
            } else {
                showToast(result.error || 'Erro ao cancelar agendamento', 'error');
            }
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            showToast('Erro de conexão', 'error');
        }
    }
}

async function deleteCliente(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, 'success');
                loadClientes();
            } else {
                showToast(result.error || 'Erro ao excluir cliente', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            showToast('Erro de conexão', 'error');
        }
    }
}

async function toggleServico(id, ativo) {
    try {
        const response = await fetch(`/api/servicos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ativo }),
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            loadServicos();
        } else {
            showToast(result.error || 'Erro ao atualizar serviço', 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        showToast('Erro de conexão', 'error');
    }
}

// Utilitários
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

