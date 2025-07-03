from flask import Blueprint, jsonify, request, session
from src.models.user import Servico, db

servicos_bp = Blueprint('servicos', __name__)

def require_auth():
    """Verifica se o usuário está autenticado"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    return None

@servicos_bp.route('/servicos', methods=['GET'])
def get_servicos():
    """Lista todos os serviços"""
    try:
        # Permite acesso sem autenticação para listar serviços (para clientes)
        servicos = Servico.query.filter_by(ativo=True).all()
        return jsonify([servico.to_dict() for servico in servicos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/all', methods=['GET'])
def get_all_servicos():
    """Lista todos os serviços (incluindo inativos) - apenas para barbeiros"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        servicos = Servico.query.all()
        return jsonify([servico.to_dict() for servico in servicos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos', methods=['POST'])
def create_servico():
    """Cria um novo serviço"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        data = request.json
        
        # Validações básicas
        if not data.get('nome') or not data.get('valor') or not data.get('duracao_estimada'):
            return jsonify({'error': 'Nome, valor e duração estimada são obrigatórios'}), 400
        
        if data['valor'] <= 0:
            return jsonify({'error': 'Valor deve ser maior que zero'}), 400
        
        if data['duracao_estimada'] <= 0:
            return jsonify({'error': 'Duração estimada deve ser maior que zero'}), 400
        
        servico = Servico(
            nome=data['nome'],
            valor=float(data['valor']),
            duracao_estimada=int(data['duracao_estimada']),
            descricao=data.get('descricao'),
            ativo=data.get('ativo', True)
        )
        
        db.session.add(servico)
        db.session.commit()
        
        return jsonify({
            'message': 'Serviço criado com sucesso',
            'servico': servico.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/<int:servico_id>', methods=['GET'])
def get_servico(servico_id):
    """Busca um serviço específico"""
    try:
        servico = Servico.query.get_or_404(servico_id)
        return jsonify(servico.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/<int:servico_id>', methods=['PUT'])
def update_servico(servico_id):
    """Atualiza um serviço"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        servico = Servico.query.get_or_404(servico_id)
        data = request.json
        
        servico.nome = data.get('nome', servico.nome)
        if 'valor' in data:
            if data['valor'] <= 0:
                return jsonify({'error': 'Valor deve ser maior que zero'}), 400
            servico.valor = float(data['valor'])
        
        if 'duracao_estimada' in data:
            if data['duracao_estimada'] <= 0:
                return jsonify({'error': 'Duração estimada deve ser maior que zero'}), 400
            servico.duracao_estimada = int(data['duracao_estimada'])
        
        servico.descricao = data.get('descricao', servico.descricao)
        servico.ativo = data.get('ativo', servico.ativo)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Serviço atualizado com sucesso',
            'servico': servico.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/<int:servico_id>', methods=['DELETE'])
def delete_servico(servico_id):
    """Remove um serviço (marca como inativo)"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        servico = Servico.query.get_or_404(servico_id)
        servico.ativo = False
        db.session.commit()
        
        return jsonify({'message': 'Serviço desativado com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

