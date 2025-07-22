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



exports.getEvaluationsByPlayerName = async (req, res) => {
    const authorId = req.user.id;
    const { playerName } = req.params;

    try {
        if (!playerName || playerName.trim().length === 0) {
            return res.status(400).json({ message: 'Nome do jogador é obrigatório.' });
        }

        // Buscar avaliações onde o nome atual (last_known_name) corresponde ao nome fornecido
        const query = `
            SELECT 
                e.id, e.rating, e.notes, e.match_id, e.created_at, 
                e.role, e.hero_id, e.tags, e.evaluated_steam_id,
                p.steam_id AS "targetSteamId",
                p.last_known_name AS "targetPlayerName"
            FROM evaluations e
            JOIN players p ON e.player_id = p.id
            WHERE e.author_id = $1 
            AND LOWER(p.last_known_name) = LOWER($2)
            ORDER BY e.created_at DESC;
        `;

        const { rows } = await db.query(query, [authorId, playerName.trim()]);

        // Adicionar metadados úteis
        const response = {
            playerName: playerName.trim(),
            evaluationsCount: rows.length,
            evaluations: rows
        };

        if (rows.length > 0) {
            // Calcular média das avaliações
            const totalRating = rows.reduce((sum, eval) => sum + parseFloat(eval.rating), 0);
            response.averageRating = parseFloat((totalRating / rows.length).toFixed(1));
            
            // Steam ID mais recente (caso haja múltiplas avaliações)
            response.steamId = rows[0].targetSteamId;
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Erro ao buscar avaliações por nome do jogador:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor.',
            error: error.message 
        });
    }
};


