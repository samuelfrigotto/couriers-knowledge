// ===== NOVO ARQUIVO: backend/src/services/heroMapping.service.js =====

const path = require('path');
const fs = require('fs');

class HeroMappingService {
  constructor() {
    this.heroesData = null;
    this.nameToIdMap = null;
    this.loadHeroesData();
  }

  loadHeroesData() {
    try {
      // Carregar dados dos heróis (você pode usar o mesmo arquivo do frontend)
      const heroesPath = path.join(__dirname, '../data/heroes.json');
      
      // Se não existir o arquivo, criar o mapeamento manual dos heróis mais comuns
      if (!fs.existsSync(heroesPath)) {
        console.log('⚠️ Arquivo heroes.json não encontrado, usando mapeamento manual');
        this.createManualMapping();
        return;
      }

      const heroesJson = fs.readFileSync(heroesPath, 'utf8');
      this.heroesData = JSON.parse(heroesJson);
      this.createNameToIdMapping();
      
      console.log(`✅ Dados de ${Object.keys(this.heroesData).length} heróis carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar dados dos heróis:', error);
      this.createManualMapping();
    }
  }

  createNameToIdMapping() {
    this.nameToIdMap = new Map();
    
    Object.entries(this.heroesData).forEach(([id, hero]) => {
      const heroId = parseInt(id);
      
      // Mapear pelo nome interno (ex: "npc_dota_hero_antimage")
      this.nameToIdMap.set(hero.name?.toLowerCase(), heroId);
      
      // Mapear pelo nome localizado (ex: "Anti-Mage")
      this.nameToIdMap.set(hero.localized_name?.toLowerCase(), heroId);
      
      // Mapear variações comuns do nome
      if (hero.localized_name) {
        const variations = this.generateNameVariations(hero.localized_name);
        variations.forEach(variation => {
          this.nameToIdMap.set(variation.toLowerCase(), heroId);
        });
      }
    });
  }

  createManualMapping() {
    console.log('📝 Criando mapeamento manual de heróis...');
    
    // Mapeamento manual dos heróis mais comuns
    this.nameToIdMap = new Map([
      // Anti-Mage
      ['anti-mage', 1],
      ['antimage', 1],
      ['am', 1],
      
      // Axe
      ['axe', 2],
      
      // Bane
      ['bane', 3],
      
      // Bloodseeker
      ['bloodseeker', 4],
      ['bs', 4],
      
      // Crystal Maiden
      ['crystal maiden', 5],
      ['cm', 5],
      
      // Drow Ranger
      ['drow ranger', 6],
      ['drow', 6],
      
      // Earthshaker
      ['earthshaker', 7],
      ['es', 7],
      
      // Juggernaut
      ['juggernaut', 8],
      ['jugger', 8],
      ['jugg', 8],
      
      // Mirana
      ['mirana', 9],
      
      // Morphling
      ['morphling', 10],
      ['morph', 10],
      
      // Shadow Fiend
      ['shadow fiend', 11],
      ['sf', 11],
      
      // Phantom Lancer
      ['phantom lancer', 12],
      ['pl', 12],
      
      // Puck
      ['puck', 13],
      
      // Pudge
      ['pudge', 14],
      
      // Razor
      ['razor', 15],
      
      // Sand King
      ['sand king', 16],
      ['sk', 16],
      
      // Storm Spirit
      ['storm spirit', 17],
      ['storm', 17],
      
      // Sven
      ['sven', 18],
      
      // Tiny
      ['tiny', 19],
      
      // Vengeful Spirit
      ['vengeful spirit', 20],
      ['vs', 20],
      
      // Windranger
      ['windranger', 21],
      ['wr', 21],
      
      // Zeus
      ['zeus', 22],
      
      // Kunkka
      ['kunkka', 23],
      
      // Lina
      ['lina', 25],
      
      // Lion
      ['lion', 26],
      
      // Shadow Shaman
      ['shadow shaman', 27],
      ['ss', 27],
      
      // Slardar
      ['slardar', 28],
      
      // Tidehunter
      ['tidehunter', 29],
      ['tide', 29],
      
      // Witch Doctor
      ['witch doctor', 30],
      ['wd', 30],
      
      // Lich
      ['lich', 31],
      
      // Riki
      ['riki', 32],
      
      // Enigma
      ['enigma', 33],
      
      // Tinker
      ['tinker', 34],
      
      // Sniper
      ['sniper', 35],
      
      // Necrophos
      ['necrophos', 36],
      ['necro', 36],
      
      // Warlock
      ['warlock', 37],
      
      // Beastmaster
      ['beastmaster', 38],
      ['bm', 38],
      
      // Queen of Pain
      ['queen of pain', 39],
      ['qop', 39],
      
      // Venomancer
      ['venomancer', 40],
      ['veno', 40],
      
      // Faceless Void
      ['faceless void', 41],
      ['void', 41],
      ['fv', 41],
      
      // Wraith King
      ['wraith king', 42],
      ['wk', 42],
      
      // Death Prophet
      ['death prophet', 43],
      ['dp', 43],
      
      // Phantom Assassin
      ['phantom assassin', 44],
      ['pa', 44],
      
      // Pugna
      ['pugna', 45],
      
      // Templar Assassin
      ['templar assassin', 46],
      ['ta', 46],
      
      // Viper
      ['viper', 47],
      
      // Luna
      ['luna', 48],
      
      // Dragon Knight
      ['dragon knight', 49],
      ['dk', 49],
      
      // Dazzle
      ['dazzle', 50],
      
      // Clockwerk
      ['clockwerk', 51],
      ['clock', 51],
      
      // Leshrac
      ['leshrac', 52],
      
      // Nature\'s Prophet
      ['nature\'s prophet', 53],
      ['natures prophet', 53],
      ['np', 53],
      ['furion', 53],
      
      // Lifestealer
      ['lifestealer', 54],
      ['ls', 54],
      ['naix', 54],
      
      // Dark Seer
      ['dark seer', 55],
      ['ds', 55],
      
      // Clinkz
      ['clinkz', 56],
      
      // Omniknight
      ['omniknight', 57],
      ['omni', 57],
      
      // Enchantress
      ['enchantress', 58],
      
      // Huskar
      ['huskar', 59],
      
      // Night Stalker
      ['night stalker', 60],
      ['ns', 60],
      
      // Broodmother
      ['broodmother', 61],
      ['brood', 61],
      
      // Bounty Hunter
      ['bounty hunter', 62],
      ['bh', 62],
      
      // Weaver
      ['weaver', 63],
      
      // Jakiro
      ['jakiro', 64],
      
      // Batrider
      ['batrider', 65],
      ['bat', 65],
      
      // Chen
      ['chen', 66],
      
      // Spectre
      ['spectre', 67],
      ['spec', 67],
      
      // Ancient Apparition
      ['ancient apparition', 68],
      ['aa', 68],
      
      // Doom
      ['doom', 69],
      
      // Ursa
      ['ursa', 70],
      
      // Spirit Breaker
      ['spirit breaker', 71],
      ['sb', 71],
      
      // Gyrocopter
      ['gyrocopter', 72],
      ['gyro', 72],
      
      // Alchemist
      ['alchemist', 73],
      ['alch', 73],
      
      // Invoker
      ['invoker', 74],
      
      // Silencer
      ['silencer', 75],
      
      // Outworld Destroyer
      ['outworld destroyer', 76],
      ['od', 76],
      ['outworld devourer', 76],
      
      // Lycan
      ['lycan', 77],
      
      // Brewmaster
      ['brewmaster', 78],
      ['brew', 78],
      
      // Shadow Demon
      ['shadow demon', 79],
      ['sd', 79],
      
      // Lone Druid
      ['lone druid', 80],
      ['ld', 80],
      
      // Chaos Knight
      ['chaos knight', 81],
      ['ck', 81],
      
      // Meepo
      ['meepo', 82],
      
      // Treant Protector
      ['treant protector', 83],
      ['treant', 83],
      
      // Ogre Magi
      ['ogre magi', 84],
      ['ogre', 84],
      
      // Undying
      ['undying', 85],
      
      // Rubick
      ['rubick', 86],
      
      // Disruptor
      ['disruptor', 87],
      
      // Nyx Assassin
      ['nyx assassin', 88],
      ['nyx', 88],
      
      // Naga Siren
      ['naga siren', 89],
      ['naga', 89],
      
      // Keeper of the Light
      ['keeper of the light', 90],
      ['kotl', 90],
      ['keeper', 90],
      
      // Io
      ['io', 91],
      ['wisp', 91],
      
      // Visage
      ['visage', 92],
      
      // Slark
      ['slark', 93],
      
      // Medusa
      ['medusa', 94],
      ['dusa', 94],
      
      // Troll Warlord
      ['troll warlord', 95],
      ['troll', 95],
      
      // Centaur Warrunner
      ['centaur warrunner', 96],
      ['centaur', 96],
      
      // Magnus
      ['magnus', 97],
      ['mag', 97],
      
      // Timbersaw
      ['timbersaw', 98],
      ['timber', 98],
      
      // Bristleback
      ['bristleback', 99],
      ['bristle', 99],
      ['bb', 99],
      
      // Tusk
      ['tusk', 100],
      
      // Skywrath Mage
      ['skywrath mage', 101],
      ['sky', 101],
      ['skywrath', 101],
      
      // Abaddon
      ['abaddon', 102],
      
      // Elder Titan
      ['elder titan', 103],
      ['et', 103],
      
      // Legion Commander
      ['legion commander', 104],
      ['lc', 104],
      
      // Techies
      ['techies', 105],
      
      // Ember Spirit
      ['ember spirit', 106],
      ['ember', 106],
      
      // Earth Spirit
      ['earth spirit', 107],
      
      // Underlord
      ['underlord', 108],
      ['pitlord', 108],
      
      // Terrorblade
      ['terrorblade', 109],
      ['tb', 109],
      
      // Phoenix
      ['phoenix', 110],
      
      // Oracle
      ['oracle', 111],
      
      // Winter Wyvern
      ['winter wyvern', 112],
      ['ww', 112],
      
      // Arc Warden
      ['arc warden', 113],
      ['aw', 113],
      
      // Monkey King
      ['monkey king', 114],
      ['mk', 114],
      
      // Dark Willow
      ['dark willow', 119],
      ['willow', 119],
      
      // Pangolier
      ['pangolier', 120],
      ['pango', 120],
      
      // Grimstroke
      ['grimstroke', 121],
      ['grim', 121],
      
      // Hoodwink
      ['hoodwink', 123],
      
      // Void Spirit
      ['void spirit', 126],
      
      // Snapfire
      ['snapfire', 128],
      
      // Mars
      ['mars', 129],
      
      // Dawnbreaker
      ['dawnbreaker', 135],
      ['dawn', 135],
      
      // Marci
      ['marci', 136],
      
      // Primal Beast
      ['primal beast', 137],
      ['pb', 137],
      
      // Muerta
      ['muerta', 138]
    ]);
    
    console.log(`✅ Mapeamento manual criado com ${this.nameToIdMap.size} heróis`);
  }

  generateNameVariations(heroName) {
    const variations = [];
    
    // Remover caracteres especiais e espaços
    variations.push(heroName.replace(/[^a-zA-Z0-9]/g, ''));
    
    // Substituir espaços por underscores
    variations.push(heroName.replace(/\s+/g, '_'));
    
    // Substituir apóstrofes
    variations.push(heroName.replace(/'/g, ''));
    
    // Primeiro nome apenas
    const firstName = heroName.split(' ')[0];
    if (firstName !== heroName) {
      variations.push(firstName);
    }
    
    return variations;
  }

  /**
   * Converte nome de herói para ID
   * @param {string} heroName - Nome do herói (ex: "Anti-Mage", "Luna", etc.)
   * @returns {number|null} - ID do herói ou null se não encontrado
   */
  getHeroIdByName(heroName) {
    if (!heroName || typeof heroName !== 'string') {
      return null;
    }

    const cleanName = heroName.trim().toLowerCase();
    
    // Buscar no mapeamento
    const heroId = this.nameToIdMap.get(cleanName);
    
    if (heroId) {
      console.log(`✅ Herói encontrado: "${heroName}" -> ID ${heroId}`);
      return heroId;
    }

    // Busca fuzzy - tentar variações
    for (const [mappedName, id] of this.nameToIdMap.entries()) {
      if (mappedName.includes(cleanName) || cleanName.includes(mappedName)) {
        console.log(`🔍 Herói encontrado (fuzzy): "${heroName}" -> ID ${id}`);
        return id;
      }
    }

    console.log(`❌ Herói não encontrado: "${heroName}"`);
    return null;
  }

  /**
   * Converte hero_name para hero_id em um objeto de avaliação
   * @param {object} evaluation - Objeto da avaliação
   * @returns {object} - Avaliação com hero_id definido
   */
  processEvaluationHero(evaluation) {
    // Se já tem hero_id, manter
    if (evaluation.hero_id && typeof evaluation.hero_id === 'number') {
      return evaluation;
    }

    // Se tem hero_name, converter para hero_id
    if (evaluation.hero_name && typeof evaluation.hero_name === 'string') {
      const heroId = this.getHeroIdByName(evaluation.hero_name);
      if (heroId) {
        evaluation.hero_id = heroId;
      }
      // Remover hero_name após conversão
      delete evaluation.hero_name;
    }

    return evaluation;
  }
}

module.exports = new HeroMappingService();