import os
import pymongo
from dotenv import load_dotenv

def migrate_collections():
    """
    Renomeia as coleções 'stadium_references' para 'stadium_templates' e
    'badge_references' para 'badge_templates' para alinhar com a nova
    nomenclatura da API, preservando todos os dados existentes.
    """
    # Caminho corrigido para apontar para o .env dentro da pasta /api
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'api', '.env')
    load_dotenv(dotenv_path=dotenv_path)

    MONGO_URI = os.getenv("MONGODB_URI")
    DB_NAME = "chz-app-db"

    if not MONGO_URI:
        print("❌ ERRO: MONGODB_URI não encontrada no arquivo .env. Abortando a migração.")
        return

    try:
        print("⚙️ Conectando ao MongoDB...")
        client = pymongo.MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Ping para confirmar a conexão
        client.admin.command('ping')
        print(f"✅ Conexão com o banco '{DB_NAME}' estabelecida com sucesso.")

        # --- Migração de Estádios ---
        print("\n--- Iniciando Migração de Estádios ---")
        collection_names = db.list_collection_names()
        
        # O nome de origem agora é "stadiums"
        if "stadiums" in collection_names:
            if "stadium_templates" in collection_names:
                print("⚠️ AVISO: A coleção 'stadium_templates' já existe. Pulando a renomeação para evitar perda de dados.")
            else:
                print("⏳ Renomeando 'stadiums' para 'stadium_templates'...")
                db["stadiums"].rename("stadium_templates")
                print("✅ SUCESSO: Coleção de estádios renomeada.")
        else:
            print("ℹ️ INFO: A coleção de origem 'stadiums' não foi encontrada. Nenhuma ação necessária.")

        # --- Migração de Emblemas ---
        print("\n--- Iniciando Migração de Emblemas ---")
        collection_names = db.list_collection_names() # Atualiza a lista de coleções

        # O nome de origem agora é "badges"
        if "badges" in collection_names:
            if "badge_templates" in collection_names:
                 print("⚠️ AVISO: A coleção 'badge_templates' já existe. Pulando a renomeação para evitar perda de dados.")
            else:
                print("⏳ Renomeando 'badges' para 'badge_templates'...")
                db["badges"].rename("badge_templates")
                print("✅ SUCESSO: Coleção de emblemas renomeada.")
        else:
             print("ℹ️ INFO: A coleção de origem 'badges' não foi encontrada. Nenhuma ação necessária.")

        print("\n🎉 Migração concluída com sucesso!")

    except pymongo.errors.OperationFailure as e:
        print(f"❌ ERRO DE OPERAÇÃO: Falha ao executar o comando no MongoDB. Verifique as permissões. Erro: {e}")
    except pymongo.errors.ConnectionFailure as e:
        print(f"❌ ERRO DE CONEXÃO: Não foi possível conectar ao MongoDB. Verifique a MONGO_URI. Erro: {e}")
    except Exception as e:
        print(f"❌ ERRO INESPERADO: Ocorreu um erro durante a migração. Erro: {e}")
    finally:
        if 'client' in locals() and client:
            client.close()
            print("\n🔌 Conexão com o MongoDB fechada.")

if __name__ == "__main__":
    migrate_collections() 