exports.exportEvaluations = async (req, res) => {
  const authorId = req.user.id;
  const { evaluationIds } = req.body; // Array de IDs das avaliações selecionadas

  try {
    let query;
    let queryParams;

    if (evaluationIds && evaluationIds.length > 0) {
      // Exportar avaliações específicas
      query = `
        SELECT 
          e.*,
          p.steam_id as target_steam_id,
          p.last_known_name as target_player_name
        FROM evaluations e
        LEFT JOIN players p ON e.player_id = p.id
        WHERE e.author_id = $1 AND e.id = ANY($2::int[])
        ORDER BY e.created_at DESC
      `;
      queryParams = [authorId, evaluationIds];
    } else {
      // Exportar todas as avaliações do usuário
      query = `
        SELECT 
          e.*,
          p.steam_id as target_steam_id,
          p.last_known_name as target_player_name
        FROM evaluations e
        LEFT JOIN players p ON e.player_id = p.id
        WHERE e.author_id = $1
        ORDER BY e.created_at DESC
      `;
      queryParams = [authorId];
    }

    const { rows } = await db.query(query, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nenhuma avaliação encontrada para exportar.' });
    }

    // Formato do arquivo de exportação
    const exportData = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      exported_by: req.user.username || req.user.email,
      total_evaluations: rows.length,
      evaluations: rows.map(evaluation => ({
        // Dados principais da avaliação
        target_steam_id: evaluation.target_steam_id,
        target_player_name: evaluation.target_player_name,
        rating: parseFloat(evaluation.rating),
        notes: evaluation.notes,
        tags: evaluation.tags || [],
        role: evaluation.role,
        hero_id: evaluation.hero_id,
        match_id: evaluation.match_id,
        created_at: evaluation.created_at,
        
        // Metadados para importação
        original_evaluation_id: evaluation.id,
        original_author: req.user.username || req.user.email
      }))
    };

    // Gerar código único para compartilhamento (opcional)
    const shareCode = require('crypto').randomBytes(8).toString('hex').toUpperCase();
    
    // Salvar temporariamente no banco para permitir importação via código
    const insertShareQuery = `
      INSERT INTO evaluation_shares (share_code, data, created_by, expires_at, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING share_code
    `;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expira em 30 dias
    
    await db.query(insertShareQuery, [
      shareCode,
      JSON.stringify(exportData),
      authorId,
      expiresAt
    ]);

    res.status(200).json({
      message: 'Avaliações exportadas com sucesso!',
      shareCode: shareCode,
      exportData: exportData
    });

  } catch (error) {
    console.error('Erro ao exportar avaliações:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// 2. Função para IMPORTAR avaliações
exports.importEvaluations = async (req, res) => {
  const authorId = req.user.id;
  const { importData, shareCode, mode = 'add' } = req.body;
  // mode: 'add' (adicionar), 'replace' (substituir), 'merge' (mesclar)

  try {
    let dataToImport;

    if (shareCode) {
      // Importar via código de compartilhamento
      const shareQuery = `
        SELECT data FROM evaluation_shares 
        WHERE share_code = $1 AND expires_at > NOW()
      `;
      const shareResult = await db.query(shareQuery, [shareCode.toUpperCase()]);
      
      if (shareResult.rows.length === 0) {
        return res.status(404).json({ message: 'Código de compartilhamento inválido ou expirado.' });
      }
      
      dataToImport = shareResult.rows[0].data;
    } else if (importData) {
      // Importar via dados diretos (arquivo JSON)
      dataToImport = importData;
    } else {
      return res.status(400).json({ message: 'É necessário fornecer dados para importar ou código de compartilhamento.' });
    }

    // Validar formato dos dados
    if (!dataToImport.evaluations || !Array.isArray(dataToImport.evaluations)) {
      return res.status(400).json({ message: 'Formato de dados inválido.' });
    }

    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      let importedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (const evaluation of dataToImport.evaluations) {
        try {
          // Verificar se o jogador já existe
          let playerId;
          
          if (evaluation.target_steam_id) {
            const playerQuery = `
              SELECT id FROM players WHERE steam_id = $1
            `;
            const playerResult = await client.query(playerQuery, [evaluation.target_steam_id]);
            
            if (playerResult.rows.length > 0) {
              playerId = playerResult.rows[0].id;
            } else {
              // Criar novo player
              const insertPlayerQuery = `
                INSERT INTO players (steam_id, last_known_name, created_at)
                VALUES ($1, $2, NOW())
                RETURNING id
              `;
              const newPlayerResult = await client.query(insertPlayerQuery, [
                evaluation.target_steam_id,
                evaluation.target_player_name || 'Jogador Importado'
              ]);
              playerId = newPlayerResult.rows[0].id;
            }
          } else {
            // Buscar por nome se não tiver Steam ID
            const playerQuery = `
              SELECT id FROM players WHERE last_known_name = $1 AND created_by = $2
            `;
            const playerResult = await client.query(playerQuery, [
              evaluation.target_player_name,
              authorId
            ]);
            
            if (playerResult.rows.length > 0) {
              playerId = playerResult.rows[0].id;
            } else {
              // Criar player sem Steam ID
              const insertPlayerQuery = `
                INSERT INTO players (last_known_name, created_by, created_at)
                VALUES ($1, $2, NOW())
                RETURNING id
              `;
              const newPlayerResult = await client.query(insertPlayerQuery, [
                evaluation.target_player_name || 'Jogador Importado',
                authorId
              ]);
              playerId = newPlayerResult.rows[0].id;
            }
          }

          // Verificar se já existe avaliação similar (para evitar duplicatas)
          if (mode !== 'replace') {
            const existingQuery = `
              SELECT id FROM evaluations 
              WHERE author_id = $1 AND player_id = $2 AND match_id = $3
            `;
            const existingResult = await client.query(existingQuery, [
              authorId,
              playerId,
              evaluation.match_id
            ]);

            if (existingResult.rows.length > 0 && mode === 'add') {
              skippedCount++;
              continue; // Pular duplicatas no modo 'add'
            }
          }

          // Inserir/atualizar avaliação
          const insertEvaluationQuery = `
            INSERT INTO evaluations (
              author_id, player_id, rating, notes, tags, role, 
              hero_id, match_id, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (author_id, player_id, match_id) 
            DO UPDATE SET
              rating = EXCLUDED.rating,
              notes = EXCLUDED.notes,
              tags = EXCLUDED.tags,
              role = EXCLUDED.role,
              hero_id = EXCLUDED.hero_id,
              updated_at = NOW()
          `;

          await client.query(insertEvaluationQuery, [
            authorId,
            playerId,
            evaluation.rating,
            evaluation.notes,
            evaluation.tags,
            evaluation.role,
            evaluation.hero_id,
            evaluation.match_id,
            evaluation.created_at || new Date()
          ]);

          importedCount++;

        } catch (evalError) {
          console.error('Erro ao importar avaliação individual:', evalError);
          errors.push(`Erro na avaliação ${evaluation.target_player_name}: ${evalError.message}`);
        }
      }

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Importação concluída com sucesso!',
        imported: importedCount,
        skipped: skippedCount,
        errors: errors,
        total_processed: dataToImport.evaluations.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao importar avaliações:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};