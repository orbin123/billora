# Billora deployment

The SQL migrations in `supabase/migrations` are applied to the connected [Billora Supabase project](https://supabase.com/dashboard/project/elrftrkejkrjhtnywirt).

## Run Billora

For local development, start your local Supabase stack, copy `.env.example` to `.env.local`, and use the local API URL, publishable key, and server-only secret key from `supabase status`. Run `npm ci` and `npm run dev`. Create a confirmed admin with the Supabase Auth Admin API and set their app metadata to `{ "billora_admin": true }`. Use separate test credentials for each non-production project.

## GitHub checks and releases

Open a pull request into `main`. GitHub requires **Build and lint** and **Database migrations** to pass on the current changes before the PR can merge. The database check replays migrations on a clean Postgres instance and runs the workspace-isolation and checkout checks. It uses a local database on the GitHub runner.

When GitHub merges the PR, the release job stages a Vercel Production build, applies any pending Supabase migrations, and then promotes that build to the production domains. Keep new migrations compatible with the currently live app during the release. A migration failure leaves the previous deployment serving traffic. The next release still checks for pending migrations, even if the latest PR only changed app code.

### Production configuration

| Where | Name | Value |
| --- | --- | --- |
| GitHub `production` environment variable | `SUPABASE_PROJECT_REF` | `elrftrkejkrjhtnywirt` |
| GitHub `production` environment variables | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Team ID and project ID for Billora |
| GitHub `production` environment secrets | `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | Vercel deployment token, scoped Supabase access token, and Billora database password |
| Vercel **Production** environment variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Billora Supabase URL and publishable key |

Enter the credentials directly in the [GitHub production environment](https://github.com/orbin123/billora/settings/environments). The environment accepts only the `main` branch. [Create a Vercel token](https://vercel.com/account/tokens) and see [Supabase CI credential permissions](https://supabase.com/docs/guides/deployment/managing-environments?environment=ci).

Connect the Vercel project to `orbin123/billora` for Preview deployments. The repository configuration disables Vercel's Git-triggered deploy for `main` so the release job controls production promotion. Configure **Preview** separately with a test Supabase project if previews need working sign-in and database access. [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)

## Set up private sign-in

Disable **Allow new users to sign up** in Supabase Authentication for each hosted environment. Set `SUPABASE_SECRET_KEY` as a server-only Vercel variable for that environment. The secret key lets Billora create individual Auth accounts when the admin adds employees. Keep **Confirm email** enabled. Admin-provisioned identities are confirmed when created. [Supabase Auth configuration](https://supabase.com/docs/guides/auth/general-configuration)

For the first production release, set `BILLORA_BOOTSTRAP_ADMIN_EMAIL` as a GitHub `production` environment variable and `BILLORA_BOOTSTRAP_ADMIN_PASSWORD` as a secret. The protected release configures private sign-in, sets the Vercel server key, and creates the designated Supabase admin. This one-time step needs Supabase Auth configuration and API key permissions, plus Vercel project environment write access. Remove the bootstrap password secret after successful provisioning. You can also set up the same configuration directly in Supabase and Vercel before release.

The admin selects **Admin** on the sign-in screen and uses their email and password. On first sign-in, Billora creates their workspace. Under **Employees → Add employee**, the admin creates a username and initial password and assigns a role. The employee selects **Employee** and uses those credentials. Employees with an existing email login can keep using it.

New workspaces start with an empty catalog and a 0% GST rate. Owners can set receipt details, currency, time zone, rates, and paper width in Settings.

Each account belongs to one workspace at a time. Workspace members share the catalog and bill data their role allows. Held bills belong to the cashier who held them. Bank and card payment options record a completed payment collected at the counter.

## Verify database permissions

Run `supabase/tests/workspace_isolation.sql` in the Supabase SQL Editor as Postgres, with all migrations applied. The script uses test identities and rolls back its data. It covers tenant isolation, single-admin enrollment, employee provisioning and deactivation, stock changes and retry safety at checkout, and report access.
