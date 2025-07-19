// backend/src/controllers/evaluation.controller.js
const db = require('../config/database');
const steamService = require('../services/steam.service');

exports.createEvaluation = async (req, res) => {
    const authorId = req.user.id;
    const { targetSteamId, rating, notes, matchId, role, hero_id, tags } = req.body;

    // --- INÍCIO DA VALIDAÇÃO ---
    if (notes && notes.length > 200) {
        return res.status(400).json({ message: 'A anotação não pode exceder 200 caracteres.' });
    }
    if (tags) {
        if (tags.length > 5) {
            return res.status(400).json({ message: 'Você pode adicionar no máximo 5 tags.' });
        }
        for (const tag of tags) {
            if (tag.length > 25) {
                return res.status(400).json({ message: 'Cada tag não pode exceder 25 caracteres.' });
            }
        }
    }
    
    if (!targetSteamId) {
        return res.status(400).json({ message: 'targetSteamId is required.' });
    }

    try {
        // ✅ NOVA VERIFICAÇÃO: Limite de avaliações para usuários gratuitos
        // 1. Buscar o status da conta do usuário
        const userQuery = `SELECT account_status FROM users WHERE id = $1`;
        const { rows: userRows } = await db.query(userQuery, [authorId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const userAccountStatus = userRows[0].account_status || 'Free';

        // 2. Se for usuário gratuito, verificar limite de avaliações
        if (userAccountStatus === 'Free') {
            const countQuery = `SELECT COUNT(*) as total FROM evaluations WHERE author_id = $1`;
            const { rows: countRows } = await db.query(countQuery, [authorId]);
            const currentEvaluationCount = parseInt(countRows[0].total, 10);

            const EVALUATION_LIMIT = 21;

            if (currentEvaluationCount >= EVALUATION_LIMIT) {
                return res.status(403).json({ 
                    message: 'Limite de avaliações atingido',
                    details: `Usuários gratuitos podem criar no máximo ${EVALUATION_LIMIT} avaliações. Considere fazer upgrade para Premium.`,
                    currentCount: currentEvaluationCount,
                    limit: EVALUATION_LIMIT,
                    upgrade: true
                });
            }
        }

        // --- CONTINUA COM A LÓGICA ORIGINAL ---
        const playerSummaries = await steamService.getPlayerSummaries([targetSteamId]);
        const playerName = playerSummaries.length > 0 ? playerSummaries[0].personaname : 'Jogador Desconhecido';

        const playerQuery = `
            INSERT INTO players (steam_id, last_known_name) VALUES ($1, $2)
            ON CONFLICT (steam_id) DO UPDATE SET last_known_name = EXCLUDED.last_known_name
            RETURNING id;
        `;
        const { rows: playerRows } = await db.query(playerQuery, [targetSteamId, playerName]);
        const playerId = playerRows[0].id;

        const evaluationQuery = `
            INSERT INTO evaluations (author_id, player_id, rating, notes, match_id, role, hero_id, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *; 
        `;
        
        // Limpar e validar dados antes de inserir
        const cleanMatchId = (matchId && matchId !== '' && matchId !== 'null') ? matchId : null;
        const cleanRole = (role && role !== '' && role !== 'null') ? role : null;
        const cleanHeroId = (hero_id && hero_id !== '' && hero_id !== 'null') ? parseInt(hero_id, 10) : null;
        const cleanNotes = (notes && notes.trim() !== '') ? notes.trim() : null;
        const cleanTags = (tags && Array.isArray(tags) && tags.length > 0) ? tags : null;

        const values = [authorId, playerId, rating, cleanNotes, cleanMatchId, cleanRole, cleanHeroId, cleanTags];
        const { rows: evaluationRows } = await db.query(evaluationQuery, values);

        res.status(201).json(evaluationRows[0]);

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Conflict: An evaluation for this player in this match already exists.' });
        }
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// FUNÇÃO GET MY EVALUATIONS ATUALIZADA
exports.getMyEvaluations = async (req, res) => {
    const authorId = req.user.id;
    try {
        // Adicionando os novos campos ao SELECT
        const query = `
            SELECT
                e.id, e.rating, e.notes, e.match_id, e.created_at, e.role, e.hero_id, e.tags,
                p.steam_id AS "targetSteamId",
                p.last_known_name AS "targetPlayerName"
            FROM evaluations e
            JOIN players p ON e.player_id = p.id
            WHERE e.author_id = $1
            ORDER BY e.created_at DESC;
        `;
        const { rows } = await db.query(query, [authorId]);
        res.status(200).json(rows);
    } catch (error) {
        // ... (código de erro existente)
    }
};

// FUNÇÃO GET PLAYER EVALUATIONS ATUALIZADA
exports.getPlayerEvaluations = async (req, res) => {
    const { steamId } = req.params;
    try {
        // Adicionando os novos campos ao SELECT
        const query = `
            SELECT
                e.id, e.rating, e.notes, e.match_id, e.created_at, e.role, e.hero_id, e.tags,
                u.steam_username AS "authorName",
                u.avatar_url AS "authorAvatar"
            FROM evaluations e
            JOIN players p ON e.player_id = p.id
            JOIN users u ON e.author_id = u.id
            WHERE p.steam_id = $1
            ORDER BY e.created_at DESC;
        `;
        const { rows } = await db.query(query, [steamId]);
        res.status(200).json(rows);
    } catch (error) {
        // ... (código de erro existente)
    }
};

// FUNÇÃO UPDATE ATUALIZADA
exports.updateEvaluation = async (req, res) => {
    const evaluationId = req.params.id;
    const authorId = req.user.id;
    // Adicionando os novos campos do corpo da requisição
    const { rating, notes, role, hero_id, tags } = req.body;
    try {
        const query = `
            UPDATE evaluations
            SET rating = $1, notes = $2, role = $3, hero_id = $4, tags = $5, updated_at = NOW()
            WHERE id = $6 AND author_id = $7
            RETURNING *;
        `;
        const values = [rating, notes, role || null, hero_id || null, tags || null, evaluationId, authorId];
        const { rows, rowCount } = await db.query(query, values);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Evaluation not found or user not authorized to edit.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        // ... (código de erro existente)
    }
};


exports.deleteEvaluation = async (req, res) => {
    const evaluationId = req.params.id;
    const authorId = req.user.id;

    try {
        const query = `
            DELETE FROM evaluations
            WHERE id = $1 AND author_id = $2;
        `;
        const { rowCount } = await db.query(query, [evaluationId, authorId]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Evaluation not found or user not authorized to delete.' });
        }

        // Status 204 No Content é o padrão para um delete bem-sucedido.
        res.status(204).send();

    } catch (error) {
        console.error('Error deleting evaluation:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.getUniqueTags = async (req, res) => {
    const authorId = req.user.id;
    try {
        // A query usa UNNEST para transformar os arrays de tags em linhas e depois pega os valores distintos
        const query = `
            SELECT DISTINCT UNNEST(tags) AS tag 
            FROM evaluations 
            WHERE author_id = $1 AND tags IS NOT NULL
            ORDER BY tag;
        `;
        const { rows } = await db.query(query, [authorId]);
        // Mapeia o resultado para um array simples de strings
        res.status(200).json(rows.map(r => r.tag));
    } catch (error) {
        console.error('Erro ao buscar tags únicas:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};


exports.getSharedEvaluation = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT
        p.personaname as player_name,
        e.rating,
        e.notes,
        e.tags,
        e.hero_id
      FROM evaluations e
      JOIN players p ON e.player_id = p.steam_id
      WHERE e.id = $1;
    `;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Avaliação não encontrada.' });
    }

    // Retornamos apenas os dados seguros para compartilhamento
    res.status(200).json(rows[0]);

  } catch (error) {
    console.error('Erro ao buscar avaliação para compartilhamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


exports.getEvaluationStatus = async (req, res) => {
    const authorId = req.user.id;

    try {
        // Buscar informações do usuário e contagem de avaliações
        const userQuery = `SELECT account_status FROM users WHERE id = $1`;
        const countQuery = `SELECT COUNT(*) as total FROM evaluations WHERE author_id = $1`;

        const [userResult, countResult] = await Promise.all([
            db.query(userQuery, [authorId]),
            db.query(countQuery, [authorId])
        ]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const userAccountStatus = userResult.rows[0].account_status || 'Free';
        const currentCount = parseInt(countResult.rows[0].total, 10);
        
        const EVALUATION_LIMIT = 200;
        const isPremium = userAccountStatus === 'Premium';
        const limitReached = !isPremium && currentCount >= EVALUATION_LIMIT;

        res.status(200).json({
            accountStatus: userAccountStatus,
            currentCount,
            limit: isPremium ? null : EVALUATION_LIMIT,
            limitReached,
            isPremium,
            canCreateNew: !limitReached
        });

    } catch (error) {
        console.error('Erro ao buscar status de avaliações:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
