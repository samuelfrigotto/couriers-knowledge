// backend/src/services/steamFriends.service.js
// Passo 2: Service para buscar amigos da Steam API

const axios = require('axios');
const db = require('../config/database');
require('dotenv').config();

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_API_BASE_URL = 'https://api.steampowered.com';

/**
 * Busca a lista de amigos do usuário na Steam
 * @param {string} steamId - Steam ID do usuário
 * @returns {Array} Lista de amigos
 */
async function getFriendList(steamId) {
    try {
        const url = `${STEAM_API_BASE_URL}/ISteamUser/GetFriendList/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&relationship=friend`;
        
        console.log(`Buscando amigos para Steam ID: ${steamId}`);
        const response = await axios.get(url, { timeout: 10000 });
        
        // Se não há lista de amigos (perfil privado ou sem amigos)
        if (!response.data.friendslist) {
            console.log('Nenhuma lista de amigos encontrada (perfil pode estar privado)');
            return [];
        }
        
        const friends = response.data.friendslist.friends || [];
        console.log(`Encontrados ${friends.length} amigos`);
        
        return friends;
    } catch (error) {
        console.error('Erro ao buscar lista de amigos da Steam:', error.message);
        
        if (error.response?.status === 401) {
            throw new Error('Perfil de amigos é privado ou Steam ID inválido');
        }
        
        throw new Error('Não foi possível buscar a lista de amigos');
    }
}

/**
 * Busca detalhes dos amigos (nomes, avatares, etc.)
 * @param {Array} friendSteamIds - Array de Steam IDs dos amigos
 * @returns {Array} Detalhes dos amigos
 */
async function getFriendsDetails(friendSteamIds) {
    if (!friendSteamIds || friendSteamIds.length === 0) {
        return [];
    }
    
    try {
        // Steam API permite até 100 IDs por request, então fazemos em lotes
        const batchSize = 100;
        const allFriendsDetails = [];
        
        for (let i = 0; i < friendSteamIds.length; i += batchSize) {
            const batch = friendSteamIds.slice(i, i + batchSize);
            const url = `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${batch.join(',')}`;
            
            console.log(`Buscando detalhes de ${batch.length} amigos (lote ${Math.floor(i/batchSize) + 1})`);
            const response = await axios.get(url, { timeout: 10000 });
            
            if (response.data.response?.players) {
                allFriendsDetails.push(...response.data.response.players);
            }
        }
        
        console.log(`Detalhes obtidos para ${allFriendsDetails.length} amigos`);
        return allFriendsDetails;
        
    } catch (error) {
        console.error('Erro ao buscar detalhes dos amigos:', error.message);
        throw new Error('Não foi possível buscar detalhes dos amigos');
    }
}

/**
 * Verifica quais amigos já usam o Courier's Knowledge
 * @param {Array} friendSteamIds - Array de Steam IDs dos amigos
 * @returns {Object} Objeto com amigos que usam e não usam o app
 */
async function checkFriendsInApp(friendSteamIds) {
    if (!friendSteamIds || friendSteamIds.length === 0) {
        return { usingApp: [], notUsingAppSteamIds: [] };
    }
    
    try {
        console.log(`Verificando ${friendSteamIds.length} amigos no banco de dados`);
        
        // Busca todos os amigos que estão registrados no nosso app
        const query = `
            SELECT steam_id, steam_username, avatar_url, created_at 
            FROM users 
            WHERE steam_id = ANY($1)
        `;
        
        const { rows } = await db.query(query, [friendSteamIds]);
        console.log(`${rows.length} amigos encontrados no banco de dados`);
        
        // Cria um Set com os Steam IDs que já usam o app
        const usingAppSteamIds = new Set(rows.map(user => user.steam_id));
        
        // Separa os que usam e os que não usam
        const notUsingAppSteamIds = friendSteamIds.filter(id => !usingAppSteamIds.has(id));
        
        console.log(`${rows.length} amigos usam o app, ${notUsingAppSteamIds.length} não usam`);
        
        return {
            usingApp: rows,
            notUsingAppSteamIds: notUsingAppSteamIds
        };
        
    } catch (error) {
        console.error('Erro ao verificar amigos no banco de dados:', error.message);
        throw new Error('Erro ao verificar amigos no banco de dados');
    }
}

module.exports = {
    getFriendList,
    getFriendsDetails,
    checkFriendsInApp
};