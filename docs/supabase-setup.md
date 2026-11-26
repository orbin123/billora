# Billora deployment

The SQL migrations in `supabase/migrations` are applied to the connected [Billora Supabase project](https://supabase.com/dashboard/project/elrftrkejkrjhtnywirt).

## Run Billora

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key. Run `npm ci` and `npm run dev`. The app uses the signed-in account's session and the project's public API. A Supabase service-role key is unnecessary.

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

## Enable customer registration at launch

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel project's environment variables. Redeploy after changing them.
2. In Supabase Authentication URL Configuration, set **Site URL** to the production website and add its exact `/auth/callback` URL to **Redirect URLs**. For local testing, add `http://localhost:3000/auth/callback` or the exact local URL you use. [Supabase redirect settings](https://supabase.com/docs/guides/auth/redirect-urls)
3. Keep email sign-up and **Confirm email** enabled. Configure a custom SMTP provider in Supabase Auth to send confirmations to customers and employees outside the project team. [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)

An owner selects **Create an owner account**, verifies their email, and names their business. In **Settings → Roles & permissions**, they can edit Employee permissions or add a custom role. In **Employees**, they can add an employee, assign a role, and copy the invitation link to share with that person. The employee signs in or registers with the invited email, verifies it, and accepts the invitation. Links expire after seven days and can be renewed by the owner.

New workspaces start with an empty catalog and a 0% GST rate. Owners can set receipt details, currency, time zone, rates, and paper width in Settings.

Each account belongs to one workspace at a time. Workspace members share the catalog and bill data their role allows. Held bills belong to the cashier who held them. Bank and card payment options record a completed payment collected at the counter.

## Verify database permissions

Run `supabase/tests/workspace_isolation.sql` in the Supabase SQL Editor as Postgres, with all migrations applied. The script uses test identities and rolls back its data. It covers tenant isolation, employee invitations and deactivation, stock changes and retry safety at checkout, and report access.
