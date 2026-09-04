# Task graph

    source audit
      -> canonical workspace
      -> auth/config/security
      -> owner-scoped schema + migrations
      -> critical-path API
      -> critical-path UI
      -> unit + MySQL integration tests
      -> production build + dependency audit
      -> Windows container acceptance
      -> browser/accessibility acceptance
      -> ngrok/HAI operator gates
      -> final verification + release

Provider-authorized automation is a separate future branch of work and is not a
dependency of the supported assisted workflow.
