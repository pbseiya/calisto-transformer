module.exports = {
  apps: [{
    name: 'dga-app',
    script: 'npm',
    args: 'start',
    cwd: '/home/seiya/projects/calisto-transformer/dga-nextjs',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_PASSWORD: 'mysecretpassword',
      NEXTAUTH_SECRET: 'dga_monitor_secret_key_2024',
      NEXTAUTH_URL: 'https://10.28.15.77/dga',
      DGA_USERNAME: 'admin',
      DGA_PASSWORD: 'dga2024',
      TELEGRAM_BOT_TOKEN: '8749140014:AAExxdykao56dzA26lmkf4zyOsUbN0w8sE8',
      TELEGRAM_CHAT_ID: '6729022410',
      IRPC_AUTH_URL: 'http://devmscenter-api.irpc.in.th/Auth',
      DATABASE_URL: 'postgresql://postgres:mysecretpassword@localhost:5432/dga_monitor'
    }
  }]
};
