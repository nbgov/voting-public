import type { WorkerOptions } from 'bullmq'

export const QUEUE_REMOTE_SYNC = 'remote-sync'

export const QUEUE_CLENUP = 'db-cleanup'

export const QUEUE_DB_SYNC = 'db-sync'

export const QUEUE_AUDIT = 'audit-queue'

export const QUEUE_ALGO_SYNC = 'algo-sync'

export const QUEUE_ADMIN = 'admin'

export const PREFIX = 'nbvoting'

export const ALL_WORKERS = '*'

export const REMOTE_WORKER = 'remote'

export const SERVICES_WORKER = 'servies'

export const CLEANUP_WORKER = 'cleanup'

export const ALGO_WORKER = 'alog'

export const DB_WORKER = 'db'

export const ADMIN_WORKER = 'admin'

export const FREQUENT_WORKER = 'frequent'

export const AUDIT_WORKER = 'audit'

export const REMOTE_CONCURRENCY = 200

export const DB_CONCURRENCY = 2000

export const ALGO_CONCURRENCY = 5000

export const ADMIN_CONCURRENCY = 200

export const AUTH_CLEAUP_FREQUENCY = 300

export const PROOF_CLEAUP_FREQUENCY = 3600

export const queueOptions: Record<string, Partial<WorkerOptions>> = {
  [QUEUE_REMOTE_SYNC]: { concurrency: REMOTE_CONCURRENCY },
  [QUEUE_DB_SYNC]: { concurrency: DB_CONCURRENCY },
  [QUEUE_ALGO_SYNC]: { concurrency: ALGO_CONCURRENCY },
  [QUEUE_ADMIN]: { concurrency: ADMIN_CONCURRENCY }
}
