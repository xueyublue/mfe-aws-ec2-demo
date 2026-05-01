# EC2 Setup Manual (Windows and macOS)

This guide explains how to provision and prepare an AWS EC2 instance to host this frontend app.

## 1) Prerequisites

- AWS account with permission to create EC2, key pairs, and security groups
- A GitHub repository for this project
- SSH key pair (`.pem`) downloaded during EC2 key pair creation

## 2) Create EC2 Instance (AWS Console)

1. Open AWS Console -> EC2 -> Instances -> Launch instances.
2. Recommended values:
   - Name: `todo-frontend-ec2`
   - AMI: `Ubuntu Server 22.04 LTS`
   - Instance type: `t2.micro` (free tier) or equivalent
   - Key pair: create/select a key pair and download the `.pem` file
3. Network settings:
   - Allow SSH (`22`) from your IP
   - Allow HTTP (`80`) from anywhere
   - Allow HTTPS (`443`) from anywhere
4. Launch instance and note its Public IPv4 address.

## 3) Connect to EC2

### Windows Version

Use PowerShell with built-in OpenSSH:

```powershell
# Move to folder where your key is stored
cd C:\path\to\key

# Optional: tighten key permissions
icacls .\your-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"

# Connect
ssh -i .\your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

If you use PuTTY, convert `.pem` to `.ppk` with PuTTYgen and connect as user `ubuntu`.

### macOS Version

Use Terminal:

```bash
cd ~/Downloads
chmod 400 your-key.pem
ssh -i ./your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 4) Provision Server (Run on EC2)

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

## 5) Build and Deploy Frontend on EC2

```bash
git clone <YOUR_REPO_URL>
cd mfe-aws-ec2-demo
npm ci
npm run build
```

Copy build output to Nginx web root:

```bash
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
```

## 6) Configure Nginx for SPA Routing

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

## 7) Post-Setup Checklist

- App loads from EC2 public IP
- Browser refresh on nested routes works (`try_files` verified)
- Security group only allows SSH from trusted IP ranges
- Optional: attach Elastic IP for stable address

