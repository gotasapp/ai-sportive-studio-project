import os
import pymongo
from dotenv import load_dotenv

def list_all_collections():
    """
    Conecta ao MongoDB e lista todas as coleções existentes no banco de dados
    para fins de diagnóstico.
    """
    # Caminho corrigido para apontar para o .env dentro da pasta /api
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'api', '.env')
    load_dotenv(dotenv_path=dotenv_path)

    MONGO_URI = os.getenv("MONGODB_URI")
    DB_NAME = "chz-app-db"

    if not MONGO_URI:
        print("❌ ERRO: MONGODB_URI não encontrada no arquivo .env.")
        return

    try:
        print(f"⚙️ Conectando ao MongoDB para listar coleções do banco '{DB_NAME}'...")
        client = pymongo.MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        client.admin.command('ping')
        print("✅ Conexão estabelecida com sucesso.")

        print("\n--- Coleções encontradas ---")
        collection_names = db.list_collection_names()
        
        if not collection_names:
            print(">> Nenhuma coleção encontrada neste banco de dados.")
        else:
            for name in collection_names:
                print(f">> {name}")
        
        print("\n🔍 Diagnóstico concluído.")

    except pymongo.errors.ConnectionFailure as e:
        print(f"❌ ERRO DE CONEXÃO: Não foi possível conectar ao MongoDB. Verifique a MONGO_URI. Erro: {e}")
    except Exception as e:
        print(f"❌ ERRO INESPERADO: Ocorreu um erro. Erro: {e}")
    finally:
        if 'client' in locals() and client:
            client.close()
            print("\n🔌 Conexão com o MongoDB fechada.")

if __name__ == "__main__":
    list_all_collections() 