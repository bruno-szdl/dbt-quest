/**
 * Shared fixture for the Selectors and tags module (levels 34–41).
 *
 * The graph (each non-root has exactly one parent — important so partial
 * selections always produce a runnable subset):
 *
 *     stg_customers ──► dim_customers
 *
 *     stg_orders ──► int_customer_orders ──► fct_customer_orders
 *                ──► fct_orders
 *
 * Six models in three layers — small enough to follow visually,
 * branchy enough that +/, , space, and tag: produce different sets.
 */

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const STG_CUSTOMERS_SQL = `select
    id         as customer_id,
    name       as customer_name,
    country
from raw_customers`

const STG_ORDERS_SQL = `select
    id         as order_id,
    customer_id,
    amount,
    status
from raw_orders`

const INT_CUSTOMER_ORDERS_SQL = `select
    customer_id,
    count(*)                 as orders_count,
    coalesce(sum(amount), 0) as lifetime_value
from {{ ref('stg_orders') }}
group by customer_id`

const DIM_CUSTOMERS_SQL = `select
    customer_id,
    customer_name,
    country
from {{ ref('stg_customers') }}`

const FCT_ORDERS_SQL = `select
    order_id,
    customer_id,
    amount,
    status
from {{ ref('stg_orders') }}`

const FCT_CUSTOMER_ORDERS_SQL = `select
    customer_id,
    orders_count,
    lifetime_value
from {{ ref('int_customer_orders') }}`

export function selectorsFiles(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'models/stg_customers.sql': STG_CUSTOMERS_SQL,
    'models/stg_orders.sql': STG_ORDERS_SQL,
    'models/int_customer_orders.sql': INT_CUSTOMER_ORDERS_SQL,
    'models/dim_customers.sql': DIM_CUSTOMERS_SQL,
    'models/fct_orders.sql': FCT_ORDERS_SQL,
    'models/fct_customer_orders.sql': FCT_CUSTOMER_ORDERS_SQL,
    ...extra,
  }
}

/**
 * Same fixture, but with `tags: ['daily']` declared on stg_orders and
 * int_customer_orders. These two models form a tag-chain so that selecting
 * `tag:daily` produces a runnable subset (no broken refs).
 */
export function selectorsFilesWithTags(): Record<string, string> {
  return selectorsFiles({
    'models/schema.yml': `version: 2

models:
  - name: stg_orders
    config:
      tags: ['daily']
  - name: int_customer_orders
    config:
      tags: ['daily']
`,
  })
}

export const selectorsSeeds = {
  raw_customers: RAW_CUSTOMERS,
  raw_orders: RAW_ORDERS,
}

export const selectorsDagShape = {
  nodes: [
    { id: 'stg_customers', label: 'stg_customers', layer: 'staging' as const },
    { id: 'stg_orders', label: 'stg_orders', layer: 'staging' as const },
    { id: 'int_customer_orders', label: 'int_customer_orders', layer: 'intermediate' as const },
    { id: 'dim_customers', label: 'dim_customers', layer: 'mart' as const },
    { id: 'fct_orders', label: 'fct_orders', layer: 'mart' as const },
    { id: 'fct_customer_orders', label: 'fct_customer_orders', layer: 'mart' as const },
  ],
  edges: [
    { source: 'stg_customers', target: 'dim_customers' },
    { source: 'stg_orders', target: 'int_customer_orders' },
    { source: 'stg_orders', target: 'fct_orders' },
    { source: 'int_customer_orders', target: 'fct_customer_orders' },
  ],
}

export function exactRan(ranModels: Set<string>, expected: string[]): boolean {
  if (ranModels.size !== expected.length) return false
  return expected.every((n) => ranModels.has(n))
}
