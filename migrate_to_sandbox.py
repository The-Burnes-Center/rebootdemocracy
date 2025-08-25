import os, tqdm, weaviate
from dotenv import load_dotenv
from weaviate.auth import AuthApiKey
from weaviate.connect.helpers import connect_to_custom
from weaviate import connect_to_weaviate_cloud

load_dotenv()

# Helper function to get required environment variable
def get_env_or_fail(key: str) -> str:
    value = os.getenv(key)
    if value is None:
        raise ValueError(f"Environment variable {key} is required but not set")
    return value

# ---------- source (Docker) ----------
src = connect_to_custom(
    http_host=get_env_or_fail("SOURCE_HOST"),
    http_port=int(get_env_or_fail("SOURCE_HTTP_PORT")),
    http_secure=False,                    # REST is plain HTTP
    grpc_host=get_env_or_fail("SOURCE_HOST"),
    grpc_port=int(get_env_or_fail("SOURCE_GRPC_PORT")),
    grpc_secure=False,                    # plain-text gRPC (removes SSL error)
    headers={"X-API-KEY": get_env_or_fail("SOURCE_API_KEY")},
    auth_credentials=AuthApiKey(get_env_or_fail("SOURCE_API_KEY")),
)

# ---------- target (Sandbox) ----------
tgt = connect_to_weaviate_cloud(
    cluster_url=get_env_or_fail("TARGET_REST"),         # REST URL only
    auth_credentials=AuthApiKey(get_env_or_fail("TARGET_API_KEY")),
    headers={"X-API-KEY": get_env_or_fail("TARGET_API_KEY")},
)

# 1. clone schema
print("Deleting existing schema...")
tgt.collections.delete_all()

print("Creating schema from source...")
# Get all collections from source
source_collections = []
try:
    # Try to get schema using the REST API directly
    import requests
    source_url = f"http://{get_env_or_fail('SOURCE_HOST')}:{get_env_or_fail('SOURCE_HTTP_PORT')}/v1/schema"
    headers = {"X-API-KEY": get_env_or_fail("SOURCE_API_KEY")}
    response = requests.get(source_url, headers=headers)
    if response.status_code == 200:
        schema_data = response.json()
        source_collections = schema_data.get("classes", [])
        print(f"Found {len(source_collections)} collections in source")
    else:
        print(f"Failed to get schema from source: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"Error getting schema from source: {e}")
    exit(1)

# Create collections in target
for collection in source_collections:
    try:
        tgt.collections.create(collection)
        print(f"Created collection: {collection.get('class', 'unknown')}")
    except Exception as e:
        print(f"Error creating collection {collection.get('class', 'unknown')}: {e}")

# 2. stream data
batch = int(os.getenv("BATCH_SIZE", "100"))

for collection in source_collections:
    cname = collection.get("class")
    if not cname:
        continue
        
    print(f"→ Migrating collection: {cname}")
    
    try:
        s = src.collections.get(cname)
        t = tgt.collections.get(cname)
        
        # Migrate data
        with t.batch.fixed_size(batch) as b:
            for o in tqdm.tqdm(s.iterator(include_vector=True), desc=f"Migrating {cname}"):
                try:
                    b.add_object(
                        properties=o.properties,
                        vector=o.vector,
                        uuid=o.uuid,
                    )
                except Exception as e:
                    print(f"  Warning: Could not add object {o.uuid}: {e}")
                    
    except Exception as e:
        print(f"  Error migrating collection {cname}: {e}")

# 3. sanity check
print("\nSanity check:")
try:
    for collection in source_collections:
        cname = collection.get("class")
        if not cname:
            continue
            
        try:
            # Get counts using direct API calls
            src_url = f"http://{get_env_or_fail('SOURCE_HOST')}:{get_env_or_fail('SOURCE_HTTP_PORT')}/v1/objects?class={cname}&limit=1"
            tgt_url = f"{get_env_or_fail('TARGET_REST')}/v1/objects?class={cname}&limit=1"
            
            src_headers = {"X-API-KEY": get_env_or_fail("SOURCE_API_KEY")}
            tgt_headers = {"X-API-KEY": get_env_or_fail("TARGET_API_KEY")}
            
            src_response = requests.get(src_url, headers=src_headers)
            tgt_response = requests.get(tgt_url, headers=tgt_headers)
            
            src_total = src_response.json().get("totalResults", 0) if src_response.status_code == 200 else 0
            tgt_total = tgt_response.json().get("totalResults", 0) if tgt_response.status_code == 200 else 0
            
            print(f"{cname}: {src_total} → {tgt_total}")
        except Exception as e:
            print(f"{cname}: Error getting counts - {e}")
except Exception as e:
    print(f"Error during sanity check: {e}")

src.close()
tgt.close()
print("🎉  Migration complete") 