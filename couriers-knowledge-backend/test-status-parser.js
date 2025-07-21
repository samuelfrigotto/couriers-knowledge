// couriers-knowledge-backend/test-status-parser.js
// Script para testar o sistema de parse do comando status

const statusParserService = require('./src/services/statusParser.service');

// Exemplo de output do comando status do Dota 2
const exampleStatusOutput = `status Server: Running [172.17.160.1:27015] Client: Connected [127.0.0.1:27015] [last packet 0.009 sec ago] 
[EngineServiceManager] ----- Status ----- 
[EngineServiceManager] @ Current : game 
[Client] source : slot 0 
[Client] version : 48/48 10436 insecure public 
[Client] steamid : [A:1:1306018818:46450] (90271495084327938) 
[Client] players : 10 humans, 0 bots (0 max) (not hibernating) (unreserved) 
[Client] ---------spawngroups---- 
[Client] loaded spawngroup( 1) : SV: [1: start | main lump | mapload] 
[Client] loading spawngroup( 2) : SV: [2: dota | main lump | mapload] 
[Client] loading spawngroup( 3) : SV: [3: prefabs/promotional_radiant_fountain | main lump | mapload | point_prefab] 
[Client] loading spawngroup( 4) : SV: [4: prefabs/promotional_dire_fountain | main lump | mapload | point_prefab] 
[Client] ---------players-------- 
[Client] id time ping loss state rate name 
[Client] 0 00:33 45 0 active 80000 'Kamikaze'
[Client] 1 01:12 23 0 active 80000 'InvokerMaster2024'
[Client] 2 00:45 67 0 active 80000 'SupportLife'
[Client] 3 02:15 34 0 active 80000 'CarryMain'
[Client] 4 01:33 89 0 active 80000 'MidLaner_Pro'
[Client] 5 00:55 56 0 active 80000 'TankOficial'
[Client] 6 01:44 12 0 active 80000 'JungleKing'
[Client] 7 00:28 78 0 active 80000 'WardMaster'
[Client] 8 02:01 45 0 active 80000 'PushStrat'
[Client] 9 01:19 33 0 active 80000 'LastPick_Guy'
[Client] GameState: DOTA_GAMERULES_STATE_GAME_IN_PROGRESS Times: Transition=60.03 Current=38.03 
[Client] #end
`;

console.log('🧪 TESTE DO PARSER DE STATUS DO DOTA 2');
console.log('=====================================\n');

// 1. Teste de validação
console.log('1️⃣ Testando validação...');
const validation = statusParserService.validateStatusInput(exampleStatusOutput);
console.log('✅ Validação:', validation);

// 2. Teste de parse
console.log('\n2️⃣ Testando parse...');
const parsedData = statusParserService.parseStatusCommand(exampleStatusOutput);

if (parsedData.success) {
  console.log('✅ Parse bem-sucedido!');
  console.log('\n📊 RESUMO:');
  console.log(`- Estado do jogo: ${parsedData.gameState} (${statusParserService.translateGameState(parsedData.gameState)})`);
  console.log(`- Steam ID do usuário: ${parsedData.userSteamId}`);
  console.log(`- Total de jogadores: ${parsedData.totalPlayers}`);
  console.log(`- Jogadores humanos: ${parsedData.humanPlayers}`);
  console.log(`- Bots: ${parsedData.botPlayers}`);
  
  console.log('\n👥 JOGADORES ENCONTRADOS:');
  console.log('\n🌟 RADIANT (Slots 0-4):');
  parsedData.radiantPlayers.forEach(player => {
    console.log(`  Slot ${player.slot}: ${player.name} (${player.ping}ms, ${player.state})`);
  });
  
  console.log('\n🌙 DIRE (Slots 5-9):');
  parsedData.direPlayers.forEach(player => {
    console.log(`  Slot ${player.slot}: ${player.name} (${player.ping}ms, ${player.state})`);
  });
  
  // 3. Teste com nomes únicos
  console.log('\n3️⃣ Nomes únicos para busca de avaliações:');
  const humanPlayerNames = parsedData.allPlayers
    .filter(p => !p.isBot)
    .map(p => p.name);
  console.log('📋 Nomes para buscar:', humanPlayerNames);
  
} else {
  console.log('❌ Erro no parse:', parsedData.error);
}

// 4. Teste com status com bots
console.log('\n4️⃣ Testando com status que contém bots...');

const statusWithBots = `status Server: Running [172.17.160.1:27015] Client: Connected [127.0.0.1:27015] [last packet 0.008 sec ago] 
[EngineServiceManager] ----- Status ----- 
[EngineServiceManager] @ Current : game 
[Client] source : slot 0 
[Client] version : 48/48 10436 insecure public 
[Client] steamid : [A:1:1306018818:46450] (90271495084327938) 
[Client] players : 3 humans, 7 bots (0 max) (not hibernating) (unreserved) 
[Client] ---------players-------- 
[Client] id time ping loss state rate name 
[Client] 0 00:33 0 0 active 80000 'Kamikaze'
[Client] 1 01:12 34 0 active 80000 'PlayerReal'
[Client] 2 BOT 0 0 active 0 'Mads'
[Client] 3 BOT 0 0 active 0 'Mete'
[Client] 4 BOT 0 0 active 0 'Alondra'
[Client] 5 00:55 67 0 active 80000 'OutroJogador'
[Client] 6 BOT 0 0 active 0 'Jarle'
[Client] 7 BOT 0 0 active 0 'Pontus'
[Client] 8 BOT 0 0 active 0 'Adriana'
[Client] 9 BOT 0 0 active 0 'Elias'
[Client] GameState: DOTA_GAMERULES_STATE_STRATEGY_TIME Times: Transition=60.03 Current=38.03 
[Client] #end
`;

const parsedWithBots = statusParserService.parseStatusCommand(statusWithBots);
if (parsedWithBots.success) {
  console.log('✅ Parse com bots bem-sucedido!');
  console.log(`📊 Humanos: ${parsedWithBots.humanPlayers}, Bots: ${parsedWithBots.botPlayers}`);
  
  const humanNames = parsedWithBots.allPlayers
    .filter(p => !p.isBot)
    .map(p => p.name);
  console.log('👤 Apenas jogadores humanos:', humanNames);
} else {
  console.log('❌ Erro no parse com bots:', parsedWithBots.error);
}

console.log('\n🎉 TESTE CONCLUÍDO!');
console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('1. Rodar o backend: npm start');
console.log('2. Testar o endpoint: POST /api/status/parse');
console.log('3. Integrar no frontend');
console.log('4. Testar com dados reais do Dota 2');