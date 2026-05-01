# CI/CD Setup Manual (Windows and macOS)

This guide sets up GitHub Actions to deploy the frontend build to an EC2 server through SSH.

## 1) CI/CD Overview

Pipeline flow:

1.  Trigger on push to `main`
2.  Install dependencies and run build in GitHub Actions
3.  Upload `dist` to EC2
4.  Replace Nginx web root content with latest build

## 2) Prerequisites

-   EC2 server prepared (see `docs/ec2-setup-manual.md`)
-   This repo hosted on GitHub
-   Access to repo Settings -> Secrets and variables -> Actions
-   `.pem` key that can SSH into EC2 as `ubuntu`

## 3) Prepare SSH Key for GitHub Actions

### Windows Version

In PowerShell, print key content:

```powershell
Get-Content C:\path\to\your-key.pem -Raw
```

Copy the full output (including `BEGIN` and `END` lines).

### macOS Version

In Terminal, print key content:

```bash
cat ~/Downloads/your-key.pem
```

Copy the full output (including `BEGIN` and `END` lines).

## 4) Add Repository Secrets and Variables

In GitHub repo, go to `Settings` -> `Secrets and variables` -> `Actions`.

### 4.1 Add Repository Secrets (Secrets tab)

1.  Click the `Secrets` tab.
2.  Under **Repository secrets**, click `New repository secret`.
3.  Add each secret:
    - `EC2_HOST`: EC2 public IP or DNS
    - `EC2_USER`: `ubuntu`
    - `EC2_SSH_KEY`: full private key content from `.pem`
    - `EC2_PORT`: `22` (optional; set in workflow if non-default)

### 4.2 Add Repository Variables (Variables tab)

1.  Click the `Variables` tab.
2.  Under **Repository variables** (not Environment variables), click `New repository variable`.
3.  Add:
    - `VITE_API_BASE_URL` = backend API base URL (example: `http://<EC2_PUBLIC_IP>:8080`)
    - `VITE_TODOS_PATH` = todos API path (example: `/api/todos`)

### 4.3 Important note (common mistake)

-   `VITE_API_BASE_URL` and `VITE_TODOS_PATH` must be saved as **Repository variables**, because the workflow reads them with `${{ vars.* }}`.
-   If you save them as **Repository secrets**, the frontend build can still succeed, but the UI may show `(not set)` for backend env values.
-   The **Environment variables** area is different from **Repository variables**. Unless your workflow explicitly targets an environment, add `VITE_*` under **Repository variables**.

## 5) Add Deployment Workflow

Create `.github/workflows/deploy-ec2.yml`:

```yaml
name: Deploy Frontend to EC2

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
          VITE_TODOS_PATH: ${{ vars.VITE_TODOS_PATH }}
        run: npm run build

      - name: Upload dist to EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          port: ${{ secrets.EC2_PORT || 22 }}
          source: "dist/*"
          target: "/home/ubuntu/app"
          strip_components: 1

      - name: Publish dist to Nginx root
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          port: ${{ secrets.EC2_PORT || 22 }}
          script: |
            sudo mkdir -p /var/www/html
            sudo rm -rf /var/www/html/*
            sudo cp -r /home/ubuntu/app/* /var/www/html/
            sudo systemctl restart nginx
```

## 6) One-Time Server Permission Setup (Run on EC2)

```bash
mkdir -p /home/ubuntu/app
```

If copy/restart commands need elevated permission without prompt in CI, allow limited sudo for deploy user:

```bash
sudo visudo
```

Add:

```text
ubuntu ALL=(ALL) NOPASSWD:/bin/mkdir,/bin/rm,/bin/cp,/bin/systemctl
```

Use stricter command scoping if your security policy requires it.

## 7) Test Pipeline

1.  Commit and push to `main` (or rerun the latest workflow after variable updates).
2.  Open `GitHub -> Actions -> Deploy Frontend to EC2`.
3.  Confirm all jobs are green:
    - `Install dependencies`
    - `Build`
    - `Upload dist to EC2`
    - `Publish dist to Nginx root`
4.  Verify deployment by opening `http://<EC2_PUBLIC_IP>`.
5.  In the app UI, check Backend API info:
    - `VITE_API_BASE_URL` should not be `(not set)`
    - `VITE_TODOS_PATH` should not be `(not set)`

## 8) Troubleshooting

-   `Permission denied (publickey)`: check `EC2_SSH_KEY`, user, and host.
-   `Host key verification failed`: ensure action handles host keys or preconfigure known_hosts.
-   Empty site after deploy: verify `dist` exists and copy path is correct.
-   404 on route refresh: ensure Nginx `try_files ... /index.html;` is configured.
-   `EBADPLATFORM` for `@rolldown/binding-win32-x64-msvc`: remove it from direct `dependencies`/`devDependencies` and regenerate `package-lock.json` using `npm install` before running CI on Linux.
-   App dialog shows `VITE_API_BASE_URL` or `VITE_TODOS_PATH` as `(not set)`: confirm both are under `Settings` -> `Secrets and variables` -> `Actions` -> `Variables` -> **Repository variables**, then rerun the workflow.
-   Variable updated but app still shows old value: rerun the latest workflow (or push a new commit) so frontend is rebuilt with the new variables.