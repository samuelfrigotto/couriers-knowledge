// server.js - CORREÇÃO DO WEBHOOK

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const apiLimitsResetJob = require('./src/jobs/resetApiLimits');

// Importa as rotas
const healthRoutes = require('./src/api/routes/health.routes');
const authRoutes = require('./src/api/routes/auth.routes');
const userRoutes = require('./src/api/routes/user.routes');
const evaluationRoutes = require('./src/api/routes/evaluation.routes');
const steamRoutes = require('./src/api/routes/steam.routes');
const gsiRoutes = require('./src/api/routes/gsi.routes');
const friendsRoutes = require('./src/api/routes/friends.routes');
const stripeRoutes = require('./src/api/routes/stripe.routes'); 
const statusRoutes = require('./src/api/routes/status.routes'); // ← NOVA ROTA ADICIONADA
const immortalRoutes = require('./src/api/routes/immortal.routes'); // ✅ CAMINHO CORRIGIDO
const dotaScraperRoute = require('./dotaLeaderboardScrapper');
const knownPlayersRoutes = require('./src/api/routes/known.players.routes');

const mmrVerificationRoutes = require('./src/api/routes/mmr.verification.routes');
// 2. Inicializar o aplicativo Express
const app = express();

// 3. Configurar os Middlewares

// ⚠️ IMPORTANTE: WEBHOOK PRIMEIRO, ANTES DE QUALQUER MIDDLEWARE
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());
apiLimitsResetJob.start();
// --- CONFIGURAÇÃO DA SESSÃO E PASSPORT ---
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
require('./src/config/passport');
// --- FIM DA CONFIGURAÇÃO ---

// 4. Definir a porta a partir do ambiente ou usar um valor padrão
const PORT = process.env.PORT || 3001;

// 5. Rota de teste
app.get('/', (req, res) => {
  res.json({ message: "Bem-vindo à API do Courier's Knowledge! O servidor está funcionando." });
});


app.use('/uploads', express.static(path.join(__dirname, './src/uploads')));

// Carrega as rotas da API
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', steamRoutes);
app.use('/api', gsiRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/status', statusRoutes); 
app.use('/api/immortal', immortalRoutes); // ✅ REGISTRAR ROTAS IMMORTAL
app.use('/api', dotaScraperRoute);
app.use('/api/mmr-verification', mmrVerificationRoutes);
app.use('/api/known-players', knownPlayersRoutes);
 // Rotas existentes... 




// ===== ADICIONAR MIDDLEWARE DE CORS PARA LEADERBOARD =====
app.use((req, res, next) => {
  // Permitir requests para leaderboard
  if (req.path.startsWith('/api/immortal')) {
    res.header('Cache-Control', 'public, max-age=3600'); // Cache de 1 hora
  }
  next();
});

// ===== CONFIGURAÇÃO ESPECIAL PARA SERVIR IMAGENS =====
app.use('/api/mmr-verification/screenshot', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 6. Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Courier's Knowledge rodando na porta ${PORT}`);
});

module.exports = app;