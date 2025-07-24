// couriers-knowledge-backend/src/api/routes/auth.routes.js - COM DEBUG

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Rota 1: Inicia o processo de autenticação com a Steam
router.get('/auth/steam', passport.authenticate('steam', { session: true }));

// Rota 2: A Steam redireciona o usuário de volta para cá após o login
router.get('/auth/steam/return',
    passport.authenticate('steam', { session: true, failureRedirect: '/' }),
    (req, res) => {
        console.log('🔍 [AUTH BACKEND] ===== STEAM RETURN =====');
        console.log('🔍 [AUTH BACKEND] req.user:', req.user);
        console.log('🔍 [AUTH BACKEND] FRONTEND_URL:', process.env.FRONTEND_URL);
        
        const user = req.user;

        if (!user) {
            console.error('❌ [AUTH BACKEND] Usuário não encontrado após autenticação Steam');
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
        }

        try {
            // Criamos nosso token JWT para o usuário
            const tokenPayload = { 
                id: user.id, 
                steam_id: user.steam_id 
            };
            
            console.log('🔍 [AUTH BACKEND] Token payload:', tokenPayload);
            
            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            console.log('✅ [AUTH BACKEND] Token gerado com sucesso');
            console.log('🔍 [AUTH BACKEND] Token preview:', token.substring(0, 50) + '...');
            
            const redirectUrl = `${process.env.FRONTEND_URL}/login/success?token=${token}`;
            console.log('🔍 [AUTH BACKEND] Redirecionando para:', redirectUrl);
            
            res.redirect(redirectUrl);
            
        } catch (error) {
            console.error('❌ [AUTH BACKEND] Erro ao gerar token:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation`);
        }
    }
);

module.exports = router;