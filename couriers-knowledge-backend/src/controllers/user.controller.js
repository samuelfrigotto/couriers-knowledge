// ARQUIVO: backend/src/controllers/user.controller.js

const db = require('../config/database');
const steamService = require('../services/steam.service');

// ===================================================================================
// ROTA: GET /users/me
// ===================================================================================
exports.getMyProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const { rows } = await db.query('SELECT id, steam_id, steam_username, avatar_url, created_at FROM users WHERE id = $1', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// ===================================================================================
// ROTA: POST /users/me/refresh-names
// ===================================================================================
exports.refreshEvaluatedPlayerNames = async (req, res) => {
    const authorId = req.user.id;
    try {
        const query = `
            SELECT DISTINCT p.steam_id FROM players p
            JOIN evaluations e ON p.id = e.player_id
            WHERE e.author_id = $1;
        `;
        const { rows } = await db.query(query, [authorId]);
        const steamIdsToUpdate = rows.map(r => r.steam_id);

        if (steamIdsToUpdate.length === 0) {
            return res.status(200).json({ message: 'Nenhum jogador para atualizar.', updated: 0 });
        }

        const result = await steamService.updatePlayerNamesFromSteam(steamIdsToUpdate);
        
        res.status(200).json({ message: `Atualização concluída. ${result.updated} nomes foram atualizados.` });

    } catch (error) {
        console.error('Erro ao atualizar nomes de jogadores:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// ===================================================================================
// ROTA: GET /users/me/match-data
// ===================================================================================
exports.getMatchDataFromOpenDota = async (req, res) => {
    const userId = req.user.id;
    const userSteamId = req.user.steam_id;

    try {
        const recentMatchesList = await steamService.getMatchHistory(userSteamId, 20);
        if (!recentMatchesList || recentMatchesList.length === 0) {
            return res.status(200).json({ message: 'Nenhum histórico de partidas encontrado.', data: { matchHistory: [] } });
        }

        const matchDetailsPromises = recentMatchesList.map(match => steamService.getMatchDetails(match.match_id, userId));
        const settledMatches = await Promise.allSettled(matchDetailsPromises);
        
        const successfulMatches = settledMatches
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => {
                const originalMatch = recentMatchesList.find(m => m.match_id === result.value.match_id);
                const userPlayerInfo = result.value.players.find(p => p.steam_id_64 === userSteamId);
                return {
                    ...result.value,
                    user_hero_id: userPlayerInfo ? userPlayerInfo.hero_id : originalMatch.hero_id,
                    user_won: userPlayerInfo ? userPlayerInfo.win === 1 : (originalMatch.radiant_win === (originalMatch.player_slot < 128))
                };
            });

        if (successfulMatches.length > 0) {
            const client = await db.connect(); 
            try {
                await client.query('BEGIN');
                for (const match of successfulMatches) {
                    const query = `
                        INSERT INTO matches (match_id, user_id, radiant_win, duration, start_time, radiant_score, dire_score, players, user_hero_id, user_won)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (match_id) DO UPDATE SET
                            user_id = EXCLUDED.user_id,
                            players = EXCLUDED.players,
                            user_hero_id = EXCLUDED.user_hero_id,
                            user_won = EXCLUDED.user_won,
                            fetched_at = NOW();
                    `;
                    const values = [
                        match.match_id, userId, match.radiant_win, match.duration,
                        match.start_time, match.radiant_score, match.dire_score,
                        JSON.stringify(match.players), match.user_hero_id, match.user_won
                    ];
                    await client.query(query, values);
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                console.error('Falha ao salvar cache das partidas:', e);
            } finally {
                client.release(); 
            }
        }

        const newCallCount = req.user.api_calls_today + 4;
        const today = new Date().toISOString().slice(0, 10);
        await db.query('UPDATE users SET api_calls_today = $1, last_api_call_date = $2 WHERE id = $3', [newCallCount, today, userId]);
        
        res.status(200).json({ message: 'Dados atualizados com sucesso.', data: { matchHistory: successfulMatches } });

    } catch (error) {
        console.error('Erro ao buscar dados da OpenDota:', error);
        res.status(500).json({ message: 'Erro ao contatar serviços externos.' });
    }
};

// ===================================================================================
// ROTA: GET /users/me/stats
// ===================================================================================
exports.getUserStats = async (req, res) => {
    const authorId = req.user.id;
    const userSteamId = req.user.steam_id;

    try {
        const [
            evaluationsResult, 
            userResult, 
            cachedMatchesResult,
            receivedEvaluationsResult,
            selfEvaluationsResult
        ] = await Promise.all([
            db.query('SELECT rating, tags, evaluated_steam_id FROM evaluations WHERE author_id = $1', [authorId]),
            // AQUI ESTAVA O BUG: Faltava pedir a coluna 'api_calls_today'
            db.query('SELECT steam_username, avatar_url, created_at, account_status, api_calls_today FROM users WHERE id = $1', [authorId]),
            db.query('SELECT * FROM matches WHERE user_id = $1 ORDER BY start_time DESC LIMIT 20', [authorId]),
            db.query('SELECT rating FROM evaluations WHERE evaluated_steam_id = $1 AND author_id != $2', [userSteamId, authorId]),
            db.query('SELECT rating FROM evaluations WHERE author_id = $1 AND evaluated_steam_id = $2', [authorId, userSteamId]),
        ]);

        const evaluations = evaluationsResult.rows;
        const user = userResult.rows[0];
        const detailedMatches = cachedMatchesResult.rows;
        const receivedEvaluations = receivedEvaluationsResult.rows;
        const selfEvaluations = selfEvaluationsResult.rows;

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        
        // --- INÍCIO DO CÁLCULO DA "ANÁLISE DE TILT" ---
        const lowRatedPlayerSteamIds = new Set(
            evaluations
                .filter(e => parseFloat(e.rating) <= 2.0)
                .map(e => e.evaluated_steam_id)
        );

        let matchesWithLowRatedTeammates = 0;
        let winsWithLowRatedTeammates = 0;

        detailedMatches.forEach(match => {
            if (match && match.players) {
                const userPlayerInfo = match.players.find(p => p.steam_id_64 === userSteamId);
                if (!userPlayerInfo) return;

                const teammates = match.players.filter(p => p.is_radiant === userPlayerInfo.is_radiant && p.steam_id_64 !== userSteamId);
                
                const hasLowRatedTeammate = teammates.some(t => lowRatedPlayerSteamIds.has(t.steam_id_64));

                if (hasLowRatedTeammate) {
                    matchesWithLowRatedTeammates++;
                    if (match.user_won) {
                        winsWithLowRatedTeammates++;
                    }
                }
            }
        });

        const tiltWinRate = matchesWithLowRatedTeammates > 0 
            ? Math.round((winsWithLowRatedTeammates / matchesWithLowRatedTeammates) * 100) 
            : null; // Retorna null se nunca jogou com um jogador mal avaliado
        // --- FIM DO CÁLCULO ---


        // --- CÁLCULO DAS ATUALIZAÇÕES DIÁRIAS ---
        const userCreationDate = new Date(user.created_at);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        let totalUpdatesLimit;
        if (user.account_status === 'Premium') {
            totalUpdatesLimit = 30;
        } else if (userCreationDate > threeDaysAgo) {
            totalUpdatesLimit = 3; // Novo usuário
        } else {
            totalUpdatesLimit = 5; // Usuário padrão
        }

        const callsPerUpdate = 4;
        const totalCallsLimit = totalUpdatesLimit * callsPerUpdate;
        const remainingUpdates = Math.floor((totalCallsLimit - (user.api_calls_today || 0)) / callsPerUpdate);
        
        // --- CÁLCULO DAS OUTRAS ESTATÍSTICAS ---
        const totalEvaluations = evaluations.length;
        const averageRating = totalEvaluations > 0 ? parseFloat((evaluations.reduce((sum, e) => sum + parseFloat(e.rating), 0) / totalEvaluations).toFixed(2)) : 0;
        const tagCounts = (evaluations.flatMap(e => e.tags).filter(Boolean)).reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});
        const mostUsedTags = Object.entries(tagCounts).sort(([,a],[,b]) => b-a).slice(0, 5).map(([tag]) => tag);

        let totalPossiblePlayers = 0;
        const evaluatedPlayersInMatches = new Set(evaluations.map(e => e.evaluated_steam_id));
        detailedMatches.forEach(match => {
            if (match && match.players) {
                match.players.forEach(player => {
                    if (player.steam_id_64 && player.steam_id_64 !== userSteamId) {
                        totalPossiblePlayers++;
                    }
                });
            }
        });
        const evaluationPercentage = totalPossiblePlayers > 0 ? Math.round((evaluatedPlayersInMatches.size / totalPossiblePlayers) * 100) : 0;

        const totalReceivedEvaluations = receivedEvaluations.length;
        const receivedAverageRating = totalReceivedEvaluations > 0 ? parseFloat((receivedEvaluations.reduce((sum, e) => sum + parseFloat(e.rating), 0) / totalReceivedEvaluations).toFixed(2)) : 0;
        const selfAverageRating = selfEvaluations.length > 0 ? parseFloat((selfEvaluations.reduce((sum, e) => sum + parseFloat(e.rating), 0) / selfEvaluations.length).toFixed(2)) : 0;
        
        let winsLast20 = 0;
        let totalDuration = 0;
        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        const heroCounts = {};
        const opponentHeroCounts = {};
        
        detailedMatches.forEach(match => {
            if (match && match.players) {
                // Soma da duração e vitórias
                totalDuration += match.duration;
                if(match.user_won) winsLast20++;
                
                // Encontra os dados do jogador na partida
                const userPlayerInfo = match.players.find(p => p.steam_id_64 === userSteamId);
                
                if (userPlayerInfo) {
                    // Contagem do herói mais usado
                    heroCounts[userPlayerInfo.hero_id] = (heroCounts[userPlayerInfo.hero_id] || 0) + 1;
                    
                    // Soma do KDA
                    totalKills += userPlayerInfo.kills || 0;
                    totalDeaths += userPlayerInfo.deaths || 0;
                    totalAssists += userPlayerInfo.assists || 0;
                }

                // Contagem do herói mais enfrentado
                match.players.forEach(player => {
                    if (player.steam_id_64 !== userSteamId) {
                        opponentHeroCounts[player.hero_id] = (opponentHeroCounts[player.hero_id] || 0) + 1;
                    }
                });
            }
        });

        // Cálculos das médias (agora corretos)
        const matchCount = detailedMatches.length;
        const averageMatchTime = matchCount > 0 ? Math.round(totalDuration / matchCount) : 0;
        const mostUsedHeroId = Object.entries(heroCounts).sort(([,a],[,b]) => b-a)[0]?.[0];
        const mostFacedHeroId = Object.entries(opponentHeroCounts).sort(([,a],[,b]) => b-a)[0]?.[0];
        const averageKda = matchCount > 0 ? {
            kills: (totalKills / matchCount).toFixed(1),
            deaths: (totalDeaths / matchCount).toFixed(1),
            assists: (totalAssists / matchCount).toFixed(1)
        } : null;

        const stats = {
            steamUsername: user.steam_username,
            avatarUrl: user.avatar_url,
            accountCreatedAt: user.created_at,
            accountStatus: user.account_status || 'Free',
            totalEvaluations,
            averageRating,
            mostUsedTags,
            evaluationPercentage: Math.min(100, evaluationPercentage),
            winsLast20,
            averageMatchTime,
            mostUsedHeroId: mostUsedHeroId ? parseInt(mostUsedHeroId) : null,
            mostFacedHeroId: mostFacedHeroId ? parseInt(mostFacedHeroId) : null,
            selfAverageRating,
            totalReceivedEvaluations,
            receivedAverageRating,
            // NOVOS CAMPOS ADICIONADOS:
            remainingUpdates: Math.max(0, remainingUpdates),
            totalUpdates: totalUpdatesLimit,
            tiltWinRate,
            averageKda: averageKda
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error('Erro ao buscar estatísticas do usuário no cache:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};