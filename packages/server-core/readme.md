# Performance and reliability
## In-code markers
* ✅ @session - user related data should be stored in a storage keyed by token
* ✅ @remote - there is a remote request that needs to be detached by the queue
* ✅ ⚠️ @queue - calculation heavy operation that should be queued
* ✅ @frequent - waiting of this operation may create problems
* ✅ @cache - something that can be globally cached
* @admin - admin only heavy functionality
* ✔ @census - census related methods - they could be especially heavy - so one need to sync about parallel processing
* ✅ @vulnarability - potential vulnarability that should be fixed
