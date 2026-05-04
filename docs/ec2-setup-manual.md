# EC2 Setup Manual (Windows and macOS)

This guide explains how to provision and prepare an AWS EC2 instance to host this frontend app.

## 1) Create EC2 Instance (AWS Console)

1. Open AWS Console -> EC2 -> Instances -> Launch instances.
2. Recommended values:
   - **Name:** `mfe-todo-demo`
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance type:** `t2.micro` (free tier) or equivalent
   - **Key pair name:** `ms-mfe-demo-key` (download yields `ms-mfe-demo-key.pem`)
   - **Key pair type:** RSA (format `.pem`)
3. Attach security group **`mfe-demo-sg`**. Create it only if it does not already exist; if `mfe-demo-sg` is already in your account, select it and skip creating a new one. Typical rules:
   - SSH **22** from your public IP only
   - HTTP **80** from anywhere (or restrict as needed)
   - HTTPS **443** from anywhere (optional, for TLS later)
4. Launch the instance and note its **Public IPv4** address.

## 2) Connect to EC2

### Windows Version

Use PowerShell with built-in OpenSSH:

```powershell
# Move to folder where your key is stored
cd C:\path\to\key

# Optional: tighten key permissions
icacls .\ms-mfe-demo-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"

# Connect
ssh -i .\ms-mfe-demo-key.pem ubuntu@<EC2_PUBLIC_IP>
```

If you use PuTTY, convert `ms-mfe-demo-key.pem` to `.ppk` with PuTTYgen and connect as user `ubuntu`.

### macOS Version

Use Terminal:

```bash
mkdir -p ~/.ssh
cp ~/Downloads/ms-mfe-demo-key.pem ~/.ssh/
chmod 400 ~/.ssh/ms-mfe-demo-key.pem
ssh -i ~/.ssh/ms-mfe-demo-key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 3) Provision Server (Run on EC2)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx curl
```

Install Node.js (LTS via nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts
node -v
npm -v
```

## 4) Build and Deploy Frontend on EC2

```bash
git clone <YOUR_REPO_URL>
cd mfe-aws-ec2-demo
cat > .env <<'EOF'
VITE_API_BASE_URL=http://<BACKEND_HOST_OR_IP>:8080
VITE_TODOS_PATH=/api/todos
EOF
npm ci
npm run build
```

Copy build output to Nginx web root:

```bash
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
```

Quick validation:

```bash
ls -la dist
```

## 5) Configure Nginx for SPA Routing

Create/update Nginx site config:

```bash
sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

Validate and restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

Open `http://<EC2_PUBLIC_IP>` in browser.

Optional CLI check:

```bash
curl -I http://localhost
```
