from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)

# 🔓 Permite que o frontend (Vite) acesse as rotas do backend
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})

# ✅ Endpoint de verificação de saúde (healthcheck)
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "ok": True,
        "message": "Servidor Flask rodando corretamente!",
        "time": datetime.utcnow().isoformat() + "Z"
    }), 200


# 📝 Endpoint de cadastro/register (com validação e mensagens)
@app.route("/api/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}

    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or payload.get("senha") or ""
    role = payload.get("role") or "produtor"

    # 🔍 Validações simples
    if not username or not email or not password:
        return jsonify({
            "ok": False,
            "message": "Informe usuário, e-mail e senha."
        }), 400

    if "@" not in email:
        return jsonify({
            "ok": False,
            "message": "E-mail inválido."
        }), 400

    # ✅ Simula criação de usuário (persistência real pode ser adicionada depois)
    user = {
        "id": 1,
        "username": username,
        "email": email,
        "role": role
    }

    print(f"📩 Novo usuário registrado: {user}")

    return jsonify({
        "ok": True,
        "message": "Cadastro criado com sucesso.",
        "user": user,
        "token": "fake-demo-token"
    }), 201


# 🔐 Endpoint de login (simulado)
@app.route("/api/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}

    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return jsonify({
            "ok": False,
            "message": "Informe usuário e senha."
        }), 400

    # ⚙️ Exemplo fixo de login real (admin / 123)
    if username == "admin" and password == "123":
        user = {
            "username": username,
            "role": "proprietario",
            "email": "admin@arrendafacil.com"
        }
        return jsonify({
            "ok": True,
            "message": "Login realizado com sucesso!",
            "user": user,
            "access_token": "fake-demo-token"
        }), 200

    # 🌾 Qualquer outro usuário entra como produtor (simulado)
    user = {
        "username": username,
        "role": "produtor",
        "email": f"{username}@exemplo.com"
    }

    return jsonify({
        "ok": True,
        "message": "Login simulado com sucesso!",
        "user": user,
        "access_token": "fake-demo-token"
    }), 200


# 🌾 Simulação de banco de dados em memória
properties = []

# 📋 Listar propriedades
@app.route("/api/properties", methods=["GET"])
def list_properties():
    return jsonify(properties), 200

# ➕ Criar nova propriedade
@app.route("/api/properties", methods=["POST"])
def add_property():
    data = request.get_json(silent=True) or {}
    new_id = len(properties) + 1
    prop = {
        "id": new_id,
        "name": data.get("name"),
        "location": data.get("location"),
        "size_ha": data.get("size_ha"),
        "details": data.get("details"),
        "is_available": data.get("is_available", True)
    }
    properties.append(prop)
    return jsonify({"message": "Propriedade cadastrada!", "id": new_id}), 201

# ✏️ Atualizar propriedade
@app.route("/api/properties/<int:prop_id>", methods=["PUT"])
def update_property(prop_id):
    data = request.get_json(silent=True) or {}
    for p in properties:
        if p["id"] == prop_id:
            p.update(data)
            return jsonify({"message": "Propriedade atualizada!"}), 200
    return jsonify({"message": "Propriedade não encontrada."}), 404

# ❌ Deletar propriedade
@app.route("/api/properties/<int:prop_id>", methods=["DELETE"])
def delete_property(prop_id):
    global properties
    properties = [p for p in properties if p["id"] != prop_id]
    return jsonify({"message": "Propriedade deletada!"}), 200


# 🚀 Inicia o servidor Flask na porta 5001
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
