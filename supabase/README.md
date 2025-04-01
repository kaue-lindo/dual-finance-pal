# Supabase Migrations

Este diretório contém as migrações para o banco de dados Supabase do Dual Finance Pal.

## Aplicando migrações manualmente

Se você estiver tendo problemas para executar as migrações através do CLI do Supabase, você pode aplicá-las manualmente seguindo estas etapas:

1. Acesse o painel de controle do Supabase (https://app.supabase.io)
2. Selecione seu projeto
3. Vá para a seção "SQL Editor"
4. Crie uma nova consulta
5. Cole o conteúdo do arquivo de migração (por exemplo, `20250324035930_create_user_profiles.sql`)
6. Execute a consulta

### Migração: Criação da tabela user_profiles

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  auth_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, auth_id)
);

-- Create RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own profiles
CREATE POLICY "Users can read their own profiles"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = auth_id);

-- Policy to allow users to insert their own profiles
CREATE POLICY "Users can insert their own profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- Policy to allow users to update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = auth_id);
```

## Verificando se a migração foi aplicada

Após aplicar a migração, você pode verificar se a tabela foi criada executando:

```sql
SELECT * FROM user_profiles;
```

Você também pode verificar as políticas RLS com:

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```
