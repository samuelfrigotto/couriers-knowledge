// couriers-knowledge-backend/src/services/statusParser.service.js

class StatusParserService {
  /**
   * Parse do comando status do Dota 2
   * @param {string} statusOutput - Output completo do comando status
   * @returns {object} - Dados estruturados da partida
   */
  parseStatusCommand(statusOutput) {
    try {
      const lines = statusOutput.split('\n').map(line => line.trim());
      
      // Extrair informações básicas
      const gameState = this.extractGameState(lines);
      const userSteamId = this.extractUserSteamId(lines);
      const players = this.extractPlayers(lines);
      
      // Separar players em times (assumindo slots 0-4 = Radiant, 5-9 = Dire)
      const radiantPlayers = players.filter(p => p.slot >= 0 && p.slot <= 4);
      const direPlayers = players.filter(p => p.slot >= 5 && p.slot <= 9);
      
      return {
        success: true,
        gameState: gameState,
        userSteamId: userSteamId,
        totalPlayers: players.length,
        humanPlayers: players.filter(p => !p.isBot).length,
        botPlayers: players.filter(p => p.isBot).length,
        radiantPlayers: radiantPlayers,
        direPlayers: direPlayers,
        allPlayers: players,
        rawData: statusOutput
      };
      
    } catch (error) {
      console.error('Erro ao fazer parse do status:', error);
      return {
        success: false,
        error: 'Erro ao processar comando status',
        details: error.message
      };
    }
  }
  
  /**
   * Extrai o estado do jogo
   */
  extractGameState(lines) {
    const gameStateLine = lines.find(line => line.includes('GameState:'));
    if (gameStateLine) {
      const match = gameStateLine.match(/GameState:\s+(\S+)/);
      return match ? match[1] : 'UNKNOWN';
    }
    return 'UNKNOWN';
  }
  
  /**
   * Extrai o Steam ID do usuário
   */
  extractUserSteamId(lines) {
    const steamIdLine = lines.find(line => line.includes('steamid :'));
    if (steamIdLine) {
      // Formato: steamid : [A:1:1306018818:46450] (90271495084327938)
      const match = steamIdLine.match(/\((\d+)\)/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
  
  /**
   * Extrai lista de jogadores
   */
  extractPlayers(lines) {
    const players = [];
    let inPlayersSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Início da seção de players
      if (line.includes('---------players--------')) {
        inPlayersSection = true;
        continue;
      }
      
      // Fim da seção
      if (line.includes('#end') || line.includes('GameState:')) {
        break;
      }
      
      // Pular header da tabela
      if (line.includes('id time ping loss state rate name')) {
        continue;
      }
      
      // Processar linha de player - corrigido para aceitar linhas com [Client]
      if (inPlayersSection && line.length > 0) {
        const player = this.parsePlayerLine(line);
        if (player) {
          players.push(player);
        }
      }
    }
    
    console.log(`🔍 [DEBUG] Processadas ${lines.length} linhas, encontrados ${players.length} jogadores`);
    return players;
  }
  
  /**
   * Parse de uma linha individual de player
   */
  parsePlayerLine(line) {
    // Remover prefixo [Client] se existir
    const cleanLine = line.replace(/^\[Client\]\s*/, '');
    
    // Formato: "0 00:33 0 0 active 80000 'Kamikaze'"
    // Formato BOT: "1 BOT 0 0 active 0 'Mads'"
    
    const parts = cleanLine.split(/\s+/);
    if (parts.length < 6) return null;
    
    const slot = parseInt(parts[0]);
    const isBot = parts[1] === 'BOT';
    
    // O nome está sempre entre aspas simples no final
    const nameMatch = cleanLine.match(/'([^']+)'$/);
    if (!nameMatch) return null;
    
    const name = nameMatch[1];
    
    // Extrair outros dados dependendo se é bot ou não
    let time, ping, loss, state, rate;
    
    if (isBot) {
      time = 'BOT';
      ping = parseInt(parts[2]) || 0;
      loss = parseInt(parts[3]) || 0;
      state = parts[4] || 'unknown';
      rate = parseInt(parts[5]) || 0;
    } else {
      time = parts[1];
      ping = parseInt(parts[2]) || 0;
      loss = parseInt(parts[3]) || 0;
      state = parts[4] || 'unknown';
      rate = parseInt(parts[5]) || 0;
    }
    
    return {
      slot: slot,
      name: name,
      isBot: isBot,
      time: time,
      ping: ping,
      loss: loss,
      state: state,
      rate: rate,
      team: slot <= 4 ? 'radiant' : 'dire'
    };
  }
  
  /**
   * Traduz o estado do jogo para português
   */
  translateGameState(gameState) {
    const states = {
      'DOTA_GAMERULES_STATE_INIT': 'Inicializando',
      'DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD': 'Aguardando Jogadores',
      'DOTA_GAMERULES_STATE_HERO_SELECTION': 'Seleção de Heróis',
      'DOTA_GAMERULES_STATE_STRATEGY_TIME': 'Tempo de Estratégia',
      'DOTA_GAMERULES_STATE_PRE_GAME': 'Pré-Jogo',
      'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS': 'Partida em Andamento',
      'DOTA_GAMERULES_STATE_POST_GAME': 'Pós-Jogo',
      'DOTA_GAMERULES_STATE_DISCONNECT': 'Desconectado'
    };
    
    return states[gameState] || gameState;
  }
  
  /**
   * Valida se o input parece ser um comando status válido
   */
  validateStatusInput(input) {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Input vazio ou inválido' };
    }
    
    const requiredElements = [
      'Server:',
      'Client:',
      'Status',
      'players',
      'name'
    ];
    
    const hasRequired = requiredElements.every(element => 
      input.includes(element)
    );
    
    if (!hasRequired) {
      return { 
        valid: false, 
        error: 'Não parece ser um output do comando status do Dota 2' 
      };
    }
    
    return { valid: true };
  }
}

module.exports = new StatusParserService();