# VirtualBox PHP / React Environment

## VirtualBox Setup

### Download Ubuntu Server

[Ubuntu 24.04.2 LTS ](https://ubuntu.com/download/server/thank-you?version=24.04.2&architecture=amd64&lts=true)

### Install VirtualBox

[https://www.virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads)

- Create a new box and use the Ubuntu ISO

- Use bridged adapter and restart the server <- make sure to do this or you can't ssh in

### Install SSH

```bash
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh
sudo reboot	
```

SSH in `ssh code@interview` 

### update packages

```bash
# Update and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl unzip software-properties-common
sudo reboot
```

## PHP

```bash
# PHP runtime + common extensions
sudo apt install -y php8.3 \
  libapache2-mod-php php8.3-fpm php8.3-cli \
  php8.3-mbstring php8.3-mysql php8.3-xml php8.3-curl \
  php8.3-gd php8.3-zip php8.3-bcmath
```

## Composer 

```bash
sudo apt install composer
composer --version
```

## Apache

```bash
# 2-a. web server
sudo apt install -y apache2            # serves :80 inside VM
sudo systemctl enable --now apache2
sudo systemctl restart apache2
sudo reboot

# 2-c. hello-world
echo '<?php phpinfo();' | sudo tee /var/www/html/info.php

```







## Node / React

### Node/React toolchain

```bash
# 1-a. install Node Version Manager
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc         # load nvm into the current shell
nvm --version            # sanity check

# 1-b. install the current LTS (Node 20) and make it default
nvm install --lts
nvm alias default lts/*

# 1-c. verify
node -v && npm -v && npx --help	
```

#### Quick React smoke-test (inside your shared project folder)

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm i
npm run dev -- --host   # exposed on port 3000 inside the VM
```



### Check port and browse

```bash
ip addr show #  192.168.86.178
```

shows apache page



## Mysql

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation      # set root pwd, drop test DB, etc.
```

## Composer 

```bash
sudo apt install -y php-cli zip unzip curl
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
composer --version

```

## Git

```bash
# 6-a. install
sudo apt update
sudo apt install -y git

# 6-b. verify
git --version        # expect git version 2.43.x or newer
```

### config

```bash
git config --global user.name  "Rishi Satsangi"
git config --global user.email "rishi.satsangi@gmail.com"

```

### ssh key

```bash
ssh-keygen -t ed25519 -C "rishi.satsangi@gmail.com"

# start the agent & add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# copy the public key, then paste into GitHub → Settings → SSH keys
cat ~/.ssh/id_ed25519.pub
```

Setup at [https://github.com/settings/keys](https://github.com/settings/keys)

#### check

```bash
ssh -T git@github.com      # or git@gitlab.com

```

## Backend Setup

### Slim

