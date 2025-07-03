from flask import Blueprint, jsonify, request, session
from src.models.user import Cliente, db

clientes_bp = Blueprint('clientes', __name__)

def require_auth():
    """Verifica se o usuário está autenticado"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    return None

@clientes_bp.route('/clientes', methods=['GET'])
def get_clientes():
    """Lista todos os clientes"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        clientes = Cliente.query.all()
        return jsonify([cliente.to_dict() for cliente in clientes]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clientes_bp.route('/clientes', methods=['POST'])
def create_cliente():
    """Cria um novo cliente"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        data = request.json
        
        # Validações básicas
        if not data.get('nome') or not data.get('telefone'):
            return jsonify({'error': 'Nome e telefone são obrigatórios'}), 400
        
        cliente = Cliente(
            nome=data['nome'],
            telefone=data['telefone'],
            email=data.get('email')
        )
        
        db.session.add(cliente)
        db.session.commit()
        
        return jsonify({
            'message': 'Cliente criado com sucesso',
            'cliente': cliente.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clientes_bp.route('/clientes/<int:cliente_id>', methods=['GET'])
def get_cliente(cliente_id):
    """Busca um cliente específico"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        return jsonify(cliente.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clientes_bp.route('/clientes/<int:cliente_id>', methods=['PUT'])
def update_cliente(cliente_id):
    """Atualiza um cliente"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        data = request.json
        
        cliente.nome = data.get('nome', cliente.nome)
        cliente.telefone = data.get('telefone', cliente.telefone)
        cliente.email = data.get('email', cliente.email)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cliente atualizado com sucesso',
            'cliente': cliente.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clientes_bp.route('/clientes/<int:cliente_id>', methods=['DELETE'])
def delete_cliente(cliente_id):
    """Remove um cliente"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        db.session.delete(cliente)
        db.session.commit()
        
        return jsonify({'message': 'Cliente removido com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clientes_bp.route('/clientes/search', methods=['GET'])
def search_clientes():
    """Busca clientes por nome ou telefone"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Parâmetro de busca é obrigatório'}), 400
        
        clientes = Cliente.query.filter(
            (Cliente.nome.contains(query)) | 
            (Cliente.telefone.contains(query))
        ).all()
        
        return jsonify([cliente.to_dict() for cliente in clientes]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

