# Security policy

Security fixes target the latest version on the default branch. Deployments should use current dependencies and protect server environment variables.

To report a vulnerability, use the repository's **Security → Advisories → Report a vulnerability** option when private reporting is enabled. Otherwise contact the repository owner through their GitHub profile. If no private channel is available, open an issue asking for one without describing the vulnerability. Do not publish tokens, private organization data, or working exploits in an issue.

Include the affected version, impact, reproducible steps using fictional data, and any proposed fix. Maintainers will review reports as availability allows; no response SLA is promised.

`GITHUB_TOKEN`, OAuth secrets and session secrets must remain on the server. Organization membership is an access boundary. Demo mode serves fictional data; local test authentication bypass must never authorize production access. Rotate leaked credentials immediately and remove access from the issuing provider.
