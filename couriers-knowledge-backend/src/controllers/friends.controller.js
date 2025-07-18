// backend/src/controllers/friends.controller.js
// VERSÃO CORRIGIDA - Controller para gerenciar funcionalidades de amigos

const steamFriendsService = require('../services/steamFriends.service');
const db = require('../config/database');

// Função 1: GET /api/friends/status
const getFriendsStatus = async (req, res) => {
    try {
        const userSteamId = req.user.steam_id;
        console.log(`Buscando status de amigos para usuário: ${req.user.steam_username} (${userSteamId})`);
        
        // 1. Busca lista de amigos na Steam
        const friendsList = await steamFriendsService.getFriendList(userSteamId);
        
        if (friendsList.length === 0) {
            return res.json({
                message: 'Nenhum amigo encontrado ou perfil privado',
                total_friends: 0,
                usingApp: [],
                notUsingApp: [],
                statistics: {
                    friends_using_app: 0,
                    friends_not_using_app: 0,
                    total_invites_sent: 0,
                    friends_joined_after_invite: 0
                }
            });
        }
        
        // 2. Extrai os Steam IDs dos amigos
        const friendSteamIds = friendsList.map(friend => friend.steamid);
        console.log(`Processando ${friendSteamIds.length} amigos`);
        
        // 3. Busca detalhes dos amigos na Steam
        const friendsDetails = await steamFriendsService.getFriendsDetails(friendSteamIds);
        
        // 4. Verifica quais amigos já usam o app
        const { usingApp, notUsingAppSteamIds } = await steamFriendsService.checkFriendsInApp(friendSteamIds);
        
        // 5. Monta lista de amigos que não usam o app com seus detalhes
        const notUsingApp = friendsDetails
            .filter(friend => notUsingAppSteamIds.includes(friend.steamid))
            .map(friend => ({
                steam_id: friend.steamid,
                steam_username: friend.personaname,
                avatar_url: friend.avatarfull || friend.avatarmedium || friend.avatar,
                profile_url: friend.profileurl,
                is_online: friend.personastate !== 0,
                already_invited: false
            }));
        
        // 6. Busca histórico de convites
        const inviteQuery = `
            SELECT friend_steam_id, created_at
            FROM friend_invites 
            WHERE inviter_id = $1
        `;
        const { rows: inviteHistory } = await db.query(inviteQuery, [req.user.id]);
        const invitedSteamIds = new Set(inviteHistory.map(invite => invite.friend_steam_id));
        
        // Marca amigos que já foram convidados
        notUsingApp.forEach(friend => {
            if (invitedSteamIds.has(friend.steam_id)) {
                friend.already_invited = true;
                const invite = inviteHistory.find(inv => inv.friend_steam_id === friend.steam_id);
                if (invite) {
                    friend.invited_at = invite.created_at;
                }
            }
        });
        
        // 7. Calcula estatísticas
        const statistics = {
            friends_using_app: usingApp.length,
            friends_not_using_app: notUsingApp.length,
            total_invites_sent: inviteHistory.length,
            friends_joined_after_invite: inviteHistory.filter(invite => 
                usingApp.some(user => user.steam_id === invite.friend_steam_id)
            ).length
        };
        
        console.log('Estatísticas:', statistics);
        
        res.json({
            total_friends: friendsList.length,
            usingApp: usingApp.map(user => ({
                steam_id: user.steam_id,
                steam_username: user.steam_username,
                avatar_url: user.avatar_url,
                joined_at: user.created_at
            })),
            notUsingApp,
            statistics
        });
        
    } catch (error) {
        console.error('Erro ao buscar status dos amigos:', error);
        res.status(500).json({
            message: 'Erro ao buscar informações dos amigos',
            error: error.message
        });
    }
};

// Substitua a função inviteFriend por esta versão corrigida:

const inviteFriend = async (req, res) => {
    try {
        const { friend_steam_id } = req.body;
        const inviterUserId = req.user.id;
        const inviterSteamId = req.user.steam_id;
        
        // ===== BUSCAR USERNAME DO BANCO =====
        const userQuery = 'SELECT steam_username FROM users WHERE id = $1';
        const { rows: userRows } = await db.query(userQuery, [inviterUserId]);
        const inviterName = userRows[0]?.steam_username || 'Usuário';
        
        console.log(`${inviterName} (ID: ${inviterUserId}) quer convidar Steam ID: ${friend_steam_id}`);
        
        if (!friend_steam_id) {
            return res.status(400).json({
                message: 'Steam ID do amigo é obrigatório'
            });
        }
        
        // Verifica se o amigo já usa o app
        const { usingApp } = await steamFriendsService.checkFriendsInApp([friend_steam_id]);
        if (usingApp.length > 0) {
            return res.status(400).json({
                message: 'Este amigo já usa o Courier\'s Knowledge!'
            });
        }
        
        // Busca detalhes do amigo na Steam
        const friendsDetails = await steamFriendsService.getFriendsDetails([friend_steam_id]);
        if (friendsDetails.length === 0) {
            return res.status(404).json({
                message: 'Amigo não encontrado na Steam'
            });
        }
        
        const friendDetails = friendsDetails[0];
        
        // Gera link de convite
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const inviteLink = `${baseUrl}/convite?ref=${inviterSteamId}&friend=${friend_steam_id}`;
        
        // Gera mensagem de convite
        const inviteMessage = `🎮 Olá ${friendDetails.personaname}!\n\n` +
                           `${inviterName} te convidou para usar o Courier's Knowledge - ` +
                           `o app que permite fazer anotações sobre jogadores de Dota 2!\n\n` +
                           `✅ Avalie jogadores nas suas partidas\n` +
                           `✅ Veja avaliações de outros usuários\n` +
                           `✅ Compartilhe experiências com amigos\n\n` +
                           `Acesse agora: ${inviteLink}\n\n` +
                           `#Dota2 #CouriersKnowledge`;
        
        // Registra o convite no banco de dados
        const insertQuery = `
            INSERT INTO friend_invites (inviter_id, friend_steam_id, created_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (inviter_id, friend_steam_id) 
            DO UPDATE SET created_at = NOW()
            RETURNING *
        `;
        
        await db.query(insertQuery, [inviterUserId, friend_steam_id]);
        console.log(`Convite registrado no banco de dados`);
        
        res.json({
            message: 'Convite gerado com sucesso!',
            invite_data: {
                friend_name: friendDetails.personaname,
                friend_avatar: friendDetails.avatarfull || friendDetails.avatarmedium,
                invite_link: inviteLink,
                invite_message: inviteMessage,
                steam_profile_url: friendDetails.profileurl
            }
        });
        
    } catch (error) {
        console.error('Erro ao gerar convite:', error);
        res.status(500).json({
            message: 'Erro ao gerar convite',
            error: error.message
        });
    }
};



// EXPORTAÇÃO
module.exports = {
    getFriendsStatus,
    inviteFriend
};