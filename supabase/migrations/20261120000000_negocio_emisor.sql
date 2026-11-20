-- =============================================================================
-- Migração: negocio + emisor snapshot + numeração atómica de facturas
-- Executar no SQL Editor do Supabase (Dashboard > SQL Editor)
-- =============================================================================

-- ── 1. Tabela de configuração do negócio (white-label, uma linha) ─────────────

CREATE TABLE IF NOT EXISTS negocio (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social     TEXT NOT NULL,
  nombre_comercial TEXT NOT NULL,
  nif              TEXT NOT NULL,
  domicilio        TEXT NOT NULL,   -- rua + número (sem CP — ver TODO abaixo)
  codigo_postal    TEXT,            -- TODO: confirmar CP do domicílio fiscal
  ciudad           TEXT NOT NULL DEFAULT 'Vigo',
  provincia        TEXT NOT NULL DEFAULT 'Pontevedra',
  telefono         TEXT,
  whatsapp         TEXT,
  instagram        TEXT,
  logo_url         TEXT,
  serie_factura    TEXT NOT NULL DEFAULT 'RS',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "negocio_authed" ON negocio
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insere dados RSMotors
-- TODO: actualizar domicilio com CP quando confirmado pelo titular
INSERT INTO negocio (
  razon_social, nombre_comercial, nif,
  domicilio, ciudad, provincia,
  telefono, whatsapp, instagram,
  logo_url, serie_factura
) VALUES (
  'Jesus Ricardo Camacho Rodriguez',
  'RSMotors',
  '07181923N',
  'Travesía de Vigo, 105',   -- TODO: adicionar código postal quando confirmado
  'Vigo',
  'Pontevedra',
  '986 13 75 76',
  '665 05 86 33',
  '@rsmotors.es',
  '/rsmotors-logo.png',
  'RS'
);


-- ── 2. Colunas snapshot nas facturas ─────────────────────────────────────────
-- PRINCÍPIO: estas colunas guardam os dados do emissor NO MOMENTO DA EMISSÃO.
-- Nunca se actualizam depois de criada a factura.

ALTER TABLE facturas
  ADD COLUMN IF NOT EXISTS emisor_razon_social     TEXT,
  ADD COLUMN IF NOT EXISTS emisor_nombre_comercial TEXT,
  ADD COLUMN IF NOT EXISTS emisor_nif              TEXT,
  ADD COLUMN IF NOT EXISTS emisor_domicilio        TEXT,
  ADD COLUMN IF NOT EXISTS serie                   TEXT;


-- ── 3. Backfill: facturas existentes recebem dados da GTIMotors 2020 SLU ─────
-- Apenas preenche linhas sem emissor definido (idempotente).

UPDATE facturas SET
  emisor_razon_social     = 'GTIMotors 2020 SLU',
  emisor_nombre_comercial = 'GTIMotors 2020 SLU',
  emisor_nif              = 'B23860984',
  emisor_domicilio        = 'Travesia de Vigo 105 Bajo, 36205, Vigo (Pontevedra)',
  serie                   = 'GTI'
WHERE emisor_nif IS NULL;


-- ── 4. Tabela de contadores de série (numeração atómica sem buracos) ─────────

CREATE TABLE IF NOT EXISTS series_contadores (
  serie         TEXT    NOT NULL,
  year          INTEGER NOT NULL,
  ultimo_numero INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (serie, year)
);

ALTER TABLE series_contadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_contadores_authed" ON series_contadores
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inicializa contador GTI com o máximo dos números existentes (evita colisões futuras)
INSERT INTO series_contadores (serie, year, ultimo_numero)
SELECT
  'GTI',
  SPLIT_PART(numero, '-', 1)::INTEGER            AS year,
  MAX(SPLIT_PART(numero, '-', 2)::INTEGER)        AS ultimo
FROM facturas
WHERE numero ~ '^\d{4}-\d+$'
GROUP BY SPLIT_PART(numero, '-', 1)::INTEGER
ON CONFLICT (serie, year)
  DO UPDATE SET ultimo_numero = EXCLUDED.ultimo_numero;


-- ── 5. Função atómica de geração de número de factura ────────────────────────
-- Usa INSERT ... ON CONFLICT DO UPDATE ... RETURNING para garantir atomicidade.
-- Sem buracos nem colisões mesmo com chamadas concorrentes.

CREATE OR REPLACE FUNCTION next_numero_factura(p_serie TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_num  INTEGER;
BEGIN
  INSERT INTO series_contadores (serie, year, ultimo_numero)
  VALUES (p_serie, v_year, 1)
  ON CONFLICT (serie, year)
  DO UPDATE SET ultimo_numero = series_contadores.ultimo_numero + 1
  RETURNING ultimo_numero INTO v_num;

  RETURN p_serie || '-' || v_year || '-' || LPAD(v_num::TEXT, 4, '0');
END;
$$;

-- Concede execução à role authenticated (front-end via supabase.rpc)
GRANT EXECUTE ON FUNCTION next_numero_factura(TEXT) TO authenticated;
