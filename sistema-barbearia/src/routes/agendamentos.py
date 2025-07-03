from flask import Blueprint, jsonify, request, session
from src.models.user import Agendamento, Cliente, Servico, db
from datetime import datetime, timedelta

agendamentos_bp = Blueprint('agendamentos', __name__)

def require_auth():
    """Verifica se o usuário está autenticado"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    return None

@agendamentos_bp.route('/agendamentos', methods=['GET'])
def get_agendamentos():
    """Lista todos os agendamentos"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        # Filtros opcionais
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        status = request.args.get('status')
        
        query = Agendamento.query
        
        if data_inicio:
            data_inicio_dt = datetime.fromisoformat(data_inicio.replace('Z', '+00:00'))
            query = query.filter(Agendamento.data_hora >= data_inicio_dt)
        
        if data_fim:
            data_fim_dt = datetime.fromisoformat(data_fim.replace('Z', '+00:00'))
            query = query.filter(Agendamento.data_hora <= data_fim_dt)
        
        if status:
            query = query.filter(Agendamento.status == status)
        
        agendamentos = query.order_by(Agendamento.data_hora).all()
        return jsonify([agendamento.to_dict() for agendamento in agendamentos]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos', methods=['POST'])
def create_agendamento():
    """Cria um novo agendamento"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        data = request.json
        
        # Validações básicas
        if not data.get('cliente_id') or not data.get('servico_id') or not data.get('data_hora'):
            return jsonify({'error': 'Cliente, serviço e data/hora são obrigatórios'}), 400
        
        # Verifica se cliente existe
        cliente = Cliente.query.get(data['cliente_id'])
        if not cliente:
            return jsonify({'error': 'Cliente não encontrado'}), 404
        
        # Verifica se serviço existe e está ativo
        servico = Servico.query.get(data['servico_id'])
        if not servico or not servico.ativo:
            return jsonify({'error': 'Serviço não encontrado ou inativo'}), 404
        
        # Converte data/hora
        try:
            data_hora = datetime.fromisoformat(data['data_hora'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Formato de data/hora inválido'}), 400
        
        # Verifica se a data/hora não é no passado
        if data_hora < datetime.now():
            return jsonify({'error': 'Não é possível agendar para datas passadas'}), 400
        
        # Verifica conflitos de horário (opcional - pode ser implementado depois)
        conflito = Agendamento.query.filter(
            Agendamento.data_hora.between(
                data_hora - timedelta(minutes=servico.duracao_estimada),
                data_hora + timedelta(minutes=servico.duracao_estimada)
            ),
            Agendamento.status.in_(['agendado', 'confirmado'])
        ).first()
        
        if conflito:
            return jsonify({'error': 'Já existe um agendamento neste horário'}), 409
        
        agendamento = Agendamento(
            cliente_id=data['cliente_id'],
            servico_id=data['servico_id'],
            data_hora=data_hora,
            status=data.get('status', 'agendado'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(agendamento)
        db.session.commit()
        
        return jsonify({
            'message': 'Agendamento criado com sucesso',
            'agendamento': agendamento.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/<int:agendamento_id>', methods=['GET'])
def get_agendamento(agendamento_id):
    """Busca um agendamento específico"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        return jsonify(agendamento.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/<int:agendamento_id>', methods=['PUT'])
def update_agendamento(agendamento_id):
    """Atualiza um agendamento"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        data = request.json
        
        # Atualiza data/hora se fornecida
        if 'data_hora' in data:
            try:
                nova_data_hora = datetime.fromisoformat(data['data_hora'].replace('Z', '+00:00'))
                if nova_data_hora < datetime.now():
                    return jsonify({'error': 'Não é possível agendar para datas passadas'}), 400
                agendamento.data_hora = nova_data_hora
            except ValueError:
                return jsonify({'error': 'Formato de data/hora inválido'}), 400
        
        # Atualiza outros campos
        if 'status' in data:
            if data['status'] not in ['agendado', 'confirmado', 'concluido', 'cancelado']:
                return jsonify({'error': 'Status inválido'}), 400
            agendamento.status = data['status']
        
        agendamento.observacoes = data.get('observacoes', agendamento.observacoes)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Agendamento atualizado com sucesso',
            'agendamento': agendamento.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/<int:agendamento_id>', methods=['DELETE'])
def delete_agendamento(agendamento_id):
    """Cancela um agendamento"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        agendamento.status = 'cancelado'
        db.session.commit()
        
        return jsonify({'message': 'Agendamento cancelado com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/hoje', methods=['GET'])
def get_agendamentos_hoje():
    """Lista agendamentos de hoje"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        hoje = datetime.now().date()
        agendamentos = Agendamento.query.filter(
            db.func.date(Agendamento.data_hora) == hoje,
            Agendamento.status.in_(['agendado', 'confirmado'])
        ).order_by(Agendamento.data_hora).all()
        
        return jsonify([agendamento.to_dict() for agendamento in agendamentos]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/proximos', methods=['GET'])
def get_proximos_agendamentos():
    """Lista próximos agendamentos (próximos 7 dias)"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        agora = datetime.now()
        proxima_semana = agora + timedelta(days=7)
        
        agendamentos = Agendamento.query.filter(
            Agendamento.data_hora.between(agora, proxima_semana),
            Agendamento.status.in_(['agendado', 'confirmado'])
        ).order_by(Agendamento.data_hora).all()
        
        return jsonify([agendamento.to_dict() for agendamento in agendamentos]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

