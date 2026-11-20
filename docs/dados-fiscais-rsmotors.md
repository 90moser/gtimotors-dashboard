# Dados Fiscais RSMotors — Guia de Migração

## Novo Emissor

| Campo            | Valor                              |
|------------------|------------------------------------|
| Razón social     | Jesus Ricardo Camacho Rodriguez    |
| NIF              | 07181923N                          |
| Nombre comercial | RSMotors                           |
| Domicilio        | Travesía de Vigo, 105 Bajo         |
| Código postal    | 36205                              |
| Ciudad           | Vigo                               |
| Provincia        | Pontevedra                         |
| Teléfono         | 986 13 75 76                       |
| WhatsApp         | 665 05 86 33                       |
| Instagram        | @rsmotors.es                       |
| Serie facturas   | RS                                 |

---

## 1. SQL — Ordem de execução

Executar no **Supabase Dashboard → SQL Editor** o ficheiro:

```
supabase/migrations/20261120000000_negocio_emisor.sql
```

### Passos (já incluídos no ficheiro)

1. **Tabela `negocio`** — config white-label de uma linha, com RLS para autenticados
2. **INSERT RSMotors** — insere os dados completos: `domicilio = 'Travesía de Vigo, 105 Bajo'`, `codigo_postal = '36205'`
3. **Colunas snapshot em `facturas`** — `emisor_razon_social`, `emisor_nombre_comercial`, `emisor_nif`, `emisor_domicilio`, `serie`
4. **Backfill GTI** — preenche facturas existentes com dados da GTIMotors 2020 SLU (`serie = 'GTI'`)
5. **Tabela `series_contadores`** + seed contador GTI — numeração atómica sem buracos
6. **Função `next_numero_factura(p_serie)`** — retorna o próximo número formatado (ex. `RS-2026-0001`)

### Verificação pós-migração

```sql
-- Confirmar dados do negócio
SELECT * FROM negocio;

-- Confirmar backfill nas facturas existentes
SELECT numero, serie, emisor_nif, emisor_nombre_comercial FROM facturas LIMIT 10;

-- Confirmar contadores
SELECT * FROM series_contadores;

-- Testar geração de número (NÃO executar em produção sem intenção — avança o contador)
-- SELECT next_numero_factura('RS');
```

---

## 2. Edge Functions — O que actualizar

As Edge Functions **não têm deploy automático**. Copia o conteúdo do ficheiro correspondente e cola no Supabase Dashboard → Edge Functions → Edit.

### `whatsapp-recordatorio`

**Ficheiro local:** `supabase/functions/whatsapp-recordatorio/index.ts`

**Alterações:**
- `GTIMotors` → `RSMotors` (linha do título da mensagem)
- `698 191 512` → `665 05 86 33` (linha de telefone)
- `Travesia de Vigo 105 Bajo, Vigo` → `Travesía de Vigo, 105 Bajo, 36205 Vigo (Pontevedra)`

### `whatsapp-confirmacion`

**Ficheiro local:** `supabase/functions/whatsapp-confirmacion/index.ts`

**Estado:** Sem referências a GTIMotors no texto das mensagens.
O número interno de notificação já é `665058633` (WhatsApp RSMotors). **Não requer alteração.**

### `whatsapp-listo`

**Ficheiro local:** `supabase/functions/whatsapp-listo/index.ts`

**Estado:** Sem referências a GTIMotors. **Não requer alteração.**

---

## 3. Princípio do Snapshot

Cada factura guarda os dados do emissor **no momento da emissão** nas colunas:

| Coluna                   | Descrição                        |
|--------------------------|----------------------------------|
| `emisor_razon_social`    | Razón social no momento          |
| `emisor_nombre_comercial`| Nome comercial no momento        |
| `emisor_nif`             | NIF/CIF no momento               |
| `emisor_domicilio`       | Endereço completo no momento     |
| `serie`                  | Série da factura (`GTI` ou `RS`) |

**Facturas antigas (série GTI):** backfill com dados da GTIMotors 2020 SLU — CIF B23860984.  
**Facturas novas (série RS):** dados da tabela `negocio` copiados no momento de criação.

O PDF usa **sempre** as colunas `emisor_*` da própria factura, nunca a configuração actual.

---

## 4. Numeração

- **Série GTI (legado):** formato `AAAA-NNNN` (ex. `2026-0001`)
- **Série RS (novo):** formato `RS-AAAA-NNNN` (ex. `RS-2026-0001`)
- Função SQL `next_numero_factura(p_serie)` gera o próximo número de forma atómica
- Tabela `series_contadores` guarda o último número por série + ano

---

## 5. TODOs

- [ ] **Deploy Edge Functions:** copiar `whatsapp-recordatorio/index.ts` actualizado para o Dashboard do Supabase
